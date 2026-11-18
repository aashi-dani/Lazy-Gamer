import { expect, it } from 'vitest'
import { supportsCheat, tiersForCheat } from '../../data/catalog'
import { advancedCodes, checkAdvanced, generateAdvanced, type AdvancedQuestion } from './advancedPuzzles'

const numbers = (text: string) => (text.replaceAll('−', '-').replaceAll('- ', '-').match(/-?\d+/g) ?? []).map(Number)

function math(expression: string) {
  const [a, b, c] = numbers(expression)
  if (expression.startsWith('(')) return (a + b) * c + (numbers(expression)[3] ?? 0)
  if (expression.includes('÷')) return a / b
  if (expression.includes('×')) return c === undefined ? a * b : a + b * c
  if (expression.includes('−')) return expression.includes('+') ? a + b + c : a + b
  return a + b
}

function answer(question: AdvancedQuestion) {
  const { tier, format, prompt } = question
  if (format.type === 'balance') {
    const [a, d] = numbers(format.left)
    const [b, c] = numbers(format.right)
    if (tier <= 2) {
      if (tier === 1) expect(b).toBeLessThanOrEqual(10)
      return String(b - a)
    }
    if (tier === 3) return String(b / a)
    if (tier === 4) return String((b - d) / a)
    return String((c - a * d) / (a - b))
  }
  if (format.type === 'elevator') {
    const [a, b] = numbers(format.route)
    if (tier === 1) { expect(b).toBeLessThanOrEqual(10); return String(-b) }
    if (tier <= 3) return String(a + (format.route.includes('down') ? -b : b))
    return String(math(format.route))
  }
  if (format.type === 'chart') {
    const values = format.bars.map(({ value }) => value)
    if (tier <= 2) return String(format.bars.find(({ label }) => prompt.includes(label.toLowerCase()))!.value)
    if (tier === 3) return String(prompt.includes('mean') ? values.reduce((sum, count) => sum + count, 0) / values.length :
      Math.max(...values) - Math.min(...values))
    if (tier === 4) {
      const metric = (group: number[]) => {
        if (prompt.includes('median')) return [...group].sort((a, b) => a - b)[2]
        return [...group].sort((a, b) => group.filter((n) => n === b).length - group.filter((n) => n === a).length)[0]
      }
      return String(metric(values.slice(5)) - metric(values.slice(0, 5)))
    }
    return format.truncated ? String(values[1] - values[0]) : format.bars[values.indexOf(Math.max(...values))].label
  }
  if (format.type === 'pattern') {
    if (Number.isNaN(Number(format.shown[0]))) {
      const repeats = [2, 3].find((length) => format.shown.slice(length).every((value, i) => value === format.shown[i]))!
      return format.shown[format.shown.length % repeats]
    }
    const [a, b, c, d] = format.shown.map(Number)
    const gap = b - a
    if (tier === 4) {
      const constant = a - gap
      return `${gap}n ${constant < 0 ? `− ${-constant}` : `+ ${constant}`}`
    }
    const count = format.index === '6th' ? 6 : 5
    if (b / a === c / b && c / b === d / c) return String(a * (b / a) ** (count - 1))
    if (c === a + b && d === b + c) return String(c + d)
    return String(d + (d - c) + (d - c - (c - b)))
  }
  if (format.type === 'angle') {
    const angles = numbers(prompt)
    if (tier === 1 && prompt.startsWith('Is this')) return format.shown === 90 ? 'Right angle' : 'Not a right angle'
    if (tier === 1) return format.shown === 90 ? 'Quarter turn' : 'Half turn'
    if (tier === 2) return format.shown < 90 ? 'Acute' : format.shown < 180 ? 'Obtuse' : 'Reflex'
    if (tier === 3 || tier === 4) return String((prompt.startsWith('Around') ? 360 : 180) - angles.reduce((sum, n) => sum + n, 0))
    return String(prompt.includes('polygon') ? angles[0] * 180 - 360 : angles[0] / 2)
  }
  if (format.type === 'till') return format.orders.map(({ expression }) => math(expression)).join(',')
  const [value, a, , b] = numbers(format.shown)
  if (tier === 3) {
    const shown = format.shown
    return String(shown.endsWith('²') ? value ** 2 : shown.endsWith('³') ? value ** 3 :
      shown.startsWith('√') ? Math.sqrt(value) : Math.cbrt(value))
  }
  if (tier === 4) return `${value}^${format.shown.includes('×') ? a + b : format.shown.includes('÷') ? a - b : a * numbers(format.shown)[2]}`
  for (let root = Math.floor(Math.sqrt(value)); root > 1; root--) {
    if (value % (root ** 2) === 0) return `${root}√${value / root ** 2}`
  }
  throw new Error('A square factor was expected')
}

for (const code of advancedCodes) {
  it(`checks 200 ${code} puzzles at every supported tier`, () => {
    for (const tier of tiersForCheat(code)) {
      for (let seed = 0; seed < 200; seed++) {
        const puzzle = generateAdvanced(code, tier, seed)
        const expected = answer(puzzle)
        expect(checkAdvanced(puzzle, expected)).toBe(true)
        expect(checkAdvanced(puzzle, 'Wrong answer')).toBe(false)
        expect(puzzle.hint1 && puzzle.hint2 && puzzle.explanation).toBeTruthy()
        if (puzzle.format.type === 'till') {
          expect(puzzle.format.orders.length).toBe(tier < 3 ? 1 : 3)
          for (const { answer: total } of puzzle.format.orders) expect(total >= 0 && total < 10_000).toBe(true)
        } else {
          expect(puzzle.choices.length).toBeGreaterThanOrEqual(2)
          expect(puzzle.choices.some((choice) => choice.value === expected)).toBe(true)
        }
      }
    }
  })
}

it('restricts Power Plant to Mastermind and tiers 3–5', () => {
  expect(supportsCheat('power', 'challenger', 50)).toBe(false)
  expect(supportsCheat('power', 'explorer', 50)).toBe(false)
  expect(supportsCheat('power', 'mastermind', 21)).toBe(false)
  expect(supportsCheat('power', 'mastermind', 22)).toBe(true)
  expect(tiersForCheat('power')).toEqual([3, 4, 5])
})
