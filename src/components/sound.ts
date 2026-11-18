import { haptic } from './motion'
import type { TownSave } from '../logic/economy'

export type MusicTrack = 'calm-day' | 'night' | 'focus' | 'celebration'

const notes = {
  tap: [523],
  coin: [784, 1047],
  correct: [523, 659, 784],
  'gentle-wrong': [440, 392],
  'level-up': [523, 659, 784, 1047],
  unlock: [659, 784, 988],
  'door-chime': [659, 523],
  'pet-happy': [659, 880, 988],
}

let context: AudioContext | undefined
let effects: GainNode | undefined
let music: GainNode | undefined
let loop: AudioBufferSourceNode | undefined
let startTime = 0
let offset = 0
const decoded = new Map<MusicTrack, Promise<AudioBuffer>>()
let settings: Pick<TownSave, 'sound' | 'musicVolume' | 'effectsVolume'> = { sound: true, musicVolume: .45, effectsVolume: .65 }
let track: MusicTrack = 'night'
let ducked = false
let currentTrack: MusicTrack | undefined
const tracks: MusicTrack[] = ['calm-day', 'night', 'focus', 'celebration']
const available = new Set<MusicTrack>(__MUSIC_TRACKS__)

function stopLoop() {
  if (!loop || !context) return
  offset = (offset + context.currentTime - startTime) % loop.buffer!.duration
  loop.stop()
  loop.disconnect()
  loop = undefined
}

function loadTrack(name: MusicTrack, audio: AudioContext) {
  let pending = decoded.get(name)
  if (!pending) {
    pending = fetch(`/audio/${name}.mp3`).then((response) => {
      if (!response.ok) throw new Error('Music track unavailable')
      return response.arrayBuffer()
    }).then((bytes) => audio.decodeAudioData(bytes))
    decoded.set(name, pending)
  }
  return pending
}

function refresh() {
  if (!context || !effects || !music) return
  const audio = context
  const destination = music
  const audible = settings.sound && !document.hidden
  const requested = available.has(track) ? track : tracks.find((choice) => available.has(choice))
  effects.gain.setTargetAtTime(audible ? settings.effectsVolume : 0, audio.currentTime, .025)
  music.gain.setTargetAtTime(audible ? settings.musicVolume * (ducked ? .28 : 1) : 0, audio.currentTime, .15)
  if (requested !== currentTrack) {
    stopLoop()
    offset = 0
    currentTrack = requested
  }
  if (!audible || !requested || settings.musicVolume === 0) {
    stopLoop()
    return
  }
  if (loop) return
  void loadTrack(requested, audio).then((buffer) => {
    if (loop || currentTrack !== requested || document.hidden || !settings.sound || !settings.musicVolume) return
    loop = audio.createBufferSource()
    loop.buffer = buffer
    loop.loop = true
    loop.connect(destination)
    startTime = audio.currentTime
    loop.start(0, offset)
  }).catch(() => { decoded.delete(requested) })
}

export function unlockAudio() {
  if (!context) {
    const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Audio) return
    try {
      context = new Audio()
      effects = context.createGain()
      music = context.createGain()
      effects.connect(context.destination)
      music.connect(context.destination)
      for (const name of tracks) {
        if (!available.has(name)) console.warn(`Lazy Gamer music is missing /audio/${name}.mp3`)
      }
    } catch { return }
  }
  if (context.state === 'suspended') void context.resume().catch(() => undefined)
  refresh()
}

export function configureAudio(preferences: typeof settings, nextTrack: MusicTrack, inPuzzle: boolean) {
  settings = preferences
  track = nextTrack
  ducked = inPuzzle
  refresh()
}

export function refreshAudioVisibility() {
  if (!document.hidden && settings.sound && context?.state === 'suspended') void context.resume().catch(() => undefined)
  refresh()
}

export function playSound(kind: keyof typeof notes) {
  if (kind === 'coin' || kind === 'correct' || kind === 'level-up' || kind === 'unlock') haptic(kind)
  if (!context || !effects || !settings.sound || document.hidden || !settings.effectsVolume) return
  const audio = context
  const destination = effects
  const start = audio.currentTime
  notes[kind].forEach((hz, index) => {
    const time = start + .085 * index
    const oscillator = audio.createOscillator()
    const envelope = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = hz
    envelope.gain.setValueAtTime(.001, time)
    envelope.gain.exponentialRampToValueAtTime(kind === 'tap' ? .045 : .14, time + .012)
    envelope.gain.exponentialRampToValueAtTime(.001, time + .16)
    oscillator.connect(envelope).connect(destination)
    oscillator.start(time)
    oscillator.stop(time + .17)
  })
}
