import { buildings } from '../data/catalog'
import { biomes, decorations, expansionLevel, expansionPrice, maxSize, roadPrice, type BiomeId } from '../data/world'
import { unlockBuilding, upgradePrice, type TownSave } from './economy'
import { lotAt, onMap, sameSpot, townCharm, type Lot, type Piece, type Spot } from './townLayout'
import { decorAwarded, recordCollect } from './worldProgress'

export function pieceName(piece: Piece) {
  if (piece.kind === 'shop') return buildings[piece.id].name
  if (piece.kind === 'decoration') return decorations[piece.id].name
  return 'Road'
}

export function pieceAccess(town: TownSave, piece: Piece) {
  if (piece.kind === 'road') return { price: roadPrice, issue: '' }
  const item = piece.kind === 'shop' ? buildings[piece.id] : decorations[piece.id]
  const level = 'unlockLevel' in item ? item.unlockLevel : item.level
  if (piece.kind === 'shop' && town.buildings[piece.id]) return { price: 0, issue: '' }
  if (town.playerLevel < level) return { price: item.price, issue: `Player level ${level}` }
  if (piece.kind === 'decoration' && item.price === 0) {
    const placed = town.layout.lots.filter((lot) => lot.kind === 'decoration' && lot.id === piece.id).length
    if (placed >= decorAwarded(piece.id, town.world)) {
      return { price: 0, issue: placed ? 'All rewards placed' : piece.id === 'trophy' ? 'Win Boss Day' : 'Solve its festival relay' }
    }
  }
  return { price: item.price, issue: '' }
}

function placed(town: TownSave, lots: Lot[]) {
  const layout = { ...town.layout, lots }
  const { world } = town
  const peakCharm = Math.max(world.peakCharm, townCharm(layout))
  const peakRoads = Math.max(world.peakRoads, lots.filter((lot) => lot.kind === 'road').length)
  return { ...town, layout, world: { ...world, peakCharm, peakRoads } }
}

export function buildAt(town: TownSave, piece: Piece, to: Spot): TownSave {
  if (!onMap(town.layout, to) || town.playerLevel < biomes[to.area].level || lotAt(town.layout, to)) return town
  const { issue, price } = pieceAccess(town, piece)
  if (issue || price > town.coins) return town
  if (piece.kind === 'shop') {
    const source = town.layout.lots.find((lot) => lot.kind === 'shop' && lot.id === piece.id)
    if (source) return moveLot(town, source, to)
    return unlockBuilding(town, piece.id, to)
  }
  const added = placed({ ...town, coins: town.coins - price, spent: town.spent + price }, [...town.layout.lots, { ...to, ...piece }])
  return piece.kind === 'decoration' ? { ...added, world: recordCollect(added.world, `decor:${piece.id}`) } : added
}

export function moveLot(town: TownSave, from: Spot, to: Spot) {
  const lot = lotAt(town.layout, from)
  if (!lot || !onMap(town.layout, to) || town.playerLevel < biomes[to.area].level || lotAt(town.layout, to)) return town
  return placed(town, town.layout.lots.map((item) => sameSpot(item, from) ? { ...item, ...to } : item))
}

export function refund(town: TownSave, lot: Lot) {
  if (lot.kind === 'road') return roadPrice
  if (lot.kind === 'decoration') return decorations[lot.id].price
  const level = town.buildings[lot.id]?.level ?? 1
  let amount: number = buildings[lot.id].price
  for (let prior = 1; prior < level; prior++) amount += upgradePrice(prior)
  return amount
}

export function removeLot(town: TownSave, spot: Spot): TownSave {
  const lot = lotAt(town.layout, spot)
  if (!lot) return town
  const buildings = { ...town.buildings }
  if (lot.kind === 'shop') delete buildings[lot.id]
  const coins = Math.min(Number.MAX_SAFE_INTEGER, town.coins + refund(town, lot))
  return placed({ ...town, buildings, coins }, town.layout.lots.filter((item) => !sameSpot(item, spot)))
}

export function buyLand(town: TownSave, area: BiomeId) {
  const size = town.layout.sizes[area]
  const price = expansionPrice(size)
  if (town.playerLevel < expansionLevel || town.playerLevel < biomes[area].level || size >= maxSize || town.coins < price) return town
  return { ...town, coins: town.coins - price, spent: town.spent + price, layout: { ...town.layout, sizes: { ...town.layout.sizes, [area]: size + 2 } } }
}
