import { townAtmosphere } from './logic/atmosphere'
import { CoinFlight, Confetti, useReducedMotion, type Flight } from './components/motion'
import { usePlayTime } from './components/usePlayTime'
import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent } from 'react'
import BuildingPanel, { duration } from './components/BuildingPanel'
import CheatCodeList from './components/CheatCodeList'
import CheatCodeModal from './components/CheatCodeModal'
import DebugPanel from './components/DebugPanel'
import Friends from './components/Friends'
import Wardrobe from './components/Wardrobe'
import { Coin, Icon } from './components/Icon'
import Mascot, { MascotArt } from './components/Mascot'
import Modal from './components/Modal'
import Onboarding from './components/Onboarding'
import Settings from './components/Settings'
import { configureAudio, playSound, refreshAudioVisibility, unlockAudio } from './components/sound'
import { Guide } from './components/Guide'
import ParentGate from './components/ParentGate'
import { petEvolutionLevels } from './data/profile'
import { biomeIds, biomes, expansionLevel } from './data/world'
import { guide } from './data/guide'
import { getSaveProblem, saveConflictEvent, saveProblemEvent } from './store/townStorage'
import Town from './components/Town'
import Activities from './components/world/Activities'
import Journal from './components/world/Journal'
import WelcomeBack from './components/WelcomeBack'
import { availableUnlocks, buildingIds, buildings, cheats, gameConfig, startingShop, supportsCheat, tiersForCheat, type BuildingId, type CheatId } from './config/gameConfig'
import { coinsForLevel, selectTier, type Tier } from './logic/difficulty'
import { advanceTown, storageCap, type TownSave } from './logic/economy'
import { dailyCode, localDay, type DailyOffer } from './logic/topicProgress'
import { useGameStore } from './store/gameStore'
import { useAndroidBackButton } from './native/back'
import { debugSession } from './logic/debugSession'
import type { Spot } from './logic/townLayout'

const TownBuilder = lazy(() => import('./components/world/TownBuilder'))
const ProgressChart = lazy(() => import('./components/ProgressChart'))
const phoneQuery = '(max-width: 767px)'
type Page = 'town' | 'growth' | 'wardrobe' | 'friends' | 'activities' | 'journal'
type Play = { id: number; code: CheatId; shop: BuildingId; tier: Tier; seed: number; debug: boolean; guided?: 'reward' | 'practice';
  practice?: boolean; daily?: DailyOffer }

