import { buildings, cheats, gameConfig, type BuildingId } from '../../config/gameConfig'
import { earnCoins, storageCap, withBuilding, type TownSave } from '../economy'
import type { MacroReward } from './multiplicationMacro'
import type { AreaReward } from './areaOptimizer'
import type { FractionReward } from './fractionSlicer'

export type CheatReward = MacroReward | AreaReward | FractionReward

export function applyReward(town: TownSave, id: BuildingId, reward: CheatReward) {
  const building = town.buildings[id]
  if (!building || (building.cooldowns[reward.code] ?? 0) > town.lastAt) return town
  const cap = storageCap(id, building.level)
  if (reward.code !== 'fraction' && building.stock >= cap) return town
  const rewarded = { ...town, cracked: town.cracked + 1 }
  const cooldowns = { ...building.cooldowns, [reward.code]: town.lastAt + cheats[reward.code].cooldown }
  if (reward.code === 'fraction') {
    return earnCoins(withBuilding(rewarded, id, { ...building, cooldowns }), reward.coins)
  }
  if (reward.code === 'area') {
    return withBuilding(rewarded, id, { ...building, cooldowns,
      boost: { rate: reward.rate, endsAt: town.lastAt + gameConfig.area.boostDuration },
    })
  }
  return withBuilding(rewarded, id, {
    ...building,
    stock: Math.min(cap, building.stock + reward.batches * buildings[id].batchSize),
    progress: 0,
    cooldowns,
  })
}
