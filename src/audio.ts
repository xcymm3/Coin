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
  fire() { this.tone(170, 0.06, 'triangle', 0.035, 70); }
  hit(target: string | null) { this.tone(target === 'clock' ? 1100 : target === 'splitter' ? 750 : 320, 0.12, 'square', 0.015); }
  upgrade() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.07, f), i * 90)); }
  alarm() { this.tone(180, 0.28, 'sawtooth', 0.025, 150); }
  dispose() { if (this.ctx) void this.ctx.close(); }
}
