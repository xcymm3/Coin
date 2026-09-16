import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plantPosition, residentPose, patrolDuration } from '../src/gardenScene.ts'

test('resident patrol stays inside the garden, visits all pots and loops continuously', () => {
  const visited = new Set()
  let prev = residentPose(0, 0)
  for (let t = 0; t < patrolDuration * 2; t += .05) {
    const p = residentPose(t, 0)
    assert.ok(p.x >= 4 && p.x <= 96 && p.y >= 7 && p.y <= 91)
    assert.ok(Math.hypot(p.x - prev.x, p.y - prev.y) < .41, 'no teleport between aisles or loop boundary')
    if (p.resting && p.pot !== undefined) {
      visited.add(p.pot)
      const plant = plantPosition(p.pot)
      assert.equal(p.x, plant.x)
      assert.ok(p.y > plant.y && p.y - plant.y < 10)
    }
    prev = p
  }
  assert.equal(visited.size, 15)
  assert.notDeepEqual(residentPose(8, 0), residentPose(8, 1))
})
