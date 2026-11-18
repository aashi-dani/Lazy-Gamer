import { useState } from 'react'
import { newQuestionSeed } from '../logic/cheatCodes/random'
import { parentQuestion } from '../logic/placement'
import HoldButton from './HoldButton'
import Modal from './Modal'

export function AdultCheck({ message, label, approve }: { message: string; label: string; approve: () => void }) {
  const [question] = useState(() => parentQuestion(newQuestionSeed()))
  const [held, setHeld] = useState(false)
  const [value, setValue] = useState('')
  const [issue, setIssue] = useState(false)
  return held ? <form className="settings-content" onSubmit={(event) => {
    event.preventDefault()
    if (Number(value) === question.answer && value.trim()) approve()
    else setIssue(true)
  }}>
    <label className="profile-field">{question.text}<input value={value} inputMode="numeric" data-initial-focus onChange={(event) => {
      setValue(event.target.value); setIssue(false)
    }} /></label>
    {issue && <p role="status">Try the calculation again.</p>}
    <button className="button cyan-button" type="submit">{label}</button>
  </form> : <div className="settings-content">
    <p>{message}</p>
    <HoldButton duration={3_000} label="Hold to continue" onHold={() => setHeld(true)} />
  </div>
}

export default function ParentGate({ dismiss, approve }: { dismiss: () => void; approve: () => void }) {
  return <Modal title="For a grown-up" onDismiss={dismiss}>
    <AdultCheck message="This link opens a page outside Lazy Gamer." label="Open link" approve={approve} />
  </Modal>
}
