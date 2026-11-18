import { cheats, type CheatId, type Topic } from '../../data/catalog'
import type { Tier } from '../difficulty'
import { questionRandom } from './random'

export const advancedCodes = ['balance', 'elevator', 'chart', 'pattern', 'angle', 'till', 'power'] as const
export type AdvancedCode = typeof advancedCodes[number]
export function isAdvancedCode(code: CheatId): code is AdvancedCode { return advancedCodes.includes(code as AdvancedCode) }
type Roll = ReturnType<typeof questionRandom>
export type Pick = { label: string; value: string }
export type Bars = { label: string; value: number }[]

type Format =
  | { type: 'balance'; left: string; right: string }
  | { type: 'elevator'; route: string; stops: number[]; start: number }
  | { type: 'chart'; bars: Bars; display: 'pictogram' | 'bar' | 'dots' | 'grouped'; truncated?: number }
  | { type: 'pattern'; shown: string[]; index: string }
  | { type: 'angle'; shown: number; name: string }
  | { type: 'till'; orders: { expression: string; answer: number }[] }
  | { type: 'power'; shown: string; cells: string[] }

type Puzzle = { prompt: string; hint1: string; hint2: string; explanation: string; choices: Pick[]; answer: string; format: Format }
export type AdvancedQuestion = Puzzle & { cheat: AdvancedCode; topic: Topic; tier: Tier; id: string }

function shuffle<T>(list: readonly T[], roll: Roll) {
  const items = [...list]
  for (let i = items.length - 1; i > 0; i--) {
    const j = roll(0, i)
    const held = items[j]
    items[j] = items[i]
    items[i] = held
  }
  return items
}

const numerals = (numbers: number[]) => numbers.map(String)
const choices = (values: string[], roll: Roll) => shuffle([...new Set(values)], roll).map((label) => ({ label, value: label }))
const guesses = (answer: number, roll: Roll, floor = -Infinity, ceiling = Infinity) => choices(numerals([answer,
  ...shuffle([-5, -3, -2, -1, 1, 2, 3, 4, 6], roll).map((n) => answer + n).filter((n) => n >= floor && n <= ceiling).slice(0, 3)]), roll)
const sign = (num: number) => num < 0 ? `− ${-num}` : `+ ${num}`
const digit = (num: number) => String(num).replace('-', '−')

function balance(tier: Tier, roll: Roll): Puzzle {
  const x = roll(tier >= 4 ? -5 : 1, tier === 1 ? 8 : 18)
  const offset = roll(2, tier === 1 ? Math.max(2, 10 - x) : 14)
  const coef = roll(2, 8)
  let left: string
  let right: string
  let hint1: string
  let hint2: string
  let explanation: string
  if (tier <= 2) {
    const subtract = tier === 2 && roll(0, 1)
    left = subtract ? `□ − ${offset}` : `${offset} + □`
    right = String(subtract ? x - offset : x + offset)
    hint1 = subtract ? 'Add the same amount back to both sides.' : 'Take the known weight away from the total.'
    hint2 = subtract ? `Add ${offset} back to ${right}.` : `Take ${offset} from ${right}.`
    explanation = `The missing weight is ${x}. Both sides equal ${right}.`
  } else if (tier === 3) {
    left = `${coef}x`
    right = String(coef * x)
    hint1 = 'Every x has the same weight. Divide both pans by the number of x weights.'
    hint2 = `Divide ${right} by ${coef}.`
    explanation = `${right} ÷ ${coef} = ${x}, so x = ${x}.`
  } else if (tier === 4) {
    const extra = offset * (roll(0, 1) ? 1 : -1)
    left = `${coef}x ${sign(extra)}`
    right = String(coef * x + extra)
    hint1 = 'Move the loose weight first. Then divide to find one x.'
    hint2 = `After removing the loose weight, ${coef}x = ${coef * x}.`
    explanation = `${coef}x = ${coef * x}. Dividing both sides by ${coef} gives x = ${x}.`
  } else {
    const other = roll(1, coef - 1)
    const added = (coef - other) * x + coef * offset
    left = `${coef}(x + ${offset})`
    right = `${other}x ${sign(added)}`
    hint1 = 'Open the brackets. Deal with the x weights together.'
    hint2 = `Subtract ${other}x and ${coef * offset} from both sides.`
    explanation = `You get ${coef - other}x = ${(coef - other) * x}. Dividing gives x = ${x}.`
  }
  return { prompt: tier <= 2 ? 'Choose the missing weight to balance the scale.' : 'Find x so that both pans balance.',
    hint1, hint2, explanation, answer: String(x), choices: guesses(x, roll, tier <= 3 ? 0 : -Infinity, tier === 1 ? 10 : Infinity), format: { type: 'balance', left, right } }
}

