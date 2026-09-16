import { plantPosition } from './gardenScene.ts'
import { PLANTS, ULTIMATE_ID, ULTIMATE_TIER, INITIAL_POTS, TIER_PLANTS, SEED_UNLOCK, SEED_ODDS, SPECIES_ODDS, seedPlantId, type Tier, type Plant } from './catalog.ts'
export * from './catalog.ts'
export type UpgradeId = 'pots' | 'click' | 'soil' | 'profit' | 'snail' | 'speed' | 'water' | 'harvest' | 'sow' | 'splash' | 'compost' | 'lantern'
export type Upgrade = { id: UpgradeId; name: string; cost: number; scale: number; max: number; category: number; icon: string; detail: string }
export const UPGRADES: Upgrade[] = [
  { id: 'click', name: '园艺手套', cost: 75, scale: 2.3, max: 5, category: 0, icon: 'hand', detail: '每级手动浇水 +2 秒成长' },
  { id: 'soil', name: '肥沃土壤', cost: 90, scale: 2, max: 4, category: 0, icon: 'leaf', detail: '每级所有植物自然生长 +15%' },
  { id: 'profit', name: '丰收祝福', cost: 120, scale: 2.2, max: 4, category: 0, icon: 'coin', detail: '每级所有植物收获金币 +20%' },
  { id: 'splash', name: '园丁蓄水壶', cost: 280, scale: 2, max: 3, category: 0, icon: 'water', detail: '每级水壶增加 2 格容量；空壶在工具栏装填' },
  { id: 'pots', name: '花园扩建', cost: 120, scale: 1.8, max: 5, category: 1, icon: 'pot', detail: '每级增加 1 个花盆，最多 15 个' },
  { id: 'compost', name: '种子堆肥', cost: 450, scale: 2, max: 3, category: 1, icon: 'seed', detail: '每级非终极种子价格降低 10%' },
  { id: 'lantern', name: '萤火灯笼', cost: 500, scale: 2, max: 3, category: 1, icon: 'star', detail: '每级播种时获得 10% 初始成长，包含星之花' },
  { id: 'snail', name: '浇水蜗牛', cost: 400, scale: 3, max: 3, category: 2, icon: 'snail', detail: '每级雇用 1 只蜗牛，轮流为植物浇水' },
  { id: 'water', name: '大号水壶', cost: 350, scale: 2.3, max: 4, category: 2, icon: 'water', detail: '每级蜗牛水壶增加 1 格容量、浇水 +3 秒' },
  { id: 'speed', name: '蜗牛跑鞋', cost: 450, scale: 2.4, max: 3, category: 2, icon: 'boot', detail: '每级提高蜗牛移动速度，穿上红色小跑鞋' },
  { id: 'harvest', name: '收获甲虫', cost: 1200, scale: 2.8, max: 3, category: 2, icon: 'beetle', detail: '采摘装篮、运回交付金币；每级背篓多装 1 株' },
  { id: 'sow', name: '播种松鼠', cost: 2200, scale: 2.8, max: 3, category: 2, icon: 'squirrel', detail: '回种子箱补货后逐盆播种；每级口袋多装 2 包' },
]
export type WorkerKind = 'harvest' | 'sow'
export type ActorKind = WorkerKind | 'water' | 'player'
export type Worker = { x: number; y: number; facing: number; phase: 'idle' | 'walk' | 'act' | 'return' | 'service'; target: number | null; clock: number; path: { x: number; y: number }[]; stock: number; cargo: number; count: number }
export const STATIONS = { water: { x: 8, y: 96 }, sow: { x: 48, y: 96 }, harvest: { x: 88, y: 96 } }
const newWorker = (x: number, stock = 0): Worker => ({ x, y: 91, facing: 1, phase: 'idle', target: null, clock: 0, path: [], stock, cargo: 0, count: 0 })
export const capacity = (s: GameState, kind: ActorKind) => kind === 'player' ? 4 + s.upgrades.splash * 2 : kind === 'water' ? 3 + s.upgrades.water : kind === 'sow' ? 1 + s.upgrades.sow * 2 : Math.max(1, s.upgrades.harvest)
export const WATER_DURATION = 1.2
export const GERMINATION_SECONDS = 5
export const isGerminating = (p: Pot) => p.plant !== null && (p.germination ?? p.growth) < GERMINATION_SECONDS
export type Pot = { germination?: number; revealedAt?: number; watering?: number; plant: number | null; growth: number; wateredAt: number }
export type GameState = {
  logistics: 1; player: Worker; snails: Worker[]; randomState: number; workers: Record<WorkerKind, Worker>;
  economyVersion: 2; version: 1; coins: number; earned: number; elapsed: number; pots: Pot[];
  upgrades: Record<UpgradeId, number>; selected: number; discovered: number[];
  harvestCounts: number[]; untrackedHarvests: number;
  harvests: number; clicks: number; wonAt: number | null; autoClock: number; cursor: number;
  autoHarvest: boolean; autoSow: boolean; lastSaved: number; started: boolean;
}
const emptyPot = (): Pot => ({ plant: null, growth: 0, wateredAt: -10 })
export function newGame(): GameState {
  return { economyVersion: 2, logistics: 1, player: newWorker(8, 4), snails: Array.from({ length: 3 }, (_, i) => newWorker(8 + i * 7)), randomState: Math.floor(Math.random() * 4294967296), workers: { harvest: newWorker(6), sow: newWorker(16) }, version: 1, coins: 0, earned: 0, elapsed: 0, pots: Array.from({ length: INITIAL_POTS }, emptyPot),
    upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])) as GameState['upgrades'], selected: 0,
    discovered: [], harvestCounts: PLANTS.map(() => 0), untrackedHarvests: 0, harvests: 0, clicks: 0, wonAt: null, autoClock: 0, cursor: 0,
    autoHarvest: true, autoSow: true, lastSaved: Date.now(), started: false }
}
export function unlocked(s: GameState, tier: Tier) {
  return s.wonAt !== null || s.earned >= SEED_UNLOCK[tier]
}
/** Requirements apply to the next level; existing purchases keep working after migration. */
export function upgradeLock(s: GameState, id: UpgradeId): string | null {
  const rules: Partial<Record<UpgradeId, { time: number; earned: number; harvests: number; needs?: UpgradeId }>> = {
    snail: { time: 120, earned: 650, harvests: 18 },
    water: { time: 150, earned: 1000, harvests: 22, needs: 'snail' },
    speed: { time: 180, earned: 1600, harvests: 26, needs: 'water' },
    harvest: { time: 240, earned: 3200, harvests: 32, needs: 'speed' },
    sow: { time: 330, earned: 6000, harvests: 40, needs: 'harvest' },
  }
  const rule = rules[id]
  if (!rule) return null
  const level = s.upgrades[id]
  const conditions: string[] = []
  if (rule.needs && s.upgrades[rule.needs] === 0) conditions.push(`先购买${UPGRADES.find(u => u.id === rule.needs)!.name}`)
  const time = rule.time + level * 60, earned = rule.earned * (level + 1), harvests = rule.harvests + level * 10
  if (s.elapsed < time) conditions.push(`花园时光 ${formatTime(time)}`)
  if (s.earned < earned) conditions.push(`累计收益 ${earned}`)
  if (s.harvests < harvests) conditions.push(`收获 ${harvests} 株`)
  return conditions.length ? conditions.join(' · ') : null
}
export const price = (s: GameState, plant: Plant) => Math.ceil(plant.cost * (plant.tier === ULTIMATE_TIER ? 1 : 1 - s.upgrades.compost * .1))
export const upgradePrice = (s: GameState, u: Upgrade) => Math.round(u.cost * u.scale ** s.upgrades[u.id])
export const reward = (s: GameState, p: Plant) => Math.round(p.reward * (1 + s.upgrades.profit * .2))
export const clickPower = (s: GameState) => 2 + s.upgrades.click * 2
export const growthRate = (s: GameState) => 1 + s.upgrades.soil * .15
export const formatTime = (n: number) => `${Math.floor(n / 60).toString().padStart(2, '0')}:${Math.floor(n % 60).toString().padStart(2, '0')}`

