/**
 * 책상 위 (5막 둘째 방, 장난감 크기 근접 지도): 지도 크기 · 높이 · 소품 · 기억 물건.
 * 막을 처음부터 끝까지 풀어 보는 시험은 acts.test.ts · acts_c.test.ts 에 있다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isMemory } from '../adv.ts';
import { ROOMS } from '../story/index.ts';

describe('책상 위 (근접 지도)', () => {
  const room = ROOMS.desk();

  test('장난감 크기 근접 지도: 40×22 안팎, 아득한 방바닥, 높이, 거대한 소품 18개 이상, 주민 둘', () => {
    assert.equal(room.scale, 'toy');
    assert.ok(room.w >= 36 && room.w <= 44 && room.h >= 20 && room.h <= 24, `${room.w}×${room.h}`);
    assert.equal(room.abyss, 'roomFloor');
    assert.equal(room.elev?.length, room.h);
    const kinds = new Set((room.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['bookspines', 'memoWall', 'pencilCup', 'lampBase', 'notebook', 'eraserDust', 'ruler', 'pencil', 'paperStrips', 'starJarGiant', 'phoneGiant', 'calendarDesk', 'testPapers', 'candyTin', 'tapeCutter', 'hairTie', 'milkCarton', 'deskEdge']) assert.ok(kinds.has(k), `소품 ${k} 이 없다`);
    assert.ok((room.furniture ?? []).some((f) => f.over), '윗층 하나 이상');
    const npcs = room.things.filter((t) => t.kind === 'npc');
    assert.deepEqual(npcs.map((t) => t.kind === 'npc' && t.actor).sort(), ['paperSisters', 'tinSoldier']);
    // 앞 · 오른쪽 가장자리는 책상 모서리 너머 낭떠러지
    assert.ok(room.tiles[room.h - 1].split('').every((c) => c === 'v'));
    assert.ok(room.tiles.slice(3, room.h - 2).every((r) => r[room.w - 1] === 'v'));
  });

  test('기억 일곱 개가 모두 그 자리의 물건(keepsake)이다 — 유리병 첫 별 · 털실 · 도라지 사탕 · 금색 별 · 사진 · 시험지 별 · 노란 종이띠', () => {
    const mems = room.things.filter(isMemory);
    assert.equal(mems.length, 7);
    const looks = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : 'orb']));
    assert.deepEqual(looks, { m5a: 'paperstar', m5b: 'yarn', m5c: 'honeycandy', m5d: 'paperstar', m5e: 'photo', m5f: 'testPapers:60', m5g: 'paperStrips' });
    const g = mems.find((m) => m.id === 'm5g')!;
    assert.equal(g.when, 'folded', '노란 종이띠는 별 접기 연습 뒤에');
  });

});
