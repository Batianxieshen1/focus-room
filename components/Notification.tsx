'use client'

import { useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'
import { storageGet } from '@/lib/storage'
import { KEYS } from '@/lib/storageKeys'

interface Props {
  trigger: boolean
}

let sharedCtx: (AudioContext | null) = null

function getSharedContext(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      sharedCtx = new AudioCtx()
    }
    return sharedCtx
  } catch {
    return null
  }
}

// Chrome 的自动播放策略：无近期用户手势时创建的 AudioContext 处于 suspended。
// 在首次手势时就创建并 resume，铃响时才有发声资格。
function unlockAudio() {
  const ctx = getSharedContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

function playNotification() {
  try {
    const ctx = getSharedContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const playBeep = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration)
      osc.start(time)
      osc.stop(time + duration)
    }
    const now = ctx.currentTime
    playBeep(now, 800, 0.15)
    playBeep(now + 0.2, 1000, 0.15)
    playBeep(now + 0.4, 1200, 0.3)

    // Close the context after all beeps finish
    setTimeout(() => {
      if (sharedCtx && sharedCtx.state !== 'closed') {
        sharedCtx.close().catch(() => {})
        sharedCtx = null
      }
    }, 800)
  } catch {}
}

function sendBrowserNotification() {
  if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
    new window.Notification('Focus Room', {
      body: t('notify.pomodoroDone'),
      icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? '/focus-room'}/icon-192.png`,
      silent: true,
    })
  }
}

export default function Notification({ trigger }: Props) {
  const prevTrigger = useRef(false)

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      const settings = storageGet<{ soundEnabled?: boolean } | null>(KEYS.settings, null)
      const soundEnabled = settings?.soundEnabled !== false
      if (soundEnabled) playNotification()
      sendBrowserNotification()
    }
    prevTrigger.current = trigger
  }, [trigger])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      const requestPermission = () => {
        window.Notification.requestPermission()
        document.removeEventListener('click', requestPermission)
      }
      document.addEventListener('click', requestPermission, { once: true })
      return () => document.removeEventListener('click', requestPermission)
    }
  }, [])

  // 无论通知权限状态如何，都在首次手势时解锁 Web Audio（保证番茄钟铃能响）
  useEffect(() => {
    const unlock = () => unlockAudio()
    document.addEventListener('pointerdown', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  return null
}
