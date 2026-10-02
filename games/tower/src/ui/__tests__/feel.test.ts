import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS, BOSS_PATTERN } from '../../core/data.ts';
import { spawnElite, spawnEnemy, step } from '../../core/game.ts';
import { dummyDef, placeAt, quietGame } from '../../core/__tests__/helpers.ts';
import type { GameEvent } from '../../core/types.ts';
import { FEEL, bossBar, comboView, feelFromEvents, feelTick, idleFeel, type Feel } from '../feel.ts';

const at = { x: 0, y: 0 };
const kill = (rank?: 'elite' | 'officer' | 'boss'): GameEvent => ({ kind: 'kill', at, bounty: 1, enemyId: 1, rank });

/** realDt 씩 여러 번 흘려 실제로 흐른 게임 시간을 더한다 */
function run(feel: Feel, seconds: number, realDt = 1 / 60): { feel: Feel; game: number } {
  let game = 0;
  for (let t = 0; t < seconds - 1e-9; t += realDt) {
    const r = feelTick(feel, realDt);
    feel = r.feel;
    game += realDt * r.scale;
  }
  return { feel, game };
}

describe('히트스톱 (큰 타격에 아주 잠깐 멈춤)', () => {
  test('평범한 적 처치·평타에는 멈추지 않는다', () => {
    const f = feelFromEvents(idleFeel(), [kill(), { kind: 'hit', at, amount: 10, enemyId: 1, crit: false }]);
    assert.equal(f.stop, 0);
    assert.equal(f.slow, 0);
  });

  test('정예 < 부관 처치 순으로 더 길게 멈추고, 궁극기·장수 들이받기도 멈춘다', () => {
    const elite = feelFromEvents(idleFeel(), [kill('elite')]).stop;
    const officer = feelFromEvents(idleFeel(), [kill('officer')]).stop;
    assert.ok(elite > 0 && officer > elite, `${elite} ${officer}`);
    assert.equal(feelFromEvents(idleFeel(), [{ kind: 'ultimate', id: 'lantern', hero: null, face: 'n' }]).stop, FEEL.ultimateStop);
    assert.equal(feelFromEvents(idleFeel(), [{ kind: 'bossSlam', at, amount: 10, face: 'n' }]).stop, FEEL.slamStop);
  });

  test('한 프레임에 여러 개가 겹치면 더하지 않고 가장 긴 것', () => {
    const f = feelFromEvents(idleFeel(), [kill('elite'), kill('elite'), kill('officer')]);
    assert.equal(f.stop, FEEL.officerStop);
  });

  test('멈춘 동안 게임 시간은 흐르지 않고, 멈춤이 끝나면 정상 속도', () => {
    const f = feelFromEvents(idleFeel(), [kill('elite')]);
    const during = run(f, FEEL.eliteStop * 0.9);
    assert.equal(during.game, 0);
    const after = run(f, FEEL.eliteStop + 0.5);
    assert.ok(Math.abs(after.game - 0.5) < 0.03, `${after.game}`);
    assert.deepEqual(after.feel, idleFeel());
  });

  test('멈춤은 아주 짧다 (0.2초를 넘지 않는다)', () => {
    for (const k of ['eliteStop', 'officerStop', 'ultimateStop', 'slamStop'] as const) assert.ok(FEEL[k] > 0 && FEEL[k] <= 0.2, k);
  });
});

