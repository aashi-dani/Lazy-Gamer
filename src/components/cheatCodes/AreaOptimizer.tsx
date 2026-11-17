import { useId, useState, type PointerEvent } from 'react'
import type { Difficulty } from '../../config/gameConfig'
import { makeArea, plotSize, snapWidth, solveArea, type AreaReward } from '../../logic/cheatCodes/areaOptimizer'
import { Icon } from '../Icon'

const originX = 60
const originY = 195
const plotRange = 180

export default function AreaOptimizer({ difficulty, onWin }: { difficulty: Difficulty; onWin: (reward: AreaReward) => void }) {
  const [puzzle] = useState(() => makeArea(difficulty, Math.random()))
  const [width, setWidth] = useState(() => snapWidth(puzzle, puzzle.sidesTotal / 5))
  const [hint, setHint] = useState('')
  const gridId = useId()
  const height = puzzle.sidesTotal - width
  const displayWidth = width / puzzle.sidesTotal * plotRange
  const displayHeight = height / puzzle.sidesTotal * plotRange
  const cornerX = originX + displayWidth
  const cornerY = originY - displayHeight
  const area = plotSize(puzzle, width)

  const changeWidth = (nextWidth: number) => {
    setWidth(snapWidth(puzzle, nextWidth))
    setHint('')
  }
  const drag = (e: PointerEvent<SVGSVGElement>) => {
    const matrix = e.currentTarget.getScreenCTM()
    if (!matrix) return
    const { x } = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
    changeWidth((x - originX) / plotRange * puzzle.sidesTotal)
  }

  return <div className="puzzle">
    <p>Drag the corner to make a big plot with <strong>{puzzle.sidesTotal * 2} fence planks.</strong></p>
    <div className="puzzle-board plot-board">
      <svg viewBox="0 0 300 210" role="img" aria-label={`Plot: ${width} wide, ${height} deep`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e) }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) drag(e) }}>
        <defs>
          <pattern id={gridId} width={plotRange / puzzle.sidesTotal} height={plotRange / puzzle.sidesTotal} patternUnits="userSpaceOnUse" x={originX} y={originY}>
            <path d={`M ${plotRange / puzzle.sidesTotal} 0 H 0 V ${plotRange / puzzle.sidesTotal}`} fill="none" stroke="#b6d6a2" strokeWidth="1" opacity=".54" />
          </pattern>
        </defs>
        <rect x={originX} y={originY - plotRange} width={plotRange} height={plotRange} rx="5" fill="#252e47" />
        <rect x={originX} y={cornerY} width={displayWidth} height={displayHeight} fill="#589986" />
        <rect x={originX} y={originY - plotRange} width={plotRange} height={plotRange} fill={`url(#${gridId})`} />
        <rect x={originX} y={cornerY} width={displayWidth} height={displayHeight} fill="none" stroke="#ffe6a8" strokeWidth="3" strokeDasharray="5 3" />
        <circle cx={cornerX} cy={cornerY} r="13" fill="#ffd36b" stroke="#fff0b9" strokeWidth="2" />
        <path d={`M${cornerX-4} ${cornerY}h8m-3-3 3 3-3 3`} fill="none" stroke="#463044" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="plot-controls">
      <button className="icon-button" onClick={() => changeWidth(width - puzzle.step)} disabled={width <= puzzle.step} aria-label="Make plot narrower"><Icon name="minus" /></button>
      <span><strong>{width} × {height}</strong><small>{area} square spaces</small></span>
      <button className="icon-button" onClick={() => changeWidth(width + puzzle.step)} disabled={width >= puzzle.sidesTotal - puzzle.step} aria-label="Make plot wider"><Icon name="plus" /></button>
    </div>
    <p className="puzzle-hint" role="status">{hint}</p>
    <button className="button cyan-button" onClick={() => {
      const reward = solveArea(puzzle, width)
      if (reward) onWin(reward)
      else setHint('Almost! Try making the sides closer in size.')
    }}>Build the fence</button>
  </div>
}
