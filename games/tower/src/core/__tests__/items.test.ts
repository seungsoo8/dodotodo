import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { SHOP_POOL, UPGRADES, WEAPONS, findItem } from '../data.ts';
import { applyItem, step } from '../game.ts';
import type { WeaponType } from '../types.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

describe('상점 목록', () => {
  test('무기는 계열마다 3종씩 15종이다', () => {
    assert.equal(WEAPONS.length, 15);
    const types: WeaponType[] = ['normal', 'pierce', 'magic', 'siege', 'chaos'];
    for (const t of types) assert.equal(WEAPONS.filter((w) => w.type === t).length, 3, `${t} 계열 수`);
  });

  test('강화는 9종이다', () => {
    assert.equal(UPGRADES.length, 9);
  });

  test('모든 아이템 id 가 겹치지 않고, 가격·피해·주기·사거리는 양수다', () => {
    const ids = SHOP_POOL.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const i of SHOP_POOL) {
      assert.ok(i.price > 0, `${i.id} 가격`);
      if (i.kind === 'weapon') assert.ok(i.damage > 0 && i.cooldown > 0 && i.range > 0, `${i.id} 수치`);
    }
  });
});

describe('새 강화', () => {
  test('신속의 룬: 공격 속도 +25% → 돌팔매 주기 1초가 0.8초가 된다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('swift_rune'));
    const e = placeAt(s, 60, 0);
    step(s, 0.01);
    assert.equal(e.hp, 80);
    step(s, 0.78);
    assert.equal(e.hp, 80, '0.78초 뒤에는 아직');
    step(s, 0.03);
    assert.equal(e.hp, 60, '0.8초가 지나면 다시 쏜다');
  });

  test('예리한 칼날: 치명타 확률 +10%', () => {
    const s = quietGame();
    applyItem(s, findItem('keen_edge'));
    assert.ok(Math.abs(s.tower.critChance - 0.1) < 1e-9);
  });

  test('치명타 확률이 100% 면 항상 2배 피해, 0% 면 치명타가 없다', () => {
    const always = quietGame();
    applyItem(always, findItem('sling'));
    always.tower.critChance = 1;
    const a = placeAt(always, 60, 0);
    step(always, 0.01);
    assert.equal(a.hp, 60);
    assert.ok(always.events.some((ev) => ev.kind === 'hit' && ev.crit));

    const never = quietGame();
    applyItem(never, findItem('sling'));
    const b = placeAt(never, 60, 0);
    step(never, 0.01);
    assert.equal(b.hp, 80);
    assert.ok(never.events.every((ev) => ev.kind !== 'hit' || !ev.crit));
  });

  test('치명타 확률 50% 면 여러 번 쏠 때 치명타와 일반타가 섞인다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    s.tower.critChance = 0.5;
    const e = placeAt(s, 60, 0, dummyDef({ hp: 1e9 }));
    const hits = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const before = e.hp;
      step(s, 1);
      hits.add(before - e.hp);
    }
    assert.deepEqual([...hits].sort((x, y) => x - y), [20, 40]);
  });

  test('가시 갑옷: 탑을 때린 적은 가시 피해 15 를 돌려받는다', () => {
    const s = quietGame();
    applyItem(s, findItem('thorn_mail'));
    const e = placeAt(s, 21, 0, dummyDef({ atk: 10 }));
    step(s, 0.01);
    assert.equal(s.tower.hp, 990);
    assert.equal(e.hp, 85);
  });

  test('가시로 적을 죽이면 현상금을 받는다', () => {
    const s = quietGame();
    applyItem(s, findItem('thorn_mail'));
    const e = placeAt(s, 21, 0, dummyDef({ atk: 1, hp: 10, bounty: 7 }));
    step(s, 0.01);
    assert.equal(s.enemies.includes(e), false);
    assert.equal(s.gold, 300 + 7);
  });

  test('망원경: 모든 무기 사거리 +15 (돌팔매 120 → 135)', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('spyglass'));
    const e = placeAt(s, 140, 0); // 가장자리까지 135
    step(s, 0.01);
    assert.equal(e.hp, 80);
  });
});

describe('새 무기', () => {
  test('폭풍 수정: 6번 튀는 연쇄 번개', () => {
    const s = quietGame();
    applyItem(s, findItem('storm_crystal'));
    const es = [1, 2, 3, 4, 5, 6, 7].map((i) => placeAt(s, i * 22, 0));
    step(s, 0.01);
    const hit = es.filter((e) => e.hp < 100).length;
    assert.equal(hit, 6);
  });

  test('투석기: 긴 사거리 광역', () => {
    const s = quietGame();
    applyItem(s, findItem('catapult'));
    const target = placeAt(s, 230, 0);
    const near = placeAt(s, 230, 50);
    step(s, 0.01);
    assert.ok(target.hp < 100);
    assert.ok(near.hp < 100);
  });
});

describe('피해 통계와 피격 정보', () => {
  test('무기별로 실제로 준 피해를 모은다 (넘친 피해는 세지 않는다)', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    placeAt(s, 60, 0, dummyDef({ hp: 10 }));
    step(s, 0.01);
    assert.equal(s.damageByWeapon.sling, 10);
    placeAt(s, 60, 0, dummyDef({ hp: 100 }));
    step(s, 1);
    assert.equal(s.damageByWeapon.sling, 30);
  });

  test('가시 피해는 thorns 로 모은다', () => {
    const s = quietGame();
    applyItem(s, findItem('thorn_mail'));
    placeAt(s, 21, 0, dummyDef({ atk: 5 }));
    step(s, 0.01);
    assert.equal(s.damageByWeapon.thorns, 15);
  });

  test('피격 이벤트에는 맞은 적의 id 가 들어 있다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0);
    step(s, 0.01);
    assert.ok(s.events.some((ev) => ev.kind === 'hit' && ev.enemyId === e.id));
  });
});
