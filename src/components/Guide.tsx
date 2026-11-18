import type { ReactNode } from 'react'
import { avatarLayers, hairTints, petOptions, type Avatar, type Pet, type PetPart, type PetType } from '../data/profile'

export function Guide({ face = 'happy', children }: { face?: 'happy' | 'thinking' | 'excited' | 'waving'; children: ReactNode }) {
  return <div className="guide">
    <img src={`/art/juno/${face}.svg`} alt="" width="84" height="84" />
    <div className="guide-bubble"><strong>Mayor Juno</strong><p>{children}</p></div>
  </div>
}

export function AvatarArt({ avatar }: { avatar: Avatar }) {
  return <div className="avatar-art" role="img" aria-label="Your character preview">
    {avatarLayers.filter((layer) => ['outfit', 'skin', 'hair'].includes(layer) || avatar[layer] > 0).map((layer) =>
      <img key={layer} src={`/art/avatar/${layer}-${avatar[layer]}.svg`} alt="" width="132" height="132"
        style={layer === 'hair' ? { filter: hairTints[avatar.hairColor] } : undefined} />)}
  </div>
}

export function PetArt({ type, evolution = 0, accessories }: { type: PetType; evolution?: number; accessories?: Pet['accessories'] }) {
  return <span className="pet-art" aria-hidden="true">
    <img src={`/art/pets/${type}.svg`} alt="" width="64" height="58" />
    {evolution > 0 && <img src={`/art/pets/evolution-${evolution}.svg`} alt="" width="64" height="58" />}
    {accessories && (Object.keys(petOptions) as PetPart[]).filter((part) => accessories[part] > 0).map((part) =>
      <img key={part} src={`/art/pets/${part}-${accessories[part]}.svg`} alt="" width="64" height="58" />)}
  </span>
}
