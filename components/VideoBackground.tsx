'use client'

import { useState, useRef, useEffect } from 'react'
import { SCENES, SCENE_GRADIENTS } from './SceneSelector'
import { t } from '@/lib/i18n'

interface Props {
  scene: string
  videoSrc?: string
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

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
}

function getNextSceneId(currentScene: string): string {
  const idx = SCENES.findIndex(s => s.id === currentScene)
  if (idx < 0) return SCENES[0].id
  return SCENES[(idx + 1) % SCENES.length].id
}

export default function VideoBackground({ scene, videoSrc }: Props) {
  const resolvedSrc = videoSrc || VIDEO_SOURCES[scene] || ''
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

  useEffect(() => {
    const version = ++versionRef.current
    setLoaded(false)
    setError(false)
    setLoading(true)
    crossfadingRef.current = false
    activeRef.current = 'A'
    setActiveOpacity('A')

    const src = resolvedSrc
    const videoA = videoARef.current
    const videoB = videoBRef.current
    if (!videoA || !videoB) return

    // 只加载 videoA；videoB 在交叉淡入前才按需加载，避免重复下载
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
  }, [scene, retryKey])

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

      // 提前 5 秒触发下一个视频的预加载（设置 src 并开始下载）
      if (!preloadTriggered && current.currentTime >= current.duration - 5) {
        preloadTriggered = true
        if (!next.src || next.src === 'about:blank') {
          next.src = resolvedSrc
        }
        next.preload = 'auto'
        next.load()
      }

      // Start crossfade 1.5 seconds before end
      if (current.currentTime >= current.duration - 1.5) {
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
  }, [scene])

  // Preload the next scene's video so switching is instant
  useEffect(() => {
    const preloadVideo = preloadRef.current
    if (!preloadVideo) return

    const nextSceneId = getNextSceneId(scene)
    const nextSrc = VIDEO_SOURCES[nextSceneId]
    if (!nextSrc) return

    preloadVideo.src = nextSrc
    preloadVideo.preload = 'auto'
    preloadVideo.load()

    return () => {
      preloadVideo.removeAttribute('src')
      preloadVideo.load()
    }
  }, [scene])

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

      {/* 视频层 — videoA 预加载当前场景，videoB 仅在交叉淡入时按需加载 */}
      <video
        ref={videoARef}
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          activeOpacity === 'A' && loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="none"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          activeOpacity === 'B' && loaded ? 'opacity-100' : 'opacity-0'
        }`}
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

      {/* Hidden preload video for the next scene */}
      <video
        ref={preloadRef}
        muted
        playsInline
        preload="auto"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </>
  )
}
