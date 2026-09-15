export const SAVE_VERSION = 3;
export const SAVE_KEY = 'last-coin-cathedral-v3';
export const LOSS_RATE = 0.2;
export const MAX_ACTIVE_STEP = 30;

export type Direction = 'north' | 'east' | 'south' | 'west';
export type Resource = 'silver' | 'water' | 'crosses';
export type CreatureKind = 'hollow' | 'penitent' | 'cantor';
export type Upgrade = 'volley' | 'power' | 'rate';
export type Status = 'ready' | 'tutorial' | 'playing' | 'paused' | 'won';
export type RoomId = typeof ROOMS[number]['id'];
export type CreatureId = typeof CREATURES[number]['id'];
export type TargetId = `creature:${CreatureId}` | `machine:${'tutorial' | Upgrade | 'cannon'}` | 'moon';

export interface RoomDefinition { id: string; name: string; area: string; x: number; z: number; exits: Partial<Record<Direction, string>>; sanctuary?: boolean; final?: boolean }

export const ROOMS = [
  { id: 'refuge', name: '烛下庇护地', area: '西廊', x: 0, z: 3, sanctuary: true, exits: { north: 'narthex' } },
  { id: 'narthex', name: '封门前厅', area: '西廊', x: 0, z: 2, exits: { south: 'refuge', north: 'naveWest', east: 'baptistry' } },
  { id: 'baptistry', name: '沉水洗礼堂', area: '侧堂', x: 1, z: 2, exits: { west: 'narthex', north: 'northAisle' } },
  { id: 'naveWest', name: '断烛中殿', area: '中殿', x: 0, z: 1, sanctuary: true, exits: { south: 'narthex', north: 'transept', east: 'northAisle' } },
  { id: 'northAisle', name: '倒悬侧廊', area: '侧堂', x: 1, z: 1, exits: { south: 'baptistry', west: 'naveWest', north: 'cloister' } },
  { id: 'transept', name: '银纹耳堂', area: '耳堂', x: 0, z: 0, sanctuary: true, exits: { south: 'naveWest', north: 'choir', west: 'southAisle', east: 'cloister' } },
  { id: 'southAisle', name: '流血侧廊', area: '侧堂', x: -1, z: 0, exits: { east: 'transept', north: 'ossuary' } },
  { id: 'cloister', name: '无风回廊', area: '回廊', x: 1, z: 0, sanctuary: true, exits: { south: 'northAisle', west: 'transept', north: 'bellTower' } },
  { id: 'ossuary', name: '无名骨库', area: '地下侧室', x: -1, z: -1, exits: { south: 'southAisle', east: 'choir' } },
  { id: 'choir', name: '失声唱诗席', area: '唱诗席', x: 0, z: -1, sanctuary: true, exits: { south: 'transept', west: 'ossuary', east: 'bellTower', north: 'apse' } },
  { id: 'bellTower', name: '逆鸣钟楼', area: '钟楼', x: 1, z: -1, exits: { south: 'cloister', west: 'choir', north: 'moonBattery' } },
  { id: 'apse', name: '月蚀后殿', area: '后殿', x: 0, z: -2, exits: { south: 'choir', east: 'moonBattery' } },
  { id: 'moonBattery', name: '月亮炮台', area: '终祷区', x: 1, z: -2, final: true, exits: { south: 'bellTower', west: 'apse' } },
] as const satisfies readonly RoomDefinition[];

