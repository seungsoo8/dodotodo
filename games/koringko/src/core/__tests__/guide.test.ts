import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { changeMap } from '../game.ts';
import { goalPoint } from '../guide.ts';
import { TILE, buildMap } from '../maps.ts';
import { accept } from '../quests.ts';
import { structureSpot } from '../rescue.ts';
import { tileCenter } from '../world.ts';
import { placeAt, play } from './helpers.ts';

const near = (a: { x: number; y: number }, b: { x: number; y: number }, d = TILE) => Math.hypot(a.x - b.x, a.y - b.y) <= d;

describe('목표 화살표가 가리키는 곳', () => {
  test('처음: 마을에서 퀘스트를 줄 태엽 할머니를 가리킨다', () => {
    const g = play('toby', 'village');
    const chief = g.world.map.npcs.find((n) => n.id === 'chief')!;
    const p = goalPoint(g)!;
    assert.ok(near(p, { x: tileCenter(chief.x), y: tileCenter(chief.y) }), JSON.stringify(p));
    assert.equal(p.label, '태엽 할머니');
  });

  test('솜뭉치 잡기를 받으면: 마을에서는 장난감 상자 출구, 상자 안에서는 솜뭉치', () => {
    const g = play('toby', 'village');
    accept(g.save, 'q_fluff');
    const wp = g.world.map.warps.find((w) => w.to === 'toybox')!;
    const p = goalPoint(g)!;
    assert.ok(near(p, { x: (wp.x + wp.w / 2) * TILE, y: (wp.y + wp.h / 2) * TILE }), JSON.stringify(p));
    assert.equal(p.label, '장난감 상자');
    changeMap(g, 'toybox');
    g.world.monsters = [];
    const m = placeAt(g, 'fluff', 200, 40, 1);
    const q = goalPoint(g)!;
    assert.ok(near(q, m, 2), '살아 있는 솜뭉치를 가리킨다');
  });

  test('솜뭉치가 안 보이면 솜뭉치가 나오는 곳을 가리킨다', () => {
    const g = play('toby', 'toybox');
    accept(g.save, 'q_fluff');
    g.world.monsters = [];
    const p = goalPoint(g)!;
    const zones = buildMap('toybox').spawns.filter((z) => z.pool.includes('fluff'));
    assert.ok(zones.some((z) => near(p, { x: tileCenter(z.x), y: tileCenter(z.y) })), JSON.stringify(p));
  });

  test('보리 구하기: 장난감 상자의 먼지 고치', () => {
    const g = play('toby', 'toybox');
    g.save.quests.q_fluff = { state: 'done', n: 6 };
    accept(g.save, 'q_bori');
    const cocoon = g.world.map.structures.find((s) => s.kind === 'cocoon')!;
    assert.ok(near(goalPoint(g)!, structureSpot(cocoon)));
  });

  test('곰 대장: 보스 자리', () => {
    const g = play('toby', 'toybox');
    g.save.quests.q_bori = { state: 'done', n: 1 };
    accept(g.save, 'q_bear');
    const b = g.world.map.boss!;
    assert.ok(near(goalPoint(g)!, { x: tileCenter(b.x), y: tileCenter(b.y) }));
  });

  test('다 했으면 보고하러: 방 안에서는 마을로 가는 출구', () => {
    const g = play('toby', 'toybox');
    g.save.quests.q_fluff = { state: 'ready', n: 6 };
    const wp = g.world.map.warps.find((w) => w.to === 'village')!;
    const p = goalPoint(g)!;
    assert.ok(near(p, { x: (wp.x + wp.w / 2) * TILE, y: (wp.y + wp.h / 2) * TILE }));
    assert.equal(p.label, '블록 마을');
  });
});
