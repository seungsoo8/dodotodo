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
import { blank, hrep, mirror, nine, palSpec, recolor, stack, tile, vrep } from './px/kit.ts';
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

/** 빈 격자 (덧그림만 얹는 그림의 바탕) */
const blankGrid = (w: number, h: number): Grid => blank(w, h);

/** 그린 크기와 다른 칸 크기를 받으면 가운데 1/3 을 되풀이해 맞춘다 (9-조각) */
function fit(g: Grid, W: number, H: number): Grid {
  const w = g[0].length;
  const h = g.length;
  if (w === W && h === H) return g;
  return nine(g, Math.floor(w / 3), Math.ceil((w * 2) / 3), Math.floor(h / 3), Math.ceil((h * 2) / 3), W, H);
}

/** 소품마다 팔레트 한 줄 (글자 뜻은 px/attic.ts · px/desk.ts 머리말) */
export const PAL = {
  trapdoor: palSpec('.uWwv=#a8784a;.hAas=#5e4030;IiMmz=#6a6a72;GgCcj=#f4d070;1=#2a1e1c;2=#4a3426;3=#7a5434;4=#b08048;5=#e0b060;6=#f4d890;.lBbn=#7a5838;.KKk.=#c89a64'),
  cuckoo: palSpec('.uWwv=#8a5a38;.hAas=#6a4030;.lBbn=#8fa47a;OoPpy=#efe4cc;GgCcj=#e8c060;IiMmz=#a89060;X=#3a2a2a;K=#a88050;k=#7a5a30;1=#c08048;2=#c89058;3=#e0b07a;4=#f4ecdc;5=#e8984a'),
  xmasbox: palSpec('QqKkx=#c4925e;v=#5a3e2c;GgCcj=#c84a44;.hAas=#7a9a5a;.lBbn=#5a7ab0;IiMmz=#e8c060;OoPpy=#f6efdf;R=#c84a44;r=#9a3430;1=#f8e8a8;2=#e8c860;3=#b8902c'),
  honeycandy: palSpec('GgCcj=#e8a838;OoPpy=#ecd8a0'),
  fan: palSpec('GgCcj=#b4c4a0;OoPpy=#ece0c4;IiMmz=#dcdccc;.hAas=#5e6e6a;.lBbn=#a8c8c0;1=#e8907a;2=#c84a44'),
  tricycle: palSpec('GgCcj=#c0503c;1=#b0703a;.hAas=#3a3236;IiMmz=#b0b0b0;.uWwv=#5a4038;OoPpy=#e8e0d0;2=#e8a8a0;3=#e8d090;4=#a8c8e0'),
  mat: palSpec('GgCcj=#d4ba84;.lBbn=#8fa47a;.hAas=#c84a44'),
  dresserCloth: palSpec('OoPpy=#e6dece;.uWwv=#7a4e2c;.hAas=#8a5a3a'),
  bookbundle: palSpec('GgCcj=#c86a5a;.hAas=#6a8ab0;.lBbn=#d8a840;.4567=#8fa47a;1=#e8c060;2=#f0d880;.uWwv=#d8c098'),
  umbrellaStand: palSpec('GgCcj=#b85a50;.hAas=#4a5a84;OoPpy=#e8d8b0;.uWwv=#8a6a4a;.lBbn=#8fa47a;IiMmz=#9a9aa0'),
  sewbox: palSpec('UuWwv=#9a6640;GgCcj=#e8c060;.hAas=#c84a44;IiMmz=#c8ccd4'),
  mousetrap: palSpec('.uWwv=#c89a64;IiMmz=#b8bcc4;GgCcj=#f0c860'),
  paintcan: palSpec('IiMmz=#c8ccd0;OoPpy=#f4f0e4;.hAas=#5a7aa0;.uWwv=#a8703c'),
  cobweb: palSpec('OoPpy=#d8d2c8;X=#4a3a3a;x=#6a5a5a;p=#b8b2a8'),
  chairOld: palSpec('UuWwv=#9a6640;OoPpy=#f6efdf;X=#3a2c3a;1=#e8d8a8'),
  wall: palSpec('.uWwv=#a07450;.hAas=#6e4a32;.lBbn=#7a5236;GgCcj=#6a4a36;IiMmz=#3c4878;.eTt.=#c8ac80;Q=#e0ccaa;q=#b89a70;O=#f4e8c0;1=#e8ecf4;2=#1c2240'),
  beam: palSpec('GgCcj=#5e3c28;IiMmz=#a8a8b0;OoPpy=#d4cec4;X=#4a3a3a;x=#6a5a5a'),
  railing: palSpec('.uWwv=#8e5e3a;GgCcj=#f0c848'),
};

