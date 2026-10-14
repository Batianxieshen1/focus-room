'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { storageGet, storageSet } from '@/lib/storage'
import { formatClock, formatDateKey } from '@/lib/format'
import { KEYS } from '@/lib/storageKeys'

function getLocalDate(): string {
  return formatDateKey()
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

// 加载设置（防御：存储层异常时绝不返回残缺对象）
function loadSettings(): TimerSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  return storageGet<TimerSettings>(KEYS.settings, DEFAULT_SETTINGS) ?? DEFAULT_SETTINGS
}

// 加载今日数据
function loadTodayData(): Partial<TimerState> {
  if (typeof window === 'undefined') return {}
  const today = getLocalDate()
  const data = storageGet<{ date?: string; studySeconds?: number; pomodoros?: number } | null>(KEYS.today, null)
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
  storageSet(KEYS.today, { date: today, studySeconds, pomodoros })
}

function archiveSession(session: StudySession) {
  const history = storageGet<StudySession[]>(KEYS.history, [])
  const idx = history.findIndex(h => h.date === session.date)
  if (idx >= 0) {
    history[idx].studySeconds += session.studySeconds
    history[idx].pomodoros += session.pomodoros
  } else {
    history.push(session)
  }
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = formatDateKey(cutoff)
  storageSet(KEYS.history, history.filter(h => h.date >= cutoffStr))
}

export function getStudyHistory(): StudySession[] {
  if (typeof window === 'undefined') return []
  return storageGet<StudySession[]>(KEYS.history, [])
}

const BACKGROUND_TIMEOUT_SECONDS = 10 * 60 // 10 minutes

export function advanceTimerState(
  prev: TimerState,
  delta: number,
  settings: TimerSettings
): TimerState {
  if (delta <= 0 || !prev.isRunning) return prev

  if (prev.mode === 'stopwatch') {
    return {
      ...prev,
      seconds: prev.seconds + delta,
      totalStudySeconds: prev.totalStudySeconds + delta,
    }
  }

  if (prev.mode === 'countdown') {
    if (delta < prev.seconds) {
      return {
        ...prev,
        seconds: prev.seconds - delta,
        totalStudySeconds: prev.totalStudySeconds + delta,
      }
    } else {
      return {
        ...prev,
        seconds: 0,
        totalStudySeconds: prev.totalStudySeconds + prev.seconds,
        isRunning: false,
        notify: true,
      }
    }
  }

  if (prev.mode === 'pomodoro') {
    let currentPhase = prev.pomodoroPhase
    let currentSeconds = prev.seconds
    let completed = prev.completedPomodoros
    let studySeconds = prev.totalStudySeconds
    let isRunning: boolean = prev.isRunning
    let notify = false
    let remaining = delta

    while (remaining > 0 && isRunning) {
      if (currentPhase === 'work') {
        if (remaining < currentSeconds) {
          currentSeconds -= remaining
          studySeconds += remaining
          remaining = 0
        } else {
          // 当前工作阶段结束
          remaining -= currentSeconds
          studySeconds += currentSeconds
          completed += 1
          notify = true

          // 判断下个休息阶段
          const isLong = completed % settings.longBreakInterval === 0
          currentPhase = isLong ? 'longBreak' : 'break'
          const breakDuration = (isLong ? settings.longBreakMinutes : settings.breakMinutes) * 60
          currentSeconds = breakDuration
        }
      } else {
        // 处于休息阶段（休息时间不计入学习时长）
        if (remaining < currentSeconds) {
          currentSeconds -= remaining
          remaining = 0
        } else {
          // 休息阶段结束
          remaining -= currentSeconds
          notify = true

          // 休息结束回到工作阶段，但停止自动无限循环
          currentPhase = 'work'
          currentSeconds = settings.pomodoroMinutes * 60
          isRunning = false
          remaining = 0
        }
      }
    }

    const currentTotalSeconds = currentPhase === 'work'
      ? settings.pomodoroMinutes * 60
      : (currentPhase === 'longBreak' ? settings.longBreakMinutes * 60 : settings.breakMinutes * 60)

    return {
      ...prev,
      pomodoroPhase: currentPhase,
      seconds: currentSeconds,
      totalSeconds: currentTotalSeconds,
      completedPomodoros: completed,
      totalStudySeconds: studySeconds,
      isRunning,
      notify: notify || prev.notify,
    }
  }

  return prev
}

