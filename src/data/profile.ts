export const avatarOptions = {
  skin: ['Honey', 'Peach', 'Umber', 'Rose', 'Mahogany', 'Sand', 'Cocoa', 'Olive'],
  hair: ['Curls', 'Side sweep', 'Buns', 'Braids', 'Close crop', 'Soft waves', 'Ponytail', 'Locs'],
  hairColor: ['Espresso', 'Chestnut', 'Copper', 'Golden', 'Silver', 'Plum', 'Blue', 'Pink'],
  outfit: ['Teal jacket', 'Lilac overalls', 'Coral sweater', 'Raincoat', 'Garden apron', 'Star hoodie', 'Festival coat'],
  hat: ['None', 'Beanie', 'Sun hat', 'Newsboy cap', 'Moon crown', 'Mayor’s hat'],
  shoes: ['None', 'Canvas shoes', 'Rain boots', 'Star sneakers'],
  backpack: ['None', 'Satchel', 'Trail pack', 'Star pack'],
  accessory: ['None', 'Star clip', 'Round glasses', 'Moon pin'],
} as const

export type AvatarPart = keyof typeof avatarOptions
export type Avatar = Record<AvatarPart, number>
export const avatarLayers = ['backpack', 'shoes', 'outfit', 'skin', 'hair', 'hat', 'accessory'] as const
export const hairTints = ['', 'sepia(.45) saturate(1.6) brightness(1.32)', 'sepia(.8) saturate(4) hue-rotate(332deg) brightness(1.55)',
  'sepia(1) saturate(3) brightness(2.1)', 'grayscale(1) brightness(2.5)', 'hue-rotate(319deg) saturate(2) brightness(1.45)',
  'hue-rotate(268deg) saturate(2) brightness(1.55)', 'hue-rotate(30deg) saturate(2.9) brightness(1.75)']
export const defaultAvatar: Avatar = { skin: 0, hair: 0, hairColor: 0, outfit: 0, hat: 0, shoes: 0, backpack: 0, accessory: 0 }
export const introAvatarOptions = { skin: avatarOptions.skin, hair: avatarOptions.hair.slice(0, 3), outfit: avatarOptions.outfit.slice(0, 3),
  accessory: avatarOptions.accessory.slice(0, 3) }

export const pets = { cat: 'Cat', fox: 'Fox', bunny: 'Bunny', frog: 'Frog', bear: 'Bear', axolotl: 'Axolotl' } as const
export const petOptions = { petHat: ['None', 'Acorn hat', 'Moon cap'], petScarf: ['None', 'Mint scarf', 'Berry scarf'],
  petBow: ['None', 'Peach bow', 'Lilac bow'] } as const
export type PetPart = keyof typeof petOptions
export type PetType = keyof typeof pets
export type Pet = { type: PetType; name: string; evolution: number; accessories?: Record<PetPart, number> }
export const defaultPet: Pet = { type: 'cat', name: 'Mochi', evolution: 0 }
export const petEvolutionLevels = [10, 25, 50]

export function petEvolution(level: number) {
  return petEvolutionLevels.filter((threshold) => threshold <= level).length
}

const blockedWords = /(?:^|[ '-])(?:fuck\p{L}*|shit\p{L}*|bitch\p{L}*|asshole\p{L}*|cunt\p{L}*)(?:$|[ '-])/iu

export function nickname(value: unknown) {
  if (typeof value !== 'string') return ''
  const name = value.normalize('NFC').trim().replace(/ +/g, ' ')
  return Array.from(name).length <= 12 && /^[\p{L}\p{M}\p{N}]+(?:[ '-][\p{L}\p{M}\p{N}]+)*$/u.test(name) && !blockedWords.test(name)
    ? name : ''
}
