"use client"

interface FlowProgressBarProps {
  flowTitle: string
  currentStep: number
  totalSteps: number
  estimatedMinutes: number
}

export function FlowProgressBar({
  flowTitle,
  currentStep,
  totalSteps,
  estimatedMinutes,
}: FlowProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100
  const remainingMinutes = Math.round(
    (estimatedMinutes * (totalSteps - currentStep - 1)) / totalSteps
  )

  return (
    <div className="sticky top-14 z-40 bg-[var(--bg-primary)] border-b border-[var(--border)] py-3">
      <div className="max-w-[720px] mx-auto px-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-[300px]">
            {flowTitle}
          </span>
          <span className="text-[var(--text-secondary)]">
            Step {currentStep + 1} of {totalSteps}
            {remainingMinutes > 0 && ` &middot; ~${remainingMinutes} min remaining`}
          </span>
        </div>
        <div className="h-0.5 w-full bg-[var(--border)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
