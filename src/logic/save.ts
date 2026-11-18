import { readWeeks } from './playTime'
import { decorationIds, festivalIds, questIds } from '../data/world'
import { pets as petCatalog, avatarOptions as looks } from '../data/profile'
import { readLayout } from './townLayout'
import { emptyProgress, type WorldProgress } from './worldProgress'
import { openVisitCode, type Friend } from './visits'
import { wardrobeKeys } from '../data/wardrobe'
import type { StudyProgress } from './topicProgress'
import { avatarOptions, defaultAvatar, defaultPet, nickname, petEvolution, pets, type AvatarPart, type PetType } from '../data/profile'
import { levelFromCoins, tiers, type Tier } from './difficulty'
import { ageBands, buildingIds, cheatIds, gameConfig, topicNames, type Topic, type AgeBand } from '../config/gameConfig'
import { emptyTown, preservedStockCap, type BuildingState, type HistoryPoint, type TownEvent, type TownSave } from './economy'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function number(value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback
}

function count(value: unknown, fallback = 0, max?: number) {
  return Math.floor(number(value, fallback, max))
}

function timestamp(value: unknown, fallback = 0) {
  const time = count(value, fallback)
  return Number.isFinite(new Date(time).getTime()) ? time : fallback
}

export function migrateSave(value: unknown, fromVersion: number): { town: unknown } {
  const { town } = record(value)
  const oldTown = record(town)
  if (fromVersion >= gameConfig.saveVersion) return { town }
  if (fromVersion >= 5) return { town }
  if (fromVersion >= 3) {
    const codeWins: WorldProgress['codeWins'] = {}
    for (const point of Array.isArray(oldTown.history) ? oldTown.history : []) {
      const event = readEvent(record(point).event)
      if (event?.kind === 'cheat') codeWins[event.cheat] = (codeWins[event.cheat] ?? 0) + 1
    }
    return { town: { ...oldTown, world: { ...emptyProgress(), codeWins } } }
  }
  const shops = record(oldTown.buildings)
  const started = buildingIds.some((id) => Boolean(shops[id]))
  const lifetimeCoinsEarned = count(oldTown.earned)
  const legacyStats = fromVersion <= 1 ? {
    spent: started ? Math.max(0, gameConfig.startingCoins + lifetimeCoinsEarned - count(oldTown.coins)) : 0,
    streak: 0, bestStreak: 0, easyRead: false,
  } : {}
  return { town: { ...oldTown, ...legacyStats, lifetimeCoinsEarned, tutorialSeen: started, guidedSeen: started } }
}

function readEvent(value: unknown): TownEvent | undefined {
  const event = record(value)
  if (event.kind === 'cheat') {
    const cheat = cheatIds.find((id) => event.cheat === id)
    return cheat && { kind: 'cheat', cheat }
  }
  if (event.kind === 'unlock' || event.kind === 'upgrade') {
    const shop = buildingIds.find((id) => event.shop === id)
    return shop && { kind: event.kind, shop }
  }
}

function readTopics(value: unknown): StudyProgress {
  const result: StudyProgress = {}
  const source = record(value)
  for (const topic of Object.keys(topicNames) as Topic[]) {
    if (!source[topic]) continue
    const data = record(source[topic])
    const attempts = count(data.attempts)
    const recent = Array.isArray(data.recent) ? data.recent.filter((item) => typeof item === 'boolean').slice(-20) : []
    result[topic] = { attempts, correct: count(data.correct, 0, attempts), rightRun: count(data.rightRun, 0, attempts),
      wrongRun: count(data.wrongRun, 0, attempts), highestTier: count(data.highestTier, 0, 5),
      offset: typeof data.offset === 'number' && Number.isInteger(data.offset) ? Math.max(-1, Math.min(1, data.offset)) : 0,
      recent }
  }
  return result
}

