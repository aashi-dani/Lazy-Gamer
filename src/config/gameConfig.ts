const minute = 60_000
export { ageBands, type AgeBand } from '../logic/difficulty'

export * from '../data/catalog'

export const gameConfig = {
  saveKey: 'lazy-gamer-town',
  saveVersion: 7,
  displayInterval: 1_000,
  batchMs: 120 * minute,
  startingCoins: 75,
  startingBatches: 1,
  startingProgress: 0.62,
  maxLevel: 10,
  legacyStoragePerLevel: 4,
  speedPerLevel: 0.18,
  upgradeBasePrice: 120,
  upgradePriceStep: 85,
  historyLimit: 90,
  legacyBoostMaxRate: 3,
  rewards: {
    macroBatches: 2,
    fractionCoins: 40,
    tierMultipliers: [1, 1.5, 2, 2.5, 3],
    speedMinutes: [15, 30, 45, 60, 90],
  },
}
