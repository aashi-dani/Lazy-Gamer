import { cheats, type CheatId } from '../config/gameConfig'
import type { BuildingState } from '../logic/economy'
import { duration } from './BuildingPanel'
import { Icon } from './Icon'

const available: CheatId[] = ['macro', 'area']

export default function CheatCodeList({ building, now, full, open }: {
  building: BuildingState
  now: number
  full: boolean
  open: (id: CheatId) => void
}) {
  return <div className="codes">
    <h3><Icon name="spark" size={19} /> Cheat codes</h3>
    {available.map((id) => {
      const code = cheats[id]
      const wait = (building.cooldowns[id] ?? 0) - now
      const cooling = wait > 0
      const needsRoom = full && id !== 'fraction'
      return <button key={id} type="button" className="code-tile" onClick={() => open(id)} disabled={cooling || needsRoom}>
        <span className="code-icon"><Icon name={code.icon} size={19} /></span>
        <span><strong>{code.name}</strong><small>{cooling ? `Ready in ${duration(wait)}` : needsRoom ? 'Collect stock first' : code.reward}</small></span>
        <Icon name={cooling ? 'clock' : 'chevron'} size={17} />
      </button>
    })}
  </div>
}
