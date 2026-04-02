"use client"

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { AuthModal } from './auth-modal'
import { toast } from 'sonner'

interface LikeButtonProps {
  flowId: string
  initialLikeCount: number
}

export function LikeButton({ flowId, initialLikeCount }: LikeButtonProps) {
  const { user } = useUserStore()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkLikeStatus()
    }
  }, [user, flowId])

  const checkLikeStatus = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('likes')
        .select('*')
        .eq('flow_id', flowId)
        .eq('user_id', user.id)
        .single()

      setIsLiked(!!data)
    } catch {
      // Not liked
    }
  }

  const handleLike = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (loading) return
    setLoading(true)

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('flow_id', flowId)
          .eq('user_id', user.id)

        if (error) throw error

        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ flow_id: flowId, user_id: user.id })

        if (error) throw error

        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch {
      toast.error('Failed to update like')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleLike}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
      >
        <Heart
          className={`h-4 w-4 ${isLiked ? 'fill-[var(--accent)] text-[var(--accent)]' : ''}`}
        />
        <span>{likeCount}</span>
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        trigger="like"
      />
    </>
  )
}
