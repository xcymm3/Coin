import {UPGRADES} from '../src/game.ts';
import {campaign} from './campaign-check.mjs';
const values=[];
for(let c=0;c<19;c++){
 const group=UPGRADES.filter(u=>u.chapter===c), target=(c+1)*195;
 const set=v=>group.forEach((u,j)=>u.cost=Math.round(v*[1,1.45,2.1][j]));
 let lo=c?values[c-1]:1,hi=Math.max(lo*8,1000);
 for(;;){set(hi);if(campaign(42,2,false,target).purchases<(c+1)*3)break;hi*=8;}
 for(let k=0;k<14;k++){const mid=(lo+hi)/2;set(mid);if(campaign(42,2,false,target).purchases>=(c+1)*3)lo=mid;else hi=mid;}
 values.push(Math.round(lo));set(values[c]);console.log(c,values[c]);
}
values.push(Math.round(values.at(-1)*2.5));console.log(JSON.stringify(values));
