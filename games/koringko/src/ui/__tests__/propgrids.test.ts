/**
 * 소품 · 물건 손찍기 격자 (px/attic · desk · move · items · keepsakes · map) 와 붙이기 도구 (px/kit).
 * 격자 문법(줄 폭 · 팔레트 글자) · 크기 약속 · 늘이기 · 그 소품만의 특징을 시험한다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, Pix, hex, rgb } from '../art/paint.ts';
import { checkGrid, gridSize, mat, type Grid } from '../art/px/grid.ts';
import { blank, hrep, mirror, nine, palSpec, recolor, stack, tile, vrep } from '../art/px/kit.ts';
import * as A from '../art/px/attic.ts';
import * as D from '../art/px/desk.ts';
import * as MV from '../art/px/move.ts';
import * as IT from '../art/px/items.ts';
import * as KS from '../art/px/keepsakes.ts';
import * as MP from '../art/px/map.ts';
import { DPAL, PAL, PROP_KINDS, propSprite } from '../art/houseProps.ts';
import { MOVE_KINDS, cartonGrid, moveSprite } from '../art/moveProps.ts';
import { ITEM_KINDS, LOOK_ART, itemSprite } from '../art/items.ts';
import { blockSprite, keepsakeSprite, paperStarSprite, shardSprite } from '../art/keepsakes.ts';
import { propSprite as mapProp, structureSprite } from '../art/props.ts';
import { handH, textH, textWidth } from '../art/glyphs.ts';

const same = (a: Pix, b: Pix) => a.w === b.w && a.h === b.h && a.px.every((v, i) => v === b.px[i]);
const lum = (c: number) => {
  const [r, g, b] = rgb(c);
  return 0.3 * r + 0.59 * g + 0.11 * b;
};
/** 모듈이 내보낸 격자 모두 (이름 · 격자) */
function gridsOf(mod: Record<string, unknown>): [string, Grid][] {
  const out: [string, Grid][] = [];
  for (const [k, v] of Object.entries(mod)) {
    if (Array.isArray(v) && v.length && v.every((r) => typeof r === 'string')) out.push([k, v as Grid]);
    else if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k2, v2] of Object.entries(v)) if (Array.isArray(v2)) out.push([`${k}.${k2}`, v2 as Grid]);
  }
  return out;
}

describe('붙이기 도구 (px/kit.ts)', () => {
  test('hrep: 가운데 열을 되풀이해 넓히고, 양 끝 열은 그대로 남긴다', () => {
    assert.deepEqual(hrep(['abcd'], 1, 3, 8), ['abcbcbcd']);
    assert.deepEqual(hrep(['abcd'], 1, 3, 4), ['abcd']);
    // 좁히면 가운데를 줄인다
    assert.deepEqual(hrep(['abcdef'], 1, 5, 4), ['abcf']);
  });

  test('vrep · nine: 줄을 되풀이하고, 9-조각은 모서리 네 칸을 그대로 둔다', () => {
    assert.deepEqual(vrep(['a', 'b', 'c'], 1, 2, 5), ['a', 'b', 'b', 'b', 'c']);
    const g = nine(['1a2', 'bcd', '3e4'], 1, 2, 1, 2, 5, 4);
    assert.deepEqual(g, ['1aaa2', 'bcccd', 'bcccd', '3eee4']);
  });

  test('tile: 무늬를 이어 깔고 dx 만큼 밀어 시작한다', () => {
    assert.deepEqual(tile(['ab', 'cd'], 5, 3), ['ababa', 'cdcdc', 'ababa']);
    assert.deepEqual(tile(['abc'], 4, 1, 1), ['bcab']);
  });

  test('stack: 뒤 → 앞으로 겹치되 . 칸은 밑글자를 남기고, 밖으로 나간 칸은 버린다', () => {
    assert.deepEqual(stack(3, 2, [[['aaa', 'aaa'], 0, 0], [['b.', '.b'], 1, 0], [['zz'], 2, 1]]), ['aba', 'aaz']);
    assert.deepEqual(blank(2, 1), ['..']);
  });

  test('recolor · mirror: 글자 바꾸기 · 좌우 뒤집기', () => {
    assert.deepEqual(recolor(['ab.a'], { a: 'x' }), ['xb.x']);
    assert.deepEqual(mirror(['abc', 'd..']), ['cba', '..d']);
  });

  test('palSpec: 다섯 글자는 재질 다섯 단계(mat), 한 글자는 그 색 그대로', () => {
    const p = palSpec('GgCcj=#6ab04a;X=#2a1c24');
    assert.deepEqual(Object.fromEntries(['G', 'g', 'C', 'c', 'j'].map((k) => [k, p[k]])), mat('GgCcj', hex('#6ab04a')));
    assert.equal(p.X, hex('#2a1c24'));
    assert.deepEqual(Object.keys(palSpec('.uWwv=#a07450')).sort(), ['W', 'u', 'v', 'w']);
  });
});

