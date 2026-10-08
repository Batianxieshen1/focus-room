'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'
import { storageGet, storageSet } from '@/lib/storage'
import { buildMixShareURL } from '@/lib/mixShare'
import { setBinaural, bindBinauralSleepTimer, BINAURAL_BANDS } from '@/lib/binaural'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const USER_PRESETS_KEY = 'focus-room-mix-presets'

interface UserPreset {
  id: string
  name: string
  volumes: Record<string, number>
}

function loadUserPresets(): UserPreset[] {
  return storageGet<UserPreset[]>(USER_PRESETS_KEY, [])
}

async function fetchWithProgress(
  url: string,
  onProgress: (percent: number) => void
): Promise<Blob> {
  const response = await fetch(url)
  const contentLength = response.headers.get('Content-Length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body!.getReader()
  let received = 0
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total > 0) {
      onProgress(Math.round((received / total) * 100))
    }
  }

  return new Blob(chunks as BlobPart[])
}

interface SoundMixerProps {
  activePlaylistId?: string | null
  onPlaylistChange?: (id: string | null) => void
  playerMode?: 'iframe' | 'native'
  onPlayerModeChange?: (mode: 'iframe' | 'native') => void
  activeTab?: 'ambient' | 'music' | 'presets'
  onTabChange?: (tab: 'ambient' | 'music' | 'presets') => void
}

// 内置混音预设：经挑选的声学比例，点击即切
const MIX_PRESETS: Array<{ id: string; icon: string; nameKey: Parameters<typeof t>[0]; volumes: Record<string, number> }> = [
  { id: 'study-night', icon: '🌧️', nameKey: 'mix.studyNight', volumes: { rain: 40, pageturn: 60, keyboard: 50 } },
  { id: 'street-cafe', icon: '☕', nameKey: 'mix.streetCafe', volumes: { cafe: 50, rain: 30 } },
  { id: 'meadow-breeze', icon: '🏕️', nameKey: 'mix.meadowBreeze', volumes: { wind: 50, fire: 40, night: 30 } },
]

// 24/7 免版权自习电台
const STUDY_RADIOS = [
  {
    id: 'lofi-girl',
    name: 'Lofi Chillhop Beats',
    desc: '经典柔和低保真节拍 · 慢节奏专注',
    icon: '☕',
    streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
  },
  {
    id: 'jazz-cafe',
    name: 'Rainy Jazz Cafe',
    desc: '雨夜都市爵士萨克斯 · 惬意咖啡厅',
    icon: '🎷',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
  },
  {
    id: 'deep-alpha',
    name: 'Deep Focus 432Hz',
    desc: '双耳节律与环境空间声学 · 深度心流',
    icon: '🌌',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
  },
  {
    id: 'vapor-night',
    name: 'Tokyo Nightwave',
    desc: '复古合成器波与夜色律动 · 编程沉浸',
    icon: '🌆',
    streamUrl: 'https://radio.plaza.one/mp3',
  },
]

const SOUND_CATEGORIES: Record<'nature' | 'space' | 'focus', string[]> = {
  nature: ['rain', 'ocean', 'forest', 'fire', 'wind', 'night'],
  space: ['cafe', 'keyboard', 'pageturn', 'clock'],
  focus: ['whitenoise'],
}

