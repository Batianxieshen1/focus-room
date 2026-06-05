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
    <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 safe-top sm:px-6 sm:py-3 glass">
      {/* Left: Back button */}
      <button
        onClick={onBackToPicker}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/70 bg-white/10 border border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:border-white/20 active:scale-95"
      >
        <span className="text-base leading-none">&larr;</span>
        <span className="hidden sm:inline">{t('nav.backToScenes')}</span>
      </button>

      {/* Center: Navigation links - icons on mobile, text on desktop */}
      <div className="flex items-center gap-1 sm:gap-6">
        <button
          onClick={onOpenTools}
          className="flex h-8 w-8 items-center justify-center rounded-full px-3 py-1.5 text-sm text-white/60 transition-all duration-200 hover:text-white hover:bg-white/10 active:scale-95 sm:h-auto sm:w-auto sm:rounded-full sm:text-sm sm:text-white/60 sm:hover:bg-white/[0.08]"
          title={t('nav.tools')}
        >
          <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span className="hidden sm:inline">{t('nav.tools')}</span>
        </button>
        <button
          onClick={onOpenMemo}
          className="flex h-8 w-8 items-center justify-center rounded-full px-3 py-1.5 text-sm text-white/60 transition-all duration-200 hover:text-white hover:bg-white/10 active:scale-95 sm:h-auto sm:w-auto sm:rounded-full sm:text-sm sm:text-white/60 sm:hover:bg-white/[0.08]"
          title={t('nav.memo')}
        >
          <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="hidden sm:inline">{t('nav.memo')}</span>
        </button>
        <button
          onClick={onOpenStats}
          className="flex h-8 w-8 items-center justify-center rounded-full px-3 py-1.5 text-sm text-white/60 transition-all duration-200 hover:text-white hover:bg-white/10 active:scale-95 sm:h-auto sm:w-auto sm:rounded-full sm:text-sm sm:text-white/60 sm:hover:bg-white/[0.08]"
          title={t('nav.stats')}
        >
          <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className="hidden sm:inline">{t('nav.stats')}</span>
        </button>
        <button
          onClick={onOpenCalendar}
          className="flex h-8 w-8 items-center justify-center rounded-full px-3 py-1.5 text-sm text-white/60 transition-all duration-200 hover:text-white hover:bg-white/10 active:scale-95 sm:h-auto sm:w-auto sm:rounded-full sm:text-sm sm:text-white/60 sm:hover:bg-white/[0.08]"
          title={t('nav.calendar')}
        >
          <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="hidden sm:inline">{t('nav.calendar')}</span>
        </button>
        <button
          onClick={() => window.open('https://www.youtube.com/results?search_query=lofi+study+music+live', '_blank')}
          className="flex h-8 w-8 items-center justify-center rounded-full px-3 py-1.5 text-sm text-white/60 transition-all duration-200 hover:text-white hover:bg-white/10 active:scale-95 sm:h-auto sm:w-auto sm:rounded-full sm:text-sm sm:text-white/60 sm:hover:bg-white/[0.08]"
          title={t('nav.music')}
        >
          <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          <span className="hidden sm:inline">{t('nav.music')}</span>
        </button>
        <span className="hidden text-sm text-white/30 cursor-default select-none sm:inline">
          {t('nav.contact')}
        </span>
      </div>

      {/* Right: Clear screen */}
      <button
        onClick={onClearScreen}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 border border-white/10 transition-all duration-200 hover:bg-white/15 hover:text-white hover:border-white/20 active:scale-95 sm:h-auto sm:w-auto sm:rounded-full sm:px-4 sm:py-1.5 sm:text-sm"
        title={t('nav.clearScreen')}
      >
        <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <span className="hidden sm:inline">{t('nav.clearScreen')}</span>
      </button>
    </nav>
  )
}
