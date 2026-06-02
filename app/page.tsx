'use client'

import { useState, useEffect } from 'react'
import ControlPanel from '@/components/ControlPanel'
import VideoBackground from '@/components/VideoBackground'
import { Scene, SCENES } from '@/components/SceneSelector'
import { AudioProvider } from '@/contexts/AudioContext'
import ShortcutToast from '@/components/ShortcutToast'
import { initLocale } from '@/lib/i18n'
import { getTheme, applyThemeClass } from '@/lib/theme'

export default function Home() {
  const [currentScene, setCurrentScene] = useState<Scene>(SCENES[0])
  const [localeReady, setLocaleReady] = useState(false)

  useEffect(() => {
    initLocale()
    applyThemeClass(getTheme())
    setLocaleReady(true)
  }, [])

  return (
    <AudioProvider>
      <main className="relative w-screen h-screen overflow-hidden bg-black">
        {/* 视频背景 */}
        <VideoBackground scene={currentScene.id} />

        {/* 暗角效果 */}
        <div className="absolute inset-0 overlay-vignette pointer-events-none" />

        {/* 底部渐变 */}
        <div className="absolute inset-x-0 bottom-0 h-48 overlay-bottom pointer-events-none" />

        {/* 控制面板 */}
        <ControlPanel
          currentScene={currentScene.id}
          onSceneChange={setCurrentScene}
        />

        {/* 快捷键提示 */}
        <ShortcutToast />
      </main>
    </AudioProvider>
  )
}
