/**
 * 갈래 C 소품 (3장 안방 · 7장 현관 · 10장 욕실 · 12장 · 19장 부엌): 사람 크기 집(24px 칸)의 큰 가구와 기억 물건.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 * 3면 규칙 (윗면 밝게 · 앞면 중간 · 오른쪽 옆면 가장 어둡게), 사람 키보다 높은 부분은 top 으로 나뉜다. 순검정 · 순흰색 없음.
 */
import { Pix } from './paint.ts';
import type { Faces, PropSprite } from './houseProps.ts';
import { PERSON_SPRITE_H } from './sizes.ts';
import { blank, draw, flipG, hs, nine, onto, pal, put, swap, tile, vs } from './px/chapkit.ts';
import type { Grid, Palette } from './px/grid.ts';
import * as X from './px/chapC.ts';
import { box, door, knob } from './px/chapbox.ts';

const HT = 24;

/** 종류 · 기본 칸 크기 (모두 사람 크기 방) */
export const PROPS_C_KINDS: Record<string, { w: number; h: number }> = {
  fridge: { w: 2, h: 1 },
  kcounter: { w: 6, h: 1 },
  wallCab: { w: 3, h: 2 },
  shoeCabinet: { w: 2, h: 1 },
  drawerFront: { w: 1, h: 1 },
  riceSack: { w: 1, h: 1 },
  ribbon: { w: 1, h: 1 },
  apron: { w: 1, h: 1 },
  jewelBox: { w: 1, h: 1 },
  dryRack: { w: 2, h: 1 },
  shoePair: { w: 1, h: 1 },
  ceilLamp: { w: 1, h: 1 },
  duck: { w: 1, h: 1 },
  towelPile: { w: 1, h: 1 },
  gourd: { w: 1, h: 1 },
  shelfBoard: { w: 4, h: 1 },
  perfume: { w: 1, h: 1 },
  tileFloor: { w: 4, h: 3 },
  honeyJar: { w: 1, h: 1 },
  candyRed: { w: 1, h: 1 },
  bowlStack: { w: 1, h: 1 },
  bedMom: { w: 4, h: 5 },
  surfaceTop: { w: 4, h: 2 },
  surfaceFront: { w: 4, h: 1 },
  vanityMirror: { w: 4, h: 3 },
};

// ───────────────────────── 조각 붙이기 ─────────────────────────

type Part = [Grid, number, number];

function slice(p: Pix, y0: number, h: number): Pix {
  const q = new Pix(p.w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < p.w; x++) q.set(x, y, p.get(x, y0 + y));
  return q;
}

/** 사람 키를 넘는 부분을 top 으로 나눈다 (발 줄 = pix 맨 아래) */
function out(pix: Pix, extra: Partial<PropSprite> = {}): PropSprite {
  const s: PropSprite = { pix, ox: 0, oy: -pix.h, ...extra };
  const split = pix.h - PERSON_SPRITE_H;
  if (split >= 6 && !s.top) {
    s.top = slice(pix, 0, split);
    s.topSplitY = split;
  }
  return s;
}

/** 'drawer@3' → 3 */
function at(opt: string, key: string): number {
  const m = new RegExp(`${key}@(\\d+)`).exec(opt);
  return m ? Number(m[1]) : -1;
}
const open = (opt: string) => opt.split(',').includes('open');

// ───────────────────────── 부엌 ─────────────────────────

/** 냉장고 (2×1): 위 냉동칸 · 아래 냉장칸, 자석 · 메모 · 하루 그림. ajar 면 문틈 빛 */
function fridge(W: number, opt: string): PropSprite {
  const Ht = 78;
  const fw = W - 7;
  const parts: Part[] = [
    [hs(vs(X.FRIDGE, Ht - 2, 7, 3), W - 2, 2, 6), 1, 1],
    [hs(X.FRIDGE_SEAM, fw - 2, 1, 1), 2, 26],
    [vs(X.FRIDGE_HANDLE, 10, 1, 1), fw - 4, 12],
    [vs(X.FRIDGE_HANDLE, 16, 1, 1), fw - 4, 31],
    [X.FRIDGE_DRAW, 5, 32],
    [X.FRIDGE_MEMO, 19, 13],
    [X.MAGNET_G, 6, 16],
    [X.MAGNET_O, 25, 48],
  ];
  if (opt.includes('ajar')) parts.push([vs(X.FRIDGE_AJAR, Ht - 36, 0, 0), fw, 28]);
  const faces: Faces = { top: [1, 0, fw, 6], front: [1, 6, fw, Ht - 7], side: [1 + fw, 6, 5, Ht - 7] };
  return out(onto(W, Ht, parts, X.fridgePal), { faces });
}

