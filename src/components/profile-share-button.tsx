// src/components/profile-share-button.tsx
'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileShareButtonProps {
  username: string
}

export function ProfileShareButton({ username }: ProfileShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${username}`

    try {
      if (navigator.share) {
        // Native Share (Mobile)
        await navigator.share({
          title: `${username}'s AI Resume — Verified Developer Status`,
          text: `Review ${username}'s verified AI developer status and resume on Conduit.`,
          url,
        })
      } else {
        // Clipboard Fallback (Desktop)
        await navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success(`Profile link copied to clipboard`)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        // Only show toast if it's a real failure, not user cancellation
        toast.error('Could not share profile')
        console.error('Share Error:', err)
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] rounded-[6px] transition-all duration-150"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          Share
        </>
      )}
    </button>
  )
}
