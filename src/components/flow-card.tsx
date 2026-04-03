import Link from 'next/link'
import { Flame, Zap, CheckCircle, Clock } from 'lucide-react'
import { TrustBadge } from './trust-badge'
import type { Flow } from '@/types'

interface FlowCardProps {
  flow: Flow
}

export function FlowCard({ flow }: FlowCardProps) {
  // Defensive checks to ensure completion_count and run_count are safe to divide
  const cCount = flow.completion_count || 0;
  const rCount = flow.run_count || 0;
  
  const completionRate = rCount > 0 ? Math.round((cCount / rCount) * 100) : null;

  return (
    <Link 
      href={`/flow/${flow.id}`}
      className="
        block group relative bg-[var(--bg-primary)]
        rounded-2xl p-5 md:p-6
        transition-all duration-300 ease-out
        border border-[var(--border)]
        shadow-sm shadow-black/[0.02]
        hover:border-[var(--border-strong)]
        hover:bg-[var(--bg-secondary)]/50
        hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]
        hover:-translate-y-1
        overflow-hidden
      "
    >
      {/* Premium Top Glow Highlight */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-2 max-w-full overflow-hidden">
          <span className="bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md truncate max-w-[100px] shadow-sm">
            {flow.category}
          </span>
          <TrustBadge status={flow.status} size="sm" />
        </div>
      </div>

      <h3 className="text-lg md:text-xl font-geist font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-1">
        {flow.title}
      </h3>
      
      <p className="text-sm md:text-[15px] text-[var(--text-secondary)] mb-6 line-clamp-2 min-h-[44px] leading-relaxed">
        {flow.description}
      </p>

      {/* Metrics Footer */}
      <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4 mt-auto">
        <div>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1">
            <Zap className="h-3 w-3" /> Runs
          </div>
          <div className="text-[var(--text-primary)] font-semibold text-sm">
            {rCount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1">
            <CheckCircle className="h-3 w-3" /> Done
          </div>
          <div className="text-[var(--text-primary)] font-semibold text-sm">
            {completionRate !== null ? `${completionRate}%` : '--'}
          </div>
        </div>
        <div>
           <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1">
             <Clock className="h-3 w-3" /> Time
           </div>
           <div className="text-[var(--text-primary)] font-semibold text-sm">
             {flow.estimated_minutes}m
           </div>
        </div>
      </div>

      {flow.like_count > 0 && (
         <div className="absolute top-5 right-5 flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--border)] shadow-sm">
           <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/20" /> {flow.like_count}
         </div>
      )}
    </Link>
  )
}