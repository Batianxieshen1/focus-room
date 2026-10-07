/**
 * Meting 兼容云函数（网易云源）— Focus Room 内置播放器数据源
 *
 * 部署方法见 docs/meting-deploy.md。零 npm 依赖，Node.js 16+。
 *
 * 接口（Meting 协议子集）：
 *   GET /meting?type=playlist&id=<网易云歌单ID>
 *   → [{ name, artist, url, pic, lrc }] （lrc 恒为空串，播放器暂不显示歌词）
 *
 * 音频直链由前端浏览器直连网易云 CDN，本函数只输出元数据，流量成本可忽略。
 */

const CACHE_TTL = 10 * 60 * 1000 // 歌单元数据内存缓存 10 分钟
const cache = new Map() // id -> { at, data }

const NETEASE_HEADERS = {
  Referer: 'https://music.163.com/',
  Origin: 'https://music.163.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Cookie: 'appver=2.9.7; platform=web',
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: NETEASE_HEADERS })
  if (!res.ok) throw new Error(`upstream ${res.status}`)
  return res.json()
}

async function getPlaylistTracks(id) {
  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data

  // 1) 歌单详情（含曲目基础信息）
  const detail = await fetchJSON(`https://music.163.com/api/playlist/detail?id=${encodeURIComponent(id)}`)
  const tracks = detail?.result?.tracks
  if (!Array.isArray(tracks) || tracks.length === 0) {
    const empty = []
    cache.set(id, { at: Date.now(), data: empty })
    return empty
  }

  // 2) 批量获取播放直链（VIP/无版权曲目 url 为空）
  const ids = tracks.map(t => t.id).filter(Boolean)
  let urlMap = {}
  try {
    const urls = await fetchJSON(
      `https://music.163.com/api/song/enhance/player/url?ids=[${ids.join(',')}]&br=320000`
    )
    urlMap = Object.fromEntries(
      (urls?.data ?? []).filter(d => d && d.id).map(d => [d.id, d.url || ''])
    )
  } catch {
    urlMap = {}
  }

  const data = tracks.map(t => ({
    name: String(t.name ?? ''),
    artist: Array.isArray(t.artists) ? t.artists.map(a => a?.name).filter(Boolean).join(' / ') : '',
    url: typeof urlMap[t.id] === 'string' ? urlMap[t.id] : '',
    pic: t.album?.picUrl ? t.album.picUrl.replace(/^http:\/\//, 'https://') : '',
    lrc: '',
  }))

  cache.set(id, { at: Date.now(), data })
  return data
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
}

// CloudBase HTTP 访问服务 / 直接调用 两种入口形态都兼容
function extractQuery(event) {
  if (event && typeof event === 'object') {
    if (event.queryStringParameters && typeof event.queryStringParameters === 'object') {
      return event.queryStringParameters
    }
    if (!event.httpMethod) return event // 直接调用时 event 本身就是参数对象
  }
  return {}
}

exports.main = async (event) => {
  // OPTIONS 预检
  if (event && event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  const query = extractQuery(event)
  const type = query.type || 'playlist'
  const id = String(query.id || '').trim()

  if (!/^\d{3,20}$/.test(id)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'invalid playlist id' }),
    }
  }

  try {
    if (type === 'playlist') {
      const data = await getPlaylistTracks(id)
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) }
    }
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `unsupported type: ${type}` }),
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'upstream failed', detail: String(err && err.message) }),
    }
  }
}
