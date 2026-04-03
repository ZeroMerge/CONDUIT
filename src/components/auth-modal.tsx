"use client"

import Link from 'next/link'
import { BottomSheet } from '@/components/ui/bottom-sheet'

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
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Sign in to continue" maxWidth="max-w-sm">
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {subtitles[trigger]}
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/auth/signup"
          onClick={onClose}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold px-4 py-3 rounded-xl text-center transition-colors shadow-lg shadow-[var(--accent)]/20 press-scale"
        >
          Create account
        </Link>
        <Link
          href="/auth/signin"
          onClick={onClose}
          className="bg-transparent border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold px-4 py-3 rounded-xl text-center transition-colors press-scale"
        >
          Sign in
        </Link>
      </div>

      <button
        onClick={onClose}
        className="mt-4 pb-2 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors block w-full text-center"
      >
        Continue without account &rarr;
      </button>
    </BottomSheet>
  )
}
