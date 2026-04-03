// src/app/profile/[username]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  Github, Twitter, Globe, MapPin, 
  ArrowUpRight, Award, Trophy, Shield, 
  ExternalLink, Mail, Share2, Info,
  Flame, BarChart3, Database, Workflow,
  Building2, Users, Zap, Link as LinkIcon, ShieldCheck,
  Youtube, Linkedin, Instagram, AtSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { FollowButton } from '@/components/follow-button'
import { ProfileEditTrigger } from '@/components/profile-edit-trigger'
import { ActivityHeatmap } from '@/components/activity-heatmap'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username')
    .ilike('username', username)
    .maybeSingle()

  if (error || !profile) return { title: 'User Not Found' }

  return {
    title: `${profile.username} | Conduit`,
    description: `View ${profile.username}'s developer profile and contributions on Conduit.`,
  }
}

function getTier(trustScore: number = 0) {
  if (trustScore >= 1000) return { name: 'Conduit Overseer', icon: Trophy, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  if (trustScore >= 500) return { name: 'System Lead', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
  if (trustScore >= 100) return { name: 'Elite Architect', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  return { name: 'Core Contributor', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
}

function getSocialIcon(url: string) {
  const lowercase = url.toLowerCase()
  if (lowercase.includes('twitter.com') || lowercase.includes('x.com')) return Twitter
  if (lowercase.includes('github.com')) return Github
  if (lowercase.includes('linkedin.com')) return Linkedin
  if (lowercase.includes('youtube.com')) return Youtube
  if (lowercase.includes('instagram.com')) return Instagram
  if (lowercase.includes('threads.net')) return AtSign
  return LinkIcon
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username: rawUsername } = await params
  const username = rawUsername.toLowerCase().trim()
  const supabase = await createClient()
  
  // High-resilience query: only select basic columns first, then expand
  // This prevents the entire page from 404ing if a newly added column (like 'is_verified') is missing in the DB
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      flows:flows (
        id,
        title,
        description,
        status,
        category
      ),
      completions:completions (
        id,
        completed_at,
        flow_id
      )
    `)
    .ilike('username', username)
    .maybeSingle()

  if (error) {
    console.error(`[Profile] Query error for ${username}:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
  }

  if (profile) {
    console.log(`[Profile] Fetched identity for @${username}:`, {
      id: profile.id,
      is_verified: profile.is_verified,
      trust_score: profile.trust_score,
      flows_count: profile.flows?.length,
      completions_count: profile.completions?.length
    })
  } else {
    console.warn(`[Profile] No identity record found for @${username}. Redirecting to 404.`)
    notFound()
  }

  // Cast to custom Profile type to handle Json -> Typed Array conversion
  const p = profile as any as Profile
  const flows = (p.flows || []) as any[]
  const completions = (p.completions || []) as any[]

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isOwner = currentUser?.id === p.id

  // Stats fetching
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', p.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', p.id)

  const { data: followRecord } = currentUser 
    ? await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', p.id)
        .maybeSingle()
    : { data: null }

  const isFollowing = !!followRecord
  
  const tier = getTier(p.trust_score || 0)
  const strength = Math.round(
    ((p.bio ? 20 : 0) + 
     (p.location ? 10 : 0) + 
     (p.company ? 5 : 0) + 
     (p.website_url ? 20 : 0) + 
     ((p.social_links?.length || 0) > 0 ? 15 : 0) + 
     ((p.pinned_flow_ids?.length || 0) > 0 ? 10 : 0) + 
     (p.readme_markdown ? 30 : 0))
  )

  // Explicit Pinned Selection logic
  const pinnedIds = p.pinned_flow_ids || []
  const pinnedFlows = pinnedIds.length > 0
    ? flows.filter(f => pinnedIds.includes(f.id))
      .sort((a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id))
    : flows.filter(f => f.is_published).slice(0, 6)

  const socialLinks = (p.social_links || []) as { platform: string; url: string }[]

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pb-20 selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      {/* 1. COMPACT STICKY HEADER - Fix Mobile Overcrowding */}
      <div className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)] overflow-hidden transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="sm:hidden">
               <Avatar seed={p.avatar_seed} size={28} bg_color={p.avatar_bg_color} className="shadow-lg shadow-[var(--accent)]/5" />
             </div>
             <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] truncate">
               <span className="hidden sm:inline">Identity // </span><span className="text-[var(--text-primary)]">@{p.username}</span>
             </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border)] text-[var(--text-tertiary)] transition-all active:scale-95 group" title="Share Identity">
              <Share2 className="h-3.5 w-3.5 group-hover:text-[var(--accent)] transition-colors" />
            </button>
            {!isOwner && (
               <FollowButton targetUserId={p.id} initialIsFollowing={isFollowing} />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 lg:py-12">
        {/* Tighter grid: Sidebar stays narrow but readable */}
        <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-8 lg:gap-12 xl:gap-16">
          
          {/* LEFT COLUMN: TACTILE SIDEBAR (Sticky on Desktop) */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
            
            {/* 2. IDENTITY BLOCK: Mobile-First Responsive Layout */}
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-6">
              <div className="shrink-0 relative group/avatar">
                <Avatar 
                   seed={p.avatar_seed} 
                   size={300} 
                   bg_color={p.avatar_bg_color} 
                   verified={p.is_verified}
                   className="w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] lg:w-[280px] lg:h-[280px] xl:w-[300px] xl:h-[300px] rounded-full border-[1.5px] border-[var(--border)] shadow-2xl transition-all duration-700 group-hover/avatar:scale-[1.02] bg-[var(--bg-secondary)]" 
                />
              </div>

              <div className="flex-1 min-w-0 py-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-primary)] leading-tight truncate tracking-tight">
                  {p.full_name || p.username}
                </h1>
                <p className="text-sm lg:text-base font-bold text-[var(--text-tertiary)] truncate opacity-80">
                  @{p.username}
                </p>
                
                <div className="flex items-center gap-3.5 mt-3 lg:hidden">
                   <div className="flex items-center gap-1.5 hover:text-[var(--accent)] cursor-pointer transition-colors group/stat">
                     <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)] group-hover/stat:text-[var(--accent)]" />
                     <span className="text-[11px] font-black text-[var(--text-primary)]">{followerCount || 0}</span>
                     <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-tighter opacity-60">Followers</span>
                   </div>
                   <div className="flex items-center gap-1.5 hover:text-[var(--accent)] cursor-pointer transition-colors group/stat">
                     <Zap className="h-3.5 w-3.5 text-[var(--text-tertiary)] group-hover/stat:text-[var(--accent)]" />
                     <span className="text-[11px] font-black text-[var(--text-primary)]">{followingCount || 0}</span>
                     <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-tighter opacity-60">Following</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Edit Button Primary Location (Sidebar Desktop, Hero Mobile) */}
            {isOwner && (
              <div className="pt-2">
                <ProfileEditTrigger profile={p} />
              </div>
            )}

            {/* Bio & Tier Area */}
            <div className="space-y-4 pt-1">
              {p.bio && (
                <p className="text-[13px] font-medium leading-[1.6] text-[var(--text-secondary)] border-l-2 border-[var(--border)] lg:border-l-0 lg:border-t lg:pt-4 pl-4 lg:pl-0 italic tracking-tight">
                  {p.bio}
                </p>
              )}
              <div className="flex justify-start">
                   <div className={cn(
                     "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent-text)] text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]",
                     tier.color
                   )}>
                     <tier.icon className="h-3 w-3 fill-current" />
                     {tier.name}
                   </div>
                </div>
              </div>

            {/* Desktop Growth Stats List */}
            <div className="hidden lg:flex flex-col gap-1.5 py-4 border-y border-[var(--border)] group/stats">
              <div className="flex items-center gap-2.5 hover:bg-[var(--bg-tertiary)] p-2 rounded-[6px] cursor-pointer transition-all border border-transparent hover:border-[var(--border)] group/item">
                <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)] group-hover/item:text-[var(--accent)] transition-colors" />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-[var(--text-primary)]">{followerCount || 0}</span>
                  <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest opacity-60">Followers</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 hover:bg-[var(--bg-tertiary)] p-2 rounded-[6px] cursor-pointer transition-all border border-transparent hover:border-[var(--border)] group/item">
                <Zap className="h-3.5 w-3.5 text-[var(--text-tertiary)] group-hover/item:text-[var(--accent)] transition-colors" />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-[var(--text-primary)]">{followingCount || 0}</span>
                  <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest opacity-60">Following</span>
                </div>
              </div>
            </div>

            {/* Core Stats Integration (Moved from Hero) */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 pt-1">
              <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border)] rounded-[6px] p-3 shadow-sm hover:border-[var(--accent)]/40 transition-all group/s">
                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Systems</p>
                <p className="text-xl font-black text-[var(--text-primary)] tracking-tighter group-hover/s:text-[var(--accent)] transition-colors">{flows.length}</p>
              </div>
              <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border)] rounded-[6px] p-3 shadow-sm hover:border-emerald-500/40 transition-all group/s">
                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Done</p>
                <p className="text-xl font-black text-[var(--text-primary)] tracking-tighter group-hover/s:text-emerald-500 transition-colors">{completions.length}</p>
              </div>
              <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border)] rounded-[6px] p-3 shadow-sm hover:border-purple-500/40 transition-all group/s">
                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Trust</p>
                <p className="text-xl font-black text-[var(--text-primary)] tracking-tighter group-hover/s:text-purple-500 transition-colors">{p.trust_score || 0}</p>
              </div>
            </div>

            {/* Social Links Grid */}
            <div className="grid grid-cols-1 gap-y-3 pt-2">
              {p.company && (
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Building2 className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                  <span className="text-[12px] font-bold tracking-tight truncate">{p.company}</span>
                </div>
              )}
              {p.location && (
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                  <span className="text-[12px] font-bold tracking-tight truncate">{p.location}</span>
                </div>
              )}
              {p.website_url && (
                <a 
                  href={p.website_url.startsWith('http') ? p.website_url : `https://${p.website_url}`}
                  target="_blank"
                  className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all group/url overflow-hidden"
                >
                  <Globe className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0 transition-transform" />
                  <span className="text-[12px] font-bold tracking-tight truncate border-b border-transparent hover:border-[var(--accent)]/50">{p.website_url.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {socialLinks.map((social, idx) => {
                   const Icon = getSocialIcon(social.url)
                   return (
                     <a 
                       key={idx}
                       href={social.url.startsWith('http') ? social.url : `https://${social.url}`}
                       target="_blank"
                       className="p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all active:scale-95"
                       title={social.url}
                     >
                       <Icon className="h-3.5 w-3.5" />
                     </a>
                   )
                })}
              </div>
            </div>

            {/* Achievements Showcase (Compact) */}
            <div className="space-y-3 py-2">
              <h4 className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] opacity-60">Status Medals</h4>
              <div className="flex flex-wrap gap-2.5">
                 <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center relative group/badge shadow-sm hover:scale-105 transition-all text-sm" title="Early Bird">
                    👋
                 </div>
                 <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center relative group/badge shadow-sm hover:scale-105 transition-all text-sm" title="System Lead">
                    ⚡
                 </div>
                 <div className="w-10 h-10 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center group/badge opacity-40 hover:opacity-80 transition-all">
                    <Trophy className="h-3 w-3 text-[var(--text-tertiary)]" />
                 </div>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: MAIN CONTENT - Goldmine Content */}
          <div className="space-y-12">
            
            {/* Overview Section */}
            <section className="space-y-6">
               <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border)]">
                      <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]">System Overview</h3>
                 </div>
                 <Link href={`/resume/${p.username}`} className="group flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors">Resume</span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                 </Link>
               </div>

               <div className={cn(
                 "bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-1 shadow-2xl transition-all",
                 !p.readme_markdown && "bg-transparent border-dashed opacity-50"
               )}>
                 <div className={cn(
                    "bg-[var(--bg-primary)] rounded-[4px] p-6 sm:p-10 prose prose-invert max-w-none prose-sm prose-p:leading-[1.7] prose-p:text-[var(--text-secondary)] prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-[var(--text-primary)] prose-a:text-[var(--accent)] prose-img:rounded-[6px]",
                    !p.readme_markdown && "flex flex-col items-center justify-center min-h-[240px]"
                 )}>
                   {p.readme_markdown ? (
                     <ReactMarkdown>{p.readme_markdown}</ReactMarkdown>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 group/readme">
                        <div className="p-8 rounded-full border border-[var(--border)] group-hover/readme:border-[var(--accent)] transition-all duration-500">
                          <Database className="h-8 w-8 text-[var(--border)] group-hover/readme:text-[var(--accent)]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Architecture Empty</p>
                          <p className="text-[9px] font-bold text-[var(--text-tertiary)] max-w-xs leading-relaxed opacity-60">Add a README to showcase your expertise.</p>
                        </div>
                     </div>
                   )}
                 </div>
               </div>
            </section>

            {/* Pinned Systems Grid */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                 <div className="p-2 bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border)]">
                   <Workflow className="h-3.5 w-3.5 text-emerald-500" />
                 </div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]">Pinned System Architectures</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {pinnedFlows.length > 0 ? pinnedFlows.map((flow: any) => (
                  <Link 
                    key={flow.id} 
                    href={`/flow/${flow.id}`}
                    className="group/card block bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-5 hover:border-[var(--accent)]/50 hover:shadow-xl transition-all relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between mb-4">
                       <h4 className="text-[12px] font-black text-[var(--text-primary)] group-hover/card:text-[var(--accent)] transition-colors truncate pr-4 leading-tight">
                         {flow.title}
                       </h4>
                       <div className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)] whitespace-nowrap">
                         {flow.category || 'System'}
                       </div>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-2 h-9 mb-4 opacity-70">
                      {flow.description || 'Verified architectural pattern for automated system operations.'}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                         <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-tight">Active Pattern</span>
                       </div>
                       <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)] opacity-30 group-hover/card:text-[var(--accent)] group-hover/card:opacity-100 transition-all" />
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-full py-16 border border-dashed border-[var(--border)] rounded-[6px] flex flex-col items-center justify-center space-y-4 opacity-30">
                     <Workflow className="h-8 w-8 text-[var(--border)]" />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No Systems pinned</p>
                  </div>
                )}
              </div>
            </section>

            {/* Activity Heatmap */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-6 shadow-xl relative overflow-hidden group/heatmap">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/heatmap:opacity-[0.06] transition-opacity">
                 <BarChart3 className="h-24 w-24 rotate-12" />
               </div>
               <ActivityHeatmap completions={completions} />
            </section>
            
          </div>
        </div>
      </div>
    </main>
  )
}
