// 此版本号由 prebuild 脚本自动更新，勿手动修改
const CACHE_NAME = 'focus-room-20260603'
const BASE_PATH = '/focus-room'

const ASSETS = [
  BASE_PATH + '/',
  BASE_PATH,
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icon-192.png',
  BASE_PATH + '/icon-512.png',
]

// 视频文件单独缓存（体积大，用 cache-first 策略）
const VIDEO_CACHE = 'focus-room-videos-v1'
const VIDEO_PATHS = [
  BASE_PATH + '/videos/landing-bg.mp4',
  BASE_PATH + '/videos/mountain-lake.mp4',
  BASE_PATH + '/videos/seaside.mp4',
  BASE_PATH + '/videos/forest.mp4',
  BASE_PATH + '/videos/starry-sky.mp4',
  BASE_PATH + '/videos/rainy-cafe.mp4',
  BASE_PATH + '/videos/snowy-window.mp4',
]

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== VIDEO_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// 判断是否为视频请求
function isVideoRequest(url) {
  return VIDEO_PATHS.some((path) => url.pathname.endsWith(path.replace(BASE_PATH, '')) || url.pathname === path)
}

// 网络优先策略（HTML / JS / CSS / 音频）
// 视频用 cache-first 策略（已缓存则直接用，避免重复下载大文件）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // 视频请求：cache-first
  if (isVideoRequest(url)) {
    event.respondWith(
      caches.open(VIDEO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone())
            }
            return response
          })
        })
      )
    )
    return
  }

  // 其他请求：网络优先，失败时用缓存
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})
