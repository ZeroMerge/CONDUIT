// src/app/create/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { AuthModal } from '@/components/auth-modal'
import { toast } from 'sonner'

interface FlowStep {
  title: string
  instruction: string
  prompt: string
  expectedOutcome: string
  exampleOutput: string
}

const initialStep: FlowStep = {
  title: '',
  instruction: '',
  prompt: '',
  expectedOutcome: '',
  exampleOutput: '',
}

const categories = [
  'React',
  'Python',
  'Automation',
  'AI Agents',
  'APIs',
  'Data',
  'Other',
]

const safetyOptions = [
  {
    value: 'safe',
    label: 'Safe',
    description: 'No system access, no credentials, no destructive operations',
  },
  {
    value: 'caution',
    label: 'Caution',
    description: 'May require API keys or external service access',
  },
  {
    value: 'risky',
    label: 'Risky',
    description: 'Involves system commands, file system, or security-sensitive operations',
  },
]

export default function CreateFlowPage() {
  const router = useRouter()
  const { profile } = useUserStore()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [phase, setPhase] = useState<1 | 2>(1)

  // Phase 1 fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [readme, setReadme] = useState('')
  const [category, setCategory] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [safetyLevel, setSafetyLevel] = useState<'safe' | 'caution' | 'risky'>('safe')

  // Phase 2 fields
  const [steps, setSteps] = useState<FlowStep[]>([
    { ...initialStep },
    { ...initialStep },
  ])

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!profile) {
      setShowAuthModal(true)
    }
  }, [profile])

  const validatePhase1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!category) {
      newErrors.category = 'Category is required'
    }
    if (estimatedMinutes < 5 || estimatedMinutes > 480) {
      newErrors.estimatedMinutes = 'Must be between 5 and 480 minutes'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePhase2 = (): boolean => {
    const newErrors: Record<string, string> = {}

    steps.forEach((step, index) => {
      if (!step.title.trim()) {
        newErrors[`step${index}title`] = `Step ${index + 1} title is required`
      }
      if (!step.instruction.trim()) {
        newErrors[`step${index}instruction`] = `Step ${index + 1} instruction is required`
      }
      if (!step.prompt.trim()) {
        newErrors[`step${index}prompt`] = `Step ${index + 1} prompt is required`
      }
      if (!step.expectedOutcome.trim()) {
        newErrors[`step${index}outcome`] = `Step ${index + 1} expected outcome is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validatePhase1()) {
      setPhase(2)
    }
  }

  const handleBack = () => {
    setPhase(1)
  }

  const handleAddStep = () => {
    setSteps([...steps, { ...initialStep }])
  }

  const handleRemoveStep = (index: number) => {
    if (steps.length > 2) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const handleStepChange = (index: number, field: keyof FlowStep, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const handlePublish = async () => {
    if (!validatePhase2() || !profile) return

    try {
      // Insert flow
      const { data: flow, error: flowError } = await supabase
        .from('flows')
        .insert({
          title: title.trim(),
          description: description.trim(),
          readme_markdown: readme.trim() || null,
          category,
          estimated_minutes: estimatedMinutes,
          creator_id: profile.id,
          status: 'unverified',
          safety_status: safetyLevel,
        })
        .select()
        .single()

      if (flowError) throw flowError

      // Insert steps
      const stepsData = steps.map((step, index) => ({
        flow_id: flow.id,
        order_index: index,
        title: step.title.trim(),
        instruction: step.instruction.trim(),
        prompt_text: step.prompt.trim(),
        expected_outcome: step.expectedOutcome.trim(),
        example_output: step.exampleOutput.trim() || null,
      }))

      const { error: stepsError } = await supabase.from('steps').insert(stepsData)

      if (stepsError) throw stepsError

      toast.success("Flow published. It'll be reviewed for verification within 2–3 days.")
      router.push(`/flow/${flow.id}`)
    } catch {
      toast.error('Failed to publish flow')
    }
  }

  if (!profile) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        trigger="create"
      />
    )
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${phase >= 1 ? 'bg-[var(--accent)]' : 'border border-[var(--border)]'}`} />
          <span className="text-sm text-[var(--text-secondary)]">Flow details</span>
        </div>
        <div className="w-8 h-px bg-[var(--border)]" />
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${phase >= 2 ? 'bg-[var(--accent)]' : 'border border-[var(--border)]'}`} />
          <span className="text-sm text-[var(--text-secondary)]">Add steps</span>
        </div>
      </div>

      <p className="text-xs text-[var(--text-tertiary)] text-center mb-8">
        Phase {phase} of 2
      </p>

      {phase === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (!title.trim()) {
                  setErrors({ ...errors, title: 'Title is required' })
                } else {
                  setErrors({ ...errors, title: '' })
                }
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] transition-colors duration-150"
              placeholder="e.g. Build a React Todo App"
            />
            {errors.title && (
              <p className="text-sm text-[var(--risky)] mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] resize-none transition-colors duration-150"
              placeholder="Describe what this flow helps users build..."
            />
            {errors.description && (
              <p className="text-sm text-[var(--risky)] mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              README / Documentation <span className="text-[var(--text-tertiary)] text-xs font-normal">(Optional, Markdown supported)</span>
            </label>
            <textarea
              value={readme}
              onChange={(e) => setReadme(e.target.value)}
              rows={8}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] resize-none transition-colors duration-150"
              placeholder="Explain how this workflow works, dependencies, architectural decisions, prerequisites... Use Markdown for styling."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Category
            </label>
            <div className="relative">
              <input
                type="text"
                list="flow-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] transition-colors duration-150"
                placeholder="Select or type a new category (e.g. Web3, Design, AI)..."
              />
              <datalist id="flow-categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-widest font-bold">
              Tip: New categories will automatically create a filter button on the home page.
            </p>
            {errors.category && (
              <p className="text-sm text-[var(--risky)] mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Estimated minutes
            </label>
            <input
              type="number"
              min={5}
              max={480}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 30)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] transition-colors duration-150"
            />
            {errors.estimatedMinutes && (
              <p className="text-sm text-[var(--risky)] mt-1">{errors.estimatedMinutes}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Safety level
            </label>
            <div className="space-y-2">
              {safetyOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors duration-150 ${safetyLevel === option.value
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                >
                  <input
                    type="radio"
                    name="safety"
                    value={option.value}
                    checked={safetyLevel === option.value}
                    onChange={() => setSafetyLevel(option.value as typeof safetyLevel)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {option.label}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-2 rounded transition-colors duration-150"
          >
            Continue to steps &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded p-4 mb-6">
            <p className="text-sm text-[var(--accent-text)]">
              💡 <strong>Pro Tip:</strong> Instructions and Expected Outcomes fully support <strong>Markdown</strong>. You can use `**bold**`, `*italics*`, lists, and `\`inline code\`` to format your flow beautifully!
            </p>
          </div>

          {steps.map((step, index) => (
            <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">
                  Step {index + 1}
                </h3>
                {steps.length > 2 && (
                  <button
                    onClick={() => handleRemoveStep(index)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--risky)] transition-colors duration-150"
                  >
                    Remove step
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] transition-colors duration-150"
                    placeholder="e.g. Scaffold the project"
                  />
                  {errors[`step${index}title`] && (
                    <p className="text-sm text-[var(--risky)] mt-1">{errors[`step${index}title`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Instruction <span className="text-[var(--text-tertiary)] text-xs">(Markdown supported)</span>
                  </label>
                  <textarea
                    value={step.instruction}
                    onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] resize-none transition-colors duration-150"
                    placeholder="Use **Markdown** to format your instructions, add lists, or bold text..."
                  />
                  {errors[`step${index}instruction`] && (
                    <p className="text-sm text-[var(--risky)] mt-1">{errors[`step${index}instruction`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Prompt
                  </label>
                  <textarea
                    value={step.prompt}
                    onChange={(e) => handleStepChange(index, 'prompt', e.target.value)}
                    rows={4}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm font-geist-mono text-[var(--text-primary)] resize-none transition-colors duration-150"
                    placeholder="The exact prompt to send to an AI tool"
                  />
                  {errors[`step${index}prompt`] && (
                    <p className="text-sm text-[var(--risky)] mt-1">{errors[`step${index}prompt`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Expected outcome <span className="text-[var(--text-tertiary)] text-xs">(Markdown supported)</span>
                  </label>
                  <textarea
                    value={step.expectedOutcome}
                    onChange={(e) => handleStepChange(index, 'expectedOutcome', e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] resize-none transition-colors duration-150"
                    placeholder="What should the user see? Use **Markdown** to format this clearly."
                  />
                  {errors[`step${index}outcome`] && (
                    <p className="text-sm text-[var(--risky)] mt-1">{errors[`step${index}outcome`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Example output (optional)
                  </label>
                  <textarea
                    value={step.exampleOutput}
                    onChange={(e) => handleStepChange(index, 'exampleOutput', e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm font-geist-mono text-[var(--text-primary)] resize-none transition-colors duration-150"
                    placeholder="Shown as a code block"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddStep}
            className="w-full bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium py-2 rounded transition-colors duration-150"
          >
            + Add another step
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium py-2 rounded transition-colors duration-150"
            >
              &larr; Back to details
            </button>
            <button
              onClick={handlePublish}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-2 rounded transition-colors duration-150"
            >
              Publish flow &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}