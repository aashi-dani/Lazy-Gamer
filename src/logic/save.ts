import { ageBands, buildingIds, cheatIds, gameConfig, type AgeBand } from '../config/gameConfig'
import { emptyTown, storageCap, type BuildingState, type HistoryPoint, type TownSave } from './economy'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function number(value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback
}

function count(value: unknown, fallback = 0, max?: number) {
  return Math.floor(number(value, fallback, max))
}

export function readTown(value: unknown, now: number): TownSave {
  const save = record(value)
  const band = typeof save.band === 'string' && Object.hasOwn(ageBands, save.band) ? save.band as AgeBand : null
  const sound = save.sound === true
  if (!band) return { ...emptyTown(now), sound }

  const lastAt = count(save.lastAt, now)
  const townBuildings = record(save.buildings)
  const normalized: TownSave['buildings'] = {}
  for (const id of buildingIds) {
    if (!Object.hasOwn(townBuildings, id) || !townBuildings[id] || typeof townBuildings[id] !== 'object' || Array.isArray(townBuildings[id])) continue
    const source = record(townBuildings[id])
    const level = Math.max(1, count(source.level, 1, gameConfig.maxLevel))
    const cooldowns: BuildingState['cooldowns'] = {}
    const oldCooldowns = record(source.cooldowns)
    for (const code of cheatIds) {
      const endsAt = count(oldCooldowns[code])
      if (endsAt > lastAt) cooldowns[code] = endsAt
    }
    const oldBoost = record(source.boost)
    const endsAt = count(oldBoost.endsAt)
    const rate = number(oldBoost.rate, 1, gameConfig.area.maxBoost)
    const cap = storageCap(id, level)
    const stock = count(source.stock, 0, cap)
    normalized[id] = {
      level,
      stock,
      progress: stock < cap ? number(source.progress, 0, 1 - Number.EPSILON) : 0,
      cooldowns,
      boost: endsAt > lastAt && rate > 1 ? { endsAt, rate } : undefined,
    }
  }
  const earned = count(save.earned)
  const history: HistoryPoint[] = []
  if (Array.isArray(save.history)) {
    for (const item of save.history.slice(-gameConfig.historyLimit)) {
      const point = record(item)
      const at = count(point.at)
      const total = count(point.total, 0, earned)
      const previous = history.at(-1)
      if (at > (previous?.at ?? 0) && total >= (previous?.total ?? 0)) history.push({ at, total })
    }
  }
  return {
    band, buildings: normalized, coins: count(save.coins), earned, cracked: count(save.cracked),
    lastAt, history, sound,
  }
}
