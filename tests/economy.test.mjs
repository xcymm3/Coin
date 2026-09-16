import test from 'node:test'
import assert from 'node:assert/strict'
import { simulate } from '../scripts/balance-check.mjs'
import { newGame, reducer, PLANTS, SEED_PRICES, SEED_UNLOCK, STAGE_MINUTES, seedPlantId } from '../src/game.ts'

test('independent 100-seed cohort stays near the 4x stage curve with next-tier working capital',()=>{
  const runs=Array.from({length:100},(_,i)=>simulate(1001+i))
  for(let t=0;t<5;t++) {
    const mean=runs.reduce((sum,r)=>sum+r.stages[t],0)/runs.length
    assert.ok(Math.abs(mean/STAGE_MINUTES[t]-1)<.15, `${t}: mean ${mean}`)
    for(const run of runs) assert.ok(run.workingCapital[t]>=10*SEED_PRICES[t+1])
  }
})
test('event economy model agrees with actual game reducer through every unlock',()=>{
  const expected=simulate(42)
  let s=reducer(newGame(),{type:'start'});s.randomState=42
  let tier=0;const milestones=[]
  while(tier<5 && s.elapsed<200000) {
    for(let i=0;i<s.pots.length;i++) if(s.pots[i].plant===null) {
      let buy=tier
      while(buy>0 && s.coins<SEED_PRICES[buy]) buy--
      s=reducer(s,{type:'select',id:seedPlantId(buy)})
      s=reducer(s,{type:'pot',index:i})
    }
    const dt=Math.min(...s.pots.map(p=>PLANTS[p.plant].seconds-p.growth))
    assert.ok(dt>0)
    s=reducer(s,{type:'tick',dt})
    for(let i=0;i<s.pots.length;i++) if(s.pots[i].growth>=PLANTS[s.pots[i].plant].seconds) s=reducer(s,{type:'pot',index:i})
    while(tier<5 && s.earned>=SEED_UNLOCK[tier+1]) {tier++;milestones.push(s.elapsed/60)}
  }
  assert.deepEqual(milestones,expected.milestones)
  assert.equal(s.coins,expected.coins);assert.equal(s.earned,expected.earned)
})
