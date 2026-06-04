/**
 * Prebuild script: 自动更新 Service Worker 缓存版本号
 * 每次 npm run build 时自动执行，确保用户总是获取最新资源
 */
const fs = require('fs')
const path = require('path')

const swPath = path.join(__dirname, '..', 'public', 'sw.js')
let content = fs.readFileSync(swPath, 'utf-8')

const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const newVersion = `focus-room-${date}`

// 替换 CACHE_NAME 的值
content = content.replace(
  /const CACHE_NAME = 'focus-room-[^']*'/,
  `const CACHE_NAME = '${newVersion}'`
)

fs.writeFileSync(swPath, content, 'utf-8')
console.log(`[prebuild] Service Worker cache version updated to: ${newVersion}`)
