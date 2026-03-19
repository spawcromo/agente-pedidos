'use server'

import { WAREHOUSE_ADDRESS } from '@/lib/constants'

export type OptimizeResult = { 
    success: true; 
    optimizedIndices: number[];
    metrics?: {
        totalDistanceMeters: number;
        estimatedTotalMinutes: number;
        lateWaitMinutes: number;
    };
    estimatedArrivals?: string[];
    returnsToBase?: number[];
} | { success: false; error: string };

type DestInfo = {
    address: string;
    opening_hours?: string | null;
}

/**
 * Optimizes a list of addresses considering Time Windows, Distance, and multi-trip gaps.
 * Uses a dynamic starting time based on the earliest order.
 */
export async function optimizeRoute(origin: string, destinations: (string | DestInfo)[]): Promise<OptimizeResult> {
    const destObjects: DestInfo[] = destinations.map(d => 
        typeof d === 'string' ? { address: d } : d
    );

    if (destObjects.length === 0) return { success: true, optimizedIndices: [] };
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return { success: false, error: 'Google Maps API Key no configurada' };

    const sanitize = (addr: string) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const safeOrigin = sanitize(origin);
    const safeDests = destObjects.map(d => sanitize(d.address));
    
    try {
        const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
        const allPoints = [safeOrigin, ...safeDests];
        
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,staticDuration'
            },
            body: JSON.stringify({
                origins: allPoints.map(addr => ({ waypoint: { address: addr } })),
                destinations: allPoints.map(addr => ({ waypoint: { address: addr } })),
                travelMode: "DRIVE"
            }),
            cache: 'no-store'
        });

        const matrixData = await res.json();
        const n = allPoints.length;
        const distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
        const durMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
        
        matrixData.forEach((item: any) => {
            distMatrix[item.originIndex][item.destinationIndex] = item.distanceMeters || 0;
            const dur = item.staticDuration?.replace('s', '') || 0;
            durMatrix[item.originIndex][item.destinationIndex] = parseInt(dur) || 0;
        });

        const SERVICE_TIME_SEC = 10 * 60; 
        const GAP_THRESHOLD_SEC = 90 * 60; 
        const windows = destObjects.map(d => parseWindow(d.opening_hours));
        
        // --- DYNAMIC START TIME ---
        const earliestOrderStart = Math.min(...windows.map(w => w.start));
        const START_TIME_SEC = earliestOrderStart;

        function getTransition(fromIdxMatrix: number, toIdxDest: number, currentTime: number) {
            const transitDirect = durMatrix[fromIdxMatrix][toIdxDest + 1];
            const distDirect = distMatrix[fromIdxMatrix][toIdxDest + 1];
            const arrivalDirect = currentTime + transitDirect;
            const window = windows[toIdxDest];

            if (window.start - arrivalDirect > GAP_THRESHOLD_SEC) {
                const toWSec = durMatrix[fromIdxMatrix][0];
                const fromWSec = durMatrix[0][toIdxDest + 1];
                const toWDist = distMatrix[fromIdxMatrix][0];
                const fromWDist = distMatrix[0][toIdxDest + 1];
                return { 
                    dur: toWSec + fromWSec, 
                    dist: toWDist + fromWDist, 
                    returned: true 
                };
            }
            return { dur: transitDirect, dist: distDirect, returned: false };
        }

        const getStopScore = (toIdxDest: number, fromIdxMatrix: number, time: number) => {
            const { dur, dist } = getTransition(fromIdxMatrix, toIdxDest, time);
            const arrival = time + dur;
            const window = windows[toIdxDest];
            const wait = Math.max(0, window.start - arrival);
            const late = Math.max(0, arrival - window.end);
            
            // Score = Distance + Lateness Penalty (Huge) + Wait Penalty (Moderate)
            const score = dist + (late * 2000) + (wait * 0.5);
            return { score, arrival, waitTime: wait, lateTime: late };
        };

        const destIndices = Array.from({ length: destObjects.length }, (_, i) => i);
        let bestSeq: number[] = [];
        let finalWaitSec = 0;
        let finalLateSec = 0;

        const MAX_EXHAUSTIVE_STOPS = 10; 

        if (destIndices.length > MAX_EXHAUSTIVE_STOPS) {
            // Greedy approach
            let currentIdxMatrix = 0;
            let currentTime = START_TIME_SEC;
            const remaining = [...destIndices];
            
            while (remaining.length > 0) {
                let bestNextIdxInRemaining = -1;
                let bestNextScore = Infinity;
                let bestArrivalTime = currentTime;
                let bestWait = 0;
                let bestLate = 0;

                for (let i = 0; i < remaining.length; i++) {
                    const { score, arrival, waitTime, lateTime } = getStopScore(remaining[i], currentIdxMatrix, currentTime);
                    if (score < bestNextScore) {
                        bestNextScore = score;
                        bestNextIdxInRemaining = i;
                        bestArrivalTime = arrival;
                        bestWait = waitTime;
                        bestLate = lateTime;
                    }
                }

                const pickedDestIdx = remaining.splice(bestNextIdxInRemaining, 1)[0];
                bestSeq.push(pickedDestIdx);
                finalWaitSec += bestWait;
                finalLateSec += bestLate;
                
                currentTime = Math.max(bestArrivalTime, windows[pickedDestIdx].start) + SERVICE_TIME_SEC;
                currentIdxMatrix = pickedDestIdx + 1;
            }
        } else {
            // Exhaustive for small sets
            let minTotalScore = Infinity;

            const solveRecursive = (
                currentIdxMatrix: number,
                remaining: number[],
                currentPath: number[],
                currentTime: number,
                pathScore: number,
                totalWaitSec: number,
                totalLateSec: number
            ) => {
                if (remaining.length === 0) {
                    if (pathScore < minTotalScore) {
                        minTotalScore = pathScore;
                        bestSeq = [...currentPath];
                        finalWaitSec = totalWaitSec;
                        finalLateSec = totalLateSec;
                    }
                    return;
                }
                if (pathScore >= minTotalScore) return;

                for (let i = 0; i < remaining.length; i++) {
                    const nextDestIdx = remaining[i];
                    const { score, arrival, waitTime, lateTime } = getStopScore(nextDestIdx, currentIdxMatrix, currentTime);

                    solveRecursive(
                        nextDestIdx + 1,
                        [...remaining.slice(0, i), ...remaining.slice(i + 1)],
                        [...currentPath, nextDestIdx],
                        Math.max(arrival, windows[nextDestIdx].start) + SERVICE_TIME_SEC,
                        pathScore + score,
                        totalWaitSec + waitTime,
                        totalLateSec + lateTime
                    );
                }
            };

            solveRecursive(0, destIndices, [], START_TIME_SEC, 0, 0, 0);
        }

        // --- FINAL RESULTS CONSTRUCTION ---
        const estimatedArrivals: string[] = [];
        const returnsToBase: number[] = [];
        let finalTime = START_TIME_SEC;
        let finalIdx = 0;
        let totalDistance = 0;

        for (let i = 0; i < bestSeq.length; i++) {
            const stopIdx = bestSeq[i];
            const { dur, dist, returned } = getTransition(finalIdx, stopIdx, finalTime);
            if (returned) returnsToBase.push(i);
            
            const arrival = finalTime + dur;
            estimatedArrivals.push(formatTime(arrival));
            
            finalTime = Math.max(arrival, windows[stopIdx].start) + SERVICE_TIME_SEC;
            finalIdx = stopIdx + 1;
            totalDistance += dist;
        }

        return { 
            success: true, 
            optimizedIndices: bestSeq,
            estimatedArrivals,
            returnsToBase,
            metrics: {
                totalDistanceMeters: Math.round(totalDistance),
                estimatedTotalMinutes: Math.round((finalTime - START_TIME_SEC) / 60),
                lateWaitMinutes: Math.round((finalWaitSec + finalLateSec) / 60)
            }
        };
    } catch (err: any) { return { success: false, error: err.message }; }
}

function parseTime(t: string) {
    if (!t || !t.includes(':')) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h * 3600) + (m * 60);
}

function formatTime(s: number) {
    const h = (Math.floor(s / 3600)) % 24;
    const m = Math.floor((s % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function parseWindow(w: string | null | undefined) {
    if (!w || !w.includes('-')) return { start: 0, end: 86400 };
    const parts = w.split('-');
    return { start: parseTime(parts[0]), end: parseTime(parts[1]) };
}
