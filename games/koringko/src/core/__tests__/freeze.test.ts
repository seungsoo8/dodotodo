import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FREEZE } from '../freeze.ts';
import { accept, progress } from '../quests.ts';
import { structureSpot } from '../rescue.ts';
import { freeze as stun, hold, idle, placeAt, play } from './helpers.ts';
import type { Game } from '../game.ts';

/** 얼음 직전까지 */
function toFreeze(g: Game): void {
  g.world.freeze.next = 0.01;
  idle(g, 0.05);
  assert.equal(g.world.freeze.phase, 'warn');
  idle(g, FREEZE.warn);
  assert.equal(g.world.freeze.phase, 'freeze');
}

describe('얼음 땡', () => {
  test('방에서는 때가 되면 발소리 경고 → 얼음. 얼음 동안 몬스터도 멈춘다', () => {
    const g = play('toby', 'toybox');
    const m = placeAt(g, 'wolf', 100, 0, 4);
    toFreeze(g);
    assert.ok(g.world.events.some((e) => e.kind === 'freezeWarn'));
    assert.ok(g.world.events.some((e) => e.kind === 'freeze'));
    const x = m.x;
    idle(g, 1);
    assert.equal(m.x, x);
  });

  test('끝까지 참으면 HP 를 조금 회복하고, 얼음이 풀린다', () => {
    const g = play('toby', 'toybox');
    g.save.hp = 50;
    toFreeze(g);
    idle(g, FREEZE.freeze + 0.1);
    assert.ok(g.world.events.some((e) => e.kind === 'freezeOk'));
    assert.ok(g.save.hp > 50);
    assert.equal(g.world.freeze.phase, 'none');
    assert.ok(g.world.freeze.next >= FREEZE.gap[0]);
  });

  test('얼음 동안 움직이면 들킨다: HP 를 잃고 몬스터가 화가 나 빨라진다 (한 번만)', () => {
    const g = play('toby', 'toybox');
    const m = stun(placeAt(g, 'wolf', 200, 0, 4));
    g.save.hp = g.stats.maxHp;
    toFreeze(g);
    hold(g, { move: { x: 1, y: 0 } }, 0.5);
    const caught = g.world.events.filter((e) => e.kind === 'caught');
    assert.equal(caught.length, 1);
    assert.ok(g.save.hp <= g.stats.maxHp * (1 - FREEZE.hpLoss) + 1);
    assert.ok(m.rage > 0);
  });

  test('얼음을 참는 동안 태엽이 저절로 빠르게 감긴다 (들키면 멈춘다)', () => {
    const g = play('toby', 'toybox');
    g.save.sp = 0;
    g.stats.spRegen = 0;
    toFreeze(g);
    idle(g, 1);
    assert.ok(g.save.sp >= FREEZE.windRate * 0.9, `${g.save.sp}`);
    const b = play('toby', 'toybox');
    b.save.sp = 0;
    b.stats.spRegen = 0;
    toFreeze(b);
    hold(b, { move: { x: 1, y: 0 } }, 0.1);
    const after = b.save.sp;
    idle(b, 1);
    assert.ok(b.save.sp - after < 1, '들킨 뒤에는 감기지 않는다');
  });

  test('마을과 보스전에서는 얼음 땡이 없다', () => {
    const v = play('toby', 'village');
    v.world.freeze.next = 0.01;
    idle(v, 0.2);
    assert.equal(v.world.freeze.phase, 'none');
    const g = play('toby', 'toybox');
    g.world.boss = 'spawned';
    g.world.freeze.next = 0.01;
    idle(g, 0.2);
    assert.equal(g.world.freeze.phase, 'none');
  });

  test('먼지 고치 구출 중에도 얼음 땡이 없고, 끝나면 다시 온다', () => {
    const g = play('toby', 'toybox');
    const s = g.world.map.structures.find((x) => x.kind === 'cocoon')!;
    const at = structureSpot(s);
    g.world.player.x = at.x;
    g.world.player.y = at.y;
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.ok(g.world.rescue);
    g.world.freeze.next = 0.01;
    idle(g, 0.2);
    assert.equal(g.world.freeze.phase, 'none');
    g.world.rescue = null;
    g.world.monsters = [];
    idle(g, 0.2);
    assert.equal(g.world.freeze.phase, 'warn');
  });

  test('얼음을 끝까지 참으면 얼음 땡 퀘스트가 오른다 (들키면 오르지 않는다)', () => {
    const g = play('toby', 'toybox');
    g.save.quests.q_fluff = { state: 'done', n: 6 };
    accept(g.save, 'q_freeze');
    toFreeze(g);
    idle(g, FREEZE.freeze + 0.1);
    assert.equal(progress(g.save, 'q_freeze').n, 1);
    assert.ok(g.world.events.some((e) => e.kind === 'quest' && e.id === 'q_freeze'));
    toFreeze(g);
    hold(g, { move: { x: 1, y: 0 } }, 0.2);
    idle(g, FREEZE.freeze);
    assert.equal(progress(g.save, 'q_freeze').n, 1);
  });
});