export function useTimer() {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings)
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const [state, setState] = useState<TimerState>(() => {
    const initialSettings = loadSettings()
    const saved = loadTodayData()
    return {
      mode: 'stopwatch',
      isRunning: false,
      seconds: 0,
      totalSeconds: initialSettings.pomodoroMinutes * 60,
      pomodoroPhase: 'work',
      completedPomodoros: saved.completedPomodoros || 0,
      totalStudySeconds: saved.totalStudySeconds || 0,
      notify: false,
    }
  })

  const [backgroundPrompt, setBackgroundPrompt] = useState<{ elapsedSeconds: number } | null>(null)
  const pendingElapsedRef = useRef(0)
  const lastTickRef = useRef<number | null>(null)
  const hiddenAtRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const stateRef = useRef<TimerState | null>(null)
  useEffect(() => { stateRef.current = state }, [state])

  // 持久化：interval 只挂载一次（旧实现依赖每秒变化的 state，导致 10 秒
  // 定时器每秒被重建、永远无法触发）；另在页面隐藏/卸载时兜底立即写入
  useEffect(() => {
    const save = () => {
      const s = stateRef.current
      if (s) saveTodayData(s.totalStudySeconds, s.completedPomodoros)
    }
    const iv = setInterval(save, 10000)
    const onVisibility = () => { if (document.hidden) save() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', save)
    window.addEventListener('pagehide', save)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', save)
      window.removeEventListener('pagehide', save)
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  // 主计时逻辑：基于真实时间戳步进
  useEffect(() => {
    if (!state.isRunning) {
      clearTimer()
      lastTickRef.current = null
      return
    }

    if (lastTickRef.current === null) {
      lastTickRef.current = Date.now()
    }

    const checkTick = () => {
      if (lastTickRef.current === null) {
        lastTickRef.current = Date.now()
        return
      }
      const now = Date.now()
      const delta = Math.floor((now - lastTickRef.current) / 1000)
      if (delta >= 1) {
        lastTickRef.current += delta * 1000
        setState(prev => advanceTimerState(prev, delta, settingsRef.current))
      }
    }

    intervalRef.current = setInterval(checkTick, 500)

    // 页面可见性监听：离开时记下时间戳，返回时根据时长判断补记或询问
    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now()
        clearTimer()
        lastTickRef.current = null
      } else if (hiddenAtRef.current !== null) {
        const elapsed = Math.floor((Date.now() - hiddenAtRef.current) / 1000)
        hiddenAtRef.current = null

        // 仅在计时器运行且确实有经过时间时处理
        if (state.isRunning && elapsed >= 1) {
          if (elapsed >= BACKGROUND_TIMEOUT_SECONDS) {
            // 离开超过 10 分钟：暂停并弹窗询问
            clearTimer()
            lastTickRef.current = null
            pendingElapsedRef.current = elapsed
            setBackgroundPrompt({ elapsedSeconds: elapsed })
            setState(prev => ({ ...prev, isRunning: false }))
          } else {
            // 10 分钟内：静默精准补记时间
            setState(prev => advanceTimerState(prev, elapsed, settingsRef.current))
            lastTickRef.current = Date.now()
            intervalRef.current = setInterval(checkTick, 500)
          }
        } else if (state.isRunning) {
          lastTickRef.current = Date.now()
          intervalRef.current = setInterval(checkTick, 500)
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [state.isRunning, clearTimer])

  // 处理后台超时询问结果
  const resolveBackgroundPrompt = useCallback((keepTime: boolean) => {
    const elapsed = pendingElapsedRef.current
    pendingElapsedRef.current = 0
    setBackgroundPrompt(null)

    if (keepTime && elapsed > 0) {
      setState(prev => {
        // 先将这 elapsed 秒推进，并恢复运行状态
        return advanceTimerState({ ...prev, isRunning: true }, elapsed, settingsRef.current)
      })
      lastTickRef.current = Date.now()
    } else {
      // 结束本次/不计入：计时器停在离开前，不计入后台时间
      setState(prev => ({ ...prev, isRunning: false }))
      lastTickRef.current = null
    }
  }, [])

  const clearNotify = useCallback(() => setState(prev => ({ ...prev, notify: false })), [])

  // 跳过当前休息阶段，立即回到工作阶段（运行状态保持不变）
  const skipBreak = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'pomodoro' || prev.pomodoroPhase === 'work') return prev
      const secs = settingsRef.current.pomodoroMinutes * 60
      return { ...prev, pomodoroPhase: 'work', seconds: secs, totalSeconds: secs }
    })
  }, [])

  const toggle = useCallback(() => {
    setState(prev => {
      const nextRunning = !prev.isRunning
      if (nextRunning) {
        lastTickRef.current = Date.now()
      } else {
        lastTickRef.current = null
      }
      return { ...prev, isRunning: nextRunning }
    })
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    lastTickRef.current = null
    hiddenAtRef.current = null
    pendingElapsedRef.current = 0
    setBackgroundPrompt(null)
    setState(prev => ({
      ...prev,
      isRunning: false,
      seconds: prev.mode === 'stopwatch' ? 0 : prev.totalSeconds,
      pomodoroPhase: 'work',
    }))
  }, [clearTimer])

  const setMode = useCallback((mode: TimerMode) => {
    clearTimer()
    lastTickRef.current = null
    hiddenAtRef.current = null
    pendingElapsedRef.current = 0
    setBackgroundPrompt(null)
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

  const formatTime = useCallback((totalSecs: number) => formatClock(totalSecs), [])

  return {
    ...state,
    settings,
    backgroundPrompt,
    resolveBackgroundPrompt,
    displayTime: formatTime(state.seconds),
    studyTime: formatTime(state.totalStudySeconds),
    toggle, reset, setMode, skipBreak,
    setCountdownMinutes, setPomodoroMinutes,
    updateSettings, formatTime, clearNotify,
  }
}
