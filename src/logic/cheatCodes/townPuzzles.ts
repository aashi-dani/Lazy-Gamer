import { cheats, type CheatId, type Topic } from '../../data/catalog'
import curated from '../../data/curatedOrders.json'
import type { Tier } from '../difficulty'
import { questionRandom } from './random'

export const worldCodes = ['sort', 'leap', 'spinner', 'mystery', 'recipe', 'festival'] as const
export type WorldCode = typeof worldCodes[number]
export function isWorldCode(code: CheatId): code is WorldCode { return worldCodes.includes(code as WorldCode) }
type Roll = ReturnType<typeof questionRandom>

export type Choice = { label: string; value: string }
export type PuzzleSlot = { name: string; options: Choice[]; correct: string }
type Card = { label: string; value: string }
type SortBoard = { type: 'sort'; bins: string[]; cards: Card[] }
type LineBoard = { type: 'line'; slot: PuzzleSlot }
type SpinnerBoard = { type: 'spin'; slot: PuzzleSlot; red: number; blue: number; spins: number; tree?: boolean; replacement?: boolean }
type MysteryBoard = { type: 'mystery'; clues: string[]; slots: PuzzleSlot[]; grid?: boolean }
type RecipeBoard = { type: 'recipe'; ingredients: string[]; slots: PuzzleSlot[] }
type RelayBoard = { type: 'relay'; sequence: number[]; slot: PuzzleSlot }
export type WorldBoard = SortBoard | LineBoard | SpinnerBoard | MysteryBoard | RecipeBoard | RelayBoard
type Puzzle = { prompt: string; hint1: string; hint2: string; explanation: string; board: WorldBoard }
export type TownQuestion = Puzzle & { id: string; cheat: WorldCode; topic: Topic; tier: Tier }

function shuffled<T>(source: readonly T[], roll: Roll) {
  const items = [...source]
  for (let i = items.length - 1; i > 0; i--) {
    const j = roll(0, i)
    const item = items[j]
    items[j] = items[i]
    items[i] = item
  }
  return items
}

const answerSlot = (name: string, expected: string, items: string[], roll?: Roll): PuzzleSlot => ({
  name, correct: expected, options: (roll ? shuffled([...new Set(items)], roll) : [...new Set(items)]).map((label) => ({ label, value: label })),
})
const selection = (name: string, value: number, roll: Roll, step = 1, minimum = 0) => answerSlot(name, String(value),
  [value, ...shuffled([-3, -2, -1, 1, 2, 3, 4], roll).map((n) => value + n * step).filter((n) => n >= minimum).slice(0, 3)].map(String), roll)
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
const fraction = (n: number, d: number) => {
  const factor = gcd(n, d)
  return n === d ? '1' : n === 0 ? '0' : `${n / factor}/${d / factor}`
}
const prime = (n: number) => n > 1 && !Array.from({ length: Math.max(0, Math.floor(Math.sqrt(n)) - 1) }, (_, i) => i + 2).some((d) => n % d === 0)
const proof = (cards: Card[]) => cards.map(({ label, value }) => `${label} → ${value}`).join(' · ')

