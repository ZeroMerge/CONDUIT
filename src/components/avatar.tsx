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
        className={`w-full h-full rounded-md overflow-hidden border bg-[var(--bg-secondary)] transition-all duration-300 ${
          verified 
          ? 'border-[var(--accent)]' 
          : 'border-[#1a1a1a]'
        }`}
      >
        <img
          src={avatarUrl(seed)}
          alt="Avatar"
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
      {verified && (
        <div 
          className="absolute -top-1 -right-1 bg-[var(--bg-primary)] text-[var(--accent)] rounded-full flex items-center justify-center p-0.5 border border-[var(--border)]"
          style={{ width: 14, height: 14 }}
        >
          <BadgeCheck className="w-full h-full" strokeWidth={3} />
        </div>
      )}
    </div>
  )
}
