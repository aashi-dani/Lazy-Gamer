import { useEffect, useState } from 'react'

type InstallPrompt = Event & { prompt(): Promise<unknown>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let pending: InstallPrompt | undefined
let offer: ((prompt?: InstallPrompt) => void) | undefined

export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    pending = event as InstallPrompt
    offer?.(pending)
  })
  window.addEventListener('appinstalled', () => {
    pending = undefined
    offer?.()
  })
}

export default function InstallGame() {
  const [prompt, setPrompt] = useState(pending)
  const [show, setShow] = useState(false)
  useEffect(() => {
    offer = setPrompt
    return () => { offer = undefined }
  }, [])
  const standalone = matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone
  if (standalone) return null
  if (prompt) return <button type="button" className="button outline-button" onClick={async () => {
    pending = undefined
    setPrompt(undefined)
    try { await prompt.prompt(); await prompt.userChoice } catch { /* The browser owns the prompt. */ }
  }}>Install Lazy Gamer</button>

  const ua = navigator.userAgent
  const safari = (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
    && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  if (!safari) return null
  return <div className="install-game">
    <button type="button" className="button outline-button" aria-expanded={show} onClick={() => setShow(!show)}>Install on iPhone or iPad</button>
    {show && <ol>
      <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9H5v12h14V9h-3M12 16V3M8 7l4-4 4 4" /></svg>In Safari, tap <strong>Share</strong>.</li>
      <li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" /></svg>Tap <strong>Add to Home Screen</strong>. Turn on <strong>Open as Web App</strong> if shown, then tap <strong>Add</strong>.</li>
    </ol>}
  </div>
}
