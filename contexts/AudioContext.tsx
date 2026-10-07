'use client'

import { useState, useCallback, useRef, useEffect, createContext, useContext, ReactNode } from 'react'
import { storageGet, storageSet } from '@/lib/storage'
import { saveCustomSound, loadCustomSounds, deleteCustomSound } from '@/lib/audioDB'
import { applyMixFromURL } from '@/lib/mixShare'
import { t, TranslationKey } from '@/lib/i18n'

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
  /** 环境音总音量（母线），0 ~ 100 */
  ambientMaster: number
  toggleSound: (id: string) => void
  setVolume: (id: string, volume: number) => void
  setAmbientMaster: (volume: number) => void
  /** 应用一套混音配方：volumes 里没提到或为 0 的音会被停掉 */
  applyMix: (volumes: Record<string, number>) => void
  muteAll: () => void
  unmuteAll: () => void
  addCustomSound: (name: string, file: File) => Promise<boolean>
  removeCustomSound: (id: string) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/focus-room'

const SOUND_DEFAULTS: Array<Omit<Sound, 'volume' | 'name'> & { nameKey: TranslationKey }> = [
  { id: 'rain', nameKey: 'sound.rain', icon: '🌧', isPlaying: false, file: BASE_PATH + '/sounds/rain.mp3' },
  { id: 'ocean', nameKey: 'sound.ocean', icon: '🌊', isPlaying: false, file: BASE_PATH + '/sounds/ocean.mp3' },
  { id: 'forest', nameKey: 'sound.forest', icon: '🌲', isPlaying: false, file: BASE_PATH + '/sounds/forest.mp3' },
  { id: 'fire', nameKey: 'sound.fire', icon: '🔥', isPlaying: false, file: BASE_PATH + '/sounds/fire.wav' },
  { id: 'cafe', nameKey: 'sound.cafe', icon: '☕', isPlaying: false, file: BASE_PATH + '/sounds/cafe.mp3' },
  { id: 'wind', nameKey: 'sound.wind', icon: '💨', isPlaying: false, file: BASE_PATH + '/sounds/wind.mp3' },
  { id: 'night', nameKey: 'sound.night', icon: '🦗', isPlaying: false, file: BASE_PATH + '/sounds/night.mp3' },
  { id: 'whitenoise', nameKey: 'sound.whitenoise', icon: '📻', isPlaying: false, file: BASE_PATH + '/sounds/whitenoise.wav' },
  { id: 'keyboard', nameKey: 'sound.keyboard', icon: '⌨️', isPlaying: false, file: BASE_PATH + '/sounds/keyboard.wav' },
  { id: 'pageturn', nameKey: 'sound.pageturn', icon: '📖', isPlaying: false, file: BASE_PATH + '/sounds/page-turn.wav' },
  { id: 'clock', nameKey: 'sound.clock', icon: '🕰️', isPlaying: false, file: BASE_PATH + '/sounds/clock.wav' },
]

const MAX_CUSTOM_SIZE = 50 * 1024 * 1024 // 50MB per file

const FADE_IN_MS = 500
const FADE_OUT_MS = 300
const MUTE_FADE_MS = 200

const VOLUMES_KEY = 'focus-room-volumes'
const MASTER_KEY = 'focus-room-ambient-master'

function loadVolumes(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  return storageGet<Record<string, number>>(VOLUMES_KEY, {})
}

function saveVolumes(volumes: Record<string, number>) {
  storageSet(VOLUMES_KEY, volumes)
}

function loadMaster(): number {
  if (typeof window === 'undefined') return 100
  const v = storageGet<number>(MASTER_KEY, 100)
  return typeof v === 'number' && v >= 0 && v <= 100 ? v : 100
}

