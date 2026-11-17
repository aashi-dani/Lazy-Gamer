import { buildingIds, buildings, gameConfig, type AgeBand, type BuildingId, type CheatId } from '../config/gameConfig'

export type BuildingState = {
  level: number
  stock: number
  progress: number
  boost?: { rate: number; endsAt: number }
  cooldowns: Partial<Record<CheatId, number>>
}

export type HistoryPoint = { at: number; total: number }
export type TownSave = {
  band: AgeBand | null
  buildings: Partial<Record<BuildingId, BuildingState>>
  coins: number
  earned: number
  cracked: number
  lastAt: number
  history: HistoryPoint[]
  sound: boolean
}

export function emptyTown(now: number): TownSave {
  return { band: null, buildings: {}, coins: 0, earned: 0, cracked: 0, lastAt: now, history: [], sound: false }
}

export function newBuilding(id: BuildingId, starter = false): BuildingState {
  return {
    level: 1,
    stock: starter ? buildings[id].batchSize * gameConfig.startingBatches : 0,
    progress: starter ? gameConfig.startingProgress : 0,
    cooldowns: {},
  }
}

export function storageCap(id: BuildingId, level: number) {
  return buildings[id].capacity + (level - 1) * gameConfig.storagePerLevel
}

export function batchTime(level: number) {
  return gameConfig.batchMs / (1 + (level - 1) * gameConfig.speedPerLevel)
}

export function upgradePrice(level: number) {
  return gameConfig.upgradeBasePrice + (level - 1) * gameConfig.upgradePriceStep
}

function advanceBuilding(id: BuildingId, building: BuildingState, from: number, to: number): BuildingState {
  const { level, stock, boost, progress } = building
  if (to < from) {
    const delta = to - from
    const cooldowns = Object.fromEntries(
      Object.entries(building.cooldowns).filter(([, endsAt]) => endsAt > from).map(([key, endsAt]) => [key, endsAt + delta]),
    )
    return { ...building, cooldowns, boost: boost && boost.endsAt > from ? { ...boost, endsAt: boost.endsAt + delta } : undefined }
  }
  const cap = storageCap(id, level)
  const boostedMs = boost ? Math.max(0, Math.min(to, boost.endsAt) - from) : 0
  const elapsed = to - from + boostedMs * ((boost?.rate ?? 1) - 1)
  const progressWithElapsed = progress + elapsed / batchTime(level)
  const batches = Math.floor(progressWithElapsed)
  const newStock = Math.min(cap, stock + batches * buildings[id].batchSize)
  return {
    ...building,
    stock: newStock,
    progress: newStock >= cap ? 0 : progressWithElapsed - batches,
    boost: boost && boost.endsAt > to ? boost : undefined,
  }
}

export function advanceTown(town: TownSave, now: number) {
  let made = 0
  const updatedBuildings = { ...town.buildings }
  for (const id of buildingIds) {
    const previous = town.buildings[id]
    if (!previous) continue
    const updated = advanceBuilding(id, previous, town.lastAt, now)
    updatedBuildings[id] = updated
    made += updated.stock - previous.stock
  }
  return { town: { ...town, buildings: updatedBuildings, lastAt: now }, made }
}

export function withBuilding(town: TownSave, id: BuildingId, building: BuildingState): TownSave {
  return { ...town, buildings: { ...town.buildings, [id]: building } }
}

export function earnCoins(town: TownSave, coins: number): TownSave {
  if (coins <= 0) return town
  const earned = town.earned + coins
  const last = town.history.at(-1)
  const at = Math.max(town.lastAt, (last?.at ?? 0) + 1)
  const history = [...town.history.slice(1 - gameConfig.historyLimit), { at, total: earned }]
  return { ...town, coins: town.coins + coins, earned, history }
}

export function sellStock(town: TownSave, id: BuildingId): TownSave {
  const building = town.buildings[id]
  if (!building?.stock) return town
  return earnCoins(withBuilding(town, id, { ...building, stock: 0 }), building.stock * buildings[id].salePrice)
}

export function upgradeBuilding(town: TownSave, id: BuildingId): TownSave {
  const building = town.buildings[id]
  if (!building || building.level >= gameConfig.maxLevel) return town
  const price = upgradePrice(building.level)
  if (town.coins < price) return town
  return withBuilding({ ...town, coins: town.coins - price }, id, { ...building, level: building.level + 1 })
}

export function unlockBuilding(town: TownSave, id: BuildingId): TownSave {
  const price = buildings[id].price
  if (town.buildings[id] || town.coins < price) return town
  return withBuilding({ ...town, coins: town.coins - price }, id, newBuilding(id))
}
