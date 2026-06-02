'use client'

import { useState, useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'

const DISMISSED_KEY = 'focus-room-shortcut-indicator-dismissed'

const SHORTCUTS = [
  { key: 'Space', zh: '开始/暂停', en: 'Start/Pause' },
  { key: 'R', zh: '重置', en: 'Reset' },
  { key: '1 2 3', zh: '切换模式', en: 'Switch Mode' },
  { key: 'M', zh: '全部静音', en: 'Mute All' },
  { key: 'Esc', zh: '退出专注', en: 'Exit Focus' },
]

export default function ShortcutIndicator() {
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

  return (
    <div className="fixed bottom-20 right-6 z-30 pointer-events-auto">
      {/* Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className="glass-strong rounded-2xl p-5 mb-3 w-64 animate-fade-in"
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
                  {t(`settings.${s.key === 'Space' ? 'startPause' : s.key === 'R' ? 'reset' : s.key === 'M' ? 'mute' : s.key === 'Esc' ? 'exitFocus' : 'switchMode'}` as any, s.key === 'Space' ? '开始/暂停' : s.key === 'R' ? '重置' : s.key === 'M' ? '静音' : s.key === 'Esc' ? '退出专注' : '切换模式')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        ref={btnRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 text-sm font-bold"
        style={{
          background: 'var(--glass-bg)',
          color: 'var(--text-muted)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        title={t('settings.shortcuts')}
      >
        ?
      </button>
    </div>
  )
}
