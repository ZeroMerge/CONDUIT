"use client"

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock, Zap, Target, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { FlowCard } from '@/components/flow-card'
import { CategoryFilter } from '@/components/category-filter'
import { Avatar } from '@/components/avatar'
import { ResponsiveContainer } from '@/components/ui/responsive-container'
import { SnapCarousel } from '@/components/ui/snap-carousel'
import type { Flow, Profile } from '@/types'

export function ExploreClient({ flows, globalTimeSavedMinutes: initialMinutes }: { flows: (Flow & { creator?: Profile | null })[], globalTimeSavedMinutes: number }) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState<'popular' | 'completed' | 'newest'>('popular')
  const [leaderboard, setLeaderboard] = useState<Profile[]>([])
  const [liveMinutes, setLiveMinutes] = useState(initialMinutes)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase.from('profiles').select('*').order('total_xp', { ascending: false }).limit(6)
      if (data) setLeaderboard(data)
    }
    fetchLeaderboard()

    const interval = setInterval(async () => {
      const { data, error } = await supabase.rpc('get_global_time_saved' as any)
      if (!error && typeof data === 'number') setLiveMinutes(data)
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
    <ResponsiveContainer section>
      
      {/* ── Global ROI Ticker Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)] p-6 md:p-12 xl:p-16 mb-8 md:mb-12 text-center shadow-lg">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent-text)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">
            <Zap className="h-3.5 w-3.5 fill-current" /> Global Efficiency
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-geist font-black tracking-tighter text-[var(--text-primary)] mb-4 md:mb-6 isolate">
            <span className="tabular-nums drop-shadow-sm">{(liveMinutes / 60).toFixed(1)}</span>
            <span className="text-2xl sm:text-3xl md:text-5xl text-[var(--text-secondary)] opacity-50 ml-2">Hours Saved</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
            Every run on Conduit reduces the human workload. We are collectively reclaiming time using verified AI workflows.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
        {/* ── Main Content (Flows) ── */}
        <div className="flex-1 min-w-0">
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-geist font-bold tracking-tight text-[var(--text-primary)]">Explore</h2>
            <div className="text-sm font-medium text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)]">
              {filteredFlows.length} flows
            </div>
          </div>

          {/* ── Filters (Sticky on desktop, expandable on mobile) ── */}
          <div className="sticky top-14 z-[40] bg-[var(--bg-primary)]/95 glass border-b border-[var(--border)] py-3 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
            
            {/* Mobile Filter Toggle */}
            <div className="flex sm:hidden items-center justify-between gap-3 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                <input type="text" placeholder="Search flows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
              <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-sm font-medium">
                Filters
                {(activeCategory !== 'all' || sortBy !== 'popular') && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
              </button>
            </div>

            {/* Desktop Filters / Expanded Mobile Filters */}
            <div className={`${isFiltersOpen ? 'flex' : 'hidden'} sm:flex flex-col lg:flex-row gap-4 lg:items-center justify-between`}>
              <div className="w-full lg:w-auto overflow-hidden">
                <CategoryFilter activeCategory={activeCategory} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] font-medium outline-none focus:border-[var(--accent)] appearance-none cursor-pointer">
                  <option value="popular">🔥 Most popular</option>
                  <option value="completed">✅ Highest completed</option>
                  <option value="newest">✨ Newest first</option>
                </select>
                
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input type="text" placeholder="Search flows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-64 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Flow Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {filteredFlows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>
          
          {filteredFlows.length === 0 && (
            <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] mt-4">
              <Target className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-[var(--text-primary)] font-medium">No flows found</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>

        {/* ── Sidebar (Leaderboard) ── */}
        <div className="w-full xl:w-[320px] flex-shrink-0 mt-8 xl:mt-0">
          
          {/* Mobile: Horizontal Leaderboard via SnapCarousel  |  Desktop: Stacked Sidebar */}
          <div className="xl:sticky top-[100px] flex flex-col gap-6">

            {/* Top Builders Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Top Builders</h3>
              </div>
              
              <div className="flex flex-row xl:flex-col gap-4 xl:gap-0 overflow-x-auto snap-x scrollbar-hide pb-2 xl:pb-0 -mx-2 px-2 xl:mx-0 xl:px-0">
                {leaderboard.map((user, index) => (
                  <Link key={user.id} href={`/profile/${user.username}`} className="snap-child w-[240px] xl:w-full flex-shrink-0 flex items-center justify-between xl:justify-start gap-4 p-3 xl:p-4 rounded-xl border border-[var(--border)] xl:border-transparent xl:border-b-[var(--border)] xl:rounded-none xl:last:border-0 hover:bg-[var(--bg-primary)] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-[var(--text-tertiary)] w-3 text-center">{index + 1}</span>
                      <Avatar seed={user.avatar_seed} size={36} verified={(user.total_xp || 0) >= 1000} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{user.username}</p>
                        <p className="text-xs font-semibold text-[var(--accent)] mt-0.5">{user.total_xp || 0} XP</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Extra Impact Widget (Desktop Only to save mobile space) */}
            <div className="hidden xl:block bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <div className="flex items-center gap-2 mb-3">
                 <Clock className="h-4 w-4 text-emerald-500" />
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Real Time Ticker</h3>
              </div>
              <p className="text-4xl font-black font-geist tracking-tighter text-[var(--text-primary)]">
                {Math.floor(liveMinutes / 60).toLocaleString()} <span className="text-lg text-[var(--text-secondary)] font-semibold">hrs</span>
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed font-medium">Reclaimed from unnecessary manual labor by the Conduit collective.</p>
            </div>

          </div>
        </div>
      </div>
    </ResponsiveContainer>
  )
}