"use client"

import { useRef, useEffect, useState } from 'react'
import { Copy, Check, Sparkles, Loader2 } from 'lucide-react'
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
      toast.success('Validation prompt copied — paste it into your AI tool to check your result')
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
        toast.error('AI Check: Not quite right yet. See feedback below.')
      }
    } catch (error) {
      toast.error('Failed to connect to the verification engine.')
    } finally {
      setIsCheckingAI(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h2 className="text-xl font-geist font-semibold text-[var(--text-primary)] mt-2">
          {step.title}
        </h2>
      </div>

      <div className="border-t border-[var(--border)]" />

      <div>
        <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
          What to do
        </h3>
        <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-primary)] leading-relaxed">
          <ReactMarkdown>{step.instruction}</ReactMarkdown>
        </div>
      </div>

      <div className="border-t border-[var(--border)]" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
            Your prompt
          </h3>
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
          >
            <Copy className="h-4 w-4" />
            Copy prompt
          </button>
        </div>
        <textarea
          ref={promptRef}
          value={currentPrompt}
          onChange={handlePromptChange}
          className="w-full min-h-[180px] bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded p-4 font-geist-mono text-sm text-[var(--text-primary)] resize-none transition-colors duration-150"
        />
      </div>

      <div className="border-t border-[var(--border)]" />

      <div>
        <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
          Expected outcome
        </h3>
        <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed">
          <ReactMarkdown>{step.expected_outcome}</ReactMarkdown>
        </div>

        {step.example_output && (
          <div className="mt-4 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded p-4 overflow-x-auto">
            <pre className="font-geist-mono text-sm whitespace-pre-wrap">
              {step.example_output}
            </pre>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)]" />

      <div>
        <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
          Validate your result
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Paste a short summary or the exact output of what your AI returned:
        </p>
        <textarea
          ref={validationRef}
          value={currentValidation}
          onChange={handleValidationChange}
          placeholder="e.g. Got a working React component with useState, handles add, delete and complete actions"
          className="w-full min-h-[80px] bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded p-3 font-geist-mono text-sm text-[var(--text-primary)] resize-none transition-colors duration-150"
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleManualCheck}
            disabled={!currentValidation.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] py-2 rounded disabled:opacity-50 transition-colors duration-150"
          >
            <Copy className="h-4 w-4" />
            Copy Manual Validation Prompt
          </button>

          <button
            onClick={handleAIVerify}
            disabled={!currentValidation.trim() || isCheckingAI}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-[var(--bg-inverse)] text-[var(--text-inverse)] hover:opacity-90 py-2 rounded disabled:opacity-50 transition-opacity duration-150"
          >
            {isCheckingAI ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Verify with AI (Optional)</>
            )}
          </button>
        </div>

        {judgeResult && (
          <div className={`mt-4 p-4 rounded border ${judgeResult.success ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)]' : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{judgeResult.success ? '🎉' : '🤔'}</span>
              <div>
                <h4 className={`text-sm font-semibold ${judgeResult.success ? 'text-[var(--accent-text)]' : 'text-red-800 dark:text-red-400'}`}>
                  {judgeResult.success ? 'Step Verified!' : 'Needs Adjustment'}
                </h4>
                <p className={`text-sm mt-1 ${judgeResult.success ? 'text-[var(--accent-text)]' : 'text-red-700 dark:text-red-300'}`}>
                  {judgeResult.feedback}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}