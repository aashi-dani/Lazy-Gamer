import { avatarOptions, petOptions, type AvatarPart, type PetPart } from './profile'

export const wardrobeCategories = { ...avatarOptions, ...petOptions }
export type WardrobePart = AvatarPart | PetPart
export type WardrobeOption = { category: WardrobePart; index: number }
type Unlock = { level?: number; coins?: number; cracked?: number; daily?: number; festival?: boolean }

export const wardrobeLabels: Record<WardrobePart, string> = {
  skin: 'Skin', hair: 'Hair', hairColor: 'Hair colour', outfit: 'Outfits', hat: 'Hats', shoes: 'Shoes',
  backpack: 'Backpacks', accessory: 'Face accessories', petHat: 'Pet hats', petScarf: 'Pet scarves', petBow: 'Pet bows',
}
const unlocks: Partial<Record<WardrobePart, Record<number, Unlock>>> = {
  hair: { 3: { level: 2 }, 4: { level: 2 }, 5: { level: 3 }, 6: { level: 3 }, 7: { level: 3 } },
  outfit: { 3: { coins: 85 }, 4: { level: 4 }, 5: { daily: 3 }, 6: { festival: true } },
  hat: { 1: { level: 2 }, 2: { coins: 70 }, 3: { level: 5 }, 4: { daily: 5 }, 5: { cracked: 25 } },
  shoes: { 1: { level: 2 }, 2: { coins: 55 }, 3: { cracked: 10 } },
  backpack: { 1: { coins: 80 }, 2: { level: 5 }, 3: { daily: 2 } },
  accessory: { 3: { cracked: 5 } },
  petHat: { 1: { level: 2 }, 2: { level: 2, coins: 50 } },
  petScarf: { 1: { level: 2 }, 2: { level: 2, coins: 35 } },
  petBow: { 1: { level: 2 }, 2: { level: 2, daily: 4 } },
}

export function isPetPart(part: WardrobePart): part is PetPart {
  return Object.hasOwn(petOptions, part)
}

export function wardrobeKey({ category, index }: WardrobeOption) {
  return `${category}-${index}`
}

export function itemAt(option: WardrobeOption) {
  const { category, index } = option
  const label = wardrobeCategories[category]?.[index]
  if (!label) return
  return { label, ...unlocks[category]?.[index] }
}

export type WardrobeProgress = { playerLevel: number; coins: number; cracked: number; daily: { streak: number }; wardrobeOwned: string[];
  world: { festivalWins: string[] } }

export function itemAccess(progress: WardrobeProgress, option: WardrobeOption) {
  const item = itemAt(option)
  if (!item) return { allowed: false, cost: 0, label: '' }
  if (progress.wardrobeOwned.includes(wardrobeKey(option))) return { allowed: true, cost: 0, label: '' }
  const { level, coins = 0, cracked, daily, festival } = item
  const requirements = [
    level && progress.playerLevel < level && `Player level ${level}`,
    cracked && progress.cracked < cracked && `Crack ${cracked} cheat codes`,
    daily && progress.daily.streak < daily && `Finish ${daily} Daily Challenges`,
    festival && !progress.world.festivalWins.length && 'Finish a Festival Relay',
  ].filter(Boolean)
  return { allowed: !requirements.length && progress.coins >= coins, cost: coins, label: requirements.join(' · ') }
}

export const wardrobeKeys = Object.entries(wardrobeCategories)
  .flatMap(([part, options]) => options.map((_, index) => wardrobeKey({ category: part as WardrobePart, index })))
