/**
 * serve-preview.js — 本地预览静态导出产物（out/）
 *
 * 用法：node scripts/serve-preview.js [端口]
 * 默认 http://127.0.0.1:8899/focus-room/
 *
 * next.config.ts 配置了 basePath '/focus-room'，静态服务器必须在该前缀下
 * 提供 out/ 目录；同时实现 Range 请求以便 <video> 可拖动进度条。
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.argv[2] || 8899)
const BASE = '/focus-room'
const ROOT = path.join(__dirname, '..', 'out')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0])

  // 只服务 /focus-room 前缀；根路径重定向过去
  if (urlPath === '/' || urlPath === '') {
    res.writeHead(302, { Location: BASE + '/' })
    res.end()
    return
  }
  if (!urlPath.startsWith(BASE + '/')) {
    res.writeHead(404)
    res.end('Not found (must start with ' + BASE + '/)')
    return
  }

  let filePath = path.join(ROOT, urlPath.slice(BASE.length))
  // 防目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403)
    res.end()
    return
  }

  let stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null
  if (stat && stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html')
    stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null
  }
  if (!stat) {
    // SPA 式回退到 index.html？静态导出单页即可，直接 404
    res.writeHead(404)
    res.end('Not found: ' + urlPath)
    return
  }

  const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
  const range = req.headers.range

  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [startStr, endStr] = range.replace('bytes=', '').split('-')
    const start = parseInt(startStr || '0', 10)
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1
    if (start >= stat.size || end >= stat.size || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
      res.end()
      return
    }
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    })
    fs.createReadStream(filePath, { start, end }).pipe(res)
    return
  }

  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  })
  fs.createReadStream(filePath).pipe(res)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Preview: http://127.0.0.1:${PORT}${BASE}/`)
})
