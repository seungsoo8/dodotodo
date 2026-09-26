import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../data.ts';
import { applyItem, step } from '../game.ts';
import { distToTower, dummyDef, placeAt, quietGame } from './helpers.ts';

describe('단일 무기 (돌팔매: 피해 20, 주기 1초, 사거리 120)', () => {
  test('사거리 안의 적 중 탑에 가장 가까운 적 하나만 때린다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const far = placeAt(s, 100, 0);
    const near = placeAt(s, 0, 50);
    step(s, 0.01);
    assert.equal(near.hp, 80);
    assert.equal(far.hp, 100);
  });

  test('사거리 경계: 적의 가장자리가 사거리에 닿으면 맞고, 조금이라도 벗어나면 안 맞는다', () => {
    // 적 반지름 5 → 중심 거리 125 까지가 사거리 안
    const inside = quietGame();
    applyItem(inside, findItem('sling'));
    const a = placeAt(inside, 125, 0);
    step(inside, 0.01);
    assert.equal(a.hp, 80);

    const outside = quietGame();
    applyItem(outside, findItem('sling'));
    const b = placeAt(outside, 125.5, 0);
    step(outside, 0.01);
    assert.equal(b.hp, 100);
  });

  test('쏠 대상이 없으면 쿨다운을 쓰지 않고, 적이 들어오는 즉시 쏜다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    step(s, 3);
    const e = placeAt(s, 60, 0);
    step(s, 0.01);
    assert.equal(e.hp, 80);
  });

  test('공격 주기(1초)가 지나야 다시 쏜다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0);
    step(s, 0.01);
    assert.equal(e.hp, 80);
    step(s, 0.5);
    assert.equal(e.hp, 80, '0.5초 뒤에는 아직 못 쏜다');
    step(s, 0.5);
    assert.equal(e.hp, 60, '1초가 지나면 다시 쏜다');
  });

  test('같은 무기를 두 개 가지면 두 번 때린다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0);
    step(s, 0.01);
    assert.equal(e.hp, 60);
  });

  test('앞선 무기가 죽인 적은 다음 무기가 노리지 않고 다음 적을 때린다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('sling'));
    const weak = placeAt(s, 40, 0, dummyDef({ hp: 20 }));
    const other = placeAt(s, 80, 0);
    step(s, 0.01);
    assert.equal(s.enemies.includes(weak), false);
    assert.equal(other.hp, 80);
  });

  test('전투 교본(+10%)을 사면 피해가 22 가 된다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('war_manual'));
    const e = placeAt(s, 60, 0);
    step(s, 0.01);
    assert.equal(e.hp, 78);
  });

  test('쏠 때 shot 연출 이벤트를 남긴다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    placeAt(s, 60, 0);
    step(s, 0.01);
    const shot = s.events.find((ev) => ev.kind === 'shot');
    assert.ok(shot && shot.kind === 'shot');
    assert.equal(shot.weaponType, 'normal');
    assert.equal(shot.behavior, 'single', '연출을 고를 수 있도록 공격 방식도 알려준다');
    assert.equal(shot.weaponId, 'sling', '무기마다 다른 연출을 쓰도록 어떤 무기인지도 알려준다');
    assert.deepEqual(shot.from, { x: s.tower.x, y: s.tower.y });
    assert.deepEqual(shot.to, { x: s.tower.x + 60, y: s.tower.y });
  });
});

describe('관통 무기 (장궁: 피해 30, 사거리 180, 폭 10)', () => {
  test('가장 가까운 적을 향한 직선 위의 적을 모두 꿰뚫고, 직선 밖·사거리 밖 적은 맞지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('longbow'));
    const first = placeAt(s, 40, 0);
    const second = placeAt(s, 120, 0);
    const offLine = placeAt(s, 80, 40);
    const beyond = placeAt(s, 200, 0);
    step(s, 0.01);
    assert.equal(first.hp, 70);
    assert.equal(second.hp, 70);
    assert.equal(offLine.hp, 100);
    assert.equal(beyond.hp, 100);
  });
});

