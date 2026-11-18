import { expect, it } from 'vitest'
import { tiers } from '../difficulty'
import { generateMacro, matchesCrates, validateMacro } from './multiplicationMacro'

it.each(tiers)('generates 200 independently solvable Macro questions at tier %i', (tier) => {
  const formats = new Set<string>()
  for (let i = 0; i < 200; i++) {
    const question = generateMacro(tier, Math.imul(i + 1, 0x9e3779b9))
    formats.add(question.type)
    const data = question.params
    switch (question.type) {
      case 'array': {
        const { target } = question.params
        expect(target).toBeLessThanOrEqual(tier === 1 ? 25 : tier === 2 ? 100 : 144)
        const factors = Array.from({ length: 12 }, (_, index) => index + 1)
        expect(factors.some((r) => factors.some((c) => r * c === target))).toBe(true)
        expect(matchesCrates(target, ...question.answer)).toBe(true)
        expect(validateMacro(question, [0, target])).toBe(false)
        break
      }
      case 'split': {
        const { rows, columns, parts } = question.params
        expect(rows).toBeGreaterThanOrEqual(10)
        expect(rows).toBeLessThan(100)
        expect(columns).toBeGreaterThanOrEqual(tier === 3 ? 2 : 10)
        expect(columns).toBeLessThan(tier === 3 ? 10 : 100)
        expect(parts).toHaveLength(tier === 3 ? 2 : 4)
        const independent = parts.map(({ rows: r, columns: c }) => Array(r).fill(c).reduce((a, b) => a + b, 0))
        expect(question.answer).toEqual(independent)
        expect(independent.reduce((a, b) => a + b, 0)).toBe(rows * columns)
        break
      }
      case 'layers': {
        const { rows, columns, target } = question.params
        expect(question.answer).toBe(target / rows / columns)
        expect(question.answer).toBeGreaterThanOrEqual(2)
        expect(question.answer).toBeLessThanOrEqual(12)
        break
      }
      case 'classify': {
        const { target } = question.params
        const divisors = Array.from({ length: target }, (_, index) => index + 1).filter((n) => target % n === 0)
        expect(question.answer).toBe(divisors.length === 2 ? 'prime' : 'composite')
        break
      }
    }
    expect(validateMacro(question, question.answer)).toBe(true)
    expect(data).toBeDefined()
  }
  expect([...formats].sort()).toEqual(tier === 5 ? ['array', 'classify', 'layers'] : tier >= 3 ? ['split'] : ['array'])
})