/** 부엌 조리대 (w×1): 아래 문짝 · 서랍, 윗판. sink@n · stove@n · drawer@n (n 번째 칸), open 이면 그 서랍이 빠져나옴 */
function kcounter(W: number, opt: string): PropSprite {
  const Ht = 35;
  const isOpen = opt.includes('open');
  const cells = Math.floor(W / HT);
  const parts: Part[] = [[box(W - 2, 10, 23, 'S', 'F'), 1, 1]];
  for (let i = 0; i < cells; i++) {
    const x0 = i * HT;
    const last = i === cells - 1;
    parts.push([door(last ? 17 : 20, 18, 'F'), x0 + 2, 13], [knob(4), x0 + 10, 18]);
  }
  const sink = at(opt, 'sink');
  if (sink >= 0) parts.push([hs(X.SINK, HT * 2 - 6, 2, 2), sink * HT + 3, 3], [X.TAP, sink * HT + 21, 1]);
  const stove = at(opt, 'stove');
  if (stove >= 0) parts.push([X.STOVE, stove * HT + 2, 3], [X.POT, stove * HT + 11, 1]);
  const dr = at(opt, 'drawer');
  if (dr >= 0) {
    const x0 = dr * HT;
    if (isOpen) parts.push([X.KDRAWER_HOLE, x0 + 3, 13], [X.KDRAWER_OPEN, x0 + 1, 24]);
    else parts.push([X.KDRAWER, x0 + 3, 13]);
  }
  const faces: Faces = { top: [0, 2, W - 3, 9], front: [0, 11, W - 3, 24], side: [W - 3, 11, 3, 24] };
  return { pix: onto(W, Ht + (isOpen ? 10 : 0), parts, X.counterPal), ox: 0, oy: -Ht, faces };
}

/** 벽 찬장 (w×2, 벽에 붙음): 위 칸 문짝들. open 이면 마지막 문이 열려 밥그릇 · 꿀단지가 보인다 */
function wallCab(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 8;
  const parts: Part[] = [[box(W, 5, Ht - 6), 0, 0]];
  const doors = Math.max(2, Math.floor(W / 18));
  const dw = Math.floor((W - 5) / doors);
  for (let i = 0; i < doors; i++) {
    const x0 = 1 + i * dw;
    if (open(opt) && i === doors - 1) {
      parts.push([nine(X.CUPBOARD_IN, dw - 2, Ht - 17, 1, 1, 1, 1), x0 + 1, 7], [X.IN_JAR, x0 + dw - 10, 9], [X.IN_BOWL, x0 + 2, 22]);
      continue;
    }
    parts.push([door(dw - 2, Ht - 17), x0 + 1, 7], [knob(3), i % 2 ? x0 + 3 : x0 + dw - 7, Ht - 16]);
  }
  return { pix: onto(W, Ht, parts, X.cabPal), ox: 0, oy: -Ht, wall: true };
}

/** 쌀 포대 (1×1) */
const riceSack = (W: number) => out(onto(W, 30, [[X.RICE_SACK, 4, 9]], X.ricePal));

/** 빨간 리본 한 토막 (냉장고 옆면 자석 밑) */
const ribbon = (W: number): PropSprite => ({ pix: onto(W, 16, [[X.RIBBON, 6, 3]], X.ribbonPal), ox: 0, oy: -16 });

/** 앞치마 걸이: 큰 앞치마와 작은 앞치마, 주머니에 열쇠 꾸러미 */
const apron = (W: number): PropSprite => ({ pix: onto(W, 30, [[X.APRON, 3, 2]], X.apronPal), ox: 0, oy: -30 });

