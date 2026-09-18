import test from 'node:test'
import assert from 'node:assert/strict'
import {newGame,reducer,PLANTS,UPGRADES,hireCatalog,hireAvailable,teamFor,crewFor,capacity,workerSpeed,growthRate,reward,parseSave,DECORATIONS,decorationPrice,unlocked,potPrice,ULTIMATE_TIER} from '../src/game.ts'
import {newGame as legacyNewGame,reducer as legacyReducer,UPGRADES as LEGACY_UPGRADES} from '../src/legacyGame.ts'
import {expanded,employ} from './helpers.mjs'
const pot=(plant,growth=0)=>({plant,growth,wateredAt:-10})

test('manual and squirrel planting reveal rare species immediately and grow on the first tick',()=>{
 for(const automatic of [false,true]){
  let s=reducer(newGame(),{type:'start'});s.elapsed=10;s.coins=100000;s.earned=500;s.randomState=42
  if(automatic){
   s=employ(s,'sow');s=reducer(s,{type:'sow-tier',tier:2})
   Object.assign(teamFor(s).workers.sow[0],{phase:'act',target:0,clock:.8,stock:1})
   s=reducer(s,{type:'tick',dt:.1})
  }else{
   s=reducer(s,{type:'select',id:6});s=reducer(s,{type:'pot',index:0})
  }
  const planted=s.pots[0]
  assert.ok(PLANTS[planted.plant].tier>=2)
  assert.equal(planted.germination,undefined)
  assert.equal(planted.revealedAt,s.elapsed)
  assert.equal(planted.growth,0)
  const after=reducer(s,{type:'tick',dt:.25})
  assert.equal(after.pots[0].growth,.25)
  assert.equal(after.pots[0].revealedAt,planted.revealedAt)
  assert.deepEqual(parseSave(JSON.stringify(after)),after)
 }
})

test('old unrevealed plants preserve growth and never trigger delayed reveal',()=>{
 let s=reducer(newGame(),{type:'start'})
 s.pots[0]={...pot(6,1),germination:1}
 s=parseSave(JSON.stringify(s));assert.ok(s)
 assert.equal(s.pots[0].growth,1)
 s=reducer(s,{type:'tick',dt:5})
 assert.equal(s.pots[0].growth,6)
 assert.equal(s.pots[0].revealedAt,undefined)
})

test('pots start at four, charge per slot, reject locked planting and stop at fifteen',()=>{
 let s=newGame()
 assert.equal(teamFor(s).potCount,4)
 assert.equal(reducer(s,{type:'pot',index:4}).pots[4].plant,null)
 assert.equal(reducer(s,{type:'expand'}).gardens[0].potCount,4)
 s.coins=1e6;s.earned=500
 for(let count=4;count<15;count++){
  const before=s.coins,cost=potPrice(s)
  s=reducer(s,{type:'expand'})
  assert.equal(teamFor(s).potCount,count+1)
  assert.equal(s.coins,before-cost)
 }
 assert.deepEqual(reducer(s,{type:'expand'}),s)
 teamFor(s).harvests=1000;for(const u of UPGRADES.filter(u=>u.page===0))s=reducer(s,{type:'buy',id:u.id})
 s=reducer(s,{type:'open-garden'})
 assert.equal(teamFor(s).potCount,4)
 assert.equal(teamFor(s,0).potCount,15)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})

