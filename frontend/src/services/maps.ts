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
    estimatedArrivals?: string[]; // "HH:mm" for each optimized stop
    returnsToBase?: number[]; // indices of stops after which a return to base is suggested
} | { success: false; error: string };

type DestInfo = {
    address: string;
    opening_hours?: string | null;
}

/**
 * Optimizes a list of addresses considering Time Windows, Distance, and returning to Warehouse for long gaps.
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

        const windows = destObjects.map(d => parseWindow(d.opening_hours));
        const SERVICE_TIME_SEC = 10 * 60; 
        const START_TIME_SEC = 7 * 3600; 
        const GAP_THRESHOLD_SEC = 90 * 60; // 1.5 horas

        // Helper: Calculate transition including "Return to Warehouse" logic
        function getTransition(fromIdxMatrix: number, toIdxDest: number, currentTime: number) {
            const transitDirect = durMatrix[fromIdxMatrix][toIdxDest + 1];
            const distDirect = distMatrix[fromIdxMatrix][toIdxDest + 1];
            const arrivalDirect = currentTime + transitDirect;
            const window = windows[toIdxDest];

            if (window.start - arrivalDirect > GAP_THRESHOLD_SEC) {
                // Gap detected -> GO BACK TO WAREHOUSE (index 0)
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

        let bestSeq: number[] = [];
        let minScore = Infinity;
        let bestMetrics = { dist: 0, dur: 0, wait: 0 };

        function search(currentIdx: number, remaining: number[], currentPath: number[], currentDist: number, currentTimeSec: number, totalWaitSec: number, totalLateSec: number) {
            if (remaining.length === 0) {
                const score = currentDist + (totalLateSec * 100); 
                if (score < minScore) {
                    minScore = score;
                    bestSeq = [...currentPath];
                    bestMetrics = { dist: currentDist, dur: (currentTimeSec - START_TIME_SEC) / 60, wait: totalWaitSec / 60 };
                }
                return;
            }
            if (currentDist > minScore) return;

            for (let i = 0; i < remaining.length; i++) {
                const next = remaining[i];
                const { dur, dist } = getTransition(currentIdx, next, currentTimeSec);
                let arrival = currentTimeSec + dur;
                let wait = Math.max(0, windows[next].start - arrival);
                let late = Math.max(0, arrival - windows[next].end);
                if (late > 7200) continue;

                search(
                    next + 1,
                    [...remaining.slice(0, i), ...remaining.slice(i + 1)],
                    [...currentPath, next],
                    currentDist + dist,
                    Math.max(arrival, windows[next].start) + SERVICE_TIME_SEC,
                    totalWaitSec + wait,
                    totalLateSec + late
                );
            }
        }

        const destIndices = Array.from({ length: destObjects.length }, (_, i) => i);
        
        // 1. Greedy Baseline with Return Logic
        let baselineScore = 0;
        let baselinePath: number[] = [];
        let time = START_TIME_SEC;
        let curr = 0;
        let tempRem = [...destIndices];
        while (tempRem.length > 0) {
            let bestNextI = 0;
            let bestS = Infinity;
            for (let i = 0; i < tempRem.length; i++) {
                const next = tempRem[i];
                const { dur, dist } = getTransition(curr, next, time);
                const score = dist + (Math.max(0, (time + dur) - windows[next].end) * 100);
                if (score < bestS) { bestS = score; bestNextI = i; }
            }
            const picked = tempRem[bestNextI];
            baselinePath.push(picked);
            const { dur, dist } = getTransition(curr, picked, time);
            baselineScore += dist;
            time = Math.max(time + dur, windows[picked].start) + SERVICE_TIME_SEC;
            curr = picked + 1;
            tempRem.splice(bestNextI, 1);
        }
        bestSeq = baselinePath;
        minScore = baselineScore;
        bestMetrics = { dist: baselineScore, dur: (time - START_TIME_SEC) / 60, wait: 0 /* approx */ };

        if (destIndices.length <= 10) search(0, destIndices, [], 0, START_TIME_SEC, 0, 0);

        // 2. Final Construction with Return Markers
        const estimatedArrivals: string[] = [];
        const returnsToBase: number[] = [];
        let finalTime = START_TIME_SEC;
        let finalIdx = 0;
        for (let i = 0; i < bestSeq.length; i++) {
            const stopIdx = bestSeq[i];
            const { dur, returned } = getTransition(finalIdx, stopIdx, finalTime);
            if (returned) returnsToBase.push(i);
            const arrival = finalTime + dur;
            estimatedArrivals.push(formatTime(arrival));
            finalTime = Math.max(arrival, windows[stopIdx].start) + SERVICE_TIME_SEC;
            finalIdx = stopIdx + 1;
        }

        return { 
            success: true, 
            optimizedIndices: bestSeq,
            estimatedArrivals,
            returnsToBase,
            metrics: {
                totalDistanceMeters: Math.round(minScore),
                estimatedTotalMinutes: Math.round(bestMetrics.dur),
                lateWaitMinutes: Math.round(bestMetrics.wait)
            }
        };
    } catch (err: any) { return { success: false, error: err.message }; }
}

function parseTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    return (h * 3600) + (m * 60);
}

function formatTime(s: number) {
    const h = Math.floor(s / 3600) % 24;
    const m = Math.floor((s % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function parseWindow(w: string | null | undefined) {
    if (!w || !w.includes('-')) return { start: 0, end: 86400 };
    const [s, e] = w.split('-');
    return { start: parseTime(s), end: parseTime(e) };
}
