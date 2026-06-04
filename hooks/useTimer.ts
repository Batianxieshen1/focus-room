'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { storageGet, storageSet } from '@/lib/storage'

function getLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown'

export interface TimerSettings {
  pomodoroMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
}

const DEFAULT_SETTINGS: TimerSettings = {
  pomodoroMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
}

interface TimerState {
  mode: TimerMode
  isRunning: boolean
  seconds: number
  totalSeconds: number
  pomodoroPhase: 'work' | 'break' | 'longBreak'
  completedPomodoros: number
  totalStudySeconds: number
  notify: boolean
}

export interface StudySession {
  date: string
  studySeconds: number
  pomodoros: number
}

// 加载设置
function loadSettings(): TimerSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  return storageGet<TimerSettings>('focus-room-settings', DEFAULT_SETTINGS)
}

// 加载今日数据
function loadTodayData(): Partial<TimerState> {
  if (typeof window === 'undefined') return {}
  const today = getLocalDate()
  const data = storageGet<{ date?: string; studySeconds?: number; pomodoros?: number } | null>('focus-room-today', null)
  if (data) {
    if (data.date === today) {
      return {
        totalStudySeconds: data.studySeconds || 0,
        completedPomodoros: data.pomodoros || 0,
      }
    }
    if (data.date && (data.studySeconds ?? 0) > 0) archiveSession(data as StudySession)
  }
  return {}
}

function saveTodayData(studySeconds: number, pomodoros: number) {
  const today = getLocalDate()
  storageSet('focus-room-today', { date: today, studySeconds, pomodoros })
}

