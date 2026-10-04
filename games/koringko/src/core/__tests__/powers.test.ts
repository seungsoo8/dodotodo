import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PARTS } from '../parts.ts';
import { refreshStats } from '../combat.ts';
import { freeze, hold, idle, placeAt, play } from './helpers.ts';
import type { Game } from '../game.ts';

function withPower(g: Game, power: string): void {
  g.save.parts[`p_${power}`] = 1;
  g.save.slots.push(`p_${power}`);
  refreshStats(g);
}

test('특별한 부품(능력)은 열 가지 이상, 모두 이름과 설명이 있다', () => {
  const ps = Object.values(PARTS).filter((p) => p.power);
  assert.ok(ps.length >= 10);
  for (const p of ps) assert.ok(p.name && p.desc(1).length > 8);
});

test('충격파 태엽: 구르기가 끝나면 주변을 터뜨린다', () => {
  const g = play('toby', 'forest');
  withPower(g, 'shockwave');
  const m = freeze(placeAt(g, 'ragdoll', 60, 0, 5));
  hold(g, { roll: true, move: { x: 1, y: 0 } }, 0.5);
  assert.ok(g.world.events.some((e) => e.kind === 'hit' && e.targetId === m.id));
});

test('서리 발톱: 기본 공격이 적을 느리게 한다', () => {
  const g = play('toby', 'forest');
  withPower(g, 'chill');
  const m = freeze(placeAt(g, 'ragdoll', 24, 0, 5));
  m.hp = m.maxHp = 1e6;
  hold(g, { attack: true }, 0.4);
  assert.ok(m.status.slow < 1 && m.status.slowLeft > 0);
});

test('가시 솜: 몬스터가 때리면 그 몬스터도 아프다', () => {
  const g = play('toby', 'forest');
  withPower(g, 'thorns');
  const m = placeAt(g, 'fluff', 10, 0, 1);
  m.hp = m.maxHp = 1e6;
  idle(g, 0.3);
  assert.ok(m.hp < 1e6);
});

test('광란의 단추: 적을 쓰러뜨리면 잠시 공격 속도가 빨라진다', () => {
  const g = play('toby', 'forest');
  withPower(g, 'frenzy');
  const aspd = g.stats.aspd;
  const m = placeAt(g, 'fluff', 200, 0, 1);
  m.hp = 0;
  idle(g, 0.05);
  assert.ok(g.stats.aspd > aspd);
  idle(g, 4);
  assert.equal(g.stats.aspd, aspd);
});

test('별 위성: 주인공 둘레를 도는 별이 가까운 적을 친다', () => {
  const g = play('nabi', 'forest');
  withPower(g, 'orbit');
  const m = freeze(placeAt(g, 'ragdoll', 30, 0, 5));
  m.hp = m.maxHp = 1e6;
  idle(g, 1);
  assert.ok(g.world.events.some((e) => e.kind === 'hit' && e.targetId === m.id));
});
