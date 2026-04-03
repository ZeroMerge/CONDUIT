import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FlowCard } from '@/components/flow-card'
import { CategoryFilter } from '@/components/category-filter'
import { ActivityFeed } from '@/components/activity-feed'
import { ArrowRight, Zap, Users, CheckCircle } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { count: flowCount } = await supabase.from('flows').select('*', { count: 'exact', head: true })
  const { count: completionCount } = await supabase.from('completions').select('*', { count: 'exact', head: true })
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { data: trendingFlows } = await supabase.from('flows').select('*').order('like_count', { ascending: false }).limit(6)

  return (
    <div className="page-container">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent-text)] text-xs font-bold uppercase tracking-widest mb-6">
          <Zap className="h-3 w-3 fill-current" />
          GITHUB REPO FOR VERIFIED AI WORKFLOWS
        </div>

        {/* Headline — fluid size via CSS var */}
        <h1 className="text-hero font-geist font-black text-[var(--text-primary)] max-w-[16ch] mx-auto">
          Run AI workflows that produce real outcomes.
        </h1>

        <p className="mt-4 text-base md:text-lg text-[var(--text-secondary)] max-w-[42ch] mx-auto leading-relaxed">
          Step-by-step execution plans, editable prompt templates,
          and built-in validation — so every flow ends with something real.
        </p>

        {/* CTAs — stacked on mobile, side by side on sm+ */}
        <div className="flex flex-col xs:flex-row gap-3 justify-center mt-8 px-4 xs:px-0">
          <Link
            href="/explore"
            className="
              flex items-center justify-center gap-2
              bg-[var(--accent)] hover:bg-[var(--accent-hover)]
              text-white font-semibold text-sm
              px-6 py-3.5 rounded-xl
              transition-colors press-scale
              shadow-lg shadow-[var(--accent)]/20
            "
          >
            Browse flows <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/create"
            className="
              flex items-center justify-center gap-2
              bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)]
              text-[var(--text-primary)] font-semibold text-sm
              px-6 py-3.5 rounded-xl
              transition-colors press-scale
              hover:bg-[var(--bg-secondary)]
            "
          >
            Create a flow
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════ */}
      <section className="border-t border-b border-[var(--border)] py-6 md:py-8">
        <div className="grid grid-cols-3 max-w-[540px] mx-auto text-center divide-x divide-[var(--border)]">
          <div className="px-4">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="h-4 w-4 text-[var(--accent)] hidden sm:block" />
              <p className="text-2xl md:text-3xl font-geist font-black text-[var(--text-primary)] tabular-nums">
                {flowCount || 0}
              </p>
            </div>
            <p className="text-[10px] md:text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-medium">Flows</p>
          </div>
          <div className="px-4">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle className="h-4 w-4 text-[var(--accent)] hidden sm:block" />
              <p className="text-2xl md:text-3xl font-geist font-black text-[var(--text-primary)] tabular-nums">
                {completionCount || 0}
              </p>
            </div>
            <p className="text-[10px] md:text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-medium">Completions</p>
          </div>
          <div className="px-4">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users className="h-4 w-4 text-[var(--accent)] hidden sm:block" />
              <p className="text-2xl md:text-3xl font-geist font-black text-[var(--text-primary)] tabular-nums">
                {profileCount || 0}
              </p>
            </div>
            <p className="text-[10px] md:text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-medium">Members</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORY FILTER — snap-scrollable pill row
      ══════════════════════════════════════════════════════ */}
      <section className="pt-10 md:pt-14">
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
          Browse by category
        </p>
        <CategoryFilter />
      </section>

      {/* ══════════════════════════════════════════════════════
          TRENDING FLOWS
          Mobile: horizontal snap carousel
          Tablet+: 2-col grid  |  Desktop: 3-col grid
      ══════════════════════════════════════════════════════ */}
      <section className="pt-10 pb-6 md:pt-14">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
            Trending flows
          </p>
          <Link href="/explore" className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile: snap carousel  |  sm+: grid */}
        <div className="
          flex gap-4 snap-x scrollbar-hide
          sm:grid sm:overflow-visible sm:flex-none sm:grid-cols-2 lg:grid-cols-3
        ">
          {trendingFlows?.map((flow) => (
            <div key={flow.id} className="snap-child flex-none w-[min(82vw,300px)] sm:w-auto">
              <FlowCard flow={flow} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ACTIVITY FEED
          Mobile: collapsible  |  Tablet+: always visible
      ══════════════════════════════════════════════════════ */}
      <section className="py-8 md:py-12 border-t border-[var(--border)] mt-4">
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-6">
          Recently completed
        </p>
        <ActivityFeed />
      </section>

    </div>
  )
}
