'use client'

import { useRef, useState } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function SoundMixer() {
  const { sounds, toggleSound, setVolume, muteAll, unmuteAll, addCustomSound, removeCustomSound } = useAudioContext()
  const anyPlaying = sounds.some(s => s.isPlaying)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Online music search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{name: string, artist: string, previewUrl: string, artwork: string}>>([])
  const [searching, setSearching] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2000)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be selected again
    e.target.value = ''

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      showNotification(t('sound.importError'))
      return
    }

    // Validate size
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

  const searchMusic = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=8`)
      const data = await res.json()
      setSearchResults(data.results.map((r: any) => ({
        name: r.trackName.slice(0, 20),
        artist: r.artistName,
        previewUrl: r.previewUrl,
        artwork: r.artworkUrl60,
      })))
    } catch {
      // Silently handle errors
    }
    setSearching(false)
  }

  const handlePreviewAdd = async (result: { name: string, artist: string, previewUrl: string }) => {
    try {
      const res = await fetch(result.previewUrl)
      const blob = await res.blob()
      const file = new File([blob], `${result.name}.mp3`, { type: 'audio/mpeg' })
      const success = await addCustomSound(result.name, file)
      if (success) {
        showNotification(t('sound.importSuccess'))
      } else {
        showNotification(t('sound.maxSizeError'))
      }
    } catch {
      // Fallback: just play preview
      const audio = new Audio(result.previewUrl)
      audio.play()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50 tracking-widest uppercase">{t('sound.title')}</span>
        <button
          onClick={anyPlaying ? muteAll : unmuteAll}
          className="text-[11px] text-white/35 hover:text-white/70 transition-colors duration-200"
        >
          {anyPlaying ? t('sound.muteAll') : t('sound.restore')}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {sounds.map(sound => (
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

            {/* Remove button for custom sounds */}
            {sound.isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeCustomSound(sound.id)
                }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-400"
                title={t('sound.removeCustom')}
              >
                x
              </button>
            )}
          </div>
        ))}

        {/* Add custom sound button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 border border-dashed border-white/10 hover:border-white/20"
        >
          <span className="text-lg text-white/30">+</span>
          <span className="text-[10px] text-white/30">{t('sound.importLocal')}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg,audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Success/error notification */}
      {notification && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white/90 text-xs z-50 transition-opacity duration-300">
          {notification}
        </div>
      )}

      {sounds.some(s => s.isPlaying) && (
        <div className="flex flex-col gap-2.5 pt-1">
          {sounds.filter(s => s.isPlaying).map(sound => (
            <div key={sound.id} className="flex items-center gap-3">
              <span className="text-xs w-5 text-center opacity-80">{sound.icon}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sound.volume}
                onChange={e => setVolume(sound.id, Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-[10px] text-white/35 w-7 text-right tabular-nums">{sound.volume}</span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Online music search */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] text-white/40 tracking-widest uppercase">{t('sound.searchOnline')}</span>

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

        {searchResults.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {searchResults.map((r, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-32 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-all"
                onClick={() => handlePreviewAdd(r)}
              >
                <img src={r.artwork} className="w-full rounded-md mb-1" alt="" />
                <div className="text-[10px] text-white/70 truncate">{r.name}</div>
                <div className="text-[9px] text-white/40 truncate">{r.artist}</div>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && !searching && searchQuery.trim() !== '' && (
          <div className="text-[10px] text-white/30 text-center py-2">{t('sound.noResults')}</div>
        )}
      </div>
    </div>
  )
}