function usePhoneLayout() {
  const [phone, setPhone] = useState(() => matchMedia(phoneQuery).matches)
  useEffect(() => {
    const query = matchMedia(phoneQuery)
    const update = (event: MediaQueryListEvent) => setPhone(event.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return phone
}

export default function App() {
  const stored = useGameStore((state) => state.town)
  const [now, setNow] = useState(Date.now)
  const reduced = useReducedMotion(stored.reduceMotion)
  const { daylight, weather } = townAtmosphere(now, stored.alwaysNight)
  const [flight, setFlight] = useState<Flight>()
  const coinCounter = useRef<HTMLSpanElement>(null)
  const flightId = useRef(0)
  usePlayTime()
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduced)
    return () => { delete document.documentElement.dataset.reduceMotion }
  }, [reduced])
  useEffect(() => {
    if (reduced) setFlight(undefined)
  }, [reduced])
  const [selected, setSelected] = useState<BuildingId>()
  const [shopSpot, setShopSpot] = useState<Spot>()
  const [welcome, setWelcome] = useState<Partial<Record<BuildingId, number>>>()
  const [celebration, setCelebration] = useState<{ from: number; to: number }>()
  const [outbound, setOutbound] = useState<URL>()
  const [storageNotice, setStorageNotice] = useState(getSaveProblem)
  const [tip, setTip] = useState(0)
  const [placementOpen, setPlacementOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const previousLevel = useRef(stored.playerLevel)
  const [tutorialRun, setTutorialRun] = useState(0)
  const [play, setPlay] = useState<Play>()
  const [shopOpen, setShopOpen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [page, setPage] = useState<Page>('town')
  const playCounter = useRef(0)
  const phone = usePhoneLayout()
  const debug = debugSession
  const town = advanceTown(stored, Math.max(now, stored.lastAt)).town
  const starter = buildingIds.find((id) => town.buildings[id])
  const ready = Boolean(town.band && town.tutorialSeen)
  const active = selected ?? starter
  const activeBuilding = active && town.buildings[active]
  const debugShop = activeBuilding ? active : starter
  const inTown = !ready || page === 'town'
  useAndroidBackButton(inTown ? undefined : () => selectPage('town'))
  const growth = ready && page === 'growth'
  const today = localDay(now)
  const dailyDone = town.daily.lastDay >= today
  const dailyTopic = town.daily.offer?.day === today && supportsCheat(town.daily.offer.cheat, town.band, town.playerLevel) ? town.daily.offer.cheat : dailyCode(today, town.playerLevel, town.band)
  const level = town.playerLevel

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const resume = () => {
      const { town, checkpoint } = useGameStore.getState()
      const time = Date.now()
      const result = advanceTown(town, time)
      if (result.made > 0) {
        setWelcome(result.produced)
        checkpoint(time)
      } else if (time < town.lastAt) checkpoint(time)
      tick()
    }
    const visibilityChange = () => {
      refreshAudioVisibility()
      if (!document.hidden) resume()
    }
    const saveProblem = () => setStorageNotice(getSaveProblem())
    const saveConflict = () => setStorageNotice('Lazy Gamer is open somewhere else. This window is loading the most recent saved town.')
    resume()
    const clock = window.setInterval(tick, gameConfig.displayInterval)
    window.addEventListener(saveProblemEvent, saveProblem)
    window.addEventListener(saveConflictEvent, saveConflict)
    document.addEventListener('visibilitychange', visibilityChange)
    return () => {
      window.clearInterval(clock)
      window.removeEventListener(saveProblemEvent, saveProblem)
      window.removeEventListener(saveConflictEvent, saveConflict)
      document.removeEventListener('visibilitychange', visibilityChange)
    }
  }, [])

  useEffect(() => {
    const soundTap = (event: Event) => {
      unlockAudio()
      if (event.target instanceof Element && event.target.closest('button:not(:disabled)')) playSound('tap')
    }
    const keyboard = () => unlockAudio()
    document.addEventListener('click', soundTap, true)
    document.addEventListener('keydown', keyboard)
    return () => {
      document.removeEventListener('click', soundTap, true)
      document.removeEventListener('keydown', keyboard)
    }
  }, [])

  useEffect(() => {
    const from = previousLevel.current
    const to = stored.playerLevel
    previousLevel.current = to
    if (to > from) {
      setCelebration({ from, to })
      playSound('level-up')
    }
  }, [stored.playerLevel])

  const puzzleOpen = Boolean(play) || placementOpen || activityOpen
  const track = puzzleOpen ? 'focus' : celebration ? 'celebration' : daylight ? 'calm-day' : 'night'
  useEffect(() => {
    configureAudio({ sound: stored.sound, musicVolume: stored.musicVolume, effectsVolume: stored.effectsVolume },
      track, puzzleOpen)
  }, [stored.sound, stored.musicVolume, stored.effectsVolume, track, puzzleOpen])

  useEffect(() => {
    if (!ready || !inTown || puzzleOpen || settings || shopOpen) return
    let timer: number
    const schedule = () => {
      window.clearTimeout(timer)
      if (!document.hidden) timer = window.setTimeout(() => {
        setTip((index) => (index + 1) % guide.tips.length)
        schedule()
      }, 3 * 60_000)
    }
    const events = ['pointerdown', 'keydown', 'wheel', 'visibilitychange']
    for (const event of events) document.addEventListener(event, schedule, { passive: true })
    schedule()
    return () => {
      window.clearTimeout(timer)
      for (const event of events) document.removeEventListener(event, schedule)
    }
  }, [ready, inTown, puzzleOpen, settings, shopOpen])

  const toggleSound = () => useGameStore.getState().toggleSound()
  const selectPage = (target: Page) => {
    setShopOpen(false)
    setPage(target)
    window.scrollTo(0, 0)
  }
  const openCode = (code: CheatId, shop: BuildingId, tier?: Tier) => {
    const building = town.buildings[shop]
    if (!building || !town.band || (tier === undefined ? !supportsCheat(code, town.band, town.playerLevel) : !tiersForCheat(code).includes(tier))) return
    const difficulty = tier ?? selectTier(town.band, level, town.topics[cheats[code].topic]?.offset)
    const isDebug = tier !== undefined
    const practice = !isDebug && ((building.cooldowns[code] ?? 0) > town.lastAt
      || (code !== 'fraction' && building.stock >= storageCap(shop, building.level)))
    playSound('door-chime')
    setPlay({ id: ++playCounter.current, code, shop, tier: difficulty, debug: isDebug, practice,
      seed: useGameStore.getState().nextQuestion(code, difficulty, !isDebug) })
  }
  const openGuided = () => {
    const id = starter ?? startingShop
    const shop = town.buildings[id]
    const practice = town.guidedSeen || !shop || shop.stock >= storageCap(id, shop.level) || (shop.cooldowns.macro ?? 0) > town.lastAt
    playSound('door-chime')
    setPlay({ id: ++playCounter.current, code: 'macro', shop: id, tier: 1, debug: false, guided: practice ? 'practice' : 'reward',
      seed: useGameStore.getState().nextQuestion('macro', 1) })
  }
  const openDaily = () => {
    const daily = useGameStore.getState().openDaily()
    if (!daily) return
    setShopOpen(false)
    playSound('door-chime')
    setPlay({ id: ++playCounter.current, code: daily.cheat, shop: starter ?? startingShop, tier: daily.tier, seed: daily.seed, debug: false, daily })
  }
  const replay = () => {
    setSettings(false)
    setTutorialRun((run) => run + 1)
    useGameStore.getState().resetTutorial()
    selectPage('town')
  }
  const restoreTown = (replacement?: TownSave) => {
    const store = useGameStore.getState()
    previousLevel.current = replacement?.playerLevel ?? 1
    if (replacement) store.replace(replacement)
    else store.reset()
    setTutorialRun((run) => run + 1)
    setSettings(false)
    setSelected(undefined)
    const produced = replacement && advanceTown(replacement, Date.now())
    setWelcome(produced && produced.made > 0 ? produced.produced : undefined)
    setCelebration(undefined)
    setPlay(undefined)
    selectPage('town')
  }
  const shopPanel = active && <BuildingPanel id={active} town={town} onCollect={(event) => {
    const from = event.currentTarget.getBoundingClientRect()
    const balance = useGameStore.getState().town.coins
    useGameStore.getState().collect(active)
    const received = useGameStore.getState().town.coins - balance
    if (!received) return
    playSound('coin')
    const counter = coinCounter.current?.getBoundingClientRect()
    if (!reduced && counter) setFlight({
      from: { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      to: { x: counter.left + counter.width / 2, y: counter.top + counter.height / 2 },
      value: received, id: ++flightId.current,
    })
  }} onUnlock={() => {
    useGameStore.getState().unlock(active, shopSpot)
    if (useGameStore.getState().town.buildings[active]) playSound('unlock')
  }} onUpgrade={() => useGameStore.getState().upgrade(active)}>
    {activeBuilding && <CheatCodeList building={activeBuilding} level={town.playerLevel} band={town.band} now={town.lastAt}
      full={activeBuilding.stock >= storageCap(active, activeBuilding.level)} open={(id) => openCode(id, active)} />}
  </BuildingPanel>

  const lastThreshold = coinsForLevel(level)
  const nextThreshold = coinsForLevel(level + 1)
  const levelProgress = Math.max(0, Math.min(nextThreshold - lastThreshold, town.lifetimeCoinsEarned - lastThreshold))
  const worldUnlocks = [
    { name: 'Town decorations', unlockLevel: 4 }, { name: 'Market Rush', unlockLevel: 5 },
    { name: 'Land expansion', unlockLevel: expansionLevel },
    ...biomeIds.slice(1).map((area) => ({ name: biomes[area].name, unlockLevel: biomes[area].level })),
  ]
  const unlocked = celebration ? [...availableUnlocks(celebration.from, celebration.to, town.buildings, town.band),
    ...worldUnlocks.filter(({ unlockLevel }) => unlockLevel > celebration.from && unlockLevel <= celebration.to)]
    .sort((a, b) => a.unlockLevel - b.unlockLevel) : []
  const selectShop = (id: BuildingId, spot?: Spot) => {
    setSelected(id)
    setShopSpot(spot)
    setShopOpen(true)
    playSound('door-chime')
  }
  const playOpen = Boolean(play) || activityOpen
  const guardLink = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return
    const link = event.target.closest<HTMLAnchorElement>('a[href]')
    if (!link) return
    const url = new URL(link.href, location.href)
    if (url.origin === location.origin) return
    event.preventDefault()
    if (event.type !== 'contextmenu' && (url.protocol === 'https:' || url.protocol === 'http:')) setOutbound(url)
  }
  return <div className={town.easyRead ? 'easy-read' : undefined} onClickCapture={guardLink} onAuxClickCapture={guardLink} onContextMenuCapture={guardLink}>
    <div id="game-screen">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="wordmark"><span className="brand-mark"><MascotArt /></span><span>Lazy <strong>Gamer</strong></span></div>
          {ready && <nav className="tabbar" aria-label="Game screens">
            <button type="button" onClick={() => selectPage('town')} aria-current={inTown ? 'page' : undefined}><Icon name="town" size={20} /><span>Town</span></button>
            <button type="button" onClick={() => selectPage('growth')} aria-current={growth ? 'page' : undefined}><Icon name="growth" size={20} /><span>Growth</span></button>
            <button type="button" onClick={() => selectPage('wardrobe')} aria-current={page === 'wardrobe' ? 'page' : undefined}><Icon name="wardrobe" size={20} /><span>Wardrobe</span></button>
            <button type="button" onClick={() => selectPage('friends')} aria-current={page === 'friends' ? 'page' : undefined}><Icon name="friends" size={20} /><span>Friends</span></button>
            {phone && <button type="button" onClick={() => setSettings(true)}><Icon name="gear" size={20} /><span>Settings</span></button>}
          </nav>}
          <div className="topbar-actions">
            {ready && <div className="player-level">
              <span>Level {level}</span>
              <progress aria-label={`Progress toward level ${level + 1}`} value={levelProgress} max={nextThreshold - lastThreshold} />
            </div>}
            <span className="coin-purse" ref={coinCounter} aria-label={`${town.coins} coins`}><Coin /><span key={town.coins} className="coin-count">{town.coins.toLocaleString()}</span></span>
            {!phone && <button className="icon-button" onClick={toggleSound} aria-label={town.sound ? 'Mute sound' : 'Turn on sound'}
              title={town.sound ? 'Mute sound' : 'Turn on sound'}><Icon name={town.sound ? 'sound' : 'mute'} /></button>}
            {(!phone || !ready) && <button className="icon-button" onClick={() => setSettings(true)} aria-label="Settings" title="Settings"><Icon name="gear" /></button>}
          </div>
        </div>
      </header>
      <main className={`game-shell${ready ? ' has-town' : ''}`}>
        {storageNotice && <p className="save-notice" role="status">{storageNotice}</p>}
        <div className="town-heading">
          <h1>{ready ? { town: 'Your little town', growth: 'Town growth', wardrobe: 'Wardrobe', friends: 'Friends', activities: 'Activities', journal: 'Town journal' }[page] : 'Your little town'}</h1>
          {ready && inTown && <span className="shop-count"><span aria-hidden="true" />{buildingIds.filter((id) => town.buildings[id]).length} / {buildingIds.length} shops open</span>}
        </div>
        {growth ? <Suspense fallback={<p className="chart-loading" role="status">{town.pet.name} is fetching your chart…</p>}><ProgressChart town={town} /></Suspense> :
          ready && page === 'wardrobe' ? <Wardrobe town={town} /> : ready && page === 'friends' ? <Friends town={town} daylight={daylight} weather={weather} reduced={reduced} /> :
          ready && page === 'activities' ? <Activities town={town} now={now} openTown={() => selectPage('town')} onActive={setActivityOpen} /> :
          ready && page === 'journal' ? <Journal town={town} /> : <div className={`town-layout${ready && phone ? ' mobile-town' : ''}`}>
            <div className="town-world">
              {ready ? <Suspense fallback={<p className="world-loading" role="status">Opening your town map…</p>}>
                <TownBuilder town={town} active={active} openShop={selectShop} daylight={daylight} weather={weather} reduced={reduced} />
              </Suspense> : <Town town={town} preview />}
              {ready && <>
                <div className="world-shortcuts">
                  <button className="button outline-button" onClick={() => selectPage('activities')}><Icon name="spark" size={18} /> Activities</button>
                  <button className="button outline-button" onClick={() => selectPage('journal')}><Icon name="book" size={18} /> Town journal</button>
                </div>
                <Mascot pet={town.pet}>{guide.tips[tip]}</Mascot>
                <section className="daily-card" aria-label="Daily Challenge">
                  <div><h2><Icon name="calendar" size={20} /> Daily Challenge</h2>
                    <p>{dailyDone ? 'Complete for today' : cheats[dailyTopic].name}{town.daily.streak > 0 ? ` · Streak of ${town.daily.streak}` : ''}</p></div>
                  <button className="button cyan-button" onClick={openDaily} disabled={dailyDone}>{dailyDone ? 'Done' : 'Play'}</button>
                </section>
              </>}
            </div>
            {ready ? !phone && shopPanel : <Onboarding key={tutorialRun} town={town} hasShop={Boolean(starter) || town.guidedSeen} openCheat={openGuided} onPuzzleChange={setPlacementOpen} />}
          </div>}
        {debug && <DebugPanel band={town.band} setBand={(band) => {
          const store = useGameStore.getState()
          store.setBand(band)
          if (!starter && !ready) { store.start(); store.finishTutorial(true) }
        }} level={level} onLevel={(next) => {
          previousLevel.current = next
          useGameStore.getState().debugLevel(next)
        }} shop={debugShop}
          open={(code, tier) => { if (debugShop) openCode(code, debugShop, tier) }}
          addCoins={() => useGameStore.getState().debugCoins()}
          stock={(fill) => { if (debugShop) useGameStore.getState().debugStock(debugShop, fill) }}
          resetTutorial={replay} />}
      </main>
    </div>
    {phone && inTown && ready && active && shopOpen && !play && !settings && !welcome && !celebration && !outbound &&
      <Modal title={buildings[active].name} shop onDismiss={() => setShopOpen(false)}>{shopPanel}</Modal>}
    {play && (town.buildings[play.shop] || play.daily || play.guided === 'practice') && <CheatCodeModal key={play.id} code={play.code} tier={play.tier} initialSeed={play.seed}
      nextSeed={() => useGameStore.getState().nextQuestion(play.code, play.tier, !play.debug)}
      daily={Boolean(play.daily)} practice={play.practice} dismiss={() => setPlay(undefined)}
      guided={play.guided ? { name: town.playerName || 'shopkeeper', practice: play.guided === 'practice' } : undefined}
      attempt={(correct) => {
        if (!play.debug && play.guided !== 'practice') useGameStore.getState().answer(play.code, play.tier, correct)
        playSound(correct ? 'correct' : 'gentle-wrong')
      }}
      claim={(reward, index, complete) => {
        const store = useGameStore.getState()
        if (play.daily) {
          const bonus = store.claimDaily(play.daily)
          return bonus ? `+${bonus} coins for today’s challenge!` : 'Daily Challenge solved.'
        }
        if (play.practice) return complete ? 'Practice code cracked!' : 'Practice order complete.'
        if (play.guided === 'practice') {
          store.finishTutorial(true)
          return 'Practice code cracked!'
        }
        const receipt = store.claimCode(play.shop, reward, { play: play.id, index, complete, debug: play.debug, guided: play.guided === 'reward' })
        if (!receipt) return null
        const extra = receipt.multiplier > 1 ? ' · +25% variety bonus' : receipt.multiplier < 1 ? ' · Half reward for the third repeat' : ''
        if (reward.code === 'fraction') return `+${receipt.coins} coins for the order!${extra}`
        if (reward.code !== 'macro') return `Skipped ${duration(receipt.skippedMs)} of production!${extra}`
        const unit = receipt.stockAdded === 1 ? buildings[play.shop].stockUnit : buildings[play.shop].stockName
        return `+${receipt.stockAdded} ${unit} ready to collect!${extra}`
      }} />}
    {settings && <Settings town={town} reduced={reduced} toggleSound={toggleSound} dismiss={() => setSettings(false)}
      replay={replay} reset={() => restoreTown()} restore={restoreTown} />}
    {ready && welcome && !playOpen && !settings && !outbound && <WelcomeBack stock={welcome} player={town.playerName}
      pet={town.pet.name} dismiss={() => setWelcome(undefined)} />}
    {ready && celebration && !welcome && !playOpen && !settings && !outbound && <Modal title={`You reached level ${celebration.to}!`} onDismiss={() => setCelebration(undefined)}>
      <div className="welcome-content level-celebration">
        {!reduced && <Confetti />}
        <Guide face="excited">{guide.level(celebration.to)}</Guide>
        {petEvolutionLevels.some((threshold) => threshold > celebration.from && threshold <= celebration.to)
          && <p>{town.pet.name} evolved! Take a look in your Wardrobe.</p>}
        {unlocked.length > 0 && <>
          <p>{guide.unlock}</p>
          <ul className="unlocks">{unlocked.map(({ name, unlockLevel }) => <li key={name}>{name} <strong>Level {unlockLevel}</strong></li>)}</ul>
        </>}
        <button className="button gold-button" onClick={() => setCelebration(undefined)}>Back to town</button>
      </div>
    </Modal>}
    {flight && !reduced && <CoinFlight key={flight.id} flight={flight} done={() => setFlight(undefined)} />}
    {outbound && <ParentGate dismiss={() => setOutbound(undefined)} approve={() => { window.open(outbound.href, '_blank', 'noopener,noreferrer'); setOutbound(undefined) }} />}
  </div>
}
