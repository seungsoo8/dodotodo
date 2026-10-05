import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { FREEZE, PRACTICE } from '../freeze.ts';
import { changeMap, newGame } from '../game.ts';
import { hold, idle } from './helpers.ts';
import type { Game } from '../game.ts';

/** 새 탐험대로 마을에서 시작해 장난감 상자에 처음 들어간다 */
function firstVisit(): Game {
  const g = newGame(newSave(0, 'toby'), 1);
  changeMap(g, 'toybox');
  g.world.monsters = [];
  g.world.map = { ...g.world.map, spawns: [] };
  g.world.respawn = [];
  return g;
}

describe('첫 얼음 땡 연습', () => {
  test('처음 방에 들어가면 곧 연습 얼음 땡이 온다', () => {
    const g = firstVisit();
    assert.equal(g.world.freeze.practice, true);
    assert.ok(g.world.freeze.next <= PRACTICE.first);
    idle(g, PRACTICE.first + 0.1);
    assert.equal(g.world.freeze.phase, 'warn');
    assert.ok(g.world.freeze.t >= PRACTICE.warn - 0.2, '연습은 경고가 넉넉하다');
  });

  test('연습에서 들키면 아프지 않고, 곧 다시 해 본다', () => {
    const g = firstVisit();
    idle(g, PRACTICE.first + 0.1 + PRACTICE.warn);
    assert.equal(g.world.freeze.phase, 'freeze');
    const hp = g.save.hp;
    hold(g, { move: { x: 1, y: 0 } }, 0.2);
    assert.equal(g.save.hp, hp, 'HP 를 잃지 않는다');
    assert.ok(g.world.events.some((e) => e.kind === 'freezeRetry'));
    assert.equal(g.world.freeze.phase, 'none');
    assert.ok(g.world.freeze.next <= PRACTICE.retry);
    assert.equal(g.world.freeze.practice, true, '아직 연습 중');
    assert.equal(g.save.flags.freeze_learned, undefined);
  });

  test('끝까지 참으면 배운 것으로 치고, 그 뒤로는 보통 얼음 땡', () => {
    const g = firstVisit();
    idle(g, PRACTICE.first + 0.1 + PRACTICE.warn + FREEZE.freeze + 0.2);
    assert.equal(g.save.flags.freeze_learned, true);
    assert.equal(g.world.freeze.practice, false);
    assert.ok(g.world.freeze.next >= FREEZE.gap[0] - 1);
    assert.ok(g.world.events.some((e) => e.kind === 'freezeOk'));
  });

  test('배운 뒤에 방에 들어가면 연습 없이 보통 때 (처음 얼음까지 넉넉히)', () => {
    const s = newSave(0, 'toby');
    s.flags.freeze_learned = true;
    const g = newGame(s, 1);
    changeMap(g, 'toybox');
    assert.equal(g.world.freeze.practice, false);
    assert.equal(g.world.freeze.next, FREEZE.first);
  });

  test('마을에서는 연습도 없다', () => {
    const g = newGame(newSave(0, 'toby'), 1);
    assert.equal(g.world.freeze.practice, false);
  });
});
