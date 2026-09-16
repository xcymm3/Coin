// Historical v1–v3 engine and migration regression tests.
import test from 'node:test'
import assert from 'node:assert/strict'
import { PLANTS, UPGRADES, newGame, reducer, unlocked, price, reward, upgradePrice, growthRate, clickPower, parseSave, upgradeLock, WATER_DURATION, randomPlant, plantChance, isGerminating, SEED_UNLOCK, SEED_PRICES, TIER_PLANTS, ULTIMATE_TIER, INITIAL_POTS } from '../src/legacyGame.ts'

const synchronize = s => { s.purchases=UPGRADES.filter(u=>UPGRADES.filter(v=>v.effect===u.effect).indexOf(u)<s.upgrades[u.effect]).map(u=>u.id);return s }
const start = () => reducer(newGame(), { type: 'start' })
const tick = (s, dt) => reducer(s, { type: 'tick', dt })
const water = (s, index) => reducer(s, { type: 'water', index })
const tap = (s, index) => reducer(s, { type: 'pot', index })
const planted = (id, growth = 0) => ({ plant: id, growth, wateredAt: -10 })

test('free seeds prevent a zero-coin soft lock; grow, discover and harvest', () => {
  let s = tap(start(), 0)
  assert.equal(s.coins, 0)
  const id = s.pots[0].plant
  assert.ok(id >= 0 && id < PLANTS.length && id !== 9)
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
  s.earned = 360; s.selected = 3
  s = tap(s, 1)
  assert.equal(s.pots[1].plant, null)
  assert.equal(s.coins, 0)
})
test('all six seed gates use cumulative income; discovery never bypasses a gate', () => {
  const s=start();s.discovered=PLANTS.map(p=>p.id)
  for(let tier=1;tier<5;tier++) {
    s.earned=SEED_UNLOCK[tier]-1;assert.equal(unlocked(s,tier),false)
    s.earned++;assert.equal(unlocked(s,tier),true)
  }
})