function sorter(tier: Tier, roll: Roll): Puzzle {
  let bins: string[]
  let cards: Card[]
  let hint1: string
  let prompt = 'Put each number in its matching bin.'
  if (tier === 1 || tier === 2) {
    const factor = roll(2, 7)
    const target = factor * roll(2, 7)
    const check = tier === 1 ? 0 : roll(1, 3)
    const rules = [
      { name: 'Even', hint: 'A number is even if it splits into two whole equal groups.', fits: (n: number) => n % 2 === 0 },
      { name: `Multiple of ${factor}`, hint: `Divide by ${factor}. A whole number with no leftover belongs in the multiple bin.`, fits: (n: number) => n % factor === 0 },
      { name: `Factor of ${target}`, hint: `A factor divides ${target} without a remainder.`, fits: (n: number) => target % n === 0 },
      { name: 'Prime', hint: 'A prime number has exactly two positive factors: 1 and itself.', fits: prime },
    ]
    const rule = rules[check]
    bins = check === 0 ? ['Even', 'Odd'] : [rule.name, 'Other numbers']
    const max = tier === 1 ? 20 : 60
    const correctPool = Array.from({ length: max }, (_, i) => i + 1).filter(rule.fits)
    const otherPool = Array.from({ length: max }, (_, i) => i + 1).filter((n) => !rule.fits(n))
    cards = shuffled([...shuffled(correctPool, roll).slice(0, 2), ...shuffled(otherPool, roll).slice(0, 2)], roll).map((n) =>
      ({ label: String(n), value: bins[rule.fits(n) ? 0 : 1] }))
    hint1 = rule.hint
  } else if (tier === 3) {
    const a = roll(0, 12), b = roll(13, 34), c = roll(-12, -1), d = roll(-34, -13)
    bins = ['Natural', 'Negative integer']
    cards = shuffled([a, b, c, d], roll).map((n) => ({ label: String(n), value: bins[Number(n < 0)] }))
    hint1 = 'Here the natural numbers start at zero. A minus sign goes with a negative integer.'
  } else if (tier === 4) {
    const n = roll(2, 19)
    const a = roll(1, 8)
    bins = ['Integer', 'Other rational']
    cards = shuffled([{ label: String(-n), value: 'Integer' }, { label: `${a * 4}/4`, value: 'Integer' },
      { label: `${n * 2 + 1}/2`, value: 'Other rational' }, { label: `-${roll(3, 20)}.5`, value: 'Other rational' }], roll)
    hint1 = 'All the cards are rational. Work out the fractions first to find which are also integers.'
  } else {
    const root = roll(2, 9)
    const denom = roll(2, 9)
    const radicals = [2, 3, 5, 6, 7, 8, 10, 11]
    bins = ['Natural', 'Other integer', 'Other rational', 'Irrational']
    prompt = 'Sort these real numbers into the most specific matching bin.'
    cards = shuffled([
      { label: `√${root ** 2}`, value: 'Natural' }, { label: `−${roll(1, 9)}`, value: 'Other integer' },
      { label: `1/${denom}`, value: 'Other rational' }, { label: roll(0, 1) ? 'π' : `√${radicals[roll(0, 7)]}`, value: 'Irrational' },
    ], roll)
    hint1 = 'Squares like 9 have whole square roots. Pi and square roots of non-square whole numbers are irrational.'
  }
  const example = cards[0]
  return { prompt, hint1, hint2: `Start with ${example.label}. Try ${example.value}.`, explanation: proof(cards), board: { type: 'sort', cards, bins } }
}

