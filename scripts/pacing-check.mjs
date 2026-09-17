import {pathToFileURL} from 'node:url';
import {newGame,reducer,PLANTS,UPGRADES,seedPlantId,teamFor,hireCatalog,hireAvailable,expansionLock,GARDEN_PRICES,potPrice,seedEconomy,reward,infiniteWater,SEED_PRICES} from '../src/game.ts';
export function runCampaign(seed=42,interval=2,{noExpand=false,limit=9000,fertilizer=true}={}){
 let s=reducer(newGame(),{type:'start'});s.randomState=seed;s.extraRandom=seed;s.weather={kind:0,started:-20,next:450};
 const pages=[],purchases=[],progress=[];let starAt=null,lastBuy=0,maxGap=0,actions=0,idle=0,earlyActions=0,earlyIdle=0;
 function buy(action,cost,name){s=reducer(s,action);purchases.push({t:s.elapsed/60,page:s.activeGarden,name,cost});maxGap=Math.max(maxGap,s.elapsed-lastBuy);lastBuy=s.elapsed;}
 function bestSeed(page){let best=0,score=0;for(let t=0;t<7;t++){if(s.coins<SEED_PRICES[t]*2)continue;const e=seedEconomy(t);const net=e.gross*(reward(s,PLANTS[0],page,-Infinity)/PLANTS[0].reward)-SEED_PRICES[t];const rate=net/e.seconds;if(rate>score){score=rate;best=t;}}return best;}
 for(let t=0;t<limit&&s.wonAt===null;t++){
  if(t%interval===0){actions++;if(t<300)earlyActions++;let acted=false;const page=s.activeGarden,team=teamFor(s),indices=Array.from({length:team.potCount},(_,i)=>page*15+i),star=indices.find(i=>s.pots[i].plant===9),tier=bestSeed(page);
   // Setting a local seed plan consumes an action; completed gardens keep their plan.
   if(team.workers.sow.length && tier>team.sowTier){s=reducer(s,{type:'sow-tier',tier});s=reducer(s,{type:'tick',dt:1});continue;}
   if(star!==undefined){if(s.player.phase==='idle' && s.elapsed-s.pots[star].wateredAt>=5 && !s.pots[star].watering){s=reducer(s,s.player.stock===0&&!infiniteWater(s)?{type:'refill'}:{type:'water',index:star});acted=true;}}
   else if(s.coins>=SEED_PRICES[7]){let i=indices.find(i=>s.pots[i].plant===null);if(i===undefined){i=indices[0];s=reducer(s,{type:'dig',index:i});}s=reducer(s,{type:'select',id:9});s=reducer(s,{type:'pot',index:i});starAt=s.elapsed/60;acted=true;}
   else{
    const reserve=SEED_PRICES[tier]*Math.min(3,team.potCount),choices=[];
    if(team.potCount<15)choices.push({cost:potPrice(s),name:'pot',action:{type:'expand'}});
    for(const u of UPGRADES.filter(u=>u.page===page&&!s.purchases.includes(u.id)))choices.push({cost:u.cost,name:u.id,action:{type:'buy',id:u.id}});
    for(const u of hireCatalog(page).filter(u=>hireAvailable(team,u))){if(u.type==='recruit'&&u.level>Math.min(5,page+1))continue;choices.push({cost:u.cost,name:u.id,action:{type:'hire',id:u.id}});}
    if(!noExpand&&s.gardens.length<5&&!expansionLock(s))choices.push({cost:GARDEN_PRICES[s.gardens.length],name:'garden',action:{type:'open-garden'}});
    choices.sort((a,b)=>a.cost-b.cost);const candidate=choices.find(x=>s.coins>=x.cost+reserve);
    if(candidate){buy(candidate.action,candidate.cost,candidate.name);if(candidate.name==='garden')pages.push(s.elapsed/60);acted=true;}
    else{const ripe=indices.find(i=>s.pots[i].plant!==null&&s.pots[i].plant!==9&&s.pots[i].growth>=PLANTS[s.pots[i].plant].seconds);const empty=indices.find(i=>s.pots[i].plant===null);const growing=indices.filter(i=>s.pots[i].plant!==null&&s.pots[i].growth<PLANTS[s.pots[i].plant].seconds&&!s.pots[i].watering);
     if(ripe!==undefined){s=reducer(s,{type:'pot',index:ripe});acted=true;}
     else if(empty!==undefined){s=reducer(s,{type:'select',id:seedPlantId(tier)});s=reducer(s,{type:'pot',index:empty});acted=true;}
     else if(growing.length && (s.player.phase==='idle' || fertilizer&&s.fertilizer>0)){const i=growing.sort((a,b)=>s.pots[b].growth/PLANTS[s.pots[b].plant].seconds-s.pots[a].growth/PLANTS[s.pots[a].plant].seconds)[0];s=reducer(s,fertilizer&&s.fertilizer>0?{type:'fertilize',index:i}:s.player.stock===0&&!infiniteWater(s)?{type:'refill'}:{type:'water',index:i});acted=true;}
    }
   }if(!acted){idle++;if(t<300)earlyIdle++;}
  }
  s=reducer(s,{type:'tick',dt:1});if(t%300===299)progress.push({minute:(t+1)/60,coins:Math.round(s.coins),earned:Math.round(s.earned),page:s.activeGarden,seed:teamFor(s).sowTier,pots:teamFor(s).potCount});
 }
 const win=s.wonAt===null?null:s.wonAt/60;
 const milestones=[0,...pages,starAt,win];
 const stages=milestones.slice(1).map((value,i)=>value===null||milestones[i]===null?null:value-milestones[i]);
 return {stages,earlyIdleRatio:earlyIdle/earlyActions,firstPurchase:purchases[0]?.t??null,seed,interval,win:s.wonAt===null?null:s.wonAt/60,pages,starAt,starMinutes:starAt===null||win===null?null:win-starAt,maxGap:maxGap/60,idleRatio:idle/actions,coins:s.coins,progress,purchases,stats:s.stats};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(runCampaign(Number(process.argv[2]??42)),null,2));
