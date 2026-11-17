import { buildings, type BuildingId } from '../config/gameConfig'
import { storageCap, type BuildingState } from '../logic/economy'
import { BuildingArt } from './BuildingArt'
import { Icon } from './Icon'

type Props = {
  id: BuildingId
  state?: BuildingState
  selected: boolean
  preview: boolean
  onSelect: () => void
}

export function ProgressMeter({ value, label }: { value: number; label: string }) {
  const percent = Math.round(value * 100)
  return <div className="meter" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${percent}%` }} />
  </div>
}

export default function Building({ id, state, selected, preview, onSelect }: Props) {
  const ready = Boolean(state?.stock)
  const locked = !state && !preview
  const art = <>
    {ready && <span className="ready-bubble" aria-hidden="true"><Icon name="box" size={16} /></span>}
    <BuildingArt id={id} className="building-art" />
    <span className="map-plate">
      {locked && <Icon name="lock" size={13} />}
      <span>{buildings[id].name}</span>
    </span>
    {state && <span className="map-batch">
      <span className="map-meter"><i style={{ width: `${state.stock === storageCap(id, state.level) ? 100 : state.progress * 100}%` }} /></span>
      <span>{state.stock}/{storageCap(id, state.level)}</span>
    </span>}
  </>
  const classes = `map-building lot-${id}${selected ? ' is-selected' : ''}${locked ? ' is-locked' : ''}`
  return preview
    ? <div className={classes}>{art}</div>
    : <button type="button" className={classes} onClick={onSelect} aria-pressed={selected} aria-label={`${buildings[id].name}${locked ? ', locked' : `, ${state?.stock} in stock, capacity ${storageCap(id, state!.level)}`}`}>{art}</button>
}
