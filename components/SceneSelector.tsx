'use client'

import { t } from '@/lib/i18n'

export interface Scene {
  id: string
  name: string
  description: string
  icon: string
}

const SCENE_KEYS: Array<{ id: string; nameKey: string; descKey: string; icon: string }> = [
  { id: 'mountain-lake', nameKey: 'scene.mountainLakeName', descKey: 'scene.mountainLakeDesc', icon: '🏔' },
  { id: 'seaside', nameKey: 'scene.seasideName', descKey: 'scene.seasideDesc', icon: '🌊' },
  { id: 'forest', nameKey: 'scene.forestName', descKey: 'scene.forestDesc', icon: '🌲' },
  { id: 'starry-sky', nameKey: 'scene.starrySkyName', descKey: 'scene.starrySkyDesc', icon: '🌌' },
  { id: 'rainy-cafe', nameKey: 'scene.rainyCafeName', descKey: 'scene.rainyCafeDesc', icon: '☕' },
  { id: 'snowy-window', nameKey: 'scene.snowyWindowName', descKey: 'scene.snowyWindowDesc', icon: '❄️' },
  { id: 'campfire', nameKey: 'scene.campfireName', descKey: 'scene.campfireDesc', icon: '🔥' },
  { id: 'city-night', nameKey: 'scene.cityNightName', descKey: 'scene.cityNightDesc', icon: '🌙' },
  { id: 'starry-tent', nameKey: 'scene.starryTentName', descKey: 'scene.starryTentDesc', icon: '⛺' },
]

// Derived from i18n keys -- updated on each render so locale changes are reflected
export function getScenes(): Scene[] {
  return SCENE_KEYS.map(s => ({
    id: s.id,
    name: t(s.nameKey as any),
    description: t(s.descKey as any),
    icon: s.icon,
  }))
}

// Backward-compatible constant (lazy-evaluated)
export const SCENES: Scene[] = SCENE_KEYS.map(s => ({
  id: s.id,
  name: s.nameKey.replace('scene.', ''),
  description: '',
  icon: s.icon,
}))

// 每个场景的渐变背景（用于视频加载前的占位）
export const SCENE_GRADIENTS: Record<string, string> = {
  'mountain-lake': 'linear-gradient(135deg, #1a3a5c 0%, #2d5a7a 40%, #1a4a6a 100%)',
  'seaside': 'linear-gradient(135deg, #1a3a4a 0%, #2a5a6a 40%, #1a4a5a 100%)',
  'forest': 'linear-gradient(135deg, #0a2a1a 0%, #1a3a2a 40%, #0d2a1a 100%)',
  'starry-sky': 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 40%, #0d0d2a 100%)',
  'rainy-cafe': 'linear-gradient(135deg, #1a1a2a 0%, #2a2a3a 40%, #1a1a3a 100%)',
  'snowy-window': 'linear-gradient(135deg, #2a3a4a 0%, #4a5a6a 40%, #3a4a5a 100%)',
  'campfire': 'linear-gradient(135deg, #3a1a0a 0%, #6a3a1a 40%, #4a2a0a 100%)',
  'city-night': 'linear-gradient(135deg, #0a0a2a 0%, #2a1a4a 40%, #1a1a3a 100%)',
  'starry-tent': 'linear-gradient(135deg, #050510 0%, #0a0a1a 40%, #030308 100%)',
}

// 场景与推荐声音的映射 (soundName keys reference i18n sound.* keys)
export const SCENE_SOUND_MAP: Record<string, { soundId: string; soundNameKey: string }> = {
  'mountain-lake': { soundId: 'wind', soundNameKey: 'sound.wind' },
  'seaside': { soundId: 'ocean', soundNameKey: 'sound.ocean' },
  'forest': { soundId: 'forest', soundNameKey: 'sound.forest' },
  'starry-sky': { soundId: 'night', soundNameKey: 'sound.night' },
  'rainy-cafe': { soundId: 'rain', soundNameKey: 'sound.rain' },
  'snowy-window': { soundId: 'whitenoise', soundNameKey: 'sound.whitenoise' },
  'campfire': { soundId: 'fire', soundNameKey: 'sound.fire' },
  'city-night': { soundId: 'whitenoise', soundNameKey: 'sound.whitenoise' },
  'starry-tent': { soundId: 'night', soundNameKey: 'sound.night' },
}

interface Props {
  currentScene: string
  onSceneChange: (scene: Scene) => void
}

export default function SceneSelector({ currentScene, onSceneChange }: Props) {
  const recommended = SCENE_SOUND_MAP[currentScene]
  const scenes = getScenes()

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs text-white/50 tracking-widest uppercase">{t('scene.title')}</span>
      <div className="flex gap-2 flex-wrap">
        {scenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => onSceneChange(scene)}
            className={`flex flex-col items-center gap-2 py-3 px-3 rounded-xl transition-all duration-200 ${
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
      {/* 推荐声音提示 */}
      {recommended && (
        <div className="text-[10px] text-white/30 text-center tracking-wide">
          {t('scene.recommendHint').replace('{name}', t(recommended.soundNameKey as any))}
        </div>
      )}
    </div>
  )
}
