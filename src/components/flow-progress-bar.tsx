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
  const progress         = ((currentStep + 1) / totalSteps) * 100
  const remainingMinutes = Math.round((estimatedMinutes * (totalSteps - currentStep - 1)) / totalSteps)
  const MAX_DOTS         = 14 // max dots before we show "+N"

  return (
    <div className="sticky z-[30] bg-[var(--bg-primary)]/95 border-b border-[var(--border)] glass" style={{ top: 'var(--nav-height)' }}>

      {/* Thin accent progress line — always visible */}
      <div className="h-0.5 w-full bg-[var(--bg-tertiary)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress details row */}
      <div className="page-container max-w-[720px] py-2.5 flex items-center justify-between gap-3">

        {/* Left: flow title (hidden on very small screens) + est. time */}
        <div className="flex-1 min-w-0 hidden xs:block">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">
            {flowTitle}
          </p>
          {remainingMinutes > 0 && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
              ~{remainingMinutes} min left
            </p>
          )}
        </div>

        {/* Centre: dot indicators */}
        <div className="flex items-center gap-[5px] flex-shrink-0 mx-auto xs:mx-0">
          {Array.from({ length: Math.min(totalSteps, MAX_DOTS) }).map((_, i) => {
            const done    = i < currentStep
            const current = i === currentStep
            return (
              <span
                key={i}
                className={`
                  rounded-full transition-all duration-300
                  ${done    ? 'w-[7px] h-[7px] bg-[var(--accent)]' : ''}
                  ${current ? 'w-[10px] h-[10px] bg-[var(--accent)] ring-2 ring-[var(--accent)]/30' : ''}
                  ${!done && !current ? 'w-[6px] h-[6px] bg-[var(--bg-tertiary)]' : ''}
                `}
              />
            )
          })}
          {totalSteps > MAX_DOTS && (
            <span className="text-[10px] text-[var(--text-tertiary)] ml-1 font-medium">
              +{totalSteps - MAX_DOTS}
            </span>
          )}
        </div>

        {/* Right: step counter */}
        <div className="flex items-center gap-1 flex-shrink-0 text-xs">
          <span className="font-bold text-[var(--text-primary)]">{currentStep + 1}</span>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-tertiary)]">{totalSteps}</span>
        </div>
      </div>
    </div>
  )
}
