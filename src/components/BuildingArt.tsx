import { shopArt } from '../data/worldArt'
import type { BuildingId } from '../config/gameConfig'

export function BuildingArt({ id, level, className }: { id: BuildingId; level?: number; className?: string }) {
  return <img className={className} src={shopArt(id, level)} width={162} height={128} alt="" aria-hidden="true" draggable={false} />
}
