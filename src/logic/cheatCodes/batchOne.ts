import { cheats, type CheatId, type Topic } from '../../data/catalog'
import type { Tier } from '../difficulty'
import { questionRandom } from './random'

export type NewCheat = Extract<CheatId, 'sum' | 'change' | 'share' | 'decimal' | 'sale' | 'digits'>
type Tile = { label: string; value: number }
type Choice = { label: string; key: string }
type Part = { name: string; options: Choice[]; correct: string }
type Roll = ReturnType<typeof questionRandom>

export type BatchGame =
  | { type: 'stack'; blocks: Tile[]; target: number; slots: number; scale: number; solution: number[] }
  | { type: 'coins'; due: number; paid: number; denominations: number[]; scale: number; prices: number[]; discount: number }
  | { type: 'order'; tiles: Tile[]; solution: number[]; slots: string[] }
  | { type: 'pick'; parts: Part[]; groups?: number; offers?: string[]; rail?: boolean }

type Puzzle = { prompt: string; hint1: string; hint2: string; explanation: string; game: BatchGame }
export type BatchQuestion = Puzzle & { id: string; cheat: NewCheat; topic: Topic; tier: Tier }
export type BatchAnswer = (number | string)[]

function shuffled<T>(items: readonly T[], roll: Roll) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = roll(0, index)
    const held = copy[index]
    copy[index] = copy[other]
    copy[other] = held
  }
  return copy
}

export function amount(value: number, scale: number) {
  return scale === 1 ? String(value) : (value / scale).toFixed(scale === 10 ? 1 : 2)
}

const totalOf = (items: readonly number[]) => items.reduce((total, item) => total + item, 0)
const sameOrder = (answer: BatchAnswer, correct: BatchAnswer) => answer.length === correct.length && correct.every((item, index) => answer[index] === item)

export function checkBatch(question: BatchQuestion, answer: BatchAnswer) {
  const { game } = question
  if (game.type === 'pick') return sameOrder(answer, game.parts.map((part) => part.correct))
  if (game.type === 'order') return sameOrder(answer, game.solution)
  if (!answer.every((value) => typeof value === 'number')) return false
  const indices = answer as number[]
  if (game.type === 'coins') return indices.every((index) => game.denominations[index] !== undefined)
    && totalOf(indices.map((index) => game.denominations[index])) === game.paid - game.due
  return indices.length === game.slots && new Set(indices).size === indices.length
    && indices.every((index) => game.blocks[index] !== undefined)
    && totalOf(indices.map((index) => game.blocks[index].value)) === game.target
}

function stack(tier: Tier, roll: Roll): Puzzle {
  const scale = tier === 5 ? 100 : tier === 4 && roll(0, 1) ? 10 : 1
  const low = [1, 3, 111, 1_111, 0][tier - 1]
  const high = [10, 33, 489, 7_999, 0][tier - 1]
  const chooseMixed = () => [
    { value: roll(4, 19) * 10 },
    { value: -roll(1, 6) * 10 },
    { value: roll(1, 3) * 25, quarter: true },
  ]
  const numeric = () => Array.from({ length: tier === 1 ? 2 : 3 }, () => ({ value: roll(low, high) }))
  const correct = tier === 5 ? chooseMixed() : numeric()
  if (tier === 3) {
    const ones = roll(2, 9)
    correct[0].value = Math.floor(correct[0].value / 10) * 10 + ones
    correct[1].value = Math.floor(correct[1].value / 10) * 10 + roll(10 - ones, 9)
  }
  const other = tier === 5 ? chooseMixed() : numeric()
  const blocks = shuffled([...correct, ...other], roll)
  const tiles = blocks.map((block) => ({
    value: block.value,
    label: 'quarter' in block && block.quarter ? [ '', '¼', '½', '¾'][block.value / 25] : amount(block.value, scale),
  }))
  const target = totalOf(correct.map((tile) => tile.value))
  return {
    prompt: `Stack ${correct.length} blocks to make ${amount(target, scale)}.`,
    hint1: scale === 100 ? 'Write the fractions as decimals first. A quarter is 0.25.' : 'Add the blocks one at a time. How much more do you need?',
    hint2: `One stack starts with ${tiles[blocks.indexOf(correct[0])].label}.`,
    explanation: `${correct.map((tile) => amount(tile.value, scale)).join(' + ')} = ${amount(target, scale)}.`,
    game: { type: 'stack', blocks: tiles, target, slots: correct.length, scale, solution: correct.map((tile) => blocks.indexOf(tile)) },
  }
}

