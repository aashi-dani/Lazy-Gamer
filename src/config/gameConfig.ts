const minute = 60_000
const areaBoostDuration = 10 * minute

export const buildings = {
  coconut: { name: 'Coconut Stall', stockName: 'coconuts', stockUnit: 'coconut', color: '#ffd28d', price: 180, salePrice: 24, batchSize: 2, capacity: 12 },
  bike: { name: 'Bike Shop', stockName: 'bikes', stockUnit: 'bike', color: '#9ce6ed', price: 220, salePrice: 30, batchSize: 2, capacity: 10 },
  tuck: { name: 'Tuck Shop', stockName: 'snacks', stockUnit: 'snack', color: '#ffabb0', price: 190, salePrice: 20, batchSize: 3, capacity: 15 },
} as const

export const buildingIds = ['coconut', 'bike', 'tuck'] as const
export type BuildingId = typeof buildingIds[number]
export const cheatIds = ['macro', 'area', 'fraction'] as const
export type CheatId = typeof cheatIds[number]
export type Difficulty = 'easy' | 'medium' | 'hard'

export const ageBands = {
  explorer: { name: 'Little Explorer', ages: '6–9', difficulty: 'easy' },
  challenger: { name: 'Challenger', ages: '10–13', difficulty: 'medium' },
  // Add dedicated high-school puzzle generators here when that content ships.
  mastermind: { name: 'Mastermind', ages: '14–17', difficulty: 'hard' },
} as const satisfies Record<string, { name: string; ages: string; difficulty: Difficulty }>
export type AgeBand = keyof typeof ageBands

export const cheats = {
  macro: { name: 'Multiplication Macro', icon: 'boxes', description: 'Stack crates to fill a shipment.', reward: 'Instant batch', cooldown: 5 * minute },
  area: { name: 'Area Optimizer', icon: 'fence', description: 'Stretch a fence around a bigger plot.', reward: 'Speed boost', cooldown: areaBoostDuration },
  fraction: { name: 'Fraction Slicer', icon: 'slice', description: 'Slice up a treat to fill an order.', reward: 'Bonus coins', cooldown: 5 * minute },
} as const

export const gameConfig = {
  saveKey: 'lazy-gamer-town',
  saveVersion: 1,
  saveInterval: 5_000,
  displayInterval: 1_000,
  batchMs: 120 * minute,
  startingCoins: 75,
  startingBatches: 1,
  startingProgress: 0.62,
  maxLevel: 5,
  storagePerLevel: 4,
  speedPerLevel: 0.18,
  upgradeBasePrice: 120,
  upgradePriceStep: 85,
  historyLimit: 90,
  macro: {
    efficientReward: 2,
    maxEfficientMoves: 2,
    tiers: {
      easy: { min: 2, max: 5 },
      medium: { min: 3, max: 8 },
      hard: { min: 5, max: 12 },
    },
  },
  area: {
    boostDuration: areaBoostDuration,
    maxBoost: 3,
    tiers: {
      easy: { min: 5, max: 8, threshold: 0.82, step: 1 },
      medium: { min: 8, max: 15, threshold: 0.93, step: 1 },
      hard: { min: 12, max: 20, threshold: 0.98, step: 0.5 },
    },
  },
  fraction: {
    tiers: {
      easy: { min: 2, max: 4, equivalent: false, orders: 1, coins: 40 },
      medium: { min: 3, max: 6, equivalent: true, orders: 1, coins: 65 },
      hard: { min: 4, max: 6, equivalent: true, orders: 2, coins: 100 },
    },
  },
}
