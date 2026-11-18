import type { Tier } from '../difficulty'
import { questionRandom } from './random'

export const crateLimit = 12

type ArrayParams = { target: number; rowLimit?: number }
type SplitParams = { rows: number; columns: number; parts: { rows: number; columns: number; total: number }[] }
type LayerParams = { rows: number; columns: number; target: number }
type ClassifyParams = { target: number; factor: number | null }
type Details = { id: string; topic: 'multiplication'; cheat: 'macro'; tier: Tier; hint1: string; hint2: string; explanation: string }

export type MacroQuestion = Details & (
  | { type: 'array'; params: ArrayParams; answer: readonly [number, number] }
  | { type: 'split'; params: SplitParams; answer: number[] }
  | { type: 'layers'; params: LayerParams; answer: number }
  | { type: 'classify'; params: ClassifyParams; answer: 'prime' | 'composite' }
)
export type MacroReward = { code: 'macro'; batches: number }

function placeValues(value: number) {
  return value < 10 ? [value] : [value - value % 10, value % 10]
}

export function generateMacro(tier: Tier, seed: number): MacroQuestion {
  const roll = questionRandom(seed)
  const meta = { id: `macro-${tier}-${seed}`, topic: 'multiplication', cheat: 'macro', tier } as const

  const format = tier === 5 ? roll(0, 2) : 0
  if (tier <= 2 || (tier === 5 && format === 0)) {
    const max = tier === 1 ? 5 : tier === 2 ? 10 : crateLimit
    const rows = roll(tier === 1 ? 1 : 2, max)
    const columns = roll(tier === 1 ? 1 : 2, max)
    const target = rows * columns
    const rowLimit = tier === 1 ? roll(Math.max(2, rows), max) : undefined
    return { ...meta, type: 'array', params: { target, rowLimit }, answer: [rows, columns],
      hint1: `Think of a times table: which two numbers multiply to ${target}?`,
      hint2: `Try ${rows} rows and count by ${rows}s.`, explanation: `${rows} × ${columns} = ${target} crates.` }
  }

  if (tier === 3 || tier === 4) {
    const rows = roll(1, 9) * 10 + roll(1, 9)
    const columns = tier === 3 ? roll(2, 9) : roll(1, 9) * 10 + roll(1, 9)
    const rowParts = placeValues(rows)
    const columnParts = placeValues(columns)
    const parts = rowParts.flatMap((r) => columnParts.map((c) => ({ rows: r, columns: c, total: r * c })))
    const answer = parts.map((part) => part.total)
    return { ...meta, type: 'split', params: { rows, columns, parts }, answer,
      hint1: 'Pack one section at a time. Multiply the two labels along its edges.',
      hint2: `Start with ${parts[0].rows} × ${parts[0].columns} = ${parts[0].total}.`,
      explanation: `${answer.join(' + ')} = ${rows * columns} crates in the full shipment.` }
  }

  if (format === 1) {
    const rows = roll(2, 9)
    const columns = roll(2, 9)
    const layers = roll(2, crateLimit)
    const target = rows * columns * layers
    return { ...meta, type: 'layers', params: { rows, columns, target }, answer: layers,
      hint1: 'Count the crates in one layer first.', hint2: `One layer has ${rows * columns} crates. How many layers make ${target}?`,
      explanation: `${rows} × ${columns} × ${layers} = ${target} crates.` }
  }

  const target = roll(11, 99)
  const factor = Array.from({ length: Math.floor(Math.sqrt(target)) - 1 }, (_, index) => index + 2)
    .find((n) => target % n === 0) ?? null
  return { ...meta, type: 'classify', params: { target, factor }, answer: factor === null ? 'prime' : 'composite',
    hint1: 'A prime has only two whole-number factors: 1 and itself.',
    hint2: `Try dividing ${target} by whole numbers from 2 up to ${Math.floor(Math.sqrt(target))}.`,
    explanation: factor === null ? `Only 1 × ${target} makes ${target}, so it’s prime.`
      : `${factor} × ${target / factor} also makes ${target}, so it’s composite.` }
}

export function matchesCrates(target: number, rows: number, columns: number) {
  return [rows, columns].every((side) => Number.isInteger(side) && side >= 1 && side <= crateLimit) && rows * columns === target
}

export function validateMacro(question: MacroQuestion, answer: readonly number[] | number | 'prime' | 'composite') {
  switch (question.type) {
    case 'array':
      return typeof answer === 'object' && answer.length === 2 && answer[0] <= (question.params.rowLimit ?? crateLimit)
        && matchesCrates(question.params.target, answer[0], answer[1])
    case 'split':
      return typeof answer === 'object' && answer.length === question.answer.length && question.answer.every((total, index) => answer[index] === total)
    case 'layers':
    case 'classify':
      return answer === question.answer
  }
}
