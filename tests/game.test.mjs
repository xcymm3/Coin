import test from 'node:test'
import assert from 'node:assert/strict'
import { PLANTS, UPGRADES, newGame, reducer, unlocked, price, reward, upgradePrice, growthRate, clickPower, parseSave } from '../src/game.ts'

const start = () => reducer(newGame(), { type: 'start' })
const tick = (s, dt) => reducer(s, { type: 'tick', dt })
const water = (s, index) => reducer(s, { type: 'water', index })
const tap = (s, index) => reducer(s, { type: 'pot', index })
const planted = (id, growth = 0) => ({ plant: id, growth, wateredAt: -10 })

test('free seeds prevent a zero-coin soft lock; grow, discover and harvest', () => {
  let s = tap(start(), 0)
  assert.equal(s.coins, 0)
  const id = s.pots[0].plant
  assert.equal(PLANTS[id].tier, 0)
  s = tick(s, PLANTS[id].seconds)
  assert.deepEqual(s.discovered, [id])
  s = tap(s, 0)
  assert.equal(s.coins, PLANTS[id].reward)
  assert.equal(s.harvests, 1)
  assert.equal(s.pots[0].plant, null)
})
test('click adds growth; insufficient funds never charge or plant', () => {
  let s = tap(start(), 0)
  s = water(s, 0)
  assert.equal(s.pots[0].growth, 0)
  s=tick(s,3);assert.equal(s.pots[0].growth,5);assert.equal(s.player.stock,3)
  s.earned = 120; s.selected = 3
  s = tap(s, 1)
  assert.equal(s.pots[1].plant, null)
  assert.equal(s.coins, 0)
})
test('unlock gates use lifetime income and all three advanced discoveries', () => {
  const s = start()
  assert.equal(unlocked(s, 1), false)
  s.earned = 120; assert.equal(unlocked(s, 1), true)
  s.earned = 1800; assert.equal(unlocked(s, 2), true)
  s.discovered = [6,7]; assert.equal(unlocked(s, 3), false)
  s.discovered.push(8); assert.equal(unlocked(s, 3), true)
})
test('watering affects one plant only, including the water flower and upgraded can', () => {
  const s=start();s.upgrades.splash=3;s.pots[4]=planted(3);s.pots[3]=planted(2);s.pots[5]=planted(2)
  const n=tick(water(s,4),4)
  assert.equal(n.pots[4].growth,8);assert.equal(n.pots[3].growth,4);assert.equal(n.pots[5].growth,4)
  assert.equal(s.pots[4].growth,0);assert.equal(n.player.stock,3)
})
test('moon, crystal and bell effects require the adult growth stage', () => {
  let s = start(); s.pots[0] = planted(4, 22.5); s.pots[1] = planted(7,45); s.pots[2] = planted(8,55)
  assert.equal(growthRate(s),1.15)
  assert.equal(clickPower(s),2.6)
  s.upgrades.snail = 1; s.snails[0]={...s.snails[0],x:69,y:33,phase:'act',target:3,stock:3}; s.pots[3] = planted(1)
  s = tick(s,1)
  assert.ok(Math.abs(s.pots[3].growth - (1.15 + 3 * 1.4)) < .01)
})
test('sunflower produces passive income, including when ready', () => {
  let s = start(); s.pots[0] = planted(5,55)
  s = tick(s, 10); assert.equal(s.coins,20); assert.equal(s.earned,20)
})
test('carnivorous harvest grows all normal plants but not the ultimate', () => {
  const s = start(); s.pots[0] = planted(6,70); s.pots[1] = planted(1); s.pots[2] = planted(9)
  const n = tap(s,0)
  assert.equal(n.pots[1].growth,8); assert.equal(n.pots[2].growth,0)
})
test('all 12 upgrades charge once per level and respect caps', () => {
  assert.equal(UPGRADES.length,12)
  for (const u of UPGRADES) {
    let s = start(); s.coins = 1e9
    for (let n=0;n<u.max;n++) {
      const cost = upgradePrice(s,u), before = s.coins
      s = reducer(s,{type:'buy',id:u.id})
      assert.equal(s.coins,before-cost); assert.equal(s.upgrades[u.id],n+1)
    }
    const before = s.coins
    s = reducer(s,{type:'buy',id:u.id}); assert.equal(s.coins,before)
    if (u.id === 'pots') assert.equal(s.pots.length,15)
  }
})
test('soil, click, profit, compost and lantern change the relevant results', () => {
  let s = start(); s.earned=2000;s.coins=1000;s.selected=3
  s.upgrades.soil=2;s.upgrades.click=2;s.upgrades.profit=2;s.upgrades.compost=2;s.upgrades.lantern=2
  assert.equal(price(s,PLANTS[3]),40); assert.equal(reward(s,PLANTS[3]),147)
  s=tap(s,0);const initial=PLANTS[s.pots[0].plant].seconds*.2;assert.equal(s.pots[0].growth,initial)
  s=water(s,0);assert.equal(s.pots[0].growth,initial)
  s=tick(s,3);assert.ok(Math.abs(s.pots[0].growth-(initial+9.9+(s.pots[0].plant===3?2:0)))<.001)
})
test('automatic harvesting and reseeding fall back to a free seed', () => {
  let s = start();s.earned=2000;s.selected=8;s.upgrades.harvest=1;s.upgrades.sow=1;s.pots[0]=planted(0,12)
  s=tick(s,7)
  assert.equal(s.harvests,1)
  assert.ok(s.pots.some(p=>p.plant===null), 'animals cannot fill the whole garden at once')
  assert.ok(s.pots.some(p=>p.plant!==null && PLANTS[p.plant].tier===0))
  assert.ok(s.pots.every(p=>p.plant===null || PLANTS[p.plant].tier===0))
})
test('automation toggles pause harvesting and planting independently', () => {
  let s=start();s.upgrades.harvest=1;s.upgrades.sow=1;s.autoHarvest=false;s.autoSow=false;s.pots[0]=planted(0,12)
  s=tick(s,8);assert.equal(s.harvests,0);assert.equal(s.pots[1].plant,null)
})
test('ultimate has independent growth, wins on maturity, and continues afterward', () => {
  let s=start();s.pots[0]=planted(9,478);s.upgrades.soil=4;s.upgrades.click=5;s.upgrades.harvest=1;s.upgrades.sow=1;s.selected=9
  s=water(s,0);assert.equal(s.pots[0].growth,478)
  s=tick(s,2);assert.equal(s.wonAt,1.5)
  assert.equal(s.pots[0].plant,9);assert.equal(s.harvests,0)
  s=tap(s,0);assert.equal(s.coins,10000)
  s.selected=0;s=tap(s,0);s=tick(s,40);assert.equal(s.wonAt,1.5);assert.ok(s.harvests>1)
})
test('offline simulation matches live ticks including automation', () => {
  let s=start();s.upgrades.snail=2;s.upgrades.water=1;s.upgrades.sow=1;s.upgrades.harvest=1
  let live=s
  for(let i=0;i<120;i++) live=tick(live,1)
  const offline=tick(s,120)
  assert.deepEqual(offline,live)
})
test('invalid saves are rejected instead of crashing; valid saves round trip', () => {
  const s=start();assert.deepEqual(parseSave(JSON.stringify(s)),s)
  for (const bad of ['{', 'null','{}',JSON.stringify({...s,coins:-1}),JSON.stringify({...s,pots:[planted(123)]})]) assert.equal(parseSave(bad),null)
})


