import { useEffect, useState } from 'react'
import { checkAdvanced, type AdvancedQuestion } from '../../logic/cheatCodes/advancedPuzzles'
import { Icon } from '../Icon'
import NumberPad from './NumberPad'
import QuestionActions from './QuestionActions'

const confirmLabels = {
  balance: 'Balance the pans', elevator: 'Send elevator', chart: 'Check the chart', pattern: 'Send the next piece',
  angle: 'Set the angle', till: 'Ring up order', power: 'Charge the cell',
}

function Ray({ angle, name }: { angle: number; name: string }) {
  const value = ((angle % 360) + 360) % 360
  const point = (degrees: number, radius: number) => {
    const rad = degrees / 180 * Math.PI
    return [72 + Math.cos(rad) * radius, 67 - Math.sin(rad) * radius]
  }
  const target = point(value, 54)
  const arc = point(value, 25)
  return <svg className="angle-target" viewBox="0 0 144 134" role="img" aria-label={`${name} ${angle ? `${angle} degrees` : 'ready'}`}>
    <circle cx="72" cy="67" r="53" fill="#232741" stroke="#625980" strokeWidth="2" strokeDasharray="3 5" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((tick) => <circle key={tick} cx={point(tick, 53)[0]} cy={point(tick, 53)[1]} r="2" fill="#9bcddc" />)}
    <path d={`M72 67H126M72 67L${target.join(' ')}`} fill="none" stroke="#ffdb91" strokeWidth="4" strokeLinecap="round" />
    {value > 0 && <path d={`M97 67A25 25 0 ${value > 180 ? 1 : 0} 0 ${arc.join(' ')}`} fill="none" stroke="#a7e6d7" strokeWidth="3" />}
    <circle cx="72" cy="67" r="4" fill="#c9b2ef" />
  </svg>
}

function Shape({ label }: { label: string }) {
  if (!['Circle', 'Square', 'Triangle', 'Diamond'].includes(label)) return <>{label}</>
  return <><svg className="pattern-shape" width="23" height="23" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5">
    {label === 'Circle' ? <circle cx="12" cy="12" r="8" /> : label === 'Square' ? <rect x="4" y="4" width="16" height="16" rx="2" /> :
      label === 'Triangle' ? <path d="M12 4 21 20H3Z" /> : <path d="m12 2 10 10-10 10L2 12Z" />}
  </svg><small>{label}</small></>
}

function Till({ question, allowPace, onCorrect, onMiss }: {
  question: AdvancedQuestion; allowPace: boolean; onCorrect: () => void; onMiss: () => void
}) {
  const orders = question.format.type === 'till' ? question.format.orders : []
  const [order, setOrder] = useState(0)
  const [value, setValue] = useState('')
  const [misses, setMisses] = useState(0)
  const timed = allowPace && question.tier >= 3
  const [clock, setClock] = useState(timed ? 30 : undefined)
  const current = orders[order]
  useEffect(() => {
    if (!timed) return
    const end = performance.now() + 30_000
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((end - performance.now()) / 1000))
      setClock(seconds)
      if (!seconds) window.clearInterval(timer)
    }, 200)
    return () => window.clearInterval(timer)
  }, [timed])
  if (!current) return null
  const submit = () => {
    if (!value) return
    if (Number(value) !== current.answer) {
      onMiss()
      setMisses((count) => count + 1)
    } else if (order === orders.length - 1) onCorrect()
    else {
      setOrder(order + 1)
      setValue('')
      setMisses(0)
    }
  }
  return <>
    {timed && (clock ? <p className="till-clock"><Icon name="clock" size={18} />Quick round · {clock}s</p> :
      clock === 0 && <p className="till-clock" role="status">Take your time with the remaining orders.</p>)}
    <div className="till-display">
      <Icon name="bolt" size={26} />
      <strong>{current.expression}</strong>
      {orders.length > 1 && <span>Order {order + 1} of {orders.length}</span>}
    </div>
    <NumberPad value={value} setValue={setValue} label="Order total" />
    <QuestionActions key={order} hint={question.hint1} hint2={question.hint2} explanation={`${current.expression} = ${current.answer}.`}
      misses={misses} feedback={misses ? 'Check the order total and try again.' : ''}>
      <button type="button" className="button cyan-button" disabled={!value} onClick={submit}>Ring up order</button>
    </QuestionActions>
  </>
}

