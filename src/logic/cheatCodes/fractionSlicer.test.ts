import { expect, it } from 'vitest'
import { tiers } from '../difficulty'
import { generateSlicer, validateSlicer } from './fractionSlicer'

it.each(tiers)('generates 200 independently solvable Slicer questions at tier %i', (tier) => {
  const operations = new Set<string>()
  for (let i = 0; i < 200; i++) {
    const question = generateSlicer(tier, Math.imul(i + 1, 0x9e3779b9))
    const { n, d, k, recipe } = question.params
    expect(k).toBeGreaterThanOrEqual(2)
    expect(k).toBeLessThanOrEqual(12)
    expect(k % d).toBe(0)
    if (tier === 1) expect([2, 4]).toContain(k)
    if (tier === 2) expect([3, 6, 8]).toContain(k)
    if (tier === 3) expect(k / d).toBeGreaterThanOrEqual(2)
    let goal = n / d
    if (recipe) {
      operations.add(recipe.method ?? recipe.op)
      const a = recipe.left.n / recipe.left.d
      const b = recipe.right.n / recipe.right.d
      goal = recipe.op === '+' ? a + b : recipe.op === '−' ? a - b : recipe.op === '×' ? a * b : a / b
      expect(goal).toBeCloseTo(n / d, 12)
      if (recipe.marked !== undefined) {
        expect(recipe.marked).toBeCloseTo((recipe.method === 'mixed' ? a % 1 : a) * k, 12)
        expect(recipe.marked).toBeLessThan(k)
        expect(validateSlicer(question, k, question.answer.serve, 0)).toBe(false)
      }
    }
    expect(question.answer.cut).toBe(k)
    expect(question.answer.serve).toBe(Math.round(goal * k))
    expect(validateSlicer(question, k, question.answer.serve, recipe?.marked)).toBe(true)
    expect(validateSlicer(question, k - 1, question.answer.serve, recipe?.marked)).toBe(false)
    expect(validateSlicer(question, k, 0, recipe?.marked)).toBe(false)
  }
  expect([...operations].sort()).toEqual(tier === 5 ? ['mixed', 'part', 'quotient', 'share'] : tier === 4 ? ['+', '−'] : [])
})
