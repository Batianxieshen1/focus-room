'use client'

import { useEffect, useRef, useCallback } from 'react'
import { t } from '@/lib/i18n'

interface Props {
  trigger: boolean
}

let sharedCtx: (AudioContext | null) = null

function getSharedContext(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return sharedCtx
  } catch {
    return null
  }
}

export default function Notification({ trigger }: Props) {
  const prevTrigger = useRef(false)

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      playNotification()
      sendBrowserNotification()
    }
    prevTrigger.current = trigger
  }, [trigger])

  const playNotification = useCallback(() => {
    try {
      const ctx = getSharedContext()
      if (!ctx) return

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
  }, [])

  const sendBrowserNotification = useCallback(() => {
    const w = window as any
    if ('Notification' in w && w.Notification.permission === 'granted') {
      new w.Notification('Focus Room', {
        body: t('notify.pomodoroDone'),
        icon: '/icon-192.png',
        silent: true,
      })
    }
  }, [])

  useEffect(() => {
    const w = window as any
    if ('Notification' in w && w.Notification.permission === 'default') {
      const requestPermission = () => {
        w.Notification.requestPermission()
        document.removeEventListener('click', requestPermission)
      }
      document.addEventListener('click', requestPermission, { once: true })
      return () => document.removeEventListener('click', requestPermission)
    }
  }, [])

  return null
}