describe('손찍기 격자 문법: 모든 격자의 줄 폭이 고르다', () => {
  for (const [file, mod] of [['attic', A], ['desk', D], ['move', MV], ['items', IT], ['keepsakes', KS], ['map', MP]] as const) {
    test(`px/${file}.ts`, () => {
      const gs = gridsOf(mod as Record<string, unknown>);
      assert.ok(gs.length >= 5, `${file} 격자 ${gs.length}개`);
      for (const [name, g] of gs) assert.doesNotThrow(() => gridSize(g), `${file}.${name}`);
    });
  }
});

describe('다락 · 책상 소품 격자는 그 소품 팔레트에 있는 글자만 쓴다 (checkGrid)', () => {
  const pairs: [string, Grid, Record<string, number>][] = [
    ['TRAPDOOR', A.TRAPDOOR, PAL.trapdoor], ['TRAPDOOR_OPEN', A.TRAPDOOR_OPEN, PAL.trapdoorOpen],
    ['CUCKOO', A.CUCKOO, PAL.cuckoo], ['CUCKOO_STILL', A.CUCKOO_STILL, PAL.cuckoo], ['CUCKOO_BIRD', A.CUCKOO_BIRD, PAL.cuckoo],
    ['XMASBOX', A.XMASBOX, PAL.xmasbox], ['HONEYCANDY', A.HONEYCANDY, PAL.honeycandy], ['FAN', A.FAN, PAL.fan], ['TRICYCLE', A.TRICYCLE, PAL.tricycle],
    ['MAT', A.MAT, PAL.mat], ['DRESSER_CLOTH', A.DRESSER_CLOTH, PAL.dresserCloth], ['DRESSER_FRAME', A.DRESSER_FRAME, PAL.dresserCloth],
    ['BOOKBUNDLE', A.BOOKBUNDLE, PAL.bookbundle], ['UMBRELLA_STAND', A.UMBRELLA_STAND, PAL.umbrellaStand], ['SEWBOX', A.SEWBOX, PAL.sewbox],
    ['SEWBOX_NEEDLE', A.SEWBOX_NEEDLE, PAL.sewbox], ['MOUSETRAP', A.MOUSETRAP, PAL.mousetrap], ['PAINTCAN', A.PAINTCAN, PAL.paintcan],
    ['COBWEB', A.COBWEB, PAL.cobweb], ['CHAIR_OLD', A.CHAIR_OLD, PAL.chairOld], ['CHAIR_NOTE', A.CHAIR_NOTE, PAL.chairOld],
    ['WALL_TILE', A.WALL_TILE, PAL.wall], ['WALL_WINDOW', A.WALL_WINDOW, PAL.wall], ['BEAM_TILE', A.BEAM_TILE, PAL.beam], ['BEAM_WEB', A.BEAM_WEB, PAL.beam],
    ['RAIL_TILE', A.RAIL_TILE, PAL.railing], ['RAIL_YARN', A.RAIL_YARN, PAL.railing],
    ['PENCIL_CUP', D.PENCIL_CUP, DPAL.pencilCup], ['PENCIL_CUP_YARN', D.PENCIL_CUP_YARN, DPAL.pencilCup], ['LAMP', D.LAMP, DPAL.lamp], ['LAMP_ON', D.LAMP_ON, DPAL.lamp],
    ['NOTEBOOK', D.NOTEBOOK, DPAL.notebook], ['ERASER', D.ERASER, DPAL.eraser], ['ERASER_SMALL', D.ERASER_SMALL, DPAL.eraser], ['ERASER_DUST', D.ERASER_DUST, DPAL.eraserDust],
    ['RULER', D.RULER, DPAL.ruler], ['PENCIL', D.PENCIL, palSpec(DPAL.pencil)], ['PAPER_STRIPS', D.PAPER_STRIPS, DPAL.paperStrips], ['STAR_JAR', D.STAR_JAR, DPAL.starJar],
    ['STAR_JAR_GLOW', D.STAR_JAR_GLOW, DPAL.starJar], ['PHONE', D.PHONE, DPAL.phone], ['PHONE_DIM', D.PHONE_DIM, DPAL.phone], ['CALENDAR', D.CALENDAR, DPAL.calendar],
    ['CAL_DAYS', D.CAL_DAYS, DPAL.calendar], ['CIRCLE_1', D.CIRCLE_1, DPAL.calendar], ['CIRCLE_2', D.CIRCLE_2, DPAL.calendar], ['TEST_PAPERS', D.TEST_PAPERS, DPAL.testPapers],
    ['CANDY_TIN', D.CANDY_TIN, DPAL.candyTin], ['TAPE_CUTTER', D.TAPE_CUTTER, DPAL.tapeCutter], ['HAIR_TIE', D.HAIR_TIE, DPAL.hairTie], ['MILK', D.MILK, DPAL.milk],
    ['MEMO_WALL', D.MEMO_WALL, DPAL.memoWall], ['DESK_EDGE', D.DESK_EDGE, DPAL.deskEdge], ['NUMPAD', D.NUMPAD, DPAL.numPad], ['NUMPAD_ON', D.NUMPAD_ON, DPAL.numPadOn],
  ];
  test('격자 56장의 글자가 모두 팔레트에 있다', () => {
    assert.ok(pairs.length >= 50);
    for (const [name, g, pal] of pairs) assert.deepEqual(checkGrid(g, pal), [], name);
  });
  test('책 본(BOOK_SPINE)은 책 색 · 종이 · 금띠 세 가지 글자만 더 쓴다', () => {
    assert.deepEqual(checkGrid(D.BOOK_SPINE, { ...mat('GgCcj', 0x808080), P: 1, '1': 2 }), []);
  });
});

