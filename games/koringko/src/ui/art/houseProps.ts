/**
 * 다락방 · 책상 위 소품과 주민 그림 (REDESIGN §4 입체감 규칙: 윗면 밝게 · 앞면 중간 · 오른쪽 옆면 가장 어둡게, 높이는 앞면 길이).
 * 가구 그림(house.ts FurnSprite)과 같은 약속: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 * pix 는 그림 전체. top 이 있으면 pix 의 0..topSplitY-1 줄(사람 · 장난감 키보다 높은 부분)을 같은 (ox, oy) 에
 * 인물보다 나중에 한 번 더 그린다. 윗층(beam · cobweb)은 top = pix 전체.
 * 팔레트: 따뜻한 갈색 · 크림 · 바랜 초록. 순검정 · 순흰색은 쓰지 않는다.
 * 소품 모양은 손으로 찍은 격자 (px/attic.ts 다락 · px/desk.ts 책상): 여기서는 크기에 맞춰 조각을 잇고 팔레트로 칠하고
 * 글씨(glyphs.ts)를 얹고 면 · 윗부분을 나눈다. 주민(residentSprite)은 아직 코드 붓 그림 (주민 갈래 몫).
 */
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
import { CARTON_PAL, MOVE_KINDS, cartonGrid, moveSprite } from './moveProps.ts';
import { mat as tones, paintGrid, softOutline, type Grid, type Palette } from './px/grid.ts';
import { hrep, mirror, nine, palSpec, stack, tile, vrep } from './px/kit.ts';
import * as D from './px/desk.ts';
import * as A from './px/attic.ts';
import { PROPS_E_KINDS, propSpriteE, residentSpriteE } from './props_e.ts';
import { PROPS_B, propsB } from './props_b.ts';
import { PROPS_A_KINDS, propSpriteA } from './props_a.ts';
import { PROPS_D, propDSprite, residentDSprite } from './props_d.ts';
import { PROPS_C_KINDS, propsC } from './props_c.ts';
import { PERSON_SPRITE_H, TOY_SPRITE_H } from './sizes.ts';
import { drawGlyph, glyph, handH, textH, textV, textVHeight, textWidth, tiny } from './glyphs.ts';

const HT = 24;
/** 사람 키 (사람 크기 다락) · 장난감 키 (책상 위 근접) */
const PERSON_H = PERSON_SPRITE_H;
const TOY_H = TOY_SPRITE_H;

export type Rect = [number, number, number, number];
/** 3면 가구의 면 자리 (pix 좌표) */
export interface Faces {
  top: Rect;
  front: Rect;
  side: Rect;
}
export interface PropSprite {
  pix: Pix;
  ox: number;
  oy: number;
  /** 인물보다 위에 다시 그릴 윗부분 (pix 의 0..topSplitY-1 줄) */
  top?: Pix;
  topSplitY?: number;
  /** 벽에 붙은 것 (인물보다 늘 뒤) */
  wall?: boolean;
  /** 3면 몸통 (윗면 · 앞면 · 옆면) */
  faces?: Faces;
  /** 위에 장난감이 올라서는 소품: 뒷부분(윗면 · 목, 맨 뒷줄 장난감보다 먼저) · 앞부분(앞면, 발 정렬). pix 와 같은 크기 */
  behind?: Pix;
  front?: Pix;
  /** 바닥에 구워 넣는 그늘 (칠한 칸의 파랑 값 = 세기): 발 자리 (x*24, (y+h)*24) 에서 (ox, oy) */
  ground?: { pix: Pix; ox: number; oy: number };
  /** 벽 · 바닥을 밝히는 자리 (칠한 칸의 파랑 값 = 세기): 떼어 낸 액자 자국 */
  lighten?: { pix: Pix; ox: number; oy: number };
}

/** 소품 종류 · 기본 칸 크기 · 눈높이 (person: 사람 크기 다락 · toy: 책상 위 근접) */
export const PROP_KINDS: Record<string, { w: number; h: number; scale: 'person' | 'toy' }> = {
  atticWall: { w: 4, h: 2, scale: 'person' },
  beam: { w: 6, h: 1, scale: 'person' },
  trapdoor: { w: 2, h: 2, scale: 'person' },
  cuckoo: { w: 1, h: 2, scale: 'person' },
  xmasbox: { w: 2, h: 1, scale: 'person' },
  honeycandy: { w: 1, h: 1, scale: 'person' },
  fan: { w: 1, h: 1, scale: 'person' },
  tricycle: { w: 2, h: 1, scale: 'person' },
  mat: { w: 2, h: 1, scale: 'person' },
  dresserCloth: { w: 2, h: 1, scale: 'person' },
  bookbundle: { w: 1, h: 1, scale: 'person' },
  umbrellaStand: { w: 1, h: 1, scale: 'person' },
  sewbox: { w: 1, h: 1, scale: 'person' },
  mousetrap: { w: 1, h: 1, scale: 'person' },
  paintcan: { w: 1, h: 1, scale: 'person' },
  railing: { w: 4, h: 1, scale: 'person' },
  cobweb: { w: 1, h: 1, scale: 'person' },
  movingBoxes: { w: 2, h: 1, scale: 'person' },
  chairOld: { w: 1, h: 1, scale: 'person' },
  bookspines: { w: 5, h: 1, scale: 'toy' },
  pencilCup: { w: 2, h: 2, scale: 'toy' },
  lampBase: { w: 3, h: 2, scale: 'toy' },
  notebook: { w: 6, h: 4, scale: 'toy' },
  eraser: { w: 2, h: 1, scale: 'toy' },
  eraserDust: { w: 2, h: 1, scale: 'toy' },
  ruler: { w: 6, h: 1, scale: 'toy' },
  pencil: { w: 5, h: 1, scale: 'toy' },
  paperStrips: { w: 3, h: 2, scale: 'toy' },
  starJarGiant: { w: 3, h: 2, scale: 'toy' },
  phoneGiant: { w: 3, h: 5, scale: 'toy' },
  calendarDesk: { w: 3, h: 1, scale: 'toy' },
  testPapers: { w: 3, h: 2, scale: 'toy' },
  candyTin: { w: 2, h: 2, scale: 'toy' },
  tapeCutter: { w: 2, h: 1, scale: 'toy' },
  hairTie: { w: 1, h: 1, scale: 'toy' },
  milkCarton: { w: 2, h: 2, scale: 'toy' },
  memoWall: { w: 4, h: 2, scale: 'toy' },
  deskEdge: { w: 4, h: 1, scale: 'toy' },
  numberPad: { w: 1, h: 1, scale: 'toy' },
  // 이삿날 공통 소품 (moveProps.ts)
  ...Object.fromEntries(Object.entries(MOVE_KINDS).map(([k, d]) => [k, { w: d.w, h: d.h, scale: 'person' as const }])),
  // 태엽 속 · 재봉 상자 (props_e.ts)
  ...PROPS_E_KINDS,
  ...Object.fromEntries(Object.entries(PROPS_B).map(([k, d]) => [k, { w: d.w, h: d.h, scale: 'person' as const }])),
  ...Object.fromEntries(Object.entries(PROPS_A_KINDS).map(([k, d]) => [k, { w: d.w, h: d.h, scale: 'person' as const }])),
  ...PROPS_D,
  ...Object.fromEntries(Object.entries(PROPS_C_KINDS).map(([k, d]) => [k, { w: d.w, h: d.h, scale: 'person' as const }])),
};

