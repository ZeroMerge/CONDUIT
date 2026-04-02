"use client"

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { FlowCard } from '@/components/flow-card'
import { CategoryFilter } from '@/components/category-filter'
import { Avatar } from '@/components/avatar'
import type { Flow, Profile } from '@/types'

export function ExploreClient({ flows, globalTimeSavedMinutes: initialMinutes }: { flows: (Flow & { creator?: Profile | null })[], globalTimeSavedMinutes: number }) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState<'popular' | 'completed' | 'newest'>('popular')
  const [leaderboard, setLeaderboard] = useState<Profile[]>([])
  const [liveMinutes, setLiveMinutes] = useState(initialMinutes)

  useEffect(() => {
    // Fetch Top Builders for Leaderboard
    const fetchLeaderboard = async () => {
      const { data } = await supabase.from('profiles').select('*').order('total_xp', { ascending: false }).limit(5)
      if (data) setLeaderboard(data)
    }
    fetchLeaderboard()

    // Realtime-ish updates for global ticker (every 30s)
    const interval = setInterval(async () => {
      const { data, error } = await supabase.rpc('get_global_time_saved' as any)
      if (!error && typeof data === 'number') {
        setLiveMinutes(data)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const filteredFlows = useMemo(() => {
    let result = [...flows]
    
    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((f) => f.category === activeCategory)
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(f => 
        f.title.toLowerCase().includes(query) || 
        f.description.toLowerCase().includes(query)
      )
    }

    // Sorting
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.like_count - a.like_count)
        break
      case 'completed':
        result.sort((a, b) => b.completion_count - a.completion_count)
        break
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return result
  }, [flows, activeCategory, searchQuery, sortBy])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Explore Workflows</h1>
          <p className="text-[var(--text-secondary)] mt-2">Discover verified AI workflows to automate your day.</p>
        </div>
        
        <div className="flex items-center gap-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-6 py-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {Math.floor(liveMinutes / 60).toLocaleString()}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Global Hours Saved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-4 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <CategoryFilter activeCategory={activeCategory} />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
              >
                <option value="popular">Popular</option>
                <option value="completed">Completed</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFlows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>

          {filteredFlows.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[var(--text-secondary)]">No workflows found matching your criteria.</p>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Top Builders</h2>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded divide-y divide-[var(--border)]">
              {leaderboard.map((user, index) => (
                <Link 
                  key={user.id} 
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 p-4 hover:bg-[var(--bg-tertiary)] transition-colors group"
                >
                  <span className="text-xs font-bold text-[var(--text-tertiary)] w-4">{index + 1}</span>
                  <Avatar seed={user.avatar_seed} size={32} verified={(user.total_xp || 0) >= 1000} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{user.username}</p>
                    <p className="text-xs text-[var(--accent)] font-medium">{user.total_xp || 0} XP</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}