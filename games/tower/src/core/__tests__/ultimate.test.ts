import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, type GameState } from '../game.ts';
import { meteorDamage } from '../skills.ts';
import { COMBO, DICE, ULT, gainUlt, tapAttack, tapDamage, ultDamage, ultimateFor, useUltimate } from '../ultimate.ts';
import type { HeroId } from '../heroes.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

function heroGame(hero: HeroId | null, seed = 1): GameState {
  const s = quietGame({}, seed);
  s.hero = hero;
  return s;
}

describe('궁극기 게이지', () => {
  test('처음엔 비어 있고, 적을 잡으면 찬다 (정예·장수는 더 많이)', () => {
    const s = quietGame();
    assert.equal(s.ult, 0);
    placeAt(s, 30, 0, dummyDef({ hp: 1 })).hp = 0;
    step(s, 0.01);
    assert.equal(s.ult, ULT.perKill);
    const elite = placeAt(s, 30, 0, dummyDef({ hp: 1 }));
    elite.isElite = true;
    elite.hp = 0;
    step(s, 0.01);
    assert.equal(s.ult, ULT.perKill + ULT.perElite);
  });

  test('탑이 맞으면 맞은 만큼(최대 체력 대비) 찬다', () => {
    const s = quietGame();
    const hit = s.tower.maxHp * 0.1;
    placeAt(s, 0, 0, dummyDef({ atk: hit, atkInterval: 10 }));
    s.tower.armor = 0;
    step(s, 0.01);
    assert.ok(Math.abs(s.ult - 0.1 * ULT.perHpLost) < 1e-6, `${s.ult}`);
  });

  test('가득(ULT.max) 넘게는 차지 않는다', () => {
    const s = quietGame();
    gainUlt(s, ULT.max * 3);
    assert.equal(s.ult, ULT.max);
  });

  test('다 차지 않았으면 쓸 수 없고, 쓰면 비워진다', () => {
    const s = heroGame('mage');
    gainUlt(s, ULT.max - 1);
    assert.equal(useUltimate(s), false);
    gainUlt(s, 1);
    assert.equal(useUltimate(s), true);
    assert.equal(s.ult, 0);
    assert.ok(s.events.some((e) => e.kind === 'ultimate' && e.id === 'starfall'));
  });

  test('탑마다 궁극기가 다르다 (탑을 고르지 않았으면 등불)', () => {
    const ids = (['guardian', 'archer', 'mage', 'fortress', 'gambler', null] as const).map((h) => ultimateFor(h).id);
    assert.deepEqual(ids, ['gate', 'volley', 'starfall', 'barrage', 'dice', 'lantern']);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('궁극기 피해는 라운드가 오를수록 세진다 (메테오 기준)', () => {
    const s = quietGame();
    const r1 = ultDamage(s);
    s.round = 10;
    assert.ok(ultDamage(s) > r1);
    assert.equal(ultDamage(s), meteorDamage(s) * ULT.damageMul);
  });
});

describe('탑별 궁극기', () => {
  function full(s: GameState): void {
    gainUlt(s, ULT.max);
  }

  test('수호탑 성문 닫기: 붙어 있던 땅 적을 밀쳐내고, 잠시 받는 피해가 크게 준다', () => {
    const s = heroGame('guardian');
    const e = placeAt(s, 20, 0, dummyDef({ atk: 100, atkInterval: 0.5 }));
    s.tower.armor = 0;
    // 성문 닫기 전 한 대의 피해 (수호탑 고유 능력 포함)
    let hp = s.tower.hp;
    step(s, 0.01);
    const normal = hp - s.tower.hp;
    assert.ok(normal > 0);
    full(s);
    useUltimate(s);
    assert.ok(Math.hypot(e.x - s.tower.x, e.y - s.tower.y) >= ULT.gatePush - 1e-6, '밀려났다');
    // 다시 다가와 때려도 피해가 줄어 있다
    e.x = s.tower.x + 20;
    e.y = s.tower.y;
    e.attackCooldown = 0;
    hp = s.tower.hp;
    step(s, 0.01);
    assert.ok(Math.abs(hp - s.tower.hp - normal * ULT.gateMul) < 1e-6, `${hp - s.tower.hp}`);
    // 시간이 지나면 풀린다
    step(s, ULT.gateSeconds);
    assert.equal(s.gateLeft, 0);
  });

  test('궁수탑 별빛 일제 사격: 네 길 위의 적은 모두 맞고, 길에서 벗어난 적은 안 맞는다', () => {
    const s = heroGame('archer');
    const onRoads = [placeAt(s, 200, 3, dummyDef({ hp: 1e6 })), placeAt(s, -150, -5, dummyDef({ hp: 1e6 })), placeAt(s, 0, 120, dummyDef({ hp: 1e6 })), placeAt(s, 4, -100, dummyDef({ hp: 1e6 }))];
    const off = placeAt(s, 90, 90, dummyDef({ hp: 1e6 }));
    full(s);
    useUltimate(s);
    for (const e of onRoads) assert.ok(e.hp < 1e6, '길 위');
    assert.equal(off.hp, 1e6, '대각선');
  });

  test('마법탑 별 부르기: 모든 적이 맞고 잠깐 멈춘다 (장수는 더 짧게)', () => {
    const s = heroGame('mage');
    const a = placeAt(s, 200, 50, dummyDef({ hp: 1e6, speed: 30 }));
    const boss = placeAt(s, -100, 30, dummyDef({ hp: 1e6, speed: 30 }));
    boss.isBoss = true;
    full(s);
    useUltimate(s);
    assert.ok(a.hp < 1e6 && boss.hp < 1e6);
    assert.equal(a.slowFactor, 0);
    assert.equal(a.slowTimeLeft, ULT.stunSeconds);
    assert.equal(boss.slowTimeLeft, ULT.bossStunSeconds);
  });

  test('요새 포대 일제 사격: 고른 면 쪽만 크게 터진다', () => {
    const s = heroGame('fortress');
    s.face = 'e';
    const east = placeAt(s, 140, 0, dummyDef({ hp: 1e6 }));
    const west = placeAt(s, -140, 0, dummyDef({ hp: 1e6 }));
    full(s);
    useUltimate(s);
    assert.ok(east.hp < 1e6);
    assert.equal(west.hp, 1e6);
  });

  test('도박탑 운명의 주사위: 굴린 눈(1~6)에 따라 피해 배율, 1 이면 대신 골드', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const s = heroGame('gambler', seed);
      const e = placeAt(s, 100, 0, dummyDef({ hp: 1e9 }));
      const gold = s.gold;
      full(s);
      useUltimate(s);
      const ev = s.events.find((x) => x.kind === 'ultimate');
      assert.ok(ev && ev.kind === 'ultimate' && ev.roll !== undefined);
      const roll = ev.roll!;
      seen.add(roll);
      assert.ok(roll >= 1 && roll <= 6);
      const dealt = 1e9 - e.hp;
      assert.ok(Math.abs(dealt - ultDamage(s) * DICE.mul[roll - 1]) < 1e-3, `눈 ${roll}: ${dealt}`);
      if (roll === 1) assert.equal(s.gold, gold + DICE.consolationGold);
    }
    assert.ok(seen.size >= 4, '여러 눈이 나온다');
  });

  test('탑을 고르지 않은 판은 등불: 모든 적이 맞는다', () => {
    const s = heroGame(null);
    const a = placeAt(s, 200, 50, dummyDef({ hp: 1e6 }));
    full(s);
    useUltimate(s);
    assert.ok(a.hp < 1e6);
  });
});

