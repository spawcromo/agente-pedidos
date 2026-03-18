'use server'

import { WAREHOUSE_ADDRESS } from '@/lib/constants'

/**
 * Optimizes a list of addresses using Google's modern Routes API (ComputeRoutes).
 * This is the ultimate industry standard for TSP and route mapping.
 */
export async function optimizeRoute(origin: string, destinations: string[]): Promise<number[]> {
    console.log(`[RoutesAPI] Optimizing ${destinations.length} destinations from ${origin}`);
    
    if (destinations.length === 0) return [];
    if (destinations.length === 1) return [0];

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('Google Maps API Key no configurada en el servidor');

    const sanitize = (addr: string) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const safeOrigin = sanitize(origin);
    const safeDests = destinations.map(sanitize);
    
    try {
        const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const body = {
            origin: { address: safeOrigin },
            destination: { address: safeOrigin }, // Loop back to warehouse
            intermediates: safeDests.map(d => ({ address: d })),
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            optimizeWaypointOrder: true
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,error'
            },
            body: JSON.stringify(body),
            cache: 'no-store' // Critical: prevent Vercel from caching bad routes
        });

        const data = await res.json();

        // Check if API is disabled or specific Google errors
        if (data.error) {
            console.error('[RoutesAPI] Google Error:', data.error.message);
            if (data.error.status === 'PERMISSION_DENIED' && data.error.message.includes('Routes API has not been used')) {
                return Promise.reject(new Error('ATENCIÓN: La "Routes API" no está habilitada en tu cuenta de Google. Entrá a tu Consola de Google Cloud, buscá "Routes API" y dale a Habilitar (Enable).'));
            }
            return Promise.reject(new Error(`Error de Google Maps: ${data.error.message}`));
        }

        if (!data.routes || data.routes.length === 0) {
            return Promise.reject(new Error('Google no pudo encontrar una ruta terrestre válida para estas direcciones. Verifica que sean calles existentes.'));
        }

        const optimizedIndices = data.routes[0].optimizedIntermediateWaypointIndex;
        
        if (!optimizedIndices) {
            console.warn('[RoutesAPI] No optimization indices returned, returning sequential order.');
            return destinations.map((_, i) => i);
        }

        console.log('[RoutesAPI] Optimal Sequence:', optimizedIndices);
        return optimizedIndices;

    } catch (err: any) {
        console.error('[RoutesAPI] Fatal Error:', err.message);
        return Promise.reject(new Error(err.message || 'Error desconocido al optimizar la ruta'));
    }
}
