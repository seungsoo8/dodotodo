import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSSES, BOSS_PATTERN, findEnemy } from '../data.ts';
import { dealDamage, spawnEnemy, step, towerDamageTaken, type GameState } from '../game.ts';
import { useSkill } from '../skills.ts';
import { distToTower, quietGame } from './helpers.ts';
import type { Enemy } from '../types.ts';

function bossAt(s: GameState, id: string, dx: number): Enemy {
  return spawnEnemy(s, findEnemy(id), s.tower.x + dx, s.tower.y);
}

/** 짧게 여러 번 나눠 진행 */
function run(s: GameState, seconds: number, dt = 0.05): void {
  for (let t = 0; t < seconds - 1e-9; t += dt) step(s, dt);
}

describe('보스 목록', () => {
  test('땅굴 군주(소환)·강철 뿔(돌진)·불꽃 마녀(화염 폭풍) 3종, 모두 등장 대사가 있다', () => {
    assert.deepEqual(
      BOSSES.map((b) => [b.id, b.boss?.pattern]),
      [
        ['boss', 'summon'],
        ['boss_rhino', 'charge'],
        ['boss_witch', 'nova'],
      ],
    );
    for (const b of BOSSES) assert.ok(b.boss?.line, b.id);
  });

  test('보스 정의로 만든 적은 보스이고, 패턴 상태를 가진다', () => {
    const s = quietGame();
    for (const b of BOSSES) {
      const e = bossAt(s, b.id, 200);
      assert.equal(e.isBoss, true);
      assert.equal(e.pattern?.phase, 'idle');
      assert.equal(e.pattern?.timer, BOSS_PATTERN.interval[b.boss!.pattern]);
    }
  });

  test('클래식 마지막 라운드의 보스는 셋 중 하나이고, 무한 모드에서는 같은 보스가 연달아 나오지 않는다', () => {
    const ids = new Set(BOSSES.map((b) => b.id));
    for (let seed = 1; seed <= 6; seed++) {
      const s = quietGame({ roundSeconds: 1, totalRounds: 2, tower: { maxHp: 1e12 } }, seed);
      step(s, 1.01);
      const boss = s.enemies.find((e) => e.isBoss)!;
      assert.ok(ids.has(boss.def.id));
      assert.ok(s.events.some((ev) => ev.kind === 'boss' && ev.id === boss.def.id));
    }
  });
});

describe('기 모으기 → 패턴 발동', () => {
  test('주기가 되면 기를 모으기 시작하고(이벤트), 모으는 동안에는 움직이지 않는다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const boss = bossAt(s, 'boss', 250);
    run(s, BOSS_PATTERN.interval.summon + 0.05);
    assert.equal(boss.pattern!.phase, 'windup');
    assert.ok(s.events.some((ev) => ev.kind === 'bossWindup' && ev.pattern === 'summon'));
    const d = distToTower(s, boss);
    run(s, 0.5);
    assert.equal(distToTower(s, boss), d);
  });

  test(`땅굴 군주: 기를 다 모으면 보스 주변에 부하 ${BOSS_PATTERN.summonCount}마리를 부른다`, () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const boss = bossAt(s, 'boss', 250);
    run(s, BOSS_PATTERN.interval.summon + BOSS_PATTERN.windup.summon + 0.1);
    const minions = s.enemies.filter((e) => !e.isBoss);
    assert.equal(minions.length, BOSS_PATTERN.summonCount);
    for (const m of minions) {
      assert.ok(BOSS_PATTERN.summonIds.includes(m.def.id));
      assert.ok(Math.hypot(m.x - boss.x, m.y - boss.y) < 40);
    }
    assert.equal(boss.pattern!.phase, 'idle');
    assert.ok(s.events.some((ev) => ev.kind === 'bossSummon'));
  });

  test(`강철 뿔: 기를 다 모으면 빠르게 돌진해 탑을 들이받고, 공격력 ×${BOSS_PATTERN.chargeHitMul} 피해를 준다`, () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const boss = bossAt(s, 'boss_rhino', 300);
    run(s, BOSS_PATTERN.interval.charge + BOSS_PATTERN.windup.charge + 0.05);
    assert.equal(boss.pattern!.phase, 'dash');
    const hpBefore = s.tower.hp;
    // 돌진 속도면 1초 안에 닿는다 (걸어서는 15px/초)
    run(s, 1.2);
    assert.ok(distToTower(s, boss) <= s.tower.radius + boss.radius + 1e-6);
    assert.ok(s.events.some((ev) => ev.kind === 'bossSlam'));
    const slam = towerDamageTaken(s.config, boss.atk * BOSS_PATTERN.chargeHitMul, 0);
    assert.ok(hpBefore - s.tower.hp >= slam - 1e-6);
    assert.equal(boss.pattern!.phase, 'idle');
  });

  test('불꽃 마녀: 탑에서 떨어진 곳(115)에 멈춰 멀리서 공격한다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const witch = bossAt(s, 'boss_witch', 200);
    run(s, 6);
    assert.ok(Math.abs(distToTower(s, witch) - BOSS_PATTERN.novaStandoff) < 1e-6);
    assert.ok(s.tower.hp < 1e9, '멀리서도 탑을 때린다');
    assert.ok(s.events.some((ev) => ev.kind === 'bossShot'));
  });

  test(`불꽃 마녀: 기를 다 모으면 화염 폭풍으로 공격력 ×${BOSS_PATTERN.novaMul} 피해`, () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const witch = bossAt(s, 'boss_witch', 116);
    run(s, BOSS_PATTERN.interval.nova + BOSS_PATTERN.windup.nova + 0.05);
    const nova = s.events.find((ev) => ev.kind === 'bossNova');
    assert.ok(nova && nova.kind === 'bossNova');
    assert.ok(Math.abs(nova.amount - towerDamageTaken(s.config, witch.atk * BOSS_PATTERN.novaMul, 0)) < 1e-6);
  });
});

