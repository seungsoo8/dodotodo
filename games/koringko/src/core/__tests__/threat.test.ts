import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { hitMonster } from '../combat.ts';
import { ELITE_AFFIX, rollEliteAffixes } from '../elite.ts';
import { refillSpawns, spawnMonster } from '../world.ts';
import { fixedRng, hold, idle, placeAt, play } from './helpers.ts';

describe('일반 몬스터의 공격 예고', () => {
  test('근접 몬스터는 휘두르기 전에 앞에 장판을 예고하고, 그 안에 있으면 맞는다', () => {
    const g = play('toby', 'toybox');
    placeAt(g, 'mushroom', 24, 0, 2);
    idle(g, 0.1);
    const h = g.world.hazards.find((x) => x.from === 'monster' && x.kind === 'claw');
    assert.ok(h, '예고 장판');
    assert.ok(h.delay > 0.2);
    const hp = g.save.hp;
    idle(g, 0.6);
    assert.ok(g.save.hp < hp);
  });

  test('근접 몬스터의 예고 장판에서 벗어나면 맞지 않는다', () => {
    const g = play('toby', 'toybox');
    placeAt(g, 'mushroom', 24, 0, 2);
    idle(g, 0.1);
    const hp = g.save.hp;
    hold(g, { move: { x: -1, y: 0 } }, 0.5);
    assert.equal(g.save.hp, hp);
  });

  test('돌진 몬스터는 힘을 모을 때 돌진할 길을 선으로 보여 준다', () => {
    const g = play('toby', 'toybox');
    placeAt(g, 'wolf', 90, 0, 4);
    idle(g, 0.1);
    const h = g.world.hazards.find((x) => x.kind === 'dashLine');
    assert.ok(h && h.shape.type === 'line');
    assert.ok(h.shape.x2 < h.shape.x1, '주인공 쪽(왼쪽)으로');
  });

  test('원거리 몬스터는 쏘기 전에 조준선을 보여 준다', () => {
    const g = play('toby', 'drawer');
    const m = placeAt(g, 'gum', 120, 0, 9);
    m.ai.state = 'chase';
    m.ai.timer = 0;
    idle(g, 0.05);
    assert.ok(g.world.hazards.some((x) => x.kind === 'aim' && x.shape.type === 'line'));
  });
});

describe('무리', () => {
  test('한 마리가 주인공을 알아채면 가까운 같은 무리도 함께 덤빈다', () => {
    const g = play('toby', 'toybox');
    const a = spawnMonster(g.world, 'fluff', g.world.player.x + 60, g.world.player.y, 1, 'normal', 0);
    const b = spawnMonster(g.world, 'fluff', g.world.player.x + 140, g.world.player.y, 1, 'normal', 0);
    a.spawnLeft = b.spawnLeft = 0;
    a.ai.state = b.ai.state = 'idle';
    idle(g, 0.05);
    assert.equal(a.ai.state !== 'idle', true);
    assert.equal(b.ai.state !== 'idle', true, '멀리 있던 동료도');
  });

  test('다시 나올 때는 두세 마리씩 함께 나온다', () => {
    const g = play('toby', 'toybox');
    const map = { ...g.world.map, spawns: [{ x: 20, y: 6, r: 2, pool: ['fluff'], max: 6, lv: [1, 1] as [number, number] }] };
    g.world.map = map;
    g.world.respawn = [0];
    g.world.filled = true;
    g.world.player.x = 0;
    g.world.player.y = 0;
    refillSpawns(g.world, fixedRng(0.5), 0.1);
    assert.equal(g.world.monsters.length >= 2, true);
  });
});

describe('정예 성질', () => {
  test('성질을 고르면 서로 다른 것으로, 요청한 개수만큼', () => {
    const a = rollEliteAffixes(fixedRng(0.3), 2);
    assert.equal(a.length, 2);
    assert.notEqual(a[0], a[1]);
    for (const id of a) assert.ok(ELITE_AFFIX[id]);
  });

  test('재빠른 정예는 더 빠르고, 이름에 성질이 붙는다', () => {
    const g = play('toby', 'toybox');
    const n = spawnMonster(g.world, 'wolf', 0, 0, 4, 'normal');
    const e = spawnMonster(g.world, 'wolf', 0, 0, 4, 'elite', -1, ['fast']);
    assert.ok(e.speed > n.speed * 1.3);
    assert.ok(e.name.includes(ELITE_AFFIX.fast.name));
  });

  test('단단한 정예는 받는 피해가 줄어든다', () => {
    const g = play('toby', 'toybox');
    const a = placeAt(g, 'wolf', 200, 0, 4);
    const b = spawnMonster(g.world, 'wolf', g.world.player.x + 200, g.world.player.y, 4, 'elite', -1, ['armored']);
    b.spawnLeft = 0;
    const da = hitMonster(g, a, 1);
    const db = hitMonster(g, b, 1);
    assert.ok(db < da * 0.75);
  });

  test('흡혈 정예는 주인공을 때리면 체력을 회복한다', () => {
    const g = play('toby', 'toybox');
    const e = spawnMonster(g.world, 'fluff', g.world.player.x + 10, g.world.player.y, 1, 'elite', -1, ['vampire']);
    e.spawnLeft = 0;
    e.hp = e.maxHp / 2;
    const before = e.hp;
    idle(g, 0.2);
    assert.ok(e.hp > before);
  });

  test('불꽃 정예는 지나간 자리에 불 장판을 남긴다', () => {
    const g = play('toby', 'toybox');
    const e = spawnMonster(g.world, 'wolf', g.world.player.x + 150, g.world.player.y, 4, 'elite', -1, ['fire']);
    e.spawnLeft = 0;
    idle(g, 1.5);
    assert.ok(g.world.hazards.some((h) => h.kind === 'fireTrail' && h.from === 'monster'));
  });

  test('서리 정예는 쓰러질 때 얼음 폭발을 예고한다', () => {
    const g = play('toby', 'toybox');
    const e = spawnMonster(g.world, 'wolf', g.world.player.x + 150, g.world.player.y, 4, 'elite', -1, ['frost']);
    e.spawnLeft = 0;
    e.hp = 0;
    idle(g, 0.05);
    assert.ok(g.world.hazards.some((h) => h.kind === 'frostNova' && h.delay > 0));
  });

  test('순간이동 정예는 멀리 있으면 주인공 가까이로 건너온다', () => {
    const g = play('toby', 'toybox');
    const e = spawnMonster(g.world, 'mushroom', g.world.player.x + 70, g.world.player.y, 2, 'elite', -1, ['blink']);
    e.spawnLeft = 0;
    e.speed = 0;
    e.ai.state = 'chase';
    idle(g, 4.5);
    assert.ok(Math.hypot(e.x - g.world.player.x, e.y - g.world.player.y) < 60);
  });
});
