// lib/mixShare.ts
// 混音配方 URL 分享：?mix={"rain":40,"pageturn":60}
// 借鉴 moodist 的 share-link 模式——把滑块配置编码进 URL，打开链接自动还原

import { storageGet, storageSet } from './storage'

export const MIX_PARAM = 'mix'

/**
 * 页面加载时调用：若 URL 携带 ?mix= 参数，则把配方音量合并进
 * focus-room-volumes 存储，并把参数从地址栏移除（避免刷新重复应用）。
 * 必须在 AudioProvider 初始化音量状态之前执行。
 */
export function applyMixFromURL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get(MIX_PARAM)
    if (!raw) return false

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false

    const mix: Record<string, number> = {}
    let count = 0
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (count >= 32) break // 防御异常超长数据
      if (!/^[a-z0-9-]{1,40}$/i.test(key)) continue
      if (typeof value !== 'number' || !isFinite(value)) continue
      mix[key] = Math.min(100, Math.max(0, value))
      count++
    }
    if (count === 0) return false

    // 合并进现有音量存储（只覆盖配方涉及的音效）
    const stored = storageGet<Record<string, number>>('focus-room-volumes', {})
    const merged = { ...stored, ...mix }
    storageSet('focus-room-volumes', merged)

    // 从地址栏移除参数，保持 URL 干净
    const url = window.location.pathname + window.location.hash
    window.history.replaceState(null, '', url)
    return true
  } catch {
    return false
  }
}

/** 生成当前混音的分享链接（由 SoundMixer 调用） */
export function buildMixShareURL(volumes: Record<string, number>): string {
  const mix: Record<string, number> = {}
  Object.entries(volumes).forEach(([k, v]) => {
    if (v > 0) mix[k] = Math.round(v)
  })
  const base = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    : ''
  return `${base}?${MIX_PARAM}=${encodeURIComponent(JSON.stringify(mix))}`
}
