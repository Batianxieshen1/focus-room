'use client'

import { useState, useEffect } from 'react'
import { t } from '@/lib/i18n'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('focus-room-install-dismissed') === '1') {
        setDismissed(true)
      }
    } catch {}

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // 延迟显示，让用户先体验页面
      setTimeout(() => setVisible(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    try { localStorage.setItem('focus-room-install-dismissed', '1') } catch {}
  }

  if (!visible || dismissed || !deferredPrompt) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="glass-strong rounded-2xl p-4 flex items-center gap-3 max-w-[260px]">
        <span className="text-2xl">📱</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white/90">{t('install.title')}</div>
          <div className="text-[10px] text-white/50 mt-0.5">{t('install.desc')}</div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-white/[0.15] text-white/90 text-[11px] font-medium hover:bg-white/[0.22] transition-all active:scale-95"
          >
            安装
          </button>
          <button
            onClick={handleDismiss}
            className="px-2 py-1.5 rounded-lg text-white/40 text-[11px] hover:text-white/70 transition-all active:scale-95"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