describe('직접 때리기 (전장을 눌러)', () => {
  test('누른 곳 가까이 있는 적을 약하게 때리고 게이지가 조금 찬다', () => {
    const s = quietGame();
    const e = placeAt(s, 100, 0, dummyDef({ hp: 1000 }));
    assert.equal(tapAttack(s, { x: s.tower.x + 104, y: s.tower.y + 3 }), true);
    assert.equal(1000 - e.hp, tapDamage(s));
    assert.equal(s.ult, ULT.perTap);
  });

  test('빗나가면(근처에 적이 없으면) 아무 일 없다', () => {
    const s = quietGame();
    placeAt(s, 100, 0, dummyDef({ hp: 1000 }));
    assert.equal(tapAttack(s, { x: s.tower.x - 100, y: s.tower.y }), false);
    assert.equal(s.ult, 0);
  });

  test('연타는 막는다: 재사용 대기 동안은 다시 때리지 못한다', () => {
    const s = quietGame();
    const e = placeAt(s, 100, 0, dummyDef({ hp: 1000 }));
    const p = { x: s.tower.x + 100, y: s.tower.y };
    tapAttack(s, p);
    assert.equal(tapAttack(s, p), false);
    step(s, ULT.tapCooldown + 0.01);
    assert.equal(tapAttack(s, p), true);
    assert.equal(1000 - e.hp, tapDamage(s) * 2);
  });

  test('라운드가 오르면 조금 세지지만, 무기보다 약하다 (돌팔매 한 발보다 작다)', () => {
    const s = quietGame();
    const r1 = tapDamage(s);
    s.round = 15;
    assert.ok(tapDamage(s) > r1);
    assert.ok(r1 < 20, '돌팔매 기본 피해 20 보다 약하다');
  });
});

describe('연속 처치 콤보', () => {
  function kill(s: GameState): void {
    placeAt(s, 30, 0, dummyDef({ hp: 1, bounty: 0 })).hp = 0;
    step(s, 0.01);
  }

  test('정해진 시간 안에 이어 잡으면 콤보가 쌓이고, 늦으면 다시 1부터', () => {
    const s = quietGame();
    kill(s);
    kill(s);
    kill(s);
    assert.equal(s.combo.count, 3);
    step(s, COMBO.window + 0.1);
    assert.equal(s.combo.count, 0);
    kill(s);
    assert.equal(s.combo.count, 1);
  });

  test(`${COMBO.step}콤보마다 보너스 골드와 알림`, () => {
    const s = quietGame();
    for (let i = 0; i < COMBO.step - 1; i++) kill(s);
    const gold = s.gold;
    s.events = [];
    kill(s);
    assert.equal(s.gold, gold + COMBO.bonus);
    assert.ok(s.events.some((e) => e.kind === 'combo' && e.count === COMBO.step));
  });
});

describe('평소 판에서', () => {
  test('새 판은 게이지·콤보·성문이 비어 있다', () => {
    const s = createGame({ seed: 1, hero: 'guardian' });
    assert.equal(s.ult, 0);
    assert.equal(s.gateLeft, 0);
    assert.deepEqual(s.combo, { count: 0, left: 0 });
  });
});
