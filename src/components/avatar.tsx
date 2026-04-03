"use client"

import { avatarUrl } from '@/lib/avatar'
import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  seed: string
  size?: number
  verified?: boolean
  bg_color?: string | null
  className?: string
}

export function Avatar({ seed, size = 32, verified = false, bg_color = 'transparent', className }: AvatarProps) {
  return (
    <div 
      className={cn("relative inline-flex flex-shrink-0 group overflow-visible", className)} 
      style={{ 
        width: className?.includes('w-') ? undefined : size, 
        height: className?.includes('h-') ? undefined : size 
      }}
    >
      <div 
        className={cn(
          "w-full h-full rounded-full overflow-hidden transition-all duration-500 flex items-center justify-center",
          verified && "ring-2 ring-[var(--verified)] ring-offset-2 ring-offset-[var(--bg-primary)] shadow-lg shadow-[var(--verified)]/10"
        )}
        style={{ backgroundColor: bg_color || 'transparent' }}
      >
        <img
          src={avatarUrl(seed, bg_color)}
          alt="Avatar"
          width={size}
          height={size}
          className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      {verified && (
        <div 
          className="absolute -bottom-1 -right-1 bg-[var(--verified)] text-white rounded-full flex items-center justify-center p-0.5 shadow-xl border-[3px] border-[var(--bg-primary)] z-20"
          style={{ width: Math.max(16, size * 0.35), height: Math.max(16, size * 0.35) }}
        >
          <BadgeCheck className="w-full h-full" strokeWidth={3} />
        </div>
      )}
    </div>
  )
}
