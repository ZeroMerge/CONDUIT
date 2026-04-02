// src/app/profile/[username]/page.tsx
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { FlowCard } from '@/components/flow-card'
import { TrustBadge } from '@/components/trust-badge'
import { ActivityHeatmap } from '@/components/activity-heatmap'
import { ProfileShareButton } from '@/components/profile-share-button'
import {
  Flame, Clock, Trophy, Star, GitFork,
  CheckCircle, Zap, Target, BarChart2, Shield, Medal, ExternalLink,
} from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────

function levelFromXp(xp: number) {
  const level = Math.floor(xp / 200) + 1
  const xpIntoLevel = xp % 200
  const pct = Math.round((xpIntoLevel / 200) * 100)
  return { level, xpIntoLevel, pct }
}

function skillLevelFromXp(xp: number) {
  const level = Math.floor(xp / 100) + 1
  const pct = xp % 100
  const label =
    level >= 10 ? 'Master'
    : level >= 7 ? 'Expert'
    : level >= 4 ? 'Advanced'
    : level >= 2 ? 'Intermediate'
    : 'Beginner'
  return { level, pct, label }
}

// SVG ring progress — r=16 → circumference ≈ 100.5
function RingProgress({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = 16
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="22" cy="22" r={r} strokeWidth="3.5" stroke="var(--bg-tertiary)" fill="none" />
      <circle
        cx="22" cy="22" r={r} strokeWidth="3.5" stroke="var(--accent)" fill="none"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
      />
    </svg>
  )
}

// ── metadata ─────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles').select('username, bio, total_xp').ilike('username', username).single()
  if (!profile) return { title: 'Profile Not Found — Conduit' }
  return {
    title: `${profile.username} — AI Builder Profile | Conduit`,
    description: profile.bio || `${profile.username} has earned ${profile.total_xp} XP building verified AI workflows on Conduit.`,
    openGraph: {
      title: `${profile.username} on Conduit`,
      description: `Verified AI workflow portfolio — ${profile.total_xp} XP earned`,
    },
  }
}