describe('패턴 끊기 (파훼법)', () => {
  test('기를 모으는 중에 얼리면(눈보라) 패턴이 끊기고 처음부터 다시 센다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    s.round = 3; // 눈보라 해금
    const witch = bossAt(s, 'boss_witch', 116);
    run(s, BOSS_PATTERN.interval.nova + 0.1);
    assert.equal(witch.pattern!.phase, 'windup');
    assert.equal(useSkill(s, 'blizzard'), true);
    step(s, 0.01);
    assert.equal(witch.pattern!.phase, 'idle');
    assert.ok(s.events.some((ev) => ev.kind === 'bossCancel'));
    run(s, BOSS_PATTERN.windup.nova + 0.5);
    assert.equal(s.events.some((ev) => ev.kind === 'bossNova'), false, '화염 폭풍은 터지지 않는다');
  });

  test('기를 모으는 중에 최대 체력의 4% 이상 피해를 받으면 끊긴다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const boss = bossAt(s, 'boss', 250);
    run(s, BOSS_PATTERN.interval.summon + 0.05);
    dealDamage(s, 'test', boss, boss.maxHp * 0.03, false);
    step(s, 0.01);
    assert.equal(boss.pattern!.phase, 'windup', '3% 로는 안 끊긴다');
    dealDamage(s, 'test', boss, boss.maxHp * 0.011, false);
    step(s, 0.01);
    assert.equal(boss.pattern!.phase, 'idle');
    run(s, BOSS_PATTERN.windup.summon + 0.2);
    assert.equal(s.enemies.filter((e) => !e.isBoss).length, 0, '부하가 나오지 않는다');
  });

  test('기를 모으기 전에 받은 피해는 끊기에 쳐주지 않는다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const boss = bossAt(s, 'boss', 250);
    dealDamage(s, 'test', boss, boss.maxHp * 0.1, false);
    run(s, BOSS_PATTERN.interval.summon + 0.05);
    assert.equal(boss.pattern!.phase, 'windup');
  });

  test('얼어 있는 동안에는 다음 패턴까지의 시간이 흐르지 않는다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const boss = bossAt(s, 'boss', 250);
    boss.slowFactor = 0;
    boss.slowTimeLeft = 3;
    run(s, 2);
    assert.equal(boss.pattern!.timer, BOSS_PATTERN.interval.summon);
  });
});

describe('광폭화', () => {
  test('체력이 절반 아래로 떨어지면 한 번 광폭화: 이동 속도 ×1.3, 패턴 주기 ×0.6', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const boss = bossAt(s, 'boss', 300);
    const speed = boss.speed;
    boss.hp = boss.maxHp * 0.49;
    step(s, 0.01);
    assert.equal(boss.pattern!.enraged, true);
    assert.ok(Math.abs(boss.speed - speed * BOSS_PATTERN.enrageSpeed) < 1e-9);
    assert.equal(s.events.filter((ev) => ev.kind === 'bossEnrage').length, 1);
    step(s, 0.01);
    assert.equal(s.events.filter((ev) => ev.kind === 'bossEnrage').length, 1, '한 번만');
    // 광폭화 뒤 패턴 주기
    run(s, BOSS_PATTERN.interval.summon * BOSS_PATTERN.enrageInterval + 0.1);
    assert.equal(boss.pattern!.phase, 'windup');
  });
});
