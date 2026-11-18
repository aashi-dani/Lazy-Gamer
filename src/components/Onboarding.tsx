import { useEffect, useState } from 'react'
import { ageBands, cheats, type AgeBand } from '../config/gameConfig'
import { guide } from '../data/guide'
import { introAvatarOptions, defaultPet, nickname, pets, type Avatar, type PetType } from '../data/profile'
import { newQuestionSeed } from '../logic/cheatCodes/random'
import { tiers, type Tier } from '../logic/difficulty'
import type { TownSave } from '../logic/economy'
import { placementQuestion, recommendedBand } from '../logic/placement'
import { useGameStore } from '../store/gameStore'
import { useAndroidBackAction } from '../native/back'
import NumberPad from './cheatCodes/NumberPad'
import { AvatarArt, Guide, PetArt } from './Guide'
import { Icon } from './Icon'
import { MascotArt } from './Mascot'
import { playSound, unlockAudio } from './sound'

export function BandPicker({ current, choose }: { current: AgeBand | null; choose: (band: AgeBand) => void }) {
  const bands = Object.keys(ageBands) as AgeBand[]
  return <div className="band-list">
    {bands.map((band, i) => <button key={band} type="button" className={`band-choice band-${band}`} onClick={() => choose(band)} aria-pressed={current ? current === band : undefined}>
      <span className="band-emblem"><Icon name={i === 0 ? 'moon' : i === 1 ? 'spark' : 'upgrade'} size={22} /></span>
      <span><strong>{ageBands[band].name}</strong><small>Ages {ageBands[band].ages}</small></span>
      <Icon name={current === band ? 'check' : 'chevron'} size={17} />
    </button>)}
  </div>
}

type Stage = 'splash' | 'intro' | 'name' | 'avatar' | 'pet' | 'placement' | 'band' | 'cheat'

