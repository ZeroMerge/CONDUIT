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
        block group relative bg-[var(--bg-primary)] border border-[var(--border)]
        hover:border-[var(--border-strong)] rounded-2xl p-5
        transition-all duration-200 press-scale
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
      "
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
          <span className="bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md truncate max-w-[80px]">
            {flow.category}
          </span>
          <TrustBadge status={flow.status} size="sm" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-secondary font-bold text-[var(--text-primary)] mb-1.5 group-hover:text-[var(--accent)] transition-colors line-clamp-1">
        {flow.title}
      </h3>
      
      <p className="text-sm text-[var(--text-secondary)] mb-5 line-clamp-2 min-h-[40px] leading-relaxed">
        {flow.description}
      </p>

      <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-0.5">Runs</p>
          <div className="flex items-center gap-1 text-[var(--text-primary)] font-semibold text-sm">
            <Zap className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {rCount}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-0.5">Done</p>
          <div className="flex items-center gap-1 text-[var(--text-primary)] font-semibold text-sm">
            <CheckCircle className="h-3.5 w-3.5 text-[var(--safe)] group-hover:block" />
            {completionRate !== null ? `${completionRate}%` : '--'}
          </div>
        </div>
        <div>
           <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-0.5">Time</p>
           <div className="flex items-center gap-1 text-[var(--text-primary)] font-semibold text-sm">
             <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {flow.estimated_minutes}m
           </div>
        </div>
      </div>

      {flow.like_count > 0 && (
         <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full border border-[var(--border)]">
           <Flame className="h-3 w-3 text-orange-500 fill-orange-500/20" /> {flow.like_count}
         </div>
      )}
    </Link>
  )
}