export type Tier = 0 | 1 | 2 | 3
export type Plant = { id: number; name: string; tier: Tier; seconds: number; cost: number; reward: number; effect: string; lore: string }
export const PLANTS: Plant[] = [
  { id: 0, name: '嫩芽豆', tier: 0, seconds: 12, cost: 0, reward: 12, effect: '朴实的小豆芽，没有特殊效果。', lore: '每一座奇妙花园，都从一片小叶子开始。' },
  { id: 1, name: '红伞菇', tier: 0, seconds: 18, cost: 0, reward: 20, effect: '没有特殊效果，等待换来更多金币。', lore: '雨停以后，它还戴着红色的小帽子。' },
  { id: 2, name: '蜜桃郁金香', tier: 0, seconds: 25, cost: 0, reward: 32, effect: '没有特殊效果，初级种子中收益最高。', lore: '把黄昏的最后一点粉色，藏进花瓣里。' },
  { id: 3, name: '水滴花', tier: 1, seconds: 35, cost: 30, reward: 105, effect: '每次浇水，额外为相邻花盆增加 2 秒成长。', lore: '它会把收到的每一滴水分享给邻居。' },
  { id: 4, name: '月光兰', tier: 1, seconds: 45, cost: 50, reward: 175, effect: '成株后全园自然生长 +15%，最多叠加 3 株。', lore: '月光落在它身上，也落在它身旁。' },
  { id: 5, name: '太阳金币花', tier: 1, seconds: 55, cost: 70, reward: 255, effect: '成株后每秒产出 2 金币，成熟后保留也有效。', lore: '每一次微笑，都是一笔小小的收入。' },
  { id: 6, name: '贪吃捕蝇草', tier: 2, seconds: 70, cost: 200, reward: 650, effect: '收获时，为所有普通植物增加 8 秒成长。', lore: '今天的菜单：烦恼、坏心情，还有一只小飞虫。' },
  { id: 7, name: '星霜水晶花', tier: 2, seconds: 90, cost: 300, reward: 1000, effect: '成株后全园点击效果 +30%，最多叠加 3 株。', lore: '把星光种进泥土，会开出什么呢？' },
  { id: 8, name: '紫铃梦境草', tier: 2, seconds: 110, cost: 400, reward: 1450, effect: '成株后蜗牛浇水效果 +40%，最多叠加 3 株。', lore: '轻轻摇响，连蜗牛都做起了甜甜的梦。' },
  { id: 9, name: '永恒星之花', tier: 3, seconds: 480, cost: 6500, reward: 10000, effect: '成熟即通关。自然生长 8 分钟；每次手动浇水 +0.5 秒，蜗牛 +0.25 秒。其他加速无效。', lore: '不必留住夜晚。你已经种出了自己的星空。' },
]
export const TIERS = ['低级种子', '中级种子', '高级种子', '终极种子']
export type UpgradeId = 'pots' | 'click' | 'soil' | 'profit' | 'snail' | 'speed' | 'water' | 'harvest' | 'sow' | 'splash' | 'compost' | 'lantern'
export type Upgrade = { id: UpgradeId; name: string; cost: number; scale: number; max: number; category: number; icon: string; detail: string }
export const UPGRADES: Upgrade[] = [
  { id: 'click', name: '园艺手套', cost: 40, scale: 2, max: 5, category: 0, icon: 'hand', detail: '每级手动浇水 +2 秒成长' },
  { id: 'soil', name: '肥沃土壤', cost: 90, scale: 2, max: 4, category: 0, icon: 'leaf', detail: '每级普通植物自然生长 +15%' },
  { id: 'profit', name: '丰收祝福', cost: 120, scale: 2.2, max: 4, category: 0, icon: 'coin', detail: '每级所有植物收获金币 +20%' },
  { id: 'splash', name: '雨露共享', cost: 280, scale: 2, max: 3, category: 0, icon: 'water', detail: '每级手动浇水向邻盆分享 20% 效果' },
  { id: 'pots', name: '花园扩建', cost: 70, scale: 1.65, max: 9, category: 1, icon: 'pot', detail: '每级增加 1 个花盆，最多 15 个' },
  { id: 'compost', name: '种子堆肥', cost: 450, scale: 2, max: 3, category: 1, icon: 'seed', detail: '每级普通种子价格降低 10%' },
  { id: 'lantern', name: '萤火灯笼', cost: 500, scale: 2, max: 3, category: 1, icon: 'star', detail: '每级播种时获得 10% 初始成长，终极除外' },
  { id: 'snail', name: '浇水蜗牛', cost: 100, scale: 3, max: 3, category: 2, icon: 'snail', detail: '每级雇用 1 只蜗牛，轮流为植物浇水' },
  { id: 'speed', name: '蜗牛跑鞋', cost: 160, scale: 2, max: 3, category: 2, icon: 'boot', detail: '每级浇水间隔 -0.7 秒，初始为 4 秒' },
  { id: 'water', name: '大号水壶', cost: 150, scale: 2, max: 4, category: 2, icon: 'water', detail: '每级蜗牛浇水 +3 秒，初始为 3 秒' },
  { id: 'harvest', name: '收获甲虫', cost: 260, scale: 1, max: 1, category: 2, icon: 'coin', detail: '每次助手行动自动收获成熟普通植物' },
  { id: 'sow', name: '播种精灵', cost: 350, scale: 1, max: 1, category: 2, icon: 'seed', detail: '每次助手行动补种当前种子；钱不够种免费嫩芽豆' },
]
export type Pot = { plant: number | null; growth: number; wateredAt: number }
export type GameState = {
  version: 1; coins: number; earned: number; elapsed: number; pots: Pot[];
  upgrades: Record<UpgradeId, number>; selected: number; discovered: number[];
  harvests: number; clicks: number; wonAt: number | null; autoClock: number; cursor: number;
  autoHarvest: boolean; autoSow: boolean; lastSaved: number; started: boolean;
}
const emptyPot = (): Pot => ({ plant: null, growth: 0, wateredAt: -10 })
export function newGame(): GameState {
  return { version: 1, coins: 0, earned: 0, elapsed: 0, pots: Array.from({ length: 6 }, emptyPot),
    upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])) as GameState['upgrades'], selected: 0,
    discovered: [], harvests: 0, clicks: 0, wonAt: null, autoClock: 0, cursor: 0,
    autoHarvest: true, autoSow: true, lastSaved: Date.now(), started: false }
}
export function unlocked(s: GameState, tier: Tier) {
  return tier === 0 || (tier === 1 && s.earned >= 120) || (tier === 2 && s.earned >= 1800)
    || (tier === 3 && [6, 7, 8].every(id => s.discovered.includes(id)))
}
export const price = (s: GameState, plant: Plant) => Math.ceil(plant.cost * (plant.tier === 3 ? 1 : 1 - s.upgrades.compost * .1))
export const upgradePrice = (s: GameState, u: Upgrade) => Math.round(u.cost * u.scale ** s.upgrades[u.id])
export const reward = (s: GameState, p: Plant) => Math.round(p.reward * (1 + s.upgrades.profit * .2))
const matureCount = (s: GameState, id: number) => Math.min(3, s.pots.filter(p => p.plant === id && p.growth >= PLANTS[id].seconds * .5).length)
export const clickPower = (s: GameState) => (2 + s.upgrades.click * 2) * (1 + matureCount(s, 7) * .3)
export const growthRate = (s: GameState) => 1 + s.upgrades.soil * .15 + matureCount(s, 4) * .15
export const snailInterval = (s: GameState) => 4 - s.upgrades.speed * .7
export const formatTime = (n: number) => `${Math.floor(n / 60).toString().padStart(2, '0')}:${Math.floor(n % 60).toString().padStart(2, '0')}`