function change(tier: Tier, roll: Roll): Puzzle {
  const scale = tier >= 4 ? 100 : 1
  const prices = tier === 5 ? [roll(2, 12) * 100, roll(2, 12) * 100, roll(1, 8) * 100] :
    [roll(tier === 1 ? 1 : tier === 2 ? 12 : tier === 3 ? 105 : 101, [19, 89, 899, 2_999][tier - 1])]
  const discount = tier === 5 ? [10, 20, 25][roll(0, 2)] : 0
  if (tier === 3 && prices[0] % 10 === 0) prices[0]++
  const due = totalOf(prices) * (100 - discount) / 100
  const bills = tier === 1 ? [10, 20] : tier === 2 ? [50, 100] : tier === 3 ? [500, 1_000] : [1_000, 2_000, 5_000]
  const validBills = bills.filter((bill) => bill > due)
  const paid = tier === 1 ? validBills[roll(0, validBills.length - 1)] : validBills[0]
  const denominations = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000].filter((coin) => coin <= paid && coin <= (tier === 1 ? 10 : 2_000))
  return {
    prompt: 'Give the customer the right change.',
    hint1: 'Take the amount due away from the amount they paid.',
    hint2: `Start at ${amount(due, scale)}. How much do you need to reach ${amount(paid, scale)}?`,
    explanation: `${amount(paid, scale)} − ${amount(due, scale)} = ${amount(paid - due, scale)} in change.`,
    game: { type: 'coins', due, paid, scale, denominations, prices, discount },
  }
}

function pickNumber(name: string, answer: number, roll: Roll, scale = 1, limit?: number): Part {
  const options = new Set([answer])
  for (const delta of shuffled([-3, -2, -1, 1, 2, 3, 4, 5], roll)) {
    if (answer + delta >= 0 && (limit === undefined || answer + delta < limit)) options.add(answer + delta)
    if (options.size === 4) break
  }
  return {
    name, correct: String(answer), options: shuffled([...options], roll).map((value) => ({ key: String(value), label: amount(value, scale) })),
  }
}

function share(tier: Tier, roll: Roll): Puzzle {
  const groups = roll(2, tier <= 2 ? 10 : 9)
  const portion = tier === 1 ? roll(1, Math.floor(20 / groups)) : roll(tier === 4 ? 6 : 2, [5, 10, 13, 62, 9][tier - 1])
  const left = tier >= 3 ? roll(1, groups - 1) : 0
  const whole = groups * portion + left
  if (tier === 5 && roll(0, 1)) {
    const a = roll(2, 6)
    const b = a + roll(1, 4)
    const batch = (a + b) * portion
    return {
      prompt: `Split ${batch} berries between two baskets in a ${a} to ${b} ratio.`,
      hint1: 'Add the parts in the ratio to find the total number of equal parts.',
      hint2: `Each part is ${portion} berries. Give the first basket ${a} parts.`,
      explanation: `${batch} ÷ ${a + b} = ${portion} berries per part. The baskets get ${a * portion} and ${b * portion}.`,
      game: { type: 'pick', groups: 2, parts: [pickNumber('First basket', a * portion, roll), pickNumber('Second basket', b * portion, roll)] },
    }
  }
  if (tier === 5) {
    const divisor = [2,5,10][roll(0, 2)]
    const dec = roll(2, 9) * 10 + roll(1, 9)
    return {
      prompt: `Share ${amount(dec * divisor, 10)} litres equally among ${divisor} villagers.`,
      hint1: 'Think in tenths of a litre first.',
      hint2: `Divide ${dec * divisor} tenths by ${divisor}.`,
      explanation: `${amount(dec * divisor, 10)} ÷ ${divisor} = ${amount(dec, 10)} litres each.`,
      game: { type: 'pick', groups: divisor, parts: [pickNumber('Litres each', dec, roll, 10)] },
    }
  }
  if (tier === 4 && roll(0, 1)) return {
    prompt: `Pack ${whole} rolls in boxes that hold ${groups} each. How many boxes do you need for every roll?`,
    hint1: 'Find out how many boxes you can fill completely.',
    hint2: `There are ${portion} full boxes and ${left} extra rolls.`,
    explanation: `The remaining ${left} rolls need another box. Use ${portion + 1} boxes.`,
    game: { type: 'pick', groups, parts: [pickNumber('Boxes to pack', portion + 1, roll)] },
  }
  return {
    prompt: `Share ${whole} berries equally among ${groups} villagers.`,
    hint1: `Give the same number of berries to all ${groups} villagers.`,
    hint2: `Try ${portion} berries each and count any left over.`,
    explanation: `${groups} × ${portion} = ${groups * portion}, leaving ${left} ${left === 1 ? 'berry' : 'berries'}.`,
    game: { type: 'pick', groups, parts: [pickNumber('Berries each', portion, roll), ...(left ? [pickNumber('Left for the pet', left, roll, 1, groups)] : [])] },
  }
}

