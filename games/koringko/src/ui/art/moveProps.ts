/**
 * 이삿날 공통 소품 라이브러리 (REDESIGN §8 이삿짐 묶음 + 바닥 잔 소품). 사람 크기 방(24px 칸) 기준, 3면 규칙:
 * 윗면 가장 밝게 · 앞면 중간 · 오른쪽 옆면 가장 어둡게, 바닥에 닿는 줄은 진한 접지 선. 순검정 · 순흰색 없음.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy). 목록 · 크기는 scratchpad PROPS2.md.
 *  - flat (wall: true): 바닥 · 벽에 구워지는 데칼 (테이프 조각 · 동전 · 액자 자국 …). 인물을 가리지 않는다
 *  - 나머지는 발 정렬로 인물과 앞뒤를 가리고, 사람 키(40px)보다 높으면 윗부분(top)이 나뉜다
 * 모양은 모두 손으로 찍은 격자 (px/move.ts). 크기가 여럿인 상자 · 소파 · 책 더미는 조각 줄 · 열을 되풀이해 늘인다.
 */
import { handH, textWidth, glyph } from './glyphs.ts';
import type { PropSprite } from './houseProps.ts';
import { Pix, hex, mix, type Color } from './paint.ts';
import { mat, paintGrid, softOutline, type Grid, type Palette } from './px/grid.ts';
import { hrep, stack, vrep } from './px/kit.ts';
import * as G from './px/move.ts';
import { PERSON_SPRITE_H } from './sizes.ts';

const HT = 24;
const PERSON_H = PERSON_SPRITE_H;

/** 종류 · 기본 칸 크기 · 납작한가 */
export const MOVE_KINDS: Record<string, { w: number; h: number; flat: boolean }> = {
  cartonS: { w: 1, h: 1, flat: false },
  cartonM: { w: 1, h: 1, flat: false },
  cartonL: { w: 2, h: 1, flat: false },
  cartonOpen: { w: 1, h: 1, flat: false },
  cartonHalf: { w: 1, h: 1, flat: false },
  rolledRug: { w: 2, h: 1, flat: false },
  sofaWrap: { w: 3, h: 1, flat: false },
  bookTied: { w: 1, h: 1, flat: false },
  bubbleWrap: { w: 1, h: 1, flat: false },
  dishWrap: { w: 1, h: 1, flat: false },
  curtainPile: { w: 1, h: 1, flat: false },
  trashBag: { w: 1, h: 1, flat: false },
  grandClock: { w: 1, h: 1, flat: false },
  tapeBit: { w: 1, h: 1, flat: true },
  markerPen: { w: 1, h: 1, flat: true },
  frameGhost: { w: 1, h: 1, flat: true },
  dragMarks: { w: 2, h: 1, flat: true },
  newsSheet: { w: 1, h: 1, flat: true },
  slipper: { w: 1, h: 1, flat: true },
  coin: { w: 1, h: 1, flat: true },
  button: { w: 1, h: 1, flat: true },
  hairBand: { w: 1, h: 1, flat: true },
};

/** 움직이는 부분 (render 가 매 프레임 덧그린다): 그림 안 좌표 */
export interface LiveSpec {
  /** 추: 매단 점 (x, y) · 길이 · 추 반지름 */
  pendulum?: { x: number; y: number; len: number; r: number };
  /** 시계판: 가운데 · 반지름 (바늘은 장의 시각) */
  face?: { x: number; y: number; r: number };
}
/** 괘종시계: 시계판 가운데 · 추 창은 px/move.ts GRANDCLOCK 격자의 자리 */
export const MOVE_LIVE: Record<string, LiveSpec> = {
  grandClock: { pendulum: { x: 11, y: 30, len: 16, r: 3 }, face: { x: 11, y: 15, r: 6 } },
};

// ───────────────────────── 팔레트 (글자 뜻은 px/move.ts 머리말) ─────────────────────────
const INK = hex('#2a1c24');
const WARM = hex('#3a2430');
const CARD = hex('#c89a64');
const TAPE = hex('#e2c890');
const MARKER = hex('#3a2c3a');
const RED = hex('#b83a34');
const NEWS = hex('#d8d2c2');
const WOOD = hex('#8a5432');
const BRASS = hex('#d8b050');

