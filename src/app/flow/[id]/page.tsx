import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import { LikeButton } from '@/components/like-button'
import { TrustBadge } from '@/components/trust-badge'
import { ForkButton } from '@/components/fork-button'
import { CommentsSection } from '@/components/comments'
import { SubmitPrButton } from '@/components/submit-pr-button'
import { MergeRequestsSection } from '@/components/merge-requests-section'
import { GitFork, ChevronRight, Activity, ArrowRight, ArrowDownToLine, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { FlowLineage } from '@/components/flow-lineage'
import { StickyBottomBar, StickyBottomBarSpacer } from '@/components/ui/sticky-bottom-bar'
import { ResponsiveContainer } from '@/components/ui/responsive-container'
import type { Step, Completion, Profile } from '@/types'

// Dynamic SEO & Social Sharing
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: flow } = await supabase.from('flows').select('*').eq('id', id).single()
  if (!flow) return { title: 'Flow Not Found - Conduit' }

  let creatorUsername = 'anonymous'
  if (flow.creator_id) {
    const { data: creator } = await supabase.from('profiles').select('username').eq('id', flow.creator_id).single()
    if (creator) creatorUsername = creator.username
  }

  const successRate = flow.run_count > 0 ? Math.round((flow.completion_count / flow.run_count) * 100) : 0
  const ogUrl = `/api/og?title=${encodeURIComponent(flow.title)}&username=${encodeURIComponent(creatorUsername)}&successRate=${successRate}`

  return {
    title: `${flow.title} | Conduit`,
    description: flow.description,
    openGraph: {
      title: flow.title,
      description: flow.description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${flow.title} by ${creatorUsername}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: flow.title,
      description: flow.description,
      images: [ogUrl],
    }
  }
}

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: flow } = await supabase.from('flows').select(`*, parent_flow:parent_flow_id(id, title)`).eq('id', id).single()
  if (!flow) notFound()

  let creator = null
  if (flow.creator_id) {
    const { data: creatorData } = await supabase.from('profiles').select('*').eq('id', flow.creator_id).single()
    creator = creatorData
  }

  const flowData = { ...flow, creator }
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const { data: steps } = await supabase.from('steps').select('*').eq('flow_id', id).order('order_index', { ascending: true })
  const { data: completions } = await supabase.from('completions').select(`*, profile:profiles(*)`).eq('flow_id', id).order('completed_at', { ascending: false }).limit(10)

  const completionRate = flowData.run_count > 0 ? Math.round((flowData.completion_count / flowData.run_count) * 100) : null

  const safetyColors = {
    safe: 'bg-[var(--safe)]',
    caution: 'bg-[var(--caution)]',
    risky: 'bg-[var(--risky)]',
  }

  return (
    <ResponsiveContainer section className="animate-fade-in relative">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 xl:gap-12">

        {/* ── Left Column ── */}
        <div>
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6 touch-target -ml-2 px-2">
            <ArrowLeft className="h-4 w-4" /> Explore
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              {flowData.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-full">
              <span className={`w-2 h-2 rounded-full ${safetyColors[flowData.safety_status as keyof typeof safetyColors]}`} />
              <span className="text-[var(--text-primary)] capitalize">{flowData.safety_status}</span>
            </div>
            <TrustBadge status={flowData.status} size="sm" />
          </div>

          <h1 className="text-h1 font-geist font-black tracking-tight text-[var(--text-primary)] mt-5 mb-2 leading-tight">
            {flowData.title}
          </h1>

          {/* Fork Origin Indicator */}
          {flowData.parent_flow && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] mb-4 bg-[var(--bg-secondary)] border border-[var(--border)] inline-flex px-3 py-1.5 rounded-lg">
              <GitFork className="h-4 w-4" />
              Forked from <Link href={`/flow/${(flowData.parent_flow as any).id}`} className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{(flowData.parent_flow as any).title}</Link>
            </div>
          )}

          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-3xl">
            {flowData.description}
          </p>

          {/* ── Mobile-only Stats Metric Row (Hidden on Desktop) ── */}
          <div className="flex items-center gap-2 overflow-x-auto snap-x scrollbar-hide py-4 mt-4 -mx-4 px-4 sm:hidden mask-fade-r">
            <div className="snap-child flex-shrink-0 flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full px-4 py-1.5">
              <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Runs</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{flowData.run_count}</span>
            </div>
            <div className="snap-child flex-shrink-0 flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full px-4 py-1.5">
              <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Done</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{completionRate !== null ? `${completionRate}%` : '—%'}</span>
            </div>
            <div className="snap-child flex-shrink-0 flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full px-4 py-1.5">
              <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Time</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">~{flowData.estimated_minutes}m</span>
            </div>
          </div>

          {/* ── README ── */}
          {flowData.readme_markdown && (
            <div className="mt-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 overflow-hidden">
              <div className="conduit-prose">
                <ReactMarkdown>{flowData.readme_markdown}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="border-t border-[var(--border)] my-10 lg:my-12" />
          
          <FlowLineage flowId={flowData.id} />

          <div className="mt-10 mb-6 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-geist font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-[var(--accent)]" />
              Execution Plan
            </h2>
            <span className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-bold px-2 py-1 rounded-md">
              {steps?.length || 0} STEPS
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {steps?.map((step: Step, index: number) => (
              <div key={step.id} className="group relative bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-xl p-4 sm:p-5 transition-all duration-200">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-strong)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1.5 line-clamp-2 md:line-clamp-none pr-4">
                      {step.instruction}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] my-10" />

          {/* ── Desktop Action Buttons (Hidden on small mobile) ── */}
          <div className="hidden sm:flex flex-wrap items-center gap-3">
            <Link href={`/flow/${flowData.id}/run`} className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[var(--accent)]/20 press-scale">
              Start workflow <ArrowRight className="h-4 w-4" />
            </Link>
            <ForkButton flowId={flowData.id} />
            {flowData.parent_flow && (
              <SubmitPrButton parentFlowId={(flowData.parent_flow as any).id} forkFlowId={flowData.id} />
            )}
            {user?.id === flowData.creator_id && (
              <Link href={`/flow/${flowData.id}/analytics`} className="flex items-center gap-2 bg-transparent border border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-medium px-5 py-3 rounded-xl transition-colors press-scale">
                <Activity className="h-4 w-4" /> Analytics
              </Link>
            )}
          </div>

          <div className="mt-14">
            <MergeRequestsSection flowId={flowData.id} />
          </div>

          <div className="mt-14">
            <CommentsSection flowId={flowData.id} />
          </div>
        </div>

        {/* ── Right Column (Desktop Sidebar) ── */}
        <div className="hidden lg:block">
          <div className="sticky top-[100px] space-y-6">
            
            {/* Action Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <Link href={`/flow/${flowData.id}/run`} className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-base font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-[var(--accent)]/20 press-scale mb-4">
                Start this workflow
              </Link>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                <LikeButton flowId={flowData.id} initialLikeCount={flowData.like_count} />
                <span className="text-xs font-medium text-[var(--text-tertiary)]">{flowData.fork_count || 0} forks</span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Flow Metrics
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Total runs</span><span className="text-[var(--text-primary)] font-semibold">{flowData.run_count}</span></div>
                <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Completion rate</span><span className="text-[var(--text-primary)] font-semibold">{completionRate !== null ? `${completionRate}%` : '—%'}</span></div>
                <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Finished</span><span className="text-[var(--text-primary)] font-semibold">{flowData.completion_count}</span></div>
                <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)]">Est. time</span><span className="text-[var(--text-primary)] font-semibold">~{flowData.estimated_minutes} min</span></div>
              </div>

              {flowData.creator && (
                <>
                  <div className="border-t border-[var(--border)] my-5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-3">Created By</p>
                    <Link href={`/profile/${flowData.creator.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity bg-[var(--bg-primary)] p-2 -mx-2 rounded-xl border border-transparent hover:border-[var(--border)]">
                      <Avatar seed={flowData.creator.avatar_seed} size={36} verified={(flowData.creator as any).is_verified} />
                      <div>
                        <span className="block text-sm font-semibold text-[var(--text-primary)] leading-none">{flowData.creator.username}</span>
                        <span className="block text-xs font-medium text-[var(--accent)] mt-1">{flowData.creator.total_xp || 0} XP</span>
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Community Proof */}
            {completions && completions.length > 0 && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Community Proof</h3>
                <div className="space-y-4">
                  {completions.filter((c: Completion & { profile?: Profile }) => c.feedback && c.profile).slice(0, 3).map((completion: Completion & { profile?: Profile }) => (
                    <div key={completion.id} className="border-l-2 border-[var(--accent)] pl-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        {completion.profile && <Avatar seed={completion.profile.avatar_seed} size={20} />}
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{completion.profile?.username}</span>
                      </div>
                      {completion.feedback && <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">&ldquo;{completion.feedback}&rdquo;</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StickyBottomBarSpacer />

      {/* ── Mobile Sticky Action Bar ── */}
      <StickyBottomBar showOnTablet={false}>
        <div className="flex items-center gap-3">
          <Link href={`/flow/${flowData.id}/run`} className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent)] text-white text-base font-semibold py-3.5 rounded-xl hover:bg-[var(--accent-hover)] transition-colors shadow-lg shadow-[var(--accent)]/20 press-scale">
            Start flow <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl">
            <LikeButton flowId={flowData.id} initialLikeCount={flowData.like_count} />
          </div>
        </div>
        {/* Mobile secondary actions (fork, comment) can go here if needed, keeping simple for now */}
        <div className="flex items-center justify-center gap-4 mt-3 mb-1">
           <ForkButton flowId={flowData.id} />
           {user?.id === flowData.creator_id && (
             <Link href={`/flow/${flowData.id}/analytics`} className="text-sm font-medium text-[var(--text-tertiary)]">Analytics</Link>
           )}
        </div>
      </StickyBottomBar>

    </ResponsiveContainer>
  )
}