function line(tier: Tier, roll: Roll): Puzzle {
  let units = 1
  let step = 1
  let target: number
  let prompt: string
  let label: (n: number) => string = String
  if (tier === 5) {
    const squareRoot = roll(1, 8)
    const radical = squareRoot ** 2 + roll(1, 2 * squareRoot)
    const constant = roll(0, 4) === 0
    const floor = Math.floor(constant ? Math.PI : Math.sqrt(radical))
    const shown = constant ? 'π' : `√${radical}`
    const intervals = Array.from({ length: 4 }, (_, i) => Math.max(0, floor - 1) + i).map((n) => `${n} to ${n + 1}`)
    return { prompt: `Between which two whole numbers is ${shown}?`, hint1: constant ? 'Pi is just over 3.14.' : 'Find the perfect squares on both sides of the number under the root.',
      hint2: constant ? 'Pi is more than 3 and less than 4.' : `${floor ** 2} < ${radical} < ${(floor + 1) ** 2}.`,
      explanation: `${floor} < ${shown} < ${floor + 1}.`,
      board: { type: 'line', slot: answerSlot('Choose the interval', `${floor} to ${floor + 1}`, intervals) } }
  }
  if (tier === 1) target = roll(0, 20)
  else if (tier === 2) {
    step = roll(0, 1) ? 5 : 10
    target = roll(0, 100 / step) * step
  } else if (tier === 3) {
    units = 2
    target = roll(-20, 12)
    label = (n) => String(n / 2)
  } else {
    units = 4
    target = roll(-10, 12)
    label = (n) => String(n / 4)
  }
  const shown = tier === 4 && roll(0, 1) ? (target < 0 ? '−' : '') + fraction(Math.abs(target), units) : label(target)
  prompt = `Place ${shown} on the number line.`
  const earliest = tier <= 2 ? Math.max(0, Math.min((tier === 1 ? 20 : 100) - 5 * step, target - roll(1, 4) * step)) : target - roll(1, 4)
  const ticks = Array.from({ length: 6 }, (_, i) => label(earliest + i * step))
  return {
    prompt, hint1: `Each tick jumps ${step / units}. Smaller numbers sit farther left.`,
    hint2: tier === 4 ? `${shown} belongs at ${label(target)} on the line.` : `Find the tick labelled ${label(target)}.`,
    explanation: `${shown} belongs on the ${label(target)} tick.`,
    board: { type: 'line', slot: answerSlot('Number line', label(target), ticks) },
  }
}

function spinner(tier: Tier, roll: Roll): Puzzle {
  const authored = tier === 3 && roll(0, 2) === 0 ? curated.spinnerRounds[roll(0, curated.spinnerRounds.length - 1)] : undefined
  const red = authored?.red ?? roll(tier === 2 ? 1 : 2, 7)
  const blue = authored?.blue ?? roll(2, 7)
  const total = red + blue
  const spins = authored?.spins ?? roll(3, 9) * total
  let replacement: boolean | undefined
  let prompt: string
  let hint1: string
  let hint2: string
  let explanation: string
  let slot: PuzzleSlot
  if (tier === 1) {
    const expected = red === blue ? 'Equally likely' : red > blue ? 'Coral' : 'Blue'
    prompt = 'Which colour is more likely on one spin?'
    hint1 = 'Each slice has the same chance. Compare how many slices each colour has.'
    hint2 = `Count ${red} coral slices and ${blue} blue slices.`
    explanation = red === blue ? 'Both colours have the same number of slices.' : `${expected} covers more slices.`
    slot = answerSlot('Pick a colour', expected, ['Coral', 'Blue', 'Equally likely'])
  } else if (tier === 2) {
    const expected = fraction(red, total)
    prompt = 'What fraction of spins should land on coral?'
    hint1 = 'Write coral slices above the total number of slices.'
    hint2 = `Start with ${red} out of ${total}.`
    explanation = `${red}/${total} simplifies to ${expected}.`
    slot = answerSlot('Chance of coral', expected, [expected, fraction(red, total + 1), fraction(red + 1, total), fraction(total, total + 1)], roll)
  } else if (tier === 3) {
    const expected = spins / total * red
    prompt = `About how many coral results would you expect in ${spins} spins?`
    hint1 = 'The expected count is the number of spins times the chance of coral.'
    hint2 = `Multiply ${spins} by ${red}/${total}.`
    explanation = `${spins} × ${red}/${total} = ${expected} expected coral spins.`
    slot = selection('Expected count', expected, roll)
  } else {
    const either = roll(0, 1) === 1
    const conditional = tier === 5 && either
    replacement = tier === 4
    const denominator = tier === 4 ? total * total : conditional ? total - 1 : total * (total - 1)
    const numerator = tier === 4 ? either ? denominator - blue * blue : red * red : conditional ? red - 1 : red * (red - 1)
    const expected = fraction(numerator, denominator)
    prompt = tier === 4 ? either ? 'On two spins, what is the chance of getting coral at least once?' : 'On two spins, what is the chance of coral both times?'
      : conditional ? 'One coral ticket was drawn and kept. What is the chance the next ticket is coral?'
      : 'The slices become tickets. Draw two without putting the first back. What is the chance both are coral?'
    hint1 = tier === 4 && either ? 'Find the chance of two blue results and subtract from 1.'
      : tier === 4 ? 'The chance of coral is unchanged on the second spin.'
      : 'Once a coral ticket is drawn, there is one less coral ticket and one less ticket in total.'
    hint2 = tier === 4 ? either ? `Two blues has probability ${blue}/${total} × ${blue}/${total}.` : `Multiply ${red}/${total} by itself.`
      : conditional ? `There are ${red - 1} coral tickets left out of ${total - 1}.` : `Multiply ${red}/${total} by ${red - 1}/${total - 1}.`
    explanation = `The chance is ${numerator}/${denominator}, or ${expected}.`
    slot = answerSlot('Probability', expected,
      [expected, fraction(numerator, denominator + 1), fraction(numerator + 1, denominator), fraction(numerator, denominator + 2)], roll)
  }
  return { prompt, hint1, hint2, explanation, board: { type: 'spin', slot, red, blue, spins: tier >= 4 ? 2 : spins, tree: tier >= 4, replacement } }
}

