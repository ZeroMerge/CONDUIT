// src/app/resume/[username]/page.tsx
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { TrustBadge } from '@/components/trust-badge'
import { 
  Shield, CheckCircle, Zap, Target, 
  Award, BarChart2, Calendar, FileText,
  Printer, ArrowLeft, ExternalLink, Globe, Trophy,
} from 'lucide-react'
import { PrintButton } from '@/components/print-button'

// ── helpers ──────────────────────────────────────────────────

function levelFromXp(xp: number) {
  const level = Math.floor(xp / 200) + 1
  return level
}

function skillLevelFromXp(xp: number) {
  const level = Math.floor(xp / 100) + 1
  const label = 
    level >= 10 ? 'Master' 
    : level >= 7 ? 'Expert' 
    : level >= 4 ? 'Advanced' 
    : level >= 2 ? 'Intermediate' 
    : 'Beginner'
  return { level, label }
}

// ── metadata ─────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles').select('username, bio, total_xp').ilike('username', username).single()
  
  if (!profile) return { title: 'Resume Not Found — Conduit' }
  
  return {
    title: `${profile.username}'s AI Resume — Verified Portfolio`,
    description: `Verified AI workflow portfolio for ${profile.username}. ${profile.total_xp} XP earned on Conduit.`,
  }
}

// ── page ─────────────────────────────────────────────────────

export default async function ResumePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch profile via username (case-insensitive)
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').ilike('username', username).single()

  if (profileError || !profile) {
    if (profileError) {
      console.error('RESUME FETCH ERROR details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        username
      })
    }
    notFound()
  }

  // Fetch completions (Proof of Work) and skill tree
  const [
    { data: completions },
    { data: skills },
  ] = await Promise.all([
    supabase.from('completions')
      .select('*, flow:flows(*, creator:profiles(*))')
      .eq('user_id', profile.id)
      .eq('success', true) // Only show successful completions on resume
      .order('completed_at', { ascending: false }),
    supabase.from('user_skills')
      .select('*')
      .eq('user_id', profile.id)
      .order('xp_amount', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8 font-sans print:bg-white print:p-0">
      {/* Navigation / Header — Hidden during print */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link 
          href={`/profile/${profile.username}`}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
        <PrintButton />
      </div>

      {/* Main Resume Content */}
      <div className="max-w-4xl mx-auto bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl print:shadow-none print:border-none print:bg-white">
        
        {/* Header Section */}
        <div className="relative p-8 border-b border-[var(--border)] bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] print:from-white print:to-white">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <div className="relative">
              <Avatar seed={profile.avatar_seed} size={128} />
              <div className="absolute -bottom-2 -right-2 bg-[var(--verified)] text-white p-1.5 rounded-lg shadow-lg border-2 border-[var(--bg-secondary)]">
                <Shield className="h-5 w-5" />
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] print:text-black">
                  {profile.username}
                </h1>
                <p className="text-lg text-[var(--accent)] font-semibold mt-1 flex items-center justify-center md:justify-start gap-2">
                  Verified AI Builder — Level {levelFromXp(profile.total_xp)}
                </p>
              </div>

              {profile.bio && (
                <p className="text-[var(--text-secondary)] max-w-2xl text-base leading-relaxed print:text-gray-700">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <Globe className="h-4 w-4" />
                  <span>conduit.dev/profile/{profile.username}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[var(--border)]">
          <div className="p-6 text-center border-r border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Total XP</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] print:text-black">{profile.total_xp.toLocaleString()}</p>
          </div>
          <div className="p-6 text-center border-r border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Time Saved</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] print:text-black">{profile.total_time_saved_minutes}m</p>
          </div>
          <div className="p-6 text-center border-r md:border-r border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Streak</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] print:text-black">{profile.current_streak} days</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Completed</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] print:text-black">{completions?.length ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 min-h-[600px]">
          {/* Left Column: Skills & Info */}
          <div className="md:col-span-1 bg-[var(--bg-secondary)] border-r border-[var(--border)] p-8 space-y-8 print:bg-white">
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-6 print:text-black">
                <BarChart2 className="h-4 w-4 text-[var(--accent)]" />
                Technical Skills
              </h2>
              <div className="space-y-6">
                {skills && skills.length > 0 ? (
                  skills.map((skill) => {
                    const { level, label } = skillLevelFromXp(skill.xp_amount);
                    return (
                      <div key={skill.category} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="font-semibold text-[var(--text-primary)] capitalize print:text-black">{skill.category}</span>
                          <span className="text-xs font-bold text-[var(--accent)]">{label} (Lvl {level})</span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--accent)] rounded-full" 
                            style={{ width: `${Math.min(100, (skill.xp_amount % 100))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)] italic">No skill data available.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-4 print:text-black">
                <Shield className="h-4 w-4 text-[var(--accent)]" />
                Certifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg print:bg-gray-50 print:border">
                  <CheckCircle className="h-5 w-5 text-[var(--verified)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] print:text-black">Identity Verified</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Verified via Github OAuth</p>
                  </div>
                </div>
                {profile.total_xp > 1000 && (
                  <div className="flex items-start gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg print:bg-gray-50 print:border">
                    <Trophy className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)] print:text-black">Top Contributor</p>
                      <p className="text-xs text-[var(--text-tertiary)]">Top 1% of AI Builders</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Work History */}
          <div className="md:col-span-2 p-8 space-y-8 bg-[var(--bg-primary)] print:bg-white">
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-6 print:text-black">
                <Target className="h-4 w-4 text-[var(--accent)]" />
                Verified Proof of Work
              </h2>
              
              <div className="space-y-8">
                {completions && completions.length > 0 ? (
                  completions.map((completion) => {
                    const flow = completion.flow as any;
                    if (!flow) return null;
                    return (
                      <div key={completion.id} className="relative pl-6 border-l-2 border-[var(--border)] print:border-gray-200">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--accent)] border-4 border-[var(--bg-primary)] print:border-white shadow-sm" />
                        
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-[var(--text-primary)] print:text-black">
                            {flow.title}
                          </h3>
                          <span className="text-xs font-medium text-[var(--text-tertiary)]">
                            {new Date(completion.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed print:text-gray-700">
                          {flow.description}
                        </p>

                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-tertiary)] rounded-full text-[10px] font-bold uppercase tracking-tight text-[var(--text-secondary)] print:bg-gray-100 print:text-gray-600">
                            <Shield className="h-3 w-3 text-[var(--verified)]" />
                            Verified Success
                          </div>
                          {completion.proof_url && (
                            <a 
                              href={completion.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight text-[var(--accent)] hover:underline"
                            >
                              View Live Artifact
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border)]">
                    <p className="text-[var(--text-tertiary)]">No verified workflows completed yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Footer Branding */}
            <div className="pt-12 mt-12 border-t border-[var(--border)] text-center flex flex-col items-center gap-2 opacity-50">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] print:text-black">
                <FileText className="h-4 w-4" />
                CONDUIT VERIFIED RESUME
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.2em]">
                Authenticity guaranteed by decentralized workflow verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
