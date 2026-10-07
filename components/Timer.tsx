'use client'

import { useEffect, useRef } from 'react'
import { useTimer, TimerMode, TimerSettings } from '@/hooks/useTimer'
import Notification from './Notification'
import { t } from '@/lib/i18n'

const MODES: { key: TimerMode; labelKey: 'timer.pomodoro' | 'timer.stopwatch' | 'timer.countdown' }[] = [
  { key: 'pomodoro', labelKey: 'timer.pomodoro' },
  { key: 'stopwatch', labelKey: 'timer.stopwatch' },
  { key: 'countdown', labelKey: 'timer.countdown' },
]

export interface TickInfo {
  displayTime: string
  isRunning: boolean
  mode: TimerMode
  phase: 'work' | 'break' | 'longBreak'
}

interface Props {
  onActionsReady?: (actions: {
    toggle: () => void
    reset: () => void
    setMode: (mode: TimerMode) => void
    updateSettings: (settings: TimerSettings) => void
  }) => void
  onStudySecondsChange?: (seconds: number) => void
  onPomodoroComplete?: () => void
  onRunningChange?: (running: boolean) => void
  /** Zen 时钟需要计时数据；仅在清屏模式开启，避免常驻每秒渲染 */
  reportTick?: boolean
  onTickInfo?: (info: TickInfo) => void
  /** 极简胶囊态 */
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Timer({
  onActionsReady,
  onStudySecondsChange,
  onPomodoroComplete,
  onRunningChange,
  reportTick,
  onTickInfo,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  const timer = useTimer()
  const lastNotifiedRef = useRef(timer.totalStudySeconds)

  // 暴露控制方法给父组件 (no studySeconds to avoid cascading re-renders)
  useEffect(() => {
    onActionsReady?.({
      toggle: timer.toggle,
      reset: timer.reset,
      setMode: timer.setMode,
      updateSettings: timer.updateSettings,
    })
  }, [timer.toggle, timer.reset, timer.setMode, timer.updateSettings, onActionsReady])

  // 通知父组件学习时间变化 — only on meaningful changes (not every second)
  useEffect(() => {
    const prev = lastNotifiedRef.current
    if (timer.totalStudySeconds !== prev) {
      // Notify when crossing a minute boundary or on reset
      const prevMinute = Math.floor(prev / 60)
      const currMinute = Math.floor(timer.totalStudySeconds / 60)
      if (currMinute !== prevMinute || timer.totalStudySeconds < prev) {
        lastNotifiedRef.current = timer.totalStudySeconds
        onStudySecondsChange?.(timer.totalStudySeconds)
      }
    }
  }, [timer.totalStudySeconds, onStudySecondsChange])

  const clearNotify = timer.clearNotify
  useEffect(() => {
    if (timer.notify) {
      const t = setTimeout(() => clearNotify(), 1000)
      return () => clearTimeout(t)
    }
  }, [timer.notify, clearNotify])

  // 后台恢复询问：15 秒无人操作时自动以「不计入」收起，避免脏数据与永久滞留
  const resolvePrompt = timer.resolveBackgroundPrompt
  const bgPrompt = timer.backgroundPrompt
  useEffect(() => {
    if (!bgPrompt) return
    const timerId = setTimeout(() => {
      resolvePrompt(false)
    }, 15000)
    return () => clearTimeout(timerId)
  }, [bgPrompt, resolvePrompt])

  // Fire callback when a pomodoro completes (work phase ends)
  const prevCompletedRef = useRef(timer.completedPomodoros)
  useEffect(() => {
    if (timer.completedPomodoros > prevCompletedRef.current) {
      onPomodoroComplete?.()
    }
    prevCompletedRef.current = timer.completedPomodoros
  }, [timer.completedPomodoros, onPomodoroComplete])

  // 上报运行状态（用于 WakeLock 自动常亮）
  useEffect(() => {
    onRunningChange?.(timer.isRunning)
  }, [timer.isRunning, onRunningChange])

  // 上报每秒计时信息（仅清屏模式 Zen 时钟需要时才启用）
  useEffect(() => {
    if (!reportTick) return
    onTickInfo?.({
      displayTime: timer.displayTime,
      isRunning: timer.isRunning,
      mode: timer.mode,
      phase: timer.pomodoroPhase,
    })
  }, [reportTick, onTickInfo, timer.displayTime, timer.isRunning, timer.mode, timer.pomodoroPhase])

  // Page title countdown: show remaining time when timer is running
  useEffect(() => {
    if (timer.isRunning && (timer.mode === 'pomodoro' || timer.mode === 'countdown')) {
      document.title = `${timer.displayTime} - Focus Room`
    } else {
      document.title = t('timer.pageTitle')
    }
  }, [timer.displayTime, timer.isRunning, timer.mode])

  if (collapsed) {
    return (
      <>
        <Notification trigger={timer.notify} />
        <div
          onClick={onToggleCollapse}
          className="aura-capsule inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full cursor-pointer hover:border-white/30 transition-all duration-200 group select-none shadow-lg backdrop-blur-md"
          title={t('timer.expand')}
        >
          {/* Phase indicator & Mode */}
          <span className="text-sm">
            {timer.mode === 'pomodoro'
              ? (timer.pomodoroPhase === 'work' ? '🍅' : timer.pomodoroPhase === 'longBreak' ? '🌿' : '☕')
              : timer.mode === 'countdown' ? '⏳' : '⏱️'}
          </span>
          <span className="font-timer text-white font-medium tracking-wider text-sm drop-shadow">
            {timer.displayTime}
          </span>

          {/* Quick Play/Pause */}
          <button
            onClick={(e) => { e.stopPropagation(); timer.toggle() }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${
              timer.isRunning ? 'bg-white/15 text-white/90 hover:bg-white/25' : 'bg-white/25 text-white hover:bg-white/35'
            }`}
            aria-label={timer.isRunning ? 'Pause' : 'Start'}
          >
            {timer.isRunning ? (
              <svg width="8" height="8" viewBox="0 0 18 18" fill="currentColor">
                <rect x="3" y="2" width="4" height="14" rx="1" />
                <rect x="11" y="2" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="8" height="8" viewBox="0 0 18 18" fill="currentColor">
                <path d="M4 2.5v13a1 1 0 001.5.866l11-6.5a1 1 0 000-1.732l-11-6.5A1 1 0 004 2.5z" />
              </svg>
            )}
          </button>

          {/* Skip Break button if on break */}
          {timer.mode === 'pomodoro' && timer.pomodoroPhase !== 'work' && (
            <button
              onClick={(e) => { e.stopPropagation(); timer.skipBreak() }}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 active:scale-90 transition-all"
              title={t('timer.skipBreak')}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,4 15,12 5,20" />
                <rect x="17" y="4" width="3" height="16" rx="1" />
              </svg>
            </button>
          )}

          {/* Expand icon */}
          <span className="text-white/40 group-hover:text-white/80 transition-colors text-xs px-0.5">
            ↕
          </span>
        </div>
      </>
    )
  }

  return (
    <>
      <Notification trigger={timer.notify} />
      <div className="flex flex-col items-center gap-6 select-none">
        {/* 模式切换 */}
        <div className="flex gap-1 p-1 rounded-full bg-white/[0.06] border border-white/[0.06]">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => timer.setMode(m.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                timer.mode === m.key
                  ? 'bg-white/[0.18] text-white shadow-sm'
                  : 'text-white/65 hover:text-white/90'
              }`}
            >
              {t(m.labelKey)}
            </button>
          ))}
        </div>

        {/* 番茄钟状态与呼吸引导提示 */}
        {timer.mode === 'pomodoro' && (
          <div className="flex flex-col items-center gap-1">
            <div className={`text-sm tracking-widest transition-colors duration-300 ${
              timer.pomodoroPhase === 'work' ? 'text-amber-200' :
              timer.pomodoroPhase === 'longBreak' ? 'text-cyan-200' : 'text-emerald-200'
            }`}>
              {timer.pomodoroPhase === 'work' ? t('timer.focusing') :
               timer.pomodoroPhase === 'longBreak' ? t('timer.longBreak') : t('timer.shortBreak')}
              {timer.completedPomodoros > 0 && (
                <span className="ml-3 text-white/60">· {t('timer.completed')} {timer.completedPomodoros} {t('timer.pomodoroCount')}</span>
              )}
            </div>
            {timer.pomodoroPhase !== 'work' && (
              <span className="text-[11px] text-emerald-300/80 tracking-wider flex items-center gap-1 animate-pulse">
                <span>🌬️</span>
                <span>4-7-8 呼吸放松 (吸4s · 屏7s · 呼8s)</span>
              </span>
            )}
          </div>
        )}

        {/* 计时器主显示 */}
        <div className="relative flex items-center justify-center">
          {/* 休息阶段 4-7-8 舒缓呼吸脉动光环 */}
          {timer.mode === 'pomodoro' && timer.pomodoroPhase !== 'work' && (
            <div className="absolute w-44 h-44 rounded-full pointer-events-none animate-breathe-478 border border-emerald-400/25" />
          )}
          {timer.mode !== 'stopwatch' && (
            <svg className="absolute w-40 h-40 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
              <circle
                cx="50" cy="50" r="46" fill="none"
                stroke={timer.pomodoroPhase === 'work' ? 'rgba(251,191,36,0.6)' :
                        timer.pomodoroPhase === 'longBreak' ? 'rgba(34,211,238,0.6)' : 'rgba(52,211,153,0.6)'}
                strokeWidth="1.5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - timer.seconds / timer.totalSeconds)}`}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
          )}
          <div className={`font-timer text-white z-10 drop-shadow-lg transition-all duration-300 ${
            timer.notify ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]' : ''
          }`}>
            {timer.displayTime}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-4">
          <button
            onClick={timer.toggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-[0.97] ${
              timer.isRunning
                ? 'bg-white/[0.12] text-white/80 hover:bg-white/[0.18]'
                : 'bg-white/[0.2] text-white hover:bg-white/[0.28] shadow-lg'
            }`}
          >
            {timer.isRunning ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="3" y="2" width="4" height="14" rx="1"/>
                <rect x="11" y="2" width="4" height="14" rx="1"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M4 2.5v13a1 1 0 001.5.866l11-6.5a1 1 0 000-1.732l-11-6.5A1 1 0 004 2.5z"/>
              </svg>
            )}
          </button>
          <button
            onClick={timer.reset}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white/80 transition-all duration-200 active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
          </button>
        </div>

        {/* 跳过休息 */}
        {timer.mode === 'pomodoro' && timer.pomodoroPhase !== 'work' && (
          <button
            onClick={timer.skipBreak}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/55 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white/85 transition-all duration-200 active:scale-95"
          >
            {t('timer.skipBreak')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,4 15,12 5,20" />
              <rect x="17" y="4" width="3" height="16" rx="1" />
            </svg>
          </button>
        )}

        {/* 时长选择 */}
        {timer.mode === 'pomodoro' && !timer.isRunning && (
          <div className="flex gap-1.5">
            {[15, 20, 25, 30, 45, 50].map(min => (
              <button
                key={min}
                onClick={() => timer.setPomodoroMinutes(min)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all duration-150 active:scale-95 ${
                  timer.totalSeconds === min * 60
                    ? 'bg-white/[0.18] text-white'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
        )}

        {timer.mode === 'countdown' && !timer.isRunning && (
          <div className="flex gap-1.5">
            {[5, 10, 15, 20, 30, 45, 60].map(min => (
              <button
                key={min}
                onClick={() => timer.setCountdownMinutes(min)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all duration-150 active:scale-95 ${
                  timer.totalSeconds === min * 60
                    ? 'bg-white/[0.18] text-white'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
        )}

        {/* 今日学习 */}
        <div className="text-xs text-white/55 tracking-wider">
          {t('timer.todayStudy')} {timer.studyTime}
        </div>
      </div>

      {/* 后台超过 10 分钟返回询问浮岛胶囊（非侵入式，换形式不换语义） */}
      {timer.backgroundPrompt && (
        <div
          className="fixed bottom-24 sm:bottom-28 left-1/2 z-40 -translate-x-1/2 w-[92vw] max-w-md animate-slide-up"
          onClick={e => e.stopPropagation()}
        >
          <div className="aura-dock rounded-2xl px-4 py-3 shadow-2xl border border-white/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/75">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0 animate-bounce">⏳</span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white/95 truncate">
                  {t('timer.bgPromptTitle')}
                </span>
                <span className="text-[11px] text-white/65 leading-tight">
                  离开后台 {Math.floor(timer.backgroundPrompt.elapsedSeconds / 60)} 分钟，是否计入本次专注？
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={() => timer.resolveBackgroundPrompt(false)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] text-white/70 text-xs font-medium transition-all active:scale-95"
              >
                {t('timer.bgPromptDiscard')}
              </button>
              <button
                onClick={() => timer.resolveBackgroundPrompt(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs font-medium transition-all active:scale-95 shadow-md flex items-center gap-1"
              >
                <span>✓</span>
                <span>{t('timer.bgPromptResume')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