export const RESIDENT_KINDS = ['tinSoldier', 'paperSisters', 'cuckooElder'] as const;

// ───────────────────────── 팔레트 (주민 · 책등 · 글씨) ─────────────────────────
const INK = hex('#2a1c24');
const PAPER = hex('#f6efdf');
const SAGE = hex('#8fa47a');
const MUSTARD = hex('#d8a840');
const GOLD = hex('#e8c060');
const MARKER = hex('#3a2c3a');

// ───────────────────────── 붓 (주민 그림용) ─────────────────────────
/** 가구 상자 붓: 윗줄 밝게 · 아랫줄 · 오른쪽 어둡게 */
function box(p: Pix, x: number, y: number, w: number, h: number, c: Color): void {
  p.rect(x, y, w, h, c);
  p.rect(x, y, w, 1, shade(c, 0.25));
  p.rect(x, y + h - 1, w, 1, shade(c, -0.3));
  p.rect(x + w - 1, y, 1, h, shade(c, -0.18));
}

/** 나뭇결 (가로): 주민 그림용 */
function grain(p: Pix, x: number, y: number, w: number, h: number, c: Color, seed: number): void {
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = 0; xx < w; xx++) {
      const v = hash2(Math.floor((x + xx) / 5), y + yy, seed);
      if (v < 0.32) p.set(x + xx, y + yy, shade(c, -0.12));
    }
  }
}

function slice(p: Pix, y0: number, h: number): Pix {
  const q = new Pix(p.w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < p.w; x++) q.set(x, y, p.get(x, y0 + y));
  return q;
}

/** 키 넘는 부분을 top 으로 나눈다 (발 줄 = pix 의 -oy 줄) */
function out(pix: Pix, ox: number, oy: number, scale: 'person' | 'toy', extra: Partial<PropSprite> = {}): PropSprite {
  const s: PropSprite = { pix, ox, oy, ...extra };
  const split = -oy - (scale === 'person' ? PERSON_H : TOY_H);
  if (split >= 6 && !s.top) {
    s.top = slice(pix, 0, Math.min(split, pix.h));
    s.topSplitY = Math.min(split, pix.h);
  }
  return s;
}
/** 늘 인물 위에 그리는 윗층 */
function over(pix: Pix, ox: number, oy: number): PropSprite {
  return { pix, ox, oy, top: pix, topSplitY: pix.h };
}

// ───────────────────────── 손찍기 격자 그리기 ─────────────────────────

/** 외곽선에 섞는 따뜻한 먹색 */
const WARM = hex('#3a2430');

/** 격자 → 그림 (같은 크기), 위에 덧그림들을 차례로 얹고 둘레에 따뜻한 외곽선 */
function draw(g: Grid, pal: Palette, adds: [Grid, number, number][] = [], outline = true): Pix {
  const p = new Pix(g[0].length, g.length);
  paintGrid(p, g, 0, 0, pal);
  for (const [a, x, y] of adds) paintGrid(p, a, x, y, pal);
  return outline ? softOutline(p, WARM) : p;
}

/** 그린 크기와 다른 칸 크기를 받으면 가운데 1/3 을 되풀이해 맞춘다 (9-조각) */
function fit(g: Grid, W: number, H: number): Grid {
  const w = g[0].length;
  const h = g.length;
  if (w === W && h === H) return g;
  return nine(g, Math.floor(w / 3), Math.ceil((w * 2) / 3), Math.floor(h / 3), Math.ceil((h * 2) / 3), W, H);
}

/** 소품마다 팔레트 한 줄 (글자 뜻은 px/attic.ts · px/desk.ts 머리말) */
export const PAL = {
  trapdoor: palSpec('.uWwv=#9a6c44;.hAas=#5a3c28;IiMmz=#5a5a62;GgCcj=#f0c868;X=#2a1e1c'),
  trapdoorOpen: palSpec('.uWwv=#9a6c44;.hAas=#5a3c28;.lBbn=#7a5436;GgCcj=#f0c868;1=#2a1e1c;2=#4a3426;3=#7a5434;4=#b08048;5=#e0b060;k=#c09060'),
  cuckoo: palSpec('.uWwv=#6e4630;.hAas=#9a6a44;.lBbn=#8fa47a;OoPpy=#e8dcc0;GgCcj=#e8c060;IiMmz=#a89060;X=#2a1c24;k=#7a5a30;K=#a88050;1=#c89058;2=#e8984a;3=#a06a3a;4=#f4ecdc;5=#8a3a2a'),
  xmasbox: palSpec('QqKkx=#b8865a;v=#6a4a34;GgCcj=#c84a44;.hAas=#7a9a5a;.lBbn=#5a7ab0;IiMmz=#e8c060;OoPpy=#f6efdf'),
  honeycandy: palSpec('GgCcj=#e8a838;OoPpy=#ecd088'),
  fan: palSpec('GgCcj=#b4c4a0;OoPpy=#e8dcc0;IiMmz=#c8c8b8;.hAas=#7a8a80;.lBbn=#a8c8c0;1=#d0846a;2=#c84a44;3=#e8907a;4=#e4e6dc'),
  tricycle: palSpec('GgCcj=#b84a3a;1=#b0603a;.hAas=#3a3236;IiMmz=#a0a0a0;.uWwv=#5a4038;OoPpy=#c8c0b0;2=#e8c8a0;3=#e0a090;4=#d8d098'),
  mat: palSpec('GgCcj=#d4ba84;.lBbn=#8fa47a;.hAas=#c84a44'),
  dresserCloth: palSpec('OoPpy=#e6dece;.uWwv=#7a4e2c;.hAas=#8a5a3a'),
  bookbundle: palSpec('GgCcj=#c86a5a;.hAas=#6a8ab0;.lBbn=#d8a840;.4567=#8fa47a;1=#e8c060;2=#f0d880;.uWwv=#c8b088'),
  umbrellaStand: palSpec('GgCcj=#b85a50;.hAas=#4a5a84;OoPpy=#e0c8a0;.uWwv=#8a6a4a;.lBbn=#8fa47a'),
  sewbox: palSpec('.uWwv=#8a5a3c;GgCcj=#e8c060;.hAas=#c84a44;IiMmz=#c8ccd4'),
  mousetrap: palSpec('.uWwv=#c89a64;IiMmz=#b8bcc4;GgCcj=#e0c890'),
  paintcan: palSpec('IiMmz=#c8ccd0;OoPpy=#f0ece0;.hAas=#5a7aa0;.uWwv=#a8703c'),
  cobweb: palSpec('OoPpy=#d8d2c8;X=#4a3a3a'),
  chairOld: palSpec('.uWwv=#9a6640;OoPpy=#f6efdf;X=#3a2c3a;1=#e8d8a8'),
  wall: palSpec('.uWwv=#a07450;.hAas=#6e4a32;.lBbn=#7a5236;GgCcj=#6a4a36;k=#4e3428;K=#8e6440;IiMmz=#3c4878;.eTt.=#c8ac80;Q=#e0ccaa;q=#b89a70;3=#f4e8c0;1=#e8ecf4;2=#1c2240'),
  beam: palSpec('GgCcj=#5e3c28;IiMmz=#a8a8b0;OoPpy=#d4cec4;X=#4a3a3a'),
  railing: palSpec('.uWwv=#8e5e3a;GgCcj=#f0c848'),
};

