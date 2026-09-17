import test from 'node:test'
import assert from 'node:assert/strict'
import {newGame,reducer,PLANTS,parseSave,DECORATIONS,teamFor,variantFor,seedPlantId,TIER_PLANTS,plantedReward,reward} from '../src/game.ts'
import {newGame as legacyNewGame} from '../src/legacyGame.ts'
const start=()=>reducer(newGame(),{type:'start'})
const pot=(id,growth=0,variant=0)=>({plant:id,growth,variant,wateredAt:-10})
test('fertilizer consumes once, matures and records a variant; invalid targets cost nothing',()=>{
 let s=start();s.fertilizer=2;s.pots[0]=pot(12,0,1);s.pots[1]=pot(9)
 const invalid=reducer(s,{type:'fertilize',index:1});assert.equal(invalid.fertilizer,2);assert.equal(invalid.wonAt,null)
 s=reducer(s,{type:'fertilize',index:0});assert.equal(s.pots[0].growth,PLANTS[12].seconds);assert.equal(s.fertilizer,1);assert.deepEqual(s.variants,['12:1']);assert.equal(s.harvests,0)
 s=reducer(s,{type:'fertilize',index:0});s=reducer(s,{type:'fertilize',index:2});assert.equal(s.fertilizer,1)
 assert.deepEqual(parseSave(JSON.stringify(s)),s)
 s=reducer(s,{type:'dig',index:0});assert.deepEqual(s.variants,['12:1'])
})
test('fertilizer drops only on a real harvest, at five percent manually and never from carriers',()=>{
 let s=start();s.extraRandom=42
 for(let i=0;i<10000;i++){s.pots[0]=pot(0,30);s=reducer(s,{type:'pot',index:0})}
 assert.ok(s.fertilizer>=440&&s.fertilizer<=560,String(s.fertilizer))
 s=start();s.coins=90;s=reducer(s,{type:'hire',id:'recruit-harvest-1'});s.extraRandom=1972;s.pots[0]=pot(0,30);teamFor(s).workers.harvest[0]={...teamFor(s).workers.harvest[0],phase:'act',target:0,clock:0,x:12,y:33}
 // Find a seed whose next independent draw is below 1%.
 for(let seed=0;seed<100000;seed++)if(((Math.imul(seed,1664525)+1013904223)>>>0)/4294967296<.01){s.extraRandom=seed;break}
 s=reducer(s,{type:'tick',dt:1});assert.equal(s.fertilizer,0);assert.equal(s.coins,0)
 s=reducer(s,{type:'tick',dt:20});assert.equal(s.fertilizer,0)
})
test('only each rarest species mutates at ten percent; variant harvest doubles for player and carrier',()=>{
 let a=start(),b=structuredClone(a);a.randomState=b.randomState=42;a.extraRandom=123;b.extraRandom=999
 let eligible=0,mutants=0
 for(let i=0;i<20000;i++){a.pots[0]=pot(null);b.pots[0]=pot(null);a=reducer(a,{type:'pot',index:0});b=reducer(b,{type:'pot',index:0});assert.equal(a.pots[0].plant,b.pots[0].plant);if(variantFor(a.pots[0].plant)){eligible++;mutants+=a.pots[0].variant}else assert.equal(a.pots[0].variant,0)}
 assert.ok(mutants/eligible>.075&&mutants/eligible<.13)
 for(let tier=0;tier<7;tier++){for(let rank=0;rank<4;rank++)assert.equal(!!variantFor(TIER_PLANTS[tier][rank]),rank===3)}
 a=start();a.pots[0]=pot(10,PLANTS[10].seconds-1,1);a=reducer(a,{type:'tick',dt:1});assert.deepEqual(a.variants,['10:1']);const value=reward(a,PLANTS[10])*2;assert.equal(plantedReward(a,0),value);a=reducer(a,{type:'pot',index:0});assert.equal(a.coins,value);assert.deepEqual(parseSave(JSON.stringify(a)),a)
 b=start();b.coins=90;b=reducer(b,{type:'hire',id:'recruit-harvest-1'});b.pots[0]=pot(10,PLANTS[10].seconds,1);b=reducer(b,{type:'tick',dt:30});assert.equal(b.coins,value);assert.equal(b.fertilizer,0)
})

test('decorations only spend money, toggle appearance and never count toward progression',()=>{
 let s=start();s.coins=1e12
 for(const d of DECORATIONS){const before=s;s=reducer(s,{type:'decorate',id:d.id});assert.equal(s.coins,before.coins-d.cost);assert.deepEqual(s.upgrades,before.upgrades);assert.deepEqual(s.purchases,[]);assert.equal(s.earned,0);assert.deepEqual(reducer(s,{type:'decorate',id:d.id}),s)}
 s=reducer(s,{type:'decoration-toggle',id:'moon'});assert.deepEqual(teamFor(s).hiddenDecorations,['moon']);assert.deepEqual(parseSave(JSON.stringify(s)),s)
})
test('weather begins every five to ten minutes and lasts fifteen seconds',()=>{
 let s=start();s.weather={kind:0,started:-20,next:300};s.extraRandom=42
 s=reducer(s,{type:'tick',dt:299});assert.equal(s.weather.started,-20)
 s=reducer(s,{type:'tick',dt:1});assert.equal(s.weather.started,300);assert.ok(s.weather.next>=600&&s.weather.next<=900)
 const before=s.weather.started;s=reducer(s,{type:'tick',dt:15});assert.equal(s.elapsed-before,15);assert.equal(s.earned,0);assert.equal(s.fertilizer,0)
 const resumed=parseSave(JSON.stringify(s));assert.deepEqual(resumed,s)
 let live=s;for(let i=0;i<600;i++)live=reducer(live,{type:'tick',dt:1});assert.deepEqual(reducer(s,{type:'tick',dt:600}),live)
})
test('legacy saves migrate empty collections and reset clears new systems',()=>{
 const s=legacyNewGame();for(const key of ['fertilizer','extraRandom','variants','decorations','hiddenDecorations','weather'])delete s[key]
 const n=parseSave(JSON.stringify(s));assert.ok(n);assert.equal(n.fertilizer,0);assert.deepEqual(n.variants,[])
 n.fertilizer=5;n.variants=['0:1'];const reset=reducer(n,{type:'reset'});assert.equal(reset.fertilizer,0);assert.deepEqual(reset.variants,[])
})
