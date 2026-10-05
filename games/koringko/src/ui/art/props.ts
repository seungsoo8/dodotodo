/**
 * 지도 위 소품(나무·바위·사탕 나무…)과 건물 그림.
 * 모양은 모두 손으로 찍은 격자 (px/map.ts): 여기서는 변주마다 팔레트를 고르고, 덧그림(열매 · 글자 · 꽃)을 얹고,
 * 크기가 자리마다 다른 건물은 9-조각으로 늘인 뒤 따뜻한 색 외곽선을 두른다.
 */
import type { StructureKind } from '../../core/maps.ts';
import { Pix, hash2, hex, shade, toHex, type Color } from './paint.ts';
import { paintGrid, softOutline, type Grid, type Palette } from './px/grid.ts';
import { nine, palSpec } from './px/kit.ts';
import * as M from './px/map.ts';
import { T } from './tiles.ts';

const WARM = hex('#3a2430');

export interface Sprite {
  pix: Pix;
  /** 그림 왼쪽 위 = 칸 왼쪽 위 + (ox, oy) */
  ox: number;
  oy: number;
}

/** 격자 + 덧그림 → 외곽선 두른 그림 */
function draw(g: Grid, pal: Palette, adds: [Grid, number, number][] = []): Pix {
  const p = new Pix(g[0].length, g.length);
  paintGrid(p, g, 0, 0, pal);
  for (const [a, x, y] of adds) paintGrid(p, a, x, y, pal);
  return softOutline(p, WARM);
}

/** 그린 크기와 다르면 가운데 1/3 을 되풀이해 맞춘다 (9-조각) */
function fit(g: Grid, W: number, H: number): Grid {
  const w = g[0].length;
  const h = g.length;
  if (w === W && h === H) return g;
  return nine(g, Math.floor(w / 3), Math.ceil((w * 2) / 3), Math.floor(h / 3), Math.ceil((h * 2) / 3), W, H);
}

/** 막힌 칸 위에 서 있는 소품 (그 칸 아래쪽이 발) */
export function propSprite(c: string, tx: number, ty: number): Sprite | null {
  const v = hash2(tx, ty, 5);
  switch (c) {
    case 'T':
      return { pix: tree(v), ox: -6, oy: -24 };
    case 'P':
      return { pix: pine(v), ox: -4, oy: -26 };
    case 'B':
      return { pix: bush(v), ox: 0, oy: 4 };
    case 'o':
      return { pix: rock(v), ox: 2, oy: 6 };
    case 'f':
      return { pix: fence(), ox: 0, oy: 4 };
    case 'l':
      return { pix: lollipop(v), ox: 1, oy: -18 };
    case 'k':
      return { pix: cookieBlock(v), ox: 0, oy: -8 };
    case 'c':
      return { pix: crystal(v), ox: 3, oy: -4 };
    case 'K':
      return { pix: crate(v), ox: 1, oy: -6 };
    case 'Q': {
      const pix = toyBlock(tx, ty);
      return { pix, ox: 0, oy: -10 - (pix.h - 34) };
    }
    case 'O':
      return { pix: marbleProp(v), ox: 3, oy: 2 };
    case 'G':
      return { pix: deskThing(v), ox: 0, oy: -8 };
    case 'L':
      return { pix: lostThing(v), ox: 2, oy: 0 };
    default:
      return null;
  }
}

const CACHE = new Map<string, Pix>();
function cached(key: string, make: () => Pix): Pix {
  let p = CACHE.get(key);
  if (!p) {
    p = make();
    CACHE.set(key, p);
  }
  return p;
}

function tree(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`tree${k}`, () => {
    const leaf = ['#4f9a44', '#5aa64a', '#47903e'][k];
    const fruit: [Grid, number, number][] = k === 1 ? [[M.FRUIT, 9, 15], [M.FRUIT, 23, 11], [M.FRUIT, 19, 21]] : [];
    return draw(M.TREE, palSpec(`.uWwv=#7a4e2c;GgCcj=${leaf};X=#2a4a24;1=#e86a6a;2=#f8a8a0`), fruit);
  });
}

