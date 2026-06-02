'use client'

export interface Scene {
  id: string
  name: string
  icon: string
}

export const SCENES: Scene[] = [
  { id: 'rain', name: '雨窗', icon: '🌧' },
  { id: 'forest', name: '森林', icon: '🌲' },
  { id: 'ocean', name: '海浪', icon: '🌊' },
]

interface Props {
  currentScene: string
  onSceneChange: (scene: Scene) => void
}

export default function SceneSelector({ currentScene, onSceneChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs text-white/50 tracking-widest uppercase">场景</span>
      <div className="flex gap-2">
        {SCENES.map(scene => (
          <button
            key={scene.id}
            onClick={() => onSceneChange(scene)}
            className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-200 ${
              currentScene === scene.id
                ? 'bg-white/[0.14] shadow-sm'
                : 'bg-white/[0.04] hover:bg-white/[0.08]'
            }`}
          >
            <span className="text-xl">{scene.icon}</span>
            <span className={`text-[11px] transition-colors duration-200 ${
              currentScene === scene.id ? 'text-white/80' : 'text-white/45'
            }`}>
              {scene.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
