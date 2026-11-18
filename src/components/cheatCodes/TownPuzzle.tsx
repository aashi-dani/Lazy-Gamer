import { useState } from 'react'
import { checkWorldPuzzle, worldSlots, type PuzzleSlot, type TownQuestion } from '../../logic/cheatCodes/townPuzzles'
import { questionRandom } from '../../logic/cheatCodes/random'
import { Icon } from '../Icon'
import QuestionActions from './QuestionActions'

function SliceWheel({ red, blue, rotation }: { red: number; blue: number; rotation: number }) {
  const radius = 44
  const total = red + blue
  const point = (angle: number) => [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)]
  return <div className="spinner-figure">
    <svg className="spinner-wheel" viewBox="0 0 100 100" aria-hidden="true" style={{ transform: `rotate(${rotation}deg)` }}>
      {Array.from({ length: total }, (_, index) => {
        const a = point(2 * Math.PI * index / total)
        const b = point(2 * Math.PI * (index + 1) / total)
        return <path key={index} d={`M50 50L${a.join(' ')} A44 44 0 0 1 ${b.join(' ')}Z`}
          fill={index < red ? '#ef969b' : '#82cbec'} stroke="#372e55" strokeWidth="1.5" />
      })}
      <circle cx="50" cy="50" r="6" fill="#ffd48a" stroke="#775986" strokeWidth="2" />
    </svg>
    <span className="spinner-arrow" aria-hidden="true" />
  </div>
}

function Options({ slot, selected, choose }: { slot: PuzzleSlot; selected?: string; choose: (value: string) => void }) {
  return <fieldset className="pick-part">
    <legend>{slot.name}</legend>
    <div className="tile-tray">{slot.options.map((option) => <button className="puzzle-tile" type="button" key={option.value}
      onClick={() => choose(option.value)} aria-pressed={selected === option.value}>{option.label}</button>)}</div>
  </fieldset>
}

const buttons = {
  sort: 'Check the bins', leap: 'Make the leap', spinner: 'Check prediction',
  mystery: 'Send the order', recipe: 'Mix the recipe', festival: 'Send the crates',
}