function pine(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`pine${k}`, () => draw(M.PINE, palSpec(`.uWwv=#6a4426;GgCcj=${k ? '#2e7a52' : '#357e4a'}`)));
}

function bush(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`bush${k}`, () => draw(M.BUSH, palSpec('GgCcj=#4a9440;1=#ffe06a'), k ? [[M.BLOSSOM, 7, 9], [M.BLOSSOM, 15, 7], [M.BLOSSOM, 17, 13]] : []));
}

function rock(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`rock${k}`, () => draw(M.ROCK, palSpec('IiMmz=#9a96a0'), k ? [[M.ROCK_PEBBLE, 0, 0]] : []));
}

function fence(): Pix {
  return cached('fence', () => draw(M.FENCE, palSpec('.uWwv=#c8955a')));
}

function lollipop(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`lolli${k}`, () => draw(M.LOLLIPOP, palSpec(`OoPpy=#f4f0e8;GgCcj=${['#ff5a8a', '#5ac8f0', '#a0e05a'][k]};1=#fff6f8`)));
}

function cookieBlock(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`cookie${k}`, () => draw(M.COOKIE, palSpec('GgCcj=#c88a4a;X=#5a3420;1=#fbf6f0'), k ? [[M.COOKIE_ICING, 0, 0]] : []));
}

function crystal(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`crystal${k}`, () => draw(M.CRYSTAL, palSpec(`GgCcj=${['#7ad8ff', '#c890ff', '#8affc8'][k]}`)));
}

// ───────────────────────── 장난감 블록 ─────────────────────────

/** 원목 블록이 절반쯤, 나머지는 차분하게 칠한 블록 */
const BLOCK_COLORS = ['#cfa06a', '#cfa06a', '#c48f5a', '#c8574b', '#4f7fb8', '#e0b04a', '#5f9a62', '#d98fa0', '#8a76b8'].map(hex);
const WOODEN = 3;
const LETTERS = ['ㄱ', 'A', '★', '♥', '1', 'ㅋ', 'B', '○'];

/** 블록 한 개 (윗면 + 앞면) 를 p 의 (0, y0) 에. 원목은 글자를 새기고, 칠한 블록은 크림색 글자 */
function blockFace(p: Pix, y0: number, c: Color, letter: string | null, wooden: boolean): void {
  const pal = { ...palSpec(`GgCcj=${toHex(c)}`), M: wooden ? shade(c, -0.42) : hex('#f2e6cc') };
  paintGrid(p, wooden ? M.BLOCK_WOOD : M.BLOCK_PAINT, 0, y0, pal);
  if (letter) paintGrid(p, M.BLOCK_MARKS[letter], 6, y0 + 15, pal);
}

/** 장난감 블록 더미 한 칸: 가끔 두 개를 쌓아 높낮이가 생긴다 */
function toyBlock(tx: number, ty: number): Pix {
  const k = Math.floor(hash2(tx, ty, 71) * BLOCK_COLORS.length);
  const tall = hash2(tx, ty, 72) < 0.28;
  const k2 = Math.floor(hash2(tx, ty, 73) * BLOCK_COLORS.length);
  const li = hash2(tx, ty, 74) < 0.55 ? Math.floor(hash2(tx, ty, 75) * LETTERS.length) : -1;
  const li2 = hash2(tx, ty, 76) < 0.4 ? Math.floor(hash2(tx, ty, 77) * LETTERS.length) : -1;
  return cached(`block${k}${tall ? `t${k2}${li2}` : ''}l${li}`, () => {
    const p = new Pix(24, tall ? 56 : 34);
    blockFace(p, tall ? 22 : 0, BLOCK_COLORS[k], li >= 0 ? LETTERS[li] : null, k < WOODEN);
    if (tall) blockFace(p, 0, BLOCK_COLORS[k2], li2 >= 0 ? LETTERS[li2] : null, k2 < WOODEN);
    return softOutline(p, WARM);
  });
}

/** 굴러다니는 구슬 */
function marbleProp(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`marble${k}`, () => draw(M.MARBLE, palSpec(`GgCcj=${['#7ad0ff', '#ff8ab8', '#8ae070'][k]};1=#f8fcff`)));
}