export default function AdvancedPuzzle({ question, allowPace = false, onCorrect, onMiss }: {
  question: AdvancedQuestion; allowPace?: boolean; onCorrect: () => void; onMiss: () => void
}) {
  const [selected, setSelected] = useState('')
  const [misses, setMisses] = useState(0)
  const { format, cheat } = question
  const choose = (value: string) => setSelected(value)
  if (format.type === 'till') return <div className="puzzle new-puzzle advanced-puzzle">
    <p className="puzzle-goal">{question.prompt}</p>
    <Till question={question} allowPace={allowPace} onCorrect={onCorrect} onMiss={onMiss} />
  </div>
  const selectButtons = <>
    {question.choices.map((option) => <button type="button" className="puzzle-tile" key={option.value}
      onClick={() => choose(option.value)} aria-pressed={selected === option.value}>
      {format.type === 'pattern' ? <Shape label={option.label} /> : option.label}
      {selected === option.value && <Icon name="check" size={15} />}
    </button>)}
  </>
  const chartFloor = format.type === 'chart' ? format.truncated ?? 0 : 0
  const chartRange = format.type === 'chart' ? Math.max(...format.bars.map(({ value }) => value)) - chartFloor : 1
  return <div className={`puzzle new-puzzle advanced-puzzle puzzle-${cheat}`}>
    <p className="puzzle-goal">{question.prompt}</p>
    {format.type === 'balance' && <div className="scale-board">
      <div className="scale-pan"><Icon name="box" size={24} /><strong>{format.left.replace('□', selected || '□')}</strong><span>Left pan</span></div>
      <Icon name="scale" size={35} />
      <div className="scale-pan"><Icon name="box" size={24} /><strong>{format.right}</strong><span>Right pan</span></div>
    </div>}
    {format.type === 'elevator' && <div className="elevator-board">
      <div><Icon name="lift" size={30} /><strong>{format.route}</strong><span>{selected ? `Floor ${selected}` : 'Choose a floor'}</span></div>
      <div className="elevator-stops" role="group" aria-label="Elevator floors">{selectButtons}</div>
    </div>}
    {format.type === 'chart' && <figure className="detective-chart">
      {format.truncated !== undefined && <figcaption>Scale starts at {format.truncated} orders</figcaption>}
      <ul className={format.display === 'dots' ? 'detective-data' : ''}>
        {format.bars.map(({ label, value }) => <li key={label}>
          <strong>{label}</strong>
          {format.display === 'pictogram' ? <span className="chart-pictures" aria-label={`${value} pictures`}>
            {Array.from({ length: value }, (_, i) => <Icon key={i} name="leaf" size={16} />)}
          </span> : format.display !== 'dots' ? <span className="detective-bar" style={{ '--bar-width': `${(value - chartFloor) / chartRange * 100}%` } as React.CSSProperties} /> : null}
          {format.display !== 'pictogram' && <span className="bar-value">{value}</span>}
        </li>)}
      </ul>
      {format.display === 'pictogram' && <figcaption>Each picture stands for one order.</figcaption>}
    </figure>}
    {format.type === 'pattern' && <div className="pipeline-track" aria-label="Pipeline pattern">
      {format.shown.map((item, index) => <span key={index}><Shape label={item} /></span>)}
      <span className="pipeline-end"><Shape label={selected || format.index} /></span>
    </div>}
    {format.type === 'angle' && <Ray angle={format.shown || (selected ? Number(selected) : 0)} name={format.name} />}
    {format.type === 'power' && <div className="power-panel"><Icon name="power" size={32} />
      <strong>{format.shown}</strong><span>{selected ? `Cell ${selected} selected` : 'Select a power cell'}</span>
    </div>}
    {format.type !== 'elevator' && <div className="tile-tray" role="group" aria-label="Answer choices">{selectButtons}</div>}
    <QuestionActions hint={question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses}
      feedback={misses ? 'Use the hint and have another go.' : ''}>
      <button type="button" className="button cyan-button" disabled={!selected} onClick={() => {
        if (checkAdvanced(question, selected)) onCorrect()
        else { onMiss(); setMisses((count) => count + 1) }
      }}>{confirmLabels[cheat]}</button>
    </QuestionActions>
  </div>
}
