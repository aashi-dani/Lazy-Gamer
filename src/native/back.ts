import { App } from '@capacitor/app'
import { useEffect, useRef } from 'react'
import { nativePlatform } from './device'

const overlays = new Set<() => void>()
const views = new Set<() => void>()

export function useAndroidBackAction(action: (() => void) | undefined, layer: 'overlay' | 'view' = 'view') {
  const latest = useRef(action)
  latest.current = action
  const active = Boolean(action)
  useEffect(() => {
    if (!active || nativePlatform !== 'android') return
    const handlers = layer === 'overlay' ? overlays : views
    const dismiss = () => latest.current?.()
    handlers.add(dismiss)
    return () => { handlers.delete(dismiss) }
  }, [active, layer])
}

export function useAndroidBackButton(returnToTown: (() => void) | undefined) {
  const latest = useRef(returnToTown)
  latest.current = returnToTown
  useEffect(() => {
    if (nativePlatform !== 'android') return
    let active = true
    const subscription = App.addListener('backButton', () => {
      if (!active) return
      const back = Array.from(overlays).at(-1) ?? Array.from(views).at(-1) ?? latest.current
      if (back) back()
      else void App.minimizeApp()
    })
    return () => {
      active = false
      void subscription.then((listener) => listener.remove())
    }
  }, [])
}
