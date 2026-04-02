"use client"

import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface TrustBadgeProps {
  status: 'verified' | 'unverified' | 'pending'
  size?: 'sm' | 'md'
}

export function TrustBadge({ status, size = 'md' }: TrustBadgeProps) {
  const config = {
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
      icon: AlertCircle,
      text: 'Unverified',
      className: 'text-[var(--unverified)] border-[var(--border)]',
    },
  }

  const { icon: Icon, text, className } = config[status]
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-medium ${padding} rounded border ${className}`}>
      <Icon className={iconSize} />
      {text}
    </span>
  )
}
