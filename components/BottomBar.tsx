'use client'

import { useState, useRef, useEffect } from 'react'
import { t } from '@/lib/i18n'
import ShortcutIndicator from './ShortcutIndicator'
import SoundMixer from './SoundMixer'

interface Props {
  sceneName: string
  sceneDescription: string
  isMuted: boolean
  volume: number
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
  sceneDescription,
  isMuted,
  volume,
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
  // NetEase playlist — lifted state, iframe always mounted
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null)

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

  // Close sound panel on outside click
  useEffect(() => {
    if (!showSoundPanel) return
    const handleClick = (e: MouseEvent) => {
      if (soundPanelRef.current && !soundPanelRef.current.contains(e.target as Node)) {
        setShowSoundPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSoundPanel])

  const handleSleepSelect = (minutes: number | null) => {
    onSetSleepTimer(minutes)
    setShowSleepMenu(false)
  }

  return (
    <>
    <div className="fixed bottom-3 left-1/2 z-30 -translate-x-1/2 sm:bottom-6">
      <div className="flex items-center gap-2 rounded-full glass-strong px-3 py-2 shadow-lg sm:gap-3 sm:px-6 sm:py-3">
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
          <span className="whitespace-nowrap text-sm font-semibold leading-tight text-white/90">
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
        <span className="whitespace-nowrap text-xs font-medium text-white/80 sm:hidden">
          {sceneName}
        </span>

        {/* Separator between scene info and controls */}
        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Next scene arrow */}
        <button
          onClick={onNextScene}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-light text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95"
          aria-label={t('bar.nextScene')}
        >
          ›
        </button>

        {/* Divider */}
        <div className="mx-0.5 h-6 w-px bg-white/15 sm:mx-1" />

        {/* Sound section */}
        <div className="hidden flex-col items-center gap-0 sm:flex">
          <span className="text-[10px] leading-tight text-white/40">{t('bar.sound')}</span>
          <div className="flex items-center gap-2">
            {/* Mute toggle */}
            <button
              onClick={onToggleMute}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15 active:scale-95"
              aria-label={isMuted ? t('bar.unmute') : t('bar.mute')}
            >
              {isMuted ? (
                /* Muted speaker */
                <svg
                  className="h-4 w-4 text-white/60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.2" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                /* Volume on speaker */
                <svg
                  className="h-4 w-4 text-white/80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.2" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="volume-slider w-16 cursor-pointer accent-white/60 sm:w-20"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.6) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.1) ${isMuted ? 0 : volume}%)`,
                height: '3px',
                borderRadius: '9999px',
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
          </div>
        </div>

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

        {/* Sound mixer toggle */}
        <div className="relative" ref={soundPanelRef}>
          <button
            onClick={() => { setShowSoundPanel(prev => !prev); setShowSleepMenu(false) }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15 active:scale-95 ${
              showSoundPanel ? 'bg-white/15 text-white/90' : 'text-white/50'
            }`}
            aria-label={t('bar.soundMixer')}
            title={t('bar.soundMixer')}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </button>

          {/* Sound mixer popup */}
          {showSoundPanel && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-96 max-h-[70vh] overflow-y-auto glass-strong rounded-2xl p-4 animate-fade-in shadow-lg z-50 scrollbar-thin">
              <SoundMixer activePlaylistId={activePlaylistId} onPlaylistChange={setActivePlaylistId} />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-0.5 h-6 w-px bg-white/15 sm:mx-1" />

        {/* Sleep timer button */}
        <div className="relative" ref={sleepMenuRef}>
          <button
            onClick={() => setShowSleepMenu(prev => !prev)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-full px-1.5 transition-all duration-200 hover:bg-white/15 active:scale-95 sm:px-2.5 ${
              sleepTimerRemaining !== null ? 'text-amber-300/90' : 'text-white/50'
            }`}
            aria-label={t('bar.sleepTimer')}
            title={t('bar.sleepTimer')}
          >
            {/* Moon icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            {sleepTimerRemaining !== null && (
              <span className="text-[11px] font-mono leading-none tabular-nums">
                {formatSleepTime(sleepTimerRemaining)}
              </span>
            )}
          </button>

          {/* Sleep timer dropdown */}
          {showSleepMenu && (
            <div className="absolute bottom-full mb-2 right-0 rounded-xl glass-strong py-1.5 min-w-[140px] animate-scale-in shadow-lg">
              <div className="px-3 py-1.5 text-[10px] text-white/40 tracking-wide uppercase">
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
                  className="w-full px-3 py-1.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 flex items-center justify-between active:scale-95"
                >
                  {opt.label}
                  {sleepTimerRemaining !== null && Math.ceil(sleepTimerRemaining / 60) === opt.minutes && (
                    <span className="text-amber-300/80 text-xs">✓</span>
                  )}
                </button>
              ))}
              <div className="mx-2 my-1 h-px bg-white/10" />
              <button
                onClick={() => handleSleepSelect(null)}
                className="w-full px-3 py-1.5 text-left text-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors duration-150 active:scale-95"
              >
                {t('bar.sleepOff')}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-0.5 h-6 w-px bg-white/15 sm:mx-1" />

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="hidden h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15 active:scale-95 sm:flex"
          aria-label={t('bar.settings')}
        >
          <svg
            className="h-4 w-4 text-white/60"
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
          className="hidden h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15 active:scale-95 sm:flex"
          aria-label={t('bar.fullscreen')}
        >
          <svg
            className="h-4 w-4 text-white/60"
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

        {/* Divider */}
        <div className="hidden h-6 w-px bg-white/15 sm:mx-1 sm:block" />

        {/* Keyboard shortcuts hint - hidden on mobile */}
        <div className="hidden sm:block">
          <ShortcutIndicator inline />
        </div>
      </div>

      {/* Inline style for range slider thumb */}
      <style dangerouslySetInnerHTML={{ __html: `
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: rgba(255,255,255,0.8); cursor: pointer;
          box-shadow: 0 0 4px rgba(0,0,0,0.3); transition: transform 0.15s ease;
        }
        .volume-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .volume-slider::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: rgba(255,255,255,0.8); cursor: pointer; border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
      `}} />
    </div>

    {/* Persistent NetEase player — rendered outside bar, always mounted when active */}
    {activePlaylistId && (
      <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 w-[360px] sm:w-[400px]">
        {/* Close button */}
        <div className="flex justify-end mb-1">
          <button
            onClick={() => setActivePlaylistId(null)}
            className="px-2 py-1 rounded-md bg-black/60 text-white/60 text-[10px] hover:text-white/90 transition-all"
          >
            关闭播放器 ✕
          </button>
        </div>
        {/* Iframe — never unmounts while BottomBar is mounted */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/30">
          <iframe
            src={`https://music.163.com/outchain/player?type=0&id=${activePlaylistId}&auto=0&height=80`}
            className="w-full bg-black"
            style={{ height: '80px' }}
            frameBorder="no"
          />
        </div>
      </div>
    )}
  </>
  )
}
