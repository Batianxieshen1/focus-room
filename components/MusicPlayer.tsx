'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { t } from '@/lib/i18n'
import { storageGet, storageSet } from '@/lib/storage'
import { formatClock } from '@/lib/format'
import { KEYS } from '@/lib/storageKeys'
import { EV } from '@/lib/events'

/**
 * 内置网易云播放器（Meting 协议）。
 * 数据链路：Meting 兼容 API（云函数自建，见 cloudbase/functions/meting）
 *   → 返回 {name, artist, url, pic}[] → 浏览器直连网易云 CDN 播放。
 * 容错：VIP/下架曲目无 url 或加载失败时自动跳下一曲；全部失败则提示。
 */

interface Track {
  name: string
  artist: string
  url: string
  pic: string
}

// 歌单曲目按歌单 ID 缓存在内存（音频直链带时效 token，绝不持久化）
const trackCache = new Map<string, Track[]>()

const MUSIC_VOLUME_KEY = KEYS.musicVolume

function upgradeHttps(url: string): string {
  return typeof url === 'string' && url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url
}

function parseTracks(data: unknown): Track[] {
  if (!Array.isArray(data)) return []
  const out: Track[] = []
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue
    const rec = item as Record<string, unknown>
    const name = typeof rec.name === 'string' ? rec.name : ''
    const artist = typeof rec.artist === 'string' ? rec.artist : ''
    const url = upgradeHttps(typeof rec.url === 'string' ? rec.url : '')
    const pic = upgradeHttps(typeof rec.pic === 'string' ? rec.pic : '')
    // 无直链的曲目（VIP / 下架）直接过滤，避免播放器卡在空 src 上
    if (!name || !url) continue
    out.push({ name, artist, url, pic })
  }
  return out
}

interface Props {
  playlistId: string
  api: string
  /** 声音面板是否展开（展开时显示完整卡片，收起时显示迷你条） */
  expanded: boolean
  onClear: () => void
}

