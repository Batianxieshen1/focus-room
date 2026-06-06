'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface SearchResult {
  name: string
  artist: string
  previewUrl: string
  artwork: string
  duration: number
}

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
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

  // Section 2: My Music - buffer loading states
  const [bufferingIds, setBufferingIds] = useState<Set<string>>(new Set())

  // Section 3: Search & Add - tab state
  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search')

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // URL tab state
  const [urlInput, setUrlInput] = useState('')
  const [urlName, setUrlName] = useState('')
  const [fetchProgress, setFetchProgress] = useState<number | null>(null)

  // Preview playback state
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [previewProgress, setPreviewProgress] = useState(0)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }

  // Stop preview on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current)
      }
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current)
      }
    }
  }, [])

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

  // ---- Search ----
  const searchMusic = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=10`
      )
      const data = await res.json()
      setSearchResults(
        data.results.map((r: any) => ({
          name: r.trackName,
          artist: r.artistName,
          previewUrl: r.previewUrl,
          artwork: r.artworkUrl100 || r.artworkUrl60,
          duration: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : 0,
        }))
      )
    } catch {
      // silently handle
    }
    setSearching(false)
  }

  // ---- Preview (30s from iTunes) ----
  const previewBlobUrlRef = useRef<string | null>(null)

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
      previewAudioRef.current = null
    }
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = null
    }
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current)
      previewTimerRef.current = null
    }
    setPreviewingId(null)
    setPreviewProgress(0)
  }, [])

  const startPreview = useCallback(
    async (result: SearchResult, idx: number) => {
      const id = `preview-${idx}`
      // If same track is playing, stop it
      if (previewingId === id) {
        stopPreview()
        return
      }

      stopPreview()
      setPreviewingId(id)
      setPreviewProgress(0)

      try {
        // Fetch as blob first — iTunes URLs can't be played directly
        const res = await fetch(result.previewUrl)
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        previewBlobUrlRef.current = blobUrl

        const audio = new Audio(blobUrl)
        audio.preload = 'auto'
        previewAudioRef.current = audio

        // Must call load() then wait for canplay before play()
        await new Promise<void>((resolve, reject) => {
          audio.oncanplay = () => resolve()
          audio.onerror = () => reject(new Error(audio.error?.message || 'load failed'))
          audio.load()
        })

        audio.play().then(() => {
          console.log('Preview started OK')
        }).catch(err => {
          console.error('Preview play failed:', err.message)
          stopPreview()
        })

        const startTime = Date.now()
        const duration = Math.min(30, result.duration || 30)

        previewTimerRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000
          const pct = Math.min(100, (elapsed / duration) * 100)
          setPreviewProgress(pct)
          if (elapsed >= duration) {
            stopPreview()
          }
        }, 200)
      } catch (err) {
        console.error('Preview fetch failed:', err)
        stopPreview()
      }
    },
    [previewingId, stopPreview]
  )

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

  // ---- Add full from search (fetches preview as blob) ----
  const handleAddFull = async (result: SearchResult) => {
    try {
      console.log('Fetching:', result.previewUrl)
      const res = await fetch(result.previewUrl)
      console.log('Response status:', res.status, 'Content-Type:', res.headers.get('content-type'))
      const blob = await res.blob()
      console.log('Blob size:', blob.size, 'type:', blob.type)
      const file = new File([blob], `${result.name}.mp3`, { type: blob.type || 'audio/mpeg' })
      const success = await addCustomSound(result.name, file)
      console.log('addCustomSound result:', success)
      if (success) {
        showNotification(t('sound.importSuccess'))
      } else {
        showNotification(t('sound.maxSizeError'))
      }
    } catch (err) {
      console.error('Add failed:', err)
      showNotification(t('sound.fetchError'))
    }
  }

  // Separate built-in and custom sounds
  const builtInSounds = sounds.filter(s => !s.isCustom)
  const customSounds = sounds.filter(s => s.isCustom)

  return (
    <div className="flex flex-col gap-3">
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

      {/* ===== Section 3: Search & Add ===== */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-white/40 tracking-widest uppercase">{t('sound.searchAndAdd')}</span>

        {/* Tab bar */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04]">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all duration-200 ${
              activeTab === 'search'
                ? 'bg-white/[0.12] text-white/80'
                : 'text-white/35 hover:text-white/55'
            }`}
          >
            {t('sound.tabSearch')}
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all duration-200 ${
              activeTab === 'url'
                ? 'bg-white/[0.12] text-white/80'
                : 'text-white/35 hover:text-white/55'
            }`}
          >
            {t('sound.tabUrl')}
          </button>
        </div>

        {/* Tab: Search */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchMusic()}
                placeholder={t('sound.searchPlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
              <button
                onClick={searchMusic}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                disabled={searching}
              >
                {searching ? '...' : '\u{1F50D}'}
              </button>
            </div>

            {/* Search results as vertical list */}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-200"
                  >
                    {/* Artwork thumbnail */}
                    <img
                      src={r.artwork}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                    />

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-white/75 truncate">{r.name}</div>
                      <div className="text-[9px] text-white/35 truncate">{r.artist}</div>
                    </div>

                    {/* Duration */}
                    {r.duration > 0 && (
                      <span className="text-[9px] text-white/30 tabular-nums flex-shrink-0">
                        {formatDuration(r.duration)}
                      </span>
                    )}

                    {/* Preview / progress */}
                    {previewingId === `preview-${i}` ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => stopPreview()}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-500/20 active:scale-95 transition-all"
                        >
                          <svg className="w-2.5 h-2.5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="5" y="3" width="5" height="18" rx="1" />
                            <rect x="14" y="3" width="5" height="18" rx="1" />
                          </svg>
                        </button>
                        <div className="w-10 h-[2px] rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-amber-400/70 transition-all duration-200"
                            style={{ width: `${previewProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startPreview(r, i)}
                        className="text-[10px] text-amber-300/80 hover:text-amber-200 px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 active:scale-95 flex-shrink-0"
                      >
                        {t('sound.preview')}
                      </button>
                    )}

                    {/* Add button */}
                    <button
                      onClick={() => handleAddFull(r)}
                      className="text-[10px] text-white/50 hover:text-white/80 px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 active:scale-95 flex-shrink-0"
                    >
                      {t('sound.addFull')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && !searching && searchQuery.trim() !== '' && (
              <div className="text-[10px] text-white/30 text-center py-2">{t('sound.noResults')}</div>
            )}
          </div>
        )}

        {/* Tab: URL */}
        {activeTab === 'url' && (
          <div className="flex flex-col gap-2">
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white/90 text-xs z-50 transition-opacity duration-300">
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