export default function TownPuzzle({ question, seed, onCorrect, onMiss }: {
  question: TownQuestion; seed: number; onCorrect: () => void; onMiss: () => void
}) {
  const [picks, setPicks] = useState<string[]>([])
  const [misses, setMisses] = useState(0)
  const [selected, setSelected] = useState(0)
  const [simulations, setSimulations] = useState(0)
  const { board } = question
  const totalSlots = board.type === 'sort' ? board.cards.length : worldSlots(board).length
  const ready = picks.filter(Boolean).length === totalSlots
  const choose = (index: number, value: string) => setPicks((old) => Object.assign([...old], { [index]: value }))
  const sortInto = (index: number, bin: string) => {
    if (!Number.isInteger(index) || index < 0 || board.type !== 'sort' || index >= board.cards.length) return
    choose(index, bin)
    const next = board.cards.findIndex((_, i) => i !== index && !picks[i])
    setSelected(next >= 0 ? next : index)
  }
  const simulatedCoral = (() => {
    if (board.type !== 'spin' || !simulations) return 0
    const roll = questionRandom((seed ^ simulations) >>> 0)
    return Array.from({ length: board.spins }, () => roll(1, board.red + board.blue)).filter((pick) => pick <= board.red).length
  })()

  return <div className={`puzzle new-puzzle world-puzzle puzzle-${question.cheat}`}>
    <p className="puzzle-goal">{question.prompt}</p>
    {board.type === 'sort' ? <>
      <div className="sort-conveyor" role="group" aria-label="Number cards">
        {board.cards.map((card, index) => <button className="puzzle-tile" key={card.label} aria-pressed={selected === index}
          draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
          onClick={() => setSelected(index)}>{card.label}<small>{picks[index] || 'Choose bin'}</small></button>)}
      </div>
      <div className="sort-bins" role="group" aria-label="Bins">
        {board.bins.map((bin) => <button className="puzzle-tile" key={bin} onClick={() => sortInto(selected, bin)}
          onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
            event.preventDefault()
            const index = event.dataTransfer.getData('text/plain')
            if (index !== '') sortInto(Number(index), bin)
          }}><Icon name="drawers" size={18} />{bin}</button>)}
      </div>
    </> : <>
      {board.type === 'spin' && <div className="spinner-board">
        <SliceWheel red={board.red} blue={board.blue} rotation={simulations * 385} />
        <div className="spinner-details">
          <p><span className="coral-swatch" /> {board.red} coral <span className="blue-swatch" /> {board.blue} blue</p>
          {question.tier === 3 && <button className="button outline-button" onClick={() => setSimulations(simulations + 1)}>Try {board.spins} spins</button>}
          {simulations > 0 && <p role="status">{simulatedCoral} coral · {board.spins - simulatedCoral} blue in this run</p>}
        </div>
        {board.tree && <ul className="chance-tree">
          <li>Coral first · {board.red}/{board.red + board.blue}
            <ul><li>Then coral · {board.replacement ? board.red : board.red - 1}/{board.red + board.blue - Number(!board.replacement)}</li>
              <li>Then blue · {board.blue}/{board.red + board.blue - Number(!board.replacement)}</li></ul></li>
          <li>Blue first · {board.blue}/{board.red + board.blue}
            <ul><li>Then coral · {board.red}/{board.red + board.blue - Number(!board.replacement)}</li>
              <li>Then blue · {board.replacement ? board.blue : board.blue - 1}/{board.red + board.blue - Number(!board.replacement)}</li></ul></li>
        </ul>}
      </div>}
      {board.type === 'line' && <div className="leap-rail" aria-label={board.slot.name} role="group">
        {board.slot.options.map((option) => <button type="button" className="puzzle-tile" key={option.value}
          aria-pressed={picks[0] === option.value} onClick={() => choose(0, option.value)}>{option.label}</button>)}
      </div>}
      {board.type === 'mystery' && <ul className="order-clues">{board.clues.map((clue) => <li key={clue}><Icon name="box" size={18} />{clue}</li>)}</ul>}
      {board.type === 'recipe' && <ul className="recipe-ingredients">{board.ingredients.map((item) => <li key={item}><Icon name="mix" size={18} />{item}</li>)}</ul>}
      {board.type === 'relay' && <div className="relay-crates" aria-label="Crate pattern">
        {board.sequence.map((item) => <span key={item}><Icon name="box" size={18} />{item}</span>)}<span>?</span>
      </div>}
      {board.type === 'mystery' && board.grid ? <div className="order-matrix" role="group" aria-label="Customer order grid">
        <span />{board.slots[0].options.map((option) => <strong key={option.value}>{option.label}</strong>)}
        {board.slots.flatMap((slot, index) => [<strong key={slot.name}>{slot.name}</strong>, ...slot.options.map((option) =>
          <button key={`${slot.name}-${option.value}`} type="button" className="puzzle-tile"
            aria-pressed={picks[index] === option.value} aria-label={`${slot.name} chose ${option.label}`}
            onClick={() => choose(index, option.value)}>{picks[index] === option.value ? '✓' : '·'}</button>)])}
      </div> : board.type !== 'line' && worldSlots(board).map((slot, index) => <Options key={slot.name} slot={slot}
        selected={picks[index]} choose={(value) => choose(index, value)} />)}
    </>}
    <QuestionActions hint={question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses}
      feedback={misses ? 'Take another look and try again.' : ''}>
      <button type="button" className="button cyan-button" disabled={!ready} onClick={() => {
        if (checkWorldPuzzle(question, picks)) onCorrect()
        else { setMisses(misses + 1); onMiss() }
      }}>{buttons[question.cheat]}</button>
    </QuestionActions>
  </div>
}
