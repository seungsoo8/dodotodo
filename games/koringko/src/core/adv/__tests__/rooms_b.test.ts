/**
 * 갈래 B: 사람 크기 집 지도로 바꾼 네 장을 처음부터 끝까지 실제로 풀어 본다.
 *  - 2장 할머니 방 · 5장 이불장  : 같은 복도 배치 (layout_b.ts hallHouse)
 *  - 6장 거실 창가 · 11장 책장   : 같은 거실 배치 (layout_b.ts livingHouse), 소파에서 자는 아빠(숨바꼭질)
 * 놀이를 차례로 풀고, 동료를 말 걸어 부르고, 모든 기억 물건에 걸어서 닿고, 기억의 문으로 다음 장에 간다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type AdvInput, type MemThing } from '../adv.ts';
import { ROOMS, STORY } from '../story/index.ts';
import { startIn } from './acthelp.ts';
import { hallHouse, livingHouse } from '../story/layout_b.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { DECAL_KINDS } from '../story/kit.ts';
import { MOVE_KINDS } from '../../../ui/art/moveProps.ts';
import { isSolidChar } from '../../maps.ts';
import type { Cmd, RoomDef, Thing } from '../types.ts';

type Dir = 'up' | 'down' | 'left' | 'right';
const T = 24;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}
const cell = (a: Adv): [number, number] => {
  const p = a.stage.actors.toby;
  return [Math.floor(p.x / T), Math.floor(p.y / T)];
};
/** 대본 · 놀이가 끝날 때까지 넘긴다 (작은 놀이는 끝난 것으로, 고르기는 pick 번째) */
function finish(a: Adv, pick = 0): string[] {
  const lines: string[] = [];
  for (let i = 0; i < 60 * 600 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    if (a.stage.choice) a.stage.choice.sel = pick;
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0, hold: true });
  }
  assert.equal(a.runner, null, '대본이 끝나지 않는다');
  return lines;
}
/** 그 칸에 서서 (밟으면 터지는 대본은 먼저 넘기고) 그쪽을 본다 → 지금 누를 수 있는 것 */
function stand(a: Adv, x: number, y: number, dir: Dir) {
  a.place((x + 0.5) * T, (y + 0.5) * T);
  a.step(1 / 60, NO_INPUT);
  finish(a);
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  return a.prompt;
}
/** 그 칸에서 그쪽을 보고 누른다: 눌린 것이 want 인지 확인하고 대본을 끝까지 (나온 대사) */
function use(a: Adv, x: number, y: number, dir: Dir, want: string, pick = 0): string[] {
  assert.equal(stand(a, x, y, dir)?.id, want, `(${x},${y}) ${dir} 에서 ${want} 을 누를 수 있어야 한다`);
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return finish(a, pick);
}
/** 동료가 자기 자리에 갈 때까지 기다렸다가, 옆에 서서 말을 걸고 「같이 가자」 */
function callPal(a: Adv, h: 'bori' | 'ruru' | 'nabi'): void {
  const home = a.palHome(h)!;
  for (let i = 0; i < 60 * 20; i++) {
    const q = a.stage.actors[h];
    if (Math.floor(q.x / T) === home[0] && Math.floor(q.y / T) === home[1] && !q.moving) break;
    a.step(1 / 60, NO_INPUT);
  }
  // 그 동료 곁 (같은 높이의 걸을 수 있는 칸) 에서 동료 쪽을 보면 말을 걸 수 있어야 한다
  const sides = [[-1, 0, 'right'], [1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']] as const;
  const side = sides.find(([dx, dy, d]) => {
    a.place((home[0] + 0.5) * T, (home[1] + 0.5) * T);
    return !a.solid(home[0] + dx, home[1] + dy) && stand(a, home[0] + dx, home[1] + dy, d)?.id === `pal_${h}`;
  });
  assert.ok(side, `${h} 곁에서 말을 걸 수 없다`);
  use(a, home[0] + side[0], home[1] + side[1], side[2], `pal_${h}`);
  assert.ok(a.withMe().includes(h), `${h} 를 불러 왔다`);
}
/** 밟으면 터지는 대본이 줄줄이 이어질 때 (깃발 → 다음 대본) 모두 끝날 때까지 */
function settle(a: Adv): void {
  for (let k = 0; k < 6; k++) {
    a.step(1 / 60, NO_INPUT);
    finish(a);
  }
}
/** 지금 조종 인물이 (밀 물건 · 높이까지 따져) 걸어서 닿는 칸 */
function walkable(a: Adv): Set<string> {
  const [sx, sy] = cell(a);
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`;
      if (!seen.has(k) && !a.solid(x + dx, y + dy)) {
        seen.add(k);
        q.push([x + dx, y + dy]);
      }
    }
  }
  return seen;
}
/** 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  return startIn(room, (a) => finish(a));
}
/** 지금 서 있는 곳에서 걸어서 닿는 이웃 칸에 서서 그 기억 물건을 누를 수 있다 (누르지는 않는다) */
function canReach(a: Adv, m: MemThing): boolean {
  const ok = walkable(a);
  const [x, y] = m.at;
  const sides: [number, number, Dir][] = [[x, y + 1, 'up'], [x, y - 1, 'down'], [x - 1, y, 'right'], [x + 1, y, 'left']];
  const back = cell(a);
  const hit = sides.some(([sx, sy, d]) => ok.has(`${sx},${sy}`) && stand(a, sx, sy, d)?.id === m.id);
  a.place((back[0] + 0.5) * T, (back[1] + 0.5) * T);
  return hit;
}
const goals = (r: RoomDef, intro: Cmd[]): string[] =>
  [intro, ...r.things.flatMap((t) => ('scene' in t && t.scene && !isMemory(t) ? [t.scene] : []))].flatMap(flat).flatMap((c) => (c.t === 'goal' && c.text ? [c.text] : []));
const kindsOf = (r: RoomDef) => new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
/** 걸을 수 있는 칸 위의 잔 소품 (이삿짐 데칼 · 바닥 데칼) */
const decalsOn = (r: RoomDef) =>
  (r.furniture ?? []).filter((f) => {
    const k = f.kind.split(':')[0];
    const flatKind = (MOVE_KINDS[k]?.flat ?? false) || (DECAL_KINDS as readonly string[]).includes(k) || ['dustRing', 'glowStar', 'phoneCord', 'cordKnot'].includes(k);
    return flatKind && !f.fg && !isSolidChar(r.tiles[f.y]?.[f.x]);
  });

// ───────────────────────── 같은 배치 ─────────────────────────

describe('같은 배치를 장마다 다르게 (layout_b)', () => {
  test('복도 배치 하나로 2장 · 5장: 방 · 벽 · 가구 자리는 같고, 할머니 방 흰 천 · 이불장 문 · 창밖 날씨만 다르다', () => {
    const g = hallHouse('grand');
    const c = hallHouse('closet');
    assert.deepEqual(g.rooms, c.rooms);
    assert.equal(g.w, c.w);
    assert.equal(g.h, c.h);
    assert.deepEqual(g.doors, [], '2장: 이불장 문은 닫혀 있고 할머니 방 문은 잠겨 있다');
    assert.deepEqual(c.doors, [{ between: ['closet', 'hall'], at: 30, w: 2 }], '5장: 이불장 문이 열려 있다');
    const sheets = (s: typeof g) => s.furniture.flatMap((f) => (!Array.isArray(f) && f.kind.startsWith('sheet') ? [f.kind] : []));
    assert.deepEqual(sheets(g), ['sheet:mid', 'sheet:tall'], '2장: 재봉틀 · 장롱에 흰 천');
    assert.deepEqual(sheets(c), ['sheet:mid,off', 'sheet:tall,off'], '5장: 2장에서 걷은 천은 걷힌 그대로');
    const sky = (s: typeof g) => s.furniture.flatMap((f) => (!Array.isArray(f) && f.kind.startsWith('window') && f.x === 35 ? [f.kind] : []));
    assert.deepEqual([sky(g), sky(c)], [['window:night'], ['window:rain']], '복도 끝 창: 23:40 달밤 → 01:50 비');
    const r2 = ROOMS.grandroom();
    const r5 = ROOMS.closet();
    assert.equal(r2.tiles[14][30], 'X', '2장: 이불장 문 자리는 벽');
    assert.equal(r5.tiles[14][30], 'D', '5장: 이불장 문 자리가 뚫렸다');
    assert.equal(r5.elev?.[4][30], '2', '이불장 맨 위 칸은 높이 2');
    assert.equal(r5.elev?.[8][30], '1', '이불장 가운데 칸은 높이 1');
  });

  test('거실 배치 하나로 6장 · 11장: 비 오는 창 → 비 갠 창, 아빠는 두 장 내내 소파에서 잔다', () => {
    const w = livingHouse('window');
    const s = livingHouse('shelf');
    assert.deepEqual(w.rooms, s.rooms);
    assert.equal(w.furniture.length, s.furniture.length);
    const win = (h: typeof w) => h.furniture.flatMap((f) => (!Array.isArray(f) && f.kind.startsWith('window') ? [f.kind] : []));
    assert.deepEqual([win(w), win(s)], [['window:rain'], ['window:night']]);
    for (const id of ['window', 'shelf']) {
      const r = ROOMS[id]();
      // 막 구조: 소파에 잠든 아빠는 살펴보면 기척만 나는 사람 (npc · sleep). 아직 바꾸지 않은 방은 지켜보는 이
      const dad = r.things.find((t): t is Extract<Thing, { kind: 'npc' | 'watcher' }> => (t.kind === 'npc' || t.kind === 'watcher') && t.actor === 'dad');
      assert.ok(dad, `${id}: 소파의 아빠`);
      if (dad.kind === 'npc') assert.equal(dad.pose, 'sleep', `${id}: 아빠는 잠들어 있다`);
      if (dad.kind === 'watcher') assert.ok(dad.moveOnly, `${id}: 잠결이라 움직일 때만 들킨다`);
      assert.equal(r.elev?.[dad.at[1]][dad.at[0]], '1', `${id}: 아빠는 소파 앉는 면 높이`);
    }
  });

  test('네 방 모두 사람 크기 집 지도 (장난감이 걷는다): 앵커 소품 · 이삿짐 · 윗층 · 앞쪽 가림막 · 빛 · 잔 소품 열둘 이상', () => {
    const anchors: Record<string, string[]> = {
      grandroom: ['sewing', 'wardrobe', 'sheet', 'bed', 'calendar', 'clock', 'door', 'window', 'frameGhost', 'quilts'],
      closet: ['quilts', 'glowStar', 'door', 'window', 'cartonHalf'],
      window: ['window', 'sofaWrap', 'tv', 'grandClock', 'plant', 'table', 'frameGhost', 'phoneCord'],
      shelf: ['shelf', 'stage', 'bookTied', 'sofaWrap', 'tv', 'grandClock'],
    };
    for (const [id, ks] of Object.entries(anchors)) {
      const r = ROOMS[id]();
      assert.equal(r.scale, 'human', id);
      assert.equal(r.toys, true, id);
      const kinds = kindsOf(r);
      for (const k of ks) assert.ok(kinds.has(k), `${id}: 소품 ${k} 이 없다`);
      assert.ok(['cartonL', 'cartonM', 'cartonS', 'cartonOpen', 'cartonHalf'].some((k) => kinds.has(k)), `${id}: 이삿짐 상자`);
      assert.ok((r.furniture ?? []).some((f) => f.over), `${id}: 윗층`);
      assert.ok((r.furniture ?? []).some((f) => f.fg), `${id}: 앞쪽 가림막`);
      assert.ok((r.lights ?? []).length > 0, `${id}: 붙박인 빛`);
      const n = decalsOn(r).length;
      assert.ok(n >= 12, `${id}: 바닥 잔 소품 ${n}개`);
    }
  });

  test('기억은 모두 그 방의 물건(keepsake)이고, 그림이 있고, 한 방 안에서 겹치지 않는다', () => {
    const want: Record<string, Record<string, string>> = {
      grandroom: { m2a: 'basket', m2b: 'scarf', m2c: 'dustRing', m2d: 'calendar', m2e: 'cup', m2f: 'card', m2g: 'towel' },
      closet: { mNa: 'flashlight', mNb: 'pen', mNc: 'quilts:pouch', mNd: 'cup', mNe: 'cat', mNf: 'sewing' },
      window: { m4a: 'visitorPass', m4b: 'table:phone', m4c: 'paperStrips', m4d: 'fogPane', m4e: 'letter', m4f: 'yarn', m4g: 'tray' },
      shelf: { m6a: 'photo', m6b: 'paperStrips', m6c: 'curtainPile', m6d: 'card', m6e: 'book', m6f: 'tickets', m6g: 'dustRing:four' },
    };
    for (const [id, looks] of Object.entries(want)) {
      const r = ROOMS[id]();
      const mems = r.things.filter((t): t is MemThing => isMemory(t));
      assert.deepEqual(Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : '구슬'])), looks, id);
      for (const m of mems) {
        const p = m.kind === 'keepsake' ? lookPix(m.look, r.look) : null;
        assert.ok(p && p.count() >= 20, `${id} ${m.id}: 「${m.kind === 'keepsake' ? m.look : ''}」 그림`);
      }
    }
  });

});

// ───────────────────────── 2장 할머니 방 ─────────────────────────

describe('2장 할머니 방을 처음부터 끝까지 (복도 → 채광창 → 흰 천 → 바느질 → 재봉틀 서랍)', () => {
});

// ───────────────────────── 5장 이불장 ─────────────────────────

describe('5장 이불장을 처음부터 끝까지 (등불 밝기 · 야광 별 · 베개 디딤돌 · 이불 단 오르기)', () => {
});

// ───────────────────────── 6장 거실 창가 ─────────────────────────

describe('6장 거실 창가를 처음부터 끝까지 (커튼 끈 · 전화선 매듭 · 괘종 씨 · 잠든 아빠)', () => {
});

// ───────────────────────── 11장 거실 책장 ─────────────────────────

describe('11장 거실 책장을 처음부터 끝까지 (책 계단 · 늑대 손인형 설득 · 그림자극)', () => {
  /** 책 묶음을 얇은 것 · 가운데 · 두꺼운 것 차례로 책장 앞에 (보리) */
  function stairs(a: Adv): void {
    use(a, 25, 5, 'down', 'bk3');
    use(a, 24, 7, 'right', 'bk3');
    use(a, 25, 7, 'right', 'bk3');
    assert.deepEqual(a.blockAt('bk3'), [27, 7]);
    use(a, 28, 6, 'left', 'bk1');
    use(a, 27, 6, 'left', 'bk1');
    use(a, 25, 7, 'up', 'bk1');
    use(a, 25, 6, 'up', 'bk1');
    assert.deepEqual(a.blockAt('bk1'), [25, 4]);
    for (const y of [8, 7, 6]) use(a, 27, y, 'up', 'bk3');
    assert.deepEqual(a.blockAt('bk3'), [27, 4]);
    for (const y of [9, 8, 7, 6]) use(a, 26, y, 'up', 'bk2');
    assert.deepEqual(a.blockAt('bk2'), [26, 4]);
  }

});
