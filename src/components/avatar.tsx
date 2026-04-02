"use client"

import { avatarUrl } from '@/lib/avatar'
import { BadgeCheck } from 'lucide-react'

interface AvatarProps {
  seed: string
  size?: number
  verified?: boolean
}

export function Avatar({ seed, size = 32, verified = false }: AvatarProps) {
  return (
    <div className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <div 
        className={`w-full h-full rounded-full overflow-hidden border bg-[var(--bg-tertiary)] p-[1px] transition-all duration-300 ${
          verified 
          ? 'border-[var(--verified)] shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
          : 'border-[var(--border)]'
        }`}
      >
        <img
          src={avatarUrl(seed)}
          alt="Avatar"
          width={size}
          height={size}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      {verified && (
        <div 
          className="absolute -bottom-1 -right-1 bg-[var(--verified)] text-white rounded-full flex items-center justify-center p-0.5 shadow-lg border-[2px] border-[var(--bg-primary)]"
          style={{ width: Math.max(14, size * 0.4), height: Math.max(14, size * 0.4) }}
        >
          <BadgeCheck className="w-full h-full" strokeWidth={3} />
        </div>
      )}
    </div>
  )
}
