import test from 'node:test'
import assert from 'node:assert/strict'
import {newGame,reducer,PLANTS,UPGRADES,harvestMultiplier,reward,seedEconomyFor,unlocked,parseSave,plantedReward} from '../src/game.ts'
import {expanded,employ} from './helpers.mjs'

test('each newly opened garden starts above the previous fully researched garden for every species',()=>{
 let s=newGame();s.coins=1e16
 for(let page=0;page<4;page++){
  s.gardens[page].harvests=1000
  for(const u of UPGRADES.filter(u=>u.page===page))s=reducer(s,{type:'buy',id:u.id})
  while(s.gardens[page].potCount<15)s=reducer(s,{type:'expand'})
  const old=s
  s=reducer(s,{type:'open-garden'})
  assert.equal(s.activeGarden,page+1)
  assert.equal(s.purchases.some(id=>UPGRADES.find(u=>u.id===id).page===page+1),false)
  assert.equal(harvestMultiplier(s,page+1)/harvestMultiplier(old,page),1.25)
  for(const p of PLANTS)assert.ok(reward(s,p,page+1,-Infinity)>reward(old,p,page,-Infinity))
  const before=harvestMultiplier(s,page)
  s=reducer(s,{type:'buy',id:`g${page+1}-profit-1`})
  assert.equal(harvestMultiplier(s,page),before,'research in the new garden must not boost old garden income')
 }
})

test('newly offered premium seeds outperform the previous tier without research, weather or fertilizer',()=>{
 const s=expanded();s.purchases=[];s.legacyBonuses.profit=0;s.coins=1e16
 for(let page=1;page<5;page++){
  const tier=page+2,a=seedEconomyFor(s,tier-1,page),b=seedEconomyFor(s,tier,page)
  assert.equal(unlocked(s,tier,page),true)
  assert.equal(unlocked(s,tier,page-1),false)
  assert.ok(b.net/b.seconds>a.net/a.seconds*1.15)
 }
})

test('old paid seed receipts and training survive repricing; impossible old squirrel plans migrate locally',()=>{
 let s=expanded();s.activeGarden=0;s=employ(s,'sow');s.gardens[0].sowTier=6
 s.balanceVersion=2;s.pots[0]={plant:0,growth:20,wateredAt:-10,seedCost:10000000000}
 const restored=parseSave(JSON.stringify(s));assert.ok(restored)
 assert.equal(restored.balanceVersion,3);assert.equal(restored.gardens[0].sowTier,2)
 assert.equal(restored.coins,s.coins);assert.deepEqual(restored.purchases,s.purchases)
 assert.equal(restored.gardens[0].hireReadyAt,s.gardens[0].hireReadyAt)
 assert.equal(plantedReward(restored,0,-Infinity),10500000000)
 assert.deepEqual(reducer(restored,{type:'sow-tier',tier:3}),restored)
 assert.deepEqual(parseSave(JSON.stringify(restored)),restored)
})
