// src/app/profile/[username]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  Github, Twitter, Globe, MapPin, 
  ArrowUpRight, Award, Trophy, Shield, 
  ExternalLink, Mail, Share2, Info,
  Flame, BarChart3, Database, Workflow,
  Building2, Users, Zap, Link as LinkIcon,
  Youtube, Linkedin, Instagram, AtSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'User Not Found' }

  return {
    title: `${profile.full_name || profile.username} (@${profile.username}) | Conduit`,
    description: `View ${profile.full_name || profile.username}'s developer profile and contributions on Conduit.`,
  }
}

function getTier(trustScore: number = 0) {
  if (trustScore >= 1000) return { name: 'Conduit Overseer', icon: Trophy, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  if (trustScore >= 500) return { name: 'System Lead', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
  if (trustScore >= 100) return { name: 'Elite Architect', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  return { name: 'Core Contributor', icon: Info, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
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
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      flows:flows (
        id,
        title,
        description,
        is_published,
        category,
        nodes
      ),
      completions:completions (
        id,
        completed_at,
        flow_id
      )
    `)
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Cast to custom Profile type to handle Json -> Typed Array conversion
  const p = profile as any as Profile
  const flows = (p.flows || []) as any[]
  const completions = (p.completions || []) as any[]

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isOwner = currentUser?.id === p.id
  
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
      {/* 1. Sticky Navigation Header */}
      <div className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)] overflow-hidden transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-4 overflow-hidden">
             <div className="md:hidden">
               <Avatar seed={p.avatar_seed} size={32} bg_color={p.avatar_bg_color} className="shadow-lg shadow-[var(--accent)]/5" />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] truncate">
               Identity // <span className="text-[var(--text-primary)]">@{p.username}</span>
             </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2.5 hover:bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border)] text-[var(--text-tertiary)] transition-all active:scale-95 group">
              <Share2 className="h-4 w-4 group-hover:text-[var(--accent)] transition-colors" />
            </button>
            {isOwner ? (
               <ProfileEditTrigger profile={p} />
            ) : (
               <button className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[10px] font-black uppercase tracking-widest rounded-[6px] transition-all shadow-xl shadow-[var(--accent)]/10 active:scale-95">
                 Follow +
               </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8 lg:py-16">
        <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-8 lg:gap-16">
          
          {/* LEFT COLUMN: IDENTITY (Fluid on Tablet, Fixed on Desktop) */}
          <aside className="space-y-8 group lg:sticky lg:top-24 h-fit">
            {/* 2. Identity Header: Responsive Left-Aligned Layout */}
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-5 lg:gap-8">
              <div className="relative isolate group/avatar shrink-0">
                <Avatar 
                   seed={p.avatar_seed} 
                   size={320} 
                   bg_color={p.avatar_bg_color} 
                   verified={p.is_verified}
                   className="w-[84px] h-[84px] sm:w-[120px] sm:h-[120px] lg:w-[280px] lg:h-[280px] xl:w-[320px] xl:h-[320px] rounded-full shadow-2xl transition-all duration-700 group-hover/avatar:scale-[1.02] ring-4 lg:ring-8 ring-[var(--bg-secondary)]/50" 
                />
              </div>

              <div className="flex-1 min-w-0 py-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--text-primary)] leading-tight truncate">
                  {p.full_name || p.username}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-[var(--text-tertiary)] truncate">
                  @{p.username}
                </p>
                
                {/* Growth Stats: Visible only in row on Mobile, then in list on Desktop if desired */}
                <div className="flex items-center gap-4 mt-3 lg:hidden">
                   <div className="flex items-center gap-1 hover:text-[var(--accent)] cursor-pointer transition-colors group/stat">
                     <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)] group-hover/stat:text-[var(--accent)]" />
                     <span className="text-[11px] font-black text-[var(--text-primary)]">124</span>
                     <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter">Followers</span>
                   </div>
                   <div className="flex items-center gap-1 hover:text-[var(--accent)] cursor-pointer transition-colors group/stat">
                     <span className="text-[11px] font-black text-[var(--text-primary)]">82</span>
                     <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter">Following</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Set Status/Bio Area */}
            <div className="space-y-4 pt-2">
              {p.bio && (
                <p className="text-[14px] font-medium leading-[1.6] text-[var(--text-secondary)] border-l-2 border-[var(--border)] lg:border-l-0 lg:border-t lg:pt-4 pl-4 lg:pl-0 py-1 italic tracking-tight opacity-90">
                  {p.bio}
                </p>
              )}
              <div className="flex justify-start">
                   <div className={cn(
                     "px-6 py-2 rounded-full border shadow-2xl backdrop-blur-xl flex items-center gap-2.5 transition-all duration-500 scale-100 hover:scale-105 active:scale-95",
                     tier.bg, tier.border
                   )}>
                     <tier.icon className={cn("h-4 w-4", tier.color)} />
                     <span className={cn("text-[10px] font-black uppercase tracking-[0.15em]", tier.color)}>
                       {tier.name}
                     </span>
                   </div>
                </div>
              </div>


            {/* Social Metadata Grid (Horizontal on Mobile, Vertical on Desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-6 pt-4 border-t border-[var(--border)]">
              {p.company && (
                <div className="flex items-center gap-3 text-[var(--text-secondary)] group/item cursor-default">
                  <Building2 className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                  <span className="text-[12px] font-black tracking-tight">{p.company}</span>
                </div>
              )}
              {p.location && (
                <div className="flex items-center gap-3 text-[var(--text-secondary)] group/item cursor-default">
                  <MapPin className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                  <span className="text-[12px] font-bold tracking-tight">{p.location}</span>
                </div>
              )}
              {p.website_url && (
                <a 
                  href={p.website_url.startsWith('http') ? p.website_url : `https://${p.website_url}`}
                  target="_blank"
                  className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all group/item overflow-hidden"
                >
                  <Globe className="h-4 w-4 text-[var(--text-tertiary)] shrink-0 group-hover:rotate-12 transition-transform" />
                  <span className="text-[12px] font-extrabold tracking-tighter truncate">{p.website_url.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {socialLinks.map((social, idx) => {
                 const Icon = getSocialIcon(social.url)
                 return (
                   <a 
                     key={idx}
                     href={social.url.startsWith('http') ? social.url : `https://${social.url}`}
                     target="_blank"
                     className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all group/item overflow-hidden"
                   >
                     <Icon className="h-4 w-4 text-[var(--text-tertiary)] shrink-0 group-hover:scale-110 transition-transform" />
                     <span className="text-[12px] font-extrabold tracking-tighter truncate">
                       {social.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                     </span>
                   </a>
                 )
              })}
            </div>

            {/* Profile Strength - Compact on Mobile */}
            {isOwner && strength < 100 && (
              <div className="p-8 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] rounded-[6px] border border-[var(--border)] shadow-xl shadow-[var(--accent)]/5 space-y-5 transition-transform hover:scale-[1.02]">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Character Strength</h4>
                    <span className="text-[11px] font-black text-[var(--accent)]">{strength}%</span>
                 </div>
                 <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden shadow-inner border border-[var(--border)]">
                   <div className="h-full bg-[var(--accent)] transition-all duration-1000 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" style={{ width: `${strength}%` }} />
                 </div>
                 <p className="text-[10px] font-bold text-[var(--text-tertiary)] leading-relaxed italic opacity-80">
                   Complete your identity to reach top tier status.
                 </p>
              </div>
            )}
            {/* Growth Stats: Desktop List View */}
            <div className="hidden lg:flex flex-col gap-3 py-4 border-y border-[var(--border)] group/stats">
              <div className="flex items-center gap-3 hover:bg-[var(--bg-tertiary)] p-2 rounded-[6px] cursor-pointer transition-all">
                <div className="p-1.5 bg-[var(--bg-tertiary)] rounded-[4px] border border-[var(--border)]">
                  <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-[var(--text-primary)]">124</span>
                  <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Followers</span>
                </div>
              </div>
              <div className="flex items-center gap-3 hover:bg-[var(--bg-tertiary)] p-2 rounded-[6px] cursor-pointer transition-all">
                <div className="p-1.5 bg-[var(--bg-tertiary)] rounded-[4px] border border-[var(--border)]">
                  <Zap className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-[var(--text-primary)]">82</span>
                  <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Following</span>
                </div>
              </div>
            </div>

            {/* Achievements Showcase */}
            <div className="space-y-4 py-2">
              <h4 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.25em]">Achievements</h4>
              <div className="flex flex-wrap gap-3">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-[var(--border)] flex items-center justify-center relative group/badge shadow-sm hover:shadow-md transition-all active:scale-95 cursor-help" title="YOLO: Deployed to production on a Friday">
                    <span className="text-xs font-black text-pink-500 scale-125">👋</span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 border border-[var(--bg-primary)] flex items-center justify-center">
                       <span className="text-[7px] font-black text-white">x1</span>
                    </div>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-[var(--border)] flex items-center justify-center relative group/badge shadow-sm hover:shadow-md transition-all active:scale-95 cursor-help" title="Conduit Master: Created over 50 flows">
                    <span className="text-xs font-black text-emerald-500 scale-125">⚡</span>
                 </div>
                 <div className="w-12 h-12 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center group/badge opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help" title="System Architect: Coming Soon">
                    <Trophy className="h-4 w-4 text-[var(--text-tertiary)]" />
                 </div>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: MAIN CONTENT - Premium Density */}
          <div className="space-y-16">
            
            {/* Quick Stats Grid - High Density Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group/stat relative overflow-hidden active:scale-95">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Systems</p>
                  <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter group-hover/stat:scale-105 transition-transform origin-left">{flows.length}</p>
                  <Workflow className="absolute bottom-6 right-6 h-10 w-10 text-[var(--border)] opacity-10 group-hover/stat:rotate-12 transition-transform" />
               </div>
               <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group/stat relative overflow-hidden active:scale-95">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Completions</p>
                  <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter group-hover/stat:scale-105 transition-transform origin-left">{completions.length}</p>
                  <Flame className="absolute bottom-6 right-6 h-10 w-10 text-[var(--border)] opacity-10 group-hover/stat:scale-110 transition-transform" />
               </div>
               <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group/stat relative overflow-hidden active:scale-95">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Trust Score</p>
                  <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter group-hover/stat:scale-105 transition-transform origin-left">{p.trust_score || 0}</p>
                  <Shield className="absolute bottom-6 right-6 h-10 w-10 text-[var(--border)] opacity-10 group-hover/stat:rotate-12 transition-transform" />
               </div>
            </div>

            {/* Overview Section - Goldmine Content */}
            <section className="space-y-8">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-[var(--bg-tertiary)] rounded-[8px] border border-[var(--border)] shadow-sm">
                      <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]">System Overview</h3>
                 </div>
                 <Link href={`/profile/${p.username}/portfolio`} className="group flex items-center gap-3 px-5 py-2.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all outline-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors">Builders portfolio</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </Link>
               </div>

               <div className={cn(
                 "bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-1.5 shadow-xl transition-all",
                 !p.readme_markdown && "bg-transparent border-dashed opacity-60"
               )}>
                 <div className={cn(
                    "bg-[var(--bg-primary)] rounded-[4px] p-8 sm:p-12 prose prose-invert max-w-none prose-sm sm:prose-base prose-p:leading-[1.8] prose-p:text-[var(--text-secondary)] prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-[var(--text-primary)] prose-a:text-[var(--accent)] hover:prose-a:underline prose-img:rounded-[8px] shadow-inner",
                    !p.readme_markdown && "flex flex-col items-center justify-center min-h-[300px]"
                 )}>
                   {p.readme_markdown ? (
                     <ReactMarkdown>{p.readme_markdown}</ReactMarkdown>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 group/readme">
                        <div className="p-10 rounded-full border border-[var(--border)] group-hover/readme:border-[var(--accent)] group-hover/readme:bg-[var(--accent)]/5 transition-all duration-700 ease-out">
                          <Database className="h-12 w-12 text-[var(--border)] group-hover/readme:text-[var(--accent)] group-hover/readme:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--text-tertiary)] group-hover/readme:text-[var(--text-primary)] transition-colors">Identity Data Missing</p>
                          <p className="text-[11px] font-bold text-[var(--text-tertiary)] max-w-xs leading-relaxed">Add a profile README to showcase your expertise and attract fellow architects.</p>
                        </div>
                     </div>
                   )}
                 </div>
               </div>
            </section>

            {/* Pinned Systems Grid - Refined Card Logic */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-[var(--bg-tertiary)] rounded-[8px] border border-[var(--border)]">
                   <Workflow className="h-4 w-4 text-emerald-500" />
                 </div>
                 <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]">Pinned Systems</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {pinnedFlows.length > 0 ? pinnedFlows.map((flow: any) => (
                  <Link 
                    key={flow.id} 
                    href={`/flow/${flow.id}`}
                    className="group/card block bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-6 hover:border-[var(--accent)] hover:shadow-[0_20px_50px_rgba(var(--accent-rgb),0.05)] hover:-translate-y-1.5 transition-all relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between mb-5">
                       <h4 className="text-[13px] font-black text-[var(--text-primary)] group-hover/card:text-[var(--accent)] transition-colors truncate pr-6 leading-tight">
                         {flow.title}
                       </h4>
                       <div className="px-3 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] group-hover/card:border-[var(--accent)]/30 group-hover/card:text-[var(--accent)] transition-all">
                         {flow.category || 'System'}
                       </div>
                    </div>
                    <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-2 h-10 mb-6 opacity-80">
                      {flow.description || 'No description provided for this system architecture.'}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] group-hover/card:border-[var(--accent)]/10 transition-colors">
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                         <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.05em]">Build Active</span>
                       </div>
                       <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)] opacity-40 group-hover/card:opacity-100 group-hover/card:text-[var(--accent)] transition-all" />
                    </div>
                    {/* Subtle corner accent */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--accent)] opacity-0 group-hover/card:opacity-5 transition-opacity clip-path-polygon-[100%_0,100%_100%,0_0]" />
                  </Link>
                )) : (
                  <div className="col-span-full py-20 border border-dashed border-[var(--border)] rounded-[6px] flex flex-col items-center justify-center space-y-6 opacity-40 hover:opacity-100 hover:border-[var(--accent)] transition-all cursor-default">
                     <Workflow className="h-10 w-10 text-[var(--border)]" />
                     <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-tertiary)]">No Systems pinned by architect</p>
                  </div>
                )}
              </div>
            </section>

            {/* Activity Heatmap Overflow - Tactile Box */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-6 sm:p-10 shadow-xl relative overflow-hidden group/heatmap">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/heatmap:opacity-10 transition-opacity">
                 <BarChart3 className="h-32 w-32 rotate-12" />
               </div>
               <ActivityHeatmap completions={completions} />
            </section>
            
          </div>
        </div>
      </div>
    </main>
  )
}
