"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { ProofUpload } from './proof-upload'
import { toast } from 'sonner'

interface ReviewFormProps {
  flowId: string
  flowTitle: string
}

export function ReviewForm({ flowId, flowTitle }: ReviewFormProps) {
  const router = useRouter()
  const { user, profile, setProfile } = useUserStore()
  const [success, setSuccess] = useState<boolean | null>(null)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Confetti Success Screen state
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [rewardData, setRewardData] = useState({ xp: 0, timeSaved: 0, category: '' })

  const canSubmit = success !== null && difficulty !== null

  const handleSubmit = async () => {
    if (!user || !profile || !canSubmit) return

    setSubmitting(true)

    try {
      // 1. Fetch flow data to calculate rewards
      const { data: flowData } = await supabase.from('flows').select('estimated_minutes, category, xp_reward, creator_id').eq('id', flowId).single() as { data: { estimated_minutes: number; category: string; xp_reward: number; creator_id: string | null } | null }

      const assumedTimeSpent = 5 // Assumes the user did the task fast via AI
      const timeSaved = Math.max(0, (flowData?.estimated_minutes || 30) - assumedTimeSpent)
      const gainedXp = flowData?.xp_reward || 50
      const category = flowData?.category || 'General'

      // 2. Insert completion
      const { error: completionError } = await supabase.from('completions').upsert({
        flow_id: flowId,
        user_id: user.id,
        success,
        difficulty,
        feedback: feedback.trim() || null,
        proof_url: proofUrl,
        time_saved_minutes: timeSaved
      } as any, { onConflict: 'flow_id,user_id' })

      if (completionError) throw completionError

      // 3. Update Streak & Profile Stats
      const today = new Date().toISOString().split('T')[0]
      let newStreak = profile.current_streak

      if (profile.last_completed_date !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        if (profile.last_completed_date === yesterday) {
          newStreak += 1
        } else {
          newStreak = 1
        }
      }

      const updatedProfile = {
        ...profile,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak),
        last_completed_date: today,
        total_time_saved_minutes: profile.total_time_saved_minutes + timeSaved,
        total_xp: profile.total_xp + gainedXp
      }

      await supabase.from('profiles').update(updatedProfile).eq('id', user.id)
      setProfile(updatedProfile) // Update local Zustand store immediately

      // 4. Update Skill Tree (Upsert)
      const { data: skillData } = await supabase.from('user_skills').select('*').eq('user_id', user.id).eq('category', category).single() as { data: { xp_amount: number } | null }
      await supabase.from('user_skills').upsert({
        user_id: user.id,
        category,
        xp_amount: (skillData?.xp_amount || 0) + gainedXp
      } as any, { onConflict: 'user_id,category' })

      // 5. Trigger Dopamine Hit
      await supabase.rpc('increment_completion_count', { flow_id: flowId } as any)

      if (flowData?.creator_id) {
        // Run trust score update asynchronously
        ;(async () => {
          try {
            await supabase.rpc('update_trust_score' as any, { creator_profile_id: flowData.creator_id })
          } catch (err) {
            console.error(err)
          }
        })()
      }

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#16a34a', '#bbf7d0', '#ffffff'] })
      setRewardData({ xp: gainedXp, timeSaved, category })
      setShowSuccessScreen(true)

    } catch (error) {
      console.error(error)
      toast.error('Failed to submit review')
      setSubmitting(false)
    }
  }

  if (showSuccessScreen) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-xl p-8">
          <h2 className="text-2xl font-geist font-bold text-[var(--accent-text)] mb-2">Flow Mastered!</h2>
          <p className="text-[var(--accent-text)] opacity-80 mb-6">You are basically superhuman now.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--accent-border)] shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">XP Gained</p>
              <p className="text-2xl font-black text-[var(--text-primary)] mt-1">+{rewardData.xp}</p>
              <p className="text-xs text-[var(--accent)] mt-1 font-medium">{rewardData.category} Skill</p>
            </div>
            <div className="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--accent-border)] shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Time Saved</p>
              <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{rewardData.timeSaved}m</p>
              <p className="text-xs text-[var(--accent)] mt-1 font-medium">Using AI effectively</p>
            </div>
          </div>
        </div>

        <button onClick={() => router.push('/explore')} className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 font-medium py-3 rounded-lg transition-all">
          Find your next flow &rarr;
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Was this flow successful?</h3>
        <div className="flex gap-3">
          <button onClick={() => setSuccess(true)} className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-150 ${success === true ? 'bg-[var(--accent)] text-white border border-[var(--accent)]' : 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'}`}>Yes</button>
          <button onClick={() => setSuccess(false)} className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-150 ${success === false ? 'bg-[var(--accent)] text-white border border-[var(--accent)]' : 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'}`}>No</button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">How difficult was it?</h3>
        <div className="flex gap-3">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button key={level} onClick={() => setDifficulty(level)} className={`px-4 py-2 rounded text-sm font-medium capitalize transition-colors duration-150 ${difficulty === level ? 'bg-[var(--accent)] text-white border border-[var(--accent)]' : 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'}`}>{level}</button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">What did you build? (optional)</h3>
        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Describe what you created&hellip;" className="w-full min-h-[100px] bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded p-3 text-sm text-[var(--text-primary)] resize-none transition-colors duration-150" />
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Upload proof (optional)</h3>
        <ProofUpload onUpload={setProofUrl} onRemove={() => setProofUrl(null)} uploadedUrl={proofUrl} />
      </div>

      <div className="flex items-center justify-between pt-4">
        <button onClick={() => router.push('/explore')} className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150">Skip &rarr;</button>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150">
          {submitting ? 'Submitting&hellip;' : 'Submit & Claim XP'}
        </button>
      </div>
    </div>
  )
}