'use client'

import { t } from '@/lib/i18n'

interface Props {
  onBackToPicker: () => void
  onOpenTools: () => void
  onOpenMemo: () => void
  onOpenStats: () => void
  onOpenCalendar: () => void
  onClearScreen: () => void
}

export default function TopNav({
  onBackToPicker,
  onOpenTools,
  onOpenMemo,
  onOpenStats,
  onOpenCalendar,
  onClearScreen,
}: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 glass">
      {/* Left: Back button */}
      <button
        onClick={onBackToPicker}
        className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm text-white/70 bg-white/10 border border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white hover:border-white/20"
      >
        <span className="text-base leading-none">&larr;</span>
        <span>{t('nav.backToScenes')}</span>
      </button>

      {/* Center: Navigation links */}
      <div className="flex items-center gap-6">
        <button
          onClick={onOpenTools}
          className="text-sm text-white/60 transition-all duration-200 hover:text-white hover:underline hover:underline-offset-4"
        >
          {t('nav.tools')}
        </button>
        <button
          onClick={onOpenMemo}
          className="text-sm text-white/60 transition-all duration-200 hover:text-white hover:underline hover:underline-offset-4"
        >
          {t('nav.memo')}
        </button>
        <button
          onClick={onOpenStats}
          className="text-sm text-white/60 transition-all duration-200 hover:text-white hover:underline hover:underline-offset-4"
        >
          {t('nav.stats')}
        </button>
        <button
          onClick={onOpenCalendar}
          className="text-sm text-white/60 transition-all duration-200 hover:text-white hover:underline hover:underline-offset-4"
        >
          {t('nav.calendar')}
        </button>
        <button
          onClick={() => window.open('https://www.youtube.com/results?search_query=lofi+study+music+live', '_blank')}
          className="text-sm text-white/60 transition-all duration-200 hover:text-white hover:underline hover:underline-offset-4"
        >
          {t('nav.music')}
        </button>
        <span className="text-sm text-white/30 cursor-default select-none">
          {t('nav.contact')}
        </span>
      </div>

      {/* Right: Clear screen */}
      <button
        onClick={onClearScreen}
        className="rounded-full px-4 py-1.5 text-sm text-white/60 border border-white/10 transition-all duration-200 hover:bg-white/15 hover:text-white hover:border-white/20"
      >
        {t('nav.clearScreen')}
      </button>
    </nav>
  )
}
