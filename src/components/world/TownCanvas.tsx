import { useEffect, useRef, useState, type PointerEvent as ReactPointer } from 'react'
import { buildings, type BuildingId } from '../../data/catalog'
import { lotAt, type Cell, type Spot } from '../../logic/townLayout'
import { BuildingArt } from '../BuildingArt'
import { Coin, Icon } from '../Icon'
import { cameraPoint, createTownRenderer, type MapCamera, type MapView, type TownRenderer } from './TownRenderer'

type Sample = { x: number; y: number }
type Drag = { origin: Sample; last: Sample; start?: Cell; held: boolean; traversed: boolean; panOnly: boolean; contact: string }

const distance = (a: Sample, b: Sample) => Math.hypot(a.x - b.x, a.y - b.y)
const center = (a: Sample, b: Sample) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

export default function TownCanvas({ view, chosen, drafting, onPick, onMoveStart, onMoveDrop, onPaletteDrop, readOnly = false, offers, onShopOffer }: {
  view: MapView
  chosen?: Cell
  drafting?: boolean
  onPick?: (cell: Cell) => void
  onMoveStart?: (cell: Cell) => void
  onMoveDrop?: (from: Cell, to: Cell) => void
  onPaletteDrop?: (cell: Cell) => void
  readOnly?: boolean
  offers?: readonly { id: BuildingId; spot: Spot }[]
  onShopOffer?: (id: BuildingId, spot: Spot) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const renderer = useRef<TownRenderer>()
  const latest = useRef(view)
  latest.current = view
  const hold = useRef<number>()
  const pointers = useRef(new Map<number, Sample>())
  const gesture = useRef<Drag>()
  const pinched = useRef(false)
  const [failed, setFailed] = useState(false)
  const [camera, setCamera] = useState<MapCamera>()

  useEffect(() => {
    const element = host.current!
    let disposed = false
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const point = element.getBoundingClientRect()
      renderer.current?.zoomBy(Math.exp(-event.deltaY * .006), { x: event.clientX - point.left, y: event.clientY - point.top })
    }
    element.addEventListener('wheel', wheel, { passive: false })
    void createTownRenderer(element, (next) => { if (!disposed) setCamera(next) }).then((map) => {
      if (disposed) { map.destroy(); return }
      renderer.current = map
      map.setView(latest.current)
    }).catch(() => { if (!disposed) setFailed(true) })
    return () => {
      disposed = true
      window.clearTimeout(hold.current)
      element.removeEventListener('wheel', wheel)
      renderer.current?.destroy()
      renderer.current = undefined
    }
  }, [])

  useEffect(() => {
    renderer.current?.setView(view)
    renderer.current?.setSelection(chosen)
  }, [view, chosen])

  const position = (event: { clientX: number; clientY: number }) => {
    const box = host.current!.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top }
  }

  const tile = (point: Sample, hitArtwork = false) => renderer.current?.cellAt(point, hitArtwork)
  const stopHold = () => window.clearTimeout(hold.current)

  const down = (event: ReactPointer<HTMLDivElement>) => {
    if (event.button > 0) return
    const point = position(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, point)
    if (pointers.current.size > 1) {
      stopHold()
      pinched.current = true
      gesture.current = undefined
      return
    }
    pinched.current = false
    const start = tile(point, !drafting)
    gesture.current = { origin: point, last: point, start, held: false, traversed: false,
      panOnly: event.shiftKey, contact: event.pointerType }
    if (readOnly || drafting || !start || !lotAt(view.layout, { ...start, area: view.area }) || event.pointerType === 'mouse') return
    hold.current = window.setTimeout(() => {
      const current = gesture.current
      if (!current || current.traversed) return
      current.held = true
      onMoveStart?.(start)
      renderer.current?.setSelection(start)
    }, 480)
  }

  const move = (event: ReactPointer<HTMLDivElement>) => {
    const point = position(event)
    const points = pointers.current
    if (!points.has(event.pointerId)) {
      const cell = drafting ? tile(point) : undefined
      if (cell) renderer.current?.setSelection(cell, !lotAt(view.layout, { ...cell, area: view.area }))
      return
    }
    const before = [...points.values()]
    points.set(event.pointerId, point)
    if (points.size >= 2) {
      const [a, b] = [...points.values()]
      const original = distance(before[0], before[1])
      if (original > 4) {
        const midpoint = center(a, b)
        const former = center(before[0], before[1])
        renderer.current?.panBy(midpoint.x - former.x, midpoint.y - former.y)
        renderer.current?.zoomBy(distance(a, b) / original, midpoint)
      }
      return
    }
    const current = gesture.current
    if (!current || (!current.traversed && distance(current.origin, point) < 7)) return
    if (!current.traversed) {
      stopHold()
      current.traversed = true
      if (!drafting && !readOnly && !current.panOnly && current.contact === 'mouse' && current.start &&
        lotAt(view.layout, { ...current.start, area: view.area })) {
        current.held = true
        onMoveStart?.(current.start)
      }
    }
    if (current.held) {
      const cell = tile(point)
      renderer.current?.setSelection(cell, Boolean(cell && !lotAt(view.layout, { ...cell, area: view.area })))
    } else renderer.current?.panBy(point.x - current.last.x, point.y - current.last.y)
    current.last = point
  }

  const up = (event: ReactPointer<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size) return
    stopHold()
    const current = gesture.current
    gesture.current = undefined
    if (!current || pinched.current) return
    const target = tile(position(event), !drafting && !current.held)
    if (current.held && current.start && current.traversed && target) onMoveDrop?.(current.start, target)
    else if (!current.held && !current.traversed && target) {
      renderer.current?.walkTo(target)
      onPick?.(target)
    }
  }

  const cancel = (event: ReactPointer<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    stopHold()
    gesture.current = undefined
  }

  return <div className="world-map-frame">
    <div className="world-canvas" ref={host} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
      onPointerLeave={() => renderer.current?.setSelection(chosen)}
      onContextMenu={(event) => event.preventDefault()}
      onDragOver={(event) => { if (onPaletteDrop) event.preventDefault() }}
      onDrop={(event) => {
        if (!onPaletteDrop) return
        event.preventDefault()
        const cell = tile(position(event))
        if (cell) onPaletteDrop(cell)
      }} />
    {!failed && camera && offers?.map(({ id, spot }) => {
      const point = cameraPoint(spot, camera)
      if (point.x < 22 || point.x > camera.width - 22 || point.y < 68 || point.y > camera.height) return null
      return <button key={id} type="button" className="map-shop-offer" style={{ left: point.x, top: point.y }}
        onClick={() => onShopOffer?.(id, spot)}
        aria-label={`${buildings[id].name}, locked, ${buildings[id].price} coins`}>
        <span className="map-shop-price"><Icon name="lock" size={13} /><Coin size={14} />{buildings[id].price}</span>
        <BuildingArt id={id} className="building-art" />
        <span className="map-shop-name">{buildings[id].name}</span>
      </button>
    })}
    {failed ? <p className="world-map-status" role="status">Use the shop list and tile picker below to build.</p> :
      <div className="map-zoom" role="group" aria-label="Map zoom">
        <button className="icon-button" onClick={() => renderer.current?.zoomBy(1.3)} aria-label="Zoom in"><Icon name="plus" size={20} /></button>
        <button className="icon-button" onClick={() => renderer.current?.zoomBy(1 / 1.3)} aria-label="Zoom out"><Icon name="minus" size={20} /></button>
        <button className="icon-button" onClick={() => renderer.current?.resetView()} aria-label="Reset map view"><Icon name="move" size={19} /></button>
      </div>}
  </div>
}