// ── page ─────────────────────────────────────────────────────

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').ilike('username', username).single()
  
  if (profileError) {
    console.error('PROFILE FETCH ERROR details:', {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      username
    })
  }
  
  if (!profile) notFound()

  const [
    { data: createdFlows },
    { data: completions },
    { data: skills },
    { count: likeCount },
  ] = await Promise.all([
    supabase.from('flows').select('*, creator:profiles(*)').eq('creator_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('completions').select('*, flow:flows(*, creator:profiles(*))').eq('user_id', profile.id).order('completed_at', { ascending: false }),
    supabase.from('user_skills').select('*').eq('user_id', profile.id).order('xp_amount', { ascending: false }),
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
  ])

  const completedFlows = completions?.filter((c) => c.flow).map((c) => c.flow) || []
  const proofShots = completions?.filter((c) => c.proof_url).map((c) => ({
    url: c.proof_url!,
    flowTitle: (c.flow as any)?.title || '',
    flowId: (c.flow as any)?.id || '',
  })) || []

  const successRate = (completions?.length ?? 0) > 0
    ? Math.round((completions!.filter((c) => c.success).length / completions!.length) * 100)
    : 0

  const hoursSaved = Math.round((profile.total_time_saved_minutes || 0) / 60)
  const { level, xpIntoLevel, pct: levelPct } = levelFromXp(profile.total_xp || 0)
  const totalForksOnCreatedFlows = createdFlows?.reduce((s, f: any) => s + (f.fork_count || 0), 0) ?? 0
  const topSkill = skills?.[0] ?? null
  const isAdmin = (profile as any).is_admin === true

  const achievements: { icon: any; label: string; sub: string; unlocked: boolean }[] = [
    { icon: Zap,       label: 'First Flow',    sub: 'Completed your first flow',        unlocked: (completions?.length ?? 0) >= 1 },
    { icon: Target,    label: 'Flow Surgeon',  sub: '100% success rate (5+ flows)',     unlocked: successRate === 100 && (completions?.length ?? 0) >= 5 },
    { icon: Flame,     label: 'On Fire',       sub: '7-day streak',                     unlocked: (profile.current_streak || 0) >= 7 },
    { icon: GitFork,   label: 'Open Source',   sub: 'Someone forked your flow',         unlocked: totalForksOnCreatedFlows >= 1 },
    { icon: Star,      label: 'Creator',       sub: 'Published a flow',                 unlocked: (createdFlows?.length ?? 0) >= 1 },
    { icon: Trophy,    label: 'Centurion',     sub: 'Earned 1,000+ XP',                 unlocked: (profile.total_xp || 0) >= 1000 },
    { icon: BarChart2, label: 'Time Lord',     sub: 'Saved 10+ hours',                  unlocked: hoursSaved >= 10 },
    { icon: Medal,     label: 'Prolific',      sub: 'Completed 10+ flows',              unlocked: (completions?.length ?? 0) >= 10 },
  ]

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="border-b border-[#1a1a1a] bg-[#050505]">
        <div className="max-w-[1120px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

            <div className="relative flex-shrink-0">
              <Avatar seed={profile.avatar_seed} size={112} verified={(profile as any).is_verified} />
              <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border-2 border-[var(--bg-secondary)] shadow">
                {level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                <h1 className="text-4xl font-semibold text-[var(--text-primary)] tracking-tight">
                  {profile.username}
                </h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--accent-border)] px-2 py-0.5 rounded-md">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>

              <p className="text-sm text-[var(--text-tertiary)] mt-1 font-medium">
                Level {level} AI Builder
                {topSkill && <span className="text-[var(--text-secondary)]"> · specialises in {topSkill.category}</span>}
              </p>

              {profile.bio && (
                <p className="text-base text-[var(--text-secondary)] mt-3 max-w-lg mx-auto md:mx-0 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* XP progress */}
              <div className="mt-6 max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  <span>Level {level}</span>
                  <span>{xpIntoLevel} / 200 XP</span>
                </div>
                <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${levelPct}%` }} />
                </div>
              </div>

              <p className="text-xs text-[var(--text-tertiary)] mt-3">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex-shrink-0">
              <ProfileShareButton username={profile.username} />
            </div>
          </div>

          {/* Stat bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-12">
            {[
              { icon: Trophy,      value: (profile.total_xp || 0).toLocaleString(), label: 'Total XP',         accent: true },
              { icon: CheckCircle, value: completions?.length ?? 0,                 label: 'Completed' },
              { icon: Target,      value: `${successRate}%`,                        label: 'Accuracy' },
              { icon: Flame,       value: profile.current_streak || 0,              label: 'Streak' },
              { icon: Clock,       value: `${hoursSaved}h`,                         label: 'Time Saved' },
              { icon: Star,        value: createdFlows?.length ?? 0,                label: 'Created' },
            ].map(({ icon: Icon, value, label, accent }) => (
              <div key={label} className={`rounded-md border p-5 transition-all duration-300 hover:border-[#2a2a2a] ${accent ? 'bg-[#0a0a0a] border-[var(--accent-border)]' : 'bg-[#0a0a0a] border-[#1a1a1a]'}`}>
                <Icon className={`h-3.5 w-3.5 mb-2 ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`} />
                <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-[var(--accent-text)]' : 'text-[var(--text-primary)]'}`}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────── */}
      <div className="max-w-[1120px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          {/* LEFT */}
          <div className="space-y-14 min-w-0">

            {/* Activity heatmap */}
            <section>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-8">
                <ActivityHeatmap completions={completions || []} />
              </div>
            </section>

            {/* Achievements */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Achievements</h2>
                <span className="text-xs text-[var(--text-tertiary)]">{unlockedCount} / {achievements.length} unlocked</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {achievements.map(({ icon: Icon, label, sub, unlocked }) => (
                  <div key={label} className={`rounded-md border p-6 text-center transition-all duration-300 ${unlocked ? 'bg-[#0a0a0a] border-[var(--accent-border)]' : 'bg-[#0a0a0a] border-[#1a1a1a] opacity-30 grayscale'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${unlocked ? 'bg-[var(--accent-subtle)]' : 'bg-[#1a1a1a]'}`}>
                      <Icon className={`h-5 w-5 ${unlocked ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`} />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">{label}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1 leading-tight font-medium">{sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Proof of Work (Pinterest Masonry Grid) */}
            {proofShots.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-5">
                  Proof of Work — {proofShots.length} screenshot{proofShots.length !== 1 ? 's' : ''}
                </h2>
                <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                  {proofShots.map((shot, i) => (
                    <Link key={i} href={`/flow/${shot.flowId}`} className="block group relative bg-[#0a0a0a] rounded-md overflow-hidden border border-[#1a1a1a] hover:border-[var(--accent)] transition-all duration-500 break-inside-avoid">
                      <img src={shot.url} alt={shot.flowTitle} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-white text-xs font-bold uppercase tracking-wider line-clamp-2 leading-tight">{shot.flowTitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Created Flows (GitHub repo style) */}
            {createdFlows && createdFlows.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-5">
                  Created Flows — {createdFlows.length}
                </h2>
                <div className="space-y-4">
                  {createdFlows.map((flow: any) => (
                    <Link key={flow.id} href={`/flow/${flow.id}`} className="group flex items-start gap-5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-6 hover:border-[var(--accent)] transition-all duration-300">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{flow.title}</span>
                          <TrustBadge status={flow.status} size="sm" />
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded text-[var(--text-secondary)]">{flow.category}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed font-medium">{flow.description}</p>
                        <div className="flex items-center gap-6 mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                          <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />{flow.completion_count}</span>
                          <span className="flex items-center gap-1.5"><GitFork className="h-3 w-3" />{flow.fork_count || 0}</span>
                          <span>{flow.estimated_minutes}M</span>
                          <span>{new Date(flow.created_at).getFullYear()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Flows */}
            {completedFlows.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-5">
                  Completed Flows — {completedFlows.length}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {completedFlows.slice(0, 6).map((flow: any) => (
                    <FlowCard key={flow.id} flow={flow} />
                  ))}
                </div>
                {completedFlows.length > 6 && (
                  <p className="text-sm text-[var(--text-tertiary)] mt-4 text-center">
                    + {completedFlows.length - 6} more flows completed
                  </p>
                )}
              </section>
            )}

            {completedFlows.length === 0 && (createdFlows?.length ?? 0) === 0 && (
              <div className="py-20 text-center">
                <p className="text-[var(--text-tertiary)] text-sm">No public activity yet.</p>
                <Link href="/explore" className="inline-block mt-4 text-sm text-[var(--accent)] hover:underline">
                  Browse flows to get started &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-8 lg:sticky lg:top-20 lg:self-start">

            {/* Skill Tree */}
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-4">Skill Tree</h2>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-8 relative overflow-hidden flex flex-col items-center min-h-[220px]">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                
                {skills && skills.length > 0 ? (
                  <div className="relative w-full flex flex-col items-center mt-2 pb-4">
                    {/* Root Node */}
                    <div className="bg-[#050505] border border-[#1a1a1a] text-[var(--text-primary)] font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-md shadow-sm z-10">
                      Core AI
                    </div>
                    
                    {/* Branches */}
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-10 mt-6 relative w-full">
                      {/* Connecting Line from root (Horizontal) */}
                      <div className="absolute -top-6 left-[15%] right-[15%] h-[1px] bg-[#1a1a1a] z-0" />
                      {/* Connecting Line from root (Vertical) */}
                      <div className="absolute -top-6 left-1/2 w-[1px] h-6 bg-[#1a1a1a] -translate-x-1/2 z-0" />
                      
                      {skills.map((skill) => {
                        const { level, pct, label } = skillLevelFromXp(skill.xp_amount)
                        const size = 96
                        
                        return (
                          <div key={skill.category} className="flex flex-col items-center relative group z-10 hover:z-20">
                            {/* Branch line */}
                            <div className="absolute -top-6 left-1/2 w-[1px] h-6 bg-[#1a1a1a] group-hover:bg-[var(--accent)] transition-colors -translate-x-1/2" />
                            
                            <div 
                              className="relative flex items-center justify-center rounded-full bg-[#050505] border border-[#1a1a1a] group-hover:border-[var(--accent)] transition-all duration-500 cursor-default"
                              style={{ width: size, height: size }}
                            >
                              <RingProgress pct={pct} size={size - 16} />
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                                <span className="text-[8px] font-bold text-[var(--accent)] uppercase tracking-widest leading-none">{label}</span>
                                <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight mt-1.5 truncate w-[85%]">{skill.category}</span>
                                <span className="text-[8px] text-[var(--text-tertiary)] mt-1.5 font-bold uppercase tracking-tighter">LVL {level}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] py-4">Complete flows to unlock skills.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-4">At a Glance</h2>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-6 space-y-4 text-xs">
                {[
                  { label: 'Flows liked',          value: likeCount ?? 0 },
                  { label: 'Forks received',        value: totalForksOnCreatedFlows },
                  { label: 'Longest streak',        value: `${profile.longest_streak || 0}d` },
                  { label: 'Avg saved / flow',      value: (completions?.length ?? 0) > 0 ? `${Math.round(hoursSaved / completions!.length)}h` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-[9px]">{label}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share CTA */}
            <div className="bg-[#0f1012] border border-[#1a1a1a] rounded-md p-6 text-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <Trophy className="h-5 w-5 text-[var(--accent)] mb-1" />
                <Link 
                  href={`/resume/${profile.username}`}
                  className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                >
                  AI Resume <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                Professional, printable view of your verified skills and completions.
              </p>
              <div className="flex justify-center pt-2">
                <ProfileShareButton username={profile.username} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
