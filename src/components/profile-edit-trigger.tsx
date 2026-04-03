"use client"

import { useState, useEffect } from 'react'
import { Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { EditProfileModal } from './edit-profile-modal'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface ProfileEditTriggerProps {
  profile: Profile
}

export function ProfileEditTrigger({ profile }: ProfileEditTriggerProps) {
  const [mounted, setMounted] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === profile.id) {
        setIsOwner(true)
      }
    }
    checkOwner()
  }, [profile.id])

  if (!isOwner) return null

  // During hydration, return a stable version without animations or dynamic classes
  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-strong)] opacity-50">
        <Edit2 className="h-4 w-4 text-[var(--accent)]" /> 
        Edit Profile
      </button>
    )
  }

  const isIncomplete = !profile.bio || profile.bio.length < 5
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          "w-full group flex items-center justify-center gap-2.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-[6px] transition-all duration-300 shadow-sm border active:scale-[0.98]",
          isIncomplete
            ? "bg-[var(--bg-secondary)] border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/5"
            : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--text-tertiary)]"
        )}
      >
        <Edit2 className={cn("h-3.5 w-3.5 transition-transform group-hover:rotate-12", isIncomplete ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]")} /> 
        <span>{isIncomplete ? 'Complete Identity' : 'Edit Identity'}</span>
        {isIncomplete && (
          <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
        )}
      </button>

      {showModal && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  )
}
