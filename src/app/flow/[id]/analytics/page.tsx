import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Users, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: flow } = await supabase.from('flows').select('title').eq('id', id).single()

  if (!flow) return { title: 'Not Found' }
  return { title: `Analytics: ${flow.title} — Conduit` }
}

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Verify auth
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')

  // Fetch flow and steps
  const { data: flow } = await supabase
    .from('flows')
    .select(`*, steps (*)`)
    .eq('id', id)
    .single()

  if (!flow) notFound()

  // Verify ownership
  if (flow.creator_id !== session.user.id) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-[var(--text-secondary)] mb-6">You must be the creator of this flow to view its analytics.</p>
        <Link href={`/flow/${flow.id}`} className="text-[var(--accent)] hover:underline">
          Return to Flow
        </Link>
      </div>
    )
  }

  const steps = flow.steps?.sort((a, b) => a.order_index - b.order_index) || []

  // Ensure overall analytics are safe
  const totalStarts = flow.run_count || 0
  const totalCompletions = flow.completion_count || 0
  const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href={`/flow/${flow.id}`}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-secondary)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-geist font-semibold text-[var(--text-primary)]">
            Creator Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {flow.title}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Stat Cards */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-3 text-[var(--text-tertiary)] mb-2">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Total Starts</span>
          </div>
          <p className="text-4xl font-geist font-semibold text-[var(--text-primary)]">
            {totalStarts}
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-3 text-[var(--text-tertiary)] mb-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Completions</span>
          </div>
          <p className="text-4xl font-geist font-semibold text-[var(--text-primary)]">
            {totalCompletions}
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-3 text-[var(--text-tertiary)] mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Completion Rate</span>
          </div>
          <p className="text-4xl font-geist font-semibold text-[var(--text-primary)]">
            {completionRate}%
          </p>
        </div>
      </div>

      {/* Funnel section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-[var(--text-secondary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Step Funnel Drop-off</h2>
        </div>
        
        <div className="p-6 space-y-8">
          {steps.map((step, index) => {
            const startCount = step.start_count || 0
            const completeCount = step.complete_count || 0
            const stepCompletionRate = startCount > 0 ? Math.round((completeCount / startCount) * 100) : 0
            const dropoffRate = 100 - stepCompletionRate

            // Calculate width based on max starts for relative sizing
            const maxStarts = Math.max(...steps.map(s => s.start_count || 0), 1)
            const relativeWidth = Math.max((startCount / maxStarts) * 100, 1)

            return (
              <div key={step.id}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Step {index + 1}
                    </span>
                    <h3 className="text-sm font-medium text-[var(--text-primary)] mt-1">
                      {step.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {startCount} users started
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {dropoffRate}% drop-off
                    </p>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="h-6 bg-[var(--bg-tertiary)] rounded overflow-hidden w-full relative">
                  {/* Total reach of this step relative to the most popular step */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-[var(--border-strong)] opacity-30"
                    style={{ width: `${relativeWidth}%` }}
                  />
                  {/* Completion of THIS step compared to its own starts */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-[var(--accent)] transition-all duration-500"
                    style={{ width: `${(stepCompletionRate / 100) * relativeWidth}%` }}
                  />
                </div>
              </div>
            )
          })}

          {steps.length === 0 && (
            <p className="text-[var(--text-secondary)] text-sm text-center py-8">
              No steps found for this flow.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
