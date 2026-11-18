type Expression = 'happy' | 'thinking' | 'excited' | 'waving'

export const guide = {
  intro: [
    { face: 'waving', text: "Hi! I'm Mayor Juno, and this is Sleepy Hollow, the sleepiest town in the world." },
    { face: 'thinking', text: 'Nobody here likes waiting 2 hours for coconuts. So we use cheat codes!' },
    { face: 'excited', text: 'Cheat codes are secret tricks. Crack one and your stall restocks right away.' },
    { face: 'happy', text: 'First, what should I call you?' },
  ] satisfies { face: Expression; text: string }[],
  avatar: (name: string) => `Nice to meet you, ${name}! Let's make you look amazing.`,
  pet: 'Every mayor needs a sidekick. Pick your pet, and give it a name!',
  placement: 'Quick warm-up! Five tiny puzzles so I know where to start.',
  band: 'You can try my suggestion or pick a different band. You can change it later in Settings.',
  firstCheat: "Tap a cheat code. I'll show you how to crack it.",
  macro: 'Count the rows, then count the crates in one row. Multiply those numbers and tap Ship the crates.',
  correct: (name: string) => `You did it, ${name}! Look at that stock appear!`,
  practice: (name: string) => `You did it, ${name}! You're ready to crack more cheat codes.`,
  wrong: 'Almost! Want a hint?',
  level: (level: number) => `Level ${level}! You're becoming the best shop owner in the valley!`,
  unlock: 'Something new is waiting for you. Take a look!',
  welcome: (name: string, pet: string) => `Welcome back, ${name}! ${pet} kept the shops running.`,
  tips: [
    'Tap a shop to collect stock or crack a code.',
    'Try a cheat code to give your shop a boost.',
    'Sell stock from your open shops to earn coins.',
    'Check Town growth to see how many coins your shops have earned.',
    'A full shop starts making more stock after you collect it.',
  ],
} as const
