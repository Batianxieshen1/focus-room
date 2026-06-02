'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export function useFocusMode() {
  const [isHidden, setIsHidden] = useState(false)
  const lastClickTimeRef = useRef(0)
  const isHiddenRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    isHiddenRef.current = isHidden
  }, [isHidden])

  useEffect(() => {
    const handleClick = (_e: MouseEvent) => {
      const now = Date.now()
      if (now - lastClickTimeRef.current < 300) {
        setIsHidden(prev => !prev)
        lastClickTimeRef.current = 0
      } else {
        lastClickTimeRef.current = now
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && isHiddenRef.current) {
        setIsHidden(false)
      }
    }

    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return { isHidden }
}