function elevator(tier: Tier, roll: Roll): Puzzle {
  let result: number, route: string, start: number, hint1: string, hint2: string
  if (tier === 1) {
    start = 0
    const down = roll(1, 10)
    result = -down
    route = `Start at 0. Go down ${down} floors.`
    hint1 = 'Down from zero means negative floors.'
    hint2 = `Count back ${down} steps from 0.`
  } else if (tier <= 3) {
    const max = tier === 2 ? 10 : 50
    start = roll(-max, max)
    const amount = roll(-max, max) || 1
    result = start + amount
    route = `Start at floor ${digit(start)}. Go ${amount > 0 ? 'up' : 'down'} by ${Math.abs(amount)}.`
    hint1 = 'Up adds floors and down subtracts them.'
    hint2 = `${digit(start)} ${sign(amount)} = ?`
  } else if (tier === 4) {
    const a = roll(2, 9) * (roll(0, 1) ? 1 : -1)
    const b = roll(2, 9) * (roll(0, 1) ? 1 : -1)
    const divide = roll(0, 1) === 1
    start = 0
    result = divide ? a : a * b
    route = divide ? `${digit(a * b)} ÷ (${digit(b)})` : `${digit(a)} × (${digit(b)})`
    hint1 = 'Matching signs give a positive answer. Different signs give a negative answer.'
    hint2 = divide ? `First work out ${Math.abs(a * b)} ÷ ${Math.abs(b)}.` : `First work out ${Math.abs(a)} × ${Math.abs(b)}.`
  } else {
    const a = -roll(2, 11)
    const b = roll(2, 8)
    const c = roll(2, 9)
    start = 0
    result = (a + b) * c
    route = `(${digit(a)} + ${b}) × ${c}`
    hint1 = 'Work out the brackets before the multiplication.'
    hint2 = `The brackets make ${digit(a + b)}.`
  }
  const lowest = tier === 1 ? Math.max(-10, Math.min(-4, result - roll(1, 3))) :
    tier === 3 ? Math.max(-100, Math.min(96, result - 2)) : result - 2
  const stops = Array.from({ length: 5 }, (_, index) => lowest + 4 - index)
  const ordered = tier === 1 ? [...new Set([result, ...stops])].sort((a, b) => b - a) : stops
  return { prompt: 'Send the elevator to the correct floor.', hint1, hint2,
    explanation: `The elevator stops at floor ${digit(result)}.`,
    answer: String(result), choices: ordered.map((value) => ({ label: digit(value), value: String(value) })),
    format: { type: 'elevator', route, stops: ordered, start } }
}

