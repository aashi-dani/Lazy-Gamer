import { buildingIds, type BuildingId } from '../data/catalog'
import { biomeIds, biomes, decorations, maxSize, startingSize, type BiomeId, type DecorationId } from '../data/world'

export type Cell = { x: number; y: number }
export type Spot = Cell & { area: BiomeId }
export type Piece = { kind: 'shop'; id: BuildingId } | { kind: 'decoration'; id: DecorationId } | { kind: 'road' }
export type Lot = Spot & Piece
export type TownLayout = { sizes: Record<BiomeId, number>; lots: Lot[] }
const legacyCells: Partial<Record<BuildingId, Cell>> = { coconut: { x: 2, y: 2 }, bike: { x: 5, y: 2 }, tuck: { x: 4, y: 5 } }

export function emptyLayout(): TownLayout {
  return { sizes: { sleepy: startingSize, sunny: startingSize, crystal: startingSize }, lots: [] }
}

export function sameSpot(a: Spot, b: Spot) { return a.x === b.x && a.y === b.y && a.area === b.area }
export function lotAt(layout: TownLayout, spot: Spot) { return layout.lots.find((lot) => sameSpot(lot, spot)) }
export function onMap(layout: TownLayout, { area, x, y }: Spot) {
  const size = layout.sizes[area]
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < size && y < size
}

export function spotForShop(layout: TownLayout, id: BuildingId): Spot | undefined {
  const preferred = legacyCells[id]
  if (preferred) {
    const spot = { ...preferred, area: 'sleepy' } as const
    if (!lotAt(layout, spot)) return spot
  }
  for (const area of biomeIds) {
    const size = layout.sizes[area]
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const spot = { area, x, y }
        if (!lotAt(layout, spot)) return spot
      }
    }
  }
}

export function townCharm(layout: TownLayout) {
  return layout.lots.reduce((sum, lot) => sum + (lot.kind === 'decoration' ? decorations[lot.id].charm : 0), 0)
}
export function charmPercent(layout: TownLayout) { return Math.min(25, Math.floor(townCharm(layout) / 10)) }

export function readLayout(value: unknown, owned: Partial<Record<BuildingId, unknown>>, level: number): TownLayout {
  const layout = emptyLayout()
  const input = value && typeof value === 'object' ? value as Partial<TownLayout> : {}
  for (const area of biomeIds) {
    const size = input.sizes?.[area]
    if (level >= 7 && level >= biomes[area].level && size !== undefined && Number.isInteger(size) && size % 2 === 0
      && size >= startingSize && size <= maxSize) layout.sizes[area] = size
  }
  const placedShops = new Set<BuildingId>()
  for (const lot of Array.isArray(input.lots) ? input.lots.slice(0, maxSize * maxSize * biomeIds.length) : []) {
    if (!lot || typeof lot !== 'object' || !biomeIds.includes(lot.area) || (level < biomes[lot.area].level) || !onMap(layout, lot) || lotAt(layout, lot)) continue
    const { x, y, area } = lot
    if (lot.kind === 'shop' && buildingIds.includes(lot.id) && owned[lot.id] && !placedShops.has(lot.id)) {
      layout.lots.push({ x, y, area, kind: 'shop', id: lot.id })
      placedShops.add(lot.id)
    } else if (lot.kind === 'decoration' && Object.hasOwn(decorations, lot.id)) {
      layout.lots.push({ x, y, area, kind: 'decoration', id: lot.id })
    } else if (lot.kind === 'road') layout.lots.push({ x, y, area, kind: 'road' })
  }
  for (const id of buildingIds) {
    if (!owned[id] || placedShops.has(id)) continue
    let spot = spotForShop(layout, id)
    if (spot && level < biomes[spot.area].level) {
      const replacement = layout.lots.find((lot) => lot.area === 'sleepy' && lot.kind !== 'shop')
      if (replacement) {
        layout.lots = layout.lots.filter((lot) => lot !== replacement)
        spot = replacement
      }
    }
    if (spot) layout.lots.push({ x: spot.x, y: spot.y, area: spot.area, kind: 'shop', id })
  }
  return layout
}

const nearby = (a: Cell, b: Cell) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1

export function routeOnRoads(roads: Cell[], start: Cell, finish: Cell) {
  const key = ({ x, y }: Cell) => `${x}:${y}`
  const queue: Cell[][] = [[start]]
  const seen = new Set([key(start)])
  for (const path of queue) {
    const last = path.at(-1)!
    if (nearby(last, finish)) return [...path, finish]
    for (const road of roads) {
      if (!nearby(last, road) || seen.has(key(road))) continue
      seen.add(key(road))
      queue.push([...path, road])
    }
  }
  return null
}