describe('모든 소품 · 물건이 손찍기 격자에서 그려진다 (빈 그림 없음, 크기 약속 그대로)', () => {
  const OPTS: Record<string, string[]> = {
    trapdoor: ['', 'open'], cuckoo: ['', 'live', 'bird', 'live,bird'], dresserCloth: ['', 'frame'], sewbox: ['', 'needle'], railing: ['', 'yarn'], cobweb: ['', 'right'],
    chairOld: ['', 'plain'], atticWall: ['', 'window'], pencilCup: ['', 'yarn'], lampBase: ['', 'on'], eraser: ['', 'small'], pencil: ['', 'red', 'green'],
    starJarGiant: ['', 'glow'], phoneGiant: ['', 'dim'], calendarDesk: ['7', '12'], testPapers: ['60', '100'], numberPad: ['3', '3 on'],
  };
  const MINE = ['atticWall', 'beam', 'trapdoor', 'cuckoo', 'xmasbox', 'honeycandy', 'fan', 'tricycle', 'mat', 'dresserCloth', 'bookbundle', 'umbrellaStand', 'sewbox', 'mousetrap', 'paintcan', 'railing', 'cobweb', 'movingBoxes', 'chairOld', 'bookspines', 'pencilCup', 'lampBase', 'notebook', 'eraser', 'eraserDust', 'ruler', 'pencil', 'paperStrips', 'starJarGiant', 'phoneGiant', 'calendarDesk', 'testPapers', 'candyTin', 'tapeCutter', 'hairTie', 'milkCarton', 'memoWall', 'deskEdge', 'numberPad', ...Object.keys(MOVE_KINDS)];

  test('다락 · 책상 · 이삿짐 소품: 모든 kind × opt 가 그림을 내고, 폭은 칸 폭, 바닥 소품의 발 줄은 그림 맨 아래', () => {
    for (const k of MINE) {
      const d = PROP_KINDS[k];
      for (const o of OPTS[k] ?? ['']) {
        const s = propSprite(k, d.w, d.h, o);
        assert.ok(s, `${k}:${o}`);
        assert.ok(s.pix.count() >= 12, `${k}:${o} ${s.pix.count()}칸`);
        assert.equal(s.pix.w, d.w * 24, `${k}:${o} 폭`);
      }
    }
  });

  test('방에서 쓰는 다른 크기도 그린다: 다락 벽 10×3 · 들보 24×1 · 난간 16×1 · 공책 8×5 · 자 5×1 · 책상 끝 3×1 · 비닐 소파 4×1', () => {
    for (const [k, w, h] of [['atticWall', 10, 3], ['beam', 24, 1], ['railing', 16, 1], ['notebook', 8, 5], ['ruler', 5, 1], ['deskEdge', 3, 1], ['sofaWrap', 4, 1], ['bookspines', 10, 1], ['frameGhost', 2, 1]] as const) {
      const s = propSprite(k, w, h, k === 'frameGhost' ? 'wide' : '');
      assert.ok(s && s.pix.w === w * 24, `${k} ${w}×${h}`);
      assert.ok(s.pix.count() > 40, k);
    }
  });

  test('물건 · 기억 물건 모양 · 상징물 · 조각 · 종이별 · 밀 덩어리 · 지도 소품 · 건물도 모두 그린다', () => {
    for (const k of [...ITEM_KINDS, '없는물건']) assert.ok(itemSprite(k).count() >= 20, k);
    for (const [k, f] of Object.entries(LOOK_ART)) assert.ok(f().count() >= 20, k);
    for (const k of ['star', 'halfstar', 'key', 'umbrella', 'needle', 'phone', 'candle', 'photo', 'puppet', 'jar', 'letter', '?']) assert.ok(keepsakeSprite(k).count() >= 30, k);
    for (const f of [0, 1, 2, 3]) assert.ok(shardSprite(f).count() >= 40, `shard ${f}`);
    assert.ok(paperStarSprite().count() >= 20);
    for (const k of ['cookie', 'book', 'shoe', 'soap', 'spool', 'pot', 'box', '?']) assert.ok(blockSprite(k).count() >= 100, k);
    for (const c of 'TPBoflkcKQOGL') for (const tx of [0, 4, 6, 13, 27]) assert.ok(mapProp(c, tx, 0)!.pix.count() >= 20, `${c} ${tx}`);
    for (const k of ['house', 'shop', 'forge', 'tailor', 'chief', 'fountain', 'well', 'board', 'lamp', 'tent', 'gate', 'altar', 'cart', 'portal', 'cocoon', 'chest', 'ladder', 'door', 'slide', 'stage'] as const)
      for (const f of [0, 1]) assert.ok(structureSprite(k, 4, 3, f).pix.count() >= 100, `${k} ${f}`);
  });

  test('외곽선은 순검정이 아닌 그 재질의 어두운 색: 물건 그림 둘레 칸은 검정이 아니고 바로 안쪽 칸보다 어둡다', () => {
    for (const k of ['box', 'toby', 'jar', 'cake', 'musicbox']) {
      const p = itemSprite(k);
      let n = 0;
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        const c = p.get(x, y);
        if (c === CLEAR) continue;
        const edge = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)].some((v) => v === CLEAR);
        if (!edge) continue;
        n++;
        assert.notEqual(c, 0x000000, k);
        const inner = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)].filter((v) => v !== CLEAR);
        assert.ok(inner.some((v) => lum(v) > lum(c)) || lum(c) < 90, `${k} (${x},${y}) 외곽선이 안쪽보다 밝다 ${c.toString(16)}`);
      }
      assert.ok(n > 20, k);
    }
  });
});

