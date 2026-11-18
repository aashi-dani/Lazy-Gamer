import { expect, it } from 'vitest'
import { cheatIds, cheats, tiersForCheat } from '../data/catalog'
import { ageBands, tiers, selectTier } from './difficulty'
import { chooseQuestion } from './questions'
import { mastery, trackAnswer, type TopicProgress } from './topicProgress'

it('adapts per topic, stays in the band, and unlocks mastery by accuracy and highest solved tier', () => {
  let stats: TopicProgress | undefined
  for (const correct of [true, true, true]) stats = trackAnswer(stats, correct, 1)
  expect(stats?.offset).toBe(1)
  expect(selectTier('explorer', 1, stats?.offset)).toBe(2)
  for (const correct of [false, false]) stats = trackAnswer(stats, correct, 2)
  expect(stats?.offset).toBe(0)
  for (let i = 0; i < 3; i++) stats = trackAnswer(stats, true, 3)
  expect(mastery(stats)).toBe(1)
  for (let i = 0; i < 24; i++) stats = trackAnswer(stats, true, 3)
  expect(stats?.offset).toBe(1)
  expect(mastery(stats)).toBe(2)
  const advanced = trackAnswer(stats, true, 4)
  expect(mastery(advanced)).toBe(3)
  let recent = advanced
  for (let i = 0; i < 4; i++) recent = trackAnswer(recent, false, 4)
  expect(mastery(recent)).toBe(2)
  recent = trackAnswer(recent, false, 4)
  expect(mastery(recent)).toBe(1)
  expect(recent.attempts).toBe(38)
  expect(recent.recent).toHaveLength(20)
})

it('draws distinct orders across the most recent twenty even in small question sets', () => {
  for (const cheat of cheatIds) {
    for (const tier of tiersForCheat(cheat)) {
      const recent: string[] = []
      for (let seed = 0; seed < 70; seed++) {
        const order = chooseQuestion(cheat, tier, seed % 4, recent)
        expect(order, `${cheat} tier ${tier}, draw ${seed + 1}`).toBeDefined()
        expect(recent).not.toContain(order?.key)
        recent.push(order!.key)
        if (recent.length > 20) recent.shift()
      }
    }
  }
})

it('has at least eight cheats in each band by player level 10', () => {
  for (const { min, max } of Object.values(ageBands)) {
    const available = cheatIds.filter((cheat) => cheats[cheat].unlockLevel <= 10 && tiers.some((tier) => tier >= min && tier <= max))
    expect(available.length).toBeGreaterThanOrEqual(8)
  }
})
