'use client'

import { useState, useEffect } from 'react'
import { getStudyHistory, StudySession } from '@/hooks/useTimer'
import { t } from '@/lib/i18n'

interface Props {
  onClose: () => void
}

export default function StudyCalendar({ onClose }: Props) {
  const [history, setHistory] = useState<StudySession[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    setHistory(getStudyHistory())
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of month (0=Sun)
  const firstDay = new Date(year, month, 1).getDay()
  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build calendar grid
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Pad to complete weeks
  while (cells.length % 7 !== 0) cells.push(null)

  // Map date string -> studySeconds
  const getSecondsForDay = (day: number): number => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const session = history.find(h => h.date === dateStr)
    return session?.studySeconds || 0
  }

  // Color intensity based on study time
  const getCellColor = (seconds: number): string => {
    if (seconds === 0) return 'bg-white/[0.04]'
    if (seconds < 1800) return 'bg-amber-900/30'       // <30m: very light
    if (seconds < 3600) return 'bg-amber-800/40'       // 30m-1h
    if (seconds < 7200) return 'bg-amber-600/50'       // 1h-2h
    if (seconds < 10800) return 'bg-amber-400/60'      // 2h-3h
    return 'bg-amber-400/80'                            // 3h+: bright
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // Total study time for current month
  const monthTotal = cells.reduce<number>((sum, day) => {
    if (day === null) return sum
    return sum + getSecondsForDay(day)
  }, 0)

  // Active days count
  const activeDays = cells.reduce<number>((count, day) => {
    if (day === null) return count
    return count + (getSecondsForDay(day) > 0 ? 1 : 0)
  }, 0)

  const weekdays = t('calendar.weekdays').split(',')

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="glass-strong rounded-3xl p-8 w-[420px] max-h-[85vh] overflow-y-auto relative animate-scale-in"
        onClick={e => e.stopPropagation()}>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-medium text-white">{year} {monthNames[month]}</h2>
            <div className="text-[11px] text-white/40 mt-0.5">
              {t('calendar.monthTotal')}: {formatDuration(monthTotal)} | {activeDays} {t('calendar.minutes')}
            </div>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map(day => (
            <div key={day} className="text-center text-[10px] text-white/30 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const seconds = getSecondsForDay(day)
            const isToday = isCurrentMonth && day === today.getDate()
            const colorClass = getCellColor(seconds)

            return (
              <div
                key={`${month}-${day}`}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center ${colorClass} transition-all duration-200 relative group`}
              >
                <span className={`text-xs tabular-nums ${isToday ? 'text-white font-medium' : 'text-white/60'}`}>
                  {day}
                </span>
                {seconds > 0 && (
                  <span className="text-[8px] text-white/40 tabular-nums mt-0.5">
                    {formatDuration(seconds)}
                  </span>
                )}

                {/* Tooltip */}
                {seconds > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-black/80 text-[10px] text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {formatDuration(seconds)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/10">
          <span className="text-[10px] text-white/30">{t('calendar.noData')}</span>
          <div className="w-3 h-3 rounded-sm bg-white/[0.04]" />
          <div className="w-3 h-3 rounded-sm bg-amber-900/30" />
          <div className="w-3 h-3 rounded-sm bg-amber-800/40" />
          <div className="w-3 h-3 rounded-sm bg-amber-600/50" />
          <div className="w-3 h-3 rounded-sm bg-amber-400/60" />
          <div className="w-3 h-3 rounded-sm bg-amber-400/80" />
          <span className="text-[10px] text-white/30">3h+</span>
        </div>
      </div>
    </div>
  )
}
