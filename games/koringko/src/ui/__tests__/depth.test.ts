/**
 * 입체감 그리기 (REDESIGN §4 · ENGINE0 §4): 칸 종류(뒷벽 앞면 · 벽 두께 · 문 · 단), 그리기 층 순서,
 * 가구 그림자 방향, 3면 가구, HUD 목표 줄.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { house, houseMap } from '../../core/adv/story/kit.ts';
import { TILE } from '../../core/maps.ts';
import { HT, LOOKS, floorTile, furnitureSprite } from '../art/house.ts';
import { CLEAR, type Color } from '../art/paint.ts';
import { buildHousePlan, houseCells } from '../render/housePlan.ts';
import { orderDraws, planEntries, type DrawEntry } from '../render/order.ts';

const rgb = (c: Color) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const lum = (c: Color) => rgb(c).reduce((a, b) => a + b, 0) / 3;

/** 칸 (tx, ty) 안의 모든 색 */
function cellColors(p: { get(x: number, y: number): Color }, tx: number, ty: number): Color[] {
  const out: Color[] = [];
  for (let y = 0; y < HT; y++) for (let x = 0; x < HT; x++) out.push(p.get(tx * HT + x, ty * HT + y));
  return out;
}

describe('벽 칸 종류 (E2)', () => {
  // 10×8, 뒷벽 3줄, 옆 · 아래 테두리는 W (지금 house() 지도)
  const r = house('t_walls', 'haru10', 10, 8, []);
  const cells = houseCells(r);

  test('house() 의 옆 · 아래 테두리 W 는 벽 두께, 위 3줄 W 는 뒷벽 앞면 (위에서부터 0 · 1 · 2번째 줄)', () => {
    assert.equal(cells[4][0].kind, 'thick', '왼쪽 테두리');
    assert.equal(cells[4][9].kind, 'thick', '오른쪽 테두리');
    assert.equal(cells[7][5].kind, 'thick', '아래 테두리');
    assert.equal(cells[0][0].kind, 'thick', '왼쪽 위 모서리도 옆벽 두께');
    for (const row of [0, 1, 2]) {
      assert.equal(cells[row][5].kind, 'front');
      assert.deepEqual([cells[row][5].row, cells[row][5].rows], [row, 3]);
    }
    assert.equal(cells[3][5].kind, 'floor');
  });

  test('두께 칸에는 벽지 무늬가 없고, 앞면 칸에는 있다 (haru10 = 줄무늬 accent)', () => {
    const plan = buildHousePlan(r);
    const L = LOOKS.haru10;
    const accent = (tx: number, ty: number) => cellColors(plan.back, tx, ty).filter((c) => c === L.accent).length;
    assert.equal(accent(0, 4), 0, '왼쪽 옆벽');
    assert.equal(accent(9, 5), 0, '오른쪽 옆벽');
    assert.equal(accent(4, 7), 0, '아래 벽');
    assert.ok(accent(4, 1) > 40, `뒷벽 가운데 줄 벽지 무늬 ${accent(4, 1)}`);
  });

  test('뒷벽 맨 아랫줄만 걸레받이, 맨 윗줄 위 6px 는 벽지보다 짙은 윗면 띠', () => {
    const plan = buildHousePlan(r);
    const L = LOOKS.haru10;
    const has = (tx: number, ty: number, c: Color) => cellColors(plan.back, tx, ty).includes(c);
    assert.ok(has(4, 2, L.base), '맨 아랫줄(2) 걸레받이');
    assert.ok(!has(4, 1, L.base), '가운데 줄(1) 에는 걸레받이가 없다');
    assert.ok(!has(4, 0, L.base), '맨 윗줄(0) 에는 걸레받이가 없다');
    for (let y = 0; y < 6; y++) assert.ok(lum(plan.back.get(4 * HT + 7, y)) < lum(L.wall) - 40, `윗면 띠 y=${y}`);
    assert.ok(Math.abs(lum(plan.back.get(4 * HT + 7, 14)) - lum(L.wall)) < 30 || plan.back.get(4 * HT + 7, 14) === L.accent, '띠 아래는 벽지');
  });

  test('houseMap 의 X · D · S · ^ · U 칸 종류', () => {
    const m = houseMap({
      id: 't_map',
      w: 14,
      h: 9,
      rooms: [
        { id: 'a', rect: [1, 0, 6, 8], look: 'haru10', raised: [[2, 4, 3, 1]] },
        { id: 'b', rect: [8, 0, 5, 8], look: 'kitchen' },
      ],
      doors: [{ between: ['a', 'b'], at: 6 }],
      furniture: [{ kind: 'table', x: 9, y: 4, w: 2, h: 2, under: true }],
    });
    const c = houseCells(m);
    assert.equal(c[4][7].kind, 'thick', '세로 칸막이');
    assert.equal(c[6][7].kind, 'door');
    assert.equal(c[4][2].kind, 'high');
    assert.equal(c[5][2].kind, 'step');
    assert.equal(c[4][9].kind, 'under');
    assert.equal(c[1][3].look, LOOKS.haru10, '방 a 의 벽은 haru10');
    assert.equal(c[1][10].look, LOOKS.kitchen, '방 b 의 벽은 kitchen');
    assert.equal(c[1][10].kind, 'front');
    // 두께 칸에 벽지 무늬 없음 · 가구 밑은 바닥보다 25% 어둡다
    const plan = buildHousePlan(m);
    assert.equal(cellColors(plan.back, 7, 3).filter((x) => x === LOOKS.haru10.accent || x === LOOKS.kitchen.accent).length, 0);
    const ref = floorTile(LOOKS.kitchen, 9, 4);
    const ratio = lum(plan.back.get(9 * HT + 13, 4 * HT + 13)) / lum(ref.get(13, 13));
    assert.ok(ratio > 0.68 && ratio < 0.82, `가구 밑 밝기 비 ${ratio}`);
  });
});

