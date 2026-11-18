import type { Weather } from '../../logic/atmosphere'
import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { avatarLayers, type Avatar, type Pet } from '../../data/profile'
import { shopArt } from '../../data/worldArt'
import { biomes, type BiomeId } from '../../data/world'
import type { TownSave } from '../../logic/economy'
import { onMap, routeOnRoads, type Cell, type Lot, type TownLayout } from '../../logic/townLayout'

type Point = { x: number; y: number }
export type MapView = {
  layout: TownLayout; area: BiomeId; buildings: TownSave['buildings']; avatar: Avatar; pet: Pet; daylight: boolean; weather: Weather; reduced: boolean
}
const halfWidth = 36
const halfHeight = 19
const project = ({ x, y }: Point): Point => ({ x: (x - y) * halfWidth, y: (x + y) * halfHeight })
export type MapCamera = { x: number; y: number; scale: number; width: number; height: number }
export function cameraPoint(cell: Cell, camera: MapCamera): Point {
  const location = project(cell)
  return { x: camera.x + location.x * camera.scale, y: camera.y + location.y * camera.scale }
}
const hairColors = [0xffffff, 0xe9a16f, 0xfca478, 0xffdd94, 0xe2d9ee, 0xeb9adb, 0x8cbdec, 0xf6b0de]
const neighbours = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }]

function diamond(shape: Graphics, x: number, y: number, factor = 1) {
  const dx = halfWidth * factor
  const dy = halfHeight * factor
  return shape.poly([x, y - dy, x + dx, y, x, y + dy, x - dx, y])
}

function attachImage(container: Container, path: string, width: number, height: number, tint = 0xffffff) {
  const sprite = new Sprite(Texture.EMPTY)
  sprite.anchor.set(.5, .9)
  sprite.tint = tint
  container.addChild(sprite)
  void Assets.load<Texture>(path).then((texture) => {
    if (sprite.destroyed) return
    sprite.texture = texture
    sprite.width = width
    sprite.height = height
  }).catch(() => { /* The ground tile and accessible shop list stay active. */ })
}

function buildCharacter(container: Container, avatar: Avatar, width: number) {
  for (const part of avatarLayers) {
    if (part !== 'outfit' && part !== 'skin' && part !== 'hair' && avatar[part] === 0) continue
    attachImage(container, `/art/avatar/${part}-${avatar[part]}.svg`, width, width,
      part === 'hair' ? hairColors[avatar.hairColor] : 0xffffff)
  }
}

function buildPet(container: Container, pet: Pet) {
  const width = 24
  const height = 21.6
  attachImage(container, `/art/pets/${pet.type}.svg`, width, height)
  if (pet.evolution) attachImage(container, `/art/pets/evolution-${pet.evolution}.svg`, width, height)
  if (pet.accessories) {
    for (const [part, option] of Object.entries(pet.accessories)) {
      if (option) attachImage(container, `/art/pets/${part}-${option}.svg`, width, height)
    }
  }
}

function clear(container: Container) {
  for (const child of container.removeChildren()) child.destroy({ children: true })
}

