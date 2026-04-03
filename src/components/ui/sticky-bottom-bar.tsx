/**
 * StickyBottomBar
 *
 * A fixed bottom action bar that appears ONLY on mobile (hidden on md+).
 * Used for primary CTAs that should always be reachable regardless of scroll position.
 *
 * Examples:
 *  - "Start flow →" on flow detail page
 *  - "✓ Done / ← Prev / Skip →" on flow run page
 *  - "Submit" on long forms
 *
 * The bar automatically respects iOS safe area insets (home bar).
 */

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StickyBottomBarProps {
  children: ReactNode
  /** Show on tablet too (md), not just mobile */
  showOnTablet?: boolean
  className?: string
}

export function StickyBottomBar({ children, showOnTablet, className }: StickyBottomBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[40]',
        showOnTablet ? 'lg:hidden' : 'md:hidden',
        'bg-[var(--bg-primary)]/95 glass',
        'border-t border-[var(--border)]',
        'px-4 pt-3',
        'pb-safe',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * StickyBottomBarSpacer
 *
 * Add this at the BOTTOM of the page content on any page using StickyBottomBar.
 * It prevents the fixed bar from covering the last content element.
 */
export function StickyBottomBarSpacer({ showOnTablet }: { showOnTablet?: boolean }) {
  return (
    <div
      className={cn(
        'h-24',
        showOnTablet ? 'lg:hidden' : 'md:hidden',
      )}
      aria-hidden="true"
    />
  )
}
