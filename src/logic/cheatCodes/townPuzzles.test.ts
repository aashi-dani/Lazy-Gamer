import { expect, it } from 'vitest'
import { tiers, type Tier } from '../difficulty'
import { checkWorldPuzzle, generateWorldPuzzle, worldCodes, worldSlots, type TownQuestion } from './townPuzzles'

const readNumbers = (text: string) => (text.replaceAll('−', '-').match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
function valueOf(text: string) {
  if (text.startsWith('√')) return Math.sqrt(+text.slice(1))
  if (text === 'π') return Math.PI
  const [a, b] = readNumbers(text)
  return text.includes('/') ? a / b : a
}

function expectedSort(bins: string[], label: string, tier: Tier) {
  const n = valueOf(label)
  if (tier === 1) return n % 2 ? 'Odd' : 'Even'
  if (tier === 2) {
    const [rule, no] = bins
    if (rule.startsWith('Multiple')) return n % readNumbers(rule)[0] === 0 ? rule : no
    if (rule.startsWith('Factor')) return readNumbers(rule)[0] % n === 0 ? rule : no
    let factors = 0
    for (let i = 1; i <= n; i++) if (n % i === 0) factors++
    return factors === 2 ? rule : no
  }
  if (tier === 3) return n < 0 ? 'Negative integer' : 'Natural'
  if (tier === 4) return Number.isInteger(n) ? 'Integer' : 'Other rational'
  if (label === 'π' || label.startsWith('√') && !Number.isInteger(n)) return 'Irrational'
  return Number.isInteger(n) ? n >= 0 ? 'Natural' : 'Other integer' : 'Other rational'
}

function independent(question: TownQuestion): string[] {
  const { board, tier, prompt } = question
  if (board.type === 'sort') return board.cards.map(({ label }) => expectedSort(board.bins, label, tier))
  if (board.type === 'line') {
    const shown = tier === 5 ? prompt.match(/(?:√\d+|π)/)![0] : prompt.split(' ')[1]
    const exact = valueOf(shown)
    if (tier === 1) expect(exact).toBeGreaterThanOrEqual(0)
    if (tier === 1) expect(exact).toBeLessThanOrEqual(20)
    if (tier === 2) { expect(exact).toBeLessThanOrEqual(100); expect(exact % 5).toBe(0) }
    return [tier === 5 ? `${Math.floor(exact)} to ${Math.ceil(exact)}` : String(exact)]
  }
  if (board.type === 'spin') {
    const { red, blue } = board
    if (tier === 1) return [red === blue ? 'Equally likely' : red > blue ? 'Coral' : 'Blue']
    const n = red + blue
    let favourable = 0, possible = 0
    if (tier === 2) { favourable = red; possible = n }
    if (tier === 3) return [String(Math.round(board.spins * red / n))]
    if (tier === 5 && prompt.includes('kept')) { favourable = red - 1; possible = n - 1 }
    if (possible === 0) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (tier === 5 && i === j) continue
          possible++
          const win = prompt.includes('least once') ? i < red || j < red : i < red && j < red
          if (win) favourable++
        }
      }
    }
    const matches = board.slot.options.filter(({ label }) => Math.abs(valueOf(label) - favourable / possible) < 1e-10)
    expect(matches).toHaveLength(1)
    return matches.map(({ value }) => value)
  }
  if (board.type === 'recipe') {
    const [a, b, c, d] = readNumbers(board.ingredients.join(' '))
    if (tier === 1) return [a, b].map((n) => String(prompt.startsWith('Double') ? n * 2 : n / 2))
    if (tier === 2) return [String(c * b / a)]
    if (tier === 3) return [a, b].map((n) => String(c * n / (a + b)))
    if (tier === 4) return prompt.startsWith('Share') ? [b, c].map((n) => String(a * n / (b + c))) : [String(b / a)]
    if (prompt.includes('preparation')) return [String(a * b / c)]
    return [a, b, c].map((n) => String(d * n / (a + b + c)))
  }
  if (board.type === 'relay') {
    const [a, b, c, d] = board.sequence
    return [String(tier >= 4 ? d + (d - c) + ((c - b) - (b - a)) : d + b - a)]
  }
  const [a, b, c] = readNumbers(board.clues.join(' '))
  if (tier === 1) return [String(a - b)]
  if (tier === 2) return [String(a * b - c)]
  if (tier === 3) {
    const [knownDiner, knownFood] = board.clues[1].slice(0, -1).split(' ordered ')
    const [otherDiner, excludedFood] = board.clues[2].slice(0, -1).split(' did not order ')
    const foods = board.slots[0].options.map(({ label }) => label)
    const assignments = foods.flatMap((first) => foods.filter((food) => food !== first)
      .map((second) => [first, second, foods.find((food) => food !== first && food !== second)!]))
    const matches = assignments.filter((assignment) => board.slots.every(({ name }, i) => {
      const food = assignment[i].toLowerCase()
      return (name !== knownDiner || food === knownFood) && (name !== otherDiner || food !== excludedFood)
    }))
    expect(matches).toHaveLength(1)
    return matches[0]
  }
  if (tier === 4) {
    const second = (a - b) / 4
    return [second + b, second, second * 2].map(String)
  }
  return [String(board.clues[1].includes('guarantee') ? a * (b - 1) + 1 : (b + c) / a)]
}

for (const code of worldCodes) {
  it(`generates 200 sound and playable ${code} orders per tier`, () => {
    const unique = new Set<string>()
    for (const tier of tiers) {
      for (let seed = 0; seed < 200; seed++) {
        const question = generateWorldPuzzle(code, tier, seed)
        const { board } = question
        unique.add(JSON.stringify([question.prompt, board]))
        expect(question.hint1 && question.hint2 && question.explanation).toBeTruthy()
        const expected = independent(question)
        expect(checkWorldPuzzle(question, expected)).toBe(true)
        expect(checkWorldPuzzle(question, ['invalid'])).toBe(false)
        if (board.type === 'sort') {
          expect(board.cards.length).toBe(4)
          expect(board.bins.length).toBeGreaterThan(1)
          expect(new Set(board.cards.map(({ label }) => label)).size).toBe(4)
        } else {
          expect(worldSlots(board).every((slot) => slot.options.some(({ value }) => value === slot.correct))).toBe(true)
        }
      }
    }
    expect(unique.size).toBeGreaterThan(70)
  })
}
