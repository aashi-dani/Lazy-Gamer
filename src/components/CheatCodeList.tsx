import { cheats, townCheatIds, supportsCheat, type CheatId } from '../config/gameConfig'
import type { AgeBand } from '../logic/difficulty'
import type { BuildingState } from '../logic/economy'
import { duration } from './BuildingPanel'
import { Icon } from './Icon'

export default function CheatCodeList({ building, now, full, level, band, open }: {
  building: BuildingState
  level: number
  band: AgeBand | null
  now: number
  full: boolean
  open: (id: CheatId) => void
}) {
  return <div className="codes">
    <h3><Icon name="spark" size={19} /> Cheat codes</h3>
    {townCheatIds.filter((id) => supportsCheat(id, band)).map((id) => {
      const code = cheats[id]
      const wait = (building.cooldowns[id] ?? 0) - now
      const locked = level < code.unlockLevel
      const practice = !locked && ((full && id !== 'fraction') || wait > 0)
      const reason = locked ? `Opens at player level ${code.unlockLevel}` : wait > 0 ? `Reward ready in ${duration(wait)}` :
        practice ? 'Collect stock to earn a reward' : ''
      return <button key={id} type="button" className="code-tile" onClick={() => open(id)} disabled={locked}>
        <span className="code-icon"><Icon name={code.icon} size={19} /></span>
        <span className="code-copy"><strong>{code.name}</strong><small>{code.reward}</small>
          {reason && <small className="locked-reason">{reason}</small>}</span>
        {locked ? <span className="locked-chip"><Icon name="lock" size={14} /> Locked</span>
          : practice ? <span className="practice-chip">Practice</span> : <Icon name="chevron" size={17} />}
      </button>
    })}
  </div>
}