export const CREATURE_KINDS: Record<CreatureKind, { name: string; threshold: number; resource: Resource; rate: number; attack: number }> = {
  hollow: { name: '空壳巡礼者', threshold: 6, resource: 'silver', rate: 0.8, attack: 5 },
  penitent: { name: '伏行忏悔兽', threshold: 10, resource: 'water', rate: 0.08, attack: 7 },
  cantor: { name: '失声唱诗体', threshold: 16, resource: 'crosses', rate: 0.04, attack: 9 },
};
export const CREATURES = [
  { id: 'narthex-hollow', room: 'narthex', kind: 'hollow' }, { id: 'baptistry-penitent', room: 'baptistry', kind: 'penitent' },
  { id: 'nave-hollow', room: 'naveWest', kind: 'hollow' }, { id: 'aisle-cantor', room: 'northAisle', kind: 'cantor' },
  { id: 'transept-penitent', room: 'transept', kind: 'penitent' }, { id: 'south-hollow', room: 'southAisle', kind: 'hollow' },
  { id: 'cloister-cantor', room: 'cloister', kind: 'cantor' }, { id: 'ossuary-penitent', room: 'ossuary', kind: 'penitent' },
  { id: 'choir-cantor', room: 'choir', kind: 'cantor' }, { id: 'tower-hollow', room: 'bellTower', kind: 'hollow' },
  { id: 'apse-cantor', room: 'apse', kind: 'cantor' },
] as const satisfies readonly { id: string; room: RoomId; kind: CreatureKind }[];
export const SAFE_ROOMS: RoomId[] = ['naveWest', 'transept', 'cloister', 'choir'];
export const CANNON_STAGES = [
  { name: '炮身', resource: null, cost: 0 }, { name: '圣水冷却', resource: 'water' as Resource, cost: 1400 },
  { name: '十字架瞄具', resource: 'crosses' as Resource, cost: 900 }, { name: '银币弹芯', resource: 'silver' as Resource, cost: 18000 },
] as const;

export interface GameState {
  version: number; status: Status; room: RoomId; facing: Direction; visited: RoomId[]; clearedRooms: RoomId[]; sanctuaries: RoomId[];
  health: number; resources: Record<Resource, number>; expeditionGains: Record<Resource, number>; creatureDamage: Record<CreatureId, number>;
  producers: CreatureId[]; upgrades: Record<Upgrade, number>; machineCharge: Record<Upgrade, number>; tutorialStep: number; tutorialCharge: number;
  journalRead: boolean; effectiveSeconds: number; cannonStage: number; moonStage: number; moonHits: number; shots: number; hits: number; message: string;
}
const emptyResources = (): Record<Resource, number> => ({ silver: 0, water: 0, crosses: 0 });
const emptyDamage = () => Object.fromEntries(CREATURES.map(c => [c.id, 0])) as Record<CreatureId, number>;
export function initialState(): GameState { return {
  version: SAVE_VERSION, status: 'ready', room: 'refuge', facing: 'north', visited: ['refuge'], clearedRooms: ['refuge'], sanctuaries: ['refuge'],
  health: 100, resources: emptyResources(), expeditionGains: emptyResources(), creatureDamage: emptyDamage(), producers: [], upgrades: { volley: 0, power: 0, rate: 0 },
  machineCharge: { volley: 0, power: 0, rate: 0 }, tutorialStep: 0, tutorialCharge: 0, journalRead: false, effectiveSeconds: 0,
  cannonStage: 0, moonStage: 0, moonHits: 0, shots: 0, hits: 0, message: '月下低语正在寻找仍敢呼吸的人。',
}; }

export const room = (id: RoomId) => ROOMS.find(r => r.id === id)!;
export const creature = (id: CreatureId) => CREATURES.find(c => c.id === id)!;
export const creatureInRoom = (s: GameState, id = s.room) => CREATURES.find(c => c.room === id && !s.producers.includes(c.id));
export const isCleared = (s: GameState, id: RoomId) => s.clearedRooms.includes(id);
export const productionRates = (s: GameState): Record<Resource, number> => s.producers.reduce((rates, id) => { const d = CREATURE_KINDS[creature(id).kind]; rates[d.resource] += d.rate; return rates }, emptyResources());
export const volley = (s: GameState) => 1 + s.upgrades.volley;
export const power = (s: GameState) => [1, 2, 4, 7][s.upgrades.power];
export const fireInterval = (s: GameState) => [0.42, 0.3, 0.2, 0.13][s.upgrades.rate];
export const upgradeCost = (s: GameState, kind: Upgrade) => [8, 24, 64][s.upgrades[kind]] ?? 0;
export const canAct = (s: GameState) => s.status === 'tutorial' || s.status === 'playing';
export const movementUnlocked = (s: GameState) => s.status === 'playing' && s.tutorialStep >= 3;
export const finalResourcesReady = (s: GameState) => s.resources.silver >= 18000 && s.resources.water >= 1400 && s.resources.crosses >= 900;

