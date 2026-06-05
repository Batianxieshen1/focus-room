'use client'

import { useState, useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'
import { storageGet, storageSet } from '@/lib/storage'

interface Props {
  studySeconds: number
}

const GOALS = [
  { minutes: 30, labelKey: 'goal.30m' },
  { minutes: 60, labelKey: 'goal.1h' },
  { minutes: 90, labelKey: 'goal.1.5h' },
  { minutes: 120, labelKey: 'goal.2h' },
  { minutes: 180, labelKey: 'goal.3h' },
  { minutes: 240, labelKey: 'goal.4h' },
]

const CONFETTI_COLORS = ['#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c']

function loadGoal(): number {
  if (typeof window === 'undefined') return 60
  return storageGet<number>('focus-room-daily-goal', 60)
}

interface ConfettiDot {
  id: number
  x: number
  y: number
  color: string
  angle: number
  distance: number
}

export default function DailyGoal({ studySeconds }: Props) {
  const [goalMinutes, setGoalMinutes] = useState(loadGoal)
  const [showPicker, setShowPicker] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiDot[]>([])
  const wasCompleteRef = useRef(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const confettiIdRef = useRef(0)

  useEffect(() => {
    storageSet('focus-room-daily-goal', goalMinutes)
  }, [goalMinutes])

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showPicker])

  const studyMinutes = Math.floor(studySeconds / 60)
  const progress = Math.min((studyMinutes / goalMinutes) * 100, 100)
  const isComplete = studyMinutes >= goalMinutes

  // Trigger confetti when goal is just reached
  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true
      // Spawn 12 confetti dots
      const dots: ConfettiDot[] = Array.from({ length: 12 }, (_, i) => ({
        id: confettiIdRef.current++,
        x: 0,
        y: 0,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        angle: (360 / 12) * i + Math.random() * 20 - 10,
        distance: 30 + Math.random() * 25,
      }))
      setConfetti(dots)
      // Auto-remove after 2 seconds
      const timer = setTimeout(() => setConfetti([]), 2000)
      return () => clearTimeout(timer)
    }
    if (!isComplete) {
      wasCompleteRef.current = false
    }
  }, [isComplete])

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 text-xs transition-all duration-200 relative active:scale-95"
      >
        {/* 进度圆环 */}
        <div className="relative">
          <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
            <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle
              cx="10" cy="10" r="8" fill="none"
              stroke={isComplete ? 'rgba(52,211,153,0.8)' : 'rgba(251,191,36,0.6)'}
              strokeWidth="2" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 8}`}
              strokeDashoffset={`${2 * Math.PI * 8 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>

          {/* Confetti dots */}
          {confetti.map(dot => (
            <span
              key={dot.id}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none animate-confetti"
              style={{
                backgroundColor: dot.color,
                '--tx': `${Math.cos(dot.angle * Math.PI / 180) * dot.distance}px`,
                '--ty': `${Math.sin(dot.angle * Math.PI / 180) * dot.distance}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <span className={`tabular-nums ${isComplete ? 'text-emerald-300/80' : 'text-white/50'}`}>
          {studyMinutes}/{goalMinutes}m
        </span>
      </button>

      {/* 目标选择器 */}
      {showPicker && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 glass-strong rounded-xl p-3 animate-fade-in min-w-[140px]"
          onClick={e => e.stopPropagation()}>
          <div className="text-[10px] text-white/40 tracking-wider mb-2 uppercase">{t('goal.dailyTarget')}</div>
          <div className="space-y-1">
            {GOALS.map(g => (
              <button
                key={g.minutes}
                onClick={() => { setGoalMinutes(g.minutes); setShowPicker(false) }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 active:scale-95 ${
                  goalMinutes === g.minutes
                    ? 'bg-white/[0.12] text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                {t(g.labelKey as any)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