function decimal(tier: Tier, roll: Roll): Puzzle {
  if (tier === 1) {
    const start = roll(0, 3) * 10
    const steps = roll(1, 9)
    const point = start + steps
    return {
      prompt: `Tap ${amount(point, 10)} on the number line.`, hint1: 'Each mark is one tenth.',
      hint2: `Count ${steps} steps from ${amount(start, 10)}.`, explanation: `${point} tenths is ${amount(point, 10)}.`,
      game: { type: 'pick', rail: true, parts: [{ name: 'Number line', correct: String(point),
        options: Array.from({ length: 11 }, (_, n) => ({ key: String(start + n), label: amount(start + n, 10) })) }] },
    }
  }
  if (tier === 2) {
    const base = roll(1, 15) * 100
    const prices = [base + roll(1, 29), base + roll(31, 59), base + roll(61, 99)]
    const tiles = shuffled(prices, roll).map((value) => ({ value, label: amount(value, 100) }))
    return {
      prompt: 'Put the price tags in order from cheapest to dearest.', hint1: 'Line up the decimal points and compare tenths first.',
      hint2: `The cheapest tag is ${amount(prices[0], 100)}.`, explanation: prices.map((price) => amount(price, 100)).join(' < '),
      game: { type: 'order', tiles, solution: prices.map((price) => tiles.findIndex((tile) => tile.value === price)), slots: ['Cheapest', 'Middle', 'Dearest'] },
    }
  }
  if (tier === 5 && roll(0, 2) === 0) {
    const n = roll(1, 8)
    return {
      prompt: `The digit ${n} repeats forever in 0.${n}${n}${n}… Which fraction belongs on its price tag?`,
      hint1: 'Call the repeating number x. Think about 10 × x.', hint2: `10x − x is exactly ${n}.`,
      explanation: `9x = ${n}, so x = ${n}/9.`,
      game: { type: 'pick', parts: [{ name: 'Fraction tag', correct: `${n}/9`, options: shuffled([7,8,9,10], roll).map((d) =>
        ({ key: `${n}/${d}`, label: `${n}/${d}` })) }] },
    }
  }

  const a = roll(135, 989)
  const b = roll(103, 132)
  const count = roll(2, 7)
  const sign = roll(0, 1) ? '+' : '−'
  if (tier === 3) {
    const result = sign === '+' ? a + b : a - b
    return {
      prompt: sign === '+' ? `Ring up prices ${amount(a, 100)} and ${amount(b, 100)}.` : `A price of ${amount(a, 100)} drops by ${amount(b, 100)}. Ring up the new price.`,
      hint1: 'Line up the decimal points before you do the calculation.',
      hint2: `Work in cents: ${a} ${sign} ${b}.`, explanation: `${amount(a, 100)} ${sign} ${amount(b, 100)} = ${amount(result, 100)}.`,
      game: { type: 'pick', parts: [pickNumber('Checkout total', result, roll, 100)] },
    }
  }
  if (tier === 4) {
    const rounded = Math.floor((a * count + 5) / 10)
    return {
      prompt: `Ring up ${count} items at ${amount(a, 100)} each. Round the total to the nearest tenth.`,
      hint1: 'Multiply first. Look at the hundredths digit when rounding the total.',
      hint2: `The exact total is ${amount(a * count, 100)}.`, explanation: `${amount(a * count, 100)} rounds to ${amount(rounded, 10)}.`,
      game: { type: 'pick', parts: [pickNumber('Rounded checkout total', rounded, roll, 10)] },
    }
  }
  const unit = roll(11, 57)
  const multiplier = roll(11, 29)
  const divide = roll(0, 1) === 0
  const result = divide ? unit : unit * multiplier
  return {
    prompt: divide ? `One carton costs ${amount(unit * multiplier, 100)} and holds ${amount(multiplier, 10)} kg. Ring up the price per kg.`
      : `Ring up the cost of ${amount(multiplier, 10)} kg at ${amount(unit, 10)} per kg.`,
    hint1: 'Keep track of the decimal places. Work in tenths or hundredths first.',
    hint2: divide ? `Divide ${unit * multiplier} by ${multiplier}, then write the result in tenths.` : `Multiply ${unit} by ${multiplier} and write the answer in hundredths.`,
    explanation: divide ? `${amount(unit * multiplier, 100)} ÷ ${amount(multiplier, 10)} = ${amount(unit, 10)}.`
      : `${amount(unit, 10)} × ${amount(multiplier, 10)} = ${amount(result, 100)}.`,
    game: { type: 'pick', parts: [pickNumber('Checkout price', result, roll, divide ? 10 : 100)] },
  }
}

