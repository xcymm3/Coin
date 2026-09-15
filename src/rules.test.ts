import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  advance, beginGame, beginTutorial, CANNON_STAGES, canEnter, CREATURES, CREATURE_KINDS, defeat, fireInterval,
  initialState, inspectJournal, makeTestState, moveForward, ownedAbilities, power, productionRates, readSave, ROOMS,
  SAVE_VERSION, serializeSave, shoot, turn, upgradeCost, volley,
} from './rules.ts';
import type { CreatureId, GameState, TargetId, Upgrade } from './rules.ts';

const playing = () => beginGame({ ...beginTutorial(initialState()), tutorialStep: 3, journalRead: true });
function cleanse(state: GameState, id: CreatureId) {
  let s: GameState = { ...state, room: CREATURES.find(c => c.id === id)!.room };
  const target = `creature:${id}` as TargetId;
  for (let i = 0; i < CREATURE_KINDS[CREATURES.find(c => c.id === id)!.kind].threshold; i++) s = shoot(s, target);
  return s;
}

test('教程冻结生产与危险，真实机器命中和实际打开 B 后才解锁移动', () => {
  let s = beginTutorial(initialState()); assert.deepEqual(advance(s, 30), s); assert.deepEqual(moveForward(s), s);
  s = shoot(s, 'machine:tutorial'); s = shoot(s, 'machine:tutorial'); s = shoot(s, 'machine:tutorial');
  assert.equal(s.tutorialStep, 2); assert.deepEqual(beginGame(s), s); assert.deepEqual(moveForward(s), s);
  s = inspectJournal(s); assert.equal(s.tutorialStep, 3); s = beginGame(s); assert.equal(moveForward(s).room, 'narthex');
  assert.deepEqual(ownedAbilities(s).map(a => a.id), ['silver']);
});

test('13 节点拓扑执行离散转向、单格移动、墙体阻挡与终区门控', () => {
  assert.ok(ROOMS.length >= 12); let s = playing();
  assert.equal(moveForward(s).room, 'narthex'); s = turn(s, 'left'); assert.equal(s.facing, 'west'); assert.equal(moveForward(s).room, 'refuge', '西侧墙体阻挡');
  assert.equal(canEnter(s, 'moonBattery'), false); s = makeTestState('cannon'); assert.equal(canEnter({ ...s, resources: { silver: 0, water: 0, crosses: 0 }, visited: s.visited.filter(id => id !== 'moonBattery') }, 'moonBattery'), false, '占领但资源不足仍不能进入终区'); assert.equal(canEnter(s, 'moonBattery'), true);
});

test('三类怪物阈值、产物和效率不同，净化后原地驻留并自动生产', () => {
  assert.equal(new Set(Object.values(CREATURE_KINDS).map(k => k.threshold)).size, 3);
  assert.equal(new Set(Object.values(CREATURE_KINDS).map(k => k.resource)).size, 3);
  let s = playing(); for (const c of [CREATURES[0], CREATURES[1], CREATURES[3]]) s = cleanse(s, c.id);
  assert.equal(s.producers.length, 3); const rates = productionRates(s); assert.ok(rates.silver > 0 && rates.water > 0 && rates.crosses > 0);
  const after = advance({ ...s, room: 'refuge' }, 10); assert.ok(after.resources.silver > 0 && after.resources.water > 0 && after.resources.crosses > 0);
});

test('威力升级降低同类怪物所需命中数，齐射与射速也改变射击规则', () => {
  const base = playing(), strong = { ...base, upgrades: { volley: 2, power: 2, rate: 2 } };
  assert.ok(power(strong) > power(base)); assert.ok(volley(strong) > volley(base)); assert.ok(fireInterval(strong) < fireInterval(base));
  let weak: GameState = { ...base, room: 'narthex' }, powered: GameState = { ...strong, room: 'narthex' }, weakHits = 0, strongHits = 0;
  while (!weak.producers.includes('narthex-hollow')) { weak = shoot(weak, 'creature:narthex-hollow'); weakHits++ }
  while (!powered.producers.includes('narthex-hollow')) { powered = shoot(powered, 'creature:narthex-hollow'); strongHits++ }
  assert.ok(strongHits < weakHits); for (const u of ['volley', 'power', 'rate'] as Upgrade[]) assert.equal(upgradeCost(base, u), 8);
});

