/**
 * 갈래 B: 사람 크기 집 지도로 바꾼 네 장을 처음부터 끝까지 실제로 풀어 본다.
 *  - 2장 할머니 방 · 5장 이불장  : 같은 복도 배치 (layout_b.ts hallHouse)
 *  - 6장 거실 창가 · 11장 책장   : 같은 거실 배치 (layout_b.ts livingHouse), 소파에서 자는 아빠(숨바꼭질)
 * 놀이를 차례로 풀고, 동료를 말 걸어 부르고, 모든 기억 물건에 걸어서 닿고, 기억의 문으로 다음 장에 간다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type AdvInput, type MemThing } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { hallHouse, livingHouse } from '../story/layout_b.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { DECAL_KINDS } from '../story/kit.ts';
import { MOVE_KINDS } from '../../../ui/art/moveProps.ts';
import { isSolidChar } from '../../maps.ts';
import type { Cmd, RoomDef } from '../types.ts';

type Dir = 'up' | 'down' | 'left' | 'right';
const T = 24;
const ch = (room: string) => CHAPTERS.find((c) => c.room === room)!;

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
  const a = new Adv(STORY);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(ch(room).n);
  finish(a);
  return a;
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
      const dad = r.things.find((t) => t.kind === 'watcher');
      assert.ok(dad && dad.kind === 'watcher' && dad.actor === 'dad', `${id}: 소파의 아빠가 지켜보는 이`);
      assert.ok(dad.kind === 'watcher' && dad.moveOnly, `${id}: 잠결이라 움직일 때만 들킨다`);
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

  test('목표는 이야기 한 줄씩 (「기억 조각」 · 개수 없음), 장마다 단계 목표가 넷 이상', () => {
    for (const id of ['grandroom', 'closet', 'window', 'shelf']) {
      const gs = goals(ROOMS[id](), ch(id).intro);
      assert.ok(gs.length >= 4, `${id}: 목표 ${gs.length}개`);
      for (const g of gs) assert.ok(!/기억 조각|개를 찾자|\d/.test(g), `${id}: 「${g}」`);
    }
  });
});

// ───────────────────────── 2장 할머니 방 ─────────────────────────

describe('2장 할머니 방을 처음부터 끝까지 (복도 → 채광창 → 흰 천 → 바느질 → 재봉틀 서랍)', () => {
  test('의자 · 상자로 채광창 길을 만들고, 흰 천을 걷고, 실을 꿰어 서랍을 열면 모든 기억에 닿고 다음 장으로', () => {
    const a = start('grandroom');
    assert.deepEqual(cell(a), [5, 20], '복도에서 시작');
    assert.match(a.stage.goal ?? '', /할머니가 하루에게 남긴 것/);
    assert.ok(!walkable(a).has('10,8'), '처음엔 할머니 방에 못 들어간다 (문이 잠겼다)');
    assert.deepEqual(a.withMe(), [], '동료들은 각자 자기 자리');

    // 놀이 1: 보리 없이는 의자가 꿈쩍 않는다 → 보리를 불러 의자를 문 앞에
    use(a, 6, 21, 'up', 'g_chair');
    assert.deepEqual(a.blockAt('g_chair'), [6, 20]);
    callPal(a, 'bori');
    use(a, 6, 21, 'up', 'g_chair');
    use(a, 6, 20, 'up', 'g_chair');
    assert.deepEqual(a.blockAt('g_chair'), [6, 18]);
    for (const x of [5, 6, 7]) use(a, x, 18, 'right', 'g_chair');
    assert.deepEqual(a.blockAt('g_chair'), [9, 18]);
    assert.equal(a.flags.chair_set, true);
    assert.ok(!a.flags.stack_ok, '의자만으로는 채광창에 못 닿는다');
    // 빈 상자는 굴러가다 의자에 걸려 그 옆에 선다
    use(a, 17, 18, 'left', 'g_box');
    assert.deepEqual(a.blockAt('g_box'), [10, 18]);
    settle(a);
    assert.equal(a.flags.stack_ok, true);
    assert.match(a.stage.goal ?? '', /채광창/);

    // 루루 밧줄로 채광창 → 방 안 이불 더미 위
    assert.deepEqual(use(a, 11, 18, 'up', 'transom').some((l) => /루루/.test(l)), true, '루루를 불러 와야 한다고 말한다');
    assert.deepEqual(cell(a), [11, 18]);
    callPal(a, 'ruru');
    use(a, 11, 18, 'up', 'transom');
    assert.deepEqual(cell(a), [10, 13], '이불 더미 위로 내려섰다');
    assert.equal(a.stage.actors.toby.elev, 1);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.flags.room_in, true);
    assert.match(a.stage.goal ?? '', /흰 천/);
    use(a, 11, 13, 'right', 'quilt_step');
    assert.deepEqual(cell(a), [12, 13]);
    assert.equal(a.stage.actors.toby.elev, 0);

    // 놀이 2: 재봉틀 천 (보리) → 천 밑 카드가 드러난다
    assert.ok(!a.things().some((t) => t.id === 'm2f'), '천을 걷기 전엔 카드가 안 보인다');
    if (!a.withMe().includes('bori')) callPal(a, 'bori');
    use(a, 1, 5, 'up', 'cloth_sew');
    assert.equal(a.flags.cloth_sew, true);
    assert.equal(a.stage.props['sheet@2,3']?.state, 'off', '재봉틀 흰 천이 걷혔다');
    assert.ok(a.things().some((t) => t.id === 'm2f'));
    assert.match(a.stage.goal ?? '', /실을 꿰어/);

    // 놀이 3: 바늘에 실을 꿰면 (바느질 미니) 재봉틀 서랍이 열리고 노란 천 조각(m2b)이 보인다
    assert.ok(!a.things().some((t) => t.id === 'm2b'));
    use(a, 4, 5, 'up', 'sew_needle');
    assert.equal(a.flags.drawer_open, true);
    assert.ok(a.things().some((t) => t.id === 'm2b'));

    // 장롱 천은 루루와 보리가 둘이서 두 번 당긴다
    for (const h of ['bori', 'ruru'] as const) if (!a.withMe().includes(h)) callPal(a, h);
    if (cell(a)[1] > 14) use(a, 11, 18, 'up', 'transom');
    use(a, 18, 5, 'up', 'cloth_ward');
    assert.equal(a.flags.cloth_ward, undefined, '한 번으로는 안 걷힌다');
    use(a, 18, 5, 'up', 'cloth_ward');
    assert.equal(a.flags.cloth_ward, true);
    assert.equal(a.stage.props['sheet@18,3']?.state, 'off');

    // 기억의 문(재봉틀 서랍)은 기억을 다 보기 전엔 잠겨 있다
    if (cell(a)[1] > 14) use(a, 11, 18, 'up', 'transom');
    use(a, 3, 5, 'up', 'l2');
    assert.equal(a.save.chapter, ch('grandroom').n);

    // 기억 일곱 개: 걸어서 다가가 누를 수 있다
    const mems = ROOMS.grandroom().things.filter((t): t is MemThing => isMemory(t));
    assert.equal(mems.length, 7);
    for (const m of mems) assert.ok(canReach(a, m), `${m.id} (${m.at}) 에 닿지 않는다`);
    for (const m of mems) a.flags[`mem_${m.id}`] = true;
    use(a, 3, 5, 'up', 'l2');
    assert.equal(a.flags.ch2_done, true);
    assert.equal(a.save.chapter, ch('grandroom').n + 1, '다음 장으로');
  });

  test('결곗값: 상자를 먼저 굴리면 복도 끝까지 가 버리고, 되돌리기 자리로 처음부터', () => {
    const a = start('grandroom');
    a.call('bori', true);
    use(a, 17, 18, 'left', 'g_box');
    assert.deepEqual(a.blockAt('g_box'), [1, 18], '의자가 없으면 상자는 벽까지 굴러간다');
    assert.ok(!a.flags.box_set);
    use(a, 13, 21, 'up', 'g_undo');
    assert.deepEqual(a.blockAt('g_box'), [16, 18]);
    assert.deepEqual(a.blockAt('g_chair'), [6, 20]);
  });
});

// ───────────────────────── 5장 이불장 ─────────────────────────

describe('5장 이불장을 처음부터 끝까지 (등불 밝기 · 야광 별 · 베개 디딤돌 · 이불 단 오르기)', () => {
  test('나비 등불은 깜깜한 이불장에서 줄고, 야광 별 · 번개 치는 창가에서 다시 찬다', () => {
    const a = start('closet');
    callPal(a, 'nabi');
    const max = a.lanternR();
    assert.equal(max, 5);
    stand(a, 30, 11, 'up');
    for (let i = 0; i < 60 * 20; i++) a.step(1 / 60, NO_INPUT);
    const low = a.lanternR();
    assert.ok(low < max - 1, `이불장 안에서 줄었다 ${low}`);
    assert.ok(low >= 1.2 - 1e-9, '최소 반지름 아래로는 안 준다');
    // 복도 끝 창가 (번개 빛)
    stand(a, 36, 19, 'up');
    for (let i = 0; i < 60 * 3; i++) a.step(1 / 60, NO_INPUT);
    assert.ok(a.lanternR() > low + 1, '창가에서 다시 찬다');
  });

  test('야광 별 셋을 붙이고, 베개를 밀어 디딤돌을 놓고, 밧줄로 꼭대기에 올라 모든 기억에 닿고 다음 장으로', () => {
    const a = start('closet');
    assert.deepEqual(cell(a), [4, 19]);
    const darkParts = () => a.things().filter((t) => t.kind === 'part').map((t) => t.id);
    assert.deepEqual(darkParts(), [], '나비 없이는 어둠 속 야광 별이 안 보인다');
    callPal(a, 'nabi');
    // 셋을 주워 이불장 문 안쪽에
    use(a, 18, 20, 'right', 'gs3');
    use(a, 32, 21, 'right', 'gs1');
    stand(a, 30, 13, 'up');
    assert.equal(a.flags.closet_in, true, '이불장에 들어서면 안내');
    use(a, 37, 13, 'up', 'gs2');
    assert.deepEqual(a.held().sort(), ['gs1', 'gs2', 'gs3']);
    use(a, 30, 13, 'up', 'glow_board');
    assert.equal(a.flags.glow_on, true);
    assert.match(a.stage.goal ?? '', /베개/);

    // 베개: 보리가 한 칸씩
    use(a, 29, 13, 'up', 'pillow');
    assert.deepEqual(a.blockAt('pillow'), [29, 12], '보리 없이는 꿈쩍 않는다');
    callPal(a, 'bori');
    use(a, 29, 13, 'up', 'pillow');
    use(a, 29, 12, 'up', 'pillow');
    use(a, 30, 10, 'left', 'pillow');
    use(a, 29, 10, 'left', 'pillow');
    assert.deepEqual(a.blockAt('pillow'), [27, 10]);
    assert.equal(a.flags.pillow_set, true);
    use(a, 28, 10, 'up', 'pillow_step');
    assert.deepEqual(cell(a), [28, 8]);
    assert.equal(a.stage.actors.toby.elev, 1, '가운데 칸 (높이 1)');
    // 맨 위 칸은 루루 밧줄: 루루 없이는 못 오른다
    use(a, 36, 7, 'up', 'quilt_rope');
    assert.equal(a.stage.actors.toby.elev, 1, '루루 없이는 못 오른다');
    callPal(a, 'ruru');
    use(a, 28, 10, 'up', 'pillow_step');
    use(a, 36, 7, 'up', 'quilt_rope');
    assert.deepEqual(cell(a), [36, 5]);
    assert.equal(a.stage.actors.toby.elev, 2, '맨 위 칸 (높이 2)');
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.match(a.stage.goal ?? '', /반짝이 실/);

    // 깜깜한 기억은 나비가 함께 있어야 보인다. 높이마다 그 층에 올라가서 걸어서 닿는다
    assert.ok(a.withMe().includes('nabi'), '나비는 야광 별부터 줄곧 함께');
    const mems = ROOMS.closet().things.filter((t): t is MemThing => isMemory(t));
    assert.equal(mems.length, 6);
    const goLevel = (e: number) => {
      stand(a, 28, 10, 'up');
      if (e >= 1) use(a, 28, 10, 'up', 'pillow_step');
      if (e >= 2) use(a, 36, 7, 'up', 'quilt_rope');
      assert.equal(a.stage.actors.toby.elev, e);
    };
    for (const m of mems) {
      goLevel(Number(ROOMS.closet().elev?.[m.at[1]][m.at[0]] ?? 0));
      assert.ok(canReach(a, m), `${m.id} (${m.at}) 에 닿지 않는다`);
    }
    goLevel(2);
    for (const m of mems) a.flags[`mem_${m.id}`] = true;
    use(a, 34, 5, 'up', 'lN');
    assert.equal(a.flags.lN_done, true);
    assert.equal(a.save.chapter, ch('closet').n + 1, '다음 장으로');
  });

  test('결곗값: 베개를 맨 아랫줄로 밀면 좀약에 막혀 꼼짝 못 하고, 되돌리기 자리로 처음 자리에', () => {
    const a = start('closet');
    a.call('bori', true);
    use(a, 29, 11, 'down', 'pillow');
    assert.deepEqual(a.blockAt('pillow'), [29, 13]);
    use(a, 30, 13, 'left', 'pillow');
    assert.deepEqual(a.blockAt('pillow'), [29, 13], '좀약 자리에 막혀 더 못 간다');
    assert.ok(!a.flags.pillow_set);
    use(a, 33, 12, 'down', 'pillow_undo');
    assert.deepEqual(a.blockAt('pillow'), [29, 12]);
  });
});

// ───────────────────────── 6장 거실 창가 ─────────────────────────

describe('6장 거실 창가를 처음부터 끝까지 (커튼 끈 · 전화선 매듭 · 괘종 씨 · 잠든 아빠)', () => {
  test('TV 는 켜져 있고 아빠는 소파에서 잔다: 실눈 뜰 때 움직이면 들켜서 숨었던 자리로, 괘종 씨에게 태엽을 주면 깊이 잠든다', () => {
    const a = start('window');
    assert.equal(a.stage.props['tv@17,3']?.state, 'on', 'TV 가 켜져 있다');
    const dad = a.stage.actors.dad_sofa4;
    assert.ok(dad, '소파의 아빠');
    assert.equal(dad.pose, 'sleep');
    assert.equal(dad.elev, 1, '소파 위에 누워 있다');
    // 눈을 감은 동안은 보이는 칸이 없다
    assert.equal(a.watchCells('dad_sofa4').size, 0);
    // 실눈 뜨는 박자까지 기다린다
    for (let i = 0; i < 60 * 8 && a.watchCells('dad_sofa4').size === 0; i++) a.step(1 / 60, NO_INPUT);
    const seen = [...a.watchCells('dad_sofa4')].map((k) => k.split(',').map(Number) as [number, number]).find(([x, y]) => !a.solid(x, y) && !a.solid(x + 1, y) && a.watchCells('dad_sofa4').has(`${x + 1},${y}`));
    assert.ok(seen, '아빠가 보는 칸이 있다');
    // 가만히 있으면 괜찮다
    a.place((seen[0] + 0.5) * T, (seen[1] + 0.5) * T);
    for (let i = 0; i < 30; i++) a.step(1 / 60, NO_INPUT);
    assert.equal(a.watchState('dad_sofa4')?.caught, 0, '가만히 있으면 안 들킨다');
    // 움직이면 들킨다
    for (let i = 0; i < 90 && !a.runner; i++) a.step(1 / 60, { ...NO_INPUT, move: { x: 0.15, y: 0 } } as AdvInput);
    const lines = finish(a);
    assert.equal(a.watchState('dad_sofa4')?.caught, 1);
    assert.ok(lines.some((l) => /움직였나/.test(l)), lines.join(' / '));
    assert.ok(!a.watchCells('dad_sofa4').has(`${cell(a)[0]},${cell(a)[1]}`) || a.watchCells('dad_sofa4').size === 0, '숨었던 자리로 돌아갔다');
    // 괘종 씨: 태엽을 나눠 주면 깊이 잠든다
    const w0 = a.save.wind;
    use(a, 14, 5, 'up', 'gclock');
    assert.ok(Math.abs(a.save.wind - (w0 - 0.1)) < 1e-9, '태엽이 준다');
    for (let i = 0; i < 60 * 20; i++) {
      a.step(1 / 60, NO_INPUT);
      assert.equal(a.watchCells('dad_sofa4').size, 0, '깊이 잠든 아빠는 보지 않는다');
    }
  });

  test('커튼 끈으로 창턱에, 전화선 매듭을 위 · 밑 · 밑으로 풀면 모든 기억에 닿고, 빈 유리병 자리로 다음 장', () => {
    const a = start('window');
    assert.deepEqual(cell(a), [3, 14]);
    assert.ok(!walkable(a).has('5,4'), '처음엔 창턱에 못 오른다');
    // 놀이 1: 커튼 끈 (루루)
    const no = use(a, 2, 4, 'right', 'curtain_cord');
    assert.ok(no.some((l) => /루루/.test(l)));
    callPal(a, 'ruru');
    use(a, 2, 4, 'right', 'curtain_cord');
    assert.deepEqual(cell(a), [3, 4]);
    assert.equal(a.stage.actors.toby.elev, 1);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.flags.on_sill, true);
    assert.ok(walkable(a).has('10,4'), '창턱 위를 화분 사이로 끝까지 걷는다');
    use(a, 3, 4, 'left', 'curtain_cord');
    assert.equal(a.stage.actors.toby.elev, 0);

    // 놀이 2: 전화선. 처음 매듭에서 밑으로 지나면 틀림 → 처음부터
    assert.ok(use(a, 26, 14, 'up', 'cord_end').some((l) => /위로, 밑으로, 밑으로/.test(l)));
    a.place((25 + 0.5) * T, (11 + 0.5) * T);
    a.step(1 / 60, NO_INPUT);
    const miss = finish(a);
    assert.ok(miss.some((l) => /더 꼬여/.test(l)), miss.join(' / '));
    assert.deepEqual(a.seqState('cord')?.pressed, []);
    for (const [x, y] of [[25, 10], [19, 14], [14, 11]] as const) {
      a.place((x + 0.5) * T, (y + 0.5) * T);
      a.step(1 / 60, NO_INPUT);
      finish(a);
    }
    assert.equal(a.flags.cord_free, true);
    settle(a);
    assert.match(a.stage.goal ?? '', /유리병/);
    assert.ok(a.things().some((t) => t.id === 'm4b'), '풀린 전화기 (비 오는 밤의 전화)');

    // 기억 일곱: 김 서린 유리(m4d)는 나비 등불 온기로 → 나비를 불러 온다
    assert.ok(!a.things().some((t) => t.id === 'm4d'));
    callPal(a, 'nabi');
    if (!a.withMe().includes('ruru')) callPal(a, 'ruru');
    const mems = ROOMS.window().things.filter((t): t is MemThing => isMemory(t));
    assert.equal(mems.length, 7);
    for (const m of mems) {
      const high = ROOMS.window().elev?.[m.at[1]][m.at[0]] === '1';
      stand(a, 2, 4, 'right');
      if (high) use(a, 2, 4, 'right', 'curtain_cord');
      assert.ok(canReach(a, m), `${m.id} (${m.at}) 에 닿지 않는다`);
    }
    for (const m of mems) a.flags[`mem_${m.id}`] = true;
    stand(a, 2, 4, 'right');
    use(a, 2, 4, 'right', 'curtain_cord');
    use(a, 10, 4, 'up', 'l4');
    assert.equal(a.flags.ch4_done, true);
    assert.equal(a.save.chapter, ch('window').n + 1);
  });
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

  test('책 계단을 놓고, 착한 늑대로 설득하고, 등불을 켜 그림자극을 올리면 아빠가 잠결에 박수 → 모든 기억 → 다음 장', () => {
    const a = start('shelf');
    assert.deepEqual(cell(a), [10, 14]);
    assert.ok(/네 시 오 분/.test(flat(ch('shelf').intro).map((c) => (c.t === 'say' ? c.text : '')).join(' ')), '도입 첫 지문에 시각');
    callPal(a, 'bori');
    stairs(a);
    assert.equal(a.flags.st1 && a.flags.st2 && a.flags.st3, true);
    settle(a);
    assert.equal(a.flags.stairs_done, true);
    assert.match(a.stage.goal ?? '', /늑대/);
    use(a, 24, 4, 'right', 'bookstair');
    assert.deepEqual(cell(a), [29, 4]);
    assert.equal(a.stage.actors.toby.elev, 1, '무대 칸 위');

    // 설득: 「비켜」 는 안 통하고, 「네가 주인공」 이면 커튼이 열린다
    use(a, 31, 4, 'right', 'wolf', 0);
    assert.ok(!a.flags.curtain_open);
    use(a, 31, 4, 'right', 'wolf', 1);
    assert.equal(a.flags.curtain_open, true);
    assert.match(a.stage.goal ?? '', /그림자극/);

    // 그림자극: 등불이 꺼져 있으면 비출 수 없다 → 나비를 불러 무대 옆 등을 켠다
    const dark = use(a, 32, 4, 'left', 'shadow_show');
    assert.ok(dark.some((l) => /나비 등불/.test(l)));
    assert.ok(!a.flags.show_done);
    callPal(a, 'nabi');
    use(a, 34, 5, 'up', 'stage_lamp');
    assert.equal(a.flags.lamp_stage_lamp, true);
    use(a, 24, 4, 'right', 'bookstair');
    const show = use(a, 32, 4, 'left', 'shadow_show');
    assert.equal(a.flags.show_done, true);
    assert.ok(show.some((l) => /잘했네/.test(l)), '아빠가 잠결에 박수');
    assert.equal(a.watchCells('dad_sofa6').size, 0, '공연 뒤 아빠는 깊이 잔다');

    // 기억 일곱: 걸어서 (무대 칸은 책 계단으로) 닿는다
    const mems = ROOMS.shelf().things.filter((t): t is MemThing => isMemory(t));
    assert.equal(mems.length, 7);
    for (const m of mems) {
      const high = ROOMS.shelf().elev?.[m.at[1]][m.at[0]] === '1';
      stand(a, 24, 4, 'right');
      if (high) use(a, 24, 4, 'right', 'bookstair');
      assert.ok(canReach(a, m), `${m.id} (${m.at}) 에 닿지 않는다`);
    }
    for (const m of mems) a.flags[`mem_${m.id}`] = true;
    stand(a, 24, 4, 'right');
    use(a, 24, 4, 'right', 'bookstair');
    use(a, 33, 4, 'up', 'l6');
    assert.equal(a.flags.ch6_done, true);
    assert.equal(a.save.chapter, ch('shelf').n + 1);
  });

  test('결곗값: 두꺼운 책 앞의 얇은 책을 먼저 위로 밀면 엉뚱한 칸에 끼고, 되돌리기로 처음 자리에', () => {
    const a = start('shelf');
    a.call('bori', true);
    use(a, 27, 7, 'up', 'bk1');
    use(a, 27, 6, 'up', 'bk1');
    assert.deepEqual(a.blockAt('bk1'), [27, 4], '두꺼운 책 자리에 얇은 책');
    assert.ok(!a.flags.st3 && !a.flags.st1, '높이가 안 맞으면 계단이 아니다');
    use(a, 22, 9, 'up', 'books_undo');
    for (const [id, at] of [['bk1', [27, 6]], ['bk2', [26, 8]], ['bk3', [25, 6]]] as const) assert.deepEqual(a.blockAt(id), at, id);
  });
});
