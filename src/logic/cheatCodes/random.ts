export function questionRandom(seed: number) {
  let state = seed >>> 0
  return (min: number, max: number) => {
    state = (state + 0x6d2b79f5) | 0
    let bits = Math.imul(state ^ (state >>> 15), state | 1)
    bits ^= bits + Math.imul(bits ^ (bits >>> 7), bits | 61)
    const roll = ((bits ^ (bits >>> 14)) >>> 0) / 4_294_967_296
    return min + Math.floor(roll * (max - min + 1))
  }
}

export function newQuestionSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0]
}
