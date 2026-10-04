import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { hasPower } from '../combat.ts';
import { step } from '../game.ts';
import { BLESSINGS, checkpoints, chooseBlessing, endRun, nextFloor, RULES, startRun } from '../riftrun.ts';
import { NO_INPUT } from '../world.ts';
import { clearField, fixedRng, idle, placeAt, play } from './helpers.ts';
import type { Game } from '../game.ts';

function inRift(start = 1): Game {
  const g = play('toby', 'village');
  g.save.flags.rift_open = true;
  g.save.riftBest = 30;
  assert.equal(startRun(g, start), true);
  clearField(g);
  g.rng = fixedRng();
  return g;
}

/** 수호자를 바로 불러 쓰러뜨린다 */
function clearFloor(g: Game): void {
  g.world.rift!.gauge = 100;
  idle(g, 0.05);
  const guard = g.world.monsters.find((m) => m.guardian)!;
  guard.spawnLeft = 0;
  guard.hp = 0;
  idle(g, 0.05);
}

describe('균열 한 판', () => {
  test('체크포인트: 5층마다 (1, 6, 11 …), 가장 깊이 간 곳까지만', () => {
    assert.deepEqual(checkpoints(0), [1]);
    assert.deepEqual(checkpoints(4), [1]);
    assert.deepEqual(checkpoints(5), [1, 6]);
    assert.deepEqual(checkpoints(12), [1, 6, 11]);
    assert.equal(checkpoints(50).at(-1), 46);
  });

  test('체크포인트가 아닌 층이나 아직 못 간 층에서는 시작할 수 없다', () => {
    const g = play('toby', 'village');
    g.save.flags.rift_open = true;
    g.save.riftBest = 7;
    assert.equal(startRun(g, 3), false);
    assert.equal(startRun(g, 11), false);
    assert.equal(startRun(g, 6), true);
    assert.equal(g.run?.depth, 6);
    assert.deepEqual(g.run?.blessings, []);
    assert.equal(g.world.rift?.depth, 6);
  });

  test('수호자를 쓰러뜨리면 서로 다른 축복 카드 셋을 내민다', () => {
    const g = inRift();
    clearFloor(g);
    const offer = g.run!.offer!;
    assert.equal(offer.length, 3);
    assert.equal(new Set(offer).size, 3);
    for (const b of offer) assert.ok(BLESSINGS[b]);
  });

  test('축복을 고르면 이번 판 동안 능력이 오른다', () => {
    const g = inRift();
    clearFloor(g);
    g.run!.offer = ['atk', 'hp', 'ms'];
    const atk = g.stats.atk;
    assert.equal(chooseBlessing(g, 0), true);
    assert.equal(g.run!.offer, null);
    assert.ok(g.stats.atk > atk * 1.1);
    assert.equal(chooseBlessing(g, 0), false, '이미 골랐다');
  });

  test('다음 층으로 가면 깊이가 하나 늘고 축복은 그대로', () => {
    const g = inRift();
    clearFloor(g);
    g.run!.offer = ['atk', 'hp', 'ms'];
    chooseBlessing(g, 0);
    assert.equal(nextFloor(g), true);
    assert.equal(g.world.rift?.depth, 2);
    assert.equal(g.run!.depth, 2);
    assert.deepEqual(g.run!.blessings, ['atk']);
  });

  test('축복을 고르기 전에는 다음 층으로 갈 수 없다', () => {
    const g = inRift();
    clearFloor(g);
    assert.equal(nextFloor(g), false);
  });

  test('전설 능력 카드는 이번 판 동안 그 능력을 빌려 준다', () => {
    const g = inRift();
    clearFloor(g);
    g.run!.offer = ['power:shockwave', 'hp', 'ms'];
    assert.equal(hasPower(g, 'shockwave'), false);
    chooseBlessing(g, 0);
    assert.equal(hasPower(g, 'shockwave'), true);
  });

  test('판을 끝내면 마을로 돌아가고 축복은 사라진다', () => {
    const g = inRift();
    clearFloor(g);
    g.run!.offer = ['atk', 'hp', 'ms'];
    chooseBlessing(g, 0);
    const atk = g.stats.atk;
    endRun(g);
    assert.equal(g.run, null);
    assert.equal(g.world.map.id, 'village');
    assert.ok(g.stats.atk < atk);
  });

  test('균열에서 쓰러지면 판이 끝난다', () => {
    const g = inRift();
    g.save.hp = 1;
    const m = placeAt(g, 'dustknight', 10, 0, 30);
    m.atk = 1e6;
    for (let i = 0; i < 400 && g.world.map.id === 'rift'; i++) step(g, 1 / 60, NO_INPUT);
    assert.equal(g.world.map.id, 'village');
    assert.equal(g.run, null);
  });
});

describe('층 규칙', () => {
  test('보스 층에는 규칙이 없고, 다른 층에는 규칙 목록 중 하나가 붙는다', () => {
    const g = inRift(1);
    assert.ok(RULES[g.world.rift!.rule]);
    const b = inRift(1);
    b.save.riftBest = 30;
    b.run!.depth = 4;
    clearFloor(b);
    b.run!.offer = ['atk', 'hp', 'ms'];
    chooseBlessing(b, 0);
    nextFloor(b);
    assert.equal(b.world.rift!.depth, 5);
    assert.equal(b.world.rift!.rule, 'none');
  });

  test('무리 규칙: 사냥터마다 몬스터가 더 많다', () => {
    const g = inRift(1);
    const base = g.world.map.spawns.map((s) => s.max);
    clearFloor(g);
    chooseBlessing(g, 0);
    nextFloor(g, 'swarm');
    assert.ok(g.world.map.spawns.every((s, i) => s.max > (base[i] ?? 4) - 1));
    assert.ok(g.world.map.spawns[0].max >= 6);
  });

  test('아슬아슬 규칙: 받는 피해가 늘지만 골드를 더 준다', () => {
    const g = inRift(1);
    clearFloor(g);
    chooseBlessing(g, 0);
    nextFloor(g, 'fragile');
    assert.ok(g.world.mods.taken > 1);
    assert.ok(g.world.mods.reward > 1);
  });
});
