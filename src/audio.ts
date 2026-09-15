/** Original 72 BPM garden lullaby. All voices are synthesized locally. */
let context: AudioContext | null = null
let musicBus: GainNode | null = null
let effectsBus: GainNode | null = null
let timer: ReturnType<typeof setInterval> | undefined
let enabled = true, volume = .35, music = true, musicVolume = .3
let nextBeat = 0, beat = 0, lastSound = -1
const beatSeconds = 60 / 72
const chords = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 62]]
const melody = [76, 79, 81, 79, 76, 72, 74, 0, 76, 72, 69, 72, 76, 74, 72, 0, 69, 72, 77, 76, 72, 69, 67, 0, 67, 71, 74, 79, 74, 71, 72, 0]
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12)
function voice(bus: GainNode, hz: number, at: number, duration: number, level: number, type: OscillatorType = 'sine', attack = .018, endHz = hz) {
  if (!context) return
  const osc = context.createOscillator(), gain = context.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(hz, at)
  osc.frequency.exponentialRampToValueAtTime(endHz, at + duration)
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(level, at + attack)
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration)
  osc.connect(gain); gain.connect(bus)
  osc.start(at); osc.stop(at + duration + .03)
  osc.onended = () => { osc.disconnect(); gain.disconnect() }
}
function schedule() {
  if (!context || !musicBus || context.state !== 'running') return
  // Drop missed scheduling windows after device sleep instead of replaying a backlog.
  if (nextBeat < context.currentTime - .25) nextBeat = context.currentTime + .04
  while (nextBeat < context.currentTime + .18) {
    if (music && musicVolume > 0) {
      const chord = chords[Math.floor(beat / 8) % chords.length]
      if (beat % 8 === 0) chord.forEach(n => voice(musicBus!, frequency(n), nextBeat, beatSeconds * 8.5, .018, 'sine', .6))
      const n = chord[[0, 2, 1, 3][beat % 4]] + 12
      voice(musicBus, frequency(n), nextBeat, 2.4, .055, 'sine', .025)
      voice(musicBus, frequency(n) * 2, nextBeat, .8, .008)
      if (beat % 2 === 0) {
        const lead = melody[(beat / 2) % melody.length]
        if (lead) voice(musicBus, frequency(lead), nextBeat + .06, 2.8, .044, 'sine', .07)
      }
    }
    nextBeat += beatSeconds; beat++
  }
}
function applyLevels() {
  if (!context) return
  musicBus?.gain.setTargetAtTime(music ? musicVolume : 0, context.currentTime, .25)
  effectsBus?.gain.setTargetAtTime(enabled ? volume : 0, context.currentTime, .025)
}
export function configureAudio(on: boolean, level: number, bgm = true, bgmLevel = .3) {
  enabled = on; volume = level; music = bgm; musicVolume = bgmLevel; applyLevels()
}
export function unlockAudio() {
  try {
    if (!context) {
      context = new AudioContext()
      musicBus = context.createGain(); effectsBus = context.createGain()
      musicBus.gain.value = 0; effectsBus.gain.value = 0
      const compressor = context.createDynamicsCompressor()
      compressor.threshold.value = -12; compressor.ratio.value = 4
      musicBus.connect(compressor); effectsBus.connect(compressor); compressor.connect(context.destination)
      document.addEventListener('visibilitychange', () => {
        if (!context) return
        if (document.hidden) { clearInterval(timer); timer = undefined; void context.suspend() }
        else void context.resume().then(startScheduler).catch(() => {})
      })
    }
    applyLevels()
    void context.resume().then(startScheduler).catch(() => {})
  } catch { /* Audio is optional on unsupported browsers. */ }
}
function startScheduler() {
  if (!context || document.hidden || timer !== undefined) return
  nextBeat = context.currentTime + .08
  schedule(); timer = setInterval(schedule, 100)
}
export function sound(kind: 'water' | 'plant' | 'coin' | 'buy' | 'win' | 'tap') {
  if (!enabled || !context || !effectsBus || volume === 0 || document.hidden) return
  const now = context.currentTime
  if (now - lastSound < .055) return
  lastSound = now
  if (kind === 'water') {
    ;[0, .06, .13].forEach((offset, i) => voice(effectsBus!, 1050 - i * 190, now + offset, .15, .12, 'sine', .008, 380 + i * 70))
    return
  }
  const notes = { plant: [48, 55, 60], coin: [83, 88, 91], buy: [60, 64, 67, 72], win: [60, 64, 67, 72, 76, 79, 84], tap: [72] }[kind]
  notes.forEach((n, i) => {
    const at = now + i * (kind === 'win' ? .18 : .065)
    voice(effectsBus!, frequency(n), at, kind === 'win' ? 1.6 : .3, .13, kind === 'plant' ? 'triangle' : 'sine')
    if (kind === 'coin' || kind === 'win') voice(effectsBus!, frequency(n) * 2, at, .2, .025)
  })
}