function sale(tier: Tier, roll: Roll): Puzzle {
  if (tier <= 2) {
    const percents = shuffled(tier === 1 ? [25, 50, 25] : [10, 20, 50], roll)
    const original = Array.from({ length: 3 }, () => roll(tier === 1 ? 3 : 2, tier === 1 ? 12 : 10) * (tier === 1 ? 4 : 10))
    let prices = original.map((price, index) => price * (100 - percents[index]) / 100)
    while (new Set(prices).size !== prices.length) {
      const duplicate = prices.findIndex((price, index) => prices.indexOf(price) !== index)
      original[duplicate] += tier === 1 ? 4 : 10
      prices = original.map((price, index) => price * (100 - percents[index]) / 100)
    }
    const vendors = ['Moon stall', 'Star stall', 'Cloud stall']
    const best = prices.indexOf(Math.min(...prices))
    return {
      prompt: 'Which stall has the lowest price after the sale?',
      hint1: 'Compare the final prices after each discount.',
      hint2: tier === 1 ? 'Half off leaves one half. A quarter off leaves three quarters.' : 'Find 10% by dividing by 10. Use it to compare the deals.',
      explanation: `The prices are ${prices.join(', ')} coins. The ${vendors[best].toLowerCase()} is cheapest.`,
      game: { type: 'pick', offers: original.map((price, index) => `${vendors[index]} · ${price} coins · ${percents[index]}% off`),
        parts: [{ name: 'Best deal', correct: String(best), options: vendors.map((label, index) => ({ label, key: String(index) })) }] },
    }
  }

  const base = roll(2, 24) * (tier === 4 ? 20 : 100)
  const percent = tier === 3 ? roll(1, 100) : [5, 10, 15, 20, 25, 30, 40, 50][roll(0, 7)]
  const after = base * (100 - percent) / 100
  if (tier === 3) return {
    prompt: `A ${base}-coin lantern is ${percent}% off. Choose its sale tag.`, hint1: 'Find the discount, then take it away from the starting price.',
    hint2: `${percent}% of ${base} is ${base - after}.`, explanation: `${base} − ${base - after} = ${after} coins.`,
    game: { type: 'pick', offers: [`Lantern · ${base} coins · ${percent}% off`], parts: [pickNumber('Sale price', after, roll)] },
  }
  if (tier === 4) {
    const change = roll(0, 1) === 0 ? -percent : percent
    const newPrice = base * (100 + change) / 100
    const direction = change < 0 ? 'dropped' : 'went up'
    return {
      prompt: `A stool's price ${direction} by ${percent}% and is now ${newPrice} coins. What was the old tag?`,
      hint1: 'The old price represents 100%. Work out what percentage the new tag represents.',
      hint2: `${newPrice} coins is ${100 + change}% of the old price.`,
      explanation: `${newPrice} × 100 ÷ ${100 + change} = ${base} coins.`,
      game: { type: 'pick', offers: [`New tag · ${newPrice} coins`], parts: [pickNumber('Old price', base, roll)] },
    }
  }
  const second = [5,10,20,25,50][roll(0, 4)]
  const firstChange = roll(0, 1) ? percent : -percent
  const middle = base * (100 + firstChange) / 100
  const final = middle * (100 - second)
  return {
    prompt: `A ${base}-coin rug goes ${firstChange > 0 ? 'up' : 'down'} ${percent}%, then gets a ${second}% discount. Choose its final tag.`,
    hint1: 'Calculate each price change in order. The second percentage uses the new price.',
    hint2: `After the first change, the rug costs ${middle} coins.`,
    explanation: `${middle} × ${100 - second}% = ${amount(final, 100)} coins.`,
    game: { type: 'pick', offers: [`Start · ${base} coins`, `Sale · ${second}% off`], parts: [pickNumber('Final price', final, roll, 100)] },
  }
}

