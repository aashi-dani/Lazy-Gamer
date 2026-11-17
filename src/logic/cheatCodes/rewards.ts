import { buildings, cheats, type BuildingId } from '../../config/gameConfig'
import { storageCap, withBuilding, type TownSave } from '../economy'
import type { MacroReward } from './multiplicationMacro'

export type CheatReward = MacroReward

export function applyReward(town: TownSave, id: BuildingId, reward: CheatReward) {
  const building = town.buildings[id]
  if (!building || (building.cooldowns[reward.code] ?? 0) > town.lastAt) return town
  const cap = storageCap(id, building.level)
  if (building.stock >= cap) return town
  return withBuilding({ ...town, cracked: town.cracked + 1 }, id, {
    ...building,
    stock: Math.min(cap, building.stock + reward.batches * buildings[id].batchSize),
    progress: 0,
    cooldowns: { ...building.cooldowns, [reward.code]: town.lastAt + cheats[reward.code].cooldown },
  })
}
