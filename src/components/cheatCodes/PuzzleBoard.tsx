import { useRef, useState } from 'react'
import { amount, checkBatch, type BatchAnswer, type BatchQuestion } from '../../logic/cheatCodes/batchOne'
import { Coin, Icon } from '../Icon'
import QuestionActions from './QuestionActions'

const finishLabels = {
  sum: 'Check the stack', change: 'Give change', share: 'Hand out shares',
  decimal: 'Send to checkout', sale: 'Choose this deal', digits: 'Check the drawers',
}

export default function PuzzleBoard({ question, onCorrect, onMiss }: {
  question: BatchQuestion
  onCorrect: () => void
  onMiss: () => void
}) {
  const [selected, setSelected] = useState<number[]>([])
  const [picks, setPicks] = useState<string[]>([])
  const [misses, setMisses] = useState(0)
  const dropZone = useRef<HTMLDivElement>(null)
  const { game, cheat } = question
  const sequence = game.type === 'stack' || game.type === 'order'
  const tiles = game.type === 'stack' ? game.blocks : game.type === 'order' ? game.tiles : []
  const slots = game.type === 'stack' ? Array.from({ length: game.slots }, (_, i) => `Block ${i + 1}`) : game.type === 'order' ? game.slots : []
  const addTile = (index: number) => {
    if (!tiles[index]) return
    setSelected((previous) => previous.length < slots.length && !previous.includes(index) ? [...previous, index] : previous)
  }

  let ready = false
  if (sequence) ready = selected.length === slots.length
  if (game.type === 'coins') ready = selected.length > 0
  if (game.type === 'pick') ready = game.parts.every((_, index) => picks[index] !== undefined)

  const submit = () => {
    const answer: BatchAnswer = game.type === 'pick' ? picks : selected
    if (ready && checkBatch(question, answer)) onCorrect()
    else {
      onMiss()
      setMisses((count) => count + 1)
    }
  }

  return <div className={`puzzle new-puzzle puzzle-${cheat}`}>
    <p className="puzzle-goal">{question.prompt}</p>
    {sequence && <div className="sort-game">
      <div ref={dropZone} className={`answer-slots ${cheat === 'sum' ? 'stack-tray' : ''}`}
        onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault()
          const dragged = event.dataTransfer.getData('text/plain')
          if (dragged) addTile(Number(dragged))
        }}>
        {slots.map((slot, index) => <button key={slot} type="button" disabled={selected[index] === undefined}
          className="answer-slot" aria-label={selected[index] === undefined ? slot : `Remove ${tiles[selected[index]].label} from ${slot}`}
          onClick={() => setSelected(selected.filter((_, position) => position !== index))}>
          <small>{slot}</small><strong>{tiles[selected[index]]?.label ?? '—'}</strong>
        </button>)}
      </div>
      {game.type === 'stack' && <output className="tray-total">Stack total {amount(selected.reduce((total, index) => total + tiles[index].value, 0), game.scale)}</output>}
      <div className="tile-tray" aria-label={cheat === 'sum' ? 'Number blocks' : 'Available tiles'}>
        {tiles.map((tile, index) => <button key={index} type="button" draggable={!selected.includes(index)}
          className="puzzle-tile" disabled={selected.includes(index)} onClick={() => addTile(index)}
          onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
          onPointerDown={(event) => {
            if (event.pointerType === 'touch') event.currentTarget.setPointerCapture(event.pointerId)
          }} onPointerUp={(event) => {
            if (event.pointerType !== 'touch') return
            const box = dropZone.current?.getBoundingClientRect()
            if (box && event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) addTile(index)
          }}>{tile.label}</button>)}
      </div>
    </div>}
    {game.type === 'coins' && <div className="change-game">
      <dl className="receipt">
        {game.prices.length > 1 && <><dt>Items</dt><dd>{game.prices.map((price) => amount(price, game.scale)).join(' + ')}</dd></>}
        {game.discount > 0 && <><dt>Discount</dt><dd>{game.discount}%</dd></>}
        <dt>Bill</dt><dd>{amount(game.due, game.scale)}</dd><dt>Customer paid</dt><dd>{amount(game.paid, game.scale)}</dd>
      </dl>
      <div className="change-total">
        <output>Change tray <strong>{amount(selected.reduce((total, index) => total + game.denominations[index], 0), game.scale)}</strong></output>
        <button type="button" className="button outline-button" disabled={!selected.length} onClick={() => setSelected(selected.slice(0, -1))}>Undo coin</button>
      </div>
      <div className="tile-tray" aria-label="Change coins">
        {game.denominations.map((coin, index) => <button key={coin} type="button" className="puzzle-coin"
          aria-label={`Add ${amount(coin, game.scale)}`} disabled={selected.length >= 40}
          onClick={() => setSelected([...selected, index])}><Coin size={16} />{amount(coin, game.scale)}</button>)}
      </div>
    </div>}
    {game.type === 'pick' && <div className="pick-game">
      {game.groups && <div className="share-villagers" aria-hidden="true">
        {Array.from({ length: game.groups }, (_, i) => <span key={i}>
          <Icon name={question.prompt.includes('boxes') || question.prompt.includes('baskets') ? 'box' : 'friends'} size={17} />
          {(game.parts[i]?.name.includes('basket') ? game.parts[i].options.find((option) => option.key === picks[i])?.label
            : game.parts[0].name.endsWith('each') ? game.parts[0].options.find((option) => option.key === picks[0])?.label : undefined) ?? '—'}
        </span>)}
      </div>}
      {game.offers && !(cheat === 'sale' && question.tier <= 2) && <ul className="sale-tags">{game.offers.map((offer) => <li key={offer}><Icon name="tag" size={17} />{offer}</li>)}</ul>}
      {game.parts.map((part, index) => <fieldset key={part.name} className={`pick-part${game.rail ? ' number-line' : ''}`}>
        <legend>{part.name}</legend>
        <div className="tile-tray">
          {part.options.map(({ key, label }) => <button type="button" className="puzzle-tile" key={key} aria-pressed={picks[index] === key}
            onClick={() => setPicks((previous) => Object.assign([...previous], { [index]: key }))}>
            {cheat === 'sale' && question.tier <= 2 ? <><Icon name="tag" size={17} />{game.offers?.[Number(key)]}</> : label}
          </button>)}
        </div>
      </fieldset>)}
    </div>}
    <QuestionActions hint={question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses}
      feedback={misses ? 'Give it another try.' : ''}>
      <button type="button" className="button cyan-button" disabled={!ready} onClick={submit}>{finishLabels[cheat]}</button>
    </QuestionActions>
  </div>
}
