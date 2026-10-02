import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { quietGame } from '../../core/__tests__/helpers.ts';
import { findItem } from '../../core/data.ts';
import { applyItem } from '../../core/game.ts';
import { offerRoute } from '../../core/route.ts';
import { slotRect } from '../faceslots.ts';
import { activePick, choosePick, forgeIndexAt, forgeKeyIndex, pickIndexForCard, pickIndexForKey } from '../picks.ts';

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

describe('모루: 탑 둘레 무기 칸을 눌러 고르기', () => {
  function forgeGame() {
    const s = quietGame();
    s.face = 'e';
    applyItem(s, findItem('sling'));
    s.face = 'w';
    applyItem(s, findItem('longbow'));
    s.forging = true;
    return s;
  }
  const center = (s: ReturnType<typeof quietGame>, f: 'e' | 'w', k: number) => {
    const r = slotRect(s.tower, f, k, s.config.tower.faceSlots);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  };

  test('모루를 고르는 중이면 그 창이 떠 있다 (카드·숫자 키로는 못 고른다)', () => {
    const s = forgeGame();
    assert.equal(activePick(s), 'forge');
    assert.equal(pickIndexForCard('forge', 0), null);
    assert.equal(pickIndexForKey('forge', '1'), null);
  });

  test('무기가 있는 칸을 누르면 그 무기, 빈 칸·칸 밖은 null', () => {
    const s = forgeGame();
    const east = forgeIndexAt(s, center(s, 'e', 0));
    assert.equal(s.weapons[east!].def.id, 'sling');
    const west = forgeIndexAt(s, center(s, 'w', 0));
    assert.equal(s.weapons[west!].def.id, 'longbow');
    assert.equal(forgeIndexAt(s, center(s, 'e', 1)), null, '빈 칸');
    assert.equal(forgeIndexAt(s, { x: 5, y: 5 }), null, '칸 밖');
  });

  test('최대 ★ 무기 칸은 고를 수 없다', () => {
    const s = forgeGame();
    s.weapons.find((w) => w.def.id === 'sling')!.level = s.config.merge.maxLevel;
    assert.equal(forgeIndexAt(s, center(s, 'e', 0)), null);
  });

  test('Enter 는 추천 무기 (가장 많이 싸운 무기)', () => {
    const s = forgeGame();
    s.damageByWeapon = { longbow: 100, sling: 5 };
    assert.equal(s.weapons[forgeKeyIndex(s, 'Enter')!].def.id, 'longbow');
    assert.equal(forgeKeyIndex(s, 'q'), null);
  });

  test('고르면 그 무기가 ★2 가 되고 창이 닫힌다', () => {
    const s = forgeGame();
    const i = forgeIndexAt(s, center(s, 'e', 0))!;
    assert.equal(choosePick(s, 'forge', i), true);
    assert.equal(s.weapons.find((w) => w.def.id === 'sling')!.level, 2);
    assert.equal(activePick(s), null);
  });
});
