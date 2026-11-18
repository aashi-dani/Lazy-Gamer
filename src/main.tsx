import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/nunito/wght.css'
import '@fontsource/press-start-2p/latin-400.css'
import './styles/index.css'
import App from './App'
import { listenForInstall } from './components/InstallGame'
import { useGameStore } from './store/gameStore'
import { saveConflictEvent } from './store/townStorage'
import { nativeApp } from './native/device'

const root = createRoot(document.getElementById('root')!)
root.render(<p className="game-loading" role="status">Opening Sleepy Hollow…</p>)
if (!nativeApp) {
  listenForInstall()
  if (import.meta.env.PROD) registerSW({ immediate: true })
}
window.addEventListener(saveConflictEvent, () => { void useGameStore.persist.rehydrate() })
void Promise.resolve(useGameStore.persist.rehydrate()).finally(() => {
  root.render(<StrictMode><App /></StrictMode>)
})