describe('마지막 일격 슬로모션', () => {
  test('장수를 쓰러뜨리면 잠깐 느려졌다가 점점 원래 속도로 돌아온다', () => {
    let f = feelFromEvents(idleFeel(), [kill('boss')]);
    assert.ok(f.slow > 0);
    const first = feelTick(f, 1 / 60);
    assert.ok(first.scale <= FEEL.bossSlowScale + 0.05 && first.scale > 0, `${first.scale}`);
    // 갈수록 빨라진다
    let prev = first.scale;
    f = first.feel;
    for (let i = 0; i < 30; i++) {
      const r = feelTick(f, 1 / 60);
      assert.ok(r.scale >= prev - 1e-9);
      prev = r.scale;
      f = r.feel;
    }
    const end = run(f, FEEL.bossSlow + 0.1);
    assert.equal(feelTick(end.feel, 1 / 60).scale, 1);
  });

  test('슬로모션 동안 흐른 게임 시간은 실제 시간보다 짧다', () => {
    const f = feelFromEvents(idleFeel(), [kill('boss')]);
    const r = run(f, FEEL.bossSlow);
    assert.ok(r.game < FEEL.bossSlow * 0.8 && r.game > FEEL.bossSlow * FEEL.bossSlowScale, `${r.game}`);
  });

  test('부관도 짧게 느려지고, 정예는 느려지지 않는다', () => {
    assert.ok(feelFromEvents(idleFeel(), [kill('officer')]).slow > 0);
    assert.ok(FEEL.officerSlow < FEEL.bossSlow);
    assert.equal(feelFromEvents(idleFeel(), [kill('elite')]).slow, 0);
  });

  test('실제 게임에서 장수를 잡으면 처치 알림에 장수 표시가 붙는다', () => {
    const s = quietGame({ roundSeconds: 1 });
    s.mode = 'endless';
    const boss = spawnEnemy(s, BOSS, s.tower.x + 80, s.tower.y);
    boss.hp = 0;
    const elite = placeAt(s, 40, 0, dummyDef({ hp: 1 }));
    elite.isElite = true;
    elite.hp = 0;
    step(s, 0.01);
    const ranks = s.events.flatMap((e) => (e.kind === 'kill' ? [e.rank] : []));
    assert.deepEqual(ranks.sort(), ['boss', 'elite']);
  });
});

describe('연속 처치 표시', () => {
  test('3 연속부터 보이고, 그 전에는 숨긴다', () => {
    assert.equal(comboView(0), null);
    assert.equal(comboView(2), null);
    assert.equal(comboView(3)!.text, '3 연속');
  });

  test('많이 이을수록 글씨가 커지고 색이 뜨거워진다', () => {
    const a = comboView(5)!;
    const b = comboView(15)!;
    const c = comboView(40)!;
    assert.ok(a.size < b.size && b.size < c.size);
    assert.notEqual(a.color, b.color);
    assert.notEqual(b.color, c.color);
    assert.ok(c.size <= FEEL.comboMaxSize);
  });
});

describe('장수 체력바', () => {
  test('장수·부관이 없으면 없다 (정예는 머리 위 막대로 충분)', () => {
    const s = quietGame();
    spawnElite(s);
    assert.equal(bossBar(s), null);
  });

  test('장수가 있으면 이름과 남은 체력 비율, 광폭화 지점 표시', () => {
    const s = quietGame();
    const boss = spawnEnemy(s, BOSS, s.tower.x + 150, s.tower.y);
    boss.hp = boss.maxHp * 0.7;
    const bar = bossBar(s)!;
    assert.equal(bar.name, BOSS.name);
    assert.ok(Math.abs(bar.frac - 0.7) < 1e-9);
    assert.deepEqual(bar.marks, [BOSS_PATTERN.enrageAt]);
    assert.equal(bar.enraged, false);
    assert.equal(bar.officer, false);
  });

  test('부관은 "…의 부관" 으로 표시되고, 장수와 함께 있으면 장수가 우선', () => {
    const s = quietGame();
    const o = spawnEnemy(s, BOSS, s.tower.x + 150, s.tower.y);
    o.isBoss = false;
    o.isOfficer = true;
    o.maxHp = o.hp = 1000;
    assert.equal(bossBar(s)!.name, `${BOSS.name}의 부관`);
    assert.equal(bossBar(s)!.officer, true);
    spawnEnemy(s, BOSS, s.tower.x - 150, s.tower.y);
    assert.equal(bossBar(s)!.officer, false);
  });

  test('쓰러진(체력 0) 장수는 없는 것으로 친다, 체력 비율은 0~1', () => {
    const s = quietGame();
    const boss = spawnEnemy(s, BOSS, s.tower.x + 150, s.tower.y);
    boss.hp = -50;
    assert.equal(bossBar(s), null);
    boss.hp = boss.maxHp * 2;
    assert.equal(bossBar(s)!.frac, 1);
  });

  test('기를 모으는 중이면 모은 정도(0~1)', () => {
    const s = quietGame();
    const boss = spawnEnemy(s, BOSS, s.tower.x + 150, s.tower.y);
    boss.pattern!.phase = 'windup';
    boss.pattern!.phaseLeft = BOSS_PATTERN.windup[boss.pattern!.kind] / 4;
    assert.ok(Math.abs(bossBar(s)!.windup! - 0.75) < 1e-9);
  });
});
