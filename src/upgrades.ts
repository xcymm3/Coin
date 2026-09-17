export type EffectId = 'click' | 'soil' | 'profit' | 'splash' | 'lantern'
export const EFFECT_IDS: EffectId[] = ['click','soil','profit','splash','lantern']
export type UpgradeId = string
export type Upgrade = {id:string;page:number;name:string;cost:number;icon:string;detail:string;effects:Partial<Record<EffectId,number>>}
export type CrewKind = 'water' | 'harvest' | 'sow'
export const CREW_NAMES: Record<CrewKind,string> = {water:'浇水蜗牛',harvest:'收获甲虫',sow:'播种松鼠'}
export const MATERIALS = [
 {name:'木制',color:'#a67541',light:'#dfb576'},
 {name:'铜制',color:'#b96443',light:'#f6b276'},
 {name:'铁制',color:'#8a9bac',light:'#dce7eb'},
 {name:'金质',color:'#d6a42d',light:'#fff2a1'},
 {name:'钻石制',color:'#60cbd9',light:'#e2fcff'},
]
export const GARDENS = [
 { name:'苔庭温室', subtitle:'雨后的泥土与嫩芽', reward:1, growth:1, theme:'moss', ornament:'fern' },
 { name:'萤火溪谷', subtitle:'溪水绕过发光的蘑菇', reward:2, growth:1.2, theme:'brook', ornament:'stream' },
 { name:'琥珀沙庭', subtitle:'暖风与金色的石阶', reward:4, growth:1.5, theme:'amber', ornament:'sundial' },
 { name:'极光雪苑', subtitle:'冰晶映着缓缓流动的极光', reward:8, growth:2, theme:'aurora', ornament:'crystal' },
 { name:'星海天台', subtitle:'在星轨下种出最后一朵花', reward:16, growth:2.5, theme:'astral', ornament:'orrery' },
]

// Three discoveries per garden; their effects are shared by all gardens.
export const UPGRADE_BASES = [270,500000,9600000,1500000000,150000000000]
const names=[['苔庭丰收术','腐叶沃土','晨露灌注'],['溪谷授粉术','潮汐沃土','流泉灌注'],['琥珀育种术','暖砂沃土','日光灌注'],['极光丰收术','冰晶沃土','霜羽灌注'],['星海丰收术','星尘沃土','银河灌注']]
export const UPGRADES: Upgrade[] = GARDENS.flatMap((_,page)=>[
 {id:`g${page}-profit`,page,name:names[page][0],cost:UPGRADE_BASES[page],icon:'coin',detail:'全园收获价值 ×4',effects:{profit:2}},
 {id:`g${page}-soil`,page,name:names[page][1],cost:Math.round(UPGRADE_BASES[page]*1.4),icon:'leaf',detail:'全园自然生长速度 ×2',effects:{soil:1}},
 {id:`g${page}-click`,page,name:names[page][2],cost:Math.round(UPGRADE_BASES[page]*1.9),icon:'hand',detail:'手动浇水成长 ×2，水壶容量 ×2',effects:{click:1,splash:1}},
])
export const ULTIMATE_PURCHASES=15
export const EXPANSION_PRICE=1800
export const GARDEN_PRICES=[0,16000,20000000,1400000000,90000000000]
export const HIRE_BASES=[60,6000,400000,30000000,4000000000]
export type HireOption={id:string;kind:CrewKind;type:'recruit'|'equipment';level:number;cost:number;name:string;detail:string}
export function hireCatalog(page:number):HireOption[]{
 return (['water','harvest','sow'] as CrewKind[]).flatMap(kind=>{
  const base=HIRE_BASES[page]*({water:1,harvest:1.5,sow:2}[kind])
  return [
   ...Array.from({length:5},(_,i)=>({id:`recruit-${kind}-${i+1}`,kind,type:'recruit' as const,level:i+1,cost:Math.round(base*4**i),name:`雇佣第 ${i+1} 只${CREW_NAMES[kind]}`,detail:'仅本园增加一只独立作业的助手'})),
   ...Array.from({length:4},(_,i)=>({id:`equipment-${kind}-${i+1}`,kind,type:'equipment' as const,level:i+1,cost:Math.round(base*3*4**i),name:`${MATERIALS[i+1].name}${kind==='water'?'水箱':kind==='harvest'?'背筐':'种子袋'}`,detail:`本园${CREW_NAMES[kind]}${kind==='water'?'浇水效果 ×2、':''}容量 ×2，移速与作业效率提升`}))
  ]
 })
}
export const decorationPrice=(base:number,page:number)=>Math.round(base*[1,8,64,512,4096][page])
