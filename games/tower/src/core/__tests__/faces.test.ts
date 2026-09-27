import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem, BOSSES } from '../data.ts';
import { applyItem, buyItem, canBuy, createGame, moveWeapon, selectFace, spawnFromRoad, step, type GameState } from '../game.ts';
import { FACES, faceOf, inArc, mainFace, makePlan, roadStart, type Face, type WavePlan } from '../faces.ts';
import { createRng } from '../rng.ts';
import { directionalGame, dummyDef, placeAt } from './helpers.ts';

/** 한 길로만 오는 예보 */
function only(face: Face): WavePlan {
  return { n: 0, e: 0, s: 0, w: 0, [face]: 1 };
}

function give(s: GameState, id: string, face: Face, n = 1): void {
  selectFace(s, face);
  for (let i = 0; i < n; i++) applyItem(s, findItem(id));
}

describe('방향 계산', () => {
  test('탑에서 본 방향이 가장 가까운 면', () => {
    assert.equal(faceOf(0, -10), 'n');
    assert.equal(faceOf(10, 0), 'e');
    assert.equal(faceOf(0, 10), 's');
    assert.equal(faceOf(-10, 0), 'w');
    assert.equal(faceOf(10, -3), 'e');
  });

  test('120° 부채꼴: 정면에서 60° 까지는 안, 그보다 벗어나면 밖', () => {
    const at = (deg: number) => [Math.cos((deg * Math.PI) / 180) * 100, Math.sin((deg * Math.PI) / 180) * 100] as const;
    assert.equal(inArc('e', ...at(0), 120), true);
    assert.equal(inArc('e', ...at(59), 120), true);
    assert.equal(inArc('e', ...at(-59), 120), true);
    assert.equal(inArc('e', ...at(61), 120), false);
    assert.equal(inArc('e', ...at(180), 120), false);
    // 북쪽은 화면 위 (y 가 작아지는 쪽)
    assert.equal(inArc('n', ...at(-90), 120), true);
    assert.equal(inArc('n', ...at(90), 120), false);
  });

  test('대각선(45°)은 이웃한 두 면이 함께 맡는다', () => {
    assert.equal(inArc('n', 50, -50, 120), true);
    assert.equal(inArc('e', 50, -50, 120), true);
    assert.equal(inArc('s', 50, -50, 120), false);
    assert.equal(inArc('w', 50, -50, 120), false);
  });

  test('길 시작점은 화면 가장자리 가운데', () => {
    const s = directionalGame();
    const { width, height } = s.config;
    assert.deepEqual(roadStart(s.config, 'n'), { x: width / 2, y: 0 });
    assert.deepEqual(roadStart(s.config, 'e'), { x: width, y: height / 2 });
    assert.deepEqual(roadStart(s.config, 's'), { x: width / 2, y: height });
    assert.deepEqual(roadStart(s.config, 'w'), { x: 0, y: height / 2 });
  });
});