function readWorld(value: unknown, level: number): WorldProgress {
  const data = record(value)
  const defaults = emptyProgress()
  const codeWins: WorldProgress['codeWins'] = {}
  const wins = record(data.codeWins)
  for (const id of cheatIds) if (typeof wins[id] === 'number') codeWins[id] = count(wins[id])
  const knownCollection = [...Object.keys(petCatalog).map((id) => `pet:${id}`), ...looks.outfit.map((_, i) => `outfit:${i}`),
    ...decorationIds.map((id) => `decor:${id}`)]
  const strings = (list: unknown): string[] => Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : []
  const collected = strings(data.collected).filter((id) => knownCollection.includes(id))
  const claimed = strings(data.claimedQuests)
  const bossWins = Array.isArray(data.bossWins)
    ? data.bossWins.filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 5 && item <= level && item % 5 === 0)
    : []
  const festivalWins = strings(data.festivalWins).filter((key) =>
    festivalIds.some((id) => key.slice(0, -5) === id && /^-\d{4}$/.test(key.slice(-5)))).slice(0, 200)
  return {
    ...defaults, sales: count(data.sales), coconuts: count(data.coconuts), codeWins, peakCharm: count(data.peakCharm),
    peakRoads: count(data.peakRoads), claimedQuests: questIds.filter((id) => claimed.includes(id)), collected: [...new Set(collected)],
    rushBest: count(data.rushBest), relaxedBest: count(data.relaxedBest, 0, 5), bossWins: [...new Set(bossWins)],
    festivalWins: [...new Set(festivalWins)],
  }
}

export function readTown(value: unknown, now: number): TownSave {
  const save = record(value)
  const band = typeof save.band === 'string' && Object.hasOwn(ageBands, save.band) ? save.band as AgeBand : null
  const defaults = emptyTown(now)
  const avatar = { ...defaultAvatar }
  const savedAvatar = record(save.avatar)
  for (const layer of Object.keys(avatarOptions) as AvatarPart[]) avatar[layer] = count(savedAvatar[layer], avatar[layer], avatarOptions[layer].length - 1)
  const savedPet = record(save.pet)
  const accessories = record(savedPet.accessories)
  const pet = {
    type: typeof savedPet.type === 'string' && Object.hasOwn(pets, savedPet.type) ? savedPet.type as PetType : defaultPet.type,
    name: nickname(savedPet.name) || defaultPet.name,
    evolution: count(savedPet.evolution, 0, 3),
    ...(Object.keys(accessories).length > 0 && { accessories: {
      petHat: count(accessories.petHat, 0, 2), petScarf: count(accessories.petScarf, 0, 2), petBow: count(accessories.petBow, 0, 2),
    } }),
  }
  const playerLevel = levelFromCoins(count(save.lifetimeCoinsEarned))
  const wardrobeOwned = Array.isArray(save.wardrobeOwned) ? wardrobeKeys.filter((key) => (save.wardrobeOwned as unknown[]).includes(key)) : []
  const profile = {
    ...defaults, band, avatar, wardrobeOwned, world: readWorld(save.world, playerLevel), pet: { ...pet, evolution: Math.max(pet.evolution, petEvolution(playerLevel)) }, playerName: nickname(save.playerName),
    sound: typeof save.sound === 'boolean' ? save.sound : defaults.sound,
    easyRead: save.easyRead === true,
    reduceMotion: typeof save.reduceMotion === 'boolean' ? save.reduceMotion : null,
    alwaysNight: save.alwaysNight === true,
    playTime: readWeeks(save.playTime),
    musicVolume: number(save.musicVolume, defaults.musicVolume, 1),
    effectsVolume: number(save.effectsVolume, defaults.effectsVolume, 1),
  }
  if (!band) return profile

  const lastAt = timestamp(save.lastAt, now)
  const townBuildings = record(save.buildings)
  const normalized: TownSave['buildings'] = {}
  for (const id of buildingIds) {
    if (!Object.hasOwn(townBuildings, id) || !townBuildings[id] || typeof townBuildings[id] !== 'object' || Array.isArray(townBuildings[id])) continue
    const source = record(townBuildings[id])
    const level = Math.max(1, count(source.level, 1, gameConfig.maxLevel))
    const cooldowns: BuildingState['cooldowns'] = {}
    const oldCooldowns = record(source.cooldowns)
    for (const code of cheatIds) {
      const endsAt = timestamp(oldCooldowns[code])
      if (endsAt > lastAt) cooldowns[code] = endsAt
    }
    const oldBoost = record(source.boost)
    const endsAt = timestamp(oldBoost.endsAt)
    const rate = number(oldBoost.rate, 1, gameConfig.legacyBoostMaxRate)
    const cap = preservedStockCap(id, level)
    const stock = count(source.stock, 0, cap)
    normalized[id] = {
      level,
      stock,
      progress: stock < cap ? number(source.progress, 0, 1 - Number.EPSILON) : 0,
      cooldowns,
      boost: endsAt > lastAt && rate > 1 ? { endsAt, rate } : undefined,
    }
  }
  const lifetimeCoinsEarned = count(save.lifetimeCoinsEarned)
  const friends: Friend[] = []
  if (Array.isArray(save.friends)) {
    for (const value of save.friends.slice(0, 30)) {
      const entry = record(value)
      const alias = nickname(entry.alias)
      if (alias && typeof entry.code === 'string' && openVisitCode(entry.code)) friends.push({ alias, code: entry.code.trim() })
    }
  }
  const history: HistoryPoint[] = []
  if (Array.isArray(save.history)) {
    for (const item of save.history.slice(-gameConfig.historyLimit)) {
      const point = record(item)
      const at = timestamp(point.at)
      const total = count(point.total, 0, lifetimeCoinsEarned)
      const previous = history.at(-1)
      if (at > (previous?.at ?? 0) && total >= (previous?.total ?? 0)) {
        const event = readEvent(point.event)
        history.push({ at, total, ...(event && { event }) })
      }
    }
  }
  const streak = count(save.streak)
  const recentQuestions = Array.isArray(save.recentQuestions)
    ? save.recentQuestions.filter((key): key is string => typeof key === 'string' && key.length <= 800).slice(-20)
      .map((key) => key.replace(/\]\|[\p{L}]+$/u, ']')) : []
  const variety = record(save.variety)
  const lastCheat = cheatIds.find((id) => id === variety.code)
  const run = count(variety.run)
  const sourceDaily = record(save.daily)
  const offer = record(sourceDaily.offer)
  const cheat = cheatIds.find((id) => id === offer.cheat)
  const daily = { lastDay: sourceDaily.lastDay === -1 ? -1 : count(sourceDaily.lastDay, -1, 100_000), streak: count(sourceDaily.streak) }
  const dailyOffer = cheat && tiers.includes(offer.tier as Tier) && count(offer.day, -1) > daily.lastDay
    ? { day: count(offer.day), tier: offer.tier as Tier, cheat, seed: count(offer.seed, 0, 0xffff_ffff) } : undefined
  return {
    ...profile, buildings: normalized, layout: readLayout(save.layout, normalized, playerLevel), coins: count(save.coins), lifetimeCoinsEarned,
    playerLevel, cracked: count(save.cracked),
    friends, topics: readTopics(save.topics), recentQuestions,
    ...(lastCheat && run > 0 && { variety: { code: lastCheat, run } }),
    daily: { ...daily, ...(dailyOffer && { offer: dailyOffer }) },
    spent: count(save.spent), streak, bestStreak: Math.max(streak, count(save.bestStreak)),
    lastAt, history, tutorialSeen: save.tutorialSeen === true, guidedSeen: save.guidedSeen === true,
  }
}