// ───────────────────────── 다락방 (사람 크기) ─────────────────────────

type Add = [Grid, number, number];

/** 다락 뒷벽: 천장 널 · 서까래 · 도리 · 널빤지 벽 · 걸레받이 (40 칸 무늬를 이어 깐다), window 면 둥근 박공 창 */
function atticWall(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 12;
  const t = A.WALL_TILE;
  const rows = Ht <= t.length ? t.slice(t.length - Ht) : vrep(t, 3, 15, Ht);
  const fy = Ht - 36;
  const adds: Add[] = opt.includes('window') ? [[A.WALL_WINDOW, Math.floor(W / 2) - 17, fy - 20]] : [];
  return { pix: draw(tile(rows, W, Ht), PAL.wall, adds, false), ox: 0, oy: -Ht, wall: true };
}

/** 들보: 사람 머리 위 높이에 떠 있는 얇은 각목 (몸통 10px) + 바닥에 옅은 그림자. 장난감이 밑을 지나면 render 가 비친다 */
function beam(W: number): PropSprite {
  const body = 10;
  const g = stack(W, body + 13, [[tile(A.BEAM_TILE, W, body), 0, 0], [A.BEAM_WEB, W - 16, body]]);
  const p = draw(g, PAL.beam, [], false);
  // 바닥 그림자 (빛 효과): 들보 바로 아래 칸에 옅은 띠 (가장자리는 더 옅게)
  const sh = new Pix(W, 9);
  for (let y = 0; y < 9; y++) sh.rect(0, y, W, 1, [50, 100, 150, 170, 170, 170, 150, 100, 50][y]);
  return { ...over(p, 0, -(54 + body)), ground: { pix: sh, ox: 0, oy: -HT + 4 } };
}

/** 뚜껑문: 닫히면 널빤지 본을 늘이고 경첩 · 고리를 얹는다 (틈으로 노란 빛), 열면 세운 뚜껑 · 불빛 구멍 · 사다리 */
function trapdoor(W: number, H: number, opt: string): PropSprite {
  if (opt.includes('open')) {
    const Ht = H + 30;
    return { pix: draw(fit(A.HATCH_OPEN, W, Ht), PAL.trapdoor), ox: 0, oy: -Ht };
  }
  const g = nine(A.HATCH, 3, 14, 5, 10, W, H);
  return { pix: draw(g, PAL.trapdoor, [[A.HINGE, 6, 6], [A.HINGE, W - 14, 6], [A.RING, Math.floor(W / 2) - 3, H - 14]]), ox: 0, oy: -H };
}

/** 뻐꾸기시계. live: 추 · 바늘은 render 가 흔들며 그린다 (그림엔 없음). bird: 문이 열리고 뻐꾸기가 튀어나온다 */
function cuckoo(W: number, H: number, opt: string): PropSprite {
  const live = /\blive\b/.test(opt);
  const adds: Add[] = [];
  if (opt.includes('bird')) adds.push([A.CUCKOO_BIRD, 0, 0]);
  if (!live) adds.push([A.CUCKOO_STILL, 0, 0]);
  return { pix: draw(fit(A.CUCKOO, W, H), PAL.cuckoo, adds), ox: 0, oy: -H, wall: true };
}

