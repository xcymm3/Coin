import { parseSave as parseLegacySave } from './legacyGame.ts'
import { DECORATIONS, variantFor } from './collectibles.ts'
export * from './collectibles.ts'
import { plantPosition } from './gardenScene.ts'
import { PLANTS, ULTIMATE_ID, ULTIMATE_TIER, INITIAL_POTS, TIER_PLANTS, SEED_ODDS, SPECIES_ODDS, PROGRESSION_THRESHOLDS, SEED_UNLOCK, seedPlantId, plantChance, type Tier, type Plant } from './catalog.ts'
export * from './catalog.ts'
import {PLANTS as PREVIOUS_PLANTS} from './legacyCatalog.ts'
import { UPGRADES, GARDENS, EFFECT_IDS, hireCatalog, decorationPrice, GARDEN_PRICES, type CrewKind, type HireOption, type EffectId, type UpgradeId, type Upgrade } from './upgrades.ts'
import { formatNumber } from './format.ts'
export * from './upgrades.ts'
export type WorkerKind = 'harvest' | 'sow'
export type ActorKind = WorkerKind | 'water' | 'player'
export type Worker = { x: number; y: number; facing: number; phase: 'idle' | 'walk' | 'act' | 'return' | 'service'; target: number | null; clock: number; path: { x: number; y: number }[]; stock: number; cargo: number; count: number }
// Helpers stop just in front of the ground-level supply decals instead of overlapping them.
export const STATIONS = { water: { x: 8, y: 92 }, sow: { x: 48, y: 92 }, harvest: { x: 88, y: 92 } }
const newWorker = (x: number, stock = 0): Worker => ({ x, y: 91, facing: 1, phase: 'idle', target: null, clock: 0, path: [], stock, cargo: 0, count: 0 })
export const teamFor = (s: GameState, page = s.activeGarden): Team => s.gardens[page]
export const crewFor = (team: Team, kind: CrewKind) => kind === 'water' ? team.snails : team.workers[kind]
export const equipmentLevel = (s: GameState, kind: CrewKind, page = s.activeGarden) => teamFor(s,page).equipment[kind]
export const capacity = (s: GameState, kind: ActorKind, page = s.activeGarden) => kind === 'player' ? 4 * 2 ** s.upgrades.splash : (kind==='water'?8:1)*2**equipmentLevel(s,kind,page)
export const workerDuration = (s: GameState, service = false, kind: CrewKind = 'water', page = s.activeGarden) => (service?1.2:.9)/(1+equipmentLevel(s,kind,page)*.5)
export const workerSpeed = (s: GameState, kind: CrewKind, page = s.activeGarden) => (kind==='water'?24:38)*(1+equipmentLevel(s,kind,page)*.75)
export const gardenCount = (s: GameState) => s.gardens.length
export const gardenReward = (page: number) => GARDENS[page].reward
export const highestSeed = (s: GameState): Tier => { let tier: Tier = 6; while(tier>0 && !unlocked(s,tier)) tier=(tier-1) as Tier; return tier }
export const hireAvailable = (team: Team, option: HireOption) => option.type==='recruit' ? crewFor(team,option.kind).length===option.level-1 : crewFor(team,option.kind).length>0 && team.equipment[option.kind]===option.level-1
export const HIRE_TRAINING_SECONDS=45
export function hireLock(s:GameState,option:HireOption,page=s.activeGarden):string|null {
 const t=teamFor(s,page), needed=(option.type==='equipment'?[30,70,140,240][option.level-1]:[0,40,90,160,250][option.level-1])+({water:0,harvest:12,sow:24}[option.kind])
 return t.harvests<needed?`本园收获 ${t.harvests}/${needed} 株后开放`:s.elapsed<t.hireReadyAt?`团队磨合中 · ${formatTime(Math.ceil(t.hireReadyAt-s.elapsed))}`:null
}
export const expansionLock = (s: GameState) => teamFor(s,gardenCount(s)-1).potCount<15?'先将最新花园扩至15盆':UPGRADES.filter(u=>u.page===gardenCount(s)-1).some(u=>!s.purchases.includes(u.id)) ? '先完成最新花园解锁的研究' : null
export const potPrice=(s:GameState,page=s.activeGarden)=>Math.round(8*[1,50,3000,300000,30000000][page]*1.55**(teamFor(s,page).potCount-4))
export const plantedReward=(s:GameState,index:number,at=s.elapsed)=>{const p=s.pots[index];return p?.plant==null?0:reward(s,PLANTS[p.plant],Math.floor(index/15),-Infinity)*(p.variant&&variantFor(p.plant)?2:1)*(activeWeather(s,at)===1?7:1)}
export const WEATHER_DURATION = 15
export const activeWeather = (s: GameState, at = s.elapsed) => at >= s.weather.started && at < s.weather.started + WEATHER_DURATION ? s.weather.kind : null
export const WATER_DURATION = 1.2
// germination is retained only to round-trip old saves; it no longer gates growth or visibility.
export type Pot = { seedCost?:number; variant?: number; germination?: number; revealedAt?: number; watering?: number; wateringPower?:number; plant: number | null; growth: number; wateredAt: number }
export type Team = { harvests:number;hireReadyAt:number; potCount:number; sowTier: Exclude<Tier,7>; snails: Worker[]; workers: Record<WorkerKind,Worker[]>; cursor: number; equipment:Record<CrewKind,number>; decorations:string[];hiddenDecorations:string[];autoHarvest:boolean;autoSow:boolean }
export type GameState = {
  fertilizer:number;extraRandom:number;variants:string[];legacyVariants?:string[];weather:{kind:number;started:number;next:number};
  balanceVersion:1|2;campaignVersion:4;activeGarden:number;gardens:Team[];purchases:string[];legacyBonuses:Record<EffectId,number>;
  stats:{manualGrowth:number;autoGrowth:number;manualCoins:number;autoCoins:number};
  player:Worker;randomState:number;economyVersion:2;version:1;coins:number;earned:number;elapsed:number;pots:Pot[];
  upgrades:Record<EffectId,number>;selected:number;discovered:number[];harvestCounts:number[];untrackedHarvests:number;
  harvests:number;clicks:number;wonAt:number|null;lastSaved:number;started:boolean;
}
const zeroBonuses=()=>Object.fromEntries(EFFECT_IDS.map(id=>[id,0])) as Record<EffectId,number>
export const newTeam = ():Team => ({harvests:0,hireReadyAt:0,potCount:INITIAL_POTS,sowTier:0,snails:[],workers:{harvest:[],sow:[]},cursor:0,equipment:{water:0,harvest:0,sow:0},decorations:[],hiddenDecorations:[],autoHarvest:true,autoSow:true})
const emptyPot = (): Pot => ({ plant: null, growth: 0, wateredAt: -10 })
export function newGame():GameState {
 return {fertilizer:0,extraRandom:Math.floor(Math.random()*4294967296),variants:[],weather:{kind:0,started:-20,next:300+Math.random()*300},
  balanceVersion:2,campaignVersion:4,activeGarden:0,gardens:[newTeam()],purchases:[],legacyBonuses:zeroBonuses(),stats:{manualGrowth:0,autoGrowth:0,manualCoins:0,autoCoins:0},
  player:newWorker(8,4),randomState:Math.floor(Math.random()*4294967296),economyVersion:2,version:1,coins:0,earned:0,elapsed:0,pots:Array.from({length:15},emptyPot),
  upgrades:zeroBonuses(),selected:0,discovered:[],harvestCounts:PLANTS.map(()=>0),untrackedHarvests:0,harvests:0,clicks:0,wonAt:null,lastSaved:Date.now(),started:false}
}
export const progressStage = (s:Pick<GameState,'earned'>) => {
 let stage=0
 while(stage+1<PROGRESSION_THRESHOLDS.length&&s.earned>=PROGRESSION_THRESHOLDS[stage+1])stage++
 return stage
}
export const seedVisible = (s:Pick<GameState,'earned'>,tier:Tier) => s.earned>=SEED_UNLOCK[tier]
export const upgradeRevealThreshold = (u:Upgrade) => {
 let threshold:number=PROGRESSION_THRESHOLDS[0]
 for(const candidate of PROGRESSION_THRESHOLDS)if(candidate<=u.cost*2)threshold=candidate
 return threshold
}
export const upgradeVisible = (s:Pick<GameState,'earned'>,u:Upgrade) => s.earned>=upgradeRevealThreshold(u)
export function seedLock(s:GameState,tier:Tier,page=s.activeGarden):string|null {
 if(!seedVisible(s,tier))return `累计获得 ${formatNumber(SEED_UNLOCK[tier])} 金币后开放`
 if(tier===0||tier===ULTIMATE_TIER)return null
 const cost=PLANTS[seedPlantId(tier)].cost, typical=PLANTS[TIER_PLANTS[tier][1]]
 const normalGross=PLANTS.reduce((sum,p)=>sum+plantChance(tier,p.id)*reward(s,p,page,-Infinity),0)
 return reward(s,typical,page,-Infinity)<cost*1.1||normalGross<=cost?'先提升丰收研究或前往高收益花园':null
}
export function unlocked(s: GameState, tier: Tier, page=s.activeGarden) {
  return !seedLock(s,tier,page) && s.coins >= PLANTS[seedPlantId(tier)].cost
}
export function upgradeLock(s: GameState,id:UpgradeId):string|null {
 const u=UPGRADES.find(u=>u.id===id)
 return !u?'未知升级':!upgradeVisible(s,u)?`继续经营花园后开放`:u.page>=gardenCount(s)?`解锁第${u.page+1}园 · ${GARDENS[u.page].name}后购买`:u.requires&&!s.purchases.includes(u.requires)?'先完成上一级丰收研究':teamFor(s,u.page).harvests<(u.harvests??0)?`第${u.page+1}园收获 ${teamFor(s,u.page).harvests}/${u.harvests} 株后开放`:null
}
export const nextResearch=(s:GameState)=>{const next=(['profit','soil','click'] as const).map(effect=>UPGRADES.find(u=>u.effects[effect]&&!s.purchases.includes(u.id)));return next.filter((u):u is Upgrade=>u!==undefined&&upgradeVisible(s,u))}
export const price = (_s:GameState,plant:Plant)=>plant.cost
export const upgradePrice = (_s: GameState, u: Upgrade) => u.cost
export const reward = (s: GameState, p: Plant, page = s.activeGarden, at = s.elapsed) => Math.round(p.reward * 2 ** s.upgrades.profit * gardenReward(page)) * (activeWeather(s, at) === 1 ? 7 : 1)
export function seedEconomyFor(s:GameState,tier:Tier,page=s.activeGarden){
 const cost=PLANTS[seedPlantId(tier)].cost
 const gross=PLANTS.reduce((sum,p)=>sum+plantChance(tier,p.id)*reward(s,p,page,-Infinity)*(variantFor(p.id)?1.1:1),0)
 const seconds=PLANTS.reduce((sum,p)=>sum+plantChance(tier,p.id)*p.seconds,0)
 return {cost,gross,net:gross-cost,seconds}
}
export const clickPower = (s: GameState) => 2 * 2 ** s.upgrades.click
const baseGrowthRate = (s: GameState, page: number) => 2 ** s.upgrades.soil * GARDENS[page].growth
export const growthRate = (s: GameState, page = s.activeGarden) => baseGrowthRate(s, page) * (activeWeather(s) === 0 ? 2 : 1)
export const formatTime = (n: number) => `${Math.floor(n / 60).toString().padStart(2, '0')}:${Math.floor(n % 60).toString().padStart(2, '0')}`

