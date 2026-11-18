import { townCheatIds, supportsCheat, type CheatId, type Topic } from '../data/catalog'
import type { AgeBand, Tier } from './difficulty'

export type TopicProgress = {
  attempts: number
  correct: number
  rightRun: number
  wrongRun: number
  offset: number
  highestTier: number
  recent: boolean[]
}

export type StudyProgress = Partial<Record<Topic, TopicProgress>>
export type DailyOffer = { day: number; cheat: CheatId; tier: Tier; seed: number }
export type DailyProgress = { lastDay: number; streak: number; offer?: DailyOffer }

export function trackAnswer(previous: TopicProgress | undefined, correct: boolean, tier: Tier): TopicProgress {
  const stats = previous ?? { attempts: 0, correct: 0, rightRun: 0, wrongRun: 0, offset: 0, highestTier: 0, recent: [] }
  const rightRun = correct ? stats.rightRun + 1 : 0
  const wrongRun = correct ? 0 : stats.wrongRun + 1
  const delta = rightRun && rightRun % 3 === 0 ? 1 : wrongRun && wrongRun % 2 === 0 ? -1 : 0
  return {
    attempts: stats.attempts + 1, correct: stats.correct + Number(correct), rightRun, wrongRun,
    offset: Math.max(-1, Math.min(1, stats.offset + delta)),
    highestTier: correct ? Math.max(tier, stats.highestTier) : stats.highestTier,
    recent: [...stats.recent.slice(-19), correct],
  }
}

export function mastery(stats: TopicProgress | undefined) {
  if (!stats || stats.correct < 5) return 0
  const accuracy = stats.recent.length ? stats.recent.filter(Boolean).length / stats.recent.length : 0
  if (stats.correct >= 30 && stats.recent.length === 20 && accuracy >= .85 && stats.highestTier >= 4) return 3
  if (stats.correct >= 15 && accuracy >= .8) return 2
  return 1
}

export function localDay(now = Date.now()) {
  const day = new Date(now)
  return Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86_400_000)
}

export function dailyCode(day: number, level: number, band: AgeBand | null = null) {
  const unlocked = townCheatIds.filter((id) => supportsCheat(id, band, level))
  return unlocked[((day % unlocked.length) + unlocked.length) % unlocked.length]
}
