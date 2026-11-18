import { lazy, Suspense, useState } from 'react'
import { exportTown, importTown, saveCodeLimit } from '../logic/save'
import type { TownSave } from '../logic/economy'
import { useGameStore } from '../store/gameStore'
import { nativeApp } from '../native/device'
import HoldButton from './HoldButton'
import InstallGame from './InstallGame'
import Modal from './Modal'
import { BandPicker } from './Onboarding'
import PrivacyPolicy from './PrivacyPolicy'

const ParentPage = lazy(() => import('./ParentPage'))

function Toggle({ label, enabled, toggle }: { label: string; enabled: boolean; toggle: () => void }) {
  return <button type="button" className="setting-toggle" role="switch" aria-label={label} aria-checked={enabled} onClick={toggle}>
    <strong>{label}</strong>
    <span className="switch-status">{enabled ? 'On' : 'Off'}</span>
    <span className="switch-track" aria-hidden="true"><span /></span>
  </button>
}

function SaveTransfer({ town, restore }: { town: TownSave; restore: (town: TownSave) => void }) {
  const [backup, setBackup] = useState('')
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [incoming, setIncoming] = useState<TownSave>()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(backup)
      setNote('Save code copied.')
    } catch {
      setNote('Select the save code and copy it.')
    }
  }
  return <div className="settings-content">
    <p>Copy a save code to move your town to another device. Anyone with the code can load a copy of your town.</p>
    {backup ? <>
      <label className="profile-field">Your save code<textarea readOnly value={backup} rows={3} onFocus={(event) => event.target.select()} /></label>
      <button className="button outline-button" onClick={copy}>Copy save code</button>
    </> : <button className="button outline-button" onClick={() => setBackup(exportTown(town))}>Show export code</button>}
    <label className="profile-field">Paste a save code<textarea value={code} rows={3} maxLength={saveCodeLimit} autoCapitalize="none" spellCheck={false}
      onChange={(event) => { setCode(event.target.value); setIncoming(undefined); setNote('') }} /></label>
    {incoming ? <div className="reset-prompt">
      <p>Replace this town with {incoming.playerName ? `${incoming.playerName}'s` : 'the saved'} level {incoming.playerLevel} town?</p>
      <div>
        <button className="button outline-button" onClick={() => setIncoming(undefined)}>Keep my town</button>
        <button className="button danger-button" onClick={() => restore(incoming)}>Replace town</button>
      </div>
    </div> : <button className="button cyan-button" disabled={!code.trim()} onClick={() => {
      const next = importTown(code)
      if (next) { setIncoming(next); setNote('') }
      else setNote('That save code could not be opened. Copy the full code and try again.')
    }}>Check save code</button>}
    {note && <p role="status">{note}</p>}
  </div>
}

export default function Settings({ town, reduced, toggleSound, reset, replay, restore, dismiss }: {
  town: TownSave
  reduced: boolean
  toggleSound: () => void
  reset: () => void
  replay: () => void
  restore: (town: TownSave) => void
  dismiss: () => void
}) {
  const [view, setView] = useState<'main' | 'reset' | 'privacy' | 'save' | 'parent'>('main')
  const store = useGameStore.getState()
  const titles = { main: 'Settings', reset: 'Delete your whole town?', privacy: 'Privacy', save: 'Save code', parent: 'Parent page' }
  const back = () => setView('main')
  return <Modal title={titles[view]} onDismiss={view === 'main' ? dismiss : back}>
    {view === 'reset' && <div className="reset-prompt">
      <p>This erases all coins, shops and progress.</p>
      <p className="muted">Hold Delete for 1.5 seconds.</p>
      <div>
        <button className="button cyan-button" onClick={back} data-initial-focus>Keep my town</button>
        <HoldButton onHold={reset} />
      </div>
    </div>}
    {view === 'privacy' && <div className="settings-content">
      <PrivacyPolicy />
      <button className="button outline-button" onClick={back}>Back to Settings</button>
    </div>}
    {view === 'parent' && <Suspense fallback={<p role="status">Opening parent settings…</p>}><ParentPage town={town} /></Suspense>}
    {view === 'save' && <SaveTransfer town={town} restore={restore} />}
    {view === 'main' && <div className="settings-content">
      {town.band && <>
        <h3>Who is playing?</h3>
        <BandPicker current={town.band} choose={store.setBand} />
      </>}
      <Toggle label="Sound" enabled={town.sound} toggle={toggleSound} />
      {(['musicVolume', 'effectsVolume'] as const).map((key) =>
        <label className="volume-setting" key={key}>
          <span>{key === 'musicVolume' ? 'Music' : 'Sound effects'}</span>
          <input type="range" min="0" max="100" step="1" value={Math.round(town[key] * 100)} onChange={(event) => store.setVolume(key, Number(event.target.value) / 100)} />
          <output>{Math.round(town[key] * 100)}%</output>
        </label>)}
      <Toggle label="Easy-read text" enabled={town.easyRead} toggle={store.toggleEasyRead} />
      <Toggle label="Reduce motion" enabled={reduced} toggle={() => store.setReduceMotion(!reduced)} />
      {town.reduceMotion !== null && <button className="button outline-button" onClick={() => store.setReduceMotion(null)}>Use device motion setting</button>}
      <Toggle label="Always night" enabled={town.alwaysNight} toggle={store.toggleAlwaysNight} />
      {!nativeApp && <InstallGame />}
      {town.tutorialSeen && <button className="button outline-button" onClick={replay}>Replay tutorial</button>}
      <button className="button outline-button" onClick={() => setView('save')}>Export or import town</button>
      <button className="button outline-button" onClick={() => setView('parent')}>Parent page</button>
      <button className="button outline-button" onClick={() => setView('privacy')}>Privacy</button>
      <button className="reset-button" onClick={() => setView('reset')}>Reset town</button>
    </div>}
  </Modal>
}