function grow(s: GameState, i: number, amount: number) {
  const pot = s.pots[i]
  if (pot?.plant === null || !pot) return
  const plant = PLANTS[pot.plant]
  pot.growth = Math.min(plant.seconds, pot.growth + amount)
  if (pot.growth >= plant.seconds) {
    const key = `${plant.id}:${pot.variant ?? 0}`
    if (pot.variant && variantFor(plant.id) && !s.variants.includes(key)) s.variants.push(key)
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
  if (!unlocked(s, tier,Math.floor(i/15)) || s.coins < cost) return
  id = randomPlant(s, tier)
  const plant = PLANTS[id]
  s.coins -= cost
  const roll=extraRandom(s), variant=variantFor(id)&&roll<.1?1:0
  s.pots[i] = { seedCost:cost, variant, plant: id, growth: plant.seconds * (1 - 2 ** -s.upgrades.lantern), wateredAt: -10 }
  if (plant.tier >= 2 && plant.tier < ULTIMATE_TIER) s.pots[i].revealedAt = s.elapsed
}
function harvest(s: GameState, i: number, carrier?: Worker, at = s.elapsed) {
  const p = s.pots[i]
  if (p.plant === null || p.growth < PLANTS[p.plant].seconds) return
  const id = p.plant
  const coins = plantedReward(s,i,at)
  if (carrier) { carrier.cargo += coins; carrier.count++ } else { addCoins(s, coins); s.stats.manualCoins += coins }
  if (!carrier && extraRandom(s) < .05) s.fertilizer++
  s.harvests++;teamFor(s,Math.floor(i/15)).harvests++
  s.harvestCounts[id]++
  s.pots[i] = emptyPot()
}
function water(s: GameState, i: number, auto = false) {
  const p = s.pots[i]
  if (p.plant === null || p.growth >= PLANTS[p.plant].seconds) return
  const amount = (auto ? 3 * 2 ** equipmentLevel(s,'water',Math.floor(i/15)) : clickPower(s)) * (activeWeather(s) === 2 ? 2 : 1)
  s.stats[auto ? "autoGrowth" : "manualGrowth"] += Math.min(amount, PLANTS[p.plant].seconds-p.growth)
  grow(s, i, amount)
  p.wateredAt = s.elapsed
  if (!auto) s.clicks++
}
function validTarget(s: GameState, kind: ActorKind, i: number | null) {
  if (i === null) return false
  const p = s.pots[i]
  return !!p && i!%15<teamFor(s,Math.floor(i!/15)).potCount && (kind === 'sow' ? p.plant === null : p.plant !== null && (kind === 'harvest' ? p.plant !== ULTIMATE_ID && p.growth >= PLANTS[p.plant].seconds : p.growth < PLANTS[p.plant].seconds && (p.plant!==ULTIMATE_ID || s.elapsed-p.wateredAt>=5)))
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
    // Check every job step: other crews and manual purchases share the same wallet.
    if (kind === 'sow' && !unlocked(s,team.sowTier,page)) return
    if ((w.phase === 'walk' || w.phase === 'act') && !validTarget(s, kind, w.target)) {
      w.phase = 'idle'; w.target = null; w.path = []; w.clock = 0
    }
    if (w.phase === 'idle') {
      if (kind === 'player') return
      const candidates = s.pots.slice(page*15,page*15+15).map((_, i) => i+page*15).filter(i => validTarget(s, kind, i)
        && !crewFor(team,kind as CrewKind).some(other=>other!==w && other.target===i))
      if (kind === 'harvest' ? w.count >= capacity(s, kind, page) || (w.count > 0 && !candidates.length) : w.stock === 0) { returnHome(w, kind); continue }
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
      const speed = kind === 'player' ? 110 : workerSpeed(s,kind,page)
      const dx = next.x - w.x, dy = next.y - w.y, distance = Math.hypot(dx, dy)
      const spent = Math.min(remaining, distance / speed)
      if (Math.abs(dx) > .001) w.facing = dx < 0 ? -1 : 1
      if (distance > .001) { w.x += dx / distance * spent * speed; w.y += dy / distance * spent * speed }
      remaining -= spent
      if (distance <= spent * speed + .001) { w.x = next.x; w.y = next.y; w.path.shift() }
      continue
    }
    const duration = kind === 'player' ? 1.2 : workerDuration(s, w.phase === 'service',kind,page)
    const spent = Math.min(remaining, Math.max(0, duration - w.clock))
    w.clock += spent; remaining -= spent
    if (w.clock >= duration - .000001) {
      if (w.phase === 'service') {
        if (kind === 'harvest') { addCoins(s, w.cargo); s.stats.autoCoins += w.cargo; w.cargo = 0; w.count = 0 }
        else w.stock = capacity(s, kind, page)
      } else if (validTarget(s, kind, w.target)) {
        if (kind === 'harvest') harvest(s, w.target!, w, s.elapsed - remaining)
        else if (kind === 'sow') { const id=seedPlantId(team.sowTier); plantIn(s, w.target!, id); w.stock-- }
        else { water(s, w.target!, kind !== 'player'); w.stock-- }
      }
      w.phase = 'idle'; w.clock = 0; w.target = null
    }
  }
}
function advance(s: GameState, dt: number) {
  const from = s.elapsed
  // Integrate only the part of this step inside the rain window, including fractional boundaries.
  const rainOverlap = () => s.weather.kind === 0 ? Math.max(0, Math.min(from + dt, s.weather.started + WEATHER_DURATION) - Math.max(from, s.weather.started)) : 0
  let rainSeconds = rainOverlap()
  s.elapsed += dt
  while (s.elapsed >= s.weather.next) { const started=s.weather.next; s.weather={kind:Math.floor(extraRandom(s)*3),started,next:started+300+extraRandom(s)*300}; rainSeconds += rainOverlap() }
  s.pots.forEach((_, i) => grow(s, i, (dt + rainSeconds) * baseGrowthRate(s, Math.floor(i/15))))
  s.pots.forEach((p,i) => {
    if ((p.watering ?? 0) > 0) {
      const spent=Math.min(dt,p.watering!),plant=p.plant===null?null:PLANTS[p.plant]
      if(plant&&p.growth<plant.seconds){const amount=(p.wateringPower??clickPower(s))*spent/WATER_DURATION;s.stats.manualGrowth+=Math.min(amount,plant.seconds-p.growth);grow(s,i,amount)}
      p.watering=Math.max(0,p.watering!-spent)
      if(p.watering<=.000001){p.watering=0;delete p.wateringPower;p.wateredAt=s.elapsed-(dt-spent)}
    }
  })
  if (s.player.phase === 'service') advanceWorker(s, 'player', s.player, dt)
  for(let page=0;page<gardenCount(s);page++) {
    const team=teamFor(s,page)
    team.snails.forEach(w=>advanceWorker(s,'water',w,dt,page))
    if(team.autoHarvest) team.workers.harvest.forEach(w=>advanceWorker(s,'harvest',w,dt,page))
    if(team.autoSow) team.workers.sow.forEach(w=>advanceWorker(s,'sow',w,dt,page))
  }
}
export type Action = {type:'sow-tier';tier:number} | {type:'hire';id:string} | {type:'expand'} | {type:'open-garden'} | {type:'fertilize';index:number} | {type:'decorate';id:string} | {type:'decoration-toggle';id:string} | { type: 'garden'; index: number } | { type: 'dig'; index: number } | { type: 'water'; index: number } | { type: 'move'; from: number; to: number } | { type: 'tick'; dt: number } | { type: 'pot'; index: number } | { type: 'select'; id: number }
  | { type: 'buy'; id: UpgradeId } | { type: 'toggle'; key: 'autoHarvest' | 'autoSow' } | { type: 'start' } | { type: 'reset' }