/** 서랍 앞판 (1×1, 당기기 · 서랍 계단): open 이면 빠져나온 서랍 속 */
function drawerFront(W: number, opt: string): PropSprite {
  const Ht = 22;
  const p: Palette = opt.includes('dark') ? { ...X.counterPal, ...pal({ W: '#9a6e42' }) } : X.counterPal;
  const parts: Part[] = open(opt) ? [[X.KDRAWER_OPEN, 1, 2]] : [[box(W - 2, 3, 10), 1, 8], [knob(6), 8, 13]];
  return { pix: onto(W, Ht, parts, p), ox: 0, oy: -Ht };
}

/** 깔린 선반 판 (찬장 속 단면, w×1) */
const shelfBoard = (W: number): PropSprite => ({ pix: onto(W, 12, [[hs(X.SHELF_BOARD, W - 2, 4, 4), 1, 2]], X.shelfPal), ox: 0, oy: -12 });

// ───────────────────────── 안방 ─────────────────────────

/** 보석함 (1×1): open 이면 뚜껑이 열리고 발레리나 · 동백꽃 머리핀 */
function jewelBox(W: number, opt: string): PropSprite {
  const Ht = 24;
  const parts: Part[] = [[swap(box(W - 6, 6, 7), 'W', 'C'), 3, 10], [X.JEWEL_LOCK, W / 2 - 2, 17]];
  if (open(opt)) parts.push([X.JEWEL_OPEN, 3, 2], [X.JEWEL_PIN, 5, 11]);
  else parts.push([X.JEWEL_LID, 3, 7]);
  return { pix: onto(W, Ht, parts, X.jewelPal), ox: 0, oy: -Ht };
}

/** 빨래 건조대 (2×1): 아빠 수건 · 엄마 고무장갑 한 짝. 밑 그늘에 숨을 수 있다 */
const dryRack = (W: number) => out(onto(W, 40, [[X.DRY_LEG, 2, 6], [flipG(X.DRY_LEG), W - 11, 6], [X.DRY_RACK, 2, 4]], X.dryPal));

// ───────────────────────── 현관 ─────────────────────────

/** 신발장 (2×1, 키 큼): open 이면 아래 칸 문이 반쯤 열려 할머니 털신이 보인다. 위에 거울 틀 */
function shoeCabinet(W: number, opt: string): PropSprite {
  const Ht = 74;
  const parts: Part[] = [[nine(X.MIRROR, W - 14, 17, 3, 3, 3, 3), 7, 1], [X.PHOTO, 10, 4], [box(W - 2, 7, Ht - 27), 1, 20]];
  for (let i = 0; i < 3; i++) {
    const y = 29 + i * 14;
    if (i === 2 && open(opt)) parts.push([X.FURSHOE_IN, 2, y]);
    else parts.push([door(W - 8, 12), 2, y], [knob(3), W - 13, y + 5]);
  }
  const faces: Faces = { top: [0, 20, W - 4, 7], front: [0, 27, W - 4, Ht - 28], side: [W - 4, 27, 4, Ht - 28] };
  return out(onto(W, Ht, parts, X.shoeCabPal), { faces });
}

/** 신발 한 켤레 (1×1): dad 구두 · mom 운동화 · haru 운동화 · small 작아진 운동화 · fur 할머니 털신 */
function shoePair(W: number, opt: string): PropSprite {
  const Ht = 16;
  const col: Record<string, string> = { dad: '#3a3040', mom: '#e8a0b0', haru: '#e8e4d8', small: '#6aa0d8', fur: '#a07858' };
  const key = Object.keys(col).find((k) => opt.includes(k)) ?? 'haru';
  const parts: Part[] = [];
  for (const x0 of [2, 12]) {
    parts.push([X.SHOE, x0, 7]);
    if (key === 'haru' || key === 'small') parts.push([X.SHOE_STRIPE, x0, 11]);
    if (key === 'fur') parts.push([X.SHOE_FUR, x0, 6]);
  }
  return { pix: onto(W, Ht, parts, X.shoePal(col[key])), ox: 0, oy: -Ht };
}

/** 천장 등 (윗층): 천장에서 내려온 줄 끝의 둥근 갓 · 센서등은 붉은 점 */
function ceilLamp(W: number): PropSprite {
  const Ht = 46;
  const p = onto(W, Ht, [[vs(X.LAMP_CORD, 35, 5, 0), W / 2, 1], [X.LAMP, W / 2 - 6, Ht - 11]], X.lampPal);
  return { pix: p, ox: 0, oy: -Ht, top: p, topSplitY: Ht };
}

