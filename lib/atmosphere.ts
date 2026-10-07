// lib/atmosphere.ts
// 环境视觉调节：遮光度 / 背景虚化 / 护眼暖色
// 通过 CSS 变量作用到视频背景层：filter: brightness() blur() sepia()

import { storageGet, storageSet } from './storage'

export interface Atmosphere {
  /** 遮光度，20~100（%），越低越暗 */
  brightness: number
  /** 背景虚化，0~16（px） */
  blur: number
  /** 护眼暖色，0~40（%） */
  warmth: number
}

export const DEFAULT_ATMOSPHERE: Atmosphere = {
  brightness: 100,
  blur: 0,
  warmth: 0,
}

const KEY = 'focus-room-atmosphere'

export function loadAtmosphere(): Atmosphere {
  if (typeof window === 'undefined') return DEFAULT_ATMOSPHERE
  const saved = storageGet<Partial<Atmosphere> | null>(KEY, null)
  if (!saved) return DEFAULT_ATMOSPHERE
  const clamp = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === 'number' && isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
  return {
    brightness: clamp(saved.brightness, 20, 100, DEFAULT_ATMOSPHERE.brightness),
    blur: clamp(saved.blur, 0, 16, DEFAULT_ATMOSPHERE.blur),
    warmth: clamp(saved.warmth, 0, 40, DEFAULT_ATMOSPHERE.warmth),
  }
}

export function saveAtmosphere(a: Atmosphere) {
  storageSet(KEY, a)
  applyAtmosphereCss(a)
}

/** 把当前氛围写入 CSS 变量（全站生效，作用于视频背景层） */
export function applyAtmosphereCss(a: Atmosphere) {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  root.setProperty('--bg-brightness', `${a.brightness}%`)
  root.setProperty('--bg-blur', `${a.blur}px`)
  root.setProperty('--bg-warmth', `${a.warmth / 100}`)
}
