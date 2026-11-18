import { expect, it } from 'vitest'
import { ageBands, buildingIds, buildings, gameConfig, type AgeBand } from '../config/gameConfig'
import { estimateIncome } from './balanceSimulation'
import { advanceTown, emptyTown, newBuilding, saleValue, sellStock, storageCap, withBuilding } from './economy'
import { readTown } from './save'

it('keeps a single full sale below every later shop price, even at maximum bonuses', () => {
  const town = { ...emptyTown(0), tutorialSeen: true }
  for (let index = 0; index < 16; index++) town.layout.lots.push({ kind: 'decoration', id: 'fountain', area: 'sleepy', x: index % 8, y: Math.floor(index / 8) })
  buildingIds.slice(0, -1).forEach((id, index) => {
    const nextPrice = Math.min(...buildingIds.slice(index + 1).map((next) => buildings[next].price))
    expect(saleValue(town, id, storageCap(id, gameConfig.maxLevel))).toBeLessThan(nextPrice)
  })
})

it('keeps prior stock and sells it in batches under the new sale caps', () => {
  const initial = withBuilding({ ...emptyTown(100), band: 'challenger' }, 'bike', { ...newBuilding('bike'), level: 3, stock: 17 })
  const loaded = readTown(initial, 100)
  expect(loaded.buildings.bike?.stock).toBe(17)
  const waiting = advanceTown(loaded, 100 + 60 * 60_000).town
  expect(waiting.buildings.bike?.stock).toBe(17)
  const sold = sellStock(waiting, 'bike')
  expect(sold.buildings.bike?.stock).toBe(17 - storageCap('bike', 3))
  expect(sold.coins).toBe(buildings.bike.salePrice * storageCap('bike', 3))
})

it('makes active play outperform waiting at the requested levels and bands', () => {
  for (const level of [1, 5, 10, 20]) {
    for (const band of Object.keys(ageBands) as AgeBand[]) {
      const baseline = estimateIncome(level, band, false).coinsPerHour
      const active = estimateIncome(level, band, true).coinsPerHour
      expect(active).toBeGreaterThan(baseline * 1.25)
      if (process.env.LAZY_GAMER_BALANCE_REPORT === '1') {
        console.log(`| ${level} | ${ageBands[band].name} | ${baseline.toFixed(1)} | ${active.toFixed(1)} | ${(active / baseline).toFixed(2)}× |`)
      }
    }
  }
})
