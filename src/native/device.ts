import { Capacitor, registerPlugin } from '@capacitor/core'

type DeviceKey = 'town' | 'parent-pin'

interface LocalDevicePlugin {
  read(options: { key: DeviceKey }): Promise<{ value?: string }>
  write(options: { key: DeviceKey; value: string }): Promise<void>
  hashPin(options: { pin: string; salt: number[] }): Promise<{ hash: string }>
  printReport(): Promise<void>
}

export const nativePlatform = Capacitor.getPlatform()
export const nativeApp = Capacitor.isNativePlatform()
export const localDevice = registerPlugin<LocalDevicePlugin>('LocalDevice')
