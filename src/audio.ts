export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: OscillatorNode | null = null;
  private isMuted = false;
  private automated = false;
  get unlocked() { return this.automated || this.ctx !== null }
  get muted() { return this.isMuted }
  set muted(value: boolean) { this.isMuted = value; if (this.master && this.ctx) this.master.gain.setTargetAtTime(value ? 0 : 0.7, this.ctx.currentTime, .03) }
  unlock() {
    if (navigator.webdriver) { this.automated = true; return }
    if (!this.ctx) {
      this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.master.gain.value = this.isMuted ? 0 : .7; this.master.connect(this.ctx.destination);
      this.hum = this.ctx.createOscillator(); const filter = this.ctx.createBiquadFilter(), level = this.ctx.createGain(); this.hum.type = 'sawtooth'; this.hum.frequency.value = 43; filter.type = 'lowpass'; filter.frequency.value = 92; level.gain.value = .018; this.hum.connect(filter); filter.connect(level); level.connect(this.master); this.hum.start();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  private tone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = .035, pan = 0, end = frequency) {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime, osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), panner = this.ctx.createStereoPanner();
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration); panner.pan.value = pan;
    osc.connect(gain); gain.connect(panner); panner.connect(this.master); osc.start(now); osc.stop(now + duration);
  }
  fire() { this.tone(840, .045, 'square', .035, 0, 190); this.tone(115, .12, 'triangle', .05, 0, 48) }
  hit(target: string) { if (target === 'moon') { this.tone(52, 1.2, 'sawtooth', .09, 0, 24); return } const machine = target.includes('machine'); this.tone(machine ? 284 : 171, machine ? .38 : .18, machine ? 'sine' : 'triangle', .035, target.includes('cantor') ? .5 : target.includes('penitent') ? -.5 : 0, machine ? 282 : 80) }
  step() { this.tone(68, .11, 'triangle', .028, Math.random() > .5 ? .35 : -.35, 42) }
  whisper(side = 1) { this.tone(118, .8, 'sine', .018, side, 84) }
  machine() { [220, 330, 440].forEach((f, i) => setTimeout(() => this.tone(f, .45, 'sine', .026, 0, f), i * 90)) }
  purify() { this.tone(196, .8, 'sine', .045, -.25, 392); this.tone(294, .9, 'sine', .03, .25, 588) }
  dispose() { if (this.hum) try { this.hum.stop() } catch { /* already stopped */ } const context = this.ctx; this.hum = null; this.ctx = null; this.master = null; this.automated = false; return context ? context.close().catch(() => {}) : Promise.resolve() }
}
