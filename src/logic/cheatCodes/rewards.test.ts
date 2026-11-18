import { expect, it } from 'vitest'
import { tiers } from '../difficulty'
import { emptyTown, newBuilding, storageCap, withBuilding } from '../economy'
import { applyReward, areaReward, macroReward, slicerReward } from './rewards'

it('scales each reward as specified and keeps the total across multiple orders', () => {
  expect(tiers.map((tier) => macroReward(tier).batches)).toEqual([2, 3, 4, 5, 6])
  expect(tiers.map((tier) => areaReward(tier).minutes)).toEqual([15, 30, 45, 60, 90])
  expect(tiers.map((tier) => slicerReward(tier, 0, 2).coins + slicerReward(tier, 1, 2).coins)).toEqual([40, 60, 80, 100, 120])
})

it('credits one skip, caps progress at storage, and blocks a second claim in cooldown', () => {
  const original = withBuilding(emptyTown(3_000), 'coconut', { ...newBuilding('coconut'), stock: 11, progress: .9 })
  const result = applyReward(original, 'coconut', areaReward(5))
  expect(result.receipt?.skippedMs).toBeCloseTo(12 * 60_000)
  expect(result.town.buildings.coconut?.stock).toBe(storageCap('coconut', 1))
  expect(result.town.cracked).toBe(1)
  expect(result.town.history.at(-1)?.event).toEqual({ kind: 'cheat', cheat: 'area' })
  expect(applyReward(result.town, 'coconut', areaReward(5)).receipt).toBeNull()
})

it('records coins for each order and counts a full code once', () => {
  const original = withBuilding(emptyTown(3_000), 'tuck', { ...newBuilding('tuck'), stock: 15 })
  const first = applyReward(original, 'tuck', slicerReward(5, 0, 2), { complete: false })
  expect(first.town).toMatchObject({ lifetimeCoinsEarned: 60, cracked: 0 })
  const last = applyReward(first.town, 'tuck', slicerReward(5, 1, 2), { continuing: true })
  expect(last.town).toMatchObject({ lifetimeCoinsEarned: 120, cracked: 1 })
  expect(last.town.history.at(-1)?.event).toEqual({ kind: 'cheat', cheat: 'fraction' })
})

it('adds the variety bonus, halves the third repeat, and only counts a fractional order once', () => {
  const source = withBuilding(emptyTown(1_000), 'coconut', newBuilding('coconut'))
  const ready = (town: typeof source) => withBuilding(town, 'coconut', newBuilding('coconut'))
  const initial = applyReward(source, 'coconut', macroReward(1))
  expect(initial.receipt?.stockAdded).toBe(4)
  const second = applyReward(ready(initial.town), 'coconut', macroReward(1))
  expect(second.receipt?.stockAdded).toBe(4)
  const repeat = applyReward(ready(second.town), 'coconut', macroReward(1))
  expect(repeat.receipt).toMatchObject({ stockAdded: 2, multiplier: .5 })
  const first = applyReward(ready(repeat.town), 'coconut', slicerReward(5, 0, 2), { complete: false })
  expect(first.town.variety?.run).toBe(3)
  const last = applyReward(first.town, 'coconut', slicerReward(5, 1, 2), { continuing: true })
  expect(last.town.variety).toEqual({ code: 'fraction', run: 1 })
  expect(last.town.coins).toBe(150)
})
