// src/components/activity-heatmap.tsx
'use client'

import { useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
  completions: { completed_at: string }[]
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getWeeksData(completions: { completed_at: string }[]) {
  const countMap: Record<string, number> = {}
  for (const c of completions) {
    const key = c.completed_at.split('T')[0]
    countMap[key] = (countMap[key] || 0) + 1
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 51 * 7) // 52 weeks total
  startDate.setDate(startDate.getDate() - startDate.getDay()) // Sunday

  const weeks: { date: Date; count: number; key: string }[][] = []
  let currentWeek: { date: Date; count: number; key: string }[] = []
  const cursor = new Date(startDate)

  while (cursor <= today) {
    const key = getDateKey(cursor)
    currentWeek.push({ date: new Date(cursor), count: countMap[key] || 0, key })
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return weeks
}

function getMonthLabels(weeks: { date: Date }[][]) {
  const labels: { label: string; index: number }[] = []
  let prevMonth = -1
  
  weeks.forEach((week, i) => {
    const month = week[0].date.getMonth()
    if (month !== prevMonth) {
      labels.push({
        label: week[0].date.toLocaleString('default', { month: 'short' }),
        index: i,
      })
      prevMonth = month
    }
  })
  return labels
}

const INTENSITY = [
  'bg-[var(--bg-tertiary)]',
  'bg-emerald-500/20',
  'bg-emerald-500/40',
  'bg-emerald-500/70',
  'bg-emerald-500',
]

function cellClass(count: number): string {
  if (count === 0) return INTENSITY[0]
  if (count === 1) return INTENSITY[1]
  if (count === 2) return INTENSITY[2]
  if (count === 3) return INTENSITY[3]
  return INTENSITY[4]
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function ActivityHeatmap({ completions }: ActivityHeatmapProps) {
  const weeks = useMemo(() => getWeeksData(completions), [completions])
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])
  const [viewIndex, setViewIndex] = useState(0) // 0 is most recent weeks
  const total = completions.length
  
  // Use a simpler approach for responsiveness without complex hooks
  // On desktop we show more, on mobile we show less
  const VISIBLE_WEEKS = 16 
  const maxIndex = Math.max(0, weeks.length - VISIBLE_WEEKS)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-[var(--bg-tertiary)] rounded-[8px] border border-[var(--border)] shadow-sm">
             <Calendar className="h-4 w-4 text-[var(--accent)]" />
           </div>
           <div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]">
               Activity Pulse
             </h3>
             <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
               {total} Total Signal Completions
             </p>
           </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[var(--border)] pt-4 sm:pt-0">
           <div className="flex gap-1.5">
             <button 
               onClick={() => setViewIndex(prev => Math.min(maxIndex, prev + 4))}
               disabled={viewIndex === maxIndex}
               className="p-2 hover:bg-[var(--bg-tertiary)] disabled:opacity-30 rounded-[6px] border border-[var(--border)] transition-all active:scale-90"
               title="Past Activity"
             >
               <ChevronLeft className="h-3.5 w-3.5" />
             </button>
             <button 
               onClick={() => setViewIndex(prev => Math.max(0, prev - 4))}
               disabled={viewIndex === 0}
               className="p-2 hover:bg-[var(--bg-tertiary)] disabled:opacity-30 rounded-[6px] border border-[var(--border)] transition-all active:scale-90"
               title="Recent Activity"
             >
               <ChevronRight className="h-3.5 w-3.5" />
             </button>
           </div>
        </div>
      </div>

      <div className="relative overflow-hidden pt-8 pb-4">
        <div className="overflow-x-hidden select-none">
          <div className="flex gap-2 sm:gap-3">
            {/* Y-Axis: Days */}
            <div className="flex flex-col gap-1 w-8 shrink-0 py-[1.5px]">
              {DAY_LABELS.map((day, i) => (
                <span key={i} className="h-2.5 flex items-center justify-end pr-2 text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-tighter">
                  {day}
                </span>
              ))}
            </div>

            {/* Heatmap Grid (X-axis Scrollable) */}
            <div className="relative flex-1 overflow-hidden">
              {/* Month Labels overlay */}
              <div className="absolute -top-7 left-0 w-full flex h-4 pointer-events-none">
                {monthLabels.map((m, i) => {
                  const xPos = (m.index * 14) - (viewIndex * 14)
                  // Only show if it's within a visible range (approximate)
                  if (xPos < -50 || xPos > 800) return null
                  return (
                    <span 
                      key={i} 
                      className="text-[10px] font-black text-[var(--accent)] absolute uppercase tracking-[0.15em] transition-all duration-700 ease-out z-20 group/month cursor-default select-none"
                      style={{ 
                        left: `${xPos}px`, 
                        opacity: xPos < 0 ? 0 : 0.8,
                        transform: `translateX(${xPos < 0 ? -10 : 0}px)`
                      }}
                    >
                      <span className="group-hover/month:text-white transition-colors">{m.label}</span>
                      <div className="h-[2px] w-4 bg-[var(--accent)] mt-0.5 opacity-40 group-hover/month:w-full group-hover/month:opacity-100 transition-all duration-500" />
                    </span>
                  )
                })}
              </div>

              {/* The Actual Grid */}
              <div 
                className="flex gap-1 transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
                style={{ transform: `translateX(-${viewIndex * 14}px)` }}
              >
                {weeks.map((week, wi) => {
                  const month = week[0].date.getMonth()
                  const isMonthStart = wi > 0 && weeks[wi-1][0].date.getMonth() !== month
                  
                  return (
                    <div 
                      key={wi} 
                      className={cn(
                        "flex flex-col gap-1 shrink-0 transition-opacity duration-300",
                        isMonthStart && "pl-1 border-l border-[var(--border)]/30"
                      )}
                    >
                      {week.map((day) => (
                        <div
                          key={day.key}
                          title={`${day.key}: ${day.count} completion${day.count !== 1 ? 's' : ''}`}
                          className={cn(
                            "w-2.5 h-2.5 rounded-[2px] transition-all duration-300 cursor-crosshair border border-black/5 dark:border-white/5 hover:ring-2 hover:ring-[var(--accent)] hover:z-10 hover:scale-125 shadow-sm",
                            cellClass(day.count)
                          )}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div className="space-y-6 pt-6 border-t border-[var(--border)]/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Jump to Month</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {monthLabels.map((m, i) => (
              <button
                key={i}
                onClick={() => setViewIndex(m.index)}
                className={cn(
                  "px-3 py-1.5 rounded-[6px] border text-[9px] font-black uppercase tracking-[0.1em] transition-all active:scale-95",
                  Math.abs(viewIndex - m.index) < 2
                    ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20"
                    : "bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Year Filter</span>
            <div className="flex gap-2">
              {['2026', '2025'].map(year => (
                <button 
                  key={year} 
                  className={cn(
                    "px-4 py-1.5 rounded-[6px] border text-[9px] font-black uppercase tracking-[0.15em] transition-all active:scale-95",
                    year === '2026' 
                      ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]" 
                      : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--text-secondary)]"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-[var(--bg-tertiary)]/50 px-4 py-2 rounded-[6px] border border-[var(--border)] shadow-inner">
            <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mr-2">Signal Intensity</span>
            <div className="flex gap-1.5">
              {INTENSITY.map((cls, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-[1.5px] border border-black/10 dark:border-white/10 shadow-sm", cls)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
