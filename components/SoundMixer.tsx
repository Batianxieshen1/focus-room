'use client'

import { useRef, useState } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function SoundMixer() {
  const { sounds, toggleSound, setVolume, muteAll, unmuteAll, addCustomSound, removeCustomSound } = useAudioContext()
  const anyPlaying = sounds.some(s => s.isPlaying)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 12)
      const success = addCustomSound(name, dataUrl)
      if (success) {
        showNotification(t('sound.importSuccess'))
      } else {
        showNotification(t('sound.totalSizeError'))
      }
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be selected again
    e.target.value = ''
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
    </div>
  )
}
