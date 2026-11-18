export const tiers = [1, 2, 3, 4, 5] as const
export type Tier = typeof tiers[number]

export const ageBands = {
  explorer: { name: 'Little Explorer', ages: '6–9', min: 1, max: 2 },
  challenger: { name: 'Challenger', ages: '10–13', min: 2, max: 4 },
  mastermind: { name: 'Mastermind', ages: '14–17', min: 3, max: 5 },
} as const
export type AgeBand = keyof typeof ageBands

export function coinsForLevel(level: number) {
  return 50 * level * (level - 1)
}

export function levelFromCoins(coins: number) {
  return Math.floor((1 + Math.sqrt(1 + Math.max(0, coins) / 12.5)) / 2)
}

export function selectTier(band: AgeBand, playerLevel: number, offset = 0): Tier {
  const { min, max } = ageBands[band]
  const baseline = Math.min(max, min + Math.floor(Math.max(1, playerLevel) / 8))
  return Math.max(min, Math.min(max, baseline + offset)) as Tier
}

export function starsForTier(tier: Tier) {
  return Math.ceil(tier / 2)
}
