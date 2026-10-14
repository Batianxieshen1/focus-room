'use client'

import { useState, useCallback } from 'react'
import { t } from '@/lib/i18n'
import AmbientSection from './sound-sections/AmbientSection'
import MusicSection from './sound-sections/MusicSection'
import PresetsSection from './sound-sections/PresetsSection'

interface SoundMixerProps {
  activePlaylistId?: string | null
  onPlaylistChange?: (id: string | null) => void
  playerMode?: 'iframe' | 'native'
  onPlayerModeChange?: (mode: 'iframe' | 'native') => void
  activeTab?: 'ambient' | 'music' | 'presets'
  onTabChange?: (tab: 'ambient' | 'music' | 'presets') => void
}

export default function SoundMixer({
  activePlaylistId,
  onPlaylistChange,
  playerMode = 'iframe',
  onPlayerModeChange,
  activeTab: controlledTab,
  onTabChange,
}: SoundMixerProps) {
  const [notification, setNotification] = useState<string | null>(null)

  const showNotification = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }, [])

  // Top-level drawer tabs: ambient | music | presets
  const [internalTab, setInternalTab] = useState<'ambient' | 'music' | 'presets'>('ambient')
  const currentTab = controlledTab ?? internalTab

  const switchTab = (tab: 'ambient' | 'music' | 'presets') => {
    setInternalTab(tab)
    onTabChange?.(tab)
  }

  return (
    <div className="flex flex-col gap-4 relative">
      {/* ===== Top-Level Segmented Tabs ===== */}
      <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
        <button
          onClick={() => switchTab('ambient')}
          className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
            currentTab === 'ambient'
              ? 'bg-white/[0.14] text-white shadow-sm'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          <span>🌿</span>
          <span>{t('sound.tabs.ambient')}</span>
        </button>
        <button
          onClick={() => switchTab('music')}
          className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
            currentTab === 'music'
              ? 'bg-white/[0.14] text-white shadow-sm'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          <span>🎵</span>
          <span>{t('sound.tabs.music')}</span>
          {activePlaylistId && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>
        <button
          onClick={() => switchTab('presets')}
          className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
            currentTab === 'presets'
              ? 'bg-white/[0.14] text-white shadow-sm'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          <span>✨</span>
          <span>{t('sound.tabs.presets')}</span>
        </button>
      </div>

      
      {/* 三个分区常驻挂载（hidden 切换），保证双耳节拍/电台在切 Tab 时不被打断 */}
      <AmbientSection active={currentTab === 'ambient'} showNotification={showNotification} />
      <MusicSection
        active={currentTab === 'music'}
        showNotification={showNotification}
        activePlaylistId={activePlaylistId}
        onPlaylistChange={onPlaylistChange}
        playerMode={playerMode}
        onPlayerModeChange={onPlayerModeChange}
      />
      <PresetsSection active={currentTab === 'presets'} showNotification={showNotification} />

      {notification && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs z-50 transition-opacity duration-300 shadow-lg whitespace-nowrap">
          {notification}
        </div>
      )}
    </div>
  )
}
