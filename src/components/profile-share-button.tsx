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
        await navigator.share({
          title: `${username}'s AI Builder Profile — Conduit`,
          text: `Check out ${username}'s verified AI workflow portfolio on Conduit.`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('Profile link copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // User cancelled share or clipboard failed
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] rounded-lg transition-all duration-150"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-[var(--verified)]" />
          Copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      )}
    </button>
  )
}