const card = mat('QqKkx', CARD);
const tape = mat('.eTt.', TAPE);
const main = (c: Color) => mat('GgCcj', c);
const second = (c: Color) => mat('.hAas', c);
const paper = (c: Color) => mat('OoPpy', c);
const wood = (c: Color = WOOD) => mat('.uWwv', c);
const metal = (c: Color) => mat('IiMmz', c);
const pal = (...ps: Palette[]): Palette => Object.assign({ X: MARKER }, ...ps);

/** 격자 → 그림 (외곽선은 따뜻한 먹색) */
function draw(g: Grid, p: Palette, outline = true): Pix {
  const out = paintGrid(new Pix(g[0].length, g.length), g, 0, 0, p);
  return outline ? softOutline(out, WARM) : out;
}

/** 키 넘는 부분을 top 으로 (발 줄 = 그림 맨 아래) */
function stand(pix: Pix, extra: Partial<PropSprite> = {}): PropSprite {
  const s: PropSprite = { pix, ox: 0, oy: -pix.h, ...extra };
  const split = pix.h - PERSON_H;
  if (split >= 6) {
    const top = new Pix(pix.w, split);
    for (let y = 0; y < split; y++) for (let x = 0; x < pix.w; x++) top.set(x, y, pix.get(x, y));
    s.top = top;
    s.topSplitY = split;
  }
  return s;
}
const flat = (pix: Pix, oy = -pix.h): PropSprite => ({ pix, ox: 0, oy, wall: true });

/** 상자 이름: 그릴 수 있는 글자가 든 옵션 첫 것 (없으면 기본) */
function labelOf(opt: string, dflt: string): string {
  const parts = opt.split(',').map((s) => s.trim()).filter((s) => s && [...s].some((c) => glyph(c)));
  return parts[0] ?? dflt;
}

/** 상자 본을 폭 W 로: 테이프 왼쪽(2~7 열) · 오른쪽(13~18 열)을 반씩 되풀이 */
function widen(g: Grid, W: number): string[] {
  const w = g[0].length;
  if (W === w) return [...g];
  const e1 = Math.floor((W - w) / 2);
  const left = hrep(g, 2, 8, w + e1);
  return hrep(left, 13 + e1, 19 + e1, W);
}

/** 상자 본을 윗면 깊이 d · 앞면 높이 fh 로 (줄 되풀이) */
export function cartonGrid(W: number, d: number, fh: number): string[] {
  const top = vrep(G.CARTON.slice(0, 6), 4, 6, d);
  const front = vrep(G.CARTON.slice(6, 19), 5, 9, fh);
  return widen([...top, ...front, G.CARTON[19]], W);
}

/** 상자 본의 팔레트 (골판지 · 테이프) */
export const CARTON_PAL = pal(card, tape);

/** 테이프 상자: 앞면 높이 fh, 매직 이름 (깨짐주의는 붉게) */
function carton(W: number, fh: number, d: number, opt: string, dflt: string): Pix {
  const p = draw(cartonGrid(W, d, fh), pal(card, tape), false);
  const fw = W - 5;
  const label = labelOf(opt, dflt);
  const gap = textWidth(label) > fw - 4 ? 0 : 1;
  const tw = textWidth(label, gap);
  if (fh >= 13 && tw <= fw + 2) handH(p, label, 1 + Math.max(1, Math.floor((fw - tw) / 2)), d + Math.max(3, fh - 12), label.includes('깨') ? RED : MARKER, gap);
  return softOutline(p, WARM);
}

function cartonOpen(W: number, half: boolean): PropSprite {
  const front = vrep(G.CARTON.slice(7, 19), 4, 8, 18);
  let g = [...G.CARTON_OPEN_TOP, ...front];
  if (half) g = stack(24, g.length, [[g, 0, 0], [G.CARTON_HALF_STUFF, 0, 5]]);
  const p = { ...card, ...tape, v: hex('#4a3020'), ...second(hex('#3e5a8a')), ...paper(NEWS), X: MARKER };
  return stand(draw(widen(g, W), p));
}

