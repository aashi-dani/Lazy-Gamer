import type { BuildingId } from './catalog'

export function shopArt(id: BuildingId, level = 1) {
  const stage = level >= 10 ? 10 : level >= 7 ? 7 : level >= 4 ? 4 : 1
  return stage === 1 ? `/art/${id}.svg` : `/art/shop/${id}-${stage}.svg`
}
