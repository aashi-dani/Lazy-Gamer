import { tiers, type AgeBand } from '../logic/difficulty'

const minute = 60_000

export const buildings = {
  coconut: { name: 'Coconut Stall', unlockLevel: 1, stockName: 'coconuts', stockUnit: 'coconut', color: '#ffd28d', price: 180, salePrice: 9, batchSize: 2, capacity: 12 },
  bike: { name: 'Bike Shop', unlockLevel: 3, stockName: 'bikes', stockUnit: 'bike', color: '#9ce6ed', price: 220, salePrice: 16, batchSize: 2, capacity: 6 },
  tuck: { name: 'Tuck Shop', unlockLevel: 5, stockName: 'snacks', stockUnit: 'snack', color: '#ffabb0', price: 190, salePrice: 17, batchSize: 3, capacity: 15 },
  bakery: { name: 'Bakery', unlockLevel: 6, stockName: 'loaves', stockUnit: 'loaf', color: '#ffc39b', price: 420, salePrice: 25, batchSize: 3, capacity: 15 },
  orchard: { name: 'Fruit Farm', unlockLevel: 7, stockName: 'fruit baskets', stockUnit: 'fruit basket', color: '#bfed9d', price: 620, salePrice: 34, batchSize: 3, capacity: 15 },
  pond: { name: 'Fish Pond', unlockLevel: 10, stockName: 'fish', stockUnit: 'fish', color: '#8fe3e8', price: 900, salePrice: 43, batchSize: 3, capacity: 15 },
  mill: { name: 'Windmill', unlockLevel: 12, stockName: 'flour sacks', stockUnit: 'flour sack', color: '#f1d493', price: 1350, salePrice: 62, batchSize: 2, capacity: 12 },
  library: { name: 'Library', unlockLevel: 15, stockName: 'books', stockUnit: 'book', color: '#cab6fa', price: 2300, salePrice: 75, batchSize: 2, capacity: 12 },
  observatory: { name: 'Observatory', unlockLevel: 20, stockName: 'star charts', stockUnit: 'star chart', color: '#9ec9fb', price: 4100, salePrice: 100, batchSize: 2, capacity: 12 },
} as const