export default function Onboarding({ town, hasShop, openCheat, onPuzzleChange }: {
  town: TownSave
  hasShop: boolean
  openCheat: () => void
  onPuzzleChange: (active: boolean) => void
}) {
  const [stage, setStage] = useState<Stage>(() => hasShop && !town.guidedSeen ? 'cheat' : 'splash')
  const [intro, setIntro] = useState(0)
  const [name, setName] = useState(town.playerName)
  const [avatar, setAvatar] = useState(town.avatar)
  const [pet, setPet] = useState(town.pet)
  const [issue, setIssue] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [highestTier, setHighestTier] = useState<Tier | 0>(0)
  const [seed] = useState(newQuestionSeed)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'correct' | 'hint'>()
  const [missed, setMissed] = useState(false)
  const [band, setBand] = useState<AgeBand | null>(null)
  const store = useGameStore.getState()
  useAndroidBackAction(stage === 'splash' || stage === 'cheat' ? undefined : () => {
    if (stage === 'intro' && intro > 0) {
      setIntro(intro - 1)
      return
    }
    const previous = { intro: 'splash', name: 'intro', avatar: 'name', pet: 'avatar', placement: 'pet', band: 'placement' } as const
    setIssue('')
    setStage(previous[stage])
  })
  useEffect(() => {
    if (stage !== 'placement') return
    onPuzzleChange(true)
    return () => onPuzzleChange(false)
  }, [stage, onPuzzleChange])
  const question = placementQuestion(tiers[questionIndex], seed + questionIndex)
  const suggested = recommendedBand(highestTier)
  const nextQuestion = () => {
    if (questionIndex === tiers.length - 1) {
      setBand(suggested)
      setStage('band')
    } else {
      setQuestionIndex(questionIndex + 1)
      setMissed(false)
      setResult(undefined)
      setValue('')
    }
  }
  const check = () => {
    if (!value) return
    if (Number(value) === question.answer) {
      if (!missed && tiers[questionIndex] > highestTier) setHighestTier(tiers[questionIndex])
      playSound('correct')
      setResult('correct')
    } else {
      playSound('gentle-wrong')
      setResult('hint')
      setMissed(true)
    }
  }

  return <section className="side-panel onboarding wizard" aria-label="Welcome to Sleepy Hollow">
    {stage === 'splash' && <>
      <div className="onboarding-cap"><MascotArt /></div>
      <h2>Sleepy Hollow</h2>
      <button className="button cyan-button" onClick={() => { unlockAudio(); setStage('intro') }}>Tap to start</button>
    </>}
    {stage === 'intro' && <>
      <Guide face={guide.intro[intro].face}>{guide.intro[intro].text}</Guide>
      <button className="button cyan-button" onClick={() => intro + 1 === guide.intro.length ? setStage('name') : setIntro(intro + 1)}>Next</button>
    </>}
    {stage === 'name' && <form onSubmit={(event) => {
      event.preventDefault()
      const clean = nickname(name)
      if (!clean) { setIssue('Choose a friendly nickname with up to 12 letters or numbers.'); return }
      store.setProfile({ playerName: clean })
      setIssue('')
      setStage('avatar')
    }}>
      <Guide>{guide.intro.at(-1)?.text}</Guide>
      <label className="profile-field">Your nickname
        <input autoComplete="off" maxLength={12} value={name} onChange={(event) => { setName(event.target.value); setIssue('') }} />
      </label>
      <p className="field-note">Pick a nickname you like. Keep your full name private.</p>
      {issue && <p role="alert">{issue}</p>}
      <button className="button cyan-button" type="submit">Next</button>
    </form>}
    {stage === 'avatar' && <>
      <Guide>{guide.avatar(town.playerName)}</Guide>
      <AvatarArt avatar={avatar} />
      <div className="avatar-fields">
        {(Object.keys(introAvatarOptions) as (keyof typeof introAvatarOptions)[]).map((layer) =>
          <label className="profile-field" key={layer}>{layer}
            <select value={avatar[layer]} onChange={(event) => setAvatar({ ...avatar, [layer]: Number(event.target.value) })}>
              {avatar[layer] >= introAvatarOptions[layer].length && <option value={avatar[layer]}>Keep my current style</option>}
              {introAvatarOptions[layer].map((option, index) => <option value={index} key={option}>{option}</option>)}
            </select>
          </label>)}
      </div>
      <button className="button cyan-button" onClick={() => { store.setProfile({ avatar }); setStage('pet') }}>Next</button>
    </>}
    {stage === 'pet' && <form onSubmit={(event) => {
      event.preventDefault()
      const petName = nickname(pet.name || defaultPet.name)
      if (!petName) { setIssue('Choose a friendly pet name with up to 12 letters or numbers.'); return }
      store.setProfile({ pet: { ...pet, name: petName } })
      setIssue('')
      setStage('placement')
    }}>
      <Guide>{guide.pet}</Guide>
      <div className="pet-picker" role="group" aria-label="Pick a pet">
        {(Object.keys(pets) as PetType[]).map((type) => <button type="button" key={type} className="button outline-button"
          aria-pressed={pet.type === type} onClick={() => { setPet({ ...pet, type, evolution: type === town.pet.type ? town.pet.evolution : 0 }); playSound('pet-happy') }}>
          <PetArt type={type} />{pets[type]}
        </button>)}
      </div>
      <label className="profile-field">Pet name
        <input autoComplete="off" maxLength={12} placeholder={defaultPet.name} value={pet.name} onChange={(event) => { setPet({ ...pet, name: event.target.value }); setIssue('') }} />
      </label>
      {issue && <p role="alert">{issue}</p>}
      <button className="button cyan-button" type="submit">Next</button>
    </form>}
    {stage === 'placement' && <>
      {questionIndex === 0 && <Guide face="thinking">{guide.placement}</Guide>}
      <h2>Puzzle {questionIndex + 1} of 5</h2>
      <p className="placement-question">{question.text}</p>
      {result === 'correct' ? <>
        <p role="status" className="text-lime">You got it!</p>
        <button className="button cyan-button" onClick={nextQuestion}>{questionIndex === 4 ? 'See my band' : 'Next puzzle'}</button>
      </> : <>
        {result === 'hint' && <p role="status" className="practice-note">{guide.wrong} {question.hint}</p>}
        <NumberPad value={value} setValue={setValue} label="Your answer" maxDigits={2} />
        <div className="wizard-actions">
          <button className="button cyan-button" disabled={!value} onClick={check}>Check answer</button>
          {missed && <button className="button outline-button" onClick={nextQuestion}>Move on</button>}
        </div>
      </>}
    </>}
    {stage === 'band' && <>
      <Guide face="excited">{guide.band}</Guide>
      <h2>Try {ageBands[suggested].name}</h2>
      <BandPicker current={band} choose={setBand} />
      <button className="button cyan-button" onClick={() => {
        store.setBand(band ?? suggested)
        store.start()
        playSound('unlock')
        setStage('cheat')
      }}>Confirm band</button>
    </>}
    {stage === 'cheat' && <>
      <Guide face="excited">{guide.firstCheat}</Guide>
      <button className="button cyan-button" onClick={openCheat}><Icon name="spark" size={20} /> {cheats.macro.name}</button>
    </>}
    {hasShop && town.guidedSeen && <button className="button outline-button tutorial-exit" onClick={() => store.finishTutorial()}>Return to town</button>}
  </section>
}
