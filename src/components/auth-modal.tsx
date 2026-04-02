"use client"

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  trigger: 'like' | 'review' | 'create' | 'run'
}

const subtitles: Record<AuthModalProps['trigger'], string> = {
  like: 'You need an account to like flows and support creators.',
  review: 'You need an account to leave reviews and help the community.',
  create: 'You need an account to create and publish flows.',
  run: 'Sign in to save your progress across sessions.',
}

export function AuthModal({ isOpen, onClose, trigger }: AuthModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <>
      {/* Desktop overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 hidden sm:block"
        onClick={onClose}
      />

      {/* Desktop modal */}
      <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded p-6 max-w-[400px] w-full pointer-events-auto">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-geist font-semibold text-[var(--text-primary)]">
              Sign in to continue
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {subtitles[trigger]}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signup"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded text-center transition-colors duration-150"
            >
              Create account
            </Link>
            <Link
              href="/auth/signin"
              className="bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium px-4 py-2 rounded text-center transition-colors duration-150"
            >
              Sign in
            </Link>
          </div>

          <button
            onClick={onClose}
            className="mt-4 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150 block w-full text-center"
          >
            Continue without account &rarr;
          </button>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div
        className="fixed inset-0 bg-black/40 z-50 sm:hidden"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] border-b-0 rounded-t p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-geist font-semibold text-[var(--text-primary)]">
              Sign in to continue
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {subtitles[trigger]}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signup"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded text-center transition-colors duration-150"
            >
              Create account
            </Link>
            <Link
              href="/auth/signin"
              className="bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium px-4 py-2 rounded text-center transition-colors duration-150"
            >
              Sign in
            </Link>
          </div>

          <button
            onClick={onClose}
            className="mt-4 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150 block w-full text-center"
          >
            Continue without account &rarr;
          </button>
        </div>
      </div>
    </>
  )
}