function getBuiltInSounds(): Sound[] {
  const savedVolumes = loadVolumes()
  return SOUND_DEFAULTS.map(s => ({
    id: s.id,
    name: t(s.nameKey),
    icon: s.icon,
    isPlaying: s.isPlaying,
    file: s.file,
    volume: savedVolumes[s.id] ?? 50,
  }))
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function AudioProvider({ children }: { children: ReactNode }) {
  // 若 URL 带 ?mix= 分享配方，在初始化音量前先写入 localStorage
  applyMixFromURL()

  const [sounds, setSounds] = useState<Sound[]>(getBuiltInSounds)
  const [ambientMaster, setAmbientMasterState] = useState<number>(loadMaster)
  const soundsRef = useRef(sounds)
  const masterRef = useRef(ambientMaster)
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  // 每个 audio 元素当前装载的文件，避免每次播放重复赋值 src 导致重新加载
  const loadedSrcRef = useRef<Map<string, string>>(new Map())
  // 过渡代数：每次新的播放/停止操作递增，旧淡入淡出回调发现代数不符就自行作废
  const genRef = useRef<Map<string, number>>(new Map())
  const fadeTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    soundsRef.current = sounds
  }, [sounds])
  useEffect(() => {
    masterRef.current = ambientMaster
  }, [ambientMaster])

  // Load custom sounds from IndexedDB on mount
  useEffect(() => {
    loadCustomSounds().then(stored => {
      const savedVolumes = loadVolumes()
      const customs: Sound[] = stored.map(s => ({
        id: s.id,
        name: s.name,
        icon: '🎵',
        volume: savedVolumes[s.id] ?? 50,
        isPlaying: false,
        file: s.fileUrl,
        isCustom: true,
      }))
      setSounds(prev => [...prev, ...customs])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const timers = fadeTimersRef.current
    const audioMap = audioMapRef.current
    return () => {
      // Flush pending volume save before cleanup (e.g. on page refresh)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        const volumes: Record<string, number> = {}
        soundsRef.current.forEach(s => { volumes[s.id] = s.volume })
        saveVolumes(volumes)
      }
      timers.forEach(timer => clearInterval(timer))
      timers.clear()
      audioMap.forEach(a => { a.pause(); a.src = '' })
      audioMap.clear()
    }
  }, [])

  const getAudio = useCallback((sound: Sound) => {
    let audio = audioMapRef.current.get(sound.id)
    if (!audio) {
      audio = new Audio()
      audio.loop = true
      audio.volume = clamp01((sound.volume / 100) * (masterRef.current / 100))
      audio.preload = 'none'
      audioMapRef.current.set(sound.id, audio)
    }
    return audio
  }, [])

  // 只在文件变化时才赋值 src，避免每次播放都重新 load / 从头开始
  const ensureLoaded = useCallback((id: string, audio: HTMLAudioElement, file: string) => {
    if (!file) return
    if (loadedSrcRef.current.get(id) === file) return
    audio.src = file
    audio.preload = 'auto'
    loadedSrcRef.current.set(id, file)
  }, [])

  // 计算某音效的实际可听音量（滑块 × 环境音母线）
  const effectiveVolume = useCallback((s: Sound) => {
    return clamp01((s.volume / 100) * (masterRef.current / 100))
  }, [])

  /**
   * 启动一次音量渐变（moodist 的 token 模式）。
   * 同一音效的新过渡会使旧过渡立即失效——旧回调不会 pause 新启动的声音。
   */
  const startFade = useCallback((
    id: string,
    audio: HTMLAudioElement,
    from: number,
    to: number,
    durationMs: number,
    onDone?: () => void
  ) => {
    const prevTimer = fadeTimersRef.current.get(id)
    if (prevTimer) clearInterval(prevTimer)
    const gen = (genRef.current.get(id) ?? 0) + 1
    genRef.current.set(id, gen)

    const steps = 15
    const intervalMs = Math.max(16, Math.round(durationMs / steps))
    audio.volume = clamp01(from)
    let step = 0

    const timer = setInterval(() => {
      if (genRef.current.get(id) !== gen) {
        clearInterval(timer)
        fadeTimersRef.current.delete(id)
        return
      }
      step++
      audio.volume = clamp01(step >= steps ? to : from + (to - from) * (step / steps))
      if (step >= steps) {
        clearInterval(timer)
        fadeTimersRef.current.delete(id)
        onDone?.()
      }
    }, intervalMs)
    fadeTimersRef.current.set(id, timer)
  }, [])

  const stopAndReset = useCallback((audio: HTMLAudioElement) => {
    audio.pause()
    audio.currentTime = 0
  }, [])

  const persistVolumes = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const volumes: Record<string, number> = {}
      soundsRef.current.forEach(s => { volumes[s.id] = s.volume })
      saveVolumes(volumes)
    }, 300)
  }, [])

  const toggleSound = useCallback((id: string) => {
    const s = soundsRef.current.find(x => x.id === id)
    if (!s) return
    const audio = getAudio(s)
    const nextPlaying = !s.isPlaying

    if (nextPlaying) {
      ensureLoaded(id, audio, s.file)
      const target = effectiveVolume(s)
      audio.play().catch(err => {
        console.warn('Audio play failed:', s.name, err.message)
      })
      startFade(id, audio, audio.volume, target, FADE_IN_MS)
    } else {
      startFade(id, audio, audio.volume, 0, FADE_OUT_MS, () => stopAndReset(audio))
    }

    // 立即同步 ref：快速连续点击时函数式 setState 要到下一次渲染才反映
    soundsRef.current = soundsRef.current.map(x => (x.id === id ? { ...x, isPlaying: nextPlaying } : x))
    setSounds(prev => prev.map(x => (x.id === id ? { ...x, isPlaying: nextPlaying } : x)))
  }, [getAudio, ensureLoaded, effectiveVolume, startFade, stopAndReset])

  const setVolume = useCallback((id: string, volume: number) => {
    // 拖动滑块是显式操作：作废进行中的淡入淡出并立即生效
    genRef.current.set(id, (genRef.current.get(id) ?? 0) + 1)
    const prevTimer = fadeTimersRef.current.get(id)
    if (prevTimer) { clearInterval(prevTimer); fadeTimersRef.current.delete(id) }

    const apply = (s: Sound) => {
      if (s.id !== id) return s
      const audio = audioMapRef.current.get(id)
      if (audio) {
        if (s.isPlaying) audio.volume = clamp01((volume / 100) * (masterRef.current / 100))
        else audio.volume = clamp01(volume / 100)
      }
      return { ...s, volume }
    }
    soundsRef.current = soundsRef.current.map(apply)
    setSounds(prev => prev.map(apply))
    persistVolumes()
  }, [persistVolumes])

  const applyMasterToPlaying = useCallback(() => {
    soundsRef.current.forEach(s => {
      if (!s.isPlaying) return
      const audio = audioMapRef.current.get(s.id)
      if (audio) audio.volume = clamp01((s.volume / 100) * (masterRef.current / 100))
    })
  }, [])

