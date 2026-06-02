'use client'

import { useState, useCallback } from 'react'
import Clock from './Clock'
import Timer from './Timer'
import SoundMixer from './SoundMixer'
import SceneSelector, { Scene } from './SceneSelector'
import StudyStats from './StudyStats'
import StudyCalendar from './StudyCalendar'
import Settings from './Settings'
import DailyGoal from './DailyGoal'
import ShortcutIndicator from './ShortcutIndicator'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useFocusMode } from '@/hooks/useFocusMode'
import { TimerSettings } from '@/hooks/useTimer'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'

interface Props {
  currentScene: string
  onSceneChange: (scene: Scene) => void
}

export default function ControlPanel({ currentScene, onSceneChange }: Props) {
  const [activePanel, setActivePanel] = useState<'sound' | 'scene' | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [studySeconds, setStudySeconds] = useState(0)
  const { isHidden } = useFocusMode()
  const { muteAll, unmuteAll, sounds } = useAudioContext()
  const anyPlaying = sounds.some(s => s.isPlaying)

  const [timerActions, setTimerActions] = useState<{
    toggle: () => void
    reset: () => void
    setMode: (mode: 'pomodoro' | 'stopwatch' | 'countdown') => void
    updateSettings: (settings: TimerSettings) => void
  } | null>(null)

  const handleMuteToggle = useCallback(() => {
    if (anyPlaying) muteAll(); else unmuteAll()
  }, [anyPlaying, muteAll, unmuteAll])

  useKeyboard({
    onToggle: () => timerActions?.toggle(),
    onReset: () => timerActions?.reset(),
    onModeChange: (mode) => timerActions?.setMode(mode),
    onMuteToggle: handleMuteToggle,
  })

  const togglePanel = (panel: 'sound' | 'scene') => {
    setActivePanel(prev => prev === panel ? null : panel)
  }

  return (
    <>
      {isHidden && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="text-xs text-white/30 tracking-wider animate-pulse">
            {t('focus.hint')}
          </div>
        </div>
      )}

      {/* 顶部：时钟 + 每日目标 */}
      <div className={`fixed top-0 left-0 right-0 flex justify-between items-start pt-6 px-6 pointer-events-none z-10 transition-all duration-500 ${
        isHidden ? 'opacity-0 -translate-y-4' : 'opacity-100'
      }`}>
        <div className="pointer-events-auto">
          <DailyGoal studySeconds={studySeconds} />
        </div>
        <Clock />
        <div className="w-20" /> {/* 占位，保持居中 */}
      </div>

      {/* 中间：计时器 */}
      <div className={`fixed inset-0 flex items-center justify-center pointer-events-none z-10 transition-all duration-500 ${
        isHidden ? 'opacity-0 scale-95' : 'opacity-100'
      }`}>
        <div className="pointer-events-auto">
          <Timer
            onActionsReady={setTimerActions}
            onStudySecondsChange={setStudySeconds}
          />
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className={`fixed bottom-0 left-0 right-0 flex justify-center pb-6 safe-bottom z-20 pointer-events-none transition-all duration-500 ${
        isHidden ? 'opacity-0 translate-y-4' : 'opacity-100'
      }`}>
        <div className="flex flex-col items-center gap-3 pointer-events-auto">

          {activePanel && (
            <div className="glass-strong rounded-2xl p-5 w-72 animate-fade-in">
              {activePanel === 'sound' && <SoundMixer />}
              {activePanel === 'scene' && (
                <SceneSelector currentScene={currentScene} onSceneChange={onSceneChange} />
              )}
            </div>
          )}

          <div className="glass rounded-full px-2 py-1.5 flex items-center gap-1">
            <button
              onClick={() => togglePanel('sound')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                activePanel === 'sound' ? 'bg-white/[0.15] text-white' : 'text-white/50 hover:text-white/80'
              }`}
              title={`${t('sound.title')} (M)`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </button>

            <button
              onClick={() => togglePanel('scene')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                activePanel === 'scene' ? 'bg-white/[0.15] text-white' : 'text-white/50 hover:text-white/80'
              }`}
              title={t('scene.title')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>

            <div className="w-px h-5 bg-white/15 mx-0.5" />

            <button
              onClick={() => setShowStats(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 transition-all duration-200"
              title={t('stats.title')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </button>

            <button
              onClick={() => setShowCalendar(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 transition-all duration-200"
              title={t('calendar.title')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 transition-all duration-200"
              title={t('settings.title')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showStats && <StudyStats onClose={() => setShowStats(false)} />}
      {showCalendar && <StudyCalendar onClose={() => setShowCalendar(false)} />}
      {showSettings && (
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSettingsChange={(s) => timerActions?.updateSettings(s)}
        />
      )}

      <ShortcutIndicator />
    </>
  )
}
