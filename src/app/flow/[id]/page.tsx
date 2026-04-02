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
import { GitFork, History } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { FlowLineage } from '@/components/flow-lineage'
import type { Step, Completion, Profile, FlowWithCreator } from '@/types'

// Dynamic SEO & Social Sharing (Next.js Metadata API)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: flow } = await supabase
    .from('flows')
    .select('*, creator:profiles(*)')
    .eq('id', id)
    .single() as { data: any }

  if (!flow) return { title: 'Flow Not Found - Conduit' }

  const successRate = flow.run_count > 0 
    ? Math.round((flow.completion_count / flow.run_count) * 100) 
    : 0

  const creatorUsername = flow.creator?.username || 'anonymous'
  const ogUrl = `/api/og?title=${encodeURIComponent(flow.title)}&username=${encodeURIComponent(creatorUsername)}&successRate=${successRate}`

  return {
    title: `${flow.title} | Conduit`,
    description: flow.description,
    openGraph: {
      title: flow.title,
      description: flow.description,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${flow.title} by ${creatorUsername}`,
        },
      ],
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

  const { data: flow } = await supabase
    .from('flows')
    .select(`*, creator:profiles(*), parent_flow:parent_flow_id(id, title)`)
    .eq('id', id)
    .single()

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!flow) notFound()

  const { data: steps } = await supabase.from('steps').select('*').eq('flow_id', id).order('order_index', { ascending: true })

  const { data: completions } = await supabase
    .from('completions')
    .select(`*, profile:profiles(*)`)
    .eq('flow_id', id)
    .order('completed_at', { ascending: false })
    .limit(10)

  const completionRate = flow.run_count > 0 ? Math.round((flow.completion_count / flow.run_count) * 100) : null

  const safetyColors = {
    safe: 'bg-[var(--safe)]',
    caution: 'bg-[var(--caution)]',
    risky: 'bg-[var(--risky)]',
  }

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

        {/* Left Column */}
        <div>
          <Link href="/explore" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150">
            &larr; Explore
          </Link>

          <div className="flex items-center gap-3 mt-6">
            <span className="bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-2 py-0.5 rounded">
              {flow.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${safetyColors[flow.safety_status]}`} />
              <span className="text-[var(--text-secondary)] capitalize">{flow.safety_status}</span>
            </div>
            <TrustBadge status={flow.status} size="sm" />
          </div>

          <h1 className="text-2xl font-geist font-semibold tracking-tight text-[var(--text-primary)] mt-4">
            {flow.title}
          </h1>

          {/* Fork Origin Indicator */}
          {flow.parent_flow && (
            <p className="text-sm text-[var(--text-tertiary)] mt-2 flex items-center gap-1.5">
              <GitFork className="h-4 w-4" />
              Forked from <Link href={`/flow/${flow.parent_flow.id}`} className="underline hover:text-[var(--text-primary)]">{flow.parent_flow.title}</Link>
            </p>
          )}

          <p className="text-base text-[var(--text-secondary)] leading-relaxed mt-3">
            {flow.description}
          </p>

          {flow.readme_markdown && (
            <div className="mt-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">README.md</h2>
              </div>
              <div className="text-sm text-[var(--text-secondary)] leading-loose space-y-4 [&>h1]:text-2xl [&>h1]:font-semibold [&>h1]:text-[var(--text-primary)] [&>h1]:mt-6 [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-[var(--text-primary)] [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-[var(--text-primary)] [&>h3]:mt-5 [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>li]:mb-1 [&>a]:text-[var(--accent)] [&>a]:underline [&>code]:bg-[var(--bg-tertiary)] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-geist-mono [&>pre]:bg-[var(--bg-tertiary)] [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--accent)] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4 text-wrap break-words">
                <ReactMarkdown>{flow.readme_markdown}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="border-t border-[var(--border)] my-8" />
          
          <FlowLineage flowId={flow.id} />

          <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Steps in this flow</h2>
          <div className="space-y-4">
            {steps?.map((step: Step, index: number) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="w-6 h-6 border border-[var(--border)] rounded flex items-center justify-center text-xs text-[var(--text-tertiary)] flex-shrink-0">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Step {index + 1} of {steps.length} — &ldquo;{step.title}&rdquo;
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {step.instruction.slice(0, 100)}{step.instruction.length > 100 && '...'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] my-8" />
          <div className="flex gap-4">
            <Link href={`/flow/${flow.id}/run`} className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-6 py-3 rounded transition-colors duration-150">
              Start flow &rarr;
            </Link>
            <ForkButton flowId={flow.id} />
            {flow.parent_flow && (
              <SubmitPrButton parentFlowId={flow.parent_flow.id} forkFlowId={flow.id} />
            )}
            {user?.id === flow.creator_id && (
              <Link href={`/flow/${flow.id}/analytics`} className="inline-block bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium px-6 py-3 rounded transition-colors duration-150">
                View Analytics
              </Link>
            )}
          </div>

          <div className="mt-16">
            <MergeRequestsSection flowId={flow.id} />
          </div>

          {/* New Comments Section */}
          <div className="mt-16">
            <CommentsSection flowId={flow.id} />
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-5">
            <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Flow stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Runs</span><span className="text-[var(--text-primary)] font-medium">{flow.run_count}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Completion rate</span><span className="text-[var(--text-primary)] font-medium">{completionRate !== null ? `${completionRate}%` : '—%'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Completions</span><span className="text-[var(--text-primary)] font-medium">{flow.completion_count}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Forks</span><span className="text-[var(--text-primary)] font-medium">{flow.fork_count || 0}</span></div>
            </div>

            <div className="border-t border-[var(--border)] my-4" />
            <div className="flex items-center justify-between">
              <LikeButton flowId={flow.id} initialLikeCount={flow.like_count} />
            </div>
            <div className="mt-4 text-xs text-[var(--text-tertiary)]">~{flow.estimated_minutes} min &middot; {steps?.length || 0} steps</div>

            {flow.creator && (
              <>
                <div className="border-t border-[var(--border)] my-4" />
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">Created by</p>
                  <Link href={`/profile/${flow.creator.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-150">
                    <Avatar seed={flow.creator.avatar_seed} size={28} verified={(flow.creator as any).is_verified} />
                    <span className="text-sm text-[var(--text-primary)]">{flow.creator.username}</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Reviews */}
          {completions && completions.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Community reviews</h3>
              <div className="space-y-3">
                {completions.filter((c: Completion & { profile?: Profile }) => c.feedback && c.profile).map((completion: Completion & { profile?: Profile }) => (
                  <div key={completion.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {completion.profile && <Avatar seed={completion.profile.avatar_seed} size={24} verified={(completion.profile as any).is_verified} />}
                      <span className="text-sm font-medium text-[var(--text-primary)]">{completion.profile?.username}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">{new Date(completion.completed_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className={completion.success ? 'text-[var(--verified)]' : 'text-[var(--risky)]'}>{completion.success ? '✓ Successful' : '✗ Unsuccessful'}</span>
                      {completion.difficulty && <><span className="text-[var(--text-tertiary)]">&middot;</span><span className="text-[var(--text-secondary)] capitalize">{completion.difficulty}</span></>}
                    </div>
                    {completion.feedback && <p className="text-sm text-[var(--text-secondary)]">&ldquo;{completion.feedback}&rdquo;</p>}
                    {completion.proof_url && <img src={completion.proof_url} alt="Proof" className="w-full max-h-40 object-cover rounded border border-[var(--border)] mt-3" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}