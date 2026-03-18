'use server'

import { WAREHOUSE_ADDRESS } from '@/lib/constants'

interface DirectionsResponse {
    status: string
    error_message?: string
    routes: {
        waypoint_order: number[]
        legs: any[]
    }[]
}

/**
 * Optimizes a list of addresses starting from an origin.
 * Uses Google Directions API with optimizeWaypoints:true.
 * This is the professional way to solve the Traveling Salesperson Problem (TSP).
 */
export async function optimizeRoute(origin: string, destinations: string[]): Promise<number[]> {
    console.log(`[ExpertOptimize] Optimizing ${destinations.length} stops from ${origin}`);
    
    if (destinations.length === 0) return []
    if (destinations.length === 1) return [0]

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
        console.error('[ExpertOptimize] API Key Missing');
        throw new Error('Google Maps API Key not configured in Vercel');
    }

    if (destinations.length > 25) {
        throw new Error('Google limit exceeded: A single route cannot have more than 25 stops for optimization.');
    }

    // Expert Strategy:
    // We set 'origin' as the Warehouse.
    // We set 'destination' as the Warehouse as well to create a complete loop.
    // We put all stops in 'waypoints' with 'optimize:true'.
    // Google will find the best order to visit all waypoints.
    
    const waypointsEncoded = destinations.map(d => encodeURIComponent(d + (d.toLowerCase().includes('mendoza') ? '' : ', Mendoza, Argentina'))).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(origin)}&waypoints=optimize:true|${waypointsEncoded}&key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data: DirectionsResponse = await res.json();

        if (data.status !== 'OK') {
            const msg = data.error_message || data.status;
            console.error(`[ExpertOptimize] Google API Error: ${msg}`);
            
            if (data.status === 'NOT_FOUND') {
                throw new Error('Una o más direcciones no fueron encontradas por Google Maps. Revisá las direcciones de los clientes.');
            }
            if (data.status === 'ZERO_RESULTS') {
                throw new Error('No se encontró una ruta terrestre para estos destinos. ¿Son direcciones válidas en Mendoza?');
            }
            
            throw new Error(`Error de Google Maps: ${msg}`);
        }

        const optimizedOrder = data.routes[0].waypoint_order;
        console.log('[ExpertOptimize] Success. Optimized order:', optimizedOrder);
        
        return optimizedOrder;
    } catch (err: any) {
        console.error('[ExpertOptimize] Fatal Exception:', err.message);
        throw err;
    }
}
