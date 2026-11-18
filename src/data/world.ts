export const biomes = {
  sleepy: { name: 'Sleepy Hollow', level: 1, sky: 0x171831, ground: 0x647193, alternate: 0x5d678b, edge: 0x424966, road: 0xa5a1ad, accent: 0xaaa5e2 },
  sunny: { name: 'Sunny Bay', level: 10, sky: 0x183b56, ground: 0xcda67e, alternate: 0xd9b890, edge: 0x9b7964, road: 0xe7d1a4, accent: 0x8be1d6 },
  crystal: { name: 'Crystal Peak', level: 25, sky: 0x222444, ground: 0x788aaf, alternate: 0x8b9fc2, edge: 0x556597, road: 0xc3c6db, accent: 0x9fe7fa },
} as const
export type BiomeId = keyof typeof biomes
export const biomeIds = Object.keys(biomes) as BiomeId[]
export const startingSize = 8
export const maxSize = 16
export const expansionLevel = 7

export function expansionPrice(size: number) { return 250 + (size - startingSize) * 125 }

export const decorations = {
  tree: { name: 'Moonleaf tree', price: 55, charm: 9, level: 4 },
  bench: { name: 'Garden bench', price: 35, charm: 5, level: 4 },
  lamp: { name: 'Star lamp', price: 45, charm: 7, level: 4 },
  fountain: { name: 'Little fountain', price: 110, charm: 16, level: 6 },
  flowers: { name: 'Flower bed', price: 30, charm: 6, level: 4 },
  trophy: { name: 'Rival trophy', price: 0, charm: 20, level: 5 },
  lanterns: { name: 'Lantern arch', price: 0, charm: 12, level: 1 },
  blossom: { name: 'Blossom arch', price: 0, charm: 12, level: 1 },
  shells: { name: 'Beach flags', price: 0, charm: 12, level: 1 },
  wreath: { name: 'Harvest wreath', price: 0, charm: 12, level: 1 },
} as const
export type DecorationId = keyof typeof decorations
export const decorationIds = Object.keys(decorations) as DecorationId[]
export const roadPrice = 5

export const festivals = {
  lanterns: { name: 'Lantern Festival', months: [10, 11, 0, 1] },
  blossom: { name: 'Blossom Fair', months: [2, 3, 4] },
  shells: { name: 'Sunny Bay Festival', months: [5, 6, 7] },
  wreath: { name: 'Harvest Fair', months: [8, 9] },
} as const satisfies Partial<Record<DecorationId, { name: string; months: number[] }>>

export type FestivalId = keyof typeof festivals
export const festivalIds = Object.keys(festivals) as FestivalId[]

export function currentFestival(now: number) {
  const date = new Date(now)
  const month = date.getMonth()
  const id = festivalIds.find((choice) => (festivals[choice].months as readonly number[]).includes(month)) ?? 'lanterns'
  const year = date.getFullYear() - Number(id === 'lanterns' && month < 2)
  return { id, key: `${id}-${year}`, ...festivals[id] }
}

export const quests = {
  firstSale: { name: 'Open for business', goal: 'Make your first sale', target: 1, reward: 30 },
  coconuts: { name: 'Coconut delivery', goal: 'Sell 20 coconuts', target: 20, reward: 120 },
  fractions: { name: 'Slice service', goal: 'Crack Fraction Slicer 3 times', target: 3, reward: 150 },
  roads: { name: 'Pave the way', goal: 'Lay 5 road tiles', target: 5, reward: 55 },
  charm: { name: 'A lovely little town', goal: 'Reach 30 Town Charm', target: 30, reward: 100 },
} as const
export type QuestId = keyof typeof quests
export const questIds = Object.keys(quests) as QuestId[]

export const badges = {
  firstCode: 'Secret solver', townFive: 'Town maker', lucky: 'Ten in a row', charmer: 'Town charmer', rival: 'Good neighbour',
} as const
