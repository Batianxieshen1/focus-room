'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface Sound {
  id: string
  name: string
  icon: string
  volume: number
  isPlaying: boolean
  file: string
}

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

// 加载保存的音量
function loadVolumes(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem('focus-room-volumes')
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

// 保存音量
function saveVolumes(volumes: Record<string, number>) {
  try {
    localStorage.setItem('focus-room-volumes', JSON.stringify(volumes))
  } catch {}
}

function getInitialSounds(): Sound[] {
  const savedVolumes = loadVolumes()
  return SOUND_DEFAULTS.map(s => ({
    ...s,
    volume: savedVolumes[s.id] ?? 50,
  }))
}

export function useAudio() {
  const [sounds, setSounds] = useState<Sound[]>(getInitialSounds)
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  useEffect(() => {
    return () => {
      audioMapRef.current.forEach(a => { a.pause(); a.src = '' })
      audioMapRef.current.clear()
    }
  }, [])

  const getAudio = useCallback((sound: Sound) => {
    let audio = audioMapRef.current.get(sound.id)
    if (!audio) {
      audio = new Audio(sound.file)
      audio.loop = true
      audio.volume = sound.volume / 100
      audio.preload = 'auto'
      audioMapRef.current.set(sound.id, audio)
    }
    return audio
  }, [])

  const toggleSound = useCallback((id: string) => {
    setSounds(prev => prev.map(s => {
      if (s.id !== id) return s
      const audio = getAudio(s)
      if (!s.isPlaying) { audio.play().catch(() => {}) }
      else { audio.pause(); audio.currentTime = 0 }
      return { ...s, isPlaying: !s.isPlaying }
    }))
  }, [getAudio])

  const setVolume = useCallback((id: string, volume: number) => {
    setSounds(prev => {
      const updated = prev.map(s => {
        if (s.id !== id) return s
        const audio = audioMapRef.current.get(id)
        if (audio) audio.volume = volume / 100
        return { ...s, volume }
      })
      // 保存所有音量
      const volumes: Record<string, number> = {}
      updated.forEach(s => { volumes[s.id] = s.volume })
      saveVolumes(volumes)
      return updated
    })
  }, [])

  const muteAll = useCallback(() => {
    setSounds(prev => prev.map(s => {
      if (s.isPlaying) {
        const audio = audioMapRef.current.get(s.id)
        if (audio) { audio.pause(); audio.currentTime = 0 }
      }
      return { ...s, isPlaying: false }
    }))
  }, [])

  const unmuteAll = useCallback(() => {
    setSounds(prev => prev.map(s => {
      if (!s.isPlaying && s.volume > 0) {
        const audio = getAudio(s)
        audio.play().catch(() => {})
        return { ...s, isPlaying: true }
      }
      return s
    }))
  }, [getAudio])

  return { sounds, toggleSound, setVolume, muteAll, unmuteAll }
}
