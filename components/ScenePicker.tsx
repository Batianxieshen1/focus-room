'use client'

import { useState } from 'react'
import { Scene, SCENES, SCENE_GRADIENTS } from '@/components/SceneSelector'
import { t } from '@/lib/i18n'

interface Props {
  currentSceneId: string
  onSelectScene: (scene: Scene) => void
  onBack: () => void
  onEnter: () => void
}

export default function ScenePicker({ currentSceneId, onSelectScene, onBack, onEnter }: Props) {
  const [entering, setEntering] = useState(false)
  const selectedScene = SCENES.find((s) => s.id === currentSceneId) || SCENES[0]

  const handleSelect = (id: string) => {
    if (id === currentSceneId) return
    const scene = SCENES.find(s => s.id === id)
    if (scene) onSelectScene(scene)
  }

  const handleEnter = () => {
    setEntering(true)
    setTimeout(() => onEnter(), 300)
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col text-white">
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30 scene-picker-overlay pointer-events-none" />

      {/* Subtle noise overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          <span>←</span>
          <span>{t('picker.backToCover')}</span>
        </button>

        <h1
          className="text-[10px] tracking-[0.2em] uppercase text-white/60 font-medium sm:text-xs sm:tracking-[0.3em]"
          style={{ letterSpacing: '0.3em' }}
        >
          CHOOSE YOUR WINDOW
        </h1>

        <button className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
          <span>🎵</span>
          <span>{t('picker.music')}</span>
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col flex-1 overflow-hidden sm:flex-row sm:overflow-hidden">
        {/* Left side - text content (hidden on mobile, shown on sm+) */}
        <div className="hidden sm:flex sm:w-1/2 sm:flex-col sm:justify-center sm:px-16 animate-[fadeInUp_0.6s_ease-out]">
          <p className="text-xs tracking-[0.2em] uppercase text-white/50 mb-6 font-medium">
            {t('picker.step02')}
          </p>

          <h2
            className="text-4xl leading-tight font-extralight mb-6 whitespace-pre-line"
            style={{ fontWeight: 200 }}
          >
            {t('picker.findPlace')}
          </h2>

          <p className="text-base text-white/50 leading-relaxed max-w-md">
            {t('picker.sceneTip')}
          </p>
        </div>

        {/* Mobile compact heading */}
        <div className="px-4 pt-2 pb-1 sm:hidden">
          <h2
            className="text-xl leading-tight font-extralight mb-1 whitespace-pre-line"
            style={{ fontWeight: 200 }}
          >
            {t('picker.findPlace')}
          </h2>
        </div>

        {/* Right side - scene cards */}
        <div className="w-full flex flex-col items-center px-4 pb-24 sm:w-1/2 sm:flex-col sm:justify-center sm:items-center sm:px-8 sm:pb-0">
          <div className="w-full max-w-lg space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-2 sm:max-h-[calc(100vh-180px)] custom-scrollbar">
            {SCENES.map((scene, index) => {
              const isSelected = scene.id === currentSceneId
              return (
                <button
                  key={scene.id}
                  onClick={() => handleSelect(scene.id)}
                  className={`
                    w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all duration-300
                    animate-[fadeInRight_0.4s_ease-out_both]
                    hover:-translate-y-[2px] hover:shadow-lg hover:shadow-white/[0.04]
                    ${
                      isSelected
                        ? `bg-white/15 border border-white/30 shadow-lg shadow-white/5 ${entering ? 'scale-[1.05] opacity-100' : ''}`
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Scene thumbnail */}
                  <div
                    className="w-24 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl relative overflow-hidden"
                    style={{
                      background: SCENE_GRADIENTS[scene.id],
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 3px rgba(255,255,255,0.04)',
                    }}
                  >
                    {/* Subtle radial highlight overlay */}
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 60%)'}} />
                    {/* Noise texture */}
                    <div
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 64 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
                        backgroundSize: '64px 64px',
                      }}
                    />
                    <span className="relative z-10">{scene.icon}</span>
                  </div>

                  {/* Scene info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-white/90">
                        {scene.name}
                      </span>
                      {isSelected && (
                        <span className="text-white/90 text-xs animate-[scaleIn_0.2s_ease-out]">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                      {scene.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* Bottom button */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 px-4 pb-6 pt-3 safe-bottom sm:px-16 sm:pb-8 sm:static">
        <button
          onClick={handleEnter}
          disabled={entering}
          className={`w-full max-w-2xl mx-auto block py-4 rounded-xl text-center text-base font-medium
            bg-white/10 border border-white/20 transition-all duration-300
            ${entering ? 'bg-white/20 border-white/30 scale-[1.02]' : 'hover:bg-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/5'}
            animate-[fadeInUp_0.6s_ease-out_0.4s_both]`}
        >
          {entering ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {t('picker.start').replace(' →', '')}
            </span>
          ) : (
            t('picker.start')
          )}
        </button>
      </footer>

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}} />
    </div>
  )
}
