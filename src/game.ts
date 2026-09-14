export type Target = 'forge' | 'splitter' | 'clock';
export type Status = 'ready' | 'playing' | 'paused' | 'failed';
export interface GameState {
  status: Status; time: number; elapsed: number; shots: number; hits: number;
  forge: number; level: number; splitter: number; stage: number; volley: number;
  autoLevel: number; autoTarget: Target; upgrades: number; saved: number;
  message: string;
}
export const materialNames = ['铜', '银', '金', '钨金'];
export function initialState(): GameState {
  return { status: 'ready', time: 100, elapsed: 0, shots: 0, hits: 0, forge: 0, level: 0, splitter: 0, stage: 0, volley: 1, autoLevel: 0, autoTarget: 'forge', upgrades: 0, saved: 0, message: '工作台已就绪。先向右侧分流器投入 10 枚铜币。' };
}
export function forgeCost(s: GameState) { return 1000 * 2 ** s.level; }
export function splitterCost(s: GameState) { return [10, 50, 150][s.stage] ?? 300 * 2 ** (s.stage - 3); }
export function splitterName(s: GameState) { return ['双联发射器', '三联发射器', '自动供币器'][s.stage] ?? `自动供币器 MK.${s.autoLevel + 1}`; }
export function autoInterval(s: GameState) { return Math.max(0.2, 2 / Math.max(1, s.autoLevel)); }
export function advance(s: GameState, dt: number): GameState {
  if (s.status !== 'playing') return s;
  const step = Math.max(0, Math.min(dt, s.time));
  const time = Math.max(0, s.time - step);
  return { ...s, time, elapsed: s.elapsed + step, status: time <= 0 ? 'failed' : 'playing', message: time <= 0 ? '应急发条停转。防爆门失守。' : s.message };
}
export function registerShot(s: GameState, count: number): GameState {
  return s.status === 'playing' ? { ...s, shots: s.shots + count } : s;
}
export function hit(s: GameState, target: Target | null): GameState {
  if (s.status !== 'playing' || !target) return s;
  const n = { ...s, hits: s.hits + 1 };
  if (target === 'clock') return { ...n, time: n.time + 1, saved: n.saved + 1 };
  const power = 2 ** n.level;
  if (target === 'forge') {
    n.forge += power;
    if (n.forge >= forgeCost(n)) {
      n.forge -= forgeCost(n); n.level += 1; n.upgrades += 1;
      n.message = `铸造完成！${materialNames[Math.min(n.level, 3)]}币已装填，设备命中效率 ×${2 ** n.level}。`;
    }
  } else {
    n.splitter += power;
    if (n.splitter >= splitterCost(n)) {
      n.splitter -= splitterCost(n); n.stage += 1; n.upgrades += 1;
      if (n.stage <= 2) { n.volley += 1; n.message = `${n.volley} 联发射器已展开。每次点击发射 ${n.volley} 枚铜币！`; }
      else { n.autoLevel += 1; n.message = `自动供币器 MK.${n.autoLevel} 上线。可在设备栏选择自动射击目标。`; }
    }
  }
  return n;
}
