'use client'

import { useRef, useState, useEffect } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'
import { storageGet, storageSet } from '@/lib/storage'
import { KEYS } from '@/lib/storageKeys'
import { setBinaural, bindBinauralSleepTimer, BINAURAL_BANDS } from '@/lib/binaural'
import { ALLOWED_TYPES, MAX_FILE_SIZE } from './shared'

// 白噪音分类（与收藏过滤正交组合）
const SOUND_CATEGORIES: Record<'nature' | 'space' | 'focus', string[]> = {
  nature: ['rain', 'ocean', 'forest', 'fire', 'wind', 'night'],
  space: ['cafe', 'keyboard', 'pageturn', 'clock'],
  focus: ['whitenoise'],
}

interface Props {
  active: boolean
  showNotification: (msg: string) => void
}

export default function AmbientSection({ active, showNotification }: Props) {
  const {
    sounds,
    toggleSound,
    setVolume,
    muteAll,
    unmuteAll,
    addCustomSound,
    removeCustomSound,
  } = useAudioContext()
  const anyPlaying = sounds.some(s => s.isPlaying)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ===== 音效收藏与分类 =====
  const [soundFavs, setSoundFavs] = useState<string[]>(() => storageGet<string[]>(KEYS.soundFavs, []))
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [soundCategory, setSoundCategory] = useState<'all' | 'nature' | 'space' | 'focus'>('all')

  const toggleFav = (id: string) => {
    setSoundFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      storageSet(KEYS.soundFavs, next)
      return next
    })
  }

  // ===== 双耳节拍 =====
  const [binauralOn, setBinauralOn] = useState(false)
  const [binauralBand, setBinauralBand] = useState<'delta' | 'theta' | 'alpha' | 'beta'>('alpha')
  const [binauralVolume, setBinauralVolume] = useState(30)

  useEffect(() => {
    bindBinauralSleepTimer()
    return () => setBinaural({ on: false })
  }, [])

  const handleBinauralToggle = () => {
    const next = !binauralOn
    setBinauralOn(next)
    setBinaural({ on: next, band: binauralBand, volume: binauralVolume / 100 })
  }

  const handleBinauralBand = (band: 'delta' | 'theta' | 'alpha' | 'beta') => {
    setBinauralBand(band)
    setBinaural({ band })
  }

  const handleBinauralVolume = (v: number) => {
    setBinauralVolume(v)
    setBinaural({ volume: v / 100 })
  }

  // Buffer loading states
  const [bufferingIds, setBufferingIds] = useState<Set<string>>(new Set())

  // ---- File upload handler ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      showNotification(t('sound.importError'))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      showNotification(t('sound.importSizeError'))
      return
    }

    const name = file.name.replace(/\.[^.]+$/, '').slice(0, 12)
    const success = await addCustomSound(name, file)
    if (success) {
      showNotification(t('sound.importSuccess'))
    } else {
      showNotification(t('sound.maxSizeError'))
    }
  }

  // Separate built-in and custom sounds
  const builtInSounds = sounds.filter(s => !s.isCustom)
  const customSounds = sounds.filter(s => s.isCustom)

  return (
    <div className={active ? '' : 'hidden'}>
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Header Action */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 tracking-widest uppercase font-medium">{t('sound.title')}</span>
            <div className="flex items-center gap-3">
              <button
                aria-pressed={showFavsOnly}
                onClick={() => setShowFavsOnly(v => !v)}
                className={`text-xs transition-colors duration-200 active:scale-95 flex items-center gap-1 ${
                  showFavsOnly ? 'text-amber-300' : 'text-white/50 hover:text-white'
                }`}
              >
                <span>{showFavsOnly ? '★' : '☆'}</span>
                <span>{t('sound.favOnly')}</span>
              </button>
              <button
                onClick={anyPlaying ? muteAll : unmuteAll}
                className="text-xs text-white/50 hover:text-white transition-colors duration-200 active:scale-95"
              >
                {anyPlaying ? t('sound.muteAll') : t('sound.restore')}
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            {[
              { id: 'all', labelKey: 'sound.catAll' as const, icon: '✨' },
              { id: 'nature', labelKey: 'sound.catNature' as const, icon: '🌿' },
              { id: 'space', labelKey: 'sound.catSpace' as const, icon: '🏙' },
              { id: 'focus', labelKey: 'sound.catFocus' as const, icon: '🧠' },
            ].map(cat => (
              <button
                key={cat.id}
                aria-pressed={soundCategory === cat.id}
                onClick={() => setSoundCategory(cat.id as typeof soundCategory)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] whitespace-nowrap transition-all duration-150 flex items-center justify-center gap-1 ${
                  soundCategory === cat.id
                    ? 'bg-white/[0.14] text-white font-medium shadow-xs border border-white/10'
                    : 'text-white/45 hover:text-white/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{t(cat.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Built-in sound tiles grid */}
          <div className="grid grid-cols-4 gap-2">
            {builtInSounds
              .filter(s => !showFavsOnly || soundFavs.includes(s.id))
              .filter(s => {
                if (soundCategory === 'all') return true
                return SOUND_CATEGORIES[soundCategory].includes(s.id)
              })
              .map(sound => (
              <button
                key={sound.id}
                onClick={() => toggleSound(sound.id)}
                aria-pressed={sound.isPlaying}
                aria-label={sound.name}
                className={`relative flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 active:scale-95 border ${
                  sound.isPlaying
                    ? 'bg-white/[0.15] border-amber-400/40 shadow-sm text-white'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.04] text-white/50'
                }`}
              >
                {/* 收藏星标 */}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={(soundFavs.includes(sound.id) ? t('sound.unfav') : t('sound.fav')) + ' · ' + sound.name}
                  title={soundFavs.includes(sound.id) ? t('sound.unfav') : t('sound.fav')}
                  onClick={(e) => { e.stopPropagation(); toggleFav(sound.id) }}
                  className={`absolute top-1 right-1.5 text-[11px] leading-none cursor-pointer transition-all duration-150 hover:scale-125 ${
                    soundFavs.includes(sound.id) ? 'text-amber-300 opacity-100' : 'text-white/25 opacity-0 group-hover:opacity-100 hover:text-amber-200'
                  }`}
                >
                  {soundFavs.includes(sound.id) ? '★' : '☆'}
                </span>
                <div className="flex items-center gap-1">
                  <span className={`text-xl transition-transform duration-200 ${
                    sound.isPlaying ? 'scale-110' : ''
                  }`}>
                    {sound.icon}
                  </span>
                  {sound.isPlaying && (
                    <div className="flex items-end gap-[2px] h-3">
                      <div className="w-[2px] bg-amber-300 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                      <div className="w-[2px] bg-amber-300 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.15s' }} />
                      <div className="w-[2px] bg-amber-300 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>
                <span className={`text-[11px] leading-tight transition-colors duration-200 ${
                  sound.isPlaying ? 'text-white/90 font-medium' : 'text-white/40'
                }`}>
                  {sound.name}
                </span>
              </button>
            ))}

            {/* Local file import button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200 border border-dashed border-white/15 hover:border-white/30 text-white/40 hover:text-white/70 active:scale-95"
            >
              <span className="text-xl leading-none">+</span>
              <span className="text-[10px] leading-tight">{t('sound.localImport')}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Volume sliders for playing ambient sounds */}
          {sounds.some(s => s.isPlaying) && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('sound.mixAdjust')}</span>
              {sounds.filter(s => s.isPlaying).map(sound => (
                <div key={sound.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-sm w-5 text-center">{sound.icon}</span>
                  <span className="text-xs text-white/80 w-16 truncate">{sound.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sound.volume}
                    onChange={e => setVolume(sound.id, Number(e.target.value))}
                    className="flex-1 h-[4px]"
                    style={{
                      background: `linear-gradient(to right, rgba(251,191,36,0.8) ${sound.volume}%, rgba(255,255,255,0.1) ${sound.volume}%)`,
                      borderRadius: '9999px',
                      outline: 'none',
                    }}
                  />
                  <span className="text-[11px] text-white/40 w-7 text-right tabular-nums">{sound.volume}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Custom sounds uploaded by user */}
          {customSounds.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('sound.myMusic')}</span>
              <div className="flex flex-col gap-1.5">
                {customSounds.map(sound => (
                  <div
                    key={sound.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all group"
                  >
                    <button
                      onClick={() => {
                        setBufferingIds(prev => new Set(prev).add(sound.id))
                        toggleSound(sound.id)
                        setTimeout(() => {
                          setBufferingIds(prev => {
                            const next = new Set(prev)
                            next.delete(sound.id)
                            return next
                          })
                        }, 600)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] transition-all active:scale-95 flex-shrink-0"
                    >
                      {bufferingIds.has(sound.id) ? (
                        <svg className="w-3 h-3 text-white/60 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : sound.isPlaying ? (
                        <svg className="w-3 h-3 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </button>

                    <span className="text-xs text-white/80 truncate flex-1 min-w-0">{sound.name}</span>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sound.volume}
                      onChange={e => setVolume(sound.id, Number(e.target.value))}
                      className="w-16 h-[3px]"
                      style={{
                        background: `linear-gradient(to right, rgba(251,191,36,0.8) ${sound.volume}%, rgba(255,255,255,0.1) ${sound.volume}%)`,
                        borderRadius: '9999px',
                        outline: 'none',
                      }}
                    />

                    <button
                      onClick={() => removeCustomSound(sound.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
                      title={t('sound.removeCustom')}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 双耳节拍发生器 ===== */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('binaural.title')}</span>
              <button
                onClick={handleBinauralToggle}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${
                  binauralOn ? 'bg-amber-400/40' : 'bg-white/[0.08]'
                }`}
                aria-label={t('binaural.title')}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                  style={{ left: binauralOn ? '22px' : '2px', backgroundColor: binauralOn ? 'rgba(251,191,36,0.95)' : 'rgba(255,255,255,0.4)' }}
                />
              </button>
            </div>

            {binauralOn && (
              <div className="flex flex-col gap-2 animate-fade-in">
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(BINAURAL_BANDS) as Array<'delta' | 'theta' | 'alpha' | 'beta'>).map(band => (
                    <button
                      key={band}
                      onClick={() => handleBinauralBand(band)}
                      className={`py-1.5 rounded-lg text-[11px] transition-all duration-200 active:scale-95 border ${
                        binauralBand === band
                          ? 'bg-amber-400/20 border-amber-400/40 text-amber-200'
                          : 'bg-white/[0.04] border-white/[0.05] text-white/50 hover:text-white/80'
                      }`}
                    >
                      {t(`binaural.${band}` as Parameters<typeof t>[0])}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-sm w-5 text-center">🎧</span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={binauralVolume}
                    onChange={e => handleBinauralVolume(Number(e.target.value))}
                    className="flex-1 h-[4px]"
                    style={{
                      background: `linear-gradient(to right, rgba(251,191,36,0.8) ${binauralVolume * 2}%, rgba(255,255,255,0.1) ${binauralVolume * 2}%)`,
                      borderRadius: '9999px',
                      outline: 'none',
                    }}
                  />
                  <span className="text-[11px] text-white/40 w-7 text-right tabular-nums">{binauralVolume}%</span>
                </div>
                <p className="text-[10px] text-white/25 text-center">{t('binaural.hint')}</p>
              </div>
            )}
          </div>
        </div>

    </div>
  )
}
