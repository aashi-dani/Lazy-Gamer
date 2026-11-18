import { useId, useState } from 'react'
import { fencePlots, fenceUsed, validateArea, type AreaQuestion } from '../../logic/cheatCodes/areaOptimizer'
import NumberPad from './NumberPad'
import QuestionActions from './QuestionActions'
import Stepper from './Stepper'

type Plot = { width: number; height: number }

function PlotGrid({ plot, extent, triangle, cut, wall, best }: {
  plot: Plot
  extent: Plot
  triangle?: boolean
  cut?: Plot
  wall?: boolean
  best?: Plot
}) {
  const grid = useId()
  const { width, height } = plot
  const path = triangle ? `M0 0V${height}H${width}Z`
    : cut ? `M0 0H${width - cut.width}V${cut.height}H${width}V${height}H0Z`
    : `M0 0H${width}V${height}H0Z`
  return <div className="puzzle-board plot-board">
    <svg viewBox={`-.5 -.8 ${extent.width + 1} ${extent.height + 1.5}`} role="img"
      aria-label={`${triangle ? 'Triangle' : cut ? 'L-shaped plot' : 'Plot'}, ${width} wide and ${height} deep`}>
      <defs>
        <pattern id={grid} width="1" height="1" patternUnits="userSpaceOnUse">
          <path d="M1 0H0V1" fill="none" stroke="#b6d6a2" strokeWidth=".045" opacity=".65" />
        </pattern>
      </defs>
      <rect width={extent.width} height={extent.height} fill="#263047" />
      <path d={path} fill="#487d6e" />
      <rect width={extent.width} height={extent.height} fill={`url(#${grid})`} />
      <path d={path} fill="none" stroke="#ffe6a8" strokeLinejoin="round" strokeWidth=".09" />
      {cut && <path d={`M0 ${cut.height}H${width - cut.width}`} stroke="#bdf6f0" strokeWidth=".07" strokeDasharray=".2 .15" />}
      {wall && <path d={`M0 0H${extent.width}`} stroke="#aba3d4" strokeWidth=".24" strokeLinecap="round" />}
      {best && <rect width={best.width} height={best.height} fill="none" stroke="#a4ff99" strokeWidth=".16" strokeDasharray=".3 .2" />}
    </svg>
  </div>
}

export default function AreaOptimizer({ question, onCorrect, onMiss }: {
  question: AreaQuestion
  onCorrect: () => void
  onMiss: () => void
}) {
  const [index, setIndex] = useState(0)
  const [misses, setMisses] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [number, setNumber] = useState('')
  const [first, setFirst] = useState<number>()
  const miss = (message: string) => { onMiss(); setMisses(misses + 1); setFeedback(message) }

  if (question.type === 'fence') {
    const { budget, wall, minimumWidth = 1 } = question.params
    const plots = fencePlots(question.params)
    const plot = plots[index]
    const extent = { width: plots.at(-1)!.width, height: plots[0].height }
    const best = misses >= 2 ? question.answer.plots[0] : undefined
    const change = (direction: number) => { setIndex(index + direction); setFeedback('') }
    return <div className="puzzle">
      <p>Use <strong>{budget} fence planks</strong> to make the biggest plot{wall ? ' against the wall' : ''}.</p>
      {minimumWidth > 1 && <p>Leave room for the shop. The plot must be at least <strong>{minimumWidth} spaces wide</strong>.</p>}
      <PlotGrid plot={plot} extent={extent} wall={wall} best={best} />
      <div className="fence-count" aria-live="polite"><span>Fence used {fenceUsed(plot, wall)} / {budget}</span><strong>Area = {plot.width * plot.height}</strong></div>
      <div className="pair-controls">
        <Stepper label="Width" value={plot.width} atMin={index === 0} atMax={index === plots.length - 1}
          decrease={() => change(-1)} increase={() => change(1)} />
        <Stepper label="Height" value={plot.height} atMin={index === plots.length - 1} atMax={index === 0}
          decrease={() => change(1)} increase={() => change(-1)} />
      </div>
      {best && <p className="hint-bubble" role="status"><strong>Best plot, outlined in lime.</strong> {question.explanation}</p>}
      <QuestionActions hint={question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses} feedback={feedback}>
        <button className="button cyan-button" onClick={() => validateArea(question, plot)
          ? onCorrect() : miss(plot.width < minimumWidth ? `Almost! Try at least ${minimumWidth} spaces wide.` : 'Almost! Compare the area with a different shape.')}>Build the fence</button>
      </QuestionActions>
    </div>
  }

  const plot = question.params
  const cut = question.type === 'composite' ? { width: question.params.cutWidth, height: question.params.cutHeight } : undefined
  const fencing = question.type === 'composite' && first !== undefined
  const label = fencing ? 'Fence planks' : 'Square spaces'
  return <div className="puzzle">
    <p>{fencing ? 'Count the planks needed around the outside of your L-shaped plot.'
      : question.tier === 1 ? 'Count the square spaces in the garden plot.'
        : `Find the area of this ${plot.width} × ${plot.height} ${cut ? 'L-shaped plot' : question.type}.`}</p>
    <PlotGrid plot={plot} extent={plot} cut={cut} triangle={question.type === 'triangle'} />
    {question.tier > 1 && <strong className="plot-dimensions">{plot.width} wide × {plot.height} deep
      {cut && ` · corner cut ${cut.width} × ${cut.height}`}</strong>}
    <NumberPad label={label} value={number} setValue={setNumber} maxDigits={3} />
    <QuestionActions hint={fencing ? 'Trace the six outside edges, including the two edges of the cut-out corner.' : question.hint1} hint2={question.hint2} explanation={question.explanation} misses={misses} feedback={feedback}>
      <button className="button cyan-button" disabled={!number} onClick={() => {
        const value = Number(number)
        if (question.type === 'composite' && first === undefined) {
          if (value !== question.answer[0]) { miss('Almost! Add the square spaces in both parts.'); return }
          setFirst(value); setNumber(''); setFeedback(`Area = ${value}. Now find the fence length.`)
          return
        }
        if (validateArea(question, fencing ? [first!, value] : value)) onCorrect()
        else miss(fencing ? 'Almost! Count each outside edge once.' : 'Almost! Check the square spaces and try again.')
      }}>{fencing ? 'Check fence length' : 'Check area'}</button>
    </QuestionActions>
  </div>
}
