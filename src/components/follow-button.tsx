"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all
        ${isFollowing 
          ? 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20' 
          : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/20'
        }
        ${loading ? 'opacity-70 cursor-not-allowed' : 'press-scale'}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isFollowing ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
          Respected
        </>
      ) : (
        <>
          <Award className="h-3.5 w-3.5" />
          Respect
        </>
      )}
    </button>
  )
}
