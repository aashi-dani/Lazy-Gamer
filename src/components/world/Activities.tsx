import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cheatIds, cheats, topicNames, townCheatIds, supportsCheat, tiersForCheat, type CheatId } from '../../data/catalog'
import { currentFestival } from '../../data/world'
import { selectTier, type Tier } from '../../logic/difficulty'
import type { TownSave } from '../../logic/economy'
import { nextBoss } from '../../logic/worldProgress'
import { useGameStore } from '../../store/gameStore'
import CheatPuzzle from '../cheatCodes/CheatPuzzle'
import { DifficultyStars, ResultBanner } from '../cheatCodes/QuestionStatus'
import { Icon } from '../Icon'
import Modal from '../Modal'
import { playSound } from '../sound'

type Activity = 'rush' | 'boss' | 'lab' | 'festival'
type Order = { code: CheatId; tier: Tier; seed: number; serial: number }
type Run = { activity: Activity; order: Order; points: number; limit: number; until?: number; boss?: number; festival?: string }
const titles = { rush: 'Market Rush', boss: 'Boss Day', lab: 'Practice Lab', festival: 'Festival Relay' }

export default function Activities({ town, now, openTown, onActive }: { town: TownSave; now: number; openTown: () => void; onActive: (active: boolean) => void }) {
  const [labCode, setLabCode] = useState<CheatId>('macro')
  const [labTier, setLabTier] = useState<Tier>(1)
  const [run, setRun] = useState<Run>()
  const [result, setResult] = useState<{ title: string; text: string }>()
  const [seconds, setSeconds] = useState(60)
  const active = useRef<Run>()
  const serial = useRef(0)
  const handled = useRef(-1)
  const store = useGameStore.getState()
  const boss = nextBoss(town.playerLevel, town.world.bossWins)
  const festival = currentFestival(now)
  const festivalDone = town.world.festivalWins.includes(festival.key)
  const timed = town.band !== 'explorer'
  const labSelection = supportsCheat(labCode, town.band) ? labCode : 'macro'

  const finish = (current: Run) => {
    if (active.current?.order.serial !== current.order.serial) return
    let text: string
    if (current.activity === 'rush') {
      store.finishRush(current.points, Boolean(current.until))
      text = `${current.points} ${current.points === 1 ? 'order' : 'orders'} filled. Your best score is saved.`
    } else if (current.activity === 'boss') {
      store.finishBoss(current.boss!)
      text = 'You won a Rival trophy. Find it in Build town under Decor.'
    } else if (current.activity === 'festival') {
      store.finishFestival(current.festival!)
      text = festivalDone ? 'Festival delivery complete.' : 'You earned a seasonal decoration and unlocked the Festival coat in Wardrobe.'
    } else text = 'Practice complete. See your mastery stars in Growth.'
    active.current = undefined
    setRun(undefined)
    setResult({ title: `${titles[current.activity]} complete!`, text })
    playSound('level-up')
  }

  const getOrder = (activity: Activity, offset: number): Order => {
    const { town: latest } = useGameStore.getState()
    const codes = townCheatIds.filter((code) => supportsCheat(code, latest.band, latest.playerLevel))
    const code = activity === 'lab' ? labSelection : activity === 'festival' ? 'festival' : codes[(offset + serial.current) % codes.length]
    const difficulty = selectTier(latest.band ?? 'explorer', latest.playerLevel, latest.topics[cheats[code].topic]?.offset)
    const tier = activity === 'lab' ? labTier : activity === 'rush' && timed ? Math.max(3, difficulty) as Tier : difficulty
    return { code, tier, seed: store.nextQuestion(code, tier), serial: ++serial.current }
  }

  const begin = (activity: Activity) => {
    const current: Run = { activity, points: 0, order: getOrder(activity, 0), limit: activity === 'festival' || activity === 'lab' ? 1 : 5 }
    if (activity === 'rush' && timed) {
      current.until = performance.now() + 60_000
      current.limit = Infinity
      setSeconds(60)
    }
    if (activity === 'boss') current.boss = boss
    if (activity === 'festival') current.festival = festival.key
    active.current = current
    setRun(current)
    playSound('door-chime')
  }

  const close = () => {
    const current = active.current
    if (current?.activity === 'rush') store.finishRush(current.points, Boolean(current.until))
    active.current = undefined
    setRun(undefined)
    setResult(undefined)
  }

  const onAnswer = (correct: boolean) => {
    const current = active.current
    if (!current || handled.current === current.order.serial) return
    if (current.until && performance.now() >= current.until) { finish(current); return }
    const { code, tier } = current.order
    store.answer(code, tier, correct, true)
    playSound(correct ? 'correct' : 'gentle-wrong')
    if (!correct) return
    handled.current = current.order.serial
    const next = { ...current, points: current.points + 1 }
    if (next.activity === 'rush') store.finishRush(next.points, Boolean(next.until))
    if (next.points >= next.limit) { finish(next); return }
    next.order = getOrder(next.activity, next.points)
    active.current = next
    setRun(next)
  }

  const timeLimit = run?.until
  useEffect(() => {
    if (!timeLimit) return
    const timer = window.setInterval(() => {
      const left = Math.ceil((timeLimit - performance.now()) / 1000)
      setSeconds(Math.max(0, left))
      if (left <= 0 && active.current) finish(active.current)
    }, 200)
    return () => window.clearInterval(timer)
  }, [timeLimit])

  const opened = Boolean(run || result)
  useEffect(() => {
    if (!opened) return
    onActive(true)
    return () => onActive(false)
  }, [opened, onActive])

  return <section className="world-page">
    <div className="world-card-grid">
      <article className="side-panel world-card">
        <h2><Icon name="town" size={20} /> Town Mode</h2><p>Run your shops and build your town.</p>
        <button className="button outline-button" onClick={openTown}>Return to town</button>
      </article>
      <article className="side-panel world-card">
        <h2><Icon name="clock" size={20} /> Market Rush</h2>
        <p>{timed ? 'Fill as many orders as you can in 60 seconds.' : 'Fill five orders at your own pace.'}</p>
        <p>Personal best {timed ? town.world.rushBest : town.world.relaxedBest}</p>
        <button className="button cyan-button" disabled={town.playerLevel < 5} onClick={() => begin('rush')}>
          {town.playerLevel < 5 ? 'Opens at level 5' : 'Start Market Rush'}
        </button>
      </article>
      <article className="side-panel world-card">
        <h2><Icon name="trophy" size={20} /> Boss Day</h2>
        <p>{boss ? `A rival shop is here for your level ${boss} showdown. Solve five orders to win a trophy.`
          : `Your next rival arrives at level ${Math.floor(town.playerLevel / 5) * 5 + 5}.`}</p>
        <button className="button cyan-button" disabled={!boss} onClick={() => begin('boss')}>Meet the rival</button>
      </article>
      <article className="side-panel world-card">
        <h2><Icon name="book" size={20} /> Practice Lab</h2>
        <p>Pick a topic and tier to work on mastery stars.</p>
        <div className="lab-fields">
          <label className="profile-field">Topic<select value={labSelection} onChange={(event) => {
            const code = event.target.value as CheatId
            setLabCode(code)
            if (!tiersForCheat(code).includes(labTier)) setLabTier(tiersForCheat(code)[0])
          }}>
            {cheatIds.filter((code) => supportsCheat(code, town.band)).map((code) => <option key={code} value={code}>{topicNames[cheats[code].topic]}</option>)}
          </select></label>
          <label className="profile-field">Tier<select value={labTier} onChange={(event) => setLabTier(Number(event.target.value) as Tier)}>
            {tiersForCheat(labSelection).map((tier) => <option key={tier} value={tier}>{tier}</option>)}
          </select></label>
        </div>
        <button className="button cyan-button" onClick={() => begin('lab')}>Start practice</button>
      </article>
      <article className="side-panel world-card seasonal-card" data-festival={festival.id}>
        <h2><Icon name="spark" size={20} /> {festival.name}</h2>
        <p>{festivalDone ? 'Seasonal decoration earned.' : 'Solve a Festival Relay to earn this season’s decoration.'}</p>
        <img src={`/art/decor/${festival.id}.svg`} alt="" />
        <button className="button cyan-button" onClick={() => begin('festival')}>{festivalDone ? 'Play the relay again' : 'Play Festival Relay'}</button>
      </article>
    </div>
    {run && createPortal(<Modal title={run.activity === 'festival' ? `${festival.name} · Festival Relay` : `${titles[run.activity]} · ${cheats[run.order.code].name}`} onDismiss={close}>
      <div className="activity-score">
        {run.until ? <><span>{seconds}s left</span><strong>{run.points} filled</strong></> :
          run.limit > 1 ? <strong>Order {run.points + 1} of {run.limit}</strong> : null}
      </div>
      <DifficultyStars tier={run.order.tier} />
      <CheatPuzzle key={run.order.serial} {...run.order} onMiss={() => onAnswer(false)} onCorrect={() => onAnswer(true)} />
      {run.activity === 'rush' && run.until && <button className="button outline-button skip-order" onClick={() => {
        const next = { ...run, order: getOrder('rush', run.points + 1) }
        active.current = next
        setRun(next)
      }}>Skip this order</button>}
    </Modal>, document.getElementById('game-screen')!.parentElement!)}
    {result && createPortal(<Modal title={result.title} onDismiss={close}>
      <ResultBanner won><strong>{result.text}</strong><button className="button cyan-button" onClick={close}>Back to activities</button></ResultBanner>
    </Modal>, document.getElementById('game-screen')!.parentElement!)}
  </section>
}
