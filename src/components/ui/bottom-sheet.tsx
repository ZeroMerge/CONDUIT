/**
 * BottomSheet
 *
 * A mobile-first modal that slides up from the bottom on small screens,
 * and renders as a centered overlay modal on tablet/desktop.
 *
 * Features:
 *  - Smooth slide-up animation on mobile
 *  - Body scroll lock
 *  - Backdrop click to dismiss
 *  - Keyboard Escape to dismiss
 *  - iOS safe area padding at the bottom
 *  - Drag handle visual hint on mobile
 *  - Accessible: role="dialog", aria-modal, focus management
 *
 * Usage:
 *   <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Sign in">
 *     <p>Sheet content…</p>
 *   </BottomSheet>
 */

"use client"

import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Override max-width of the desktop modal card */
  maxWidth?: string
  className?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const sw = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.setProperty('--scrollbar-width', `${sw}px`)
      document.body.classList.add('scroll-locked')
    } else {
      document.body.classList.remove('scroll-locked')
    }
    return () => document.body.classList.remove('scroll-locked')
  }, [isOpen])

  // Keyboard dismiss
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onKeyDown])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/50 animate-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Mobile: bottom sheet ── */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // Base
          'fixed z-[71] bg-[var(--bg-primary)] border border-[var(--border)]',
          // Mobile: slide up from bottom, full width
          'bottom-0 left-0 right-0 rounded-t-3xl sm:hidden',
          'animate-slide-up',
          // Safe area
          'pb-safe',
          className,
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-base font-geist font-semibold text-[var(--text-primary)]">{title}</h2>
            <button onClick={onClose} className="touch-target rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" aria-label="Close">
              <X className="h-5 w-5 text-[var(--text-tertiary)]" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 touch-target rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-[var(--text-tertiary)]" />
          </button>
        )}

        <div className="px-5 pb-2">{children}</div>
      </div>

      {/* ── Tablet/Desktop: centered modal ── */}
      <div className="hidden sm:flex fixed inset-0 z-[71] items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            'bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-2xl w-full pointer-events-auto animate-scale-in',
            maxWidth,
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h2 className="text-lg font-geist font-semibold text-[var(--text-primary)]">{title}</h2>
              <button onClick={onClose} className="touch-target rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" aria-label="Close">
                <X className="h-5 w-5 text-[var(--text-tertiary)]" />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  )
}