// ───────────────────────── 다락방 (사람 크기) ─────────────────────────

/** 다락 뒷벽: 비스듬한 천장 널 · 서까래 · 도리 · 세로 널빤지 벽 · 걸레받이 (120 칸 무늬를 이어 깐다), window 면 둥근 박공 창 */
function atticWall(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 12;
  const t = A.WALL_TILE;
  const rows = Ht <= t.length ? t.slice(t.length - Ht) : vrep(t, 0, 12, Ht);
  const g = tile(rows, W, Ht);
  const fy = Ht - 36;
  const adds: [Grid, number, number][] = opt.includes('window') ? [[A.WALL_WINDOW, Math.floor(W / 2) - 19, fy - 20]] : [];
  return { pix: draw(g, PAL.wall, adds, false), ox: 0, oy: -Ht, wall: true };
}

/** 들보: 사람 머리 위 높이에 떠 있는 얇은 각목 (몸통 10px) + 바닥에 옅은 그림자. 장난감이 밑을 지나면 render 가 비친다 */
function beam(W: number): PropSprite {
  const body = 10;
  const g = stack(W, body + 13, [[tile(A.BEAM_TILE, W, body + 13, 24), 0, 0], [A.BEAM_WEB, W - 16, 0]]);
  const p = draw(g, PAL.beam, [], false);
  // 바닥 그림자 (빛 효과): 들보 바로 아래 칸에 옅은 띠 (가장자리는 더 옅게)
  const sh = new Pix(W, 9);
  for (let y = 0; y < 9; y++) sh.rect(0, y, W, 1, [50, 100, 150, 170, 170, 170, 150, 100, 50][y]);
  return { ...over(p, 0, -(54 + body)), ground: { pix: sh, ox: 0, oy: -HT + 4 } };
}

function trapdoor(W: number, H: number, opt: string): PropSprite {
  const open = opt.includes('open');
  const g = open ? A.TRAPDOOR_OPEN : A.TRAPDOOR;
  const Ht = H + (open ? 30 : 0);
  return { pix: draw(fit(g, W, Ht), open ? PAL.trapdoorOpen : PAL.trapdoor), ox: 0, oy: -Ht };
}

/** 뻐꾸기시계. live: 추 · 바늘은 render 가 흔들며 그린다 (그림엔 없음). bird: 문이 열리고 뻐꾸기가 튀어나온다 */
function cuckoo(W: number, H: number, opt: string): PropSprite {
  const live = /\blive\b/.test(opt);
  const adds: [Grid, number, number][] = [];
  if (opt.includes('bird')) adds.push([A.CUCKOO_BIRD, 0, 0]);
  if (!live) adds.push([A.CUCKOO_STILL, 0, 0]);
  return { pix: draw(fit(A.CUCKOO, W, H), PAL.cuckoo, adds), ox: 0, oy: -H, wall: true };
}

function xmasbox(W: number, H: number): PropSprite {
  const Ht = H + 10;
  return out(draw(fit(A.XMASBOX, W, Ht), PAL.xmasbox), 0, -Ht, 'person', { faces: { top: [2, 4, 39, 3], front: [3, 17, 37, 16], side: [40, 17, 4, 16] } });
}

function honeycandy(W: number, H: number): PropSprite {
  return { pix: draw(fit(A.HONEYCANDY, W, H), PAL.honeycandy), ox: 0, oy: -H };
}

function fan(W: number, H: number): PropSprite {
  const Ht = H + 26;
  return out(draw(fit(A.FAN, W, Ht), PAL.fan), 0, -Ht, 'person', { faces: { top: [2, 38, 17, 4], front: [2, 42, 17, 7], side: [19, 42, 3, 7] } });
}

function tricycle(W: number, H: number): PropSprite {
  const Ht = H + 10;
  return out(draw(fit(A.TRICYCLE, W, Ht), PAL.tricycle), 0, -Ht, 'person');
}

function mat(W: number, H: number): PropSprite {
  return out(draw(fit(A.MAT, W, H), PAL.mat), 0, -H, 'person', { faces: { top: [6, 9, 34, 3], front: [6, 13, 34, 5], side: [6, 19, 34, 3] } });
}

function dresserCloth(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const adds: [Grid, number, number][] = opt.includes('frame') ? [[A.DRESSER_FRAME, 0, 0]] : [];
  return out(draw(fit(A.DRESSER_CLOTH, W, Ht), PAL.dresserCloth, adds), 0, -Ht, 'person', { faces: { top: [2, 22, 40, 8], front: [2, 30, 40, 29], side: [42, 30, 4, 29] } });
}

function bookbundle(W: number, H: number): PropSprite {
  const Ht = H + 4;
  return out(draw(fit(A.BOOKBUNDLE, W, Ht), PAL.bookbundle), 0, -Ht, 'person', { faces: { top: [3, -1, 13, 8], front: [3, 7, 13, 20], side: [16, 7, 3, 20] } });
}

function umbrellaStand(W: number, H: number): PropSprite {
  const Ht = H + 22;
  return out(draw(fit(A.UMBRELLA_STAND, W, Ht), PAL.umbrellaStand), 0, -Ht, 'person');
}

function sewbox(W: number, H: number, opt: string): PropSprite {
  const adds: [Grid, number, number][] = opt.includes('needle') ? [[A.SEWBOX_NEEDLE, 0, 0]] : [];
  return out(draw(fit(A.SEWBOX, W, H), PAL.sewbox, adds), 0, -H, 'person', { faces: { top: [1, 6, 18, 7], front: [1, 13, 18, 10], side: [19, 13, 3, 10] } });
}

function mousetrap(W: number, H: number): PropSprite {
  return out(draw(fit(A.MOUSETRAP, W, H), PAL.mousetrap), 0, -H, 'person', { faces: { top: [3, 13, 16, 6], front: [3, 19, 16, 3], side: [19, 19, 2, 3] } });
}

function paintcan(W: number, H: number): PropSprite {
  return out(draw(fit(A.PAINTCAN, W, H), PAL.paintcan), 0, -H, 'person');
}

/** 난간: 손잡이 · 살 · 아래 가름대 (8 칸 무늬를 이어 깐다), yarn 이면 걸린 노란 털실 한 가닥 */
function railing(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 4;
  const adds: [Grid, number, number][] = opt.includes('yarn') ? [[A.RAIL_YARN, Math.floor(W * 0.6) - 3, 3]] : [];
  return out(draw(tile(A.RAIL_TILE, W, Ht, 5), PAL.railing, adds), 0, -Ht, 'person');
}

