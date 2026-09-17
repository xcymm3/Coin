import test from 'node:test'
import assert from 'node:assert/strict'
import {newGame,reducer,PLANTS,activeWeather,infiniteWater,growthRate,reward,parseSave,teamFor} from '../src/game.ts'
import {expanded,employ} from './helpers.mjs'

const setup=(kind,elapsed=100)=>{
 const s=reducer(newGame(),{type:'start'})
 s.elapsed=elapsed;s.weather={kind,started:100,next:500}
 s.pots[0]={plant:9,growth:0,germination:5,wateredAt:-10}
 return s
}
test('rain doubles only natural growth during the exact fifteen-second interval in every garden',()=>{
 let s=expanded();s.elapsed=99.75;s.weather={kind:0,started:100,next:500}
 for(let page=0;page<5;page++)s.pots[page*15]={plant:9,growth:0,germination:5,wateredAt:-10}
 const rates=s.gardens.map((_,i)=>growthRate(s,i))
 s=reducer(s,{type:'tick',dt:15.5})
 assert.equal(s.elapsed,115.25);assert.equal(activeWeather(s),null)
 rates.forEach((rate,i)=>assert.ok(Math.abs(s.pots[i*15].growth-rate*30.5)<1e-8))
 assert.equal(growthRate(s),rates[4])
})
test('rain begins at a scheduled fractional boundary without retroactive growth',()=>{
 let s=setup(1,99.75);s.weather={kind:1,started:0,next:100};s.extraRandom=0
 s=reducer(s,{type:'tick',dt:.5})
 assert.equal(activeWeather(s),0);assert.equal(s.pots[0].growth,.75)
})
test('fireflies multiply manual harvest and variant value, with exact start and end boundaries',()=>{
 for(const [time,multiplier] of [[99.99,1],[100,7],[114.99,7],[115,1]]){
  let s=setup(1,time);s.pots[0]={plant:10,growth:PLANTS[10].seconds,variant:1,wateredAt:-10}
  s=reducer(s,{type:'pot',index:0})
  assert.equal(s.coins,PLANTS[10].reward*2*multiplier)
 }
})
test('carriers lock the multiplier at picking time, not delivery time or the end of the tick',()=>{
 for(const [clock,multiplier] of [[.8,7],[.65,1]]){
  let s=setup(1,114.75);s.coins=100;s=employ(s,'harvest');s.coins=0
  s.pots[0]={plant:10,growth:PLANTS[10].seconds,variant:1,wateredAt:-10}
  Object.assign(teamFor(s).workers.harvest[0],{phase:'act',target:0,clock,x:12,y:33})
  s=reducer(s,{type:'tick',dt:.5})
  const value=PLANTS[10].reward*2*multiplier
  assert.equal(teamFor(s).workers.harvest[0].cargo,value)
  s=reducer(s,{type:'tick',dt:30});assert.equal(s.coins,value)
 }
 let s=setup(1,100);s.coins=100;s=employ(s,'harvest');s.coins=0
 Object.assign(teamFor(s).workers.harvest[0],{phase:'service',clock:1,cargo:19,count:1})
 s=reducer(s,{type:'tick',dt:.5});assert.equal(s.coins,19)
})
test('rainbow permits empty-can watering without consuming or permanently filling stock',()=>{
 for(const stock of [0,2]){
  let s=setup(2);s.player.stock=stock
  assert.equal(infiniteWater(s),true)
  s=reducer(s,{type:'water',index:0});assert.equal(s.player.stock,stock);assert.equal(s.pots[0].watering,1.2)
  assert.deepEqual(reducer(s,{type:'water',index:0}),s)
  assert.deepEqual(reducer(s,{type:'refill'}),s)
  s=reducer(s,{type:'tick',dt:15});assert.equal(infiniteWater(s),false);assert.equal(s.player.stock,stock)
  s=reducer(s,{type:'water',index:0});assert.equal(s.player.stock,Math.max(0,stock-1))
  assert.equal(s.pots[0].watering,stock?1.2:0)
 }
})
test('weather survives save/resume and offline growth matches live ticks across expiry',()=>{
 for(const kind of [0,1,2]){
  const s=setup(kind,114.75);s.randomState=42;s.extraRandom=42
  const saved=parseSave(JSON.stringify(s));assert.deepEqual(saved,s)
  let live=s;for(let i=0;i<80;i++)live=reducer(live,{type:'tick',dt:.25})
  const offline=reducer(saved,{type:'tick',dt:20})
  assert.equal(offline.pots[0].growth,live.pots[0].growth)
  assert.equal(activeWeather(offline),null);assert.equal(infiniteWater(offline),false)
  assert.equal(reward(offline,PLANTS[0]),PLANTS[0].reward)
  assert.deepEqual(parseSave(JSON.stringify(offline)),offline)
 }
})
