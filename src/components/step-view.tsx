"use client"

import { useRef, useEffect, useState } from 'react'
import { Copy, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useExecutionStore } from '@/lib/stores/execution'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import type { Step } from '@/types'

interface StepViewProps {
  step: Step
  stepIndex: number
  totalSteps: number
}

export function StepView({ step, stepIndex, totalSteps }: StepViewProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const validationRef = useRef<HTMLTextAreaElement>(null)

  const {
    editedPrompts,
    validationSummaries,
    setEditedPrompt,
    setValidationSummary,
  } = useExecutionStore()

  const currentPrompt = editedPrompts[stepIndex] ?? step.prompt_text
  const currentValidation = validationSummaries[stepIndex] ?? ''

  const [isCheckingAI, setIsCheckingAI] = useState(false)
  const [judgeResult, setJudgeResult] = useState<{ success: boolean; feedback: string } | null>(null)

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = 'auto'
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`
    }
  }, [currentPrompt])

  useEffect(() => {
    if (validationRef.current) {
      validationRef.current.style.height = 'auto'
      validationRef.current.style.height = `${validationRef.current.scrollHeight}px`
    }
  }, [currentValidation])

  // Reset judge result when changing steps
  useEffect(() => {
    setJudgeResult(null)
  }, [stepIndex])

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedPrompt(stepIndex, e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleValidationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValidationSummary(stepIndex, e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentPrompt)
      toast.success('Prompt copied to clipboard')
    } catch {
      toast.error('Failed to copy prompt')
    }
  }

  const buildValidationPrompt = (summary: string, expectedOutcome: string): string =>
    `I ran a step in an AI workflow and got the following result:\n\n"${summary}"\n\nThe expected outcome for this step was:\n\n"${expectedOutcome}"\n\nDoes my result match the expected outcome?\nIf yes, confirm it and tell me I can proceed to the next step.\nIf no, tell me exactly what is wrong and give me a corrected prompt I can run immediately.`

  const handleManualCheck = async () => {
    const prompt = buildValidationPrompt(currentValidation, step.expected_outcome)
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success('Validation prompt copied — paste into your AI')
    } catch {
      toast.error('Failed to copy validation prompt')
    }
  }

  const handleAIVerify = async () => {
    if (!currentValidation.trim()) return

    setIsCheckingAI(true)
    setJudgeResult(null)

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userResult: currentValidation,
          expectedOutcome: step.expected_outcome
        })
      })

      if (!res.ok) throw new Error('Validation API failed')

      const data = await res.json()
      setJudgeResult(data)

      if (data.success) {
        toast.success('AI Verified: Looks good! You can proceed.')
      } else {
        toast.error('AI Check: Not quite right yet. See feedback.')
      }
    } catch (error) {
      toast.error('Failed to connect to the verification engine.')
    } finally {
      setIsCheckingAI(false)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-up">
      {/* ── Title ── */}
      <div>
        <h2 className="text-xl md:text-2xl font-geist font-bold text-[var(--text-primary)] tracking-tight">
          {step.title}
        </h2>
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* ── Instruction ── */}
      <div>
        <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
          What to do
        </h3>
        <div className="conduit-prose">
          <ReactMarkdown>{step.instruction}</ReactMarkdown>
        </div>
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* ── Prompt ── */}
      <div>
        <div className="flex items-center justify-between xl:mb-3">
          <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
            Your prompt
          </h3>
          {/* Mobile: copy button moves below prompt, Desktop: inline */}
          <button
            onClick={handleCopyPrompt}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-target"
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
        </div>
        
        <div className="relative mt-2 md:mt-0">
          <textarea
            ref={promptRef}
            value={currentPrompt}
            onChange={handlePromptChange}
            className="
              w-full min-h-[120px] md:min-h-[160px]
              bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent)] 
              outline-none rounded-xl p-4 md:p-5
              font-geist-mono text-sm md:text-base text-[var(--text-primary)] leading-relaxed
              resize-none transition-all duration-200 shadow-inner
            "
          />
          {/* Mobile visible copy button */}
          <button
            onClick={handleCopyPrompt}
            className="md:hidden mt-2 w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium text-sm rounded-xl transition-colors press-scale"
          >
            <Copy className="h-4 w-4" /> Copy this prompt
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* ── Expected Outcome ── */}
      <div>
        <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
          Expected outcome
        </h3>
        <div className="conduit-prose text-[var(--text-secondary)]">
          <ReactMarkdown>{step.expected_outcome}</ReactMarkdown>
        </div>

        {step.example_output && (
          <div className="mt-4 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl p-4 md:p-5 overflow-x-auto snap-x">
            <pre className="font-geist-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
              {step.example_output}
            </pre>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* ── Validation ── */}
      <div>
        <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 flex items-center gap-2">
          Validate your result
        </h3>
        <p className="text-sm md:text-base text-[var(--text-secondary)] mb-4 leading-relaxed">
          Paste a short summary or the exact output of what your AI returned to verify passing this step:
        </p>
        
        <textarea
          ref={validationRef}
          value={currentValidation}
          onChange={handleValidationChange}
          placeholder="e.g. Got a working React component..."
          className="
            w-full min-h-[80px] md:min-h-[100px]
            bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--border-strong)]
            outline-none rounded-xl p-4
            font-geist-mono text-sm md:text-base text-[var(--text-primary)]
            resize-none transition-colors duration-200 shadow-inner
          "
        />

        {/* Validation Check Buttons - Column on mobile, Row on tablet+ */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleManualCheck}
            disabled={!currentValidation.trim()}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-transparent border border-[var(--border-strong)] hover:bg-[var(--border)] text-[var(--text-primary)] py-3.5 rounded-xl disabled:opacity-50 transition-colors press-scale"
          >
            <Copy className="h-4 w-4" /> Copy Verification Prompt
          </button>

          <button
            onClick={handleAIVerify}
            disabled={!currentValidation.trim() || isCheckingAI}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-[var(--bg-inverse)] text-[var(--text-inverse)] hover:opacity-90 py-3.5 rounded-xl disabled:opacity-50 transition-opacity press-scale shadow-lg shadow-[var(--bg-inverse)]/20"
          >
            {isCheckingAI ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Verify with AI</>
            )}
          </button>
        </div>

        {judgeResult && (
          <div className="mt-6 animate-slide-down">
            <div className={`p-5 rounded-2xl border ${judgeResult.success ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)]' : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${judgeResult.success ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}`}>
                  {judgeResult.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className={`text-base font-bold ${judgeResult.success ? 'text-[var(--accent-text)]' : 'text-red-800 dark:text-red-400'}`}>
                    {judgeResult.success ? 'Step Verified!' : 'Needs Adjustment'}
                  </h4>
                  <p className={`text-sm mt-1.5 leading-relaxed ${judgeResult.success ? 'text-[var(--accent-text)]/80' : 'text-red-700 dark:text-red-300'}`}>
                    {judgeResult.feedback}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}