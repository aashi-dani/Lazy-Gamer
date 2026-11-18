import { expect, it, vi } from 'vitest'
import { useGameStore } from './gameStore'

it('pays each order once while permitting the next order on the same cooldown', () => {
  const store = useGameStore.getState()
  store.reset()
  store.setBand('mastermind')
  store.start()
  const reward = { code: 'fraction', coins: 60 } as const
  const first = { play: 1, index: 0, complete: false }
  const last = { play: 1, index: 1, complete: true }
  expect(store.claimCode('coconut', reward, first)?.coins).toBe(60)
  expect(store.claimCode('coconut', reward, first)).toBeNull()
  expect(store.claimCode('coconut', reward, { ...last, play: 2 })).toBeNull()
  expect(store.claimCode('coconut', reward, last)?.coins).toBe(60)
  expect(store.claimCode('coconut', reward, last)).toBeNull()
  expect(useGameStore.getState().town).toMatchObject({ lifetimeCoinsEarned: 120, cracked: 1 })
  store.reset()
})

it('replays the opening prompts while preserving the player’s town', () => {
  const store = useGameStore.getState()
  store.reset()
  store.setBand('explorer')
  store.start()
  store.finishTutorial()
  store.collect('coconut')
  const before = useGameStore.getState().town
  store.resetTutorial()
  expect(useGameStore.getState().town).toMatchObject({ coins: before.coins, lifetimeCoinsEarned: before.lifetimeCoinsEarned, tutorialSeen: false })
  store.setBand('challenger')
  store.finishTutorial()
  const after = useGameStore.getState().town
  expect(after.buildings.coconut).toBeDefined()
  expect(after.coins).toBe(before.coins)
  expect(after.tutorialSeen).toBe(true)
  store.reset()
})

it('grants the guided cheat reward once, including after the tutorial is reset', () => {
  const store = useGameStore.getState()
  store.reset()
  store.setBand('explorer')
  store.start()
  const reward = { code: 'macro', batches: 2 } as const
  const guided = { play: 3, index: 0, complete: true, guided: true, debug: true }
  expect(store.claimCode('coconut', reward, guided)?.stockAdded).toBeGreaterThan(0)
  store.resetTutorial()
  expect(store.claimCode('coconut', reward, { ...guided, play: 4 })).toBeNull()
  expect(useGameStore.getState().town.guidedSeen).toBe(true)
  store.reset()
})

it('reopens a daily puzzle and increments a forgiving streak only once per date', () => {
  vi.useFakeTimers()
  const store = useGameStore.getState()
  try {
    vi.setSystemTime(new Date(2026, 9, 6, 12))
    store.reset()
    store.setBand('explorer')
    store.start()
    const offer = store.openDaily()!
    expect(store.openDaily()).toEqual(offer)
    expect(store.claimDaily(offer)).toBeGreaterThan(0)
    expect(store.claimDaily(offer)).toBe(0)
    expect(store.openDaily()).toBeUndefined()
    vi.setSystemTime(new Date(2026, 9, 12, 12))
    expect(store.claimDaily(store.openDaily()!)).toBeGreaterThan(0)
    expect(useGameStore.getState().town.daily.streak).toBe(2)
    vi.setSystemTime(new Date(2026, 9, 11, 12))
    expect(store.openDaily()).toBeUndefined()
  } finally {
    vi.useRealTimers()
    store.reset()
  }
})

it('charges for purchased wardrobe items only once and applies pet luck and evolutions', () => {
  const store = useGameStore.getState()
  store.reset()
  store.setBand('explorer')
  store.start()
  store.finishTutorial(true)
  store.collect('coconut')
  expect(useGameStore.getState().town.coins).toBe(93)
  store.equip({ category: 'outfit', index: 3 })
  expect(useGameStore.getState().town).toMatchObject({ coins: 8, spent: 85, avatar: { outfit: 3 } })
  store.equip({ category: 'outfit', index: 0 })
  store.equip({ category: 'outfit', index: 3 })
  expect(useGameStore.getState().town.coins).toBe(8)
  for (let i = 0; i < 5; i++) store.debugCoins()
  expect(useGameStore.getState().town.pet.evolution).toBe(1)
  store.reset()
})

it('claims one quest, boss trophy, and seasonal reward per milestone and keeps rush records separate', async () => {
  const { currentFestival } = await import('../data/world')
  const store = useGameStore.getState()
  store.reset()
  store.setBand('challenger')
  store.start()
  store.collect('coconut')
  const balance = useGameStore.getState().town.coins
  store.claimQuest('firstSale')
  store.claimQuest('firstSale')
  expect(useGameStore.getState().town.coins).toBe(balance + 30)
  expect(useGameStore.getState().town.world.claimedQuests).toEqual(['firstSale'])
  store.finishBoss(5)
  expect(useGameStore.getState().town.world.bossWins).toEqual([])
  store.debugCoins()
  store.finishBoss(5)
  store.finishBoss(5)
  expect(useGameStore.getState().town.world.bossWins).toEqual([5])
  const festival = currentFestival(Date.now()).key
  store.finishFestival(festival)
  store.finishFestival(festival)
  expect(useGameStore.getState().town.world.festivalWins).toEqual([festival])
  store.finishRush(3, false)
  store.finishRush(2, false)
  store.finishRush(8, true)
  expect(useGameStore.getState().town.world).toMatchObject({ relaxedBest: 3, rushBest: 8 })
  store.answer('recipe', 4, true, true)
  expect(useGameStore.getState().town).toMatchObject({ streak: 0, topics: { ratios: { correct: 1 } } })
  store.reset()
})
