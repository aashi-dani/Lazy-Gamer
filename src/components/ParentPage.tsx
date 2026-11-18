import { useEffect, useState } from 'react'
import { topicNames, type Topic } from '../data/catalog'
import type { TownSave } from '../logic/economy'
import { recentWeeks } from '../logic/playTime'
import { mastery } from '../logic/topicProgress'
import { makePin, matchesPin, readParentPin, saveParentPin, validPin, type LocalPin } from '../store/parentPin'
import { AdultCheck } from './ParentGate'
import { Icon } from './Icon'
import { StarRating } from './cheatCodes/QuestionStatus'
import { localDevice, nativeApp, nativePlatform } from '../native/device'

const formatWeek = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function played(ms: number) {
  const minutes = Math.floor(ms / 60_000)
  if (!minutes) return ms ? 'Under 1 min' : '0 min'
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}

function Report({ town, changePin }: { town: TownSave; changePin: () => void }) {
  const [printMessage, setPrintMessage] = useState('')
  const print = async () => {
    setPrintMessage('')
    try {
      if (nativeApp) await localDevice.printReport()
      else window.print()
    } catch {
      setPrintMessage('This device could not open the print preview.')
    }
  }
  const topics = (Object.entries(topicNames) as [Topic, string][]).map(([topic, name]) => {
    const stats = town.topics[topic]
    const recent = stats?.recent ?? []
    return { name, attempts: stats?.attempts ?? 0, correct: stats?.correct ?? 0, stars: mastery(stats),
      recent: recent.length, accuracy: recent.length ? recent.filter(Boolean).length / recent.length : 0 }
  })
  const ranked = topics.filter(({ recent }) => recent >= 5).sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts)
  const strongest = ranked[0]
  const weakest = ranked.length > 1 && ranked.at(-1)!.accuracy < ranked[0].accuracy ? ranked.at(-1) : undefined
  return <div className="parent-report">
    <div className="parent-print">
      <h2>Lazy Gamer progress summary</h2>
      <p>{town.playerName || 'Shopkeeper'} · Player level {town.playerLevel}</p>
      <dl className="parent-overview">
        <div><dt>Cheat codes cracked</dt><dd>{town.cracked}</dd></div>
        <div><dt>Strongest topic</dt><dd>{strongest?.name ?? 'More answers needed'}</dd></div>
        <div><dt>Most room to practise</dt><dd>{weakest?.name ?? 'No clear difference yet'}</dd></div>
      </dl>
      <section>
        <h3>Time played by week</h3>
        <p>Counts active play on this device. Weeks start on Monday.</p>
        <table><thead><tr><th scope="col">Week starting</th><th scope="col">Time played</th></tr></thead><tbody>
          {recentWeeks(Date.now()).map(({ key, date }) => <tr key={key}><th scope="row">{formatWeek.format(date)}</th>
            <td>{played(town.playTime[key] ?? 0)}</td></tr>)}
        </tbody></table>
      </section>
      <section>
        <h3>Topic mastery</h3>
        <p>Strongest and practice topics use up to 20 recent answers, with at least five answers per topic.</p>
        <table><thead><tr><th scope="col">Topic</th><th scope="col">Stars</th><th scope="col">Solved</th></tr></thead><tbody>
          {topics.map((topic) => <tr key={topic.name}>
            <th scope="row">{topic.name}</th><td><StarRating value={topic.stars} label={topic.name} /></td><td>{topic.correct}</td>
          </tr>)}
        </tbody></table>
      </section>
    </div>
    <div className="parent-tools">
      <button className="button cyan-button" type="button" onClick={print}><Icon name="print" size={19} /> Print summary</button>
      <button className="button outline-button" type="button" onClick={changePin}>Change PIN</button>
    </div>
    {printMessage && <p role="status">{printMessage}</p>}
  </div>
}

type View = 'load' | 'adult' | 'set' | 'verify' | 'report' | 'change' | 'unavailable'

export default function ParentPage({ town }: { town: TownSave }) {
  const [view, setView] = useState<View>('load')
  const [pin, setPin] = useState<LocalPin>()
  const [value, setValue] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState(false)
  const inSetup = view === 'set' || view === 'change'
  useEffect(() => {
    let mounted = true
    void readParentPin().then((saved) => {
      if (!mounted) return
      if (!crypto.subtle && nativePlatform !== 'ios') { setView('unavailable'); return }
      setPin(saved)
      setView(saved ? 'verify' : 'adult')
    }).catch(() => { if (mounted) setView('unavailable') })
    return () => { mounted = false }
  }, [])

  if (view === 'load') return <p role="status">Opening parent settings…</p>
  if (view === 'unavailable') return <p role="status">This device could not open parent settings.</p>
  if (view === 'adult') return <AdultCheck message="A grown-up can set a PIN to open the local progress report."
    label="Set parent PIN" approve={() => setView('set')} />
  if (view === 'report') return <Report town={town} changePin={() => { setMessage(''); setView('change') }} />
  const field = (raw: string) => raw.replace(/\D/g, '').slice(0, 4)
  return <form className="settings-content" onSubmit={async (event) => {
    event.preventDefault()
    if (working || !validPin(value)) return
    if (inSetup && value !== confirmation) { setMessage('The PINs need to match.'); return }
    setWorking(true)
    setMessage('')
    try {
      if (inSetup) {
        const record = await makePin(value)
        await saveParentPin(record)
        setPin(record)
      } else if (!pin || !await matchesPin(value, pin)) {
        setValue('')
        setMessage('That PIN did not match.')
        return
      }
      setValue('')
      setConfirmation('')
      setView('report')
    } catch {
      setMessage('This device could not open parent settings.')
    } finally {
      setWorking(false)
    }
  }}>
    <p>{inSetup ? 'Choose a four-digit PIN for this device.' : 'Enter your four-digit parent PIN.'}</p>
    <label className="profile-field">{inSetup ? 'New PIN' : 'Parent PIN'}
      <input type="password" autoComplete="off" inputMode="numeric" maxLength={4} value={value} data-initial-focus
        onChange={(event) => { setValue(field(event.target.value)); setMessage('') }} />
    </label>
    {inSetup && <label className="profile-field">Confirm PIN
      <input type="password" autoComplete="off" inputMode="numeric" maxLength={4} value={confirmation}
        onChange={(event) => { setConfirmation(field(event.target.value)); setMessage('') }} />
    </label>}
    {message && <p role="alert">{message}</p>}
    <button className="button cyan-button" disabled={!validPin(value) || working || (inSetup && !validPin(confirmation))} type="submit">
      {inSetup ? 'Save PIN' : 'Open parent report'}
    </button>
    {view === 'change' && <button className="button outline-button" type="button" onClick={() => { setValue(''); setConfirmation(''); setView('report') }}>Back to report</button>}
  </form>
}
