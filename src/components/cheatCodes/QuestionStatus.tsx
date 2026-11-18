import type { ReactNode } from 'react'
import { starsForTier, type Tier } from '../../logic/difficulty'
import { Coin, Icon } from '../Icon'

export function StarRating({ value, label }: { value: number; label: string }) {
  const count = Math.max(0, Math.min(3, value))
  return <span className="star-rating" role="img" aria-label={`${label}: ${count} of 3 stars`}>
    <span aria-hidden="true">{'★'.repeat(count)}{'☆'.repeat(3 - count)}</span>
  </span>
}

export function DifficultyStars({ tier }: { tier: Tier }) {
  return <div className="code-stars" title={`Tier ${tier}`}><StarRating value={starsForTier(tier)} label="Difficulty" /></div>
}

export function ResultBanner({ won, children }: { won: boolean; children: ReactNode }) {
  return <div className={`code-result${won ? ' won' : ''}`} role="status">
    {won && <div className="spark-burst" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => <span key={index}
        style={{ '--ray': `${index * 36}deg`, '--delay': `${index % 3 * 60}ms` } as React.CSSProperties}>
        {index % 3 === 0 ? <Coin /> : <Icon name="spark" size={15} />}</span>)}
      <Icon name="check" size={41} />
    </div>}
    {children}
  </div>
}
