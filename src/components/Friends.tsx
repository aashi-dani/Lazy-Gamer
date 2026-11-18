import type { Weather } from '../logic/atmosphere'
import { lazy, Suspense, useState } from 'react'
import { buildingIds, buildings } from '../data/catalog'
import { biomeIds, biomes, type BiomeId } from '../data/world'
import { nickname, pets } from '../data/profile'
import { newBuilding, type TownSave } from '../logic/economy'
import { openVisitCode, visitCode, visitCodeLimit, type Friend, type SharedTown } from '../logic/visits'
import { useGameStore } from '../store/gameStore'
import { AvatarArt, PetArt } from './Guide'
import { Icon } from './Icon'
import { useAndroidBackAction } from '../native/back'
const TownCanvas = lazy(() => import('./world/TownCanvas'))

export default function Friends({ town, daylight, weather, reduced }: { town: TownSave; daylight: boolean; weather: Weather; reduced: boolean }) {
  const [area, setArea] = useState<BiomeId>('sleepy')
  const [alias, setAlias] = useState('')
  const [code, setCode] = useState('')
  const [share, setShare] = useState(false)
  const [note, setNote] = useState('')
  const [visit, setVisit] = useState<{ name: string; snapshot: SharedTown }>()
  const [remove, setRemove] = useState('')
  const ownCode = visitCode(town)
  const store = useGameStore.getState()
  useAndroidBackAction(visit ? () => setVisit(undefined) : undefined)

  const visitFriend = (friend: Friend) => {
    const snapshot = openVisitCode(friend.code)
    if (snapshot) { setArea('sleepy'); setVisit({ name: friend.alias, snapshot }) }
  }

  if (visit) {
    const { name, snapshot } = visit
    const shops: TownSave['buildings'] = {}
    for (const id of buildingIds) {
      const level = snapshot.buildings[id]
      if (level) shops[id] = { ...newBuilding(id), level }
    }
    return <section className="friend-town">
      <button className="button outline-button" onClick={() => setVisit(undefined)}>Back to Friends</button>
      <h2>{name}’s town</h2>
      <label className="profile-field visit-area">Map area<select value={area} onChange={(event) => setArea(event.target.value as BiomeId)}>
        {biomeIds.filter((id) => id === 'sleepy' || snapshot.layout.lots.some((lot) => lot.area === id)).map((id) =>
          <option key={id} value={id}>{biomes[id].name}</option>)}
      </select></label>
      <Suspense fallback={<p className="world-loading">Opening your friend’s map…</p>}>
        <TownCanvas view={{ area, buildings: shops, daylight, weather, reduced, avatar: snapshot.avatar, pet: { ...snapshot.pet, name: pets[snapshot.pet.type] }, layout: snapshot.layout }} readOnly />
      </Suspense>
      <div className="visit-look"><AvatarArt avatar={snapshot.avatar} /><PetArt {...snapshot.pet} /><span>{pets[snapshot.pet.type]}</span></div>
      <ul className="unlocks">{buildingIds.map((id) => snapshot.buildings[id] ?
        <li key={id}>{buildings[id].name}<strong>Shop level {snapshot.buildings[id]}</strong></li> : null)}</ul>
      <p className="muted">You’re visiting the town as it looked when your friend shared the code.</p>
    </section>
  }

  return <section className="friends-panel">
    <div className="side-panel friends-card">
      <h2>Share your town</h2>
      <p>Give a visit code to someone you know. It shares your shops, character look and pet type.</p>
      <button className="button outline-button" type="button" aria-expanded={share} onClick={() => { setShare(!share); setNote('') }}>
        {share ? 'Hide my visit code' : 'Show my visit code'}
      </button>
      {share && <>
        <label className="profile-field">Your visit code<textarea readOnly value={ownCode} rows={2} onFocus={(event) => event.target.select()} /></label>
        <button className="button cyan-button" onClick={async () => {
          try { await navigator.clipboard.writeText(ownCode); setNote('Visit code copied.') }
          catch { setNote('Select and copy the code above.') }
        }}>Copy visit code</button>
      </>}
    </div>
    <form className="side-panel friends-card" onSubmit={(event) => {
      event.preventDefault()
      const name = nickname(alias)
      if (!name) { setNote('Choose a friendly nickname for this town.'); return }
      if (!openVisitCode(code)) { setNote('That visit code could not be opened. Check that you copied the whole code.'); return }
      const friend = { alias: name, code: code.trim() }
      store.saveFriend(friend)
      setAlias('')
      setCode('')
      setNote('')
      visitFriend(friend)
    }}>
      <h2>Add a friend</h2>
      <label className="profile-field">Town nickname<input autoComplete="off" maxLength={12} value={alias}
        onChange={(event) => setAlias(event.target.value)} /></label>
      <label className="profile-field">Friend’s visit code<textarea autoCapitalize="none" spellCheck={false} maxLength={visitCodeLimit} rows={2} value={code}
        onChange={(event) => setCode(event.target.value)} /></label>
      <button className="button cyan-button" type="submit">Save and visit <Icon name="arrow" size={17} /></button>
    </form>
    {note && <p className="friends-note" role="status">{note}</p>}
    {town.friends.length > 0 && <section className="side-panel friends-card saved-friends">
      <h2>Saved towns</h2>
      {town.friends.map((friend) => <div key={friend.alias} className="friend-row">
        <strong>{friend.alias}</strong>
        {remove === friend.alias ? <>
          <button className="button outline-button" onClick={() => setRemove('')}>Keep</button>
          <button className="button danger-button" onClick={() => { store.removeFriend(friend.alias); setRemove('') }}>Remove</button>
        </> : <>
          <button className="button outline-button" onClick={() => visitFriend(friend)}>Visit</button>
          <button className="icon-button" aria-label={`Remove ${friend.alias}`} onClick={() => setRemove(friend.alias)}><Icon name="close" size={18} /></button>
        </>}
      </div>)}
    </section>}
  </section>
}