function chart(tier: Tier, roll: Roll): Puzzle {
  const labels = ['Pear', 'Plum', 'Apple', 'Berry']
  if (tier <= 2) {
    const bars = labels.map((label, index) => ({ label, value: roll(1, tier === 1 ? 6 : 12) * (index === 1 && tier === 2 ? 2 : 1) }))
    const key = roll(0, 3)
    const value = bars[key].value
    return { prompt: `How many ${bars[key].label.toLowerCase()} orders are shown?`,
      hint1: tier === 1 ? 'One picture stands for one order.' : 'Read the number beside the matching bar.',
      hint2: `Look only at the ${bars[key].label.toLowerCase()} row.`,
      explanation: `The ${bars[key].label.toLowerCase()} count is ${value}.`, answer: String(value), choices: guesses(value, roll, 0),
      format: { type: 'chart', bars, display: tier === 1 ? 'pictogram' : 'bar' } }
  }
  if (tier === 3) {
    const a = roll(2, 9)
    const r = roll(1, 4)
    const values = shuffle([a, a + r, a + 2 * r, a + 3 * r, a + 4 * r], roll)
    const mean = roll(0, 1) === 1
    const value = mean ? a + 2 * r : 4 * r
    return { prompt: `Find the ${mean ? 'mean' : 'range'} of the five order totals.`,
      hint1: mean ? 'Add the numbers and divide by how many there are.' : 'Take the smallest number away from the largest.',
      hint2: mean ? `The five values total ${5 * (a + 2 * r)}.` : `The smallest is ${a}, and the largest is ${a + 4 * r}.`,
      explanation: mean ? `${5 * value} ÷ 5 = ${value}.` : `${a + 4 * r} − ${a} = ${value}.`,
      choices: guesses(value, roll, 0), answer: String(value), format: { type: 'chart', display: 'dots', bars: values.map((count, i) => ({ label: String(i + 1), value: count })) } }
  }
  if (tier === 4) {
    const a = roll(2, 7)
    const b = roll(1, 5)
    const median = roll(0, 1) === 1
    const A = [a - 1, a, a + 1, a + 3, a + 3]
    const B = [a + b, a + b, a + b + 1, a + b + 2, a + b + 4]
    const value = median ? b : b - 3
    return { prompt: `How much is group B’s ${median ? 'median' : 'mode'} minus group A’s?`,
      hint1: median ? 'The median is the middle value in each sorted group.' : 'The mode is the most frequent value in each group.',
      hint2: median ? `Group A’s median is ${a + 1}.` : `Group A’s mode is ${a + 3}.`,
      explanation: median ? `${a + b + 1} − ${a + 1} = ${value}.` : `${a + b} − ${a + 3} = ${value}.`,
      choices: guesses(value, roll), answer: String(value),
      format: { type: 'chart', display: 'dots', bars: [{ label: 'A', values: shuffle(A, roll) }, { label: 'B', values: shuffle(B, roll) }]
        .flatMap(({ label, values }) => values.map((num, index) => ({ label: `${label}${index + 1}`, value: num }))) } }
  }
  const misleading = roll(0, 1) === 1
  const max = roll(11, 18)
  const key = roll(0, 3)
  const floor = roll(45, 69)
  const bars = misleading
    ? [{ label: 'Monday', value: floor + 3 }, { label: 'Tuesday', value: floor + roll(4, 8) }]
    : Array.from({ length: 4 }, (_, i) => ({ label: `${i * 10}–${i * 10 + 9}`, value: i === key ? max : roll(1, max - 1) }))
  const value = misleading ? bars[1].value - bars[0].value : bars[key].label
  return { prompt: misleading ? 'The chart’s scale starts above zero. What is the actual increase in orders?' : 'Which group has the most orders?',
    hint1: misleading ? 'A shortened scale makes small changes look larger. Read the actual counts.' : 'Compare the frequencies, not the interval labels.',
    hint2: misleading ? `Compare ${bars[1].value} to ${bars[0].value}.` : 'Pick the interval with the longest bar.',
    explanation: misleading ? `${bars[1].value} − ${bars[0].value} = ${value}.` : `${bars[key].label} has ${max} orders, the most.`,
    choices: typeof value === 'number' ? guesses(value, roll, 0) : choices(bars.map((bar) => bar.label), roll), answer: String(value),
    format: { type: 'chart', display: misleading ? 'bar' : 'grouped', bars, ...(misleading && { truncated: floor }) } }
}

