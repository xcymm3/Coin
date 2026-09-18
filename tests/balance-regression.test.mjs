import test from 'node:test'
import assert from 'node:assert/strict'
import {newGame,reducer,PLANTS,UPGRADES,TIER_PLANTS,SEED_PRICES,seedLock,unlocked,seedEconomyFor,plantedReward,seedPlantId,hireCatalog,hireLock,parseSave,teamFor,reward} from '../src/game.ts'
import {expanded,employ} from './helpers.mjs'

test('harvest research starts affordably, requires local practice and advances one step at a time',()=>{
 let s=newGame();s.coins=10000
 assert.deepEqual(reducer(s,{type:'buy',id:'g0-profit'}),s)
 const steps=UPGRADES.filter(u=>u.page===0&&u.effects.profit)
 assert.deepEqual(steps.map(u=>u.cost),[40,65,85,110])
 for(const [i,u] of steps.entries()){
  if(i){assert.deepEqual(reducer(s,{type:'buy',id:u.id}),s);teamFor(s).harvests=u.harvests}
  const before=s;s=reducer(s,{type:'buy',id:u.id})
  assert.equal(s.upgrades.profit-before.upgrades.profit,.5)
  assert.equal(before.coins-s.coins,u.cost)
  assert.deepEqual(reducer(s,{type:'buy',id:u.id}),s)
 }
 assert.equal(2**s.upgrades.profit,4)
 assert.ok(parseSave(JSON.stringify(s)))
})

test('even a rich garden cannot buy a whole automation team instantly',()=>{
 let s=reducer(newGame(),{type:'start'});s.coins=1e12
 assert.match(hireLock(s,hireCatalog(0).find(u=>u.id==='recruit-sow-1')),/24/)
 teamFor(s).harvests=1000
 s=reducer(s,{type:'hire',id:'recruit-water-1'})
 for(const id of ['recruit-harvest-1','recruit-sow-1','recruit-water-2','equipment-water-1'])assert.deepEqual(reducer(s,{type:'hire',id}),s)
 s=reducer(s,{type:'tick',dt:44});assert.deepEqual(reducer(s,{type:'hire',id:'recruit-harvest-1'}),s)
 s=parseSave(JSON.stringify(s));assert.ok(s)
 s=reducer(s,{type:'tick',dt:1});s=reducer(s,{type:'hire',id:'recruit-harvest-1'})
 assert.equal(teamFor(s).workers.harvest.length,1)
 assert.equal(teamFor(s).hireReadyAt,90)
 assert.deepEqual(reducer(s,{type:'hire',id:'recruit-sow-1'}),s)
})

test('all paid seed tiers have positive normal returns; temporary weather cannot unlock unsafe tiers',()=>{
 const s=expanded();s.coins=1e18
 for(let profit=0;profit<=10;profit+=.5){s.upgrades.profit=profit
  for(let page=0;page<5;page++)for(let tier=1;tier<7;tier++){
   const lock=seedLock(s,tier,page)
   s.weather={kind:1,started:s.elapsed,next:s.elapsed+600}
   assert.equal(seedLock(s,tier,page),lock)
   if(!lock){
    assert.ok(seedEconomyFor(s,tier,page).net>0)
    for(const plant of PLANTS.filter(p=>p.id!==9)){
     s.pots[page*15]={plant:plant.id,growth:plant.seconds,wateredAt:-10,seedCost:SEED_PRICES[tier]}
     assert.ok(plantedReward(s,page*15,-Infinity)>=Math.ceil(SEED_PRICES[tier]*1.05))
    }
   }
  }
 }
 const fresh=newGame();fresh.coins=1e18
 for(let tier=3;tier<=6;tier++)assert.equal(unlocked(fresh,tier),false)
})

test('actual paid cost survives random downgrade, saving and moving, for manual and automatic harvest',()=>{
 for(const automatic of [false,true]){
  let s=expanded();s.activeGarden=4;s=employ(s,'harvest');s.coins=1e12
  // Find a real downgrade through the planting reducer, rather than synthesizing a receipt.
  for(let seed=0;seed<1000;seed++){
   s.pots[60]={plant:null,growth:0,wateredAt:-10};s.randomState=seed
   s=reducer(s,{type:'select',id:seedPlantId(6)});s=reducer(s,{type:'pot',index:60})
   if(PLANTS[s.pots[60].plant].tier<6)break
   s.coins=1e12
  }
  assert.ok(PLANTS[s.pots[60].plant].tier<6)
  assert.equal(s.pots[60].seedCost,SEED_PRICES[6])
  s=reducer(s,{type:'move',from:60,to:0});s=parseSave(JSON.stringify(s));assert.ok(s)
  s.pots[0].growth=PLANTS[s.pots[0].plant].seconds;s.activeGarden=0
  const expected=plantedReward(s,0);assert.ok(expected>=SEED_PRICES[6]*1.05)
  if(automatic){s=employ(s,'harvest');const before=s.coins;s=reducer(s,{type:'tick',dt:60});assert.equal(s.coins-before,expected)}
  else {const before=s.coins;s=reducer(s,{type:'pot',index:0});assert.equal(s.coins-before,expected)}
 }
})

test('variant and fifteen-second harvest weather multiply the guaranteed return exactly once',()=>{
 const s=newGame();s.elapsed=100;s.weather={kind:1,started:100,next:500}
 s.pots[0]={plant:TIER_PLANTS[0][3],growth:100,wateredAt:-10,variant:1,seedCost:10000}
 assert.equal(plantedReward(s,0,114.99),10500*2*7)
 assert.equal(plantedReward(s,0,115),10500*2)
 assert.equal(plantedReward(s,0,99),10500*2)
})

test('previous economy saves preserve owned fourfold rewards, money, plants and assistants',()=>{
 let old=newGame();old.coins=123456;old.balanceVersion=1
 old.purchases=['g0-profit'];old.upgrades.profit=2
 old.pots[0]={plant:13,growth:10,wateredAt:-10}
 delete old.gardens[0].harvests;delete old.gardens[0].hireReadyAt
 const migrated=parseSave(JSON.stringify(old));assert.ok(migrated)
 assert.equal(migrated.upgrades.profit,2);assert.equal(migrated.purchases.length,4)
 assert.equal(migrated.coins,old.coins);assert.deepEqual(migrated.pots,old.pots)
 assert.equal(reward(migrated,PLANTS[13]),reward(old,PLANTS[13]))
 assert.deepEqual(parseSave(JSON.stringify(migrated)),migrated)
})
