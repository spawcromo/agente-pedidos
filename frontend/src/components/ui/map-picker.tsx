'use client'

import { GoogleMap, Marker } from '@react-google-maps/api'
import { useMaps } from '@/contexts/MapsContext'
import { useEffect, useState } from 'react'

interface MapPickerProps {
    lat: number
    lng: number
    onChange: (lat: number, lng: number) => void
}

const mapContainerStyle = {
    width: '100%',
    height: '240px',
    borderRadius: '12px',
}

const defaultCenter = {
    lat: -32.8895,
    lng: -68.8458
}

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    styles: [
        {
            "elementType": "geometry",
            "stylers": [{ "color": "#212121" }]
        },
        {
            "elementType": "labels.icon",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#212121" }]
        },
        {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [{ "color": "#757575" }]
        },
        {
            "featureType": "administrative.country",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9e9e9e" }]
        },
        {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#2c2c2c" }]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#8a8a8a" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#3c3c3c" }]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }]
        }
    ]
}

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
    const { isLoaded } = useMaps()
    const [center, setCenter] = useState(defaultCenter)

    useEffect(() => {
        if (lat && lng) {
            setCenter({ lat, lng })
        }
    }, [lat, lng])

    if (!isLoaded) return <div style={mapContainerStyle} className="bg-muted animate-pulse border border-border flex items-center justify-center text-xs text-muted-foreground">Cargando mapa...</div>

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            onChange(e.latLng.lat(), e.latLng.lng())
        }
    }

    return (
        <div className="relative border border-border/50 rounded-xl overflow-hidden shadow-lg">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={15}
                center={center}
                onClick={onMapClick}
                options={mapOptions}
            >
                {lat && lng && (
                    <Marker
                        position={{ lat, lng }}
                        draggable={true}
                        onDragEnd={(e) => e.latLng && onChange(e.latLng.lat(), e.latLng.lng())}
                    />
                )}
            </GoogleMap>
            <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-muted-foreground text-center border border-white/5 pointer-events-none">
                Tocá el mapa o arrastrá el marcador para ajustar la ubicación exacta
            </div>
        </div>
    )
}