function broadcastMaster(volume: number, isMuted: boolean) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('focusroom:master', {
    detail: { volume, isMuted },
  }))
}

  const setAmbientMaster = useCallback((volume: number) => {
    const v = Math.min(100, Math.max(0, volume))
    storageSet(MASTER_KEY, v)
    setAmbientMasterState(v)
    masterRef.current = v
    applyMasterToPlaying()
    broadcastMaster(v, false)
  }, [applyMasterToPlaying])

  const applyMix = useCallback((volumes: Record<string, number>) => {
    const normalized: Record<string, number> = {}
    Object.entries(volumes).forEach(([k, v]) => {
      if (typeof v === 'number' && isFinite(v)) normalized[k] = Math.min(100, Math.max(0, v))
    })

    soundsRef.current.forEach(s => {
      const target = normalized[s.id]
      if (target === undefined || target <= 0) {
        // 配方之外的音：停掉，但保留用户原本保存的滑块音量
        if (s.isPlaying) {
          const audio = audioMapRef.current.get(s.id)
          if (audio) startFade(s.id, audio, audio.volume, 0, FADE_OUT_MS, () => stopAndReset(audio))
        }
        return
      }
      const audible = clamp01((target / 100) * (masterRef.current / 100))
      if (!s.isPlaying) {
        const audio = getAudio(s)
        ensureLoaded(s.id, audio, s.file)
        audio.play().catch(() => {})
        startFade(s.id, audio, 0, audible, FADE_IN_MS)
      } else {
        const audio = audioMapRef.current.get(s.id)
        if (audio) audio.volume = audible
      }
    })

    // 持久化：混音里的音用配方音量，其余音保留原值
    const merged: Record<string, number> = {}
    soundsRef.current.forEach(s => { merged[s.id] = s.volume })
    Object.assign(merged, normalized)
    saveVolumes(merged)

    const apply = (s: Sound) => {
      const target = normalized[s.id]
      if (target === undefined || target <= 0) return { ...s, isPlaying: false }
      return { ...s, volume: Math.min(100, Math.max(0, target)), isPlaying: true }
    }
    soundsRef.current = soundsRef.current.map(apply)
    setSounds(prev => prev.map(apply))
  }, [getAudio, ensureLoaded, startFade, stopAndReset])

  const muteAll = useCallback(() => {
    soundsRef.current.forEach(s => {
      if (!s.isPlaying) return
      const audio = audioMapRef.current.get(s.id)
      if (audio) startFade(s.id, audio, audio.volume, 0, MUTE_FADE_MS, () => stopAndReset(audio))
    })
    const apply = (s: Sound) => (s.isPlaying ? { ...s, isPlaying: false } : s)
    soundsRef.current = soundsRef.current.map(apply)
    setSounds(prev => prev.map(apply))
    broadcastMaster(masterRef.current, true)
  }, [startFade, stopAndReset])

  const unmuteAll = useCallback(() => {
    soundsRef.current.forEach(s => {
      if (s.isPlaying || s.volume <= 0) return
      const audio = getAudio(s)
      ensureLoaded(s.id, audio, s.file)
      const target = effectiveVolume(s)
      audio.play().catch(() => {})
      startFade(s.id, audio, audio.volume, target, FADE_IN_MS)
    })
    const apply = (s: Sound) => (!s.isPlaying && s.volume > 0 ? { ...s, isPlaying: true } : s)
    soundsRef.current = soundsRef.current.map(apply)
    setSounds(prev => prev.map(apply))
    broadcastMaster(masterRef.current, false)
  }, [getAudio, ensureLoaded, effectiveVolume, startFade])

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
      icon: '🎵',
      volume: 50,
      isPlaying: false,
      file: fileUrl,
      isCustom: true,
    }

    setSounds(prev => [...prev, newSound])
    return true
  }, [])

  const removeCustomSound = useCallback((id: string) => {
    const prevTimer = fadeTimersRef.current.get(id)
    if (prevTimer) { clearInterval(prevTimer); fadeTimersRef.current.delete(id) }
    genRef.current.delete(id)
    loadedSrcRef.current.delete(id)
    const audio = audioMapRef.current.get(id)
    if (audio) {
      audio.pause()
      audio.src = ''
      audioMapRef.current.delete(id)
    }

    setSounds(prev => prev.filter(s => s.id !== id))

    // Delete from IndexedDB
    deleteCustomSound(id).catch(() => {})
  }, [])

  return (
    <AudioContext.Provider value={{
      sounds,
      ambientMaster,
      toggleSound,
      setVolume,
      setAmbientMaster,
      applyMix,
      muteAll,
      unmuteAll,
      addCustomSound,
      removeCustomSound,
    }}>
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
