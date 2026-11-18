import { expect, it } from 'vitest'
import { defaultAvatar } from '../data/profile'
import { emptyTown, newBuilding } from './economy'
import { exportTown } from './save'
import { openVisitCode, visitCode } from './visits'

it('shares a read-only town look and leaves names, coins, and stats out of the code', () => {
  const town = {
    ...emptyTown(23), playerName: 'PlayerName', coins: 776_199, lifetimeCoinsEarned: 997_036,
    buildings: { coconut: { ...newBuilding('coconut'), level: 3, stock: 8 } },
    avatar: { ...defaultAvatar, hairColor: 7 },
    pet: { type: 'fox', name: 'PetName', evolution: 2, accessories: { petHat: 2, petScarf: 1, petBow: 1 } } as const,
  }
  const code = visitCode(town)
  expect(openVisitCode(code)).toMatchObject({ buildings: { coconut: 3 }, avatar: town.avatar,
    pet: { type: 'fox', evolution: 2, accessories: town.pet.accessories } })
  expect(code).toBe(visitCode({ ...town, ...{ playerName: 'Different', pet: { ...town.pet, name: 'More' }, coins: 0 } }))
  expect(openVisitCode(exportTown(town))).toBeNull()
  expect(openVisitCode('VISIT1-eyJtYWxmb3JtZWQiOiJjYXJkIn0')).toBeNull()
})

it('opens existing VISIT1 codes and keeps new road and biome layouts private', () => {
  const legacy = 'VISIT1-' + btoa(JSON.stringify([[1, 2, 0], [2, 0, 0, 3, 0, 0, 0, 1], [1, 0, 1, 0, 0]])).replace(/=+$/, '')
  expect(openVisitCode(legacy)).toMatchObject({ buildings: { coconut: 1, bike: 2 }, layout: { lots: [{ kind: 'shop', id: 'coconut' }, { kind: 'shop', id: 'bike' }] } })
  const town = emptyTown(23)
  town.layout.lots.push({ area: 'sunny', kind: 'road', x: 2, y: 3 })
  expect(openVisitCode(visitCode(town))?.layout).toEqual(town.layout)
})
