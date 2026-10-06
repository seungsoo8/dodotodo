import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, Pix, hex, type Color } from '../art/paint.ts';
import { checkGrid, gridSize, type Grid, type Palette } from '../art/px/grid.ts';
import { paintTiled, type Seg } from '../art/px/slice.ts';
import { allHouseTileGrids, WOOD_SHEET, woodPal, WALLPAPER } from '../art/px/houseTiles.ts';
import * as FA from '../art/px/furnA.ts';
import * as FB from '../art/px/furnB.ts';
import * as FC from '../art/px/furnC.ts';
import * as FD from '../art/px/furnD.ts';
import * as TX from '../art/px/toyTiles.ts';
import { HT, LOOKS, floorTile, furnitureSprite, wallFaceTile } from '../art/house.ts';
import { groundTile } from '../art/tiles.ts';
import { decalSprite, type DecalKind } from '../art/room.ts';
import { abyssSprite, ABYSS_SIZE } from '../art/abyss.ts';

const colors = (p: { px: Int32Array }): Set<Color> => new Set(Array.from(p.px).filter((c) => c !== CLEAR));
const filled = (p: { px: Int32Array }): number => Array.from(p.px).filter((c) => c !== CLEAR).length;

const ALL: [string, Grid, Palette][] = [
  ...allHouseTileGrids().map(([n, g, p]) => [`houseTiles.${n}`, g, p] as [string, Grid, Palette]),
  ...FA.allFurnAGrids().map(([n, g, p]) => [`furnA.${n}`, g, p] as [string, Grid, Palette]),
  ...FB.allFurnBGrids().map(([n, g, p]) => [`furnB.${n}`, g, p] as [string, Grid, Palette]),
  ...FC.allFurnCGrids().map(([n, g, p]) => [`furnC.${n}`, g, p] as [string, Grid, Palette]),
  ...FD.allFurnDGrids().map(([n, g, p]) => [`furnD.${n}`, g, p] as [string, Grid, Palette]),
  ...TX.allToyGrids().map(([n, g, p]) => [`toyTiles.${n}`, g, p] as [string, Grid, Palette]),
];

describe('집 · 가구 · 장난감 지도 손찍기 격자', () => {
  test('모든 격자: 줄 폭이 고르고, 쓰는 팔레트에 있는 글자만 쓴다', () => {
    assert.ok(ALL.length > 200, `격자 ${ALL.length}`);
    for (const [name, g, pal] of ALL) {
      assert.doesNotThrow(() => gridSize(g), name);
      assert.deepEqual(checkGrid(g, pal), [], name);
    }
  });

  test('조각 맞춤 격자: 가로 · 세로 조각 길이의 합이 격자 크기와 같다', () => {
    const len = (s: Seg) => (typeof s === 'number' ? s : s[0]);
    let n = 0;
    for (const mod of [FA, FB, FC, FD, TX] as Record<string, unknown>[])
      for (const [name, v] of Object.entries(mod)) {
        const s = v as FA.Sliced;
        if (!s || !Array.isArray(s.g) || !Array.isArray(s.cols)) continue;
        n++;
        assert.equal(s.cols.reduce<number>((a, c) => a + len(c), 0), s.g[0].length, `${name} 가로`);
        assert.equal(s.rows.reduce<number>((a, c) => a + len(c), 0), s.g.length, `${name} 세로`);
      }
    assert.ok(n > 40, `조각 맞춤 격자 ${n}`);
  });
});

