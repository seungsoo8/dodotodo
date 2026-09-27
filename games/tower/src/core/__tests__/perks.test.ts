import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../data.ts';
import { applyItem, buyItem, chooseReward, rerollCost, spawnEnemy, step, type GameState } from '../game.ts';
import { GOLD_POUCH, PERKS, hasPerk } from '../perks.ts';
import { BOSS } from '../data.ts';
import { distToTower, dummyDef, placeAt, quietGame } from './helpers.ts';

/** 특전 하나를 바로 가진 판 */
function withPerk(id: string, overrides: Parameters<typeof quietGame>[0] = {}): GameState {
  const s = quietGame(overrides);
  s.choice = [{ kind: 'perk', id }];
  assert.equal(chooseReward(s, 0), true);
  s.events.length = 0;
  return s;
}

function advanceTo(s: GameState, round: number): void {
  for (let i = 0; i < 10000 && s.round < round && !s.choice; i++) step(s, 0.25);
}

describe('특전 목록', () => {
  test('특전은 16종이고 id 가 겹치지 않는다', () => {
    assert.equal(PERKS.length, 16);
    assert.equal(new Set(PERKS.map((p) => p.id)).size, 16);
    for (const p of PERKS) assert.ok(p.name && p.desc);
  });
});

describe('특전 효과', () => {
  test('연사: 공격 속도 +20%', () => {
    assert.ok(Math.abs(withPerk('rapid_fire').tower.attackSpeedMul - 1.2) < 1e-9);
  });

  test('날 벼리기: 모든 피해 +20%', () => {
    assert.ok(Math.abs(withPerk('sharpen').tower.damageMul - 1.2) < 1e-9);
  });

  test('행운: 치명타 +15%', () => {
    assert.ok(Math.abs(withPerk('lucky').tower.critChance - 0.15) < 1e-9);
  });

  test('요새: 최대 체력 ×1.4 (늘어난 만큼 회복), 방어 +3', () => {
    const s = quietGame();
    s.tower.hp = 500;
    s.choice = [{ kind: 'perk', id: 'fortress' }];
    chooseReward(s, 0);
    assert.equal(s.tower.maxHp, 1400);
    assert.equal(s.tower.hp, 900);
    assert.equal(s.tower.armor, 3);
  });

  test('이자: 라운드가 시작될 때 가진 골드의 10% (최대 150)', () => {
    const s = withPerk('interest', { roundSeconds: 1 });
    s.gold = 500;
    step(s, 1.01);
    assert.equal(s.round, 2);
    assert.equal(s.gold, 550);
    s.gold = 5000;
    step(s, 1);
    assert.equal(s.gold, 5150);
  });

  test('흡혈 탑: 적을 잡을 때마다 탑 체력 4 회복', () => {
    const s = withPerk('vampiric');
    applyItem(s, findItem('sling'));
    s.tower.hp = 900;
    placeAt(s, 60, 0, dummyDef({ hp: 10 }));
    step(s, 0.01);
    assert.equal(s.tower.hp, 904);
  });

  test('시체 폭발: 죽은 적 주변 35 안의 적이 그 적 최대 체력의 15% 피해를 입는다', () => {
    const s = withPerk('corpse_blast');
    applyItem(s, findItem('sling'));
    placeAt(s, 60, 0, dummyDef({ hp: 20 }));
    const near = placeAt(s, 60, 30, dummyDef({ hp: 100 }));
    const far = placeAt(s, 60, 60, dummyDef({ hp: 100 }));
    step(s, 0.01);
    assert.equal(near.hp, 100 - 20 * 0.15);
    assert.equal(far.hp, 100);
  });

  test('다중 사격: 단일 무기가 두 번째로 가까운 적에게도 한 발 더 쏜다', () => {
    const s = withPerk('multishot');
    applyItem(s, findItem('sling'));
    const a = placeAt(s, 50, 0);
    const b = placeAt(s, 80, 0);
    const c = placeAt(s, 110, 0);
    step(s, 0.01);
    assert.deepEqual([a.hp, b.hp, c.hp], [80, 80, 100]);
  });

  test('전도체: 연쇄 +2회', () => {
    const s = withPerk('conductor');
    applyItem(s, findItem('chain_bolt'));
    const es = [1, 2, 3, 4, 5, 6].map((i) => placeAt(s, i * 25, 0));
    step(s, 0.01);
    assert.equal(es.filter((e) => e.hp < 100).length, 5);
  });

  test('거인 사냥꾼: 정예·보스에게 피해 +50%', () => {
    const s = withPerk('giant_slayer');
    applyItem(s, findItem('sling'));
    const boss = spawnEnemy(s, BOSS, s.tower.x + 60, s.tower.y);
    boss.speed = 0;
    const hp = boss.hp;
    step(s, 0.01);
    assert.equal(hp - boss.hp, 30);
  });

  test('현상금 사냥꾼: 현상금 +30%', () => {
    const s = withPerk('bounty_hunter');
    applyItem(s, findItem('sling'));
    placeAt(s, 60, 0, dummyDef({ hp: 10, bounty: 10 }));
    const gold = s.gold;
    step(s, 0.01);
    assert.equal(s.gold, gold + 13);
  });

  test('할인: 상점 가격 -20% (올림)', () => {
    const s = withPerk('discount');
    s.shop[0] = findItem('sling');
    const gold = s.gold;
    assert.equal(buyItem(s, 0), true);
    assert.equal(s.gold, gold - 80);
  });

  test('무료 리롤: 라운드마다 첫 리롤은 공짜', () => {
    const s = withPerk('free_reroll');
    assert.equal(rerollCost(s), 0);
  });

  test('냉기 오라: 탑에서 70 안의 적은 40% 느려진다', () => {
    const s = withPerk('frost_aura');
    const inside = placeAt(s, 60, 0, dummyDef({ speed: 20 }));
    const outside = placeAt(s, 0, 150, dummyDef({ speed: 20 }));
    const a = distToTower(s, inside);
    const b = distToTower(s, outside);
    step(s, 0.5);
    assert.ok(Math.abs(a - distToTower(s, inside) - 6) < 1e-9);
    assert.ok(Math.abs(b - distToTower(s, outside) - 10) < 1e-9);
  });

  test('대폭발: 광역 반경 ×1.3', () => {
    const s = withPerk('big_splash');
    applyItem(s, findItem('mortar'));
    placeAt(s, 100, 0);
    const edge = placeAt(s, 155, 0); // 40 × 1.3 + 5 = 57 안
    step(s, 0.01);
    assert.ok(edge.hp < 100);
  });

  test('주문 숙련: 가지고 있음을 확인할 수 있다 (스킬 쿨다운은 스킬 테스트에서)', () => {
    assert.ok(hasPerk(withPerk('skill_master'), 'skill_master'));
  });
});
