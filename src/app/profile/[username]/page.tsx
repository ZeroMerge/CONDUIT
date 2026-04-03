import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { Flame, Star, GitFork, PlayCircle, Trophy } from 'lucide-react'
import { FlowCard } from '@/components/flow-card'
import { ActivityHeatmap } from '@/components/activity-heatmap'
import { ResponsiveContainer } from '@/components/ui/responsive-container'
import { SnapCarousel } from '@/components/ui/snap-carousel'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `${username} | Conduit` }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // 1. Fetch Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single()
  if (!profile) notFound()

  // 2. Fetch created flows
  const { data: createdFlows } = await supabase.from('flows').select('*').eq('creator_id', profile.id)
  
  // 3. Activity (completions)
  const { data: completions } = await supabase.from('completions').select('completed_at').eq('profile_id', profile.id)

  const createdCount = createdFlows?.length || 0
  const completionCount = completions?.length || 0
  const streak = profile.current_streak || 0
  const xp = profile.total_xp || 0

  return (
    <ResponsiveContainer section className="animate-fade-in">
      
      {/* ── PROFILE HEADER ── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-[var(--bg-secondary)] p-6 md:p-8 rounded-3xl border border-[var(--border)] mb-8 text-center sm:text-left">
        <div className="flex-shrink-0 relative">
           <Avatar seed={profile.avatar_seed} size={96} verified={xp >= 1000} />
           {streak >= 3 && (
             <div className="absolute -bottom-2 -right-2 bg-orange-100 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 p-1.5 rounded-full shadow-sm animate-bounce" title={`${streak} Day Streak!`}>
               <Flame className="h-5 w-5 fill-current" />
             </div>
           )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-geist font-black text-[var(--text-primary)] mb-1">{profile.username}</h1>
          <p className="text-sm md:text-base text-[var(--text-tertiary)] flex items-center justify-center sm:justify-start gap-2 font-medium">
             Rank: {xp < 100 ? 'Novice' : xp < 500 ? 'Apprentice' : xp < 2000 ? 'Architect' : 'Master Builder'}
             <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
             <span className="text-[var(--accent)]">{xp} XP</span>
          </p>

          {/* Quick Stats Pill Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 md:mt-5">
            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)]">
              <PlayCircle className="h-3.5 w-3.5" /> {completionCount} Runs
            </div>
            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)]">
              <GitFork className="h-3.5 w-3.5" /> {createdCount} Flows
            </div>
            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)]">
               <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> {xp} XP
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── LEFT COL: Heatmap & Trophies ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-5 md:p-6 rounded-2xl">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Activity Heatmap</h3>
            <div className="-mx-5 px-5 overflow-x-auto snap-x scrollbar-hide py-1">
              <ActivityHeatmap completions={completions || []} />
            </div>
          </div>
          
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-5 md:p-6 rounded-2xl">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
               <Trophy className="h-4 w-4 text-[var(--accent)]" /> Achievements
            </h3>
            {xp === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">Complete flows to earn badges.</p>
            ) : (
              <div className="space-y-3">
                 {completionCount >= 1 && <div className="flex items-center gap-3 p-2 bg-[var(--bg-secondary)] rounded-xl"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xl">🌱</div><div><p className="text-xs font-bold text-[var(--text-primary)]">First Blood</p><p className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">Completed 1 flow</p></div></div>}
                 {streak >= 3 && <div className="flex items-center gap-3 p-2 bg-[var(--bg-secondary)] rounded-xl"><div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xl">🔥</div><div><p className="text-xs font-bold text-[var(--text-primary)]">On Fire</p><p className="text-[10px] text-[var(--text-tertiary)]">3 day streak</p></div></div>}
                 {createdCount >= 1 && <div className="flex items-center gap-3 p-2 bg-[var(--bg-secondary)] rounded-xl"><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xl">🏗️</div><div><p className="text-xs font-bold text-[var(--text-primary)]">Creator</p><p className="text-[10px] text-[var(--text-tertiary)]">Published a flow</p></div></div>}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COL: Created Flows ── */}
        <div className="lg:col-span-2">
          <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Published Flows</h3>
          {createdFlows && createdFlows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {createdFlows.map(flow => (
                <FlowCard key={flow.id} flow={flow} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)]">
              <p className="text-[var(--text-primary)] font-medium">No published flows yet</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">When {profile.username} publishes a workflow, it will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </ResponsiveContainer>
  )
}
