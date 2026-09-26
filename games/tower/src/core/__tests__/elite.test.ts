import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../data.ts';
import { step } from '../game.ts';
import { quietGame } from './helpers.ts';

function advanceTo(s: ReturnType<typeof quietGame>, round: number): void {
  while (s.round < round) step(s, 0.5);
}

describe('정예 적', () => {
  test('5라운드가 시작되면 정예가 하나 나온다 (4라운드까지는 없다)', () => {
    const s = quietGame({ roundSeconds: 5 });
    advanceTo(s, 4);
    assert.equal(s.enemies.filter((e) => e.isElite).length, 0);
    advanceTo(s, 5);
    assert.equal(s.enemies.filter((e) => e.isElite).length, 1);
    assert.ok(s.events.some((ev) => ev.kind === 'elite'));
  });

  test('정예는 그 라운드에 나올 수 있는 가장 튼튼한 적을 바탕으로, 체력 ×6 · 공격력 ×2 · 현상금 ×8 · 몸집 +3', () => {
    const s = quietGame({ roundSeconds: 5, waves: { hpGrowth: 1.1, atkGrowth: 1.05, bountyGrowth: 1.02 } });
    advanceTo(s, 5);
    const elite = s.enemies.find((e) => e.isElite)!;
    const pool = ENEMIES.filter((e) => e.minRound <= 5);
    const base = pool.reduce((a, b) => (b.hp > a.hp ? b : a));
    assert.equal(elite.def.id, base.id);
    assert.ok(Math.abs(elite.maxHp - base.hp * 1.1 ** 4 * 6) < 1e-6);
    assert.ok(Math.abs(elite.atk - base.atk * 1.05 ** 4 * 2) < 1e-6);
    assert.ok(Math.abs(elite.bounty - base.bounty * 1.02 ** 4 * 8) < 1e-6);
    assert.equal(elite.radius, base.radius + 3);
    assert.equal(elite.isBoss, false);
  });

  test('10라운드에도 정예가 나온다', () => {
    const s = quietGame({ roundSeconds: 2 });
    advanceTo(s, 10);
    assert.equal(s.enemies.filter((e) => e.isElite).length, 2);
  });

  test('마지막(보스) 라운드에는 정예 대신 보스만 나온다', () => {
    const s = quietGame({ roundSeconds: 2, totalRounds: 5 });
    advanceTo(s, 5);
    assert.equal(s.enemies.filter((e) => e.isElite).length, 0);
    assert.equal(s.enemies.filter((e) => e.isBoss).length, 1);
  });

  test('정예 주기를 0 으로 두면 정예가 나오지 않는다', () => {
    const s = quietGame({ roundSeconds: 2, waves: { eliteEvery: 0 } });
    advanceTo(s, 10);
    assert.equal(s.enemies.filter((e) => e.isElite).length, 0);
  });
});
