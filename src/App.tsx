import { useEffect, useState } from 'react'
import CheatCodeList from './components/CheatCodeList'
import CheatCodeModal from './components/CheatCodeModal'
import BuildingPanel, { duration } from './components/BuildingPanel'
import { Coin, Icon } from './components/Icon'
import Mascot, { MascotArt } from './components/Mascot'
import Onboarding from './components/Onboarding'
import Town from './components/Town'
import WelcomeBack from './components/WelcomeBack'
import { ageBands, buildingIds, buildings, gameConfig, type BuildingId, type CheatId } from './config/gameConfig'
import { advanceTown, storageCap } from './logic/economy'
import { useGameStore } from './store/gameStore'

export default function App() {
  const stored = useGameStore((state) => state.town)
  const [now, setNow] = useState(Date.now)
  const [selected, setSelected] = useState<BuildingId>()
  const [welcome, setWelcome] = useState(0)
  const [code, setCode] = useState<CheatId>()
  const town = advanceTown(stored, Math.max(now, stored.lastAt)).town
  const starter = buildingIds.find((id) => town.buildings[id])
  const active = selected ?? starter
  const activeBuilding = active && town.buildings[active]

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
    resume()
    const clock = window.setInterval(tick, gameConfig.displayInterval)
    const checkpoint = window.setInterval(() => {
      if (document.visibilityState === 'visible') save()
    }, gameConfig.saveInterval)
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', visibilityChange)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(checkpoint)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', visibilityChange)
    }
  }, [])

  return <>
    <header className="topbar">
      <div className="topbar-inner">
        <div className="wordmark"><span className="brand-mark"><MascotArt /></span><span>Lazy <strong>Gamer</strong></span></div>
        <div className="topbar-actions">
          <span className="coin-purse" aria-label={`${town.coins} coins`}><Coin /><span>{town.coins.toLocaleString()}</span></span>
          <button className="icon-button" onClick={() => useGameStore.getState().toggleSound()} aria-label={town.sound ? 'Mute sound' : 'Turn on sound'}><Icon name={town.sound ? 'sound' : 'mute'} /></button>
        </div>
      </div>
    </header>
    <main className="game-shell">
      <div className="town-heading">
        <div><h1>Your little town</h1><p>{starter ? 'Collect stock, crack codes, and watch it grow.' : 'A quiet night for a little town to wake up.'}</p></div>
        {starter && <span className="shop-count"><span aria-hidden="true" />{buildingIds.filter((id) => town.buildings[id]).length} / {buildingIds.length} shops open</span>}
      </div>
      <div className="town-layout">
        <div className="town-world">
          <Town town={town} active={active} onSelect={setSelected} preview={!starter} />
          {starter && <Mascot>Tap a shop to see what’s in stock.</Mascot>}
        </div>
        {starter && active
          ? <BuildingPanel id={active} town={town} onCollect={() => useGameStore.getState().collect(active)} onUnlock={() => useGameStore.getState().unlock(active)} onUpgrade={() => useGameStore.getState().upgrade(active)}>
            {activeBuilding && <CheatCodeList building={activeBuilding} now={town.lastAt} full={activeBuilding.stock >= storageCap(active, activeBuilding.level)} open={setCode} />}
          </BuildingPanel>
          : <Onboarding band={town.band} chooseBand={(band) => useGameStore.getState().setBand(band)}
              chooseBuilding={(id) => { useGameStore.getState().start(id); setSelected(id) }} />}
      </div>
    </main>
    {code && active && town.band && <CheatCodeModal code={code} difficulty={ageBands[town.band].difficulty} dismiss={() => setCode(undefined)}
      claim={(reward) => {
        const store = useGameStore.getState()
        const before = store.town.buildings[active]?.stock ?? 0
        if (!store.claimCode(active, reward)) return null
        if (reward.code === 'area') return `${reward.rate}× production for ${duration(gameConfig.area.boostDuration)}!`
        const added = (useGameStore.getState().town.buildings[active]?.stock ?? 0) - before
        const unit = added === 1 ? buildings[active].stockUnit : buildings[active].stockName
        return `+${added} ${unit} ready to collect!`
      }} />}
    {welcome > 0 && <WelcomeBack stock={welcome} dismiss={() => setWelcome(0)} />}
  </>
}
