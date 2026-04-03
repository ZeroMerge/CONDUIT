"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { AuthModal } from '@/components/auth-modal'
import { ResponsiveContainer } from '@/components/ui/responsive-container'
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar'
import { toast } from 'sonner'
import { Wand2, AlertTriangle, Plus, Trash2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

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
    description: 'No system limits or destructive operations',
  },
  {
    value: 'caution',
    label: 'Caution',
    description: 'May require API keys or external hooks',
  },
  {
    value: 'risky',
    label: 'Risky',
    description: 'Touches filesystem or uses privileged scopes',
  },
]

export default function CreateFlowPage() {
  const router = useRouter()
  const { profile } = useUserStore()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [phase, setPhase] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setPhase(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    setIsSubmitting(true)

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
      setIsSubmitting(false)
    }
  }

  if (!profile) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          router.push('/')
        }}
        trigger="create"
      />
    )
  }

  const inputClass = "w-full flex rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-3 text-sm md:text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
  
  return (
    <ResponsiveContainer>
      <div className="max-w-[720px] mx-auto py-8 md:py-12 px-4 pb-32">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-10 fade-in animate-fade-down">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${phase >= 1 ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20' : 'border border-[var(--border)] text-[var(--text-tertiary)]'}`}>
              <span className="font-bold text-sm">1</span>
            </div>
            <span className={`text-xs font-semibold ${phase >= 1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Details</span>
          </div>
          <div className="w-16 h-px bg-[var(--border)] mb-6" />
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${phase >= 2 ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20' : 'border border-[var(--border)] text-[var(--text-tertiary)] bg-[var(--bg-secondary)]'}`}>
              <span className="font-bold text-sm">2</span>
            </div>
            <span className={`text-xs font-semibold ${phase >= 2 ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>Steps</span>
          </div>
        </div>

        {phase === 1 ? (
          <div className="space-y-8 fade-in animate-fade-up">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Flow Title
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
                className={inputClass}
                placeholder="e.g. Build a Web3 React App from Scratch"
              />
              {errors.title && (
                <p className="text-sm font-medium text-[var(--risky)] mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Short Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Describe what this flow helps users build in 1-2 sentences..."
              />
              {errors.description && (
                <p className="text-sm font-medium text-[var(--risky)] mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                README / Documentation <span className="text-[var(--text-tertiary)] text-xs font-normal relative -top-0.5 ml-1 px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded">MARKDOWN SUPPORTED</span>
              </label>
              <textarea
                value={readme}
                onChange={(e) => setReadme(e.target.value)}
                rows={6}
                className={`${inputClass} font-geist-mono resize-none text-[13px]`}
                placeholder="# Architecture&#10;- Relies on Next.js 14&#10;- Ensure Docker is installed"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="flow-categories"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Next.js, General..."
                  />
                  <datalist id="flow-categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                {errors.category && (
                  <p className="text-sm font-medium text-[var(--risky)] mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Estimated Minutes
                </label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 30)}
                  className={inputClass}
                />
                {errors.estimatedMinutes && (
                  <p className="text-sm font-medium text-[var(--risky)] mt-1">{errors.estimatedMinutes}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                Execution Safety Level
              </label>
              <div className="grid md:grid-cols-3 gap-3">
                {safetyOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col gap-1 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${safetyLevel === option.value
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm shadow-[var(--accent)]/10'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-primary)]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="safety"
                        value={option.value}
                        checked={safetyLevel === option.value}
                        onChange={() => setSafetyLevel(option.value as typeof safetyLevel)}
                        className="hidden"
                      />
                      {safetyLevel === option.value ? (
                        <div className="w-4 h-4 rounded-full border-4 border-[var(--accent)] bg-white" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[var(--text-tertiary)]" />
                      )}
                      <p className={`text-sm font-bold ${safetyLevel === option.value ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                        {option.label}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] pl-6 leading-relaxed">
                      {option.description}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            <div className="hidden md:block pt-4 text-right">
              <button
                onClick={handleContinue}
                className="inline-flex items-center gap-2 justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold px-8 h-12 rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent)]/10 press-scale"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <StickyBottomBar className="md:hidden">
              <button
                onClick={handleContinue}
                className="w-full inline-flex items-center gap-2 justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent)]/10 press-scale"
              >
                Continue Setup <ArrowRight className="w-4 h-4" />
              </button>
            </StickyBottomBar>
          </div>
        ) : (
          <div className="space-y-6 fade-in animate-fade-left">
            <div className="overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-[var(--accent)]/40 to-transparent shadow-lg shadow-[var(--accent)]/5 mb-8">
              <div className="bg-[var(--bg-primary)] rounded-[15px] p-5">
                 <div className="flex items-start gap-3">
                   <div className="bg-[var(--accent)]/10 p-2 rounded-lg text-[var(--accent)]">
                      <Wand2 className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Markdown is your superpower</h3>
                     <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                       Instructions and Expected Outcomes fully support Markdown. Use `**bold**`, `*italics*`, logic lists, and inline code `\`formatting\`` to engineer a beautiful flow.
                     </p>
                   </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="relative bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm">
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border-strong)] flex items-center justify-center font-black text-[var(--text-primary)] text-sm shadow-sm">
                    {index + 1}
                  </div>

                  <div className="flex items-center justify-between mb-6 pl-4">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                       Step Definition
                    </h3>
                    {steps.length > 2 && (
                      <button
                        onClick={() => handleRemoveStep(index)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--risky)] hover:bg-[var(--risky)]/10 rounded-lg transition-colors duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Title</label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Scaffold the monorepo"
                      />
                      {errors[`step${index}title`] && (
                        <p className="text-xs font-medium text-[var(--risky)] mt-1">{errors[`step${index}title`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                        Instruction
                      </label>
                      <textarea
                        value={step.instruction}
                        onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                        rows={3}
                        className={`${inputClass} resize-y text-sm font-geist-mono`}
                        placeholder="Use **Markdown** to format instructions for the human executing this step..."
                      />
                      {errors[`step${index}instruction`] && (
                        <p className="text-xs font-medium text-[var(--risky)] mt-1">{errors[`step${index}instruction`]}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] border-dashed">
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-2">
                        Prompt Payload
                        <span className="bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Copied to IDE</span>
                      </label>
                      <textarea
                        value={step.prompt}
                        onChange={(e) => handleStepChange(index, 'prompt', e.target.value)}
                        rows={4}
                        className={`${inputClass} resize-y bg-[var(--bg-primary)] font-geist-mono text-[13px] border-[var(--border-strong)]`}
                        placeholder="The exact prompt the user will copy and paste into their AI environment..."
                      />
                      {errors[`step${index}prompt`] && (
                        <p className="text-xs font-medium text-[var(--risky)] mt-1">{errors[`step${index}prompt`]}</p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                          Expected Outcome
                        </label>
                        <textarea
                          value={step.expectedOutcome}
                          onChange={(e) => handleStepChange(index, 'expectedOutcome', e.target.value)}
                          rows={3}
                          className={`${inputClass} resize-none font-geist-mono text-sm`}
                          placeholder="What verifies this step is complete?"
                        />
                         {errors[`step${index}outcome`] && (
                          <p className="text-xs font-medium text-[var(--risky)] mt-1">{errors[`step${index}outcome`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5 flex items-center justify-between">
                           Example Output 
                           <span className="text-[10px] text-[var(--text-tertiary)] uppercase">(Optional)</span>
                        </label>
                        <textarea
                          value={step.exampleOutput}
                          onChange={(e) => handleStepChange(index, 'exampleOutput', e.target.value)}
                          rows={3}
                          className={`${inputClass} resize-none font-geist-mono text-sm`}
                          placeholder="Shown as a code snippet reference"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddStep}
              className="w-full flex items-center justify-center gap-2 bg-transparent border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 text-[var(--text-primary)] text-sm font-bold h-14 rounded-2xl transition-all duration-200 press-scale mt-6"
            >
              <Plus className="w-5 h-5" /> Append Step
            </button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4 pt-12 border-t border-[var(--border)] mt-12 justify-between">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-bold h-12 px-6 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" /> Back Details
              </button>
              
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold px-8 h-12 rounded-xl transition-all duration-200 shadow-lg shadow-[var(--accent)]/20 press-scale disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isSubmitting ? 'Publishing...' : 'Publish Flow \u2192'}
              </button>
            </div>

            {/* Mobile Actions */}
            <StickyBottomBar className="md:hidden flex gap-3">
               <button
                onClick={handleBack}
                className="flex-[0.5] inline-flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] h-12 rounded-xl text-sm font-bold press-scale"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-white h-12 rounded-xl text-sm font-bold shadow-md shadow-[var(--accent)]/20 press-scale disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isSubmitting ? 'Publishing...' : 'Publish Flow'}
              </button>
            </StickyBottomBar>

          </div>
        )}
      </div>
    </ResponsiveContainer>
  )
}