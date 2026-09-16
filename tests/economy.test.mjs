import test from 'node:test'
import assert from 'node:assert/strict'
import {campaign} from '../scripts/campaign-check.mjs'
import {newGame,reducer,UPGRADES,unlocked,parseSave,teamFor,PLANTS,growthRate,reward} from '../src/game.ts'

test('independent cohorts: 50–80 minutes, no five-minute upgrade drought',()=>{
 for(const interval of [1,3,5])for(let seed=1001;seed<=1015;seed++){
  const r=campaign(seed,interval)
  assert.ok(r.win>=50&&r.win<=80,`${seed}/${interval}: ${r.win} min`)
  assert.ok(r.maxGap<=5,`${seed}/${interval}: ${r.maxGap} min without purchase`)
  assert.equal(r.purchases,57);assert.equal(r.pages.length,4)
 }
})
test('automation focused players finish and late delivery beats manual harvesting',()=>{
 for(const seed of [1,42,2026]){
  const passive=campaign(seed,3,true)
  assert.ok(passive.win>=50&&passive.win<=80,JSON.stringify(passive))
  assert.ok(passive.maxGap<=5)
  const active=campaign(seed,2),late=active.windows.at(-1)
  assert.ok(late.autoCoins>late.manualCoins*2)
 }
})
const expanded=()=>{let s=reducer(newGame(),{type:'start'});s.coins=1e15;s.earned=1e10;for(const u of UPGRADES.slice(0,45))s=reducer(s,{type:'buy',id:u.id});return s}
test('five gardens keep distinct bonuses and workers while switching; offline matches live',()=>{
 let s=expanded();s.autoSow=false;s.autoHarvest=false
 s.pots=s.pots.map(()=>({plant:9,growth:0,wateredAt:-10}));s.upgrades.snail=0
 const live=reducer(s,{type:'tick',dt:.5})
 for(let page=0;page<5;page++)assert.equal(live.pots[page*15].growth,.5*growthRate(s,page))
 s=expanded();s=reducer(s,{type:'garden',index:0});const team=structuredClone(teamFor(s,4))
 let after=reducer(s,{type:'tick',dt:30})
 assert.notDeepEqual(teamFor(after,4),team);assert.ok(after.pots.slice(60).some(p=>p.plant!==null));assert.ok(after.stats.autoCoins>0)
 assert.deepEqual(parseSave(JSON.stringify(after)),after)
 let online=s;for(let i=0;i<30;i++)online=reducer(online,{type:'tick',dt:1})
 assert.deepEqual(after,online)
 after=reducer(after,{type:'garden',index:4});assert.equal(after.activeGarden,4)
 assert.equal(reducer(after,{type:'garden',index:5}).activeGarden,4)
 assert.equal(reducer(after,{type:'reset'}).pots.length,10)
})
test('offscreen harvest uses source garden multiplier and delivers exactly once',()=>{
 let s=expanded();s.autoSow=false;s.activeGarden=4
 s.pots[0]={plant:1,growth:PLANTS[1].seconds,wateredAt:-10}
 const before=s.coins, amount=reward(s,PLANTS[1],0)
 s=reducer(s,{type:'tick',dt:20});assert.equal(s.coins-before,amount)
 s=reducer(s,{type:'tick',dt:20});assert.equal(s.coins-before,amount)
})
test('ultimate needs campaign completion; remaining choices persist after winning',()=>{
 let s=expanded();assert.equal(unlocked(s,5),false)
 for(const u of UPGRADES.slice(45,57))s=reducer(s,{type:'buy',id:u.id})
 assert.equal(unlocked(s,5),true)
 s=reducer(s,{type:'select',id:9});s=reducer(s,{type:'pot',index:60});s=reducer(s,{type:'tick',dt:10})
 assert.ok(s.wonAt!==null);assert.equal(s.pots[60].plant,9)
 for(const u of UPGRADES.slice(57))s=reducer(s,{type:'buy',id:u.id})
 assert.equal(s.purchases.length,60)
})
test('old repeat-level saves migrate without losing existing plants or money',()=>{
 const old=newGame();delete old.campaignVersion;delete old.purchases;delete old.extraTeams;delete old.stats;delete old.activeGarden
 old.upgrades.click=3;old.upgrades.profit=2;old.upgrades.compost=3;old.coins=12345
 const migrated=parseSave(JSON.stringify(old));assert.ok(migrated);assert.equal(migrated.coins,15495);assert.equal(migrated.upgrades.click,3)
 assert.deepEqual(parseSave(JSON.stringify(migrated)),migrated)
})

test('browser 250ms ticks also meet pacing targets',()=>{
 for(const interval of [1,3,5]){const r=campaign(42,interval,false,7200,.25);assert.ok(r.win>=50&&r.win<=80);assert.ok(r.maxGap<=5)}
})
