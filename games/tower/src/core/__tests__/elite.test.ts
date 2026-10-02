import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ELITE, ENEMIES } from '../data.ts';
import { spawnElite, step } from '../game.ts';
import { quietGame } from './helpers.ts';

function advanceTo(s: ReturnType<typeof quietGame>, round: number): void {
  while (s.round < round) step(s, 0.5);
}

describe('정예 적', () => {
  test('라운드가 지나가도 정예는 저절로 나오지 않는다 (5·10라운드는 부관, 정예는 갈림길에서 고른다)', () => {
    const s = quietGame({ roundSeconds: 2 });
    let elites = 0;
    while (s.round < 11) {
      step(s, 0.5);
      elites = Math.max(elites, s.enemies.filter((e) => e.isElite).length);
    }
    assert.equal(elites, 0);
    assert.ok(s.enemies.some((e) => e.isOfficer), '부관은 나온다');
  });

  test('정예를 부르면 하나 나오고 알림이 뜬다', () => {
    const s = quietGame();
    spawnElite(s);
    assert.equal(s.enemies.filter((e) => e.isElite).length, 1);
    assert.ok(s.events.some((ev) => ev.kind === 'elite'));
  });

  test(`정예는 그 라운드에 나올 수 있는 특수 능력 없는 적 중 가장 튼튼한 적을 바탕으로, 체력 ×${ELITE.hpMul} · 공격력 ×${ELITE.atkMul} · 현상금 ×${ELITE.bountyMul} · 몸집이 커진다`, () => {
    const s = quietGame({ waves: { hpGrowth: 1.1, atkGrowth: 1.05, bountyGrowth: 1.02 } });
    s.round = 5;
    spawnElite(s);
    const elite = s.enemies.find((e) => e.isElite)!;
    const pool = ENEMIES.filter((e) => e.minRound <= 5 && !e.ability);
    const base = pool.reduce((a, b) => (b.hp > a.hp ? b : a));
    assert.equal(elite.def.id, base.id);
    assert.ok(Math.abs(elite.maxHp - base.hp * 1.1 ** 4 * ELITE.hpMul) < 1e-6);
    assert.ok(Math.abs(elite.atk - base.atk * 1.05 ** 4 * ELITE.atkMul) < 1e-6);
    assert.ok(Math.abs(elite.bounty - base.bounty * 1.02 ** 4 * ELITE.bountyMul) < 1e-6);
    assert.equal(elite.radius, base.radius + ELITE.radiusBonus);
    assert.equal(elite.isBoss, false);
  });

  test('5라운드 정예는 방패병(능력 있음)이 아니라 오크다', () => {
    const s = quietGame();
    s.round = 5;
    spawnElite(s);
    assert.equal(s.enemies.find((e) => e.isElite)!.def.id, 'orc');
  });

  test('마지막(보스) 라운드에는 정예 대신 보스만 나온다', () => {
    const s = quietGame({ roundSeconds: 2, totalRounds: 5 });
    advanceTo(s, 5);
    assert.equal(s.enemies.filter((e) => e.isElite).length, 0);
    assert.equal(s.enemies.filter((e) => e.isBoss).length, 1);
  });

  test('정예 주기를 0 으로 두면 부관도 나오지 않는다', () => {
    const s = quietGame({ roundSeconds: 2, waves: { eliteEvery: 0 } });
    advanceTo(s, 10);
    assert.equal(s.enemies.filter((e) => e.isElite || e.isOfficer).length, 0);
  });
});