export async function createTownRenderer(host: HTMLDivElement, onCamera: (camera: MapCamera) => void) {
  const app = new Application()
  await app.init({ width: host.clientWidth || 340, height: host.clientHeight || 340,
    preference: ['webgl', 'canvas'], background: 0x171831, antialias: true, autoDensity: true,
    resolution: Math.min(devicePixelRatio || 1, 1.5), powerPreference: 'low-power' })
  app.ticker.maxFPS = 36
  const sky = new Graphics()
  const weatherOverlay = new Graphics()
  const roofEffects = new Graphics()
  const world = new Container()
  const ground = new Graphics()
  const hint = new Graphics()
  const objects = new Container({ sortableChildren: true })
  const actors = new Container()
  const player = new Container()
  const pet = new Container()
  const visitorArt = new Container()
  actors.addChild(visitorArt, pet, player)
  world.addChild(ground, hint, objects, roofEffects, actors)
  app.stage.addChild(sky, world, weatherOverlay)
  host.appendChild(app.canvas)
  app.canvas.setAttribute('aria-hidden', 'true')

  let model: MapView | undefined
  let lotSignature = ''
  let appearance = ''
  let size = 8
  let zoom = 1
  let fit = 1
  let pan = { x: 0, y: 0 }
  let playerPosition = project({ x: 1, y: 4 })
  let petPosition = { x: playerPosition.x - 10, y: playerPosition.y + 8 }
  let destination = playerPosition
  let walkers: { art: Container; path: Cell[]; clock: number }[] = []
  let rooftops: { x: number; y: number; chimney: boolean }[] = []
  let effectClock = 0
  let lastEffectFrame = -1
  const daySky = { sleepy: 0x84aec8, sunny: 0x78bed6, crystal: 0x9dbbe0 }
  const dayLand = { sleepy: [0x839f8d, 0x8bab99], sunny: [0xe8c9a1, 0xebd4b3], crystal: [0xb2c7e0, 0xc1d7e9] }

  function drawSky() {
    const { width, height } = app.screen
    const theme = model ? biomes[model.area] : biomes.sleepy
    const daylight = model?.daylight ?? false
    const color = daylight ? daySky[model!.area] : theme.sky
    sky.clear().rect(0, 0, width, height).fill(color)
    for (let i = 0; i < (daylight ? 0 : 40); i++) {
      const x = (i * 79.71 % 260) / 260 * width
      const y = (i * 23.19 % 153) / 153 * height
      sky.circle(x, y, i % 5 ? 1 : 2).fill({ color: theme.accent, alpha: i % 4 ? .35 : .6 })
    }
    for (const [x, y] of [[.08, .18], [.87, .27], [.15, .78], [.91, .71]]) {
      sky.ellipse(width * x, height * y, 25, 8).fill({ color: daylight ? 0xffffff : theme.accent, alpha: daylight ? .32 : .09 })
    }
    if (daylight) sky.circle(width * .82, height * .13, 20).fill({ color: 0xffd997, alpha: .7 })
    else if (model?.area === 'crystal') sky.poly([width * .73, 55, width * .79, 12, width * .88, 57]).fill({ color: 0x9fe7fa, alpha: .37 })
    else {
      sky.circle(width * .8, height * .15, 19).fill(0xffdfa2)
      sky.circle(width * .8 + 8, height * .15 - 7, 16).fill(color)
    }
  }

  function layoutCamera() {
    const { width, height } = app.screen
    fit = Math.min((width - 22) / (size * halfWidth * 2), (height - 72) / (size * halfHeight * 2), 1.18)
    fit = Math.max(.08, fit)
    const scale = fit * zoom
    world.scale.set(scale)
    const reachX = Math.max(width * .25, size * halfWidth * scale - width * .22)
    const reachY = Math.max(height * .25, size * halfHeight * scale - height * .22)
    pan.x = Math.min(reachX, Math.max(-reachX, pan.x))
    pan.y = Math.min(reachY, Math.max(-reachY, pan.y))
    world.position.set(width / 2 + pan.x, (height / 2 + 16) - (size - 1) * halfHeight * scale + pan.y)
    onCamera({ x: world.x, y: world.y, scale, width, height })
  }

  const observer = new ResizeObserver(() => {
    if (!host.clientWidth || !host.clientHeight) return
    app.renderer.resize(host.clientWidth, host.clientHeight)
    drawSky()
    layoutCamera()
    drawEffects()
  })
  observer.observe(host)
  drawSky()
  layoutCamera()

  function drawGround(area: BiomeId, lots: Lot[]) {
    const theme = biomes[area]
    const colors = model?.daylight ? dayLand[area] : [theme.ground, theme.alternate]
    ground.clear()
    const bottom = project({ x: size - 1, y: size - 1 })
    const left = project({ x: 0, y: size - 1 })
    const right = project({ x: size - 1, y: 0 })
    ground.poly([left.x - halfWidth, left.y, bottom.x, bottom.y + halfHeight, right.x + halfWidth, right.y,
      right.x + halfWidth, right.y + 17, bottom.x, bottom.y + halfHeight + 17, left.x - halfWidth, left.y + 17])
      .fill(theme.edge)
    const roads = lots.filter((lot) => lot.kind === 'road')
    const roadKeys = new Set(roads.map(({ x, y }) => `${x}:${y}`))
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tile = project({ x, y })
        diamond(ground, tile.x, tile.y).fill(colors[(x + y) % 2])
          .stroke({ color: theme.edge, alpha: .45, width: .9 })
        if (roadKeys.has(`${x}:${y}`)) diamond(ground, tile.x, tile.y, .72).fill(theme.road)
      }
    }
    for (const road of roads) {
      const from = project(road)
      for (const step of neighbours) {
        const neighbour = { x: road.x + step.x, y: road.y + step.y }
        if (!roadKeys.has(`${neighbour.x}:${neighbour.y}`) && !lots.some((lot) =>
          lot.kind === 'shop' && lot.x === neighbour.x && lot.y === neighbour.y)) continue
        const to = project(neighbour)
        ground.moveTo(from.x, from.y).lineTo((from.x + to.x) / 2, (from.y + to.y) / 2)
          .stroke({ width: 10, color: theme.road, cap: 'round' })
      }
    }
  }

  function setWalkers(lots: Lot[]) {
    clear(visitorArt)
    const shops = lots.filter((lot) => lot.kind === 'shop')
    const roads = lots.filter((lot) => lot.kind === 'road')
    const stops = shops.length ? shops : [{ x: 3, y: 3 }]
    walkers = stops.slice(0, 5).map((to, index) => {
      const start = roads[index] ?? { x: 0, y: Math.min(size - 1, 4 + index) }
      const path = routeOnRoads(roads, start, to) ?? [start, { x: to.x, y: start.y }, to]
      const art = new Container()
      buildCharacter(art, { skin: [1, 3, 5, 6, 2][index], hair: [1, 4, 2, 5, 3][index], hairColor: [1, 0, 2, 4, 0][index],
        outfit: [1, 4, 3, 2, 5][index], accessory: 0, backpack: 0, shoes: 0, hat: 0 }, 25)
      visitorArt.addChild(art)
      return { art, path, clock: index * 1.3 }
    })
  }

  function renderObjects(lots: Lot[], buildings: TownSave['buildings']) {
    clear(objects)
    rooftops = []
    for (const lot of lots) {
      if (lot.kind === 'road') continue
      const item = new Container()
      const spot = project(lot)
      item.position.set(spot.x, spot.y)
      item.zIndex = lot.x + lot.y
      if (lot.kind === 'shop') {
        const level = buildings[lot.id]?.level ?? 1
        if (['bakery', 'library', 'tuck'].includes(lot.id) || level >= 4) rooftops.push({
          ...spot, chimney: ['bakery', 'tuck'].includes(lot.id),
        })
        attachImage(item, shopArt(lot.id, level), 118, 93)
        if (buildings[lot.id]?.stock) {
          const badge = new Graphics().circle(28, -44, 9).fill(0xbce5a1)
            .moveTo(24, -44).lineTo(27, -41).lineTo(32, -48).stroke({ width: 2, color: 0x365045 })
          item.addChild(badge)
        }
      } else attachImage(item, `/art/decor/${lot.id}.svg`, 63, 58)
      objects.addChild(item)
    }
  }

  function drawEffects() {
    const { width, height } = app.screen
    const weather = model?.weather ?? 'fireflies'
    const time = model?.reduced ? 0 : effectClock
    weatherOverlay.clear()
    roofEffects.clear()
    const drops = weather === 'rain' ? 29 : 20
    for (let i = 0; i < drops; i++) {
      const base = (i * 89.17 % 167) / 167
      const x = ((base * width + (weather === 'rain' ? time * 23 : Math.sin(i + time * .8) * 9)) % width + width) % width
      const speed = weather === 'rain' ? 92 : weather === 'snow' ? 16 : 3
      const y = ((i * 59.3 % 167) / 167 * height + time * speed) % height
      if (weather === 'rain') {
        weatherOverlay.moveTo(x, y).lineTo(x - 4, y + 11).stroke({ color: 0xd4eaff, width: 1.5, alpha: .54 })
      } else {
        const glow = weather === 'snow' ? .63 : .26 + (Math.sin(i + time * 2) + 1) * .23
        weatherOverlay.circle(x, y, weather === 'snow' ? 1.7 : 1.5)
          .fill({ color: weather === 'snow' ? 0xfafcff : 0xffe88f, alpha: glow })
      }
    }
    for (const [index, roof] of rooftops.entries()) {
      const drift = Math.sin(time * 3 + index) * 3
      const poleX = roof.x - 21
      const poleY = roof.y - 64
      roofEffects.moveTo(poleX, poleY + 16).lineTo(poleX, poleY).stroke({ width: 2, color: 0xf3dfaa })
      roofEffects.poly([poleX, poleY, poleX + 14, poleY + 3 + drift, poleX + 1, poleY + 8]).fill(0xc8a7f4)
      if (roof.chimney) for (let puff = 0; puff < 3; puff++) {
        const age = (time * .63 + puff / 3) % 1
        roofEffects.circle(roof.x + 19 + age * 16, roof.y - 56 - age * 27, 2 + age * 5)
          .fill({ color: model?.daylight ? 0xffffff : 0xc7b8e7, alpha: .47 * (1 - age) })
      }
    }
  }

  function setView(next: MapView) {
    const changedSky = model?.daylight !== next.daylight || model?.weather !== next.weather || model?.reduced !== next.reduced || model?.area !== next.area
    const changedDay = model?.daylight !== next.daylight
    const layoutChanged = model?.layout !== next.layout || model?.area !== next.area
    if (model?.area !== next.area) {
      zoom = 1
      pan = { x: 0, y: 0 }
      playerPosition = project({ x: 1, y: 4 })
      destination = playerPosition
      petPosition = { x: destination.x - 10, y: destination.y + 8 }
    }
    model = next
    size = next.layout.sizes[next.area]
    const localLots = next.layout.lots.filter((lot) => lot.area === next.area)
    if (changedSky) drawSky()
    if (changedDay || layoutChanged) drawGround(next.area, localLots)
    if (layoutChanged) {
      setWalkers(localLots)
      layoutCamera()
    }

    const signature = localLots.filter((lot) => lot.kind === 'shop')
      .map(({ id }) => `${id}:${next.buildings[id]?.level}:${Boolean(next.buildings[id]?.stock)}`).join(',')
    if (layoutChanged || signature !== lotSignature) {
      lotSignature = signature
      renderObjects(localLots, next.buildings)
    }
    if (changedSky || layoutChanged) drawEffects()
    const look = JSON.stringify([next.avatar, next.pet])
    if (look !== appearance) {
      appearance = look
      clear(player)
      clear(pet)
      buildCharacter(player, next.avatar, 36)
      buildPet(pet, next.pet)
    }
  }

  const moveToward = (current: Point, target: Point, fraction: number) => {
    current.x += (target.x - current.x) * fraction
    current.y += (target.y - current.y) * fraction
  }
  app.ticker.add((tick) => {
    const dt = Math.min(tick.deltaMS / 1000, .1)
    const reduced = model?.reduced
    if (!reduced) {
      effectClock += dt
      const frame = Math.floor(effectClock * 16)
      if (frame !== lastEffectFrame) { lastEffectFrame = frame; drawEffects() }
    }
    moveToward(playerPosition, destination, reduced ? 1 : Math.min(1, dt * 4))
    moveToward(petPosition, { x: playerPosition.x - 17, y: playerPosition.y + 9 }, reduced ? 1 : Math.min(1, dt * 3))
    player.position.set(playerPosition.x, playerPosition.y)
    pet.position.set(petPosition.x, petPosition.y)
    for (const walker of walkers) {
      walker.clock += dt
      const count = walker.path.length - 1
      const travel = Math.max(1, count * 1.7)
      const elapsed = walker.clock % (2 * travel + 2.2)
      const progress = elapsed < travel ? elapsed / travel : elapsed < travel + 2.2 ? 1 : 1 - (elapsed - travel - 2.2) / travel
      const offset = reduced ? count : Math.min(count, Math.max(0, progress * count))
      const from = project(walker.path[Math.floor(offset)])
      const to = project(walker.path[Math.min(count, Math.ceil(offset))])
      moveToward(from, to, offset % 1)
      walker.art.position.set(from.x, from.y)
    }
  })
  const onVisibility = () => { if (document.hidden) app.stop(); else app.start() }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    setView,
    setSelection(cell?: Cell, valid = true) {
      hint.clear()
      if (!cell) return
      const point = project(cell)
      diamond(hint, point.x, point.y, .94).fill({ color: valid ? 0xb9f2e2 : 0xfaacb9, alpha: .52 })
        .stroke({ color: valid ? 0xcff9e7 : 0xfec0c8, width: 3 })
    },
    walkTo(cell: Cell) { destination = project(cell) },
    cellAt({ x, y }: Point, hitArtwork = false) {
      if (!model) return
      const scale = world.scale.x
      const px = (x - world.x) / scale / halfWidth
      const py = (y - world.y) / scale / halfHeight
      const view = { x: Math.round((py + px) / 2), y: Math.round((py - px) / 2) }
      if (hitArtwork && !model.layout.lots.some((lot) => lot.area === model!.area && lot.x === view.x && lot.y === view.y)) {
        const px = (x - world.x) / scale
        const py = (y - world.y) / scale
        const hit = model.layout.lots.filter((lot) => {
          if (lot.area !== model!.area || lot.kind === 'road') return false
          const position = project(lot)
          const art = lot.kind === 'shop'
          return Math.abs(px - position.x) <= (art ? 43 : 25) && py >= position.y - (art ? 64 : 44) && py <= position.y
        }).sort((a, b) => b.x + b.y - a.x - a.y)[0]
        if (hit) return { x: hit.x, y: hit.y }
      }
      return onMap(model.layout, { ...view, area: model.area }) ? view : undefined
    },
    panBy(x: number, y: number) { pan = { x: pan.x + x, y: pan.y + y }; layoutCamera() },
    zoomBy(ratio: number, center?: Point) {
      const before = zoom
      zoom = Math.min(3.5, Math.max(.7, zoom * ratio))
      if (center) {
        const shift = zoom / before - 1
        pan = { x: pan.x + (world.x - center.x) * shift,
          y: pan.y + (app.screen.height / 2 + 16 + pan.y - center.y) * shift }
      }
      layoutCamera()
    },
    resetView() { zoom = 1; pan = { x: 0, y: 0 }; layoutCamera() },
    destroy() {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      app.destroy({ removeView: true }, { children: true })
    },
  }
}

export type TownRenderer = Awaited<ReturnType<typeof createTownRenderer>>
