import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import Garden from '../../src/Garden'
import {newGame,reducer,UPGRADES,PLANTS} from '../../src/game'
function fixture(late:boolean){let s=newGame();if(!late)return s;s.coins=1e15;s.earned=1e10;for(const u of UPGRADES.slice(0,45))s=reducer(s,{type:'buy',id:u.id});s.coins=1e9;s.elapsed=2700;s.lastSaved=Date.now();s.activeGarden=0;s.pots=s.pots.map((p,i)=>({...p,plant:i%21===9?10:i%21,growth:PLANTS[i%21===9?10:i%21].seconds*.7,germination:5}));return s}
export default function Preview(){const[late,setLate]=useState(true);return <><div style={{background:'#19322d',color:'#ffe',padding:4}}>开发预览 · 不写入花园存档 <button onClick={()=>setLate(!late)}>{late?'查看新游戏':'查看五页花园'}</button></div><Garden key={String(late)} initialState={fixture(late)} persist={false}/></>}
createRoot(document.getElementById('root')!).render(<Preview/> )
