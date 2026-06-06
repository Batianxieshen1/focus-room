// Focus Room Service Worker — v20260606
// 网络优先(HTML/JS/CSS) + cache-first(视频/音频) + 离线回退
const CACHE_NAME = 'focus-room-20260606'
const BASE_PATH = '/focus-room'

const ASSETS = [
  BASE_PATH + '/',
  BASE_PATH,
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icon-192.png',
  BASE_PATH + '/icon-512.png',
  BASE_PATH + '/offline.html',
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
  BASE_PATH + '/videos/campfire.mp4',
  BASE_PATH + '/videos/city-night.mp4',
  BASE_PATH + '/videos/starry-tent.mp4',
]

// 音频文件单独缓存（用 cache-first 策略）
const AUDIO_CACHE = 'focus-room-audio-v1'
const AUDIO_PATHS = [
  BASE_PATH + '/sounds/rain.mp3',
  BASE_PATH + '/sounds/ocean.mp3',
  BASE_PATH + '/sounds/forest.mp3',
  BASE_PATH + '/sounds/fire.wav',
  BASE_PATH + '/sounds/cafe.mp3',
  BASE_PATH + '/sounds/wind.mp3',
  BASE_PATH + '/sounds/night.mp3',
  BASE_PATH + '/sounds/whitenoise.wav',
]

// 安装时缓存静态资源（音频和视频在首次请求时按需缓存）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

// 激活时清理旧缓存（保留当前版本的三个缓存）
self.addEventListener('activate', (event) => {
  const KEEP_CACHES = new Set([CACHE_NAME, VIDEO_CACHE, AUDIO_CACHE])
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !KEEP_CACHES.has(key))
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

// 判断是否为音频请求
function isAudioRequest(url) {
  return AUDIO_PATHS.some((path) => url.pathname.endsWith(path.replace(BASE_PATH, '')) || url.pathname === path)
}

// 网络优先策略（HTML / JS / CSS）
// 视频和音频用 cache-first 策略（避免重复下载大文件）
// 导航请求失败时回退到 offline.html
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

  // 音频请求：cache-first
  if (isAudioRequest(url)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
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

  // 导航请求：网络优先，失败时用缓存，再失败用 offline.html
  if (event.request.mode === 'navigate') {
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
          return caches.match(event.request).then((cached) => {
            return cached || caches.match(BASE_PATH + '/offline.html')
          })
        })
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