function grow(s: GameState, i: number, amount: number) {
  const pot = s.pots[i]
  if (pot?.plant === null || !pot) return
  const plant = PLANTS[pot.plant]
  pot.growth = Math.min(plant.seconds, pot.growth + amount)
  if (pot.growth >= plant.seconds) {
    if (!s.discovered.includes(plant.id)) s.discovered.push(plant.id)
    if (plant.tier === 3 && s.wonAt === null) s.wonAt = s.elapsed
  }
}
function addCoins(s: GameState, n: number) { s.coins += n; s.earned += n }
function neighbors(s: GameState, i: number) {
  return [i - 5, i + 5, ...(i % 5 > 0 ? [i - 1] : []), ...(i % 5 < 4 ? [i + 1] : [])].filter(j => j >= 0 && j < s.pots.length)
}
function plantIn(s: GameState, i: number, id: number) {
  if (s.pots[i].plant !== null) return
  const plant = PLANTS[id]
  if (!unlocked(s, plant.tier) || s.coins < price(s, plant)) return
  s.coins -= price(s, plant)
  s.pots[i] = { plant: id, growth: plant.tier === 3 ? 0 : plant.seconds * s.upgrades.lantern * .1, wateredAt: -10 }
}
function harvest(s: GameState, i: number) {
  const p = s.pots[i]
  if (p.plant === null || p.growth < PLANTS[p.plant].seconds) return
  const id = p.plant
  addCoins(s, reward(s, PLANTS[id])); s.harvests++
  s.pots[i] = emptyPot()
  if (id === 6) s.pots.forEach((q, j) => { if (q.plant !== 9) grow(s, j, 8) })
}
function water(s: GameState, i: number, auto = false) {
  const p = s.pots[i]
  if (p.plant === null || p.growth >= PLANTS[p.plant].seconds) return
  const amount = auto ? (3 + s.upgrades.water * 3) * (1 + matureCount(s, 8) * .4) : clickPower(s)
  grow(s, i, p.plant === 9 ? (auto ? .25 : .5) : amount)
  p.wateredAt = s.elapsed
  const spread = (p.plant === 3 ? 2 : 0) + (auto ? 0 : amount * s.upgrades.splash * .2)
  if (spread > 0) neighbors(s, i).forEach(j => { if (s.pots[j].plant !== 9) grow(s, j, spread) })
  if (!auto) s.clicks++
}
function advance(s: GameState, dt: number) {
  s.elapsed += dt
  const rate = growthRate(s)
  const income = s.pots.filter(p => p.plant === 5 && p.growth >= PLANTS[5].seconds * .5).length * 2
  if (income) addCoins(s, income * dt)
  s.pots.forEach((p, i) => grow(s, i, dt * (p.plant === 9 ? 1 : rate)))
  s.autoClock += dt
  if (s.autoClock >= snailInterval(s)) {
    s.autoClock %= snailInterval(s)
    for (let a = 0; a < s.upgrades.snail; a++) {
      for (let n = 0; n < s.pots.length; n++) {
        const i = s.cursor++ % s.pots.length
        const p = s.pots[i]
        if (p.plant !== null && p.growth < PLANTS[p.plant].seconds) { water(s, i, true); break }
      }
    }
    if (s.upgrades.harvest && s.autoHarvest) s.pots.forEach((p, i) => { if (p.plant !== 9) harvest(s, i) })
    if (s.upgrades.sow && s.autoSow && s.selected !== 9) s.pots.forEach((p, i) => {
      if (p.plant === null) plantIn(s, i, s.coins >= price(s, PLANTS[s.selected]) ? s.selected : 0)
    })
  }
}
export type Action = { type: 'tick'; dt: number } | { type: 'pot'; index: number } | { type: 'select'; id: number }
  | { type: 'buy'; id: UpgradeId } | { type: 'toggle'; key: 'autoHarvest' | 'autoSow' } | { type: 'start' } | { type: 'reset' }
