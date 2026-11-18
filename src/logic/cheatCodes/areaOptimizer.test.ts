import { expect, it } from 'vitest'
import { tiers } from '../difficulty'
import { fencePlots, fenceUsed, generateArea, validateArea } from './areaOptimizer'

it.each(tiers)('generates 200 independently solvable Area questions at tier %i', (tier) => {
  const formats = new Set<string>()
  for (let i = 0; i < 200; i++) {
    const question = generateArea(tier, Math.imul(i + 1, 0x9e3779b9))
    formats.add(question.type)
    if (question.type === 'fence') {
      const { budget, wall, minimumWidth = 1 } = question.params
      expect(budget).toBeGreaterThanOrEqual(12)
      expect(budget).toBeLessThanOrEqual(24)
      expect(budget % 2).toBe(0)
      const all = []
      for (let w = 1; w <= 12; w++) for (let h = 1; h <= 12; h++) {
        if (w + h + h + (wall ? 0 : w) === budget) all.push({ width: w, height: h })
      }
      expect(fencePlots(question.params)).toEqual(all)
      expect(question.answer.area).toBe(Math.max(...all.filter(({ width }) => width >= minimumWidth).map(({ width, height }) => width * height)))
      for (const plot of all) {
        expect(fenceUsed(plot, wall)).toBe(budget)
        expect(validateArea(question, plot)).toBe(plot.width >= minimumWidth && plot.width * plot.height === question.answer.area)
      }
      expect(validateArea(question, { width: 0, height: 12 })).toBe(false)
    } else {
      const { width, height } = question.params
      expect(width).toBeGreaterThanOrEqual(1)
      expect(height).toBeGreaterThanOrEqual(1)
      expect(width).toBeLessThanOrEqual(12)
      expect(height).toBeLessThanOrEqual(12)
      if (question.type === 'composite') {
        const { cutHeight: ch, cutWidth: cw } = question.params
        expect(question.answer).toEqual([height * (width - cw) + cw * (height - ch), width + height + width - cw + ch + cw + height - ch])
      } else {
        expect(question.answer).toBe(width * height * (question.type === 'triangle' ? .5 : 1))
      }
      expect(validateArea(question, question.answer)).toBe(true)
      expect(validateArea(question, 0)).toBe(false)
    }
  }
  expect([...formats].sort()).toEqual(tier === 5 ? ['fence', 'triangle'] : tier === 4 ? ['composite'] : tier === 3 ? ['fence'] : ['rectangle'])
})
