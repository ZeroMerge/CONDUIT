"use client"

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock, Zap } from 'lucide-react'
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
    if (activeCategory !== 'all') result = result.filter((f) => f.category === activeCategory)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(f => f.title.toLowerCase().includes(query) || f.description.toLowerCase().includes(query))
    }
    switch (sortBy) {
      case 'popular': result.sort((a, b) => b.like_count - a.like_count); break;
      case 'completed': result.sort((a, b) => b.completion_count - a.completion_count); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result
  }, [flows, activeCategory, searchQuery, sortBy])

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8">
      {/* Global ROI Ticker Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)] p-12 mb-12 text-center shadow-xl">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent-text)] text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
            <Zap className="h-3.5 w-3.5" /> Global Efficiency Movement
          </div>
          
          <h1 className="text-4xl md:text-6xl font-geist font-black tracking-tight text-[var(--text-primary)] mb-6">
            <span className="tabular-nums transition-all duration-700">{(liveMinutes / 60).toFixed(1)}</span> <span className="text-[var(--text-secondary)] opacity-50">Hours Saved</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-base text-[var(--text-secondary)] leading-relaxed">
            Every run on Conduit reduces the human workload. We are collectively reclaiming time using verified AI workflows.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-geist font-semibold tracking-tight text-[var(--text-primary)]">Explore</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{filteredFlows.length} flows</p>
        </div>
      </div>

      <div className="sticky top-14 z-40 bg-[var(--bg-primary)] border-b border-[var(--border)] py-3 mt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <CategoryFilter activeCategory={activeCategory} />
          <div className="flex gap-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none">
              <option value="popular">Popular</option>
              <option value="completed">Most completed</option>
              <option value="newest">Newest</option>
            </select>
            <input type="text" placeholder="Search flows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-1.5 text-sm outline-none w-full sm:w-48" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Flow Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFlows.map((flow) => <FlowCard key={flow.id} flow={flow} />)}
          </div>
          {filteredFlows.length === 0 && (
            <div className="text-center py-16"><p className="text-[var(--text-tertiary)]">No flows found</p></div>
          )}
        </div>

        {/* Sidebar Leaderboard */}
        <div className="w-full lg:w-[300px] flex-shrink-0 space-y-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                 <Clock className="h-5 w-5 text-emerald-500" />
                 <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Global Impact</h3>
              </div>
            </div>
            
            <p className="text-3xl font-black font-geist tracking-tight text-[var(--text-primary)] mt-3 text-center lg:text-left">
              {Math.floor(liveMinutes / 60).toLocaleString()} <span className="text-lg text-[var(--text-secondary)] font-semibold">hours</span>
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2 font-medium">Saved by Conduit users globally using verified AI workflows.</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5 sticky top-40">
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Top Builders</h3>
            </div>
            <div className="space-y-4">
              {leaderboard.map((user, index) => (
                <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-3 group">
                  <span className="text-xs font-bold text-[var(--text-tertiary)] w-3">{index + 1}</span>
                  <Avatar seed={user.avatar_seed} size={32} verified={(user.total_xp || 0) >= 1000} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:underline">{user.username}</p>
                    <p className="text-xs text-[var(--accent)] font-medium">{user.total_xp || 0} XP</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}