import { useRef, useState } from 'react'
import { cheats, type CheatId } from '../config/gameConfig'
import { guide } from '../data/guide'
import { type Tier } from '../logic/difficulty'
import { customerFor } from '../logic/questions'
import { macroReward, slicerReward, speedReward, type CheatReward } from '../logic/cheatCodes/rewards'
import { Guide } from './Guide'
import { Icon } from './Icon'
import Modal from './Modal'
import CheatPuzzle from './cheatCodes/CheatPuzzle'
import { DifficultyStars, ResultBanner } from './cheatCodes/QuestionStatus'

export default function CheatCodeModal({ code, tier, initialSeed, nextSeed, dismiss, claim, attempt, guided, daily = false, practice = false }: {
  code: CheatId
  tier: Tier
  initialSeed: number
  nextSeed: () => number
  dismiss: () => void
  claim: (reward: CheatReward, index: number, complete: boolean) => string | null
  attempt: (correct: boolean) => void
  guided?: { name: string; practice: boolean }
  daily?: boolean
  practice?: boolean
}) {
  const [seed, setSeed] = useState(initialSeed)
  const [order, setOrder] = useState(0)
  const [result, setResult] = useState<{ label: string; won: boolean }>()
  const [areaRewarded, setAreaRewarded] = useState(false)
  const [note, setNote] = useState('')
  const settled = useRef<number>()
  const orderCount = !daily && tier >= 3 ? 2 : 1

  const onMiss = () => {
    if (guided) setNote(guide.wrong)
    attempt(false)
  }

  const onCorrect = () => {
    if (settled.current === seed) return
    settled.current = seed
    attempt(true)
    const reward = code === 'macro' ? macroReward(tier) : code === 'fraction' ? slicerReward(tier, order, orderCount) : speedReward(code, tier)
    const complete = code !== 'fraction' || order === orderCount - 1
    const label = code === 'area' && areaRewarded ? 'Plot solved! Here’s another practice order.' : claim(reward, order, complete)
    if (code === 'area' && label && !daily && !practice) {
      setAreaRewarded(true)
      setNote(label)
      setSeed(nextSeed())
    } else if (!complete && label) {
      setNote(label)
      setOrder(order + 1)
      setSeed(nextSeed())
    } else {
      setResult(label ? { label, won: true } : { label: 'This shop is busy. Try a practice order or collect its stock.', won: false })
    }
  }

  const title = result?.won ? daily ? 'Daily Challenge complete!' : 'Code cracked!' : daily ? `Daily Challenge · ${cheats[code].name}` : cheats[code].name
  return <Modal title={title} onDismiss={dismiss}>
    {result ? <ResultBanner won={result.won}>
      <strong>{result.label}</strong>
      {guided && result.won && <Guide face="excited">{guided.practice ? guide.practice(guided.name) : guide.correct(guided.name)}</Guide>}
      <button className="button cyan-button" onClick={dismiss}>{daily ? 'Back to town' : 'Back to the shop'} <Icon name="arrow" size={18} /></button>
    </ResultBanner> : <>
      {guided && <Guide face="thinking">{guide.macro}</Guide>}
      <DifficultyStars tier={tier} />
      {!guided && <p className="customer-note">Order for {customerFor(seed)}</p>}
      {note && <p className="reward-note" role="status">{note}</p>}
      {practice && <p className="practice-note">Practice order · Earn mastery stars</p>}
      {areaRewarded && <p className="practice-note">Next order · Practice while this code recharges</p>}
      <CheatPuzzle code={code} tier={tier} seed={seed} order={order + 1} totalOrders={orderCount} allowPace={!daily && !practice && !guided} onMiss={onMiss} onCorrect={onCorrect} />
    </>}
  </Modal>
}
