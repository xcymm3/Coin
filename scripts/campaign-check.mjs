import {pathToFileURL} from 'node:url';
import {newGame,reducer,PLANTS,UPGRADES,unlocked,price,upgradeLock,seedPlantId,highestSeed,teamFor,hireCatalog,hireAvailable,expansionLock,GARDEN_PRICES,EXPANSION_PRICE} from '../src/game.ts';
export function campaign(seed=42, interval=2, idle=false, limit=7200, step=1) {
 let s=reducer(newGame(),{type:'start'});s.randomState=seed;
 const buys=[],pages=[],milestones=[],windows=[];let last=0,gap=0,cursor=0,previous={...s.stats};
 for(let t=0;t<limit&&s.wonAt===null;t++) {
  if(t%interval===0){
   const tier=highestSeed(s), ultimate=unlocked(s,5), selected=ultimate?9:seedPlantId(tier);
   s=reducer(s,{type:'select',id:selected});
   const team=teamFor(s);
   const choices=UPGRADES.filter(u=>u.page===s.activeGarden&&!s.purchases.includes(u.id)&&!upgradeLock(s,u.id)).map(u=>({...u,action:{type:'buy',id:u.id}}));
   for(const u of hireCatalog(s.activeGarden).filter(u=>hireAvailable(team,u)))choices.push({...u,action:{type:'hire',id:u.id}});
   if(s.pots.length===10)choices.push({id:'expand',cost:EXPANSION_PRICE,action:{type:'expand'}});
   else if(s.gardens.length<5&&!expansionLock(s))choices.push({id:'garden',cost:GARDEN_PRICES[s.gardens.length],action:{type:'open-garden'}});
   choices.sort((a,b)=>a.cost-b.cost);
   const reserve=ultimate?PLANTS[9].cost:price(s,PLANTS[seedPlantId(tier)])*3;
   const buy=choices.find(u=>s.coins>=u.cost+reserve);
   if(buy && !ultimate){s=reducer(s,buy.action);buys.push({id:buy.id,page:s.activeGarden,t:t/60});gap=Math.max(gap,t-last);last=t;if(buy.id==='garden')pages.push(t/60);}
   else {
    const start=s.activeGarden*15, indices=Array.from({length:Math.min(15,s.pots.length-start)},(_,i)=>start+i);
    const star=indices.find(i=>s.pots[i].plant===9);
    let i=indices.find(i=>s.pots[i].plant===null);
    if(ultimate&&star===undefined&&i!==undefined&&s.coins>=PLANTS[9].cost)s=reducer(s,{type:'pot',index:i});
    else if(!idle||!team.workers.sow.length||ultimate){
     i=indices.find(i=>s.pots[i].plant!==null&&s.pots[i].plant!==9&&s.pots[i].growth>=PLANTS[s.pots[i].plant].seconds);
     if(i!==undefined)s=reducer(s,{type:'pot',index:i});
     else {
      i=indices.find(i=>s.pots[i].plant===null);
      if(i!==undefined&&!ultimate){if(s.coins<price(s,PLANTS[s.selected]))s=reducer(s,{type:'select',id:0});s=reducer(s,{type:'pot',index:i});}
      else {const growing=indices.filter(i=>s.pots[i].plant!==null&&s.pots[i].growth<PLANTS[s.pots[i].plant].seconds&&!(s.pots[i].watering>0));i=star??growing[cursor++%growing.length];
       if(i!==undefined)s=reducer(s,s.player.stock===0?{type:'refill'}:{type:'water',index:i});}
     }
    }
   }
   for(let j=1;j<=5;j++)if(unlocked(s,j)&&milestones[j-1]===undefined)milestones[j-1]=t/60;
  }
  for(let sub=0;sub<1;sub+=step)s=reducer(s,{type:'tick',dt:Math.min(step,1-sub)});
  if((t+1)%300===0){windows.push({minute:(t+1)/60,...Object.fromEntries(Object.keys(previous).map(k=>[k,s.stats[k]-previous[k]]))});previous={...s.stats};}
 }
 return {seed,interval,idle,win:s.wonAt===null?null:s.wonAt/60,maxGap:Math.max(gap,s.elapsed-last)/60,buys,pages,milestones,windows,purchases:s.purchases.length,earned:s.earned};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){for(const seed of [42])console.log(JSON.stringify(campaign(seed,Number(process.argv[2]??2),process.argv.includes('--idle'))));}