test('watering affects one plant only, including the water flower and upgraded can', () => {
  const s=start();s.upgrades.splash=3;s.pots[4]=planted(3);s.pots[3]=planted(2);s.pots[5]=planted(2)
  const n=tick(water(s,4),4)
  assert.equal(n.pots[4].growth,6);assert.equal(n.pots[3].growth,4);assert.equal(n.pots[5].growth,4)
  assert.equal(s.pots[4].growth,0);assert.equal(n.player.stock,3)
})
test('adult moon, crystal and bell plants do not change growth or watering', () => {
  let s = start(); s.pots[0] = planted(4, 22.5); s.pots[1] = planted(7,45); s.pots[2] = planted(8,55)
  assert.equal(growthRate(s),1)
  assert.equal(clickPower(s),2)
  s.upgrades.snail = 1; s.snails[0]={...s.snails[0],x:69,y:33,phase:'act',target:3,stock:3}; s.pots[3] = planted(1)
  s = tick(s,1)
  assert.ok(Math.abs(s.pots[3].growth - (1 + 3)) < .01)
})
test('sunflower produces no passive income', () => {
  let s = start(); s.pots[0] = planted(5,55)
  s = tick(s, 10); assert.equal(s.coins,0); assert.equal(s.earned,0)
})
test('carnivorous harvest does not grow any other plants', () => {
  const s = start(); s.pots[0] = planted(6,PLANTS[6].seconds); s.pots[1] = planted(1); s.pots[2] = planted(9)
  const n = tap(s,0)
  assert.equal(n.pots[1].growth,0); assert.equal(n.pots[2].growth,0)
})
test('all 60 independent upgrades charge once and expand to 75 pots', () => {
  assert.equal(UPGRADES.length,60)
  let s=start();s.coins=1e15
  for(const u of UPGRADES){
    const before=s.coins, n=s.upgrades[u.effect]
    assert.equal(upgradeLock(s,u.id),null)
    s=reducer(s,{type:'buy',id:u.id})
    assert.equal(s.coins,before-upgradePrice(s,u));assert.equal(s.upgrades[u.effect],n+1)
    assert.deepEqual(reducer(s,{type:'buy',id:u.id}),s)
  }
  assert.equal(s.pots.length,75);assert.equal(s.extraTeams.length,4)
  assert.deepEqual(parseSave(JSON.stringify(synchronize(s))),s)
})
test('soil, click, profit, compost and lantern change the relevant results', () => {
  let s = start(); s.earned=3000;s.coins=1000;s.selected=3
  s.upgrades.soil=2;s.upgrades.click=2;s.upgrades.profit=2;s.upgrades.compost=2;s.upgrades.lantern=2
  assert.equal(price(s,PLANTS[3]),13); assert.equal(reward(s,PLANTS[3]),160)
  s=tap(s,0);const initial=PLANTS[s.pots[0].plant].seconds*.75;assert.equal(s.pots[0].growth,initial)
  s=water(s,0);assert.equal(s.pots[0].growth,initial)
  s=tick(s,3);assert.ok(Math.abs(s.pots[0].growth-Math.min(PLANTS[s.pots[0].plant].seconds,initial+20))<.001)
})
test('automatic harvesting and reseeding fall back to a free seed', () => {
  let s = start();s.earned=3000;s.selected=8;s.upgrades.harvest=1;s.upgrades.sow=1;s.pots[0]=planted(0,PLANTS[0].seconds)
  s=tick(s,7)
  assert.equal(s.harvests,1)
  assert.ok(s.pots.some(p=>p.plant===null), 'animals cannot fill the whole garden at once')
  assert.ok(s.pots.some(p=>p.plant!==null && p.plant!==9))
  assert.ok(s.pots.every(p=>p.plant===null || p.plant!==9))
})
test('automation toggles pause harvesting and planting independently', () => {
  let s=start();s.upgrades.harvest=1;s.upgrades.sow=1;s.autoHarvest=false;s.autoSow=false;s.pots[0]=planted(0,PLANTS[0].seconds)
  s=tick(s,8);assert.equal(s.harvests,0);assert.equal(s.pots[1].plant,null)
})
test('ultimate wins on maturity and continues afterward', () => {
  let s=start();s.pots[0]=planted(9,478);s.upgrades.soil=4;s.upgrades.click=5;s.upgrades.harvest=1;s.upgrades.sow=1;s.selected=9
  s=water(s,0);assert.equal(s.pots[0].growth,478)
  s=tick(s,2);assert.equal(s.wonAt,.5)
  assert.equal(s.pots[0].plant,9);assert.equal(s.harvests,0)
  s=tap(s,0);assert.equal(s.coins,PLANTS[9].reward)
  s.selected=0;s.randomState=1;s=tap(s,0);s=tick(s,60);assert.equal(s.wonAt,.5);assert.ok(s.harvests>1)
})
test('offline simulation matches live ticks including automation', () => {
  let s=start();s.upgrades.snail=2;s.upgrades.water=1;s.upgrades.sow=1;s.upgrades.harvest=1
  let live=s
  for(let i=0;i<120;i++) live=tick(live,1)
  const offline=tick(s,120)
  assert.deepEqual(offline,live)
})
test('invalid saves are rejected instead of crashing; valid saves round trip', () => {
  const s=start();assert.deepEqual(parseSave(JSON.stringify(synchronize(s))),s)
  for (const bad of ['{', 'null','{}',JSON.stringify({...s,coins:-1}),JSON.stringify({...s,pots:[planted(123)]})]) assert.equal(parseSave(bad),null)
})