describe('무기는 자기 면이 바라보는 쪽만 쏜다', () => {
  test('동쪽 면 돌팔매는 동쪽 적은 맞히고 서쪽 적은 못 맞힌다', () => {
    const s = directionalGame();
    give(s, 'sling', 'e');
    const east = placeAt(s, 60, 0);
    const west = placeAt(s, -40, 0);
    step(s, 0.01);
    assert.equal(east.hp, 80);
    assert.equal(west.hp, 100);
  });

  test('부채꼴 밖의 적이 더 가까워도 부채꼴 안의 적을 노린다', () => {
    const s = directionalGame();
    give(s, 'sling', 'n');
    const south = placeAt(s, 0, 30);
    const north = placeAt(s, 0, -90);
    step(s, 0.01);
    assert.equal(north.hp, 80);
    assert.equal(south.hp, 100);
  });

  test('부채꼴 밖에만 적이 있으면 쏘지 않고 공격 주기도 쓰지 않는다', () => {
    const s = directionalGame();
    give(s, 'sling', 'w');
    const east = placeAt(s, 60, 0);
    step(s, 2);
    assert.equal(east.hp, 100);
    const west = placeAt(s, -60, 0);
    step(s, 0.01);
    assert.equal(west.hp, 80);
  });

  test('부채꼴 경계: 정면에서 60° 안쪽은 맞고 바깥쪽은 안 맞는다', () => {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const hitAt = (deg: number) => {
      const s = directionalGame();
      give(s, 'sling', 'e');
      const e = placeAt(s, Math.cos(rad(deg)) * 80, Math.sin(rad(deg)) * 80);
      step(s, 0.01);
      return e.hp < 100;
    };
    assert.equal(hitAt(58), true);
    assert.equal(hitAt(62), false);
  });

  test('네 면에 하나씩 달면 사방의 적을 모두 맞힌다', () => {
    const s = directionalGame();
    // 같은 무기 셋은 합쳐지니 서로 다른 무기로
    const ids = ['sling', 'twin_daggers', 'battle_axe', 'longbow'];
    FACES.forEach((f, i) => give(s, ids[i], f));
    const enemies = [placeAt(s, 0, -60), placeAt(s, 60, 0), placeAt(s, 0, 60), placeAt(s, -60, 0)];
    step(s, 0.01);
    for (const e of enemies) assert.ok(e.hp < 100);
  });
});

describe('면 고르기와 무기 칸', () => {
  test('산 무기는 지금 고른 면에 붙는다', () => {
    const s = directionalGame();
    selectFace(s, 's');
    applyItem(s, findItem('sling'));
    selectFace(s, 'w');
    applyItem(s, findItem('mortar'));
    assert.deepEqual(s.weapons.map((w) => [w.def.id, w.face]), [['sling', 's'], ['mortar', 'w']]);
  });

  test('면마다 무기 칸은 3개: 꽉 찬 면에는 못 사고, 다른 면을 고르면 살 수 있다', () => {
    const s = directionalGame({ economy: { startGold: 10000 } });
    give(s, 'sling', 'e');
    give(s, 'mortar', 'e');
    give(s, 'longbow', 'e');
    s.shop = [findItem('chain_bolt'), null, null, null];
    assert.deepEqual(canBuy(s, 0), { ok: false, reason: 'slots' });
    selectFace(s, 'n');
    assert.equal(buyItem(s, 0), true);
    assert.equal(s.weapons.at(-1)!.face, 'n');
  });

  test('꽉 찬 면이라도 사자마자 합쳐지는 무기는 살 수 있다', () => {
    const s = directionalGame({ economy: { startGold: 10000 } });
    give(s, 'sling', 'e', 2);
    give(s, 'mortar', 'e');
    s.shop = [findItem('sling'), null, null, null];
    assert.equal(buyItem(s, 0), true);
    assert.deepEqual(s.weapons.map((w) => [w.def.id, w.level, w.face]), [['mortar', 1, 'e'], ['sling', 2, 'e']]);
  });

  test('합쳐진 무기는 재료가 가장 많이 있던 면에 남는다', () => {
    const s = directionalGame();
    give(s, 'sling', 'w', 2);
    give(s, 'sling', 'n');
    assert.deepEqual(s.weapons.map((w) => [w.level, w.face]), [[2, 'w']]);
  });

  test('재료가 면마다 하나씩이면 방금 산 무기의 면에 남는다', () => {
    const s = directionalGame();
    give(s, 'sling', 'w');
    give(s, 'sling', 'e');
    give(s, 'sling', 's');
    assert.deepEqual(s.weapons.map((w) => [w.level, w.face]), [[2, 's']]);
  });
});

