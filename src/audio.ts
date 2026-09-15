let context: AudioContext | null = null
let enabled = true
let volume = .35
export function configureAudio(on: boolean, level: number) { enabled = on; volume = level }
export function unlockAudio() {
  try { context ??= new AudioContext(); void context.resume() } catch { /* Audio is optional on unsupported browsers. */ }
}
export function sound(kind: 'water' | 'plant' | 'coin' | 'buy' | 'win' | 'tap') {
  if (!enabled || !context || volume === 0) return
  const notes = { water: [660, 880], plant: [180, 290], coin: [988, 1319, 1568], buy: [523, 659, 784], win: [523, 659, 784, 1046, 784, 1046, 1319], tap: [440] }[kind]
  notes.forEach((f, i) => {
    const osc = context!.createOscillator(), gain = context!.createGain()
    const at = context!.currentTime + i * .07
    osc.type = kind === 'water' ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(f, at)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(volume * .15, at + .008)
    gain.gain.exponentialRampToValueAtTime(.001, at + .16)
    osc.connect(gain); gain.connect(context!.destination)
    osc.start(at); osc.stop(at + .18)
    osc.onended = () => { osc.disconnect(); gain.disconnect() }
  })
}