describe('바닥 · 벽 (전체 좌표로 이어지는 반복 무늬)', () => {
  test('마루: 이웃한 두 칸이 한 장의 마루 격자에서 이어 잘린 것 (칸 경계에 이음 자국이 없다)', () => {
    const L = LOOKS.haru10;
    const a = floorTile(L, 6, 3);
    const b = floorTile(L, 7, 3);
    const both = new Pix(HT * 2, HT);
    // floorTile 과 같은 자리 (칸 줄마다 엇갈린 시작점) 를 한 번에 두 칸 폭으로
    const ref = floorTile(L, 6, 3);
    let off = -1;
    for (let o = 0; o < WOOD_SHEET[0].length && off < 0; o++) {
      const t = paintTiled(new Pix(HT, HT), WOOD_SHEET, woodPal(L.floor), 0, 0, HT, HT, 6 * HT + o, 3 * HT);
      if (t.px.every((c, i) => c === ref.px[i])) off = o;
    }
    assert.ok(off >= 0, '마루 격자에서 시작점을 찾지 못했다');
    paintTiled(both, WOOD_SHEET, woodPal(L.floor), 0, 0, HT * 2, HT, 6 * HT + off, 3 * HT);
    for (let y = 0; y < HT; y++)
      for (let x = 0; x < HT; x++) {
        assert.equal(a.get(x, y), both.get(x, y));
        assert.equal(b.get(x, y), both.get(HT + x, y));
      }
  });

  test('마루 널은 8줄마다 이음 틈 (가장 어두운 줄)', () => {
    const L = LOOKS.haru10;
    const t = floorTile(L, 2, 2);
    const dark = woodPal(L.floor).d;
    for (const y of [0, 8, 16]) assert.ok(Array.from({ length: HT }, (_, x) => t.get(x, y)).every((c) => c === dark), `줄 ${y}`);
  });

  test('벽지 무늬: 별 · 꽃 · 물방울 · 줄무늬 · 타일 모두 꾸밈의 무늬 색(accent)을 그대로 쓴다', () => {
    for (const id of ['haru4', 'grandma', 'haru7', 'haru10', 'kitchen']) {
      const L = LOOKS[id];
      assert.ok(WALLPAPER[L.pattern], `${id} 무늬 격자`);
      const t = wallFaceTile(L, 5, 1, 1, 3);
      assert.ok(colors(t).has(L.accent), `${id} 무늬 색이 없다`);
    }
  });

  test('징두리 판벽은 맨 아랫줄에만, 걸레받이 색은 꾸밈의 base 그대로', () => {
    const L = LOOKS.grandma;
    const low = wallFaceTile(L, 3, 2, 2, 3);
    const mid = wallFaceTile(L, 3, 1, 1, 3);
    assert.ok(colors(low).has(L.base));
    assert.ok(!colors(mid).has(L.base));
    assert.ok(colors(low).size > colors(mid).size, '판벽 · 걸레받이로 색이 더 많다');
  });
});

