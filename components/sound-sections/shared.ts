import { storageGet } from '@/lib/storage'
import { KEYS } from '@/lib/storageKeys'

export const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav']
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface UserPreset {
  id: string
  name: string
  volumes: Record<string, number>
}

export function loadUserPresets(): UserPreset[] {
  return storageGet<UserPreset[]>(KEYS.mixPresets, [])
}

export async function fetchWithProgress(
  url: string,
  onProgress: (percent: number) => void
): Promise<Blob> {
  const response = await fetch(url)
  const contentLength = response.headers.get('Content-Length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body!.getReader()
  let received = 0
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total > 0) {
      onProgress(Math.round((received / total) * 100))
    }
  }

  return new Blob(chunks as BlobPart[])
}
