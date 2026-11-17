import { lazy, Suspense, useEffect, useState } from 'react'
import BuildingPanel, { duration } from './components/BuildingPanel'
import CheatCodeList from './components/CheatCodeList'
import CheatCodeModal from './components/CheatCodeModal'
import { Coin, Icon } from './components/Icon'
import Mascot, { MascotArt } from './components/Mascot'
import Onboarding from './components/Onboarding'
import Settings from './components/Settings'
import { playChime } from './components/sound'
import Town from './components/Town'
import WelcomeBack from './components/WelcomeBack'
import { ageBands, buildingIds, buildings, gameConfig, type BuildingId, type CheatId } from './config/gameConfig'
import { advanceTown, storageCap } from './logic/economy'
import { useGameStore } from './store/gameStore'

const ProgressChart = lazy(() => import('./components/ProgressChart'))
type Page = 'town' | 'growth'

export default function App() {
  const stored = useGameStore((state) => state.town)
  const [now, setNow] = useState(Date.now)
  const [selected, setSelected] = useState<BuildingId>()
  const [welcome, setWelcome] = useState(0)
  const [code, setCode] = useState<CheatId>()
  const [settings, setSettings] = useState(false)
  const [page, setPage] = useState<Page>('town')
  const town = advanceTown(stored, Math.max(now, stored.lastAt)).town
  const starter = buildingIds.find((id) => town.buildings[id])
  const active = selected ?? starter
  const activeBuilding = active && town.buildings[active]
  const growth = Boolean(starter && page === 'growth')

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const store = useGameStore.getState
    const resume = () => {
      const time = Date.now()
      const result = advanceTown(store().town, time)
      if (result.made > 0) setWelcome(result.made)
      store().checkpoint(time)
      tick()
    }
    const save = () => store().checkpoint()
    const visibilityChange = () => {
      if (document.visibilityState === 'visible') resume()
      else save()
    }
    const syncSave = (event: StorageEvent) => {
      if (event.key === gameConfig.saveKey && event.newValue !== null) void useGameStore.persist.rehydrate()
    }
    resume()
    const clock = window.setInterval(tick, gameConfig.displayInterval)
    const checkpoint = window.setInterval(() => {
      if (document.visibilityState === 'visible') save()
    }, gameConfig.saveInterval)
    window.addEventListener('pagehide', save)
    window.addEventListener('storage', syncSave)
    document.addEventListener('visibilitychange', visibilityChange)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(checkpoint)
      window.removeEventListener('pagehide', save)
      window.removeEventListener('storage', syncSave)
      document.removeEventListener('visibilitychange', visibilityChange)
    }
  }, [])

  const toggleSound = () => {
    const store = useGameStore.getState()
    if (!store.town.sound) playChime('toggle')
    store.toggleSound()
  }
  const selectPage = (target: Page) => {
    setPage(target)
    window.scrollTo(0, 0)
  }

  return <>
    <div id="game-screen">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="wordmark"><span className="brand-mark"><MascotArt /></span><span>Lazy <strong>Gamer</strong></span></div>
          {starter && <nav className="tabbar" aria-label="Game screens">
            <button type="button" onClick={() => selectPage('town')} aria-current={!growth ? 'page' : undefined}><Icon name="town" size={20} /> Town</button>
            <button type="button" onClick={() => selectPage('growth')} aria-current={growth ? 'page' : undefined}><Icon name="growth" size={20} /> Growth</button>
          </nav>}
          <div className="topbar-actions">
            <span className="coin-purse" aria-label={`${town.coins} coins`}><Coin /><span key={town.coins} className="coin-count">{town.coins.toLocaleString()}</span></span>
            <button className="icon-button" onClick={toggleSound} aria-label={town.sound ? 'Mute sound' : 'Turn on sound'}><Icon name={town.sound ? 'sound' : 'mute'} /></button>
            {starter && <button className="icon-button" onClick={() => setSettings(true)} aria-label="Settings"><Icon name="gear" /></button>}
          </div>
        </div>
      </header>
      <main className={`game-shell${starter ? ' has-town' : ''}`}>
        <div className="town-heading">
          <h1>{growth ? 'Town growth' : 'Your little town'}</h1>
          {starter && !growth && <span className="shop-count"><span aria-hidden="true" />{buildingIds.filter((id) => town.buildings[id]).length} / {buildingIds.length} shops open</span>}
        </div>
        {growth ? <Suspense fallback={<p className="chart-loading" role="status">Mochi is fetching your chart…</p>}><ProgressChart town={town} /></Suspense> :
          <div className="town-layout">
            <div className="town-world">
              <Town town={town} active={active} onSelect={setSelected} preview={!starter} />
              {starter && <Mascot>{activeBuilding ? 'Try a cheat code to give your shop a boost.' : 'Sell stock from your open shops to earn coins.'}</Mascot>}
            </div>
            {starter && active
              ? <BuildingPanel id={active} town={town} onCollect={() => {
                  const store = useGameStore.getState()
                  store.collect(active)
                  if (store.town.sound) playChime('coin')
                }} onUnlock={() => useGameStore.getState().unlock(active)} onUpgrade={() => useGameStore.getState().upgrade(active)}>
                {activeBuilding && <CheatCodeList building={activeBuilding} now={town.lastAt} full={activeBuilding.stock >= storageCap(active, activeBuilding.level)} open={setCode} />}
              </BuildingPanel>
              : <Onboarding band={town.band} chooseBand={(band) => useGameStore.getState().setBand(band)}
                  chooseBuilding={(id) => { useGameStore.getState().start(id); setSelected(id) }} />}
          </div>}
      </main>
    </div>
    {code && activeBuilding && active && town.band && <CheatCodeModal code={code} difficulty={ageBands[town.band].difficulty} dismiss={() => setCode(undefined)}
      claim={(reward) => {
        const store = useGameStore.getState()
        const receipt = store.claimCode(active, reward)
        if (!receipt) return null
        if (store.town.sound) playChime('crack')
        if (reward.code === 'area') return `${reward.rate}× production for ${duration(gameConfig.area.boostDuration)}!`
        if (reward.code === 'fraction') return `+${reward.coins} coins for the order!`
        const unit = receipt.stockAdded === 1 ? buildings[active].stockUnit : buildings[active].stockName
        return `+${receipt.stockAdded} ${unit} ready to collect!`
      }} />}
    {settings && starter && <Settings band={town.band} sound={town.sound} toggleSound={toggleSound}
      setBand={(band) => useGameStore.getState().setBand(band)} dismiss={() => setSettings(false)}
      reset={() => {
        useGameStore.getState().reset()
        setSettings(false)
        setSelected(undefined)
        setWelcome(0)
        setCode(undefined)
        selectPage('town')
      }} />}
    {welcome > 0 && !code && !settings && <WelcomeBack stock={welcome} dismiss={() => setWelcome(0)} />}
  </>
}
