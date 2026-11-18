import { useState } from 'react'
import { buildings, cheats, cheatIds, tiersForCheat, type BuildingId, type CheatId } from '../config/gameConfig'
import { ageBands, coinsForLevel, type AgeBand, type Tier } from '../logic/difficulty'

export default function DebugPanel({ band, setBand, level, onLevel, shop, open, addCoins, stock, resetTutorial }: {
  band: AgeBand | null
  setBand: (value: AgeBand) => void
  level: number
  onLevel: (value: number) => void
  shop?: BuildingId
  open: (code: CheatId, tier: Tier) => void
  addCoins: () => void
  stock: (fill: boolean) => void
  resetTutorial: () => void
}) {
  const [tier, setTier] = useState<Tier>(1)
  const [cheat, setCheat] = useState<CheatId>('macro')
  const [override, setOverride] = useState('')
  const target = Number(override)
  return <details className="debug-panel" open>
    <summary>Debug panel</summary>
    <div className="debug-fields">
      <label>Band<select value={band ?? ''} onChange={(e) => setBand(e.target.value as AgeBand)}>
        {!band && <option value="" disabled>Choose a band</option>}
        {Object.entries(ageBands).map(([id, value]) => <option key={id} value={id}>{value.name}</option>)}
      </select></label>
      <label>Tier<select value={tier} onChange={(e) => setTier(Number(e.target.value) as Tier)}>
        {tiersForCheat(cheat).map((option) => <option key={option}>{option}</option>)}
      </select></label>
      <label>Cheat code<select value={cheat} onChange={(e) => {
        const next = e.target.value as CheatId
        setCheat(next)
        if (!tiersForCheat(next).includes(tier)) setTier(tiersForCheat(next)[0])
      }}>
        {cheatIds.map((id) => <option key={id} value={id}>{cheats[id].name}</option>)}
      </select></label>
      <form onSubmit={(event) => {
        event.preventDefault()
        if (target >= 1 && Number.isInteger(target) && Number.isSafeInteger(coinsForLevel(target + 1))) onLevel(target)
      }}>
        <label>Set player level<input type="number" inputMode="numeric" value={override} placeholder={String(level)} min={1}
          onChange={(e) => setOverride(e.target.value)} required /></label>
        <button className="button outline-button" type="submit">Apply level</button>
      </form>
    </div>
    <p>Player level {level}{shop ? ` · ${buildings[shop].name}` : ' · Choose a shop to try a code'}</p>
    <p>Debug changes use a temporary copy of your town.</p>
    <div className="debug-actions">
      <button className="button cyan-button" disabled={!shop || !band} onClick={() => open(cheat, tier)}>Open selected cheat</button>
      <button className="button outline-button" disabled={!shop} onClick={addCoins}>Add 1,000 coins</button>
      <button className="button outline-button" disabled={!shop} onClick={() => stock(true)}>Fill stock</button>
      <button className="button outline-button" disabled={!shop} onClick={() => stock(false)}>Skip shop timer</button>
      <button className="button outline-button" disabled={!shop} onClick={resetTutorial}>Reset tutorial</button>
    </div>
  </details>
}
