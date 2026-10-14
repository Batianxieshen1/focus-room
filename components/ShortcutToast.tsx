'use client'

import { useState, useEffect } from 'react'
import { t, TranslationKey } from '@/lib/i18n'
import { storageGet, storageSet } from '@/lib/storage'
import { KEYS } from '@/lib/storageKeys'

const STORAGE_KEY = KEYS.shortcutSeen

const SHORTCUTS: { key: string; labelKey: TranslationKey }[] = [
  { key: 'Space', labelKey: 'shortcut.startPause' },
  { key: 'R', labelKey: 'shortcut.reset' },
  { key: '1-3', labelKey: 'shortcut.switchMode' },
  { key: 'M', labelKey: 'shortcut.muteAll' },
]

export default function ShortcutToast() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const seen = storageGet<string | null>(STORAGE_KEY, null)
    if (!seen) {
      // Show after a short delay so user can see the page first
      const showTimer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(showTimer)
    }
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
      storageSet(STORAGE_KEY, '1')
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
      storageSet(STORAGE_KEY, '1')
    }, 400)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 aura-capsule rounded-full px-4 py-2 flex items-center gap-3 text-xs text-white/80 shadow-2xl ${
        fading ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <span className="text-white/40 mr-1">{t('shortcut.title')}</span>
      {SHORTCUTS.map(s => (
        <div key={s.key} className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.1] text-white/80 font-mono text-[10px]">
            {s.key}
          </kbd>
          <span className="text-white/50">{t(s.labelKey)}</span>
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
