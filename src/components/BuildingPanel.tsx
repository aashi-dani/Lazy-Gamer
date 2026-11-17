import { buildings, gameConfig, type BuildingId } from '../config/gameConfig'
import { batchTime, storageCap, upgradePrice, type TownSave } from '../logic/economy'
import { BuildingArt } from './BuildingArt'
import { ProgressMeter } from './Building'
import { Coin, Icon } from './Icon'
import type { ReactNode } from 'react'

export function duration(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1_000))
  if (seconds >= 3_600) return `${Math.floor(seconds / 3_600)}h ${Math.floor(seconds % 3_600 / 60)}m`
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${seconds}s`
}

export default function BuildingPanel({ id, town, onCollect, onUnlock, onUpgrade, children }: {
  id: BuildingId
  town: TownSave
  onCollect: () => void
  onUnlock: () => void
  onUpgrade: () => void
  children?: ReactNode
}) {
  const config = buildings[id]
  const building = town.buildings[id]
  const cap = building ? storageCap(id, building.level) : 0
  const full = building?.stock === cap
  const rate = building?.boost?.rate ?? 1
  const rateDuration = building ? batchTime(building.level) : 0
  const upgrade = building ? upgradePrice(building.level) : 0
  return <section className="side-panel building-panel" aria-label={config.name}>
    <div className="panel-banner" style={{ '--shop-color': config.color } as React.CSSProperties}>
      <BuildingArt id={id} className="panel-building-art" />
      <div className="panel-caption"><span className="level-label">{building ? `LEVEL ${building.level}` : 'LOCKED'}</span><h2>{config.name}</h2></div>
    </div>
    {building ? <>
      <div className="production">
        <div className="stock-line"><span><Icon name="box" size={19} /> In stock</span><strong>{building.stock}<span className="muted"> / {cap}</span></strong></div>
        <ProgressMeter value={full ? 1 : building.progress} label="Batch progress" />
        <div className="production-rate">
          <span><Icon name="clock" size={15} /> {full ? 'Storage full' : `${config.batchSize} ${config.stockName} / ${duration(rateDuration)}`}</span>
          {rate > 1 && <strong className="text-lime">{rate}× · {duration(building.boost!.endsAt - town.lastAt)}</strong>}
        </div>
        <button className="button gold-button collect-button" disabled={!building.stock} onClick={onCollect}>
          <Icon name="box" size={20} /> {building.stock ? 'Collect stock' : 'Batch brewing'}
          {building.stock > 0 && <span className="sale-value"><Coin size={17} /> +{building.stock * config.salePrice}</span>}
        </button>
      </div>
      {children}
      <div className="upgrade-row">
        <span><Icon name="upgrade" size={19} /> Upgrade shop</span>
        {building.level >= gameConfig.maxLevel
          ? <strong className="text-lime">Max level</strong>
          : <button className="button outline-button" aria-label={`Upgrade shop for ${upgrade} coins`} disabled={town.coins < upgrade} onClick={onUpgrade}><Coin size={16} /> {upgrade}</button>}
      </div>
    </> : <div className="locked-detail">
      <p>Open this shop to stock {config.stockName}.</p>
      <button className="button gold-button" disabled={town.coins < config.price} onClick={onUnlock}><Icon name="lock" size={19} /> Unlock shop <span className="sale-value"><Coin size={18} /> {config.price}</span></button>
      {town.coins < config.price && <small>{config.price - town.coins} more coins to open</small>}
    </div>}
  </section>
}
