# 场景视频升级指南（1080p 换源，5 分钟/个）

## 背景

现有 10 个场景视频基本都是 1920×1080，唯二的例外：

| 文件 | 分辨率 | 大小 | 说明 |
|---|---|---|---|
| `campfire.mp4` | **1280×720** | 15.2MB | 唯一 720p，放大会偏软 |
| `forest.mp4` | 2048×1080 | 18.7MB | 略超宽，cover 裁切无损 |
| `rainy-cafe.mp4` / `seaside.mp4` | 1920×1080 | ~6.5MB | 码率最低，但实测观感可接受（雨滴锐利） |

> 另已修复：短视频（≤12s）在 A/B 换轨交叉淡入机制下会卡死在黑帧/暂停帧的竞态 bug——现在短视频直接走原生 loop 循环，篝火等场景不再出现"全黑画面"。

## 换源步骤（以 campfire 为例）

1. **下载**（任选一站，均为免费商用许可）：
   - Pexels（推荐，CC0 类似许可）：https://www.pexels.com/search/videos/campfire/ → 找一个 1080p 以上、≤20 秒的夜间篝火特写 → Free Download → 选 1920×1080 或更高。
   - Mixkit（Mixkit License，免费商用）：https://mixkit.co/free-stock-video/bonfire/ → Download。
   - Coverr（免费商用）：https://coverr.co/s?q=campfire。
   - 挑选标准：**竖构图或中心构图**（会被 cover 裁切）、循环感强（首尾接近）、暗部细节丰富（避免大片死黑）、H.264 MP4。
2. **替换文件**：重命名为 `campfire.mp4`，覆盖 `public/videos/campfire.mp4`。
   - 建议顺手压缩到 ≤15MB（Pexels 1080p 原片通常 20-60MB，可用 https://compress.video 或本机 ffmpeg：`ffmpeg -i in.mp4 -vcodec libx264 -crf 26 -preset slow -an campfire.mp4`）。
3. **更新海报**：`public/posters/campfire.jpg` 是加载期的占位封面。取新视频的第一帧即可（ffmpeg：`ffmpeg -i campfire.mp4 -frames:v 1 -q:v 3 poster.jpg`，或播放器截图裁 16:9）。不同步更新也只是加载瞬间画面不一致，无功能影响。
4. **本地验证**：`node scripts/serve-preview.js 8899` → 打开 http://127.0.0.1:8899/focus-room/ → 切到该场景，确认视频循环无黑帧、无停顿。

## 想换其他场景同理

文件名对照：`mountain-lake`（高山湖泊）/ `seaside`（湖边小屋）/ `forest`（林间小路）/ `starry-sky`（星河夜空）/ `rainy-cafe`（雨天窗边）/ `snowy-window`（雪落无声）/ `campfire`（篝火夜话）/ `city-night`（城市夜景）/ `starry-tent`（星空帐篷）/ `landing-bg`（落地页云海）。

> 注意：GitHub Pages 仓库单文件建议 ≤50MB；视频走 SW cache-first 缓存，替换后把 `public/sw.js` 里 `VIDEO_CACHE` 的版本号（如 `focus-room-videos-v1` → `-v2`）改一下，老用户才能拿到新视频。
