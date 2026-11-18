import { useState, type ReactNode } from 'react'
import { Icon } from '../Icon'

export default function QuestionActions({ hint, hint2, explanation, misses = 0, feedback, children }: {
  hint: string
  hint2: string
  explanation: string
  misses?: number
  feedback: string
  children: ReactNode
}) {
  const [asked, setAsked] = useState(0)
  const level = Math.min(2, Math.max(asked, misses))
  return <>
    {feedback && <p className="puzzle-hint" role="status">{feedback}</p>}
    {level > 0 && <div className="hint-bubble" role="status">
      <p><strong>Hint {level}</strong> {level === 1 ? hint : hint2}</p>
      {misses >= 2 && <p><strong>Worked answer</strong> {explanation}</p>}
    </div>}
    <div className="puzzle-actions">
      <button type="button" className="button outline-button" disabled={level === 2} onClick={() => setAsked(level + 1)}>
        <Icon name="spark" size={17} /> {level ? 'Another hint' : 'Hint'}
      </button>
      {children}
    </div>
  </>
}