function archiveSession(session: StudySession) {
  const history = storageGet<StudySession[]>('focus-room-history', [])
  const idx = history.findIndex(h => h.date === session.date)
  if (idx >= 0) {
    history[idx].studySeconds += session.studySeconds
    history[idx].pomodoros += session.pomodoros
  } else {
    history.push(session)
  }
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${String(cutoff.getDate()).padStart(2,'0')}`
  storageSet('focus-room-history', history.filter(h => h.date >= cutoffStr))
}

export function getStudyHistory(): StudySession[] {
  if (typeof window === 'undefined') return []
  return storageGet<StudySession[]>('focus-room-history', [])
}

export function useTimer() {
  const settingsRef = useRef(loadSettings())
  const savedData = useRef(loadTodayData())

  const [settings, setSettings] = useState<TimerSettings>(settingsRef.current)

  const [state, setState] = useState<TimerState>({
    mode: 'stopwatch',
    isRunning: false,
    seconds: 0,
    totalSeconds: settingsRef.current.pomodoroMinutes * 60,
    pomodoroPhase: 'work',
    completedPomodoros: savedData.current.completedPomodoros || 0,
    totalStudySeconds: savedData.current.totalStudySeconds || 0,
    notify: false,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 定期保存
  useEffect(() => {
    const iv = setInterval(() => saveTodayData(state.totalStudySeconds, state.completedPomodoros), 10000)
    return () => clearInterval(iv)
  }, [state.totalStudySeconds, state.completedPomodoros])

  useEffect(() => {
    const handler = () => saveTodayData(state.totalStudySeconds, state.completedPomodoros)
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state.totalStudySeconds, state.completedPomodoros])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  // 主计时逻辑
  useEffect(() => {
    if (!state.isRunning) { clearTimer(); return }

    const tick = () => {
      setState(prev => {
        if (prev.mode === 'stopwatch') {
          return { ...prev, seconds: prev.seconds + 1, totalStudySeconds: prev.totalStudySeconds + 1 }
        }

        if (prev.seconds <= 1) {
          if (prev.mode === 'pomodoro') {
            if (prev.pomodoroPhase === 'work') {
              const newPomodoros = prev.completedPomodoros + 1
              const isLongBreak = newPomodoros % settingsRef.current.longBreakInterval === 0
              const breakSecs = isLongBreak
                ? settingsRef.current.longBreakMinutes * 60
                : settingsRef.current.breakMinutes * 60
              return {
                ...prev,
                isRunning: false,
                seconds: breakSecs,
                totalSeconds: breakSecs,
                pomodoroPhase: isLongBreak ? 'longBreak' : 'break',
                completedPomodoros: newPomodoros,
                notify: true,
              }
            } else {
              const workSecs = settingsRef.current.pomodoroMinutes * 60
              return {
                ...prev,
                isRunning: false,
                seconds: workSecs,
                totalSeconds: workSecs,
                pomodoroPhase: 'work',
                notify: true,
              }
            }
          }
          return { ...prev, isRunning: false, seconds: 0, notify: true }
        }

        return {
          ...prev,
          seconds: prev.seconds - 1,
          totalStudySeconds: prev.pomodoroPhase === 'work'
            ? prev.totalStudySeconds + 1 : prev.totalStudySeconds,
        }
      })
    }

    intervalRef.current = setInterval(tick, 1000)

    // 页面不可见时暂停 interval，可见时补偿错过的秒数
    let hiddenAt: number | null = null
    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        clearTimer()
      } else if (hiddenAt) {
        const elapsed = Math.floor((Date.now() - hiddenAt) / 1000)
        hiddenAt = null
        // 补偿错过的秒数（最多补偿 300 秒，防止长时间后台后大量补偿）
        const capped = Math.min(elapsed, 300)
        setState(prev => {
          let s = prev.seconds
          let study = prev.totalStudySeconds
          let pomodoros = prev.completedPomodoros
          let phase = prev.pomodoroPhase
          let total = prev.totalSeconds
          let mode = prev.mode
          let notified = false

          for (let i = 0; i < capped; i++) {
            if (mode === 'stopwatch') {
              s++; study++
            } else {
              if (s <= 1) {
                if (mode === 'pomodoro') {
                  if (phase === 'work') {
                    pomodoros++
                    const isLong = pomodoros % settingsRef.current.longBreakInterval === 0
                    phase = isLong ? 'longBreak' : 'break'
                    total = (isLong ? settingsRef.current.longBreakMinutes : settingsRef.current.breakMinutes) * 60
                    s = total
                    notified = true
                  } else {
                    phase = 'work'
                    total = settingsRef.current.pomodoroMinutes * 60
                    s = total
                    notified = true
                  }
                } else {
                  s = 0; notified = true
                }
              } else {
                s--
                if (phase === 'work') study++
              }
            }
          }
          return { ...prev, seconds: s, totalStudySeconds: study, completedPomodoros: pomodoros, pomodoroPhase: phase, totalSeconds: total, notify: notified }
        })
        intervalRef.current = setInterval(tick, 1000)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [state.isRunning, state.mode, state.pomodoroPhase, clearTimer])

  const clearNotify = useCallback(() => setState(prev => ({ ...prev, notify: false })), [])

  const toggle = useCallback(() => setState(prev => ({ ...prev, isRunning: !prev.isRunning })), [])

  const reset = useCallback(() => {
    clearTimer()
    setState(prev => ({
      ...prev,
      isRunning: false,
      seconds: prev.mode === 'stopwatch' ? 0 : prev.totalSeconds,
      pomodoroPhase: 'work',
    }))
  }, [clearTimer])

  const setMode = useCallback((mode: TimerMode) => {
    clearTimer()
    setState(prev => ({
      ...prev,
      mode,
      isRunning: false,
      seconds: mode === 'stopwatch' ? 0 : (mode === 'pomodoro' ? settingsRef.current.pomodoroMinutes * 60 : prev.totalSeconds),
      totalSeconds: mode === 'pomodoro' ? settingsRef.current.pomodoroMinutes * 60 : prev.totalSeconds,
      pomodoroPhase: 'work',
    }))
  }, [clearTimer])

  const setCountdownMinutes = useCallback((minutes: number) => {
    const secs = minutes * 60
    setState(prev => ({
      ...prev,
      totalSeconds: secs,
      seconds: prev.mode === 'countdown' && !prev.isRunning ? secs : prev.seconds,
    }))
  }, [])

  const setPomodoroMinutes = useCallback((minutes: number) => {
    const secs = minutes * 60
    setState(prev => ({
      ...prev,
      totalSeconds: secs,
      seconds: prev.mode === 'pomodoro' && !prev.isRunning && prev.pomodoroPhase === 'work' ? secs : prev.seconds,
    }))
  }, [])

  // 更新设置
  const updateSettings = useCallback((newSettings: TimerSettings) => {
    settingsRef.current = newSettings
    setSettings(newSettings)
    // 如果当前在番茄钟工作阶段且未运行，更新总时长
    setState(prev => {
      if (prev.mode === 'pomodoro' && !prev.isRunning && prev.pomodoroPhase === 'work') {
        const secs = newSettings.pomodoroMinutes * 60
        return { ...prev, totalSeconds: secs, seconds: secs }
      }
      return prev
    })
  }, [])

  const formatTime = useCallback((totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  return {
    ...state,
    settings,
    displayTime: formatTime(state.seconds),
    studyTime: formatTime(state.totalStudySeconds),
    toggle, reset, setMode,
    setCountdownMinutes, setPomodoroMinutes,
    updateSettings, formatTime, clearNotify,
  }
}