function grow(s: GameState, i: number, amount: number) {
  const pot = s.pots[i]
  if (pot?.plant === null || !pot) return
  const plant = PLANTS[pot.plant]
  if (isGerminating(pot)) {
    pot.germination = Math.min(GERMINATION_SECONDS, (pot.germination ?? pot.growth) + amount)
    if (!isGerminating(pot) && plant.tier >= 2 && plant.tier < ULTIMATE_TIER) pot.revealedAt = s.elapsed
  }
  pot.growth = Math.min(plant.seconds, pot.growth + amount)
  if (pot.growth >= plant.seconds) {
    if (!s.discovered.includes(plant.id)) s.discovered.push(plant.id)
    if (plant.tier === ULTIMATE_TIER && s.wonAt === null) s.wonAt = s.elapsed
  }
}
function addCoins(s: GameState, n: number) { s.coins += n; s.earned += n }
function randomValue(s: GameState) {
  // Persisted PRNG keeps reducer replay, offline simulation and save/resume consistent.
  s.randomState = (s.randomState + 0x6D2B79F5) >>> 0
  let n = s.randomState
  n = Math.imul(n ^ n >>> 15, n | 1)
  n ^= n + Math.imul(n ^ n >>> 7, n | 61)
  const value = ((n ^ n >>> 14) >>> 0) / 4294967296
  return value
}
function weightedIndex(value: number, odds: readonly number[]) {
  let cumulative = 0
  return odds.findIndex((chance, i) => { cumulative += chance; return value < cumulative || i === odds.length - 1 })
}
export function randomPlant(s: GameState, tier: Tier) {
  if (tier === ULTIMATE_TIER) return ULTIMATE_ID
  const level = weightedIndex(randomValue(s), SEED_ODDS[tier])
  return TIER_PLANTS[level][weightedIndex(randomValue(s), SPECIES_ODDS)]
}
function plantIn(s: GameState, i: number, id: number) {
  if (s.pots[i].plant !== null) return
  const tier = PLANTS[id].tier
  const cost = price(s, PLANTS[seedPlantId(tier)])
  if (!unlocked(s, tier) || s.coins < cost) return
  id = randomPlant(s, tier)
  const plant = PLANTS[id]
  s.coins -= cost
  s.pots[i] = { plant: id, germination: 0, growth: plant.seconds * s.upgrades.lantern * .1, wateredAt: -10 }
}
function harvest(s: GameState, i: number, carrier?: Worker) {
  const p = s.pots[i]
  if (p.plant === null || p.growth < PLANTS[p.plant].seconds) return
  const id = p.plant
  const coins = reward(s, PLANTS[id])
  if (carrier) { carrier.cargo += coins; carrier.count++ } else addCoins(s, coins)
  s.harvests++
  s.harvestCounts[id]++
  s.pots[i] = emptyPot()
}
function water(s: GameState, i: number, auto = false) {
  const p = s.pots[i]
  if (p.plant === null || p.growth >= PLANTS[p.plant].seconds) return
  const amount = auto ? 3 + s.upgrades.water * 3 : clickPower(s)
  grow(s, i, amount)
  p.wateredAt = s.elapsed
  if (!auto) s.clicks++
}
function validTarget(s: GameState, kind: ActorKind, i: number | null) {
  if (i === null) return false
  const p = s.pots[i]
  return !!p && (kind === 'sow' ? p.plant === null : p.plant !== null && (kind === 'harvest' ? p.plant !== ULTIMATE_ID && p.growth >= PLANTS[p.plant].seconds : p.growth < PLANTS[p.plant].seconds))
}
function routeTo(w: Worker, destination: { x: number; y: number }) {
  if (Math.abs(w.y - destination.y) < .001) return [destination]
  const side = w.x + destination.x < 100 ? 6 : 94
  return [{ x: side, y: w.y }, { x: side, y: destination.y }, destination]
}
function sendToPot(w: Worker, index: number) {
  w.target = index; w.clock = 0; w.phase = 'walk'
  w.path = routeTo(w, { x: plantPosition(index).x, y: 33 + Math.floor(index / 5) * 29 })
}
function returnHome(w: Worker, kind: ActorKind) {
  w.target = null; w.clock = 0; w.phase = 'return'
  w.path = routeTo(w, STATIONS[kind === 'player' || kind === 'water' ? 'water' : kind])
}
function advanceWorker(s: GameState, kind: ActorKind, w: Worker, dt: number) {
  let remaining = dt
  while (remaining > .000001) {
    if ((w.phase === 'walk' || w.phase === 'act') && !validTarget(s, kind, w.target)) {
      w.phase = 'idle'; w.target = null; w.path = []; w.clock = 0
    }
    if (w.phase === 'idle') {
      if (kind === 'player') return
      const candidates = s.pots.map((_, i) => i).filter(i => validTarget(s, kind, i)
        && (kind !== 'water' || !s.snails.some(other => other !== w && other.target === i)))
      if (kind === 'harvest' ? w.count >= capacity(s, kind) || (w.count > 0 && !candidates.length) : w.stock === 0) { returnHome(w, kind); continue }
      if (!candidates.length) return
      candidates.sort((a, b) => {
        if (kind === 'harvest') return (a - s.cursor % s.pots.length + s.pots.length) % s.pots.length - (b - s.cursor % s.pots.length + s.pots.length) % s.pots.length
        const distance = (i: number) => { let at = { x: w.x, y: w.y }, sum = 0; for (const next of routeTo(w, { x: plantPosition(i).x, y: 33 + Math.floor(i / 5) * 29 })) { sum += Math.hypot(next.x - at.x, next.y - at.y); at = next } return sum }
        return distance(a) - distance(b) || a - b
      })
      sendToPot(w, candidates[0])
      if (kind === 'harvest') s.cursor = candidates[0] + 1
    }
    if (w.phase === 'walk' || w.phase === 'return') {
      const next = w.path[0]
      if (!next) { w.phase = w.phase === 'return' ? 'service' : 'act'; w.clock = 0; continue }
      const speed = kind === 'player' ? 110 : kind === 'water' ? 24 + s.upgrades.speed * 9 : 38
      const dx = next.x - w.x, dy = next.y - w.y, distance = Math.hypot(dx, dy)
      const spent = Math.min(remaining, distance / speed)
      if (Math.abs(dx) > .001) w.facing = dx < 0 ? -1 : 1
      if (distance > .001) { w.x += dx / distance * spent * speed; w.y += dy / distance * spent * speed }
      remaining -= spent
      if (distance <= spent * speed + .001) { w.x = next.x; w.y = next.y; w.path.shift() }
      continue
    }
    const duration = w.phase === 'service' ? 1.2 : .9
    const spent = Math.min(remaining, duration - w.clock)
    w.clock += spent; remaining -= spent
    if (w.clock >= duration - .000001) {
      if (w.phase === 'service') {
        if (kind === 'harvest') { addCoins(s, w.cargo); w.cargo = 0; w.count = 0 }
        else w.stock = capacity(s, kind)
      } else if (validTarget(s, kind, w.target)) {
        if (kind === 'harvest') harvest(s, w.target!, w)
        else if (kind === 'sow') { plantIn(s, w.target!, s.coins >= price(s, PLANTS[s.selected]) ? s.selected : 0); w.stock-- }
        else { water(s, w.target!, kind !== 'player'); w.stock-- }
      }
      w.phase = 'idle'; w.clock = 0; w.target = null
    }
  }
}
function advance(s: GameState, dt: number) {
  s.elapsed += dt
  const rate = growthRate(s)
  s.pots.forEach((_, i) => grow(s, i, dt * rate))
  s.pots.forEach((p, i) => {
    if ((p.watering ?? 0) > 0) {
      p.watering = Math.max(0, p.watering! - dt)
      if (p.watering <= .000001) { p.watering = 0; water(s, i) }
    }
  })
  if (s.player.phase === 'service') advanceWorker(s, 'player', s.player, dt)
  s.snails.slice(0, s.upgrades.snail).forEach(w => advanceWorker(s, 'water', w, dt))
  if (s.upgrades.harvest && s.autoHarvest) advanceWorker(s, 'harvest', s.workers.harvest, dt)
  if (s.upgrades.sow && s.autoSow && s.selected !== ULTIMATE_ID) advanceWorker(s, 'sow', s.workers.sow, dt)
}
export type Action = { type: 'dig'; index: number } | { type: 'water'; index: number } | { type: 'move'; from: number; to: number } | { type: 'refill' } | { type: 'tick'; dt: number } | { type: 'pot'; index: number } | { type: 'select'; id: number }
  | { type: 'buy'; id: UpgradeId } | { type: 'toggle'; key: 'autoHarvest' | 'autoSow' } | { type: 'start' } | { type: 'reset' }
