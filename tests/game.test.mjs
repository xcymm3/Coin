import test from 'node:test'
import assert from 'node:assert/strict'
import { PLANTS, UPGRADES, newGame, reducer, unlocked, price, reward, upgradePrice, growthRate, clickPower, parseSave } from '../src/game.ts'

const start = () => reducer(newGame(), { type: 'start' })
const tick = (s, dt) => reducer(s, { type: 'tick', dt })
const tap = (s, index) => reducer(s, { type: 'pot', index })
const planted = (id, growth = 0) => ({ plant: id, growth, wateredAt: -10 })

test('free seeds prevent a zero-coin soft lock; grow, discover and harvest', () => {
  let s = tap(start(), 0)
  assert.equal(s.coins, 0)
  assert.equal(s.pots[0].plant, 0)
  s = tick(s, 12)
  assert.deepEqual(s.discovered, [0])
  s = tap(s, 0)
  assert.equal(s.coins, 12)
  assert.equal(s.harvests, 1)
  assert.equal(s.pots[0].plant, null)
})
test('click adds growth; insufficient funds never charge or plant', () => {
  let s = tap(start(), 0)
  s = tap(s, 0)
  assert.equal(s.pots[0].growth, 2)
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
test('water flower shares with orthogonal neighbors without row wrapping', () => {
  const s = start(); s.pots[4] = planted(3); s.pots[3] = planted(0); s.pots[5] = planted(0)
  const n = tap(s, 4)
  assert.equal(n.pots[3].growth, 2)
  assert.equal(n.pots[5].growth, 0)
  assert.equal(s.pots[3].growth, 0, 'reducer never mutates prior state')
})
test('moon, crystal and bell effects require the adult growth stage', () => {
  let s = start(); s.pots[0] = planted(4, 22.5); s.pots[1] = planted(7,45); s.pots[2] = planted(8,55)
  assert.equal(growthRate(s),1.15)
  assert.equal(clickPower(s),2.6)
  s.upgrades.snail = 1; s.cursor = 3; s.pots[3] = planted(1)
  s = tick(s,4)
  assert.ok(Math.abs(s.pots[3].growth - (4 * 1.15 + 3 * 1.4)) < .01)
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
  assert.equal(price(s,PLANTS[3]),24); assert.equal(reward(s,PLANTS[3]),147)
  s=tap(s,0);assert.equal(s.pots[0].growth,7)
  s=tap(s,0);assert.equal(s.pots[0].growth,13)
  s=tick(s,1);assert.ok(Math.abs(s.pots[0].growth-14.3)<.001)
})
test('automatic harvesting and reseeding fall back to a free seed', () => {
  let s = start();s.earned=2000;s.selected=8;s.upgrades.harvest=1;s.upgrades.sow=1;s.pots[0]=planted(0,12)
  s=tick(s,4)
  assert.equal(s.harvests,1)
  assert.ok(s.pots.every(p=>p.plant===0))
  assert.equal(s.coins,12)
})
test('automation toggles pause harvesting and planting independently', () => {
  let s=start();s.upgrades.harvest=1;s.upgrades.sow=1;s.autoHarvest=false;s.autoSow=false;s.pots[0]=planted(0,12)
  s=tick(s,8);assert.equal(s.harvests,0);assert.equal(s.pots[1].plant,null)
})
test('ultimate has independent growth, wins on maturity, and continues afterward', () => {
  let s=start();s.pots[0]=planted(9,478);s.upgrades.soil=4;s.upgrades.click=5;s.upgrades.harvest=1;s.upgrades.sow=1;s.selected=9
  s=tap(s,0);assert.equal(s.pots[0].growth,478.5)
  s=tick(s,2);assert.equal(s.wonAt,1.5)
  assert.equal(s.pots[0].plant,9);assert.equal(s.harvests,0)
  s=tap(s,0);assert.equal(s.coins,10000)
  s.selected=0;s=tap(s,0);s=tick(s,12);assert.equal(s.wonAt,1.5);assert.ok(s.harvests>1)
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
