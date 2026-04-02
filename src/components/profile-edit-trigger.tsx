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
  const [isOwner, setIsOwner] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === profile.id) {
        setIsOwner(true)
      }
    }
    checkOwner()
  }, [profile.id])

  if (!isOwner) return null

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-secondary)] transition-all shadow-sm"
      >
        <Edit2 className="h-4 w-4 text-[var(--accent)]" /> 
        Edit Profile
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
