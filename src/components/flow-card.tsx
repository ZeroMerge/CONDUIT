"use client"

import Link from 'next/link'
import { CheckCircle, Clock, GitFork } from 'lucide-react'
import type { Flow, Profile } from '@/types'

interface FlowCardProps {
  flow: Flow & { creator?: Profile | null }
}

export function FlowCard({ flow }: FlowCardProps) {
  const completionRate = flow.run_count > 0
    ? Math.round((flow.completion_count / flow.run_count) * 100)
    : null

  const safetyColors = {
    safe: 'bg-[var(--safe)]',
    caution: 'bg-[var(--caution)]',
    risky: 'bg-[var(--risky)]',
  }

  const statusConfig = {
    verified: {
      icon: CheckCircle,
      text: 'Verified',
      className: 'text-[var(--verified)] border-[var(--accent-border)]',
    },
    pending: {
      icon: Clock,
      text: 'Pending',
      className: 'text-[var(--pending)] border-amber-200',
    },
    unverified: {
      icon: Clock,
      text: 'Unverified',
      className: 'text-[var(--unverified)] border-[var(--border)]',
    },
  }

  const StatusIcon = statusConfig[flow.status].icon

  return (
    <Link
      href={`/flow/${flow.id}`}
      className="block bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-5 hover:border-[var(--border-strong)] transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-2 py-0.5 rounded">
          {flow.category}
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${safetyColors[flow.safety_status]}`} />
          <span className="text-[var(--text-secondary)] capitalize">{flow.safety_status}</span>
        </div>
      </div>

      <h3 className="font-geist font-semibold text-base text-[var(--text-primary)] mt-3 line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
        {flow.title}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-1">
        {flow.description}
      </p>

      <div className="border-t border-[var(--border)] my-4" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span>~{flow.estimated_minutes}min</span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" /> {flow.fork_count || 0}
          </span>
          <span>{completionRate !== null ? `${completionRate}%` : '—%'} done</span>
        </div>

        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${statusConfig[flow.status].className}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig[flow.status].text}
        </span>
      </div>
    </Link>
  )
}