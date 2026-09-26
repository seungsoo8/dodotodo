import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { makeConfig } from '../config.ts';
import { BOSS, BOSSES, ENEMIES, findItem } from '../data.ts';
import { applyItem, choosePerk, createGame, enemyCountForRound, spawnEnemy, step } from '../game.ts';
import { distToTower, dummyDef, placeAt, quietGame } from './helpers.ts';

describe('라운드 진행', () => {
  test('라운드 시간(20초)이 다 되면 다음 라운드로 넘어간다', () => {
    const s = quietGame();
    step(s, 19.99);
    assert.equal(s.round, 1);
    step(s, 0.02);
    assert.equal(s.round, 2);
    assert.ok(s.roundTime < 0.02, '남은 시간은 새 라운드로 이어진다');
    assert.ok(s.events.some((ev) => ev.kind === 'round' && ev.round === 2));
  });

  test('라운드당 적 수 = 기본 수 + 라운드당 증가 × (라운드-1)', () => {
    const config = makeConfig({ waves: { baseCount: 8, countPerRound: 3 } });
    assert.equal(enemyCountForRound(config, 1), 8);
    assert.equal(enemyCountForRound(config, 2), 11);
    assert.equal(enemyCountForRound(config, 5), 20);
  });

  test('적은 라운드 시간의 앞 80%(16초)에 고르게 나온다', () => {
    const s = createGame({
      seed: 3,
      config: { roundSeconds: 20, tower: { maxHp: 1e9 }, waves: { baseCount: 8, countPerRound: 3, spawnWindow: 0.8 } },
    });
    step(s, 0.05);
    assert.equal(s.spawnedThisRound, 1, '0초에 첫 적');
    step(s, 2);
    assert.equal(s.spawnedThisRound, 2, '2초 간격');
    while (s.roundTime < 16.5) step(s, 0.05);
    assert.equal(s.spawnedThisRound, 8);
    while (s.roundTime < 19.9) step(s, 0.05);
    assert.equal(s.spawnedThisRound, 8, '뒤 20% 구간에는 더 나오지 않는다');
  });

  test('적은 화면 가장자리에서 나온다', () => {
    const s = createGame({ seed: 11 });
    step(s, 0.01);
    const e = s.enemies[0];
    const { width, height } = s.config;
    const onEdge = e.x <= 0.5 || e.x >= width - 0.5 || e.y <= 0.5 || e.y >= height - 0.5;
    assert.ok(onEdge, `가장자리가 아님: (${e.x}, ${e.y})`);
  });

  test('1라운드에는 고블린만 나온다', () => {
    const s = createGame({ seed: 8, config: { startWeapons: [], tower: { maxHp: 1e9 } } });
    while (s.roundTime < s.config.roundSeconds * 0.9) step(s, 0.05);
    assert.equal(s.spawnedThisRound, enemyCountForRound(s.config, 1));
    const ids = new Set(s.enemies.map((e) => e.def.id));
    assert.deepEqual([...ids], ['goblin']);
  });

  test('라운드가 오를 때마다 적 체력·공격력·현상금이 설정 배율만큼 커진다', () => {
    const s = quietGame({ waves: { hpGrowth: 1.18, atkGrowth: 1.1, bountyGrowth: 1.05 } });
    const goblin = ENEMIES.find((e) => e.id === 'goblin')!;
    const r1 = spawnEnemy(s, goblin, 0, 0);
    s.round = 3;
    const r3 = spawnEnemy(s, goblin, 0, 0);
    assert.equal(r1.maxHp, goblin.hp);
    assert.equal(r1.atk, goblin.atk);
    assert.equal(r1.bounty, goblin.bounty);
    assert.ok(Math.abs(r3.maxHp - goblin.hp * 1.18 ** 2) < 1e-9);
    assert.equal(r3.hp, r3.maxHp);
    assert.ok(Math.abs(r3.atk - goblin.atk * 1.1 ** 2) < 1e-9);
    assert.ok(Math.abs(r3.bounty - goblin.bounty * 1.05 ** 2) < 1e-9);
  });
});

describe('보스와 승리', () => {
  test('마지막 라운드가 시작되면 보스가 나오고, 그 뒤로는 라운드가 오르지 않는다', () => {
    const s = quietGame({ roundSeconds: 5, totalRounds: 2 });
    step(s, 4.9);
    assert.equal(s.enemies.some((e) => e.isBoss), false);
    step(s, 0.2);
    assert.equal(s.round, 2);
    const bosses = s.enemies.filter((e) => e.isBoss);
    assert.equal(bosses.length, 1);
    assert.ok(BOSSES.includes(bosses[0].def));
    assert.ok(s.events.some((ev) => ev.kind === 'boss'));
    step(s, 6);
    assert.equal(s.round, 2);
    assert.equal(s.enemies.filter((e) => e.isBoss).length, 1, '보스는 한 번만 나온다');
  });

  test('보스는 라운드 성장 배율을 받지 않고 정해진 능력치로 나온다', () => {
    const s = quietGame({ waves: { hpGrowth: 1.5, atkGrowth: 1.5, bountyGrowth: 1.5 } });
    s.round = 10;
    const boss = spawnEnemy(s, BOSS, 0, 0);
    assert.equal(boss.maxHp, BOSS.hp);
    assert.equal(boss.atk, BOSS.atk);
    assert.equal(boss.bounty, BOSS.bounty);
  });

  test('보스를 잡으면 승리하고 현상금을 받는다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const boss = spawnEnemy(s, BOSS, s.tower.x + 60, s.tower.y);
    assert.equal(boss.isBoss, true);
    boss.hp = 10;
    step(s, 0.01);
    assert.equal(s.status, 'won');
    assert.equal(s.gold, 300 + BOSS.bounty);
  });

  test('보스가 아닌 적을 잡는 것으로는 승리하지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    placeAt(s, 60, 0, dummyDef({ hp: 10 }));
    step(s, 0.01);
    assert.equal(s.status, 'playing');
  });

  test('승리 후에는 더 이상 진행되지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const boss = spawnEnemy(s, BOSS, s.tower.x + 60, s.tower.y);
    boss.hp = 10;
    // 보스(거리 60)보다 먼 곳에서 다가오는 적
    const other = placeAt(s, -100, 0, dummyDef({ speed: 30 }));
    step(s, 0.01);
    assert.equal(s.status, 'won');
    const time = s.time;
    const gold = s.gold;
    const pos = distToTower(s, other);
    step(s, 3);
    assert.equal(s.time, time);
    assert.equal(s.gold, gold);
    assert.equal(distToTower(s, other), pos);
  });
});

describe('기본 설정으로 끝까지 시뮬레이션', () => {
  test('아무것도 사지 않으면 결국 진다', () => {
    const s = createGame({ seed: 2 });
    for (let i = 0; i < 20 * 60 * 20 && s.status === 'playing'; i++) {
      if (s.choice) choosePerk(s, 0); // 보상 카드가 나오면 아무거나 고른다
      step(s, 1 / 20);
    }
    assert.equal(s.status, 'lost');
  });
});
