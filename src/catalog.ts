export type Tier = 0 | 1 | 2 | 3 | 4 | 5
export type Plant = { id: number; name: string; tier: Tier; seconds: number; cost: number; reward: number; lore: string }
export const ULTIMATE_ID = 9
export const ULTIMATE_TIER = 5
export const INITIAL_POTS = 10
export const TIERS = ['普通种子', '稀有种子', '珍贵种子', '超凡种子', '神话种子', '终极种子']
export const TIER_PLANTS = [[0, 1, 2, 10], [3, 4, 5, 11], [6, 7, 8, 12], [13, 14, 15, 16], [17, 18, 19, 20], [9]]
export const SEED_PRICES = [0, 50, 300, 1800, 10800, 64800]
export const STAGE_MINUTES = [5, 20, 80, 320, 1280]
export const SEED_ODDS = [
  [.94, .055, .0045, .00045, .00005],
  [.1, .84, .055, .0045, .0005],
  [.01, .09, .84, .055, .005],
  [.001, .009, .09, .85, .05],
  [.0001, .0009, .009, .09, .9],
] as const
export const SPECIES_ODDS = [.2, .5, .25, .05] as const
export const PLANTS: Plant[] = [
  { id: 0, name: '嫩芽豆', tier: 0, seconds: 30, cost: 0, reward: 4, lore: '小叶片托起清晨的露珠。' },
  { id: 1, name: '红伞菇', tier: 0, seconds: 30, cost: 0, reward: 10, lore: '它一直戴着雨天的小红帽。' },
  { id: 2, name: '蜜桃郁金香', tier: 0, seconds: 30, cost: 0, reward: 16, lore: '黄昏的粉色藏在花瓣里。' },
  { id: 3, name: '水滴花', tier: 1, seconds: 60, cost: 50, reward: 40, lore: '每一滴水都有自己的蓝色梦。' },
  { id: 4, name: '月光兰', tier: 1, seconds: 60, cost: 50, reward: 70, lore: '月光顺着花瓣流进泥土。' },
  { id: 5, name: '太阳金币花', tier: 1, seconds: 60, cost: 50, reward: 100, lore: '阳光在花心里攒成一枚笑脸。' },
  { id: 6, name: '贪吃捕蝇草', tier: 2, seconds: 120, cost: 300, reward: 240, lore: '嘴巴很大，胃口却很温柔。' },
  { id: 7, name: '星霜水晶花', tier: 2, seconds: 120, cost: 300, reward: 420, lore: '星霜在枝头结成了水晶。' },
  { id: 8, name: '紫铃梦境草', tier: 2, seconds: 120, cost: 300, reward: 600, lore: '风经过时，紫色铃铛轻轻摇晃。' },
  { id: 9, name: '永恒星之花', tier: 5, seconds: 480, cost: 64800, reward: 100000, lore: '你已经种出了自己的星空。' },
  { id: 10, name: '金穗铃兰', tier: 0, seconds: 30, cost: 0, reward: 40, lore: '金色小铃在清晨安静盛开。' },
  { id: 11, name: '琥珀灯笼果', tier: 1, seconds: 60, cost: 50, reward: 200, lore: '一盏藏在叶子间的小小暖灯。' },
  { id: 12, name: '翡翠龙舌兰', tier: 2, seconds: 120, cost: 300, reward: 1200, lore: '翡翠尖叶守着透明的晨露。' },
  { id: 13, name: '珊瑚焰花', tier: 3, seconds: 240, cost: 1800, reward: 1440, lore: '一丛从未烫伤蝴蝶的火焰。' },
  { id: 14, name: '雷鸣竹', tier: 3, seconds: 240, cost: 1800, reward: 2520, lore: '竹节间藏着细小的蓝色闪电。' },
  { id: 15, name: '极光羽蕨', tier: 3, seconds: 240, cost: 1800, reward: 3600, lore: '叶片铺开，像一片迷你的极光。' },
  { id: 16, name: '夜空莲', tier: 3, seconds: 240, cost: 1800, reward: 7200, lore: '夜空在它的花心里睡着了。' },
  { id: 17, name: '凤凰冠花', tier: 4, seconds: 480, cost: 10800, reward: 8640, lore: '金红花冠像凤凰展开翅膀。' },
  { id: 18, name: '时光沙漏兰', tier: 4, seconds: 480, cost: 10800, reward: 15120, lore: '花瓣里的沙粒缓缓流动。' },
  { id: 19, name: '银河螺旋树', tier: 4, seconds: 480, cost: 10800, reward: 21600, lore: '银河沿着枝干盘旋生长。' },
  { id: 20, name: '日冕圣莲', tier: 4, seconds: 480, cost: 10800, reward: 43200, lore: '花瓣托起一轮永不刺眼的太阳。' },
]
export const seedPlantId = (tier: Tier) => TIER_PLANTS[tier][0]
export const plantChance = (tier: Tier, id: number) => tier === ULTIMATE_TIER ? (id === ULTIMATE_ID ? 1 : 0) : id === ULTIMATE_ID ? 0 : (SEED_ODDS[tier].at(PLANTS[id].tier) ?? 0) * SPECIES_ODDS[TIER_PLANTS[PLANTS[id].tier].indexOf(id)]
export const seedEconomy = (tier: Tier) => {
  const gross = PLANTS.reduce((sum, p) => sum + plantChance(tier, p.id) * p.reward, 0)
  const seconds = PLANTS.reduce((sum, p) => sum + plantChance(tier, p.id) * p.seconds, 0)
  return { gross, net: gross - SEED_PRICES[tier], seconds, grossPerMinute: gross / seconds * 60 * INITIAL_POTS, netPerMinute: (gross - SEED_PRICES[tier]) / seconds * 60 * INITIAL_POTS }
}
// Lifetime gross proceeds unlock each seed tier. Costs still leave enough working capital
// for ten next-tier seeds; the economy simulation verifies cash flow and random variance.
// Startup and rare long-growing jackpots bias short stages above their steady-state mean.
const STAGE_CALIBRATION = [.8, .92, .99, .99, .998]
export const SEED_UNLOCK = [0]
for (let tier = 0; tier < ULTIMATE_TIER; tier++) SEED_UNLOCK.push(SEED_UNLOCK[tier] + Math.round(seedEconomy(tier as Tier).grossPerMinute * STAGE_MINUTES[tier] * STAGE_CALIBRATION[tier]))