export function beginTutorial(s: GameState): GameState { return s.status === 'ready' ? { ...s, status: 'tutorial', tutorialStep: 1, message: '银币不会耗尽。瞄准庇护机并射击三次，让它记住你的手。' } : s }
export function inspectJournal(s: GameState): GameState { return s.status === 'tutorial' && s.tutorialStep === 2 ? { ...s, tutorialStep: 3, journalRead: true, message: '你已获得「银币发射」。移动封印已经解除：W 前进，A / D 转向。' } : { ...s, journalRead: true } }
export function beginGame(s: GameState): GameState { return s.status === 'tutorial' && s.tutorialStep < 3 ? s : { ...s, status: 'playing', tutorialStep: 3, message: '门已打开。未知房间才会伤害你；净化永不逆转。' } }
const turnOrder: Direction[] = ['north', 'east', 'south', 'west'];
export function turn(s: GameState, side: 'left' | 'right'): GameState { if (!movementUnlocked(s)) return s; const i = turnOrder.indexOf(s.facing) + (side === 'right' ? 1 : 3); return { ...s, facing: turnOrder[i % 4] } }
export function canEnter(s: GameState, destination: RoomId) {
  if (destination !== 'moonBattery') return true;
  const occupied = SAFE_ROOMS.every(id => s.sanctuaries.includes(id));
  const permanentlyOpened = s.visited.includes('moonBattery') || s.cannonStage > 0;
  return occupied && (permanentlyOpened || finalResourcesReady(s));
}
export function moveForward(s: GameState): GameState {
  if (!movementUnlocked(s)) return s; const destination = (room(s.room).exits as Partial<Record<Direction, RoomId>>)[s.facing];
  if (!destination) return { ...s, message: '冷石墙挡住了这条路。' };
  if (!canEnter(s, destination)) return { ...s, message: SAFE_ROOMS.some(id => !s.sanctuaries.includes(id)) ? '四处安全区尚未全部点亮，终祷门拒绝开启。' : '终祷门正在称量三类产物：需要 18,000 银币充能、1,400 圣水与 900 十字架。' };
  return { ...s, room: destination, visited: s.visited.includes(destination) ? s.visited : [...s.visited, destination], message: isCleared(s, destination) ? `返回${room(destination).name}。这里的光不会熄灭。` : `进入${room(destination).name}。黑暗里有东西开始移动。` };
}
function occupy(n: GameState, id: RoomId) { if (!n.clearedRooms.includes(id)) n.clearedRooms = [...n.clearedRooms, id]; if (SAFE_ROOMS.includes(id) && !n.sanctuaries.includes(id)) n.sanctuaries = [...n.sanctuaries, id] }
function hitCreature(s: GameState, id: CreatureId): GameState {
  const c = creature(id); if (c.room !== s.room || s.producers.includes(id)) return s;
  const n = { ...s, creatureDamage: { ...s.creatureDamage }, producers: [...s.producers], clearedRooms: [...s.clearedRooms], sanctuaries: [...s.sanctuaries] };
  n.creatureDamage[id] += power(n); const d = CREATURE_KINDS[c.kind];
  if (n.creatureDamage[id] >= d.threshold) { n.creatureDamage[id] = d.threshold; n.producers.push(id); occupy(n, c.room); n.message = `${d.name}已被净化并留在原处，每秒生产${resourceName(d.resource)} ${d.rate}。` }
  else n.message = `${d.name}净化 ${n.creatureDamage[id]} / ${d.threshold}`; return n;
}
function hitMachine(s: GameState, machine: 'tutorial' | Upgrade | 'cannon'): GameState {
  if (machine === 'tutorial') { if (s.status !== 'tutorial' || s.tutorialStep !== 1) return s; const c = Math.min(3, s.tutorialCharge + 1); return c === 3 ? { ...s, tutorialCharge: c, tutorialStep: 2, message: '庇护机已充能。按 B，亲自查看刚获得的「银币发射」。' } : { ...s, tutorialCharge: c, message: `庇护机充能 ${c} / 3` } }
  if (machine === 'cannon') return assembleCannon(s);
  const locations: Record<Upgrade, RoomId> = { volley: 'naveWest', power: 'cloister', rate: 'choir' };
  if (s.room !== locations[machine] || !s.sanctuaries.includes(s.room)) return s;
  const total = upgradeCost(s, machine); if (!total) return s; const charge = s.machineCharge[machine] + 1;
  if (charge < total) return { ...s, machineCharge: { ...s.machineCharge, [machine]: charge }, message: `${upgradeName(machine)}充能 ${charge} / ${total}` };
  return { ...s, upgrades: { ...s.upgrades, [machine]: s.upgrades[machine] + 1 }, machineCharge: { ...s.machineCharge, [machine]: 0 }, message: `${upgradeName(machine)}升至 ${s.upgrades[machine] + 1} 级。` };
}
export function shoot(s: GameState, target: TargetId | null): GameState {
  if (!canAct(s)) return s; let n = { ...s, shots: s.shots + volley(s) }; if (!target) return n;
  for (let i = 0; i < volley(s); i++) { const before = n; if (target.startsWith('creature:')) n = hitCreature(n, target.slice(9) as CreatureId); else if (target.startsWith('machine:')) n = hitMachine(n, target.slice(8) as 'tutorial' | Upgrade | 'cannon'); else n = hitMoon(n); if (n !== before) n = { ...n, hits: n.hits + 1 } } return n;
}
export function defeat(s: GameState): GameState { const resources = { ...s.resources }; for (const k of Object.keys(resources) as Resource[]) resources[k] = Math.max(0, resources[k] - Math.floor(s.expeditionGains[k] * LOSS_RATE)); const checkpoint = nearestSanctuary(s); return { ...s, room: checkpoint, health: 100, resources, expeditionGains: emptyResources(), message: `你在黑暗中倒下，回到${room(checkpoint).name}。本次探索所得损失 20%，永久净化与升级保留。` } }
export function advance(s: GameState, seconds: number): GameState {
  if (s.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return s;
  let remaining = Math.min(seconds, MAX_ACTIVE_STEP), n = { ...s, resources: { ...s.resources }, expeditionGains: { ...s.expeditionGains } };
  while (remaining > 1e-9) { const step = Math.min(remaining, 0.25); remaining -= step; n.effectiveSeconds += step; const rates = productionRates(n); for (const k of Object.keys(rates) as Resource[]) { const gain = rates[k] * step; n.resources[k] += gain; n.expeditionGains[k] += gain } const hostile = creatureInRoom(n); if (hostile) { n.health -= CREATURE_KINDS[hostile.kind].attack * step; if (n.health <= 0) { n = defeat(n); break } } else n.health = Math.min(100, n.health + step * 2) } return n;
}
export function assembleCannon(s: GameState): GameState {
  if (s.room !== 'moonBattery' || s.cannonStage >= CANNON_STAGES.length) return s;
  if (SAFE_ROOMS.some(id => !s.sanctuaries.includes(id))) return { ...s, message: '月亮炮拒绝响应：四处安全区尚未全部占领。' };
  const stage = CANNON_STAGES[s.cannonStage]; if (stage.resource && s.resources[stage.resource] + 1e-7 < stage.cost) return { ...s, message: `${stage.name}仍缺 ${Math.ceil(stage.cost - s.resources[stage.resource])} ${resourceName(stage.resource)}。` };
  const resources = { ...s.resources }; if (stage.resource) resources[stage.resource] -= stage.cost; return { ...s, resources, cannonStage: s.cannonStage + 1, message: `${stage.name}已经装入月亮炮（${s.cannonStage + 1} / 4）。` };
}
export function hitMoon(s: GameState): GameState { if (s.room !== 'moonBattery' || s.cannonStage < 4 || s.status !== 'playing') return s; const required = [3, 5][s.moonStage] ?? 0; if (!required) return s; const hits = s.moonHits + 1; if (hits < required) return { ...s, moonHits: hits, message: `月面裂纹正在扩散 ${hits} / ${required}` }; if (s.moonStage === 0) return { ...s, moonStage: 1, moonHits: 0, message: '第一层月壳碎裂。天空变成暗红，重新瞄准它。' }; return { ...s, moonStage: 2, moonHits: 0, status: 'won', message: '最后一枚银币贯穿月心。教堂第一次听见真正的寂静。' } }
export function nearestSanctuary(s: GameState): RoomId { const q: RoomId[] = [s.room], seen = new Set<RoomId>(q); while (q.length) { const current = q.shift()!; if (s.sanctuaries.includes(current)) return current; for (const next of Object.values(room(current).exits) as RoomId[]) if (!seen.has(next)) { seen.add(next); q.push(next) } } return 'refuge' }
export const resourceName = (r: Resource) => ({ silver: '银币充能', water: '圣水', crosses: '十字架' })[r];
export const upgradeName = (u: Upgrade) => ({ volley: '齐射刻印', power: '净化威力', rate: '射击钟摆' })[u];
export function ownedAbilities(s: GameState) { const result = [{ id: 'silver', name: '银币发射', text: '弹药无限；命中机器充能，命中怪物累积净化伤害。' }]; for (const kind of ['volley', 'power', 'rate'] as Upgrade[]) if (s.upgrades[kind] > 0) result.push({ id: kind, name: upgradeName(kind), text: `${s.upgrades[kind]} 级 · ${kind === 'volley' ? `每次 ${volley(s)} 枚` : kind === 'power' ? `每枚 ${power(s)} 点净化` : `间隔 ${fireInterval(s).toFixed(2)} 秒`}` }); return result }
export function serializeSave(s: GameState) { return JSON.stringify({ version: SAVE_VERSION, state: s }) }
export function readSave(raw: string | null): GameState | null {
  try {
    if (!raw) return null;
    const p = JSON.parse(raw), s = p.state as GameState;
    const roomIds = new Set(ROOMS.map(r => r.id)), creatureIds = new Set(CREATURES.map(c => c.id));
    const validRoomList = (value: unknown) => Array.isArray(value) && value.every(id => roomIds.has(id));
    const validCreatureList = (value: unknown) => Array.isArray(value) && value.every(id => creatureIds.has(id));
    if (p.version !== SAVE_VERSION || s?.version !== SAVE_VERSION) return null;
    if (!roomIds.has(s.room) || !turnOrder.includes(s.facing) || !['playing', 'paused'].includes(s.status)) return null;
    if (!validRoomList(s.visited) || !validRoomList(s.clearedRooms) || !validRoomList(s.sanctuaries) || !validCreatureList(s.producers)) return null;
    if (![s.health, s.effectiveSeconds, s.cannonStage, s.moonStage, s.moonHits, s.shots, s.hits, s.tutorialStep, s.tutorialCharge].every(Number.isFinite)) return null;
    if (s.health <= 0 || s.health > 100 || s.effectiveSeconds < 0 || !Number.isInteger(s.cannonStage) || s.cannonStage < 0 || s.cannonStage > 4 || !Number.isInteger(s.moonStage) || s.moonStage < 0 || s.moonStage > 2) return null;
    if ((Object.keys(emptyResources()) as Resource[]).some(k => !Number.isFinite(s.resources?.[k]) || s.resources[k] < 0 || !Number.isFinite(s.expeditionGains?.[k]) || s.expeditionGains[k] < 0)) return null;
    if ((['volley', 'power', 'rate'] as Upgrade[]).some(k => !Number.isInteger(s.upgrades?.[k]) || s.upgrades[k] < 0 || s.upgrades[k] > 3 || !Number.isFinite(s.machineCharge?.[k]) || s.machineCharge[k] < 0)) return null;
    if (CREATURES.some(c => !Number.isFinite(s.creatureDamage?.[c.id]) || s.creatureDamage[c.id] < 0 || s.creatureDamage[c.id] > CREATURE_KINDS[c.kind].threshold)) return null;
    return { ...s, status: 'paused' };
  } catch { return null }
}
export function makeTestState(stage: 'explore' | 'cannon'): GameState { const s = beginGame({ ...beginTutorial(initialState()), tutorialStep: 3, journalRead: true }); if (stage === 'explore') return s; return { ...s, room: 'moonBattery', visited: ROOMS.map(r => r.id), clearedRooms: ROOMS.map(r => r.id), sanctuaries: ['refuge', ...SAFE_ROOMS], producers: CREATURES.map(c => c.id), resources: { silver: 18000, water: 1400, crosses: 900 }, message: '测试状态：规则门槛均由版本化构造器满足。' } }
