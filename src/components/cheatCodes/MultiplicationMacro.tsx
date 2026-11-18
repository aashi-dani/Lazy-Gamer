import { useState, type CSSProperties } from 'react'
import { crateLimit, validateMacro, type MacroQuestion } from '../../logic/cheatCodes/multiplicationMacro'
import NumberPad from './NumberPad'
import QuestionActions from './QuestionActions'
import Stepper from './Stepper'
import { Icon } from '../Icon'

function Crates({ rows, columns }: { rows: number; columns: number }) {
  return <div className="crate-grid" style={{ '--columns': columns, '--rows': rows } as CSSProperties}
    role="img" aria-label={`${rows} rows and ${columns} columns of crates`}>
    {Array.from({ length: rows * columns }, (_, index) => <span key={index} className="crate" aria-hidden="true" />)}
  </div>
}

export default function MultiplicationMacro({ question, onCorrect, onMiss }: {
  question: MacroQuestion
  onCorrect: () => void
  onMiss: () => void
}) {
  const [rows, setRows] = useState(1)
  const [columns, setColumns] = useState(1)
  const [layers, setLayers] = useState(1)
  const [parts, setParts] = useState<number[]>([])
  const [number, setNumber] = useState('')
  const [kind, setKind] = useState<'prime' | 'composite'>()
  const [feedback, setFeedback] = useState('')
  const [misses, setMisses] = useState(0)
  const miss = (message: string) => { onMiss(); setMisses((count) => count + 1); setFeedback(message) }

  if (question.type === 'array') {
    const { target, rowLimit = crateLimit } = question.params
    const product = rows * columns
    const gap = target - product
    return <div className="puzzle">
      <p>Pack exactly <strong>{target} crates.</strong> Choose rows and columns so that rows × columns = {target}.</p>
      {rowLimit < crateLimit && <p>This shelf fits up to <strong>{rowLimit} rows</strong>.</p>}
      <div className="puzzle-board crate-board">
        <Crates rows={rows} columns={columns} />
        <div className="crate-tally" aria-live="polite">
          <strong>{rows} × {columns} = {product}</strong><span>{product} / {target} packed</span>
          <strong className={gap < 0 ? 'text-coral' : gap === 0 ? 'text-lime' : 'text-cyan'}>
            {gap > 0 ? `Need ${gap} more` : gap < 0 ? `Too many by ${-gap}` : 'Perfect!'}
          </strong>
        </div>
      </div>
      <div className="pair-controls">
        <Stepper label="Rows" value={rows} atMin={rows === 1} atMax={rows === rowLimit}
          decrease={() => { setRows(rows - 1); setFeedback('') }} increase={() => { setRows(rows + 1); setFeedback('') }} />
        <Stepper label="Columns" value={columns} atMin={columns === 1} atMax={columns === crateLimit}
          decrease={() => { setColumns(columns - 1); setFeedback('') }} increase={() => { setColumns(columns + 1); setFeedback('') }} />
      </div>
      <QuestionActions hint={question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses} feedback={feedback}>
        <button className="button cyan-button" onClick={() => {
          if (validateMacro(question, [rows, columns])) onCorrect()
          else miss(`That is ${product} crates, not ${target}. Try again.`)
        }}>Ship the crates</button>
      </QuestionActions>
    </div>
  }

  if (question.type === 'split') {
    const { rows: totalRows, columns: totalColumns, parts: blocks } = question.params
    const current = blocks[parts.length]
    return <div className="puzzle">
      <p>Pack <strong>{totalRows} × {totalColumns} crates</strong> by filling each section of the grid.</p>
      <div className={`puzzle-board split-board${blocks.length === 2 ? ' two-parts' : ''}`}>
        {blocks.map((block, index) => <div key={index} className={`crate-section${index === parts.length ? ' current-section' : ''}`}>
          <Icon name={parts[index] === undefined ? 'box' : 'check'} size={20} />
          <strong>{block.rows} × {block.columns}</strong>
          <span>{parts[index] === undefined ? index === parts.length ? 'Pack this section' : 'Waiting' : `${parts[index]} packed`}</span>
        </div>)}
      </div>
      <NumberPad label={`Crates in ${current.rows} × ${current.columns}`} value={number} setValue={setNumber} />
      <QuestionActions hint={`Count ${current.rows} groups of ${current.columns} crates.`} hint2={question.hint2} explanation={question.explanation} misses={misses} feedback={feedback}>
        <button className="button cyan-button" disabled={!number} onClick={() => {
          const count = Number(number)
          if (count !== current.total) { miss('Almost! Check the two sides of this section.'); return }
          const next = [...parts, count]
          if (validateMacro(question, next)) { onCorrect(); return }
          setParts(next); setNumber(''); setFeedback('Section packed!')
        }}>{parts.length === blocks.length - 1 ? 'Ship the crates' : 'Pack this section'}</button>
      </QuestionActions>
    </div>
  }

  if (question.type === 'layers') {
    const { target, rows: perLayerRows, columns: perLayerColumns } = question.params
    return <div className="puzzle">
      <p>Stack identical layers of <strong>{perLayerRows} × {perLayerColumns}</strong> crates to ship <strong>{target} crates</strong>.</p>
      <div className="puzzle-board crate-board">
        <Crates rows={perLayerRows} columns={perLayerColumns} />
        <strong>{perLayerRows} × {perLayerColumns} × {layers} = {perLayerRows * perLayerColumns * layers} crates</strong>
      </div>
      <Stepper label="Layers" value={layers} atMin={layers === 1} atMax={layers === crateLimit}
        decrease={() => setLayers(layers - 1)} increase={() => setLayers(layers + 1)} />
      <QuestionActions hint={question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses} feedback={feedback}>
        <button className="button cyan-button" onClick={() => validateMacro(question, layers)
          ? onCorrect() : miss('Almost! Adjust the number of layers and try again.')}>Ship the crates</button>
      </QuestionActions>
    </div>
  }

  const target = question.params.target
  return <div className="puzzle">
    <p>The shipment holds <strong>{target} crates.</strong> Sort it by how many different whole-number factor pairs it has.</p>
    <div className="puzzle-board factor-board"><Icon name="boxes" size={34} /><strong>1 × {target}</strong><span>Base factor pair</span></div>
    <div className="pair-controls">
      <button type="button" className="button outline-button factor-choice" aria-pressed={kind === 'prime'} onClick={() => setKind('prime')}>Prime<span>Only the base pair</span></button>
      <button type="button" className="button outline-button factor-choice" aria-pressed={kind === 'composite'} onClick={() => setKind('composite')}>Composite<span>More factor pairs</span></button>
    </div>
    <QuestionActions hint={question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses} feedback={feedback}>
      <button className="button cyan-button" disabled={!kind} onClick={() => kind && (validateMacro(question, kind)
        ? onCorrect() : miss('Almost! Check how the crates could be grouped.'))}>Ship the crates</button>
    </QuestionActions>
  </div>
}