export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'reset') return { ...newGame(), started: true }
  if (action.type === 'select') return unlocked(state, PLANTS[action.id]?.tier) ? { ...state, selected: action.id } : state
  if (action.type === 'start') return { ...state, started: true }
  if (action.type === 'toggle') return { ...state, [action.key]: !state[action.key] }
  const s = { ...state, pots: state.pots.map(p => ({ ...p })), upgrades: { ...state.upgrades }, discovered: [...state.discovered] }
  if (action.type === 'tick' && s.started) {
    let remaining = Math.min(1800, Math.max(0, action.dt))
    // Fixed upper step preserves effect and automation ordering during offline catch-up.
    while (remaining > 0) { const dt = Math.min(remaining, .5); advance(s, dt); remaining -= dt }
  }
  if (action.type === 'pot' && s.pots[action.index]) {
    const p = s.pots[action.index]
    if (p.plant === null) plantIn(s, action.index, s.selected)
    else if (p.growth >= PLANTS[p.plant].seconds) harvest(s, action.index)
    else water(s, action.index)
  }
  if (action.type === 'buy') {
    const u = UPGRADES.find(u => u.id === action.id)!
    const cost = upgradePrice(s, u)
    if (s.upgrades[u.id] < u.max && s.coins >= cost) {
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
    if (s.version !== 1 || !finite(s.coins) || !finite(s.earned) || !finite(s.elapsed) || !finite(s.lastSaved)
      || !finite(s.harvests) || !finite(s.clicks) || !finite(s.autoClock) || !finite(s.cursor)
      || !Number.isInteger(s.selected) || !PLANTS[s.selected] || typeof s.started !== 'boolean'
      || typeof s.autoHarvest !== 'boolean' || typeof s.autoSow !== 'boolean'
      || (s.wonAt !== null && !finite(s.wonAt)) || !Array.isArray(s.pots) || s.pots.length < 6 || s.pots.length > 15
      || !Array.isArray(s.discovered) || s.discovered.some(id => !Number.isInteger(id) || !PLANTS[id])
      || !s.upgrades || UPGRADES.some(u => !Number.isInteger(s.upgrades[u.id]) || s.upgrades[u.id] < 0 || s.upgrades[u.id] > u.max)
      || s.pots.length !== 6 + s.upgrades.pots
      || s.pots.some(p => !p || (p.plant !== null && (!Number.isInteger(p.plant) || !PLANTS[p.plant])) || !finite(p.growth) || !Number.isFinite(p.wateredAt))) return null
    return s
  } catch { return null }
}
