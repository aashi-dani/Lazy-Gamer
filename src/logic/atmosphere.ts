import { localDay } from './topicProgress'
import { questionRandom } from './cheatCodes/random'

export const weatherNames = { rain: 'Rain', snow: 'Snow', fireflies: 'Fireflies' } as const
export type Weather = keyof typeof weatherNames
const weatherTypes = Object.keys(weatherNames) as Weather[]

export function townAtmosphere(now: number, alwaysNight: boolean) {
  const hour = new Date(now).getHours()
  const daylight = !alwaysNight && hour >= 6 && hour < 18
  const weather = weatherTypes[questionRandom(localDay(now) ^ 0x14e2ca)(0, weatherTypes.length - 1)]
  return { daylight, weather }
}
