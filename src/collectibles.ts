export const VARIANTS = [{name:'原色',className:''}]
export const SPECIAL_VARIANTS:Record<number,{name:string;color:string;shape:string}>={
 10:{name:'银铃结霜',color:'#ddf9f0',shape:'M3 11h9v3h2v9H1v-9h2Zm15-8h9v3h2v9H16V6h2Z'},
 11:{name:'萤灯双生',color:'#a6ef81',shape:'M2 8h10v3h2v13H0V11h2Zm18-5h10v3h2v13H18V6h2Z'},
 12:{name:'紫晶王冠',color:'#bb98ec',shape:'M14 1h4v24h-4ZM2 3h4v8h5v10H7V13H2Zm24 0h4v12h-5v9h-5v-5h4V9h2Z'},
 16:{name:'月下蝶莲',color:'#addff6',shape:'M2 3h7v4h6v16H5v-4H1V9h1Zm20 0h7v6h3v10h-5v4H17V7h5Z'},
 20:{name:'黑曜日冕',color:'#cb7762',shape:'M13 0h6v8h6V3h5v11h2v7h-8v5H8v-5H0v-7h2V3h5v5h6Z'},
 24:{name:'龙眠古莲',color:'#8fc9a7',shape:'M4 2h8v4h8V2h8v8h-4v5h7v6h-7v5H8v-5H1v-6h7v-5H4Z'},
 28:{name:'双星共鸣',color:'#f9d892',shape:'M5 0h4v7h6v4h-6v7H5v-7H0V7h5Zm17 9h4v7h6v4h-6v7h-4v-7h-6v-4h6Z'},
}
export const variantFor=(id:number)=>SPECIAL_VARIANTS[id]
export const DECORATIONS = [
 {id:'bunting',name:'叶色彩旗',cost:250,detail:'温室上方挂起一串彩旗'},
 {id:'fence',name:'白木围栏',cost:2000,detail:'花园两侧增添白木围栏'},
 {id:'mushrooms',name:'蘑菇小径',cost:25000,detail:'边角长出装饰小蘑菇'},
 {id:'lights',name:'暖星灯串',cost:1000000,detail:'窗边亮起金色小星灯'},
 {id:'fountain',name:'月泉摆件',cost:100000000,detail:'花园边缘放置一座小喷泉'},
 {id:'moon',name:'星月风铃',cost:10000000000,detail:'悬挂星月风铃'},
]
export const WEATHER = ['细雨','萤火虫之夜','彩虹']