export type BuildingId = keyof typeof buildings
export const buildingIds = Object.keys(buildings) as BuildingId[]
export const originalBuildingIds = ['coconut', 'bike', 'tuck'] as const
export const cheats = {
  macro: { name: 'Multiplication Macro', topic: 'multiplication', unlockLevel: 1, icon: 'boxes', reward: 'Instant batch', cooldown: 5 * minute },
  area: { name: 'Area Optimizer', topic: 'geometry', unlockLevel: 1, icon: 'fence', reward: 'Speed boost', cooldown: 10 * minute },
  fraction: { name: 'Fraction Slicer', topic: 'fractions', unlockLevel: 1, icon: 'slice', reward: 'Bonus coins', cooldown: 5 * minute },
  sum: { name: 'Sum Stacker', topic: 'addition', unlockLevel: 2, icon: 'plus', reward: 'Speed boost', cooldown: 5 * minute },
  change: { name: 'Change Maker', topic: 'subtraction', unlockLevel: 2, icon: 'minus', reward: 'Speed boost', cooldown: 5 * minute },
  share: { name: 'Fair Share', topic: 'division', unlockLevel: 3, icon: 'friends', reward: 'Speed boost', cooldown: 5 * minute },
  digits: { name: 'Digit Drawers', topic: 'placeValue', unlockLevel: 4, icon: 'drawers', reward: 'Speed boost', cooldown: 5 * minute },
  decimal: { name: 'Decimal Market', topic: 'decimals', unlockLevel: 5, icon: 'market', reward: 'Speed boost', cooldown: 5 * minute },
  sale: { name: 'Sale Sniper', topic: 'percentages', unlockLevel: 6, icon: 'tag', reward: 'Speed boost', cooldown: 5 * minute },
  sort: { name: 'Number Sorter', topic: 'numberSets', unlockLevel: 7, icon: 'drawers', reward: 'Speed boost', cooldown: 5 * minute },
  recipe: { name: 'Recipe Mixer', topic: 'ratios', unlockLevel: 9, icon: 'mix', reward: 'Speed boost', cooldown: 5 * minute },
  leap: { name: 'Line Leaper', topic: 'numberLine', unlockLevel: 10, icon: 'line', reward: 'Speed boost', cooldown: 5 * minute },
  mystery: { name: 'Mystery Orders', topic: 'reasoning', unlockLevel: 11, icon: 'box', reward: 'Speed boost', cooldown: 5 * minute },
  spinner: { name: 'Lucky Spinner', topic: 'probability', unlockLevel: 12, icon: 'spinner', reward: 'Speed boost', cooldown: 5 * minute },
  balance: { name: 'Balance Scales', topic: 'algebra', unlockLevel: 15, icon: 'scale', reward: 'Speed boost', cooldown: 5 * minute },
  elevator: { name: 'Cave Elevator', topic: 'integers', unlockLevel: 8, icon: 'lift', reward: 'Speed boost', cooldown: 5 * minute },
  chart: { name: 'Chart Detective', topic: 'statistics', unlockLevel: 17, icon: 'growth', reward: 'Speed boost', cooldown: 5 * minute },
  pattern: { name: 'Pattern Pipeline', topic: 'sequences', unlockLevel: 14, icon: 'pipe', reward: 'Speed boost', cooldown: 5 * minute },
  angle: { name: 'Angle Archer', topic: 'angles', unlockLevel: 18, icon: 'angle', reward: 'Speed boost', cooldown: 5 * minute },
  till: { name: 'Lightning Till', topic: 'mentalMaths', unlockLevel: 20, icon: 'bolt', reward: 'Speed boost', cooldown: 5 * minute },
  power: { name: 'Power Plant', topic: 'powers', unlockLevel: 22, icon: 'power', reward: 'Speed boost', cooldown: 5 * minute },
  festival: { name: 'Festival Relay', topic: 'festivalPatterns', unlockLevel: 1, icon: 'spark', reward: 'Festival decoration', cooldown: 0 },
} as const

export type CheatId = keyof typeof cheats
export const cheatIds = Object.keys(cheats) as CheatId[]
export const townCheatIds = cheatIds.filter((id) => id !== 'festival')
export function supportsCheat(code: CheatId, band: AgeBand | null, level = Infinity) {
  return level >= cheats[code].unlockLevel && (code !== 'power' || band === 'mastermind')
}
export function tiersForCheat(code: CheatId) { return code === 'power' ? tiers.slice(2) : tiers }

export type Topic = typeof cheats[CheatId]['topic']
export const topicNames: Record<Topic, string> = {
  addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', division: 'Division',
  fractions: 'Fractions', decimals: 'Decimals', percentages: 'Percentages', placeValue: 'Place value', geometry: 'Geometry',
  numberSets: 'Number sets', ratios: 'Ratios', numberLine: 'Number line', reasoning: 'Problem solving',
  probability: 'Probability', festivalPatterns: 'Festival patterns', algebra: 'Algebra', integers: 'Negative numbers',
  statistics: 'Statistics', sequences: 'Sequences', angles: 'Angles', mentalMaths: 'Mental maths', powers: 'Powers and roots',
}

export const startingShop = 'coconut' satisfies BuildingId

export const bossDayInterval = 5

export function availableUnlocks(before: number, after: number, owned: Partial<Record<BuildingId, unknown>>, band: AgeBand | null = null) {
  return [
    ...buildingIds.filter((id) => !owned[id]).map((id) => buildings[id]),
    ...townCheatIds.filter((id) => supportsCheat(id, band)).map((id) => cheats[id]),
  ].filter(({ unlockLevel }) => unlockLevel > before && unlockLevel <= after)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)
}
