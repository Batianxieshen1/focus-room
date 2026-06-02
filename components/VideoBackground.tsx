'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  scene: string
}

const VIDEO_SOURCES: Record<string, string> = {
  rain: (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/videos/rain.mp4',
  forest: (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/videos/forest.mp4',
  ocean: (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/videos/ocean.mp4',
}

export default function VideoBackground({ scene }: Props) {
  const videoARef = useRef<HTMLVideoElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)
  const activeRef = useRef<'A' | 'B'>('A')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const versionRef = useRef(0)
  const crossfadingRef = useRef(false)

  // Map: which video element is "current" vs "next"
  const [activeOpacity, setActiveOpacity] = useState<'A' | 'B'>('A')

  useEffect(() => {
    const version = ++versionRef.current
    setLoaded(false)
    setError(false)
    crossfadingRef.current = false
    activeRef.current = 'A'
    setActiveOpacity('A')

    const src = VIDEO_SOURCES[scene] || ''
    const videoA = videoARef.current
    const videoB = videoBRef.current
    if (!videoA || !videoB) return

    // Reset both
    videoA.src = src
    videoB.src = src
    videoA.load()
    videoB.load()

    const handleCanPlay = () => {
      if (version !== versionRef.current) return
      videoA.play().catch(() => {})
      setLoaded(true)
    }

    const handleError = () => {
      if (version !== versionRef.current) return
      setError(true)
    }

    videoA.addEventListener('canplay', handleCanPlay, { once: true })
    videoA.addEventListener('error', handleError, { once: true })
    return () => {
      videoA.removeEventListener('canplay', handleCanPlay)
      videoA.removeEventListener('error', handleError)
    }
  }, [scene])

  // Crossfade logic: when current video nears the end, start the next one
  useEffect(() => {
    const videoA = videoARef.current
    const videoB = videoBRef.current
    if (!videoA || !videoB) return

    const checkTime = () => {
      if (crossfadingRef.current) return
      const current = activeRef.current === 'A' ? videoA : videoB
      const next = activeRef.current === 'A' ? videoB : videoA
      if (!current.duration || !isFinite(current.duration)) return

      // Start crossfade 1.5 seconds before end
      if (current.currentTime >= current.duration - 1.5) {
        crossfadingRef.current = true
        // Start next video from beginning
        next.currentTime = 0
        next.play().catch(() => {})

        // Swap active pointer
        const newActive = activeRef.current === 'A' ? 'B' : 'A'
        activeRef.current = newActive
        setActiveOpacity(newActive)

        // After crossfade completes, pause the old one
        setTimeout(() => {
          const old = newActive === 'A' ? videoB : videoA
          old.pause()
          old.currentTime = 0
          crossfadingRef.current = false
        }, 1500)
      }
    }

    const interval = setInterval(checkTime, 250)
    return () => clearInterval(interval)
  }, [scene])

  if (error) {
    return (
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0d1520 100%)',
        }}
      />
    )
  }

  return (
    <>
      <video
        ref={videoARef}
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          activeOpacity === 'A' && loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          activeOpacity === 'B' && loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  )
}