function xmasbox(W: number, H: number): PropSprite {
  const Ht = H + 10;
  const adds: Add[] = [[A.BALL_RED, 6, 7], [A.BALL_GREEN, 13, 8], [A.BALL_GOLD, 20, 6], [A.BALL_BLUE, 27, 8], [A.BALL_RED, 33, 7], [A.XMAS_TAG, 8, 20], [A.TINSEL, 30, 15]];
  return out(draw(fit(A.XMASBOX, W, Ht), PAL.xmasbox, adds), 0, -Ht, 'person', { faces: { top: [3, 4, 37, 3], front: [3, 18, 37, 13], side: [40, 18, 4, 13] } });
}

function honeycandy(W: number, H: number): PropSprite {
  return { pix: draw(blankGrid(W, H), PAL.honeycandy, [[A.HONEYCANDY, Math.floor(W / 2) - 9, H - 9]]), ox: 0, oy: -H };
}

/** 선풍기: 둥근 망 머리 · 가는 목 (되풀이) · 피아노 단추 받침 (3면) */
function fan(W: number, H: number): PropSprite {
  const Ht = H + 26;
  const adds: Add[] = [[A.FAN_HEAD, 2, 1], [vrep(A.FAN_NECK, 0, 1, 19), 10, 19], [A.FAN_BASE, 2, 38]];
  return out(draw(blankGrid(W, Ht), PAL.fan, adds), 0, -Ht, 'person', { faces: { top: [2, 38, 17, 4], front: [2, 42, 17, 6], side: [19, 42, 3, 6] } });
}

/** 녹슨 세발자전거: 큰 앞바퀴 · 작은 뒷바퀴 · 빨간 관 · 안장 · 바랜 술 핸들 */
function tricycle(W: number, H: number): PropSprite {
  const Ht = H + 10;
  const adds: Add[] = [
    [A.WHEEL_SMALL, 32, 22], [A.TRIKE_STEP, 27, 24], [A.TRIKE_TUBE, 16, 13], [A.TRIKE_POST, 34, 18], [A.TRIKE_SEAT, 29, 15],
    [A.WHEEL_BIG, 3, 16], [A.TRIKE_FORK, 10, 5], [A.TRIKE_BAR, 10, 3],
  ];
  return out(draw(blankGrid(W, Ht), PAL.tricycle, adds), 0, -Ht, 'person');
}

function mat(W: number, H: number): PropSprite {
  return out(draw(fit(A.MAT, W, H), PAL.mat), 0, -H, 'person', { faces: { top: [7, 11, 32, 3], front: [7, 13, 32, 5], side: [7, 18, 32, 3] } });
}

function dresserCloth(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const adds: Add[] = opt.includes('frame') ? [[A.DRESSER_FRAME, 16, 23]] : [];
  return out(draw(fit(A.DRESSER_CLOTH, W, Ht), PAL.dresserCloth, adds), 0, -Ht, 'person', { faces: { top: [2, 22, 40, 8], front: [2, 31, 40, 26], side: [42, 31, 4, 26] } });
}

function bookbundle(W: number, H: number): PropSprite {
  const Ht = H + 4;
  return out(draw(fit(A.BOOKBUNDLE, W, Ht), PAL.bookbundle, [[A.BOOK_TWINE, 3, 1]]), 0, -Ht, 'person', { faces: { top: [3, 1, 14, 7], front: [3, 9, 14, 16], side: [17, 9, 3, 16] } });
}

function umbrellaStand(W: number, H: number): PropSprite {
  const Ht = H + 22;
  return out(draw(blankGrid(W, Ht), PAL.umbrellaStand, [[A.UMB_NAVY, 4, 1], [A.UMB_RED, 12, 5], [A.UMB_POT, 3, 22]]), 0, -Ht, 'person');
}

function sewbox(W: number, H: number, opt: string): PropSprite {
  const adds: Add[] = [[A.SEW_THREAD, 0, 12]];
  if (opt.includes('needle')) adds.push([A.SEW_NEEDLE, 13, 7]);
  return out(draw(fit(A.SEWBOX, W, H), PAL.sewbox, adds), 0, -H, 'person', { faces: { top: [1, 6, 18, 5], front: [1, 13, 18, 8], side: [19, 13, 3, 8] } });
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
  const adds: Add[] = opt.includes('yarn') ? [[A.RAIL_YARN, Math.floor(W * 0.6) - 1, 3]] : [];
  return out(draw(tile(A.RAIL_TILE, W, Ht), PAL.railing, adds), 0, -Ht, 'person');
}

