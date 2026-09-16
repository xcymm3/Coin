import test from 'node:test'
import assert from 'node:assert/strict'
import { newGame, reducer, PLANTS,teamFor } from '../src/game.ts'
import {employ} from './helpers.mjs'

test('working animals stay inside the garden and never teleport between jobs or stations', () => {
  let s=newGame();s.started=true;s.coins=1e16;for(const kind of ['water','harvest','sow'])s=employ(s,kind,3)
  s.pots=Array.from({length:15},(_,i)=>({plant:i%3,growth:PLANTS[i%3].seconds,wateredAt:-10}))
  const actors=s=>[...teamFor(s).snails,...teamFor(s).workers.harvest,...teamFor(s).workers.sow]
  const phases=new Set()
  for(let frame=0;frame<1200;frame++) {
    const before=actors(s);s=reducer(s,{type:'tick',dt:.25})
    actors(s).forEach((w,i)=>{
      phases.add(w.phase);assert.ok(w.x>=0&&w.x<=100&&w.y>=0&&w.y<=100)
      assert.ok(Math.hypot(w.x-before[i].x,w.y-before[i].y)<=(i<3?24:38)*.25+.001)
    })
  }
  for(const phase of ['walk','act','return','service']) assert.ok(phases.has(phase))
  assert.ok(s.earned>0);assert.ok(s.stats.autoGrowth>0)
})
