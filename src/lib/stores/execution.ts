"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ExecutionStore {
  flowId: string | null
  currentStepIndex: number
  editedPrompts: Record<number, string>
  validationSummaries: Record<number, string>
  completedSteps: number[]
  skippedSteps: number[]
  runCounted: boolean
  setFlowId: (id: string) => void
  setCurrentStep: (index: number) => void
  setEditedPrompt: (index: number, prompt: string) => void
  setValidationSummary: (index: number, summary: string) => void
  markStepComplete: (index: number) => void
  skipStep: (index: number) => void
  setRunCounted: (val: boolean) => void
  reset: () => void
}

export const useExecutionStore = create<ExecutionStore>()(
  persist(
    (set) => ({
      flowId: null,
      currentStepIndex: 0,
      editedPrompts: {},
      validationSummaries: {},
      completedSteps: [],
      skippedSteps: [],
      runCounted: false,
      setFlowId: (id) => set({ flowId: id }),
      setCurrentStep: (index) => set({ currentStepIndex: index }),
      setEditedPrompt: (index, prompt) =>
        set((s) => ({ editedPrompts: { ...s.editedPrompts, [index]: prompt } })),
      setValidationSummary: (index, summary) =>
        set((s) => ({ validationSummaries: { ...s.validationSummaries, [index]: summary } })),
      markStepComplete: (index) =>
        set((s) => ({ completedSteps: [...s.completedSteps, index] })),
      skipStep: (index) =>
        set((s) => ({ skippedSteps: [...s.skippedSteps, index] })),
      setRunCounted: (val) => set({ runCounted: val }),
      reset: () => set({
        flowId: null,
        currentStepIndex: 0,
        editedPrompts: {},
        validationSummaries: {},
        completedSteps: [],
        skippedSteps: [],
        runCounted: false
      }),
    }),
    { name: 'conduit-execution' }
  )
)