function cobweb(W: number, H: number, opt: string): PropSprite {
  const g = stack(W, H, [[A.COBWEB, 0, 0], [A.SPIDER, 11, 12]]);
  return over(draw(opt.includes('right') ? mirror(g) : g, PAL.cobweb, [], false), 0, -H);
}

function labelsOf(opt: string, defaults: string[]): string[] {
  const parts = opt.split(',').map((s) => s.trim()).filter((s) => s && [...s].some((c) => glyph(c)));
  return parts.length ? parts : defaults;
}

/** 쌓은 이삿짐 상자 둘 (이삿날 상자 본 px/move.ts CARTON 을 늘여 쓴다) + 매직 손글씨 */
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
  const adds: Add[] = opt.includes('plain') ? [] : [[A.CHAIR_NOTE, 8, 12]];
  return out(draw(fit(A.CHAIR_OLD, W, Ht), PAL.chairOld, adds), 0, -Ht, 'person', { faces: { top: [2, 29, 17, 8], front: [2, 37, 17, 4], side: [19, 37, 3, 4] } });
}

// ───────────────────────── 책상 위 (장난감 눈높이) ─────────────────────────

export const BOOK_TITLES = ['수학 4-2', '어린 왕자', '중3 영어', '종이접기 백과', '국어 5-1', '과학 3-2', '동화', '일기', '영어 사전', '수학 6-1', '백과 사전', '이야기'];
const BOOK_COLS = [hex('#b84a40'), hex('#3e5a8a'), MUSTARD, hex('#6a8a5a'), hex('#e8dcc0'), hex('#8a5a8a'), hex('#c87a48'), hex('#4a7a7a')];

