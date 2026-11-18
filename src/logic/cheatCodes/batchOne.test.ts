import { expect, it } from 'vitest'
import { tiers } from '../difficulty'
import { checkBatch, generateBatch, type BatchQuestion, type NewCheat } from './batchOne'

const codes: NewCheat[] = ['sum', 'change', 'share', 'decimal', 'sale', 'digits']
const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)

function pickExpected(question: BatchQuestion) {
  const { cheat, tier, prompt, game } = question
  if (game.type !== 'pick') throw new Error('Expected a choice board')
  const [a, b, c] = nums(prompt)
  if (cheat === 'share') {
    if (tier === 5 && prompt.includes('ratio')) return [a / (b + c) * b, a / (b + c) * c]
    if (tier === 5) return [Math.round(a / b * 10)]
    if (prompt.includes('boxes')) return [Math.ceil(a / b)]
    return tier === 3 || tier === 4 ? [Math.floor(a / b), a % b] : [a / b]
  }
  if (cheat === 'decimal') {
    if (tier === 1) return [Math.round(a * 10)]
    if (tier === 3) return [Math.round((prompt.includes('drops') ? a - b : a + b) * 100)]
    if (tier === 4) return [Math.round(a * Math.round(b * 100) / 10)]
    if (prompt.includes('repeats')) return [`${a}/9`]
    return [prompt.includes('carton') ? Math.round(a / b * 10) : Math.round(a * b * 100)]
  }
  if (cheat === 'sale') {
    if (tier <= 2) {
      const prices = game.offers!.map((offer) => { const [listed, off] = nums(offer); return listed * (100 - off) })
      expect(new Set(prices).size).toBe(3)
      return [prices.indexOf(Math.min(...prices))]
    }
    if (tier === 3) return [Math.round(a * (100 - b) / 100)]
    if (tier === 4) return [Math.round(b * 100 / (100 + (prompt.includes('dropped') ? -a : a)))]
    return [Math.round(a * (100 + (prompt.includes('up') ? b : -b)) * (100 - c) / 100)]
  }
  if (prompt.includes('belongs')) {
    const place = game.parts[0].name
    const places = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten thousands', 'Hundred thousands']
    const decimals = ['Tenths', 'Hundredths', 'Thousandths']
    if (tier === 3) return [Math.floor(a / 10 ** places.indexOf(place)) % 10]
    return [String(a.toFixed(3).split('.')[1][decimals.indexOf(place)])]
  }
  if (prompt.includes('standard form')) return [Math.floor(Math.log10(a))]
  if (tier === 4) {
    const raw = Math.round(a * 1000)
    return [Math.floor(raw / 10) + Number(raw % 10 >= 5)]
  }
  return [Number(a.toPrecision(3))]
}

for (const cheat of codes) {
  it(`generates 200 correct, playable ${cheat} orders per tier`, () => {
    const variants = new Set<string>()
    for (const tier of tiers) {
      for (let seed = 0; seed < 200; seed++) {
        const question = generateBatch(cheat, tier, seed)
        const { game } = question
        variants.add(JSON.stringify([question.prompt, game]))
        expect(question.hint1 && question.hint2 && question.explanation).toBeTruthy()
        if (game.type === 'stack') {
          const tiles = game.solution.map((index) => game.blocks[index].value)
          expect(tiles.length).toBe(tier === 1 ? 2 : 3)
          expect(tiles.reduce((total, val) => total + val, 0)).toBe(game.target)
          if (tier === 1) expect(game.target).toBeLessThanOrEqual(20)
          if (tier === 2) expect(game.target).toBeLessThanOrEqual(100)
          if (tier === 3) {
            expect(tiles.every((value) => value >= 100 && value < 1000)).toBe(true)
            expect(tiles.reduce((total, value) => total + value % 10, 0)).toBeGreaterThanOrEqual(10)
          }
          if (tier === 5) expect(tiles.some((val) => val < 0)).toBe(true)
          expect(checkBatch(question, game.solution)).toBe(true)
          expect(checkBatch(question, game.solution.slice(1))).toBe(false)
        } else if (game.type === 'coins') {
          const due = game.prices.reduce((total, price) => total + price, 0) * (1 - game.discount / 100)
          expect(game.due).toBeCloseTo(due)
          expect(game.paid).toBeGreaterThan(game.due)
          if (tier <= 3) expect(game.paid).toBeLessThanOrEqual(tier === 1 ? 20 : 10 ** tier)
          if (tier === 3) expect(game.due % 10).toBeGreaterThan(0)
          let left = game.paid - game.due
          const coins: number[] = []
          for (const [index, coin] of game.denominations.entries()) {
            const bigger = game.denominations.length - index - 1
            const denomination = game.denominations[bigger]
            const copies = Math.floor(left / denomination)
            coins.push(...Array<number>(copies).fill(bigger))
            left %= denomination
            expect(coin).toBeGreaterThan(0)
          }
          expect(left).toBe(0)
          expect(coins.length).toBeLessThanOrEqual(40)
          expect(checkBatch(question, coins)).toBe(true)
        } else if (game.type === 'order') {
          const order = game.tiles.map((_, index) => index)
          const direction = question.prompt.includes('largest') ? -1 : 1
          order.sort((a, b) => direction * (game.tiles[a].value - game.tiles[b].value))
          expect(game.slots.length).toBe(order.length)
          expect(checkBatch(question, order)).toBe(true)
          expect(checkBatch(question, [...order].reverse())).toBe(false)
        } else {
          const correct = pickExpected(question).map(String)
          expect(game.parts.map((part) => part.correct)).toEqual(correct)
          expect(game.parts.every((part) => part.options.some((item) => item.key === part.correct))).toBe(true)
          expect(checkBatch(question, correct)).toBe(true)
          expect(checkBatch(question, ['bad-choice'])).toBe(false)
          if (cheat === 'share' && tier === 1) expect(nums(question.prompt)[0]).toBeLessThanOrEqual(20)
          if (cheat === 'share' && tier === 4) expect(nums(question.prompt)[0]).toBeGreaterThanOrEqual(10)
        }
      }
    }
    expect(variants.size).toBeGreaterThan(110)
  })
}
