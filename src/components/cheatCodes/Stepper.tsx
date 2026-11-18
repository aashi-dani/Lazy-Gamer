import { Icon } from '../Icon'

export default function Stepper({ label, value, decrease, increase, atMin, atMax }: {
  label: string
  value: number
  decrease: () => void
  increase: () => void
  atMin: boolean
  atMax: boolean
}) {
  return <div className="stepper" role="group" aria-label={label}>
    <span>{label}</span>
    <div className="stepper-controls">
      <button type="button" className="icon-button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={atMin} onClick={decrease}><Icon name="minus" /></button>
      <output aria-label={label}>{value}</output>
      <button type="button" className="icon-button" aria-label={`Increase ${label.toLowerCase()}`} disabled={atMax} onClick={increase}><Icon name="plus" /></button>
    </div>
  </div>
}
