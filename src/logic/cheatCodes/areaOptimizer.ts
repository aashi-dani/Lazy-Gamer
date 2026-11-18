import type { Tier } from '../difficulty'
import { questionRandom } from './random'

export const plotLimit = 12
type Plot = { width: number; height: number }
type Fence = { budget: number; wall: boolean; minimumWidth?: number }
type Details = { id: string; topic: 'geometry'; cheat: 'area'; tier: Tier; hint1: string; hint2: string; explanation: string }

export type AreaQuestion = Details & (
  | { type: 'rectangle' | 'triangle'; params: Plot; answer: number }
  | { type: 'composite'; params: Plot & { cutWidth: number; cutHeight: number }; answer: readonly [number, number] }
  | { type: 'fence'; params: Fence; answer: { area: number; plots: Plot[] } }
)
export type AreaReward = { code: 'area'; minutes: number }

export function fenceUsed(plot: Plot, wall: boolean) {
  return (wall ? 1 : 2) * plot.width + 2 * plot.height
}

export function fencePlots({ budget, wall }: Fence): Plot[] {
  return Array.from({ length: plotLimit }, (_, i) => {
    const width = i + 1
    return { width, height: (budget - width * (wall ? 1 : 2)) / 2 }
  }).filter(({ height }) => Number.isInteger(height) && height >= 1 && height <= plotLimit)
}

export function generateArea(tier: Tier, seed: number): AreaQuestion {
  const roll = questionRandom(seed)
  const meta = { id: `area-${tier}-${seed}`, topic: 'geometry', cheat: 'area', tier } as const

  if (tier === 3 || (tier === 5 && roll(0, 1) === 0)) {
    const wall = tier === 5
    const budget = wall ? roll(8, 12) * 2 : roll(6, 12) * 2
    const minimumWidth = wall ? 1 : roll(1, 5)
    const params = { budget, wall, minimumWidth }
    const plots = fencePlots(params).filter(({ width }) => width >= minimumWidth)
    const area = Math.max(...plots.map(({ width, height }) => width * height))
    const best = plots.filter(({ width, height }) => width * height === area)
    const example = best[0]
    return { ...meta, type: 'fence', params, answer: { area, plots: best },
      hint1: wall ? 'The wall covers one long side. Compare wide and deep plots.' : `Start at width ${minimumWidth}, then try making the sides as close as possible.`,
      hint2: `Try ${example.width} wide and ${example.height} deep.`,
      explanation: `${example.width} × ${example.height} gives ${area} square spaces, the most with ${budget} planks${minimumWidth > 1 ? ` and width at least ${minimumWidth}` : ''}.` }
  }

  const width = tier === 5 ? roll(2, 6) * 2 : roll(tier === 4 ? 4 : 1, tier === 1 ? 6 : plotLimit)
  const height = roll(tier === 4 ? 4 : 1, tier === 1 ? 6 : plotLimit)
  if (tier === 4) {
    const cutWidth = roll(1, width - 1)
    const cutHeight = roll(1, height - 1)
    const area = width * height - cutWidth * cutHeight
    const perimeter = 2 * (width + height)
    return { ...meta, type: 'composite', params: { width, height, cutWidth, cutHeight }, answer: [area, perimeter],
      hint1: 'Split the L into two rectangles. For the fence, follow every outside edge.',
      hint2: `Add the two rectangles: ${width} × ${height - cutHeight} and ${width - cutWidth} × ${cutHeight}.`,
      explanation: `The plot has ${area} square spaces. The six outside edges use ${perimeter} planks.` }
  }
  if (tier === 5) {
    const answer = width * height / 2
    return { ...meta, type: 'triangle', params: { width, height }, answer,
      hint1: 'Two matching triangles fill the rectangle.', hint2: `Multiply ${width} by ${height}, then halve it.`,
      explanation: `${width} × ${height} ÷ 2 = ${answer} square spaces.` }
  }
  return { ...meta, type: 'rectangle', params: { width, height }, answer: width * height,
    hint1: tier === 1 ? 'Count across each row, then put all the rows together.' : 'Multiply the length by the width.',
    hint2: `There are ${height} rows of ${width} squares.`,
    explanation: `${width} × ${height} = ${width * height} square spaces.` }
}

export function validateArea(question: AreaQuestion, answer: number | Plot | readonly [number, number]) {
  if (question.type === 'fence') {
    return typeof answer === 'object' && 'width' in answer &&
      question.answer.plots.some(({ width, height }) => answer.width === width && answer.height === height)
  }
  if (question.type === 'composite') {
    return typeof answer === 'object' && 'length' in answer && answer.length === 2 &&
      answer[0] === question.answer[0] && answer[1] === question.answer[1]
  }
  return answer === question.answer
}
