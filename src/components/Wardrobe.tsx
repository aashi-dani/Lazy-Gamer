import { useState } from 'react'
import { wardrobeCategories, itemAccess, isPetPart, wardrobeLabels, type WardrobePart } from '../data/wardrobe'
import { petEvolutionLevels } from '../data/profile'
import type { TownSave } from '../logic/economy'
import { useGameStore } from '../store/gameStore'
import { AvatarArt, PetArt } from './Guide'
import { Coin, Icon } from './Icon'
import { playSound } from './sound'

const parts = Object.keys(wardrobeCategories) as WardrobePart[]

export default function Wardrobe({ town }: { town: TownSave }) {
  const [category, setCategory] = useState<WardrobePart>('outfit')
  const [preview, setPreview] = useState<number>()
  const [note, setNote] = useState('')
  const petCategory = isPetPart(category)
  const petAccessories = town.pet.accessories ?? { petHat: 0, petScarf: 0, petBow: 0 }
  const equipped = petCategory ? petAccessories[category] : town.avatar[category]
  const index = preview ?? equipped
  const access = itemAccess(town, { category, index })
  const avatar = petCategory ? town.avatar : { ...town.avatar, [category]: index }
  const pet = petCategory ? { ...town.pet, accessories: { ...petAccessories, [category]: index } } : town.pet
  const nextEvolution = petEvolutionLevels[town.pet.evolution]

  return <section className="wardrobe-panel">
    <div className="wardrobe-preview">
      <div><AvatarArt avatar={avatar} /><strong>{town.playerName || 'Shopkeeper'}</strong></div>
      <div>
        <div className="pet-display"><PetArt {...pet} /></div>
        <strong>{pet.name}</strong>
        {nextEvolution ? <small>Next evolution at level {nextEvolution}</small> : <small>Fully evolved</small>}
      </div>
    </div>
    <div className="category-bar" role="group" aria-label="Wardrobe categories">
      {parts.map((part) => <button className="button outline-button" key={part} type="button" aria-pressed={part === category} onClick={() => {
        setCategory(part); setPreview(undefined); setNote('')
      }}>{wardrobeLabels[part]}</button>)}
    </div>
    <div className="wardrobe-items" role="group" aria-label={wardrobeLabels[category]}>
      {wardrobeCategories[category].map((name, id) => {
        const item = itemAccess(town, { category, index: id })
        return <button key={name} type="button" className="wardrobe-card" aria-pressed={id === index} onClick={() => { setPreview(id); setNote('') }}>
          <strong>{name}</strong>
          <span>{id === equipped ? <><Icon name="check" size={16} /> Worn</> : item.label ? <><Icon name="lock" size={16} /> {item.label}</> :
            item.cost ? <><Coin size={16} /> {item.cost} coins</> : 'Ready to wear'}</span>
        </button>
      })}
    </div>
    {index !== equipped && <button className="button cyan-button" type="button" disabled={!access.allowed} onClick={() => {
      useGameStore.getState().equip({ category, index })
      playSound(petCategory ? 'pet-happy' : 'unlock')
      setNote(`${wardrobeCategories[category][index]} equipped.`)
    }}>{access.cost ? `Buy and wear · ${access.cost} coins` : 'Wear it'}</button>}
    {note && <p role="status">{note}</p>}
  </section>
}
