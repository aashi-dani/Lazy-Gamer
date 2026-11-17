import { buildingIds, type BuildingId } from '../config/gameConfig'
import type { TownSave } from '../logic/economy'
import Building from './Building'
import { Icon } from './Icon'
import { TownScenery } from './TownScenery'

export default function Town({ town, active, onSelect, preview = false }: {
  town: TownSave
  active?: BuildingId
  onSelect: (id: BuildingId) => void
  preview?: boolean
}) {
  return <section className="town-frame" aria-label="Town map">
    <div className="town-map">
      <TownScenery />
      <div className="map-name"><Icon name="moon" size={16} /><span>Sleepy Hollow</span></div>
      {buildingIds.map((id) => <Building key={id} id={id} state={town.buildings[id]} selected={id === active} preview={preview} onSelect={() => onSelect(id)} />)}
    </div>
  </section>
}
