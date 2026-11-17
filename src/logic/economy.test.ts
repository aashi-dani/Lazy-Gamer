import { describe, expect, it } from 'vitest'
import { gameConfig } from '../config/gameConfig'
import { advanceTown, emptyTown, newBuilding, sellStock, storageCap, unlockBuilding, upgradeBuilding, withBuilding } from './economy'
import { readTown } from './save'

const now = 1_000
const batch = gameConfig.batchMs
const fresh = () => withBuilding({ ...emptyTown(now), band: 'explorer', coins: 300 }, 'coconut', newBuilding('coconut'))

describe('town economy', () => {
  it('advances through multiple offline batches and keeps partial progress', () => {
    const result = advanceTown(fresh(), now + 2.5 * batch)
    expect(result.made).toBe(4)
    expect(result.town.buildings.coconut?.progress).toBe(0.5)
  })

  it('caps offline stock and restarts production after a sale', () => {
    const { town, made } = advanceTown(fresh(), now + 10_000 * batch)
    expect(made).toBe(storageCap('coconut', 1))
    const sold = sellStock(town, 'coconut')
    expect(sold.buildings.coconut?.stock).toBe(0)
    expect(sold.coins).toBe(300 + made * 24)
    expect(sold.history.at(-1)?.total).toBe(made * 24)
    expect(advanceTown(sold, town.lastAt).made).toBe(0)
    expect(sellStock(sold, 'coconut')).toBe(sold)
  })

  it('credits the boost only for its active window', () => {
    const boost = { rate: 2, endsAt: now + batch / 2 }
    const town = withBuilding(fresh(), 'coconut', { ...newBuilding('coconut'), boost })
    const result = advanceTown(town, now + batch * 1.5)
    expect(result.made).toBe(4)
    expect(result.town.buildings.coconut?.boost).toBeUndefined()
  })

  it('handles a clock rollback without creating stock or resetting timers', () => {
    const town = withBuilding(fresh(), 'coconut', { ...newBuilding('coconut'), cooldowns: { macro: 3_000 } })
    const result = advanceTown(town, 500)
    expect(result.made).toBe(0)
    expect(result.town.buildings.coconut?.cooldowns.macro).toBe(2_500)
    expect(advanceTown(result.town, 500 + batch).made).toBe(2)
  })

  it('buys buildings and upgrades once, only if affordable', () => {
    const initial = fresh()
    const upgraded = upgradeBuilding(initial, 'coconut')
    expect(upgraded.buildings.coconut?.level).toBe(2)
    expect(advanceTown(upgraded, now + batch * 0.9).made).toBe(2)
    expect(unlockBuilding(upgraded, 'bike')).toBe(upgraded)
    const unlocked = unlockBuilding(initial, 'bike')
    expect(unlocked.buildings.bike?.level).toBe(1)
    expect(unlockBuilding(unlocked, 'bike')).toBe(unlocked)
  })

  it('recovers from missing and malformed save data', () => {
    expect(readTown(null, now)).toEqual(emptyTown(now))
    const saved = readTown({ band: 'explorer', coins: -9, buildings: { coconut: { stock: 900, level: 'old', progress: 80 }, bike: null } }, now)
    expect(saved.coins).toBe(0)
    expect(saved.buildings.coconut).toMatchObject({ level: 1, stock: 12, progress: 0 })
    expect(saved.buildings.bike).toBeUndefined()
  })
})
