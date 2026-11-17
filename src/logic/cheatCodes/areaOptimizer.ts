import { gameConfig, type Difficulty } from '../../config/gameConfig'
import { rollInt } from './random'

export type AreaPuzzle = { sidesTotal: number; step: number; threshold: number }
export type AreaReward = { code: 'area'; rate: number }

export function makeArea(difficulty: Difficulty, roll: number): AreaPuzzle {
  const { min, max, step, threshold } = gameConfig.area.tiers[difficulty]
  return { sidesTotal: rollInt(min, max, roll), step, threshold }
}

export function snapWidth(puzzle: AreaPuzzle, width: number) {
  return Math.min(puzzle.sidesTotal - puzzle.step, Math.max(puzzle.step, Math.round(width / puzzle.step) * puzzle.step))
}

export function plotSize(puzzle: AreaPuzzle, width: number) {
  return width * (puzzle.sidesTotal - width)
}

export function bestArea(puzzle: AreaPuzzle) {
  return plotSize(puzzle, snapWidth(puzzle, puzzle.sidesTotal / 2))
}

export function solveArea(puzzle: AreaPuzzle, width: number): AreaReward | null {
  if (!Number.isFinite(width) || width !== snapWidth(puzzle, width)) return null
  const share = plotSize(puzzle, width) / bestArea(puzzle)
  if (share < puzzle.threshold) return null
  return { code: 'area', rate: Math.round((1 + share * (gameConfig.area.maxBoost - 1)) * 10) / 10 }
}
