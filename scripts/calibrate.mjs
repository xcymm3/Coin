import {UPGRADES,UPGRADE_BASES,HIRE_BASES,GARDEN_PRICES} from '../src/game.ts';
import {campaign} from './campaign-check.mjs';
const targets=[10,22,34,46,64], originalU=[...UPGRADE_BASES],originalH=[...HIRE_BASES],originalG=[...GARDEN_PRICES];
for(let page=0;page<5;page++){
 const set=f=>{UPGRADES.filter(u=>u.page===page).forEach((u,j)=>u.cost=Math.round(originalU[page]*[1,1.4,1.9][j]*f));HIRE_BASES[page]=Math.round(originalH[page]*f);if(page<4)GARDEN_PRICES[page+1]=Math.round(originalG[page+1]*f)};
 let lo=.1,hi=20;
 for(let i=0;i<10;i++){const mid=(lo+hi)/2;set(mid);const r=campaign(42,2,false,Math.ceil(targets[page]*60)+1);const done=page<4?r.pages[page]:r.win;if(done!=null&&done<=targets[page])lo=mid;else hi=mid}
 set(lo);console.log(JSON.stringify({page,factor:lo,upgrade:UPGRADES.filter(u=>u.page===page).map(u=>u.cost),hire:HIRE_BASES[page],garden:GARDEN_PRICES[page+1]}));
}
console.log(JSON.stringify(campaign(42,2)));
