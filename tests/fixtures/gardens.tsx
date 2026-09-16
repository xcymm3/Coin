import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import Garden from '../../src/Garden'
import {newGame,reducer,UPGRADES,PLANTS,DECORATIONS} from '../../src/game'
function fixture(late:boolean,weather:number){let s=newGame();if(!late){s.fertilizer=3;s.pots[0]={plant:8,growth:0,germination:5,variant:1,wateredAt:-10};return s;}s.coins=1e15;s.earned=1e10;for(const u of UPGRADES.slice(0,45))s=reducer(s,{type:'buy',id:u.id});s.coins=1e9;s.fertilizer=5;s.decorations=DECORATIONS.map(d=>d.id);s.weather={kind:weather,started:2700,next:3150};s.elapsed=2700;s.lastSaved=Date.now();s.activeGarden=0;s.pots=s.pots.map((p,i)=>({...p,variant:i%4,plant:i%21===9?10:i%21,growth:PLANTS[i%21===9?10:i%21].seconds*.7,germination:5}));return s}
export default function Preview(){const[late,setLate]=useState(true);const[weather,setWeather]=useState(0);return <><div style={{background:'#19322d',color:'#ffe',padding:4}}>开发预览 · 不写入花园存档 <button onClick={()=>setLate(!late)}>{late?'查看肥料试用':'查看五页花园'}</button>{['细雨','萤火虫之夜','彩虹'].map((n,i)=><button key={n} onClick={()=>setWeather(i)}>预览{n}</button>)}</div><Garden key={`${late}-${weather}`} initialState={fixture(late,weather)} persist={false}/></>}
const root=import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!)
if(import.meta.hot)import.meta.hot.data.root=root
root.render(<Preview/>)
