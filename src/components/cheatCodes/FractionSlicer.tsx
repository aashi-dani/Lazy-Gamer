import { useState } from 'react'
import type { SlicerQuestion } from '../../logic/cheatCodes/fractionSlicer'
import { validateSlicer } from '../../logic/cheatCodes/fractionSlicer'
import QuestionActions from './QuestionActions'
import NumberPad from './NumberPad'
import Stepper from './Stepper'
import { Icon } from '../Icon'

function onCircle(degrees: number, radius: number) {
  const radians = degrees * Math.PI / 180
  return { x: 100 + Math.cos(radians) * radius, y: 97 + Math.sin(radians) * radius }
}

function SlicePie({ count, selected, marked, toggle, available }: {
  count: number
  selected: number[]
  marked: number[]
  toggle?: (index: number) => void
  available?: readonly number[]
}) {
  const indices = Array.from({ length: count }, (_, i) => i)
  const angle = 360 / count
  return <div className="puzzle-board slice-board">
    <div className="treat">
      <svg aria-hidden="true" viewBox="0 0 200 200">
        <circle cx="100" cy="103" r="95" fill="#332d48" stroke="#4e4262" strokeWidth="2" />
        <circle cx="100" cy="99" r="83" fill="#975364" />
        <circle cx="100" cy="97" r="82" fill="#f4b285" stroke="#f9cc98" strokeWidth="4" />
        {indices.map((index) => {
          const middle = -90 + (index + .5) * angle
          const start = onCircle(middle - angle / 2, 76)
          const end = onCircle(middle + angle / 2, 76)
          const topping = onCircle(middle, 34)
          const number = onCircle(middle, 57)
          const active = toggle && (!available || available.includes(index))
          const picked = selected.includes(index)
          return <g key={index} onClick={active ? () => toggle(index) : undefined} className={active ? 'treat-wedge' : undefined}>
            <path d={`M100 97 L${start.x} ${start.y} A76 76 0 0 1 ${end.x} ${end.y}Z`}
              fill={picked ? '#ffd36b' : marked.includes(index) ? '#aadaae' : index % 2 === 0 ? '#e88c9a' : '#df819a'}
              stroke="#ffe1ac" strokeWidth="1.25" opacity={available && !available.includes(index) ? .55 : 1} />
            <path d={`M${topping.x - 4} ${topping.y}q4-6 8 0-2 7-4 7t-4-7Z`} fill="#944360" />
            {toggle && <text x={number.x} y={number.y} textAnchor="middle" dominantBaseline="central"
              fill="#392539" fontSize="10" fontWeight="900">{picked ? '✓' : index + 1}</text>}
          </g>
        })}
      </svg>
    </div>
    {toggle && <div className="slice-picks" role="group" aria-label="Choose slices">
      {indices.map((index) => <button type="button" key={index} className="button outline-button" aria-pressed={selected.includes(index)}
        aria-label={`Slice ${index + 1}`} disabled={available !== undefined && !available.includes(index)} onClick={() => toggle(index)}>
        {selected.includes(index) ? <Icon name="check" size={18} /> : index + 1}
      </button>)}
    </div>}
    {toggle && <strong className="board-count" aria-live="polite">{selected.length} / {count} slices chosen</strong>}
  </div>
}

