// lib/storage.ts
// Provides typed, cached reads and immediate writes for localStorage

const cache = new Map<string, unknown>()

export function storageGet<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) {
      // 注意：未命中不缓存 fallback。不同调用方对同一个 key 可能给出
      // 形状不同的 fallback（如 null vs 完整对象），缓存它会让后续
      // 完整形状的读取拿到 null/残缺对象（真实事故：新用户首访崩溃）。
      return fallback
    }
    try {
      const parsed = JSON.parse(raw) as T
      cache.set(key, parsed)
      return parsed
    } catch {
      // 兼容历史直接以裸字符串存入的数据（如 "zh", "light", "1"）
      cache.set(key, raw as unknown as T)
      return raw as unknown as T
    }
  } catch {
    return fallback
  }
}

export function storageSet<T>(key: string, value: T): void {
  cache.set(key, value)
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function storageRemove(key: string): void {
  cache.delete(key)
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(key) } catch {}
}
