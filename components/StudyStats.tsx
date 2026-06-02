'use client'

import { useState, useEffect } from 'react'
import { getStudyHistory, StudySession } from '@/hooks/useTimer'
import { t } from '@/lib/i18n'

interface Props {
  onClose: () => void
}

export default function StudyStats({ onClose }: Props) {
  const [history, setHistory] = useState<StudySession[]>([])
  const [importMessage, setImportMessage] = useState<string | null>(null)

  useEffect(() => {
    setHistory(getStudyHistory())
  }, [])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const maxSeconds = Math.max(
    ...last7Days.map(date => {
      const session = history.find(h => h.date === date)
      return session?.studySeconds || 0
    }),
    1
  )

  const weekTotal = last7Days.reduce<number>((sum, date) => {
    const session = history.find(h => h.date === date)
    return sum + (session?.studySeconds || 0)
  }, 0)

  const weekPomodoros = last7Days.reduce<number>((sum, date) => {
    const session = history.find(h => h.date === date)
    return sum + (session?.pomodoros || 0)
  }, 0)

  const weekDays = t('calendar.weekdays').split(',')

  // Weekly trend: last 4 weeks
  const getWeekTotal = (weekOffset: number): number => {
    const end = new Date()
    end.setDate(end.getDate() - weekOffset * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)

    let total = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10)
      const session = history.find(h => h.date === dateStr)
      total += session?.studySeconds || 0
    }
    return total
  }

  const weeks = [3, 2, 1, 0].map(offset => ({
    label: offset === 0 ? '本周' : `${offset}周前`,
    total: getWeekTotal(offset),
  }))

  const maxWeekTotal = Math.max(...weeks.map(w => w.total), 1)

  // Week-over-week change
  const thisWeekTotal = weeks[3].total
  const lastWeekTotal = weeks[2].total
  const weekChangePercent = lastWeekTotal > 0
    ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    : 0

  // Export data
  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      history: getStudyHistory(),
      settings: (() => {
        try { return JSON.parse(localStorage.getItem('focus-room-settings') || '{}') }
        catch { return {} }
      })(),
      dailyGoal: (() => {
        try { return JSON.parse(localStorage.getItem('focus-room-daily-goal') || '60') }
        catch { return 60 }
      })(),
      volumes: (() => {
        try { return JSON.parse(localStorage.getItem('focus-room-volumes') || '{}') }
        catch { return {} }
      })(),
      locale: (() => {
        try { return localStorage.getItem('focus-room-locale') || 'zh' }
        catch { return 'zh' }
      })(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focus-room-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import data
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Size check (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImportMessage(t('stats.importSizeError'))
        setTimeout(() => setImportMessage(null), 3000)
        return
      }

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (!data.version || !Array.isArray(data.history)) {
          setImportMessage(t('stats.importError'))
          setTimeout(() => setImportMessage(null), 3000)
          return
        }

        // Merge history
        const existing = getStudyHistory()
        const merged = [...existing]
        for (const session of data.history as StudySession[]) {
          const idx = merged.findIndex(h => h.date === session.date)
          if (idx >= 0) {
            merged[idx].studySeconds += session.studySeconds
            merged[idx].pomodoros += session.pomodoros
          } else {
            merged.push(session)
          }
        }
        // Sort by date and keep last 30 days
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        const cutoffStr = cutoff.toISOString().slice(0, 10)
        const filtered = merged
          .filter(h => h.date >= cutoffStr)
          .sort((a, b) => a.date.localeCompare(b.date))

        localStorage.setItem('focus-room-history', JSON.stringify(filtered))

        // Import settings if present
        if (data.settings && typeof data.settings === 'object') {
          localStorage.setItem('focus-room-settings', JSON.stringify(data.settings))
        }
        if (data.dailyGoal !== undefined) {
          localStorage.setItem('focus-room-daily-goal', JSON.stringify(data.dailyGoal))
        }
        if (data.volumes && typeof data.volumes === 'object') {
          localStorage.setItem('focus-room-volumes', JSON.stringify(data.volumes))
        }
        if (data.locale) {
          localStorage.setItem('focus-room-locale', data.locale)
        }

        setHistory(filtered)
        setImportMessage(t('stats.importSuccess'))
        setTimeout(() => setImportMessage(null), 3000)
      } catch {
        setImportMessage(t('stats.importError'))
        setTimeout(() => setImportMessage(null), 3000)
      }
    }
    input.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="glass-strong rounded-3xl p-8 w-[420px] max-h-[80vh] overflow-y-auto relative animate-scale-in"
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

        <h2 className="text-lg font-medium text-white mb-6">{t('stats.title')}</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/[0.06] rounded-2xl p-4">
            <div className="text-2xl font-light text-white tracking-tight">{formatDuration(weekTotal)}</div>
            <div className="text-[11px] text-white/50 mt-1 tracking-wider">{t('stats.weekStudy')}</div>
          </div>
          <div className="bg-white/[0.06] rounded-2xl p-4">
            <div className="text-2xl font-light text-amber-300 tracking-tight">{weekPomodoros}</div>
            <div className="text-[11px] text-white/50 mt-1 tracking-wider">{t('stats.completedPomodoros')}</div>
          </div>
        </div>

        {/* 7-day bar chart */}
        <div className="mb-6">
          <div className="text-[11px] text-white/50 tracking-wider mb-4 uppercase">{t('stats.last7Days')}</div>
          <div className="flex items-end gap-1.5 h-28">
            {last7Days.map(date => {
              const session = history.find(h => h.date === date)
              const seconds = session?.studySeconds || 0
              const height = maxSeconds > 0 ? (seconds / maxSeconds) * 100 : 0
              const d = new Date(date)
              const dayLabel = weekDays[d.getDay()]

              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] text-white/30 tabular-nums">
                    {seconds > 0 ? formatDuration(seconds) : ''}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '72px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ease-out ${
                        seconds > 0
                          ? 'bg-gradient-to-t from-amber-400/50 to-amber-300/25'
                          : 'bg-white/[0.04]'
                      }`}
                      style={{ height: `${Math.max(height, 3)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] ${
                    date === new Date().toISOString().slice(0, 10)
                      ? 'text-white/70'
                      : 'text-white/40'
                  }`}>
                    {dayLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly trend */}
        <div className="mb-6">
          <div className="text-[11px] text-white/50 tracking-wider mb-4 uppercase">{t('stats.trend')} - {t('stats.last4Weeks')}</div>
          <div className="flex items-end gap-2 h-20">
            {weeks.map((week, i) => {
              const height = maxWeekTotal > 0 ? (week.total / maxWeekTotal) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-white/30 tabular-nums">
                    {week.total > 0 ? formatDuration(week.total) : ''}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '48px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ease-out ${
                        week.total > 0
                          ? i === 3
                            ? 'bg-gradient-to-t from-blue-400/50 to-blue-300/25'
                            : 'bg-gradient-to-t from-white/15 to-white/08'
                          : 'bg-white/[0.04]'
                      }`}
                      style={{ height: `${Math.max(height, 3)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] ${i === 3 ? 'text-white/70' : 'text-white/40'}`}>
                    {week.label}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Week-over-week change */}
          <div className="mt-3 text-center">
            <span className="text-[11px] text-white/40">
              {t('stats.weekChange')}:{' '}
              {thisWeekTotal === 0 && lastWeekTotal === 0 ? (
                <span className="text-white/30">-</span>
              ) : weekChangePercent > 0 ? (
                <span className="text-emerald-400/80">+{weekChangePercent}% {t('stats.increase')}</span>
              ) : weekChangePercent < 0 ? (
                <span className="text-red-400/80">{weekChangePercent}% {t('stats.decrease')}</span>
              ) : (
                <span className="text-white/30">{t('stats.noChange')}</span>
              )}
            </span>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] text-white/50 tracking-wider mb-3 uppercase">{t('stats.history')}</div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {history.slice().reverse().slice(0, 7).map(session => (
                <div key={session.date}
                  className="flex items-center justify-between text-sm bg-white/[0.04] rounded-xl px-4 py-2.5">
                  <span className="text-white/60 text-xs">{session.date}</span>
                  <span className="text-white/75 text-xs tabular-nums">{formatDuration(session.studySeconds)}</span>
                  <span className="text-amber-300/70 text-xs">x{session.pomodoros}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import/Export buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-white/70 text-xs font-medium hover:bg-white/[0.14] transition-all duration-200"
          >
            {t('stats.exportData')}
          </button>
          <button
            onClick={handleImport}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-white/70 text-xs font-medium hover:bg-white/[0.14] transition-all duration-200"
          >
            {t('stats.importData')}
          </button>
        </div>

        {/* Import message */}
        {importMessage && (
          <div className="mt-3 text-center text-xs text-amber-300/80 animate-fade-in">
            {importMessage}
          </div>
        )}
      </div>
    </div>
  )
}
