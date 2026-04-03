"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { useExecutionStore } from '@/lib/stores/execution'
import { FlowProgressBar } from '@/components/flow-progress-bar'
import { StepView } from '@/components/step-view'
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { Flow, Step } from '@/types'

export default function RunFlowPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useUserStore()
  const flowId = params.id as string

  const {
    flowId: storedFlowId,
    currentStepIndex,
    setFlowId,
    setCurrentStep,
    markStepComplete,
    skipStep,
    runCounted,
    setRunCounted,
  } = useExecutionStore()

  const [flow, setFlow]       = useState<Flow | null>(null)
  const [steps, setSteps]     = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const { data: flowData, error: flowError } = await supabase.from('flows').select('*').eq('id', flowId).single()
        if (flowError) throw flowError
        setFlow(flowData)

        const { data: stepsData, error: stepsError } = await supabase.from('steps').select('*').eq('flow_id', flowId).order('order_index', { ascending: true })
        if (stepsError) throw stepsError
        setSteps(stepsData || [])

        if (storedFlowId !== flowId) {
          setFlowId(flowId)
          setCurrentStep(0)
        }
      } catch (error) {
        console.error('Error fetching flow:', error)
        toast.error('Failed to load flow')
      } finally {
        setLoading(false)
      }
    }
    fetchFlow()
  }, [flowId, storedFlowId, setFlowId, setCurrentStep])

  useEffect(() => {
    const recordStart = async () => {
      if (steps.length > 0 && steps[currentStepIndex]) {
        try { await supabase.rpc('increment_step_start', { target_step_id: steps[currentStepIndex].id }) }
        catch (error) { console.error(error) }
      }
    }
    recordStart()
  }, [currentStepIndex, steps])

  const handleStepComplete = async () => {
    markStepComplete(currentStepIndex)
    if (user && currentStepIndex === 0 && !runCounted) {
      try { await supabase.rpc('increment_run_count', { flow_id: flowId }); setRunCounted(true) }
      catch (error) { console.error(error) }
    }
    if (steps[currentStepIndex]) {
      try { await supabase.rpc('increment_step_complete', { target_step_id: steps[currentStepIndex].id }) }
      catch (error) { console.error(error) }
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(currentStepIndex + 1)
      // Scroll to top so user sees new step from beginning
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push(`/flow/${flowId}/complete`)
    }
  }

  const handleSkipStep = () => {
    skipStep(currentStepIndex)
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(currentStepIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push(`/flow/${flowId}/complete`)
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(currentStepIndex - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="page-container max-w-[720px] py-12">
        <div className="animate-pulse space-y-8">
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-32 rounded" />
          <div className="skeleton h-24 rounded" />
        </div>
      </div>
    )
  }

  if (!flow || steps.length === 0) {
    return (
      <div className="page-container max-w-[720px] py-12 text-center">
        <p className="text-[var(--text-tertiary)]">Flow not found</p>
      </div>
    )
  }

  const currentStep = steps[currentStepIndex]

  return (
    <div>
      {/* Progress bar — sticky below nav */}
      <FlowProgressBar
        flowTitle={flow.title}
        currentStep={currentStepIndex}
        totalSteps={steps.length}
        estimatedMinutes={flow.estimated_minutes}
      />

      {/* Page content */}
      <div className="page-container max-w-[720px] py-8 md:py-12">
        <StepView
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={steps.length}
        />

        {/* ── Desktop navigation controls (hidden on mobile — see StickyBottomBar) ── */}
        <div className="hidden md:block">
          <div className="border-t border-[var(--border)] my-8" />

          <button
            onClick={handleStepComplete}
            className="
              w-full flex items-center justify-center gap-2
              bg-[var(--accent)] hover:bg-[var(--accent-hover)]
              text-white font-semibold text-base
              py-4 rounded-xl
              transition-colors press-scale
              shadow-lg shadow-[var(--accent)]/20
            "
          >
            <Check className="h-5 w-5" />
            {currentStepIndex < steps.length - 1 ? "I'm done — next step" : "Complete this flow"}
          </button>

          <div className="flex items-center justify-between mt-4">
            {currentStepIndex > 0 ? (
              <button onClick={handlePreviousStep} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ChevronLeft className="h-4 w-4" /> Previous step
              </button>
            ) : <div />}
            <button onClick={handleSkipStep} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Skip this step →
            </button>
          </div>
        </div>

        {/* ── Spacer so content isn't hidden behind the mobile bottom bar ── */}
        <div className="h-28 md:hidden" aria-hidden="true" />
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE STICKY BOTTOM ACTION BAR
          Always reachable regardless of scroll position.
          Hidden on md+ (those use the inline controls above).
      ══════════════════════════════════════════════════════ */}
      <StickyBottomBar>
        {/* Primary CTA */}
        <button
          onClick={handleStepComplete}
          className="
            w-full flex items-center justify-center gap-2
            bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            text-white font-semibold text-base
            py-3.5 rounded-xl
            transition-colors press-scale
            shadow-lg shadow-[var(--accent)]/20
          "
        >
          <Check className="h-5 w-5" />
          {currentStepIndex < steps.length - 1 ? "Done — next step" : "Complete flow"}
        </button>

        {/* Secondary controls */}
        <div className="flex items-center justify-between mt-2 pb-1">
          {currentStepIndex > 0 ? (
            <button
              onClick={handlePreviousStep}
              className="touch-target flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors pr-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
          ) : <div className="touch-target" />}

          <button
            onClick={handleSkipStep}
            className="touch-target flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors pl-2"
          >
            <span>Skip</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </StickyBottomBar>
    </div>
  )
}
