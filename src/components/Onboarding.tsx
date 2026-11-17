import { ageBands, buildingIds, buildings, type AgeBand, type BuildingId } from '../config/gameConfig'
import { BuildingArt } from './BuildingArt'
import { Icon } from './Icon'
import { MascotArt } from './Mascot'

export function BandPicker({ current, choose }: { current: AgeBand | null; choose: (band: AgeBand) => void }) {
  const bands = Object.keys(ageBands) as AgeBand[]
  return <div className="band-list">
    {bands.map((band, i) => <button key={band} type="button" className={`band-choice band-${band}`} onClick={() => choose(band)} aria-pressed={current ? current === band : undefined}>
      <span className="band-emblem"><Icon name={i === 0 ? 'moon' : i === 1 ? 'spark' : 'upgrade'} size={22} /></span>
      <span><strong>{ageBands[band].name}</strong><small>Ages {ageBands[band].ages}</small></span>
      <Icon name={current === band ? 'check' : 'chevron'} size={17} />
    </button>)}
  </div>
}

export default function Onboarding({ band, chooseBand, chooseBuilding }: {
  band: AgeBand | null
  chooseBand: (band: AgeBand) => void
  chooseBuilding: (id: BuildingId) => void
}) {
  return <section className="side-panel onboarding">
    <div className="onboarding-cap"><MascotArt /></div>
    <h2>{band ? 'Pick your first shop' : 'Who is playing?'}</h2>
    <p>{band ? 'Your shop comes with a batch ready to collect.' : 'Pick the crew that fits you best.'}</p>
    {band
      ? <div className="band-list">{buildingIds.map((id) => <button key={id} className="band-choice shop-choice" onClick={() => chooseBuilding(id)}>
        <BuildingArt id={id} />
        <span><strong>{buildings[id].name}</strong><small>Stocks {buildings[id].stockName}</small></span>
        <Icon name="chevron" size={17} />
      </button>)}</div>
      : <BandPicker current={null} choose={chooseBand} />}
  </section>
}