// ───────────────────────── 욕실 ─────────────────────────

const duck = (W: number): PropSprite => ({ pix: onto(W, 18, [[X.DUCK, 3, 5]], X.duckPal), ox: 0, oy: -18 });
const towelPile = (W: number): PropSprite => ({ pix: onto(W, 22, [[X.TOWELS, 2, 8]], X.towelPal), ox: 0, oy: -22 });
const gourd = (W: number): PropSprite => ({ pix: onto(W, 14, [[X.GOURD, 1, 4]], X.gourdPal), ox: 0, oy: -14 });
/** 향수병 (엄마 화장대 위, 빛을 가린다) */
const perfume = (W: number) => out(onto(W, 26, [[X.PERFUME, 6, 10]], X.perfumePal));

/** 현관 바닥 타일 (납작한 데칼, 막지 않음): 회색 돌 타일 · 줄눈 */
const tileFloor = (W: number, H: number): PropSprite => ({ pix: draw(tile(X.TILE_FLOOR, W, H), X.tilePal, false), ox: 0, oy: -H, wall: true });

/** 꿀단지 (뚜껑이 무거운 옛 항아리) */
function honeyJar(W: number, opt: string): PropSprite {
  const parts: Part[] = [[X.HONEY_JAR, 4, 12]];
  parts.push(open(opt) ? [X.HONEY_OPEN, 6, 13] : [X.HONEY_LID, 4, 9]);
  return out(onto(W, 30, parts, X.honeyPal));
}

const candyRed = (W: number): PropSprite => ({ pix: onto(W, 14, [[X.CANDY, 4, 4]], X.candyPal), ox: 0, oy: -14 });

/** 밥그릇 · 국그릇 탑 (one 이면 큰 그릇 하나): 맨 밑 토끼 그림 어린이 밥그릇 */
function bowlStack(W: number, opt: string): PropSprite {
  const n = opt.includes('one') ? 1 : 4;
  const Ht = 8 + n * 6;
  const slots = ['C', 'A', 'B', 'G'];
  const parts: Part[] = [];
  for (let i = 0; i < n; i++) {
    const w = 18 - i * 2;
    parts.push([hs(swap(X.BOWL, 'C', slots[i]), w, 2, 3), (W - w) / 2, Ht - 7 - i * 6]);
  }
  if (n > 1) parts.push([X.BOWL_RABBIT, W / 2 - 1, Ht - 5]);
  return out(onto(W, Ht, parts, X.bowlPal));
}

/** 엄마가 누운 침대 (w×h): 머리판 · 베개 위 엄마 얼굴과 머리카락 · 이불 아래 몸. 밑은 장난감이 숨는 자리 */
function bedMom(W: number, H: number): PropSprite {
  const fh = 12;
  const g = blank(W, H + fh);
  put(g, box(W - 2, H - 8, fh, 'F', 'W'), 1, 8);
  put(g, hs(X.MOM_HEAD, W - 2, 3, 5), 1, 1);
  put(g, X.MOM_PILLOW, W / 2 - 24, 15);
  put(g, X.MOM_FACE, W / 2 - 18, 13);
  put(g, nine(X.MOM_QUILT, W - 6, H - 19, 3, 4, 3, 4), 2, 26);
  put(g, X.MOM_BODY, W / 2 - 22, 34);
  put(g, X.MOM_HAND, W / 2 + 6, 29);
  return { pix: draw(g, X.momPal), ox: 0, oy: -(H + fh) };
}

/**
 * 장난감이 올라서는 가구 윗면 (납작한 데칼, 높은 층 ^ 칸 위에 깔린다): cloth 식탁보 · wood 화장대 나무 · marble 세면대.
 * 위에 놓인 물건 · 순서 발판이 가려지지 않게 바닥에 구워 넣는다. 앞면은 surfaceFront (단 앞면 S 줄).
 */
