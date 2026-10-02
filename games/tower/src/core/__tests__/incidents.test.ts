import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, makeConfig } from '../config.ts';
import { ELITE, BOSS, findEnemy } from '../data.ts';
import { FACES, mainFace } from '../faces.ts';
import { createGame, step, type GameState } from '../game.ts';
import { INCIDENT, INCIDENTS, OFFICER, rollIncident, type IncidentId } from '../incidents.ts';
import { createRng } from '../rng.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

const ALL = Object.keys(INCIDENTS) as IncidentId[];

/** 다음 라운드로 넘긴다 */
function nextRound(s: GameState): void {
  step(s, s.config.roundSeconds - s.roundTime + 1e-6);
}

describe('라운드 사건 고르기', () => {
  const always = makeConfig({ incidents: { chance: 1 } });

  test('1라운드 · 부관(5·10) · 장수(15) 라운드에는 사건이 없다', () => {
    const rng = createRng(1);
    for (const r of [1, 5, 10, 15]) assert.equal(rollIncident(always, r, 'classic', rng, null), null, `${r}라운드`);
  });

  test('확률이 0 이면 없고, 1 이면 나올 수 있는 사건 중 하나', () => {
    const rng = createRng(2);
    assert.equal(rollIncident(makeConfig({ incidents: { chance: 0 } }), 7, 'classic', rng, null), null);
    for (let r = 2; r <= 14; r++) {
      if (r % 5 === 0) continue;
      const id = rollIncident(always, r, 'classic', rng, null);
      assert.ok(id && INCIDENTS[id].minRound <= r, `${r}라운드: ${id}`);
    }
  });

  test('같은 사건이 두 라운드 연달아 나오지 않는다', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const prev = ALL[i % ALL.length];
      const id = rollIncident(always, 12, 'classic', rng, prev);
      assert.notEqual(id, prev);
    }
  });

  test('여러 판을 돌면 여섯 사건이 모두 나온다', () => {
    const rng = createRng(4);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(rollIncident(always, 12, 'classic', rng, null)!);
    assert.deepEqual([...seen].sort(), [...ALL].sort());
  });
});

describe('사건 예보와 시작', () => {
  test('다음 라운드 사건은 미리 정해져 있고(예보), 그 라운드가 되면 지금 사건이 되며 알림이 나온다', () => {
    const s = createGame({ seed: 5, config: { incidents: { chance: 1 } } });
    assert.equal(s.incident, null);
    const planned = s.nextIncident;
    assert.ok(planned);
    s.events = [];
    nextRound(s);
    assert.equal(s.round, 2);
    assert.equal(s.incident, planned);
    assert.ok(s.events.some((e) => e.kind === 'incident' && e.id === planned));
  });

  test('협공이 예보되면 다음 라운드 길이 마주 보는 두 길로 반반', () => {
    for (let seed = 1; seed < 400; seed++) {
      const s = createGame({ seed, config: { incidents: { chance: 1 } } });
      for (let r = 0; r < 12 && s.nextIncident !== 'pincer'; r++) nextRound(s);
      if (s.nextIncident !== 'pincer') continue;
      const roads = FACES.filter((f) => s.nextPlan[f] > 0);
      assert.equal(roads.length, 2);
      assert.equal(s.nextPlan[roads[0]], 0.5);
      const opposite = { n: 's', s: 'n', e: 'w', w: 'e' } as const;
      assert.equal(opposite[roads[0]], roads[1], '마주 보는 두 길');
      return;
    }
    assert.fail('협공이 한 번도 안 나옴');
  });
});