function mystery(tier: Tier, roll: Roll): Puzzle {
  const a = roll(2, 9)
  const b = roll(2, 7)
  const c = Math.min(a * b - 1, roll(1, 5))
  let clues: string[], slots: PuzzleSlot[], hint1: string, hint2: string, explanation: string
  if (tier === 1) {
    const total = a + b
    clues = [`The stall packed ${total} rolls.`, `A customer took ${b} rolls.`]
    slots = [selection('Rolls left', a, roll)]
    hint1 = 'Take the customer’s rolls away from the stall’s starting amount.'
    hint2 = `Start with ${total} and count back ${b}.`
    explanation = `${total} − ${b} = ${a} rolls left.`
  } else if (tier === 2) {
    clues = [`Ari packed ${a} baskets with ${b} fruit in each.`, `Then ${c} fruit went to the bakery.`]
    slots = [selection('Fruit left', a * b - c, roll)]
    hint1 = 'Find the total first. Then subtract the fruit that went to the bakery.'
    hint2 = `There were ${a * b} fruit before the bakery took any.`
    explanation = `${a} × ${b} − ${c} = ${a * b - c} fruit.`
  } else if (tier === 3) {
    const authored = roll(0, 2) === 0 ? curated.mysteryGrids[roll(0, curated.mysteryGrids.length - 1)] : undefined
    const diners = authored?.diners ?? shuffled(['Ari', 'Bo', 'Fern', 'Jun', 'Luz', 'Nico', 'Ollie'], roll).slice(0, 3)
    const orders = authored?.orders ?? shuffled(['Bread', 'Jam', 'Pears', 'Milk', 'Buns', 'Rice'], roll).slice(0, 3)
    const foods = shuffled(orders, roll)
    clues = authored?.clues ?? ['Each customer ordered a different food.', `${diners[1]} ordered ${orders[1].toLowerCase()}.`,
      `${diners[2]} did not order ${orders[0].toLowerCase()}.`]
    slots = orders.map((order, index) => answerSlot(diners[index], order, foods))
    hint1 = 'Mark the order directly named in the clues.'
    hint2 = 'Cross off the food in the direct clue, then use the last clue to choose between the foods left.'
    explanation = slots.map((row) => `${row.name} ordered ${row.correct.toLowerCase()}.`).join(' ')
  } else if (tier === 4) {
    const counts = [a + b, a, a * 2]
    clues = [`All three crates hold ${counts.reduce((sum, item) => sum + item, 0)} fruit in total.`, `Crate A holds ${b} more fruit than B.`, 'Crate C holds twice as much fruit as B.']
    slots = counts.map((value, index) => selection(`Crate ${'ABC'[index]}`, value, roll))
    hint1 = 'Think of the fruit in crate B as one share. Crate C has two shares.'
    hint2 = `Four equal shares make ${4 * a} after taking away the extra ${b} in A.`
    explanation = `B has ${a}. A has ${a} + ${b} = ${counts[0]}, and C has ${a} × 2 = ${counts[2]}.`
  } else if (roll(0, 1)) {
    const colours = a
    const guaranteed = colours * b + 1
    clues = [`The bakery uses ${colours} wrapper colours, with plenty of each.`,
      `What is the fewest pastries you must draw to guarantee ${b + 1} wrappers of one colour?`]
    slots = [selection('Pastries to draw', guaranteed, roll)]
    hint1 = 'Think of the most spread out result you could get before a colour repeats enough.'
    hint2 = `You could draw ${b} of every colour without seeing ${b + 1} of one colour.`
    explanation = `After ${colours} × ${b} draws, one more must make ${b + 1} of some colour. Draw ${guaranteed}.`
  } else {
    const finished = a * b - c
    clues = [`The baker made ${b} times the starting number of rolls.`,
      `The baker sold ${c} and has ${finished} left. How many were there at the start?`]
    slots = [selection('Starting rolls', a, roll)]
    hint1 = 'Undo the sale before undoing the multiplication.'
    hint2 = `Add ${c} back before dividing by ${b}.`
    explanation = `(${finished} + ${c}) ÷ ${b} = ${a} starting rolls.`
  }
  return { prompt: 'Use the clues to fill the order cards.', hint1, hint2, explanation, board: { type: 'mystery', clues, slots, grid: tier === 3 } }
}

