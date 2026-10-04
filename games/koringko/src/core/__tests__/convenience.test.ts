import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { autoAttackTarget, nextHint, HINTS } from '../hints.ts';
import { placeAt, play } from './helpers.ts';


describe('처음 하는 사람을 위한 안내', () => {
  test('조건이 맞는 첫 안내를 고르고, 본 안내는 다시 고르지 않는다', () => {
    const seen = new Set<string>();
    const st = { map: 'village', nearNpc: false, nearMonster: false, lowHp: false, skillPts: 0, bagNew: false, elite: false, hazard: false, inRift: false };
    assert.equal(nextHint(st, seen), 'move');
    seen.add('move');
    assert.equal(nextHint({ ...st, nearNpc: true }, seen), 'talk');
    assert.equal(nextHint({ ...st, nearMonster: true }, seen), 'attack');
    assert.equal(nextHint({ ...st, hazard: true, nearMonster: true }, seen), 'dodge');
    assert.equal(nextHint({ ...st, lowHp: true }, seen), 'potion');
    assert.equal(nextHint({ ...st, skillPts: 1 }, seen), 'skill');
    for (const k of Object.keys(HINTS)) seen.add(k);
    assert.equal(nextHint({ ...st, lowHp: true }, seen), null);
  });

  test('모든 안내에 키보드 · 터치 문구가 있다', () => {
    for (const h of Object.values(HINTS)) assert.ok(h.key.length > 4 && h.touch.length > 4);
  });
});

describe('휴대폰 자동 공격', () => {
  test('움직이지 않을 때 사거리 안에 적이 있으면 공격한다', () => {
    const g = play('toby', 'forest');
    assert.equal(autoAttackTarget(g, false), false);
    placeAt(g, 'fluff', 40, 0, 1);
    assert.equal(autoAttackTarget(g, false), true);
    assert.equal(autoAttackTarget(g, true), false, '움직이는 중');
  });

  test('원거리 직업은 더 멀리서도 쏜다', () => {
    const g = play('ruru', 'forest');
    placeAt(g, 'fluff', 150, 0, 1);
    assert.equal(autoAttackTarget(g, false), true);
    const t = play('toby', 'forest');
    placeAt(t, 'fluff', 150, 0, 1);
    assert.equal(autoAttackTarget(t, false), false);
  });
});
