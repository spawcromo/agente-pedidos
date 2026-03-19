'use server'

import { WAREHOUSE_ADDRESS } from '@/lib/constants'

export type OptimizeResult = { 
    success: true; 
    optimizedIndices: number[];
    metrics?: {
        totalDistanceMeters: number;
        estimatedTotalMinutes: number;
        lateWaitMinutes: number;
    }
} | { success: false; error: string };

type DestInfo = {
    address: string;
    opening_hours?: string | null;
}

/**
 * Optimizes a list of addresses considering Time Windows and Distance.
 */
export async function optimizeRoute(origin: string, destinations: (string | DestInfo)[]): Promise<OptimizeResult> {
    const destObjects: DestInfo[] = destinations.map(d => 
        typeof d === 'string' ? { address: d } : d
    );

    console.log(`[OptimizeAPI] Optimizing ${destObjects.length} destinations with Time Windows`);
    
    if (destObjects.length === 0) return { success: true, optimizedIndices: [] };
    if (destObjects.length === 1) return { success: true, optimizedIndices: [0] };

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return { success: false, error: 'Google Maps API Key no configurada' };

    const sanitize = (addr: string) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const safeOrigin = sanitize(origin);
    const safeDests = destObjects.map(d => sanitize(d.address));
    
    try {
        const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
        const allPoints = [safeOrigin, ...safeDests];
        
        const body = {
            origins: allPoints.map(addr => ({ waypoint: { address: addr } })),
            destinations: allPoints.map(addr => ({ waypoint: { address: addr } })), // All-to-all for TSP
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE_OPTIMAL" // Better durations
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,staticDuration'
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        const matrixData = await res.json();
        if (matrixData.error || (Array.isArray(matrixData) && matrixData[0]?.error)) {
            return { success: false, error: 'Error en Google Routes API' };
        }

        // Build cost matrices [from][to]
        const n = allPoints.length;
        const distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
        const durMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
        
        matrixData.forEach((item: any) => {
            distMatrix[item.originIndex][item.destinationIndex] = item.distanceMeters || 0;
            // staticDuration is like "300s". Usually it's a string in this API.
            const dur = item.staticDuration?.replace('s', '') || 0;
            durMatrix[item.originIndex][item.destinationIndex] = parseInt(dur) || 0;
        });

        // Time window parsing
        const windows = destObjects.map(d => parseWindow(d.opening_hours));
        const SERVICE_TIME_SEC = 10 * 60; // 10 mins per stop
        const START_TIME_SEC = 7 * 3600; // Route starts at 07:00 AM

        let bestSeq: number[] = [];
        let minScore = Infinity;
        let bestMetrics = { dist: 0, dur: 0, wait: 0 };

        /**
         * Recursive TSP with Time Windows
         * Score = Distance + Heavy Penalty for lateness
         */
        function search(currentIdx: number, remaining: number[], currentPath: number[], currentDist: number, currentTimeSec: number, totalWaitSec: number, totalLateSec: number) {
            if (remaining.length === 0) {
                // Return to warehouse? No, user wants warehouse -> end.
                // Final Score
                const score = currentDist + (totalLateSec * 100); // 100m penalty per second late
                if (score < minScore) {
                    minScore = score;
                    bestSeq = [...currentPath];
                    bestMetrics = { dist: currentDist, dur: (currentTimeSec - START_TIME_SEC) / 60, wait: totalWaitSec / 60 };
                }
                return;
            }

            // Pruning
            if (currentDist > minScore) return;

            for (let i = 0; i < remaining.length; i++) {
                const next = remaining[i];
                const nextRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
                
                const transitSec = durMatrix[currentIdx][next + 1];
                let arrivalTime = currentTimeSec + transitSec;
                
                let waitSec = 0;
                let lateSec = 0;
                
                const window = windows[next];
                if (arrivalTime < window.start) {
                    waitSec = window.start - arrivalTime;
                    arrivalTime = window.start;
                } else if (arrivalTime > window.end) {
                    lateSec = arrivalTime - window.end;
                }

                // If we are more than 2 hours late, we probably shouldn't even consider this branch
                if (lateSec > 7200) continue;

                search(
                    next + 1,
                    nextRemaining,
                    [...currentPath, next],
                    currentDist + distMatrix[currentIdx][next + 1],
                    arrivalTime + SERVICE_TIME_SEC,
                    totalWaitSec + waitSec,
                    totalLateSec + lateSec
                );
            }
        }

        const destIndices = Array.from({ length: destObjects.length }, (_, i) => i);
        
        // 1. Baseline Greedy (Nearest Neighbor with Time Windows)
        // Helps prune the exhaustive search much faster
        let baselineScore = 0;
        let baselineWaitSec = 0;
        let baselinePath: number[] = [];
        let time = START_TIME_SEC;
        let curr = 0;
        let tempRemaining = [...destIndices];
        
        while (tempRemaining.length > 0) {
            let bestNextIdxInTemp = 0;
            let bestNextScore = Infinity;
            
            for (let i = 0; i < tempRemaining.length; i++) {
                const next = tempRemaining[i];
                const d = distMatrix[curr][next + 1];
                const dur = durMatrix[curr][next + 1];
                const arrival = time + dur;
                const window = windows[next];
                const late = Math.max(0, arrival - window.end);
                const score = d + (late * 100);
                
                if (score < bestNextScore) {
                    bestNextScore = score;
                    bestNextIdxInTemp = i;
                }
            }
            
            const picked = tempRemaining[bestNextIdxInTemp];
            baselinePath.push(picked);
            baselineScore += bestNextScore;
            const transit = durMatrix[curr][picked + 1];
            const arrival = time + transit;
            const wait = Math.max(0, windows[picked].start - arrival);
            baselineWaitSec += wait;
            time = Math.max(arrival, windows[picked].start) + SERVICE_TIME_SEC;
            curr = picked + 1;
            tempRemaining.splice(bestNextIdxInTemp, 1);
        }
        
        bestSeq = baselinePath;
        minScore = baselineScore;
        bestMetrics = { dist: 0, dur: (time - START_TIME_SEC) / 60, wait: baselineWaitSec / 60 };

        // 2. Exhaustive Search for small routes (N <= 10)
        if (destIndices.length <= 10) {
            search(0, destIndices, [], 0, START_TIME_SEC, 0, 0);
        }

        return { 
            success: true, 
            optimizedIndices: bestSeq,
            metrics: {
                totalDistanceMeters: Math.round(minScore),
                estimatedTotalMinutes: Math.round(bestMetrics.dur),
                lateWaitMinutes: Math.round(bestMetrics.wait)
            }
        };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

function parseTime(timeStr: string) {
    const [h, m] = timeStr.trim().split(':').map(Number);
    return (h * 3600) + (m * 60);
}

function parseWindow(windowStr: string | null | undefined) {
    if (!windowStr || !windowStr.includes('-')) return { start: 0, end: 86400 }; // 00:00 - 24:00
    const [startS, endS] = windowStr.split('-');
    try {
        return { start: parseTime(startS), end: parseTime(endS) };
    } catch {
        return { start: 0, end: 86400 };
    }
}
