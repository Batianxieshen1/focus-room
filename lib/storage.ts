// lib/storage.ts
// Provides typed, cached reads and immediate writes for localStorage

const cache = new Map<string, unknown>()

export function storageGet<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) { cache.set(key, fallback); return fallback }
    const parsed = JSON.parse(raw) as T
    cache.set(key, parsed)
    return parsed
  } catch {
    cache.set(key, fallback)
    return fallback
  }
}

export function storageSet<T>(key: string, value: T): void {
  cache.set(key, value)
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function storageRemove(key: string): void {
  cache.delete(key)
  try { localStorage.removeItem(key) } catch {}
}
