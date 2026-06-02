'use client'

import { useState, useCallback, useRef, useEffect, createContext, useContext, ReactNode } from 'react'

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
  addCustomSound: (name: string, dataUrl: string) => boolean
  removeCustomSound: (id: string) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

const SOUND_DEFAULTS: Omit<Sound, 'volume'>[] = [
  { id: 'rain', name: '雨声', icon: '🌧', isPlaying: false, file: '/sounds/rain.mp3' },
  { id: 'ocean', name: '海浪', icon: '🌊', isPlaying: false, file: '/sounds/ocean.mp3' },
  { id: 'forest', name: '森林', icon: '🌲', isPlaying: false, file: '/sounds/forest.mp3' },
  { id: 'fire', name: '壁炉', icon: '🔥', isPlaying: false, file: '/sounds/fire.wav' },
  { id: 'cafe', name: '咖啡馆', icon: '☕', isPlaying: false, file: '/sounds/cafe.mp3' },
  { id: 'wind', name: '风声', icon: '💨', isPlaying: false, file: '/sounds/wind.mp3' },
  { id: 'night', name: '夏夜', icon: '🦗', isPlaying: false, file: '/sounds/night.mp3' },
  { id: 'whitenoise', name: '白噪音', icon: '📻', isPlaying: false, file: '/sounds/whitenoise.wav' },
]

const CUSTOM_SOUNDS_KEY = 'focus-room-custom-sounds'
const MAX_CUSTOM_SIZE = 5 * 1024 * 1024 // 5MB total

function loadVolumes(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem('focus-room-volumes')
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

function saveVolumes(volumes: Record<string, number>) {
  try {
    localStorage.setItem('focus-room-volumes', JSON.stringify(volumes))
  } catch {}
}

function loadCustomSounds(): Omit<Sound, 'volume'>[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CUSTOM_SOUNDS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveCustomSounds(sounds: Omit<Sound, 'volume'>[]) {
  try {
    localStorage.setItem(CUSTOM_SOUNDS_KEY, JSON.stringify(sounds))
  } catch {}
}

function getTotalCustomSize(): number {
  const customs = loadCustomSounds()
  return customs.reduce((sum, s) => sum + (s.file ? Math.round((s.file.length * 3) / 4) : 0), 0)
}

function getInitialSounds(): Sound[] {
  const savedVolumes = loadVolumes()
  const customSounds = loadCustomSounds()

  const builtIn = SOUND_DEFAULTS.map(s => ({
    ...s,
    volume: savedVolumes[s.id] ?? 50,
  }))

  const customs = customSounds.map(s => ({
    ...s,
    volume: savedVolumes[s.id] ?? 50,
  }))

  return [...builtIn, ...customs]
}

// Fade volume over a duration using setInterval
function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number
): Promise<void> {
  return new Promise((resolve) => {
    const steps = 15
    const intervalMs = durationMs / steps
    const delta = (to - from) / steps
    let step = 0
    audio.volume = from

    const timer = setInterval(() => {
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
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [sounds, setSounds] = useState<Sound[]>(getInitialSounds)
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Track active fade intervals so we can cancel on rapid toggles
  const fadeTimersRef = useRef<Map<string, NodeJS.Timeout[]>>(new Map())

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      // Cancel all fade timers
      fadeTimersRef.current.forEach(timers => timers.forEach(t => clearInterval(t as unknown as number)))
      fadeTimersRef.current.clear()
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
    if (!audio.src || audio.src === 'about:blank') {
      audio.src = file
      audio.preload = 'auto'
    }
  }, [])

  const toggleSound = useCallback((id: string) => {
    setSounds(prev => prev.map(s => {
      if (s.id !== id) return s
      const audio = getAudio(s)

      if (!s.isPlaying) {
        // Ensure the audio source is loaded before playing
        ensureLoaded(audio, s.file)
        // Turning ON: fade in from 0 to target over 500ms
        const targetVol = s.volume / 100
        audio.volume = 0
        audio.play().catch(() => {})
        fadeVolume(audio, 0, targetVol, 500)
        return { ...s, isPlaying: true }
      } else {
        // Turning OFF: fade out from current to 0 over 300ms, then pause
        const currentVol = audio.volume
        fadeVolume(audio, currentVol, 0, 300).then(() => {
          audio.pause()
          audio.currentTime = 0
        })
        return { ...s, isPlaying: false }
      }
    }))
  }, [getAudio])

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
        const audio = audioMapRef.current.get(s.id)
        if (audio) {
          // Quick fade out then pause
          const currentVol = audio.volume
          fadeVolume(audio, currentVol, 0, 200).then(() => {
            audio.pause()
            audio.currentTime = 0
          })
        }
      }
      return { ...s, isPlaying: false }
    }))
  }, [])

  const unmuteAll = useCallback(() => {
    setSounds(prev => prev.map(s => {
      if (!s.isPlaying && s.volume > 0) {
        const audio = getAudio(s)
        ensureLoaded(audio, s.file)
        const targetVol = s.volume / 100
        audio.volume = 0
        audio.play().catch(() => {})
        fadeVolume(audio, 0, targetVol, 500)
        return { ...s, isPlaying: true }
      }
      return s
    }))
  }, [getAudio])

  const addCustomSound = useCallback((name: string, dataUrl: string): boolean => {
    // Check individual file size (approximate from data URL length)
    const approxSize = Math.round((dataUrl.length * 3) / 4)
    if (approxSize > MAX_CUSTOM_SIZE) return false

    // Check total size
    const currentTotal = getTotalCustomSize()
    if (currentTotal + approxSize > MAX_CUSTOM_SIZE) return false

    const id = `custom-${Date.now()}`
    const newSound: Omit<Sound, 'volume'> = {
      id,
      name,
      icon: '🎵',
      isPlaying: false,
      file: dataUrl,
      isCustom: true,
    }

    const customSounds = loadCustomSounds()
    customSounds.push(newSound)
    saveCustomSounds(customSounds)

    setSounds(prev => [...prev, { ...newSound, volume: 50 }])
    return true
  }, [])

  const removeCustomSound = useCallback((id: string) => {
    // Stop if playing
    const audio = audioMapRef.current.get(id)
    if (audio) {
      audio.pause()
      audio.src = ''
      audioMapRef.current.delete(id)
    }

    setSounds(prev => prev.filter(s => s.id !== id))

    const customSounds = loadCustomSounds().filter(s => s.id !== id)
    saveCustomSounds(customSounds)
  }, [])

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
