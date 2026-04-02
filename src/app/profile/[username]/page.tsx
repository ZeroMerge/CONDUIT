// src/app/profile/[username]/page.tsx
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { FlowCard } from '@/components/flow-card'
import type { Profile } from '@/types'
import { TrustBadge } from '@/components/trust-badge'
import { ActivityHeatmap } from '@/components/activity-heatmap'
import { ProfileShareButton } from '@/components/profile-share-button'
import { AvatarColorPicker } from '@/components/avatar-color-picker'
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

  // Get current user session
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').ilike('username', username).single() as unknown as { data: Profile | null, error: any }
  
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
  const isOwnProfile = currentUser?.id === profile.id

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
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-[1120px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

            <div className="relative flex-shrink-0">
              <Avatar seed={profile.avatar_seed} size={112} verified={(profile as any).is_verified} backgroundColor={profile.avatar_bg_color} />
              <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-[var(--bg-secondary)] shadow-lg ring-2 ring-[var(--accent)]">
                {level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  {profile.username}
                </h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--accent-border)] px-2 py-0.5 rounded">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Level {level} AI Builder
                {topSkill && <span> · specialises in {topSkill.category}</span>}
              </p>

              {profile.bio && (
                <p className="text-sm text-[var(--text-secondary)] mt-4 max-w-lg mx-auto md:mx-0">
                  {profile.bio}
                </p>
              )}

              {isOwnProfile && <AvatarColorPicker currentBackgroundColor={profile.avatar_bg_color} profileId={profile.id} />}

              {/* XP progress */}
              <div className="mt-8 max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  <span>Level {level}</span>
                  <span>{xpIntoLevel} / 200 XP</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${levelPct}%` }} />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex gap-2">
              <ProfileShareButton username={profile.username} />
              <Link href={`/resume/${profile.username}`} className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium px-4 py-2 rounded hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2 shadow-sm">
                <Trophy className="h-4 w-4 text-[var(--accent)]" /> AI Resume
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────── */}
      <div className="max-w-[1120px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          {/* LEFT */}
          <div className="space-y-12">

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Trophy, value: (profile.total_xp || 0).toLocaleString(), label: 'Total XP' },
                { icon: CheckCircle, value: completions?.length ?? 0, label: 'Flows Run' },
                { icon: Target, value: `${successRate}%`, label: 'Accuracy' },
                { icon: Clock, value: `${hoursSaved}h`, label: 'Time Saved' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-4 shadow-sm hover:border-[var(--accent)] transition-colors group">
                  <Icon className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors mb-2" />
                  <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
                </div>
              ))}
            </div>

            {/* Activity heatmap */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Activity</h2>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 shadow-sm overflow-x-auto">
                <ActivityHeatmap completions={completions || []} />
              </div>
            </section>

            {/* Proof of Work */}
            {proofShots.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Proof of Work</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {proofShots.map((shot, i) => (
                    <Link key={i} href={`/flow/${shot.flowId}`} className="group relative aspect-video bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-sm">
                      <img src={shot.url} alt={shot.flowTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest">{shot.flowTitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Created Flows */}
            {createdFlows && createdFlows.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Created Flows</h2>
                <div className="space-y-4">
                  {createdFlows.map((flow: any) => (
                    <Link key={flow.id} href={`/flow/${flow.id}`} className="block bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--accent)] transition-all shadow-sm group">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{flow.title}</h3>
                        <TrustBadge status={flow.status} size="sm" />
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{flow.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {flow.completion_count}</span>
                        <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> {flow.fork_count || 0}</span>
                        <span>{flow.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-8">
            {/* Skill Tree */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Skill Tree</h2>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 shadow-sm">
                {skills && skills.length > 0 ? (
                  <div className="space-y-6">
                    {skills.map((skill) => {
                      const { level, pct, label } = skillLevelFromXp(skill.xp_amount)
                      return (
                        <div key={skill.category} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">{label}</p>
                              <p className="text-xs font-bold text-[var(--text-primary)]">{skill.category}</p>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Lvl {level}</span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No skills unlocked yet.</p>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Achievements</h2>
              <div className="grid grid-cols-4 gap-2">
                {achievements.map(({ icon: Icon, label, unlocked }) => (
                  <div 
                    key={label} 
                    className={`aspect-square rounded flex items-center justify-center border ${
                      unlocked ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent)]' : 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-tertiary)] opacity-30'
                    }`}
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
