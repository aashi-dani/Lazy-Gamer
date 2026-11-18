import type { Tier } from '../difficulty'
import { questionRandom } from './random'

export type Fraction = { n: number; d: number }
type Recipe = { left: Fraction; right: Fraction; op: '+' | '−' | '×' | '÷'; marked?: number; method?: 'part' | 'mixed' | 'share' | 'quotient' }
export type SlicerQuestion = {
  id: string; topic: 'fractions'; cheat: 'fraction'; tier: Tier; type: 'slice'
  params: { n: number; d: number; k: number; recipe?: Recipe; berriesPerSlice?: number }
  answer: { cut: number; serve: number }
  hint1: string; hint2: string; explanation: string
}
export type FractionReward = { code: 'fraction'; coins: number }

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export function simplify(n: number, d: number): Fraction {
  const factor = gcd(n, d)
  return { n: n / factor, d: d / factor }
}

export function fractionValue(recipe: Recipe): Fraction {
  const { left: a, right: b, op } = recipe
  switch (op) {
    case '+': return simplify(a.n * b.d + b.n * a.d, a.d * b.d)
    case '−': return simplify(a.n * b.d - b.n * a.d, a.d * b.d)
    case '×': return simplify(a.n * b.n, a.d * b.d)
    case '÷': return simplify(a.n * b.d, a.d * b.n)
  }
}

export function generateSlicer(tier: Tier, seed: number): SlicerQuestion {
  const roll = questionRandom(seed)
  let goal: Fraction
  let recipe: Recipe | undefined
  let k: number

  if (tier <= 2) {
    const options = tier === 1 ? [2, 4] : [3, 6, 8]
    k = options[roll(0, options.length - 1)]
    goal = { n: roll(1, k - 1), d: k }
  } else if (tier === 3) {
    const d = roll(2, 6)
    k = d * roll(2, Math.floor(12 / d))
    goal = { n: roll(1, d - 1), d }
  } else if (tier === 4) {
    const op = roll(0, 1) === 0 ? '+' : '−'
    const pairs = [[2, 3], [2, 4], [2, 5], [2, 6], [2, 8], [2, 10], [2, 12], [3, 6], [3, 9], [4, 8], [4, 12]]
    const [left, right] = pairs[roll(0, pairs.length - 1)]
    // Both the sum and difference must be positive and fit on one plate.
    const maxRight = Math.min(Math.ceil(right / left) - 1, Math.ceil(right * (1 - 1 / left)) - 1)
    recipe = { left: { n: 1, d: left }, right: { n: roll(1, maxRight), d: right }, op }
    goal = fractionValue(recipe)
    k = left * right / gcd(left, right)
  } else {
    const kind = roll(0, 3)
    if (kind === 0) {
      const d = roll(2, 4)
      const n = roll(1, d - 1)
      const shares = roll(2, Math.floor(12 / d))
      k = d * shares
      recipe = { left: { n, d }, right: { n: 1, d: shares }, op: '×', marked: n * shares, method: 'part' }
    } else if (kind === 1) {
      const d = roll(2, 4)
      const n = roll(1, d - 1)
      const shares = roll(2, Math.floor(12 / d))
      k = d * shares
      recipe = { left: { n, d }, right: { n: shares, d: 1 }, op: '÷', marked: n * shares, method: 'share' }
    } else if (kind === 2) {
      const d = roll(4, 12)
      const divisor = roll(2, 3)
      k = d
      recipe = { left: { n: 1, d }, right: { n: 1, d: divisor }, op: '÷', marked: 1, method: 'quotient' }
    } else {
      const d = roll(2, 5)
      const n = roll(1, d - 1)
      k = d * 2
      recipe = { left: { n: d + n, d }, right: { n: 1, d: 2 }, op: '×', marked: n * 2, method: 'mixed' }
    }
    goal = fractionValue(recipe)
  }

  const { n, d } = goal
  const m = n * k / d
  const equivalent = `${n}/${d} is the same as ${m}/${k}.`
  return {
    id: `fraction-${tier}-${seed}`, topic: 'fractions', cheat: 'fraction', type: 'slice', tier,
    params: { n, d, k, recipe, berriesPerSlice: tier <= 2 ? roll(1, 8) : undefined }, answer: { cut: k, serve: m },
    hint1: `Cut the treat into ${k} equal slices.`, hint2: equivalent, explanation: `${equivalent} Serve ${m} slices.`,
  }
}

export function validateSlicer(question: SlicerQuestion, cut: number, selected: number, marked?: number) {
  const { n, d, k, recipe } = question.params
  return cut === k && Number.isInteger(selected) && selected > 0 && selected < k &&
    selected * d === n * k && (recipe?.marked === undefined || marked === recipe.marked)
}