function recipe(tier: Tier, roll: Roll): Puzzle {
  const a = roll(2, 7)
  const b = roll(2, 8)
  const factor = roll(2, 6)
  let ingredients: string[], slots: PuzzleSlot[], hint1: string, hint2: string, explanation: string, prompt: string
  if (tier === 1) {
    const double = roll(0, 1) === 1
    ingredients = [`${2 * a} scoops of oats`, `${2 * b} scoops of berries`]
    prompt = double ? 'Double this snack recipe.' : 'Make half of this snack recipe.'
    const amounts = [a, b].map((qty) => qty * (double ? 4 : 1))
    slots = [selection('Oat scoops', amounts[0], roll), selection('Berry scoops', amounts[1], roll)]
    hint1 = double ? 'Use twice as much of every ingredient.' : 'Divide every ingredient by two.'
    hint2 = `${2 * a} ${double ? '×' : '÷'} 2 = ${amounts[0]} scoops of oats.`
    explanation = `Use ${amounts[0]} scoops of oats and ${amounts[1]} scoops of berries.`
  } else if (tier === 2) {
    const second = a === b ? b + 1 : b
    ingredients = [`For every ${a} scoops of oats, add ${second} scoops of berries.`, `${a * factor} scoops of oats are in the bowl.`]
    prompt = 'Keep the same ratio. How many scoops of berries belong in the bowl?'
    slots = [selection('Berry scoops', second * factor, roll)]
    hint1 = 'Work out how many portions of oats are already in the bowl.'
    hint2 = `${a * factor} ÷ ${a} = ${factor} portions.`
    explanation = `Each portion needs ${second} scoops of berries, so use ${second} × ${factor} = ${second * factor}.`
  } else if (tier === 3) {
    const total = (a + b) * factor
    ingredients = [`The recipe uses ${a} parts oats and ${b} parts berries.`, `Make ${total} scoops in total.`]
    prompt = 'Scale both ingredients to fill the bowl.'
    slots = [selection('Oat scoops', a * factor, roll), selection('Berry scoops', b * factor, roll)]
    hint1 = 'Add the parts, then divide the total scoops by that number.'
    hint2 = `${total} ÷ ${a + b} = ${factor} scoops per part.`
    explanation = `Multiply each part by ${factor} to get ${a * factor} scoops of oats and ${b * factor} of berries.`
  } else if (tier === 4) {
    const ratios = roll(0, 1) === 0
    ingredients = ratios ? [`Split ${(a + b) * factor} scoops into bowls in a ${a} to ${b} ratio.`] : [`${a} picnic baskets cost ${a * b} coins.`]
    prompt = ratios ? 'Share the oats between the two bowls.' : 'Find the price per basket.'
    slots = ratios ? [selection('First bowl', a * factor, roll), selection('Second bowl', b * factor, roll)] : [selection('Coins per basket', b, roll)]
    hint1 = ratios ? 'Find one part by dividing the total by all parts.' : 'Divide the full cost by the number of baskets.'
    hint2 = ratios ? `Each part is ${factor} scoops.` : `Start with ${a * b} ÷ ${a}.`
    explanation = ratios ? `The first bowl gets ${a * factor} scoops. The second gets ${b * factor}.` : `${a * b} ÷ ${a} = ${b} coins per basket.`
  } else if (roll(0, 1)) {
    const c = roll(2, 5)
    const total = (a + b + c) * factor
    ingredients = [`Oats : berries : milk = ${a} : ${b} : ${c}`, `Fill the bowl with ${total} measures.`]
    prompt = 'Scale all three ingredients in the same ratio.'
    slots = [a, b, c].map((count, i) => selection(['Oats', 'Berries', 'Milk'][i], count * factor, roll))
    hint1 = 'Add all three parts first.'
    hint2 = `Each part is ${total} ÷ ${a + b + c} = ${factor} measures.`
    explanation = `Use ${a * factor} measures of oats, ${b * factor} of berries, and ${c * factor} of milk.`
  } else {
    ingredients = [`${a} cooks take ${b * factor} minutes at the same rate.`, `Now there are ${a * factor} cooks sharing the same work.`]
    prompt = 'Work out the new preparation time.'
    slots = [selection('Minutes', b, roll)]
    hint1 = 'The total work stays the same. More cooks means less time.'
    hint2 = `There are now ${factor} times as many cooks. Divide the original time by ${factor}.`
    explanation = `${b * factor} ÷ ${factor} = ${b} minutes.`
  }
  return { prompt, hint1, hint2, explanation, board: { type: 'recipe', ingredients, slots } }
}