describe('사건의 효과', () => {
  function roundWith(id: IncidentId, round = 9, count = 40): GameState {
    const s = quietGame({ waves: { baseCount: count, countPerRound: 0 } });
    s.round = round;
    s.incident = id;
    // 라운드 내내 다 나오게
    step(s, s.config.roundSeconds * 0.95);
    return s;
  }

  test('박쥐 떼: 나오는 적 중 적어도 절반이 박쥐', () => {
    const s = roundWith('bats');
    const bats = s.enemies.filter((e) => e.def.id === 'bat').length;
    assert.ok(bats >= s.enemies.length * INCIDENT.batShare * 0.7, `${bats}/${s.enemies.length}`);
  });

  test('도둑 습격: 도둑이 많이 나온다', () => {
    const s = roundWith('thieves');
    const thieves = s.enemies.filter((e) => e.def.id === 'thief').length;
    assert.ok(thieves >= s.enemies.length * INCIDENT.thiefShare * 0.6, `${thieves}/${s.enemies.length}`);
  });

  test('골렘 행진: 수는 줄고, 튼튼한 적(골렘·방패병·오크)만 나온다', () => {
    const s = roundWith('golems');
    assert.ok(s.enemies.length <= Math.ceil(40 * INCIDENT.golemCountMul) + 1, `${s.enemies.length}`);
    for (const e of s.enemies) assert.ok(INCIDENT.golemPool.includes(e.def.id), e.def.id);
  });

  test('협공: 적이 더 많이 나온다', () => {
    const s = roundWith('pincer');
    assert.ok(s.enemies.length >= Math.floor(40 * INCIDENT.pincerCountMul) - 1, `${s.enemies.length}`);
  });

  test('황금 웨이브: 현상금 두 배', () => {
    const s = quietGame();
    s.incident = 'gold';
    const gold = s.gold;
    placeAt(s, 30, 0, dummyDef({ hp: 1, bounty: 10 })).hp = 0;
    step(s, 0.01);
    assert.equal(s.gold - gold, 10 * INCIDENT.goldMul);
  });

  test('짙은 안개: 무기 사거리가 줄어 원래 사거리 끝의 적을 못 쏜다', () => {
    const run = (fog: boolean) => {
      const s = quietGame({ startWeapons: ['sling'] });
      if (fog) s.incident = 'fog';
      const range = 120; // 돌팔매 사거리
      const e = placeAt(s, range - 8, 0, dummyDef({ hp: 1000 }));
      step(s, 0.05);
      return e.hp;
    };
    assert.ok(run(false) < 1000, '안개가 없으면 맞는다');
    assert.equal(run(true), 1000, '안개 속에서는 닿지 않는다');
  });
});

describe('중간 장수 (부관)', () => {
  function toRound(r: number, mode: 'classic' | 'endless' = 'classic'): GameState {
    const s = createGame({ seed: 7, mode, config: { waves: { baseCount: 0, countPerRound: 0 }, incidents: { chance: 0 }, rewards: { every: 0 }, route: { every: 0 } } });
    while (s.round < r) {
      // 지나가는 라운드의 부관은 치워 둔다 (탑이 쓰러지거나 보상 카드에 멈추지 않게)
      s.enemies = [];
      nextRound(s);
      assert.equal(s.status, 'playing');
      assert.equal(s.choice, null);
    }
    return s;
  }

  test('5·10라운드에는 정예 대신 부관이 나온다: 장수의 기술을 쓰지만 장수는 아니다', () => {
    for (const r of [5, 10]) {
      const s = toRound(r);
      const officers = s.enemies.filter((e) => e.isOfficer);
      assert.equal(officers.length, 1, `${r}라운드`);
      const o = officers[0];
      assert.equal(o.isBoss, false);
      assert.equal(o.isElite, false);
      assert.ok(o.pattern, '장수 기술');
      assert.ok(s.enemies.every((e) => !e.isElite), '정예는 없다');
    }
  });

  test('부관은 정예보다 훨씬 튼튼하고 장수보다는 훨씬 약하다', () => {
    const s = toRound(5);
    const o = s.enemies.find((e) => e.isOfficer)!;
    const orc = findEnemy('orc');
    const eliteHp = orc.hp * s.config.waves.hpGrowth ** 4 * ELITE.hpMul;
    assert.ok(o.maxHp >= eliteHp * 2, `${o.maxHp} vs 정예 ${eliteHp}`);
    assert.ok(o.maxHp <= BOSS.hp * 0.1);
    assert.equal(o.maxHp, eliteHp * OFFICER.eliteMul);
  });

  test('부관을 잡으면 판은 이어지고 보상 카드가 나온다', () => {
    const s = toRound(5);
    const o = s.enemies.find((e) => e.isOfficer)!;
    s.events = [];
    o.hp = 0;
    step(s, 0.01);
    assert.equal(s.status, 'playing');
    assert.ok(s.choice, '보상 카드');
  });

  test('부관이 나오면 알림, 15라운드에는 장수가 그대로', () => {
    const s = toRound(4);
    s.events = [];
    nextRound(s);
    assert.ok(s.events.some((e) => e.kind === 'officer'));
    const late = toRound(15);
    assert.ok(late.enemies.some((e) => e.isBoss));
  });

  test('무한 모드도 장수 라운드가 아닌 5의 배수에 부관', () => {
    const s = toRound(20, 'endless');
    assert.ok(s.enemies.some((e) => e.isOfficer));
  });

  test('설정 기본값: 사건 확률은 절반 안쪽', () => {
    assert.ok(DEFAULT_CONFIG.incidents.chance > 0 && DEFAULT_CONFIG.incidents.chance < 0.6);
    assert.equal(mainFace({ n: 1, e: 0, s: 0, w: 0 }), 'n');
  });
});
