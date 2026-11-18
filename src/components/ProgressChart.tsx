import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildings, buildingIds, cheats, topicNames, type Topic } from '../config/gameConfig'
import type { HistoryPoint, TownEvent, TownSave } from '../logic/economy'
import { mastery } from '../logic/topicProgress'
import { StarRating } from './cheatCodes/QuestionStatus'
import { Coin, Icon } from './Icon'

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' })
function dateLabel(stamp: number) {
  const date = new Date(stamp)
  return Number.isFinite(date.getTime()) ? dateTime.format(date) : ''
}

function eventLabel(event: TownEvent) {
  if (event.kind === 'cheat') return `Cheat code cracked · ${cheats[event.cheat].name}`
  if (event.kind === 'unlock') return `Shop unlocked · ${buildings[event.shop].name}`
  return `Shop upgraded · ${buildings[event.shop].name}`
}

const markerColors = { unlock: '#93eee9', upgrade: '#ccb6fa', cheat: '#cced8b' }

export default function ProgressChart({ town }: { town: TownSave }) {
  const last = town.history.at(-1)
  const now = Math.max(town.lastAt, (last?.at ?? 0) + 1)
  const start = town.history[0]?.at ?? now - 1
  const history: HistoryPoint[] = town.history.length
    ? [...town.history, { at: now, total: town.lifetimeCoinsEarned }]
    : [{ at: start, total: town.lifetimeCoinsEarned }, { at: now, total: town.lifetimeCoinsEarned }]
  const open = buildingIds.filter((id) => Boolean(town.buildings[id])).length

  return <section className="growth-summary" aria-label="Town growth">
    <div className="growth-stat">
      <div><Coin size={22} /><span>Coins earned</span><strong>{town.lifetimeCoinsEarned.toLocaleString()}</strong></div>
      <div><Icon name="spark" size={22} /><span>Cheat codes cracked</span><strong>{town.cracked.toLocaleString()}</strong></div>
      <div><Icon name="town" size={22} /><span>Shops open</span><strong>{open} / {buildingIds.length}</strong></div>
      <div><Coin size={22} /><span>Coins spent</span><strong>{town.spent.toLocaleString()}</strong></div>
      <div><Icon name="upgrade" size={22} /><span>Best cheat streak</span><strong>{town.bestStreak.toLocaleString()}</strong></div>
    </div>
    <section className="chart-panel mastery-panel" aria-label="Mastery stars">
      <h2>Mastery stars</h2>
      <ul className="mastery-grid">
        {(Object.entries(topicNames) as [Topic, string][]).map(([topic, name]) => {
          const stats = town.topics[topic]
          return <li key={topic}><div><strong>{name}</strong><span>{stats ? `${stats.correct} solved` : 'Ready to try'}</span></div>
            <StarRating value={mastery(stats)} label={name} /></li>
        })}
      </ul>
    </section>
    <div className="chart-panel">
      <h2>Coins over time</h2>
      {town.lifetimeCoinsEarned === 0 && <p>Collect your first stock to start the chart.</p>}
      <ResponsiveContainer width="100%" height={235} initialDimension={{ width: 288, height: 235 }}>
        <LineChart data={history} margin={{ left: 1, right: 23, top: 16, bottom: 5 }} accessibilityLayer>
          <CartesianGrid stroke="#45405d" vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="at" type="number" domain={['dataMin', 'dataMax']} scale="time" ticks={[start, now]}
            interval={0} tickFormatter={(stamp) => stamp === start ? 'Start' : 'Now'}
            tick={{ fill: '#c0b9d1', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#554b68' }} />
          <YAxis allowDecimals={false} width={45} domain={[0, (max: number) => Math.max(10, max)]}
            tick={{ fill: '#c0b9d1', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(value, points) => {
              const event = (points[0]?.payload as HistoryPoint | undefined)?.event
              return <><span>{dateLabel(Number(value))}</span>{event && <span className="chart-tooltip-event">{eventLabel(event)}</span>}</>
            }}
            contentStyle={{ background: '#23213b', border: '1px solid #5c5275', borderRadius: 12, whiteSpace: 'normal' }}
            labelStyle={{ color: '#eee3f5' }} itemStyle={{ color: '#ffd36b' }} isAnimationActive={false} />
          <Line name="Coins earned" type="stepAfter" dataKey="total" stroke="#ffd36b" strokeWidth={3}
            dot={({ cx, cy, payload }) => {
              const point = payload as HistoryPoint
              return point.event
                ? <circle key={point.at} cx={cx} cy={cy} r={5} fill={markerColors[point.event.kind]} stroke="#27243f" strokeWidth={2}>
                  <title>{eventLabel(point.event)} · {dateLabel(point.at)}</title>
                </circle> : <g key={point.at} />
            }}
            activeDot={{ r: 5, fill: '#ffd36b', stroke: '#fff1cb' }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
}
