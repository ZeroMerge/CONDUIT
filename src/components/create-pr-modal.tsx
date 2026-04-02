'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMergeRequest } from '@/app/actions/merge-requests'
import { toast } from 'sonner'
import { X, GitPullRequest } from 'lucide-react'

interface CreatePrModalProps {
  parentFlowId: string
  forkFlowId: string
  onClose: () => void
}

export function CreatePrModal({ parentFlowId, forkFlowId, onClose }: CreatePrModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return toast.error('Title is required')

    setSubmitting(true)
    try {
      await createMergeRequest(parentFlowId, forkFlowId, title, description)
      toast.success('Pull request created!')
      router.push(`/flow/${parentFlowId}`)
      onClose()
    } catch (error) {
       toast.error(error instanceof Error ? error.message : 'Failed to create PR')
    } finally {
       setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Submit Pull Request</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-secondary)] rounded-md text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded md:p-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Brief description of your changes..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded md:p-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[100px]"
              placeholder="Explain why you made these changes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-6 py-2 rounded transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit PR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