describe('가구 그림 (크기 · 나눔 약속 유지)', () => {
  const L = LOOKS.haru10;
  const KINDS: [string, number, number, string][] = [
    ['bed', 3, 4, '#8ac0e8'], ['crib', 2, 2, ''], ['desk', 3, 1, 'jar'], ['chair', 1, 1, ''], ['shelf', 2, 1, ''], ['claw', 2, 1, ''], ['wardrobe', 2, 1, ''],
    ['toybox', 2, 1, 'open'], ['window', 3, 2, 'night'], ['door', 1, 2, 'closed'], ['rug', 6, 3, ''], ['table', 4, 2, 'cloth+cake'], ['sofa', 4, 2, ''],
    ['tv', 3, 1, ''], ['plant', 1, 1, ''], ['boxes', 2, 1, 'label'], ['boxes', 3, 2, 'label,open'], ['sewing', 3, 1, 'thread,dust'], ['photo', 2, 2, ''], ['clock', 2, 2, ''],
    ['garland', 5, 2, ''], ['hbed', 3, 4, 'gm'], ['iv', 1, 1, ''], ['fence', 6, 1, ''], ['flowers', 4, 1, ''], ['puddle', 3, 2, ''], ['mud', 3, 2, ''], ['bush', 3, 2, ''],
    ['stage', 4, 2, ''], ['bathtub', 5, 3, 'bubble'], ['sink', 3, 1, ''], ['facade', 18, 3, ''], ['truck', 6, 2, ''], ['swing', 3, 2, ''], ['mailbox', 1, 1, ''],
    ['bike', 2, 1, '#5a9ad8'], ['railing', 6, 1, ''], ['stool', 1, 1, ''], ['pots', 3, 1, ''], ['cushion', 2, 2, ''], ['calendar', 2, 2, 'x'],
    ['pole', 1, 1, 'l7r7'], ['lamp', 1, 1, ''], ['tree', 1, 1, 'persimmon'], ['gate', 3, 2, 'open'], ['nwall', 5, 2, 'red:ivy'], ['shop', 7, 3, ''], ['bldg', 10, 3, 'hospital'],
    ['bldg', 8, 3, 'school'], ['busstop', 2, 1, ''], ['bench', 2, 1, 'wet'], ['slide', 3, 2, ''], ['swingset', 4, 1, ''], ['seesaw', 3, 1, ''], ['jungle', 3, 2, ''],
    ['crosswalk', 4, 2, ''], ['road', 20, 2, ''], ['sandbox', 5, 3, ''], ['ruts', 20, 2, ''], ['well', 2, 1, ''], ['thatch', 9, 3, ''], ['stonewall', 10, 1, ''],
    ['signpost', 1, 1, 'school'], ['cart', 2, 1, 'load'], ['crocks', 2, 1, ''],
  ];

  test('모든 가구가 비지 않은 그림을 내고, 그림 폭은 칸 폭 이상', () => {
    for (const [k, w, h, opt] of KINDS) {
      const s = furnitureSprite(k, w, h, L, opt);
      assert.ok(filled(s.pix) > (w * h * HT * HT) / 20, `${k}:${opt} 거의 빈 그림 ${filled(s.pix)}`);
      assert.ok(s.pix.w >= w * HT, `${k} 폭 ${s.pix.w}`);
    }
  });

  test('3면 가구 · 키 큰 가구 · 열린 상자의 크기 약속 (그림 크기 · 발 자리 · 면 자리)', () => {
    const bed = furnitureSprite('bed', 3, 4, L);
    assert.deepEqual([bed.pix.w, bed.pix.h, bed.oy], [72, 108, -108]);
    assert.deepEqual(bed.faces, { topY: 28, frontY: 96, frontH: 12, sideW: 3, legs: 0 });
    const desk = furnitureSprite('desk', 3, 1, L);
    assert.deepEqual([desk.pix.h, desk.faces?.topY, desk.faces?.frontY, desk.faces?.legs], [16 + 16 + 8 + 14, 16, 32, 14]);
    const ward = furnitureSprite('wardrobe', 2, 1, L);
    assert.deepEqual([ward.pix.w, ward.pix.h, ward.wall], [48, 72, true]);
    assert.ok(ward.top && ward.topH > 0, '장롱 윗부분 나눔');
    const box = furnitureSprite('boxes', 3, 2, LOOKS.attic, 'label,open');
    assert.deepEqual([box.pix.w, box.pix.h, box.ox, box.oy], [90, 84, -9, -74]);
    assert.ok(box.behind && filled(box.behind) > 0 && filled(box.base) > 0, '열린 상자 뒤 · 앞 부분');
    const pole = furnitureSprite('pole', 1, 1, LOOKS.alley, 'l7r7');
    assert.deepEqual([pole.pix.w, pole.ox], [24 * 15, -24 * 7]);
  });

  test('벽시계: live 면 바늘을 그리지 않는다 (render 가 그린다)', () => {
    const still = furnitureSprite('clock', 2, 2, L, '');
    const live = furnitureSprite('clock', 2, 2, L, 'live');
    const ink = FB.clockPal().k;
    const count = (p: Pix) => Array.from(p.px).filter((c) => c === ink).length;
    assert.ok(count(still.pix) > count(live.pix) + 8, `바늘 ${count(still.pix)} · live ${count(live.pix)}`);
  });

  test('창: 밤 하늘엔 달 · 별, 낮 하늘엔 구름, 커튼은 방 무늬 색', () => {
    const night = furnitureSprite('window', 3, 2, L, 'night');
    const day = furnitureSprite('window', 3, 2, L, 'day');
    const wp = FB.windowPal('night', L.accent);
    assert.ok(colors(night.pix).has(wp.M), '달이 없다');
    assert.ok(!colors(day.pix).has(wp.M));
    assert.ok(colors(day.pix).has(FB.windowPal('day', L.accent).X), '구름이 없다');
    assert.ok(colors(night.pix).has(wp.C), '커튼 색');
  });

  test('할머니 방 문(closed)엔 이름표가 붙는다', () => {
    const name = FB.namePal().L;
    assert.ok(colors(furnitureSprite('door', 1, 2, L, 'closed').pix).has(name));
    assert.ok(!colors(furnitureSprite('door', 1, 2, L, '').pix).has(name));
  });

  test('덤불은 잎 덩이를 겹친 둥근 실루엣: 그림 네 귀퉁이는 비어 있다', () => {
    const s = furnitureSprite('bush', 3, 2, LOOKS.yardDay).pix;
    for (const [x, y] of [[0, 0], [s.w - 1, 0]]) assert.equal(s.get(x, y), CLEAR, `(${x},${y})`);
    assert.ok(colors(s).has(FC.bushPal(hex('#4a8a4a')).e), '깊은 그늘이 없다');
  });

  test('열린 이삿짐 상자: 뜯긴 테이프는 뒷날개 · 앞면에 하나씩만 (늘였을 때 되풀이되지 않는다)', () => {
    const s = furnitureSprite('boxes', 3, 2, LOOKS.attic, 'open');
    const cp = FA.cartonPal();
    const isTape = (c: Color) => c === cp.T || c === cp.t;
    const runs = (p: Pix, y: number) => {
      let n = 0;
      for (let x = 1; x < p.w; x++) if (isTape(p.get(x, y)) && !isTape(p.get(x - 1, y))) n++;
      return n;
    };
    const rimF = FA.CARTON_BACK.g.length;
    assert.equal(runs(s.behind!, 5), 1, '뒷날개 테이프');
    assert.equal(runs(s.base, rimF + 4), 1, '앞면 테이프');
  });
});

