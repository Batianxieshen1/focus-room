'use client'

import { useRef, useState } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Fetch with progress tracking for URL downloads
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

export default function SoundMixer() {
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
  const [notification, setNotification] = useState<string | null>(null)

  // Buffer loading states
  const [bufferingIds, setBufferingIds] = useState<Set<string>>(new Set())

  // Tab state
  const [activeTab, setActiveTab] = useState<'link' | 'netease'>('netease')

  // NetEase Cloud Music — playlist embed
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null)

  // Preset study music playlists
  const PRESET_PLAYLISTS = [
    { id: '2829883282', name: '学习工作', icon: '📚' },
    { id: '1972031547', name: '专注白噪音', icon: '🌧' },
    { id: '2482252552', name: '轻音乐', icon: '🎵' },
    { id: '3778678', name: '古典钢琴', icon: '🎹' },
  ]

  const extractPlaylistId = (url: string): string | null => {
    // Match playlist ID from various NetEase URL formats
    const match = url.match(/playlist[?&]id=(\d+)/) || url.match(/\/playlist\/(\d+)/)
    return match ? match[1] : null
  }

  const handlePlaylistUrl = () => {
    const id = extractPlaylistId(playlistUrl.trim())
    if (id) {
      setActivePlaylistId(id)
      setPlaylistUrl('')
    }
  }

  // URL add state
  const [urlInput, setUrlInput] = useState('')
  const [urlName, setUrlName] = useState('')
  const [fetchProgress, setFetchProgress] = useState<number | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
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
    <div className="flex flex-col gap-3 relative">
      {/* ===== Section 1: Built-in Sounds ===== */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40 tracking-widest uppercase">{t('sound.title')}</span>
        <button
          onClick={anyPlaying ? muteAll : unmuteAll}
          className="text-[11px] text-white/35 hover:text-white/70 transition-colors duration-200"
        >
          {anyPlaying ? t('sound.muteAll') : t('sound.restore')}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {builtInSounds.map(sound => (
          <div key={sound.id} className="relative group">
            <button
              onClick={() => toggleSound(sound.id)}
              className={`w-full flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 ${
                sound.isPlaying
                  ? 'bg-white/[0.14] shadow-sm'
                  : 'bg-white/[0.04] hover:bg-white/[0.08]'
              }`}
            >
              <span className={`text-lg transition-transform duration-200 ${
                sound.isPlaying ? 'scale-110' : 'group-hover:scale-105'
              }`}>
                {sound.icon}
              </span>
              <span className={`text-[10px] transition-colors duration-200 ${
                sound.isPlaying ? 'text-white/80' : 'text-white/40'
              }`}>
                {sound.name}
              </span>
            </button>
          </div>
        ))}

        {/* Add local sound button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 border border-dashed border-white/10 hover:border-white/20"
        >
          <span className="text-lg text-white/30">+</span>
          <span className="text-[10px] text-white/30">{t('sound.localImport')}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg,audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Volume sliders for playing sounds */}
      {sounds.some(s => s.isPlaying) && (
        <div className="flex flex-col gap-2 pt-0.5">
          {sounds.filter(s => s.isPlaying).map(sound => (
            <div key={sound.id} className="flex items-center gap-2">
              <span className="text-xs w-5 text-center opacity-80">{sound.icon}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sound.volume}
                onChange={e => setVolume(sound.id, Number(e.target.value))}
                className="flex-1 h-[3px]"
                style={{
                  background: `linear-gradient(to right, rgba(251,191,36,0.7) ${sound.volume}%, rgba(255,255,255,0.1) ${sound.volume}%)`,
                  borderRadius: '9999px',
                  outline: 'none',
                  WebkitAppearance: 'none',
                }}
              />
              <span className="text-[10px] text-white/35 w-7 text-right tabular-nums">{sound.volume}</span>
            </div>
          ))}
        </div>
      )}

      {/* ===== Divider ===== */}
      <div className="h-px bg-white/10" />

      {/* ===== Section 2: My Music ===== */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-white/40 tracking-widest uppercase">{t('sound.myMusic')}</span>

        {customSounds.length === 0 ? (
          <div className="text-[10px] text-white/25 text-center py-2">{t('sound.noResults')}</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {customSounds.map(sound => (
              <div
                key={sound.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 group"
              >
                {/* Play/pause */}
                <button
                  onClick={() => {
                    setBufferingIds(prev => {
                      const next = new Set(prev)
                      next.add(sound.id)
                      return next
                    })
                    toggleSound(sound.id)
                    // Simulate brief buffering state
                    setTimeout(() => {
                      setBufferingIds(prev => {
                        const next = new Set(prev)
                        next.delete(sound.id)
                        return next
                      })
                    }, 800)
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-all duration-200 active:scale-95 flex-shrink-0"
                >
                  {bufferingIds.has(sound.id) ? (
                    /* Spinner */
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
                    <svg className="w-3 h-3 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                </button>

                {/* Track name */}
                <span className="text-xs text-white/70 truncate flex-1 min-w-0">
                  {sound.name}
                </span>

                {/* Volume slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sound.volume}
                  onChange={e => setVolume(sound.id, Number(e.target.value))}
                  className="w-16 h-[3px]"
                  style={{
                    background: `linear-gradient(to right, rgba(251,191,36,0.7) ${sound.volume}%, rgba(255,255,255,0.1) ${sound.volume}%)`,
                    borderRadius: '9999px',
                    outline: 'none',
                    WebkitAppearance: 'none',
                  }}
                />

                {/* Delete button */}
                <button
                  onClick={() => removeCustomSound(sound.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all duration-200 flex-shrink-0"
                  title={t('sound.removeCustom')}
                >
                  <svg className="w-3 h-3 text-red-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Divider ===== */}
      <div className="h-px bg-white/10" />

      {/* ===== Section 3: Add Music ===== */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-white/40 tracking-widest uppercase">{t('sound.searchAndAdd')}</span>

        {/* Tab bar */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04]">
          <button
            onClick={() => setActiveTab('netease')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all duration-200 ${
              activeTab === 'netease'
                ? 'bg-white/[0.12] text-white/80'
                : 'text-white/35 hover:text-white/55'
            }`}
          >
            {t('sound.tabNetease')}
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all duration-200 ${
              activeTab === 'link'
                ? 'bg-white/[0.12] text-white/80'
                : 'text-white/35 hover:text-white/55'
            }`}
          >
            {t('sound.tabUrl')}
          </button>
        </div>

        {/* Tab: NetEase Cloud Music */}
        {activeTab === 'netease' && (
          <div className="flex flex-col gap-3">
            {/* Preset playlists */}
            <div className="text-[10px] text-white/30 tracking-wider uppercase">{t('sound.neteaseHint')}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_PLAYLISTS.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => setActivePlaylistId(pl.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95 text-left ${
                    activePlaylistId === pl.id
                      ? 'bg-white/[0.12] text-white/80'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60'
                  }`}
                >
                  <span>{pl.icon}</span>
                  <span className="text-[11px]">{pl.name}</span>
                </button>
              ))}
            </div>

            {/* Custom playlist URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePlaylistUrl()}
                placeholder={t('sound.neteasePasteUrl')}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
              <button
                onClick={handlePlaylistUrl}
                className={`px-3 py-2 rounded-lg text-xs transition-all duration-200 active:scale-[0.98] ${
                  playlistUrl.trim()
                    ? 'bg-white/[0.1] text-white/80 hover:bg-white/[0.15]'
                    : 'bg-white/[0.04] text-white/25'
                }`}
              >
                {t('sound.neteaseSearchBtn')}
              </button>
            </div>

            {/* Embedded player */}
            {activePlaylistId && (
              <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                <iframe
                  src={`https://music.163.com/outchain/player?type=0&id=${activePlaylistId}&auto=0&height=430`}
                  className="w-full"
                  style={{ height: '430px' }}
                  frameBorder="no"
                />
              </div>
            )}

            {!activePlaylistId && (
              <div className="text-center text-white/20 text-[10px] py-6">
                {t('sound.neteaseNoResults')}
              </div>
            )}
          </div>
        )}

        {/* Tab: Link */}
        {activeTab === 'link' && (
          <div className="flex flex-col gap-2">
            <div className="text-[10px] text-white/30 leading-relaxed">
              {t('sound.linkHint')}
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder={t('sound.pasteUrl')}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
            <input
              type="text"
              value={urlName}
              onChange={e => setUrlName(e.target.value)}
              placeholder={t('sound.urlName')}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
            <button
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || fetchProgress !== null}
              className={`w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.98] ${
                fetchProgress !== null
                  ? 'bg-amber-500/20 text-amber-300/70 cursor-wait'
                  : urlInput.trim()
                    ? 'bg-white/[0.1] text-white/80 hover:bg-white/[0.15]'
                    : 'bg-white/[0.04] text-white/25 cursor-not-allowed'
              }`}
            >
              {fetchProgress !== null ? t('sound.fetching') : t('sound.addUrl')}
            </button>

            {/* Fetch progress bar */}
            {fetchProgress !== null && (
              <div className="flex flex-col gap-1">
                <div className="w-full h-[2px] rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-amber-400/70 transition-all duration-300"
                    style={{ width: `${fetchProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/35 text-center tabular-nums">{fetchProgress}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Notification toast ===== */}
      {notification && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white/90 text-xs z-50 transition-opacity duration-300 whitespace-nowrap">
          {notification}
        </div>
      )}

      {/* Inline styles for custom range sliders */}
      <style dangerouslySetInnerHTML={{ __html: `
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%;
          background: rgba(255,255,255,0.75); cursor: pointer;
          box-shadow: 0 0 4px rgba(0,0,0,0.3); transition: transform 0.15s ease;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.3); }
        input[type=range]::-moz-range-thumb {
          width: 10px; height: 10px; border-radius: 50%;
          background: rgba(255,255,255,0.75); cursor: pointer; border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
      `}} />
    </div>
  )
}
