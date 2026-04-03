import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { Flame, Star, GitFork, PlayCircle, Trophy, Crown, MapPin, Calendar } from 'lucide-react'
import { FlowCard } from '@/components/flow-card'
import { ActivityHeatmap } from '@/components/activity-heatmap'
import { ResponsiveContainer } from '@/components/ui/responsive-container'
import { ProfileEditTrigger } from '@/components/profile-edit-trigger'
import { ProfileShareButton } from '@/components/profile-share-button'
import type { Profile } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `${username} | Conduit` }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // 1. Fetch Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single() as { data: Profile | null }
  if (!profile) notFound()

  // 2. Fetch created flows
  const { data: createdFlows } = await supabase.from('flows').select('*').eq('creator_id', profile.id)
  
  // 3. Activity (completions)
  const { data: completions } = await supabase.from('completions').select('completed_at').eq('profile_id', profile.id)

  const createdCount = createdFlows?.length || 0
  const completionCount = completions?.length || 0
  const streak = profile.current_streak || 0
  const xp = profile.total_xp || 0
  const bannerColor = profile.avatar_bg_color || 'var(--accent)'

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ── EXCITING HEADER BANNER ── */}
      <div className="relative h-48 md:h-64 overflow-hidden border-b border-[var(--border)]">
        {/* Background Color/Gradient */}
        <div 
          className="absolute inset-0 transition-colors duration-700" 
          style={{ 
            backgroundColor: bannerColor,
            backgroundImage: `linear-gradient(165deg, ${bannerColor} 0%, rgba(0,0,0,0.3) 100%)`
          }} 
        />
        
        {/* Professional Tech Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: `20px 20px`
          }} 
        />

        {/* Global Lighting Effects */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

        <ResponsiveContainer className="relative h-full">
           <div className="absolute bottom-6 right-0 flex gap-2">
              <ProfileShareButton username={profile.username} />
           </div>
        </ResponsiveContainer>
      </div>

      <ResponsiveContainer section className="animate-fade-in -mt-12 md:-mt-16 relative z-10">
        
        {/* ── PROFILE BRANDING BLOCK ── */}
        <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
          {/* Large Focused Avatar */}
          <div className="flex-shrink-0 group relative">
             <div className="p-1 px-1 bg-[var(--bg-primary)] rounded-[32px] shadow-2xl border border-[var(--border)] overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
                <Avatar 
                  seed={profile.avatar_seed} 
                  size={128} 
                  verified={xp >= 1000} 
                  bg_color={profile.avatar_bg_color}
                />
             </div>
             {streak >= 3 && (
               <div className="absolute -top-2 -right-2 bg-orange-600 border-2 border-[var(--bg-primary)] text-white p-2.5 rounded-full shadow-lg ring-4 ring-orange-500/20" title={`${streak} Day Streak!`}>
                 <Flame className="h-5 w-5 fill-current animate-pulse" />
               </div>
             )}
          </div>
          
          {/* Main Identity & Actions */}
          <div className="flex-1 space-y-4 pt-12 md:pt-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-5xl font-geist font-black text-[var(--text-primary)] tracking-tight">
                    {profile.username}
                  </h1>
                  {xp >= 2000 && <Crown className="h-7 w-7 text-yellow-500 fill-yellow-500 drop-shadow-md" />}
                </div>
                <div className="flex items-center gap-3 text-lg text-[var(--text-tertiary)] font-bold">
                   <span className="px-2.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                    {xp < 100 ? 'Novice' : xp < 500 ? 'Architect' : xp < 2000 ? 'Engineer' : 'Platform Master'}
                   </span>
                   <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)] opacity-30" />
                   <span className="text-[var(--accent)] drop-shadow-sm">{xp} Experience Points</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-1">
                 <ProfileEditTrigger profile={profile} />
              </div>
            </div>

            {/* Expansive Bio */}
            {profile.bio ? (
              <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl text-lg font-medium opacity-90 italic">
                "{profile.bio}"
              </p>
            ) : (
              <p className="text-[var(--text-tertiary)] text-sm font-medium animate-pulse">
                Click Edit Profile to add a bio and complete your professional identity...
              </p>
            )}

            {/* Quick Meta Stats */}
            <div className="flex flex-wrap gap-5 pt-1 text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              <div className="flex items-center gap-2 group cursor-default">
                <Calendar className="h-4 w-4 group-hover:text-[var(--accent)] transition-colors" />
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                 <MapPin className="h-4 w-4 group-hover:text-[var(--accent)] transition-colors" /> Distributed System
              </div>
            </div>
          </div>
        </div>

        {/* ── HIGH-LEVEL PERFORMANCE METRICS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
          <div className="relative group overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] p-8 rounded-3xl text-center shadow-sm hover:border-[var(--accent-subtle)] transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-1 -translate-y-1 group-hover:opacity-10 transition-opacity">
              <GitFork className="h-16 w-16" />
            </div>
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.25em] mb-3">Published</p>
            <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{createdCount}</p>
          </div>
          <div className="relative group overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] p-8 rounded-3xl text-center shadow-sm hover:border-[var(--accent-subtle)] transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-1 -translate-y-1 group-hover:opacity-10 transition-opacity">
              <PlayCircle className="h-16 w-16" />
            </div>
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.25em] mb-3">Successes</p>
            <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{completionCount}</p>
          </div>
          <div className="relative group overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] p-8 rounded-3xl text-center shadow-sm hover:border-[var(--accent-subtle)] transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-1 -translate-y-1 group-hover:opacity-10 transition-opacity">
              <Flame className="h-16 w-16" />
            </div>
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.25em] mb-3">Streak</p>
            <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{streak}d</p>
          </div>
          <div className="relative group overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] p-8 rounded-3xl text-center shadow-sm hover:border-[var(--accent-subtle)] transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-1 -translate-y-1 group-hover:opacity-10 transition-opacity">
              <Star className="h-16 w-16" />
            </div>
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.25em] mb-3">Rank</p>
            <p className="text-4xl font-black text-[var(--accent)] tracking-tighter">{Math.floor(xp / 100)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* ── INSIGHTS & ACHIEVEMENTS ── */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-sm">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-8 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <span>Recent Pulse</span>
                <Star className="h-4 w-4 text-[var(--accent)] animate-pulse" />
               </h3>
               <div className="overflow-hidden">
                 <div className="-mx-2 overflow-x-auto scrollbar-hide py-1">
                   <ActivityHeatmap completions={completions || []} />
                 </div>
               </div>
            </div>
            
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-8 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <span>Milestones</span>
                <Trophy className="h-4 w-4 text-orange-500" />
              </h3>
              {xp === 0 ? (
                <div className="text-center py-6 opacity-50">
                   <PlayCircle className="h-10 w-10 mx-auto mb-2" />
                   <p className="text-xs font-bold uppercase tracking-widest">No Milestones</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {completionCount >= 1 && (
                     <div className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] rounded-[20px] border border-[var(--border)] group hover:border-[var(--accent)] transition-all transform hover:-translate-y-1">
                       <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl shadow-inner group-hover:bg-blue-500/20 transition-colors">🚀</div>
                       <div>
                         <p className="font-black text-[var(--text-primary)] text-sm tracking-tight uppercase">Lift Off</p>
                         <p className="text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-tighter">1+ Automation Successful</p>
                       </div>
                     </div>
                   )}
                   {streak >= 3 && (
                     <div className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] rounded-[20px] border border-[var(--border)] group hover:border-[var(--accent)] transition-all transform hover:-translate-y-1">
                       <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-2xl shadow-inner group-hover:bg-orange-500/20 transition-colors">🔥</div>
                       <div>
                         <p className="font-black text-[var(--text-primary)] text-sm tracking-tight uppercase">Momentum</p>
                         <p className="text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-tighter">Active 3 Days In A Row</p>
                       </div>
                     </div>
                   )}
                   {createdCount >= 1 && (
                     <div className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] rounded-[20px] border border-[var(--border)] group hover:border-[var(--accent)] transition-all transform hover:-translate-y-1">
                       <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl shadow-inner group-hover:bg-purple-500/20 transition-colors">📐</div>
                       <div>
                         <p className="font-black text-[var(--text-primary)] text-sm tracking-tight uppercase">Lead Architect</p>
                         <p className="text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-tighter">Published Professional Flow</p>
                       </div>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

          {/* ── SHOWCASE: PUBLISHED FLOWS ── */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] whitespace-nowrap">Showcase</h3>
              <div className="h-px w-full bg-[var(--border)] opacity-50" />
            </div>
            
            {createdFlows && createdFlows.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {createdFlows.map(flow => (
                  <FlowCard key={flow.id} flow={flow} />
                ))}
              </div>
            ) : (
              <div className="text-center py-28 bg-[var(--bg-secondary)] rounded-[3rem] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center group hover:border-[var(--accent-subtle)] transition-colors">
                <div className="relative mb-6">
                   <div className="absolute inset-0 bg-[var(--accent)] blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity" />
                   <PlayCircle className="h-16 w-16 text-[var(--border-strong)] relative z-10" />
                </div>
                <p className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Showcase is Empty</p>
                <p className="text-[var(--text-secondary)] mt-3 max-w-xs px-6 font-medium leading-relaxed opacity-60">
                   When this builder shares their verified workflows, they will appear here in a professional, HR-ready showcase.
                </p>
              </div>
            )}
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  )
}