test('低帧率与细步进生产等价，暂停、B 菜单语义与异常大步长不产生离线收益', () => {
  let s: GameState = cleanse(playing(), 'narthex-hollow'); s = { ...s, room: 'refuge' };
  const coarse = advance(s, 30); let fine = s; for (let i = 0; i < 120; i++) fine = advance(fine, .25);
  assert.deepEqual(coarse.resources, fine.resources); assert.equal(coarse.effectiveSeconds, fine.effectiveSeconds);
  const paused = { ...coarse, status: 'paused' as const }; assert.deepEqual(advance(paused, 1000), paused);
  assert.equal(advance(s, 1000).effectiveSeconds - s.effectiveSeconds, 30, '单次异常大步长被截断');
});

test('击倒回到最近安全区，仅损失本次探索所得 20%，永久状态完全保留', () => {
  let s = makeTestState('cannon'); s = { ...s, room: 'ossuary', resources: { silver: 100, water: 50, crosses: 25 }, expeditionGains: { silver: 50, water: 20, crosses: 10 }, health: 1 };
  const n = defeat(s); assert.ok(n.sanctuaries.includes('choir')); assert.deepEqual(n.upgrades, s.upgrades); assert.deepEqual(n.producers, s.producers); assert.deepEqual(n.clearedRooms, s.clearedRooms);
  assert.deepEqual(n.resources, { silver: 90, water: 46, crosses: 23 }); assert.equal(n.health, 100); assert.ok(n.sanctuaries.includes(n.room));
});

test('版本化存档覆盖位置、资源、生产者、房间、升级、主线和有效时间并拒绝损坏旧档', () => {
  const s = { ...makeTestState('cannon'), facing: 'west' as const, effectiveSeconds: 3210, cannonStage: 2 };
  const restored = readSave(serializeSave(s)); assert.equal(restored?.status, 'paused'); assert.equal(restored?.room, s.room); assert.deepEqual(restored?.resources, s.resources); assert.deepEqual(restored?.producers, s.producers); assert.equal(restored?.cannonStage, 2);
  assert.equal(readSave('{broken'), null); assert.equal(readSave(JSON.stringify({ version: SAVE_VERSION - 1, state: s })), null); assert.equal(readSave(JSON.stringify({ version: SAVE_VERSION, state: { ...s, health: -1 } })), null);
  assert.equal(readSave(JSON.stringify({ version: SAVE_VERSION, state: { ...s, producers: ['不存在的生物'] } })), null);
});

test('确定性参考策略在 100–140 分钟依靠三类在线生产完成资源门槛与月亮战', () => {
  let s = playing(); for (const c of CREATURES) s = cleanse(s, c.id); s = { ...s, room: 'refuge' };
  const milestones: { minute: number; resources: GameState['resources'] }[] = [];
  while (s.effectiveSeconds < 6000) { s = advance(s, 30); if (s.effectiveSeconds % 1200 === 0) milestones.push({ minute: s.effectiveSeconds / 60, resources: { ...s.resources } }) }
  assert.ok(s.resources.silver >= 18000 && s.resources.water >= 1400 && s.resources.crosses >= 900, JSON.stringify(milestones));
  assert.ok(productionRates(s).silver > 0 && productionRates(s).water > 0 && productionRates(s).crosses > 0);
  s = { ...s, room: 'moonBattery' }; for (let i = 0; i < CANNON_STAGES.length; i++) s = shoot(s, 'machine:cannon'); assert.equal(s.cannonStage, 4);
  for (let i = 0; i < 3; i++) s = shoot(s, 'moon'); assert.equal(s.moonStage, 1); assert.equal(s.status, 'playing');
  for (let i = 0; i < 5; i++) s = shoot(s, 'moon'); assert.equal(s.status, 'won'); assert.ok(s.effectiveSeconds >= 6000 && s.effectiveSeconds <= 8400);
});
