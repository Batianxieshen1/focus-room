'use client'

import React, { useState, useRef, useEffect } from 'react'
import { t } from '@/lib/i18n'
import ShortcutIndicator from './ShortcutIndicator'

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

  const handleSleepSelect = (minutes: number | null) => {
    onSetSleepTimer(minutes)
    setShowSleepMenu(false)
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full glass-strong px-6 py-3 shadow-lg">
        {/* Prev scene arrow */}
        <button
          onClick={onPrevScene}
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-light text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white"
          aria-label={t('bar.prevScene')}
        >
          ‹
        </button>

        {/* Scene info */}
        <div className="flex flex-col items-center gap-0">
          <span className="text-[10px] leading-tight text-white/40">{t('bar.scene')}</span>
          <span className="whitespace-nowrap text-sm font-medium leading-tight text-white/90">
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

        {/* Next scene arrow */}
        <button
          onClick={onNextScene}
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-light text-white/60 transition-all duration-200 hover:bg-white/15 hover:text-white"
          aria-label={t('bar.nextScene')}
        >
          ›
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-white/15" />

        {/* Sound section */}
        <div className="flex flex-col items-center gap-0">
          <span className="text-[10px] leading-tight text-white/40">{t('bar.sound')}</span>
          <div className="flex items-center gap-2">
            {/* Mute toggle */}
            <button
              onClick={onToggleMute}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15"
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
              className="volume-slider w-20 cursor-pointer accent-white/60"
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

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-white/15" />

        {/* Sleep timer button */}
        <div className="relative" ref={sleepMenuRef}>
          <button
            onClick={() => setShowSleepMenu(prev => !prev)}
            className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-all duration-200 hover:bg-white/15 ${
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
                  className="w-full px-3 py-1.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 flex items-center justify-between"
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
                className="w-full px-3 py-1.5 text-left text-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors duration-150"
              >
                {t('bar.sleepOff')}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-white/15" />

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15"
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
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15"
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
        <div className="mx-1 h-6 w-px bg-white/15" />

        {/* Keyboard shortcuts hint */}
        <ShortcutIndicator inline />
      </div>

      {/* Inline style for range slider thumb */}
      <style dangerouslySetInnerHTML={{ __html: `
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
          background: rgba(255,255,255,0.8); cursor: pointer;
          box-shadow: 0 0 4px rgba(0,0,0,0.3); transition: transform 0.15s ease;
        }
        .volume-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .volume-slider::-moz-range-thumb {
          width: 12px; height: 12px; border-radius: 50%;
          background: rgba(255,255,255,0.8); cursor: pointer; border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
      `}} />
    </div>
  )
}
