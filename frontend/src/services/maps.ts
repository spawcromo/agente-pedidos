'use server'

import { WAREHOUSE_ADDRESS } from '@/lib/constants'

export interface DistanceMatrixResponse {
    origins: string[]
    destinations: string[]
    rows: {
        elements: {
            distance: { text: string; value: number }
            duration: { text: string; value: number }
            status: string
        }[]
    }[]
    status: string
}

/**
 * Optimizes a list of addresses using a full Distance Matrix and a TSP permutation solver.
 * This finds the ABSOLUTE mathematical optimum for small routes.
 */
export async function optimizeRoute(origin: string, destinations: string[]): Promise<number[]> {
    console.log(`[FullMatrixTSP] Optimizing ${destinations.length} destinations from ${origin}`);
    
    if (destinations.length === 0) return []
    if (destinations.length === 1) return [0]

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) throw new Error('Google Maps API Key not configured');

    const sanitize = (addr: string) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const allPoints = [sanitize(origin), ...destinations.map(sanitize)];
    
    try {
        // 1. Get FULL Matrix in one call (Origin + Destinations vs Origin + Destinations)
        // Max 10x10 = 100 elements, well within Google's 100 element per request limit.
        const pointsString = allPoints.map(p => encodeURIComponent(p)).join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pointsString}&destinations=${pointsString}&key=${apiKey}`;
        
        const res = await fetch(url);
        const data: DistanceMatrixResponse = await res.json();

        if (data.status !== 'OK') throw new Error(`Google Matrix Error: ${data.status}`);

        // 2. Build the Cost Matrix (Duration in seconds)
        const size = allPoints.length;
        const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

        data.rows.forEach((row, rIdx) => {
            row.elements.forEach((el, cIdx) => {
                matrix[rIdx][cIdx] = el.status === 'OK' ? el.duration.value : 9999999;
            });
        });

        // 3. Solve TSP (Simple permutation for small N)
        // If N > 8, we stick to greedy or use a better heuristic, but for 6 stops it's perfect.
        const numStops = destinations.length;
        const result = findBestPath(matrix, numStops);
        
        // Result is [0, optimized_idx1, optimized_idx2, ..., 0]
        // We need it as original indices of 'destinations'
        const finalOrder = result.slice(1, -1).map(pointIdx => pointIdx - 1);
        
        console.log('[FullMatrixTSP] Optimal Sequence:', finalOrder);
        return finalOrder;

    } catch (err: any) {
        console.error('[FullMatrixTSP] Fatal Error:', err.message);
        throw err;
    }
}

/**
 * Finds the absolute best path using permutations.
 * Suitable for numStops <= 8 (N <= 9 if we count origin).
 */
function findBestPath(matrix: number[][], numStops: number): number[] {
    const indices = Array.from({ length: numStops }, (_, i) => i + 1); // [1, 2, ..., numStops]
    let bestOrder: number[] = [];
    let minCost = Infinity;

    function permute(arr: number[], m: number = 0) {
        if (m === arr.length) {
            // Calculate cost: Origin -> ...stops... -> Origin
            let currentCost = matrix[0][arr[0]]; // From Warehouse to first stop
            for (let i = 0; i < arr.length - 1; i++) {
                currentCost += matrix[arr[i]][arr[i+1]];
            }
            currentCost += matrix[arr[arr.length - 1]][0]; // Back to Warehouse

            if (currentCost < minCost) {
                minCost = currentCost;
                bestOrder = [0, ...arr, 0];
            }
        } else {
            for (let i = m; i < arr.length; i++) {
                [arr[m], arr[i]] = [arr[i], arr[m]];
                permute(arr, m + 1);
                [arr[m], arr[i]] = [arr[i], arr[m]];
            }
        }
    }

    permute(indices);
    return bestOrder;
}
