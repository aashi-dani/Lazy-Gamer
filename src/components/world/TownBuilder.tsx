import { weatherNames, type Weather } from '../../logic/atmosphere'
import { useRef, useState } from 'react'
import { useAndroidBackAction } from '../../native/back'
import { buildingIds, buildings, originalBuildingIds, type BuildingId } from '../../data/catalog'
import { biomeIds, biomes, decorations, decorationIds, expansionLevel, expansionPrice, maxSize, type BiomeId } from '../../data/world'
import { pieceAccess, pieceName, refund } from '../../logic/buildTown'
import type { TownSave } from '../../logic/economy'
import { charmPercent, lotAt, spotForShop, townCharm, type Cell, type Piece, type Spot } from '../../logic/townLayout'
import { useGameStore } from '../../store/gameStore'
import { BuildingArt } from '../BuildingArt'
import { Coin, Icon } from '../Icon'
import { playSound } from '../sound'
import TownCanvas from './TownCanvas'

type Draft = { piece: Piece } | { from: Spot }
type Palette = 'Shops' | 'Decor' | 'Roads'
const previewCells = [{ x: 5, y: 1 }, { x: 1, y: 5 }, { x: 5, y: 4 }, { x: 2, y: 4 }]
const palette: Record<Palette, Piece[]> = {
  Shops: buildingIds.map((id) => ({ kind: 'shop', id })),
  Decor: decorationIds.map((id) => ({ kind: 'decoration', id })),
  Roads: [{ kind: 'road' }],
}

