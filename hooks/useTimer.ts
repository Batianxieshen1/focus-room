'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
  try {
    const saved = localStorage.getItem('focus-room-settings')
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch {}
  return DEFAULT_SETTINGS
}

// 加载今日数据
function loadTodayData(): Partial<TimerState> {
  if (typeof window === 'undefined') return {}
  try {
    const today = new Date().toISOString().slice(0, 10)
    const saved = localStorage.getItem('focus-room-today')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.date === today) {
        return {
          totalStudySeconds: data.studySeconds || 0,
          completedPomodoros: data.pomodoros || 0,
        }
      }
      if (data.date && data.studySeconds > 0) archiveSession(data)
    }
  } catch {}
  return {}
}

function saveTodayData(studySeconds: number, pomodoros: number) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('focus-room-today', JSON.stringify({
      date: today, studySeconds, pomodoros,
    }))
  } catch {}
}

function archiveSession(session: StudySession) {
  try {
    const history = JSON.parse(localStorage.getItem('focus-room-history') || '[]')
    const idx = history.findIndex((h: StudySession) => h.date === session.date)
    if (idx >= 0) {
      history[idx].studySeconds += session.studySeconds
      history[idx].pomodoros += session.pomodoros
    } else {
      history.push(session)
    }
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    localStorage.setItem('focus-room-history',
      JSON.stringify(history.filter((h: StudySession) => h.date >= cutoffStr)))
  } catch {}
}

export function getStudyHistory(): StudySession[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('focus-room-history') || '[]') }
  catch { return [] }
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

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.mode === 'stopwatch') {
          return { ...prev, seconds: prev.seconds + 1, totalStudySeconds: prev.totalStudySeconds + 1 }
        }

        if (prev.seconds <= 1) {
          if (prev.mode === 'pomodoro') {
            if (prev.pomodoroPhase === 'work') {
              // 工作结束 → 休息
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
              // 休息结束 → 工作
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
    }, 1000)

    return clearTimer
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
