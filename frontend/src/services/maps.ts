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
        const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        
        // OPEN TSP STRATEGY: 
        // We do not want to force the driver to return to the warehouse (closed loop), which causes zig-zags.
        // Google Routes API lacks a native "Open TSP" flag. So we test EVERY stop as the final destination concurrently.
        const promises = safeDests.map(async (potentialEnd, endIdx) => {
            const intermediates = safeDests.map((addr, i) => ({
                address: addr,
                originalIndex: i
            })).filter(x => x.originalIndex !== endIdx);

            const body = {
                origin: { address: safeOrigin },
                destination: { address: potentialEnd },
                intermediates: intermediates.map(d => ({ address: d.address })),
                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE",
                optimizeWaypointOrder: true
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.duration'
                },
                body: JSON.stringify(body),
                cache: 'no-store'
            });

            const data = await res.json();
            
            // Handle specific Google errors inside the parallel request
            if (data.error) {
                if (data.error.status === 'PERMISSION_DENIED' && data.error.message.includes('Routes API has not been used')) {
                    throw new Error('ATENCIÓN: La "Routes API" no está habilitada en tu cuenta de Google. Entrá a tu Consola de Google Cloud, buscá "Routes API" y dale a Habilitar (Enable).');
                }
                throw new Error(`Error de Google Maps: ${data.error.message}`);
            }
            
            if (!data.routes || data.routes.length === 0) return null;
            
            const route = data.routes[0];
            const durationSecs = parseInt(route.duration.replace('s', ''));
            // If optimization is missing (e.g., only 1 intermediate), fallback to sequential
            const optGoogleIndices = route.optimizedIntermediateWaypointIndex || intermediates.map((_, i) => i);
            
            // Reconstruct the full sequence mapped to our ORIGINAL array indices
            const finalSequence = optGoogleIndices.map((optIdx: number) => intermediates[optIdx].originalIndex);
            finalSequence.push(endIdx); // Append the forced destination

            return {
                duration: durationSecs,
                sequence: finalSequence
            };
        });

        const results = await Promise.all(promises);
        
        let bestResult: { duration: number, sequence: number[] } | null = null;
        let minDuration = Infinity;

        results.forEach(res => {
            if (res && res.duration < minDuration) {
                minDuration = res.duration;
                bestResult = res;
            }
        });

        if (!bestResult) {
            return { success: false, error: 'Google no pudo encontrar rutas terrestres para estas direcciones.' };
        }

        console.log(`[RoutesAPI] Optimal Open TSP Sequence (Duration: ${bestResult.duration}s):`, bestResult.sequence);
        return { success: true, optimizedIndices: bestResult.sequence };

    } catch (err: any) {
        console.error('[RoutesAPI] Fatal Error:', err.message);
        return { success: false, error: err.message || 'Error desconocido al optimizar la ruta' };
    }
}