function pattern(tier: Tier, roll: Roll): Puzzle {
  if (tier === 1 && roll(0, 1)) {
    const shapes = shuffle(['Circle', 'Square', 'Triangle', 'Diamond'], roll)
    const length = roll(2, 3)
    const start = roll(0, length - 1)
    const shown = Array.from({ length: 5 }, (_, i) => shapes[(i + start) % length])
    const value = shapes[(shown.length + start) % length]
    return { prompt: 'Send the next shape down the pipeline.', hint1: 'Look for the group of shapes that repeats.',
      hint2: `The pattern repeats every ${length} shapes.`, explanation: `The next shape repeats the same position and is ${value.toLowerCase()}.`,
      choices: choices([...shapes], roll), answer: value, format: { type: 'pattern', shown, index: '?' } }
  }

  if (tier === 4) {
    const first = roll(-4, 15)
    const change = roll(2, 6) * (roll(0, 1) ? 1 : -1)
    const intercept = first - change
    const expression = (a: number, b: number) => `${a}n ${sign(b)}`
    const value = expression(change, intercept)
    return { prompt: 'Choose the rule for term n. The first term is n = 1.', hint1: 'The difference between terms tells you what to multiply n by.',
      hint2: `The difference is ${change}. When n = 1, the rule must give ${first}.`,
      explanation: `${value} gives ${first} at n = 1 and changes by ${change} each step.`,
      choices: choices([value, expression(change, first), expression(change + 1, intercept), expression(change - 1, intercept)], roll),
      answer: value, format: { type: 'pattern', shown: numerals([first, first + change, first + 2 * change, first + 3 * change]), index: 'Rule' } }
  }

  const shown: number[] = [roll(1, tier === 1 ? 5 : 12)]
  let description: string
  let index = 5
  let next: (i: number) => number
  if (tier <= 2) {
    const step = tier === 1 ? roll(1, 2) : roll(2, 7) * (roll(0, 1) ? 1 : -1)
    next = (i) => shown[i - 1] + step
    description = `The difference between every pair is ${digit(step)}.`
  } else if (tier === 3 || (tier === 5 && roll(0, 2) === 0)) {
    const ratio = roll(2, 3)
    index = roll(5, 6)
    next = (i) => shown[i - 1] * ratio
    description = `Every term is ${ratio} times the previous term.`
  } else if (roll(0, 1)) {
    const step = roll(2, 4)
    next = (i) => shown[i - 1] + step * i + 1
    description = `The differences themselves increase by ${step} each time.`
  } else {
    const second = roll(2, 12)
    shown.push(second * 2 === shown[0] * 3 ? second + 1 : second)
    next = (i) => shown[i - 1] + shown[i - 2]
    description = 'Add the previous two terms each time.'
  }
  for (let i = shown.length; i < index; i++) shown.push(next(i))
  const value = shown[index - 1]
  return { prompt: index === 6 ? 'Choose the sixth term of the pipeline.' : 'Choose the next term of the pipeline.',
    hint1: 'Compare each term with the one before it.', hint2: description,
    explanation: `${description} Term ${index} is ${value}.`,
    choices: guesses(value, roll), answer: String(value), format: { type: 'pattern', shown: numerals(shown.slice(0, 4)), index: index === 6 ? '6th' : '?' } }
}

