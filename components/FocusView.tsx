'use client'

import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react'
import TopNav from '@/components/TopNav'
import BottomBar from '@/components/BottomBar'
import Timer from '@/components/Timer'
import { Scene, SCENES, SCENE_SOUND_MAP, getScenes } from '@/components/SceneSelector'
import { TimerSettings } from '@/hooks/useTimer'
import { useAudioContext } from '@/contexts/AudioContext'
import ShortcutToast from '@/components/ShortcutToast'
import InstallPrompt from '@/components/InstallPrompt'
import DailyGoal from '@/components/DailyGoal'
import Settings from '@/components/Settings'
import { t } from '@/lib/i18n'

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
  const { sounds, toggleSound, setVolume, muteAll, unmuteAll } = useAudioContext()
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

  // Timer actions ref — captured from Timer's onActionsReady
  const timerActionsRef = useRef<{
    toggle: () => void
    reset: () => void
    setMode: (mode: any) => void
    updateSettings: (settings: TimerSettings) => void
  } | null>(null)

  const handleTimerActionsReady = useCallback((actions: {
    toggle: () => void
    reset: () => void
    setMode: (mode: any) => void
    updateSettings: (settings: TimerSettings) => void
  }) => {
    timerActionsRef.current = actions
  }, [])

  const handleSettingsChange = useCallback((settings: TimerSettings) => {
    timerActionsRef.current?.updateSettings(settings)
  }, [])

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

  const mainSound = sounds.find(s => s.isPlaying)
  const volume = mainSound?.volume ?? 50

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

  const handleVolumeChange = useCallback((v: number) => {
    const playing = sounds.find(s => s.isPlaying)
    if (playing) setVolume(playing.id, v)
  }, [sounds, setVolume])

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
  }, [])

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
        isHiddenRef.current = next
        setIsHidden(next)
        if (next) {
          setShowHint(true)
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          hideTimerRef.current = setTimeout(() => setShowHint(false), 3000)
        } else {
          setShowHint(false)
        }
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
  }, [])

  return (
    <div className="absolute inset-0 z-10">
      {/* 暗角 + 底部渐变 */}
      <div className="absolute inset-0 overlay-vignette pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 overlay-bottom pointer-events-none" />

      {/* 顶部导航 */}
      <div className={`transition-all duration-500 ${isHidden ? 'opacity-0 -translate-y-4 pointer-events-none' : ''}`}>
        <TopNav
          onBackToPicker={onBackToPicker}
          onOpenTools={() => setShowTools(true)}
          onOpenMemo={() => setShowMemo(true)}
          onOpenStats={() => setShowStats(true)}
          onOpenCalendar={() => setShowCalendar(true)}
          onClearScreen={() => setIsHidden(true)}
        />
      </div>

      {/* 左下角计时器面板 */}
      <div className={`fixed left-3 bottom-20 z-20 w-[calc(100vw-24px)] transition-all duration-500 sm:left-6 sm:bottom-24 sm:w-[320px] ${isHidden ? 'opacity-0 -translate-y-4 pointer-events-none' : ''}`}>
        <div className="glass-strong rounded-2xl p-4 border-t border-white/[0.06] sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <DailyGoal studySeconds={studySeconds} />
              <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase">
                {t('focus.step03')}
              </div>
            </div>
            <div className="text-[10px] text-white/30">
              {currentScene.icon} {currentScene.name}
            </div>
          </div>
          <Timer
            onActionsReady={handleTimerActionsReady}
            onPomodoroComplete={handlePomodoroComplete}
            onStudySecondsChange={handleStudySecondsChange}
          />
        </div>
      </div>

      {/* 底部场景切换栏 */}
      <div className={`transition-all duration-500 ${isHidden ? 'opacity-0 translate-y-4 pointer-events-none' : ''}`}>
        <BottomBar
          sceneName={currentScene.name}
          sceneDescription={currentScene.description}
          isMuted={!anyPlaying}
          volume={volume}
          onPrevScene={handlePrevScene}
          onNextScene={handleNextScene}
          onToggleMute={handleToggleMute}
          onVolumeChange={handleVolumeChange}
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