function relay(tier: Tier, roll: Roll): Puzzle {
  const start = roll(1, tier * 10)
  const jump = roll(1, tier === 1 ? 4 : 5 * tier)
  const step = (index: number) => jump + (tier >= 4 ? index * (tier === 4 ? 2 : 3) : 0)
  const sequence = [start]
  for (let i = 0; i < 3; i++) sequence.push(sequence[i] + step(i))
  const expected = sequence.at(-1)! + step(3)
  return { prompt: 'Fill the last crate to keep the festival delivery pattern going.',
    hint1: tier < 4 ? 'Find how many more items go in each crate.' : 'Look at how the gaps change from crate to crate.',
    hint2: `The next gap is ${step(3)}.`, explanation: `${sequence.at(-1)} + ${step(3)} = ${expected} items in the last crate.`,
    board: { type: 'relay', sequence, slot: selection('Last crate', expected, roll) } }
}

const generators = { sort: sorter, leap: line, spinner, mystery, recipe, festival: relay }

export function generateWorldPuzzle(cheat: WorldCode, tier: Tier, seed: number): TownQuestion {
  return { ...generators[cheat](tier, questionRandom(seed)), id: `${cheat}-${tier}-${seed}`, cheat, topic: cheats[cheat].topic, tier }
}

export function worldSlots(board: Exclude<WorldBoard, SortBoard>) {
  return 'slots' in board ? board.slots : [board.slot]
}

export function checkWorldPuzzle(question: TownQuestion, picks: string[]) {
  const { board } = question
  const expected = board.type === 'sort' ? board.cards.map((card) => card.value) : worldSlots(board).map((slot) => slot.correct)
  return picks.length === expected.length && expected.every((answer, index) => picks[index] === answer)
}
