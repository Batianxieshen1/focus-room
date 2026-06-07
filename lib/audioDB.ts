// lib/audioDB.ts
// IndexedDB wrapper for storing custom audio blobs

const DB_NAME = 'focus-room-audio'
const DB_VERSION = 1
const STORE_NAME = 'custom-sounds'

interface StoredSound {
  id: string
  name: string
  icon: string
  file: Blob
  isCustom: true
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveCustomSound(id: string, name: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ id, name, icon: '\u{1f3b5}', file: blob, isCustom: true } as StoredSound)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function loadCustomSounds(): Promise<Array<{id: string, name: string, fileUrl: string}>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => {
      const results = (request.result as StoredSound[]).map(s => ({
        id: s.id,
        name: s.name,
        fileUrl: URL.createObjectURL(s.file),
      }))
      db.close()
      resolve(results)
    }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function deleteCustomSound(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