/** 나무 상자 (공장) */
function crate(v: number): Pix {
  return cached(`crate${v < 0.5 ? 0 : v > 0.7 ? 2 : 1}`, () =>
    draw(M.CRATE, palSpec(`.uWwv=${v < 0.5 ? '#b07a40' : '#a06a38'};1=#e0b030;2=#5a4020`), v > 0.7 ? [[M.CRATE_LABEL, 0, 0]] : []),
  );
}

/** 책상 위 물건: 지우개 · 시계 톱니 · 연필깎이 */
function deskThing(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`desk${k}`, () =>
    k === 0
      ? draw(M.DESK_ERASER, palSpec('GgCcj=#ff9ab8;.hAas=#3a6ab8;1=#fff6f8;2=#c86a88'))
      : k === 1
        ? draw(M.DESK_GEAR, palSpec('GgCcj=#d8b040;X=#5a4020'))
        : draw(M.DESK_SHARPENER, palSpec('GgCcj=#e04a4a;X=#2a1a1a;IiMmz=#c8c8d0')),
  );
}

/** 침대 밑 잃어버린 물건: 야광 별 · 단추 · 양말 한 짝 (빛이 난다) */
function lostThing(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`lost${k}`, () =>
    k === 0
      ? draw(M.LOST_STAR, palSpec('GgCcj=#c8ff9a;1=#fbfff4'))
      : k === 1
        ? draw(M.LOST_BUTTON, palSpec('GgCcj=#9ad8ff;X=#2a3a5a'))
        : draw(M.LOST_SOCK, palSpec('OoPpy=#f0f0f8;GgCcj=#5ad88a')),
  );
}

// ───────────────────────── 건물 ─────────────────────────

const HOUSE_BASE = '.uWwv=#8a5632;.hAas=#f8d890;1=#e0b04a;2=#ff8ab0;3=#ffd84a;4=#a0603a;5=#cfa06a;6=#fff0c8';
const HOUSES: Partial<Record<StructureKind, [Grid, string]>> = {
  house: [M.HOUSE, `GgCcj=#d0784a;OoPpy=#e2cfa8;${HOUSE_BASE}`],
  shop: [M.HOUSE_SHOP, `GgCcj=#e05a4a;OoPpy=#ecd2a8;${HOUSE_BASE};IiMmz=#c8c8d8;7=#e8414f;8=#f2e4c8`],
  forge: [M.HOUSE_FORGE, `GgCcj=#6a7888;OoPpy=#aaa49c;${HOUSE_BASE};IiMmz=#4a4a58;.lBbn=#8a6a5a;8=#f2e4c8`],
  tailor: [M.HOUSE_TAILOR, `GgCcj=#f08ab0;OoPpy=#f0d8d4;${HOUSE_BASE};IiMmz=#9aa8b8;8=#f2e4c8`],
  chief: [M.HOUSE_CHIEF, `GgCcj=#8a5ac8;OoPpy=#e9dcc0;${HOUSE_BASE};7=#d8b040;9=#8a6a20`],
};
const f4 = <X>(xs: X[], frame: number) => xs[((frame % xs.length) + xs.length) % xs.length];

