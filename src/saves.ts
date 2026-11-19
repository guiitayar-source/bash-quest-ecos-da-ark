import { fresh, updateTraining, chapters, type Save } from './campaign'

export const legacyKey = 'bash-quest.ecos.v1'

export interface Slot {
  id: string
  savedAt: number
  state: Save
}

let connection: Promise<IDBDatabase> | undefined

function database(): Promise<IDBDatabase> {
  connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('bash-quest-ark', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('partidas', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return connection
}

export async function slots(): Promise<Slot[]> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const request = db.transaction('partidas').objectStore('partidas').getAll()
    request.onsuccess = () => {
      const rows: Slot[] = request.result
      resolve(rows.sort((a, b) => b.savedAt - a.savedAt))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function storeSlot(id: string, state: Save): Promise<void> {
  const row: Slot = { id, savedAt: Date.now(), state: structuredClone(state) }
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('partidas', 'readwrite')
    transaction.objectStore('partidas').put(row)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function deleteSlot(id: string): Promise<void> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('partidas', 'readwrite')
    transaction.objectStore('partidas').delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
  })
}

export function hydrate(state: Save): Save {
  const hydrated = {
    ...fresh(),
    ...state,
    trainingVersion: state.trainingVersion,
  }
  // Old saves inherit every already introduced sector silently, without replaying unlocks.
  if (!Array.isArray(state.library))
    hydrated.library = ['man', ...chapters.slice(0, Math.min(state.completed + 1, chapters.length)).flatMap((chapter) => chapter.tools)]
  updateTraining(hydrated)
  return hydrated
}

export async function importLegacy() {
  const raw = localStorage.getItem(legacyKey)
  if (!raw) return
  const id = 'campanha-original'
  if ((await slots()).some((slot) => slot.id === id)) return
  let previous: Save
  try {
    previous = JSON.parse(raw)
  } catch {
    return
  }
  if (
    previous?.version === 1 &&
    previous.disk &&
    Array.isArray(previous.seen)
  ) {
    await storeSlot(id, hydrate(previous))
  }
}
