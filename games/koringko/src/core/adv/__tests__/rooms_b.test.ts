/**
 * 사람 크기 복도 · 거실 배치 (layout_b): 할머니 방 · 이불장 · 거실 창가 · 책장의 같은 배치 · 앵커 · 기억 물건.
 * 막을 처음부터 끝까지 풀어 보는 시험은 acts.test.ts (모든 막) · acts_b.test.ts · acts_c.test.ts 에 있다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isMemory, type MemThing } from '../adv.ts';
import { ROOMS } from '../story/index.ts';
import { hallHouse, livingHouse } from '../story/layout_b.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { DECAL_KINDS } from '../story/kit.ts';
import { MOVE_KINDS } from '../../../ui/art/moveProps.ts';
import { isSolidChar } from '../../maps.ts';
import type { RoomDef } from '../types.ts';
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
      // 막 구조: 숨바꼭질(watcher)을 걷어 내면 잠든 아빠는 같은 자리의 npc (잠꼬대)
      const dad = r.things.find((t) => (t.kind === 'watcher' || t.kind === 'npc') && t.actor === 'dad');
      assert.ok(dad && (dad.kind === 'watcher' || dad.kind === 'npc'), `${id}: 소파의 아빠`);
      if (dad.kind === 'watcher') assert.ok(dad.moveOnly, `${id}: 잠결이라 움직일 때만 들킨다`);
      else assert.equal(dad.pose, 'sleep', `${id}: 아빠는 잠들어 있다`);
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