export default function FractionSlicer({ question, order, totalOrders, onCorrect, onMiss }: {
  question: SlicerQuestion
  order: number
  totalOrders: number
  onCorrect: () => void
  onMiss: () => void
}) {
  const [count, setCount] = useState(2)
  const [stage, setStage] = useState<'cut' | 'mark' | 'serve' | 'tally'>('cut')
  const [berryCount, setBerryCount] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [marked, setMarked] = useState<number[]>([])
  const [feedback, setFeedback] = useState('')
  const [misses, setMisses] = useState(0)
  const { n, d, k, recipe, berriesPerSlice } = question.params
  const m = question.answer.serve
  const title = recipe?.method === 'mixed'
    ? `1 ${recipe.left.n % recipe.left.d}/${recipe.left.d} × 1/2`
    : recipe ? `${recipe.left.n}/${recipe.left.d} ${recipe.op} ${recipe.right.d === 1 ? recipe.right.n : `${recipe.right.n}/${recipe.right.d}`}` : ''
  const markGoal = recipe?.method === 'mixed' ? `Mark the leftover part of 1 ${recipe.left.n % recipe.left.d}/${recipe.left.d}.`
    : recipe ? `Mark ${recipe.left.n}/${recipe.left.d} of this treat first.` : ''
  const toggle = (index: number) => {
    setSelected((old) => old.includes(index) ? old.filter((value) => value !== index) : [...old, index])
    setFeedback('')
  }
  const miss = (text: string) => { onMiss(); setMisses((count) => count + 1); setFeedback(text) }
  const action = () => {
    if (stage === 'cut') {
      if (count !== k) { miss(`Mochi · Hmm, try a number of slices that works with the bottom number ${d}.`); return }
      setFeedback(''); setStage(recipe?.marked === undefined ? 'serve' : 'mark')
      return
    }
    if (stage === 'mark') {
      if (selected.length !== recipe?.marked) { miss('Almost! Mark the starting share with the matching number of slices.'); return }
      setMarked(selected); setSelected([]); setStage('serve'); setFeedback('')
      return
    }
    if (!validateSlicer(question, count, selected.length, marked.length)) {
      miss(`You served ${selected.length}/${k}. That is not ${n}/${d}. Try again.`)
      return
    }
    if (berriesPerSlice) {
      setFeedback('')
      setMisses(0)
      setStage('tally')
    } else onCorrect()
  }

  return <div className="puzzle">
    <div className="order-slip">
      <span>Order {order} of {totalOrders}{title && <small>{title}</small>}</span>
      <strong className="fraction" aria-label={`${n} out of ${d} equal parts`}><span>{n}</span><span>{d}</span></strong>
    </div>
    <p>Serve <strong>{n}/{d}</strong> of the treat. Cut it into <strong>{k}</strong> equal slices, then tap <strong>{m}</strong> {m === 1 ? 'slice' : 'slices'} to serve.</p>
    {stage === 'mark' && <p>{markGoal}</p>}
    <SlicePie count={count} selected={selected} marked={marked} toggle={stage === 'cut' || stage === 'tally' ? undefined : toggle}
      available={stage === 'serve' && (recipe?.method === 'part' || recipe?.method === 'share') ? marked : undefined} />
    {stage === 'cut' && <Stepper label="Slices" value={count} atMin={count === 2} atMax={count === 12}
      decrease={() => { setCount(count - 1); setFeedback('') }} increase={() => { setCount(count + 1); setFeedback('') }} />}
    {stage === 'tally' && berriesPerSlice ? <>
      <p>You chose {m} {m === 1 ? 'slice' : 'slices'}. Each has {berriesPerSlice} {berriesPerSlice === 1 ? 'berry' : 'berries'}. How many berries are on your plate?</p>
      <NumberPad label="Berries on the plate" value={berryCount} setValue={setBerryCount} maxDigits={2} />
      <QuestionActions key="tally" hint="Count the berries on each chosen slice." hint2={`Add ${berriesPerSlice} for each of the ${m} slices.`}
        explanation={`${m} × ${berriesPerSlice} = ${m * berriesPerSlice} berries.`} misses={misses} feedback={feedback}>
        <button className="button cyan-button" disabled={!berryCount} onClick={() => {
          if (Number(berryCount) === m * berriesPerSlice) onCorrect()
          else miss('Almost! Count the berries on the chosen slices again.')
        }}>Check berries</button>
      </QuestionActions>
    </> : <QuestionActions key={stage} hint={stage === 'mark' ? `Mark ${recipe?.marked} of the ${k} slices first.` : question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses} feedback={feedback}>
      <button className="button cyan-button" disabled={stage !== 'cut' && selected.length === 0} onClick={action}>
        {stage === 'cut' ? 'Cut it' : stage === 'mark' ? 'Mark the share' : 'Serve'}
      </button>
    </QuestionActions>}
  </div>
}