export const DPAL = {
  pencilCup: palSpec('GgCcj=#e8b840;.hAas=#5a8ab0;.lBbn=#c85a4a;.4567=#6a9a5a;.SsRr=#8a6ab0;.EeDd=#d87a48;IiMmz=#7a9a80;OoPpy=#efe2c4;.uWwv=#e8c898;X=#4a4450;K=#c84a44;k=#3a3434;V=#9a6ab8;T=#b890d0;1=#e07a6a;2=#c85a4a;3=#9a4038'),
  lamp: palSpec('IiMmz=#7aa090;GgCcj=#55685f;O=#f4e4a0;o=#c8d4a0;1=#d8d0b8;2=#f8f0dc;3=#f0c060;5=#fff0b8'),
  notebook: palSpec('OoPpy=#f6efdf;GgCcj=#d87a6a;1=#c4d4e4;2=#ecc0b8;X=#a4a4b4'),
  eraser: palSpec('OoPpy=#ece4d4;GgCcj=#5a8ac4;1=#e8dcc0'),
  eraserDust: palSpec('OoPpy=#d8d0c4;1=#c8c0b4'),
  ruler: palSpec('GgCcj=#cfe0c8;X=#3a4a42'),
  pencil: 'GgCcj=#e8b840;1=#e8c060;IiMmz=#b8b8b0;.hAas=#e8a0a0;.uWwv=#e8c898;X=#4a4450',
  paperStrips: palSpec('GgCcj=#e87a8a;.hAas=#7ab0d8;.lBbn=#a8d098;.SsRr=#c8a0d8;.EeDd=#f0a868;.4567=#f4d050;1=#e88070;2=#c84a44'),
  starJar: palSpec('IiMmz=#94abb8;.gGc.=#f4c850;.hAa.=#e87a8a;.lBb.=#7ab0d8;.456.=#a8d098;.SRr.=#c8a0d8;.EDd.=#f0a868;.uWwv=#c09060;M=#7a92a0;m=#5e7484;o=#e0f0f0;O=#f4fafa;1=#e8c060;2=#8a5a20;3=#fcf4d8;H=#e89a9a;L=#f0c890;N=#f0e8a0;Y=#b0d8a8;Z=#a0c0e8'),
  phone: palSpec('GgCcj=#3a3a44;IiMmz=#1a2030;I=#161c2c;I=#161c2c;I=#161c2c;1=#5a6a8a;2=#36405a;4=#6ac080;5=#3a6a4a;6=#2a3a30;OoPpy=#e4ded2;7=#1e1e24;8=#5a6a8a;9=#26262e;.hAas=#5a5a66'),
  calendar: palSpec('OoPpy=#f6efdf;GgCcj=#7a9a6a;.uWwv=#8a6a4a;IiMmz=#9a9aa4;X=#3a3040;1=#6a6070;2=#c84a44'),
  testPapers: palSpec('OoPpy=#f6efdf;1=#9a9aa8;2=#d04a44;3=#cdbfa4;4=#e2d8c2'),
  candyTin: palSpec('GgCcj=#c8584a;OoPpy=#f0e2c4;1=#e87a8a;2=#7ab0d8;3=#d8a840'),
  tapeCutter: palSpec('GgCcj=#6a8a74;.eTt.=#ecd098;.uWwv=#c8a878;X=#4a5a4e;IiMmz=#c8ccd0'),
  hairTie: palSpec('GgCcj=#e07a8a;.hAas=#f0d060'),
  milk: palSpec('OoPpy=#f2ece0;.hAas=#6a9ad0;.lBbn=#7aa86a;2=#e87a8a;3=#f8d0d0'),
  memoWall: palSpec('OoPpy=#f6efdf;1=#f0b0b8;2=#b0d0f0;3=#c8e4b8;4=#f4e0a0;5=#d8c4ec;6=#c88890;7=#88a8c8;8=#98b488;9=#c8b070;0=#a894bc;.eTt.=#ecd8b0;GgCcj=#f4dc78;X=#3a2c3a;.lBbn=#c84a44'),
  deskEdge: palSpec('GgCcj=#c08a52;1=#3a2a28;2=#42302c;3=#4a3830;4=#523e34'),
  numPad: palSpec('OoPpy=#ece2cc;z=#6e6656'),
  numPadOn: palSpec('OoPpy=#f4d878;z=#8a6a30'),
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

/** 연필 색 바꾸기: 손찍기 연필 본의 몸 글자(g C c j)를 그 색 글자로 */
const PCIL_COLORS: Record<string, string>[] = [
  {},
  { g: 'h', C: 'A', c: 'a', j: 's' },
  { g: 'l', C: 'B', c: 'b', j: 'n' },
  { g: '4', C: '5', c: '6', j: '7' },
  {},
  { g: 'S', C: 's', c: 'R', j: 'r' },
  { g: 'E', C: 'e', c: 'D', j: 'd' },
];
const PCIL_TOPS = [8, 16, 4, 12, 20, 6, 14];

/** 연필꽂이: 연필 일곱 자루(끝 본 + 몸 되풀이, 색만 바꿈) · 뒤로 꽂힌 가위 · 깡통 컵 · yarn 이면 털실 자투리 */
function pencilCup(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 70;
  const cupY = 74;
  const adds: Add[] = [[D.SCISSORS, 34, 67]];
  PCIL_TOPS.forEach((top, k) => {
    const pcl = recolor([...D.PCIL_TIP, ...vrep(D.PCIL_BODY, 0, 1, cupY + 6 - top - D.PCIL_TIP.length)], PCIL_COLORS[k]);
    adds.push([pcl, 6 + k * 5, top]);
  });
  adds.push([D.CUP_TIN, Math.floor((W - D.CUP_TIN[0].length) / 2), cupY]);
  if (opt.includes('yarn')) adds.push([D.CUP_YARN, 9, cupY - 2]);
  return out(draw(blankGrid(W, Ht), DPAL.pencilCup, adds), 0, -Ht, 'toy');
}

/**
 * 스탠드 받침: 장난감이 올라서는 높은 층 2 (12px × 2) 둥근 북 모양. 윗면은 발자리를 그만큼 올린 자리, 앞면 22px.
 * 목은 받침 뒤쪽에서 위로 사라지고 (갓은 화면 밖), 스위치는 윗면 가운데 (보리가 엉덩이로 누르는 자리).
 * behind = 앞면 위쪽 전부 (목 · 윗면), front = 앞면 아래쪽 — 위에 선 장난감은 그 사이에 그린다.
 */
function lampBase(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 104 - 24 + 4;
  const on = opt.includes('on');
  const dw = W - 5;
  const ry = Math.floor((H - 4) / 2);
  const drum = vrep(hrep(D.DRUM, 30, 37, dw), 20, 25, D.DRUM.length + ry * 2 + 1 - 45);
  const dy = Ht - 1 - drum.length;
  const nx = Math.floor(W / 2) + 3;
  const adds: Add[] = [
    [vrep(D.NECK_FAR, 0, 1, 34), nx, 0],
    [vrep(D.SPRING, 0, 2, 12), nx - 2, 34],
    [vrep(D.NECK_NEAR, 0, 1, dy + 4 - 46), nx, 46],
    [D.SOCKET, nx - 4, dy],
    [drum, 2, dy],
  ];
  const cy = dy + ry;
  if (on) adds.push([D.LAMP_POOL, Math.floor(W / 2) - 15, cy - 5]);
  adds.push([on ? D.SWITCH_ON : D.SWITCH, Math.floor(W / 2) - 6, cy - 1]);
  const p = draw(blankGrid(W, Ht), DPAL.lamp, adds);
  const split = Ht - 1 - 22 - 2;
  const behind = new Pix(W, Ht);
  const front = new Pix(W, Ht);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < W; x++) (y < split ? behind : front).set(x, y, p.get(x, y));
  return { pix: p, ox: 0, oy: -Ht, behind, front };
}

