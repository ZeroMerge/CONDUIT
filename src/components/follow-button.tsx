"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing?: boolean
  className?: string
}

export function FollowButton({ targetUserId, initialIsFollowing = false, className = "" }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(!initialIsFollowing)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function checkFollow() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setChecking(false)
        return
      }

      if (user.id === targetUserId) {
        setChecking(false)
        return
      }

      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single()

      if (data && !error) {
        setIsFollowing(true)
      }
      setChecking(false)
    }

    if (!initialIsFollowing) {
      checkFollow()
    } else {
      setChecking(false)
    }
  }, [targetUserId, initialIsFollowing, supabase])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Sign in to show respect")
      router.push('/auth/signup')
      return
    }

    if (user.id === targetUserId) {
      toast.error("You cannot respect yourself")
      return
    }

    setLoading(true)
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)

        if (error) throw error
        setIsFollowing(false)
        toast.success("Respect withdrawn")
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })

        if (error) throw error
        setIsFollowing(true)
        toast.success("Identity Respected")
      }
      router.refresh()
    } catch (err) {
      console.error("Follow error:", err)
      toast.error("Operation failed")
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed press-scale",
        "px-3 sm:px-5 py-1.5 sm:py-2 rounded-[6px] text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-widest",
        isFollowing 
          ? 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-rose-500/5 hover:text-rose-500 hover:border-rose-500/20 shadow-sm' 
          : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/15 border border-[var(--accent-hover)]/20',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isFollowing ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--accent)] fill-[var(--accent)]/10" />
          <span className="hidden xs:inline">Respected</span>
          <span className="xs:hidden">Hnr</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Respect</span>
          <span className="xs:hidden">Rspct</span>
        </div>
      )}
    </button>
  )
}
