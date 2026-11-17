import { useState, type CSSProperties } from 'react'
import type { Difficulty } from '../../config/gameConfig'
import { makeMacro, solveMacro, type MacroReward } from '../../logic/cheatCodes/multiplicationMacro'

export default function MultiplicationMacro({ difficulty, onWin }: { difficulty: Difficulty; onWin: (reward: MacroReward) => void }) {
  const [puzzle] = useState(() => makeMacro(difficulty, [Math.random(), Math.random()]))
  const [rows, setRows] = useState(1)
  const [columns, setColumns] = useState(1)
  const [moves, setMoves] = useState(0)
  const [hint, setHint] = useState('')
  const options = Array.from({ length: puzzle.limit }, (_, i) => i + 1)
  const update = (set: (n: number) => void, n: number) => {
    set(n)
    setMoves((old) => old + 1)
    setHint('')
  }
  return <div className="puzzle">
    <p>Pack exactly <strong>{puzzle.target} crates</strong> in your shipment.</p>
    <div className="puzzle-board crate-board">
      <div className="crate-grid" style={{ '--columns': columns, '--rows': rows } as CSSProperties}
        role="img" aria-label={`${rows} rows and ${columns} columns of crates`}>
        {Array.from({ length: rows * columns }, (_, i) => <span key={i} className="crate" aria-hidden="true" />)}
      </div>
      <strong className="board-count">{rows * columns} / {puzzle.target} packed</strong>
    </div>
    <div className="pair-controls">
      <label>Rows<select value={rows} onChange={(e) => update(setRows, Number(e.target.value))}>{options.map((n) => <option key={n}>{n}</option>)}</select></label>
      <label>Columns<select value={columns} onChange={(e) => update(setColumns, Number(e.target.value))}>{options.map((n) => <option key={n}>{n}</option>)}</select></label>
    </div>
    <p className="puzzle-hint" role="status">{hint}</p>
    <button className="button cyan-button" onClick={() => {
      const reward = solveMacro(puzzle, rows, columns, moves)
      if (reward) onWin(reward)
      else setHint('Almost! Try another stack.')
    }}>Ship the crates</button>
  </div>
}
