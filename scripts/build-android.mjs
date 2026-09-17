import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const env = { ...process.env, PAGES_BASE_PATH: '/' }
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
run('npm', ['run', 'build'])
run('npx', ['--no-install', 'cap', 'sync', 'android'])
run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['assembleDebug', '--console=plain'], join(root, 'android'))
const output = join(root, '.artifacts', 'apk')
mkdirSync(output, { recursive: true })
const apk = join(output, 'moonlit-garden-1.0-portrait-debug.apk')
copyFileSync(join(root, 'android/app/build/outputs/apk/debug/app-debug.apk'), apk)
console.log(`\nAPK: ${apk}`)
