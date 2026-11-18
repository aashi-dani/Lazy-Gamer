import { expect, it } from 'vitest'
import { tiers } from './difficulty'
import { parentQuestion, placementQuestion, recommendedBand } from './placement'

it('generates five levels of correct mixed-topic warm-up questions', () => {
  const calculate = [
    (a: number, b: number) => a + b,
    (a: number, b: number) => a * b,
    (a: number, b: number) => a / b,
    (a: number, b: number) => 2 * (a + b),
    (a: number, b: number) => a * b / 100,
  ]
  for (const tier of tiers) {
    for (let seed = 0; seed < 200; seed++) {
      const question = placementQuestion(tier, seed)
      const [a, b] = question.text.match(/\d+/g)!.map(Number)
      expect(question.answer).toBe(calculate[tier - 1](a, b))
      expect(question.answer).toBeGreaterThan(0)
      expect(question.answer).toBeLessThan(100)
    }
  }
  expect(([0, ...tiers] as const).map(recommendedBand)).toEqual([
    'explorer', 'explorer', 'explorer', 'challenger', 'mastermind', 'mastermind',
  ])
})

it('calculates the parent gate percentages correctly', () => {
  for (let seed = 0; seed < 200; seed++) {
    const question = parentQuestion(seed)
    const [percent, total] = question.text.match(/\d+/g)!.map(Number)
    expect(question.answer).toBe(percent * total / 100)
  }
})
