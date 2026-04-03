import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { Flame, Star, GitFork, PlayCircle, Trophy, Zap, Shield } from 'lucide-react'
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
    <ResponsiveContainer section className="animate-fade-in fade-in">
      
      {/* ── PROFILE HEADER ── */}
      <div className="relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8 bg-[var(--bg-secondary)] p-8 lg:p-10 rounded-[2rem] border border-[var(--border)] mb-10 text-center md:text-left shadow-lg">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        
        <div className="flex-shrink-0 relative z-10">
           <Avatar seed={profile.avatar_seed} size={112} verified={xp >= 1000} />
           {streak >= 3 && (
             <div className="absolute -bottom-3 -right-3 flex flex-col items-center justify-center w-12 h-12 text-xs font-black text-orange-500 bg-orange-100 dark:bg-orange-950 rounded-full border-2 border-white dark:border-[var(--bg-secondary)] shadow-lg transform rotate-12" title={`${streak} Day Streak!`}>
               <Flame className="h-5 w-5 fill-current absolute opacity-20" />
               <span className="relative z-10">{streak}</span>
             </div>
           )}
        </div>
        
        <div className="flex-1 min-w-0 relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl lg:text-4xl font-geist font-black tracking-tight text-[var(--text-primary)] mb-1">{profile.username}</h1>
              <p className="text-sm md:text-base text-[var(--text-tertiary)] flex items-center justify-center md:justify-start gap-2 font-semibold">
                 Rank: {xp < 100 ? 'Novice' : xp < 500 ? 'Apprentice' : xp < 2000 ? 'Architect' : 'Master Builder'}
                 <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                 <span className="text-[var(--accent)]">{xp} XP</span>
              </p>
            </div>
            
            {profile.is_admin && (
               <div className="inline-flex self-center md:self-start items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-widest font-black text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl shadow-sm">
                 <Shield className="h-3.5 w-3.5" /> Platform Admin
               </div>
            )}
          </div>
          
          {profile.bio && (
             <p className="text-sm md:text-base font-medium text-[var(--text-secondary)] mt-3 leading-relaxed max-w-2xl bg-[var(--bg-primary)]/50 p-4 rounded-xl border border-[var(--border)]">
               {profile.bio}
             </p>
          )}

          {/* Quick Stats Pill Row */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
            <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-2 rounded-xl text-[13px] font-bold text-[var(--text-secondary)] shadow-sm">
              <PlayCircle className="h-4 w-4 text-[var(--accent)]" /> {completionCount} Runs
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-2 rounded-xl text-[13px] font-bold text-[var(--text-secondary)] shadow-sm">
              <GitFork className="h-4 w-4 text-[var(--accent)]" /> {createdCount} Flows
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-2 rounded-xl text-[13px] font-bold text-[var(--text-secondary)] shadow-sm">
               <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> {xp} Total XP
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* ── LEFT COL: Heatmap & Trophies ── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-[2rem] shadow-sm hover:shadow-md hover:border-[var(--border-strong)] transition-all">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-5">Activity Heatmap</h3>
            <div className="-mx-6 px-6 overflow-x-auto snap-x scrollbar-hide">
              <ActivityHeatmap completions={completions || []} />
            </div>
          </div>
          
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-[2rem] shadow-sm hover:shadow-md hover:border-[var(--border-strong)] transition-all">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-5 flex items-center gap-2">
               <Trophy className="h-4 w-4 text-[var(--accent)]" /> Achievements
            </h3>
            {xp === 0 ? (
              <p className="text-sm font-medium text-[var(--text-secondary)] py-8 text-center bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)]">Earn XP to unlock badges.</p>
            ) : (
              <div className="space-y-4">
                 {completionCount >= 1 && (
                   <div className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
                     <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-xl shadow-sm border border-emerald-200 dark:border-emerald-800">🌱</div>
                     <div>
                       <p className="text-sm font-black text-[var(--text-primary)]">First Blood</p>
                       <p className="text-xs font-semibold text-[var(--text-tertiary)]">Completed 1 flow</p>
                     </div>
                   </div>
                 )}
                 {streak >= 3 && (
                   <div className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-xl rounded-full" />
                     <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-xl shadow-sm border border-orange-200 dark:border-orange-800 relative z-10">🔥</div>
                     <div className="relative z-10">
                       <p className="text-sm font-black text-[var(--text-primary)]">On Fire</p>
                       <p className="text-xs font-semibold text-[var(--text-tertiary)]">Maintained a 3-day streak</p>
                     </div>
                   </div>
                 )}
                 {createdCount >= 1 && (
                   <div className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
                     <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xl shadow-sm border border-purple-200 dark:border-purple-800">🏗️</div>
                     <div>
                       <p className="text-sm font-black text-[var(--text-primary)]">Creator</p>
                       <p className="text-xs font-semibold text-[var(--text-tertiary)]">Published a workflow</p>
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COL: Created Flows ── */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Published Workflows</h3>
            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border)]">{createdCount}</span>
          </div>
          
          {createdFlows && createdFlows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              {createdFlows.map(flow => (
                <FlowCard key={flow.id} flow={flow} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 md:py-24 bg-[var(--bg-secondary)] rounded-[2rem] border border-[var(--border)] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center mb-4 shadow-sm">
                 <GitFork className="h-6 w-6 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">No published workflows</p>
              <p className="text-sm font-medium text-[var(--text-secondary)] mt-2 max-w-sm">When {profile.username} creates and publishes a verified flow, it will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </ResponsiveContainer>
  )
}