test('seed price depends on purchased tier, not the random result; rejected planting preserves RNG', () => {
  let s=start();s.randomState=123;s.coins=1e6;s.earned=1e6;s.selected=6
  const seen = new Set()
  for(let i=0;i<120;i++) {
    const before=s.coins;s=tap(s,0);seen.add(s.pots[0].plant)
    assert.equal(before-s.coins,300)
    assert.ok(s.pots[0].plant!==9)
    s.pots[0]=planted(s.pots[0].plant,PLANTS[s.pots[0].plant].seconds);s=tap(s,0)
  }
  assert.ok([6,7,8].every(id=>seen.has(id)));assert.ok([...seen].some(id=>id<6))
  s.coins=0;const rng=s.randomState;s=tap(s,0);assert.equal(s.randomState,rng);assert.equal(s.pots[0].plant,null)
  s=reducer(s,{type:'select',id:8});assert.equal(s.selected,6)
})
test('harvest only settles after travel and the entire picking action', () => {
  let s=start();s.upgrades.harvest=1;s.pots[0]=planted(1,PLANTS[1].seconds)
  const original=s
  s=tick(s,.5);assert.equal(s.coins,0);assert.equal(s.harvests,0);assert.equal(s.workers.harvest.phase,'walk')
  assert.notEqual(s.workers.harvest.y,91)
  while(s.workers.harvest.phase==='walk') s=tick(s,.05)
  assert.equal(s.workers.harvest.phase,'act');assert.equal(s.harvests,0)
  assert.equal(s.workers.harvest.x,12);assert.equal(s.workers.harvest.y,33)
  s=tick(s,.6);assert.equal(s.harvests,0)
  s=tick(s,.3);assert.equal(s.harvests,1);assert.equal(s.coins,0);assert.equal(s.workers.harvest.cargo,PLANTS[1].reward)
  s=tick(s,10);assert.equal(s.coins,PLANTS[1].reward);assert.equal(s.workers.harvest.cargo,0)
  assert.equal(original.workers.harvest.y,91);assert.equal(original.workers.harvest.phase,'idle')
})
test('manual intervention cancels stale jobs and disabled workers cannot finish actions', () => {
  let s=start();s.upgrades.harvest=1;s.pots[0]=planted(0,PLANTS[0].seconds)
  s=tick(s,.5);s=tap(s,0);s=tap(s,0)
  s=tick(s,1);assert.equal(s.harvests,1);assert.equal(s.workers.harvest.phase,'idle')
  s.upgrades.sow=1;s.workers.sow={...s.workers.sow,stock:3,x:31,y:33,facing:1,phase:'act',target:1,clock:.8,path:[]}
  s.autoSow=false;s=tick(s,1);assert.equal(s.pots[1].plant,null);assert.equal(s.workers.sow.clock,.8)
  s.autoSow=true;s=tick(s,.1);assert.notEqual(s.pots[1].plant,null)
})
test('save migration and mid-action resume preserve RNG and exactly-once completion', () => {
  let s=start();s.upgrades.sow=1;s.randomState=42
  s.workers.sow={...s.workers.sow,stock:3,x:12,y:33,facing:1,phase:'act',target:0,clock:.7,path:[]}
  const loaded=parseSave(JSON.stringify(synchronize(s)));assert.deepEqual(tick(loaded,.3),tick(s,.3))
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
  s=tick(s,3);assert.equal(s.workers.sow.stock,4);assert.equal(s.snails[0].stock,8)
  s=tick(s,10);assert.ok(s.clicks===0);assert.ok(s.pots.some(p=>p.wateredAt>0));assert.ok(s.workers.sow.stock<4)
})
test('carried rewards persist across saving and settle once; reset clears all logistics',()=>{
  let s=start();s.upgrades.harvest=1;s.workers.harvest.cargo=100;s.workers.harvest.count=1
  s=tick(s,.5);s=parseSave(JSON.stringify(synchronize(s)));assert.ok(s)
  s=tick(s,10);assert.equal(s.coins,100);s=tick(s,10);assert.equal(s.coins,100)
  const reset=reducer(s,{type:'reset'});assert.equal(reset.coins,0);assert.equal(reset.player.stock,4);assert.equal(reset.workers.harvest.cargo,0);assert.equal(reset.pots.length,INITIAL_POTS);assert.equal(reset.elapsed,0);assert.equal(reset.started,true)
})

