import { createStore, get, update } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'
import { gameConfig } from '../config/gameConfig'
import { debugSession } from '../logic/debugSession'
import { localDevice, nativeApp } from '../native/device'

export const saveProblemEvent = 'lazy-gamer-save-problem'
export const saveConflictEvent = 'lazy-gamer-save-conflict'
const database = () => createStore('lazy-gamer', 'saves')
let store: ReturnType<typeof database> | undefined
let lastRead: string | undefined
let pending = Promise.resolve()
let storageProblem = ''
let readFailed = false
let previewSave: string | undefined

export function getSaveProblem() { return storageProblem }

function reportProblem(problem: string) {
  if (storageProblem === problem) return
  storageProblem = problem
  window.dispatchEvent(new Event(saveProblemEvent))
}

function legacySave(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}

export const townStorage: StateStorage<Promise<void>> = {
  async getItem(key) {
    if (typeof window === 'undefined') return null
    if (debugSession && previewSave !== undefined) return previewSave
    await pending
    let value: string | null = null
    try {
      if (nativeApp) {
        lastRead = (await localDevice.read({ key: 'town' })).value
        value = lastRead ?? null
      } else {
        store ??= database()
        lastRead = await get<string>(key, store)
        value = lastRead ?? legacySave(key)
      }
      if (value !== null) {
        const contents = JSON.parse(value)
        if (!contents?.state?.town || typeof contents.state.town !== 'object'
          || (contents.version ?? 0) > gameConfig.saveVersion) {
          throw new Error('Unsupported save')
        }
      }
      readFailed = false
      reportProblem('')
    } catch {
      readFailed = true
      reportProblem('Your saved town could not be opened. You can export this session from Settings.')
      if (!nativeApp && value === null && lastRead === undefined) {
        const legacy = legacySave(key)
        try {
          const contents = legacy && JSON.parse(legacy)
          if (contents?.state?.town && (contents.version ?? 0) <= gameConfig.saveVersion) {
            reportProblem('Your previous town is open. This browser could not save changes. You can export your progress from Settings.')
            return legacy
          }
        } catch { /* Keep the previous save in place. */ }
      }
      return null
    }
    return value
  },
  setItem(key, value) {
    if (typeof window === 'undefined') return Promise.resolve()
    if (debugSession) {
      previewSave = value
      return Promise.resolve()
    }
    pending = pending.then(async () => {
      if (readFailed) throw new Error('Saved town needs recovery')
      if (nativeApp) {
        await localDevice.write({ key: 'town', value })
        reportProblem('')
        return
      }
      store ??= database()
      let conflict = false
      await update<string | undefined>(key, (saved) => {
        conflict = saved !== lastRead
        return conflict ? saved : value
      }, store)
      if (conflict) {
        readFailed = true
        window.dispatchEvent(new Event(saveConflictEvent))
        return
      }
      lastRead = value
      try { localStorage.removeItem(key) } catch { /* The IndexedDB copy has already been saved. */ }
      reportProblem('')
    }).catch(() => {
      if (!readFailed) reportProblem('Lazy Gamer could not save your progress. You can export it from Settings.')
    })
    return pending
  },
  removeItem() {
    // The game's reset replaces the save with a new, empty town.
    return Promise.resolve()
  },
}
