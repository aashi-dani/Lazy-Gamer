import { expect, it } from 'vitest'
import { ageBands, coinsForLevel, levelFromCoins, selectTier } from './difficulty'

it('calculates each lifetime-coin boundary', () => {
  for (let level = 2; level <= 100; level++) {
    expect(levelFromCoins(coinsForLevel(level) - 1)).toBe(level - 1)
    expect(levelFromCoins(coinsForLevel(level))).toBe(level)
  }
})

it('starts each band at its floor and clamps growth and adaptive offsets', () => {
  expect(selectTier('explorer', 1)).toBe(1)
  expect(selectTier('challenger', 1)).toBe(2)
  expect(selectTier('mastermind', 1)).toBe(3)
  expect(selectTier('challenger', 8)).toBe(3)
  expect(selectTier('mastermind', 15, 1)).toBe(5)
  for (const band of Object.keys(ageBands) as (keyof typeof ageBands)[]) {
    expect(selectTier(band, 1, -1)).toBe(ageBands[band].min)
    expect(selectTier(band, 100, 1)).toBe(ageBands[band].max)
  }
})
