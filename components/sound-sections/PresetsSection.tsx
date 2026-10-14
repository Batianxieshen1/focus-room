'use client'

import { useState, useCallback } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'
import { storageSet } from '@/lib/storage'
import { KEYS } from '@/lib/storageKeys'
import { buildMixShareURL } from '@/lib/mixShare'
import { UserPreset, loadUserPresets } from './shared'

// 内置混音预设：经挑选的声学比例，点击即切
const MIX_PRESETS: Array<{ id: string; icon: string; nameKey: Parameters<typeof t>[0]; volumes: Record<string, number> }> = [
  { id: 'study-night', icon: '🌧️', nameKey: 'mix.studyNight', volumes: { rain: 40, pageturn: 60, keyboard: 50 } },
  { id: 'street-cafe', icon: '☕', nameKey: 'mix.streetCafe', volumes: { cafe: 50, rain: 30 } },
  { id: 'meadow-breeze', icon: '🏕️', nameKey: 'mix.meadowBreeze', volumes: { wind: 50, fire: 40, night: 30 } },
]

interface Props {
  active: boolean
  showNotification: (msg: string) => void
}

export default function PresetsSection({ active, showNotification }: Props) {
  const { sounds, applyMix } = useAudioContext()

  const [userPresets, setUserPresets] = useState<UserPreset[]>(() => loadUserPresets())
  const [presetName, setPresetName] = useState('')
  const [showPresetSave, setShowPresetSave] = useState(false)

  const currentVolumes = useCallback((): Record<string, number> => {
    const v: Record<string, number> = {}
    sounds.filter(s => s.isPlaying && s.volume > 0).forEach(s => { v[s.id] = s.volume })
    return v
  }, [sounds])

  const handleSavePreset = useCallback(() => {
    const volumes = currentVolumes()
    if (Object.keys(volumes).length === 0) {
      showNotification(t('mix.emptyMix'))
      return
    }
    const preset: UserPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim() || t('mix.defaultName'),
      volumes,
    }
    const next = [...loadUserPresets(), preset]
    storageSet(KEYS.mixPresets, next)
    setUserPresets(next)
    setPresetName('')
    setShowPresetSave(false)
    showNotification(t('mix.saved'))
  }, [currentVolumes, presetName, showNotification])

  const handleDeletePreset = (id: string) => {
    const next = loadUserPresets().filter(p => p.id !== id)
    storageSet(KEYS.mixPresets, next)
    setUserPresets(next)
  }

  const handleShareMix = () => {
    const volumes = currentVolumes()
    if (Object.keys(volumes).length === 0) {
      showNotification(t('mix.emptyMix'))
      return
    }
    const url = buildMixShareURL(volumes)
    navigator.clipboard?.writeText(url).then(
      () => showNotification(t('mix.shareCopied')),
      () => showNotification(t('mix.shareFailed'))
    )
  }

  const applyPresetVolumes = (volumes: Record<string, number>) => {
    applyMix(volumes)
    showNotification(t('mix.applied'))
  }

  return (
    <div className={active ? '' : 'hidden'}>
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Header Action */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 tracking-widest uppercase font-medium">{t('mix.title')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareMix}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                {t('mix.share')}
              </button>
              <button
                onClick={() => setShowPresetSave(v => !v)}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                {t('mix.saveMine')}
              </button>
            </div>
          </div>

          {/* Save Recipe Input Form */}
          {showPresetSave && (
            <div className="flex gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] animate-fade-in">
              <input
                type="text"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                placeholder={t('mix.namePlaceholder')}
                maxLength={16}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
              <button
                onClick={handleSavePreset}
                className="px-3 py-1.5 rounded-lg bg-white/[0.14] text-white text-xs font-medium hover:bg-white/[0.22] transition-all active:scale-95"
              >
                {t('mix.saveBtn')}
              </button>
            </div>
          )}

          {/* Curated Mixes */}
          <div className="grid grid-cols-2 gap-2">
            {MIX_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => applyPresetVolumes(p.volumes)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all duration-200 active:scale-[0.98] text-left"
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-xs text-white/80 font-medium leading-tight">{t(p.nameKey)}</span>
              </button>
            ))}

            {/* User Custom Saved Mixes */}
            {userPresets.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all duration-200 group"
              >
                <button
                  onClick={() => applyPresetVolumes(p.volumes)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <span className="text-base">💾</span>
                  <span className="text-xs text-white/80 font-medium truncate">{p.name}</span>
                </button>
                <button
                  onClick={() => handleDeletePreset(p.id)}
                  className="w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all text-xs"
                  title={t('mix.delete')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
    </div>
  )
}
