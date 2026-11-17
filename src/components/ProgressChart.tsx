import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TownSave } from '../logic/economy'
import { Coin, Icon } from './Icon'

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

export default function ProgressChart({ town }: { town: TownSave }) {
  const last = town.history.at(-1)
  const now = Math.max(town.lastAt, (last?.at ?? 0) + 1)
  const history = [...town.history, { at: now, total: town.earned }]
  const first = history[0]
  const sameDay = new Date(first.at).toDateString() === new Date(now).toDateString()
  const labelTime = (stamp: number) => {
    const date = new Date(stamp)
    return Number.isFinite(date.getTime()) ? (sameDay ? timeFormat : dateFormat).format(date) : ''
  }

  return <section className="growth-summary" aria-label="Town growth">
    <div className="growth-stat">
      <div><Coin size={22} /><span>Coins earned</span><strong>{town.earned.toLocaleString()}</strong></div>
      <div><Icon name="spark" size={22} /><span>Cheat codes cracked</span><strong>{town.cracked.toLocaleString()}</strong></div>
    </div>
    <div className="chart-panel">
      <h2>Coins over time</h2>
      {town.earned === 0 && <p>Collect your first stock to start the chart.</p>}
      <ResponsiveContainer width="100%" height={235} initialDimension={{ width: 288, height: 235 }}>
        <LineChart data={history} margin={{ left: 1, right: 15, top: 16, bottom: 5 }} accessibilityLayer>
          <CartesianGrid stroke="#45405d" vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="at" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={labelTime} minTickGap={32}
            tick={{ fill: '#c0b9d1', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#554b68' }} />
          <YAxis allowDecimals={false} width={42} domain={[0, (max: number) => Math.max(10, max)]}
            tick={{ fill: '#c0b9d1', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={(value) => labelTime(Number(value))} contentStyle={{ background: '#23213b', border: '1px solid #5c5275', borderRadius: 12 }}
            labelStyle={{ color: '#eee3f5' }} itemStyle={{ color: '#ffd36b' }} isAnimationActive={false} />
          <Line name="Coins earned" type="stepAfter" dataKey="total" stroke="#ffd36b" strokeWidth={3}
            dot={false} activeDot={{ r: 5, fill: '#ffd36b', stroke: '#fff1cb' }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
}
