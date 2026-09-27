import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem, WEAPONS } from '../data.ts';
import { applyItem, selectFace, step, type GameState } from '../game.ts';
import { effectiveWeapon, setTier, weaponCounts } from '../sets.ts';
import type { WeaponDef } from '../types.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

function weapon(id: string): WeaponDef {
  const item = findItem(id);
  assert.equal(item.kind, 'weapon');
  return item as WeaponDef;
}

/** 지금 고른 면에 무기를 단다 */
function give(s: GameState, id: string, n: number): void {
  for (let i = 0; i < n; i++) applyItem(s, findItem(id));
}

/** 같은 계열의 서로 다른 무기 (합쳐지지 않게) */
const KIN: Record<string, string[]> = {
  normal: ['sling', 'twin_daggers', 'battle_axe'],
  pierce: ['longbow', 'gale_bow', 'ballista'],
  magic: ['chain_bolt', 'storm_crystal', 'frost_orb'],
  siege: ['mortar', 'catapult', 'fire_pot'],
  chaos: ['chaos_orb', 'chaos_eye', 'void_ray'],
};
function giveKin(s: GameState, type: string, n: number): void {
  for (const id of KIN[type].slice(0, n)) applyItem(s, findItem(id));
}

describe('면 세트 단계', () => {
  test('한 면에 같은 계열이 0~1개면 0단계, 2개면 1단계, 3개(면 가득)면 2단계', () => {
    const s = quietGame();
    assert.deepEqual([0, 1, 2, 3].map((n) => setTier(s.config, n)), [0, 0, 1, 2]);
  });

  test('면마다 따로 센다: 다른 면에 있는 같은 계열은 세지 않는다', () => {
    const s = quietGame();
    selectFace(s, 'n');
    give(s, 'sling', 1);
    give(s, 'mortar', 1);
    selectFace(s, 'e');
    give(s, 'twin_daggers', 1);
    assert.equal(weaponCounts(s, 'n').normal, 1);
    assert.equal(weaponCounts(s, 'n').siege, 1);
    assert.equal(weaponCounts(s, 'e').normal, 1);
    assert.equal(weaponCounts(s, 's').normal, 0);
  });
});

describe('면 세트 피해 보너스', () => {
  test('일반 무기 하나만 있으면 보너스가 없다 (돌팔매 피해 20)', () => {
    const s = quietGame();
    give(s, 'sling', 1);
    assert.equal(effectiveWeapon(s, weapon('sling')).damage, 20);
  });

  test('1단계(한 면에 2개): 그 계열 무기 피해 +20% (돌팔매 20 → 24)', () => {
    const s = quietGame();
    giveKin(s, 'normal', 2);
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).damage - 24) < 1e-9);
  });

  test('2단계(한 면에 3개): 그 계열 무기 피해 +50% (돌팔매 20 → 30)', () => {
    const s = quietGame();
    giveKin(s, 'normal', 3);
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).damage - 30) < 1e-9);
  });

  test('같은 계열이라도 두 면에 나눠 달면 보너스가 없다', () => {
    const s = quietGame();
    selectFace(s, 'n');
    give(s, 'sling', 1);
    selectFace(s, 's');
    give(s, 'twin_daggers', 1);
    placeAt(s, 0, -60, dummyDef({ hp: 1000 }));
    step(s, 0.01);
    assert.equal(s.damageByWeapon.sling, 20);
  });

  test('세트 보너스는 다른 계열 무기에는 붙지 않는다', () => {
    const s = quietGame();
    giveKin(s, 'normal', 2);
    assert.equal(effectiveWeapon(s, weapon('mortar')).damage, 40);
  });

  test('전투 교본(+10%)과는 곱해진다 (20 × 1.1 × 1.2 = 26.4)', () => {
    const s = quietGame();
    giveKin(s, 'normal', 2);
    applyItem(s, findItem('war_manual'));
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).damage - 26.4) < 1e-9);
  });

  test('실제 전투에서도 세트 보너스가 들어간다 (같은 면 일반 무기 2종 → 돌팔매 한 방 24)', () => {
    const s = quietGame();
    giveKin(s, 'normal', 2);
    placeAt(s, 60, 0, dummyDef({ hp: 1000 }));
    step(s, 0.01);
    assert.ok(Math.abs(s.damageByWeapon.sling - 24) < 1e-9);
  });
});

describe('2단계(면 가득) 특수 효과', () => {
  test('일반: 공격 속도 +25% (주기 1초 → 0.8초)', () => {
    const s = quietGame();
    giveKin(s, 'normal', 2);
    assert.equal(effectiveWeapon(s, weapon('sling')).cooldown, 1);
    s.weapons = [];
    giveKin(s, 'normal', 3);
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).cooldown - 0.8) < 1e-9);
  });

  test('관통: 사거리 +40 (장궁 180 → 220)', () => {
    const s = quietGame();
    giveKin(s, 'pierce', 3);
    assert.equal(effectiveWeapon(s, weapon('longbow')).range, 220);
  });

  test('마법: 연쇄 +2회, 둔화 +1초', () => {
    const s = quietGame();
    giveKin(s, 'magic', 3);
    const chain = effectiveWeapon(s, weapon('chain_bolt')).behavior;
    const slow = effectiveWeapon(s, weapon('frost_orb')).behavior;
    assert.ok(chain.kind === 'chain' && chain.jumps === 5);
    assert.ok(slow.kind === 'slow' && slow.duration === 3);
  });

  test('공성: 폭발 반경 ×1.3 (박격포 40 → 52)', () => {
    const s = quietGame();
    giveKin(s, 'siege', 3);
    const b = effectiveWeapon(s, weapon('mortar')).behavior;
    assert.ok(b.kind === 'splash' && Math.abs(b.radius - 52) < 1e-9);
  });

  test('카오스: 피해 배율 하한이 1배로 오른다', () => {
    const s = quietGame();
    giveKin(s, 'chaos', 2);
    assert.equal(effectiveWeapon(s, weapon('chaos_orb')).chaosMin, 0.5);
    s.weapons = [];
    giveKin(s, 'chaos', 3);
    assert.equal(effectiveWeapon(s, weapon('chaos_orb')).chaosMin, 1);
  });

  test('카오스 2단계에서는 실제 피해도 기본 피해 × 1.5(세트) 이상 3배 이하다', () => {
    const s = quietGame();
    giveKin(s, 'chaos', 3);
    // 혼돈 구슬만 쏘게 다른 둘은 멀리 못 쏘는 척 대신 피해 통계로 본다
    placeAt(s, 60, 0, dummyDef({ hp: 1e12 }));
    for (let i = 0; i < 30; i++) {
      const before = s.damageByWeapon.chaos_orb ?? 0;
      step(s, 1);
      const hit = (s.damageByWeapon.chaos_orb ?? 0) - before;
      assert.ok(hit >= 30 * 1.5 - 1e-6, `너무 약함: ${hit}`);
      assert.ok(hit <= 30 * 1.5 * 2 + 1e-6, `너무 셈: ${hit}`);
    }
  });

  test('무기 정의 원본은 바뀌지 않는다', () => {
    const s = quietGame();
    giveKin(s, 'magic', 3);
    effectiveWeapon(s, weapon('chain_bolt'));
    const original = WEAPONS.find((w) => w.id === 'chain_bolt')!;
    assert.ok(original.behavior.kind === 'chain' && original.behavior.jumps === 3);
  });
});
