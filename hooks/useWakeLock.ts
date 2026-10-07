'use client'

import { useEffect, useRef, useState } from 'react'

// Screen Wake Lock API 的最小结构类型（避免依赖 TS lib 版本是否内置）
interface WakeLockSentinelLike {
  release: () => Promise<void>
  addEventListener: (type: string, listener: () => void) => void
}
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

/**
 * 屏幕防息屏常亮。desired 为 true 时申请 Wake Lock；
 * 切后台时浏览器会自动释放锁，回到前台（visibilitychange）自动重新申请。
 */
export function useWakeLock(desired: boolean): boolean {
  const [active, setActive] = useState(false)
  const lockRef = useRef<WakeLockSentinelLike | null>(null)
  const desiredRef = useRef(desired)

  useEffect(() => { desiredRef.current = desired }, [desired])

  useEffect(() => {
    let cancelled = false

    const request = async () => {
      if (!desiredRef.current || lockRef.current || document.visibilityState !== 'visible') return
      const nav = navigator as WakeLockNavigator
      if (!nav.wakeLock) return
      try {
        const lock = await nav.wakeLock.request('screen')
        if (cancelled) {
          lock.release().catch(() => {})
          return
        }
        lockRef.current = lock
        setActive(true)
        // 浏览器在切后台等情况下自动释放
        lock.addEventListener('release', () => {
          if (lockRef.current === lock) {
            lockRef.current = null
            setActive(false)
          }
        })
      } catch {
        // 用户拒绝或系统不支持：静默降级
      }
    }

    const release = () => {
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
      setActive(false)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') request()
    }

    if (desired) request()
    else release()

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      release()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [desired])

  return active
}