function cobweb(W: number, H: number, opt: string): PropSprite {
  const g = fit(A.COBWEB, W, H);
  return over(draw(opt.includes('right') ? mirror(g) : g, PAL.cobweb, [], false), 0, -H);
}

function labelsOf(opt: string, defaults: string[]): string[] {
  const parts = opt.split(',').map((s) => s.trim()).filter((s) => s && [...s].some((c) => glyph(c)));
  return parts.length ? parts : defaults;
}

/** 쌓은 이삿짐 상자 둘 (이삿날 상자 본 px/move.ts CARTON 을 늘여 쓴다) + 매직 글씨 */
function movingBoxes(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const [l1, l2] = [...labelsOf(opt, ['하루 방', '깨짐주의']), '깨짐주의'];
  const big = cartonGrid(W, 9, 22);
  const small = cartonGrid(W - 4, 8, 18);
  const by = Ht - big.length;
  const p = draw(stack(W, Ht, [[small, 2, 6], [big, 0, by]]), CARTON_PAL, [], false);
  const fw = W - 5;
  const gap1 = textWidth(l1) > fw - 4 ? 0 : 1;
  handH(p, l1, 1 + Math.max(1, Math.floor((fw - textWidth(l1, gap1)) / 2)), Ht - 19, MARKER, gap1);
  const sw = fw - 4;
  const gap2 = textWidth(l2) > sw - 4 ? 0 : 1;
  handH(p, l2, 3 + Math.max(1, Math.floor((sw - textWidth(l2, gap2)) / 2)), 16, hex('#b83a34'), gap2);
  return out(softOutline(p, WARM), 0, -Ht, 'person', { faces: { top: [1, by, fw, 9], front: [1, by + 9, fw, 21], side: [fw + 1, by + 9, 3, 21] } });
}

function chairOld(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 22;
  const adds: [Grid, number, number][] = opt.includes('plain') ? [] : [[A.CHAIR_NOTE, 0, 0]];
  return out(draw(fit(A.CHAIR_OLD, W, Ht), PAL.chairOld, adds), 0, -Ht, 'person', { faces: { top: [2, 29, 17, 8], front: [2, 37, 17, 4], side: [19, 37, 3, 4] } });
}
// ───────────────────────── 책상 위 (장난감 눈높이) ─────────────────────────

export const BOOK_TITLES = ['수학 4-2', '어린 왕자', '중3 영어', '종이접기 백과', '국어 5-1', '과학 3-2', '동화', '일기', '영어 사전', '수학 6-1', '백과 사전', '이야기'];
const BOOK_COLS = [hex('#b84a40'), hex('#3e5a8a'), MUSTARD, hex('#6a8a5a'), hex('#e8dcc0'), hex('#8a5a8a'), hex('#c87a48'), hex('#4a7a7a')];

export const DPAL = {
  pencilCup: palSpec('GgCcj=#e8b840;.hAas=#5a8ab0;.lBbn=#c85a4a;.4567=#6a9a5a;.SsRr=#8a6ab0;.EeDd=#d87a48;IiMmz=#7a9a80;OoPpy=#efe2c4;.uWwv=#e8c898;X=#4a4450;K=#c84a44;k=#3a3434;V=#9a6ab8;T=#a878c8'),
  lamp: palSpec('IiMmz=#7aa090;GgCcj=#55685f;OoPpy=#f0d070;1=#d8d0b8;2=#f8f0dc;3=#f0c060;4=#b8bcb4;5=#fff0b8;6=#b8c088;7=#d8d078'),
  notebook: palSpec('OoPpy=#f6efdf;GgCcj=#d87a6a;1=#c4d0dc;2=#e8b0a8;X=#6a6a7a'),
  eraser: palSpec('OoPpy=#ece4d4;GgCcj=#5a8ac4;1=#e8dcc0'),
  eraserDust: palSpec('OoPpy=#d8d0c4;1=#c8c0b4'),
  ruler: palSpec('GgCcj=#cfe0c8;X=#3a4a42'),
  pencil: 'GgCcj=#e8b840;1=#e8c060;IiMmz=#b8b8b0;.hAas=#e8a0a0;.uWwv=#e8c898;X=#4a4450',
  paperStrips: palSpec('GgCcj=#e87a8a;.hAas=#7ab0d8;.lBbn=#a8d098;.SsRr=#c8a0d8;.EeDd=#f0a868;.4567=#f4d050;1=#c84a44;2=#e88070'),
  starJar: palSpec('IiMmz=#94abb8;.gGc.=#f4c850;.hAa.=#e87a8a;.lBb.=#7ab0d8;.456.=#a8d098;.SRr.=#c8a0d8;.EDd.=#f0a868;.oPp.=#f6efdf;.uWwv=#c09060;7=#e8f4f0;8=#d0e8e8;1=#e8c060;2=#8a5a20;3=#fcf4d8'),
  phone: palSpec('GgCcj=#3a3a44;IiMmz=#1a2030;1=#4a5878;2=#36405a;3=#8a98b8;4=#6ac080;5=#3a6a4a;6=#2a3a30;OoPpy=#e4ded2;7=#1e1e24;8=#5a6a8a;9=#26262e;.hAas=#5a5a66'),
  calendar: palSpec('OoPpy=#f6efdf;GgCcj=#7a9a6a;.uWwv=#8a6a4a;IiMmz=#9a9aa4;X=#3a3040;1=#6a6070;2=#c84a44'),
  testPapers: palSpec('OoPpy=#f6efdf;1=#9a9aa8;2=#d04a44;3=#cdbfa4;4=#e2d8c2'),
  candyTin: palSpec('GgCcj=#c8584a;OoPpy=#f0e2c4;1=#e87a8a;2=#7ab0d8;3=#d8a840;4=#d8c8a8'),
  tapeCutter: palSpec('GgCcj=#6a8a74;.eTt.=#ecd098;u=#b89868;X=#4a5a4e;IiMmz=#c8ccd0;1=#fcf0d4'),
  hairTie: palSpec('GgCcj=#e07a8a;.hAas=#f0d060'),
  milk: palSpec('OoPpy=#f2ece0;.hAas=#6a9ad0;.lBbn=#7aa86a;1=#3a5a9a;2=#e87a8a;3=#f8d0d0'),
  memoWall: palSpec('OoPpy=#f6efdf;1=#f0b0b8;2=#b0d0f0;3=#c8e4b8;4=#f4e0a0;5=#d8c4ec;6=#a87078;7=#7090b0;8=#88a478;9=#b0a060;0=#9884ac;.eTt.=#ecd8b0;GgCcj=#f4dc78;.hAas=#f4b8c0;X=#3a2c3a;.lBbn=#c84a44'),
  deskEdge: palSpec('GgCcj=#c08a52;1=#3a2a28;2=#42302c;3=#4a3830;4=#523e34;5=#5a4438'),
  numPad: palSpec('OoPpy=#ece2cc;z=#9a8e78'),
  numPadOn: palSpec('OoPpy=#f4d878;z=#a88a40'),
};

