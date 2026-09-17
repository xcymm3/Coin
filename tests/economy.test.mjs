import test from 'node:test'
import assert from 'node:assert/strict'
import {newGame,reducer,unlocked,highestSeed,PLANTS,seedPlantId,teamFor} from '../src/game.ts'
import {employ} from './helpers.mjs'
test('all six seeds depend only on wallet balance, including the ultimate',()=>{
 for(let tier=0;tier<6;tier++){
  const s=newGame(),id=seedPlantId(tier),cost=PLANTS[id].cost;s.coins=cost
  assert.equal(s.earned,0);assert.equal(s.purchases.length,0);assert.equal(unlocked(s,tier),true)
  let planted=reducer(reducer(s,{type:'select',id}),{type:'pot',index:0});assert.notEqual(planted.pots[0].plant,null);assert.equal(planted.coins,0)
  if(cost){s.coins=cost-1;s.earned=1e12;assert.equal(unlocked(s,tier),false);s.selected=id;planted=reducer(s,{type:'pot',index:0});assert.equal(planted.pots[0].plant,null);assert.equal(planted.coins,cost-1)}
 }
})
test('wallet helper finds affordable tiers while squirrels use the garden selection',()=>{
 for(const [coins,tier] of [[0,0],[49,0],[50,1],[299,1],[300,2],[1800,3],[10800,4],[64800,4]]){const s=newGame();s.coins=coins;assert.equal(highestSeed(s),tier)}
 let s=reducer(newGame(),{type:'start'});s.coins=1000;s=employ(s,'sow');s.coins=300;s=reducer(s,{type:'sow-tier',tier:2})
 const w=teamFor(s).workers.sow[0];Object.assign(w,{phase:'act',target:0,clock:0,stock:1})
 s=reducer(s,{type:'tick',dt:1});assert.equal(s.coins,0);assert.notEqual(s.pots[0].plant,null)
})
test('a player can win in the first garden without any research and preserve that save progress',()=>{
 let s=reducer(newGame(),{type:'start'});s.coins=64800;s=reducer(s,{type:'select',id:9});s=reducer(s,{type:'pot',index:0});s=reducer(s,{type:'tick',dt:480})
 assert.notEqual(s.wonAt,null);assert.equal(s.purchases.length,0);assert.equal(s.gardens.length,1);assert.equal(s.pots[0].plant,9)
})