test('watering tool starts at target without walking and never harvests mature plants',()=>{
  let s=start();s.pots[4]=planted(8);const before=s.player
  s=water(s,4);assert.equal(s.player.phase,'idle');assert.equal(s.pots[4].watering,WATER_DURATION);assert.deepEqual(s.player.path,[])
  assert.equal(s.player.x,before.x);assert.equal(s.player.y,before.y)
  s=tick(s,WATER_DURATION);assert.equal(s.player.stock,3);assert.equal(s.clicks,1)
  s.pots[4]=planted(8,PLANTS[8].seconds);s=water(s,4);assert.equal(s.pots[4].plant,8);assert.equal(s.harvests,0)
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
  assert.deepEqual(parseSave(JSON.stringify(synchronize(s))),s)
})
test('old travelling player can migrates to a stationary tool action',()=>{
  const s=start();s.pots[0]=planted(8);s.player={...s.player,phase:'walk',target:0,path:[{x:12,y:33}]}
  const loaded=parseSave(JSON.stringify(synchronize(s)));assert.equal(loaded.player.phase,'idle');assert.equal(loaded.pots[0].watering,WATER_DURATION);assert.equal(loaded.player.stock,3);assert.deepEqual(loaded.player.path,[])
  s.player={...s.player,phase:'return',target:null};assert.equal(parseSave(JSON.stringify(synchronize(s))).player.phase,'service')
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
  let s=start();s.pots[0]=planted(6,PLANTS[6].seconds);s.upgrades.harvest=1
  s.workers.harvest={...s.workers.harvest,phase:'act',target:0,clock:.8,cargo:20,count:1}
  s.player={...s.player,phase:'act',target:0,clock:.8}
  s=reducer(s,{type:'dig',index:0});assert.equal(s.workers.harvest.phase,'idle');assert.equal(s.player.phase,'idle');assert.equal(s.player.stock,4)
  assert.equal(s.workers.harvest.cargo,20);assert.equal(s.coins,0);s=tap(s,0);assert.ok(s.pots[0].plant!==9)
  s=tick(s,10);assert.equal(s.coins,20);assert.equal(s.harvests,0)
  assert.deepEqual(reducer(s,{type:'dig',index:14}),s)
})

test('watering has independent cooldowns and reserves shared charges immediately',()=>{
  let s=start();s.pots[0]=planted(8);s.pots[1]=planted(7)
  s=water(s,0);const first=s;s=water(s,0);assert.deepEqual(s,first)
  s=water(s,1);assert.equal(s.player.stock,2);assert.equal(s.pots[0].watering,WATER_DURATION);assert.equal(s.pots[1].watering,WATER_DURATION)
  s=tick(s,.6);assert.equal(s.clicks,0);assert.equal(s.pots[0].growth,.6)
  const restored=parseSave(JSON.stringify(synchronize(s)));s=tick(restored,.6);assert.equal(s.clicks,2);assert.equal(s.pots[0].watering,0)
  assert.ok(Math.abs(s.pots[0].growth-3.2)<.001);s=water(s,0);assert.equal(s.player.stock,1)
})
test('cooldown follows a moved plant; digging cancels it without applying to replacement',()=>{
  let s=start();s.pots[0]=planted(8);s=water(s,0);s=reducer(s,{type:'move',from:0,to:3})
  assert.equal(s.pots[3].watering,WATER_DURATION);assert.equal(s.pots[0].plant,null)
  const active=s;s=water(s,3);assert.deepEqual(s,active)
  s=reducer(s,{type:'dig',index:3});s=tap(s,3);s=tick(s,2);assert.equal(s.pots[3].growth,2);assert.equal(s.clicks,0);assert.equal(s.player.stock,3)
})
test('automation requires prior independent choices, never elapsed-time locks',()=>{
  let s=start();s.coins=1e15
  assert.ok(upgradeLock(s,'c2-harvest'))
  assert.equal(reducer(s,{type:'buy',id:'c2-harvest'}).upgrades.harvest,0)
  for(const u of UPGRADES.filter(u=>u.chapter<2))s=reducer(s,{type:'buy',id:u.id})
  assert.equal(upgradeLock(s,'c2-harvest'),null);assert.equal(s.elapsed,0)
  s=reducer(s,{type:'buy',id:'c2-harvest'});assert.equal(s.upgrades.harvest,1)
})

