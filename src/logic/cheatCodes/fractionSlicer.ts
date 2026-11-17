import { gameConfig, type Difficulty } from '../../config/gameConfig'
import { rollInt } from './random'

export type Order = { numerator: number; denominator: number }
export type SlicerPuzzle = { pieces: number; orders: Order[]; coins: number }
export type FractionReward = { code: 'fraction'; coins: number }

function divisors(pieces: number) {
  return Array.from({ length: pieces - 2 }, (_, i) => i + 2).filter((n) => pieces % n === 0)
}

export function makeSlicer(difficulty: Difficulty, rolls: readonly [number, number, number]): SlicerPuzzle {
  const tier = gameConfig.fraction.tiers[difficulty]
  const pieceOptions = Array.from({ length: tier.max - tier.min + 1 }, (_, i) => tier.min + i)
    .filter((n) => !tier.equivalent || divisors(n).length > 0)
  const pieces = pieceOptions[rollInt(0, pieceOptions.length - 1, rolls[0])]
  const denominators = tier.equivalent ? divisors(pieces) : [pieces]
  let options = denominators.flatMap((denominator) =>
    Array.from({ length: denominator - 1 }, (_, i) => ({ numerator: i + 1, denominator })),
  )
  const orders = Array.from({ length: tier.orders }, (_, i) => {
    const order = options[rollInt(0, options.length - 1, rolls[i + 1])]
    options = options.filter(({ numerator, denominator }) => numerator * order.denominator !== order.numerator * denominator)
    return order
  })
  return { pieces, orders, coins: tier.coins }
}

export function fillsOrder(order: Order, pieces: number, selected: number) {
  return Number.isInteger(selected) && selected > 0 && selected < pieces &&
    selected * order.denominator === order.numerator * pieces
}

export function solveSlicer(puzzle: SlicerPuzzle, selections: readonly number[]): FractionReward | null {
  if (selections.length !== puzzle.orders.length) return null
  return puzzle.orders.every((order, i) => fillsOrder(order, puzzle.pieces, selections[i]))
    ? { code: 'fraction', coins: puzzle.coins } : null
}
