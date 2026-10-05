import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ATTACK_MOVE } from '../player.ts';
import { freeze, hold, placeAt, play } from './helpers.ts';
import type { HeroId } from '../types.ts';

/** 0.6초 동안 (공격 · 이동) 을 누르고 있을 때 움직인 거리와 휘두르기/쏘기 이벤트 */
function run(hero: HeroId, attack: boolean, move: { x: number; y: number }, enemy?: { dx: number; dy: number }) {
  const g = play(hero, 'toybox');
  const m = enemy ? freeze(placeAt(g, 'fluff', enemy.dx, enemy.dy, 1)) : null;
  if (m) m.hp = m.maxHp = 1e7;
  const p = g.world.player;
  const x0 = p.x;
  const y0 = p.y;
  g.world.events = [];
  hold(g, { attack, attackPressed: attack, move }, 0.6);
  const swings = g.world.events.filter((e) => e.kind === 'swing');
  const hits = g.world.events.filter((e) => e.kind === 'hit').length;
  return { dx: p.x - x0, dy: p.y - y0, swings, hits, ms: g.stats.ms, shots: g.world.projectiles.length };
}

describe('무빙샷: 공격하면서 움직인다', () => {
  test('공격 키와 방향키를 함께 누르면 공격하는 동안에도 걷는다', () => {
    const walk = run('toby', false, { x: 1, y: 0 });
    const shoot = run('toby', true, { x: 1, y: 0 }, { dx: -30, dy: 0 });
    assert.ok(shoot.swings.length >= 1, '공격은 했다');
    assert.ok(shoot.hits >= 1, '적을 맞혔다');
    assert.ok(shoot.dx > walk.dx * 0.6, `공격하며 ${shoot.dx.toFixed(1)} · 걷기만 ${walk.dx.toFixed(1)}`);
  });

  test('공격하며 걸으면 그냥 걸을 때보다 조금 느리다 (ATTACK_MOVE 배)', () => {
    assert.ok(ATTACK_MOVE > 0.5 && ATTACK_MOVE < 1);
    const walk = run('toby', false, { x: 1, y: 0 });
    const shoot = run('toby', true, { x: 1, y: 0 }, { dx: -30, dy: 0 });
    assert.ok(shoot.dx < walk.dx * 0.97, `${shoot.dx} < ${walk.dx}`);
  });

  test('뒤로 물러나면서도 조준한 적 쪽으로 휘두른다 (몸은 걷는 쪽으로 가도)', () => {
    const r = run('toby', true, { x: 1, y: 0 }, { dx: -30, dy: 0 });
    for (const s of r.swings) assert.ok(s.kind === 'swing' && s.dir.x < 0, '왼쪽 적을 향해');
    assert.ok(r.dx > 0, '몸은 오른쪽으로');
  });

  test('활잡이(루루)도 걸으면서 화살을 쏜다', () => {
    const walk = run('ruru', false, { x: 0, y: 1 });
    const r = run('ruru', true, { x: 0, y: 1 }, { dx: 120, dy: 0 });
    assert.ok(r.shots >= 1 || r.hits >= 1, '쐈다');
    assert.ok(r.dy > walk.dy * 0.6);
  });

  test('주변에 적이 없으면 걷는 쪽으로 공격한다', () => {
    const r = run('toby', true, { x: 0, y: -1 });
    assert.ok(r.swings.length >= 1);
    for (const s of r.swings) assert.ok(s.kind === 'swing' && s.dir.y < -0.9, JSON.stringify(s.kind === 'swing' && s.dir));
  });

  test('방향키를 안 누르고 공격만 하면 제자리에서 공격한다', () => {
    const r = run('toby', true, { x: 0, y: 0 }, { dx: 30, dy: 0 });
    assert.ok(r.swings.length >= 1);
    assert.ok(Math.hypot(r.dx, r.dy) < 2);
  });

  test('대각선: 방향키 두 개를 함께 누르면 비스듬히 걸으며 그쪽으로 휘두른다', () => {
    const r = run('toby', true, { x: Math.SQRT1_2, y: Math.SQRT1_2 });
    assert.ok(r.dx > 3 && Math.abs(r.dx - r.dy) < 1, `${r.dx}, ${r.dy}`);
    for (const s of r.swings) assert.ok(s.kind === 'swing' && Math.abs(s.dir.x - Math.SQRT1_2) < 0.05 && Math.abs(s.dir.y - Math.SQRT1_2) < 0.05);
  });

  test('대각선에 있는 적도 겨냥해서 맞힌다', () => {
    const r = run('toby', true, { x: 0, y: 0 }, { dx: -22, dy: -22 });
    assert.ok(r.hits >= 1);
    for (const s of r.swings) assert.ok(s.kind === 'swing' && s.dir.x < -0.6 && s.dir.y < -0.6, '왼쪽 위로');
  });
});

