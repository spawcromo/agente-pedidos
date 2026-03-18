'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useJsApiLoader, Libraries } from '@react-google-maps/api'

const libraries: Libraries = ['places', 'geometry']

interface MapsContextType {
    isLoaded: boolean
    loadError: Error | undefined
}

const MapsContext = createContext<MapsContextType | null>(null)

export function MapsProvider({ children }: { children: ReactNode }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
        language: 'es',
        region: 'AR'
    })

    return (
        <MapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </MapsContext.Provider>
    )
}

export function useMaps() {
    const context = useContext(MapsContext)
    if (!context) {
        throw new Error('useMaps must be used within a MapsProvider')
    }
    return context
}
