'use client'

import { useState, useRef, useEffect } from 'react'
import { SCENES, SCENE_GRADIENTS } from './SceneSelector'
import { t } from '@/lib/i18n'

interface Props {
  scene: string
  videoSrc?: string
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/focus-room'

const VIDEO_SOURCES: Record<string, string> = {
  'landing': BASE_PATH + '/videos/landing-bg.mp4',
  'mountain-lake': BASE_PATH + '/videos/mountain-lake.mp4',
  'seaside': BASE_PATH + '/videos/seaside.mp4',
  'forest': BASE_PATH + '/videos/forest.mp4',
  'starry-sky': BASE_PATH + '/videos/starry-sky.mp4',
  'rainy-cafe': BASE_PATH + '/videos/rainy-cafe.mp4',
  'snowy-window': BASE_PATH + '/videos/snowy-window.mp4',
  'campfire': BASE_PATH + '/videos/campfire.mp4',
  'city-night': BASE_PATH + '/videos/city-night.mp4',
  'starry-tent': BASE_PATH + '/videos/starry-tent.mp4',
  'study-desk': BASE_PATH + '/videos/study-desk.mp4',
  'milky-way': BASE_PATH + '/videos/milky-way.mp4',
  'mountain-stream': BASE_PATH + '/videos/mountain-stream.mp4',
}

// 导出供 ShareCard 海报合成复用
export const POSTER_SOURCES: Record<string, string> = {
  'landing': BASE_PATH + '/posters/landing.jpg',
  'mountain-lake': BASE_PATH + '/posters/mountain-lake.jpg',
  'seaside': BASE_PATH + '/posters/seaside.jpg',
  'forest': BASE_PATH + '/posters/forest.jpg',
  'starry-sky': BASE_PATH + '/posters/starry-sky.jpg',
  'rainy-cafe': BASE_PATH + '/posters/rainy-cafe.jpg',
  'snowy-window': BASE_PATH + '/posters/snowy-window.jpg',
  'campfire': BASE_PATH + '/posters/campfire.jpg',
  'city-night': BASE_PATH + '/posters/city-night.jpg',
  'starry-tent': BASE_PATH + '/posters/starry-tent.jpg',
  'study-desk': BASE_PATH + '/posters/study-desk.jpg',
  'milky-way': BASE_PATH + '/posters/milky-way.jpg',
  'mountain-stream': BASE_PATH + '/posters/mountain-stream.jpg',
}

function getNextSceneId(currentScene: string): string {
  const idx = SCENES.findIndex(s => s.id === currentScene)
  if (idx < 0) return SCENES[0].id
  return SCENES[(idx + 1) % SCENES.length].id
}

function isSaveDataEnabled(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as unknown as { connection?: { saveData?: boolean } }
  return Boolean(nav.connection?.saveData)
}

export default function VideoBackground({ scene, videoSrc }: Props) {
  const resolvedSrc = videoSrc || VIDEO_SOURCES[scene] || ''
  const currentPoster = POSTER_SOURCES[scene] || POSTER_SOURCES['mountain-lake']
  const nextSceneId = getNextSceneId(scene)
  const nextPoster = POSTER_SOURCES[nextSceneId]

  const videoARef = useRef<HTMLVideoElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)
  const preloadRef = useRef<HTMLVideoElement>(null)
  const activeRef = useRef<'A' | 'B'>('A')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retryKey, setRetryKey] = useState(0)
  const versionRef = useRef(0)
  const crossfadingRef = useRef(false)
  const crossfadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Map: which video element is "current" vs "next"
  const [activeOpacity, setActiveOpacity] = useState<'A' | 'B'>('A')

  // Track previous scene and retryKey to reset loading states synchronously during render
  const [prevTrack, setPrevTrack] = useState({ scene, retryKey })
  if (prevTrack.scene !== scene || prevTrack.retryKey !== retryKey) {
    setPrevTrack({ scene, retryKey })
    setLoaded(false)
    setError(false)
    setLoading(true)
    setActiveOpacity('A')
  }

  useEffect(() => {
    const version = ++versionRef.current
    crossfadingRef.current = false
    activeRef.current = 'A'

    const src = resolvedSrc
    const videoA = videoARef.current
    const videoB = videoBRef.current
    if (!videoA || !videoB) return

    // 只加载 videoA；videoB 在交叉淡入前才按需加载，避免重复下载
    videoA.loop = false
    videoB.loop = false
    videoA.src = src
    videoA.load()
    // 清空 videoB 防止旧场景残留
    videoB.removeAttribute('src')
    videoB.load()

    const handleCanPlay = () => {
      if (version !== versionRef.current) return
      videoA.play().catch(() => {})
      setLoaded(true)
      // 短暂延迟后隐藏加载状态，让过渡更平滑
      setTimeout(() => setLoading(false), 300)
    }

    const handleError = () => {
      if (version !== versionRef.current) return
      setError(true)
      setLoading(false)
    }

    videoA.addEventListener('canplay', handleCanPlay, { once: true })
    videoA.addEventListener('error', handleError, { once: true })
    return () => {
      videoA.removeEventListener('canplay', handleCanPlay)
      videoA.removeEventListener('error', handleError)
    }
  }, [scene, retryKey, resolvedSrc])

  // 看门狗：页面可见但背景视频被暂停（切后台返回 / 浏览器省电干预 / 面板遮挡）
  // 时就恢复。5 秒一轮 + visibilitychange 即时触发，双保险。
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== 'visible') return
      const active = activeRef.current === 'A' ? videoARef.current : videoBRef.current
      if (active && active.readyState >= 2 && active.paused && !crossfadingRef.current) {
        active.play().catch(() => {})
      }
    }
    const iv = setInterval(resume, 5000)
    document.addEventListener('visibilitychange', resume)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [])

  // Crossfade logic: when current video nears the end, start the next one
  useEffect(() => {
    const videoA = videoARef.current
    const videoB = videoBRef.current
    if (!videoA || !videoB) return

    let preloadTriggered = false

    const checkTime = () => {
      if (crossfadingRef.current) return
      const current = activeRef.current === 'A' ? videoA : videoB
      const next = activeRef.current === 'A' ? videoB : videoA
      if (!current.duration || !isFinite(current.duration)) return

      // 短视频（≤12s）：预加载还没就绪就得换轨，A/B 交叉淡入必然产生
      // "切到黑帧/暂停"竞态（真实事故：篝火场景卡死在黑帧）。这类视频
      // 直接交给原生 loop 无缝循环，彻底跳过换轨。
      if (current.duration <= 12) {
        if (!current.loop) {
          current.loop = true
          if (current.paused) current.play().catch(() => {})
        }
        return
      }

      // 当前视频剩约 10 秒时才触发完整加载以保住 A/B 交叉淡入（设置 src 并开始预载）
      const preloadLeadTime = Math.max(0, current.duration - 10)
      if (!preloadTriggered && current.currentTime >= preloadLeadTime) {
        preloadTriggered = true
        if (!next.src || next.src === 'about:blank') {
          next.src = resolvedSrc
        }
        next.preload = 'auto'
        next.load()
      }

      // Start crossfade 1.5 seconds before end — 仅当备轨已可流畅播放
      // （readyState≥3），否则就地重绕当前轨兜底，绝不切到未就绪的黑帧
      if (current.currentTime >= current.duration - 1.5) {
        if (next.readyState < 3) {
          current.currentTime = 0
          return
        }
        crossfadingRef.current = true
        // 确保 next 有 src（短视频可能未触发 preload）
        if (!next.src || next.src === 'about:blank') {
          next.src = resolvedSrc
        }
        next.currentTime = 0
        next.play().catch(() => {})

        // Swap active pointer
        const newActive = activeRef.current === 'A' ? 'B' : 'A'
        activeRef.current = newActive
        setActiveOpacity(newActive)

        // After crossfade completes, pause the old one
        crossfadeTimeoutRef.current = setTimeout(() => {
          const old = newActive === 'A' ? videoB : videoA
          old.pause()
          old.currentTime = 0
          crossfadingRef.current = false
        }, 1500)
      }
    }

    const interval = setInterval(checkTime, 250)
    return () => {
      clearInterval(interval)
      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current)
        crossfadeTimeoutRef.current = null
      }
    }
  }, [scene, resolvedSrc])

  // 保留第三条 video 轨：降级为 preload="metadata" + poster 封面；并在开启 saveData 时跳过
  useEffect(() => {
    if (isSaveDataEnabled()) return

    const preloadVideo = preloadRef.current
    if (!preloadVideo) return

    const nextSrc = VIDEO_SOURCES[nextSceneId]
    if (!nextSrc) return

    preloadVideo.src = nextSrc
    preloadVideo.preload = 'metadata'
    preloadVideo.load()

    return () => {
      preloadVideo.removeAttribute('src')
      preloadVideo.load()
    }
  }, [nextSceneId])

  const gradient = SCENE_GRADIENTS[scene] || SCENE_GRADIENTS['mountain-lake']

  if (error) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: gradient }}>
        <button onClick={() => { setError(false); setRetryKey(k => k + 1) }}
          className="glass rounded-full px-6 py-3 text-sm text-white/70 hover:text-white active:scale-95 transition-all">
          {t('video.retry') || '重新加载'}
        </button>
      </div>
    )
  }

  return (
    <>
      {/* 渐变背景层 — 始终在最底部，加载期间可见 */}
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-1000"
        style={{
          background: gradient,
          opacity: loaded ? 0 : 1,
        }}
      />

      {/* 视频层 — videoA 预加载当前场景，videoB 仅在交叉淡入时按需加载；滤镜变量由 lib/atmosphere 控制 */}
      <video
        ref={videoARef}
        muted
        playsInline
        preload="auto"
        poster={currentPoster}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          activeOpacity === 'A' && loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ filter: 'brightness(var(--bg-brightness, 100%)) blur(var(--bg-blur, 0px)) sepia(var(--bg-warmth, 0))' }}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="none"
        poster={currentPoster}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          activeOpacity === 'B' && loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ filter: 'brightness(var(--bg-brightness, 100%)) blur(var(--bg-blur, 0px)) sepia(var(--bg-warmth, 0))' }}
      />

      {/* 加载指示器 — 呼吸光圈 + 微光扫描 */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {/* 微光扫描效果 */}
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            {/* 呼吸光圈 */}
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                  animation: 'breathe 2s ease-in-out infinite',
                }}
              />
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                  animation: 'breathe 2s ease-in-out infinite 0.3s',
                }}
              />
              <div
                className="absolute inset-4 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
                  animation: 'breathe 2s ease-in-out infinite 0.6s',
                }}
              />
            </div>
            {/* 加载文字 */}
            <span className="text-xs text-white/30 tracking-[0.2em] uppercase">
              Loading
            </span>
          </div>
        </div>
      )}

      {/* 保留第三条 video 轨：降级为 preload="metadata" + poster 封面 */}
      <video
        ref={preloadRef}
        muted
        playsInline
        preload="metadata"
        poster={nextPoster}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </>
  )
}