export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'reset') return { ...newGame(), started: true }
  if (action.type === 'select') return PLANTS[action.id] && unlocked(state, PLANTS[action.id].tier) ? { ...state, selected: seedPlantId(PLANTS[action.id].tier) } : state
  if (action.type === 'start') return { ...state, started: true }
  if (action.type === 'toggle') return { ...state, [action.key]: !state[action.key] }
  const clone = (w: Worker): Worker => ({ ...w, path: w.path.map(p => ({ ...p })) })
  const s = { ...state, player: clone(state.player), snails: state.snails.map(clone), workers: Object.fromEntries(Object.entries(state.workers).map(([key, w]) => [key, { ...w, path: w.path.map(p => ({ ...p })) }])) as GameState['workers'], pots: state.pots.map(p => ({ ...p })), upgrades: { ...state.upgrades }, discovered: [...state.discovered], harvestCounts: [...state.harvestCounts] }
  if (action.type === 'tick' && s.started) {
    let remaining = Math.min(1800, Math.max(0, action.dt))
    // Fixed upper step preserves effect and automation ordering during offline catch-up.
    while (remaining > 0) { const dt = Math.min(remaining, .5); advance(s, dt); remaining -= dt }
  }
  if (action.type === 'pot' && s.pots[action.index]) {
    const p = s.pots[action.index]
    if (p.plant === null) plantIn(s, action.index, s.selected)
    else if (p.growth >= PLANTS[p.plant].seconds) harvest(s, action.index)

  }
  if (action.type === 'water' && validTarget(s, 'player', action.index) && s.player.phase === 'idle' && s.player.stock > 0 && !(s.pots[action.index].watering! > 0)) {
    s.pots[action.index].watering = WATER_DURATION; s.player.stock--
  }
  if (action.type === 'refill' && s.player.phase === 'idle' && s.player.stock < capacity(s, 'player')) {
    s.player.phase = 'service'; s.player.target = null; s.player.clock = 0; s.player.path = []
  }
  if (action.type === 'dig' && s.pots[action.index]?.plant != null) {
    // Discarding is not harvesting: no coins, count, discoveries or plant effects.
    s.pots[action.index] = emptyPot()
    for (const w of [s.player, ...s.snails, ...Object.values(s.workers)]) {
      if (w.target === action.index) { w.phase = 'idle'; w.target = null; w.clock = 0; w.path = [] }
    }
  }
  if (action.type === 'move' && action.from !== action.to && s.pots[action.from]?.plant != null && s.pots[action.to]) {
    // Move the whole pot state, preserving growth, discovery and watering history.
    ;[s.pots[action.from], s.pots[action.to]] = [s.pots[action.to], s.pots[action.from]]
    for (const w of [s.player, ...s.snails, ...Object.values(s.workers)]) {
      if (w.target === action.from || w.target === action.to) {
        w.phase = 'idle'; w.target = null; w.clock = 0; w.path = []
      }
    }
  }
  if (action.type === 'buy') {
    const u = UPGRADES.find(u => u.id === action.id)!
    const cost = upgradePrice(s, u)
    if (s.upgrades[u.id] < u.max && s.coins >= cost && !upgradeLock(s, u.id)) {
      s.coins -= cost; s.upgrades[u.id]++
      if (u.id === 'pots') s.pots.push(emptyPot())
    }
  }
  return s
}

