import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../data.ts';
import { applyItem, buyItem, canBuy, mergesOnBuy, sellPrice, sellWeapon, step } from '../game.ts';
import { effectiveWeapon, weaponCounts } from '../sets.ts';
import type { WeaponDef } from '../types.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

const sling = () => findItem('sling') as WeaponDef;
const give = (s: ReturnType<typeof quietGame>, id: string, n: number) => {
  for (let i = 0; i < n; i++) applyItem(s, findItem(id));
};

describe('무기 합성', () => {
  test('같은 무기 ★1 이 3개가 되면 ★2 한 개로 합쳐진다', () => {
    const s = quietGame();
    give(s, 'sling', 2);
    assert.equal(s.weapons.length, 2);
    give(s, 'sling', 1);
    assert.equal(s.weapons.length, 1);
    assert.equal(s.weapons[0].level, 2);
    assert.ok(s.events.some((ev) => ev.kind === 'merge' && ev.weaponId === 'sling' && ev.level === 2));
  });

  test('★2 가 3개가 되면 ★3 이 된다 (★1 9개)', () => {
    const s = quietGame();
    give(s, 'sling', 9);
    assert.deepEqual(
      s.weapons.map((w) => w.level),
      [3],
    );
  });

  test('★3 은 더 합쳐지지 않는다', () => {
    const s = quietGame();
    give(s, 'sling', 27);
    assert.deepEqual(
      s.weapons.map((w) => w.level),
      [3, 3, 3],
    );
  });

  test('다른 무기끼리는 합쳐지지 않는다', () => {
    const s = quietGame();
    give(s, 'sling', 2);
    give(s, 'twin_daggers', 1);
    assert.equal(s.weapons.length, 3);
  });
});

describe('레벨별 능력치', () => {
  test('★2 는 피해 ×3.5, ★3 은 ×12', () => {
    const s = quietGame();
    assert.equal(effectiveWeapon(s, sling(), weaponCounts(s), 1).damage, 20);
    assert.equal(effectiveWeapon(s, sling(), weaponCounts(s), 2).damage, 70);
    assert.equal(effectiveWeapon(s, sling(), weaponCounts(s), 3).damage, 240);
  });

  test('★2 는 공격 주기 ÷1.1, ★3 은 ÷1.25', () => {
    const s = quietGame();
    assert.ok(Math.abs(effectiveWeapon(s, sling(), weaponCounts(s), 2).cooldown - 1 / 1.1) < 1e-9);
    assert.ok(Math.abs(effectiveWeapon(s, sling(), weaponCounts(s), 3).cooldown - 1 / 1.25) < 1e-9);
  });

  test('실제 전투에서도 ★2 돌팔매는 한 번에 3.5배 × 세트 1단계(+20%) = 84', () => {
    const s = quietGame();
    give(s, 'sling', 3);
    const e = placeAt(s, 60, 0, dummyDef({ hp: 1000 }));
    step(s, 0.01);
    assert.ok(Math.abs(1000 - e.hp - 84) < 1e-9);
  });

  test('세트 개수는 ★2 를 3개, ★3 을 9개로 센다 (합쳐도 세트가 깨지지 않음)', () => {
    const s = quietGame();
    give(s, 'sling', 3);
    assert.equal(weaponCounts(s).normal, 3);
    give(s, 'sling', 6);
    assert.equal(weaponCounts(s).normal, 9);
  });
});

describe('무기 칸 (10칸)', () => {
  function fullGame() {
    const s = quietGame();
    s.gold = 1e6;
    // 서로 다른 무기로 10칸을 채운다
    for (const id of ['sling', 'twin_daggers', 'battle_axe', 'longbow', 'gale_bow', 'ballista', 'chain_bolt', 'storm_crystal', 'frost_orb', 'mortar']) {
      applyItem(s, findItem(id));
    }
    assert.equal(s.weapons.length, 10);
    return s;
  }

  test('칸이 꽉 차면 새 무기는 살 수 없고 골드도 그대로다', () => {
    const s = fullGame();
    s.shop[0] = findItem('catapult');
    assert.deepEqual(canBuy(s, 0), { ok: false, reason: 'slots' });
    const gold = s.gold;
    assert.equal(buyItem(s, 0), false);
    assert.equal(s.gold, gold);
    assert.equal(s.weapons.length, 10);
  });

  test('칸이 꽉 차도 강화는 살 수 있다', () => {
    const s = fullGame();
    s.shop[0] = findItem('wall');
    assert.deepEqual(canBuy(s, 0), { ok: true });
    assert.equal(buyItem(s, 0), true);
  });

  test('칸이 꽉 차도 사자마자 합쳐지는 무기(같은 ★1 두 개 보유)는 살 수 있다', () => {
    const s = fullGame();
    sellWeapon(s, s.weapons.findIndex((w) => w.def.id === 'mortar'));
    applyItem(s, findItem('sling'));
    assert.equal(s.weapons.length, 10);
    s.shop[0] = findItem('sling');
    assert.equal(mergesOnBuy(s, findItem('sling')), true);
    assert.equal(buyItem(s, 0), true);
    assert.equal(s.weapons.length, 9);
  });

  test('구매 가능 여부: 빈 칸 · 골드 부족을 구분해 알려준다', () => {
    const s = quietGame();
    s.shop[0] = null;
    assert.deepEqual(canBuy(s, 0), { ok: false, reason: 'empty' });
    s.gold = 10;
    s.shop[1] = findItem('sling');
    assert.deepEqual(canBuy(s, 1), { ok: false, reason: 'gold' });
  });
});

describe('판매', () => {
  test('판매하면 산 값의 50% (★2 는 3배, ★3 은 9배 기준)를 돌려받고 칸이 빈다', () => {
    const s = quietGame();
    give(s, 'sling', 3);
    const gold = s.gold;
    assert.equal(sellPrice(s.weapons[0]), 150);
    assert.equal(sellWeapon(s, 0), 150);
    assert.equal(s.gold, gold + 150);
    assert.equal(s.weapons.length, 0);
    assert.ok(s.events.some((ev) => ev.kind === 'sell'));
  });

  test('없는 칸을 팔면 아무 일도 없다', () => {
    const s = quietGame();
    assert.equal(sellWeapon(s, 3), 0);
    assert.equal(s.gold, 300);
  });
});