function drawers(tier: Tier, roll: Roll): Puzzle {
  if (tier <= 2) {
    const length = tier + 1
    const largest = roll(0, 1) === 1
    const parts = shuffled([1,2,3,4,5,6,7,8,9], roll).slice(0, length)
    const ordered = [...parts].sort((a, b) => largest ? b - a : a - b)
    return {
      prompt: `Use the drawers to make the ${largest ? 'largest' : 'smallest'} ${length}-digit number.`,
      hint1: 'The leftmost drawer has the most value.', hint2: `Put ${ordered[0]} in the first drawer.`,
      explanation: `${ordered.join('')} is the ${largest ? 'largest' : 'smallest'} number you can make with these digits.`,
      game: { type: 'order', tiles: parts.map((value) => ({ value, label: String(value) })), solution: ordered.map((value) => parts.indexOf(value)),
        slots: ['Hundreds', 'Tens', 'Ones'].slice(-length) },
    }
  }
  if (tier === 3 || (tier === 4 && roll(0, 1))) {
    const places = ['Hundred thousands', 'Ten thousands', 'Thousands', 'Hundreds', 'Tens', 'Ones', 'Tenths', 'Hundredths', 'Thousandths']
    const start = tier === 3 ? roll(0, 2) : 4
    const length = tier === 3 ? 6 - start : 5
    const digits = shuffled([1,2,3,4,5,6,7,8,9,0], roll).slice(0, length)
    if (digits[0] === 0) [digits[0], digits[1]] = [digits[1], digits[0]]
    const index = roll(tier === 4 ? 2 : 0, length - 1)
    const place = places[start + index]
    const shown = tier === 3 ? digits.join('') : `${digits.slice(0, 2).join('')}.${digits.slice(2).join('')}`
    return {
      prompt: `Which digit in ${shown} belongs in the ${place.toLowerCase()} drawer?`,
      hint1: tier === 3 ? 'Start at the right with ones. Move left one place at a time.' : 'Start just to the right of the decimal point with tenths.',
      hint2: `Count ${tier === 3 ? length - index : index - 1} places ${tier === 3 ? 'from the right, including ones' : 'after the decimal point'}.`,
      explanation: `The ${place.toLowerCase()} digit in ${shown} is ${digits[index]}.`,
      game: { type: 'pick', parts: [{ name: place, correct: String(digits[index]), options: shuffled([digits[index], ...digits.filter((digit) => digit !== digits[index]).slice(0, 3)], roll)
        .map((digit) => ({ key: String(digit), label: String(digit) })) }] },
    }
  }
  if (tier === 4) {
    const raw = roll(11_001, 99_986)
    const rounded = Math.floor((raw + 5) / 10)
    const shown = (raw / 1000).toFixed(3)
    return {
      prompt: `Round ${shown} to 2 decimal places. Pick the label for the drawer.`,
      hint1: 'Keep the hundredths digit and look at the thousandths digit.',
      hint2: `The next digit is ${raw % 10}. A 5 or more rounds up.`,
      explanation: `${shown} rounds to ${amount(rounded, 100)}.`,
      game: { type: 'pick', parts: [pickNumber('Rounded number', rounded, roll, 100)] },
    }
  }
  if (roll(0, 1)) {
    const given = roll(111, 998)
    const exponent = roll(2, 5) * (roll(0, 1) ? 1 : -1)
    const coefficient = amount(given, 100)
    const number = exponent > 0 ? String(given * 10 ** (exponent - 2)) : (given / 10 ** (2 - exponent)).toFixed(2 - exponent)
    return {
      prompt: `Put ${number} in standard form.`, hint1: 'The number in front must be at least 1 and less than 10.',
      hint2: `Start with ${coefficient}. Find the power of ten that moves its decimal point into the right place.`,
      explanation: `${coefficient} × 10^${exponent} = ${number}.`,
      game: { type: 'pick', parts: [{ name: 'Standard form', correct: String(exponent),
        options: shuffled([exponent - 1, exponent, exponent + 1, -exponent], roll).map((power) => ({ key: String(power), label: `${coefficient} × 10^${power}` })) }] },
    }
  }
  const raw = roll(10_100, 98_900)
  const rounded = Math.floor((raw + 50) / 100) * 100
  return {
    prompt: `Round ${raw} to 3 significant figures.`, hint1: 'Count three digits from the first nonzero digit.',
    hint2: 'The digit after the hundreds place tells you whether to round up.',
    explanation: `${raw} rounds to ${rounded} to 3 significant figures.`,
    game: { type: 'pick', parts: [{ name: 'Rounded number', correct: String(rounded),
      options: shuffled([rounded - 100, rounded, rounded + 100, raw === rounded ? raw + 10 : raw], roll)
        .map((value) => ({ key: String(value), label: String(value) })) }] },
  }
}

const generators = { sum: stack, change, share, decimal, sale, digits: drawers }

export function generateBatch(cheat: NewCheat, tier: Tier, seed: number): BatchQuestion {
  return { ...generators[cheat](tier, questionRandom(seed)), cheat, topic: cheats[cheat].topic, tier, id: `${cheat}-${tier}-${seed}` }
}