export const SAVE_KEY = 'moon-garden-save-v1'
export function parseSave(raw: string | null): GameState | null {
  try {
    if (!raw) return null
    const s = JSON.parse(raw) as GameState
    const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0
    if (s.economyVersion === undefined && s.version === 1 && Array.isArray(s.pots) && s.upgrades
      && Number.isInteger(s.upgrades.pots) && s.upgrades.pots >= 0 && s.upgrades.pots <= 9 && s.pots.length === 6 + s.upgrades.pots) {
      const oldSeconds = [20, 30, 42, 35, 45, 55, 70, 90, 110, 480]
      for (const p of s.pots) if (p && p.plant !== null && oldSeconds[p.plant] && finite(p.growth)) p.growth = Math.min(1, p.growth / oldSeconds[p.plant]) * PLANTS[p.plant].seconds
      while (s.pots.length < INITIAL_POTS) s.pots.push(emptyPot())
      s.upgrades.pots = s.pots.length - INITIAL_POTS
      s.economyVersion = 2
    }
    if (s.economyVersion !== 2) return null
    if (s.version !== 1 || !finite(s.coins) || !finite(s.earned) || !finite(s.elapsed) || !finite(s.lastSaved)
      || !finite(s.harvests) || !finite(s.clicks) || !finite(s.autoClock) || !finite(s.cursor)
      || !Number.isInteger(s.selected) || !PLANTS[s.selected] || typeof s.started !== 'boolean'
      || typeof s.autoHarvest !== 'boolean' || typeof s.autoSow !== 'boolean'
      || (s.wonAt !== null && !finite(s.wonAt)) || !Array.isArray(s.pots) || s.pots.length < INITIAL_POTS || s.pots.length > 15
      || !Array.isArray(s.discovered) || s.discovered.some(id => !Number.isInteger(id) || !PLANTS[id])
      || !s.upgrades || UPGRADES.some(u => !Number.isInteger(s.upgrades[u.id]) || s.upgrades[u.id] < 0 || s.upgrades[u.id] > u.max)
      || s.pots.length !== INITIAL_POTS + s.upgrades.pots
      || s.pots.some(p => !p || (p.plant !== null && (!Number.isInteger(p.plant) || !PLANTS[p.plant])) || (p.germination !== undefined && (!finite(p.germination) || p.germination > GERMINATION_SECONDS)) || (p.revealedAt !== undefined && !finite(p.revealedAt)) || !finite(p.growth) || !Number.isFinite(p.wateredAt) || (p.watering !== undefined && (!finite(p.watering) || p.watering > WATER_DURATION || (p.plant === null && p.watering > 0))))) return null
    // Older saves recorded total harvests and maturity discoveries, not species counts.
    // Do not invent per-species history from a plant merely reaching maturity.
    if (s.harvestCounts === undefined) { s.harvestCounts = PLANTS.map(() => 0); s.untrackedHarvests = s.harvests }
    if (!Array.isArray(s.harvestCounts) || s.harvestCounts.length !== PLANTS.length
      || s.harvestCounts.some(n => !Number.isSafeInteger(n) || n < 0)
      || !Number.isSafeInteger(s.untrackedHarvests) || s.untrackedHarvests < 0) return null
    s.selected = seedPlantId(PLANTS[s.selected].tier)
    if (s.randomState === undefined) s.randomState = s.lastSaved >>> 0
    if (!Number.isInteger(s.randomState) || s.randomState < 0 || s.randomState > 4294967295) return null
    if (s.logistics === undefined) {
      s.logistics = 1; s.workers = { harvest: newWorker(88), sow: newWorker(48) }
      s.player = newWorker(8, capacity(s, 'player')); s.snails = Array.from({ length: 3 }, (_, i) => newWorker(8 + i * 7))
    }
    if (s.logistics !== 1 || !s.workers || !Array.isArray(s.snails) || s.snails.length !== 3) return null
    for (const w of [s.player, ...s.snails, s.workers.harvest, s.workers.sow]) {
      if (!w || !finite(w.x) || w.x > 100 || !finite(w.y) || w.y > 100 || ![-1, 1].includes(w.facing)
        || !['idle', 'walk', 'act', 'return', 'service'].includes(w.phase) || !finite(w.clock) || w.clock > 1.2
        || !Number.isInteger(w.stock) || w.stock < 0 || w.stock > 10 || !finite(w.cargo) || !Number.isInteger(w.count) || w.count < 0 || w.count > 3
        || (w.target !== null && (!Number.isInteger(w.target) || w.target < 0 || w.target >= s.pots.length))
        || (['walk', 'act'].includes(w.phase) && w.target === null) || !Array.isArray(w.path) || w.path.length > 3
        || w.path.some(p => !p || !finite(p.x) || p.x > 100 || !finite(p.y) || p.y > 100)) return null
    }
    // Reserve the charge for an older save's single in-flight action exactly once.
    if (s.player.phase === 'walk' || s.player.phase === 'act') {
      const target = s.player.target
      if (target !== null && validTarget(s, 'player', target) && s.player.stock > 0) {
        s.pots[target].watering = WATER_DURATION; s.player.stock--
      }
      s.player.phase = 'idle'; s.player.target = null; s.player.clock = 0; s.player.path = []
    }
    if (s.player.phase === 'return') { s.player.phase = 'service'; s.player.clock = 0; s.player.path = [] }
    return s
  } catch { return null }
}
