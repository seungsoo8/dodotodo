import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../config.ts';
import { findItem } from '../data.ts';
import { applyItem, step, towerDamageTaken } from '../game.ts';
import { distToTower, dummyDef, placeAt, quietGame } from './helpers.ts';

describe('적 이동', () => {
  test('적은 속도만큼 탑을 향해 다가온다 (속도 40, 1초 → 40 가까워짐)', () => {
    const s = quietGame();
    const e = placeAt(s, 120, 90, dummyDef({ speed: 40 })); // 거리 150
    step(s, 1);
    assert.ok(Math.abs(distToTower(s, e) - 110) < 1e-9);
    // 방향은 그대로 (3:4 비율 유지)
    assert.ok(Math.abs((e.x - s.tower.x) / (e.y - s.tower.y) - 120 / 90) < 1e-9);
  });

  test('탑 가장자리에 닿으면 더 들어오지 않는다 (탑 반지름 16 + 적 반지름 5 = 21)', () => {
    const s = quietGame();
    const e = placeAt(s, 30, 0, dummyDef({ speed: 40 }));
    step(s, 1);
    assert.equal(distToTower(s, e), 21);
    step(s, 1);
    assert.equal(distToTower(s, e), 21);
  });
});

describe('탑 피격', () => {
  test('닿은 적은 공격 주기마다 탑을 때린다', () => {
    const s = quietGame();
    placeAt(s, 21, 0, dummyDef({ atk: 10, atkInterval: 1 }));
    step(s, 0.01);
    assert.equal(s.tower.hp, 990);
    step(s, 0.5);
    assert.equal(s.tower.hp, 990);
    step(s, 0.5);
    assert.equal(s.tower.hp, 980);
    assert.ok(s.events.some((ev) => ev.kind === 'towerHit' && ev.amount === 10));
  });

  test('닿지 않은 적은 탑을 때리지 않는다', () => {
    const s = quietGame();
    placeAt(s, 60, 0, dummyDef({ atk: 10 }));
    step(s, 2);
    assert.equal(s.tower.hp, 1000);
  });

  test('방어력 공식: 받는 피해 = 공격력 / (1 + 방어력 × 0.05)', () => {
    assert.equal(towerDamageTaken(DEFAULT_CONFIG, 100, 0), 100);
    assert.equal(towerDamageTaken(DEFAULT_CONFIG, 100, 20), 50);
    assert.equal(towerDamageTaken(DEFAULT_CONFIG, 60, 10), 40);
  });

  test('강철판(방어 +2)을 사면 공격력 11 인 적에게 10 만 받는다', () => {
    const s = quietGame();
    applyItem(s, findItem('iron_plate'));
    assert.equal(s.tower.armor, 2);
    placeAt(s, 21, 0, dummyDef({ atk: 11 }));
    step(s, 0.01);
    assert.ok(Math.abs(s.tower.hp - 990) < 1e-9);
  });
});

describe('탑 강화', () => {
  test('튼튼한 벽: 최대 체력 +300, 현재 체력도 +300', () => {
    const s = quietGame();
    s.tower.hp = 500;
    applyItem(s, findItem('wall'));
    assert.equal(s.tower.maxHp, 1300);
    assert.equal(s.tower.hp, 800);
  });

  test('재생의 룬: 초당 5 회복하되 최대 체력을 넘지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('regen_rune'));
    s.tower.hp = 990;
    step(s, 1);
    assert.equal(s.tower.hp, 995);
    step(s, 5);
    assert.equal(s.tower.hp, 1000);
  });
});

describe('패배', () => {
  test('탑 체력이 정확히 0 이 되면 패배한다', () => {
    const s = quietGame();
    placeAt(s, 21, 0, dummyDef({ atk: 1000 }));
    step(s, 0.01);
    assert.equal(s.tower.hp, 0);
    assert.equal(s.status, 'lost');
  });

  test('체력이 1 이라도 남으면 계속 진행한다', () => {
    const s = quietGame();
    placeAt(s, 21, 0, dummyDef({ atk: 999 }));
    step(s, 0.01);
    assert.equal(s.tower.hp, 1);
    assert.equal(s.status, 'playing');
  });

  test('체력은 0 아래로 내려가지 않는다', () => {
    const s = quietGame();
    placeAt(s, 21, 0, dummyDef({ atk: 5000 }));
    step(s, 0.01);
    assert.equal(s.tower.hp, 0);
  });

  test('패배 후에는 시간이 흐르지 않는다', () => {
    const s = quietGame();
    placeAt(s, 21, 0, dummyDef({ atk: 1000 }));
    step(s, 0.01);
    const t = s.time;
    step(s, 5);
    assert.equal(s.time, t);
  });
});