test('each tier rolls three species at a fixed price; rejected planting does not consume RNG', () => {
  let s=start();s.randomState=123;s.coins=1e6;s.earned=1e6;s.selected=6
  const seen = new Set()
  for(let i=0;i<120;i++) {
    const before=s.coins;s=tap(s,0);seen.add(s.pots[0].plant)
    assert.equal(before-s.coins,300)
    assert.equal(PLANTS[s.pots[0].plant].tier,2)
    s.pots[0]=planted(s.pots[0].plant,PLANTS[s.pots[0].plant].seconds);s=tap(s,0)
  }
  assert.deepEqual([...seen].sort(),[6,7,8])
  s.coins=0;const rng=s.randomState;s=tap(s,0);assert.equal(s.randomState,rng);assert.equal(s.pots[0].plant,null)
  s=reducer(s,{type:'select',id:8});assert.equal(s.selected,6)
})
test('harvest only settles after travel and the entire picking action', () => {
  let s=start();s.upgrades.harvest=1;s.pots[0]=planted(1,18)
  const original=s
  s=tick(s,.5);assert.equal(s.coins,0);assert.equal(s.harvests,0);assert.equal(s.workers.harvest.phase,'walk')
  assert.notEqual(s.workers.harvest.y,91)
  while(s.workers.harvest.phase==='walk') s=tick(s,.05)
  assert.equal(s.workers.harvest.phase,'act');assert.equal(s.harvests,0)
  assert.equal(s.workers.harvest.x,12);assert.equal(s.workers.harvest.y,33)
  s=tick(s,.6);assert.equal(s.harvests,0)
  s=tick(s,.3);assert.equal(s.harvests,1);assert.equal(s.coins,0);assert.equal(s.workers.harvest.cargo,20)
  s=tick(s,10);assert.equal(s.coins,20);assert.equal(s.workers.harvest.cargo,0)
  assert.equal(original.workers.harvest.y,91);assert.equal(original.workers.harvest.phase,'idle')
})
test('manual intervention cancels stale jobs and disabled workers cannot finish actions', () => {
  let s=start();s.upgrades.harvest=1;s.pots[0]=planted(0,12)
  s=tick(s,.5);s=tap(s,0);s=tap(s,0)
  s=tick(s,1);assert.equal(s.harvests,1);assert.equal(s.workers.harvest.phase,'idle')
  s.upgrades.sow=1;s.workers.sow={...s.workers.sow,stock:3,x:31,y:33,facing:1,phase:'act',target:1,clock:.8,path:[]}
  s.autoSow=false;s=tick(s,1);assert.equal(s.pots[1].plant,null);assert.equal(s.workers.sow.clock,.8)
  s.autoSow=true;s=tick(s,.1);assert.notEqual(s.pots[1].plant,null)
})
test('save migration and mid-action resume preserve RNG and exactly-once completion', () => {
  let s=start();s.upgrades.sow=1;s.randomState=42
  s.workers.sow={...s.workers.sow,stock:3,x:12,y:33,facing:1,phase:'act',target:0,clock:.7,path:[]}
  const loaded=parseSave(JSON.stringify(s));assert.deepEqual(tick(loaded,.3),tick(s,.3))
  const old={...s,selected:8};delete old.workers;delete old.randomState;delete old.logistics;delete old.player;delete old.snails
  const migrated=parseSave(JSON.stringify(old));assert.equal(migrated.selected,6);assert.equal(migrated.workers.sow.phase,'idle')
  assert.ok(Number.isInteger(migrated.randomState))
  const invalid={...s,workers:{...s.workers,sow:{...s.workers.sow,x:Infinity}}};assert.equal(parseSave(JSON.stringify(invalid)),null)
})