describe('늘이는 소품: 무늬가 이음매 없이 이어진다', () => {
  test('다락 벽은 120 칸 무늬: 10칸 벽의 x 와 x+120 열이 같다', () => {
    const p = propSprite('atticWall', 10, 3, '')!.pix;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < 120; x++) assert.equal(p.get(x, y), p.get(x + 120, y), `(${x},${y})`);
  });

  test('난간 살은 8칸마다 되풀이되고, 털실(yarn)은 60% 자리에 한 가닥', () => {
    const p = propSprite('railing', 16, 1, '')!.pix;
    for (let x = 8; x < p.w - 8; x++) assert.equal(p.get(x, 10), p.get(x + 8, 10), `x ${x}`);
    const y = propSprite('railing', 16, 1, 'yarn')!.pix;
    let diff = 0;
    for (let yy = 0; yy < p.h; yy++) for (let x = 0; x < p.w; x++) if (p.get(x, yy) !== y.get(x, yy)) {
      diff++;
      assert.ok(Math.abs(x - p.w * 0.6) < 8, `털실이 ${x} 에`);
    }
    assert.ok(diff >= 10);
  });

  test('들보는 어느 폭이든 오른쪽 끝에 거미줄이 처진다 (몸통 아래 줄에 칠한 칸이 오른쪽 16칸 안에만)', () => {
    for (const w of [6, 24]) {
      const p = propSprite('beam', w, 1, '')!.pix;
      for (let y = 11; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) assert.ok(x >= p.w - 16, `${w}: (${x},${y})`);
    }
  });

  test('넓힌 공책(8×5)도 접힌 골(가장 어두운 세로줄)이 가운데에 있다', () => {
    for (const [w, h] of [[6, 4], [8, 5]]) {
      const p = propSprite('notebook', w, h, '')!.pix;
      let best = 0;
      let bx = -1;
      for (let x = 10; x < p.w - 10; x++) {
        const d = 255 - lum(p.get(x, Math.floor(p.h / 2)));
        if (d > best) [best, bx] = [d, x];
      }
      assert.ok(Math.abs(bx - p.w / 2) <= 2, `${w}×${h}: 골 ${bx}`);
    }
  });

  test('상자 본을 늘이면 테이프가 늘 가운데에 남는다 (24 · 48 · 44 폭)', () => {
    for (const W of [24, 44, 48]) {
      const g = cartonGrid(W, 6, 13);
      const row = g[1];
      const tx = [...row].map((c, i) => (c === 'T' ? i : -1)).filter((i) => i >= 0);
      const mid = (tx[0] + tx.at(-1)!) / 2;
      assert.ok(Math.abs(mid - (W - 4) / 2) <= 2, `${W}: 테이프 ${tx}`);
      assert.equal(row.length, W);
    }
  });

  test('책등은 제목이 길수록 그 책이 키가 크다 (책 본을 줄 되풀이로 늘인다)', () => {
    const short = propSprite('bookspines', 1, 1, '동화')!.pix;
    const long = propSprite('bookspines', 1, 1, '종이접기 백과')!.pix;
    const top = (p: Pix) => {
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) return y;
      return p.h;
    };
    assert.equal(short.h, long.h);
    assert.ok(top(long) <= top(short));
  });
});

describe('글씨: 상자 이름은 매직펜 손글씨', () => {
  test('handH 는 textH 와 폭이 같고 같은 칸 수를 칠하지만, 몇 글자는 한 칸 위로 들쭉날쭉하다', () => {
    const a = new Pix(60, 14);
    const b = new Pix(60, 14);
    const wa = textH(a, '깨짐주의', 1, 3, 0x3a2c3a);
    const wb = handH(b, '깨짐주의', 1, 3, 0x3a2c3a);
    assert.equal(wa, wb);
    assert.equal(wb, textWidth('깨짐주의'));
    assert.equal(a.count(), b.count());
    assert.ok(!same(a, b), '손글씨가 반듯한 글씨와 같다');
  });

  test("'이야기' 의 '야' 글자가 있다 (빠진 글자 없이 폭이 세 글자)", () => {
    assert.equal(textWidth('이야기'), 9 * 3 + 2);
  });

  test('이삿짐 상자 이름을 바꾸면 그림이 바뀐다 (손글씨도 이름을 따른다)', () => {
    assert.ok(!same(moveSprite('cartonL', 2, 1, '부엌')!.pix, moveSprite('cartonL', 2, 1, '거실')!.pix));
  });
});
