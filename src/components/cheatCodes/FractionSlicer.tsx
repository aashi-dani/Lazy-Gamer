import { useState, type CSSProperties } from 'react'
import type { Difficulty } from '../../config/gameConfig'
import { fillsOrder, makeSlicer, solveSlicer, type FractionReward } from '../../logic/cheatCodes/fractionSlicer'
import { Icon } from '../Icon'

function onCircle(degrees: number, radius: number) {
  const radians = degrees * Math.PI / 180
  return { x: 100 + Math.cos(radians) * radius, y: 100 + Math.sin(radians) * radius }
}

function SlicePie({ pieces, sliced, selected, toggle }: { pieces: number; sliced: boolean; selected: number[]; toggle: (i: number) => void }) {
  const angle = 360 / pieces
  return <div className="treat">
    <svg aria-hidden="true" viewBox="0 0 200 200">
      <circle cx="100" cy="103" r="95" fill="#332d48" stroke="#4e4262" strokeWidth="2" />
      <circle cx="100" cy="101" r="83" fill="#975364" />
      <circle cx="100" cy="97" r="82" fill="#f4b285" stroke="#f9cc98" strokeWidth="4" />
      <circle cx="100" cy="97" r="74" fill="#e4868e" stroke="#f9c19b" strokeDasharray="2 5" strokeWidth="3" />
      {Array.from({ length: pieces }, (_, i) => {
        const start = onCircle(-90 + i * angle, 74)
        const end = onCircle(-90 + (i + 1) * angle, 74)
        const topping = onCircle(-90 + (i + .5) * angle, 33)
        return <g key={i} transform="translate(0 -3)">
          {sliced && <path d={`M100 100 L${start.x} ${start.y} A74 74 0 0 1 ${end.x} ${end.y}Z`}
            fill={selected.includes(i) ? '#f8c275' : '#dc899c'} stroke="#ffe1ac" strokeWidth="2" />}
          <path d={`M${topping.x-5} ${topping.y}q5-7 10 0-2 8-5 8t-5-8Z`} fill="#a6486b" />
          <path d={`M${topping.x} ${topping.y-1}l3-4 3 1`} stroke="#a5c67c" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </g>
      })}
    </svg>
    {sliced && Array.from({ length: pieces }, (_, i) => {
      const point = onCircle(-90 + (i + .5) * angle, 59)
      const picked = selected.includes(i)
      return <button key={i} className="slice-hit" style={{ '--x': `${point.x}%`, '--y': `${point.y}%` } as CSSProperties}
        onClick={() => toggle(i)} aria-pressed={picked} aria-label={`Slice ${i + 1}`}>
        {picked ? <Icon name="check" size={16} /> : <span aria-hidden="true">{i + 1}</span>}
      </button>
    })}
  </div>
}

export default function FractionSlicer({ difficulty, onWin }: { difficulty: Difficulty; onWin: (reward: FractionReward) => void }) {
  const [puzzle] = useState(() => makeSlicer(difficulty, [Math.random(), Math.random(), Math.random()]))
  const [sliced, setSliced] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [filled, setFilled] = useState<number[]>([])
  const [hint, setHint] = useState('')
  const order = puzzle.orders[filled.length]
  return <div className="puzzle">
    <div className="order-slip">
      <span>{puzzle.orders.length > 1 ? `Order ${filled.length + 1} of ${puzzle.orders.length}` : 'Customer order'}</span>
      <strong className="fraction" aria-label={`${order.numerator} out of ${order.denominator} equal parts`}><span>{order.numerator}</span><span>{order.denominator}</span></strong>
    </div>
    <p>{sliced ? 'Tap slices to fill the order.' : `Cut the treat into ${puzzle.pieces} equal slices.`}</p>
    <div className="puzzle-board slice-board">
      <SlicePie pieces={puzzle.pieces} sliced={sliced} selected={selected} toggle={(i) => {
        setSelected((old) => old.includes(i) ? old.filter((n) => n !== i) : [...old, i])
        setHint('')
      }} />
      {sliced && <strong className="board-count">{selected.length} / {puzzle.pieces} slices picked</strong>}
    </div>
    <p className="puzzle-hint" role="status">{hint}</p>
    <button className="button cyan-button" onClick={() => {
      if (!sliced) { setSliced(true); return }
      if (!fillsOrder(order, puzzle.pieces, selected.length)) { setHint('Almost! Try a different share of the treat.'); return }
      const next = [...filled, selected.length]
      const reward = solveSlicer(puzzle, next)
      if (reward) onWin(reward)
      else { setFilled(next); setSelected([]); setSliced(false); setHint('Order filled! Here comes another.') }
    }}>{sliced ? 'Serve the order' : 'Slice the treat'}</button>
  </div>
}
