import { gameConfig, type Difficulty } from '../../config/gameConfig'
import { rollInt } from './random'

export type MacroPuzzle = { target: number; limit: number }
export type MacroReward = { code: 'macro'; batches: number }

export function makeMacro(difficulty: Difficulty, rolls: readonly [number, number]): MacroPuzzle {
  const { min, max } = gameConfig.macro.tiers[difficulty]
  const rows = rollInt(min, max, rolls[0])
  const columns = rollInt(min, max, rolls[1])
  return { target: rows * columns, limit: max }
}

export function solveMacro(puzzle: MacroPuzzle, rows: number, columns: number, moves: number): MacroReward | null {
  if (![rows, columns].every((side) => Number.isInteger(side) && side >= 1 && side <= puzzle.limit)) return null
  if (rows * columns !== puzzle.target) return null
  return { code: 'macro', batches: moves <= gameConfig.macro.maxEfficientMoves ? gameConfig.macro.efficientReward : 1 }
}
