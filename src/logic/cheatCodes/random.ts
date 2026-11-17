export function rollInt(min: number, max: number, roll: number) {
  return min + Math.min(max - min, Math.floor(Math.max(0, roll) * (max - min + 1)))
}
