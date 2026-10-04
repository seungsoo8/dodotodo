import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMap, TILE } from '../../core/maps.ts';
import { tileCenter } from '../../core/world.ts';
import { changeMap } from '../../core/game.ts';
import { accept, QUEST_BY_ID } from '../../core/quests.ts';
import { play, placeAt } from '../../core/__tests__/helpers.ts';
import { ambientFor, dynamicLights, moonBeams, staticLights, PLAYER_LIGHT, type Light } from '../render/light.ts';

const lum = (c: readonly [number, number, number]) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
const at = (ls: Light[], x: number, y: number, d = TILE) => ls.filter((l) => Math.hypot(l.x - x, l.y - y) <= d);

describe('한밤의 아이 방: 방마다 어둠', () => {
  test('모든 방은 밤이다 (어느 색도 낮처럼 밝지 않다)', () => {
    for (const id of ['village', 'toybox', 'drawer', 'desk', 'underbed', 'attic'] as const) {
      const g = play('toby', id);
      const a = ambientFor(g.world.map, g.world);
      assert.ok(Math.max(...a) < 200, `${id} ${a}`);
      assert.ok(lum(a) > 10, `${id}: 완전히 깜깜하지는 않다`);
    }
  });

  test('침대 밑은 블록 마을보다 훨씬 어둡다', () => {
    const v = play('toby', 'village');
    const u = play('toby', 'underbed');
    assert.ok(lum(ambientFor(u.world.map, u.world)) < lum(ambientFor(v.world.map, v.world)) * 0.6);
  });

  test('더스티가 불을 끄면 더 어두워지고 주인공 불빛도 작아진다', () => {
    const g = play('toby', 'underbed');
    const before = ambientFor(g.world.map, g.world);
    const lightBefore = at(dynamicLights(g, 0), g.world.player.x, g.world.player.y - 8, 4)[0];
    g.world.lightsOut = 3;
    assert.ok(lum(ambientFor(g.world.map, g.world)) < lum(before));
    const lightAfter = at(dynamicLights(g, 0), g.world.player.x, g.world.player.y - 8, 4)[0];
    assert.ok(lightAfter.r < lightBefore.r);
  });
});

describe('빛나는 것들', () => {
  test('주인공은 늘 따뜻한 불빛을 들고 다닌다', () => {
    const g = play('toby', 'toybox');
    const l = at(dynamicLights(g, 0), g.world.player.x, g.world.player.y - 8, 4);
    assert.equal(l.length, 1);
    assert.equal(l[0].r, PLAYER_LIGHT);
    assert.ok(l[0].color[0] > l[0].color[2], '따뜻한 색');
  });

  test('블록 마을 가로등(야간등)마다 따뜻한 빛이 있다', () => {
    const m = buildMap('village');
    const ls = staticLights(m);
    const lamps = m.structures.filter((s) => s.kind === 'lamp');
    assert.ok(lamps.length >= 4);
    for (const s of lamps) {
      const l = at(ls, (s.x + s.w / 2) * TILE, s.y * TILE, TILE * 1.5);
      assert.ok(l.length > 0, `가로등 ${s.x},${s.y}`);
      assert.ok(l[0].color[0] >= l[0].color[2]);
      assert.ok(l[0].r >= 60);
    }
  });

  test('블록 마을 집 창문에서 불빛이 새어 나온다', () => {
    const m = buildMap('village');
    const ls = staticLights(m);
    const chief = m.structures.find((s) => s.kind === 'chief')!;
    const inside = ls.filter((l) => l.x >= chief.x * TILE && l.x <= (chief.x + chief.w) * TILE && l.y >= chief.y * TILE - TILE && l.y <= (chief.y + chief.h) * TILE);
    assert.ok(inside.length > 0);
  });

  test('창문이 있는 방에는 달빛이 비치고, 침대 밑에는 없다', () => {
    assert.ok(moonBeams(buildMap('toybox')).length > 0);
    assert.ok(moonBeams(buildMap('village')).length > 0);
    assert.equal(moonBeams(buildMap('underbed')).length, 0);
    for (const b of moonBeams(buildMap('toybox'))) {
      assert.ok(b.w > 0 && b.h > 0);
      assert.ok(b.color[2] >= b.color[0], '달빛은 푸르스름하다');
    }
  });

  test('손전등 얼음 땡: 손전등이 비추는 자리가 환해진다', () => {
    const g = play('toby', 'desk');
    g.world.freeze.light = { x: 300, y: 200, vx: 40, r: 60 };
    const l = at(dynamicLights(g, 0), 300, 200, 2);
    assert.ok(l.length > 0);
    assert.ok(l[0].r >= 60 && l[0].k >= 1);
  });

  test('몬스터 공격 예고는 붉게 빛나 어둠 속에서도 보인다', () => {
    const g = play('toby', 'underbed');
    g.world.hazards.push({ id: 999, kind: 'slam', shape: { type: 'circle', x: 400, y: 300, r: 40 }, delay: 0.5, telegraph: 1, life: 0, from: 'monster', damage: 10, tick: 0, tickLeft: 0, skill: false, hit: [] });
    const l = at(dynamicLights(g, 0), 400, 300, 2);
    assert.ok(l.length > 0);
    assert.ok(l[0].color[0] > l[0].color[1] && l[0].color[0] > l[0].color[2], '붉은 빛');
  });

  test('몬스터와 보스도 희미하게 보이도록 빛을 받는다 (보스가 더 크게)', () => {
    const g = play('toby', 'toybox');
    const m = placeAt(g, 'fluff', 200, 0, 1);
    const boss = placeAt(g, 'b_bear', -200, 0, 7);
    assert.ok(boss.boss, '곰 대장은 보스');
    const ls = dynamicLights(g, 0);
    const ml = at(ls, m.x, m.y, 10);
    const bl = at(ls, boss.x, boss.y, 10);
    assert.ok(ml.length > 0 && bl.length > 0);
    assert.ok(bl[0].r > ml[0].r);
  });

  test('받은 심부름 물건이 놓인 자리는 반짝 빛난다', () => {
    const g = play('toby', 'toybox');
    g.save.rescued.push('mouse');
    const f = QUEST_BY_ID.q_cheese.fetch!;
    changeMap(g, f.map);
    const near = () => at(dynamicLights(g, 0), tileCenter(f.x), tileCenter(f.y), 6).length;
    assert.equal(near(), 0, '받기 전에는 빛나지 않는다');
    accept(g.save, 'q_cheese');
    assert.ok(near() > 0);
  });
});

describe('방마다 다른 빛', () => {
  test('책상 시계 공장: 사냥터와 깡통 대장 자리를 스탠드 불빛이 비춘다', () => {
    const m = buildMap('desk');
    const ls = staticLights(m);
    for (const p of [...m.spawns, m.boss!]) {
      const l = at(ls, (p.x + 0.5) * TILE, (p.y + 0.5) * TILE, TILE * 2);
      assert.ok(l.some((x) => x.r >= 120 && x.color[0] > x.color[2]), `${p.x},${p.y}`);
    }
  });
});