describe('그림자 (E7)', () => {
  test('가구 그림자는 오른쪽 아래로: 가구 오른쪽 아래 바닥이 같은 무늬의 맨바닥보다 어둡고, 왼쪽 아래는 그대로', () => {
    for (const kind of ['wardrobe', 'boxes', 'sofa']) {
      const r = house(`t_sh_${kind}`, 'haru10', 14, 11, [[kind, 5, 5, 2, 1, true]]);
      const plan = buildHousePlan(r);
      const L = LOOKS.haru10;
      const foot = 6 * TILE;
      const sample = (x: number, y: number) => {
        const ref = floorTile(L, Math.floor(x / HT), Math.floor(y / HT)).get(x % HT, y % HT);
        return lum(plan.back.get(x, y)) / lum(ref);
      };
      const right = sample(7 * TILE + 4, foot + 3);
      const left = sample(5 * TILE - 5, foot + 3);
      assert.ok(right < 0.88, `${kind}: 오른쪽 아래 밝기 비 ${right}`);
      assert.ok(left > 0.97, `${kind}: 왼쪽 아래 밝기 비 ${left}`);
      // 접지 선: 가구 발 바로 아래 가운데는 오른쪽 아래보다도 진하다
      const ground = sample(6 * TILE, foot);
      assert.ok(ground < right, `${kind}: 접지 선 ${ground} ≥ 그림자 ${right}`);
    }
  });

  test('키 큰 가구(장롱)의 그림자가 낮은 가구(상자)보다 길다', () => {
    const len = (kind: string) => {
      const r = house(`t_len_${kind}`, 'haru10', 16, 12, [[kind, 5, 5, 2, 1, true]]);
      const plan = buildHousePlan(r);
      const y = 6 * TILE + 2;
      let n = 0;
      for (let x = 7 * TILE; x < 7 * TILE + 60; x++) {
        const ref = floorTile(LOOKS.haru10, Math.floor(x / HT), Math.floor(y / HT)).get(x % HT, y % HT);
        if (lum(plan.back.get(x, y)) / lum(ref) < 0.9) n++;
      }
      return n;
    };
    assert.ok(len('wardrobe') > len('toybox'), `장롱 ${len('wardrobe')} · 장난감 상자 ${len('toybox')}`);
  });
});

