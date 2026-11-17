import { describe, expect, it } from 'vitest'
import { gameConfig } from '../../config/gameConfig'
import { emptyTown, newBuilding, withBuilding } from '../economy'
import { bestArea, makeArea, plotSize, snapWidth, solveArea } from './areaOptimizer'
import { applyReward } from './rewards'

describe('Area Optimizer', () => {
  it('changes fence size, steps, and tolerance by tier', () => {
    expect(makeArea('easy', 0)).toMatchObject({ sidesTotal: 5, step: 1, threshold: .82 })
    expect(makeArea('medium', .999)).toMatchObject({ sidesTotal: 15, step: 1, threshold: .93 })
    expect(makeArea('hard', .999)).toMatchObject({ sidesTotal: 20, step: .5, threshold: .98 })
  })

  it('finds the largest usable plot with both whole and half steps', () => {
    const easy = makeArea('easy', 0)
    expect(bestArea(easy)).toBe(6)
    expect(plotSize(easy, 2)).toBe(plotSize(easy, 3))
    expect(solveArea(easy, 1)).toBeNull()

    const hard = makeArea('hard', .15)
    expect(snapWidth(hard, 40)).toBe(12.5)
    expect(solveArea(hard, 6.5)?.rate).toBe(gameConfig.area.maxBoost)
    expect(solveArea(hard, 6.51)).toBeNull()
  })

  it('gives a larger boost for settling on a larger plot', () => {
    const easy = makeArea('easy', .999)
    expect(solveArea(easy, 3)?.rate).toBeLessThan(solveArea(easy, 4)!.rate)
    const hard = makeArea('hard', .999)
    expect(solveArea(hard, 9.5)?.rate).toBeLessThan(solveArea(hard, 10)!.rate)
  })

  it('sets a timed boost and rejects repeat claims until its cooldown ends', () => {
    const town = withBuilding(emptyTown(2_000), 'bike', newBuilding('bike'))
    const reward = { code: 'area', rate: 2.8 } as const
    const boosted = applyReward(town, 'bike', reward)
    const endsAt = 2_000 + gameConfig.area.boostDuration
    expect(boosted.buildings.bike).toMatchObject({ boost: { rate: 2.8, endsAt }, cooldowns: { area: endsAt } })
    expect(applyReward(boosted, 'bike', reward)).toBe(boosted)
  })
})
