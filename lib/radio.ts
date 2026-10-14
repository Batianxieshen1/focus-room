// lib/radio.ts
// 24/7 自习电台播放引擎：模块单例，SoundMixer 等 UI 组件只负责渲染与调用。
// 联动：focusroom:master（总音量/静音乘数）、focusroom:sleep-expired（到点停止）
// 状态广播：focusroom:radio 事件（{ stationId, playing, volume }）供 UI 订阅渲染

import { storageGet, storageSet } from './storage'
import { KEYS } from '@/lib/storageKeys'
import { EV } from './events'

interface RadioState {
  stationId: string | null
  playing: boolean
  volume: number // 0~100 电台分轨音量
  masterVolume: number // 0~100 全局母线
  isMuted: boolean
}

const state: RadioState = {
  stationId: null,
  playing: false,
  volume: 75,
  masterVolume: 100,
  isMuted: false,
}

// SSR 安全的初始音量
if (typeof window !== 'undefined') {
  const saved = storageGet<number>(KEYS.radioVolume, 75)
  if (typeof saved === 'number' && saved >= 0 && saved <= 100) state.volume = saved
}

let audio: HTMLAudioElement | null = null
const listeners = new Set<() => void>()
let listenersBound = false

function notify() {
  listeners.forEach(fn => fn())
}

function effectiveVolume() {
  return state.isMuted ? 0 : (state.volume / 100) * (state.masterVolume / 100)
}

function applyVolume() {
  if (audio) audio.volume = Math.min(1, Math.max(0, effectiveVolume()))
}

export interface RadioSnapshot {
  stationId: string | null
  playing: boolean
  volume: number
}

export function getRadioSnapshot(): RadioSnapshot {
  return { stationId: state.stationId, playing: state.playing, volume: state.volume }
}

export function subscribeRadio(fn: () => void): () => void {
  bindGlobalListeners()
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** 启动（或切换到）指定电台；resolve(true) 表示已开始播放 */
export function startRadio(stationId: string, streamUrl: string): Promise<boolean> {
  if (!audio) {
    audio = new Audio()
    // 播放中途流断开（上游下线/网络抖动）→ 广播失败事件供 UI 自动跳台
    audio.addEventListener('error', () => {
      if (state.playing) {
        state.playing = false
        notify()
        dispatchFailed()
      }
    })
  }
  if (state.stationId !== stationId) {
    audio.src = streamUrl
    state.stationId = stationId
  }
  applyVolume()
  return audio.play()
    .then(() => {
      state.playing = true
      notify()
      return true
    })
    .catch(() => {
      state.playing = false
      notify()
      dispatchFailed()
      return false
    })
}

function dispatchFailed() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EV.radioFailed, { detail: { stationId: state.stationId } }))
}

/** 暂停（保留进度与电台选择，可继续播放） */
export function pauseRadio() {
  audio?.pause()
  state.playing = false
  notify()
}

/** 恢复播放当前电台 */
export function resumeRadio() {
  if (!audio || state.playing) return
  applyVolume()
  audio.play()
    .then(() => {
      state.playing = true
      notify()
    })
    .catch(() => {})
}

/** 彻底停止并清理流引用 */
export function stopRadio() {
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
  }
  state.stationId = null
  state.playing = false
  notify()
}

/** 播放/暂停切换（同一电台） */
export function toggleRadioPause() {
  if (state.playing) pauseRadio()
  else resumeRadio()
}

/** 设置电台分轨音量（0~100），随母线与静音动态折算 */
export function setRadioVolume(v: number) {
  state.volume = Math.min(100, Math.max(0, v))
  storageSet(KEYS.radioVolume, state.volume)
  applyVolume()
  notify()
}

function bindGlobalListeners() {
  if (listenersBound) return
  listenersBound = true

  // 全局母线音量 / 静音广播
  window.addEventListener(EV.master, (e: Event) => {
    const detail = (e as CustomEvent<{ volume?: number; isMuted?: boolean }>).detail
    if (!detail) return
    if (typeof detail.volume === 'number') state.masterVolume = Math.min(100, Math.max(0, detail.volume))
    if (typeof detail.isMuted === 'boolean') state.isMuted = detail.isMuted
    applyVolume()
  })

  // 睡眠定时到点：彻底停止电台
  window.addEventListener(EV.sleepExpired, () => stopRadio())
}
