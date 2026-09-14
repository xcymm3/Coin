import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, autoRate, beginNight, beginTutorial, capacity, chapter, clockGain, cost, DAWN_TIME, drain, hit, initialState, netDrain, readSave, registerShot, unlocked, volley } from './rules.ts';
import type { GameState, Target } from './rules.ts';

test('系统引导冻结倒计时，并通过真实献祭依次解锁引导', () => {
  let s = beginTutorial(initialState());
  assert.deepEqual(advance(s, 500), s);
  for (let i = 0; i < 10; i++) s = hit(s, 'splitter');
  assert.equal(volley(s), 2); assert.equal(s.guide, 2);
  for (let i = 0; i < 3; i++) s = hit(s, 'clock');
  assert.equal(s.guide, 3); assert.equal(s.time, 103); assert.equal(s.elapsed, 0);
  s = advance(beginNight(s), 1); assert.ok(s.time < 103); assert.equal(s.guide, 4);
});
test('锁定祭器不能充能，到达章节后才显现', () => {
  let s = beginNight(initialState()); assert.deepEqual(hit(s, 'choir'), s);
  s = { ...s, elapsed: 90 }; assert.ok(unlocked(s, 'choir')); assert.equal(chapter(s), 1);
  assert.equal(hit(s, 'choir').progress.choir, 1); assert.equal(unlocked(s, 'ward'), false);
});
test('侵袭与升级都会提升难度，祷告缓解侵蚀且庇护有上限', () => {
  const s = beginNight(initialState());
  assert.ok(drain({ ...s, elapsed: 95 }) > drain(s));
  assert.ok(drain({ ...s, upgrades: 5 }) > drain(s));
  const ward = { ...s, levels: { ...s.levels, ward: 2 } }; assert.ok(netDrain(ward) < netDrain(s));
  assert.equal(clockGain(ward), 1.6);
  assert.equal(hit({ ...ward, time: capacity(ward) }, 'clock').time, capacity(ward));
});
test('低帧率与小步长得到一致倒计时，失败不能被迟到铜币复活', () => {
  const s = { ...beginNight(initialState()), elapsed: 85, time: 100 };
  let fine = s; for (let i = 0; i < 200; i++) fine = advance(fine, 0.1);
  const coarse = advance(s, 20); assert.ok(Math.abs(coarse.time - fine.time) < 0.0001);
  const failed = advance(s, 100); assert.equal(failed.status, 'failed'); assert.deepEqual(hit(failed, 'clock'), failed);
});
test('灵仆按所选目标独立献祭，暂停停止，圆满祭器转向丧钟', () => {
  let s = { ...beginNight(initialState()), elapsed: 90, levels: { ...initialState().levels, choir: 1, splitter: 1 }, autoTarget: 'forge' as Target };
  s = advance(s, 1); assert.equal(s.progress.forge, 2); assert.equal(s.shots, 2); assert.ok(autoRate(s) > 0);
  const paused = { ...s, status: 'paused' as const }; assert.deepEqual(advance(paused, 20), paused);
  const maxed = { ...s, levels: { ...s.levels, forge: 5 }, autoCharge: 0 }; const next = advance(maxed, 1); assert.ok(next.saved > maxed.saved);
});
test('黎明必须同时满足十二分钟和圣龛充能', () => {
  let s = { ...beginNight(initialState()), elapsed: 719, time: 100, levels: { ...initialState().levels, seal: 1 } };
  assert.equal(advance(s, 0.5).status, 'playing'); assert.equal(advance(s, 1).status, 'won');
  s = { ...s, levels: { ...s.levels, seal: 0 } }; assert.equal(advance(s, 2).status, 'playing');
  const late = { ...s, elapsed: 730, progress: { ...s.progress, seal: 17999 } }; assert.equal(hit(late, 'seal').status, 'won');
});
test('存档恢复校验版本、数值与升级范围', () => {
  const s = beginNight(initialState());
  assert.equal(readSave(JSON.stringify({ version: 2, state: s }))?.status, 'paused');
  assert.equal(readSave('{broken'), null); assert.equal(readSave(JSON.stringify({ version: 1, state: s })), null);
  assert.equal(readSave(JSON.stringify({ version: 2, state: { ...s, time: -5 } })), null);
});

export function simulate(clicksPerSecond = 2) {
  let s = beginNight(initialState()); const milestones: { at: number; levels: GameState['levels']; time: number }[] = [];
  for (let step = 0; step < 2000 && s.status === 'playing'; step++) {
    let target: Target = 'forge';
    const priorities: [Target, number][] = [['splitter', 2], ['choir', 1], ['ward', 2], ['splitter', 3], ['forge', 2], ['lens', 2], ['choir', 3], ['forge', 3], ['ward', 3], ['seal', 1], ['choir', 4], ['forge', 5]];
    target = priorities.find(([t, lv]) => t !== 'clock' && unlocked(s, t) && s.levels[t] < lv)?.[0] || 'clock';
    if (s.time < Math.max(45, netDrain(s) * 22)) target = 'clock';
    s = { ...s, autoTarget: s.time < 65 ? 'clock' : target };
    const count = volley(s); s = registerShot(s, count);
    for (let i = 0; i < count; i++) s = hit(s, target);
    s = advance(s, 1 / clicksPerSecond);
    if (step % (60 * clicksPerSecond) === 0) milestones.push({ at: Math.floor(s.elapsed), levels: { ...s.levels }, time: Math.round(s.time) });
  }
  return { s, milestones };
}
test('每秒两次点击的可执行策略能完成十二分钟主线', () => {
  const { s, milestones } = simulate(2);
  assert.equal(s.status, 'won', JSON.stringify({ status: s.status, at: s.elapsed, levels: s.levels, milestones }));
  assert.ok(s.elapsed >= DAWN_TIME); assert.ok(s.elapsed <= 900);
  assert.ok(s.levels.choir > 0 && s.levels.ward > 0 && s.levels.lens > 0 && s.levels.seal > 0);
  assert.equal(cost(s, 'seal'), 0);
});