export default function TownBuilder({ town, active, openShop, daylight, weather, reduced }: { town: TownSave; active?: BuildingId; openShop: (id: BuildingId, spot?: Spot) => void; daylight: boolean; weather: Weather; reduced: boolean }) {
  const [area, setArea] = useState<BiomeId>('sleepy')
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<Palette>('Shops')
  const [chosen, setChosen] = useState<Cell>()
  const [typed, setTyped] = useState<Cell>({ x: 0, y: 0 })
  const [draft, setDraft] = useState<Draft>()
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const dragging = useRef<Piece>()
  const size = town.layout.sizes[area]
  const focus = chosen && lotAt(town.layout, { ...chosen, area })
  const store = useGameStore.getState()
  const coordinates = Array.from({ length: size }, (_, i) => i)
  const finishEditing = () => {
    setEditing(false)
    setDraft(undefined)
    setConfirm(false)
    setMessage('')
  }
  useAndroidBackAction(editing ? () => {
    if (confirm) setConfirm(false)
    else if (draft) { setDraft(undefined); setMessage('') }
    else finishEditing()
  } : undefined)

  const place = (selected: Draft, cell: Cell) => {
    const target = { ...cell, area }
    const changed = 'from' in selected ? store.move(selected.from, target) : store.place(selected.piece, target)
    if (!changed) {
      setMessage(lotAt(town.layout, target) ? 'That tile is occupied. Pick an empty tile.' : 'This piece could not go on that tile.')
      return
    }
    setMessage('from' in selected ? 'Moved to a new tile.' : `${pieceName(selected.piece)} placed.`)
    setChosen(cell)
    setDraft('piece' in selected && selected.piece.kind === 'road' ? selected : undefined)
    playSound('unlock')
  }

  const pick = (cell: Cell) => {
    setConfirm(false)
    if (draft) { place(draft, cell); return }
    setChosen(cell)
    if (!editing) {
      const lot = lotAt(town.layout, { ...cell, area })
      if (lot?.kind === 'shop') openShop(lot.id)
    }
  }
  const prepareMove = (cell: Cell) => {
    const from = { ...cell, area }
    const lot = lotAt(town.layout, from)
    if (!lot) return
    setEditing(true)
    setConfirm(false)
    setChosen(cell)
    setDraft({ from })
    setMessage(`Move ${pieceName(lot)} to an empty tile.`)
  }
  const updateArea = (next: BiomeId) => {
    setArea(next)
    setChosen(undefined)
    setTyped({ x: 0, y: 0 })
    setConfirm(false)
    setMessage('')
  }
  const localShops = town.layout.lots.filter((lot) => lot.kind === 'shop').filter((lot) => lot.area === area)
  const cost = expansionPrice(size)
  const preview = { layout: town.layout, area, buildings: town.buildings, avatar: town.avatar, pet: town.pet, daylight, weather, reduced }
  const unowned = buildingIds.filter((id) => !town.buildings[id]).sort((a, b) => buildings[a].unlockLevel - buildings[b].unlockLevel)
  const offers: { id: BuildingId; spot: Spot }[] = []
  if (!editing && area === 'sleepy') {
    const lots = [...town.layout.lots]
    for (const id of unowned.slice(0, 2)) {
      const layout = { ...town.layout, lots }
      const freeCell: Spot | undefined = previewCells.map((cell): Spot => ({ ...cell, area })).find((cell) => !lotAt(layout, cell))
      const isOriginal = originalBuildingIds.includes(id as typeof originalBuildingIds[number])
      const spot: Spot | undefined = isOriginal ? spotForShop(layout, id) : freeCell ?? spotForShop(layout, id)
      if (spot?.area !== area) continue
      offers.push({ id, spot })
      lots.push({ ...spot, kind: 'shop', id })
    }
  }

  return <section className="town-builder" aria-label="Town builder">
    <div className="world-toolbar">
      <label className="profile-field">Map area
        <select value={area} onChange={(event) => updateArea(event.target.value as BiomeId)}>
          {biomeIds.map((id) => <option key={id} value={id} disabled={town.playerLevel < biomes[id].level}>
            {biomes[id].name}{town.playerLevel < biomes[id].level ? ` (level ${biomes[id].level})` : ''}
          </option>)}
        </select>
      </label>
      <button className={`button ${editing ? 'cyan-button' : 'outline-button'}`} aria-pressed={editing}
        onClick={() => { if (editing) finishEditing(); else setEditing(true) }}>
        <Icon name="hammer" size={18} /> {editing ? 'Finish building' : 'Build town'}
      </button>
    </div>
    <TownCanvas view={preview} chosen={chosen} drafting={Boolean(draft)} onPick={pick} onMoveStart={prepareMove}
      offers={offers} onShopOffer={openShop}
      onMoveDrop={(from, to) => place({ from: { ...from, area } }, to)}
      onPaletteDrop={(cell) => { if (dragging.current) place({ piece: dragging.current }, cell) }} />
    <div className="world-caption"><span>{size} × {size} tiles</span>
      <span className="world-weather"><Icon name={daylight ? 'sun' : 'moon'} size={16} /> {daylight ? 'Day' : 'Night'}
        <Icon name={weather === 'rain' ? 'rain' : weather === 'snow' ? 'snow' : 'spark'} size={16} /> {weatherNames[weather]}</span>
      <span><Icon name="leaf" size={17} /> {townCharm(town.layout)} Town Charm · +{charmPercent(town.layout)}% sales</span></div>
    {editing ? <div className="builder-controls">
      <div className="category-bar" role="group" aria-label="Build categories">
        {(Object.keys(palette) as Palette[]).map((category) => <button type="button" key={category}
          className="button outline-button" aria-pressed={tab === category} onClick={() => setTab(category)}>{category}</button>)}
      </div>
      <div className="builder-palette">{palette[tab].map((piece) => {
        const key = piece.kind === 'road' ? 'road' : piece.id
        const item = pieceAccess(town, piece)
        const existing = piece.kind === 'shop' && town.buildings[piece.id]
        const disabled = Boolean(item.issue) || town.coins < item.price
        return <button type="button" key={key} className="builder-item" disabled={disabled} draggable={!disabled}
          onDragStart={(event) => {
            dragging.current = piece
            event.dataTransfer.setData('text/plain', key)
            event.dataTransfer.effectAllowed = 'move'
          }} onDragEnd={() => { dragging.current = undefined }}
          onClick={() => {
            setDraft({ piece }); setConfirm(false)
            setMessage(`Pick an empty tile for ${pieceName(piece)}.`)
          }}>
          {piece.kind === 'shop' ? <BuildingArt id={piece.id} level={town.buildings[piece.id]?.level} /> : piece.kind === 'decoration'
            ? <img src={`/art/decor/${piece.id}.svg`} alt="" /> : <Icon name="line" size={30} />}
          <strong>{pieceName(piece)}</strong>
          <small>{item.issue || (existing ? 'Move shop' : item.price ? `${item.price} coins` : 'Earned reward')}</small>
        </button>
      })}</div>
      <p className="builder-message" role="status">{message || 'Choose a piece to place, or select a tile to move or remove it.'}</p>
      {draft && <button className="button outline-button" onClick={() => { setDraft(undefined); setMessage('') }}>Cancel placement</button>}
      <details className="tile-picker">
        <summary>Choose a tile by row and column</summary>
        <div>
          <label className="profile-field">Column<select value={typed.x} onChange={(event) => setTyped({ ...typed, x: +event.target.value })}>
            {coordinates.map((i) => <option value={i} key={i}>{i + 1}</option>)}</select></label>
          <label className="profile-field">Row<select value={typed.y} onChange={(event) => setTyped({ ...typed, y: +event.target.value })}>
            {coordinates.map((i) => <option value={i} key={i}>{i + 1}</option>)}</select></label>
          <button className="button cyan-button" onClick={() => pick(typed)}>{draft ? 'Place here' : 'Select tile'}</button>
        </div>
      </details>
      {focus && !draft && <div className="builder-focus">
        <strong>{pieceName(focus)} · tile {focus.x + 1}, {focus.y + 1}</strong>
        {confirm ? <>
          <p>{focus.kind === 'shop' && 'Removing this shop also clears its stock. '}You’ll get {refund(town, focus)} coins back.</p>
          <button className="button outline-button" onClick={() => setConfirm(false)}>Keep it</button>
          <button className="button danger-button" onClick={() => {
            store.removeLot(focus); setConfirm(false); setChosen(undefined); setMessage('Tile cleared.')
          }}>Confirm removal</button>
        </> : <>
          <button className="button outline-button" onClick={() => prepareMove(focus)}>Move piece</button>
          <button className="button outline-button" onClick={() => setConfirm(true)}>Remove piece</button>
        </>}
      </div>}
      <button className="button outline-button expansion-button" disabled={size >= maxSize || town.playerLevel < expansionLevel || town.coins < cost}
        onClick={() => { store.expand(area); setMessage(`Map expanded to ${size + 2} × ${size + 2} tiles.`); playSound('unlock') }}>
        {size >= maxSize ? 'Map fully expanded' : town.playerLevel < expansionLevel ? `Land expansion at level ${expansionLevel}` :
          <><Icon name="plus" size={18} /> Expand to {size + 2} × {size + 2} <Coin size={17} /> {cost}</>}
      </button>
    </div> : <>
      <div className="world-shop-list" role="group" aria-label="Shops in this area">
        {localShops.map((lot) => <button className="button outline-button" type="button" key={lot.id} aria-pressed={active === lot.id}
          onClick={() => { setChosen(lot); openShop(lot.id) }}>{buildings[lot.id].name}</button>)}
        {!localShops.length && <p className="muted">Use Build town to place a shop here.</p>}
      </div>
      {unowned.length > 0 && <details className="locked-shop-list">
        <summary>Locked shops</summary>
        <div className="world-shop-list">
          {unowned.map((id) => <button key={id} className="button outline-button" type="button"
            onClick={() => openShop(id, offers.find((offer) => offer.id === id)?.spot)}>
            <Icon name="lock" size={16} /> {buildings[id].name} <Coin size={16} /> {buildings[id].price}
          </button>)}
        </div>
      </details>}
    </>}
  </section>
}
