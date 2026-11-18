import type { CheatId } from '../../data/catalog'
import type { Tier } from '../../logic/difficulty'
import { questionFor } from '../../logic/questions'
import AdvancedPuzzle from './AdvancedPuzzle'
import AreaOptimizer from './AreaOptimizer'
import FractionSlicer from './FractionSlicer'
import MultiplicationMacro from './MultiplicationMacro'
import PuzzleBoard from './PuzzleBoard'
import TownPuzzle from './TownPuzzle'

export default function CheatPuzzle({ code, tier, seed, order = 1, totalOrders = 1, allowPace, onMiss, onCorrect }: {
  code: CheatId; tier: Tier; seed: number; order?: number; totalOrders?: number; allowPace?: boolean; onMiss: () => void; onCorrect: () => void
}) {
  const question = questionFor(code, tier, seed)
  if (question.cheat === 'macro') return <MultiplicationMacro key={seed} question={question} onMiss={onMiss} onCorrect={onCorrect} />
  if (question.cheat === 'area') return <AreaOptimizer key={seed} question={question} onMiss={onMiss} onCorrect={onCorrect} />
  if (question.cheat === 'fraction') return <FractionSlicer key={seed} question={question} order={order} totalOrders={totalOrders} onMiss={onMiss} onCorrect={onCorrect} />
  if ('format' in question) return <AdvancedPuzzle key={seed} {...{ question, allowPace, onMiss, onCorrect }} />
  if ('board' in question) return <TownPuzzle key={seed} question={question} seed={seed} onMiss={onMiss} onCorrect={onCorrect} />
  return <PuzzleBoard key={seed} question={question} onMiss={onMiss} onCorrect={onCorrect} />
}
