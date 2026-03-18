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
 * Optimizes a list of addresses starting from an origin using a Greedy (Nearest Neighbor) approach.
 * This is more reliable for local routes than Google's internal 'optimize' flag.
 */
export async function optimizeRoute(origin: string, destinations: string[]): Promise<number[]> {
    console.log(`[GreedyOptimize] Starting optimization for ${destinations.length} destinations from ${origin}`);
    
    if (destinations.length === 0) return []
    if (destinations.length === 1) return [0]

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
        throw new Error('Google Maps API Key not configured');
    }

    // Process addresses to be super specific for Mendoza
    const sanitize = (addr: string) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    
    const remaining = destinations.map((address, index) => ({ 
        address: sanitize(address), 
        originalIndex: index 
    }));

    const optimizedIndices: number[] = []
    let currentPoint = sanitize(origin)

    try {
        while (remaining.length > 0) {
            const destString = remaining.map(r => encodeURIComponent(r.address)).join('|');
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(currentPoint)}&destinations=${destString}&key=${apiKey}`;
            
            const res = await fetch(url);
            const data: DistanceMatrixResponse = await res.json();

            if (data.status !== 'OK') {
                throw new Error(`Google Maps API Error: ${data.status}`);
            }

            const elements = data.rows[0].elements;
            let closestIdx = -1;
            let minDuration = Infinity;

            // We prioritize 'duration' (time) over 'distance' for better delivery efficiency
            elements.forEach((el, idx) => {
                if (el.status === 'OK' && el.duration.value < minDuration) {
                    minDuration = el.duration.value;
                    closestIdx = idx;
                }
            });

            // If Google can't find a path to any remaining points, we just append them as-is
            if (closestIdx === -1) {
                console.warn('[GreedyOptimize] No valid routes found for remaining stops.');
                remaining.forEach(r => optimizedIndices.push(r.originalIndex));
                break;
            }

            // Move to the closest point
            const winner = remaining[closestIdx];
            optimizedIndices.push(winner.originalIndex);
            currentPoint = winner.address;
            remaining.splice(closestIdx, 1);
        }
        
        console.log('[GreedyOptimize] Done. Final Sequence:', optimizedIndices);
        return optimizedIndices;
    } catch (err: any) {
        console.error('[GreedyOptimize] Fatal Error:', err.message);
        throw err;
    }
}