/** 펼친 공책: 두 쪽의 가운데를 따로 되풀이해 접힌 골이 늘 가운데에 오게, 줄은 7 줄마다 되풀이 */
function notebook(W: number, H: number): PropSprite {
  const t = D.NOTEBOOK;
  const e1 = Math.floor((W - t[0].length) / 2);
  const wide = hrep(hrep(t, 8, 22, t[0].length + e1), 32 + e1, 46 + e1, W);
  const g = vrep(wide, 6, 27, H);
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

/** 자: 왼쪽 끝 · 눈금 30 칸 무늬를 이어 깔고 · 오른쪽 끝, 10 칸마다 작은 숫자 */
function ruler(W: number, H: number): PropSprite {
  const g = stack(W, H, [[D.RULER_L, 0, 0], [tile(D.RULER_T, W - 10, H), 4, 0], [D.RULER_R, W - 6, 0]]);
  const p = draw(g, DPAL.ruler, [], false);
  const y0 = H - 18;
  for (let i = 0, x = 4; x < W - 6; i += 10, x += 30) tiny(p, String(i / 10), x - 1, y0 + 7, hex('#3a4a42'));
  return { pix: softOutline(p, WARM), ox: 0, oy: -H, faces: { top: [2, y0 + 1, W - 8, 12], front: [2, y0 + 13, W - 8, 3], side: [W - 3, y0 + 1, 2, 15] } };
}

/** 육각 연필: 깎은 끝 · 몸 (한 열을 되풀이) · 쇠 고리 · 지우개. 몸통 색만 바꿔 칠한다 (노랑 · red · green) */
function pencil(W: number, H: number, opt: string): PropSprite {
  const body = opt.includes('red') ? '#c8483c' : opt.includes('green') ? '#6a9a5a' : '#e8b840';
  const y0 = H - 14;
  const x0 = 12;
  const x1 = W - 16;
  const g = stack(W, H, [[D.PENCIL_TIP, 0, y0], [tile(D.PENCIL_BODY, x1 - x0, 11), x0, y0], [D.PENCIL_END, x1, y0], [D.PENCIL_BRAND, x0 + 14, y0 + 5]]);
  return { pix: draw(g, palSpec(`${DPAL.pencil};GgCcj=${body}`)), ox: 0, oy: -H, faces: { top: [x0, y0, x1 - x0, 3], front: [x0, y0 + 3, x1 - x0, 5], side: [x0, y0 + 8, x1 - x0, 3] } };
}

/** 종이별 접을 색 종이띠 일곱 장 (띠 본을 색만 바꿔 어긋나게 쌓는다) · 고무줄로 묶은 노란 띠 다발 */
const STRIP_COLORS: Record<string, string>[] = [{}, { g: 'h', C: 'A', c: 'a' }, { g: 'l', C: 'B', c: 'b' }, { g: 'S', C: 's', c: 'R' }, { g: 'E', C: 'e', c: 'D' }, {}, { g: 'h', C: 'A', c: 'a' }];
function paperStrips(W: number, H: number): PropSprite {
  const adds: Add[] = STRIP_COLORS.map((m, k) => [recolor(D.STRIP, m), 3 + ((k * 3) % 5), 18 + k * 3] as Add);
  adds.push([D.STRIP_BUNDLE, W - 21, H - 21], [D.STRIP_BAND, W - 15, H - 21]);
  return { pix: draw(blankGrid(W, H), DPAL.paperStrips, adds), ox: 0, oy: -H };
}

/** 종이별 병: 빈 유리 위쪽 · 빽빽한 종이별(무늬 이어 깔기) · 금색 「100」 별 · 삐뚤어진 첫 별 · 유리 · 코르크 · 책상 위 무지개 */
function starJarGiant(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 90;
  const jw = W - 8;
  const glass = vrep(hrep(D.JAR_GLASS, 12, 18, jw), 7, 13, Ht - 14);
  const jx = 3;
  const jy = 12;
  const inW = jw - 7;
  const fill = jy + 28;
  const bottom = jy + glass.length - 3;
  const gx = Math.floor(W / 2) - 7;
  const gy = Math.floor((fill + bottom) / 2) - 6;
  const adds: Add[] = [
    [tile(D.GLASS_IN, inW, fill - jy - 5), jx + 3, jy + 5],
    [tile(D.STAR_FILL, inW, bottom - fill), jx + 3, fill],
    [D.FIRST_STAR, jx + 8, bottom - 7],
    [D.GOLD_STAR, gx, gy],
    [glass, jx, jy],
    [D.JAR_CORK, Math.floor(W / 2) - 7, 2],
    [D.RAINBOW, W - 12, Ht - 6],
  ];
  if (opt.includes('glow')) adds.push([D.JAR_GLOW, jx + 12, fill + 8]);
  const p = draw(blankGrid(W, Ht), DPAL.starJar, adds, false);
  tiny(p, '100', gx + 1, gy + 3, hex('#8a5a20'));
  return out(softOutline(p, WARM), 0, -Ht, 'toy');
}

/** 휴대폰: 둥근 몸 본을 9-조각으로 늘이고 · 화면에 비친 달빛 줄 · 충전 표시 (dim 이면 흐리게) · 케이블 */
function phoneGiant(W: number, H: number, opt: string): PropSprite {
  const ph = H - 8;
  const body = nine(D.PHONE, 6, 18, 6, 18, W, ph);
  const adds: Add[] = [
    [D.PHONE_SHINE, 6, 12],
    [opt.includes('dim') ? D.BATTERY_DIM : D.BATTERY, Math.floor(W / 2) - 5, Math.floor(ph / 2)],
    [D.CABLE, Math.floor(W / 2) - 3, H - 9],
  ];
  return { pix: draw(stack(W, H, [[body, 0, 2]]), DPAL.phone, adds), ox: 0, oy: -H, faces: { top: [3, 7, 2, ph - 12], front: [2, ph - 1, W - 8, 3], side: [W - 4, 6, 3, ph - 6] } };
}

/** 탁상 달력: 큰 날짜(글씨) · 빨간 동그라미 · 날짜 칸 (작은 숫자 글씨, 날짜 자리수만큼 오른쪽으로) */
function calendarDesk(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const num = (opt.match(/\d+/)?.[0] ?? '12').slice(0, 2);
  const nw = textWidth(num);
  const x0 = 4;
  const top = 8;
  const circle = num.length > 1 ? D.CIRCLE_2 : D.CIRCLE_1;
  const cx = Math.round(x0 + 2 + nw / 2 - (circle[0].length - 1) / 2);
  const p = draw(fit(D.CALENDAR, W, Ht), DPAL.calendar, [[circle, cx, top + 9]], false);
  textH(p, num, x0 + 3, top + 12, hex('#3a3040'));
  const gx = x0 + nw + 7;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) tiny(p, String((r * 4 + c + 1) % 10), gx + c * 6, top + 12 + r * 7, c === 3 ? hex('#c84a44') : hex('#6a6070'));
  return out(softOutline(p, WARM), 0, -Ht, 'toy');
}

