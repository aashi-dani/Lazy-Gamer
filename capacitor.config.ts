import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aashidani.lazygamer',
  appName: 'Lazy Gamer',
  webDir: 'dist',
  backgroundColor: '#252340',
  plugins: {
    SystemBars: { style: 'DARK' },
  },
}

export default config
