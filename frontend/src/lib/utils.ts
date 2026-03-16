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
  if (u === 'caja' && quantity !== 1) {
    return 'cajas';
  }
  return unit;
}
