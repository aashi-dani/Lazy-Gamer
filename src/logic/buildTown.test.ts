import { expect, it } from 'vitest'
import { defaultPet, petEvolution } from '../data/profile'
import { buildings } from '../data/catalog'
import { currentFestival, decorations, quests } from '../data/world'
import { buildAt, buyLand, moveLot, refund, removeLot } from './buildTown'
import { coinsForLevel } from './difficulty'
import { advanceTown, emptyTown, newBuilding, saleValue, upgradeBuilding, upgradePrice, withBuilding, type TownSave } from './economy'
import { exportTown, importTown, migrateSave, readTown } from './save'
import { charmPercent, lotAt, routeOnRoads, townCharm, type Spot } from './townLayout'
import { decorAwarded, nextBoss, questProgress } from './worldProgress'

const at = (x: number, y: number, area: Spot['area'] = 'sleepy'): Spot => ({ area, x, y })
const fixture = (level = 12): TownSave => ({ ...emptyTown(1000), band: 'challenger', tutorialSeen: true, playerLevel: level,
  lifetimeCoinsEarned: coinsForLevel(level), coins: 10_000, pet: { ...defaultPet, evolution: petEvolution(level) } })

it('places, moves and removes a shop without duplicating it or resetting production', () => {
  const initial = fixture()
  const bakery = { kind: 'shop', id: 'bakery' } as const
  const first = buildAt(initial, bakery, at(3, 4))
  expect(first.coins).toBe(initial.coins - buildings.bakery.price)
  expect(lotAt(first.layout, at(3, 4))).toMatchObject(bakery)
  const afterBatch = advanceTown(first, first.lastAt + 7_200_000).town
  expect(afterBatch.buildings.bakery?.stock).toBe(3)
  const moved = moveLot(afterBatch, at(3, 4), at(1, 1, 'sunny'))
  expect(moved.buildings.bakery).toEqual(afterBatch.buildings.bakery)
  expect(moved.layout.lots).toEqual([{ ...at(1, 1, 'sunny'), ...bakery }])
  const upgraded = upgradeBuilding(moved, 'bakery')
  const removed = removeLot(upgraded, at(1, 1, 'sunny'))
  expect(removed.coins).toBe(initial.coins)
  expect(removed.buildings.bakery).toBeUndefined()
  expect(removed.lifetimeCoinsEarned).toBe(initial.lifetimeCoinsEarned)
})

it('honors price, biome, collision and land-size restrictions with a 25% charm cap', () => {
  const initial = fixture(6)
  const flower = { kind: 'decoration', id: 'flowers' } as const
  expect(buyLand(initial, 'sleepy')).toBe(initial)
  expect(buildAt(initial, flower, at(0, 0, 'sunny'))).toBe(initial)
  expect(buildAt(initial, flower, at(8, 8))).toBe(initial)
  const built = buildAt(initial, flower, at(3, 4))
  expect(buildAt(built, flower, at(3, 4))).toBe(built)
  expect(built.coins).toBe(initial.coins - decorations.flowers.price)
  expect(refund(built, lotAt(built.layout, at(3, 4))!)).toBe(decorations.flowers.price)
  expect(removeLot(built, at(3, 4)).coins).toBe(initial.coins)
  let loop = buyLand(fixture(12), 'sleepy')
  expect(loop.layout.sizes.sleepy).toBe(10)
  for (let index = 0; index < 20; index++) loop = buildAt(loop, { kind: 'decoration', id: 'fountain' }, at(index % 10, Math.floor(index / 10)))
  expect(townCharm(loop.layout)).toBe(320)
  expect(charmPercent(loop.layout)).toBe(25)
  expect(saleValue(loop, 'coconut', 5)).toBe(58)
  expect(questProgress(loop, 'charm')).toBe(quests.charm.target)
})

it('does not spend a trophy twice and routes people along connected roads', () => {
  const town = fixture(12)
  expect(nextBoss(12, [])).toBe(5)
  expect(nextBoss(12, [5])).toBe(10)
  expect(nextBoss(12, [5, 10])).toBeUndefined()
  const ids = currentFestival(new Date(2026, 0, 15).getTime())
  expect(ids.key).toBe('lanterns-2025')
  const rewarded = { ...town, world: { ...town.world, bossWins: [5], festivalWins: [ids.key] } }
  expect(decorAwarded('lanterns', rewarded.world)).toBe(1)
  const trophy = { kind: 'decoration', id: 'trophy' } as const
  const placed = buildAt(rewarded, trophy, at(2, 4))
  expect(buildAt(placed, trophy, at(3, 4))).toBe(placed)
  const road = [at(1, 1), at(2, 1), at(2, 2)]
  expect(routeOnRoads(road, at(0, 1), at(2, 3))).toEqual([at(0, 1), ...road, at(2, 3)])
  expect(routeOnRoads(road.slice(0, 1), at(0, 1), at(2, 3))).toBeNull()
})

it('migrates fixed shops, stock and known wins and round-trips a moved level-ten shop', () => {
  const older = { ...fixture(), layout: undefined, buildings: { coconut: { ...newBuilding('coconut'), level: 5, stock: 9 } },
    history: [{ at: 999, total: 1400, event: { kind: 'cheat', cheat: 'fraction' } }] }
  const migrated = readTown(migrateSave({ town: older }, 4).town, 1000)
  expect(migrated.layout.lots).toEqual([{ ...at(2, 2), kind: 'shop', id: 'coconut' }])
  expect(migrated.world.codeWins.fraction).toBe(1)
  let town = withBuilding(fixture(), 'coconut', { ...newBuilding('coconut'), level: 9, stock: 9 })
  expect(upgradePrice(9)).toBeLessThan(town.coins)
  town = moveLot(upgradeBuilding(town, 'coconut'), at(2, 2), at(6, 4, 'sunny'))
  expect(importTown(exportTown(town), 1000)).toEqual(town)
})