test('all species including ultimate receive identical upgraded manual and snail watering',()=>{
  for(const plant of PLANTS) {
    let s=start();s.pots[0]=planted(plant.id);s.upgrades.click=2;s.upgrades.soil=2
    s=tick(water(s,0),WATER_DURATION)
    assert.ok(Math.abs(s.pots[0].growth-(WATER_DURATION*4+8))<.001)
    let auto=start();auto.pots[0]=planted(plant.id);auto.upgrades.water=2;auto.upgrades.snail=1
    auto.snails[0]={...auto.snails[0],phase:'act',target:0,clock:0,stock:3,x:12,y:33}
    auto=tick(auto,.9);assert.ok(Math.abs(auto.pots[0].growth-12.9)<.001)
  }
})
test('ultimate receives lantern starting growth, soil speed and profit upgrades',()=>{
  let s=start();s.earned=SEED_UNLOCK[5];s.coins=SEED_PRICES[5];s.selected=9;s.wonAt=0;s.upgrades.lantern=3;s.upgrades.soil=4;s.upgrades.profit=4
  s=tap(s,0);assert.equal(s.pots[0].growth,420)
  s=tick(s,10);assert.ok(Math.abs(s.pots[0].growth-480)<.001)
  s=tick(s,201);assert.ok(s.wonAt!==null);assert.equal(s.pots[0].plant,9)
  s=tap(s,0);assert.equal(s.coins,PLANTS[9].reward*16)
})


test('all seed distributions match the two-stage design and never include ultimate', () => {
  for (const tier of [0,1,2,3,4]) {
    const s=start();s.randomState=2026
    const counts=Array(PLANTS.length).fill(0), n=200000
    for(let i=0;i<n;i++) counts[randomPlant(s,tier)]++
    assert.equal(counts[9],0)
    assert.ok(Math.abs(PLANTS.reduce((sum,p)=>sum+plantChance(tier,p.id),0)-1)<1e-12)
    counts.forEach((count,id)=>{
      const expected=plantChance(tier,id)
      assert.equal(expected>0,id!==9)
      assert.ok(Math.abs(count/n-expected)<Math.max(.0003,6*Math.sqrt(expected*(1-expected)/n)), `${tier}/${id}: ${count/n}`)
    })
  }
  const s=start(), rng=s.randomState
  assert.equal(randomPlant(s,ULTIMATE_TIER),9);assert.equal(s.randomState,rng)
})
test('germination hides a new seed for five effective seconds, even with lanterns', () => {
  let s=start();s.upgrades.lantern=3;s=tap(s,0)
  assert.equal(s.pots[0].germination,0);assert.ok(isGerminating(s.pots[0]))
  s=tick(s,4.9);assert.ok(isGerminating(s.pots[0]))
  s=tick(s,.1);assert.equal(isGerminating(s.pots[0]),false)
  let w=start();w=tap(w,0);w=water(w,0);w=tick(w,3)
  assert.equal(isGerminating(w.pots[0]),false)
})
test('advanced reveal fires once, survives moving and save/load; digging never refunds', () => {
  let s=start();s.pots[0]={...planted(6),germination:0};s=tick(s,5)
  assert.equal(s.pots[0].revealedAt,5)
  s=reducer(s,{type:'move',from:0,to:1});s=tick(s,1)
  assert.equal(s.pots[1].revealedAt,5)
  s=parseSave(JSON.stringify(synchronize(s)));assert.equal(s.pots[1].germination,5)
  const coins=s.coins;s=reducer(s,{type:'dig',index:1});assert.equal(s.coins,coins)
  s.earned=SEED_UNLOCK[1];s.coins=100;s.selected=3;s=tap(s,0)
  assert.equal(s.coins,50);s=reducer(s,{type:'dig',index:0});assert.equal(s.coins,50)
})


