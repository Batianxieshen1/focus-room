'use client'

import { useState, useCallback, useRef, useEffect, createContext, useContext, ReactNode } from 'react'
import { storageGet, storageSet } from '@/lib/storage'
import { saveCustomSound, loadCustomSounds, deleteCustomSound } from '@/lib/audioDB'

export interface Sound {
  id: string
  name: string
  icon: string
  volume: number
  isPlaying: boolean
  file: string
  isCustom?: boolean
}

interface AudioContextValue {
  sounds: Sound[]
  toggleSound: (id: string) => void
  setVolume: (id: string, volume: number) => void
  muteAll: () => void
  unmuteAll: () => void
  addCustomSound: (name: string, file: File) => Promise<boolean>
  removeCustomSound: (id: string) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

const SOUND_DEFAULTS: Omit<Sound, 'volume'>[] = [
  { id: 'rain', name: '雨声', icon: '🌧', isPlaying: false, file: BASE_PATH + '/sounds/rain.mp3' },
  { id: 'ocean', name: '海浪', icon: '🌊', isPlaying: false, file: BASE_PATH + '/sounds/ocean.mp3' },
  { id: 'forest', name: '森林', icon: '🌲', isPlaying: false, file: BASE_PATH + '/sounds/forest.mp3' },
  { id: 'fire', name: '壁炉', icon: '🔥', isPlaying: false, file: BASE_PATH + '/sounds/fire.wav' },
  { id: 'cafe', name: '咖啡馆', icon: '☕', isPlaying: false, file: BASE_PATH + '/sounds/cafe.mp3' },
  { id: 'wind', name: '风声', icon: '💨', isPlaying: false, file: BASE_PATH + '/sounds/wind.mp3' },
  { id: 'night', name: '夏夜', icon: '🦗', isPlaying: false, file: BASE_PATH + '/sounds/night.mp3' },
  { id: 'whitenoise', name: '白噪音', icon: '📻', isPlaying: false, file: BASE_PATH + '/sounds/whitenoise.wav' },
]

const MAX_CUSTOM_SIZE = 50 * 1024 * 1024 // 50MB per file

function loadVolumes(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  return storageGet<Record<string, number>>('focus-room-volumes', {})
}

function saveVolumes(volumes: Record<string, number>) {
  storageSet('focus-room-volumes', volumes)
}

function getBuiltInSounds(): Sound[] {
  const savedVolumes = loadVolumes()
  return SOUND_DEFAULTS.map(s => ({
    ...s,
    volume: savedVolumes[s.id] ?? 50,
  }))
}

// Fade volume over a duration. Returns a cancel function to abort the fade.
function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number
): { promise: Promise<void>; cancel: () => void } {
  let cancelled = false
  const promise = new Promise<void>((resolve) => {
    const steps = 15
    const intervalMs = durationMs / steps
    const delta = (to - from) / steps
    let step = 0
    audio.volume = from

    const timer = setInterval(() => {
      if (cancelled) { clearInterval(timer); resolve(); return }
      step++
      if (step >= steps) {
        audio.volume = to
        clearInterval(timer)
        resolve()
      } else {
        audio.volume = Math.min(1, Math.max(0, from + delta * step))
      }
    }, intervalMs)
  })
  return { promise, cancel: () => { cancelled = true } }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [sounds, setSounds] = useState<Sound[]>(getBuiltInSounds)
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Track active fade cancel functions per sound ID
  const fadeCancelsRef = useRef<Map<string, (() => void)[]>>(new Map())
  const [customSoundsLoaded, setCustomSoundsLoaded] = useState(false)

  // Load custom sounds from IndexedDB on mount
  useEffect(() => {
    loadCustomSounds().then(stored => {
      const savedVolumes = loadVolumes()
      const customs: Sound[] = stored.map(s => ({
        id: s.id,
        name: s.name,
        icon: '\u{1f3b5}',
        volume: savedVolumes[s.id] ?? 50,
        isPlaying: false,
        file: s.fileUrl,
        isCustom: true,
      }))
      setSounds(prev => [...prev, ...customs])
      setCustomSoundsLoaded(true)
    }).catch(() => {
      setCustomSoundsLoaded(true)
    })
  }, [])

  useEffect(() => {
    return () => {
      // Flush pending volume save before cleanup (e.g. on page refresh)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        const volumes: Record<string, number> = {}
        soundsRef.current.forEach(s => { volumes[s.id] = s.volume })
        saveVolumes(volumes)
      }
      // Cancel all active fades
      fadeCancelsRef.current.forEach(cancels => cancels.forEach(cancel => cancel()))
      fadeCancelsRef.current.clear()
      audioMapRef.current.forEach(a => { a.pause(); a.src = '' })
      audioMapRef.current.clear()
    }
  }, [])

  const getAudio = useCallback((sound: Sound) => {
    let audio = audioMapRef.current.get(sound.id)
    if (!audio) {
      audio = new Audio()
      audio.loop = true
      audio.volume = sound.volume / 100
      audio.preload = 'none'
      audioMapRef.current.set(sound.id, audio)
    }
    return audio
  }, [])

  // Load a sound's src only when first played, then set preload to auto
  const ensureLoaded = useCallback((audio: HTMLAudioElement, file: string) => {
    if (!file) return
    // Only set src if not already loaded with the correct file
    const currentSrc = audio.src || ''
    if (!currentSrc || currentSrc === 'about:blank' || !currentSrc.startsWith('blob:')) {
      audio.src = file
      audio.preload = 'auto'
    }
  }, [])

  // Cancel any active fades for a given sound ID
  const cancelFades = useCallback((id: string) => {
    const cancels = fadeCancelsRef.current.get(id)
    if (cancels) { cancels.forEach(c => c()); fadeCancelsRef.current.delete(id) }
  }, [])

  const registerFade = useCallback((id: string, cancel: () => void) => {
    const existing = fadeCancelsRef.current.get(id) || []
    existing.push(cancel)
    fadeCancelsRef.current.set(id, existing)
  }, [])

  const toggleSound = useCallback((id: string) => {
    // Cancel any in-progress fade for this sound
    cancelFades(id)

    setSounds(prev => prev.map(s => {
      if (s.id !== id) return s
      const audio = getAudio(s)

      if (!s.isPlaying) {
        const needLoad = !audio.src || audio.src === 'about:blank' || audio.readyState < 2
        ensureLoaded(audio, s.file)
        const targetVol = s.volume / 100
        audio.volume = 0

        const doPlay = () => {
          audio.play().then(() => {
            console.log('Audio playing:', s.name)
          }).catch(err => {
            console.error('Audio play failed:', s.name, err.message)
          })
        }

        if (needLoad) {
          audio.oncanplay = () => { audio.oncanplay = null; doPlay() }
          audio.load()
        } else {
          doPlay()
        }

        const { cancel } = fadeVolume(audio, 0, targetVol, 500)
        registerFade(id, cancel)
        return { ...s, isPlaying: true }
      } else {
        const currentVol = audio.volume
        const { promise, cancel } = fadeVolume(audio, currentVol, 0, 300)
        registerFade(id, cancel)
        promise.then(() => { audio.pause(); audio.currentTime = 0 })
        return { ...s, isPlaying: false }
      }
    }))
  }, [getAudio, cancelFades, registerFade])

  const soundsRef = useRef(sounds)
  soundsRef.current = sounds

  const debouncedSaveVolumes = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const volumes: Record<string, number> = {}
      soundsRef.current.forEach(s => { volumes[s.id] = s.volume })
      saveVolumes(volumes)
    }, 300)
  }, [])

  const setVolume = useCallback((id: string, volume: number) => {
    setSounds(prev => {
      return prev.map(s => {
        if (s.id !== id) return s
        const audio = audioMapRef.current.get(id)
        if (audio) audio.volume = volume / 100
        return { ...s, volume }
      })
    })
    debouncedSaveVolumes()
  }, [debouncedSaveVolumes])

  const muteAll = useCallback(() => {
    setSounds(prev => prev.map(s => {
      if (s.isPlaying) {
        cancelFades(s.id)
        const audio = audioMapRef.current.get(s.id)
        if (audio) {
          const currentVol = audio.volume
          const { promise, cancel } = fadeVolume(audio, currentVol, 0, 200)
          registerFade(s.id, cancel)
          promise.then(() => { audio.pause(); audio.currentTime = 0 })
        }
      }
      return { ...s, isPlaying: false }
    }))
  }, [cancelFades, registerFade])

  const unmuteAll = useCallback(() => {
    setSounds(prev => prev.map(s => {
      if (!s.isPlaying && s.volume > 0) {
        cancelFades(s.id)
        const audio = getAudio(s)
        ensureLoaded(audio, s.file)
        const targetVol = s.volume / 100
        audio.volume = 0
        audio.play().catch(() => {})
        const { cancel } = fadeVolume(audio, 0, targetVol, 500)
        registerFade(s.id, cancel)
        return { ...s, isPlaying: true }
      }
      return s
    }))
  }, [getAudio, cancelFades, registerFade])

  const addCustomSound = useCallback(async (name: string, file: File): Promise<boolean> => {
    // Validate individual file size
    if (file.size > MAX_CUSTOM_SIZE) return false

    const id = `custom-${Date.now()}`
    const blob = new Blob([await file.arrayBuffer()], { type: file.type })

    // Save to IndexedDB
    await saveCustomSound(id, name, blob)

    // Create object URL for playback
    const fileUrl = URL.createObjectURL(blob)

    const newSound: Sound = {
      id,
      name,
      icon: '\u{1f3b5}',
      volume: 50,
      isPlaying: false,
      file: fileUrl,
      isCustom: true,
    }

    setSounds(prev => [...prev, newSound])
    return true
  }, [])

  const removeCustomSound = useCallback((id: string) => {
    cancelFades(id)
    const audio = audioMapRef.current.get(id)
    if (audio) {
      audio.pause()
      audio.src = ''
      audioMapRef.current.delete(id)
    }

    setSounds(prev => prev.filter(s => s.id !== id))

    // Delete from IndexedDB
    deleteCustomSound(id).catch(() => {})
  }, [cancelFades])

  return (
    <AudioContext.Provider value={{ sounds, toggleSound, setVolume, muteAll, unmuteAll, addCustomSound, removeCustomSound }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudioContext(): AudioContextValue {
  const ctx = useContext(AudioContext)
  if (!ctx) {
    throw new Error('useAudioContext must be used within an AudioProvider')
  }
  return ctx
}