function testPapers(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 6;
  const score = opt.match(/\d+/)?.[0] ?? '60';
  const p = draw(fit(D.TEST_PAPERS, W, Ht), DPAL.testPapers, [], false);
  tiny(p, score, W - 22, 21, hex('#d04a44'));
  return out(softOutline(p, WARM), 0, -Ht, 'toy', { faces: { top: [3, 17, 61, 26], front: [3, 43, 61, 8], side: [64, 43, 3, 8] } });
}

function candyTin(W: number, H: number): PropSprite {
  const Ht = H + 4;
  return out(draw(fit(D.CANDY_TIN, W, Ht), DPAL.candyTin, [[D.TIN_CANDIES, 3, 34]]), 0, -Ht, 'toy');
}

function tapeCutter(W: number, H: number): PropSprite {
  const Ht = H + 10;
  const g = stack(W, Ht, [[D.TAPE_ROLL, 10, 3], [D.TAPE_CUTTER, 0, 0], [D.BLADE, 1, 15]]);
  return out(draw(g, DPAL.tapeCutter), 0, -Ht, 'toy', { faces: { top: [1, 18, 42, 5], front: [1, 23, 41, 10], side: [42, 23, 3, 10] } });
}

function hairTie(W: number, H: number): PropSprite {
  return { pix: draw(blankGrid(W, H), DPAL.hairTie, [[D.HAIR_LOOP, 4, 12], [D.HAIR_BEAD, 16, 9]]), ox: 0, oy: -H };
}

