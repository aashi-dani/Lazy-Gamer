import type { WeeklyTime } from './playTime'
import { biomes } from '../data/world'
import { emptyLayout, charmPercent, lotAt, onMap, spotForShop, type TownLayout, type Spot } from './townLayout'
import { emptyProgress, type WorldProgress } from './worldProgress'
import type { Friend } from './visits'
import type { DailyProgress, StudyProgress } from './topicProgress'
import { levelFromCoins } from './difficulty'
import { defaultAvatar, defaultPet, petEvolution, type Avatar, type Pet } from '../data/profile'
import { buildingIds, buildings, gameConfig, type AgeBand, type BuildingId, type CheatId } from '../config/gameConfig'

export type BuildingState = {
  level: number
  stock: number
  progress: number
  boost?: { rate: number; endsAt: number }
  cooldowns: Partial<Record<CheatId, number>>
}

export type TownEvent =
  | { kind: 'unlock' | 'upgrade'; shop: BuildingId }
  | { kind: 'cheat'; cheat: CheatId }

export type HistoryPoint = { at: number; total: number; event?: TownEvent }
export type TownSave = {
  band: AgeBand | null
  buildings: Partial<Record<BuildingId, BuildingState>>
  coins: number
  lifetimeCoinsEarned: number
  layout: TownLayout
  world: WorldProgress
  friends: Friend[]
  topics: StudyProgress
  recentQuestions: string[]
  variety?: { code: CheatId; run: number }
  daily: DailyProgress
  playerLevel: number
  playerName: string
  avatar: Avatar
  pet: Pet
  wardrobeOwned: string[]
  guidedSeen: boolean
  musicVolume: number
  effectsVolume: number
  cracked: number
  spent: number
  streak: number
  bestStreak: number
  tutorialSeen: boolean
  easyRead: boolean
  reduceMotion: boolean | null
  alwaysNight: boolean
  playTime: WeeklyTime
  lastAt: number
  history: HistoryPoint[]
  sound: boolean
}

export function emptyTown(now: number): TownSave {
  return {
    band: null, buildings: {}, coins: 0, lifetimeCoinsEarned: 0, cracked: 0, spent: 0, streak: 0, bestStreak: 0,
    lastAt: now, history: [], sound: true, easyRead: false, reduceMotion: null, alwaysNight: false, playTime: {}, tutorialSeen: false,
    playerLevel: 1, playerName: '', avatar: defaultAvatar, pet: defaultPet, guidedSeen: false,
    musicVolume: 0.45, effectsVolume: 0.65, wardrobeOwned: [], layout: emptyLayout(), world: emptyProgress(), friends: [], topics: {}, recentQuestions: [], daily: { lastDay: -1, streak: 0 },
  }
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
  return buildings[id].capacity + Math.floor((level - 1) / 3)
}

export function preservedStockCap(id: BuildingId, level: number) {
  const before = id === 'bike' ? 10 : buildings[id].capacity
  return Math.max(storageCap(id, level), before + (level - 1) * gameConfig.legacyStoragePerLevel)
}

export function saleableStock(id: BuildingId, building: BuildingState) {
  return Math.min(building.stock, storageCap(id, building.level))
}

export function batchTime(level: number) {
  return gameConfig.batchMs / (1 + (level - 1) * gameConfig.speedPerLevel)
}

export function upgradePrice(level: number) {
  return gameConfig.upgradeBasePrice + (level - 1) * gameConfig.upgradePriceStep
}

function produce(id: BuildingId, building: BuildingState, work: number): BuildingState {
  const cap = storageCap(id, building.level)
  if (building.stock >= cap) return building
  const totalProgress = building.progress + work / batchTime(building.level)
  const batches = Math.floor(totalProgress + Number.EPSILON)
  const stock = Math.min(cap, building.stock + batches * buildings[id].batchSize)
  return { ...building, stock, progress: stock >= cap ? 0 : Math.max(0, totalProgress - batches) }
}

export function workToFull(id: BuildingId, building: BuildingState) {
  const freeSlots = storageCap(id, building.level) - building.stock
  return freeSlots <= 0 ? 0
    : (Math.ceil(freeSlots / buildings[id].batchSize) - building.progress) * batchTime(building.level)
}

export function productionTiming(id: BuildingId, building: BuildingState, now: number) {
  const boost = building.boost
  const boostedMs = Math.max(0, (boost?.endsAt ?? now) - now)
  const rate = boostedMs > 0 ? boost!.rate : 1
  const work = workToFull(id, building)
  const earlyWork = Math.min(work, boostedMs * rate)
  return {
    perItemMs: batchTime(building.level) / buildings[id].batchSize / rate,
    fullMs: earlyWork / rate + (work - earlyWork),
  }
}

export function skipProduction(town: TownSave, id: BuildingId, ms: number) {
  const building = town.buildings[id]
  const creditedMs = building && Number.isFinite(ms) ? Math.max(0, Math.min(ms, workToFull(id, building))) : 0
  if (!building || !creditedMs) return { town, creditedMs }
  return { town: withBuilding(town, id, produce(id, building, creditedMs)), creditedMs }
}

