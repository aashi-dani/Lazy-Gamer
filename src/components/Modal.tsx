import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export default function Modal({ title, onDismiss, children }: { title: string; onDismiss: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close() }
  }, [])
  return <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); onDismiss() }}
    onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}>
    <div className="modal-inner">
      <div className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" onClick={onDismiss} aria-label="Close"><Icon name="close" /></button></div>
      {children}
    </div>
  </dialog>
}
