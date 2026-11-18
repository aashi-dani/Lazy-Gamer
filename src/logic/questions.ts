import { generateAdvanced, isAdvancedCode } from './cheatCodes/advancedPuzzles'
import { generateWorldPuzzle, isWorldCode } from './cheatCodes/townPuzzles'
import type { CheatId } from '../data/catalog'
import type { Tier } from './difficulty'
import { generateArea } from './cheatCodes/areaOptimizer'
import { generateBatch } from './cheatCodes/batchOne'
import { generateSlicer } from './cheatCodes/fractionSlicer'
import { generateMacro } from './cheatCodes/multiplicationMacro'
import { questionRandom } from './cheatCodes/random'

const shops = ['Ada', 'Ari', 'Bea', 'Bo', 'Cal', 'Dee', 'Eli', 'Fern', 'Fox', 'Gia', 'Hal', 'Indy', 'Ivy', 'Jay',
  'Kit', 'Lee', 'Léo', 'Lux', 'Mae', 'Nico', 'Oak', 'Paz', 'Ren', 'Rio', 'Rue', 'Sage', 'Sky', 'Sol', 'Tao', 'Tess', 'Wren', 'Zuri']

export function questionFor(cheat: CheatId, tier: Tier, seed: number) {
  if (cheat === 'area') return generateArea(tier, seed)
  if (cheat === 'fraction') return generateSlicer(tier, seed)
  if (cheat === 'macro') return generateMacro(tier, seed)
  if (isAdvancedCode(cheat)) {
    const question = generateAdvanced(cheat, tier, seed)
    return { ...question, type: question.format.type, params: question.format }
  }
  if (isWorldCode(cheat)) {
    const question = generateWorldPuzzle(cheat, tier, seed)
    return { ...question, type: question.board.type, params: question.board }
  }
  const question = generateBatch(cheat, tier, seed)
  return { ...question, type: question.game.type, params: question.game }
}

export function customerFor(seed: number) {
  return shops[questionRandom((seed ^ 0x19e3c7b5) >>> 0)(0, shops.length - 1)]
}

function mathIdentity(question: ReturnType<typeof questionFor>) {
  if ('format' in question) return [question.prompt, question.format]
  if ('board' in question) {
    const { board } = question
    if (board.type === 'sort') return [question.prompt, board.bins, board.cards.map(({ label }) => label).sort()]
    if (board.type === 'mystery') return [question.prompt, board.clues]
    if (board.type === 'recipe') return [question.prompt, board.ingredients]
    if (board.type === 'spin') return [question.prompt, board.red, board.blue]
    if (board.type === 'relay') return [question.prompt, board.sequence]
    return [question.prompt]
  }
  if (!('game' in question)) return [question.type, question.params]
  const { game } = question
  if (game.type === 'coins') return [game.prices, game.discount, game.paid]
  if (game.type === 'stack') return [game.target, game.blocks.map((block) => block.label).sort()]
  if (game.type === 'order') return [question.prompt, game.tiles.map((tile) => tile.label).sort()]
  return [question.prompt, game.offers]
}

export function questionKey(cheat: CheatId, tier: Tier, seed: number) {
  return JSON.stringify([cheat, mathIdentity(questionFor(cheat, tier, seed))])
}

export function chooseQuestion(cheat: CheatId, tier: Tier, seed: number, recent: string[]) {
  const roll = questionRandom(seed)
  const history = new Set(recent.slice(-20))
  // Try random orders first, then walk a fixed seed range for a result independent of luck.
  for (let attempt = 0; attempt < 4_160; attempt++) {
    const candidate = attempt === 0 ? seed : attempt < 64 ? roll(0, 0xffff_ffff) : attempt - 64
    const key = questionKey(cheat, tier, candidate)
    if (!history.has(key)) return { seed: candidate, key }
  }
}