const savePrefix = 'LG-'
export const saveCodeLimit = 1_048_576

export function exportTown(town: TownSave) {
  const bytes = new TextEncoder().encode(JSON.stringify({ version: gameConfig.saveVersion, state: { town } }))
  return savePrefix + btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function importTown(code: string, now = Date.now()): TownSave | null {
  const compact = code.trim()
  if (compact.length > saveCodeLimit || !/^LG-[A-Za-z0-9_-]+$/.test(compact)) return null
  try {
    const bytes = Uint8Array.from(atob(compact.slice(savePrefix.length).replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0))
    const data = record(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
    const state = record(data.state)
    const town = record(state.town)
    const version = data.version
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > gameConfig.saveVersion
      || !Object.hasOwn(town, 'band') || !Object.hasOwn(town, 'buildings') || typeof town.lastAt !== 'number'
      || !town.buildings || typeof town.buildings !== 'object' || Array.isArray(town.buildings)) return null
    const normalized = readTown(migrateSave(state, version).town, now)
    if (town.band !== null && !normalized.band) return null
    if (town.band === null && Object.keys(town.buildings).length) return null
    if (Object.keys(town.buildings).length && !buildingIds.some((id) => normalized.buildings[id])) return null
    return normalized
  } catch {
    return null
  }
}