test('empty tool refuses watering; refilling charges in place without travel',()=>{
  let s=start();s.player.stock=0;s.pots[0]=planted(8)
  s=water(s,0);assert.equal(s.player.phase,'idle');assert.equal(s.pots[0].growth,0)
  s=reducer(s,{type:'refill'});assert.equal(s.player.phase,'service');assert.equal(s.player.stock,0)
  s=tick(s,.5);assert.equal(s.player.stock,0)
  s=tick(s,3);assert.equal(s.player.stock,4);assert.equal(s.player.phase,'idle')
  s=tick(water(s,0),3);assert.equal(s.player.stock,3);assert.equal(s.clicks,1)
})
test('seed and water helpers refill before work; upgraded baskets hold more',()=>{
  let s=start();s.upgrades.sow=3;s.upgrades.water=2;s.upgrades.snail=1;s.pots[0]=planted(8)
  s=tick(s,.5);assert.equal(s.workers.sow.stock,0);assert.equal(s.snails[0].stock,0);assert.equal(s.pots[0].wateredAt,-10)
  s=tick(s,3);assert.equal(s.workers.sow.stock,7);assert.equal(s.snails[0].stock,5)
  s=tick(s,10);assert.ok(s.clicks===0);assert.ok(s.pots.some(p=>p.wateredAt>0));assert.ok(s.workers.sow.stock<7)
})
test('carried rewards persist across saving and settle once; reset clears all logistics',()=>{
  let s=start();s.upgrades.harvest=1;s.workers.harvest.cargo=100;s.workers.harvest.count=1
  s=tick(s,.5);s=parseSave(JSON.stringify(s));assert.ok(s)
  s=tick(s,10);assert.equal(s.coins,100);s=tick(s,10);assert.equal(s.coins,100)
  const reset=reducer(s,{type:'reset'});assert.equal(reset.coins,0);assert.equal(reset.player.stock,4);assert.equal(reset.workers.harvest.cargo,0);assert.equal(reset.pots.length,6);assert.equal(reset.elapsed,0);assert.equal(reset.started,true)
})

