import { describe, expect, it } from 'vitest'
import { cheats, gameConfig } from '../../config/gameConfig'
import { emptyTown, newBuilding, storageCap, withBuilding } from '../economy'
import { makeMacro, solveMacro } from './multiplicationMacro'
import { applyReward } from './rewards'

describe('Multiplication Macro', () => {
  it('generates larger grids for higher tiers', () => {
    expect(makeMacro('easy', [.999, .999])).toEqual({ target: 25, limit: 5 })
    expect(makeMacro('medium', [.999, .999])).toEqual({ target: 64, limit: 8 })
    expect(makeMacro('hard', [.999, .999])).toEqual({ target: 144, limit: 12 })
  })

  it('accepts either orientation and rewards efficient moves', () => {
    const puzzle = makeMacro('easy', [0, .3])
    expect(solveMacro(puzzle, 2, 3, 2)?.batches).toBe(gameConfig.macro.efficientReward)
    expect(solveMacro(puzzle, 3, 2, 3)?.batches).toBe(1)
    expect(solveMacro(puzzle, 1, 6, 2)).toBeNull()
    expect(solveMacro(puzzle, 2, 2, 2)).toBeNull()
    expect(solveMacro(puzzle, 1.5, 4, 2)).toBeNull()
  })

  it('fills only available stock space and applies a cooldown once', () => {
    const town = withBuilding(emptyTown(3_000), 'coconut', { ...newBuilding('coconut'), stock: 11, progress: .9 })
    const played = applyReward(town, 'coconut', { code: 'macro', batches: 2 })
    expect(played.cracked).toBe(1)
    expect(played.buildings.coconut).toMatchObject({
      stock: storageCap('coconut', 1), progress: 0, cooldowns: { macro: 3_000 + cheats.macro.cooldown },
    })
    expect(applyReward(played, 'coconut', { code: 'macro', batches: 2 })).toBe(played)
  })
})
