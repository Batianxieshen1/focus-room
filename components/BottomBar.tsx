'use client'

import { useState, useRef, useEffect } from 'react'
import { t } from '@/lib/i18n'
import { storageGet, storageSet, storageRemove } from '@/lib/storage'
import { loadAtmosphere, saveAtmosphere, Atmosphere } from '@/lib/atmosphere'
import ShortcutIndicator from './ShortcutIndicator'
import SoundMixer from './SoundMixer'
import MusicPlayer from './MusicPlayer'

interface Props {
  sceneName: string
  sceneIcon?: string
  sceneDescription: string
  isMuted: boolean
  /** 环境音总音量（母线）0~100 */
  volume: number
  anyPlaying?: boolean
  onPrevScene: () => void
  onNextScene: () => void
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onOpenSettings: () => void
  onFullscreen: () => void
  sleepTimerRemaining: number | null
  onSetSleepTimer: (minutes: number | null) => void
}

function formatSleepTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function BottomBar({
  sceneName,
  sceneIcon,
  sceneDescription,
  isMuted,
  volume,
  anyPlaying = false,
  onPrevScene,
  onNextScene,
  onToggleMute,
  onVolumeChange,
  onOpenSettings,
  onFullscreen,
  sleepTimerRemaining,
  onSetSleepTimer,
}: Props) {
  const [showSleepMenu, setShowSleepMenu] = useState(false)
  const sleepMenuRef = useRef<HTMLDivElement>(null)
  const [showSoundPanel, setShowSoundPanel] = useState(false)
  const soundPanelRef = useRef<HTMLDivElement>(null)
  const [soundTab, setSoundTab] = useState<'ambient' | 'music' | 'presets'>('ambient')
  const [showAtmosphere, setShowAtmosphere] = useState(false)
  const atmosphereRef = useRef<HTMLDivElement>(null)

  // 视觉氛围（遮光/虚化/暖色）
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(() => loadAtmosphere())

  // 歌单播放状态 — 持久化，刷新后恢复
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(
    () => storageGet<string | null>('focus-room-playlist', null)
  )
  const [playerMode, setPlayerMode] = useState<'iframe' | 'native'>(
    () => storageGet<'iframe' | 'native'>('focus-room-player-mode', 'iframe')
  )
  const metingApi = storageGet<string>('focus-room-meting-api', '')

  const handlePlaylistChange = (id: string | null) => {
    setActivePlaylistId(id)
    if (id) storageSet('focus-room-playlist', id)
    else storageRemove('focus-room-playlist')
  }

  const handlePlayerModeChange = (mode: 'iframe' | 'native') => {
    setPlayerMode(mode)
    storageSet('focus-room-player-mode', mode)
  }

  // Close popups on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSoundPanel) {
          setShowSoundPanel(false)
          e.stopPropagation()
        } else if (showAtmosphere) {
          setShowAtmosphere(false)
          e.stopPropagation()
        } else if (showSleepMenu) {
          setShowSleepMenu(false)
          e.stopPropagation()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSoundPanel, showAtmosphere, showSleepMenu])

  // Close sleep menu on outside click
  useEffect(() => {
    if (!showSleepMenu) return
    const handleClick = (e: MouseEvent) => {
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(e.target as Node)) {
        setShowSleepMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSleepMenu])

  // Close atmosphere panel on outside click
  useEffect(() => {
    if (!showAtmosphere) return
    const handleClick = (e: MouseEvent) => {
      if (atmosphereRef.current && !atmosphereRef.current.contains(e.target as Node)) {
        setShowAtmosphere(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showAtmosphere])

  const handleSleepSelect = (minutes: number | null) => {
    onSetSleepTimer(minutes)
    setShowSleepMenu(false)
  }

  const updateAtmosphere = (patch: Partial<Atmosphere>) => {
    const next = { ...atmosphere, ...patch }
    setAtmosphere(next)
    saveAtmosphere(next)
  }

  return (
    <>
      {/* ===== Floating Control Dock ===== */}
      <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 rounded-full aura-dock px-3.5 py-2 shadow-2xl sm:gap-3.5 sm:px-6 sm:py-3 transition-all duration-300">
          {/* ===== LEFT GROUP: Scene navigation ===== */}
          {/* Prev scene arrow */}
          <button
            onClick={onPrevScene}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-light text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95"
            aria-label={t('bar.prevScene')}
          >
            ‹
          </button>

          {/* Scene info */}
          <div className="hidden flex-col items-center gap-0 sm:flex">
            <span className="text-[10px] leading-tight text-white/40">{t('bar.scene')}</span>
            <span className="whitespace-nowrap text-sm font-semibold leading-tight text-white/90 flex items-center gap-1.5">
              {sceneIcon && <span className="text-xs opacity-75">{sceneIcon}</span>}
              {sceneName}
            </span>
            <span
              className="max-w-[200px] truncate text-[10px] leading-tight text-white/40 animate-fade-in"
              title={sceneDescription}
              key={sceneDescription}
            >
              {sceneDescription}
            </span>
          </div>

          {/* Mobile: scene name only */}
          <span className="whitespace-nowrap text-xs sm:text-sm font-medium text-white/80 sm:hidden flex items-center gap-1">
            {sceneIcon && <span className="text-[10px] opacity-75">{sceneIcon}</span>}
            {sceneName}
          </span>

          {/* Next scene arrow */}
          <button
            onClick={onNextScene}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-light text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95"
            aria-label={t('bar.nextScene')}
          >
            ›
          </button>

          {/* ===== Prominent separator between groups ===== */}
          <div className="mx-1 h-8 w-px bg-white/20 sm:mx-2 sm:h-9 sm:w-[1.5px]" />

          {/* ===== RIGHT GROUP: Controls ===== */}
          {/* Mobile mute button */}
          <button
            onClick={onToggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15 active:scale-95 sm:hidden"
            aria-label={isMuted ? t('bar.unmute') : t('bar.mute')}
          >
            {isMuted ? (
              <svg className="h-4 w-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.2" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.2" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          {/* Master volume（环境音总音量）— desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95"
              aria-label={isMuted ? t('bar.unmute') : t('bar.mute')}
              title={t('bar.masterVolume')}
            >
              {isMuted ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.2" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.2" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={e => onVolumeChange(Number(e.target.value))}
              className="w-16 h-[3px] volume-slider"
              aria-label={t('bar.masterVolume')}
            />
          </div>

          {/* Sound Studio Drawer Toggle */}
          <button
            onClick={() => {
              setShowSoundPanel(prev => !prev)
              setShowSleepMenu(false)
              setShowAtmosphere(false)
            }}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
              showSoundPanel
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            aria-label={t('bar.soundMixer')}
            title={t('bar.soundMixer')}
          >
            {(anyPlaying || activePlaylistId) && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
            )}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </button>

          {/* Atmosphere（视觉氛围调节）toggle */}
          <div className="relative" ref={atmosphereRef}>
            <button
              onClick={() => {
                setShowAtmosphere(prev => !prev)
                setShowSleepMenu(false)
              }}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
                showAtmosphere
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              aria-label={t('atm.title')}
              title={t('atm.title')}
            >
              {(atmosphere.brightness < 100 || atmosphere.blur > 0 || atmosphere.warmth > 0) && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
              )}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" opacity="0.5" />
              </svg>
            </button>

            {/* Atmosphere popup */}
            {showAtmosphere && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-68 aura-card rounded-2xl p-4 animate-scale-in shadow-2xl z-50">
                <div className="text-[10px] text-white/40 tracking-widest uppercase font-medium mb-3">{t('atm.title')}</div>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-white/70 mb-1.5">
                      <span>{t('atm.brightness')}</span>
                      <span className="tabular-nums text-white/40">{atmosphere.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={atmosphere.brightness}
                      onChange={e => updateAtmosphere({ brightness: Number(e.target.value) })}
                      className="w-full h-[3px]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-white/70 mb-1.5">
                      <span>{t('atm.blur')}</span>
                      <span className="tabular-nums text-white/40">{atmosphere.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={16}
                      value={atmosphere.blur}
                      onChange={e => updateAtmosphere({ blur: Number(e.target.value) })}
                      className="w-full h-[3px]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-white/70 mb-1.5">
                      <span>{t('atm.warmth')}</span>
                      <span className="tabular-nums text-white/40">{atmosphere.warmth}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={atmosphere.warmth}
                      onChange={e => updateAtmosphere({ warmth: Number(e.target.value) })}
                      className="w-full h-[3px]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const def = { brightness: 100, blur: 0, warmth: 0 }
                      setAtmosphere(def)
                      saveAtmosphere(def)
                    }}
                    className="text-[10px] text-white/35 hover:text-white/75 transition-colors text-left pt-1"
                  >
                    {t('atm.reset')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sleep timer button */}
          <div className="relative" ref={sleepMenuRef}>
            <button
              onClick={() => {
                setShowSleepMenu(prev => !prev)
                setShowAtmosphere(false)
              }}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-full px-2 transition-all duration-200 active:scale-95 ${
                sleepTimerRemaining !== null
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : showSleepMenu
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              aria-label={t('bar.sleepTimer')}
              title={t('bar.sleepTimer')}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              {sleepTimerRemaining !== null && (
                <span className="text-[11px] font-mono leading-none tabular-nums font-medium">
                  {formatSleepTime(sleepTimerRemaining)}
                </span>
              )}
            </button>

            {/* Sleep timer dropdown */}
            {showSleepMenu && (
              <div className="absolute bottom-full mb-3 right-0 rounded-2xl aura-card py-2 min-w-[150px] animate-scale-in shadow-2xl z-50">
                <div className="px-3.5 py-1.5 text-[10px] text-white/40 tracking-wider uppercase font-medium">
                  {t('bar.sleepTimer')}
                </div>
                {[
                  { label: t('bar.sleep30'), minutes: 30 },
                  { label: t('bar.sleep60'), minutes: 60 },
                  { label: t('bar.sleep90'), minutes: 90 },
                ].map(opt => (
                  <button
                    key={opt.minutes}
                    onClick={() => handleSleepSelect(opt.minutes)}
                    className="w-full px-3.5 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-between active:scale-95"
                  >
                    <span>{opt.label}</span>
                    {sleepTimerRemaining !== null && Math.ceil(sleepTimerRemaining / 60) === opt.minutes && (
                      <span className="text-amber-300 text-xs">✓</span>
                    )}
                  </button>
                ))}
                <div className="mx-2 my-1 h-px bg-white/10" />
                <button
                  onClick={() => handleSleepSelect(null)}
                  className="w-full px-3.5 py-1.5 text-left text-xs text-white/40 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
                >
                  {t('bar.sleepOff')}
                </button>
              </div>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95 sm:flex"
            aria-label={t('bar.settings')}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Fullscreen button */}
          <button
            onClick={onFullscreen}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95 sm:flex"
            aria-label={t('bar.fullscreen')}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>

          {/* Keyboard shortcuts hint - hidden on mobile */}
          <div className="hidden sm:block">
            <ShortcutIndicator inline />
          </div>
        </div>

        {/* Inline style for range slider thumb */}
        <style dangerouslySetInnerHTML={{ __html: `
          .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
            background: rgba(255,255,255,0.85); cursor: pointer;
            box-shadow: 0 0 6px rgba(0,0,0,0.4); transition: transform 0.15s ease;
          }
          .volume-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
          .volume-slider::-moz-range-thumb {
            width: 14px; height: 14px; border-radius: 50%;
            background: rgba(255,255,255,0.85); cursor: pointer; border: none;
            box-shadow: 0 0 6px rgba(0,0,0,0.4);
          }
        `}} />
      </div>

      {/* ===== Mini Player Capsule for Iframe Mode when Drawer is Closed ===== */}
      {activePlaylistId && playerMode === 'iframe' && !showSoundPanel && (
        <div
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 animate-fade-in cursor-pointer"
          onClick={() => {
            setSoundTab('music')
            setShowSoundPanel(true)
          }}
        >
          <div className="aura-capsule rounded-full pl-3.5 pr-2.5 py-1.5 flex items-center gap-2.5 shadow-xl hover:border-white/30 transition-all group">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-white/80 group-hover:text-white transition-colors">
              {t('bar.iframeMini')}
            </span>
            <span className="text-[10px] text-white/35 group-hover:text-white/60">
              {t('player.tapToExpand')}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePlaylistChange(null)
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
              title={t('player.closePlayer')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ===== Native Player Mode ===== */}
      {activePlaylistId && playerMode === 'native' && (
        <MusicPlayer
          playlistId={activePlaylistId}
          api={metingApi}
          expanded={showSoundPanel && soundTab === 'music'}
          onClear={() => handlePlaylistChange(null)}
        />
      )}

      {/* ===== Sound Studio Drawer (Slide-over from Right) ===== */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/45 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          showSoundPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowSoundPanel(false)}
        aria-hidden={!showSoundPanel}
      />

      {/* Drawer Container (Always mounted in DOM to prevent iframe audio restart) */}
      <aside
        ref={soundPanelRef}
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] max-w-[100vw] aura-drawer flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          showSoundPanel ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        aria-hidden={!showSoundPanel}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white/90">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/90 tracking-wide">{t('sound.drawerTitle')}</h2>
              <p className="text-[10px] text-white/40 tracking-wider uppercase">{t('sound.category')}</p>
            </div>
          </div>

          <button
            onClick={() => setShowSoundPanel(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.1] transition-all active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          <SoundMixer
            activePlaylistId={activePlaylistId}
            onPlaylistChange={handlePlaylistChange}
            playerMode={playerMode}
            onPlayerModeChange={handlePlayerModeChange}
            activeTab={soundTab}
            onTabChange={setSoundTab}
          />
        </div>
      </aside>
    </>
  )
}
