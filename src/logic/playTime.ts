export type WeeklyTime = Record<string, number>
export const weekLimit = 12
export const weekMsLimit = 7 * 25 * 60 * 60 * 1000

function monday(now: number) {
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() - (day.getDay() + 6) % 7)
  return day
}

export function dateKey(day: Date) {
  return [String(day.getFullYear()).padStart(4, '0'), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0')].join('-')
}

export function recordTime(previous: WeeklyTime, from: number, to: number): WeeklyTime {
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to - from > 5 * 60_000) return previous
  const weeks = { ...previous }
  let cursor = from
  while (cursor < to) {
    const date = monday(cursor)
    const key = dateKey(date)
    date.setDate(date.getDate() + 7)
    const end = Math.min(to, date.getTime())
    if (!Number.isFinite(end) || end <= cursor) break
    weeks[key] = Math.min(weekMsLimit, (weeks[key] ?? 0) + end - cursor)
    cursor = end
  }
  return Object.fromEntries(Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).slice(-weekLimit))
}

export function recentWeeks(now: number, count = 6) {
  const start = monday(now)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() - index * 7)
    return { date, key: dateKey(date) }
  })
}

export function readWeeks(value: unknown): WeeklyTime {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([key, ms]) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(key) && typeof ms === 'number' && Number.isFinite(ms) && ms > 0 && ms <= weekMsLimit
  }).sort(([a], [b]) => a.localeCompare(b)).slice(-weekLimit))
}
