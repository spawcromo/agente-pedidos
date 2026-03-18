'use client'

import { useRef, useEffect, useState } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { useMaps } from '@/contexts/MapsContext'
import { MapPin, Search } from 'lucide-react'

interface AddressAutocompleteProps {
    value: string
    onChange: (address: string, lat: number, lng: number) => void
    placeholder?: string
}

export function AddressAutocomplete({ value, onChange, placeholder }: AddressAutocompleteProps) {
    const { isLoaded } = useMaps()
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const [inputValue, setInputValue] = useState(value)

    useEffect(() => {
        setInputValue(value)
    }, [value])

    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete
        // Restrict to Argentina / Mendoza for better UX if needed
        autocomplete.setComponentRestrictions({ country: 'ar' })
        autocomplete.setFields(['address_components', 'formatted_address', 'geometry'])
    }

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace()
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat()
                const lng = place.geometry.location.lng()
                const address = place.formatted_address || ''
                setInputValue(address)
                onChange(address, lat, lng)
            }
        }
    }

    if (!isLoaded) return <Input disabled placeholder="Cargando mapas..." className="rounded-xl h-10" />

    return (
        <div className="relative group">
            <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
            >
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 group-focus-within:text-amber-500 transition-colors z-10" />
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={placeholder}
                        className="pl-9 h-10 rounded-xl bg-muted/30 focus:bg-background transition-all"
                        autoComplete="off"
                    />
                </div>
            </Autocomplete>
        </div>
    )
}
