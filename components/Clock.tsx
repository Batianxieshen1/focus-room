'use client'

import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) return <div className="font-clock text-white/0">--:--</div>

  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')

  const dateStr = time.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="text-center select-none">
      <div className="font-clock text-white drop-shadow-lg">
        {hours}<span className="text-white/50">:</span>{minutes}
      </div>
      <div className="mt-2 text-xs text-white/50 tracking-widest">
        {dateStr}
      </div>
    </div>
  )
}
