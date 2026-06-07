'use client'

import { useState, useEffect } from 'react'
import { t } from '@/lib/i18n'

const STORAGE_KEY = 'focus-room-shortcut-seen'

const SHORTCUTS = [
  { key: 'Space', labelKey: 'shortcut.startPause' },
  { key: 'R', labelKey: 'shortcut.reset' },
  { key: '1-3', labelKey: 'shortcut.switchMode' },
  { key: 'M', labelKey: 'shortcut.muteAll' },
]

export default function ShortcutToast() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) {
        // Show after a short delay so user can see the page first
        const showTimer = setTimeout(() => setVisible(true), 1500)
        return () => clearTimeout(showTimer)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!visible) return
    // Auto-fade after 5 seconds
    const fadeTimer = setTimeout(() => {
      setFading(true)
    }, 5000)
    // Remove from DOM after fade animation
    const removeTimer = setTimeout(() => {
      setVisible(false)
      try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    }, 5400)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [visible])

  const handleClose = () => {
    setFading(true)
    setTimeout(() => {
      setVisible(false)
      try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    }, 400)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-xl px-5 py-3 flex items-center gap-4 text-xs text-white/75 ${
        fading ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <span className="text-white/40 mr-1">{t('shortcut.title')}</span>
      {SHORTCUTS.map(s => (
        <div key={s.key} className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.1] text-white/80 font-mono text-[10px]">
            {s.key}
          </kbd>
          <span className="text-white/50">{t(s.labelKey as any)}</span>
        </div>
      ))}
      <button
        onClick={handleClose}
        className="ml-2 text-white/30 hover:text-white/60 transition-colors active:scale-95"
        aria-label={t('shortcut.dismiss')}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  )
}
