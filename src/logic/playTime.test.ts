import { expect, it } from 'vitest'
import { makePin, matchesPin, validPin } from '../store/parentPin'
import { townAtmosphere } from './atmosphere'
import { readWeeks, recordTime } from './playTime'

it('splits active time across a local Monday boundary and rejects invalid samples', () => {
  const sunday = new Date(2026, 10, 22, 23, 59, 45).getTime()
  const minutes = recordTime({}, sunday, sunday + 45_000)
  expect(minutes).toEqual({ '2026-11-16': 15_000, '2026-11-23': 30_000 })
  expect(recordTime(minutes, sunday, sunday - 1)).toBe(minutes)
  expect(readWeeks({ ...minutes, 'bad': 500, '2026-11-20': -4 })).toEqual(minutes)
})

it('follows the local day and night boundaries and keeps weather consistent within a day', () => {
  const time = (hour: number, minute = 0) => new Date(2026, 10, 18, hour, minute).getTime()
  expect(townAtmosphere(time(5, 59), false).daylight).toBe(false)
  expect(townAtmosphere(time(6), false).daylight).toBe(true)
  expect(townAtmosphere(time(17, 59), false).daylight).toBe(true)
  expect(townAtmosphere(time(18), false).daylight).toBe(false)
  expect(townAtmosphere(time(12), true).daylight).toBe(false)
  expect(townAtmosphere(time(6), false).weather).toBe(townAtmosphere(time(21), true).weather)
})

it('supports leading-zero PINs and salts the locally derived verifier', async () => {
  const first = await makePin('0042')
  const second = await makePin('0042')
  expect(first.salt).not.toEqual(second.salt)
  expect(first.hash).not.toEqual(second.hash)
  expect(first.hash).toHaveLength(64)
  await expect(matchesPin('0042', first)).resolves.toBe(true)
  await expect(matchesPin('0043', first)).resolves.toBe(false)
  expect(validPin('４４４４')).toBe(false)
  expect(validPin('042')).toBe(false)
})