export default function SoundMixer({
  activePlaylistId,
  onPlaylistChange,
  playerMode = 'iframe',
  onPlayerModeChange,
  activeTab: controlledTab,
  onTabChange,
}: SoundMixerProps) {
  const {
    sounds,
    toggleSound,
    setVolume,
    applyMix,
    muteAll,
    unmuteAll,
    addCustomSound,
    removeCustomSound,
  } = useAudioContext()
  const anyPlaying = sounds.some(s => s.isPlaying)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Top-level drawer tabs: ambient | music | presets
  const [internalTab, setInternalTab] = useState<'ambient' | 'music' | 'presets'>('ambient')
  const currentTab = controlledTab ?? internalTab

  const switchTab = (tab: 'ambient' | 'music' | 'presets') => {
    setInternalTab(tab)
    onTabChange?.(tab)
  }

  // Sub-tab in music: radio | netease | link
  const [musicSubTab, setMusicSubTab] = useState<'radio' | 'netease' | 'link'>('radio')

  // ===== 音效收藏与分类 =====
  const [soundFavs, setSoundFavs] = useState<string[]>(() => storageGet<string[]>('focus-room-sound-favs', []))
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [soundCategory, setSoundCategory] = useState<'all' | 'nature' | 'space' | 'focus'>('all')

  const toggleFav = (id: string) => {
    setSoundFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      storageSet('focus-room-sound-favs', next)
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

  // 24/7 自习电台播放状态
  const [activeRadioId, setActiveRadioId] = useState<string | null>(null)
  const [radioPlaying, setRadioPlaying] = useState(false)
  const [radioVolume, setRadioVolume] = useState<number>(() => storageGet<number>('focus-room-radio-volume', 75))
  const [masterVolume, setMasterVolume] = useState<number>(() => storageGet<number>('focus-room-ambient-master', 100))
  const [isMasterMuted, setIsMasterMuted] = useState(false)
  const radioAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleStopRadio = useCallback(() => {
    if (radioAudioRef.current) {
      radioAudioRef.current.pause()
      radioAudioRef.current.src = ''
    }
    setActiveRadioId(null)
    setRadioPlaying(false)
  }, [])

  // 监听全局 Master 音量、静音与睡眠定时到点事件
  useEffect(() => {
    const handleMaster = (e: Event) => {
      const detail = (e as CustomEvent<{ volume?: number; isMuted?: boolean }>).detail
      if (!detail) return
      if (typeof detail.volume === 'number') setMasterVolume(detail.volume)
      if (typeof detail.isMuted === 'boolean') setIsMasterMuted(detail.isMuted)
    }
    const handleSleepExpired = () => {
      handleStopRadio()
    }
    window.addEventListener('focusroom:master', handleMaster)
    window.addEventListener('focusroom:sleep-expired', handleSleepExpired)
    return () => {
      window.removeEventListener('focusroom:master', handleMaster)
      window.removeEventListener('focusroom:sleep-expired', handleSleepExpired)
    }
  }, [handleStopRadio])

  // 电台音量随电台分轨音量、Master 总音量与全局静音动态联动
  useEffect(() => {
    if (radioAudioRef.current) {
      const effectiveVol = isMasterMuted ? 0 : (radioVolume / 100) * (masterVolume / 100)
      radioAudioRef.current.volume = Math.min(1, Math.max(0, effectiveVol))
    }
    storageSet('focus-room-radio-volume', radioVolume)
  }, [radioVolume, masterVolume, isMasterMuted])

  // 当外部网易云歌单激活时，自动停止自习电台，避免声音打架
  useEffect(() => {
    if (activePlaylistId && (radioPlaying || radioAudioRef.current)) {
      handleStopRadio()
    }
  }, [activePlaylistId, radioPlaying, handleStopRadio])

  // 清理电台实例
  useEffect(() => {
    return () => {
      const a = radioAudioRef.current
      if (a) {
        a.pause()
        a.removeAttribute('src')
      }
    }
  }, [])

  const handleToggleRadio = (station: typeof STUDY_RADIOS[number]) => {
    if (activeRadioId === station.id) {
      if (radioPlaying) {
        radioAudioRef.current?.pause()
        setRadioPlaying(false)
      } else {
        radioAudioRef.current?.play().then(() => setRadioPlaying(true)).catch(() => {})
      }
    } else {
      if (radioAudioRef.current) {
        radioAudioRef.current.pause()
      } else {
        radioAudioRef.current = new Audio()
      }
      radioAudioRef.current.src = station.streamUrl
      const effectiveVol = isMasterMuted ? 0 : (radioVolume / 100) * (masterVolume / 100)
      radioAudioRef.current.volume = Math.min(1, Math.max(0, effectiveVol))
      radioAudioRef.current.play()
        .then(() => {
          setActiveRadioId(station.id)
          setRadioPlaying(true)
          if (activePlaylistId) {
            onPlaylistChange?.(null)
          }
        })
        .catch(() => {
          setNotification(t('sound.fetchError'))
          setTimeout(() => setNotification(null), 2500)
        })
    }
  }

  // Buffer loading states
  const [bufferingIds, setBufferingIds] = useState<Set<string>>(new Set())

  // NetEase Cloud Music URL/ID
  const [playlistUrl, setPlaylistUrl] = useState('')

  // Preset playlists — verified real content
  const PRESET_PLAYLISTS = [
    { id: '459034281', name: 'Deep Focus Study', icon: '🧠', desc: '358首深度专注音乐' },
    { id: '7722421306', name: 'Ambient Lofi', icon: '🎧', desc: '134首氛围低保真' },
    { id: '2556149301', name: '学习专注纯音', icon: '📚', desc: '90首学习专注音乐' },
    { id: '2109356424', name: 'Rain & Nature', icon: '🌧', desc: '49首雨声与自然音' },
    { id: '2829883282', name: '星巴克咖啡厅', icon: '☕', desc: '轻爵士与慢调民谣' },
    { id: '2646741761', name: '治愈系钢琴曲', icon: '🎹', desc: '纯净钢琴沉浸自习' },
  ]

  const extractPlaylistId = (url: string): string | null => {
    const numOnly = url.trim().match(/^(\d{5,})$/)
    if (numOnly) return numOnly[1]
    const match = url.match(/playlist[?&]id=(\d+)/) || url.match(/\/playlist\/(\d+)/)
    return match ? match[1] : null
  }

  const handlePlaylistUrl = () => {
    const id = extractPlaylistId(playlistUrl.trim())
    if (id) {
      handleStopRadio()
      onPlaylistChange?.(id)
      setPlaylistUrl('')
    }
  }


  // URL stream add state
  const [urlInput, setUrlInput] = useState('')
  const [urlName, setUrlName] = useState('')
  const [fetchProgress, setFetchProgress] = useState<number | null>(null)

  // ===== 混音预设 =====
  const [userPresets, setUserPresets] = useState<UserPreset[]>(() => loadUserPresets())
  const [presetName, setPresetName] = useState('')
  const [showPresetSave, setShowPresetSave] = useState(false)

  const currentVolumes = useCallback((): Record<string, number> => {
    const v: Record<string, number> = {}
    sounds.filter(s => s.isPlaying && s.volume > 0).forEach(s => { v[s.id] = s.volume })
    return v
  }, [sounds])

  const showNotification = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }, [])

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
    storageSet(USER_PRESETS_KEY, next)
    setUserPresets(next)
    setPresetName('')
    setShowPresetSave(false)
    showNotification(t('mix.saved'))
  }, [currentVolumes, presetName, showNotification, setPresetName, setShowPresetSave])

  const handleDeletePreset = (id: string) => {
    const next = loadUserPresets().filter(p => p.id !== id)
    storageSet(USER_PRESETS_KEY, next)
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

  // ---- Add from URL ----
  const handleAddUrl = async () => {
    const url = urlInput.trim()
    if (!url) return

    setFetchProgress(0)
    try {
      const blob = await fetchWithProgress(url, pct => setFetchProgress(pct))
      const name = urlName.trim() || url.split('/').pop()?.split('?')[0] || 'Untitled'

      const success = await addCustomSound(name, new File([blob], `${name}.mp3`, { type: blob.type || 'audio/mpeg' }))
      if (success) {
        showNotification(t('sound.fetchDone'))
        setUrlInput('')
        setUrlName('')
      } else {
        showNotification(t('sound.maxSizeError'))
      }
    } catch {
      showNotification(t('sound.fetchError'))
    }
    setFetchProgress(null)
  }

  // Separate built-in and custom sounds
  const builtInSounds = sounds.filter(s => !s.isCustom)
  const customSounds = sounds.filter(s => s.isCustom)

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

      {/* ===== TAB 1: 白噪音 (Ambient) ===== */}
      {currentTab === 'ambient' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Header Action */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 tracking-widest uppercase font-medium">{t('sound.title')}</span>
            <div className="flex items-center gap-3">
              <button
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
      )}

      {/* ===== TAB 2: 自习电台 (Music) ===== */}
      <div className={`flex flex-col gap-4 animate-fade-in ${currentTab === 'music' ? 'block' : 'hidden'}`}>
        {/* Playback Mode Switcher */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('player.modeLabel')}</span>
          <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => onPlayerModeChange?.('iframe')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                playerMode === 'iframe'
                  ? 'bg-white/[0.14] text-white shadow-sm font-medium'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t('player.modeOfficial')}
            </button>
            <button
              onClick={() => onPlayerModeChange?.('native')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                playerMode === 'native'
                  ? 'bg-white/[0.14] text-white shadow-sm font-medium'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t('player.modeBuiltIn')}
            </button>
          </div>
        </div>

        {/* Active Playlist Status Banner */}
        {activePlaylistId && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-300 font-medium">{t('player.playlistActive')}</span>
            </div>
            <button
              onClick={() => onPlaylistChange?.(null)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.1] text-white/80 text-[11px] hover:bg-white/[0.18] transition-all active:scale-95"
            >
              {t('player.backToAmbient')}
            </button>
          </div>
        )}

        {/* Sub-tabs: Radio Stations vs NetEase vs Web Stream Link */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04]">
          <button
            onClick={() => setMusicSubTab('radio')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all ${
              musicSubTab === 'radio'
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            📻 {t('sound.radioTitle').slice(5)}
          </button>
          <button
            onClick={() => setMusicSubTab('netease')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all ${
              musicSubTab === 'netease'
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            🎵 {t('sound.tabNetease')}
          </button>
          <button
            onClick={() => setMusicSubTab('link')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all ${
              musicSubTab === 'link'
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            🔗 {t('sound.tabUrl')}
          </button>
        </div>

        {/* 24/7 免版权自习电台 */}
        {musicSubTab === 'radio' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('sound.radioTitle')}</span>
              <span className="text-[10px] text-white/35 leading-tight">{t('sound.radioDesc')}</span>
            </div>

            <div className="flex flex-col gap-2">
              {STUDY_RADIOS.map(station => {
                const isCurrent = activeRadioId === station.id
                return (
                  <div
                    key={station.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      isCurrent && radioPlaying
                        ? 'bg-white/[0.12] border-emerald-400/40 shadow-sm'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.05]'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleRadio(station)}
                      className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.16] flex items-center justify-center text-white/80 active:scale-95 transition-all flex-shrink-0"
                    >
                      {isCurrent && radioPlaying ? (
                        <svg className="w-3.5 h-3.5 text-emerald-300" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-white/80 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{station.icon}</span>
                        <span className="text-xs font-medium text-white/90 truncate">{station.name}</span>
                        {isCurrent && radioPlaying && (
                          <div className="flex items-end gap-[2px] h-3 ml-1">
                            <div className="w-[2px] bg-emerald-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                            <div className="w-[2px] bg-emerald-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.15s' }} />
                            <div className="w-[2px] bg-emerald-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{station.desc}</p>
                    </div>

                    {isCurrent && (
                      <button
                        onClick={handleStopRadio}
                        className="text-[11px] text-white/35 hover:text-white/70 px-2 py-1 rounded transition-colors"
                      >
                        停止
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active radio volume control */}
            {activeRadioId && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mt-1">
                <span className="text-xs text-white/50">📻</span>
                <span className="text-[11px] text-white/70 w-16 truncate">电台音量</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={radioVolume}
                  onChange={e => setRadioVolume(Number(e.target.value))}
                  className="flex-1 h-[3px]"
                  style={{
                    background: `linear-gradient(to right, rgba(52,211,153,0.8) ${radioVolume}%, rgba(255,255,255,0.1) ${radioVolume}%)`,
                    borderRadius: '9999px',
                    outline: 'none',
                  }}
                />
                <span className="text-[11px] text-white/40 w-7 text-right tabular-nums">{radioVolume}%</span>
              </div>
            )}
          </div>
        )}

        {musicSubTab === 'netease' && (
          <div className="flex flex-col gap-3">
            {/* VIP Notice Banner */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-200/85 text-[11px] leading-relaxed">
              <span className="text-sm leading-none mt-0.5">💡</span>
              <span>{t('sound.neteaseVipNotice')}</span>
            </div>

            {/* Curated Presets */}
            <div className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('sound.neteaseHint')}</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PLAYLISTS.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    handleStopRadio()
                    onPlaylistChange?.(pl.id)
                  }}
                  className={`flex flex-col items-start p-3 rounded-xl text-left transition-all duration-200 active:scale-[0.98] border ${
                    activePlaylistId === pl.id
                      ? 'bg-white/[0.14] border-emerald-400/40 shadow-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{pl.icon}</span>
                    <span className="text-xs font-medium text-white/90 truncate">{pl.name}</span>
                  </div>
                  <span className="text-[10px] text-white/40 leading-tight truncate w-full">{pl.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom NetEase Playlist Input */}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePlaylistUrl()}
                placeholder={t('sound.neteasePasteUrl')}
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/25"
              />
              <button
                onClick={handlePlaylistUrl}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                  playlistUrl.trim()
                    ? 'bg-white/[0.14] text-white hover:bg-white/[0.2]'
                    : 'bg-white/[0.04] text-white/30'
                }`}
              >
                {t('sound.neteaseSearchBtn')}
              </button>
            </div>
          </div>
        )}


        {musicSubTab === 'link' && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[10px] text-white/35 leading-relaxed">
              {t('sound.linkHint')}
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder={t('sound.pasteUrl')}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/25"
            />
            <input
              type="text"
              value={urlName}
              onChange={e => setUrlName(e.target.value)}
              placeholder={t('sound.urlName')}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/25"
            />
            <button
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || fetchProgress !== null}
              className={`w-full py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] ${
                fetchProgress !== null
                  ? 'bg-amber-500/20 text-amber-300/80 cursor-wait'
                  : urlInput.trim()
                    ? 'bg-white/[0.14] text-white hover:bg-white/[0.2]'
                    : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
              }`}
            >
              {fetchProgress !== null ? t('sound.fetching') : t('sound.addUrl')}
            </button>

            {fetchProgress !== null && (
              <div className="flex flex-col gap-1">
                <div className="w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${fetchProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/40 text-center tabular-nums">{fetchProgress}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== TAB 3: 混音配方 (Presets) ===== */}
      {currentTab === 'presets' && (
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
      )}

      {/* ===== NetEase Official Iframe Element (Persistent in DOM, never unmounted) ===== */}
      {activePlaylistId && playerMode === 'iframe' && (
        <div
          className={`transition-all duration-200 ${
            currentTab === 'music'
              ? 'block rounded-xl overflow-hidden border border-white/[0.1] shadow-2xl mt-2'
              : 'fixed -left-[9999px] top-0 opacity-0 pointer-events-none w-[1px] h-[1px]'
          }`}
          aria-hidden={currentTab !== 'music'}
        >
          <iframe
            src={`https://music.163.com/outchain/player?type=0&id=${activePlaylistId}&auto=0&height=430`}
            className="w-full bg-black"
            style={{ height: '390px' }}
            frameBorder="no"
            title="NetEase Cloud Music"
          />
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs z-50 transition-opacity duration-300 shadow-lg whitespace-nowrap">
          {notification}
        </div>
      )}
    </div>
  )
}
