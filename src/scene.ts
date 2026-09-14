import { advance, autoInterval, forgeCost, hit, initialState, registerShot, splitterCost } from './game';
import type { GameState, Target } from './game';
import { GameAudio } from './audio';

const W = 960, H = 620;
const P = {
  black: '#0b100e', wall: '#202a26', wallDark: '#17211e', seam: '#303d32', steel: '#4b5946', lightSteel: '#728065',
  edge: '#8d9573', shadow: '#101711', table: '#394737', tableLight: '#526048', rust: '#775239',
  copper: '#bd7d42', gold: '#edbb71', white: '#e8e3bd', muted: '#a2ad89', green: '#b6cb85',
  red: '#e57551', redDark: '#66382b', orange: '#ed9951', flame: '#f8d784', glass: '#172622', silver: '#c4d6cb',
};
export const targetPoints: Record<Target, { x: number; y: number }> = {
  forge: { x: 265, y: 320 }, clock: { x: 487, y: 278 }, splitter: { x: 709, y: 337 },
};
const bounds: Record<Target, number[]> = { forge: [189, 235, 156, 174], clock: [417, 184, 138, 186], splitter: [616, 267, 182, 153] };
export function targetAt(x: number, y: number): Target | null {
  for (const target of ['forge', 'clock', 'splitter'] as Target[]) {
    const [bx, by, w, h] = bounds[target];
    if (x >= bx && x <= bx + w && y >= by && y <= by + h) return target;
  }
  return null;
}
type Coin = { x: number; y: number; age: number; duration: number; target: Target | null; lane: number; level: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string };
type Floating = { x: number; y: number; text: string; life: number; color: string };

