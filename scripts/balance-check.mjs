import { pathToFileURL } from 'node:url'
import { newGame, randomPlant, PLANTS, SEED_PRICES, SEED_UNLOCK, TIERS, STAGE_MINUTES, seedEconomy } from '../src/game.ts'

// Event-driven, unupgraded natural-growth model: ten pots, immediate harvesting and
// replanting, no watering, no helpers, no idle time, no external money or discovery gates.
export function simulate(seed) {
  const rng = newGame(); rng.randomState = seed
  let time=0, coins=0, earned=0, tier=0
  const pots=Array(10).fill(null), milestones=[], workingCapital=[]
  while(tier<5 && time<200000) {
    for(let i=0;i<10;i++) if(!pots[i]) {
      let buy=tier
      while(buy>0 && coins<SEED_PRICES[buy]) buy--
      coins-=SEED_PRICES[buy]
      const id=randomPlant(rng,buy)
      pots[i]={id,at:time+PLANTS[id].seconds}
    }
    time=Math.min(...pots.map(p=>p.at))
    for(let i=0;i<10;i++) if(pots[i].at===time) {
      const value=PLANTS[pots[i].id].reward
      coins+=value;earned+=value;pots[i]=null
    }
    while(tier<5 && earned>=SEED_UNLOCK[tier+1]) {
      tier++;milestones.push(time/60);workingCapital.push(coins)
    }
  }
  return { seed, milestones, stages:milestones.map((t,i)=>t-(milestones[i-1]??0)), workingCapital, coins, earned }
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const runs=Array.from({length:100},(_,i)=>simulate(i+1))
  for(let t=0;t<5;t++) {
    const values=runs.map(r=>r.stages[t]).sort((a,b)=>a-b), mean=values.reduce((a,b)=>a+b,0)/values.length
    console.log(JSON.stringify({tier:TIERS[t],targetMinutes:STAGE_MINUTES[t],meanMinutes:+mean.toFixed(2),medianMinutes:values[50],p10:values[10],p90:values[90],minimumNextSeedPacks:Math.floor(Math.min(...runs.map(r=>r.workingCapital[t]))/SEED_PRICES[t+1]),unlock:SEED_UNLOCK[t+1],...seedEconomy(t)}))
  }
}
