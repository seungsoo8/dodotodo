import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FREEZE, FREEZE_KIND, freezeKind } from '../freeze.ts';
import { buildMap, isSolid } from '../maps.ts';
import type { Game } from '../game.ts';
import type { MapDef } from '../maps.ts';
import { hold, idle, play } from './helpers.ts';

/** 장난감 상자 한가운데에서 kind 얼음 땡을 시작해 경고가 끝날 때까지 */
function start(kind: MapDef['freeze'], stay = true): Game {
  const g = play('toby', 'toybox');
  g.world.map = { ...g.world.map, freeze: kind };
  g.world.player.x = 36 * 24 + 12;
  g.world.player.y = 20 * 24;
  g.world.freeze.next = 0.01;
  idle(g, 0.05);
  assert.equal(g.world.freeze.phase, 'warn');
  assert.equal(g.world.freeze.kind, kind ?? 'still');
  if (stay) idle(g, FREEZE_KIND[kind ?? 'still'].warn);
  return g;
}

const caught = (g: Game) => g.world.events.some((e) => e.kind === 'caught');
const ok = (g: Game) => g.world.events.some((e) => e.kind === 'freezeOk');

describe('방마다 다른 얼음 땡', () => {
  test('방마다 얼음 땡 종류가 정해져 있다', () => {
    assert.equal(freezeKind(buildMap('toybox')), 'still');
    assert.equal(freezeKind(buildMap('drawer')), 'hands');
    assert.equal(freezeKind(buildMap('desk')), 'alarm');
    assert.equal(freezeKind(buildMap('underbed')), 'light');
    assert.equal(freezeKind(buildMap('attic')), 'king');
  });

  test('책상 알람: 따르릉 동안은 계속 움직여야 한다 (멈추면 들킨다)', () => {
    const a = start('alarm');
    assert.equal(a.world.freeze.phase, 'freeze');
    idle(a, 1);
    assert.ok(caught(a), '멈춰 있으면 들킨다');
    const b = start('alarm');
    for (let i = 0; i < 8; i++) hold(b, { move: { x: i % 2 ? 1 : -1, y: 0 } }, FREEZE_KIND.alarm.freeze / 8);
    idle(b, 0.2);
    assert.ok(!caught(b) && ok(b), '계속 움직이면 무사하다');
  });

  test('침대 밑 손전등: 불빛이 지나가는데, 빛에 닿으면 들키고 피하면 무사하다 (움직여도 된다)', () => {
    const a = start('light');
    idle(a, FREEZE_KIND.light.freeze + 0.1);
    assert.ok(caught(a), '가만히 있으면 불빛이 지나가며 들킨다');
    const b = start('light');
    hold(b, { move: { x: 0, y: -1 } }, FREEZE_KIND.light.freeze + 0.1);
    assert.ok(!caught(b) && ok(b), '불빛 길을 벗어나면 무사');
  });

  test('과자 서랍 손: 경고 동안 손 그림자가 내려오고, 얼음 때 그 안에 있으면 들킨다', () => {
    const a = start('hands');
    const zones = a.world.freeze.zones;
    assert.ok(zones.length >= 2);
    const p = a.world.player;
    assert.ok(zones.some((z) => Math.hypot(z.x - p.x, z.y - p.y) < z.r), '하나는 주인공 자리에');
    idle(a, 0.2);
    assert.ok(caught(a));
    // 경고 동안 손 밖으로 나가 있으면, 얼음 때 걸어 다녀도 괜찮다
    const b = start('hands', false);
    const pb = b.world.player;
    const free = [-6, -4, 4, 6].flatMap((k) => [{ x: pb.x + k * 24, y: pb.y }, { x: pb.x, y: pb.y + k * 24 }]).find((q) => b.world.freeze.zones.every((z) => Math.hypot(z.x - q.x, z.y - q.y) > z.r + 20) && !isSolid(b.world.map, Math.floor(q.x / 24), Math.floor(q.y / 24)))!;
    assert.ok(free);
    pb.x = free.x;
    pb.y = free.y;
    idle(b, FREEZE_KIND.hands.warn);
    assert.equal(b.world.freeze.phase, 'freeze');
    hold(b, { move: { x: 0.2, y: 0 } }, 0.3);
    idle(b, FREEZE_KIND.hands.freeze);
    assert.ok(!caught(b) && ok(b));
  });

  test('다락방: 먼지 왕 목소리는 경고가 짧고 얼음이 길며, 들키면 더 아프다', () => {
    assert.ok(FREEZE_KIND.king.warn < FREEZE.warn);
    assert.ok(FREEZE_KIND.king.freeze > FREEZE.freeze);
    assert.ok(FREEZE_KIND.king.hpLoss > FREEZE.hpLoss);
    const g = start('king');
    assert.equal(g.world.freeze.phase, 'freeze');
    const hp = g.save.hp;
    hold(g, { move: { x: 1, y: 0 } }, 0.1);
    assert.ok(hp - g.save.hp >= g.stats.maxHp * FREEZE_KIND.king.hpLoss * 0.95);
  });

  test('얼음 이벤트에 종류가 실린다 (화면 안내용)', () => {
    const g = start('alarm');
    assert.ok(g.world.events.some((e) => e.kind === 'freezeWarn' && e.type === 'alarm'));
    assert.ok(g.world.events.some((e) => e.kind === 'freeze' && e.type === 'alarm'));
  });
});
