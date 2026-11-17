import { useState } from 'react'
import { cheats, type CheatId, type Difficulty } from '../config/gameConfig'
import type { CheatReward } from '../logic/cheatCodes/rewards'
import { Coin, Icon } from './Icon'
import Modal from './Modal'
import AreaOptimizer from './cheatCodes/AreaOptimizer'
import FractionSlicer from './cheatCodes/FractionSlicer'
import MultiplicationMacro from './cheatCodes/MultiplicationMacro'

export default function CheatCodeModal({ code, difficulty, dismiss, claim }: {
  code: CheatId
  difficulty: Difficulty
  dismiss: () => void
  claim: (reward: CheatReward) => string | null
}) {
  const [result, setResult] = useState<{ label: string; won: boolean }>()
  const onWin = (reward: CheatReward) => {
    const label = claim(reward)
    setResult(label ? { label, won: true } : { label: 'This shop is busy. Give it a moment.', won: false })
  }
  return <Modal title={result?.won ? 'Code cracked!' : cheats[code].name} onDismiss={dismiss}>
    {result ? <div className={`code-result${result.won ? ' won' : ''}`} role="status">
      {result.won && <div className="spark-burst" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => <span key={i} style={{ '--ray': `${i * 36}deg`, '--delay': `${i % 3 * 60}ms` } as React.CSSProperties}>{i % 3 === 0 ? <Coin /> : <Icon name="spark" size={15} />}</span>)}
        <Icon name="check" size={41} />
      </div>}
      <strong>{result.label}</strong>
      <button className="button cyan-button" onClick={dismiss}>Back to the shop <Icon name="arrow" size={18} /></button>
    </div> : <>
      <p className="code-difficulty">{difficulty}</p>
      {code === 'macro' && <MultiplicationMacro difficulty={difficulty} onWin={onWin} />}
      {code === 'area' && <AreaOptimizer difficulty={difficulty} onWin={onWin} />}
      {code === 'fraction' && <FractionSlicer difficulty={difficulty} onWin={onWin} />}
    </>}
  </Modal>
}
