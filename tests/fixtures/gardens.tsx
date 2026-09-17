import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import Garden from '../../src/Garden'
import {newGame,reducer,UPGRADES,PLANTS,DECORATIONS,teamFor} from '../../src/game'
function fixture(late:boolean,weather:number){
 let s=newGame();s.fertilizer=3
 if(!late){s.coins=10000;s.pots[0]={plant:8,growth:0,germination:5,variant:0,wateredAt:-10};return s}
 s.coins=1e16;s.earned=1e10
 for(let page=0;page<5;page++){
  while(teamFor(s).potCount<15)s=reducer(s,{type:'expand'})
  if(page<4){for(const u of UPGRADES.filter(u=>u.page===page))s=reducer(s,{type:'buy',id:u.id})}
  for(const kind of ['water','harvest','sow']){
   for(let i=1;i<=page+1;i++)s=reducer(s,{type:'hire',id:`recruit-${kind}-${i}`})
   for(let i=1;i<=page;i++)s=reducer(s,{type:'hire',id:`equipment-${kind}-${i}`})
  }
  teamFor(s).decorations=DECORATIONS.slice(0,page+1).map(d=>d.id)
  if(page<4)s=reducer(s,{type:'open-garden'})
 }
 s.weather={kind:weather,started:2700,next:3150};s.elapsed=2700;s.lastSaved=Date.now();s.activeGarden=0
 s.pots=s.pots.map((p,i)=>{const id=i%29===9?10:i%29;return {...p,variant:0,plant:id,growth:PLANTS[id].seconds*.7,germination:5}});return s
}
export default function Preview(){const[late,setLate]=useState(true);const[weather,setWeather]=useState(0);return <><div style={{background:'#19322d',color:'#ffe',padding:4}}>开发预览 · 不写入花园存档 <button onClick={()=>setLate(!late)}>{late?'查看初园商店':'查看五页花园'}</button>{['细雨','萤火虫之夜','彩虹'].map((n,i)=><button key={n} onClick={()=>setWeather(i)}>预览{n}</button>)}</div><Garden key={`${late}-${weather}`} initialState={fixture(late,weather)} persist={false}/></>}
const root=import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!)
if(import.meta.hot)import.meta.hot.data.root=root
root.render(<Preview/>)
