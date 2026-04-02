"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { useExecutionStore } from '@/lib/stores/execution'
import { FlowProgressBar } from '@/components/flow-progress-bar'
import { StepView } from '@/components/step-view'
import { toast } from 'sonner'
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

  const [flow, setFlow] = useState<Flow | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        // Fetch flow
        const { data: flowData, error: flowError } = await supabase
          .from('flows')
          .select('*')
          .eq('id', flowId)
          .single()

        if (flowError) throw flowError
        setFlow(flowData)

        // Fetch steps
        const { data: stepsData, error: stepsError } = await supabase
          .from('steps')
          .select('*')
          .eq('flow_id', flowId)
          .order('order_index', { ascending: true })

        if (stepsError) throw stepsError
        setSteps(stepsData || [])

        // Initialize execution store
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
    // Record step start for analytics
    const recordStart = async () => {
      if (steps.length > 0 && steps[currentStepIndex]) {
        try {
          await supabase.rpc('increment_step_start', { target_step_id: steps[currentStepIndex].id })
        } catch (error) {
          console.error(error)
        }
      }
    }
    recordStart()
  }, [currentStepIndex, steps])

  const handleStepComplete = async () => {
    markStepComplete(currentStepIndex)

    // Increment run count on first step completion if user is signed in
    if (user && currentStepIndex === 0 && !runCounted) {
      try {
        await supabase.rpc('increment_run_count', { flow_id: flowId })
        setRunCounted(true)
      } catch (error) {
        console.error('Error incrementing run count:', error)
      }
    }

    if (steps[currentStepIndex]) {
      try {
        await supabase.rpc('increment_step_complete', { target_step_id: steps[currentStepIndex].id })
      } catch (error) {
        console.error(error)
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(currentStepIndex + 1)
    } else {
      router.push(`/flow/${flowId}/complete`)
    }
  }

  const handleSkipStep = () => {
    skipStep(currentStepIndex)
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(currentStepIndex + 1)
    } else {
      router.push(`/flow/${flowId}/complete`)
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(currentStepIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/4" />
          <div className="h-8 bg-[var(--bg-tertiary)] rounded w-3/4" />
          <div className="h-32 bg-[var(--bg-tertiary)] rounded" />
        </div>
      </div>
    )
  }

  if (!flow || steps.length === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-12 text-center">
        <p className="text-[var(--text-tertiary)]">Flow not found</p>
      </div>
    )
  }

  const currentStep = steps[currentStepIndex]

  return (
    <div>
      <FlowProgressBar
        flowTitle={flow.title}
        currentStep={currentStepIndex}
        totalSteps={steps.length}
        estimatedMinutes={flow.estimated_minutes}
      />

      <div className="max-w-[720px] mx-auto px-6 py-12">
        <StepView
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={steps.length}
        />

        <div className="border-t border-[var(--border)] my-8" />

        <button
          onClick={handleStepComplete}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-base font-medium py-3 rounded transition-colors duration-150"
        >
          ✓ I&apos;m done with this step
        </button>

        <div className="flex items-center justify-between mt-6">
          {currentStepIndex > 0 ? (
            <button
              onClick={handlePreviousStep}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            >
              &larr; Previous step
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSkipStep}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
          >
            Skip this step &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