describe('무기 옮기기 (공짜지만 3초 동안 쏘지 않는다)', () => {
  test('다른 면으로 옮기면 그 면 쪽을 쏜다', () => {
    const s = directionalGame();
    give(s, 'sling', 'e');
    assert.equal(moveWeapon(s, 0, 'w'), true);
    assert.equal(s.weapons[0].face, 'w');
  });

  test('옮긴 뒤 3초 동안은 쏘지 않고, 3초가 지나면 쏜다', () => {
    const s = directionalGame();
    give(s, 'sling', 'e');
    moveWeapon(s, 0, 'w');
    const west = placeAt(s, -60, 0);
    step(s, 2.9);
    assert.equal(west.hp, 100);
    step(s, 0.2);
    assert.equal(west.hp, 80);
  });

  test('같은 면으로는 옮기지 않는다 (쉬는 시간도 생기지 않음)', () => {
    const s = directionalGame();
    give(s, 'sling', 'e');
    assert.equal(moveWeapon(s, 0, 'e'), false);
    const east = placeAt(s, 60, 0);
    step(s, 0.01);
    assert.equal(east.hp, 80);
  });

  test('꽉 찬 면으로는 옮길 수 없다', () => {
    const s = directionalGame();
    give(s, 'sling', 'n');
    give(s, 'mortar', 'e');
    give(s, 'longbow', 'e');
    give(s, 'chain_bolt', 'e');
    assert.equal(moveWeapon(s, 0, 'e'), false);
    assert.equal(s.weapons[0].face, 'n');
  });

  test('없는 무기 번호나 끝난 판에서는 옮기지 않는다', () => {
    const s = directionalGame();
    assert.equal(moveWeapon(s, 0, 'e'), false);
    give(s, 'sling', 'n');
    s.status = 'lost';
    assert.equal(moveWeapon(s, 0, 'e'), false);
  });
});

describe('라운드별 방향 예보', () => {
  const share = (p: WavePlan) => FACES.map((f) => p[f]).filter((v) => v > 0).sort((a, b) => b - a);

  test('1~3라운드는 한 길로만, 세 라운드 모두 같은 길', () => {
    const s = directionalGame();
    const rng = createRng(3);
    const r1 = makePlan(s.config, 1, rng, null);
    const r2 = makePlan(s.config, 2, rng, r1);
    const r3 = makePlan(s.config, 3, rng, r2);
    assert.deepEqual(share(r1), [1]);
    assert.deepEqual(r2, r1);
    assert.deepEqual(r3, r1);
  });

  test('4~9라운드는 두 길로 60% · 40%', () => {
    const s = directionalGame();
    const rng = createRng(5);
    let prev: WavePlan | null = null;
    for (let r = 4; r <= 9; r++) {
      prev = makePlan(s.config, r, rng, prev);
      assert.deepEqual(share(prev), [0.6, 0.4]);
    }
  });

  test('10라운드부터는 네 길 모두, 한 길이 40%', () => {
    const s = directionalGame();
    const p = makePlan(s.config, 10, createRng(7), null);
    assert.deepEqual(share(p).map((v) => Math.round(v * 100)), [40, 20, 20, 20]);
  });

  test('두 길 구간: 새 길은 40% 로 먼저 오고, 다음 라운드에 60% 가 된다 (갑자기 바뀌지 않게)', () => {
    const s = directionalGame();
    const rng = createRng(11);
    let prev = makePlan(s.config, 3, rng, null);
    const first = mainFace(prev);
    const r4 = makePlan(s.config, 4, rng, prev);
    assert.equal(r4[first], 0.6, '4라운드: 지금까지 오던 길이 여전히 60%');
    const newcomer = FACES.find((f) => r4[f] === 0.4)!;
    assert.notEqual(newcomer, first);
    prev = r4;
    for (let r = 5; r <= 9; r++) {
      const next = makePlan(s.config, r, rng, prev);
      const risingBefore = FACES.find((f) => prev[f] === 0.4)!;
      assert.equal(next[risingBefore], 0.6, `${r}라운드: 앞에서 40% 였던 길이 60% 가 된다`);
      const fresh = FACES.find((f) => next[f] === 0.4)!;
      assert.equal(prev[fresh], 0, `${r}라운드: 40% 로 오는 길은 새 길`);
      prev = next;
    }
  });

  test('네 길 구간: 가장 많이 오는 길이 앞 라운드와 달라진다', () => {
    const s = directionalGame();
    const rng = createRng(13);
    let prev = makePlan(s.config, 10, rng, null);
    for (let r = 11; r <= 30; r++) {
      const next = makePlan(s.config, r, rng, prev);
      assert.notEqual(mainFace(next), mainFace(prev), `${r}라운드`);
      prev = next;
    }
  });

  test('예보한 다음 라운드 방향이 실제로 그 라운드의 방향이 된다', () => {
    const s = createGame({ seed: 9, config: { waves: { baseCount: 0, countPerRound: 0 }, rewards: { every: 0 } } });
    for (let r = 1; r <= 12; r++) {
      const forecast = s.nextPlan;
      step(s, s.config.roundSeconds - s.roundTime);
      assert.equal(s.round, r + 1);
      assert.deepEqual(s.plan, forecast);
    }
  });

  test('처음 고른 면은 1라운드에 적이 오는 길이라 시작 무기가 그쪽을 본다', () => {
    for (const seed of [1, 2, 3, 4]) {
      const s = createGame({ seed });
      assert.equal(s.face, mainFace(s.plan));
      assert.equal(s.weapons[0].face, mainFace(s.plan));
    }
  });
});

