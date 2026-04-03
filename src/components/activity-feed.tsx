"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from './avatar'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Completion, Profile, Flow } from '@/types'

interface ActivityItem extends Completion {
  profile: Profile
  flow: Flow
}

function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('completions')
        .select(`
          *,
          profile:profiles(*),
          flow:flows(*)
        `)
        .order('completed_at', { ascending: false })
        .limit(8)

      if (error) throw error

      const validActivities = (data || []).filter(
        (item) => item.profile !== null && item.flow !== null
      ) as ActivityItem[]

      setActivities(validActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()

    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/3" />
                <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
        No completions yet. Be the first!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-4"
        >
          <div className="flex items-start gap-3">
            <Avatar seed={activity.profile.avatar_seed} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {activity.profile.username}
                </span>
                <span className="text-[var(--text-tertiary)]">&middot;</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {timeAgo(activity.completed_at)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Completed &ldquo;{activity.flow.title}&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className={cn(
                  "flex items-center gap-1.5 font-medium",
                  activity.success ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {activity.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {activity.success ? 'Successful' : 'Unsuccessful'}
                </div>
                {activity.difficulty && (
                  <>
                    <span className="text-[var(--text-tertiary)] opacity-30">&middot;</span>
                    <span className="text-[var(--text-tertiary)] px-1.5 py-0.5 rounded-md bg-[var(--bg-tertiary)] uppercase text-[9px] font-bold tracking-wider">
                      {activity.difficulty}
                    </span>
                  </>
                )}
                <span className="text-[var(--text-tertiary)] opacity-30">&middot;</span>
                <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                  <Clock className="h-3 w-3" />
                  {timeAgo(activity.completed_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
