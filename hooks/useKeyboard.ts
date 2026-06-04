'use client'

import { useEffect, useRef } from 'react'

interface Props {
  onToggle: () => void
  onReset: () => void
  onModeChange: (mode: 'pomodoro' | 'stopwatch' | 'countdown') => void
  onMuteToggle: () => void
}

export function useKeyboard({ onToggle, onReset, onModeChange, onMuteToggle }: Props) {
  const callbacksRef = useRef({ onToggle, onReset, onModeChange, onMuteToggle })
  callbacksRef.current = { onToggle, onReset, onModeChange, onMuteToggle }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框、文本域、可编辑元素中的按键
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return

      const { onToggle, onReset, onModeChange, onMuteToggle } = callbacksRef.current

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          onToggle()
          break
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            onReset()
          }
          break
        case 'Digit1':
          onModeChange('pomodoro')
          break
        case 'Digit2':
          onModeChange('stopwatch')
          break
        case 'Digit3':
          onModeChange('countdown')
          break
        case 'KeyM':
          onMuteToggle()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
