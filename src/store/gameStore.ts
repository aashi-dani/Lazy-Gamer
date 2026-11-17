import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { buildingIds, gameConfig, type AgeBand, type BuildingId } from '../config/gameConfig'
import { advanceTown, emptyTown, newBuilding, sellStock, unlockBuilding, upgradeBuilding, withBuilding, type TownSave } from '../logic/economy'
import { readTown } from '../logic/save'

type GameStore = {
  town: TownSave
  checkpoint: (now?: number) => void
  setBand: (band: AgeBand) => void
  start: (building: BuildingId) => void
  collect: (building: BuildingId) => void
  unlock: (building: BuildingId) => void
  upgrade: (building: BuildingId) => void
  toggleSound: () => void
  reset: () => void
}

const browserStorage: StateStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key) } catch { return null }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value) } catch { /* Keep playing with the in-memory town. */ }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key) } catch { /* Storage may be blocked by the browser. */ }
  },
}

export const useGameStore = create<GameStore>()(persist((set) => {
  const change = (action: (town: TownSave) => TownSave, now = Date.now()) => {
    set(({ town }) => ({ town: action(advanceTown(town, now).town) }))
  }
  return {
    town: emptyTown(Date.now()),
    checkpoint: (now) => change((town) => town, now),
    setBand: (band) => change((town) => ({ ...town, band })),
    start: (id) => change((town) => {
      if (!town.band || buildingIds.some((building) => town.buildings[building])) return town
      const started = { ...town, coins: gameConfig.startingCoins, history: [{ at: town.lastAt, total: 0 }] }
      return withBuilding(started, id, newBuilding(id, true))
    }),
    collect: (id) => change((town) => sellStock(town, id)),
    unlock: (id) => change((town) => unlockBuilding(town, id)),
    upgrade: (id) => change((town) => upgradeBuilding(town, id)),
    toggleSound: () => change((town) => ({ ...town, sound: !town.sound })),
    reset: () => set({ town: emptyTown(Date.now()) }),
  }
}, {
  name: gameConfig.saveKey,
  version: gameConfig.saveVersion,
  storage: createJSONStorage(() => browserStorage),
  partialize: ({ town }) => ({ town }),
  migrate: (saved) => saved as { town: TownSave },
  merge: (saved, current) => ({ ...current, town: readTown((saved as { town?: unknown } | undefined)?.town, Date.now()) }),
}))
