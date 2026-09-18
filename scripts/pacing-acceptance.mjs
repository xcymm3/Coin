import assert from 'node:assert/strict'
import {mkdirSync, writeFileSync} from 'node:fs'
import {runCampaign} from './pacing-check.mjs'

// New saves, one decision every two seconds, real reducer and deterministic weather.
const targets = [10, 10, 12, 13, 15, 5]
const runs = []
for (let seed = 1001; seed <= 1015; seed++) {
  const r = runCampaign(seed)
  assert.equal(r.pages.length, 4, `seed ${seed}: all gardens must open`)
  assert.ok(r.win !== null, `seed ${seed}: campaign must finish`)
  assert.ok(r.firstPurchase <= .6, `seed ${seed}: first purchase within 36 seconds`)
  assert.ok(r.earlyIdleRatio <= .1, `seed ${seed}: first five minutes need activities`)
  assert.ok(r.starMinutes >= 4.5 && r.starMinutes <= 5.6)
  for(let page=0;page<5;page++){
    const hires=r.purchases.filter(p=>p.page===page&&/^(recruit|equipment)-/.test(p.name))
    for(let i=1;i<hires.length;i++)assert.ok(hires[i].t-hires[i-1].t>=.75-1e-9, `seed ${seed}, garden ${page}: team purchases must be spaced out`)
  }
  runs.push(r)
  console.log(`${seed}: ${r.stages.map(n => n.toFixed(2)).join(' / ')} minutes`)
}
const summary = targets.map((target, i) => {
  const values = runs.map(r => r.stages[i]).sort((a,b) => a-b)
  const mean = values.reduce((a,b) => a+b, 0) / values.length
  assert.ok(Math.abs(mean-target) <= target*.15, `stage ${i+1}: mean ${mean} vs target ${target}`)
  return {stage:i+1, target, mean, median:values[7], min:values[0], max:values.at(-1)}
})
mkdirSync('.artifacts', {recursive:true})
writeFileSync('.artifacts/pacing-results.json', JSON.stringify({summary,runs},null,2))
console.table(summary)
console.log('PASS: stage means within 15%; early activity and ultimate cultivation checks passed.')
