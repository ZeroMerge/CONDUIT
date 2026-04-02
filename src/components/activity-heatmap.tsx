// src/components/activity-heatmap.tsx
'use client'

import { useMemo } from 'react'

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
  today.setHours(0, 0, 0, 0)

  // Start from the Sunday 52 weeks ago
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 52 * 7)
  // Roll back to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

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
  const labels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const month = week[0].date.getMonth()
    if (month !== lastMonth) {
      labels.push({
        label: week[0].date.toLocaleString('default', { month: 'short' }),
        col,
      })
      lastMonth = month
    }
  })
  return labels
}

const INTENSITY = [
  'bg-[var(--bg-tertiary)]',              // 0 — empty
  'bg-[var(--accent)] opacity-25',         // 1
  'bg-[var(--accent)] opacity-50',         // 2
  'bg-[var(--accent)] opacity-75',         // 3+
  'bg-[var(--accent)]',                    // 4+
]

function cellClass(count: number): string {
  if (count === 0) return INTENSITY[0]
  if (count === 1) return INTENSITY[1]
  if (count === 2) return INTENSITY[2]
  if (count === 3) return INTENSITY[3]
  return INTENSITY[4]
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ActivityHeatmap({ completions }: ActivityHeatmapProps) {
  const weeks = useMemo(() => getWeeksData(completions), [completions])
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])

  const total = completions.length

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Activity
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {total} flow{total !== 1 ? 's' : ''} completed in the past year
        </p>
      </div>

      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex mb-1 pl-8">
          {monthLabels.map(({ label, col }) => (
            <div
              key={`${label}-${col}`}
              className="text-xs text-[var(--text-tertiary)] absolute"
              style={{ marginLeft: col * 13 }}
            >
              {label}
            </div>
          ))}
          {/* Spacer to push the month labels correctly */}
          <div style={{ height: 16, position: 'relative', width: weeks.length * 13 }} />
        </div>

        {/* Grid: days on Y axis, weeks on X axis */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAY_LABELS.map((day, i) => (
              <div
                key={day}
                className="h-3 text-[10px] text-[var(--text-tertiary)] leading-3 flex items-center"
                style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Cells */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day) => (
                <div
                  key={day.key}
                  title={`${day.key}: ${day.count} completion${day.count !== 1 ? 's' : ''}`}
                  className={`w-3 h-3 rounded-sm transition-all duration-150 cursor-default ${cellClass(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-xs text-[var(--text-tertiary)]">Less</span>
          {INTENSITY.map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span className="text-xs text-[var(--text-tertiary)]">More</span>
        </div>
      </div>
    </div>
  )
}
