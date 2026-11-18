import { questionRandom } from './cheatCodes/random'
import type { AgeBand, Tier } from './difficulty'

export function placementQuestion(tier: Tier, seed: number) {
  const roll = questionRandom(seed)
  if (tier === 1) {
    const a = roll(1, 5), b = roll(1, 5)
    return { text: `You have ${a} shells and find ${b} more. How many shells now?`, answer: a + b, hint: `Start at ${a} and count up ${b}.` }
  }
  if (tier === 2) {
    const a = roll(2, 4), b = roll(2, 5)
    return { text: `There are ${a} baskets with ${b} apples each. How many apples in all?`, answer: a * b, hint: `Add ${b} once for each basket.` }
  }
  if (tier === 3) {
    const groups = roll(3, 6), perGroup = roll(3, 7)
    return { text: `Split ${groups * perGroup} berries evenly between ${groups} friends. How many per friend?`, answer: perGroup, hint: `Which number times ${groups} makes ${groups * perGroup}?` }
  }
  if (tier === 4) {
    const side = roll(5, 9), width = roll(3, 7)
    return { text: `A garden is ${side} metres long and ${width} metres wide. How many metres of fence go all the way around it?`, answer: 2 * (side + width), hint: 'Add the lengths of all four sides. Opposite sides have the same length.' }
  }
  const tens = roll(4, 9), fraction = roll(3, 7)
  return { text: `${fraction * 10}% of ${tens * 10} snacks are fruit. How many are fruit?`, answer: tens * fraction, hint: `Find 10% first by dividing by 10. Then multiply by ${fraction}.` }
}

export function recommendedBand(highestTierSolved: Tier | 0): AgeBand {
  if (highestTierSolved >= 4) return 'mastermind'
  return highestTierSolved === 3 ? 'challenger' : 'explorer'
}

export function parentQuestion(seed: number) {
  const roll = questionRandom(seed)
  const part = roll(3, 9)
  const total = roll(8, 15) * 20
  return { text: `What is ${part * 5}% of ${total}?`, answer: part * total / 20 }
}