function surfaceTop(W: number, H: number, opt: string): PropSprite {
  const cloth = opt.includes('cloth');
  const marble = opt.includes('marble');
  const c = cloth ? '#e8d8d8' : marble ? '#dfe4e8' : '#d8b890';
  const g = tile(cloth ? X.TOP_CLOTH : marble ? X.TOP_MARBLE : X.TOP_WOOD, W, H);
  put(g, nine(X.TOP_RIM, W, H, 2, 2, 2, 2), 0, 0);
  return { pix: draw(g, X.surfacePal(c), false), ox: 0, oy: -H, wall: true };
}

/** 윗면 아래 앞면 (단 앞면 S 줄, w×1): cloth 늘어진 식탁보 · 다리, vanity 화장대 서랍, chest 3단 서랍 (stairs 면 계단처럼), sink 세면대 문짝 */
function surfaceFront(W: number, opt: string): PropSprite {
  const Ht = 26;
  if (opt.includes('cloth')) {
    const p = onto(W, Ht, [[X.TABLE_LEG, 4, 11], [X.TABLE_LEG, W - 8, 11], [hs(X.CLOTH_FRONT, W - 2, 0, 0), 1, 1]], X.clothFrontPal);
    return { pix: p, ox: 0, oy: -Ht };
  }
  const c = opt.includes('sink') ? '#c8d0d8' : opt.includes('chest') ? '#a87850' : '#e8d8c0';
  const parts: Part[] = [[box(W - 2, 2, Ht - 3), 1, 1]];
  if (opt.includes('chest')) {
    const stairs = opt.includes('stairs');
    for (let i = 0; i < 3; i++) {
      const y = 3 + i * 7;
      parts.push([door(W - 8, 6), 2, y], [knob(5), W / 2 - 4, y + 2]);
      if (stairs && i < 2) parts.push([hs(X.STAIR, W - 5, 1, 1), 1, y + 6]);
    }
  } else {
    const n = Math.max(1, Math.floor(W / 24));
    const dw = Math.floor((W - 3) / n);
    for (let i = 0; i < n; i++) parts.push([door(dw - 3, Ht - 8), 2 + i * dw, 4], [knob(4), 2 + i * dw + Math.floor(dw / 2) - 3, 9]);
  }
  return { pix: onto(W, Ht, parts, pal({ W: c, S: '#b8bec4' })), ox: 0, oy: -Ht };
}

/** 화장대 거울 (뒷벽에 붙은 둥근 거울 · 귀퉁이에 꽂힌 주차권과 사진) */
function vanityMirror(W: number, H: number): PropSprite {
  const parts: Part[] = [[nine(X.VANITY, W - 20, H - 8, 8, 8, 8, 8), 10, 4], [X.VANITY_GLINT, W / 2 + 8, 14], [X.VANITY_TICKET, W - 30, 40], [X.VANITY_PHOTO, 16, 16]];
  return { pix: onto(W, H, parts, X.vanityPal), ox: 0, oy: -H, wall: true };
}

/** 갈래 C 소품 그림 (모르는 종류면 null) */
export function propsC(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = w * HT;
  const H = h * HT;
  switch (kind) {
    case 'fridge': return fridge(W, opt);
    case 'kcounter': return kcounter(W, opt);
    case 'wallCab': return wallCab(W, H, opt);
    case 'shoeCabinet': return shoeCabinet(W, opt);
    case 'drawerFront': return drawerFront(W, opt);
    case 'riceSack': return riceSack(W);
    case 'ribbon': return ribbon(W);
    case 'apron': return apron(W);
    case 'jewelBox': return jewelBox(W, opt);
    case 'dryRack': return dryRack(W);
    case 'shoePair': return shoePair(W, opt);
    case 'ceilLamp': return ceilLamp(W);
    case 'duck': return duck(W);
    case 'towelPile': return towelPile(W);
    case 'gourd': return gourd(W);
    case 'shelfBoard': return shelfBoard(W);
    case 'perfume': return perfume(W);
    case 'tileFloor': return tileFloor(W, H);
    case 'honeyJar': return honeyJar(W, opt);
    case 'candyRed': return candyRed(W);
    case 'bowlStack': return bowlStack(W, opt);
    case 'bedMom': return bedMom(W, H);
    case 'surfaceTop': return surfaceTop(W, H, opt);
    case 'surfaceFront': return surfaceFront(W, opt);
    case 'vanityMirror': return vanityMirror(W, H);
    default: return null;
  }
}
