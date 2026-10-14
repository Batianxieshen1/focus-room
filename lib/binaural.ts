// lib/binaural.ts
// 双耳节拍发生器：左右耳各播放一个略有频率差的纯音，大脑感知到差频
// （如左 180Hz / 右 190Hz → 感知 10Hz α 波）。纯 Web Audio 合成，零素材。
// 注意：必须佩戴耳机才能产生节拍效果。

import { storageGet } from './storage'
import { KEYS } from '@/lib/storageKeys'
import { EV } from '@/lib/events'

type Band = 'delta' | 'theta' | 'alpha' | 'beta'

export const BINAURAL_BANDS: Record<Band, { beat: number; base: number }> = {
  delta: { beat: 2, base: 120 },  // 深睡
  theta: { beat: 6, base: 150 },  // 冥想
  alpha: { beat: 10, base: 180 }, // 放松
  beta: { beat: 18, base: 220 },  // 专注
}

interface BinauralState {
  ctx: AudioContext | null
  left: OscillatorNode | null
  right: OscillatorNode | null
  gain: GainNode | null
  running: boolean
  band: Band
  volume: number // 0 ~ 1
  masterVolume: number // 0 ~ 1
  isMuted: boolean
}

const state: BinauralState = {
  ctx: null,
  left: null,
  right: null,
  gain: null,
  running: false,
  band: 'alpha',
  volume: 0.3,
  masterVolume: 1,
  isMuted: false,
}

function teardown() {
  try {
    state.left?.stop()
    state.right?.stop()
  } catch {}
  state.left = null
  state.right = null
}

/** 应用当前状态到音频图（带 0.3s 淡入淡出防爆音） */
function apply() {
  if (!state.ctx || !state.gain) return
  const t = state.ctx.currentTime
  const masterFactor = state.isMuted ? 0 : state.masterVolume
  const target = state.running ? state.volume * masterFactor : 0
  state.gain.gain.cancelScheduledValues(t)
  state.gain.gain.setValueAtTime(state.gain.gain.value, t)
  state.gain.gain.linearRampToValueAtTime(target, t + 0.3)

  const { beat, base } = BINAURAL_BANDS[state.band]
  try {
    state.left?.frequency.setTargetAtTime(base, t, 0.05)
    state.right?.frequency.setTargetAtTime(base + beat, t, 0.05)
  } catch {}
}

/** 开关 / 切换频段 / 调音量。on 时如果 AudioContext 未初始化则创建（浏览器允许：调用源自用户手势） */
export function setBinaural(opts: { on?: boolean; band?: Band; volume?: number }) {
  if (opts.band !== undefined) {
    state.band = opts.band
    if (state.running) apply()
  }
  if (opts.volume !== undefined) {
    state.volume = Math.min(0.5, Math.max(0, opts.volume))
    if (state.running) apply()
  }
  if (opts.on === undefined) return
  if (opts.on) {
    bindBinauralListeners()
    if (!state.ctx) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        state.ctx = new Ctx()
      } catch {
        return
      }
      state.gain = state.ctx.createGain()
      state.gain.gain.value = 0
      state.gain.connect(state.ctx.destination)
    }
    if (state.ctx.state === 'suspended') state.ctx.resume().catch(() => {})

    if (!state.left || !state.right) {
      const { beat, base } = BINAURAL_BANDS[state.band]
      const mk = (freq: number, pan: number) => {
        const osc = state.ctx!.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const panner = state.ctx!.createStereoPanner()
        panner.pan.value = pan
        osc.connect(panner)
        panner.connect(state.gain!)
        osc.start()
        return osc
      }
      state.left = mk(base, -1)
      state.right = mk(base + beat, 1)
    }
    state.running = true
    apply()
  } else {
    state.running = false
    apply()
    // 淡出完成后停振荡器，省电
    setTimeout(() => {
      if (!state.running) teardown()
    }, 400)
  }
}

export function isBinauralRunning(): boolean {
  return state.running
}

let listenersBound = false

/** 绑定全局监听器：Master 音量、全局静音与睡眠定时 */
export function bindBinauralListeners() {
  if (typeof window === 'undefined' || listenersBound) return
  listenersBound = true

  // 读取初始 master 音量
  const initialMaster = storageGet<number>(KEYS.ambientMaster, 100)
  if (typeof initialMaster === 'number') {
    state.masterVolume = Math.min(1, Math.max(0, initialMaster / 100))
  }

  // 睡眠定时到点时一并静音双耳节拍
  window.addEventListener(EV.sleepExpired, () => setBinaural({ on: false }))

  // 监听全局 Master 音量与静音广播
  window.addEventListener(EV.master, (e: Event) => {
    const detail = (e as CustomEvent<{ volume?: number; isMuted?: boolean }>).detail
    if (!detail) return
    if (typeof detail.volume === 'number') {
      state.masterVolume = Math.min(1, Math.max(0, detail.volume / 100))
    }
    if (typeof detail.isMuted === 'boolean') {
      state.isMuted = detail.isMuted
    }
    if (state.running) apply()
  })
}

/** 兼容旧接口别名 */
export const bindBinauralSleepTimer = bindBinauralListeners