test('previous campaign saves retain purchased pots and proportional growth',()=>{
 const s=newGame();delete s.balanceVersion
 s.pots=s.pots.slice(0,10);delete s.gardens[0].potCount
 s.pots[0]=pot(0,15);s.harvestCounts=s.harvestCounts.slice(0,21)
 s.variants=['0:1','10:3'];s.pots[0].variant=1
 const migrated=parseSave(JSON.stringify(s))
 assert.ok(migrated)
 assert.equal(teamFor(migrated).potCount,10)
 assert.equal(migrated.pots.length,15)
 assert.equal(migrated.pots[0].growth,PLANTS[0].seconds/2)
 assert.equal(migrated.pots[0].variant,0)
 assert.deepEqual(migrated.legacyVariants,s.variants)
 assert.deepEqual(parseSave(JSON.stringify(migrated)),migrated)
})
test('harvest research uses twenty continuous levels while each garden has two other researches',()=>{
 assert.equal(UPGRADES.length,30)
 assert.deepEqual(UPGRADES.filter(u=>u.effects.profit).map(u=>u.name),Array.from({length:20},(_,i)=>`丰收研究 ${i+1}级`))
 let s=expanded();const before=s
 for(let page=0;page<5;page++)assert.equal(UPGRADES.filter(u=>u.page===page).length,6)
 for(const u of UPGRADES.filter(u=>u.page===4&&u.effects.profit))s=reducer(s,{type:'buy',id:u.id});for(let page=0;page<5;page++)assert.equal(reward(s,PLANTS[0],page),reward(before,PLANTS[0],page)*4)
 assert.deepEqual(reducer(s,{type:'buy',id:'g4-profit'}),s)
 const natural=s;s=reducer(s,{type:'buy',id:'g4-soil'});for(let page=0;page<5;page++)assert.equal(growthRate(s,page),growthRate(natural,page)*2)
 const n=newGame();n.coins=1e16;assert.equal(reducer(n,{type:'buy',id:'g1-profit'}).purchases.length,0)
})
test('hiring is sequential, capped at five, and equipment affects only its local species',()=>{
 let s=expanded();const original=structuredClone(teamFor(s,0))
 assert.equal(hireCatalog(4).filter(u=>hireAvailable(teamFor(s),u)).length,3)
 assert.deepEqual(reducer(s,{type:'hire',id:'equipment-harvest-1'}),s)
 assert.deepEqual(reducer(s,{type:'hire',id:'recruit-harvest-2'}),s)
 for(const kind of ['water','harvest','sow'])s=employ(s,kind,5,4)
 for(const kind of ['water','harvest','sow']){assert.equal(crewFor(teamFor(s),kind).length,5);assert.equal(teamFor(s).equipment[kind],4)}
 assert.equal(hireCatalog(4).filter(u=>hireAvailable(teamFor(s),u)).length,0)
 assert.equal(capacity(s,'harvest',4),16);assert.equal(capacity(s,'harvest',0),1)
 assert.equal(workerSpeed(s,'harvest',4),workerSpeed(s,'harvest',0)*4)
 assert.deepEqual(teamFor(s,0),original);assert.equal(s.purchases.length,24)
 assert.deepEqual(reducer(s,{type:'hire',id:'recruit-harvest-5'}),s)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('new garden starts empty and decorations cost more locally without gameplay bonuses',()=>{
 let s=newGame();s.coins=1e16;s.earned=1e10;s=employ(s,'water',2,1);s=reducer(s,{type:'decorate',id:'bunting'});s=reducer(s,{type:'expand'})
 assert.equal(reducer(s,{type:'open-garden'}).gardens.length,1)
 teamFor(s).harvests=1000;for(const u of UPGRADES.filter(u=>u.page===0))s=reducer(s,{type:'buy',id:u.id})
 while(teamFor(s).potCount<15)s=reducer(s,{type:'expand'});s=reducer(s,{type:'open-garden'});assert.equal(s.activeGarden,1);assert.equal(teamFor(s).snails.length,0);assert.deepEqual(teamFor(s).decorations,[]);assert.deepEqual(teamFor(s).equipment,{water:0,harvest:0,sow:0})
 const before=s;s=reducer(s,{type:'decorate',id:'bunting'});assert.equal(before.coins-s.coins,decorationPrice(DECORATIONS[0].cost,1));assert.deepEqual(s.upgrades,before.upgrades)
 s=reducer(s,{type:'decoration-toggle',id:'bunting'});assert.deepEqual(teamFor(s,0).hiddenDecorations,[])
 s=reducer(s,{type:'toggle',key:'autoSow'});assert.equal(teamFor(s).autoSow,false);assert.equal(teamFor(s,0).autoSow,true)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('per-plant watering cooldown, refilling, moving and digging preserve their contracts',()=>{
 let s=reducer(newGame(),{type:'start'});s.pots[0]=pot(6);s.pots[1]=pot(7)
 s=reducer(s,{type:'water',index:0});s=reducer(s,{type:'water',index:0});s=reducer(s,{type:'water',index:1});assert.equal(s.player.stock,2)
 s=reducer(s,{type:'move',from:0,to:2});assert.equal(s.pots[2].watering,1.2)
 s=reducer(s,{type:'tick',dt:1.2});assert.ok(s.pots[2].growth>=3.2);assert.equal(s.clicks,2)
 s=reducer(s,{type:'refill'});s=reducer(s,{type:'tick',dt:1.2});assert.equal(s.player.stock,capacity(s,'player'))
 const before=s.harvests;s=reducer(s,{type:'dig',index:2});assert.equal(s.pots[2].plant,null);assert.equal(s.harvests,before);assert.equal(s.coins,0)
})
test('multiple offscreen carriers pick and deliver each plant exactly once using its garden value',()=>{
 let s=expanded();s=reducer(s,{type:'garden',index:0});s=employ(s,'harvest',5,4);s=reducer(s,{type:'garden',index:4})
 for(let i=0;i<15;i++)s.pots[i]=pot(1,PLANTS[1].seconds)
 const before=s.coins,amount=reward(s,PLANTS[1],0)*15;s=reducer(s,{type:'tick',dt:60});assert.equal(s.coins-before,amount);assert.equal(s.harvests,15)
 s=reducer(s,{type:'tick',dt:60});assert.equal(s.coins-before,amount);assert.equal(s.harvestCounts[1],15)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('every garden runs independently offscreen and offline matches live ticks',()=>{
 let s=expanded();for(let page=0;page<5;page++){s=reducer(s,{type:'garden',index:page});for(const kind of ['water','harvest','sow'])s=employ(s,kind,2,2)}
 const offline=reducer(s,{type:'tick',dt:120});let live=s;for(let i=0;i<120;i++)live=reducer(live,{type:'tick',dt:1})
 assert.deepEqual(offline,live);for(let page=0;page<5;page++)assert.ok(offline.pots.slice(page*15,page*15+15).some(p=>p.plant!==null))
 assert.ok(offline.stats.autoCoins>0);assert.deepEqual(parseSave(JSON.stringify(offline)),offline)
})
test('affordable ultimate matures, wins and leaves hiring available',()=>{
 let s=expanded();assert.equal(unlocked(s,ULTIMATE_TIER),true);for(const u of UPGRADES.filter(u=>u.page===4))s=reducer(s,{type:'buy',id:u.id});assert.equal(unlocked(s,ULTIMATE_TIER),true)
 s=reducer(s,{type:'select',id:9});s=reducer(s,{type:'pot',index:60});s=reducer(s,{type:'tick',dt:340});assert.ok(s.wonAt!==null);assert.equal(s.pots[60].plant,9)
 s=employ(s,'sow');assert.equal(teamFor(s).workers.sow.length,1);assert.equal(reducer(s,{type:'open-garden'}).gardens.length,5)
 assert.equal(reducer(s,{type:'reset'}).gardens.length,1)
})
test('v3 migration preserves money, plants, collection, cargo, opened gardens and old bonuses',()=>{
 let old=legacyReducer(legacyNewGame(),{type:'start'});old.coins=1e16;old.earned=1e10
 for(const u of LEGACY_UPGRADES)old=legacyReducer(old,{type:'buy',id:u.id})
 old.decorations=['bunting'];old.hiddenDecorations=['bunting'];old.workers.harvest.cargo=123;old.workers.harvest.count=1
 old.pots[0]=pot(6,20);old.fertilizer=7;old.variants=['6:2'];old.harvests=old.harvestCounts[6]=9
 const s=parseSave(JSON.stringify(old));assert.ok(s);assert.equal(s.campaignVersion,4);assert.equal(s.coins,old.coins);assert.equal(s.gardens.length,5);assert.equal(s.pots[0].growth,20/120*PLANTS[6].seconds);assert.equal(s.fertilizer,7);assert.deepEqual(s.legacyVariants,['6:2']);assert.equal(s.harvestCounts[6],9)
 assert.equal(teamFor(s,0).workers.harvest[0].cargo,123);assert.deepEqual(teamFor(s,4).hiddenDecorations,['bunting']);assert.ok(s.upgrades.profit>=old.upgrades.profit)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('save rejects invalid local workers, equipment, purchases and duplicate decorations',()=>{
 const s=expanded();for(const mutate of [n=>n.gardens[0].equipment.water=5,n=>n.gardens[0].decorations=['bunting','bunting'],n=>n.purchases.push('invalid'),n=>n.activeGarden=5,n=>n.gardens[0].workers.harvest=null]){const n=structuredClone(s);mutate(n);assert.equal(parseSave(JSON.stringify(n)),null)}
})

test('cross-garden cart preserves the entire plant and clears reservations on both gardens',()=>{
 let s=expanded();s.activeGarden=0;s=employ(s,'water');s.activeGarden=1;s=employ(s,'harvest')
 const source={plant:12,growth:27,germination:5,variant:1,watering:0.8,wateredAt:12,revealedAt:9}
 const target={plant:6,growth:18,germination:5,variant:0,wateredAt:8}
 s.pots[0]=source;s.pots[15]=target
 for(const [w,index] of [[teamFor(s,0).snails[0],0],[teamFor(s,1).workers.harvest[0],15]]){w.phase='walk';w.target=index;w.path=[{x:20,y:30}];w.clock=0.2}
 const before=structuredClone(s)
 s=reducer(s,{type:'move',from:0,to:15})
 assert.deepEqual(s.pots[15],source);assert.deepEqual(s.pots[0],target)
 assert.equal(s.coins,before.coins);assert.equal(s.harvests,before.harvests)
 assert.deepEqual(s.harvestCounts,before.harvestCounts)
 for(const w of [teamFor(s,0).snails[0],teamFor(s,1).workers.harvest[0]]){assert.equal(w.target,null);assert.equal(w.phase,'idle');assert.deepEqual(w.path,[])}
 s=reducer(s,{type:'move',from:15,to:74});assert.deepEqual(s.pots[74],source);assert.equal(s.pots[15].plant,null)
 assert.deepEqual(reducer(s,{type:'move',from:74,to:75}),s)
 assert.deepEqual(reducer(s,{type:'move',from:74,to:-1}),s)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})

test('ultimate selection does not stop sowing and harvesting after planting or switching gardens',()=>{
 let s=expanded()
 for(const page of [0,1]){s=reducer(s,{type:'garden',index:page});s=employ(s,'sow',2,2);s=employ(s,'harvest',2,2)}
 s=reducer(s,{type:'garden',index:0});s=reducer(s,{type:'select',id:9});s=reducer(s,{type:'pot',index:0})
 s.coins=0;s.randomState=42
 s=reducer(s,{type:'tick',dt:20})
 assert.ok(s.pots.slice(1,15).some(p=>p.plant!==null),'active garden should sow with ultimate selected')
 s=reducer(s,{type:'garden',index:1});s=reducer(s,{type:'tick',dt:160})
 assert.ok(s.pots.slice(15,30).some(p=>p.plant!==null),'newly viewed garden should keep sowing')
 assert.ok(s.harvests>0);assert.ok(s.stats.autoCoins>0)
 assert.equal(s.pots.filter(p=>p.plant===9).length,1);assert.equal(s.pots[0].plant,9)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})

test('opening second garden with ultimate selected keeps old crew working and new hires can sow',()=>{
 let s=reducer(newGame(),{type:'start'});s.coins=1e12;s.earned=1e16
 s=reducer(s,{type:'expand'});teamFor(s).harvests=1000;for(const u of UPGRADES.filter(u=>u.page===0))s=reducer(s,{type:'buy',id:u.id})
 s=employ(s,'sow');s=employ(s,'harvest');s=reducer(s,{type:'select',id:9})
 while(teamFor(s).potCount<15)s=reducer(s,{type:'expand'});s=reducer(s,{type:'open-garden'});assert.equal(s.activeGarden,1);assert.equal(teamFor(s).workers.sow.length,0)
 s=employ(s,'sow');s=employ(s,'harvest');s.coins=0
 s=reducer(s,{type:'tick',dt:90})
 for(const page of [0,1])assert.ok(s.pots.slice(page*15,page*15+15).some(p=>p.plant!==null))
 assert.ok(s.harvests>0);assert.equal(s.pots.some(p=>p.plant===9),false)
})

test('squirrel seed selection is local, requires a hire, rejects ultimate and migrates old saves',()=>{
 let s=expanded();assert.equal(reducer(s,{type:'sow-tier',tier:3}).gardens[4].sowTier,0)
 s=employ(s,'sow');s=reducer(s,{type:'sow-tier',tier:3});assert.equal(teamFor(s).sowTier,3);assert.equal(teamFor(s,0).sowTier,0)
 for(const tier of [-1,7,1.5])assert.equal(teamFor(reducer(s,{type:'sow-tier',tier})).sowTier,3)
 s=reducer(s,{type:'select',id:9});assert.equal(teamFor(s).sowTier,3)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
 const old=structuredClone(s);for(const t of old.gardens)delete t.sowTier
 assert.ok(parseSave(JSON.stringify(old)).gardens.every(t=>t.sowTier===0))
 for(const tier of [null,7,-1,0.5,'2']){const invalid=structuredClone(s);invalid.gardens[0].sowTier=tier;assert.equal(parseSave(JSON.stringify(invalid)),null)}
})

test('squirrels wait without spending stock or falling back, resume when funded and never overspend',()=>{
 let s=reducer(newGame(),{type:'start'});s.coins=1e6;s.earned=500;s=employ(s,'sow',2);s=reducer(s,{type:'sow-tier',tier:2});s.coins=499
 for(const [i,w] of teamFor(s).workers.sow.entries())Object.assign(w,{phase:'act',target:i,clock:0.5,stock:1})
 const before=structuredClone(teamFor(s).workers.sow)
 s=reducer(s,{type:'tick',dt:10});assert.deepEqual(teamFor(s).workers.sow,before);assert.equal(s.coins,499);assert.ok(s.pots.every(p=>p.plant===null))
 s.coins=500;s=reducer(s,{type:'tick',dt:1});assert.equal(s.coins,0);assert.equal(s.pots.filter(p=>p.plant!==null).length,1)
 assert.equal(teamFor(s).workers.sow[1].stock,1);assert.equal(teamFor(s).workers.sow[1].clock,0.5)
 s.coins=500;s=reducer(s,{type:'tick',dt:1});assert.equal(s.coins,0);assert.equal(s.pots.filter(p=>p.plant!==null).length,2)
 s=reducer(s,{type:'sow-tier',tier:0});s=reducer(s,{type:'tick',dt:40});assert.ok(s.pots.filter(p=>p.plant!==null).length>2)
})