describe('연쇄 무기 (연쇄 번개: 피해 25, 3회, 튕김 거리 60)', () => {
  test('가까운 적부터 튕김 거리 안의 적으로 최대 3번 튄다', () => {
    const s = quietGame();
    applyItem(s, findItem('chain_bolt'));
    const e1 = placeAt(s, 50, 0);
    const e2 = placeAt(s, 100, 0);
    const e3 = placeAt(s, 150, 0);
    const e4 = placeAt(s, 200, 0);
    step(s, 0.01);
    assert.deepEqual([e1.hp, e2.hp, e3.hp, e4.hp], [75, 75, 75, 100]);
    const shots = s.events.filter((ev) => ev.kind === 'shot');
    assert.equal(shots.length, 3, '튈 때마다 shot 이벤트');
    assert.ok(shots.every((ev) => ev.kind === 'shot' && ev.behavior === 'chain'));
  });

  test('다음 적이 튕김 거리보다 멀면 거기서 멈춘다', () => {
    const s = quietGame();
    applyItem(s, findItem('chain_bolt'));
    const e1 = placeAt(s, 50, 0);
    const e2 = placeAt(s, 50 + 70, 0);
    step(s, 0.01);
    assert.equal(e1.hp, 75);
    assert.equal(e2.hp, 100);
  });

  test('이미 맞은 적은 같은 연쇄에서 다시 맞지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('chain_bolt'));
    const e1 = placeAt(s, 50, 0);
    const e2 = placeAt(s, 80, 0);
    step(s, 0.01);
    assert.equal(e1.hp, 75);
    assert.equal(e2.hp, 75);
  });
});

describe('광역 무기 (박격포: 피해 40, 반경 40)', () => {
  test('표적 주변 반경 안의 적은 모두 맞고, 밖의 적은 맞지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('mortar'));
    const target = placeAt(s, 100, 0);
    const nearby = placeAt(s, 100, 30);
    const edge = placeAt(s, 145, 0); // 중심 거리 45 = 반경 40 + 적 반지름 5
    const away = placeAt(s, 100, 60);
    step(s, 0.01);
    assert.equal(target.hp, 60);
    assert.equal(nearby.hp, 60);
    assert.equal(edge.hp, 60);
    assert.equal(away.hp, 100);
    assert.ok(s.events.some((ev) => ev.kind === 'splash'));
  });
});

describe('둔화 무기 (서리 구슬: 2초간 속도 50%)', () => {
  test('맞은 적은 2초 동안 절반 속도로 움직이고, 그 뒤 원래 속도로 돌아온다', () => {
    const s = quietGame();
    applyItem(s, findItem('frost_orb'));
    const e = placeAt(s, 130, 0, dummyDef({ speed: 40, hp: 10000 }));
    step(s, 0.001);
    s.weapons = []; // 더 이상 다시 얼리지 않도록 무기를 치운다

    const before = distToTower(s, e);
    step(s, 0.5);
    assert.ok(Math.abs(before - distToTower(s, e) - 10) < 1e-6, '둔화 중에는 0.5초에 10 이동');

    step(s, 1.5); // 둔화 끝
    const mid = distToTower(s, e);
    step(s, 0.5);
    assert.ok(Math.abs(mid - distToTower(s, e) - 20) < 1e-6, '둔화가 끝나면 0.5초에 20 이동');
  });
});

describe('카오스 무기 (혼돈 구슬: 피해 30 × 0.5~2배)', () => {
  test('매번 피해가 15 이상 60 이하 사이에서 달라진다', () => {
    const s = quietGame();
    applyItem(s, findItem('chaos_orb'));
    const e = placeAt(s, 60, 0, dummyDef({ hp: 1e9 }));
    const damages: number[] = [];
    for (let i = 0; i < 60; i++) {
      const before = e.hp;
      step(s, 1);
      damages.push(before - e.hp);
    }
    for (const d of damages) assert.ok(d >= 15 && d <= 60, `피해 범위 벗어남: ${d}`);
    assert.ok(new Set(damages).size > 10, '피해가 매번 달라야 한다');
  });
});

describe('처치', () => {
  test('적을 죽이면 사라지고 현상금과 처치 수를 얻는다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const goldBefore = s.gold;
    const e = placeAt(s, 60, 0, dummyDef({ hp: 20, bounty: 7 }));
    step(s, 0.01);
    assert.equal(s.enemies.includes(e), false);
    assert.equal(s.gold, goldBefore + 7);
    assert.equal(s.kills, 1);
    assert.ok(s.events.some((ev) => ev.kind === 'kill' && ev.bounty === 7 && ev.enemyId === e.id));
  });

  test('체력이 딱 남으면 죽지 않는다 (체력 21 에 피해 20)', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0, dummyDef({ hp: 21 }));
    step(s, 0.01);
    assert.equal(e.hp, 1);
    assert.equal(s.enemies.includes(e), true);
    assert.equal(s.kills, 0);
  });
});
