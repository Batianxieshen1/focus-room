'use client'

export interface Scene {
  id: string
  name: string
  description: string
  icon: string
}

export const SCENES: Scene[] = [
  { id: 'mountain-lake', name: '高山湖泊', description: '水面如镜，远山含雪。安静得只听得见自己的呼吸。', icon: '🏔' },
  { id: 'seaside', name: '海边小屋', description: '潮水轻拍岸边，节奏像呼吸一样自然。思绪随浪花散开。', icon: '🌊' },
  { id: 'forest', name: '林间小路', description: '阳光穿过树梢，光影缓缓移动。空气里有泥土和叶子的味道。', icon: '🌲' },
  { id: 'starry-sky', name: '星河夜空', description: '满天星斗缓缓转动，夜色温柔得像一首低声哼的歌。', icon: '🌌' },
  { id: 'rainy-cafe', name: '雨天窗边', description: '雨敲玻璃，世界被水声隔在外面。适合一个人安静待着。', icon: '☕' },
  { id: 'snowy-window', name: '雪落无声', description: '雪花慢慢落下来，世界变得很轻。适合不被打扰的午后。', icon: '❄️' },
  { id: 'campfire', name: '篝火夜话', description: '火焰噼啪声，温暖的光在黑暗中跳动。适合夜晚的深度思考。', icon: '🔥' },
  { id: 'city-night', name: '城市夜景', description: '远处的灯火像星星一样闪烁，城市的节奏在窗外流淌。', icon: '🌙' },
  { id: 'starry-tent', name: '星空帐篷', description: '帐篷外是银河，帐篷内是温暖的角落。天地之间只有你。', icon: '⛺' },
]

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

// 场景与推荐声音的映射
export const SCENE_SOUND_MAP: Record<string, { soundId: string; soundName: string }> = {
  'mountain-lake': { soundId: 'wind', soundName: '风声' },
  'seaside': { soundId: 'ocean', soundName: '海浪' },
  'forest': { soundId: 'forest', soundName: '森林' },
  'starry-sky': { soundId: 'night', soundName: '夏夜' },
  'rainy-cafe': { soundId: 'rain', soundName: '雨声' },
  'snowy-window': { soundId: 'whitenoise', soundName: '白噪音' },
  'campfire': { soundId: 'fire', soundName: '壁炉' },
  'city-night': { soundId: 'whitenoise', soundName: '白噪音' },
  'starry-tent': { soundId: 'night', soundName: '夏夜' },
}

interface Props {
  currentScene: string
  onSceneChange: (scene: Scene) => void
}

export default function SceneSelector({ currentScene, onSceneChange }: Props) {
  const recommended = SCENE_SOUND_MAP[currentScene]

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs text-white/50 tracking-widest uppercase">场景</span>
      <div className="flex gap-2 flex-wrap">
        {SCENES.map(scene => (
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
          💡 推荐搭配「{recommended.soundName}」白噪音
        </div>
      )}
    </div>
  )
}