/** 책등 줄: 책마다 손찍기 책 본(BOOK_SPINE)을 그 키 · 폭으로 늘이고 책 색으로 칠한 뒤 세로 제목 */
function bookspines(W: number, H: number, opt: string): PropSprite {
  const tallest = 4 * HT + 4;
  const Ht = H + tallest - 10;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const seed = parseInt(opt, 10) || 0;
  const given = opt.split(',').map((s) => s.trim()).filter((s) => [...s].some((c) => glyph(c) && !/[0-9-]/.test(c)));
  const gap = opt.includes('gap');
  let x = 0;
  let i = 0;
  const titles: [string, number, number, Color][] = [];
  while (x < W - 6) {
    const title = given.length ? given[i % given.length] : BOOK_TITLES[(i + seed * 5) % BOOK_TITLES.length];
    const c = BOOK_COLS[(i * 3 + seed) % BOOK_COLS.length];
    const thin = !given.length && hash2(i, seed, 121) < 0.18;
    const bw = Math.min(W - x, thin ? 7 : 15);
    if (bw < 6) break;
    const need = textVHeight(title) + 14;
    const bh = Math.max(thin ? 62 : need, Math.round(tallest - 26 + hash2(i, seed, 122) * 26));
    const top = g - bh;
    const cream = c === hex('#e8dcc0');
    const book = vrep(bw === 15 ? D.BOOK_SPINE : hrep(D.BOOK_SPINE, 2, 11, bw), 7, 8, bh + 4);
    paintGrid(p, book, x, top - 3, { ...tones('GgCcj', c), P: PAPER, '1': cream ? hex('#a07040') : GOLD });
    if (!thin) titles.push([title, x + Math.floor((bw - 2) / 2), top + 7, cream || c === MUSTARD ? hex('#3a2a2a') : hex('#f4ead4')]);
    x += bw;
    i++;
    if (gap && i === 3) x += 10;
  }
  for (const [t, cx, y, ink] of titles) textV(p, t, cx, y, ink);
  return out(softOutline(p, WARM), 0, -Ht, 'toy');
}

function pencilCup(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 70;
  const adds: [Grid, number, number][] = opt.includes('yarn') ? [[D.PENCIL_CUP_YARN, 0, 0]] : [];
  return out(draw(fit(D.PENCIL_CUP, W, Ht), DPAL.pencilCup, adds), 0, -Ht, 'toy');
}

/**
 * 스탠드 받침: 장난감이 올라서는 높은 층 2 (12px × 2) 둥근 북 모양. 윗면은 발자리를 그만큼 올린 자리, 앞면 22px.
 * 목은 받침 뒤쪽에서 위로 사라지고 (갓은 화면 밖), 스위치는 윗면 가운데 (보리가 엉덩이로 누르는 자리).
 * behind = 앞면 위쪽 전부 (목 · 윗면), front = 앞면 아래쪽 — 위에 선 장난감은 그 사이에 그린다.
 */
function lampBase(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 104 - 24 + 4;
  const adds: [Grid, number, number][] = opt.includes('on') ? [[D.LAMP_ON, 0, 0]] : [];
  const p = draw(fit(D.LAMP, W, Ht), DPAL.lamp, adds);
  // 앞면 윗선(가운데) 줄부터 아래는 앞부분: 북 윗면 가운데 줄 (받침 가운데 높이 - 2)
  const split = Ht - 1 - 22 - 2;
  const behind = new Pix(W, Ht);
  const front = new Pix(W, Ht);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < W; x++) (y < split ? behind : front).set(x, y, p.get(x, y));
  return { pix: p, ox: 0, oy: -Ht, behind, front };
}

/** 펼친 공책: 두 쪽의 가운데를 따로 되풀이해 접힌 골이 늘 가운데에 오게 */
function notebook(W: number, H: number): PropSprite {
  const t = D.NOTEBOOK;
  const e1 = Math.floor((W - t[0].length) / 2);
  const wide = W === t[0].length ? t : hrep(hrep(t, 20, 40, t[0].length + e1), 90 + e1, 110 + e1, W);
  const g = H === t.length ? wide : vrep(wide, 19, 47, H);
  const y0 = 4;
  const ph = H - 10;
  return { pix: draw(g, DPAL.notebook), ox: 0, oy: -H, faces: { top: [8, y0 + 2, W / 2 - 12, ph - 4], front: [6, y0 + ph, W - 12, 4], side: [W - 4, y0 + 4, 3, ph - 4] } };
}

function eraser(W: number, H: number, opt: string): PropSprite {
  const small = opt.includes('small');
  const Ht = H + (small ? 4 : 10);
  const faces: Faces = small ? { top: [13, 11, 20, 7], front: [13, 18, 20, 9], side: [33, 18, 2, 9] } : { top: [1, 6, 43, 12], front: [1, 18, 43, 15], side: [44, 18, 3, 15] };
  return out(draw(fit(small ? D.ERASER_SMALL : D.ERASER, W, Ht), DPAL.eraser), 0, -Ht, 'toy', { faces });
}

function eraserDust(W: number, H: number): PropSprite {
  return { pix: draw(fit(D.ERASER_DUST, W, H), DPAL.eraserDust), ox: 0, oy: -H };
}

/** 자: 눈금 30 칸 무늬를 이어 깔고, 10 칸마다 작은 숫자 */
function ruler(W: number, H: number): PropSprite {
  const g = hrep(D.RULER, 4, 124, W);
  const p = draw(g, DPAL.ruler, [], false);
  const y0 = H - 18;
  for (let i = 0, x = 4; x < W - 6; i += 10, x += 30) tiny(p, String(i / 10), x - 1, y0 + 7, hex('#3a4a42'));
  return { pix: softOutline(p, WARM), ox: 0, oy: -H, faces: { top: [2, y0 + 1, W - 8, 12], front: [2, y0 + 13, W - 8, 3], side: [W - 3, y0 + 1, 2, 15] } };
}

/** 육각 연필: 몸통 색만 바꿔 칠한다 (노랑 · red · green) */
function pencil(W: number, H: number, opt: string): PropSprite {
  const body = opt.includes('red') ? '#c8483c' : opt.includes('green') ? '#6a9a5a' : '#e8b840';
  const y0 = H - 14;
  const x0 = 12;
  const x1 = W - 16;
  return { pix: draw(fit(D.PENCIL, W, H), palSpec(`${DPAL.pencil};GgCcj=${body}`)), ox: 0, oy: -H, faces: { top: [x0, y0, x1 - x0, 3], front: [x0, y0 + 3, x1 - x0, 5], side: [x0, y0 + 8, x1 - x0, 3] } };
}

function paperStrips(W: number, H: number): PropSprite {
  return { pix: draw(fit(D.PAPER_STRIPS, W, H), DPAL.paperStrips), ox: 0, oy: -H };
}

