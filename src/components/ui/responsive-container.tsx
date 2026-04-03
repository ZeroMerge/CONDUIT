/**
 * ResponsiveContainer
 *
 * The canonical page wrapper for ALL Conduit pages — current and future.
 * Provides:
 *  - Max-width capped at 1120px (--max-content)
 *  - Auto horizontal centering
 *  - Fluid horizontal padding via clamp() (--space-px)
 *  - Optional vertical section padding
 *
 * Usage:
 *   <ResponsiveContainer>…</ResponsiveContainer>
 *   <ResponsiveContainer section>…</ResponsiveContainer>      ← adds py-section
 *   <ResponsiveContainer section="sm">…</ResponsiveContainer> ← adds py-section-sm
 *   <ResponsiveContainer narrow>…</ResponsiveContainer>       ← narrows to 720px (forms, run page)
 */

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  /** True → full section vertical padding; 'sm' → smaller section padding */
  section?: boolean | 'sm'
  /** Narrow the max-width to 720px — ideal for reading/form pages */
  narrow?: boolean
  /** Additional className */
  className?: string
  as?: React.ElementType
}

export function ResponsiveContainer({
  children,
  section,
  narrow,
  className,
  as: Tag = 'div',
}: ResponsiveContainerProps) {
  return (
    <Tag
      className={cn(
        'page-container',
        narrow && 'max-w-[720px]',
        section === true && 'section-gap',
        section === 'sm' && 'section-gap-sm',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