export class Scene {
  state = initialState();
  audio = new GameAudio();
  private ctx: CanvasRenderingContext2D;
  private frame = 0;
  private last = 0;
  private uiElapsed = 0;
  private autoElapsed = 0;
  private lastAlarm = -1;
  private tick = 0;
  private view = 0;
  private mouse = { x: 487, y: 430, inside: false };
  private selected: Target = 'splitter';
  private coins: Coin[] = [];
  private particles: Particle[] = [];
  private floats: Floating[] = [];
  private flashes: Record<Target, number> = { forge: 0, clock: 0, splitter: 0 };
  private recoil = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private canvas: HTMLCanvasElement, private onChange: (s: GameState) => void) {
    this.ctx = canvas.getContext('2d')!;
    canvas.width = W; canvas.height = H;
    canvas.addEventListener('pointermove', this.pointerMove);
    canvas.addEventListener('pointerleave', this.pointerLeave);
    canvas.addEventListener('pointerdown', this.pointerDown);
    document.addEventListener('visibilitychange', this.visibility);
    this.frame = requestAnimationFrame(this.loop);
  }
  start = () => { this.audio.unlock(); this.state = { ...this.state, status: 'playing' }; this.last = 0; this.publish(); };
  restart = () => { this.state = initialState(); this.coins = []; this.particles = []; this.floats = []; this.autoElapsed = 0; this.lastAlarm = -1; this.flashes = { forge: 0, clock: 0, splitter: 0 }; this.start(); };
  pause = () => { if (this.state.status === 'playing') this.state = { ...this.state, status: 'paused' }; else if (this.state.status === 'paused') this.start(); this.publish(); };
  setAutoTarget = (target: Target) => { this.state = { ...this.state, autoTarget: target }; this.publish(); };
  select = (target: Target) => { this.selected = target; this.mouse = { ...targetPoints[target], x: targetPoints[target].x + this.view, inside: true }; };
  fireSelected = () => { const p = targetPoints[this.selected]; this.shoot(p.x, p.y); };
  private publish() { this.onChange({ ...this.state }); }
  private visibility = () => { if (document.hidden && this.state.status === 'playing') this.pause(); };
  private pointerMove = (e: PointerEvent) => {
    const b = this.canvas.getBoundingClientRect();
    this.mouse = { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * H, inside: true };
  };
  private pointerLeave = () => { this.mouse.inside = false; };
  private pointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault(); this.canvas.focus({ preventScroll: true }); this.pointerMove(e);
    this.shoot(this.mouse.x - this.view, this.mouse.y);
  };
  private shoot(x: number, y: number, automatic = false) {
    if (this.state.status !== 'playing' || this.coins.length > 90) return;
    this.audio.unlock();
    const target = targetAt(x, y);
    if (target && !automatic) this.selected = target;
    for (let i = 0; i < this.state.volley; i++) this.coins.push({ x, y, age: -i * 0.045, duration: 0.38, target, lane: (i - (this.state.volley - 1) / 2) * 15, level: this.state.level });
    this.state = registerShot(this.state, this.state.volley); this.recoil = 1; this.audio.fire();
  }
  private impact(coin: Coin) {
    const before = this.state.upgrades;
    this.state = hit(this.state, coin.target);
    const upgraded = this.state.upgrades > before;
    this.audio.hit(coin.target);
    if (coin.target) {
      this.flashes[coin.target] = 1;
      if (this.floats.length < 30) this.floats.push({ x: coin.x, y: coin.y - 40, text: coin.target === 'clock' ? '+1 秒' : `+${2 ** coin.level}`, life: 0.8, color: coin.target === 'clock' ? P.green : P.gold });
    }
    if (upgraded) { this.audio.upgrade(); this.floats.push({ x: coin.x, y: coin.y - 85, text: '改装完成!', life: 1.8, color: P.white }); }
    for (let i = 0; i < (upgraded ? 32 : 7) && this.particles.length < 250; i++) {
      const life = 0.3 + Math.random() * 0.5;
      this.particles.push({ x: coin.x, y: coin.y, vx: (Math.random() - 0.5) * 180, vy: -40 - Math.random() * 150, life, max: life, color: i % 3 ? P.gold : P.white });
    }
    this.publish();
  }
  private loop = (now: number) => {
    const elapsed = this.last ? Math.max(0, (now - this.last) / 1000) : 0;
    const dt = Math.min(elapsed, 0.25);
    this.last = now;
    if (this.state.status === 'playing') {
      this.tick += dt;
      const oldStatus = this.state.status;
      this.state = advance(this.state, elapsed);
      if (this.state.status !== oldStatus) { this.audio.alarm(); this.publish(); }
      this.coins = this.coins.filter(coin => {
        coin.age += dt;
        if (coin.age >= coin.duration) { this.impact(coin); return false; }
        return true;
      });
      this.autoElapsed += dt;
      if (this.state.autoLevel && this.autoElapsed >= autoInterval(this.state)) {
        this.autoElapsed = 0; const p = targetPoints[this.state.autoTarget]; this.shoot(p.x, p.y, true);
      }
      if (this.state.time < 30 && Math.floor(this.tick / 2) !== this.lastAlarm) { this.lastAlarm = Math.floor(this.tick / 2); this.audio.alarm(); }
      for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }
      this.particles = this.particles.filter(p => p.life > 0);
      for (const f of this.floats) { f.life -= dt; f.y -= 28 * dt; }
      this.floats = this.floats.filter(f => f.life > 0);
      for (const key of Object.keys(this.flashes) as Target[]) this.flashes[key] = Math.max(0, this.flashes[key] - dt * 4);
      this.recoil = Math.max(0, this.recoil - dt * 8);
    }
    const desired = this.mouse.inside && !this.reduced ? (this.mouse.x / W - 0.5) * -26 : 0;
    this.view += (desired - this.view) * Math.min(1, dt * 7);
    this.draw();
    this.uiElapsed += dt;
    if (this.uiElapsed >= 0.1) { this.uiElapsed = 0; this.publish(); }
    this.frame = requestAnimationFrame(this.loop);
  };
  private rect(x: number, y: number, w: number, h: number, color: string) { this.ctx.fillStyle = color; this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  private poly(points: number[][], color: string) {
    const c = this.ctx; c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y))); c.closePath(); c.fill();
  }
  private line(x1: number, y1: number, x2: number, y2: number, color: string, width = 2) { const c = this.ctx; c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  private text(text: string, x: number, y: number, size = 12, color = P.muted, align: CanvasTextAlign = 'left') { const c = this.ctx; c.fillStyle = color; c.font = `bold ${size}px "Consolas", "Microsoft YaHei", monospace`; c.textAlign = align; c.fillText(text, Math.round(x), Math.round(y)); }
  private bolt(x: number, y: number) { this.rect(x - 3, y - 3, 7, 7, P.black); this.rect(x - 2, y - 2, 5, 4, P.edge); this.rect(x - 1, y, 3, 1, P.steel); }
  private box(x: number, y: number, w: number, h: number, d = 12, color = P.steel) {
    this.poly([[x, y], [x + d, y - d], [x + w + d, y - d], [x + w, y]], P.lightSteel);
    this.poly([[x + w, y], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], P.wallDark);
    this.rect(x, y, w, h, color); this.rect(x, y, w, 3, P.edge); this.rect(x, y, 3, h, P.tableLight); this.rect(x, y + h - 5, w, 5, P.black);
  }
  private gear(x: number, y: number, r: number, phase: number, color = P.copper) {
    const c = this.ctx; c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(phase);
    for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); this.rect(-4, -r - 3, 8, 8, color); }
    c.fillStyle = color; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = P.black; c.beginPath(); c.arc(0, 0, r * 0.65, 0, Math.PI * 2); c.fill();
    this.rect(-r + 3, -2, r * 2 - 6, 4, color); this.rect(-2, -r + 3, 4, r * 2 - 6, color); this.rect(-3, -3, 6, 6, P.gold); c.restore();
  }
  private coin(x: number, y: number, size: number, phase: number, level = 0) {
    const w = Math.max(3, Math.abs(Math.cos(phase)) * size), col = level === 1 ? P.silver : level >= 2 ? P.flame : P.gold;
    this.rect(x - w / 2, y - size / 2 + 3, w + 2, size - 6, P.rust);
    this.rect(x - w / 2 + 2, y - size / 2, w - 2, size, P.copper);
    this.rect(x - w / 2, y - size / 2 + 3, w, size - 6, col);
    this.rect(x - w / 2 + 3, y - size / 2 + 2, Math.max(2, w - 6), 2, P.white);
    this.rect(x - 2, y - 3, Math.min(4, w - 1), 6, P.rust);
  }
  private background() {
    this.rect(0, 0, W, H, P.black);
    this.ctx.save(); this.ctx.translate(this.view * 0.35, 0);
    this.rect(-30, 0, 1020, 330, P.wallDark);
    for (let row = 0; row < 5; row++) for (let col = -1; col < 9; col++) {
      const x = col * 139 + (row % 2) * 69, y = row * 61;
      this.rect(x + 2, y + 2, 136, 58, row % 3 ? P.wall : P.wallDark);
      this.rect(x + 5, y + 4, 128, 1, P.seam);
    }
    // Heavy shelter door, rivets and inset observation slit.
    this.box(377, 26, 212, 259, 7, P.black);
    this.rect(393, 42, 181, 230, P.steel); this.rect(402, 51, 164, 210, P.wallDark);
    this.rect(410, 59, 147, 191, P.wall); this.rect(478, 57, 5, 194, P.black);
    for (let y = 55; y < 260; y += 33) { this.bolt(398, y); this.bolt(568, y); }
    this.rect(426, 92, 114, 40, P.black); this.rect(432, 97, 102, 26, P.shadow);
    for (let x = 438; x < 534; x += 19) this.rect(x, 97, 4, 26, P.steel);
    this.text('B - 07', 484, 173, 22, P.lightSteel, 'center');
    this.text('KEEP SEALED', 484, 194, 9, P.muted, 'center');
    this.rect(525, 207, 16, 5, P.edge); this.rect(535, 207, 5, 18, P.edge);
    for (const x of [54, 848]) {
      this.rect(x, 0, 22, 304, P.black); this.rect(x + 4, 0, 15, 302, P.steel); this.rect(x + 5, 0, 3, 302, P.lightSteel);
      for (const y of [35, 171, 278]) { this.rect(x - 4, y, 30, 12, P.wallDark); this.bolt(x + 10, y + 5); }
    }
    this.rect(58, 66, 302, 13, P.black); this.rect(58, 68, 302, 7, P.steel); this.rect(64, 69, 290, 2, P.edge);
    this.rect(598, 98, 259, 10, P.black); this.rect(599, 98, 254, 5, P.rust);
    // Wall vent and electrical cabinet.
    this.box(110, 110, 112, 89, 4, P.wallDark);
    for (let i = 0; i < 7; i++) { this.rect(121, 119 + i * 10, 90, 5, P.black); this.rect(121, 124 + i * 10, 90, 1, P.steel); }
    this.box(740, 142, 76, 94, 6, P.steel); this.rect(753, 157, 49, 33, P.black);
    this.text('高压', 777, 179, 14, P.gold, 'center'); this.rect(775, 205, 16, 4, P.copper); this.bolt(747, 229);
    this.rect(248, 123, 60, 72, P.muted); this.rect(251, 126, 54, 66, P.tableLight);
    this.text('注意', 278, 145, 13, P.white, 'center'); this.text('每枚铜币', 278, 164, 8, P.white, 'center'); this.text('都是时间', 278, 177, 8, P.white, 'center');
    // Overhead lamp: stepped light cone keeps the pixel-art edges.
    this.rect(479, 0, 4, 14, P.black); this.box(419, 15, 122, 13, 5, P.steel); this.rect(427, 28, 109, 6, P.flame);
    this.ctx.globalAlpha = 0.035; this.poly([[429, 34], [536, 34], [790, 493], [184, 493]], P.flame); this.ctx.globalAlpha = 1;
    const danger = this.state.time < 30;
    this.rect(641, 33, 47, 28, P.black); this.rect(649, 28, 31, 27, danger ? P.red : P.rust); this.rect(653, 26, 23, 4, danger ? P.orange : P.copper);
    for (let x = 653; x < 680; x += 8) this.rect(x, 30, 2, 22, P.redDark);
    this.rect(641, 56, 47, 5, P.steel);
    if (danger && !this.reduced) { this.ctx.globalAlpha = (Math.sin(this.tick * 4) + 1) * 0.05; this.rect(-30, 0, 1020, 310, P.red); this.ctx.globalAlpha = 1; }
    this.text('SHELTER / 07', 107, 260, 10, P.lightSteel);
    this.ctx.restore();
  }
  private desk() {
    this.poly([[114, 291], [844, 291], [995, 566], [-35, 566]], P.black);
    this.poly([[120, 300], [838, 300], [977, 552], [-17, 552]], P.table);
    this.poly([[132, 307], [827, 307], [942, 526], [22, 526]], P.tableLight);
    this.poly([[140, 313], [820, 313], [930, 520], [30, 520]], P.table);
    // Deterministic small scratches, welds and seams.
    for (let i = 0; i < 150; i++) {
      const x = 120 + ((i * 139) % 730), y = 320 + ((i * 61) % 197);
      this.rect(x, y, 2 + i % 9, 1, i % 3 ? P.tableLight : P.wallDark);
    }
    this.line(379, 310, 345, 527, P.wallDark, 3); this.line(598, 310, 630, 527, P.wallDark, 3);
    this.poly([[-18, 552], [978, 552], [970, 585], [-10, 585]], P.wallDark);
    this.rect(0, 557, 960, 5, P.lightSteel); this.rect(0, 580, 960, 7, P.black);
    for (let i = 0; i < 36; i++) this.poly([[i * 30, 564], [i * 30 + 14, 564], [i * 30 + 5, 578], [i * 30 - 9, 578]], i % 3 ? P.rust : P.tableLight);
    for (const x of [63, 347, 625, 898]) this.bolt(x, 535);
    // Cables connect targets to the same machine.
    const c = this.ctx; c.strokeStyle = P.black; c.lineWidth = 9; c.beginPath(); c.moveTo(275, 398); c.bezierCurveTo(264, 455, 430, 435, 457, 369); c.stroke();
    c.strokeStyle = P.rust; c.lineWidth = 3; c.stroke();
    c.strokeStyle = P.black; c.lineWidth = 8; c.beginPath(); c.moveTo(522, 367); c.bezierCurveTo(560, 428, 718, 451, 715, 407); c.stroke(); c.strokeStyle = P.steel; c.lineWidth = 3; c.stroke();
    // Coin canister and scattered coins.
    this.box(105, 451, 74, 63, 11, P.wallDark); this.rect(108, 447, 68, 12, P.steel);
    this.text('Cu', 142, 487, 20, P.gold, 'center'); this.text('∞', 143, 507, 16, P.muted, 'center');
    for (let i = 0; i < 8; i++) this.coin(166 + (i * 17) % 57, 487 + (i * 13) % 23, 11, i);
    this.box(779, 461, 98, 43, 9, P.wallDark); this.text('B-07', 828, 484, 14, P.muted, 'center'); this.text('应急储备', 828, 499, 9, P.lightSteel, 'center');
  }
  private forge() {
    const s = this.state, glow = this.flashes.forge, progress = s.forge / forgeCost(s);
    this.poly([[181, 405], [333, 405], [362, 419], [199, 425]], P.shadow);
    this.box(187, 380, 154, 21, 15, P.wallDark);
    this.box(204, 248 - glow * 2, 123, 135, 18, P.steel);
    this.box(222, 224, 87, 24, 10, P.wallDark);
    for (let i = 0; i < 6; i++) this.rect(232 + i * 12, 228, 5, 15, P.black);
    this.rect(217, 263, 98, 94, P.rust); this.rect(223, 269, 86, 82, P.black);
    this.rect(228, 275, 76, 70, P.redDark); this.rect(231, 302, 70, 39, P.rust);
    // Open furnace mouth with rising stepped flames.
    for (let i = 0; i < 9; i++) {
      const h = 10 + Math.sin(this.tick * 5 + i * 2) * 8 + progress * 25 + glow * 20;
      this.rect(232 + i * 8, 337 - h, 7, h, i % 2 ? P.orange : P.copper);
      this.rect(234 + i * 8, 337 - h / 2, 3, h / 2, P.flame);
    }
    this.rect(226, 336, 80, 9, P.black);
    for (let i = 0; i < 6; i++) this.rect(230 + i * 13, 325, 5, 19, P.wallDark);
    this.rect(236, 357, 52, 15, P.black); this.text('熔 铸', 262, 369, 10, P.gold, 'center');
    for (const [x, y] of [[211, 258], [319, 258], [211, 375], [319, 375]]) this.bolt(x, y);
    this.box(184, 281, 16, 64, 4, P.wallDark); this.rect(188, 287, 6, 49, P.black);
    this.rect(188, 333 - progress * 45, 6, 4 + progress * 45, P.orange);
    this.gear(337, 363, 12, this.tick * 0.2 + progress * 30, P.rust);
    this.label('01', '铸币熔炉', 266, 434, P.gold);
    this.text(`${s.forge.toLocaleString()} / ${forgeCost(s).toLocaleString()}`, 266, 451, 11, P.muted, 'center');
  }
  private clock() {
    const s = this.state, danger = s.time < 30, col = danger ? P.red : P.green, glow = this.flashes.clock;
    this.poly([[412, 366], [548, 366], [575, 383], [437, 389]], P.shadow);
    this.box(417, 354, 132, 18, 13, P.wallDark);
    this.box(427, 206, 110, 150, 13, P.steel);
    this.box(443, 189, 77, 19, 9, P.wallDark); this.text('EMERGENCY', 482, 203, 8, P.muted, 'center');
    this.rect(437, 220, 90, 60, P.black); this.rect(441, 224, 82, 50, P.glass);
    this.text(String(Math.ceil(s.time)).padStart(3, '0'), 482, 258, 34, col, 'center');
    this.text('SECONDS LEFT', 482, 270, 7, P.lightSteel, 'center');
    for (let i = 0; i < 10; i++) this.rect(442 + i * 8, 284, 5, 4, i < Math.min(10, s.time / 10) ? col : P.black);
    this.rect(439, 294, 85, 48, P.black);
    this.gear(460, 316, 15, -this.tick * 0.18 + s.saved * 0.2, P.copper);
    this.gear(492, 321, 11, this.tick * 0.24 - s.saved * 0.28, P.edge);
    this.rect(514, 297 + glow * 6, 22, 13, glow ? P.gold : P.copper); this.rect(519, 310 + glow * 6, 8, 23 - glow * 6, P.rust);
    for (const [x, y] of [[433, 215], [530, 215], [433, 348], [530, 348]]) this.bolt(x, y);
    this.label('02', '应急发条', 486, 402, col); this.text('命中 +1 秒', 486, 419, 11, P.muted, 'center');
  }
  private splitter() {
    const s = this.state, glow = this.flashes.splitter, filled = Math.floor(s.splitter / splitterCost(s) * 10);
    this.poly([[616, 403], [793, 403], [822, 420], [638, 433]], P.shadow);
    this.box(623, 383, 169, 24, 12, P.wallDark);
    this.box(640, 277, 138, 105, 17, P.steel);
    this.rect(648, 286, 122, 30, P.wallDark); this.text(s.stage >= 2 ? 'AUTO FEED' : 'MULTI FEED', 709, 299, 10, P.muted, 'center');
    this.rect(656, 304, 105, 4, P.black); this.rect(656, 304, Math.max(4, filled * 10.5), 4, P.gold);
    // Physical ten-slot coin cassette.
    this.box(650, 322 + glow * 2, 117, 36, 6, P.black);
    for (let i = 0; i < 10; i++) {
      const x = 656 + i * 10.5;
      this.rect(x, 327 + glow * 2, 7, 25, P.tableLight); this.rect(x + 1, 328 + glow * 2, 4, 21, P.black);
      if (i < filled) { this.rect(x + 1, 330 + glow * 2, 4, 19, P.copper); this.rect(x + 1, 330 + glow * 2, 2, 15, P.gold); }
    }
    for (let i = 0; i < 3; i++) { this.rect(654 + i * 33, 364, 25, 9, P.black); this.rect(657 + i * 33, 366, 19, 4, i < s.volley ? P.green : P.steel); }
    for (let i = 0; i < 2; i++) { this.rect(633, 313 + i * 18, 8, 12, P.copper); this.rect(779, 313 + i * 18, 10, 12, P.rust); }
    this.gear(625, 369, 12, this.tick * 0.25 + s.splitter * 0.3);
    this.bolt(646, 281); this.bolt(772, 377);
    if (s.autoLevel) { this.rect(737, 263, 20, 8, P.green); this.gear(787, 286, 10, this.tick * 2); }
    this.label('03', s.stage >= 2 ? '自动供币' : '机械分流器', 714, 444, P.gold);
    this.text(`${s.splitter} / ${splitterCost(s)}`, 714, 461, 11, P.muted, 'center');
  }
  private label(number: string, name: string, x: number, y: number, color: string) {
    this.rect(x - 67, y - 15, 134, 23, P.wallDark); this.rect(x - 66, y - 14, 25, 21, P.black);
    this.text(number, x - 54, y, 11, color, 'center'); this.text(name, x + 11, y, 12, P.white, 'center');
  }
  private gun() {
    const x = 480 + (this.mouse.x - 480) * 0.035, y = 566 + this.recoil * 7;
    this.poly([[x - 72, 620], [x - 56, y], [x + 54, y], [x + 78, 620]], P.black);
    this.box(x - 44, y - 10, 88, 67, 10, P.steel);
    this.rect(x - 33, y + 7, 64, 41, P.wallDark); this.rect(x - 27, y + 11, 52, 31, P.black);
    this.text(`×${this.state.volley}`, x, y + 33, 21, P.gold, 'center');
    for (let i = 0; i < this.state.volley; i++) {
      const bx = x + (i - (this.state.volley - 1) / 2) * 26;
      this.box(bx - 10, y - 51, 19, 50, 5, P.wallDark); this.rect(bx - 7, y - 48, 13, 4, P.black); this.rect(bx - 6, y - 39, 3, 35, P.copper);
      this.rect(bx - 11, y - 20, 22, 5, P.steel);
    }
    this.rect(x - 32, y - 2, 64, 4, P.copper); this.bolt(x - 36, y + 50); this.bolt(x + 37, y + 50);
  }
  private draw() {
    const c = this.ctx; c.imageSmoothingEnabled = false;
    this.background(); c.save(); c.translate(Math.round(this.view), 0);
    this.desk(); this.forge(); this.clock(); this.splitter();
    const hover = this.mouse.inside ? targetAt(this.mouse.x - this.view, this.mouse.y) : null;
    if (hover && this.state.status === 'playing') {
      const [x, y, w, h] = bounds[hover], col = hover === 'clock' ? P.green : P.gold;
      for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { this.line(cx, cy, cx + 12 * sx, cy, col); this.line(cx, cy, cx, cy + 12 * sy, col); }
    }
    for (const p of this.particles) { c.globalAlpha = p.life / p.max; this.rect(p.x, p.y, 3, 3, p.color); } c.globalAlpha = 1;
    for (const f of this.floats) { c.globalAlpha = Math.min(1, f.life * 3); this.text(f.text, f.x, f.y, f.text.length > 5 ? 12 : 16, f.color, 'center'); } c.globalAlpha = 1;
    c.restore(); this.gun();
    for (const coin of this.coins) {
      if (coin.age < 0) continue;
      const t = coin.age / coin.duration, x = 480 + (coin.x + this.view - 480) * t + coin.lane, baseline = 520 + (coin.y - 520) * t;
      c.globalAlpha = 0.3; this.rect(x - 5, baseline + 8, 12 * (1 - t * 0.4), 3, P.black); c.globalAlpha = 1;
      const y = baseline - Math.sin(t * Math.PI) * 90;
      this.coin(x, y, 24 - t * 11, t * 13 + coin.lane, coin.level);
    }
    if (this.mouse.inside && this.state.status === 'playing') {
      const { x, y } = this.mouse, col = hover ? P.gold : P.muted;
      this.line(x - 10, y, x - 4, y, P.black, 4); this.line(x + 4, y, x + 10, y, P.black, 4); this.line(x, y - 10, x, y - 4, P.black, 4); this.line(x, y + 4, x, y + 10, P.black, 4);
      this.line(x - 10, y, x - 4, y, col); this.line(x + 4, y, x + 10, y, col); this.line(x, y - 10, x, y - 4, col); this.line(x, y + 4, x, y + 10, col); this.rect(x - 1, y - 1, 2, 2, col);
    }
    // Discrete dust instead of an expensive postprocessing pass.
    if (!this.reduced) for (let i = 0; i < 18; i++) {
      c.globalAlpha = 0.12 + (i % 3) * 0.05; this.rect((i * 137 + this.tick * (i % 2 ? 3 : -2) + 1000) % 960, (i * 43 + this.tick * 5) % 515, 2, 2, P.white);
    }
    c.globalAlpha = 1;
  }
  destroy() { cancelAnimationFrame(this.frame); this.canvas.removeEventListener('pointermove', this.pointerMove); this.canvas.removeEventListener('pointerleave', this.pointerLeave); this.canvas.removeEventListener('pointerdown', this.pointerDown); document.removeEventListener('visibilitychange', this.visibility); this.audio.dispose(); }
}
