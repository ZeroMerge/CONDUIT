"use client"

import { useState, useEffect } from 'react'
import { Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { EditProfileModal } from './edit-profile-modal'
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
        className={`group flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${
          isIncomplete
          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] ring-2 ring-[var(--accent-subtle)] animate-[subtle-pulse_3s_infinite]'
          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-strong)]'
        }`}
      >
        <Edit2 className={`h-4 w-4 transition-transform group-hover:rotate-12 ${isIncomplete ? 'text-white' : 'text-[var(--accent)]'}`} /> 
        <span>{isIncomplete ? 'Complete Profile' : 'Edit Profile'}</span>
        {isIncomplete && (
          <span className="flex h-2 w-2 rounded-full bg-white animate-ping ml-1" />
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
