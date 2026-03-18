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
    if (destinations.length === 0) return []
    if (destinations.length === 1) return [0]

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) throw new Error('Google Maps API Key not found')

    // Using Google Distance Matrix to get distances between all points
    // For a real TSP (Traveling Salesperson Problem), we'd need a matrix
    // But for a simple greedy optimization:
    
    const waypoints = [...destinations]
    const optimizedIndices: number[] = []
    let currentPos = origin

    while (waypoints.length > 0) {
        const destString = waypoints.join('|')
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(currentPos)}&destinations=${encodeURIComponent(destString)}&key=${apiKey}`
        
        const res = await fetch(url)
        const data: DistanceMatrixResponse = await res.json()

        if (data.status !== 'OK') throw new Error(`Google API Error: ${data.status}`)

        const elements = data.rows[0].elements
        let closestIdx = -1
        let minDistance = Infinity

        elements.forEach((el, idx) => {
            if (el.status === 'OK' && el.distance.value < minDistance) {
                minDistance = el.distance.value
                closestIdx = idx
            }
        })

        if (closestIdx === -1) break

        // Map relative index back to original index
        const originalIdx = destinations.indexOf(waypoints[closestIdx])
        optimizedIndices.push(originalIdx)
        
        currentPos = waypoints[closestIdx]
        waypoints.splice(closestIdx, 1)
    }

    return optimizedIndices
}
