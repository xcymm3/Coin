export type EffectId = 'click' | 'soil' | 'profit' | 'snail' | 'speed' | 'water' | 'harvest' | 'sow' | 'splash' | 'pots' | 'lantern' | 'compost' | 'garden'
export const EFFECT_IDS: EffectId[] = ['click','soil','profit','snail','speed','water','harvest','sow','splash','pots','lantern','compost','garden']
export type UpgradeId = string
export type Upgrade = { id: string; effect: EffectId; name: string; cost: number; chapter: number; category: number; icon: string; detail: string; max: number }
export const GARDENS = [
 { name:'苔庭温室', subtitle:'雨后的泥土与嫩芽', reward:1, growth:1, theme:'moss', ornament:'fern' },
 { name:'萤火溪谷', subtitle:'溪水绕过发光的蘑菇', reward:2, growth:1.2, theme:'brook', ornament:'stream' },
 { name:'琥珀沙庭', subtitle:'暖风与金色的石阶', reward:4, growth:1.5, theme:'amber', ornament:'sundial' },
 { name:'极光雪苑', subtitle:'冰晶映着缓缓流动的极光', reward:8, growth:2, theme:'aurora', ornament:'crystal' },
 { name:'星海天台', subtitle:'在星轨下种出最后一朵花', reward:16, growth:2.5, theme:'astral', ornament:'orrery' },
]
const chapters: EffectId[][] = [
 ['click','splash','profit'], ['soil','water','snail'], ['harvest','sow','speed'], ['click','profit','pots'],
 ['lantern','water','speed'], ['garden','profit','soil'], ['click','splash','water'], ['profit','harvest','sow'],
 ['garden','soil','speed'], ['click','profit','water'], ['lantern','harvest','sow'], ['garden','profit','water'],
 ['soil','speed','splash'], ['click','profit','water'], ['garden','harvest','sow'], ['soil','profit','speed'],
 ['click','water','lantern'], ['profit','harvest','sow'], ['soil','speed','water'], ['profit','click','splash'],
]
// Tuned against scripts/campaign-check.mjs; one fixed price for each independent option.
export const CHAPTER_COSTS = [80,210,650,3386,22870,137759,617326,3653090,9370185,26248414,197595254,441320992,1117093761,1686004304,4308037365,8267151049,15825862152,26110161122,36395499250,90988748125]
const labels: Record<EffectId, [string,number,string,string]> = {
 click:['灌注',0,'hand','手动浇水成长 ×2'], soil:['沃土',0,'leaf','全园自然生长速度 ×2'], profit:['丰收',0,'coin','所有植物收获价值 ×2'],
 splash:['蓄水',0,'water','玩家水壶容量 ×2'], lantern:['晨光',1,'star','播种后的剩余成长时间减半'], compost:['堆肥',1,'seed','非终极种子价格减半'],
 pots:['苔庭扩建',1,'pot','第一页扩建至 15 个花盆'], garden:['新园',1,'pot','开放下一页花园：15 个花盆、独立助手、更高产出'],
 snail:['蜗牛小队',2,'snail','每页雇用 3 只浇水蜗牛，独立取水和照料'], water:['甘露',2,'water','蜗牛每次浇水成长 ×2'],
 speed:['疾行',2,'boot','所有助手移动速度 ×2，动作更利落'], harvest:['满筐',2,'beetle','收获甲虫容量 ×2，自动采摘并送回金币'], sow:['播种',2,'squirrel','播种松鼠容量 ×2，自动选择已解锁的最高非终极品阶'],
}
const themes=['露珠','铜叶','青苔','蜜糖','月白','萤火','流泉','繁枝','琥珀','日光','暖砂','晶簇','霜羽','极光','天幕','彗尾','星河','银河','星冕','永恒']
const occurrences: Partial<Record<EffectId,number>> = {}
export const UPGRADES: Upgrade[] = chapters.flatMap((effects, chapter)=>effects.map((effect,j)=>{
 const n=(occurrences[effect]??0)+1;occurrences[effect]=n
 const [label,category,icon,detail]=labels[effect]
 return {id:`c${chapter}-${effect}`,effect,chapter,name:effect==='garden'?`开辟·${GARDENS[n].name}`:`${themes[chapter]}${label}`,category,icon,
 cost:Math.round(CHAPTER_COSTS[chapter]*[1,1.45,2.1][j]),max:1,
 detail:effect==='harvest'&&n===1?'每页雇用收获甲虫，采摘、装篮、交付金币':effect==='sow'&&n===1?'每页雇用播种松鼠，补货后自动播种':detail}
}))
export const ULTIMATE_PURCHASES = 57