function angle(tier: Tier, roll: Roll): Puzzle {
  if (tier === 1 && roll(0, 3) < 3) {
    const shown = roll(0, 3) === 0 ? 90 : roll(1, 38) * 5
    const answer = shown === 90 ? 'Right angle' : 'Not a right angle'
    return {
      prompt: `Is this ${shown}° turn a right angle?`,
      hint1: 'Compare the turn with the corner of a square.',
      hint2: 'A right angle is exactly 90°.',
      explanation: shown === 90 ? '90° makes a square corner.' : `${shown}° is different from 90°.`,
      answer, choices: choices(['Right angle', 'Not a right angle'], roll),
      format: { type: 'angle', shown, name: 'Angle to classify' },
    }
  }
  if (tier <= 2) {
    const shown = tier === 1 ? [90, 180][roll(0, 1)] : [roll(15, 85), roll(95, 175), roll(195, 345)][roll(0, 2)]
    const value = tier === 1 ? shown === 90 ? 'Quarter turn' : 'Half turn' : shown < 90 ? 'Acute' : shown < 180 ? 'Obtuse' : 'Reflex'
    return {
      prompt: tier === 1 ? `Which turn measures ${shown}°?` : `What kind of angle is ${shown}°?`,
      hint1: 'A right angle is 90°. A straight angle is 180°.',
      hint2: tier === 1 ? 'A full turn is 360°.' : 'An angle beyond a straight angle is reflex.',
      explanation: `${shown}° matches ${value.toLowerCase()}.`, answer: value,
      choices: choices(tier === 1 ? ['Quarter turn', 'Half turn', 'Full turn'] : ['Acute', 'Right', 'Obtuse', 'Reflex'], roll),
      format: { type: 'angle', shown, name: 'Angle to classify' },
    }
  }
  let prompt: string
  let hint1: string
  let hint2: string
  let explanation: string
  let value: number
  if (tier === 3) {
    const whole = roll(0, 1) ? 360 : 180
    const a = roll(30, 65)
    const b = roll(30, 85)
    const c = whole === 360 ? roll(88, 112) : 0
    value = whole - a - b - c
    prompt = `${whole === 360 ? 'Around a point' : 'On a straight line'}, the angles are ${a}°, ${b}°${c ? `, ${c}°` : ''}, and x. Find x.`
    hint1 = `The angles total ${whole}°.`
    hint2 = `The known angles total ${a + b + c}°.`
    explanation = `${whole}° − ${a + b + c}° = ${value}°.`
  } else if (tier === 4) {
    const a = roll(25, 65)
    const b = roll(35, 75)
    const isTriangle = roll(0, 1) === 0
    value = 180 - a - (isTriangle ? b : 0)
    prompt = isTriangle ? `A triangle has angles ${a}°, ${b}°, and x. Aim at x.`
      : `Two parallel lines are cut by a straight line. The inside angles on the same side are ${a}° and x. Find x.`
    hint1 = isTriangle ? 'All three triangle angles add to 180°.' : 'Same-side interior angles between parallel lines add to 180°.'
    hint2 = `Subtract ${180 - value}° from 180°.`
    explanation = `x = 180° − ${180 - value}° = ${value}°.`
  } else if (roll(0, 1)) {
    const sides = roll(5, 10)
    value = (sides - 2) * 180
    prompt = `Find the total interior angle sum of a ${sides}-sided polygon.`
    hint1 = 'Split the polygon into triangles by drawing from one vertex.'
    hint2 = `A ${sides}-sided polygon makes ${sides - 2} triangles this way.`
    explanation = `(${sides} − 2) × 180° = ${value}°.`
  } else {
    const atCenter = roll(18, 80) * 2
    value = atCenter / 2
    prompt = `An arc forms a ${atCenter}° angle at the centre of a circle. Find the angle the same arc forms at the circumference.`
    hint1 = 'The angle at the centre is twice the angle at the circumference.'
    hint2 = `Halve ${atCenter}°.`
    explanation = `${atCenter}° ÷ 2 = ${value}°.`
  }
  const options = guesses(value, roll, 0).map((option) => ({ ...option, label: `${option.label}°` }))
  return { prompt, hint1, hint2, explanation, choices: options, answer: String(value), format: { type: 'angle', shown: 0, name: 'Your aim' } }
}

function till(tier: Tier, roll: Roll): Puzzle {
  const orders = Array.from({ length: tier <= 2 ? 1 : 3 }, () => {
    if (tier === 1) {
      const a = roll(1, 10), b = roll(1, 10)
      return roll(0, 1) ? { expression: `${a + b} − ${b}`, answer: a } : { expression: `${a} + ${b}`, answer: a + b }
    }
    if (tier === 2) {
      const a = roll(2, 10), b = roll(2, 10)
      return { expression: `${a} × ${b}`, answer: a * b }
    }
    if (tier === 3) {
      const a = roll(2, 40), b = roll(1, 9)
      const format = roll(0, 2)
      if (format === 0) return { expression: `${a * 2} ÷ 2`, answer: a }
      if (format === 1) return { expression: `2 × ${a}`, answer: a * 2 }
      return { expression: `${a} + ${b} − 1`, answer: a + b - 1 }
    }
    if (tier === 4) {
      const a = roll(11, 49), b = roll(11, 49)
      return { expression: `${a} × ${b}`, answer: a * b }
    }
    const a = roll(3, 18), b = roll(2, 9), c = roll(2, 9)
    return roll(0, 1) ? { expression: `${a} + ${b} × ${c}`, answer: a + b * c }
      : { expression: `(${a} + ${b}) × ${c} − 1`, answer: (a + b) * c - 1 }
  })
  return { prompt: 'Ring up each order at the till.',
    hint1: tier === 4 ? 'Split one factor into tens and ones.' : tier === 5 ? 'Work out brackets first, then multiply or divide.' : 'Break the calculation into smaller steps.',
    hint2: tier === 4 ? 'Work with the tens first, then add the ones product.' : 'Take each order one at a time.',
    explanation: orders.map(({ expression, answer }) => `${expression} = ${answer}.`).join(' '),
    choices: [], answer: orders.map(({ answer }) => answer).join(','), format: { type: 'till', orders } }
}

