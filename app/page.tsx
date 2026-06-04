'use client'

import { useState, useEffect, useCallback } from 'react'
import { t } from '@/lib/i18n'
import Landing from '@/components/Landing'
import ScenePicker from '@/components/ScenePicker'
import VideoBackground from '@/components/VideoBackground'
import FocusView from '@/components/FocusView'
import { Scene, SCENES } from '@/components/SceneSelector'
import { AudioProvider } from '@/contexts/AudioContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import { initLocale } from '@/lib/i18n'

type AppStep = 'landing' | 'picker' | 'focus'

// 主页面
function AppInner() {
  const [step, setStep] = useState<AppStep>('landing')
  const [displayedStep, setDisplayedStep] = useState<AppStep>('landing')
  const [pageTransitioning, setPageTransitioning] = useState(false)
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  const [videoTransitioning, setVideoTransitioning] = useState(false)

  // First-use onboarding
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null) // null = not showing, 0/1/2 = step index

  useEffect(() => {
    try {
      if (!localStorage.getItem('focus-room-onboarded')) {
        setOnboardingStep(0)
      }
    } catch {}
  }, [])

  const handleOnboardingNext = useCallback(() => {
    setOnboardingStep(prev => {
      if (prev === null || prev >= 2) return null
      return prev + 1
    })
  }, [])

  const handleOnboardingFinish = useCallback(() => {
    try { localStorage.setItem('focus-room-onboarded', '1') } catch {}
    setOnboardingStep(null)
  }, [])

  const currentScene = SCENES.find(s => s.id === sceneId) || SCENES[0]

  useEffect(() => { initLocale() }, [])

  // 切换场景时加过渡（视频交叉淡入淡出）
  const handleChangeScene = useCallback((scene: Scene) => {
    if (scene.id === sceneId) return
    setVideoTransitioning(true)
    setTimeout(() => {
      setSceneId(scene.id)
      setTimeout(() => setVideoTransitioning(false), 100)
    }, 300)
  }, [sceneId])

  // 页面步骤切换过渡（内容淡入淡出）
  const setStepWithTransition = useCallback((next: AppStep) => {
    if (next === step) return
    setPageTransitioning(true)
    setTimeout(() => {
      setDisplayedStep(next)
      setStep(next)
      setTimeout(() => setPageTransitioning(false), 100)
    }, 250)
  }, [step])

  const handleLandingStart = useCallback(() => setStepWithTransition('picker'), [setStepWithTransition])
  const handlePickerBack = useCallback(() => setStepWithTransition('landing'), [setStepWithTransition])
  const handlePickerEnter = useCallback((scene: Scene) => {
    handleChangeScene(scene)
    setTimeout(() => setStepWithTransition('focus'), 100)
  }, [handleChangeScene, setStepWithTransition])
  const handleBackToPicker = useCallback(() => setStepWithTransition('picker'), [setStepWithTransition])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 永远挂载的视频背景 — 不随页面切换卸载，始终可见 */}
      <div className="absolute inset-0">
        <VideoBackground scene={sceneId} />
      </div>

      {/* 页面内容 — 在视频之上，随页面切换淡入淡出 */}
      <div
        className="absolute inset-0"
        style={{ transition: 'opacity 0.25s ease-in-out', opacity: pageTransitioning ? 0 : 1 }}
      >
        {displayedStep === 'landing' && (
          <Landing onStart={handleLandingStart} />
        )}

        {displayedStep === 'picker' && (
          <ScenePicker
            currentSceneId={sceneId}
            onSelectScene={handleChangeScene}
            onBack={handlePickerBack}
            onEnter={() => {
              setStepWithTransition('focus')
            }}
          />
        )}

        {displayedStep === 'focus' && (
          <FocusView
            currentScene={currentScene}
            onChangeScene={handleChangeScene}
            onBackToPicker={handleBackToPicker}
          />
        )}
      </div>

      {/* First-use onboarding overlay — only show in focus view */}
      {onboardingStep !== null && step === 'focus' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60" />
          <div className="glass-strong rounded-3xl p-8 w-[360px] relative animate-scale-in text-center">
            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === onboardingStep ? 'bg-white/80 w-6' : i < onboardingStep ? 'bg-white/40' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>

            {/* Step content */}
            <div className="mb-2 text-4xl">
              {onboardingStep === 0 ? '🎬' : onboardingStep === 1 ? '🎵' : '⏱'}
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {onboardingStep === 0
                ? t('onboard.step1')
                : onboardingStep === 1
                ? t('onboard.step2')
                : t('onboard.step3')}
            </h3>
            <p className="text-sm text-white/50 mb-8">
              {onboardingStep === 0
                ? t('onboard.step1desc')
                : onboardingStep === 1
                ? t('onboard.step2desc')
                : t('onboard.step3desc')}
            </p>

            {/* Action button */}
            {onboardingStep < 2 ? (
              <button
                onClick={handleOnboardingNext}
                className="w-full py-3 rounded-xl bg-white/[0.12] text-white/90 font-medium hover:bg-white/[0.18] transition-all duration-200"
              >
                {t('onboard.next')}
              </button>
            ) : (
              <button
                onClick={handleOnboardingFinish}
                className="w-full py-3 rounded-xl bg-white/[0.2] text-white font-medium hover:bg-white/[0.28] transition-all duration-200"
              >
                {t('onboard.start')}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <AudioProvider>
        <AppInner />
      </AudioProvider>
    </ErrorBoundary>
  )
}
