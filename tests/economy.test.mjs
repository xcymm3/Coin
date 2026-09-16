import test from 'node:test'
import assert from 'node:assert/strict'
import {campaign} from '../scripts/campaign-check.mjs'
test('v4 independent cohorts: 50–80 minutes, no five-minute shop drought',()=>{
 const results=[]
 for(const interval of [1,3,5])for(let seed=1001;seed<=1015;seed++){
  const r=campaign(seed,interval);results.push(r)
  assert.ok(r.win>=50&&r.win<=80,`${seed}/${interval}: ${r.win} min`)
  assert.ok(r.maxGap<=5,`${seed}/${interval}: ${r.maxGap} min without purchase`)
  assert.equal(r.purchases,15);assert.equal(r.pages.length,4)
 }
 console.log(JSON.stringify({cohorts:results.length,min:Math.min(...results.map(r=>r.win)),max:Math.max(...results.map(r=>r.win)),gap:Math.max(...results.map(r=>r.maxGap))}))
})
test('automation-focused players finish and late delivery beats manual harvesting',()=>{
 for(const seed of [1,42,2026]){
  const passive=campaign(seed,3,true)
  assert.ok(passive.win>=50&&passive.win<=80,`${seed}: ${passive.win} min`);assert.ok(passive.maxGap<=5,`${seed}: ${passive.maxGap} min`)
  const active=campaign(seed,2),late=active.windows.at(-1);assert.ok(late.autoCoins>late.manualCoins*2)
 }
})
test('browser 250ms ticks also meet pacing targets',()=>{
 for(const interval of [1,3,5]){const r=campaign(42,interval,false,7200,.25);assert.ok(r.win>=50&&r.win<=80,`${interval}: ${r.win}`);assert.ok(r.maxGap<=5,`${interval}: ${r.maxGap}`)}
})
