import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, autoInterval, forgeCost, hit, initialState, registerShot, splitterCost } from './game.ts';

const playing = () => ({ ...initialState(), status: 'playing' as const });
test('100 秒自然耗尽，归零失败且无法通过迟到铜币复活', () => {
  let s = advance(playing(), 99.5); assert.equal(s.time, 0.5); assert.equal(s.status, 'playing');
  s = advance(s, 1); assert.equal(s.time, 0); assert.equal(s.elapsed, 100); assert.equal(s.status, 'failed');
  assert.deepEqual(hit(s, 'clock'), s);
});
test('开始前和暂停时不计时、不结算射击', () => {
  const s = initialState(); assert.deepEqual(advance(s, 50), s); assert.deepEqual(hit(s, 'splitter'), s);
  const paused = { ...playing(), status: 'paused' as const }; assert.deepEqual(advance(paused, 10), paused); assert.deepEqual(registerShot(paused, 2), paused);
});
test('分流器按 10、50、150 的固定顺序解锁双发、三发和自动化', () => {
  let s = playing();
  for (let i = 0; i < 9; i++) s = hit(s, 'splitter') as typeof s;
  assert.equal(s.volley, 1); assert.equal(s.splitter, 9);
  s = hit(s, 'splitter') as typeof s; assert.equal(s.volley, 2); assert.equal(s.stage, 1); assert.equal(splitterCost(s), 50);
  for (let i = 0; i < 50; i++) s = hit(s, 'splitter') as typeof s;
  assert.equal(s.volley, 3); assert.equal(s.stage, 2);
  for (let i = 0; i < 150; i++) s = hit(s, 'splitter') as typeof s;
  assert.equal(s.autoLevel, 1); assert.equal(autoInterval(s), 2); assert.equal(s.upgrades, 3);
});
test('初始熔炉需要 1000 次命中，升级效率翻倍但续命仍固定加 1', () => {
  let s = playing();
  for (let i = 0; i < 999; i++) s = hit(s, 'forge') as typeof s;
  assert.equal(s.level, 0); assert.equal(s.forge, 999);
  s = hit(s, 'forge') as typeof s; assert.equal(s.level, 1); assert.equal(s.forge, 0); assert.equal(forgeCost(s), 2000);
  s = hit(s, 'forge') as typeof s; assert.equal(s.forge, 2);
  s = hit(s, 'clock') as typeof s; assert.equal(s.time, 101); assert.equal(s.saved, 1);
});
test('双枚铜币独立结算，未命中只消耗发射次数', () => {
  let s = playing(); s = registerShot(s, 2) as typeof s;
  s = hit(hit(s, 'clock'), 'clock') as typeof s;
  assert.equal(s.time, 102); assert.equal(s.hits, 2); assert.equal(s.shots, 2);
  assert.deepEqual(hit(s, null), s);
});
