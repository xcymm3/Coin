// Version 3 engine retained only to validate and migrate historical saves.
import { DECORATIONS } from './collectibles.ts'
export * from './collectibles.ts'
import { plantPosition } from './gardenScene.ts'
import { PLANTS, ULTIMATE_ID, ULTIMATE_TIER, INITIAL_POTS, TIER_PLANTS, SEED_UNLOCK, SEED_ODDS, SPECIES_ODDS, seedPlantId, type Tier, type Plant } from './catalog.ts'
export * from './catalog.ts'
import { UPGRADES, GARDENS, EFFECT_IDS, ULTIMATE_PURCHASES, type EffectId, type UpgradeId, type Upgrade } from './legacyUpgrades.ts'
export * from './legacyUpgrades.ts'
export type WorkerKind = 'harvest' | 'sow'
export type ActorKind = WorkerKind | 'water' | 'player'
export type Worker = { x: number; y: number; facing: number; phase: 'idle' | 'walk' | 'act' | 'return' | 'service'; target: number | null; clock: number; path: { x: number; y: number }[]; stock: number; cargo: number; count: number }
export const STATIONS = { water: { x: 8, y: 96 }, sow: { x: 48, y: 96 }, harvest: { x: 88, y: 96 } }
const newWorker = (x: number, stock = 0): Worker => ({ x, y: 91, facing: 1, phase: 'idle', target: null, clock: 0, path: [], stock, cargo: 0, count: 0 })
export const capacity = (s: GameState, kind: ActorKind) => kind === 'player' ? 4 * 2 ** s.upgrades.splash : kind === 'water' ? 8 : Math.min(64, 2 ** Math.max(0,s.upgrades[kind]-1))
export const workerDuration = (s: GameState, service = false) => Math.max(.2, (service ? 1.2 : .9) / (1 + s.upgrades.speed * .5))
export const gardenCount = (s: GameState) => Math.ceil(s.pots.length / 15)
export const teamFor = (s: GameState, page: number): Team => page === 0 ? s : s.extraTeams[page-1]
export const gardenReward = (page: number) => GARDENS[page].reward
export const highestSeed = (s: GameState): Tier => { let tier: Tier = 4; while(tier>0 && !unlocked(s,tier)) tier=(tier-1) as Tier; return tier }
export const upgradeChapter = (s: GameState) => UPGRADES.find(u=>!s.purchases.includes(u.id))?.chapter ?? 20
export const WATER_DURATION = 1.2
export const GERMINATION_SECONDS = 5
export const isGerminating = (p: Pot) => p.plant !== null && (p.germination ?? p.growth) < GERMINATION_SECONDS
export type Pot = { variant?: number; germination?: number; revealedAt?: number; watering?: number; plant: number | null; growth: number; wateredAt: number }
export type Team = { snails: Worker[]; workers: Record<WorkerKind,Worker>; cursor: number }
export type GameState = {
  fertilizer: number; extraRandom: number; variants: string[]; decorations: string[]; hiddenDecorations: string[]; weather: {kind:number;started:number;next:number};
  campaignVersion: 3; activeGarden: number; extraTeams: Team[]; purchases: string[]; stats: { manualGrowth: number; autoGrowth: number; manualCoins: number; autoCoins: number };
  logistics: 1; player: Worker; snails: Worker[]; randomState: number; workers: Record<WorkerKind, Worker>;
  economyVersion: 2; version: 1; coins: number; earned: number; elapsed: number; pots: Pot[];
  upgrades: Record<EffectId, number>; selected: number; discovered: number[];
  harvestCounts: number[]; untrackedHarvests: number;
  harvests: number; clicks: number; wonAt: number | null; autoClock: number; cursor: number;
  autoHarvest: boolean; autoSow: boolean; lastSaved: number; started: boolean;
}
const newTeam = (): Team => ({ snails: Array.from({length:3},(_,i)=>newWorker(8+i*7)), workers:{harvest:newWorker(88),sow:newWorker(48)},cursor:0 })
const emptyPot = (): Pot => ({ plant: null, growth: 0, wateredAt: -10 })
export function newGame(): GameState {
  return { fertilizer:0, extraRandom:Math.floor(Math.random()*4294967296), variants:[], decorations:[], hiddenDecorations:[], weather:{kind:0,started:-20,next:300+Math.random()*300}, campaignVersion: 3, activeGarden: 0, extraTeams: [], purchases: [], stats: {manualGrowth:0,autoGrowth:0,manualCoins:0,autoCoins:0}, economyVersion: 2, logistics: 1, player: newWorker(8, 4), snails: Array.from({ length: 3 }, (_, i) => newWorker(8 + i * 7)), randomState: Math.floor(Math.random() * 4294967296), workers: { harvest: newWorker(6), sow: newWorker(16) }, version: 1, coins: 0, earned: 0, elapsed: 0, pots: Array.from({ length: INITIAL_POTS }, emptyPot),
    upgrades: Object.fromEntries(EFFECT_IDS.map(id => [id, 0])) as GameState['upgrades'], selected: 0,
    discovered: [], harvestCounts: PLANTS.map(() => 0), untrackedHarvests: 0, harvests: 0, clicks: 0, wonAt: null, autoClock: 0, cursor: 0,
    autoHarvest: true, autoSow: true, lastSaved: Date.now(), started: false }
}
export function unlocked(s: GameState, tier: Tier) {
  return s.wonAt !== null || (s.earned >= SEED_UNLOCK[tier] && (tier !== ULTIMATE_TIER || s.purchases.length >= ULTIMATE_PURCHASES && gardenCount(s) === 5))
}
export function upgradeLock(s: GameState, id: UpgradeId): string | null {
 const u=UPGRADES.find(u=>u.id===id)
 if(!u) return '未知改造'
 if(u.chapter===0) return null
 const previous=UPGRADES.filter(v=>v.chapter===u.chapter-1)
 return previous.every(v=>s.purchases.includes(v.id)) ? null : `完成第 ${u.chapter} 组改造（${previous.filter(v=>s.purchases.includes(v.id)).length}/3）`
}
export const price = (s: GameState, plant: Plant) => Math.ceil(plant.cost * (plant.tier === ULTIMATE_TIER ? 1 : 2 ** -s.upgrades.compost))
export const upgradePrice = (_s: GameState, u: Upgrade) => u.cost
export const reward = (s: GameState, p: Plant, page = s.activeGarden) => Math.round(p.reward * 2 ** s.upgrades.profit * gardenReward(page))
export const clickPower = (s: GameState) => 2 * 2 ** s.upgrades.click
export const growthRate = (s: GameState, page = s.activeGarden) => 2 ** s.upgrades.soil * GARDENS[page].growth
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
    const key = `${plant.id}:${pot.variant ?? 0}`
    if (pot.variant && !s.variants.includes(key)) s.variants.push(key)
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
function extraRandom(s: GameState) {
  s.extraRandom = (Math.imul(s.extraRandom,1664525)+1013904223) >>> 0
  return s.extraRandom / 4294967296
}
function plantIn(s: GameState, i: number, id: number) {
  if (s.pots[i].plant !== null) return
  const tier = PLANTS[id].tier
  const cost = price(s, PLANTS[seedPlantId(tier)])
  if (!unlocked(s, tier) || s.coins < cost) return
  id = randomPlant(s, tier)
  const plant = PLANTS[id]
  s.coins -= cost
  const roll=extraRandom(s), variant=roll<.94?0:roll<.97?1:roll<.99?2:3
  s.pots[i] = { variant, plant: id, germination: 0, growth: plant.seconds * (1 - 2 ** -s.upgrades.lantern), wateredAt: -10 }
}
function harvest(s: GameState, i: number, carrier?: Worker) {
  const p = s.pots[i]
  if (p.plant === null || p.growth < PLANTS[p.plant].seconds) return
  const id = p.plant
  const coins = reward(s, PLANTS[id], Math.floor(i/15))
  if (carrier) { carrier.cargo += coins; carrier.count++ } else { addCoins(s, coins); s.stats.manualCoins += coins }
  if (extraRandom(s) < .01) s.fertilizer++
  s.harvests++
  s.harvestCounts[id]++
  s.pots[i] = emptyPot()
}
function water(s: GameState, i: number, auto = false) {
  const p = s.pots[i]
  if (p.plant === null || p.growth >= PLANTS[p.plant].seconds) return
  const amount = auto ? 3 * 2 ** s.upgrades.water : clickPower(s)
  s.stats[auto ? "autoGrowth" : "manualGrowth"] += Math.min(amount, PLANTS[p.plant].seconds-p.growth)
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
  w.path = routeTo(w, { x: plantPosition(index % 15).x, y: 33 + Math.floor((index % 15) / 5) * 29 })
}
function returnHome(w: Worker, kind: ActorKind) {
  w.target = null; w.clock = 0; w.phase = 'return'
  w.path = routeTo(w, STATIONS[kind === 'player' || kind === 'water' ? 'water' : kind])
}
function advanceWorker(s: GameState, kind: ActorKind, w: Worker, dt: number, page = 0) {
  const team = teamFor(s,page)
  let remaining = dt
  while (remaining > .000001) {
    if ((w.phase === 'walk' || w.phase === 'act') && !validTarget(s, kind, w.target)) {
      w.phase = 'idle'; w.target = null; w.path = []; w.clock = 0
    }
    if (w.phase === 'idle') {
      if (kind === 'player') return
      const candidates = s.pots.slice(page*15,page*15+15).map((_, i) => i+page*15).filter(i => validTarget(s, kind, i)
        && (kind !== 'water' || !team.snails.some(other => other !== w && other.target === i)))
      if (kind === 'harvest' ? w.count >= capacity(s, kind) || (w.count > 0 && !candidates.length) : w.stock === 0) { returnHome(w, kind); continue }
      if (!candidates.length) return
      candidates.sort((a, b) => {
        if (kind === 'harvest') return (a - team.cursor % s.pots.length + s.pots.length) % s.pots.length - (b - team.cursor % s.pots.length + s.pots.length) % s.pots.length
        const distance = (i: number) => { let at = { x: w.x, y: w.y }, sum = 0; for (const next of routeTo(w, { x: plantPosition(i % 15).x, y: 33 + Math.floor((i % 15) / 5) * 29 })) { sum += Math.hypot(next.x - at.x, next.y - at.y); at = next } return sum }
        return distance(a) - distance(b) || a - b
      })
      sendToPot(w, candidates[0])
      if (kind === 'harvest') team.cursor = candidates[0] + 1
    }
    if (w.phase === 'walk' || w.phase === 'return') {
      const next = w.path[0]
      if (!next) { w.phase = w.phase === 'return' ? 'service' : 'act'; w.clock = 0; continue }
      const speed = kind === 'player' ? 110 : (kind === 'water' ? 24 : 38) * 2 ** s.upgrades.speed
      const dx = next.x - w.x, dy = next.y - w.y, distance = Math.hypot(dx, dy)
      const spent = Math.min(remaining, distance / speed)
      if (Math.abs(dx) > .001) w.facing = dx < 0 ? -1 : 1
      if (distance > .001) { w.x += dx / distance * spent * speed; w.y += dy / distance * spent * speed }
      remaining -= spent
      if (distance <= spent * speed + .001) { w.x = next.x; w.y = next.y; w.path.shift() }
      continue
    }
    const duration = kind === 'player' ? 1.2 : workerDuration(s, w.phase === 'service')
    const spent = Math.min(remaining, Math.max(0, duration - w.clock))
    w.clock += spent; remaining -= spent
    if (w.clock >= duration - .000001) {
      if (w.phase === 'service') {
        if (kind === 'harvest') { addCoins(s, w.cargo); s.stats.autoCoins += w.cargo; w.cargo = 0; w.count = 0 }
        else w.stock = capacity(s, kind)
      } else if (validTarget(s, kind, w.target)) {
        if (kind === 'harvest') harvest(s, w.target!, w)
        else if (kind === 'sow') { const id=seedPlantId(highestSeed(s)); plantIn(s, w.target!, s.coins >= price(s, PLANTS[id]) ? id : 0); w.stock-- }
        else { water(s, w.target!, kind !== 'player'); w.stock-- }
      }
      w.phase = 'idle'; w.clock = 0; w.target = null
    }
  }
}
function advance(s: GameState, dt: number) {
  s.elapsed += dt
  while (s.elapsed >= s.weather.next) { const started=s.weather.next; s.weather={kind:Math.floor(extraRandom(s)*3),started,next:started+300+extraRandom(s)*300} }
  s.pots.forEach((_, i) => grow(s, i, dt * growthRate(s, Math.floor(i/15))))
  s.pots.forEach((p, i) => {
    if ((p.watering ?? 0) > 0) {
      p.watering = Math.max(0, p.watering! - dt)
      if (p.watering <= .000001) { p.watering = 0; water(s, i) }
    }
  })
  if (s.player.phase === 'service') advanceWorker(s, 'player', s.player, dt)
  for(let page=0;page<gardenCount(s);page++) {
    const team=teamFor(s,page)
    if(s.upgrades.snail) team.snails.forEach(w=>advanceWorker(s,'water',w,dt,page))
    if(s.upgrades.harvest && s.autoHarvest) advanceWorker(s,'harvest',team.workers.harvest,dt,page)
    if(s.upgrades.sow && s.autoSow && !(page===s.activeGarden && s.selected===ULTIMATE_ID)) advanceWorker(s,'sow',team.workers.sow,dt,page)
  }
}
export type Action = {type:'fertilize';index:number} | {type:'decorate';id:string} | {type:'decoration-toggle';id:string} | { type: 'garden'; index: number } | { type: 'dig'; index: number } | { type: 'water'; index: number } | { type: 'move'; from: number; to: number } | { type: 'refill' } | { type: 'tick'; dt: number } | { type: 'pot'; index: number } | { type: 'select'; id: number }
  | { type: 'buy'; id: UpgradeId } | { type: 'toggle'; key: 'autoHarvest' | 'autoSow' } | { type: 'start' } | { type: 'reset' }