function rolledRug(W: number): PropSprite {
  const g = W === 48 ? G.RUG : hrep(G.RUG, 14, 30, W);
  return stand(draw(g, pal(main(hex('#a8504a')), paper(hex('#e8dcb0')), { '1': hex('#e0c070') })));
}

function sofaWrap(W: number): PropSprite {
  const g = W === 72 ? G.SOFA : hrep(G.SOFA, 20, 52, W);
  return stand(draw(g, pal(main(hex('#7a8a6a')), tape, wood(), { O: hex('#eef2f4'), o: hex('#c4d0c0') })));
}

function bookTied(W: number, opt: string): PropSprite {
  const n = Math.max(1, Math.min(3, parseInt(opt, 10) || 2));
  const cols = [hex('#b84a40'), hex('#3e5a8a'), hex('#d8a840'), hex('#6a8a5a'), hex('#8a5a8a'), hex('#c87a48')];
  const Ht = 6 + n * 6 + 2;
  const p = new Pix(W, Ht);
  for (let i = 0; i < n; i++) {
    const y = Ht - 2 - (i + 1) * 6;
    paintGrid(p, G.BOOKS_PAIR, i % 2 ? -1 : 0, y, pal(main(cols[(i * 2) % 6]), second(cols[(i * 2 + 1) % 6]), paper(hex('#e8e2d2'))));
  }
  // 끈 열십자 · 매듭
  const twine = wood(hex('#e8dcb0'));
  for (let y = 4; y < Ht - 2; y++) paintGrid(p, ['W'], 11, y, twine);
  paintGrid(p, G.BOOKS_STRING, 0, Ht - 6, twine);
  paintGrid(p, G.BOOKS_KNOT, 0, 0, twine);
  return stand(softOutline(p, WARM));
}

const bubbleWrap = () => stand(draw(G.BUBBLE, pal(main(hex('#c8dce4')), { O: hex('#eef4f6'), o: hex('#dce8ee') })));
const dishWrap = () => stand(draw(G.DISHES, pal(paper(NEWS), { X: hex('#8a8478') })));
const curtainPile = () => stand(draw(G.CURTAIN, pal(main(hex('#d8a0a8')), { '1': BRASS })));
const trashBag = () => stand(draw(G.TRASHBAG, pal(main(hex('#3a3e48')), { O: hex('#8a92a4') })));
const grandClock = () => stand(draw(G.GRANDCLOCK, pal(wood(), paper(hex('#efe4c8')), second(hex('#3a2a24')), { '1': BRASS, '2': hex('#a88838'), X: INK })));

// ───────────────────────── 납작한 것 (바닥 · 벽 데칼) ─────────────────────────

/** 24×24 바닥 데칼: 격자를 (x, y) 에 */
function decal(W: number, H: number, g: Grid, x: number, y: number, p: Palette, outline = false): Pix {
  const out = paintGrid(new Pix(W, H), g, x, y, p);
  return outline ? softOutline(out, WARM) : out;
}

function tapeBit(W: number, H: number, opt: string): PropSprite {
  // 이름 길이에 따라 조각 자리가 조금 다르다 (같은 이름이면 늘 같은 자리)
  const dx = opt.length % 3;
  return flat(decal(W, H, G.TAPE_BIT, dx, 10, { ...tape, v: hex('#a88a58') }));
}

const markerPen = (W: number, H: number) => flat(decal(W, H, G.MARKER, 0, 11, { ...paper(hex('#ece6d6')), A: hex('#2a2a3a'), X: INK, y: hex('#7a6a5a') }));