describe('3면 가구 (E4 · E5)', () => {
  const L = LOOKS.haru10;
  const meanLum = (p: { get(x: number, y: number): Color; w: number }, y0: number, y1: number, x0: number, x1: number) => {
    let s = 0;
    let n = 0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const c = p.get(x, y);
        if (c === CLEAR) continue;
        s += lum(c);
        n++;
      }
    return n ? s / n : NaN;
  };
  for (const [kind, w, h] of [['bed', 2, 3], ['table', 3, 2], ['desk', 3, 1], ['sofa', 3, 1], ['toybox', 2, 1]] as const) {
    test(`${kind}: 윗면(밝음) · 앞면(높이 8px 이상, 중간) · 오른쪽 옆면(가장 어두움)`, () => {
      const s = furnitureSprite(kind, w, h, L);
      assert.ok(s.faces, '면 정보가 없다');
      const f = s.faces!;
      assert.ok(f.frontH >= 8, `앞면 높이 ${f.frontH}`);
      assert.equal(f.frontY + f.frontH, s.pix.h - f.legs, '앞면은 다리 위에서 끝난다');
      const W = s.pix.w;
      const top = meanLum(s.pix, f.topY, f.frontY, 3, W - 6);
      const front = meanLum(s.pix, f.frontY + 1, f.frontY + f.frontH - 1, 3, W - 6);
      const side = meanLum(s.pix, f.frontY + 1, f.frontY + f.frontH - 1, W - 1 - f.sideW, W - 1);
      assert.ok(top > front, `윗면 ${top} ≤ 앞면 ${front}`);
      assert.ok(front > side, `앞면 ${front} ≤ 옆면 ${side}`);
    });
  }

  test('장롱은 사람 키(40px)보다 높은 윗부분 top 을 따로 준다: base + top 이 원래 그림과 같다', () => {
    const s = furnitureSprite('wardrobe', 2, 1, L);
    assert.ok(s.top, 'top 이 없다');
    assert.equal(s.base.h, s.pix.h);
    const split = s.topH;
    assert.ok(split > 0 && s.pix.h - 2 - split <= 44 && s.pix.h - 2 - split >= 36, `나눔 줄 ${split} (발에서 ${s.pix.h - 2 - split}px)`);
    for (let y = 0; y < s.pix.h; y++)
      for (let x = 0; x < s.pix.w; x++) {
        const want = s.pix.get(x, y);
        const got: Color = y < split ? s.top!.get(x, y) : s.base.get(x, y);
        assert.equal(got, want, `(${x},${y})`);
        if (y < split) assert.equal(s.base.get(x, y), CLEAR);
      }
    assert.equal(furnitureSprite('table', 3, 2, L).top, undefined, '식탁은 사람보다 낮다');
  });
});

describe('그리기 층 순서 (E3)', () => {
  const r = houseMap({
    id: 't_order',
    w: 14,
    h: 10,
    rooms: [{ id: 'a', rect: [1, 0, 12, 9], look: 'haru10' }],
    furniture: [
      { kind: 'wardrobe', x: 5, y: 5, w: 2, h: 1, solid: true },
      { kind: 'garland', x: 2, y: 6, w: 3, h: 1, over: true },
      { kind: 'plant', x: 11, y: 7, w: 1, h: 1, fg: true },
    ],
  });
  const plan = buildHousePlan(r);
  const order = () => {
    const log: string[] = [];
    const es: DrawEntry[] = planEntries(plan, (s, layer) => log.push(`${layer}:${s.kind}`));
    const wardFoot = 6 * TILE - 2;
    es.push({ layer: 'props', foot: wardFoot - 20, id: 'behind', draw: () => log.push('actor:behind') });
    es.push({ layer: 'props', foot: wardFoot + 20, id: 'front', draw: () => log.push('actor:front') });
    for (const e of orderDraws(es)) e.draw();
    return log;
  };

  test('가구는 base(props) · top · over · fg 층으로 나뉜다', () => {
    assert.ok(plan.props.some((s) => s.kind === 'wardrobe'));
    assert.ok(plan.tops.some((s) => s.kind === 'wardrobe'));
    assert.ok(plan.over.some((s) => s.kind === 'garland'));
    assert.ok(plan.fg.some((s) => s.kind === 'plant'));
    assert.ok(!plan.props.some((s) => s.kind === 'garland' || s.kind === 'plant'), 'over · fg 가구는 발 정렬에 끼지 않는다');
  });

  test('장롱 뒤 인물 → 장롱 base → 장롱 앞 인물 → 장롱 top → over 가구 → fg 가림막', () => {
    const log = order();
    const at = (s: string) => {
      const i = log.indexOf(s);
      assert.ok(i >= 0, `${s} 가 그려지지 않았다: ${log.join(', ')}`);
      return i;
    };
    assert.ok(at('actor:behind') < at('props:wardrobe'), '뒤 인물이 장롱 아랫부분에 가려야 한다');
    assert.ok(at('props:wardrobe') < at('actor:front'), '앞 인물이 장롱 아랫부분 위에');
    assert.ok(at('actor:front') < at('top:wardrobe'), '장롱 윗부분은 인물보다 나중');
    assert.ok(at('actor:behind') < at('top:wardrobe'));
    assert.ok(at('top:wardrobe') < at('over:garland'), 'over 는 top 다음');
    assert.ok(at('over:garland') < at('fg:plant'), 'fg 는 맨 마지막');
  });
});
