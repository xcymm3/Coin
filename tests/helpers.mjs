import {newGame,reducer,UPGRADES} from '../src/game.ts'
export function expanded(){let s=reducer(newGame(),{type:'start'});s.coins=1e16;s.earned=1e10;s=reducer(s,{type:'expand'});for(let page=0;page<4;page++){for(const u of UPGRADES.filter(u=>u.page===page))s=reducer(s,{type:'buy',id:u.id});s=reducer(s,{type:'open-garden'})}return s}
export function employ(s,kind,n=1,gear=0){for(let i=1;i<=n;i++)s=reducer(s,{type:'hire',id:`recruit-${kind}-${i}`});for(let i=1;i<=gear;i++)s=reducer(s,{type:'hire',id:`equipment-${kind}-${i}`});return s}
