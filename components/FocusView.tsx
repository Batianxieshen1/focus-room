'use client'

import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react'
import TopNav from '@/components/TopNav'
import BottomBar from '@/components/BottomBar'
import Timer, { TickInfo } from '@/components/Timer'
import { Scene, SCENE_SOUND_MAP, getScenes } from '@/components/SceneSelector'
import { TimerSettings, TimerMode, getStudyHistory } from '@/hooks/useTimer'
import { useAudioContext } from '@/contexts/AudioContext'
import { useWakeLock } from '@/hooks/useWakeLock'
import ShortcutToast from '@/components/ShortcutToast'
import InstallPrompt from '@/components/InstallPrompt'
import DailyGoal from '@/components/DailyGoal'
import Settings from '@/components/Settings'
import { useTranslation } from '@/lib/i18n'
import { storageGet, storageSet } from '@/lib/storage'

const MemoPanel = lazy(() => import('@/components/MemoPanel'))
const FocusTools = lazy(() => import('@/components/FocusTools'))
const StudyStats = lazy(() => import('@/components/StudyStats'))
const StudyCalendar = lazy(() => import('@/components/StudyCalendar'))
const ShareCard = lazy(() => import('@/components/ShareCard'))

export default function FocusView({
  currentScene,
  onChangeScene,
  onBackToPicker,
}: {
  currentScene: Scene
  onChangeScene: (scene: Scene) => void
  onBackToPicker: () => void
}) {
  const { t, locale } = useTranslation()
  const { sounds, toggleSound, ambientMaster, setAmbientMaster, muteAll, unmuteAll } = useAudioContext()
  const [showMemo, setShowMemo] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [studySeconds, setStudySeconds] = useState(0)
  const studySecondsRef = useRef(0)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSceneRef = useRef<string>(currentScene.id)
  const soundsRef = useRef(sounds)
  useEffect(() => { studySecondsRef.current = studySeconds }, [studySeconds])
  useEffect(() => { soundsRef.current = sounds }, [sounds])

  // ===== WakeLock：计时中 或 用户在设置中开启常亮 =====
  const [timerRunning, setTimerRunning] = useState(false)
  const [wakeLockSetting, setWakeLockSetting] = useState<boolean>(
    () => storageGet<{ wakeLock?: boolean } | null>('focus-room-settings', null)?.wakeLock === true
  )
  useWakeLock(timerRunning || wakeLockSetting)

  // ===== 计时器折叠态（极简胶囊 vs 完整仪表卡片） =====
  const [timerCollapsed, setTimerCollapsed] = useState<boolean>(
    () => storageGet<boolean>('focus-room-timer-collapsed', false)
  )

  const handleToggleTimerCollapse = useCallback(() => {
    setTimerCollapsed(prev => {
      const next = !prev
      storageSet('focus-room-timer-collapsed', next)
      return next
    })
  }, [])

  // ===== Zen 清屏大时钟 =====
  const [zenDisplay, setZenDisplay] = useState<'clock' | 'countdown'>('clock')
  const [zenNow, setZenNow] = useState<Date>(() => new Date())
  const [tickInfo, setTickInfo] = useState<TickInfo | null>(null)

  const enterZen = useCallback(() => {
    setZenNow(new Date())
    setIsHidden(true)
    setShowHint(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowHint(false), 3000)
  }, [])

  useEffect(() => {
    if (!isHidden) return
    const iv = setInterval(() => setZenNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [isHidden])

  const ZEN_QUOTES = ['zen.quote1', 'zen.quote2', 'zen.quote3'] as const
  const zenQuoteKey = (() => {
    const dayOfYear = Math.floor((zenNow.getTime() - new Date(zenNow.getFullYear(), 0, 0).getTime()) / 86400000)
    return ZEN_QUOTES[dayOfYear % ZEN_QUOTES.length]
  })()

  // Timer actions ref — captured from Timer's onActionsReady
  const timerActionsRef = useRef<{
    toggle: () => void
    reset: () => void
    setMode: (mode: TimerMode) => void
    updateSettings: (settings: TimerSettings) => void
  } | null>(null)

  const handleTimerActionsReady = useCallback((actions: {
    toggle: () => void
    reset: () => void
    setMode: (mode: TimerMode) => void
    updateSettings: (settings: TimerSettings) => void
  }) => {
    timerActionsRef.current = actions
  }, [])

  const handleSettingsChange = useCallback((settings: TimerSettings) => {
    timerActionsRef.current?.updateSettings(settings)
    setWakeLockSetting((settings as TimerSettings & { wakeLock?: boolean }).wakeLock === true)
  }, [])

  // 顶栏「纯音乐」：广播打开抽屉请求，由 BottomBar 监听并定位到自习电台 Tab
  const handleOpenMusic = useCallback(() => {
    window.dispatchEvent(new CustomEvent('focusroom:open-drawer', { detail: { tab: 'music' } }))
  }, [])

  // Auto-start timer if setting is enabled (only once on mount)
  const autoStartDoneRef = useRef(false)
  useEffect(() => {
    if (autoStartDoneRef.current) return
    autoStartDoneRef.current = true
    const settings = storageGet<{ autoStart?: boolean } | null>('focus-room-settings', null)
    if (settings?.autoStart) {
      // Delay slightly so timerActionsRef is ready
      const checkAndStart = () => {
        if (timerActionsRef.current) {
          timerActionsRef.current.toggle()
        } else {
          setTimeout(checkAndStart, 200)
        }
      }
      setTimeout(checkAndStart, 500)
    }
  }, [])

  // Sitting reminder: show after 45 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      setToastMsg(t('focus.sittingReminder'))
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    }, 45 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [t])

  // Sleep timer
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null)
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Focus completion report
  const [showReport, setShowReport] = useState(false)
  const [reportPomodoros, setReportPomodoros] = useState(0)
  const [reportStudySeconds, setReportStudySeconds] = useState(0)

  // Completed pomodoro count (tracked locally for the report)
  const completedPomodorosRef = useRef(0)

  const anyPlaying = sounds.some(s => s.isPlaying)

  // 场景切换时自动播放对应音频
  useEffect(() => {
    if (prevSceneRef.current === currentScene.id) return
    prevSceneRef.current = currentScene.id

    const mapping = SCENE_SOUND_MAP[currentScene.id]
    if (!mapping) return

    // 先静音所有正在播放的声音
    soundsRef.current.filter(s => s.isPlaying).forEach(s => {
      if (s.id !== mapping.soundId) toggleSound(s.id)
    })

    // 300ms 后播放新场景的音频（给淡出留时间）
    setTimeout(() => {
      const target = soundsRef.current.find(s => s.id === mapping.soundId)
      if (target && !target.isPlaying) {
        toggleSound(mapping.soundId)
      }
    }, 300)
  }, [currentScene.id, toggleSound])

  // 首次进入专注页时自动播放场景音频
  const hasAutoPlayedRef = useRef(false)
  useEffect(() => {
    if (hasAutoPlayedRef.current) return
    const anyActive = sounds.some(s => s.isPlaying)
    if (anyActive) { hasAutoPlayedRef.current = true; return }

    const mapping = SCENE_SOUND_MAP[currentScene.id]
    if (mapping) {
      const target = sounds.find(s => s.id === mapping.soundId)
      if (target && !target.isPlaying) {
        hasAutoPlayedRef.current = true
        toggleSound(mapping.soundId)
      }
    }
  }, [sounds, currentScene.id, toggleSound])

  const handlePrevScene = useCallback(() => {
    const scenes = getScenes()
    const idx = scenes.findIndex(s => s.id === currentScene.id)
    const prev = scenes[(idx - 1 + scenes.length) % scenes.length]
    onChangeScene(prev)
    setToastMsg(`${prev.icon} ${prev.name}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }, [currentScene, onChangeScene])

  const handleNextScene = useCallback(() => {
    const scenes = getScenes()
    const idx = scenes.findIndex(s => s.id === currentScene.id)
    const next = scenes[(idx + 1) % scenes.length]
    onChangeScene(next)
    setToastMsg(`${next.icon} ${next.name}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }, [currentScene, onChangeScene])

  const handleToggleMute = useCallback(() => {
    if (anyPlaying) muteAll(); else unmuteAll()
  }, [anyPlaying, muteAll, unmuteAll])

  const handleFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement.requestFullscreen()
      }
    } catch {}
  }, [])

  const handlePomodoroComplete = useCallback(() => {
    completedPomodorosRef.current += 1
    setCelebrating(true)
    // Show report after celebration animation
    setTimeout(() => {
      setCelebrating(false)
      setReportPomodoros(completedPomodorosRef.current)
      setReportStudySeconds(studySecondsRef.current)
      setShowReport(true)
      setTimeout(() => setShowReport(false), 6000)
    }, 1500)
  }, [setShowReport])

  const handleStudySecondsChange = useCallback((seconds: number) => {
    setStudySeconds(seconds)
  }, [])

  // Sleep timer: start/stop interval
  const handleSetSleepTimer = useCallback((minutes: number | null) => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current)
    if (minutes === null || minutes <= 0) {
      setSleepTimerRemaining(null)
      return
    }
    const totalSeconds = minutes * 60
    setSleepTimerRemaining(totalSeconds)
    sleepIntervalRef.current = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(sleepIntervalRef.current!)
          muteAll()
          // 同步暂停内置音乐播放器（若在播放）
          window.dispatchEvent(new CustomEvent('focusroom:sleep-expired'))
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [muteAll])

  // Cleanup sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current)
    }
  }, [])

  // Touch swipe for scene switching
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let isSwiping = false

    const handleTouchStart = (e: Event) => {
      const te = e as TouchEvent
      touchStartX = te.touches[0].clientX
      touchStartY = te.touches[0].clientY
      isSwiping = false
    }

    const handleTouchMove = (e: Event) => {
      const te = e as TouchEvent
      const deltaX = te.touches[0].clientX - touchStartX
      const deltaY = te.touches[0].clientY - touchStartY
      // Only register horizontal swipe if horizontal distance > vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwiping = true
      }
    }

    const handleTouchEnd = (e: Event) => {
      const te = e as TouchEvent
      if (!isSwiping) return
      const touchEndX = te.changedTouches[0].clientX
      const deltaX = touchEndX - touchStartX
      const minSwipeDistance = 50

      if (Math.abs(deltaX) >= minSwipeDistance) {
        if (deltaX < 0) {
          // Swipe left -> next scene
          handleNextScene()
        } else {
          // Swipe right -> prev scene
          handlePrevScene()
        }
      }
      isSwiping = false
    }

    const container = document.querySelector('.absolute.inset-0.z-10')
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true })
      container.addEventListener('touchmove', handleTouchMove, { passive: true })
      container.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleNextScene, handlePrevScene])

  // Cursor auto-hide in clear-screen mode
  useEffect(() => {
    if (!isHidden) {
      document.body.style.cursor = ''
      return
    }
    document.body.style.cursor = 'none'
    let cursorTimeout: ReturnType<typeof setTimeout> | null = null
    const handleMouseMove = () => {
      document.body.style.cursor = 'default'
      if (cursorTimeout) clearTimeout(cursorTimeout)
      cursorTimeout = setTimeout(() => {
        document.body.style.cursor = 'none'
      }, 2000)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (cursorTimeout) clearTimeout(cursorTimeout)
      document.body.style.cursor = ''
    }
  }, [isHidden])

  // 双击清屏 — 用 ref 追踪状态，避免 effect 重跑时清理 timer
  const isHiddenRef = useRef(false)
  useEffect(() => { isHiddenRef.current = isHidden }, [isHidden])

  useEffect(() => {
    let lastClick = 0
    const handleClick = () => {
      const now = Date.now()
      if (now - lastClick < 300) {
        const next = !isHiddenRef.current
        if (next) {
          enterZen()
        } else {
          isHiddenRef.current = false
          setIsHidden(false)
          setShowHint(false)
        }
      } else if (isHiddenRef.current) {
        // 清屏（Zen）模式下单击：在时钟 / 番茄倒计时之间切换
        setZenDisplay(prev => (prev === 'clock' ? 'countdown' : 'clock'))
      }
      lastClick = now
    }
    const handleKey = (e: KeyboardEvent) => {
      // Skip if focused in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      if (e.code === 'Escape' && isHiddenRef.current) {
        isHiddenRef.current = false
        setIsHidden(false)
        setShowHint(false)
      }

      if (e.code === 'KeyZ' && !isHiddenRef.current && !e.ctrlKey && !e.metaKey) {
        enterZen()
        return
      }

      // Only handle memo/tools/back shortcuts when NOT in clear-screen mode
      if (!isHiddenRef.current) {
        if (e.code === 'KeyN') {
          setShowMemo(prev => !prev)
        } else if (e.code === 'KeyT') {
          setShowTools(prev => !prev)
        } else if (e.code === 'KeyB') {
          onBackToPicker()
        } else if (e.code === 'Space') {
          e.preventDefault()
          timerActionsRef.current?.toggle()
        } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
          timerActionsRef.current?.reset()
        } else if (e.code === 'Digit1') {
          timerActionsRef.current?.setMode('pomodoro')
        } else if (e.code === 'Digit2') {
          timerActionsRef.current?.setMode('stopwatch')
        } else if (e.code === 'Digit3') {
          timerActionsRef.current?.setMode('countdown')
        } else if (e.code === 'KeyM') {
          handleToggleMute()
        }
      }
    }
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [enterZen, handleToggleMute, onBackToPicker])

  const hoursStr = String(zenNow.getHours()).padStart(2, '0')
  const minsStr = String(zenNow.getMinutes()).padStart(2, '0')

  return (
    <div className="absolute inset-0 z-10">
      {/* 电影胶片微质感层 (35mm Micro-Grain) + 柔和通透暗角 */}
      <div className="cinema-grain" />
      <div className="absolute inset-0 overlay-vignette pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 overlay-bottom pointer-events-none" />

      {/* Zen 清屏大时钟 — 桌搭模式：单击在时钟/倒计时间切换，极简样式 */}
      {isHidden && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center pointer-events-none animate-fade-in select-none">
          {zenDisplay === 'clock' ? (
            <>
              <div className="zen-clock">
                {`${hoursStr}:${minsStr}`}
              </div>
              <div className="mt-6 text-sm text-white/50 tracking-[0.25em]">
                {zenNow.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
            </>
          ) : (
            <>
              <div className="zen-clock">{tickInfo?.displayTime ?? '00:00'}</div>
              <div className="mt-6 text-sm text-white/50 tracking-[0.25em] uppercase">
                {!tickInfo
                  ? ''
                  : tickInfo.mode === 'pomodoro'
                    ? (tickInfo.phase === 'work' ? t('timer.focusing') : tickInfo.phase === 'longBreak' ? t('timer.longBreak') : t('timer.shortBreak'))
                    : tickInfo.mode === 'countdown' ? t('timer.zenRemaining') : t('timer.stopwatch')}
              </div>
            </>
          )}

          <div className="mt-10 max-w-[80vw] text-center text-sm text-white/30 tracking-wide leading-relaxed">
            {t(zenQuoteKey)}
          </div>
        </div>
      )}


      {/* 顶部导航 */}
      <div className={`transition-all duration-500 ${isHidden ? 'opacity-0 -translate-y-4 pointer-events-none' : ''}`}>
        <TopNav
          onBackToPicker={onBackToPicker}
          onOpenTools={() => setShowTools(true)}
          onOpenMemo={() => setShowMemo(true)}
          onOpenStats={() => setShowStats(true)}
          onOpenCalendar={() => setShowCalendar(true)}
          onClearScreen={enterZen}
          onOpenMusic={handleOpenMusic}
        />
      </div>

      {/* 左下角计时器面板：支持【极简胶囊态】与【完整仪表卡片态】自由切换 */}
      <div className={`fixed left-3 bottom-20 z-20 transition-all duration-300 sm:left-6 sm:bottom-24 ${
        timerCollapsed ? 'w-auto' : 'w-[calc(100vw-24px)] sm:w-[340px]'
      } ${isHidden ? 'opacity-0 -translate-y-4 pointer-events-none' : ''}`}>
        {timerCollapsed ? (
          <Timer
            onActionsReady={handleTimerActionsReady}
            onPomodoroComplete={handlePomodoroComplete}
            onStudySecondsChange={handleStudySecondsChange}
            onRunningChange={setTimerRunning}
            reportTick={isHidden}
            onTickInfo={setTickInfo}
            collapsed={true}
            onToggleCollapse={handleToggleTimerCollapse}
          />
        ) : (
          <div className="aura-card rounded-2xl p-4 sm:p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <DailyGoal studySeconds={studySeconds} />
                <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase">
                  {t('focus.step03')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-white/40">
                  {currentScene.icon} {currentScene.name}
                </div>
                <button
                  onClick={handleToggleTimerCollapse}
                  className="p-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
                  title={t('timer.collapse')}
                  aria-label={t('timer.collapse')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              </div>
            </div>
            <Timer
              onActionsReady={handleTimerActionsReady}
              onPomodoroComplete={handlePomodoroComplete}
              onStudySecondsChange={handleStudySecondsChange}
              onRunningChange={setTimerRunning}
              reportTick={isHidden}
              onTickInfo={setTickInfo}
              collapsed={false}
              onToggleCollapse={handleToggleTimerCollapse}
            />
            {/* Study info strip */}
            <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/[0.06] text-[10px] text-white/35">
              <span>
                {t('focus.todayStudy')}:{' '}
                {(() => {
                  const h = Math.floor(studySeconds / 3600)
                  const m = Math.floor((studySeconds % 3600) / 60)
                  const s = studySeconds % 60
                  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                })()}
              </span>
              <span>
                {t('focus.weekStudy')}:{' '}
                {(() => {
                  const history = getStudyHistory()
                  const now = new Date()
                  const dayOfWeek = now.getDay()
                  const startOfWeek = new Date(now)
                  startOfWeek.setDate(now.getDate() - dayOfWeek)
                  startOfWeek.setHours(0, 0, 0, 0)
                  const weekDays = new Set(
                    history
                      .filter(h => new Date(h.date) >= startOfWeek && h.studySeconds > 0)
                      .map(h => h.date)
                  )
                  return `${weekDays.size}${t('focus.activeDays')}`
                })()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 底部场景切换栏 */}
      <div className={`transition-all duration-500 ${isHidden ? 'opacity-0 translate-y-4 pointer-events-none' : ''}`}>
        <BottomBar
          sceneName={currentScene.name}
          sceneIcon={currentScene.icon}
          sceneDescription={currentScene.description}
          isMuted={!anyPlaying}
          volume={ambientMaster}
          anyPlaying={anyPlaying}
          onPrevScene={handlePrevScene}
          onNextScene={handleNextScene}
          onToggleMute={handleToggleMute}
          onVolumeChange={setAmbientMaster}
          onOpenSettings={() => setShowSettings(true)}
          onFullscreen={handleFullscreen}
          sleepTimerRemaining={sleepTimerRemaining}
          onSetSleepTimer={handleSetSleepTimer}
        />
      </div>

      {/* 番茄完成庆祝动画 */}
      {celebrating && (
        <div
          className="fixed inset-0 z-30 pointer-events-none celebration-overlay"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.25) 0%, rgba(52,211,153,0.15) 40%, transparent 70%)',
            animation: 'celebrationPulse 1.5s ease-out forwards',
          }}
        />
      )}

      {/* 专注完成报告 */}
      {showReport && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center cursor-pointer"
          onClick={() => setShowReport(false)}
        >
          <div className="glass-strong rounded-2xl px-8 py-6 text-center animate-scale-in shadow-2xl max-w-[320px]">
            <div className="text-2xl mb-3">{t('report.title')}</div>
            <div className="text-sm text-white/70 mb-1.5">
              {t('report.todayPomodoros').replace('X', String(reportPomodoros))}
            </div>
            <div className="text-sm text-white/70 mb-3">
              {t('report.todayStudy').replace('XX:XX', (() => {
                const h = Math.floor(reportStudySeconds / 3600)
                const m = Math.floor((reportStudySeconds % 3600) / 60)
                const s = reportStudySeconds % 60
                if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
              })())}
            </div>
            <div className="flex gap-2 mt-3 justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); setShowShareCard(true) }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white transition-colors"
              >
                {t('share.title')}
              </button>
            </div>
            <div className="text-[10px] text-white/30 mt-2">{t('report.clickToDismiss')}</div>
          </div>
        </div>
      )}

      {/* Share Card overlay */}
      {showShareCard && (
        <Suspense fallback={null}>
          <ShareCard
            pomodoros={reportPomodoros}
            studyMinutes={Math.round(reportStudySeconds / 60)}
            sceneName={currentScene.name}
            sceneId={currentScene.id}
            onClose={() => setShowShareCard(false)}
          />
        </Suspense>
      )}

      <ShortcutToast />
      <InstallPrompt />

      {/* 清屏提示 */}
      {isHidden && showHint && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="glass-strong rounded-xl px-5 py-2.5 text-xs text-white/50 tracking-wide">
            {t('focus.clearHint').split('Esc').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px] mx-1">Esc</kbd>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scene switch toast */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="glass-strong rounded-xl px-5 py-2.5 text-xs text-white/70 tracking-wide shadow-lg">
            {toastMsg}
          </div>
        </div>
      )}

      {showMemo && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="text-white/30 text-sm animate-pulse">...</div></div>}>
          <MemoPanel onClose={() => setShowMemo(false)} />
        </Suspense>
      )}
      {showTools && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="text-white/30 text-sm animate-pulse">...</div></div>}>
          <FocusTools onClose={() => setShowTools(false)} />
        </Suspense>
      )}
      {showStats && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="text-white/30 text-sm animate-pulse">...</div></div>}>
          <StudyStats onClose={() => setShowStats(false)} />
        </Suspense>
      )}
      {showCalendar && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="text-white/30 text-sm animate-pulse">...</div></div>}>
          <StudyCalendar onClose={() => setShowCalendar(false)} />
        </Suspense>
      )}
      {showSettings && <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} onSettingsChange={handleSettingsChange} />}
    </div>
  )
}