function frameGhost(W: number, H: number, opt: string): PropSprite {
  // 떼어 낸 액자 자국: 벽지가 주변보다 밝은 네모 (lighten, 빛 효과) · 둘레 먼지 · 못 하나와 못 그늘
  const wide = opt.includes('wide');
  const tall = opt.includes('tall');
  const small = opt.includes('small');
  const fw = Math.min(W - 2, wide ? W - 4 : small ? 10 : 16);
  const fh = Math.min(H - 4, tall ? 20 : small ? 9 : 14);
  const x0 = Math.floor((W - fw) / 2);
  const y0 = Math.floor((H - fh) / 2) + 2;
  const light = new Pix(W, H);
  light.rect(x0, y0, fw, fh, 0x000060);
  // 먼지 테두리: 손찍기 먼지 띠 한 조각을 둘레에 이어 깐다
  const dust = hex('#8a7a66');
  const DUST = 'D.DD.D.DDD.D..DD';
  const p = new Pix(W, H);
  for (let i = 0; i < fw; i++) {
    if (DUST[i % 16] === 'D') p.set(x0 + i, y0 - 1, dust);
    if (DUST[(i + 5) % 16] === 'D') p.set(x0 + i, y0 + fh, dust);
  }
  for (let i = 0; i < fh; i++) {
    if (DUST[(i + 3) % 16] === 'D') p.set(x0 - 1, y0 + i, dust);
    if (DUST[(i + 9) % 16] === 'D') p.set(x0 + fw, y0 + i, dust);
  }
  paintGrid(p, G.NAIL, Math.floor(W / 2), y0 - 4, { I: hex('#b0a8a0'), M: hex('#5a5048'), z: hex('#6a5a4a') });
  return { pix: p, ox: 0, oy: -H, wall: true, lighten: { pix: light, ox: 0, oy: -H } };
}

const dragMarks = (W: number, H: number) => flat(decal(W, H, G.DRAG, 0, 7, main(hex('#6a4a34'))));
const newsSheet = (W: number, H: number) => flat(decal(W, H, G.NEWS, 0, 6, { ...paper(NEWS), X: hex('#6a6458'), A: hex('#9a9488') }, true));

function slipper(W: number, H: number, opt: string): PropSprite {
  const c = opt.includes('blue') ? hex('#6a8ab8') : hex('#e898a8');
  return flat(decal(W, H, G.SLIPPER, 3, 10, { ...main(c), ...second(c), O: mix(c, hex('#fff8f0'), 0.6) }, true));
}

function coin(W: number, H: number, opt: string): PropSprite {
  const gold = opt.includes('500') || opt.includes('10');
  return flat(decal(W, H, G.COIN, 8, 12, { ...main(gold ? hex('#d8a050') : hex('#c8ccd0')), O: gold ? hex('#f4dca0') : hex('#eef0f2'), ...metal(hex('#b8bcc0')) }));
}

const button = (W: number, H: number) => flat(decal(W, H, G.BUTTON, 8, 12, { ...main(hex('#c86a5a')), P: hex('#e8dcc0') }));

function hairBand(W: number, H: number, opt: string): PropSprite {
  const c = opt.includes('yellow') ? hex('#e8c048') : hex('#d85a8a');
  return flat(decal(W, H, G.HAIRBAND, 7, 11, main(c)));
}

/** 소품 그림. 모르는 kind 는 null */
export function moveSprite(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = Math.max(1, w) * HT;
  const H = Math.max(1, h) * HT;
  switch (kind) {
    case 'cartonS': return stand(carton(W, 13, 6, opt, '책'));
    case 'cartonM': return stand(carton(W, 19, 8, opt, '부엌'));
    case 'cartonL': return stand(carton(W, 26, 10, opt, '거실'));
    case 'cartonOpen': return cartonOpen(W, false);
    case 'cartonHalf': return cartonOpen(W, true);
    case 'rolledRug': return rolledRug(W);
    case 'sofaWrap': return sofaWrap(W);
    case 'bookTied': return bookTied(W, opt);
    case 'bubbleWrap': return bubbleWrap();
    case 'dishWrap': return dishWrap();
    case 'curtainPile': return curtainPile();
    case 'trashBag': return trashBag();
    case 'grandClock': return grandClock();
    case 'tapeBit': return tapeBit(W, H, opt);
    case 'markerPen': return markerPen(W, H);
    case 'frameGhost': return frameGhost(W, H, opt);
    case 'dragMarks': return dragMarks(W, H);
    case 'newsSheet': return newsSheet(W, H);
    case 'slipper': return slipper(W, H, opt);
    case 'coin': return coin(W, H, opt);
    case 'button': return button(W, H);
    case 'hairBand': return hairBand(W, H, opt);
    default: return null;
  }
}