describe('장난감 눈높이 지도', () => {
  test('마룻바닥(w)은 16줄마다 널 이음 (가장 어두운 줄)', () => {
    const t = groundTile('w', 4, 4);
    const d = TX.toyPlankPal(hex('#b47c4c')).d;
    const y = (16 - ((4 * 24) % 16)) % 16;
    assert.ok(Array.from({ length: 24 }, (_, x) => t.get(x, y)).every((c) => c === d), `줄 ${y}`);
  });

  test('바닥의 작은 물건은 모두 비지 않은 격자 그림 (외곽선 포함, 가운데 칸이 칠해짐)', () => {
    const kinds: DecalKind[] = ['crayon', 'button', 'brick', 'star', 'puzzle', 'sock', 'clip', 'eraser', 'shaving', 'pin'];
    for (const kind of kinds) {
      const s = decalSprite({ kind, x: 0, y: 0, v: 0.3 });
      assert.ok(filled(s) >= 12, kind);
    }
  });

  test('아득한 아래 바닥 한 장: 240×240 크기 약속 · 슬리퍼 격자가 찍혀 있다', () => {
    const a = abyssSprite('room');
    assert.deepEqual([a.w, a.h], [ABYSS_SIZE, ABYSS_SIZE]);
    assert.ok(colors(a).has(TX.farPal(hex('#7a5a40')).P), '슬리퍼');
  });
});
