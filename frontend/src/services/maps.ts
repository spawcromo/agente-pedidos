'use server'

import { WAREHOUSE_ADDRESS } from '@/lib/constants'

export type OptimizeResult = { success: true; optimizedIndices: number[] } | { success: false; error: string };

/**
 * Optimizes a list of addresses using Google's modern Routes API (ComputeRoutes).
 * This is the ultimate industry standard for TSP and route mapping.
 */
export async function optimizeRoute(origin: string, destinations: string[]): Promise<OptimizeResult> {
    console.log(`[RoutesAPI] Optimizing ${destinations.length} destinations from ${origin}`);
    
    if (destinations.length === 0) return { success: true, optimizedIndices: [] };
    if (destinations.length === 1) return { success: true, optimizedIndices: [0] };

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return { success: false, error: 'Google Maps API Key no configurada en el servidor' };

    const sanitize = (addr: string) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const safeOrigin = sanitize(origin);
    const safeDests = destinations.map(sanitize);
    
    try {
        const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
        
        // We fetching the matrix of all-to-all points to solve the TSP ourselves.
        // This avoids Google's weird traffic-aware zig-zags.
        const allPoints = [safeOrigin, ...safeDests];
        
        const body = {
            origins: allPoints.map(addr => ({ waypoint: { address: addr } })),
            destinations: safeDests.map(addr => ({ waypoint: { address: addr } })),
            travelMode: "DRIVE",
            routingPreference: "ROUTING_PREFERENCE_UNSPECIFIED" // Prioritize geometry over traffic hacks
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters'
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        const matrixData = await res.json();
        
        if (matrixData.error || (Array.isArray(matrixData) && matrixData[0]?.error)) {
            const msg = matrixData.error?.message || matrixData[0]?.error?.message || 'Error en Matrix API';
            return { success: false, error: `Error de Google Maps: ${msg}` };
        }

        // Build a cost matrix: dist[from][to]
        // from: 0 (Origin), 1..N (Destinations)
        // to: 0..N-1 (Destinations)
        const numDests = safeDests.length;
        const distMatrix: number[][] = Array.from({ length: numDests + 1 }, () => Array(numDests).fill(Infinity));
        
        matrixData.forEach((item: any) => {
            if (item.originIndex !== undefined && item.destinationIndex !== undefined) {
                distMatrix[item.originIndex][item.destinationIndex] = item.distanceMeters || 0;
            }
        });

        // Solve Open TSP (Exhaustive search for small N)
        // Since N <= 15 (usual route size), we can do a smart search.
        // For N <= 8, exhaustive is fine (8! = 40320)
        let bestSeq: number[] = [];
        let minDist = Infinity;

        function findBestRoute(currentIdx: number, remaining: number[], currentPath: number[], currentDist: number) {
            if (remaining.length === 0) {
                if (currentDist < minDist) {
                    minDist = currentDist;
                    bestSeq = [...currentPath];
                }
                return;
            }

            // Pruning
            if (currentDist >= minDist) return;

            for (let i = 0; i < remaining.length; i++) {
                const next = remaining[i];
                const nextRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
                findBestRoute(
                    next + 1, // +1 because in distMatrix, index 1 is dest 0
                    nextRemaining,
                    [...currentPath, next],
                    currentDist + distMatrix[currentIdx][next]
                );
            }
        }

        const destIndices = Array.from({ length: numDests }, (_, i) => i);
        findBestRoute(0, destIndices, [], 0);

        console.log(`[RoutesAPI] Optimal Expert TSP Sequence (Distance: ${minDist}m):`, bestSeq);
        return { success: true, optimizedIndices: bestSeq };

    } catch (err: any) {
        console.error('[RoutesAPI] Fatal Error:', err.message);
        return { success: false, error: err.message || 'Error desconocido al optimizar la ruta' };
    }
}
