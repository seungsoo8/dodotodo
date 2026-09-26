import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../config.ts';
import { BOSS, ENEMIES, findItem } from '../data.ts';
import { applyItem, createGame, spawnEnemy, step, type GameState } from '../game.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

function endless(overrides: Parameters<typeof quietGame>[0] = {}): GameState {
  const s = quietGame(overrides);
  s.mode = 'endless';
  return s;
}

const MAX_STEPS = 20000;

/** round 에 도달할 때까지 진행. 도달하지 못하면 무한 반복 대신 실패한다. */
function advanceTo(s: GameState, round: number): void {
  for (let i = 0; i < MAX_STEPS && s.round < round && s.status === 'playing'; i++) step(s, 0.5);
  assert.ok(s.round >= round, `${round}라운드에 도달하지 못함 (현재 ${s.round})`);
}

describe('게임 모드', () => {
  test('모드를 정하지 않으면 클래식이다', () => {
    assert.equal(createGame({ seed: 1 }).mode, 'classic');
  });

  test('무한 모드로 만들 수 있다', () => {
    assert.equal(createGame({ seed: 1, mode: 'endless' }).mode, 'endless');
  });
});

describe('무한 모드', () => {
  test('마지막 라운드(15)를 넘어 계속 진행된다', () => {
    const s = endless({ roundSeconds: 2, tower: { maxHp: 1e12 } });
    advanceTo(s, 17);
    assert.equal(s.round, 17);
    assert.equal(s.status, 'playing');
  });

  test('보스는 15라운드마다(15, 30) 나오고, 그 사이 라운드에는 나오지 않는다', () => {
    const s = endless({ roundSeconds: 1, tower: { maxHp: 1e15 } });
    const bossRounds: number[] = [];
    let seen = 0;
    for (let i = 0; i < MAX_STEPS && s.round < 31; i++) {
      step(s, 0.5);
      const now = s.enemies.filter((e) => e.isBoss).length;
      if (now > seen) bossRounds.push(s.round);
      seen = now;
    }
    assert.deepEqual(bossRounds, [15, 30]);
  });

  test('n 번째 보스는 체력 ×2.5^(n-1), 공격력·현상금 ×1.5^(n-1) 로 강해진다', () => {
    const s = endless({ roundSeconds: 1, tower: { maxHp: 1e15 } });
    advanceTo(s, 30);
    const bosses = s.enemies.filter((e) => e.isBoss).sort((a, b) => a.id - b.id);
    assert.equal(bosses.length, 2);
    assert.equal(bosses[0].maxHp, bosses[0].def.hp);
    const second = bosses[1].def;
    assert.notEqual(second.id, bosses[0].def.id, '같은 보스가 연달아 나오지 않는다');
    assert.ok(Math.abs(bosses[1].maxHp - second.hp * 2.5) < 1e-6);
    assert.ok(Math.abs(bosses[1].atk - second.atk * 1.5) < 1e-6);
    assert.ok(Math.abs(bosses[1].bounty - second.bounty * 1.5) < 1e-6);
  });

  test('보스 라운드(15의 배수)에는 정예가 나오지 않고, 5의 배수 다른 라운드에는 나온다', () => {
    const s = endless({ roundSeconds: 1, tower: { maxHp: 1e15 } });
    const eliteRounds: number[] = [];
    let seen = 0;
    for (let i = 0; i < MAX_STEPS && s.round < 31; i++) {
      step(s, 0.5);
      const now = s.enemies.filter((e) => e.isElite).length;
      if (now > seen) eliteRounds.push(s.round);
      seen = now;
    }
    assert.deepEqual(eliteRounds, [5, 10, 20, 25]);
  });

  test('보스를 잡아도 이기지 않고 계속되며, 현상금은 받는다', () => {
    const s = endless();
    applyItem(s, findItem('sling'));
    const boss = spawnEnemy(s, BOSS, s.tower.x + 60, s.tower.y);
    boss.hp = 10;
    step(s, 0.01);
    assert.equal(s.status, 'playing');
    assert.equal(s.enemies.includes(boss), false);
    assert.equal(s.gold, 300 + BOSS.bounty);
  });

  test('탑이 무너지면 무한 모드도 끝난다', () => {
    const s = endless();
    placeAt(s, 21, 0, dummyDef({ atk: 5000 }));
    step(s, 0.01);
    assert.equal(s.status, 'lost');
  });

  test('15라운드 이후 무한 모드의 적은 라운드마다 체력이 추가로 ×1.05 씩 강해진다', () => {
    const s = endless({ waves: { hpGrowth: 1.1 } });
    const goblin = ENEMIES.find((e) => e.id === 'goblin')!;
    s.round = 15;
    const at15 = spawnEnemy(s, goblin, 0, 0);
    assert.ok(Math.abs(at15.maxHp - goblin.hp * 1.1 ** 14) < 1e-6, '15라운드까지는 추가 성장 없음');
    s.round = 20;
    const at20 = spawnEnemy(s, goblin, 0, 0);
    assert.ok(Math.abs(at20.maxHp - goblin.hp * 1.1 ** 19 * 1.05 ** 5) < 1e-6);
  });

  test('무한 모드에서 15라운드 이후에는 현상금이 더 오르지 않는다', () => {
    const s = endless({ waves: { bountyGrowth: 1.1 } });
    const goblin = ENEMIES.find((e) => e.id === 'goblin')!;
    s.round = 15;
    const at15 = spawnEnemy(s, goblin, 0, 0);
    s.round = 40;
    const at40 = spawnEnemy(s, goblin, 0, 0);
    assert.ok(Math.abs(at15.bounty - goblin.bounty * 1.1 ** 14) < 1e-9);
    assert.equal(at40.bounty, at15.bounty);
  });

  test('클래식 모드에는 추가 성장이 없다', () => {
    const s = quietGame({ waves: { hpGrowth: 1.1 } });
    const goblin = ENEMIES.find((e) => e.id === 'goblin')!;
    s.round = 20;
    assert.ok(Math.abs(spawnEnemy(s, goblin, 0, 0).maxHp - goblin.hp * 1.1 ** 19) < 1e-6);
  });

  test('클래식 모드의 끝(15라운드)은 그대로다', () => {
    const s = quietGame({ roundSeconds: 1, tower: { maxHp: 1e15 } });
    advanceTo(s, 15);
    step(s, 5);
    assert.equal(s.round, DEFAULT_CONFIG.totalRounds);
  });
});
