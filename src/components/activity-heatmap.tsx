// src/components/activity-heatmap.tsx
'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'

interface ActivityHeatmapProps {
  completions: { completed_at: string }[]
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getWeeksData(completions: { completed_at: string }[]) {
  // Build a map of date → count
  const countMap: Record<string, number> = {}
  for (const c of completions) {
    const key = c.completed_at.split('T')[0]
    countMap[key] = (countMap[key] || 0) + 1
  }

  // Build 52 weeks of dates ending today
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 52 * 7)
  startDate.setDate(startDate.getDate() - startDate.getDay()) // Roll to Sunday

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
  'bg-[var(--bg-tertiary)]',              // 0 — empty
  'bg-emerald-500/20',                   // 1
  'bg-emerald-500/40',                   // 2
  'bg-emerald-500/70',                   // 3+
  'bg-emerald-500',                      // 4+
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
  const total = completions.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] flex items-center gap-2">
           <Calendar className="h-3.5 w-3.5" />
           Activity Pulse
        </h3>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">{total} Total</span>
      </div>

      <div className="relative group">
        <div className="overflow-x-auto scrollbar-hide select-none">
          <div className="inline-block min-w-full">
            
            {/* Month Labels aligned to grid */}
            <div className="flex h-4 mb-2 ml-7 relative">
              {monthLabels.map((m, i) => (
                <span 
                  key={i} 
                  className="text-[9px] font-bold text-[var(--text-tertiary)] absolute uppercase tracking-tighter"
                  style={{ left: `${m.index * 13}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Main Grid */}
            <div className="flex gap-1">
              {/* Y-Axis: Days */}
              <div className="flex flex-col gap-[3px] w-6 shrink-0 pt-[2px]">
                {DAY_LABELS.map((day, i) => (
                  <span key={i} className="text-[8px] font-bold text-[var(--text-tertiary)] h-2.5 leading-[10px] uppercase">
                    {day}
                  </span>
                ))}
              </div>

              {/* X-Axis: Weeks */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day) => (
                      <div
                        key={day.key}
                        title={`${day.key}: ${day.count} completion${day.count !== 1 ? 's' : ''}`}
                        className={`w-2.5 h-2.5 rounded-[1px] transition-all duration-200 cursor-crosshair border border-black/5 dark:border-white/5 ${cellClass(day.count)} hover:ring-1 hover:ring-[var(--accent)] hover:scale-110 z-10`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tactile Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter">Quiet</span>
          <div className="flex gap-1">
            {INTENSITY.map((cls, i) => (
              <div key={i} className={`w-2 h-2 rounded-[1px] ${cls} border border-black/5 dark:border-white/5`} />
            ))}
          </div>
          <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter">Busy</span>
        </div>
      </div>
    </div>
  )
}
