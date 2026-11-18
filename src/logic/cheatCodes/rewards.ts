import { buildings, cheats, gameConfig, type BuildingId, type CheatId } from '../../config/gameConfig'
import { earnCoins, productionTiming, recordHistory, skipProduction, storageCap, withBuilding, type TownEvent, type TownSave } from '../economy'
import type { Tier } from '../difficulty'
import type { MacroReward } from './multiplicationMacro'
import type { AreaReward } from './areaOptimizer'

type SpeedCode = Exclude<CheatId, 'macro' | 'fraction'>
type SpeedReward = { code: SpeedCode; minutes: number }
type SlicerReward = { code: 'fraction'; coins: number; split?: { total: number; order: number; count: number } }
export type CheatReward = MacroReward | SpeedReward | SlicerReward
export type RewardReceipt = { stockAdded: number; skippedMs: number; coins: number; multiplier: number }

export function macroReward(tier: Tier): MacroReward {
  return { code: 'macro', batches: gameConfig.rewards.macroBatches * gameConfig.rewards.tierMultipliers[tier - 1] }
}

export function areaReward(tier: Tier): AreaReward {
  return { code: 'area', minutes: gameConfig.rewards.speedMinutes[tier - 1] }
}

export function speedReward(code: SpeedCode, tier: Tier): SpeedReward {
  return { code, minutes: gameConfig.rewards.speedMinutes[tier - 1] }
}

export function slicerReward(tier: Tier, order: number, count: number): SlicerReward {
  const total = gameConfig.rewards.fractionCoins * gameConfig.rewards.tierMultipliers[tier - 1]
  return { code: 'fraction', coins: Math.floor(total * (order + 1) / count) - Math.floor(total * order / count), split: { total, order, count } }
}

export function applyReward(town: TownSave, id: BuildingId, reward: CheatReward, {
  continuing = false, complete = true, debug = false,
} = {}): { town: TownSave; receipt: RewardReceipt | null } {
  const building = town.buildings[id]
  const unavailable = { town, receipt: null }
  if (!building || (!debug && !continuing && (building.cooldowns[reward.code] ?? 0) > town.lastAt)) return unavailable
  const cap = storageCap(id, building.level)
  if (reward.code !== 'fraction' && building.stock >= cap) return unavailable
  const event: TownEvent | undefined = complete ? { kind: 'cheat', cheat: reward.code } : undefined
  const former = town.variety
  const run = former?.code === reward.code ? former.run + 1 : 1
  const multiplier = debug || !former ? 1 : former.code !== reward.code ? 1.25 : run % 3 === 0 ? .5 : 1
  const variety = complete && !debug ? { code: reward.code, run } : former
  const world = complete && !debug ? { ...town.world,
    codeWins: { ...town.world.codeWins, [reward.code]: (town.world.codeWins[reward.code] ?? 0) + 1 } } : town.world
  const rewarded = { ...town, variety, world, cracked: town.cracked + Number(complete) }
  const cooldowns = continuing ? building.cooldowns : { ...building.cooldowns, [reward.code]: town.lastAt + cheats[reward.code].cooldown }
  const updated = withBuilding(rewarded, id, { ...building, cooldowns })
  const receipt = { stockAdded: 0, skippedMs: 0, coins: 0, multiplier }
  if (reward.code === 'fraction') {
    const { split } = reward
    const total = Math.floor((split?.total ?? reward.coins) * multiplier)
    const coins = split ? Math.floor(total * (split.order + 1) / split.count) - Math.floor(total * split.order / split.count) : total
    return { town: earnCoins(updated, coins, event), receipt: { ...receipt, coins } }
  }
  if (reward.code !== 'macro') {
    const remaining = productionTiming(id, building, town.lastAt).fullMs
    const skipped = skipProduction(updated, id, Math.min(remaining, reward.minutes * 60_000 * multiplier))
    return { town: recordHistory(skipped.town, event), receipt: { ...receipt, skippedMs: skipped.creditedMs } }
  }
  const stock = Math.min(cap, building.stock + Math.floor(reward.batches * buildings[id].batchSize * multiplier))
  const result = withBuilding(updated, id, { ...building, cooldowns, stock, progress: 0 })
  return { town: recordHistory(result, event), receipt: { ...receipt, stockAdded: stock - building.stock } }
}
