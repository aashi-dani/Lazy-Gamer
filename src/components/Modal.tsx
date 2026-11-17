import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from './Icon'

export default function Modal({ title, onDismiss, children }: { title: string; onDismiss: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const previousFocus = document.activeElement
    const screen = document.getElementById('game-screen')
    const previousOverflow = document.body.style.overflow
    if (screen) screen.inert = true
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('button')?.focus()
    return () => {
      if (screen) screen.inert = false
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])
  useEffect(() => {
    if (!ref.current?.contains(document.activeElement)) ref.current?.querySelector('button')?.focus()
  }, [title])
  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onDismiss()
    }
    if (event.key !== 'Tab') return
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled)'))
    const start = controls[0]
    const end = controls.at(-1)
    const focused = document.activeElement
    if (event.shiftKey && (focused === start || !event.currentTarget.contains(focused))) {
      event.preventDefault()
      end?.focus()
    } else if (!event.shiftKey && (focused === end || !event.currentTarget.contains(focused))) {
      event.preventDefault()
      start?.focus()
    }
  }

  return <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}>
    <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={handleKey}>
      <div className="modal-inner">
        <div className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" onClick={onDismiss} aria-label="Close"><Icon name="close" /></button></div>
        {children}
      </div>
    </div>
  </div>
}
