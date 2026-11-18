import { defaultAvatar } from '../data/profile'
import { expect, it } from 'vitest'
import { advanceTown, earnCoins, emptyTown, newBuilding, unlockBuilding, withBuilding } from './economy'
import { availableUnlocks, gameConfig } from '../config/gameConfig'
import { exportTown, importTown, migrateSave, readTown } from './save'
import { nickname } from '../data/profile'

const now = 96_000_000

it('migrates v2 including previously open shops, audio and offline production', () => {
  const old = {
    band: 'challenger', buildings: { tuck: { ...newBuilding('tuck'), level: 2 } }, lastAt: now,
    coins: 80, earned: 125, cracked: 5, spent: 210, streak: 2, bestStreak: 3, tutorialSeen: false, sound: false, easyRead: true,
  }
  const town = readTown(migrateSave({ town: old }, 2).town, now)
  expect(town).toMatchObject({
    band: old.band, buildings: old.buildings, coins: 80, lifetimeCoinsEarned: 125, playerLevel: 2,
    cracked: 5, spent: 210, streak: 2, bestStreak: 3, sound: false, easyRead: true, tutorialSeen: true, guidedSeen: true,
  })
  const result = advanceTown(town, now + gameConfig.batchMs)
  expect(result.produced).toEqual({ tuck: 3 })
})

it('preserves profile, preferences and existing town in a portable save code', () => {
  const profile = {
    ...emptyTown(now), playerName: 'Zoë', pet: { type: 'axolotl', name: '泡泡', evolution: 0 },
    avatar: { ...defaultAvatar, skin: 2, hair: 1, outfit: 2, accessory: 2 }, musicVolume: .1, effectsVolume: .32, sound: false,
  } as const
  expect(importTown(exportTown(profile), now)).toEqual(profile)
  const town = earnCoins(withBuilding({ ...profile, band: 'challenger' }, 'bike', newBuilding('bike')), 301)
  expect(importTown(exportTown(town), now)).toEqual(town)
  expect(importTown('LG-!!!!')).toBeNull()
  expect(importTown('LG-Ng')).toBeNull()
  const future = 'LG-' + Buffer.from(JSON.stringify({ version: 9, state: { town } })).toString('base64url')
  expect(importTown(future)).toBeNull()
})

it('requires the correct level and wallet balance to open a shop', () => {
  const below = { ...emptyTown(now), band: 'explorer' as const, coins: 500 }
  expect(unlockBuilding(below, 'bike')).toBe(below)
  const eligible = earnCoins(below, 300)
  expect(eligible.playerLevel).toBe(3)
  expect(unlockBuilding({ ...eligible, coins: 219 }, 'bike').buildings.bike).toBeUndefined()
  const opened = unlockBuilding(eligible, 'bike')
  expect(opened).toMatchObject({ playerLevel: 3, coins: 580, spent: 220, buildings: { bike: { level: 1 } } })
  const unlocked = availableUnlocks(1, 5, opened.buildings).map(({ name }) => name)
  expect(unlocked).toContain('Tuck Shop')
  expect(unlocked).not.toContain('Bike Shop')
})

it('accepts short international nicknames and rejects personal contact fields and blocked words', () => {
  expect(nickname('  O’Kai  ')).toBe('')
  expect(nickname(" O'Kai ")).toBe("O'Kai")
  expect(nickname('किरण')).toBe('किरण')
  expect(nickname('Niko123456789')).toBe('')
  expect(nickname('player@mail.com')).toBe('')
  expect(nickname('Cool shit')).toBe('')
})

it('preserves the Phase 1 profile, lifetime earnings, and unfinished tutorial through the current migration', () => {
  const original = {
    band: 'explorer', buildings: { coconut: newBuilding('coconut') }, coins: 56,
    lifetimeCoinsEarned: 625, playerLevel: 4, tutorialSeen: false, guidedSeen: true, lastAt: now,
    avatar: { skin: 1, hair: 1, outfit: 2, accessory: 1 }, pet: { type: 'bunny', name: 'Snow', evolution: 0 },
  }
  const next = readTown(migrateSave({ town: original }, 3).town, now)
  expect(next).toMatchObject(original)
  expect(next.daily).toEqual({ lastDay: -1, streak: 0 })
  expect(next.topics).toEqual({})
})

it('keeps a version 6 town while normalizing old difficulty and question history', () => {
  const town = earnCoins(withBuilding({ ...emptyTown(now), band: 'challenger' }, 'coconut', newBuilding('coconut')), 1_000)
  const stored = { ...town, recentQuestions: ['["area",["fence",{"budget":20,"wall":false}]]|Léo'],
    topics: { geometry: { attempts: 20, correct: 15, rightRun: 4, wrongRun: 0, offset: 4, highestTier: 3, recent: [true] } },
    world: { ...town.world, festivalWins: ['wreath-2026'] } }
  const previous = 'LG-' + Buffer.from(JSON.stringify({ version: 6, state: { town: stored } })).toString('base64url')
  expect(importTown(previous, now)).toMatchObject({
    coins: town.coins, buildings: town.buildings, layout: town.layout, playerLevel: town.playerLevel,
    recentQuestions: ['["area",["fence",{"budget":20,"wall":false}]]'],
    topics: { geometry: { attempts: 20, correct: 15, offset: 1 } },
    world: { festivalWins: ['wreath-2026'] },
  })
})
