import { useEffect, useState } from 'react'
import { Coin } from './Icon'

export function useReducedMotion(preference: boolean | null) {
  const [device, setDevice] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = (event: MediaQueryListEvent) => setDevice(event.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return preference ?? device
}

export type Flight = { from: { x: number; y: number }; to: { x: number; y: number }; value: number; id: number }

export function CoinFlight({ flight, done }: { flight: Flight; done: () => void }) {
  return <div className="coin-flight" aria-hidden="true"
    style={{ '--from-x': `${flight.from.x}px`, '--from-y': `${flight.from.y}px`,
      '--move-x': `${flight.to.x - flight.from.x}px`, '--move-y': `${flight.to.y - flight.from.y}px` } as React.CSSProperties}>
    {Array.from({ length: 5 }, (_, index) => <span key={index} onAnimationEnd={index === 4 ? done : undefined}
      style={{ '--n': index, '--spread': `${(index - 2) * 16}px` } as React.CSSProperties}><Coin size={21} /></span>)}
    <strong>+{flight.value}</strong>
  </div>
}

export function Confetti() {
  const colors = ['#ffdc83', '#9ee1ed', '#d4a8ef', '#efa4b3', '#b8e392']
  return <div aria-hidden="true" className="level-confetti">
    {Array.from({ length: 17 }, (_, index) => <i key={index} style={{
      '--hue': colors[index % colors.length], '--x': `${(index * 127 % 350) - 175}px`, '--y': `${34 + index * 23 % 185}px`,
      '--spin': `${index * 101 % 620 - 310}deg`, '--delay': `${index % 5 * 43}ms`,
    } as React.CSSProperties} />)}
  </div>
}

export function haptic(kind: 'coin' | 'correct' | 'level-up' | 'unlock') {
  if (!/Android/i.test(navigator.userAgent) || document.hidden || typeof navigator.vibrate !== 'function'
    || document.documentElement.dataset.reduceMotion === 'true') return
  try { navigator.vibrate(kind === 'level-up' ? [22, 34, 25] : kind === 'correct' ? 16 : 12) } catch { /* A device can decline vibration. */ }
}
