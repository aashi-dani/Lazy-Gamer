import { createStore, get, set } from 'idb-keyval'
import { debugSession } from '../logic/debugSession'
import { localDevice, nativeApp, nativePlatform } from '../native/device'

export type LocalPin = { salt: string; hash: string }
const storageKey = 'parent-pin-v1'
let store: ReturnType<typeof createStore> | undefined
let previewPin: LocalPin | undefined
const db = () => store ??= createStore('lazy-gamer-parent', 'settings')
const toHex = (bytes: Uint8Array) => Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
const fromHex = (hex: string) => Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))

export const validPin = (pin: string) => /^\d{4}$/.test(pin)

export async function makePin(pin: string, salt = crypto.getRandomValues(new Uint8Array(16))): Promise<LocalPin> {
  if (!validPin(pin)) throw new Error('A four digit PIN is required')
  if (nativePlatform === 'ios' && !crypto.subtle) {
    const { hash } = await localDevice.hashPin({ pin, salt: Array.from(salt) })
    return { salt: toHex(salt), hash }
  }
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 180_000 }, key, 256)
  return { salt: toHex(salt), hash: toHex(new Uint8Array(bits)) }
}

export async function matchesPin(pin: string, saved: LocalPin) {
  if (!validPin(pin)) return false
  const candidate = await makePin(pin, fromHex(saved.salt))
  let difference = 0
  for (let index = 0; index < saved.hash.length; index++) difference |= candidate.hash.charCodeAt(index) ^ saved.hash.charCodeAt(index)
  return difference === 0
}

export async function readParentPin() {
  if (debugSession && previewPin) return previewPin
  const data = nativeApp ? (await localDevice.read({ key: 'parent-pin' })).value : undefined
  const record = nativeApp ? data && JSON.parse(data) as LocalPin : await get<LocalPin>(storageKey, db())
  if (!record) return undefined
  if (!/^[a-f0-9]{32}$/.test(record.salt) || !/^[a-f0-9]{64}$/.test(record.hash)) throw new Error('PIN record could not be opened')
  return record
}

export async function saveParentPin(record: LocalPin) {
  if (debugSession) {
    previewPin = record
    return
  }
  if (nativeApp) {
    await localDevice.write({ key: 'parent-pin', value: JSON.stringify(record) })
    return
  }
  await set(storageKey, record, db())
}
