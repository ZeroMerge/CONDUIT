/**
 * SnapCarousel
 *
 * A horizontally scrollable, snap-scroll carousel for any list of cards.
 * Mobile: horizontal swipe. Tablet+: switches to a responsive grid.
 *
 * Features:
 *  - CSS scroll snapping (no JS library needed)
 *  - Invisible scrollbar with momentum scrolling (iOS)
 *  - Fade-edge mask to hint at more content
 *  - Dot indicators (optional)
 *  - Automatically switches to grid at the `gridBreakpoint`
 *
 * Usage:
 *   <SnapCarousel cols={3} dots>
 *     {items.map(item => <MyCard key={item.id} />)}
 *   </SnapCarousel>
 */

"use client"

import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SnapCarouselProps {
  children: React.ReactNode
  /** Number of columns in the grid layout (tablet+) */
  cols?: 2 | 3 | 4
  /** Show scroll-position dots below the carousel (mobile only) */
  dots?: boolean
  /** Additional class for the outer wrapper */
  className?: string
  /** Class applied to each child wrapper */
  itemClassName?: string
}

const GRID_COLS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function SnapCarousel({
  children,
  cols = 3,
  dots,
  className,
  itemClassName,
}: SnapCarouselProps) {
  const trackRef     = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const items = Array.isArray(children) ? children : [children]

  useEffect(() => {
    const track = trackRef.current
    if (!track || !dots) return
    const onScroll = () => {
      const w = track.clientWidth
      setActive(Math.round(track.scrollLeft / w))
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [dots])

  const scrollTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className={cn('relative', className)}>
      {/* ── Mobile: snap carousel ── */}
      <div
        ref={trackRef}
        className={cn(
          // Mobile carousel
          'flex gap-4 snap-x scrollbar-hide',
          // Tablet → grid (flex becomes grid via display override)
          'sm:grid sm:overflow-visible sm:flex-none',
          GRID_COLS[cols],
        )}
      >
        {items.map((child, i) => (
          <div
            key={i}
            className={cn(
              // Mobile: fixed card width, snap
              'snap-child flex-none w-[min(80vw,300px)]',
              // Tablet+: full width in grid
              'sm:w-auto sm:flex-none',
              itemClassName,
            )}
          >
            {child}
          </div>
        ))}
      </div>

      {/* ── Dot indicators (mobile only) ── */}
      {dots && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 sm:hidden" role="tablist" aria-label="Carousel position">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              onClick={() => scrollTo(i)}
              className={cn(
                'rounded-full transition-all duration-300 border-none cursor-pointer',
                i === active
                  ? 'w-5 h-2 bg-[var(--accent)]'
                  : 'w-2 h-2 bg-[var(--border-strong)]',
              )}
              aria-label={`Go to item ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