function starJarGiant(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 90;
  const adds: [Grid, number, number][] = opt.includes('glow') ? [[D.STAR_JAR_GLOW, 0, 0]] : [];
  return out(draw(fit(D.STAR_JAR, W, Ht), DPAL.starJar, adds), 0, -Ht, 'toy');
}

function phoneGiant(W: number, H: number, opt: string): PropSprite {
  const adds: [Grid, number, number][] = opt.includes('dim') ? [[D.PHONE_DIM, 0, 0]] : [];
  const ph = H - 12;
  return { pix: draw(fit(D.PHONE, W, H), DPAL.phone, adds), ox: 0, oy: -H, faces: { top: [5, 5, 2, ph - 6], front: [6, ph + 3, W - 14, 3], side: [W - 6, 5, 3, ph] } };
}

/** 탁상 달력: 큰 날짜(글씨) · 빨간 동그라미 · 날짜 칸 (날짜 자리수만큼 오른쪽으로) */
function calendarDesk(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const num = (opt.match(/\d+/)?.[0] ?? '12').slice(0, 2);
  const nw = textWidth(num);
  const x0 = 4;
  const top = 8;
  const circle = num.length > 1 ? D.CIRCLE_2 : D.CIRCLE_1;
  const cx = Math.round(x0 + 2 + nw / 2 - (circle[0].length - 1) / 2);
  const p = draw(fit(D.CALENDAR, W, Ht), DPAL.calendar, [[D.CAL_DAYS, x0 + nw + 7, top + 12], [circle, cx, top + 9]], false);
  textH(p, num, x0 + 3, top + 12, hex('#3a3040'));
  return out(softOutline(p, WARM), 0, -Ht, 'toy');
}

function testPapers(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 6;
  const score = opt.match(/\d+/)?.[0] ?? '60';
  const p = draw(fit(D.TEST_PAPERS, W, Ht), DPAL.testPapers, [], false);
  tiny(p, score, W - 22, Ht - 1 - 10 - 26 + 4, hex('#d04a44'));
  return out(softOutline(p, WARM), 0, -Ht, 'toy', { faces: { top: [3, 17, 61, 26], front: [3, 43, 61, 8], side: [64, 43, 3, 8] } });
}

function candyTin(W: number, H: number): PropSprite {
  const Ht = H + 4;
  return out(draw(fit(D.CANDY_TIN, W, Ht), DPAL.candyTin), 0, -Ht, 'toy');
}

function tapeCutter(W: number, H: number): PropSprite {
  const Ht = H + 10;
  return out(draw(fit(D.TAPE_CUTTER, W, Ht), DPAL.tapeCutter), 0, -Ht, 'toy', { faces: { top: [1, 18, 42, 5], front: [1, 23, 42, 10], side: [43, 23, 3, 10] } });
}

function hairTie(W: number, H: number): PropSprite {
  return { pix: draw(fit(D.HAIR_TIE, W, H), DPAL.hairTie), ox: 0, oy: -H };
}

function milkCarton(W: number, H: number): PropSprite {
  const Ht = H + 44;
  return out(draw(fit(D.MILK, W, Ht), DPAL.milk), 0, -Ht, 'toy', { faces: { top: [8, 23, 28, 6], front: [7, 33, 30, 57], side: [38, 33, 6, 57] } });
}

function memoWall(W: number, H: number): PropSprite {
  return { pix: draw(fit(D.MEMO_WALL, W, H), DPAL.memoWall), ox: 0, oy: -H, wall: true };
}

/** 책상 끝: 둥글게 깎은 윗면 · 앞판 · 아래로 떨어지는 어둠 (무늬를 이어 깐다) */
function deskEdge(W: number, H: number): PropSprite {
  const g = tile(D.DESK_EDGE, W, H);
  return { pix: draw(g, DPAL.deskEdge, [], false), ox: 0, oy: -H, faces: { top: [0, 0, W, 5], front: [0, 7, W, 12], side: [0, 21, W, H - 21] } };
}

/** 숫자 발판: 눌리면(on) 앞면이 얇아지고 노랗게 켜진다 */
function numberPad(W: number, H: number, opt: string): PropSprite {
  const on = /\bon\b/.test(opt);
  const digit = opt.match(/\d/)?.[0] ?? '1';
  const th = on ? 1 : 4;
  const y0 = H - 20 - th;
  const p = draw(fit(on ? D.NUMPAD_ON : D.NUMPAD, W, H), on ? DPAL.numPadOn : DPAL.numPad, [], false);
  drawGlyph(p, digit, Math.floor(W / 2) - 3, y0 + 3, on ? hex('#c8483c') : hex('#5a4a40'));
  return { pix: softOutline(p, WARM), ox: 0, oy: -H, faces: { top: [2, y0, W - 6, 17], front: [2, y0 + 17, W - 6, th], side: [W - 4, y0 + 17, 2, th] } };
}

// ───────────────────────── 입구 ─────────────────────────

/** 소품 그림. 모르는 kind 는 null */
export function propSprite(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = w * HT;
  const H = h * HT;
  switch (kind) {
    case 'atticWall': return atticWall(W, H, opt);
    case 'beam': return beam(W);
    case 'trapdoor': return trapdoor(W, H, opt);
    case 'cuckoo': return cuckoo(W, H, opt);
    case 'xmasbox': return xmasbox(W, H);
    case 'honeycandy': return honeycandy(W, H);
    case 'fan': return fan(W, H);
    case 'tricycle': return tricycle(W, H);
    case 'mat': return mat(W, H);
    case 'dresserCloth': return dresserCloth(W, H, opt);
    case 'bookbundle': return bookbundle(W, H);
    case 'umbrellaStand': return umbrellaStand(W, H);
    case 'sewbox': return sewbox(W, H, opt);
    case 'mousetrap': return mousetrap(W, H);
    case 'paintcan': return paintcan(W, H);
    case 'railing': return railing(W, H, opt);
    case 'cobweb': return cobweb(W, H, opt);
    case 'movingBoxes': return movingBoxes(W, H, opt);
    case 'chairOld': return chairOld(W, H, opt);
    case 'bookspines': return bookspines(W, H, opt);
    case 'pencilCup': return pencilCup(W, H, opt);
    case 'lampBase': return lampBase(W, H, opt);
    case 'notebook': return notebook(W, H);
    case 'eraser': return eraser(W, H, opt);
    case 'eraserDust': return eraserDust(W, H);
    case 'ruler': return ruler(W, H);
    case 'pencil': return pencil(W, H, opt);
    case 'paperStrips': return paperStrips(W, H);
    case 'starJarGiant': return starJarGiant(W, H, opt);
    case 'phoneGiant': return phoneGiant(W, H, opt);
    case 'calendarDesk': return calendarDesk(W, H, opt);
    case 'testPapers': return testPapers(W, H, opt);
    case 'candyTin': return candyTin(W, H);
    case 'tapeCutter': return tapeCutter(W, H);
    case 'hairTie': return hairTie(W, H);
    case 'milkCarton': return milkCarton(W, H);
    case 'memoWall': return memoWall(W, H);
    case 'deskEdge': return deskEdge(W, H);
    case 'numberPad': return numberPad(W, H, opt);
    default: return propSpriteA(kind, w, h, opt) ?? propsB(kind, w, h, opt) ?? propsC(kind, w, h, opt) ?? moveSprite(kind, w, h, opt) ?? propSpriteE(kind, w, h, opt) ?? propDSprite(kind, w, h, opt);
  }
}

