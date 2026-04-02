'use client'

import { useState } from 'react'
import { GitPullRequest } from 'lucide-react'
import { CreatePrModal } from './create-pr-modal'

export function SubmitPrButton({ parentFlowId, forkFlowId }: { parentFlowId: string, forkFlowId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-medium px-4 py-3 rounded transition-colors duration-150"
      >
        <GitPullRequest className="w-4 h-4" />
        Submit PR
      </button>

      {isOpen && (
        <CreatePrModal
          parentFlowId={parentFlowId}
          forkFlowId={forkFlowId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