function power(tier: Tier, roll: Roll): Puzzle {
  let shown: string, answer: string, options: Pick[], hint1: string, hint2: string, explanation: string
  if (tier === 3) {
    const n = roll(2, 8)
    const family = roll(0, 3)
    const value = family === 0 ? n ** 2 : family === 1 ? n ** 3 : n
    shown = family === 0 ? `${n}²` : family === 1 ? `${n}³` : family === 2 ? `√${n ** 2}` : `∛${n ** 3}`
    hint1 = 'Squares multiply a number by itself. Cubes use three copies. Roots undo these powers.'
    hint2 = family < 2 ? `Use ${family === 0 ? 'two' : 'three'} copies of ${n}.` : `Think of the power that makes ${shown.slice(1)}.`
    explanation = `${shown} = ${value}.`
    answer = String(value)
    options = guesses(value, roll, 0)
  } else if (tier === 4) {
    const n = roll(2, 9), a = roll(3, 9), b = roll(1, a - 1)
    const kind = roll(0, 2)
    const exponent = kind === 0 ? a + b : kind === 1 ? a - b : a * b
    const suffix = (value: number) => `${n}^${value}`
    shown = kind === 0 ? `${suffix(a)} × ${suffix(b)}` : kind === 1 ? `${suffix(a)} ÷ ${suffix(b)}` : `(${suffix(a)})^${b}`
    answer = suffix(exponent)
    options = choices([answer, suffix(exponent + 1), suffix(exponent + 2), suffix(exponent - 1)], roll)
    hint1 = 'Keep the same base. Use the index rule for this operation.'
    hint2 = kind === 0 ? 'Add the exponents for multiplication.' : kind === 1 ? 'Subtract the exponents for division.' : 'Multiply the exponents for a power of a power.'
    explanation = `${shown} = ${answer}.`
  } else {
    const factor = roll(2, 8)
    const radical = [2, 3, 5, 6, 7, 10, 11, 13][roll(0, 7)]
    shown = `√${factor * factor * radical}`
    answer = `${factor}√${radical}`
    options = choices([answer, `${factor + 1}√${radical}`, `${factor}√${radical + 1}`, `${factor * factor}√${radical}`], roll)
    hint1 = 'Find a square factor inside the root. The part left inside should have no square factor other than 1.'
    hint2 = `Separate √${factor * factor} and √${radical}.`
    explanation = `${shown} = √${factor * factor} × √${radical} = ${answer}.`
  }
  return { prompt: tier === 3 ? 'Select the value that charges the power cell.' : 'Select the simplest matching form.',
    hint1, hint2, explanation, choices: options, answer, format: { type: 'power', shown, cells: options.map((option) => option.label) } }
}

const generators = { balance, elevator, chart, pattern, angle, till, power }

export function generateAdvanced(cheat: AdvancedCode, tier: Tier, seed: number): AdvancedQuestion {
  return { ...generators[cheat](tier, questionRandom(seed)), cheat, topic: cheats[cheat].topic, tier, id: `${cheat}-${tier}-${seed}` }
}

export function checkAdvanced(question: AdvancedQuestion, answer: string) {
  return answer === question.answer
}
