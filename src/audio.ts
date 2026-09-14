export class GameAudio {
  private ctx: AudioContext | null = null;
  muted = false;
  unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  tone(frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.025, end = frequency * 0.6) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now + duration);
  }
  fire() { this.tone(110, 0.09, 'triangle', 0.06, 36); this.tone(700, 0.035, 'square', 0.014, 130); }
  hit(target: string | null) { const frequency = target === 'clock' ? 220 : target === 'ward' ? 294 : 650; this.tone(frequency, 0.45, 'sine', 0.035, frequency * 0.99); this.tone(frequency * 2.76, 0.2, 'sine', 0.012); }
  upgrade() { [196, 233, 294].forEach((f, i) => setTimeout(() => this.tone(f, 0.9, 'sine', 0.055, f), i * 130)); }
  alarm() { this.tone(73, 1.2, 'sine', 0.055, 69); this.tone(151, 0.9, 'triangle', 0.02, 145); }
  dispose() { if (this.ctx) void this.ctx.close(); }
}
