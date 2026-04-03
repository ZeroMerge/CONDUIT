import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — class name merger
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Used by all UI primitive components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
