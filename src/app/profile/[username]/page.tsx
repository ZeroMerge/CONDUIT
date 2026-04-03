import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { 
  Flame, Star, GitFork, PlayCircle, Trophy, 
  Crown, MapPin, Calendar, FileText, 
  ExternalLink, Share2 
} from 'lucide-react'
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single() as { data: Profile | null }
  
  if (!profile) notFound()

  // 2. Fetch created flows
  const { data: createdFlows } = await supabase
    .from('flows')
    .select('*')
    .eq('creator_id', profile.id)
  
  // 3. Activity (completions)
  const { data: completions } = await supabase
    .from('completions')
    .select('completed_at')
    .eq('profile_id', profile.id)

  const createdCount = createdFlows?.length || 0
  const completionCount = completions?.length || 0
  const streak = profile.current_streak || 0
  const xp = profile.total_xp || 0

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      
      {/* ── CLEAN TACTILE PROFILE TOP ── */}
      <ResponsiveContainer section className="pt-12 pb-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Main Identity Area */}
          <div className="flex-shrink-0 relative">
             <div className="rounded-[6px] border border-[var(--border)] p-1 bg-[var(--bg-primary)] shadow-sm">
                <Avatar 
                  seed={profile.avatar_seed} 
                  size={120} 
                  verified={xp >= 1000} 
                  bg_color={profile.avatar_bg_color}
                />
             </div>
             {streak >= 3 && (
               <div className="absolute -top-2 -right-2 bg-orange-600 border border-[var(--bg-primary)] text-white p-1.5 rounded-full shadow-lg" title={`${streak} Day Streak!`}>
                 <Flame className="h-4 w-4 fill-current" />
               </div>
             )}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                    {profile.username}
                  </h1>
                  {xp >= 2000 && <Crown className="h-6 w-6 text-yellow-500 fill-current" />}
                  <span className="px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[4px] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {xp < 100 ? 'Explorer' : xp < 500 ? 'Architect' : xp < 2000 ? 'Engineer' : 'Platform Master'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wide">
                   <div className="flex items-center gap-1.5">
                     <Calendar className="h-3.5 w-3.5" />
                     Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                   </div>
                   <div className="flex items-center gap-1.5">
                     <MapPin className="h-3.5 w-3.5" />
                     Distributed System
                   </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link 
                  href={`/resume/${profile.username}`}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all"
                >
                  <FileText className="h-4 w-4" />
                  AI Resume
                </Link>
                <ProfileEditTrigger profile={profile} />
                <ProfileShareButton username={profile.username} />
              </div>
            </div>

            {profile.bio && (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl font-medium">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { label: 'Published', value: createdCount, icon: GitFork },
            { label: 'Successes', value: completionCount, icon: PlayCircle },
            { label: 'Current Streak', value: `${streak}d`, icon: Flame },
            { label: 'Level', value: Math.floor(xp / 100), icon: Star },
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] p-5 rounded-[6px] group hover:border-[var(--border-strong)] transition-all">
               <div className="flex items-start justify-between">
                 <div>
                   <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{stat.value}</p>
                 </div>
                 <stat.icon className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors opacity-40" />
               </div>
            </div>
          ))}
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          
          {/* LEFT Sidebar: Activity & Trophies */}
          <div className="lg:col-span-1 space-y-8">
            {/* Heatmap Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-6">
              <ActivityHeatmap completions={completions || []} />
            </div>
            
            {/* Milestones Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-6 flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-orange-500" />
                Milestones
              </h3>
              {xp === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-[var(--border)] rounded-[6px] opacity-40">
                   <p className="text-[10px] font-bold uppercase tracking-widest">No milestones yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                   {completionCount >= 1 && (
                     <div className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[6px]">
                       <span className="text-xl">🚀</span>
                       <div>
                         <p className="font-bold text-[var(--text-primary)] text-xs tracking-tight uppercase">Lift Off</p>
                         <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-tighter">1+ Verified Flow</p>
                       </div>
                     </div>
                   )}
                   {streak >= 3 && (
                     <div className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[6px]">
                       <span className="text-xl">🔥</span>
                       <div>
                         <p className="font-bold text-[var(--text-primary)] text-xs tracking-tight uppercase">Momentum</p>
                         <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-tighter">3 Day Streak</p>
                       </div>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT Sidebar: Showcase */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] whitespace-nowrap">Showcase</h3>
              <div className="h-px w-full bg-[var(--border)] opacity-30" />
            </div>
            
            {createdFlows && createdFlows.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {createdFlows.map(flow => (
                  <FlowCard key={flow.id} flow={flow} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-[6px] border-2 border-dashed border-[var(--border)]">
                <PlayCircle className="h-12 w-12 text-[var(--border-strong)] mx-auto mb-4 opacity-30" />
                <p className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Showcase is Empty</p>
                <p className="text-[var(--text-secondary)] mt-2 max-w-xs mx-auto text-xs font-medium opacity-60">
                   When this builder shares their verified workflows, they will appear here in a professional showcase.
                </p>
              </div>
            )}
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  )
}
