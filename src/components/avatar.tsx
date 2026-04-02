// src/components/avatar.tsx
import { avatarUrl } from '@/lib/avatar'
import { CheckCircle2 } from 'lucide-react'

interface AvatarProps {
  seed: string
  size?: number
  verified?: boolean
  backgroundColor?: string
}

export function Avatar({ seed, size = 40, verified = false, backgroundColor = 'transparent' }: AvatarProps) {
  return (
    <div className="relative inline-block flex-shrink-0" style={{ width: size, height: size }}>
      <img
        src={avatarUrl(seed, backgroundColor === 'transparent' ? undefined : backgroundColor)}
        alt="Avatar"
        className="rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)]"
        width={size}
        height={size}
      />
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-[#0a0a0a] rounded-full p-0.5 shadow-sm ring-1 ring-[#e2e2e2] dark:ring-[#222222]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)] fill-[var(--accent)] text-white" />
        </div>
      )}
    </div>
  )
}
