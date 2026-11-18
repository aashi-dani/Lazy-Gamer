import { bossDayInterval, type CheatId } from '../data/catalog'
import { decorations, quests, type QuestId } from '../data/world'
import type { TownSave } from './economy'

export type WorldProgress = {
  sales: number
  coconuts: number
  codeWins: Partial<Record<CheatId, number>>
  peakCharm: number
  peakRoads: number
  claimedQuests: QuestId[]
  collected: string[]
  rushBest: number
  relaxedBest: number
  bossWins: number[]
  festivalWins: string[]
}

export function emptyProgress(): WorldProgress {
  return { sales: 0, coconuts: 0, codeWins: {}, peakCharm: 0, peakRoads: 0, claimedQuests: [], collected: [],
    rushBest: 0, relaxedBest: 0, bossWins: [], festivalWins: [] }
}

export function recordCollect(world: WorldProgress, key: string) {
  return world.collected.includes(key) ? world : { ...world, collected: [...world.collected, key] }
}

export function questProgress(town: TownSave, id: QuestId) {
  const { world } = town
  const amount = {
    firstSale: world.sales,
    coconuts: world.coconuts,
    fractions: world.codeWins.fraction ?? 0,
    roads: world.peakRoads,
    charm: world.peakCharm,
  }[id]
  const goal = quests[id]
  return Math.min(amount, goal.target)
}

export function earnedBadges(town: TownSave) {
  return {
    firstCode: town.cracked > 0,
    townFive: town.playerLevel >= 5,
    lucky: town.bestStreak >= 10,
    charmer: town.world.peakCharm >= 30,
    rival: town.world.bossWins.length > 0,
  }
}

export function nextBoss(level: number, wins: number[]) {
  const clears = new Set(wins)
  for (let checkpoint = bossDayInterval; checkpoint <= level; checkpoint += bossDayInterval) {
    if (!clears.has(checkpoint)) return checkpoint
  }
}

export function decorAwarded(id: keyof typeof decorations, world: WorldProgress) {
  if (id === 'trophy') return world.bossWins.length
  return world.festivalWins.filter((key) => key.startsWith(`${id}-`)).length
}
