import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { quietGame } from '../../core/__tests__/helpers.ts';
import { offerRoute } from '../../core/route.ts';
import { activePick, choosePick, pickIndexForCard, pickIndexForKey } from '../picks.ts';

describe('고르는 창 (보상 카드 · 갈림길 · 안개 속 사건)', () => {
  test('아무것도 없으면 null, 있으면 그 종류', () => {
    const s = quietGame();
    assert.equal(activePick(s), null);
    s.choice = [{ kind: 'perk', id: 'gold_pouch' }];
    assert.equal(activePick(s), 'choice');
    s.choice = null;
    offerRoute(s);
    assert.equal(activePick(s), 'route');
    s.route = null;
    s.encounter = 'starshard';
    assert.equal(activePick(s), 'encounter');
  });

  test('보상 카드·갈림길은 카드 세 장이 그대로, 사건은 왼쪽·오른쪽 카드가 두 선택지 (가운데는 이야기)', () => {
    assert.deepEqual([0, 1, 2].map((i) => pickIndexForCard('choice', i)), [0, 1, 2]);
    assert.deepEqual([0, 1, 2].map((i) => pickIndexForCard('route', i)), [0, 1, 2]);
    assert.deepEqual([0, 1, 2].map((i) => pickIndexForCard('encounter', i)), [0, null, 1]);
  });

  test('숫자 키: 1 2 3 (사건은 1 2), 다른 키는 무시', () => {
    assert.equal(pickIndexForKey('route', '3'), 2);
    assert.equal(pickIndexForKey('choice', '1'), 0);
    assert.equal(pickIndexForKey('encounter', '2'), 1);
    assert.equal(pickIndexForKey('encounter', '3'), null);
    assert.equal(pickIndexForKey('route', 'q'), null);
  });

  test('고르면 종류에 맞는 것을 고른다', () => {
    const s = quietGame();
    s.encounter = 'starshard';
    const gold = s.gold;
    assert.equal(choosePick(s, 'encounter', 1), true);
    assert.ok(s.gold > gold);
    assert.equal(activePick(s), null);
    offerRoute(s);
    assert.equal(choosePick(s, 'route', 0), true);
    assert.equal(s.route, null);
    assert.equal(choosePick(s, 'route', 0), false, '이미 골랐다');
  });
});