function advanceBuilding(id: BuildingId, building: BuildingState, from: number, to: number): BuildingState {
  const { boost } = building
  if (to < from) {
    const delta = to - from
    const cooldowns = Object.fromEntries(
      Object.entries(building.cooldowns).filter(([, endsAt]) => endsAt > from).map(([key, endsAt]) => [key, endsAt + delta]),
    )
    return { ...building, cooldowns, boost: boost && boost.endsAt > from ? { ...boost, endsAt: boost.endsAt + delta } : undefined }
  }
  const boostedMs = boost ? Math.max(0, Math.min(to, boost.endsAt) - from) : 0
  const elapsed = to - from + boostedMs * ((boost?.rate ?? 1) - 1)
  return { ...produce(id, building, elapsed), boost: boost && boost.endsAt > to ? boost : undefined }
}

export function advanceTown(town: TownSave, now: number) {
  const produced: Partial<Record<BuildingId, number>> = {}
  let made = 0
  const updatedBuildings = { ...town.buildings }
  for (const id of buildingIds) {
    const previous = town.buildings[id]
    if (!previous) continue
    const updated = advanceBuilding(id, previous, town.lastAt, now)
    updatedBuildings[id] = updated
    const added = updated.stock - previous.stock
    if (added > 0) produced[id] = added
    made += added
  }
  return { town: { ...town, buildings: updatedBuildings, lastAt: now }, made, produced }
}

export function withBuilding(town: TownSave, id: BuildingId, building: BuildingState, at?: Spot): TownSave {
  const hasLot = town.layout.lots.some((lot) => lot.kind === 'shop' && lot.id === id)
  const spot = hasLot ? undefined : (at ?? spotForShop(town.layout, id))
  const layout: TownLayout = spot ? { ...town.layout, lots: [...town.layout.lots, { ...spot, kind: 'shop', id }] } : town.layout
  return { ...town, layout, buildings: { ...town.buildings, [id]: building } }
}

export function recordHistory(town: TownSave, event?: TownEvent): TownSave {
  const last = town.history.at(-1)
  const at = Math.max(town.lastAt, (last?.at ?? 0) + 1)
  return {
    ...town,
    history: [...town.history.slice(1 - gameConfig.historyLimit), { at, total: town.lifetimeCoinsEarned, ...(event && { event }) }],
  }
}

export function earnCoins(town: TownSave, coins: number, event?: TownEvent): TownSave {
  if (coins <= 0) return event ? recordHistory(town, event) : town
  const lifetimeCoinsEarned = Math.min(Number.MAX_SAFE_INTEGER, town.lifetimeCoinsEarned + coins)
  const playerLevel = levelFromCoins(lifetimeCoinsEarned)
  const evolution = Math.max(town.pet.evolution, petEvolution(playerLevel))
  const pet = evolution === town.pet.evolution ? town.pet : { ...town.pet, evolution }
  return recordHistory({ ...town, coins: Math.min(Number.MAX_SAFE_INTEGER, town.coins + coins),
    lifetimeCoinsEarned, playerLevel, pet }, event)
}

export function recordAttempt(town: TownSave, correct: boolean): TownSave {
  const streak = correct ? town.streak + 1 : 0
  return { ...town, streak, bestStreak: Math.max(streak, town.bestStreak) }
}

export function saleValue(town: TownSave, id: BuildingId, stock: number) {
  const base = stock * buildings[id].salePrice
  return base + (town.tutorialSeen ? Math.floor(base / 20) : 0) + Math.floor(base * charmPercent(town.layout) / 100)
}

export function sellStock(town: TownSave, id: BuildingId): TownSave {
  const building = town.buildings[id]
  if (!building?.stock) return town
  const sold = saleableStock(id, building)
  const world = { ...town.world, sales: town.world.sales + 1,
    coconuts: town.world.coconuts + (id === 'coconut' ? sold : 0) }
  return earnCoins(withBuilding({ ...town, world }, id, { ...building, stock: building.stock - sold }), saleValue(town, id, sold))
}

export function upgradeBuilding(town: TownSave, id: BuildingId): TownSave {
  const building = town.buildings[id]
  if (!building || building.level >= gameConfig.maxLevel) return town
  const price = upgradePrice(building.level)
  if (town.coins < price) return town
  const upgraded = withBuilding({ ...town, coins: town.coins - price, spent: town.spent + price }, id, { ...building, level: building.level + 1 })
  return recordHistory(upgraded, { kind: 'upgrade', shop: id })
}

export function unlockBuilding(town: TownSave, id: BuildingId, at: Spot | undefined = spotForShop(town.layout, id)): TownSave {
  const price = buildings[id].price
  if (town.buildings[id] || town.coins < price || town.playerLevel < buildings[id].unlockLevel || !at || !onMap(town.layout, at) || town.playerLevel < biomes[at.area].level || lotAt(town.layout, at)) return town
  const unlocked = withBuilding({ ...town, coins: town.coins - price, spent: town.spent + price }, id, newBuilding(id), at)
  return recordHistory(unlocked, { kind: 'unlock', shop: id })
}