export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'reset') return { ...newGame(), started: true }
  if (action.type === 'garden') return Number.isInteger(action.index) && action.index >= 0 && action.index < gardenCount(state) ? {...state,activeGarden:action.index} : state
  if (action.type === 'select') return PLANTS[action.id] && unlocked(state, PLANTS[action.id].tier) ? { ...state, selected: seedPlantId(PLANTS[action.id].tier) } : state
  if (action.type === 'start') return { ...state, started: true }

  const clone = (w: Worker): Worker => ({ ...w, path: w.path.map(p => ({ ...p })) })
  const s:GameState={...state,variants:[...state.variants],weather:{...state.weather},player:clone(state.player),pots:state.pots.map(p=>({...p})),upgrades:{...state.upgrades},legacyBonuses:{...state.legacyBonuses},discovered:[...state.discovered],harvestCounts:[...state.harvestCounts],purchases:[...state.purchases],stats:{...state.stats},gardens:state.gardens.map(t=>({...t,equipment:{...t.equipment},snails:t.snails.map(clone),workers:{harvest:t.workers.harvest.map(clone),sow:t.workers.sow.map(clone)},decorations:[...t.decorations],hiddenDecorations:[...t.hiddenDecorations]}))}
  const team=teamFor(s)
  if(action.type==='sow-tier' && team.workers.sow.length>0 && Number.isInteger(action.tier) && action.tier>=0 && action.tier<ULTIMATE_TIER) team.sowTier=action.tier as Exclude<Tier,7>
  if(action.type==='toggle') team[action.key]=!team[action.key]
  if(action.type==='hire') {
    const u=hireCatalog(s.activeGarden).find(u=>u.id===action.id)
    if(u && hireAvailable(team,u) && !hireLock(s,u) && s.coins>=u.cost){
      s.coins-=u.cost;team.hireReadyAt=s.elapsed+HIRE_TRAINING_SECONDS
      if(u.type==='recruit')crewFor(team,u.kind).push(newWorker(STATIONS[u.kind].x))
      else team.equipment[u.kind]=u.level
    }
  }
  if(action.type==='expand' && team.potCount<15 && s.coins>=potPrice(s)){s.coins-=potPrice(s);team.potCount++}
  if(action.type==='open-garden' && gardenCount(s)<5 && s.pots.length>=15 && !expansionLock(s) && s.coins>=GARDEN_PRICES[gardenCount(s)]) {
    s.coins-=GARDEN_PRICES[gardenCount(s)];s.pots.push(...Array.from({length:15},emptyPot));s.gardens.push(newTeam());s.activeGarden=gardenCount(s)-1
  }
  if (action.type === 'tick' && s.started) {
    let remaining = Math.min(1800, Math.max(0, action.dt))
    // Fixed upper step preserves effect and automation ordering during offline catch-up.
    while (remaining > 0) { const dt = Math.min(remaining, .5); advance(s, dt); remaining -= dt }
  }
  if (action.type === 'fertilize') {
    const p=s.pots[action.index]
    if(s.fertilizer>0 && p?.plant != null && p.plant!==ULTIMATE_ID && p.growth<PLANTS[p.plant].seconds) {
      s.fertilizer--;p.watering=0;delete p.wateringPower;grow(s,action.index,PLANTS[p.plant].seconds)
    }
  }
  if(action.type==='decorate') {
    const item=DECORATIONS.find(d=>d.id===action.id)
    if(item && !team.decorations.includes(item.id) && s.coins>=decorationPrice(item.cost,s.activeGarden)){s.coins-=decorationPrice(item.cost,s.activeGarden);team.decorations.push(item.id)}
  }
  if(action.type==='decoration-toggle' && team.decorations.includes(action.id)) {
    team.hiddenDecorations=team.hiddenDecorations.includes(action.id)?team.hiddenDecorations.filter(id=>id!==action.id):[...team.hiddenDecorations,action.id]
  }
  if (action.type === 'pot' && s.pots[action.index] && action.index%15<teamFor(s,Math.floor(action.index/15)).potCount) {
    const p = s.pots[action.index]
    if (p.plant === null) plantIn(s, action.index, s.selected)
    else if (p.growth >= PLANTS[p.plant].seconds) harvest(s, action.index)

  }
  if (action.type === 'water' && validTarget(s, 'player', action.index) && !(s.pots[action.index].watering! > 0)) {
    const p=s.pots[action.index]
    p.watering=WATER_DURATION;p.wateringPower=clickPower(s)*(activeWeather(s)===2?2:1);s.clicks++
  }
  if (action.type === 'dig' && s.pots[action.index]?.plant != null) {
    // Discarding is not harvesting: no coins, count, discoveries or plant effects.
    s.pots[action.index] = emptyPot()
    for (const w of [s.player, ...Array.from({length:gardenCount(s)},(_,p)=>{const t=teamFor(s,p);return [...t.snails,...t.workers.harvest,...t.workers.sow]}).flat()]) {
      if (w.target === action.index) { w.phase = 'idle'; w.target = null; w.clock = 0; w.path = [] }
    }
  }
  if (action.type === 'move' && Number.isInteger(action.from) && Number.isInteger(action.to) && action.from !== action.to && s.pots[action.from]?.plant != null && s.pots[action.to] && action.to%15<teamFor(s,Math.floor(action.to/15)).potCount) {
    // Move the whole pot state, preserving growth, discovery and watering history.
    ;[s.pots[action.from], s.pots[action.to]] = [s.pots[action.to], s.pots[action.from]]
    for (const w of [s.player, ...Array.from({length:gardenCount(s)},(_,p)=>{const t=teamFor(s,p);return [...t.snails,...t.workers.harvest,...t.workers.sow]}).flat()]) {
      if (w.target === action.from || w.target === action.to) {
        w.phase = 'idle'; w.target = null; w.clock = 0; w.path = []
      }
    }
  }
  if (action.type === 'buy') {
    const u = UPGRADES.find(u => u.id === action.id)
    if (u && !s.purchases.includes(u.id) && s.coins >= u.cost && !upgradeLock(s,u.id)) {
      s.coins-=u.cost;s.purchases.push(u.id)
      for(const effect of EFFECT_IDS)s.upgrades[effect]+=u.effects[effect]??0
    }
  }
  return s
}

