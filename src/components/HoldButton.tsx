import { useEffect, useRef, useState } from 'react'

export default function HoldButton({ onHold, label = 'Delete', duration = 1_500 }: { onHold: () => void; label?: string; duration?: number }) {
  const [progress, setProgress] = useState(0)
  const frame = useRef<number>()
  const startAt = useRef<number>()
  const done = useRef(false)
  const cancel = () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    startAt.current = undefined
    frame.current = undefined
    setProgress(0)
  }
  useEffect(() => {
    const onHide = () => { if (document.hidden) cancel() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', cancel)
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', cancel)
    }
  }, [])

  function start() {
    if (startAt.current !== undefined || done.current) return
    startAt.current = performance.now()
    const tick = (now: number) => {
      if (startAt.current === undefined) return
      const fill = Math.min(1, (now - startAt.current) / duration)
      setProgress(fill)
      if (fill >= 1) {
        done.current = true
        onHold()
      } else frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  return <button type="button" className="button danger-button hold-delete" aria-label={`${label}. Hold for ${duration / 1_000} seconds.`}
    style={{ '--hold-progress': `${progress * 100}%` } as React.CSSProperties}
    onPointerDown={(event) => {
      if (!event.isPrimary || event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      start()
    }}
    onPointerMove={(event) => {
      if (startAt.current === undefined || !event.currentTarget.hasPointerCapture(event.pointerId)) return
      const { top, right, bottom, left } = event.currentTarget.getBoundingClientRect()
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) cancel()
    }}
    onPointerUp={cancel} onPointerCancel={cancel} onLostPointerCapture={cancel} onBlur={cancel}
    onContextMenu={(event) => event.preventDefault()}
    onKeyDown={(event) => {
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) start() }
    }}
    onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); cancel() } }}>
    <span>{label}</span>
  </button>
}