export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'reset') return { ...newGame(), started: true }
  if (action.type === 'garden') return Number.isInteger(action.index) && action.index >= 0 && action.index < gardenCount(state) ? {...state,activeGarden:action.index} : state
  if (action.type === 'select') return PLANTS[action.id] && unlocked(state, PLANTS[action.id].tier) ? { ...state, selected: seedPlantId(PLANTS[action.id].tier) } : state
  if (action.type === 'start') return { ...state, started: true }
  if (action.type === 'toggle') return { ...state, [action.key]: !state[action.key] }
  const clone = (w: Worker): Worker => ({ ...w, path: w.path.map(p => ({ ...p })) })
  const s = { ...state, variants:[...state.variants], decorations:[...state.decorations], hiddenDecorations:[...state.hiddenDecorations], weather:{...state.weather}, player: clone(state.player), snails: state.snails.map(clone), workers: Object.fromEntries(Object.entries(state.workers).map(([key, w]) => [key, { ...w, path: w.path.map(p => ({ ...p })) }])) as GameState['workers'], pots: state.pots.map(p => ({ ...p })), upgrades: { ...state.upgrades }, discovered: [...state.discovered], harvestCounts: [...state.harvestCounts], purchases: [...state.purchases], stats: {...state.stats}, extraTeams: state.extraTeams.map(t=>({cursor:t.cursor,snails:t.snails.map(clone),workers:{harvest:clone(t.workers.harvest),sow:clone(t.workers.sow)}})) }
  if (action.type === 'tick' && s.started) {
    let remaining = Math.min(1800, Math.max(0, action.dt))
    // Fixed upper step preserves effect and automation ordering during offline catch-up.
    while (remaining > 0) { const dt = Math.min(remaining, .5); advance(s, dt); remaining -= dt }
  }
  if (action.type === 'fertilize') {
    const p=s.pots[action.index]
    if(s.fertilizer>0 && p?.plant != null && p.plant!==ULTIMATE_ID && p.growth<PLANTS[p.plant].seconds) {
      s.fertilizer--;p.watering=0;grow(s,action.index,PLANTS[p.plant].seconds)
    }
  }
  if(action.type==='decorate') {
    const item=DECORATIONS.find(d=>d.id===action.id)
    if(item && !s.decorations.includes(item.id) && s.coins>=item.cost){s.coins-=item.cost;s.decorations.push(item.id)}
  }
  if(action.type==='decoration-toggle' && s.decorations.includes(action.id)) {
    s.hiddenDecorations=s.hiddenDecorations.includes(action.id)?s.hiddenDecorations.filter(id=>id!==action.id):[...s.hiddenDecorations,action.id]
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
    for (const w of [s.player, ...Array.from({length:gardenCount(s)},(_,p)=>{const t=teamFor(s,p);return [...t.snails,...Object.values(t.workers)]}).flat()]) {
      if (w.target === action.index) { w.phase = 'idle'; w.target = null; w.clock = 0; w.path = [] }
    }
  }
  if (action.type === 'move' && Math.floor(action.from/15)===Math.floor(action.to/15) && action.from !== action.to && s.pots[action.from]?.plant != null && s.pots[action.to]) {
    // Move the whole pot state, preserving growth, discovery and watering history.
    ;[s.pots[action.from], s.pots[action.to]] = [s.pots[action.to], s.pots[action.from]]
    for (const w of [s.player, ...Array.from({length:gardenCount(s)},(_,p)=>{const t=teamFor(s,p);return [...t.snails,...Object.values(t.workers)]}).flat()]) {
      if (w.target === action.from || w.target === action.to) {
        w.phase = 'idle'; w.target = null; w.clock = 0; w.path = []
      }
    }
  }
  if (action.type === 'buy') {
    const u = UPGRADES.find(u => u.id === action.id)
    if (u && !s.purchases.includes(u.id) && s.coins >= u.cost && !upgradeLock(s,u.id)) {
      s.coins -= u.cost; s.purchases.push(u.id); s.upgrades[u.effect]++
      if(u.effect==='pots') while(s.pots.length<15) s.pots.push(emptyPot())
      if(u.effect==='garden' && gardenCount(s)<5) {
        while(s.pots.length%15) s.pots.push(emptyPot())
        s.pots.push(...Array.from({length:15},emptyPot));s.extraTeams.push(newTeam())
        s.activeGarden=gardenCount(s)-1
      }
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
    // Legacy saves start with no invented collection history or consumables.
    if(s.fertilizer===undefined)s.fertilizer=0
    if(s.extraRandom===undefined)s.extraRandom=(s.randomState??s.lastSaved)>>>0
    if(s.variants===undefined)s.variants=[]
    if(s.decorations===undefined)s.decorations=[]
    if(s.hiddenDecorations===undefined)s.hiddenDecorations=[]
    if(s.weather===undefined)s.weather={kind:0,started:-20,next:s.elapsed+300}
    if(!Number.isSafeInteger(s.fertilizer)||s.fertilizer<0||!Number.isInteger(s.extraRandom)||s.extraRandom<0||s.extraRandom>4294967295
      ||!Array.isArray(s.variants)||new Set(s.variants).size!==s.variants.length||s.variants.some(k=>typeof k!=='string'||!/^([0-9]|1[0-9]|20):[1-3]$/.test(k))
      ||![s.decorations,s.hiddenDecorations].every(a=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(id=>DECORATIONS.some(d=>d.id===id)))
      ||s.hiddenDecorations.some(id=>!s.decorations.includes(id))||!s.weather||![0,1,2].includes(s.weather.kind)||!Number.isFinite(s.weather.started)||!finite(s.weather.next)||s.weather.next<=s.elapsed
      ||s.pots?.some(p=>p.variant!==undefined&&![0,1,2,3].includes(p.variant)))return null
    if (s.economyVersion === undefined && s.version === 1 && Array.isArray(s.pots) && s.upgrades
      && Number.isInteger(s.upgrades.pots) && s.upgrades.pots >= 0 && s.upgrades.pots <= 9 && s.pots.length === 6 + s.upgrades.pots) {
      const oldSeconds = [20, 30, 42, 35, 45, 55, 70, 90, 110, 480]
      for (const p of s.pots) if (p && p.plant !== null && oldSeconds[p.plant] && finite(p.growth)) p.growth = Math.min(1, p.growth / oldSeconds[p.plant]) * PLANTS[p.plant].seconds
      while (s.pots.length < INITIAL_POTS) s.pots.push(emptyPot())
      s.upgrades.pots = s.pots.length - INITIAL_POTS
      s.economyVersion = 2
    }
    if (s.economyVersion !== 2) return null
    if (s.campaignVersion === undefined && s.upgrades && Array.isArray(s.pots) && s.pots.length>=10 && s.pots.length<=15) {
      const old=s.upgrades
      // Retired seed discounts return their original purchase costs once.
      if (Number.isInteger(old.compost) && old.compost > 0 && old.compost <= 3) s.coins += 450 * (2 ** old.compost - 1)
      s.purchases=[];s.upgrades=Object.fromEntries(EFFECT_IDS.map(id=>[id,0])) as Record<EffectId,number>
      // Existing purchases carry over as the earliest independent choices of each family.
      for(const effect of EFFECT_IDS) for(const u of UPGRADES.filter(u=>u.effect===effect).slice(0, Math.max(0,Math.min(old[effect]??0, effect==='pots'?1:99)))) {s.purchases.push(u.id);s.upgrades[effect]++}
      if(s.upgrades.pots) while(s.pots.length<15) s.pots.push(emptyPot())
      s.campaignVersion=3;s.activeGarden=0;s.extraTeams=[];s.stats={manualGrowth:0,autoGrowth:0,manualCoins:0,autoCoins:0}
    }
    if(s.campaignVersion!==3 || !Array.isArray(s.purchases) || new Set(s.purchases).size!==s.purchases.length || s.purchases.some(id=>!UPGRADES.some(u=>u.id===id))
      || !Number.isInteger(s.activeGarden) || s.activeGarden<0 || s.activeGarden>=Math.ceil(s.pots.length/15)
      || !Array.isArray(s.extraTeams) || s.extraTeams.length!==Math.ceil(s.pots.length/15)-1 || !s.stats || ['manualGrowth','autoGrowth','manualCoins','autoCoins'].some(k=>!finite(s.stats[k as keyof GameState['stats']])) || s.extraTeams.some(t=>!t || !Number.isSafeInteger(t.cursor) || t.cursor<0 || !Array.isArray(t.snails) || t.snails.length!==3 || !t.workers)) return null
    if (s.version !== 1 || !finite(s.coins) || !finite(s.earned) || !finite(s.elapsed) || !finite(s.lastSaved)
      || !finite(s.harvests) || !finite(s.clicks) || !finite(s.autoClock) || !finite(s.cursor)
      || !Number.isInteger(s.selected) || !PLANTS[s.selected] || typeof s.started !== 'boolean'
      || typeof s.autoHarvest !== 'boolean' || typeof s.autoSow !== 'boolean'
      || (s.wonAt !== null && !finite(s.wonAt)) || !Array.isArray(s.pots) || s.pots.length < INITIAL_POTS || s.pots.length > 75
      || !Array.isArray(s.discovered) || s.discovered.some(id => !Number.isInteger(id) || !PLANTS[id])
      || !s.upgrades || EFFECT_IDS.some(id => !Number.isInteger(s.upgrades[id]) || s.upgrades[id] < 0 || s.upgrades[id] !== s.purchases.filter(key=>UPGRADES.find(u=>u.id===key)!.effect===id).length)
      || (s.pots.length !== (s.upgrades.pots ? 15 : 10) + 15 * s.upgrades.garden)
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
    for (const w of [s.player, ...Array.from({length:gardenCount(s)},(_,p)=>{const t=teamFor(s,p);return [...t.snails,t.workers.harvest,t.workers.sow]}).flat()]) {
      if (!w || !finite(w.x) || w.x > 100 || !finite(w.y) || w.y > 100 || ![-1, 1].includes(w.facing)
        || !['idle', 'walk', 'act', 'return', 'service'].includes(w.phase) || !finite(w.clock) || w.clock > 1.2
        || !Number.isInteger(w.stock) || w.stock < 0 || w.stock > 1024 || !finite(w.cargo) || !Number.isInteger(w.count) || w.count < 0 || w.count > 64
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
