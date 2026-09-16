import test from 'node:test'
import assert from 'node:assert/strict'
import { newGame, reducer, PLANTS } from '../src/game.ts'

test('working animals stay inside the garden and never teleport between jobs or stations', () => {
  let s=newGame();s.started=true;s.upgrades.snail=3;s.upgrades.harvest=3;s.upgrades.sow=3;s.upgrades.pots=9
  s.pots=Array.from({length:15},(_,i)=>({plant:i%3,growth:PLANTS[i%3].seconds,wateredAt:-10}))
  const actors=s=>[...s.snails,s.workers.harvest,s.workers.sow]
  const phases=new Set()
  for(let frame=0;frame<1200;frame++) {
    const before=actors(s);s=reducer(s,{type:'tick',dt:.25})
    actors(s).forEach((w,i)=>{
      phases.add(w.phase);assert.ok(w.x>=0&&w.x<=100&&w.y>=0&&w.y<=100)
      assert.ok(Math.hypot(w.x-before[i].x,w.y-before[i].y)<=(i<3?24:38)*.25+.001)
    })
  }
  for(const phase of ['walk','act','return','service']) assert.ok(phases.has(phase))
  assert.ok(s.earned>0);assert.ok(s.pots.slice(0,5).some(p=>p.wateredAt>0))
})
