import { useState } from 'react'
import type { AgeBand } from '../config/gameConfig'
import { Icon } from './Icon'
import Modal from './Modal'
import { BandPicker } from './Onboarding'

export default function Settings({ band, sound, setBand, toggleSound, reset, dismiss }: {
  band: AgeBand | null
  sound: boolean
  setBand: (band: AgeBand) => void
  toggleSound: () => void
  reset: () => void
  dismiss: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return <Modal title={confirming ? 'Reset your town?' : 'Settings'} onDismiss={dismiss}>
    {confirming ? <div className="reset-prompt">
      <p>Your shops, coins, and progress will be cleared on this device.</p>
      <div>
        <button className="button outline-button" onClick={() => setConfirming(false)} autoFocus>Keep my town</button>
        <button className="button danger-button" onClick={reset}>Reset town</button>
      </div>
    </div> : <div className="settings-content">
      <h3>Who is playing?</h3>
      <BandPicker current={band} choose={setBand} />
      <button className="button outline-button settings-sound" onClick={toggleSound} aria-pressed={sound}>
        <Icon name={sound ? 'sound' : 'mute'} /> Sound {sound ? 'on' : 'off'}
      </button>
      <button className="reset-button" onClick={() => setConfirming(true)}>Reset town</button>
    </div>}
  </Modal>
}
