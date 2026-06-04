'use client'

import { useState, useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'

const DISMISSED_KEY = 'focus-room-shortcut-indicator-dismissed'

const SHORTCUTS = [
  { key: 'Space', i18nKey: 'settings.startPause' as const },
  { key: 'R', i18nKey: 'settings.reset' as const },
  { key: '1 2 3', i18nKey: 'settings.switchMode' as const },
  { key: 'M', i18nKey: 'settings.mute' as const },
  { key: 'Esc', i18nKey: 'settings.exitFocus' as const },
]

export default function ShortcutIndicator({ inline = false }: { inline?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    try {
      const val = localStorage.getItem(DISMISSED_KEY)
      if (val === '1') setDismissed(true)
    } catch {}
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const handleDismiss = () => {
    setDismissed(true)
    setIsOpen(false)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
  }

  if (dismissed && !isOpen) return null

  const popup = isOpen && (
    <div
      ref={popupRef}
      className="glass-strong rounded-2xl p-5 w-64 animate-fade-in"
      style={inline ? { position: 'absolute', bottom: '100%', right: 0, marginBottom: 8 } : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {t('settings.shortcuts')}
        </h3>
        <button
          onClick={handleDismiss}
          className="text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {t('shortcut.dismiss', '不再显示')}
        </button>
      </div>
      <div className="space-y-2">
        {SHORTCUTS.map(s => (
          <div key={s.key} className="flex items-center justify-between">
            <kbd
              className="px-2 py-0.5 rounded text-xs font-mono"
              style={{
                background: 'var(--glass-bg)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--glass-border)',
              }}
            >
              {s.key}
            </kbd>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t(s.i18nKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const button = (
    <button
      ref={btnRef}
      onClick={() => setIsOpen(prev => !prev)}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 text-sm font-bold hover:bg-white/15"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      title={t('settings.shortcuts')}
    >
      ?
    </button>
  )

  if (inline) {
    return (
      <div className="relative">
        {popup}
        {button}
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 right-6 z-30 pointer-events-auto">
      {popup}
      {button}
    </div>
  )
}