test('catalog contains four species per regular tier and one ultimate',()=>{
  assert.equal(PLANTS.length,21);assert.equal(TIER_PLANTS.flat().length,21)
  assert.equal(new Set(TIER_PLANTS.flat()).size,21)
  for(let tier=0;tier<5;tier++) {
    assert.equal(TIER_PLANTS[tier].length,tier===5?1:4)
    for(const id of TIER_PLANTS[tier]) { assert.equal(PLANTS[id].tier,tier);assert.equal(PLANTS[id].cost,SEED_PRICES[tier]) }
  }
})
test('legacy gardens preserve species, maturity ratios, money and completed victory',()=>{
  const s=start();delete s.economyVersion;s.pots=s.pots.slice(0,6)
  s.pots[0]=planted(1,15);s.pots[1]=planted(8,110);s.coins=123;s.earned=456;s.wonAt=100
  const migrated=parseSave(JSON.stringify(synchronize(s)))
  assert.equal(migrated.pots.length,10);assert.equal(migrated.economyVersion,2)
  assert.equal(migrated.pots[0].growth,PLANTS[1].seconds*.5)
  assert.equal(migrated.pots[1].growth,PLANTS[8].seconds)
  assert.equal(migrated.coins,123);assert.equal(migrated.earned,456);assert.equal(migrated.wonAt,100)
  assert.ok(unlocked(migrated,5));assert.deepEqual(parseSave(JSON.stringify(migrated)),migrated)
})


test('species collection counts only actual manual harvests, never maturity or digging',()=>{
  let s=start();s.pots[0]=planted(10)
  s=tick(s,PLANTS[10].seconds);assert.equal(s.harvestCounts[10],0)
  const before=s;s=tap(s,0);assert.equal(s.harvestCounts[10],1);assert.equal(before.harvestCounts[10],0)
  s.pots[0]=planted(10,PLANTS[10].seconds);s=tap(s,0);assert.equal(s.harvestCounts[10],2)
  s.pots[0]=planted(11,PLANTS[11].seconds);s=reducer(s,{type:'dig',index:0});assert.equal(s.harvestCounts[11],0)
  assert.deepEqual(parseSave(JSON.stringify(synchronize(s))).harvestCounts,s.harvestCounts)
  s=reducer(s,{type:'reset'});assert.ok(s.harvestCounts.every(n=>n===0));assert.equal(s.untrackedHarvests,0)
})
test('animal picking counts once before delivery and survives mid-cargo saves',()=>{
  let s=start();s.upgrades.harvest=1;s.pots[0]=planted(20,PLANTS[20].seconds)
  s.workers.harvest={...s.workers.harvest,phase:'act',target:0,x:12,y:33,clock:0}
  s=tick(s,.9);assert.equal(s.harvestCounts[20],1);assert.equal(s.coins,0)
  s=tick(parseSave(JSON.stringify(synchronize(s))),30);assert.equal(s.harvestCounts[20],1);assert.equal(s.coins,PLANTS[20].reward)
})
test('legacy total harvests are retained without fabricating species records',()=>{
  const s=start();s.harvests=42;s.discovered=[0,1,9];delete s.harvestCounts;delete s.untrackedHarvests
  const loaded=parseSave(JSON.stringify(synchronize(s)));assert.equal(loaded.harvests,42);assert.equal(loaded.untrackedHarvests,42)
  assert.ok(loaded.harvestCounts.every(n=>n===0));assert.deepEqual(parseSave(JSON.stringify(loaded)),loaded)
  for(const counts of [null,[],Array(21).fill(-1),Array(21).fill(.5)]) assert.equal(parseSave(JSON.stringify({...loaded,harvestCounts:counts})),null)
})
