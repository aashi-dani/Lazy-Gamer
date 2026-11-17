let context: AudioContext | undefined

export function playChime(kind: 'coin' | 'crack' | 'toggle') {
  if (!window.AudioContext) return
  try {
    context ??= new AudioContext()
    const audio = context
    const notes = kind === 'crack' ? [523, 659, 784, 1047] : kind === 'coin' ? [659, 880] : [784]
    void audio.resume().then(() => {
      const start = audio.currentTime
      notes.forEach((frequency, i) => {
        const time = start + i * .07
        const tone = audio.createOscillator()
        const envelope = audio.createGain()
        tone.type = 'sine'
        tone.frequency.value = frequency
        envelope.gain.setValueAtTime(.001, time)
        envelope.gain.exponentialRampToValueAtTime(.095, time + .018)
        envelope.gain.exponentialRampToValueAtTime(.001, time + .2)
        tone.connect(envelope).connect(audio.destination)
        tone.start(time)
        tone.stop(time + .21)
      })
    }).catch(() => { /* The game remains playable when audio is unavailable. */ })
  } catch {
    // Audio output can be unavailable in an embedded browser.
  }
}
