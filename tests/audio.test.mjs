import { test } from 'node:test'
import assert from 'node:assert/strict'

test('audio unlock, independent buses, click throttling and background suspension', async () => {
  const realInterval = globalThis.setInterval, realClear = globalThis.clearInterval
  const intervals = new Set(), listeners = {}, oscillators = [], gains = []
  class Param {
    value = 0
    setValueAtTime(v) { this.value = v }
    linearRampToValueAtTime(v) { this.value = v }
    exponentialRampToValueAtTime(v) { assert.ok(v > 0); this.value = v }
    setTargetAtTime(v) { this.value = v }
  }
  class Node {
    gain = new Param(); frequency = new Param(); threshold = new Param(); ratio = new Param()
    connect() {} disconnect() { this.disconnected = true }
    start(at) { assert.ok(at >= 0) }
    stop(at) { assert.ok(at > 0); this.stopAt = at }
  }
  let ctx, contexts = 0
  globalThis.AudioContext = class {
    currentTime = 0; state = 'suspended'; destination = new Node()
    constructor() { ctx = this; contexts++ }
    createGain() { const n = new Node(); gains.push(n); return n }
    createOscillator() { const n = new Node(); oscillators.push(n); return n }
    createDynamicsCompressor() { return new Node() }
    async resume() { this.state = 'running' }
    async suspend() { this.state = 'suspended' }
  }
  globalThis.document = { hidden: false, addEventListener: (name, fn) => { listeners[name] = fn } }
  globalThis.setInterval = fn => { intervals.add(fn); return fn }
  globalThis.clearInterval = fn => intervals.delete(fn)
  try {
    const { configureAudio, unlockAudio, sound } = await import('../src/audio.ts')
    sound('coin'); assert.equal(oscillators.length, 0)
    configureAudio(true, .4, true, .25)
    unlockAudio(); await Promise.resolve()
    assert.equal(contexts, 1); assert.equal(intervals.size, 1)
    assert.equal(gains[0].gain.value, .25); assert.equal(gains[1].gain.value, .4)
    assert.ok(oscillators.length > 4, 'music schedules pad and melody after gesture')
    unlockAudio(); await Promise.resolve(); assert.equal(intervals.size, 1)
    const before = oscillators.length
    sound('water'); assert.equal(oscillators.length, before + 3)
    sound('water'); assert.equal(oscillators.length, before + 3)
    configureAudio(false, .4, true, .25)
    ctx.currentTime = 1; sound('coin'); assert.equal(oscillators.length, before + 3)
    assert.equal(gains[0].gain.value, .25); assert.equal(gains[1].gain.value, 0)
    configureAudio(true, .4, false, .25); assert.equal(gains[0].gain.value, 0)
    sound('coin'); assert.equal(oscillators.length, before + 9)
    for (const osc of oscillators) { assert.ok(osc.stopAt); osc.onended(); assert.ok(osc.disconnected) }
    document.hidden = true; listeners.visibilitychange(); assert.equal(ctx.state, 'suspended'); assert.equal(intervals.size, 0)
    document.hidden = false; listeners.visibilitychange(); await Promise.resolve()
    assert.equal(ctx.state, 'running'); assert.equal(intervals.size, 1)
  } finally {
    globalThis.setInterval = realInterval; globalThis.clearInterval = realClear
    delete globalThis.AudioContext; delete globalThis.document
  }
})
