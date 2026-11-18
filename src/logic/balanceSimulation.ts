import { buildingIds, buildings, gameConfig, type AgeBand } from '../config/gameConfig'
import { applyReward, areaReward, macroReward, slicerReward } from './cheatCodes/rewards'
import { coinsForLevel, selectTier } from './difficulty'
import { advanceTown, emptyTown, newBuilding, sellStock, withBuilding, type TownSave } from './economy'

const playHours = 24
const collectionMinutes = 20

export function estimateIncome(level: number, band: AgeBand, useCheats: boolean) {
  const portfolio = buildingIds.filter((id) => buildings[id].unlockLevel <= level)
  const upgradeLevel = Math.min(gameConfig.maxLevel, 1 + Math.floor((level - 1) / 4))
  let town: TownSave = { ...emptyTown(0), band, tutorialSeen: true, playerLevel: level,
    lifetimeCoinsEarned: coinsForLevel(level) }
  for (const id of portfolio) town = withBuilding(town, id, { ...newBuilding(id), level: upgradeLevel })
  const tier = selectTier(band, level)
  const rotations = [macroReward(tier), areaReward(tier), slicerReward(tier, 0, 1)]
  for (let tick = 0; tick <= playHours * (60 / collectionMinutes); tick++) {
    town = advanceTown(town, tick * collectionMinutes * 60_000).town
    for (const [index, id] of portfolio.entries()) {
      town = sellStock(town, id)
      if (!useCheats || tick === playHours * (60 / collectionMinutes) || tick % 3 !== index % 3) continue
      const step = Math.floor(tick / 3)
      const reward = rotations[(step + index) % rotations.length]
      town = applyReward(town, id, reward).town
    }
  }
  return { coinsPerHour: town.coins / playHours, portfolio, upgradeLevel, tier }
}