/** 건물 그림. 칸 사각형(x,y,w,h) 위로 지붕이 솟는다 */
export function structureSprite(kind: StructureKind, w: number, h: number, frame = 0): Sprite {
  const key = `${kind}${w}x${h}f${frame}`;
  const W = w * T;
  const H = h * T;
  switch (kind) {
    case 'chief':
    case 'shop':
    case 'forge':
    case 'tailor':
    case 'house': {
      const [g, spec] = HOUSES[kind]!;
      return { pix: cached(key, () => draw(fit(g, W, H + 14), palSpec(spec))), ox: 0, oy: -14 };
    }
    case 'fountain':
      return { pix: cached(key, () => draw(f4([M.FOUNTAIN_0, M.FOUNTAIN_1, M.FOUNTAIN_2, M.FOUNTAIN_3], frame), palSpec('OoPpy=#f2ede4;GgCcj=#e48aa0;.hAas=#5a7ab8;IiMmz=#4a9ae0;1=#bfe4ff;2=#e8f4ff'))), ox: -6, oy: -16 };
    case 'well':
      return { pix: cached(key, () => draw(M.WELL, palSpec('OoPpy=#a8a098;X=#2a3a5a;.uWwv=#8a5a34;GgCcj=#c85a3a;IiMmz=#c8c8c8'))), ox: 0, oy: -16 };
    case 'board':
      return { pix: cached(key, () => draw(M.BOARD, palSpec('.uWwv=#a8743e;OoPpy=#f2e4c8;1=#ffe08a;2=#c8e8ff;3=#e8414f'))), ox: 2, oy: -10 };
    case 'lamp':
      return { pix: cached(key, () => draw(M.LAMP, palSpec('OoPpy=#efe4cc;GgCcj=#ffd27a;.hAas=#ffe9b0;1=#ff9a6a;.uWwv=#8a6a4a;2=#e0a050'))), ox: -1, oy: -18 };
    case 'tent':
      return { pix: cached(key, () => draw(fit(M.TENT, W, H + 12), palSpec('GgCcj=#ff8ab8;OoPpy=#fbf4f6;.uWwv=#7a3a5a;1=#ffd84a'))), ox: 0, oy: -12 };
    case 'gate':
      return { pix: cached(key, () => draw(fit(M.GATE, W, H + 8), palSpec('IiMmz=#8a8098;X=#1a1424;GgCcj=#d8b040'))), ox: 0, oy: -8 };
    case 'altar':
      return { pix: cached(key, () => draw(f4([M.ALTAR_0, M.ALTAR_1, M.ALTAR_2, M.ALTAR_3], frame), palSpec('IiMmz=#8a8098;GgCcj=#ffd84a;1=#fff4c0'))), ox: 0, oy: -8 };
    case 'cart':
      return { pix: cached(key, () => draw(M.CART, palSpec('.uWwv=#a8743e;.hAas=#6a4426;1=#ff6a6a;2=#ffd84a;3=#6ad86a;4=#ff9a3c'))), ox: 0, oy: 0 };
    case 'portal':
      return { pix: cached(key, () => draw(f4([M.PORTAL_0, M.PORTAL_1, M.PORTAL_2, M.PORTAL_3], frame), palSpec('GgCcj=#8a5aff;.hAas=#4a3a6a;1=#fbf8ff;2=#d8c8ff;3=#5a3ad8'))), ox: -8, oy: -24 };
    case 'cocoon':
      return { pix: cached(key, () => draw(f4([M.COCOON_0, M.COCOON_1, M.COCOON_2, M.COCOON_3], frame), palSpec('IiMmz=#8a8098;GgCcj=#ffd060;1=#ffe8b0;2=#fbfbff'))), ox: 0, oy: -14 };
    case 'chest':
      return { pix: cached(key, () => draw(frame === 1 ? M.CHEST_1 : M.CHEST_0, palSpec('.uWwv=#b07a40;GgCcj=#ffc83a;X=#3a2010;1=#fbfbff'))), ox: 0, oy: -6 };
    case 'ladder':
      return { pix: cached(key, () => draw(fit(M.LADDER, 40, H + 10), palSpec('.uWwv=#c8955a'))), ox: 4, oy: -10 };
    case 'door':
      return { pix: cached(key, () => draw(fit(M.DOOR, W, H + 8), palSpec('.uWwv=#9a6a3a;1=#ffd84a'))), ox: 0, oy: -8 };
    case 'slide':
      return { pix: cached(key, () => draw(M.SLIDE, palSpec('GgCcj=#e8414f;.hAas=#3a8ae0;.lBbn=#ffc83a'))), ox: 0, oy: -20 };
    case 'stage':
      return { pix: cached(key, () => draw(f4([M.STAGE_0, M.STAGE_1, M.STAGE_2, M.STAGE_3], frame), palSpec('.uWwv=#b07a40;1=#e8414f;2=#ffc83a;3=#3a8ae0;4=#4fb04a;5=#f08ab0;6=#ffe08a'))), ox: 0, oy: -18 };
  }
}
