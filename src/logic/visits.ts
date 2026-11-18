import { buildingIds, gameConfig, originalBuildingIds, type BuildingId } from '../config/gameConfig'
import { avatarOptions, defaultAvatar, petOptions, pets, type Avatar, type AvatarPart, type PetPart, type PetType } from '../data/profile'
import { biomeIds, decorationIds } from '../data/world'
import { readLayout, type Lot, type TownLayout } from './townLayout'
import type { TownSave } from './economy'

export type SharedTown = {
  buildings: Partial<Record<BuildingId, number>>
  avatar: Avatar
  layout: TownLayout
  pet: { type: PetType; evolution: number; accessories: Record<PetPart, number> }
}
export type Friend = { alias: string; code: string }
export const visitCodeLimit = 28_000
const avatarParts = Object.keys(avatarOptions) as AvatarPart[]
const petParts = Object.keys(petOptions) as PetPart[]
const petTypes = Object.keys(pets) as PetType[]

export function visitCode(town: Pick<TownSave, 'buildings' | 'avatar' | 'pet' | 'layout'>) {
  const { lots, sizes } = town.layout
  const data = [
    buildingIds.map((id) => town.buildings[id]?.level ?? 0),
    avatarParts.map((id) => town.avatar[id]),
    [petTypes.indexOf(town.pet.type), town.pet.evolution, ...petParts.map((part) => town.pet.accessories?.[part] ?? 0)],
    biomeIds.map((area) => sizes[area]),
    lots.map((lot) => [biomeIds.indexOf(lot.area), lot.x, lot.y, lot.kind === 'shop' ? buildingIds.indexOf(lot.id) :
      lot.kind === 'decoration' ? buildingIds.length + decorationIds.indexOf(lot.id) : buildingIds.length + decorationIds.length]),
  ]
  return 'VISIT2-' + btoa(JSON.stringify(data)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

const fits = (value: unknown, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max

function unpackLayout(sizes: unknown, lots: unknown): unknown {
  if (!Array.isArray(sizes) || sizes.length !== biomeIds.length || !Array.isArray(lots)) return
  const parsed: Lot[] = []
  for (const input of lots) {
    if (!Array.isArray(input) || input.length !== 4) continue
    const [areaIndex, x, y, item] = input
    if (!fits(areaIndex, biomeIds.length - 1) || !fits(x, 15) || !fits(y, 15) || !fits(item, buildingIds.length + decorationIds.length)) continue
    const area = biomeIds[areaIndex]
    if (item < buildingIds.length) parsed.push({ x, y, area, kind: 'shop', id: buildingIds[item] })
    else if (item < buildingIds.length + decorationIds.length) parsed.push({ x, y, area, kind: 'decoration', id: decorationIds[item - buildingIds.length] })
    else parsed.push({ x, y, area, kind: 'road' })
  }
  return { sizes: Object.fromEntries(biomeIds.map((area, index) => [area, sizes[index]])), lots: parsed }
}

export function openVisitCode(code: string): SharedTown | null {
  const raw = code.trim()
  if (raw.length > visitCodeLimit || !/^VISIT[12]-[A-Za-z0-9_-]+$/.test(raw)) return null
  const legacy = raw.startsWith('VISIT1-')
  const ids = legacy ? originalBuildingIds : buildingIds
  try {
    const data: unknown = JSON.parse(atob(raw.slice(7).replaceAll('-', '+').replaceAll('_', '/')))
    if (!Array.isArray(data) || data.length !== (legacy ? 3 : 5)) return null
    const [shops, look, pet, sizes, tiles] = data
    if (!Array.isArray(shops) || !Array.isArray(look) || !Array.isArray(pet)
      || shops.length !== ids.length || look.length !== avatarParts.length || pet.length !== 2 + petParts.length
      || !shops.every((level) => fits(level, gameConfig.maxLevel))
      || !look.every((option, index) => fits(option, avatarOptions[avatarParts[index]].length - 1))
      || !fits(pet[0], petTypes.length - 1) || !fits(pet[1], 3) || !pet.slice(2).every((option) => fits(option, 2))) return null
    const buildings: SharedTown['buildings'] = {}
    ids.forEach((id, index) => { if (shops[index]) buildings[id] = shops[index] })
    const avatar = { ...defaultAvatar }
    avatarParts.forEach((key, index) => { avatar[key] = look[index] })
    const accessories = { petHat: 0, petScarf: 0, petBow: 0 }
    petParts.forEach((key, index) => { accessories[key] = pet[index + 2] })
    const layout = readLayout(unpackLayout(sizes, tiles), buildings, 25)
    return { buildings, layout, avatar, pet: { type: petTypes[pet[0]], evolution: pet[1], accessories } }
  } catch {
    return null
  }
}
