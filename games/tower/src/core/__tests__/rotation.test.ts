import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_PATTERN, findEnemy, findItem } from '../data.ts';
import { faceOf } from '../faces.ts';
import { applyItem, rotateTower, selectFace, spawnEnemy, step, type GameState } from '../game.ts';
import { directionalGame, distToTower, placeAt, quietGame } from './helpers.ts';
import type { Enemy } from '../types.ts';

function run(s: GameState, seconds: number, dt = 0.05): void {
  for (let t = 0; t < seconds - 1e-9; t += dt) step(s, dt);
}

function armed(): GameState {
  const s = directionalGame({ tower: { maxHp: 1e9 } });
  for (const [face, id] of [['n', 'sling'], ['e', 'mortar'], ['s', 'longbow'], ['w', 'chain_bolt']] as const) {
    selectFace(s, face);
    applyItem(s, findItem(id));
  }
  return s;
}

const faces = (s: GameState) => Object.fromEntries(s.weapons.map((w) => [w.def.id, w.face]));

describe('탑 돌리기', () => {
  test('시계 방향: 북→동→남→서→북 으로 모든 무기가 한 칸씩 돈다', () => {
    const s = armed();
    assert.equal(rotateTower(s, 1), true);
    assert.deepEqual(faces(s), { sling: 'e', mortar: 's', longbow: 'w', chain_bolt: 'n' });
    assert.ok(s.events.some((ev) => ev.kind === 'rotate' && ev.dir === 1));
  });

  test('반시계 방향은 거꾸로', () => {
    const s = armed();
    rotateTower(s, -1);
    assert.deepEqual(faces(s), { sling: 'w', mortar: 'n', longbow: 'e', chain_bolt: 's' });
  });

  test('돌린 무기는 쉬지 않고 바로 새 방향을 쏜다 (옮기기와 다른 점)', () => {
    const s = armed();
    const east = placeAt(s, 60, 0);
    rotateTower(s, 1); // 돌팔매가 동쪽으로
    step(s, 0.01);
    assert.ok(east.hp < 100);
    assert.ok(s.weapons.every((w) => w.restLeft === 0));
  });

  test(`한 번 돌리면 ${8}초 동안 다시 못 돌린다 (재사용 대기)`, () => {
    const s = armed();
    assert.equal(s.config.tower.rotateCooldown, 8);
    rotateTower(s, 1);
    assert.equal(rotateTower(s, 1), false);
    run(s, 7.9);
    assert.equal(rotateTower(s, -1), false);
    run(s, 0.2);
    assert.equal(rotateTower(s, -1), true);
  });

  test('보상 카드를 고르는 중이거나 판이 끝났으면 못 돌린다', () => {
    const s = armed();
    s.choice = [{ kind: 'perk', id: 'interest' }];
    assert.equal(rotateTower(s, 1), false);
    s.choice = null;
    s.status = 'lost';
    assert.equal(rotateTower(s, 1), false);
  });

  test('옮기는 중이던 무기는 남은 쉬는 시간을 그대로 가지고 돈다', () => {
    const s = armed();
    s.weapons[0].restLeft = 2;
    rotateTower(s, 1);
    assert.equal(s.weapons[0].restLeft, 2);
  });
});

describe('탑 둘레를 도는 보스', () => {
  function boss(s: GameState, id: string, dx = 300): Enemy {
    return spawnEnemy(s, findEnemy(id), s.tower.x + dx, s.tower.y);
  }
  const angle = (s: GameState, e: Enemy) => Math.atan2(e.y - s.tower.y, e.x - s.tower.x);

  test(`보스는 탑에서 ${BOSS_PATTERN.orbitRadius} 떨어진 곳까지 와서, 더 다가오지 않고 탑 둘레를 돈다`, () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const b = boss(s, 'boss', 200);
    run(s, 14);
    assert.ok(Math.abs(distToTower(s, b) - BOSS_PATTERN.orbitRadius) < 1, `${distToTower(s, b)}`);
    const a0 = angle(s, b);
    run(s, 3);
    assert.ok(Math.abs(distToTower(s, b) - BOSS_PATTERN.orbitRadius) < 1);
    assert.ok(Math.abs(angle(s, b) - a0) > 0.3, '각도가 바뀐다');
  });

  test('돌다 보면 공격해 오는 면이 바뀐다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const b = boss(s, 'boss_witch', 116);
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      step(s, 0.05);
      seen.add(faceOf(b.x - s.tower.x, b.y - s.tower.y));
    }
    assert.ok(seen.size >= 2, [...seen].join(','));
  });

  test('보스는 궤도에서 멀리 쏴서 탑을 때린다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    boss(s, 'boss', BOSS_PATTERN.orbitRadius + 1);
    run(s, 3);
    assert.ok(s.tower.hp < 1e9);
    assert.ok(s.events.some((ev) => ev.kind === 'bossShot'));
  });

  test('패턴을 쓰고 나면 도는 방향이 반대로 바뀐다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const b = boss(s, 'boss', BOSS_PATTERN.orbitRadius + 1);
    const dir = b.pattern!.orbitDir;
    run(s, BOSS_PATTERN.interval.summon + BOSS_PATTERN.windup.summon + 0.2);
    assert.ok(s.events.some((ev) => ev.kind === 'bossSummon'));
    assert.equal(b.pattern!.orbitDir, -dir);
  });

  test('얼어 있는 동안에는 돌지 않는다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const b = boss(s, 'boss', BOSS_PATTERN.orbitRadius);
    b.slowFactor = 0;
    b.slowTimeLeft = 3;
    const [x, y] = [b.x, b.y];
    run(s, 2);
    assert.deepEqual([b.x, b.y], [x, y]);
  });

  test('강철 뿔은 들이받은 뒤 다시 궤도로 물러난다', () => {
    const s = quietGame({ tower: { maxHp: 1e9 } });
    const b = boss(s, 'boss_rhino', BOSS_PATTERN.orbitRadius);
    run(s, BOSS_PATTERN.interval.charge + BOSS_PATTERN.windup.charge + 1.2);
    assert.ok(s.events.some((ev) => ev.kind === 'bossSlam'));
    // 물러나는 속도로 궤도까지 (다음 돌진 전에)
    run(s, 3);
    assert.ok(Math.abs(distToTower(s, b) - BOSS_PATTERN.orbitRadius) < 1, `${distToTower(s, b)}`);
  });
});