describe('적은 예보한 길에서 나온다', () => {
  test('한 길로만 오는 라운드는 모든 땅 적이 그 길 끝(길 폭 안)에서 나온다', () => {
    const s = createGame({ seed: 2, config: { startWeapons: [], rewards: { every: 0 } } });
    s.plan = only('w');
    step(s, 15);
    const cy = s.config.height / 2;
    const ground = s.enemies.filter((e) => e.def.ability !== 'flying');
    assert.ok(ground.length > 3);
    for (const e of ground) {
      assert.ok(e.x < s.tower.x, '서쪽 반에 있다');
      assert.ok(Math.abs(e.y - cy) <= s.config.waves.roadJitter + 1e-9, '길 폭 안');
    }
  });

  test('나눠 오는 라운드는 예보 비율에 가깝게 나뉜다', () => {
    const s = directionalGame({}, 4);
    s.plan = { n: 0.6, e: 0, s: 0.4, w: 0 };
    const spawned = Array.from({ length: 500 }, () => spawnFromRoad(s, dummyDef()));
    const north = spawned.filter((e) => e.y === 0).length;
    const south = spawned.filter((e) => e.y === s.config.height).length;
    assert.equal(north + south, 500, '동서 길에서는 안 나온다');
    const ratio = north / 500;
    assert.ok(ratio > 0.53 && ratio < 0.67, `북쪽 비율 ${ratio}`);
  });

  test('날아다니는 적은 그 길 쪽 가장자리 여기저기서 비스듬히 나오지만, 늘 그 길의 방향(45° 안)에 있다', () => {
    const s = directionalGame();
    s.plan = only('n');
    const bat = dummyDef({ ability: 'flying' });
    const xs: number[] = [];
    for (let i = 0; i < 60; i++) {
      const e = spawnFromRoad(s, bat);
      assert.equal(e.y, 0);
      assert.equal(faceOf(e.x - s.tower.x, e.y - s.tower.y), 'n');
      xs.push(e.x);
    }
    assert.ok(Math.max(...xs) - Math.min(...xs) > s.config.height * 0.6, '길 폭보다 훨씬 넓게 퍼진다');
    s.plan = only('e');
    for (let i = 0; i < 60; i++) {
      const e = spawnFromRoad(s, bat);
      assert.equal(e.x, s.config.width);
      assert.equal(faceOf(e.x - s.tower.x, e.y - s.tower.y), 'e');
    }
  });

  test('보스는 그 라운드에 가장 많이 오는 길에서 나온다', () => {
    const s = createGame({ seed: 6, config: { startWeapons: [], rewards: { every: 0 }, waves: { baseCount: 0, countPerRound: 0 } } });
    s.round = s.config.totalRounds - 1;
    s.roundTime = 0;
    s.nextPlan = only('s');
    step(s, s.config.roundSeconds);
    const boss = s.enemies.find((e) => e.isBoss)!;
    assert.ok(BOSSES.some((b) => b.id === boss.def.id));
    assert.equal(boss.x, s.config.width / 2);
    assert.equal(boss.y, s.config.height);
  });
});