export default function MusicPlayer({ playlistId, api, expanded, onClear }: Props) {
  const [tracks, setTracks] = useState<Track[]>(() => trackCache.get(playlistId) ?? [])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [volume, setVolumeState] = useState<number>(() => storageGet<number>(MUSIC_VOLUME_KEY, 80))
  const [masterVolume, setMasterVolume] = useState<number>(() => storageGet<number>(KEYS.ambientMaster, 100))
  const [isMasterMuted, setIsMasterMuted] = useState(false)
  const [progress, setProgress] = useState({ cur: 0, dur: 0 })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volRef = useRef(volume)
  const skipCountRef = useRef(0)
  useEffect(() => { volRef.current = volume }, [volume])

  // 监听全局 Master 音量与静音
  useEffect(() => {
    const handleMaster = (e: Event) => {
      const detail = (e as CustomEvent<{ volume?: number; isMuted?: boolean }>).detail
      if (!detail) return
      if (typeof detail.volume === 'number') setMasterVolume(detail.volume)
      if (typeof detail.isMuted === 'boolean') setIsMasterMuted(detail.isMuted)
    }
    window.addEventListener(EV.master, handleMaster)
    return () => window.removeEventListener(EV.master, handleMaster)
  }, [])

  const current = tracks[index] ?? null

  // 渲染期调整状态（React 官方 "Adjusting some state when a prop changes" 模式）
  // 1. 当 playlistId 发生变化时，在渲染期即刻同步缓存状态或预设 loading，避免 effect 异步级联渲染
  const [prevPlaylistId, setPrevPlaylistId] = useState(playlistId)
  if (prevPlaylistId !== playlistId) {
    setPrevPlaylistId(playlistId)
    const cached = trackCache.get(playlistId)
    if (cached) {
      setTracks(cached)
      setLoadError(null)
      setIndex(0)
      setLoading(false)
    } else {
      setLoading(true)
      setLoadError(null)
    }
  }

  // 歌单切换时重置连续失败计数
  useEffect(() => {
    skipCountRef.current = 0
  }, [playlistId])

  // 2. 换曲时在渲染期重置进度条
  const [prevCurrentUrl, setPrevCurrentUrl] = useState<string | null>(current?.url ?? null)
  if (current?.url && prevCurrentUrl !== current.url) {
    setPrevCurrentUrl(current.url)
    setProgress({ cur: 0, dur: 0 })
  }

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio()
      a.preload = 'auto'
      a.volume = volRef.current / 100
      audioRef.current = a
    }
    return audioRef.current
  }, [])

  const showNotice = useCallback((msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 2500)
  }, [])

  // ===== 拉取歌单曲目 =====
  useEffect(() => {
    if (trackCache.has(playlistId)) return

    let cancelled = false
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 15000)

    const sep = api.includes('?') ? '&' : '?'
    fetch(`${api}${sep}type=playlist&id=${encodeURIComponent(playlistId)}`, { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        if (cancelled) return
        const list = parseTracks(data)
        trackCache.set(playlistId, list)
        setTracks(list)
        setIndex(0)
        skipCountRef.current = 0
        if (list.length === 0) setLoadError(t('player.empty'))
      })
      .catch(() => {
        if (!cancelled) setLoadError(t('player.loadFailed'))
      })
      .finally(() => {
        clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      ctrl.abort()
      clearTimeout(timeout)
    }
  }, [api, playlistId])

  // ===== 换曲时切换音频源 =====
  useEffect(() => {
    const a = getAudio()
    if (!current?.url) return
    const target = upgradeHttps(current.url)
    if (a.src !== target) a.src = target
  }, [current, getAudio])

  // ===== 播放/暂停 =====
  useEffect(() => {
    const a = getAudio()
    if (playing && current?.url) {
      a.play().catch(() => {
        // 自动续播被拦截等情况：标记暂停，等待用户手势
        setPlaying(false)
      })
    } else {
      a.pause()
    }
  }, [playing, current, getAudio])

  // ===== 音频事件：结束→下一曲，错误→跳过 =====
  useEffect(() => {
    const a = getAudio()

    const handleEnded = () => {
      // 单曲歌单：直接重播（index 不变时 effect 不会重跑，需手动续播）
      if (tracks.length <= 1) {
        const a = getAudio()
        a.currentTime = 0
        a.play().catch(() => {})
        return
      }
      setIndex(i => (i + 1 < tracks.length ? i + 1 : 0))
    }

    const handleError = () => {
      if (tracks.length === 0) return
      skipCountRef.current += 1
      if (skipCountRef.current >= tracks.length) {
        setPlaying(false)
        showNotice(t('player.allFailed'))
        skipCountRef.current = 0
        return
      }
      showNotice(t('player.trackUnavailable'))
      setIndex(i => (i + 1 < tracks.length ? i + 1 : 0))
    }

    const handleTimeUpdate = () => {
      setProgress({ cur: a.currentTime, dur: isFinite(a.duration) ? a.duration : 0 })
    }

    a.addEventListener('ended', handleEnded)
    a.addEventListener('error', handleError)
    a.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      a.removeEventListener('ended', handleEnded)
      a.removeEventListener('error', handleError)
      a.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [tracks.length, getAudio, showNotice])

  // ===== 音量 =====
  useEffect(() => {
    const a = getAudio()
    const effectiveVol = isMasterMuted ? 0 : (volume / 100) * (masterVolume / 100)
    a.volume = Math.min(1, Math.max(0, effectiveVol))
    storageSet(MUSIC_VOLUME_KEY, volume)
  }, [volume, masterVolume, isMasterMuted, getAudio])

  // ===== Media Session（锁屏 / 通知栏控制）=====
  useEffect(() => {
    const ms = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession
    if (!ms || !current) return
    try {
      ms.metadata = new MediaMetadata({
        title: current.name,
        artist: current.artist,
        album: 'Focus Room',
        artwork: current.pic ? [{ src: current.pic, sizes: '512x512' }] : [],
      })
    } catch {}
  }, [current])

  useEffect(() => {
    const ms = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession
    if (!ms) return
    try {
      ms.setActionHandler('play', () => setPlaying(true))
      ms.setActionHandler('pause', () => setPlaying(false))
      ms.setActionHandler('previoustrack', () => setIndex(i => (i > 0 ? i - 1 : i)))
      ms.setActionHandler('nexttrack', () => setIndex(i => (i + 1 < tracks.length ? i + 1 : i)))
    } catch {}
    return () => {
      try {
        ms.setActionHandler('play', null)
        ms.setActionHandler('pause', null)
        ms.setActionHandler('previoustrack', null)
        ms.setActionHandler('nexttrack', null)
      } catch {}
    }
  }, [tracks.length])

  // ===== 睡眠定时到点暂停 =====
  useEffect(() => {
    const onPause = () => setPlaying(false)
    window.addEventListener(EV.sleepExpired, onPause)
    return () => window.removeEventListener(EV.sleepExpired, onPause)
  }, [])

  // 卸载时停止播放
  useEffect(() => {
    const a = audioRef.current
    return () => { a?.pause() }
  }, [])

  if (!api) return null


  const progressBar = (() => {
    const pct = progress.dur > 0 ? Math.min(100, (progress.cur / progress.dur) * 100) : 0
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-white/35 tabular-nums w-8 text-right">{formatClock(progress.cur)}</span>
        <div className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-amber-400/70 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-white/35 tabular-nums w-8">{progress.dur > 0 ? formatClock(progress.dur) : '--:--'}</span>
      </div>
    )
  })()

  const cover = current?.pic ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={current.pic} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-white/5" />
  ) : (
    <div className="w-14 h-14 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-xl">🎵</div>
  )

  return (
    <>
      {/* ===== 展开态：完整播放卡片（声音面板打开时） ===== */}
      {expanded && (
        <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 z-40 w-[360px] sm:w-[400px] animate-fade-in">
          <div className="flex justify-end mb-1">
            <button
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="px-2 py-1 rounded-md bg-black/60 text-white/60 text-[10px] hover:text-white/90 transition-all"
            >
              {t('player.closePlayer')} ✕
            </button>
          </div>
          <div className="glass-strong rounded-2xl p-4 shadow-lg shadow-black/30 border border-white/[0.08]">
            {loading && (
              <div className="py-8 text-center text-xs text-white/40 animate-pulse">{t('player.loading')}</div>
            )}
            {!loading && loadError && (
              <div className="py-6 text-center text-xs text-white/45">{loadError}</div>
            )}
            {!loading && !loadError && current && (
              <>
                <div className="flex items-center gap-3">
                  {cover}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/90 truncate">{current.name}</div>
                    <div className="text-[11px] text-white/45 truncate">{current.artist}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setIndex(i => (i > 0 ? i - 1 : i))} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-95" aria-label={t('player.prev')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="2" height="16" /></svg>
                    </button>
                    <button onClick={() => setPlaying(p => !p)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.14] text-white hover:bg-white/[0.22] transition-all active:scale-95" aria-label={playing ? t('player.pause') : t('player.play')}>
                      {playing ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21" /></svg>
                      )}
                    </button>
                    <button onClick={() => setIndex(i => (i + 1 < tracks.length ? i + 1 : i))} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-95" aria-label={t('player.next')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,20 15,12 5,4" /><rect x="17" y="4" width="2" height="16" /></svg>
                    </button>
                  </div>
                </div>

                {progressBar}

                {/* 音量 */}
                <div className="flex items-center gap-2 mt-3">
                  <svg className="w-3 h-3 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={e => setVolumeState(Number(e.target.value))}
                    className="flex-1 h-[3px]"
                  />
                  <span className="text-[10px] text-white/35 w-7 text-right tabular-nums">{volume}</span>
                </div>

                {/* 曲目列表 */}
                <div className="mt-3 pt-3 border-t border-white/[0.07] max-h-40 overflow-y-auto scrollbar-thin">
                  {tracks.map((track, i) => (
                    <button
                      key={`${track.name}-${i}`}
                      onClick={() => { skipCountRef.current = 0; setIndex(i); setPlaying(true) }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors duration-150 ${
                        i === index ? 'bg-white/[0.1]' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`text-[10px] tabular-nums w-4 ${i === index ? 'text-amber-300' : 'text-white/25'}`}>{i + 1}</span>
                      <span className={`text-xs truncate flex-1 ${i === index ? 'text-white/90' : 'text-white/55'}`}>{track.name}</span>
                      <span className="text-[10px] text-white/30 truncate max-w-[80px]">{track.artist}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {notice && (
              <div className="mt-2 text-center text-[10px] text-amber-300/80 animate-fade-in">{notice}</div>
            )}
          </div>
        </div>
      )}

      {/* ===== 收起态：迷你播放条 ===== */}
      {!expanded && current && (
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 animate-fade-in">
          <div className="glass-strong rounded-full pl-2 pr-4 py-1.5 flex items-center gap-2 shadow-lg shadow-black/20 border border-white/[0.08]">
            <button
              onClick={() => setPlaying(p => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.1] text-white hover:bg-white/[0.2] transition-all active:scale-95"
              aria-label={playing ? t('player.pause') : t('player.play')}
            >
              {playing ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21" /></svg>
              )}
            </button>
            <div className="flex flex-col min-w-0 max-w-[220px]">
              <span className="text-[11px] text-white/75 truncate leading-tight">🎵 {current.name}</span>
              <span className="text-[9px] text-white/35 truncate leading-tight">{current.artist}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setIndex(i => (i > 0 ? i - 1 : i))} className="w-6 h-6 rounded-full flex items-center justify-center text-white/45 hover:text-white transition-colors" aria-label={t('player.prev')}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="2" height="16" /></svg>
              </button>
              <button onClick={() => setIndex(i => (i + 1 < tracks.length ? i + 1 : i))} className="w-6 h-6 rounded-full flex items-center justify-center text-white/45 hover:text-white transition-colors" aria-label={t('player.next')}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,20 15,12 5,4" /><rect x="17" y="4" width="2" height="16" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
