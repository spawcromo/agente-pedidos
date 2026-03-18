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

export async function optimizeRoute(origin: string, destinations: string[]): Promise<number[]> {
    console.log(`[OptimizeRoute] Starting optimization for ${destinations.length} destinations from ${origin}`);
    
    if (destinations.length === 0) return []
    if (destinations.length === 1) return [0]

    // Use secret key in server action if available
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
        console.error('[OptimizeRoute] API Key Missing');
        throw new Error('Google Maps API Key not configured in Vercel');
    }

    // Keep track of original indices to handle duplicates and return correct order
    const remaining = destinations.map((address, index) => ({ address, originalIndex: index }));
    const optimizedIndices: number[] = []
    let currentPos = origin

    try {
        while (remaining.length > 0) {
            const destString = remaining.map(r => r.address).join('|')
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(currentPos)}&destinations=${encodeURIComponent(destString)}&key=${apiKey}`
            
            const res = await fetch(url)
            const data: DistanceMatrixResponse = await res.json()

            if (data.status !== 'OK') {
                console.error(`[OptimizeRoute] Google API Global Error: ${data.status}`, data);
                throw new Error(`Google Maps Global Error: ${data.status}`);
            }

            const elements = data.rows[0].elements
            let closestIdx = -1
            let minDistance = Infinity

            elements.forEach((el, idx) => {
                // Ignore elements that Google can't find or calculate
                if (el.status === 'OK' && el.distance.value < minDistance) {
                    minDistance = el.distance.value
                    closestIdx = idx
                }
            })

            // If we can't find ANY more valid paths, just attach the rest as they were
            if (closestIdx === -1) {
                console.warn('[OptimizeRoute] Could not find valid routes for remaining points. Appending as-is.');
                remaining.forEach(r => optimizedIndices.push(r.originalIndex));
                break;
            }

            // Pick the winner
            const winner = remaining[closestIdx];
            optimizedIndices.push(winner.originalIndex);
            
            // Move forward
            currentPos = winner.address;
            remaining.splice(closestIdx, 1);
        }
        
        console.log('[OptimizeRoute] Success. Order:', optimizedIndices);
        return optimizedIndices;
    } catch (err: any) {
        console.error('[OptimizeRoute] Fatal Exception:', err.message);
        throw err;
    }
}