function milkCarton(W: number, H: number): PropSprite {
  const Ht = H + 44;
  const p = draw(fit(D.MILK, W, Ht), DPAL.milk, [], false);
  textH(p, '우유', 6 + Math.floor((32 - textWidth('우유')) / 2), 41, hex('#3a5a9a'));
  return out(softOutline(p, WARM), 0, -Ht, 'toy', { faces: { top: [8, 23, 28, 6], front: [7, 34, 30, 56], side: [38, 34, 6, 56] } });
}

/** 메모 벽: 시간표 종이(9-조각) 위에 과목 칸 20개(칸 본을 과목 색으로) · 귀퉁이 테이프 · 노란 쪽지 */
const SUBJECTS = [['1', '6'], ['2', '7'], ['3', '8'], ['4', '9'], ['5', '0']];
function memoWall(W: number, H: number): PropSprite {
  const adds: Add[] = [[nine(D.TIMETABLE, 1, 7, 1, 5, 53, 38), 6, 0]];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const [base, dark] = SUBJECTS[Math.floor(hash2(r, c, 181) * 5)];
      adds.push([recolor(D.SUBJECT, { C: base, c: dark, g: 'O' }), 8 + c * 9, 2 + r * 9]);
    }
  adds.push([D.MEMO_TAPE, 3, 34], [D.MEMO_TAPE, 55, 34]);
  if (W >= 92) adds.push([D.STICKY, 66, 6]);
  return { pix: draw(blankGrid(W, H), DPAL.memoWall, adds), ox: 0, oy: -H, wall: true };
}

/** 책상 끝: 둥글게 깎은 윗면 · 앞판 · 아래로 떨어지는 어둠 (무늬를 이어 깐다) */
function deskEdge(W: number, H: number): PropSprite {
  const g = tile(vrep(D.DESK_EDGE, 23, 24, H), W, H);
  return { pix: draw(g, DPAL.deskEdge, [], false), ox: 0, oy: -H, faces: { top: [0, 0, W, 5], front: [0, 7, W, 12], side: [0, 21, W, H - 21] } };
}

/** 숫자 발판: 눌리면(on) 내려앉아 앞면이 얇아지고 노랗게 켜진다 */
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
