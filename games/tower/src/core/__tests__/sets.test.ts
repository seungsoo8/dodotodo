import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem, WEAPONS } from '../data.ts';
import { applyItem, step, type GameState } from '../game.ts';
import { effectiveWeapon, setTier, weaponCounts } from '../sets.ts';
import type { WeaponDef } from '../types.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

function weapon(id: string): WeaponDef {
  const item = findItem(id);
  assert.equal(item.kind, 'weapon');
  return item as WeaponDef;
}

function give(s: GameState, id: string, n: number): void {
  for (let i = 0; i < n; i++) applyItem(s, findItem(id));
}

describe('세트 단계', () => {
  test('같은 계열 무기가 0~2개면 0단계, 3~5개면 1단계, 6개 이상이면 2단계', () => {
    const s = quietGame();
    assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 9].map((n) => setTier(s.config, n)), [0, 0, 0, 1, 1, 1, 2, 2]);
  });

  test('계열별로 가진 무기 수를 센다 (같은 무기 여러 개도 각각 센다)', () => {
    const s = quietGame();
    give(s, 'sling', 2);
    give(s, 'twin_daggers', 1);
    give(s, 'mortar', 1);
    const counts = weaponCounts(s);
    assert.equal(counts.normal, 3);
    assert.equal(counts.siege, 1);
    assert.equal(counts.magic, 0);
  });
});

describe('세트 피해 보너스', () => {
  test('일반 무기 2개일 때는 보너스가 없다 (돌팔매 피해 20)', () => {
    const s = quietGame();
    give(s, 'sling', 2);
    assert.equal(effectiveWeapon(s, weapon('sling')).damage, 20);
  });

  test('1단계(3개): 그 계열 무기 피해 +20% (돌팔매 20 → 24)', () => {
    const s = quietGame();
    give(s, 'sling', 3);
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).damage - 24) < 1e-9);
  });

  test('2단계(6개): 그 계열 무기 피해 +50% (돌팔매 20 → 30)', () => {
    const s = quietGame();
    give(s, 'sling', 6);
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).damage - 30) < 1e-9);
  });

  test('세트 보너스는 다른 계열 무기에는 붙지 않는다', () => {
    const s = quietGame();
    give(s, 'sling', 6);
    assert.equal(effectiveWeapon(s, weapon('mortar')).damage, 40);
  });

  test('전투 교본(+10%)과는 곱해진다 (20 × 1.1 × 1.2 = 26.4)', () => {
    const s = quietGame();
    give(s, 'sling', 3);
    applyItem(s, findItem('war_manual'));
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).damage - 26.4) < 1e-9);
  });

  test('실제 전투에서도 세트 보너스가 들어간다 (돌팔매 3개 → 한 번에 24씩, 72)', () => {
    const s = quietGame();
    give(s, 'sling', 3);
    const e = placeAt(s, 60, 0, dummyDef({ hp: 1000 }));
    step(s, 0.01);
    assert.ok(Math.abs(e.hp - (1000 - 72)) < 1e-9);
  });
});

describe('2단계 특수 효과', () => {
  test('일반: 공격 속도 +25% (주기 1초 → 0.8초)', () => {
    const s = quietGame();
    give(s, 'sling', 5);
    assert.equal(effectiveWeapon(s, weapon('sling')).cooldown, 1);
    give(s, 'sling', 1);
    assert.ok(Math.abs(effectiveWeapon(s, weapon('sling')).cooldown - 0.8) < 1e-9);
  });

  test('관통: 사거리 +40 (장궁 180 → 220)', () => {
    const s = quietGame();
    give(s, 'longbow', 6);
    assert.equal(effectiveWeapon(s, weapon('longbow')).range, 220);
  });

  test('마법: 연쇄 +2회, 둔화 +1초', () => {
    const s = quietGame();
    give(s, 'chain_bolt', 3);
    give(s, 'frost_orb', 3);
    const chain = effectiveWeapon(s, weapon('chain_bolt')).behavior;
    const slow = effectiveWeapon(s, weapon('frost_orb')).behavior;
    assert.ok(chain.kind === 'chain' && chain.jumps === 5);
    assert.ok(slow.kind === 'slow' && slow.duration === 3);
  });

  test('공성: 폭발 반경 ×1.3 (박격포 40 → 52)', () => {
    const s = quietGame();
    give(s, 'mortar', 6);
    const b = effectiveWeapon(s, weapon('mortar')).behavior;
    assert.ok(b.kind === 'splash' && Math.abs(b.radius - 52) < 1e-9);
  });

  test('카오스: 피해 배율 하한이 1배로 오른다', () => {
    const s = quietGame();
    give(s, 'chaos_orb', 5);
    assert.equal(effectiveWeapon(s, weapon('chaos_orb')).chaosMin, 0.5);
    give(s, 'chaos_orb', 1);
    assert.equal(effectiveWeapon(s, weapon('chaos_orb')).chaosMin, 1);
  });

  test('카오스 2단계에서는 실제 피해도 기본 피해 × 1.5(세트) 이상이다', () => {
    const s = quietGame();
    give(s, 'chaos_orb', 6);
    const e = placeAt(s, 60, 0, dummyDef({ hp: 1e9 }));
    for (let i = 0; i < 30; i++) {
      const before = e.hp;
      step(s, 1);
      const perHit = (before - e.hp) / 6;
      assert.ok(perHit >= 30 * 1.5 - 1e-9, `너무 약함: ${perHit}`);
      assert.ok(perHit <= 30 * 1.5 * 2 + 1e-9, `너무 셈: ${perHit}`);
    }
  });

  test('무기 정의 원본은 바뀌지 않는다', () => {
    const s = quietGame();
    give(s, 'chain_bolt', 6);
    effectiveWeapon(s, weapon('chain_bolt'));
    const original = WEAPONS.find((w) => w.id === 'chain_bolt')!;
    assert.ok(original.behavior.kind === 'chain' && original.behavior.jumps === 3);
  });
});