export const SAVE_KEY = 'moon-garden-save-v1'
function migrateLegacy(raw:string):GameState|null {
 const old=parseLegacySave(raw)
 if(!old)return null
 const s=newGame()
 for(const key of ['fertilizer','extraRandom','variants','weather','player','randomState','coins','earned','elapsed','pots','selected','discovered','harvestCounts','untrackedHarvests','harvests','clicks','wonAt','lastSaved','started','stats'] as const) Object.assign(s,{[key]:old[key]})
 s.activeGarden=old.activeGarden
 s.gardens=Array.from({length:Math.ceil(old.pots.length/15)},(_,page)=>{
  const source=page===0?old:old.extraTeams[page-1],t=newTeam()
  t.snails=old.upgrades.snail?source.snails:[]
  t.workers.harvest=old.upgrades.harvest?[source.workers.harvest]:[]
  t.workers.sow=old.upgrades.sow?[source.workers.sow]:[]
  t.equipment={water:Math.min(4,Math.floor(old.upgrades.water/2)),harvest:Math.min(4,Math.max(0,old.upgrades.harvest-1)),sow:Math.min(4,Math.max(0,old.upgrades.sow-1))}
  t.cursor=source.cursor;t.autoHarvest=old.autoHarvest;t.autoSow=old.autoSow;t.decorations=[...old.decorations];t.hiddenDecorations=[...old.hiddenDecorations]
  return t
 })
 for(const u of UPGRADES.filter(u=>u.page<s.gardens.length)){
  const effect=u.effects.profit?'profit':u.effects.soil?'soil':'click'
  if(old.upgrades[effect]>=(u.page+1)*(effect==='profit'?2:1)){
    s.purchases.push(u.id);for(const k of EFFECT_IDS)s.upgrades[k]+=u.effects[k]??0
  }
 }
 for(const k of EFFECT_IDS){s.legacyBonuses[k]=Math.max(0,old.upgrades[k]-s.upgrades[k]);s.upgrades[k]+=s.legacyBonuses[k]}
 return parseSave(JSON.stringify({...s,balanceVersion:undefined}))
}
export function parseSave(raw:string|null):GameState|null {
 try{
  if(!raw)return null
  const parsed=JSON.parse(raw)
  if(parsed?.campaignVersion!==4)return migrateLegacy(raw)
  // Read saves made during the reverted local-harvest economy without losing progress.
  if(parsed.balanceVersion===3)parsed.balanceVersion=2
  const s=parsed as GameState
  if(s.balanceVersion===undefined && Array.isArray(s.gardens)&&Array.isArray(s.pots)){
   for(let page=0;page<s.gardens.length;page++)if(s.gardens[page])s.gardens[page].potCount=Math.min(15,s.pots.length-page*15)
   for(const p of s.pots)if(p&&p.plant!==null&&PREVIOUS_PLANTS[p.plant]){p.growth=p.growth/PREVIOUS_PLANTS[p.plant].seconds*PLANTS[p.plant].seconds;p.variant=p.variant&&variantFor(p.plant)?1:0}
   while(s.pots.length<15*s.gardens.length)s.pots.push(emptyPot())
   if(Array.isArray(s.harvestCounts))while(s.harvestCounts.length<PLANTS.length)s.harvestCounts.push(0)
   if(Array.isArray(s.variants)){s.legacyVariants=[...s.variants];s.variants=[]}
   s.balanceVersion=1
  }
  if(s.balanceVersion===1 && Array.isArray(s.gardens) && Array.isArray(s.purchases)){
   for(let page=0;page<s.gardens.length;page++)if(s.purchases.includes(`g${page}-profit`))for(let level=1;level<=3;level++)if(!s.purchases.includes(`g${page}-profit-${level}`))s.purchases.push(`g${page}-profit-${level}`)
   for(const t of s.gardens){t.harvests=0;t.hireReadyAt=0}
   s.balanceVersion=2
  }
  const finite=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0
  const integer=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0
  const unique=(a:unknown):a is string[]=>Array.isArray(a)&&a.every(v=>typeof v==='string')&&new Set(a).size===a.length
  if(s.legacyVariants!==undefined&&(!unique(s.legacyVariants)||s.legacyVariants.some(k=>!/^\d+:[1-3]$/.test(k))))return null
  if(s.balanceVersion!==2||s.version!==1||s.economyVersion!==2||!finite(s.coins)||!finite(s.earned)||!finite(s.elapsed)||!finite(s.lastSaved)||!integer(s.fertilizer)||!integer(s.harvests)||!integer(s.clicks)
   ||!integer(s.randomState)||s.randomState>4294967295||!integer(s.extraRandom)||s.extraRandom>4294967295||!integer(s.selected)||!PLANTS[s.selected]||typeof s.started!=='boolean'||(s.wonAt!==null&&!finite(s.wonAt))
   ||!unique(s.purchases)||s.purchases.some(id=>!UPGRADES.some(u=>u.id===id))||!s.upgrades||!s.legacyBonuses||EFFECT_IDS.some(k=>!integer(s.legacyBonuses[k])||s.legacyBonuses[k]>16||s.upgrades[k]!==s.legacyBonuses[k]+UPGRADES.filter(u=>s.purchases.includes(u.id)).reduce((n,u)=>n+(u.effects[k]??0),0))
   ||!Array.isArray(s.gardens)||s.gardens.length<1||s.gardens.length>5||!integer(s.activeGarden)||s.activeGarden>=s.gardens.length||s.purchases.some(id=>UPGRADES.find(u=>u.id===id)!.page>=s.gardens.length)
   ||!Array.isArray(s.pots)||s.pots.length!==15*s.gardens.length
   ||!Array.isArray(s.harvestCounts)||s.harvestCounts.length!==PLANTS.length||s.harvestCounts.some(n=>!integer(n))||!integer(s.untrackedHarvests)||!Array.isArray(s.discovered)||s.discovered.some(id=>!integer(id)||!PLANTS[id])
   ||!unique(s.variants)||s.variants.some(k=>!/^\d+:1$/.test(k)||!variantFor(Number(k.split(':')[0])))||!s.weather||![0,1,2].includes(s.weather.kind)||!Number.isFinite(s.weather.started)||!finite(s.weather.next)||s.weather.next<=s.elapsed
   ||!s.stats||['manualGrowth','autoGrowth','manualCoins','autoCoins'].some(k=>!finite(s.stats[k as keyof GameState['stats']])))return null
  for(const p of s.pots)if(!p||(p.seedCost!==undefined&&(!finite(p.seedCost)||!(PLANTS.some(plant=>plant.cost===p.seedCost)||[9000,200000,5000000,150000000,500000000000].includes(p.seedCost))))||(p.plant!==null&&(!integer(p.plant)||!PLANTS[p.plant]))||!finite(p.growth)||!Number.isFinite(p.wateredAt)||(p.variant!==undefined&&(![0,1].includes(p.variant)||p.variant===1&&(p.plant===null||!variantFor(p.plant))))||(p.germination!==undefined&&(!finite(p.germination)||p.germination>5))||(p.revealedAt!==undefined&&!finite(p.revealedAt))||(p.watering!==undefined&&(!finite(p.watering)||p.watering>WATER_DURATION||p.plant===null&&p.watering>0))||(p.wateringPower!==undefined&&(!finite(p.wateringPower)||p.wateringPower<=0)))return null
  const workerValid=(w:Worker,page:number,player=false)=>w&&finite(w.x)&&w.x<=100&&finite(w.y)&&w.y<=100&&[-1,1].includes(w.facing)&&['idle','walk','act','return','service'].includes(w.phase)&&finite(w.clock)&&w.clock<=1.2&&integer(w.stock)&&w.stock<=1024&&finite(w.cargo)&&integer(w.count)&&w.count<=64&&(w.target===null||integer(w.target)&&w.target<s.pots.length&&(player||Math.floor(w.target/15)===page))&&(!['walk','act'].includes(w.phase)||w.target!==null)&&Array.isArray(w.path)&&w.path.length<=3&&w.path.every(p=>finite(p.x)&&p.x<=100&&finite(p.y)&&p.y<=100)
  if(!workerValid(s.player,0,true))return null
  for(let page=0;page<s.gardens.length;page++){
   const t=s.gardens[page]
   if(!t||!integer(t.harvests)||!finite(t.hireReadyAt)||!Number.isInteger(t.potCount)||t.potCount<4||t.potCount>15||!t.workers||!integer(t.cursor)||!t.equipment||typeof t.autoHarvest!=='boolean'||typeof t.autoSow!=='boolean'||!unique(t.decorations)||t.decorations.some(id=>!DECORATIONS.some(d=>d.id===id))||!unique(t.hiddenDecorations)||t.hiddenDecorations.some(id=>!t.decorations.includes(id)))return null
   if(t.sowTier===undefined)t.sowTier=0
   if(!integer(t.sowTier)||t.sowTier>=ULTIMATE_TIER)return null
   for(const kind of ['water','harvest','sow'] as CrewKind[]){const crew=crewFor(t,kind);if(!Array.isArray(crew)||crew.length>5||!integer(t.equipment[kind])||t.equipment[kind]>4||crew.some(w=>!workerValid(w,page)))return null}
  }
  return s
 }catch{return null}
}
