import { describe, expect, it } from 'vitest'
import { cheats } from '../../config/gameConfig'
import { emptyTown, newBuilding, withBuilding } from '../economy'
import { fillsOrder, makeSlicer, solveSlicer } from './fractionSlicer'
import { applyReward } from './rewards'

describe('Fraction Slicer', () => {
  it('starts with matching slices and adds equivalent fractions and extra orders in later tiers', () => {
    expect(makeSlicer('easy', [0, 0, 0])).toMatchObject({ pieces: 2, orders: [{ numerator: 1, denominator: 2 }], coins: 40 })
    expect(makeSlicer('medium', [0, 0, 0])).toMatchObject({ pieces: 4, orders: [{ numerator: 1, denominator: 2 }], coins: 65 })
    const hard = makeSlicer('hard', [0, 0, 0])
    expect(hard.pieces).toBe(6)
    expect(hard.orders).toHaveLength(2)
    expect(hard.orders[0]).not.toEqual(hard.orders[1])
    expect(solveSlicer(hard, [3, 2])?.coins).toBe(100)
    expect(solveSlicer(hard, [3])).toBeNull()
    expect(solveSlicer(hard, [3, 3])).toBeNull()
  })

  it('matches equivalent fractions and validates slice counts', () => {
    const half = { numerator: 1, denominator: 2 }
    expect(fillsOrder(half, 6, 3)).toBe(true)
    expect(fillsOrder(half, 6, 2)).toBe(false)
    expect(fillsOrder(half, 3, 1.5)).toBe(false)
  })

  it('adds coins and history even when stock is full and rejects repeat rewards', () => {
    const town = withBuilding(emptyTown(3_000), 'tuck', { ...newBuilding('tuck'), stock: 15 })
    const reward = { code: 'fraction', coins: 65 } as const
    const played = applyReward(town, 'tuck', reward)
    expect(played).toMatchObject({ cracked: 1, earned: 65, coins: 65, history: [{ at: 3_000, total: 65 }] })
    expect(played.buildings.tuck?.cooldowns.fraction).toBe(3_000 + cheats.fraction.cooldown)
    expect(applyReward(played, 'tuck', reward)).toBe(played)
  })
})
