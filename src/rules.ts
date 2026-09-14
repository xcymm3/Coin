export const TARGETS = ['forge', 'splitter', 'choir', 'ward', 'lens', 'seal', 'clock'] as const;
export type Target = typeof TARGETS[number];
export type Device = Exclude<Target, 'clock'>;
export type Status = 'ready' | 'tutorial' | 'playing' | 'paused' | 'failed' | 'won';
export const DAWN_TIME = 720;
export const SAVE_KEY = 'last-coin-v2-save';
export const chapters = [
  { at: 0, name: '第一夜钟 · 苏醒', note: '先向分魂祭器献上十枚铜币。', machine: null },
  { at: 90, name: '第二夜钟 · 低语', note: '灵仆摇篮已现形。让它代你献祭。', machine: 'choir' },
  { at: 210, name: '第三夜钟 · 叩门', note: '祷告风琴已经苏醒。为结界留下余裕。', machine: 'ward' },
  { at: 360, name: '第四夜钟 · 窥视', note: '黑曜棱镜正在凝视你。用它放大献祭的力量。', machine: 'lens' },
  { at: 510, name: '第五夜钟 · 血月', note: '黎明圣龛已显露。开始准备最后的封印。', machine: 'seal' },
  { at: 660, name: '第六夜钟 · 终祷', note: '守住最后一分钟。黎明将回应已充能的圣龛。', machine: null },
] as const;
export const devices: Record<Device, { name: string; short: string; rune: string; at: number; costs: number[]; description: string }> = {
  forge: { name: '余烬铸币炉', short: '铸币炉', rune: '♜', at: 0, costs: [1000, 2400, 6000, 14000, 32000], description: '将铜币淬成更强的祭品。' },
  splitter: { name: '分魂祭器', short: '分魂祭器', rune: '♆', at: 0, costs: [10, 80, 360, 1200], description: '一枚铜币，多道回响。增加齐射。' },
  choir: { name: '灵仆摇篮', short: '灵仆摇篮', rune: '♧', at: 90, costs: [120, 360, 1000, 2600], description: '唤醒灵仆，自动替你献上铜币。' },
  ward: { name: '祷告风琴', short: '祷告风琴', rune: '♰', at: 210, costs: [250, 900, 2400, 6200], description: '祷声持续修复结界，并强化续命。' },
  lens: { name: '黑曜棱镜', short: '黑曜棱镜', rune: '◇', at: 360, costs: [600, 2000, 6000, 16000], description: '放大每枚铜币的设备充能效率。' },
  seal: { name: '黎明圣龛', short: '黎明圣龛', rune: '☼', at: 510, costs: [18000], description: '注满圣龛，守到第十二分钟，封闭裂隙。' },
};
export interface GameState {
  status: Status; time: number; elapsed: number; shots: number; hits: number;
  levels: Record<Device, number>; progress: Record<Device, number>;
  autoTarget: Target; upgrades: number; saved: number; guide: number; guideHits: number;
  message: string; waveCount: number; autoCharge: number;
}
const blank = (): Record<Device, number> => ({ forge: 0, splitter: 0, choir: 0, ward: 0, lens: 0, seal: 0 });
export function initialState(): GameState {
  return { status: 'ready', time: 100, elapsed: 0, shots: 0, hits: 0, levels: blank(), progress: blank(), autoTarget: 'forge', upgrades: 0, saved: 0, guide: 0, guideHits: 0, waveCount: 0, autoCharge: 0, message: '末日生存系统正在寻找仍有心跳的守夜人……' };
}
export function chapter(s: GameState) { return chapters.reduce((index, item, i) => s.elapsed >= item.at ? i : index, 0); }
export function unlocked(s: GameState, target: Target) { return target === 'clock' || s.elapsed >= devices[target].at; }
export function cost(s: GameState, target: Device) { return devices[target].costs[s.levels[target]] ?? 0; }
export function volley(s: GameState) { return 1 + s.levels.splitter; }
export function power(s: GameState) { return [1, 2, 4, 7, 11, 16][s.levels.forge] * (1 + 0.35 * s.levels.lens); }
export function capacity(s: GameState) { return 160 + 25 * s.levels.ward; }
export function clockGain(s: GameState) { return 1 + 0.3 * s.levels.ward; }
export function autoRate(s: GameState) { return s.levels.choir ? 0.6 + 0.5 * s.levels.choir : 0; }
export function waveActive(s: GameState) { return s.elapsed % 120 >= 95; }
export function drain(s: GameState) {
  const escalation = Math.max(0, Math.floor((s.elapsed - DAWN_TIME) / 60)) * 0.3;
  return 1 + chapter(s) * 0.3 + s.upgrades * 0.035 + escalation + (waveActive(s) ? 0.9 + chapter(s) * 0.18 : 0);
}
export function netDrain(s: GameState) { return Math.max(0.25, drain(s) - s.levels.ward * 0.38); }
export function timeLabel(seconds: number) { const t = Math.max(0, Math.floor(seconds + 1e-6)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }
export function effect(s: GameState, target: Device) {
  const lv = s.levels[target];
  switch (target) {
    case 'forge': return `献祭效力 ${[1, 2, 4, 7, 11, 16][Math.min(lv + 1, 5)]} ×`;
    case 'splitter': return `每枪 ${Math.min(lv + 2, 5)} 枚铜币`;
    case 'choir': return `每秒 ${(0.6 + 0.5 * Math.min(lv + 1, 4)).toFixed(1)} 次自动齐射`;
    case 'ward': return `每秒修复 ${(Math.min(lv + 1, 4) * 0.38).toFixed(2)} · 命中续命提升`;
    case 'lens': return `设备效力 +${Math.min(lv + 1, 4) * 35}%`;
    case 'seal': return '充能完成 + 守至 12:00 → 封闭裂隙';
  }
}
export function beginTutorial(s: GameState): GameState {
  return { ...s, status: 'tutorial', guide: 1, message: '守夜人，举起铸币枪。向分魂祭器献上十枚铜币，唤醒它的第二道回响。' };
}
export function beginNight(s: GameState): GameState { return { ...s, status: 'playing', guide: 4, message: '临时庇护已撤除。右侧丧钟归零，门外之物便会找到你。守到十二分钟后的黎明。' }; }
export function canShoot(s: GameState) { return s.status === 'playing' || s.status === 'tutorial'; }
export function registerShot(s: GameState, count: number) { return canShoot(s) ? { ...s, shots: s.shots + count } : s; }
export function hit(s: GameState, target: Target | null): GameState {
  if (!canShoot(s) || !target || !unlocked(s, target)) return s;
  const n = { ...s, levels: { ...s.levels }, progress: { ...s.progress }, hits: s.hits + 1 };
  if (target === 'clock') {
    const gain = Math.min(clockGain(n), capacity(n) - n.time);
    n.time += Math.max(0, gain); n.saved += Math.max(0, gain);
    if (n.status === 'tutorial' && n.guide === 2) {
      n.guideHits += 1;
      if (n.guideHits >= 3) { n.guide = 3; n.message = '契约已确认。你面前的圣约机能抵御门外的恐怖诡异，但每一秒庇护都需要献祭。'; }
    }
    return n;
  }
  const required = cost(n, target);
  if (!required) return n;
  n.progress[target] += power(n);
  if (n.progress[target] >= required) {
    n.progress[target] = 0; n.levels[target] += 1; n.upgrades += 1;
    n.message = target === 'seal' ? '黎明圣龛已充能。继续守住丧钟，等待十二分钟之约。' : `${devices[target].name}已回应献祭，升至 ${n.levels[target]} 阶。门外的低语也更近了一些。`;
    if (n.status === 'tutorial' && target === 'splitter' && n.guide === 1) { n.guide = 2; n.message = '现在，看最右侧的丧钟。向它射出三枚铜币，时间便会倒流。它一旦归零，结界便会崩塌。'; }
    if (target === 'seal' && n.elapsed >= DAWN_TIME && n.status === 'playing') { n.status = 'won'; n.message = '裂隙已封闭。守夜人，外面的第一缕光是真的。'; }
  }
  return n;
}
// Split elapsed time at one-second boundaries so waves and unlocks remain consistent at low frame rates.
export function advance(s: GameState, seconds: number): GameState {
  if (s.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return s;
  let n = { ...s }, remaining = Math.min(seconds, 86400);
  while (remaining > 1e-7 && n.status === 'playing') {
    const step = Math.min(remaining, 1 - (n.elapsed % 1) || 1), before = chapter(n);
    const depletion = netDrain(n), actual = Math.min(step, n.time / depletion);
    n.time = Math.max(0, n.time - actual * depletion); n.elapsed += actual; remaining -= actual;
    if (n.time <= 1e-7) { n.time = 0; n.status = 'failed'; n.message = '丧钟归零。圣约已经失效。不要回头。'; break; }
    if (chapter(n) !== before) n.message = chapters[chapter(n)].note;
    const waves = Math.floor((n.elapsed + 1e-7) / 120);
    if (waves > n.waveCount) { n.waveCount = waves; n.message = `第 ${waves} 次侵袭已退去。趁低语远去，继续唤醒圣约机。`; }
    if (n.elapsed + 1e-7 >= DAWN_TIME && n.levels.seal > 0) { n.status = 'won'; n.message = '裂隙已封闭。守夜人，外面的第一缕光是真的。'; break; }
    if (autoRate(n)) {
      n.autoCharge += actual * autoRate(n);
      while (n.autoCharge >= 1 && n.status === 'playing') {
        n.autoCharge -= 1;
        const target = n.autoTarget !== 'clock' && !cost(n, n.autoTarget) ? 'clock' : n.autoTarget;
        const count = volley(n);
        n = registerShot(n, count);
        for (let i = 0; i < count; i++) n = hit(n, target);
      }
    }
  }
  return n;
}
export function recommendation(s: GameState): { target: Target; text: string } {
  if (s.guide === 1) return { target: 'splitter', text: '向分魂祭器射击，唤醒双重回响' };
  if (s.guide === 2) return { target: 'clock', text: '向最右侧丧钟命中三枚铜币' };
  if (s.time / netDrain(s) < 25) return { target: 'clock', text: '庇护即将耗尽。立刻向右侧丧钟献祭' };
  const priorities: [Device, number, string][] = [
    ['splitter', 2, '增加铸币枪齐射数量'], ['choir', 1, '唤醒灵仆，开始自动献祭'],
    ['ward', 2, '唤醒祷告风琴，减缓庇护流失'], ['splitter', 3, '将铸币枪提升为四重回响'],
    ['forge', 2, '淬炼铜币，为后续献祭提高效率'], ['lens', 2, '用黑曜棱镜放大铜币的力量'],
    ['choir', 3, '强化灵仆，分担守夜的负担'], ['forge', 3, '将铜币淬炼为终祷的祭品'],
    ['ward', 3, '加固结界，为最后的侵袭做准备'], ['seal', 1, '为黎明圣龛充能，准备封闭裂隙'],
    ['choir', 4, '唤醒全部灵仆，继续守护丧钟'], ['forge', 5, '继续淬炼，等待黎明之约'],
  ];
  const next = priorities.find(([target, level]) => unlocked(s, target) && s.levels[target] < level);
  if (next) return { target: next[0], text: next[2] };
  return { target: 'clock', text: '守住丧钟，等待黎明之约' };
}
export function readSave(raw: string | null): GameState | null {
  try {
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== 2) return null;
    const s = data.state as GameState;
    if (!s || !['playing', 'paused'].includes(s.status) || !TARGETS.includes(s.autoTarget)) return null;
    for (const key of ['time', 'elapsed', 'shots', 'hits', 'upgrades', 'saved', 'waveCount', 'autoCharge'] as const) if (!Number.isFinite(s[key]) || s[key] < 0) return null;
    for (const t of Object.keys(devices) as Device[]) if (!Number.isInteger(s.levels?.[t]) || s.levels[t] < 0 || s.levels[t] > devices[t].costs.length || !Number.isFinite(s.progress?.[t]) || s.progress[t] < 0) return null;
    if (s.time <= 0 || s.time > capacity(s) || s.elapsed > 86400) return null;
    return { ...s, status: 'paused', guide: 4 };
  } catch { return null; }
}