// ───────────────────────── 주민 ─────────────────────────

export type RDir = 'down' | 'up' | 'left' | 'right';

/** 태엽 열쇠 (나비 날개 손잡이). edge: 옆으로 돌아 얇게 보임 */
function windKey(p: Pix, cx: number, cy: number, edge: boolean, spread = 4): void {
  const k = hex('#e0b048');
  if (edge) {
    p.rect(cx - 1, cy - 5, 2, 10, k);
    p.set(cx - 1, cy - 5, hex('#f8e0a0'));
    p.rect(cx, cy - 4, 1, 8, shade(k, -0.3));
  } else {
    p.oval(cx - spread, cy, 3.5, 2.5, k);
    p.oval(cx + spread, cy, 3.5, 2.5, k);
    p.oval(cx - spread, cy, 1.5, 1, shade(k, -0.35));
    p.oval(cx + spread, cy, 1.5, 1, shade(k, -0.35));
    p.set(cx - spread - 2, cy - 1, hex('#f8e0a0'));
  }
  p.rect(cx - 1, cy - 1, 2, 3, shade(k, -0.15));
}

function tinSoldier(dir: RDir, frame: number): Pix {
  const Wd = 24;
  const Hd = 32;
  const p = new Pix(Wd, Hd);
  const bob = frame === 1 ? 1 : 0;
  const blink = frame === 1;
  const red = hex('#c8443a');
  const hat = hex('#2e2a40');
  const skin = hex('#f2c8a0');
  const navy = hex('#384a7a');
  const boot = hex('#30283a');
  const cream = hex('#efe4cc');
  const side = dir === 'left' || dir === 'right';
  const back = dir === 'up';
  const cx = 12;
  // 다리 (숨 쉴 때 움직이지 않음)
  if (side) {
    p.rect(cx - 2, 24, 4, 5, navy);
    p.rect(cx - 2, 24, 1, 5, hex('#c8443a'));
    p.rect(cx - 2, 29, 6, 2, boot);
  } else {
    p.rect(cx - 4, 24, 3, 5, navy);
    p.rect(cx + 1, 24, 3, 5, shade(navy, -0.1));
    p.rect(cx - 4, 24, 1, 5, red);
    p.rect(cx + 3, 24, 1, 5, shade(red, -0.15));
    p.rect(cx - 5, 29, 4, 2, boot);
    p.rect(cx + 1, 29, 4, 2, boot);
    p.set(cx - 4, 29, hex('#5a5068'));
  }
  const y = bob;
  // 태엽 열쇠 (뒤): 앞모습 · 뒷모습은 날개가 몸 양옆으로, 옆모습은 등 뒤로
  const keyEdge = frame === 1;
  if (side) {
    p.rect(cx - 7, 18 + y, 3, 2, hex('#b08838'));
    windKey(p, cx - 8, 18 + y, !keyEdge);
  } else if (!back) {
    windKey(p, cx, 19 + y, keyEdge, 8);
  }
  // 몸통 (빨간 제복 · 깡통 이음매)
  const bx = side ? cx - 4 : cx - 5;
  const bw = side ? 8 : 10;
  p.rect(bx, 15 + y, bw, 10 - y, red);
  p.rect(bx, 15 + y, 1, 10 - y, shade(red, 0.3));
  p.rect(bx + bw - 1, 15 + y, 1, 10 - y, shade(red, -0.3));
  p.rect(bx, 22, bw, 2, cream);
  p.rect(bx, 23, bw, 1, shade(cream, -0.15));
  if (!back && !side) {
    // 금단추 · 띠 버클
    for (const by of [16, 18, 20]) p.set(cx, by + y, hex('#f0c858'));
    p.rect(cx - 1, 22, 2, 2, hex('#e0b048'));
    // 견장
    p.rect(cx - 7, 15 + y, 3, 2, hex('#e8c060'));
    p.rect(cx + 4, 15 + y, 3, 2, hex('#e8c060'));
    // 팔 · 장갑
    p.rect(cx - 7, 17 + y, 2, 5, shade(red, -0.08));
    p.rect(cx + 5, 17 + y, 2, 5, shade(red, -0.2));
    p.rect(cx - 7, 22 + y, 2, 2, cream);
    p.rect(cx + 5, 22 + y, 2, 2, cream);
  } else if (back) {
    p.rect(cx - 7, 15 + y, 3, 2, hex('#e8c060'));
    p.rect(cx + 4, 15 + y, 3, 2, hex('#e8c060'));
    p.rect(cx - 7, 17 + y, 2, 5, shade(red, -0.15));
    p.rect(cx + 5, 17 + y, 2, 5, shade(red, -0.15));
    p.rect(cx, 16 + y, 1, 6, shade(red, -0.25));
    windKey(p, cx, 18 + y, keyEdge);
  } else {
    p.rect(cx - 1, 15 + y, 3, 2, hex('#e8c060'));
    p.rect(cx, 17 + y, 2, 5, shade(red, -0.12));
    p.rect(cx, 22 + y, 2, 2, cream);
    p.set(cx + 3, 17 + y, hex('#f0c858'));
    p.set(cx + 3, 19 + y, hex('#f0c858'));
  }
  // 얼굴
  if (back) {
    p.oval(cx, 12 + y, 4.5, 3.5, hex('#8a5a3a'));
  } else {
    p.oval(cx + (side ? 1 : 0), 12 + y, 4.5, 3.5, skin);
    if (side) {
      p.set(cx + 5, 12 + y, skin);
      p.set(cx + 3, 11 + y, blink ? hex('#8a5a4a') : hex('#3a2420'));
      if (!blink) p.set(cx + 3, 10 + y, hex('#3a2420'));
      p.set(cx + 2, 13 + y, hex('#f09080'));
      p.rect(cx + 3, 14 + y, 2, 1, hex('#6a4028'));
    } else {
      if (blink) {
        p.rect(cx - 3, 11 + y, 2, 1, hex('#8a5a4a'));
        p.rect(cx + 2, 11 + y, 2, 1, hex('#8a5a4a'));
      } else {
        p.rect(cx - 2, 10 + y, 1, 2, hex('#3a2420'));
        p.rect(cx + 2, 10 + y, 1, 2, hex('#3a2420'));
      }
      p.set(cx - 4, 13 + y, hex('#f09080'));
      p.set(cx + 4, 13 + y, hex('#f09080'));
      // 콧수염
      p.rect(cx - 2, 13 + y, 2, 1, hex('#6a4028'));
      p.rect(cx + 1, 13 + y, 2, 1, hex('#6a4028'));
    }
  }
  // 모자 (높은 원통 · 금 휘장 · 빨간 방울)
  const hx = side ? cx - 3 : cx - 4;
  p.rect(hx, 1 + y, 8, 8, hat);
  p.rect(hx, 1 + y, 1, 8, shade(hat, 0.35));
  p.rect(hx + 1, 1 + y, 1, 8, shade(hat, 0.15));
  p.rect(hx, 1 + y, 8, 1, shade(hat, 0.25));
  if (!back) {
    p.rect(hx + (side ? 4 : 3), 4 + y, 2, 3, hex('#e8c060'));
    p.set(hx + (side ? 4 : 3), 4 + y, hex('#f8e8a8'));
  }
  // 챙
  if (side) p.rect(cx + 2, 9 + y, 4, 1, shade(hat, -0.1));
  else if (!back) p.rect(cx - 5, 9 + y, 10, 1, shade(hat, -0.1));
  // 끈
  if (!back) p.rect(cx - 4 + (side ? 2 : 0), 14 + y, side ? 3 : 1, 1, hex('#e8c060'));
  p.ball(hx + 4, 0 + y + 1, 2, 2, hex('#d84a3a'));
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

function paperSisters(dir: RDir, frame: number): Pix {
  const p = new Pix(30, 34);
  const cols = [hex('#e88a98'), hex('#7ab0d8'), hex('#9cc890')];
  const hs = [29, 25, 27];
  const back = dir === 'up';
  const side = dir === 'left' || dir === 'right';
  cols.forEach((c, k) => {
    const sw = side ? 3 : 6;
    const x = side ? 6 + k * 7 : 2 + k * 9;
    const top = 33 - hs[k];
    const face = back ? hex('#f2ead8') : c;
    const sway = frame === 1 && k !== 1 ? 1 : 0;
    // 발 (아래가 앞으로 접힘)
    p.rect(x - 1, 31, sw + 2, 2, shade(face, -0.25));
    // 띠 몸통
    p.rect(x, top + 3, sw, 31 - top - 3, face);
    p.rect(x, top + 3, 1, 31 - top - 3, shade(face, 0.22));
    p.rect(x + sw - 1, top + 3, 1, 31 - top - 3, shade(face, -0.2));
    // 접힌 금
    p.rect(x, top + 16, sw, 1, shade(face, -0.1));
    // 말린 윗끝 (뒷면 크림이 보임)
    const cx = x + sway;
    p.rect(cx, top, sw, 3, back ? c : hex('#f2ead8'));
    p.rect(cx + sw - 2, top + 1, 2, 2, shade(hex('#f2ead8'), -0.12));
    if (!back) {
      const ey = top + 7;
      const blink = frame === 1 && k === 2;
      if (side) {
        p.set(x + (dir === 'right' ? 2 : 0), ey, blink ? shade(c, -0.4) : hex('#3a2a34'));
      } else {
        if (blink) {
          p.rect(x + 1, ey, 1, 1, shade(c, -0.45));
          p.rect(x + 4, ey, 1, 1, shade(c, -0.45));
        } else {
          p.rect(x + 1, ey - 1, 1, 2, hex('#3a2a34'));
          p.rect(x + 4, ey - 1, 1, 2, hex('#3a2a34'));
        }
        p.set(x, ey + 2, shade(c, 0.35));
        p.set(x + 5, ey + 2, shade(c, -0.08));
        p.set(x + 2, ey + 2, hex('#a04a5a'));
        p.set(x + 3, ey + 2, hex('#a04a5a'));
      }
    }
  });
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

function cuckooElder(_dir: RDir, frame: number): Pix {
  const p = new Pix(44, 52);
  const body = hex('#6e4630');
  const cx = 22;
  // 지붕 · 조각 나뭇잎 · 꼭대기 새
  p.tri(1, 16, 43, 16, cx, 2, hex('#5a3a28'));
  p.tri(4, 15, 40, 15, cx, 5, hex('#7a5038'));
  for (let i = -4; i <= 4; i++) p.oval(cx + i * 5, 16, 3, 2, i % 2 ? shade(SAGE, -0.15) : SAGE);
  p.ball(cx, 3, 3, 2.5, hex('#8a6040'), true);
  p.set(cx + 3, 3, hex('#e8984a'));
  // 몸통
  box(p, cx - 15, 15, 31, 34, body);
  grain(p, cx - 14, 17, 29, 30, body, 201);
  // 작은 문 (frame 1: 빼꼼 열림 「…뻐」)
  if (frame === 1) {
    p.rect(cx - 4, 18, 8, 8, hex('#2e1e1a'));
    p.rect(cx - 8, 18, 4, 8, hex('#9a6a44'));
    p.oval(cx, 23, 2.5, 2, hex('#c89058'));
    p.set(cx + 2, 23, hex('#e8984a'));
    p.set(cx - 1, 22, INK);
  } else {
    box(p, cx - 4, 18, 8, 8, hex('#9a6a44'));
    p.set(cx + 2, 22, GOLD);
  }
  // 무뚝뚝한 눈썹 (조각)
  p.rect(cx - 11, 28, 7, 2, hex('#4a2e20'));
  p.rect(cx + 4, 28, 7, 2, hex('#4a2e20'));
  p.set(cx - 11, 27, hex('#4a2e20'));
  p.set(cx + 10, 27, hex('#4a2e20'));
  // 시계판 = 얼굴
  p.oval(cx, 38, 11, 9, hex('#e8dcc0'));
  p.oval(cx, 38, 11, 9, hex('#e8dcc0'));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    p.set(cx + Math.sin(a) * 9.5, 38 - Math.cos(a) * 7.5, hex('#8a7058'));
  }
  // 눈 (frame 1: 반쯤 감음)
  if (frame === 1) {
    p.rect(cx - 6, 34, 3, 1, INK);
    p.rect(cx + 4, 34, 3, 1, INK);
  } else {
    p.rect(cx - 5, 33, 2, 2, INK);
    p.rect(cx + 4, 33, 2, 2, INK);
    p.set(cx - 5, 33, hex('#f4ecd8'));
    p.set(cx + 4, 33, hex('#f4ecd8'));
  }
  // 바늘 = 처진 콧수염 (8시 20분)
  p.line(cx, 39, cx - 7, 42, INK);
  p.line(cx, 39, cx + 7, 42, INK);
  p.line(cx, 40, cx - 6, 43, hex('#5a4030'));
  p.line(cx, 40, cx + 6, 43, hex('#5a4030'));
  p.oval(cx, 39, 1.5, 1.5, GOLD);
  p.outline();
  return p;
}

/** 주민 그림 (인물처럼 움직이는 것). frame 0/1: 숨쉬기 · 깜빡임 */
export function residentSprite(kind: string, dir: RDir, frame: number): Pix | null {
  const f = frame % 2;
  switch (kind) {
    case 'tinSoldier': return tinSoldier(dir, f);
    case 'paperSisters': return paperSisters(dir, f);
    case 'cuckooElder': return cuckooElder(dir, f);
    default: return residentSpriteE(kind, dir, f) ?? residentDSprite(kind, dir, frame);
  }
}
