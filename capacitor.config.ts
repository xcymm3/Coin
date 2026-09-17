import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.moonlitgarden.game',
  appName: '月光奇植园',
  webDir: 'dist',
  backgroundColor: '#112b35',
  android: { backgroundColor: '#112b35' },
  plugins: { SystemBars: { insetsHandling: 'native' } },
}

export default config
