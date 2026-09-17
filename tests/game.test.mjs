import test from 'node:test'
import assert from 'node:assert/strict'
import {newGame,reducer,PLANTS,UPGRADES,hireCatalog,hireAvailable,teamFor,crewFor,capacity,workerSpeed,growthRate,reward,parseSave,DECORATIONS,decorationPrice,unlocked} from '../src/game.ts'
import {newGame as legacyNewGame,reducer as legacyReducer,UPGRADES as LEGACY_UPGRADES} from '../src/legacyGame.ts'
import {expanded,employ} from './helpers.mjs'
const pot=(plant,growth=0)=>({plant,growth,wateredAt:-10})
test('each garden has exactly three one-time researches with global effects',()=>{
 assert.equal(UPGRADES.length,15)
 let s=expanded();const before=s
 for(let page=0;page<5;page++)assert.equal(UPGRADES.filter(u=>u.page===page).length,3)
 s=reducer(s,{type:'buy',id:'g4-profit'});for(let page=0;page<5;page++)assert.equal(reward(s,PLANTS[0],page),reward(before,PLANTS[0],page)*4)
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
 assert.deepEqual(teamFor(s,0),original);assert.equal(s.purchases.length,12)
 assert.deepEqual(reducer(s,{type:'hire',id:'recruit-harvest-5'}),s)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('new garden starts empty and decorations cost more locally without gameplay bonuses',()=>{
 let s=newGame();s.coins=1e16;s.earned=1e10;s=employ(s,'water',2,1);s=reducer(s,{type:'decorate',id:'bunting'});s=reducer(s,{type:'expand'})
 assert.equal(reducer(s,{type:'open-garden'}).gardens.length,1)
 for(const u of UPGRADES.filter(u=>u.page===0))s=reducer(s,{type:'buy',id:u.id})
 s=reducer(s,{type:'open-garden'});assert.equal(s.activeGarden,1);assert.equal(teamFor(s).snails.length,0);assert.deepEqual(teamFor(s).decorations,[]);assert.deepEqual(teamFor(s).equipment,{water:0,harvest:0,sow:0})
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
 let s=expanded();assert.equal(unlocked(s,5),true);for(const u of UPGRADES.filter(u=>u.page===4))s=reducer(s,{type:'buy',id:u.id});assert.equal(unlocked(s,5),true)
 s=reducer(s,{type:'select',id:9});s=reducer(s,{type:'pot',index:60});s=reducer(s,{type:'tick',dt:8});assert.ok(s.wonAt!==null);assert.equal(s.pots[60].plant,9)
 s=employ(s,'sow');assert.equal(teamFor(s).workers.sow.length,1);assert.equal(reducer(s,{type:'open-garden'}).gardens.length,5)
 assert.equal(reducer(s,{type:'reset'}).gardens.length,1)
})
test('v3 migration preserves money, plants, collection, cargo, opened gardens and old bonuses',()=>{
 let old=legacyReducer(legacyNewGame(),{type:'start'});old.coins=1e16;old.earned=1e10
 for(const u of LEGACY_UPGRADES)old=legacyReducer(old,{type:'buy',id:u.id})
 old.decorations=['bunting'];old.hiddenDecorations=['bunting'];old.workers.harvest.cargo=123;old.workers.harvest.count=1
 old.pots[0]=pot(6,20);old.fertilizer=7;old.variants=['6:2'];old.harvests=old.harvestCounts[6]=9
 const s=parseSave(JSON.stringify(old));assert.ok(s);assert.equal(s.campaignVersion,4);assert.equal(s.coins,old.coins);assert.equal(s.gardens.length,5);assert.equal(s.pots[0].growth,20);assert.equal(s.fertilizer,7);assert.deepEqual(s.variants,['6:2']);assert.equal(s.harvestCounts[6],9)
 assert.equal(teamFor(s,0).workers.harvest[0].cargo,123);assert.deepEqual(teamFor(s,4).hiddenDecorations,['bunting']);assert.ok(s.upgrades.profit>=old.upgrades.profit)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('save rejects invalid local workers, equipment, purchases and duplicate decorations',()=>{
 const s=expanded();for(const mutate of [n=>n.gardens[0].equipment.water=5,n=>n.gardens[0].decorations=['bunting','bunting'],n=>n.purchases.push('invalid'),n=>n.activeGarden=5,n=>n.gardens[0].workers.harvest=null]){const n=structuredClone(s);mutate(n);assert.equal(parseSave(JSON.stringify(n)),null)}
})

test('cross-garden cart preserves the entire plant and clears reservations on both gardens',()=>{
 let s=expanded();s.activeGarden=0;s=employ(s,'water');s.activeGarden=1;s=employ(s,'harvest')
 const source={plant:8,growth:27,germination:5,variant:2,watering:0.8,wateredAt:12,revealedAt:9}
 const target={plant:6,growth:18,germination:5,variant:1,wateredAt:8}
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
 let s=reducer(newGame(),{type:'start'});s.coins=1e12
 s=reducer(s,{type:'expand'});for(const u of UPGRADES.filter(u=>u.page===0))s=reducer(s,{type:'buy',id:u.id})
 s=employ(s,'sow');s=employ(s,'harvest');s=reducer(s,{type:'select',id:9})
 s=reducer(s,{type:'open-garden'});assert.equal(s.activeGarden,1);assert.equal(teamFor(s).workers.sow.length,0)
 s=employ(s,'sow');s=employ(s,'harvest');s.coins=0
 s=reducer(s,{type:'tick',dt:90})
 for(const page of [0,1])assert.ok(s.pots.slice(page*15,page*15+15).some(p=>p.plant!==null))
 assert.ok(s.harvests>0);assert.equal(s.pots.some(p=>p.plant===9),false)
})
