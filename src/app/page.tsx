import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FlowCard } from '@/components/flow-card'
import { CategoryFilter } from '@/components/category-filter'
import { ActivityFeed } from '@/components/activity-feed'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch stats
  const { count: flowCount } = await supabase
    .from('flows')
    .select('*', { count: 'exact', head: true })

  const { count: completionCount } = await supabase
    .from('completions')
    .select('*', { count: 'exact', head: true })

  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Fetch trending flows
  const { data: trendingFlows } = await supabase
    .from('flows')
    .select(`
      *,
      creator:profiles(*)
    `)
    .order('like_count', { ascending: false })
    .limit(6)

  return (
    <div className="max-w-[1120px] mx-auto px-6">
      {/* Hero */}
      <section className="py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
          GITHUB REPO FOR VERIFIED AI WORKFLOWS
        </p>
        <h1 className="text-3xl font-geist font-semibold tracking-tight mt-3">
          Run AI workflows that produce<br />real, verifiable outcomes.
        </h1>
        <p className="text-base text-[var(--text-secondary)] mt-4 max-w-[480px] mx-auto">
          Step-by-step execution plans, editable prompt templates,
          and built-in validation — so every flow ends with
          something real.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Link
            href="/explore"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded transition-colors duration-150"
          >
            Browse flows &rarr;
          </Link>
          <Link
            href="/create"
            className="bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium px-4 py-2 rounded transition-colors duration-150"
          >
            Create a flow
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-t border-b border-[var(--border)] py-8">
        <div className="grid grid-cols-3 max-w-[600px] mx-auto text-center">
          <div>
            <p className="text-3xl font-geist font-semibold text-[var(--text-primary)]">
              {flowCount || 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 uppercase tracking-widest">
              flows
            </p>
          </div>
          <div>
            <p className="text-3xl font-geist font-semibold text-[var(--text-primary)]">
              {completionCount || 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 uppercase tracking-widest">
              steps completed
            </p>
          </div>
          <div>
            <p className="text-3xl font-geist font-semibold text-[var(--text-primary)]">
              {profileCount || 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 uppercase tracking-widest">
              members
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
          Browse by category
        </p>
        <CategoryFilter />
      </section>

      {/* Trending Flows */}
      <section className="py-8">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
          Trending flows
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingFlows?.map((flow) => (
            <FlowCard key={flow.id} flow={flow} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/explore"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
          >
            View all flows &rarr;
          </Link>
        </div>
      </section>

      {/* Activity Feed */}
      <section className="py-12">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
          Recently completed
        </p>
        <ActivityFeed />
      </section>
    </div>
  )
}
