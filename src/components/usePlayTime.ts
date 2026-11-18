import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

const idleMs = 90_000

export function usePlayTime() {
  useEffect(() => {
    let since = Date.now()
    let activeUntil = since
    let foreground = !document.hidden && document.hasFocus()
    function flush(now: number) {
      const end = Math.min(now, activeUntil)
      if (foreground && end > since) useGameStore.getState().addPlayTime(since, end)
      since = now
    }
    const input = () => {
      const now = Date.now()
      if (!foreground || now > activeUntil || now < since) flush(now)
      foreground = !document.hidden
      activeUntil = now + idleMs
    }
    const visibility = () => {
      flush(Date.now())
      foreground = !document.hidden && document.hasFocus()
      if (!foreground) activeUntil = since
    }
    const away = () => {
      flush(Date.now())
      foreground = false
      activeUntil = since
    }
    const timer = window.setInterval(() => flush(Date.now()), 15_000)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('pointerdown', input, true)
    document.addEventListener('keydown', input, true)
    window.addEventListener('focus', visibility)
    window.addEventListener('blur', away)
    window.addEventListener('pagehide', away)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('pointerdown', input, true)
      document.removeEventListener('keydown', input, true)
      window.removeEventListener('focus', visibility)
      window.removeEventListener('blur', away)
      window.removeEventListener('pagehide', away)
      away()
    }
  }, [])
}