test('watering tool starts at target without walking and never harvests mature plants',()=>{
  let s=start();s.pots[4]=planted(8);const before=s.player
  s=water(s,4);assert.equal(s.player.phase,'act');assert.equal(s.player.target,4);assert.deepEqual(s.player.path,[])
  assert.equal(s.player.x,before.x);assert.equal(s.player.y,before.y)
  s=tick(s,.9);assert.equal(s.player.stock,3);assert.equal(s.clicks,1)
  s.pots[4]=planted(8,110);s=water(s,4);assert.equal(s.pots[4].plant,8);assert.equal(s.harvests,0)
})
test('cart moves or swaps complete plants and cancels stale jobs without losing cargo',()=>{
  let s=start();s.pots[0]=planted(9,300);s.pots[1]=planted(4,30);s.player={...s.player,phase:'act',target:0,clock:.5}
  s.workers.harvest={...s.workers.harvest,phase:'walk',target:1,cargo:50,count:1}
  const original=s;s=reducer(s,{type:'move',from:0,to:1})
  assert.deepEqual(s.pots[1],original.pots[0]);assert.deepEqual(s.pots[0],original.pots[1]);assert.equal(s.player.phase,'idle')
  assert.equal(s.workers.harvest.phase,'idle');assert.equal(s.workers.harvest.cargo,50);assert.equal(s.player.stock,4)
  s=reducer(s,{type:'move',from:1,to:5});assert.equal(s.pots[1].plant,null);assert.equal(s.pots[5].growth,300)
  const before=s;s=reducer(s,{type:'move',from:1,to:0});assert.deepEqual(s,before)
  assert.deepEqual(reducer(s,{type:'move',from:5,to:14}),s)
  assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('old travelling player can migrates to a stationary tool action',()=>{
  const s=start();s.pots[0]=planted(8);s.player={...s.player,phase:'walk',target:0,path:[{x:12,y:33}]}
  const loaded=parseSave(JSON.stringify(s));assert.equal(loaded.player.phase,'act');assert.deepEqual(loaded.player.path,[])
  s.player={...s.player,phase:'return',target:null};assert.equal(parseSave(JSON.stringify(s)).player.phase,'service')
})

test('shovel removes every plant at every growth stage with no reward or harvest effects',()=>{
  for(const plant of PLANTS) for(const growth of [0,plant.seconds/2,plant.seconds]) {
    let s=start();s.coins=123;s.earned=456;s.harvests=7;s.pots[0]=planted(plant.id,growth);s.pots[1]=planted(1,1)
    const before=s;s=reducer(s,{type:'dig',index:0})
    assert.equal(s.pots[0].plant,null);assert.equal(s.pots[0].growth,0);assert.equal(s.coins,123);assert.equal(s.earned,456)
    assert.equal(s.harvests,7);assert.equal(s.pots[1].growth,1);assert.deepEqual(s.discovered,before.discovered);assert.equal(s.wonAt,null)
    assert.equal(before.pots[0].plant,plant.id)
  }
})
test('dig cancels jobs on the removed plant, preserves cargo and allows free replanting',()=>{
  let s=start();s.pots[0]=planted(6,70);s.upgrades.harvest=1
  s.workers.harvest={...s.workers.harvest,phase:'act',target:0,clock:.8,cargo:20,count:1}
  s.player={...s.player,phase:'act',target:0,clock:.8}
  s=reducer(s,{type:'dig',index:0});assert.equal(s.workers.harvest.phase,'idle');assert.equal(s.player.phase,'idle');assert.equal(s.player.stock,4)
  assert.equal(s.workers.harvest.cargo,20);assert.equal(s.coins,0);s=tap(s,0);assert.equal(PLANTS[s.pots[0].plant].tier,0)
  s=tick(s,10);assert.equal(s.coins,20);assert.equal(s.harvests,0)
  assert.deepEqual(reducer(s,{type:'dig',index:14}),s)
})
