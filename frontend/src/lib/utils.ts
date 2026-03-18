import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUnit(quantity: number, unit: string) {
  const u = unit.toLowerCase();
  if (u === 'unidad' && quantity !== 1) {
    return 'unidades';
  }
  return unit;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function getGoogleWaypointsUrl(origin: string, destinations: string[]) {
  if (destinations.length === 0) return `https://www.google.com/maps/dir/${encodeURIComponent(origin)}`;
  
  // We add 'Mendoza, Argentina' for total clarity in Google Maps
  const processedDestinations = destinations.map(d => 
    d.toLowerCase().includes('mendoza') ? d : `${d}, Mendoza, Argentina`
  );

  const waypoints = processedDestinations.map(d => encodeURIComponent(d)).join('/');
  const originEncoded = encodeURIComponent(origin);
    
  return `https://www.google.com/maps/dir/${originEncoded}/${waypoints}/${originEncoded}`;
}
