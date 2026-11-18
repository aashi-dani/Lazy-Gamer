import { useState } from 'react'
import { avatarOptions, pets, type PetType } from '../../data/profile'
import { badges, decorations, decorationIds, questIds, quests } from '../../data/world'
import type { TownSave } from '../../logic/economy'
import { earnedBadges, questProgress } from '../../logic/worldProgress'
import { useGameStore } from '../../store/gameStore'
import { ProgressMeter } from '../Building'
import { AvatarArt, PetArt } from '../Guide'
import { Coin, Icon } from '../Icon'
import { playSound } from '../sound'

type Chapter = 'Quests' | 'Badges' | 'Collection'

export default function Journal({ town }: { town: TownSave }) {
  const [chapter, setChapter] = useState<Chapter>('Quests')
  const earned = earnedBadges(town)
  const collection = town.world.collected
  return <section className="world-page">
    <div className="category-bar" role="group" aria-label="Town journal chapters">
      {(['Quests', 'Badges', 'Collection'] as const).map((part) =>
        <button key={part} className="button outline-button" aria-pressed={chapter === part} onClick={() => setChapter(part)}>{part}</button>)}
    </div>
    {chapter === 'Quests' && <div className="world-card-grid">
      {questIds.map((id) => {
        const quest = quests[id]
        const progress = questProgress(town, id)
        const claimed = town.world.claimedQuests.includes(id)
        return <article className="side-panel world-card" key={id}>
          <h2>{quest.name}</h2>
          <p>{quest.goal}</p>
          <ProgressMeter value={progress / quest.target} label={`${quest.name} progress`} />
          <span className="quest-progress">{progress} / {quest.target}</span>
          <button className="button gold-button" disabled={claimed || progress < quest.target} onClick={() => {
            useGameStore.getState().claimQuest(id)
            playSound('coin')
          }}>{claimed ? <><Icon name="check" size={17} /> Claimed</> : <><Coin size={18} /> Claim {quest.reward} coins</>}</button>
        </article>
      })}
    </div>}
    {chapter === 'Badges' && <ul className="world-card-grid badges-grid">
      {(Object.keys(badges) as (keyof typeof badges)[]).map((id) => <li key={id} className={`side-panel badge-card${earned[id] ? ' earned' : ''}`}>
        <Icon name={earned[id] ? 'trophy' : 'lock'} size={26} />
        <div><strong>{badges[id]}</strong><p>{{
          firstCode: 'Crack your first cheat code', townFive: 'Reach player level 5',
          lucky: 'Get 10 correct answers in a row', charmer: 'Reach 30 Town Charm', rival: 'Win a Boss Day',
        }[id]}</p></div>
      </li>)}
    </ul>}
    {chapter === 'Collection' && <div className="collection-sections">
      <section><h2>Pets</h2><ul className="collection-grid">{(Object.keys(pets) as PetType[]).map((type) => {
        const found = type === town.pet.type || collection.includes(`pet:${type}`)
        return <li key={type} className={found ? 'collected' : undefined}><PetArt type={type} /><strong>{pets[type]}</strong><small>{found ? 'Collected' : 'Choose in tutorial'}</small></li>
      })}</ul></section>
      <section><h2>Outfits</h2><ul className="collection-grid">{avatarOptions.outfit.map((name, index) => {
        const found = index === town.avatar.outfit || collection.includes(`outfit:${index}`)
        return <li key={name} className={found ? 'collected' : undefined}><AvatarArt avatar={{ ...town.avatar, outfit: index }} />
          <strong>{name}</strong><small>{found ? 'Collected' : 'Wear in Wardrobe'}</small></li>
      })}</ul></section>
      <section><h2>Decorations</h2><ul className="collection-grid">{decorationIds.map((id) => {
        const found = collection.includes(`decor:${id}`) || town.layout.lots.some((lot) => lot.kind === 'decoration' && lot.id === id)
        return <li key={id} className={found ? 'collected' : undefined}><img src={`/art/decor/${id}.svg`} alt="" />
          <strong>{decorations[id].name}</strong><small>{found ? 'Collected' : 'Place in your town'}</small></li>
      })}</ul></section>
    </div>}
  </section>
}
