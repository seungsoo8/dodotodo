import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMap, isSolid, TILE } from '../../core/maps.ts';
import { groundTile } from '../art/tiles.ts';
import { outerWalls, toyDecals, rugsFor } from '../art/room.ts';
import { staticLights } from '../render/light.ts';
import type { Pix } from '../art/paint.ts';

/** 두 타일 그림에서 서로 다른 픽셀 비율 */
function diff(a: Pix, b: Pix): number {
  let n = 0;
  for (let i = 0; i < a.px.length; i++) if (a.px[i] !== b.px[i]) n++;
  return n / a.px.length;
}

describe('바닥이 타일 도장처럼 되풀이되지 않는다', () => {
  test('장난감 상자 마루: 옆 칸 · 4칸 옆 · 아래 칸이 모두 다르게 생겼다', () => {
    for (const [dx, dy] of [[1, 0], [4, 0], [0, 1], [0, 2]]) {
      const d = diff(groundTile('w', 10, 10), groundTile('w', 10 + dx, 10 + dy));
      assert.ok(d > 0.4, `(${dx},${dy}) ${d}`);
    }
  });

  test('블록 마을 양탄자: 4칸마다 같은 무늬가 찍히지 않는다', () => {
    let same = 0;
    for (let i = 0; i < 6; i++) if (diff(groundTile('a', 3 + i, 5), groundTile('a', 7 + i, 5)) < 0.2) same++;
    assert.ok(same <= 1, `같은 그림 ${same}`);
  });

  test('퍼즐 매트 길: 매트 한 장은 2×2 칸, 이웃 매트는 색이 다르고 맞물리는 돌기가 있다', () => {
    const mid = (p: Pix) => p.get(12, 12);
    // 같은 매트 안의 두 칸은 같은 색, 경계 너머는 다른 색
    assert.equal(mid(groundTile('#', 4, 4)), mid(groundTile('#', 5, 4)));
    let knobs = 0;
    for (let ty = 0; ty < 12; ty++) {
      const a = groundTile('#', 5, ty);
      const b = groundTile('#', 6, ty);
      assert.notEqual(mid(a), mid(b), `${ty}`);
      for (let y = 0; y < 24; y++) for (let x = 0; x < 6; x++) if (a.get(23 - x, y) === mid(b) || b.get(x, y) === mid(a)) knobs++;
    }
    assert.ok(knobs > 20, `돌기 ${knobs}`);
  });
});

describe('장난감 상자의 벽', () => {
  test('바깥 테두리는 상자의 나무 벽, 안쪽 블록 더미는 따로 (블록 장난감)', () => {
    const m = buildMap('toybox');
    const outer = outerWalls(m);
    assert.ok(outer.has(0 * m.w + 0), '모서리');
    // 가운데의 큰 블록 더미 (14,4)~(17,12)
    assert.ok(!outer.has(8 * m.w + 15), '안쪽 더미는 바깥 벽이 아니다');
    for (const k of outer) {
      const x = k % m.w;
      const y = (k - x) / m.w;
      assert.equal(m.tiles[y][x], 'Q');
    }
  });
});

describe('방 안에 흩어진 것들', () => {
  test('장난감 상자 바닥에 크레용 · 단추 · 블록 조각 · 야광 별이 흩어져 있다 (걸을 수 있는 바닥에만)', () => {
    const m = buildMap('toybox');
    const ds = toyDecals(m);
    assert.ok(ds.length >= 20, `${ds.length}`);
    const kinds = new Set(ds.map((d) => d.kind));
    for (const k of ['crayon', 'button', 'brick', 'star']) assert.ok(kinds.has(k as never), k);
    for (const d of ds) assert.ok(!isSolid(m, Math.floor(d.x / TILE), Math.floor(d.y / TILE)), `${d.kind} ${d.x},${d.y}`);
    // 같은 지도는 늘 같은 자리
    assert.deepEqual(toyDecals(buildMap('toybox')), ds);
  });

  test('블록 마을 양탄자에도 장난감이 조금 흩어져 있다 (퍼즐 매트 길 위에는 없다)', () => {
    const m = buildMap('village');
    const ds = toyDecals(m);
    assert.ok(ds.length >= 6, `${ds.length}`);
    for (const d of ds) assert.equal(m.tiles[Math.floor(d.y / TILE)][Math.floor(d.x / TILE)], 'a', `${d.x},${d.y}`);
  });

  test('야광 별 스티커는 어둠 속에서 은은하게 빛난다', () => {
    const m = buildMap('toybox');
    const stars = toyDecals(m).filter((d) => d.kind === 'star');
    const ls = staticLights(m);
    for (const s of stars) assert.ok(ls.some((l) => Math.hypot(l.x - s.x, l.y - s.y) < 4 && l.color[1] > l.color[2]), `${s.x},${s.y}`);
  });

  test('곰 대장 자리에는 둥근 러그가 깔려 있다 (싸움터가 한눈에)', () => {
    const m = buildMap('toybox');
    const b = m.boss!;
    const rugs = rugsFor(m);
    assert.ok(rugs.some((r) => Math.hypot(r.cx - (b.x + 0.5) * TILE, r.cy - (b.y + 0.5) * TILE) < TILE * 2 && r.rx >= TILE * 4));
  });
});
