"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, RefreshCw, Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from '@/components/avatar'
import { AvatarColorPicker } from '@/components/avatar-color-picker'
import { toast } from 'sonner'
import type { Profile } from '@/types'

interface EditProfileModalProps {
  profile: Profile
  onClose: () => void
}

export function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const router = useRouter()
  const { setProfile } = useUserStore()
  
  const [bio, setBio] = useState(profile.bio || '')
  const [seed, setSeed] = useState(profile.avatar_seed)
  const [bgColor, setBgColor] = useState(profile.avatar_bg_color || 'transparent')
  const [loading, setLoading] = useState(false)

  const handleShuffle = () => {
    setSeed(crypto.randomUUID())
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const updates = {
        bio: bio.trim() || null,
        avatar_seed: seed,
        avatar_bg_color: bgColor,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Update local store
      setProfile({
        ...profile,
        ...updates,
      } as any)

      toast.success('Profile updated successfully!')
      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-geist font-bold text-[var(--text-primary)]">Edit Profile</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-full text-[var(--text-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          
          {/* Avatar Preview & Shuffle */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <Avatar seed={seed} size={120} bg_color={bgColor} />
              <button
                type="button"
                onClick={handleShuffle}
                className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-white p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                title="Shuffle Robot"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Background Fill</p>
              <AvatarColorPicker 
                currentValue={bgColor} 
                onSelect={setBgColor} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[100px] resize-none"
                placeholder="Tell the world about your AI builds..."
                maxLength={160}
              />
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1 text-right">
                {bio.length} / 160
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
