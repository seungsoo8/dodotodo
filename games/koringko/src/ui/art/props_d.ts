/**
 * 갈래 D 소품 · 주민 그림: 13장 베란다 · 14장 소파 밑(근접) · 15장 비 오는 마당 · 16장 골목 끝 놀이터.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 * 3면 규칙(윗면 밝게 · 앞면 중간 · 오른쪽 옆면 어둡게), 바닥 데칼은 wall: true (바닥에 구움), 윗층은 top = pix 전체.
 * 사람 크기(person): 사람 48px · 장난감 36px 기준 실제 크기. 장난감 크기(toy): 소파 밑을 장난감 눈높이로 본 거대한 물건.
 * 순검정 · 순흰색은 쓰지 않는다.
 */
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
import type { PropSprite } from './houseProps.ts';
import { PERSON_SPRITE_H, TOY_SPRITE_H } from './sizes.ts';
import { textH, textWidth } from './glyphs.ts';

const HT = 24;

/** 종류 · 기본 칸 크기 · 눈높이 */
export const PROPS_D: Record<string, { w: number; h: number; scale: 'person' | 'toy' }> = {
  // 13장 베란다
  balconyWin: { w: 4, h: 3, scale: 'person' },
  washer: { w: 2, h: 1, scale: 'person' },
  pegTub: { w: 1, h: 1, scale: 'person' },
  faucet: { w: 1, h: 1, scale: 'person' },
  dustpan: { w: 1, h: 1, scale: 'person' },
  gloves: { w: 1, h: 1, scale: 'person' },
  laundry: { w: 3, h: 1, scale: 'person' },
  dryingRack: { w: 4, h: 1, scale: 'person' },
  haruFlower: { w: 1, h: 1, scale: 'person' },
  chairFold: { w: 1, h: 1, scale: 'person' },
  nameStick: { w: 1, h: 1, scale: 'person' },
  feather: { w: 1, h: 1, scale: 'person' },
  foxBag: { w: 1, h: 1, scale: 'person' },
  trowel: { w: 1, h: 1, scale: 'person' },
  watercan: { w: 1, h: 1, scale: 'person' },
  // 15장 마당
  eaves: { w: 6, h: 1, scale: 'person' },
  downspout: { w: 1, h: 2, scale: 'person' },
  boots: { w: 1, h: 1, scale: 'person' },
  daetdol: { w: 1, h: 1, scale: 'person' },
  tub: { w: 1, h: 1, scale: 'person' },
  clothesline: { w: 6, h: 1, scale: 'person' },
  snail: { w: 1, h: 1, scale: 'person' },
  raincoatButton: { w: 1, h: 1, scale: 'person' },
  cotton: { w: 1, h: 1, scale: 'person' },
  clothespin: { w: 1, h: 1, scale: 'person' },
  looseStone: { w: 1, h: 1, scale: 'person' },
  flashlight: { w: 1, h: 1, scale: 'person' },
  brick: { w: 1, h: 1, scale: 'person' },
  shrub: { w: 3, h: 2, scale: 'person' },
  // 16장 골목 · 놀이터
  car: { w: 4, h: 2, scale: 'person' },
  milkCrate: { w: 1, h: 1, scale: 'person' },
  catBowl: { w: 1, h: 1, scale: 'person' },
  vinylBag: { w: 1, h: 1, scale: 'person' },
  flyer: { w: 1, h: 1, scale: 'person' },
  ditch: { w: 1, h: 1, scale: 'person' },
  wires: { w: 10, h: 1, scale: 'person' },
  sandCastle: { w: 1, h: 1, scale: 'person' },
  palmPrint: { w: 1, h: 1, scale: 'person' },
  footSticker: { w: 1, h: 1, scale: 'person' },
  sticks2: { w: 1, h: 1, scale: 'person' },
  // 14장 소파 밑 (장난감 눈높이)
  skirtBoard: { w: 8, h: 3, scale: 'toy' },
  sofaLeg: { w: 2, h: 2, scale: 'toy' },
  sofaBottom: { w: 10, h: 1, scale: 'toy' },
  spring: { w: 1, h: 1, scale: 'toy' },
  fringe: { w: 8, h: 1, scale: 'toy' },
  matchbox: { w: 2, h: 2, scale: 'toy' },
  crumbHill: { w: 2, h: 2, scale: 'toy' },
  remoteGiant: { w: 4, h: 2, scale: 'toy' },
  dustBunny: { w: 2, h: 1, scale: 'toy' },
  buttonGiant: { w: 1, h: 1, scale: 'toy' },
  candyWrap: { w: 1, h: 1, scale: 'toy' },
  furTuft: { w: 1, h: 1, scale: 'toy' },
  coinGiant: { w: 1, h: 1, scale: 'toy' },
  lego: { w: 1, h: 1, scale: 'toy' },
  marble: { w: 1, h: 1, scale: 'toy' },
  sock: { w: 3, h: 1, scale: 'toy' },
  toothpicks: { w: 1, h: 3, scale: 'toy' },
  straw: { w: 2, h: 1, scale: 'toy' },
  bottleCap: { w: 3, h: 1, scale: 'toy' },
  capsule: { w: 1, h: 1, scale: 'toy' },
  scratcherTip: { w: 1, h: 1, scale: 'toy' },
  threadRed: { w: 1, h: 1, scale: 'toy' },
  penCap: { w: 1, h: 1, scale: 'toy' },
};

/** 주민 (인물처럼 움직이는 것) */
export const RESIDENTS_D = ['clothespins', 'coinElder', 'frogBro', 'alleyCat'] as const;

// ───────────────────────── 팔레트 · 붓 ─────────────────────────
const INK = hex('#2a1c24');
const WOOD_D = hex('#7a4e2c');
const STEEL = hex('#a8b0b8');
const LEAF = hex('#5a8a48');
const YELLOW = hex('#f0c848');
const RED = hex('#c8483c');
const PINK = hex('#e88a98');
const SKY = hex('#1e2650');

function box(p: Pix, x: number, y: number, w: number, h: number, c: Color): void {
  p.rect(x, y, w, h, c);
  p.rect(x, y, w, 1, shade(c, 0.25));
  p.rect(x, y + h - 1, w, 1, shade(c, -0.3));
  p.rect(x + w - 1, y, 1, h, shade(c, -0.18));
}

/** 3면 덩어리: 윗면(깊이 d) + 앞면(높이 h) + 오른쪽 옆면(폭 sw) */
function block3(p: Pix, x: number, y: number, w: number, d: number, h: number, c: Color, sw = 3, topC?: Color): void {
  const fw = w - sw;
  const tc = topC ?? shade(c, 0.18);
  const sc = shade(c, -0.34);
  p.rect(x, y, fw, d, tc);
  p.rect(x, y, fw, 1, shade(tc, 0.3));
  p.rect(x, y + d, fw, h, c);
  p.rect(x, y + d, fw, 1, shade(c, 0.12));
  for (let k = 0; k < sw; k++) p.rect(x + fw + k, y + 1 + k, 1, d + h - 1 - k, sc);
  p.rect(x, y + d + h - 1, fw, 1, shade(c, -0.42));
}

function slice(p: Pix, y0: number, h: number): Pix {
  const q = new Pix(p.w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < p.w; x++) q.set(x, y, p.get(x, y0 + y));
  return q;
}

/** 서 있는 소품: 키를 넘는 윗부분은 인물 위로 (top) */
function stand(pix: Pix, scale: 'person' | 'toy', ox = 0): PropSprite {
  const s: PropSprite = { pix, ox, oy: -pix.h };
  const split = pix.h - (scale === 'person' ? PERSON_SPRITE_H : TOY_SPRITE_H);
  if (split >= 6) {
    s.top = slice(pix, 0, split);
    s.topSplitY = split;
  }
  return s;
}
/** 바닥 · 벽에 구워지는 납작한 것 */
const flat = (pix: Pix, oy = -pix.h): PropSprite => ({ pix, ox: 0, oy, wall: true });
/** 늘 인물 위 (윗층) */
const overTop = (pix: Pix, oy: number): PropSprite => ({ pix, ox: 0, oy, top: pix, topSplitY: pix.h });

// ───────────────────────── 13장 베란다 ─────────────────────────

/** 베란다 바깥 창 (밤하늘 · 별 · 이웃집 지붕 · 전깃줄) + 아래 난간. open: 창이 열려 바람이 드는 칸 */
function balconyWin(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const frame = hex('#d8d0c0');
  const winH = H - 26;
  // 밤하늘 (위가 짙게)
  for (let y = 2; y < winH; y++) p.rect(1, y, W - 2, 1, mix(SKY, hex('#4a4a88'), y / winH));
  for (let i = 0; i < Math.max(2, W / 6); i++) {
    const sx = 3 + Math.floor(hash2(i, W, 11) * (W - 6));
    const sy = 4 + Math.floor(hash2(i, H, 12) * (winH - 18));
    p.set(sx, sy, hash2(i, 3, 13) < 0.3 ? hex('#fff4c0') : hex('#d8e0ff'));
  }
  // 이웃집 지붕 실루엣 · 창 불빛 하나 · 전깃줄
  for (let x = 1; x < W - 1; x++) {
    const roof = winH - 10 + Math.round(Math.abs(((x + W) % 30) - 15) / 3);
    p.rect(x, roof, 1, winH - roof, hex('#262040'));
  }
  if (hash2(W, H, 7) < 0.6 && W > 30) {
    p.rect(Math.floor(W * 0.6), winH - 7, 4, 3, hex('#f8d890'));
  }
  for (let x = 1; x < W - 1; x++) p.set(x, 9 + Math.round(Math.sin((x / W) * Math.PI) * 4), hex('#3a3050'));
  // 창틀 · 유리 (닫힌 창은 반사 줄, 열린 창은 유리가 옆으로 비켜 겹친다)
  box(p, 0, 0, W, 2, frame);
  p.rect(0, 0, 2, winH, frame);
  p.rect(W - 2, 0, 2, winH, shade(frame, -0.15));
  const mid = Math.floor(W / 2);
  if (opt.includes('open')) {
    // 열린 창: 오른쪽 유리가 왼쪽으로 밀려 두 겹 (푸른 반사), 오른쪽은 유리 없이 바깥 공기 · 날리는 커튼 끈
    for (let y = 2; y < winH; y++) for (let x = 2; x < mid; x++) if ((x + y) % 2 === 0) p.set(x, y, mix(p.get(x, y), hex('#8a9ad8'), 0.35));
    p.rect(mid - 1, 0, 2, winH, frame);
    p.rect(mid - 5, 0, 2, winH, shade(frame, -0.1));
    for (let y = 4; y < winH - 2; y++) p.set(W - 4 + Math.round(Math.sin(y / 3) * 1.5), y, hex('#e8d8a8'));
  } else {
    p.rect(mid - 1, 0, 2, winH, frame);
    for (let k = 0; k < 2; k++) p.line(4 + k * mid, winH - 4, 10 + k * mid, 4, hex('#6a70a8'));
  }
  // 창턱 · 난간 (베란다 벽 아래쪽)
  box(p, 0, winH, W, 4, hex('#e8e0d0'));
  const wall = hex('#ddd2bc');
  p.rect(0, winH + 4, W, H - winH - 4, wall);
  for (let x = 2; x < W; x += 6) p.rect(x, winH + 6, 2, H - winH - 9, hex('#b8b0a0'));
  p.rect(0, winH + 6, W, 2, hex('#c8c0b0'));
  p.rect(0, H - 3, W, 3, hex('#a89a84'));
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 드럼 세탁기 (앞면 동그란 문 · 윗면 · 옆면) */
function washer(W: number, H: number): PropSprite {
  const h = 34;
  const d = 10;
  const p = new Pix(W, d + h + 1);
  const c = hex('#e8e8e0');
  block3(p, 2, 0, W - 4, d, h, c, 4);
  p.rect(5, d + 2, W - 14, 4, hex('#c8ccd4'));
  p.set(W - 12, d + 3, hex('#7ad07a'));
  p.set(W - 14, d + 3, hex('#e8a848'));
  const cx = Math.floor((W - 4) / 2);
  p.oval(cx, d + 21, 10, 9, hex('#9aa0a8'));
  p.oval(cx, d + 21, 8, 7, hex('#4a5a78'));
  p.oval(cx - 2, d + 19, 3, 2, hex('#8aa0c8'));
  p.rect(cx + 9, d + 19, 2, 4, hex('#b8bcc4'));
  p.outline();
  return stand(p, 'person');
}

function pegTub(W: number, H: number): PropSprite {
  const p = new Pix(W, 18);
  const c = hex('#7ab0d8');
  for (let y = 6; y < 17; y++) p.rect(4 + Math.floor((y - 6) / 4), y, W - 8 - Math.floor((y - 6) / 2), 1, y % 3 ? c : shade(c, -0.15));
  p.oval(W / 2, 6, W / 2 - 4, 3, shade(c, -0.35));
  const cols = [PINK, YELLOW, hex('#8ad08a'), hex('#a88ad0')];
  for (let i = 0; i < 6; i++) p.rect(6 + i * 2, 2 + (i % 2), 1, 5, cols[i % 4]);
  p.outline();
  return stand(p, 'person');
}

/** 벽 수도꼭지 · 호스 · 양동이 (yard: 마당 수돗가, 시멘트 받침) */
function faucet(W: number, H: number, opt: string): PropSprite {
  const yard = opt.includes('yard');
  const p = new Pix(W, yard ? 34 : 40);
  const g = p.h - 1;
  if (yard) {
    block3(p, 1, g - 12, W - 2, 4, 9, hex('#a8a49c'), 3);
    p.rect(W / 2 - 1, g - 33, 3, 22, hex('#8a8a90'));
    p.rect(W / 2 - 1, g - 33, 8, 3, STEEL);
    p.rect(W / 2 + 5, g - 30, 2, 3, STEEL);
    p.set(W / 2 + 6, g - 26, hex('#bfe0ff'));
    p.set(W / 2 + 6, g - 22, hex('#bfe0ff'));
  } else {
    p.rect(W / 2 - 2, 2, 8, 3, STEEL);
    p.rect(W / 2 + 4, 4, 2, 4, STEEL);
    p.ball(W / 2 - 2, 3, 2, 2, RED);
    // 호스 고리
    for (let t = 0; t < 30; t++) p.set(W / 2 + Math.cos(t / 4.8) * 7, 14 + Math.sin(t / 4.8) * 4, hex('#5aa060'));
    // 양동이
    for (let y = g - 13; y < g; y++) p.rect(5 + Math.floor((g - y) / 6), y, W - 10 - Math.floor((g - y) / 3), 1, hex('#e88a5a'));
    p.oval(W / 2, g - 13, W / 2 - 5, 2, hex('#8a5a3a'));
  }
  p.outline();
  return stand(p, 'person');
}

function dustpan(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#d86a5a');
  p.rect(5, 12, 12, 8, c);
  p.rect(5, 12, 12, 1, shade(c, 0.25));
  p.rect(5, 19, 12, 1, shade(c, -0.3));
  p.rect(16, 15, 6, 2, shade(c, -0.15));
  p.set(8, 16, hex('#c8b8a0'));
  p.set(11, 17, hex('#c8b8a0'));
  p.outline();
  return flat(p);
}

function gloves(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#f0a0b8');
  p.rect(4, 13, 8, 6, c);
  for (let k = 0; k < 4; k++) p.rect(5 + k * 2, 10 - (k === 1 ? 1 : 0), 1, 4, c);
  p.rect(11, 16, 9, 5, shade(c, -0.1));
  for (let k = 0; k < 3; k++) p.rect(20, 16 + k * 2, 3, 1, shade(c, -0.1));
  p.rect(4, 18, 8, 1, shade(c, -0.3));
  p.outline();
  return flat(p);
}

/** 빨래 (윗층): 줄에 널린 셔츠 · 양말 · 수건. towel: 의자에 걸친 큰 수건 */
function laundry(W: number, H: number, opt: string): PropSprite {
  const towel = opt.includes('towel');
  const p = new Pix(W, 40);
  const lineY = 4;
  if (!towel) for (let x = 0; x < W; x++) p.set(x, lineY + Math.round(Math.sin((x / W) * Math.PI) * 3), hex('#d8d0c0'));
  const cols = [hex('#e8e4f4'), hex('#8ab0d8'), hex('#f0c8a0'), hex('#e88a98'), hex('#a8d0a0')];
  if (towel) {
    // 작은 수건걸이 (다리 둘) 에 걸친 큰 수건
    p.rect(3, 4, 1, 36, STEEL);
    p.rect(W - 4, 4, 1, 36, STEEL);
    p.rect(2, 5, W - 4, 1, STEEL);
    const c = hex('#7ab8c8');
    p.rect(2, 6, W - 4, 22, c);
    for (let x = 2; x < W - 2; x += 4) p.rect(x, 6, 1, 22, shade(c, 0.12));
    p.rect(2, 24, W - 4, 2, hex('#f0e8d8'));
    for (let x = 3; x < W - 3; x += 2) p.set(x, 28, c);
    p.rect(2, 6, W - 4, 1, shade(c, 0.3));
  } else {
    // 양 끝 빨래 기둥
    p.rect(0, 2, 2, 38, STEEL);
    p.rect(W - 2, 2, 2, 38, shade(STEEL, -0.2));
    let x = 3;
    let i = 0;
    while (x < W - 8) {
      const c = cols[i % cols.length];
      const sag = Math.round(Math.sin((x / W) * Math.PI) * 3);
      const w = i % 3 === 1 ? 6 : 12;
      const h = i % 3 === 1 ? 10 : i % 3 === 2 ? 20 : 16;
      p.rect(x, lineY + sag + 1, w, h, c);
      p.rect(x, lineY + sag + 1, w, 1, shade(c, 0.25));
      p.rect(x + w - 1, lineY + sag + 1, 1, h, shade(c, -0.2));
      // 펄럭이는 아랫단
      for (let k = 0; k < w; k += 2) p.set(x + k, lineY + sag + h + 1, c);
      p.rect(x + 1, lineY + sag, 2, 3, YELLOW);
      if (w > 8) p.rect(x + w - 3, lineY + sag, 2, 3, PINK);
      x += w + 3;
      i++;
    }
  }
  p.outline();
  return overTop(p, -40);
}

/** 빨래 건조대 (서 있는, 바닥에 다리): 널린 빨래 · 집게 */
function dryingRack(W: number, H: number): PropSprite {
  const p = new Pix(W, 44);
  const g = 43;
  const steel = hex('#c8ccd0');
  // 다리 (X자)
  p.line(2, g, 12, 8, steel);
  p.line(12, g, 2, 8, steel);
  p.line(W - 3, g, W - 13, 8, steel);
  p.line(W - 13, g, W - 3, 8, steel);
  p.rect(2, 8, W - 4, 2, steel);
  p.rect(2, 14, W - 4, 1, shade(steel, -0.1));
  // 빨래
  const cols = [hex('#f0e8e0'), hex('#8ab0d8'), hex('#f8d888'), hex('#d8a0c8')];
  for (let i = 0; i < 5; i++) {
    const x = 6 + i * Math.floor((W - 12) / 5);
    const c = cols[i % cols.length];
    const h = 14 + (i % 2) * 8;
    p.rect(x, 10, 12, h, c);
    p.rect(x + 11, 10, 1, h, shade(c, -0.2));
    p.rect(x + 2, 8, 2, 4, i % 2 ? PINK : YELLOW);
  }
  p.outline();
  return stand(p, 'person');
}

/** 「하루 꽃」 화분: 말라 늘어진 잎 (up: 물을 받고 고개를 든 꽃) */
function haruFlower(W: number, H: number, opt: string): PropSprite {
  const up = opt.includes('up');
  const p = new Pix(W, 34);
  const g = 33;
  const pot = hex('#c8704a');
  for (let y = g - 12; y < g; y++) p.rect(5 + Math.floor((y - (g - 12)) / 5), y, W - 10 - Math.floor((y - (g - 12)) / 2.5), 1, y < g - 9 ? shade(pot, 0.15) : pot);
  p.rect(4, g - 13, W - 8, 2, shade(pot, -0.1));
  p.rect(6, g - 13, W - 12, 1, up ? hex('#5a3a28') : hex('#8a6a50'));
  // 이름표 막대는 따로 (기억 물건). 줄기 · 잎 · 꽃
  const stem = up ? LEAF : hex('#9a9a5a');
  if (up) {
    p.rect(W / 2, g - 28, 1, 15, stem);
    p.line(W / 2, g - 18, W / 2 - 6, g - 22, stem);
    p.line(W / 2, g - 20, W / 2 + 6, g - 25, stem);
    for (let k = 0; k < 5; k++) p.ball(W / 2 + Math.cos((k / 5) * 6.28) * 3, g - 29 + Math.sin((k / 5) * 6.28) * 3, 2, 2, YELLOW, true);
    p.ball(W / 2, g - 29, 1.5, 1.5, hex('#e88a3a'), true);
  } else {
    p.line(W / 2, g - 13, W / 2 + 2, g - 22, stem);
    p.line(W / 2 + 2, g - 22, W / 2 + 7, g - 16, stem);
    p.line(W / 2, g - 16, W / 2 - 6, g - 13, hex('#a89058'));
    p.ball(W / 2 + 7, g - 15, 2, 2, hex('#c8a858'), true);
  }
  p.outline();
  return stand(p, 'person');
}

function chairFold(W: number, H: number): PropSprite {
  const p = new Pix(W, 40);
  const g = 39;
  const c = hex('#6a9ac0');
  p.line(4, g, 18, g - 18, STEEL);
  p.line(18, g, 6, g - 20, STEEL);
  box(p, 4, g - 20, 16, 4, c);
  box(p, 6, g - 36, 12, 14, c);
  p.rect(6, g - 36, 1, 16, STEEL);
  p.rect(17, g - 36, 1, 16, STEEL);
  p.outline();
  return stand(p, 'person');
}

/** 할머니가 꽂아 둔 「하루 꽃」 이름표 막대 */
function nameStick(W: number, H: number): PropSprite {
  const p = new Pix(W, 30);
  const g = 29;
  p.rect(W / 2, g - 14, 2, 14, WOOD_D);
  box(p, 3, g - 26, W - 6, 13, hex('#f0e2c0'));
  textH(p, '하루', Math.floor((W - textWidth('하루')) / 2), g - 24, hex('#6a3a2a'));
  p.ball(W - 6, g - 15, 1.5, 1.5, YELLOW);
  p.outline();
  return stand(p, 'person');
}

function feather(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.line(4, 19, 19, 8, hex('#e8e4dc'));
  for (let t = 0; t < 12; t++) {
    const x = 6 + t;
    const y = 18 - Math.round(t * 0.75);
    const c = t > 7 ? hex('#3a4a88') : t > 3 ? hex('#2e2a38') : hex('#f0ece4');
    p.rect(x, y - 3, 1, 3, c);
    p.rect(x, y + 1, 1, 2, shade(c, -0.15));
  }
  p.set(18, 8, hex('#6a8ad8'));
  p.outline();
  return flat(p);
}

/** 놀이공원 여우 그림 비닐봉지 */
function foxBag(W: number, H: number): PropSprite {
  const p = new Pix(W, 24);
  const c = hex('#f0ece4');
  p.rect(3, 8, 18, 15, c);
  p.rect(3, 8, 18, 1, shade(c, 0.1));
  p.rect(20, 8, 1, 15, shade(c, -0.15));
  for (let x = 4; x < 20; x += 3) p.set(x, 22, shade(c, -0.2));
  p.line(6, 8, 9, 2, c);
  p.line(9, 2, 11, 8, c);
  p.line(13, 8, 15, 2, c);
  p.line(15, 2, 18, 8, c);
  // 여우 얼굴
  p.tri(8, 12, 16, 12, 12, 19, hex('#e8843a'));
  p.tri(8, 12, 10, 9, 10, 13, hex('#e8843a'));
  p.tri(16, 12, 14, 9, 14, 13, hex('#e8843a'));
  p.set(10, 14, INK);
  p.set(14, 14, INK);
  p.set(12, 18, INK);
  p.outline();
  return stand(p, 'person');
}

function trowel(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.tri(4, 17, 12, 12, 12, 21, hex('#a8b0b8'));
  p.line(5, 17, 11, 14, hex('#d8dce0'));
  p.rect(12, 15, 2, 3, hex('#8a8a90'));
  box(p, 14, 14, 8, 5, hex('#b07a48'));
  p.rect(16, 15, 3, 2, hex('#d8a878'));
  p.outline();
  return flat(p);
}

/** 작은 노란 물뿌리개 (손에 들거나 바닥에) */
function watercan(W: number, H: number): PropSprite {
  const p = new Pix(W, 22);
  const c = YELLOW;
  box(p, 5, 9, 11, 12, c);
  p.rect(5, 9, 11, 2, shade(c, 0.2));
  p.line(15, 13, 21, 7, shade(c, -0.1));
  p.rect(20, 5, 3, 3, shade(c, -0.2));
  for (let t = 0; t < 12; t++) p.set(9 + Math.cos(t / 3.8 + 3.3) * 5, 8 + Math.sin(t / 3.8 + 3.3) * 6, shade(c, -0.25));
  p.rect(7, 16, 7, 2, hex('#8ac0e8'));
  p.outline();
  return stand(p, 'person');
}

// ───────────────────────── 15장 마당 ─────────────────────────

/** 처마 끝 (윗층): 기와 끝선 · 낙숫물 */
function eaves(W: number, H: number): PropSprite {
  const p = new Pix(W, 18);
  const tile = hex('#4a4040');
  p.rect(0, 0, W, 12, tile);
  for (let x = 0; x < W; x += 8) {
    p.oval(x + 4, 12, 4, 3, shade(tile, 0.12));
    p.rect(x + 7, 0, 1, 12, shade(tile, -0.2));
  }
  p.rect(0, 0, W, 2, shade(tile, 0.2));
  for (let x = 3; x < W; x += 11) {
    p.rect(x, 15, 1, 2, hex('#a8c8e8'));
    p.set(x, 17, hex('#d8ecff'));
  }
  return overTop(p, -HT - 6);
}

function downspout(W: number, H: number): PropSprite {
  const p = new Pix(W, H + 4);
  const c = hex('#8a8a80');
  p.rect(9, 0, 6, H + 2, c);
  p.rect(9, 0, 2, H + 2, shade(c, 0.2));
  p.rect(13, 0, 2, H + 2, shade(c, -0.2));
  p.rect(7, H - 2, 10, 4, shade(c, -0.1));
  p.rect(10, H + 2, 3, 2, hex('#a8c8e8'));
  p.outline();
  return stand(p, 'person');
}

function boots(W: number, H: number): PropSprite {
  const p = new Pix(W, 22);
  const c = hex('#f0c030');
  for (const x of [3, 12]) {
    box(p, x, 4, 7, 14, c);
    p.rect(x, 15, 10, 5, c);
    p.rect(x, 19, 10, 1, shade(c, -0.4));
    p.rect(x + 1, 5, 2, 9, shade(c, 0.25));
  }
  p.outline();
  return stand(p, 'person');
}

/** 댓돌 (툇마루 앞 넓적한 디딤돌) · 하얀 고무신 한 켤레 */
function daetdol(W: number, H: number): PropSprite {
  const p = new Pix(W + 4, 20);
  const c = hex('#9a968c');
  block3(p, 0, 4, W + 4, 8, 7, c, 3);
  for (let i = 0; i < 4; i++) p.set(3 + hash2(i, 2, 3) * (W - 4), 6 + hash2(i, 4, 5) * 5, shade(c, -0.18));
  p.oval(8, 7, 3, 1.5, hex('#e8e8e0'));
  p.oval(15, 8, 3, 1.5, hex('#e8e8e0'));
  p.outline();
  return { ...stand(p, 'person', -2) };
}

/** 빨간 고무 대야 (물이 차면 물길 그림이 위에) */
function tub(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#c84a3a');
  p.oval(12, 12, 11, 9, shade(c, -0.15));
  p.oval(12, 12, 9, 7, hex('#5a2a28'));
  p.oval(12, 11, 10, 8, c);
  p.oval(12, 12, 8, 6, shade(c, -0.35));
  p.set(5, 8, shade(c, 0.35));
  return flat(p);
}

/** 빨랫줄 (윗층): 양 끝 기둥 · 빈 집게 */
function clothesline(W: number, H: number): PropSprite {
  const p = new Pix(W, 46);
  const post = WOOD_D;
  p.rect(1, 2, 3, 44, post);
  p.rect(W - 4, 2, 3, 44, post);
  for (let x = 3; x < W - 3; x++) p.set(x, 5 + Math.round(Math.sin(((x - 3) / (W - 6)) * Math.PI) * 5), hex('#d8d0c0'));
  for (let x = 16; x < W - 10; x += 19) {
    const y = 5 + Math.round(Math.sin(((x - 3) / (W - 6)) * Math.PI) * 5);
    p.rect(x, y - 1, 2, 5, x % 2 ? PINK : hex('#9ad0f0'));
  }
  return overTop(p, -46 + 4);
}

function snail(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.rect(6, 17, 12, 2, hex('#b8a888'));
  p.ball(12, 14, 4, 4, hex('#a87a48'));
  for (let t = 0; t < 10; t++) p.set(12 + Math.cos(t) * (t / 4), 14 + Math.sin(t) * (t / 4), hex('#6a4a2a'));
  p.rect(16, 15, 1, 2, hex('#b8a888'));
  p.outline();
  return flat(p);
}

/** 노란 비옷 단추 (웅덩이 옆) */
function raincoatButton(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.oval(12, 14, 6, 5, shade(YELLOW, -0.15));
  p.oval(12, 13, 6, 5, YELLOW);
  p.oval(12, 13, 3, 2.5, shade(YELLOW, -0.1));
  for (const [x, y] of [[11, 12], [13, 12], [11, 14], [13, 14]]) p.set(x, y, hex('#8a6a20'));
  p.set(9, 11, hex('#fff0b0'));
  p.outline();
  return flat(p);
}

/** 덤불 밑 하얀 솜 한 줌 (토비 털) */
function cotton(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  for (let i = 0; i < 7; i++) p.ball(6 + hash2(i, 1, 2) * 12, 12 + hash2(i, 3, 4) * 6, 3, 2.5, hex('#f0eee8'), true);
  p.set(14, 13, hex('#d8d4c8'));
  p.outline();
  return flat(p);
}

function clothespin(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  box(p, 9, 6, 3, 14, hex('#9ad0f0'));
  box(p, 12, 6, 3, 14, hex('#8ac0e0'));
  p.rect(9, 12, 6, 2, STEEL);
  // 토끼 귀 모양으로 눌린 자국 (집게 끝)
  p.set(10, 5, hex('#f0e8e0'));
  p.set(13, 5, hex('#f0e8e0'));
  p.outline();
  return stand(p, 'person');
}

function looseStone(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#a09a8a');
  p.oval(12, 14, 8, 5, shade(c, -0.2));
  p.oval(12, 13, 8, 5, c);
  p.oval(10, 11, 4, 2, shade(c, 0.2));
  p.line(5, 16, 19, 16, shade(c, -0.35));
  p.outline();
  return stand(p, 'person');
}

function flashlight(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.oval(12, 18, 9, 3, hex('#5a4030'));
  box(p, 6, 12, 12, 5, hex('#c84a3a'));
  p.rect(16, 11, 4, 7, hex('#a8a8b0'));
  p.rect(19, 12, 1, 5, hex('#d8e0e8'));
  p.rect(9, 12, 2, 1, hex('#e8a090'));
  p.outline();
  return flat(p);
}

/** 붉은 벽돌 (밀어서 물길을 막는다) */
function brick(W: number, H: number): PropSprite {
  const p = new Pix(W, 22);
  const c = hex('#b85a3a');
  block3(p, 2, 6, W - 4, 6, 9, c, 3);
  p.rect(5, 8, 4, 2, shade(c, -0.25));
  p.rect(12, 8, 4, 2, shade(c, -0.25));
  p.outline();
  return stand(p, 'person');
}

/** 큰 덤불 (빽빽한 잎 · 아래는 어두운 굴: 그날 토비가 떨어진 자리) */
function shrub(W: number, H: number): PropSprite {
  const p = new Pix(W, H + 22);
  const g = p.h - 1;
  const leaf = hex('#3e6e3a');
  // 아래 굴 그늘
  p.oval(W / 2, g - 4, W / 2 - 4, 6, hex('#1e2a1e'));
  for (let i = 0; i < Math.floor((W * H) / 70); i++) {
    const x = 6 + hash2(i, W, 21) * (W - 12);
    const y = 8 + hash2(i, H, 22) * (p.h - 22);
    const k = (hash2(i, 3, 23) - 0.5) * 0.35 + (y < p.h / 2 ? 0.12 : -0.05);
    p.ball(x, y, 6 + hash2(i, 4, 24) * 3, 5 + hash2(i, 5, 25) * 2, shade(leaf, k), true);
  }
  // 빗방울 맺힌 잎 끝
  for (let i = 0; i < W / 4; i++) p.set(4 + hash2(i, 6, 26) * (W - 8), 6 + hash2(i, 7, 27) * (p.h - 24), hex('#b8d8f0'));
  p.outline();
  return stand(p, 'person');
}

// ───────────────────────── 16장 골목 · 놀이터 ─────────────────────────

/** 주차된 차 (차 밑은 장난감이 숨는다) */
function car(W: number, H: number): PropSprite {
  const p = new Pix(W, H + 26);
  const g = p.h - 1;
  const c = hex('#6a7ab8');
  // 차 밑 그늘 · 바퀴
  p.rect(6, g - 8, W - 12, 6, hex('#1e1a28'));
  for (const x of [14, W - 18]) {
    p.oval(x, g - 5, 7, 5, hex('#262430'));
    p.oval(x, g - 5, 3, 2, hex('#8a8a94'));
  }
  // 몸통 (윗면 · 앞면 · 옆면)
  block3(p, 2, g - 44, W - 4, 22, 16, c, 4, shade(c, 0.12));
  // 지붕 · 유리
  box(p, 18, g - 56, W - 40, 16, shade(c, 0.05));
  p.rect(21, g - 53, W - 46, 10, hex('#3a4868'));
  p.line(24, g - 52, 30, g - 45, hex('#8a9ad0'));
  // 전조등 · 번호판
  p.rect(5, g - 20, 6, 3, hex('#f0e8b0'));
  p.rect(W - 14, g - 20, 6, 3, hex('#f0e8b0'));
  box(p, W / 2 - 8, g - 19, 16, 5, hex('#e8e4d8'));
  p.outline();
  return stand(p, 'person');
}

/** 우유 상자 (플라스틱 칸막이 · 숨는 칸). stack: 두 개 쌓음 (막힘) */
function milkCrate(W: number, H: number, opt: string): PropSprite {
  const stack = opt.includes('stack');
  const p = new Pix(W, stack ? 42 : 24);
  const c = hex('#3a8a5a');
  const one = (y: number) => {
    block3(p, 1, y, W - 2, 5, 14, c, 3);
    for (let x = 4; x < W - 5; x += 4) p.rect(x, y + 7, 2, 9, shade(c, -0.35));
    p.rect(3, y + 9, W - 8, 2, shade(c, 0.1));
  };
  if (stack) one(p.h - 40);
  one(p.h - 21);
  p.outline();
  return stand(p, 'person');
}

function catBowl(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.oval(12, 15, 8, 4, hex('#d86a6a'));
  p.oval(12, 14, 6, 2.5, hex('#8a5a3a'));
  for (let i = 0; i < 5; i++) p.set(8 + i * 2, 14, hex('#c89a6a'));
  p.outline();
  return flat(p);
}

function vinylBag(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#e8e8f0');
  p.oval(12, 15, 8, 5, c);
  p.oval(10, 13, 4, 2, shade(c, 0.1));
  p.line(15, 11, 19, 8, c);
  p.line(9, 11, 6, 8, c);
  p.set(13, 16, hex('#4a8ad8'));
  p.outline();
  return flat(p);
}

function flyer(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#f0ead8');
  p.tri(3, 14, 18, 10, 20, 20, c);
  p.tri(3, 14, 20, 20, 6, 22, c);
  p.rect(8, 15, 7, 1, hex('#c84a3a'));
  p.rect(9, 17, 6, 1, hex('#8a8070'));
  return flat(p);
}

/** 하수구 도랑 (시멘트 홈 · 쇠 덮개 · 물) */
function ditch(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.rect(0, 0, W, H, hex('#5a5c62'));
  p.rect(3, 0, W - 6, H, hex('#1c1e26'));
  p.rect(5, 0, W - 10, H, hex('#283648'));
  for (let y = 4; y < H; y += 9) p.rect(6, y, W - 12, 1, hex('#5a7aa0'));
  p.rect(0, 0, 3, H, hex('#7a7c84'));
  p.rect(W - 3, 0, 3, H, hex('#45464c'));
  return flat(p);
}

/** 전깃줄 (윗층, 골목을 가로지른다) */
function wires(W: number, H: number): PropSprite {
  const p = new Pix(W, 30);
  for (let k = 0; k < 3; k++)
    for (let x = 0; x < W; x++) p.set(x, 6 + k * 5 + Math.round(Math.sin((x / W) * Math.PI) * (6 + k * 2)), shade(hex('#2a2a34'), k * 0.05));
  return overTop(p, -HT * 3);
}

function sandCastle(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#d8b878');
  p.oval(12, 18, 9, 3, shade(c, -0.15));
  box(p, 6, 10, 12, 8, c);
  for (let x = 6; x < 18; x += 3) p.rect(x, 8, 2, 2, c);
  p.rect(11, 13, 2, 4, shade(c, -0.35));
  p.rect(12, 3, 1, 6, WOOD_D);
  p.tri(13, 3, 17, 5, 13, 7, RED);
  p.outline();
  return stand(p, 'person');
}

/** 가로등 기둥 밑동: 할머니가 짚던 자리, 페인트가 닳은 손바닥 모양 */
function palmPrint(W: number, H: number): PropSprite {
  const p = new Pix(W, 30);
  const c = hex('#4a5a58');
  box(p, 7, 2, 10, 28, c);
  p.rect(7, 2, 2, 28, shade(c, 0.15));
  // 닳은 손바닥 (밝은 금속)
  const m = hex('#a8b4b0');
  p.rect(10, 12, 5, 5, m);
  for (let k = 0; k < 4; k++) p.rect(10 + k, 8 + (k === 0 || k === 3 ? 1 : 0), 1, 4, m);
  p.rect(14, 13, 2, 2, m);
  p.outline();
  return stand(p, 'person');
}

/** 횡단보도 앞 노란 발자국 스티커 */
function footSticker(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  for (const [x, y] of [[7, 12], [15, 15]]) {
    p.oval(x, y, 3, 4.5, YELLOW);
    for (let k = 0; k < 4; k++) p.set(x - 2 + k * 1.3, y - 6, YELLOW);
    p.set(x - 1, y, shade(YELLOW, 0.3));
  }
  p.rect(4, 19, 16, 1, hex('#e8e0c0'));
  return flat(p);
}

/** 벤치 위 아이스크림 막대 둘 (하나는 「한 개 더」) */
function sticks2(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#e8cc98');
  for (const [x, y] of [[5, 12], [9, 16]]) {
    p.rect(x, y, 11, 3, c);
    p.rect(x, y, 11, 1, shade(c, 0.2));
    p.rect(x + 10, y, 1, 3, shade(c, -0.2));
  }
  p.rect(7, 13, 5, 1, hex('#c84a3a'));
  p.outline();
  return flat(p);
}

// ───────────────────────── 14장 소파 밑 (장난감 눈높이) ─────────────────────────

/** 거대한 걸레받이 + 그 위 벽지 (outlet: 콘센트) */
function skirtBoard(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const wall = hex('#e2d4b8');
  p.rect(0, 0, W, H, wall);
  for (let x = 0; x < W; x += 12) p.rect(x, 0, 1, H - 30, shade(wall, -0.05));
  const b = hex('#b88a5a');
  const by = H - 30;
  p.rect(0, by, W, 30, b);
  p.rect(0, by, W, 3, shade(b, 0.25));
  p.rect(0, by + 3, W, 1, shade(b, -0.2));
  for (let x = 0; x < W; x++) if (hash2(x >> 3, 1, 9) < 0.3) p.set(x, by + 12 + (x % 5), shade(b, -0.1));
  p.rect(0, H - 4, W, 4, shade(b, -0.3));
  // 먼지 띠
  for (let x = 0; x < W; x += 3) p.set(x, H - 5, hex('#c8bca8'));
  if (opt.includes('outlet')) {
    const ox = Math.floor(W / 2) - 14;
    box(p, ox, by - 30, 28, 26, hex('#f0ece0'));
    for (const dx of [8, 18]) {
      p.oval(ox + dx, by - 17, 3, 3, hex('#c8c0b0'));
      p.set(ox + dx - 1, by - 17, INK);
      p.set(ox + dx + 1, by - 17, INK);
    }
    // 휴대폰 충전기 줄이 늘어져 있다
    p.rect(ox + 6, by - 20, 4, 6, hex('#e8e8e8'));
    for (let y = by - 14; y < H; y++) p.set(ox + 8 + Math.round(Math.sin(y / 6) * 2), y, hex('#d8d8d8'));
  }
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 소파 다리 (거대한 나무 기둥, 천장까지) */
function sofaLeg(W: number, H: number): PropSprite {
  const p = new Pix(W, 120);
  const g = p.h - 1;
  const c = hex('#8a5a34');
  const cx = W / 2;
  for (let y = 0; y < g; y++) {
    const r = 10 + Math.round(Math.sin((y / g) * Math.PI) * 3) - (y > g - 14 ? Math.floor((y - (g - 14)) / 3) : 0);
    p.rect(cx - r, y, r * 2, 1, c);
    p.rect(cx - r, y, 3, 1, shade(c, 0.25));
    p.rect(cx + r - 5, y, 5, 1, shade(c, -0.3));
  }
  for (let y = 8; y < g - 12; y += 7) p.rect(cx - 6, y, 2, 4, shade(c, -0.15));
  p.oval(cx, g - 1, 13, 3, hex('#5a3a22'));
  p.outline();
  return stand(p, 'toy');
}

/** 소파 바닥 천 가장자리 (윗층): 체크무늬 안감이 위에서 늘어져 있다 */
function sofaBottom(W: number, H: number): PropSprite {
  const p = new Pix(W, 30);
  const a = hex('#5a4a6a');
  const b = hex('#6a5878');
  for (let y = 0; y < 24; y++) for (let x = 0; x < W; x++) p.set(x, y, ((x >> 3) + (y >> 3)) % 2 ? a : b);
  for (let x = 0; x < W; x += 2) p.rect(x, 24 + Math.round(Math.sin(x / 9) * 2), 1, 4, shade(a, -0.2));
  p.rect(0, 22, W, 2, shade(a, -0.3));
  return overTop(p, -HT * 2);
}

/** 튀어나온 용수철 (윗층) */
function spring(W: number, H: number): PropSprite {
  const p = new Pix(W, 44);
  for (let y = 0; y < 34; y++) p.rect(W / 2 - 5 + Math.round(Math.sin(y / 1.6) * 5), y, 3, 1, y % 4 < 2 ? STEEL : shade(STEEL, -0.25));
  p.outline();
  return overTop(p, -HT * 2 - 10);
}

/** 술 장식 (앞쪽 가림막). gap: 사이로 TV 빛 */
function fringe(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, 46);
  const c = hex('#c8a060');
  p.rect(0, 0, W, 8, shade(c, -0.15));
  for (let x = 0; x < W; x += 4) {
    if (opt.includes('gap') && x > W / 2 - 14 && x < W / 2 + 10) continue;
    const len = 30 + Math.round(hash2(x, 3, 4) * 10);
    p.rect(x, 8, 2, len, x % 8 ? c : shade(c, -0.12));
    p.ball(x + 1, 8 + len, 2, 2, shade(c, 0.1));
  }
  return { pix: p, ox: 0, oy: -30 };
}

/** 루루의 보물 상자 (성냥갑) */
function matchbox(W: number, H: number): PropSprite {
  const p = new Pix(W, 44);
  const c = hex('#e8d0a0');
  block3(p, 2, 6, W - 4, 16, 20, c, 4);
  box(p, 4, 26, W - 12, 14, hex('#c84a3a'));
  p.rect(8, 30, W - 20, 6, hex('#f0e8d8'));
  p.ball(W / 2 - 4, 33, 3, 2, hex('#e8843a'));
  // 반쯤 열린 서랍 속 반짝이
  box(p, 6, 2, W - 16, 8, hex('#b8945a'));
  p.set(12, 4, YELLOW);
  p.set(18, 5, PINK);
  p.set(24, 4, hex('#8ad0f0'));
  p.outline();
  return stand(p, 'toy');
}

function crumbHill(W: number, H: number): PropSprite {
  const p = new Pix(W, 40);
  const g = 39;
  const c = hex('#d8a860');
  for (let i = 0; i < 26; i++) {
    const x = 4 + hash2(i, 1, 5) * (W - 8);
    const y = g - 4 - hash2(i, 2, 6) * Math.max(4, 26 - Math.abs(x - W / 2) * 0.9);
    p.ball(x, y, 3 + hash2(i, 3, 7) * 3, 2.5 + hash2(i, 4, 8) * 2, shade(c, (hash2(i, 5, 9) - 0.5) * 0.3), true);
  }
  p.outline();
  return stand(p, 'toy');
}

/** 커다란 텔레비전 리모컨 */
function remoteGiant(W: number, H: number): PropSprite {
  const p = new Pix(W, H + 10);
  const c = hex('#3a3a44');
  block3(p, 2, 2, W - 4, H - 6, 12, c, 4, hex('#4a4a56'));
  for (let i = 0; i < 12; i++) {
    const x = 10 + (i % 6) * 12;
    const y = 8 + Math.floor(i / 6) * 12;
    p.oval(x, y, 3, 2.5, i === 3 ? RED : hex('#8a8a98'));
  }
  p.rect(W - 18, 6, 6, 4, RED);
  p.outline();
  return stand(p, 'toy');
}

function dustBunny(W: number, H: number): PropSprite {
  const p = new Pix(W, 30);
  for (let i = 0; i < 18; i++) p.ball(6 + hash2(i, 1, 2) * (W - 12), 12 + hash2(i, 3, 4) * 14, 5, 4, shade(hex('#9a92a0'), (hash2(i, 5, 6) - 0.5) * 0.3), true);
  for (let i = 0; i < 8; i++) p.line(4 + hash2(i, 7, 8) * (W - 8), 10 + hash2(i, 9, 1) * 16, 6 + hash2(i, 2, 3) * (W - 12), 14 + hash2(i, 4, 5) * 14, hex('#b8b0c0'));
  p.outline();
  return stand(p, 'toy');
}

/** 거대한 단추 (house: 단추 집 두 칸 — 동전 마을의 집) */
function buttonGiant(W: number, H: number, opt: string): PropSprite {
  const house = opt.includes('house');
  const p = new Pix(W, house ? 40 : 22);
  const c = house ? hex('#7ab0d8') : hex('#c86a5a');
  if (house) {
    p.oval(W / 2, 30, W / 2 - 2, 9, shade(c, -0.25));
    p.oval(W / 2, 27, W / 2 - 2, 9, c);
    for (const dx of [-6, 6]) for (const dy of [-3, 3]) p.oval(W / 2 + dx, 27 + dy, 2, 1.5, shade(c, -0.4));
    box(p, W / 2 - 8, 4, 16, 18, hex('#e8d8b8'));
    p.tri(W / 2 - 11, 6, W / 2 + 11, 6, W / 2, -2, hex('#c84a3a'));
    p.rect(W / 2 - 3, 14, 6, 8, hex('#6a4a3a'));
  } else {
    p.oval(W / 2, 14, W / 2 - 3, 7, shade(c, -0.25));
    p.oval(W / 2, 12, W / 2 - 3, 7, c);
    for (const dx of [-4, 4]) for (const dy of [-2, 2]) p.oval(W / 2 + dx, 12 + dy, 1.5, 1, shade(c, -0.45));
  }
  p.outline();
  return stand(p, 'toy');
}

function candyWrap(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.rect(7, 10, 10, 6, hex('#e85a8a'));
  p.tri(7, 10, 2, 8, 2, 18, hex('#f0a0c0'));
  p.tri(17, 10, 22, 8, 22, 18, hex('#f0a0c0'));
  p.rect(9, 12, 5, 1, hex('#f8e0a0'));
  p.outline();
  return flat(p);
}

/** 여우 털 세 가닥 (빨간 실로 묶음) */
function furTuft(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  for (let k = 0; k < 3; k++) for (let t = 0; t < 14; t++) p.set(5 + t, 9 + k * 3 + Math.round(Math.sin(t / 3 + k) * 1.5), k === 1 ? hex('#f0e8d8') : hex('#e8843a'));
  p.rect(11, 9, 2, 9, RED);
  p.outline();
  return flat(p);
}

/** 거대한 동전 (stack: 쌓인 탑 · 500 · 100 · 50 · 10 한 닢) */
function coinGiant(W: number, H: number, opt: string): PropSprite {
  const gold = opt.includes('10') && !opt.includes('100');
  const c = gold ? hex('#c8904a') : hex('#c8ccd4');
  if (opt.includes('stack')) {
    const p = new Pix(W, 54);
    for (let k = 0; k < 9; k++) {
      const y = 48 - k * 5;
      p.oval(W / 2, y + 2, 10, 4, shade(c, -0.3));
      p.oval(W / 2, y, 10, 4, k % 2 ? c : shade(c, 0.08));
    }
    p.oval(W / 2 - 3, 6, 4, 1.5, shade(c, 0.35));
    p.outline();
    return stand(p, 'toy');
  }
  const big = opt.includes('500') ? 11 : opt.includes('100') ? 10 : opt.includes('50') ? 9 : 8;
  const p = new Pix(W, 20);
  p.oval(W / 2, 13, big, 5, shade(c, -0.3));
  p.oval(W / 2, 11, big, 5, c);
  p.oval(W / 2, 11, big - 3, 3, shade(c, 0.1));
  p.oval(W / 2 - 3, 10, 3, 1.5, shade(c, 0.35));
  p.outline();
  return stand(p, 'toy');
}

function lego(W: number, H: number): PropSprite {
  const p = new Pix(W, 30);
  const c = hex('#d8483a');
  block3(p, 1, 8, W - 2, 8, 12, c, 3);
  for (const x of [6, 14]) {
    p.oval(x, 9, 3, 2, shade(c, 0.3));
    p.rect(x - 3, 5, 6, 4, shade(c, 0.1));
    p.oval(x, 5, 3, 1.5, shade(c, 0.35));
  }
  p.outline();
  return stand(p, 'toy');
}

function marble(W: number, H: number): PropSprite {
  const p = new Pix(W, 22);
  p.ball(W / 2, 12, 9, 9, hex('#6ab0e8'));
  p.line(W / 2 - 6, 14, W / 2 + 5, 8, hex('#f0c848'));
  p.line(W / 2 - 5, 16, W / 2 + 6, 10, hex('#e85a5a'));
  p.ball(W / 2 - 3, 8, 2, 2, hex('#e8f4ff'));
  p.outline();
  return stand(p, 'toy');
}

/** 아빠 양말 (둘둘 뭉친 산) */
function sock(W: number, H: number): PropSprite {
  const p = new Pix(W, 36);
  const c = hex('#5a5a6a');
  p.oval(W / 2, 22, W / 2 - 4, 12, c);
  p.oval(W / 2 - 10, 18, 14, 9, shade(c, 0.1));
  for (let x = 6; x < W - 6; x += 5) p.rect(x, 14, 1, 18, shade(c, -0.15));
  p.oval(W - 16, 14, 8, 6, hex('#d8d8d0'));
  p.outline();
  return stand(p, 'toy');
}

/** 이쑤시개 울타리 (부스러기에 꽂아 세운 말뚝 · 빨간 실로 엮음) */
function toothpicks(W: number, H: number): PropSprite {
  const p = new Pix(W, H + 26);
  const c = hex('#e8d0a0');
  const g = p.h - 1;
  for (let ty = 0; ty < H / HT; ty++) {
    const foot = g - (H / HT - 1 - ty) * HT;
    for (const [x, lean] of [[6, -1], [15, 1]] as const) {
      const top = foot - 30;
      for (let y = top; y < foot; y++) {
        const xx = x + Math.round(((y - top) / 30) * lean * -2);
        p.rect(xx, y, 3, 1, c);
        p.set(xx, y, shade(c, 0.25));
        p.set(xx + 2, y, shade(c, -0.25));
      }
      p.set(x + 1 - lean * 2, top - 1, shade(c, -0.1));
      p.oval(x + 1, foot, 4, 2, hex('#c8a060'));
    }
    p.line(4, foot - 18, W - 4, foot - 16, RED);
    p.line(4, foot - 10, W - 4, foot - 8, shade(RED, -0.15));
  }
  p.outline();
  return stand(p, 'toy');
}

function straw(W: number, H: number): PropSprite {
  const p = new Pix(W, 20);
  for (let x = 2; x < W - 2; x++) {
    const c = (x >> 2) % 2 ? hex('#f0ece4') : hex('#e85a6a');
    p.rect(x, 8, 1, 8, c);
    p.set(x, 8, shade(c, 0.2));
    p.set(x, 15, shade(c, -0.3));
  }
  p.outline();
  return stand(p, 'toy');
}

function bottleCap(W: number, H: number): PropSprite {
  const p = new Pix(W, 40);
  const c = hex('#d8483a');
  for (let k = 0; k < 2; k++) {
    const x = 8 + k * 36;
    p.oval(x + 12, 30, 15, 7, shade(c, -0.3));
    for (let y = 18; y < 30; y++) p.rect(x - 3, y, 30, 1, (y >> 1) % 2 ? c : shade(c, -0.12));
    p.oval(x + 12, 18, 15, 7, shade(c, 0.15));
    p.oval(x + 12, 18, 11, 4, hex('#f0e8d0'));
  }
  p.outline();
  return stand(p, 'toy');
}

/** 인형 뽑기 기계의 동그란 플라스틱 캡슐 */
function capsule(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.ball(W / 2, 12, 8, 8, hex('#f0a8c8'));
  p.rect(W / 2 - 8, 12, 16, 8, hex('#e8eef4'));
  p.oval(W / 2, 19, 8, 3, hex('#d8dee8'));
  p.rect(W / 2 - 8, 11, 16, 2, shade(hex('#f0a8c8'), -0.25));
  p.set(W / 2 - 3, 7, hex('#fff0f8'));
  p.outline();
  return stand(p, 'toy');
}

/** 효자손 끝 (고무 손가락) */
function scratcherTip(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const w = hex('#c89a64');
  p.rect(2, 13, 10, 4, w);
  p.rect(2, 13, 10, 1, shade(w, 0.2));
  const r = hex('#7a6a5a');
  p.oval(15, 14, 5, 4, r);
  for (let k = 0; k < 4; k++) p.rect(17 + (k === 0 || k === 3 ? 0 : 1), 10 + k * 2, 4, 1, shade(r, 0.1));
  p.outline();
  return flat(p);
}

/** 빨간 실 한 토막 (루루 꼬리와 같은 실) */
function threadRed(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  for (let t = 0; t < 60; t++) {
    const a = t / 6;
    p.set(12 + Math.cos(a) * (2 + t / 10), 13 + Math.sin(a) * (1.5 + t / 14), t % 3 ? RED : shade(RED, -0.2));
  }
  p.line(16, 15, 21, 19, RED);
  p.outline();
  return flat(p);
}

/** 수성펜 뚜껑 */
function penCap(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#4a7ad8');
  p.rect(5, 12, 13, 6, c);
  p.rect(5, 12, 13, 1, shade(c, 0.3));
  p.rect(5, 17, 13, 1, shade(c, -0.3));
  p.rect(17, 13, 3, 4, shade(c, -0.15));
  p.rect(7, 10, 8, 2, shade(c, 0.1));
  p.outline();
  return flat(p);
}

/** 갈래 D 소품 그림 (모르는 이름이면 null) */
export function propDSprite(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = w * HT;
  const H = h * HT;
  switch (kind) {
    case 'balconyWin': return balconyWin(W, H, opt);
    case 'washer': return washer(W, H);
    case 'pegTub': return pegTub(W, H);
    case 'faucet': return faucet(W, H, opt);
    case 'dustpan': return dustpan(W, H);
    case 'gloves': return gloves(W, H);
    case 'laundry': return laundry(W, H, opt);
    case 'dryingRack': return dryingRack(W, H);
    case 'haruFlower': return haruFlower(W, H, opt);
    case 'chairFold': return chairFold(W, H);
    case 'nameStick': return nameStick(W, H);
    case 'feather': return feather(W, H);
    case 'foxBag': return foxBag(W, H);
    case 'trowel': return trowel(W, H);
    case 'watercan': return watercan(W, H);
    case 'eaves': return eaves(W, H);
    case 'downspout': return downspout(W, H);
    case 'boots': return boots(W, H);
    case 'daetdol': return daetdol(W, H);
    case 'tub': return tub(W, H);
    case 'clothesline': return clothesline(W, H);
    case 'snail': return snail(W, H);
    case 'raincoatButton': return raincoatButton(W, H);
    case 'cotton': return cotton(W, H);
    case 'clothespin': return clothespin(W, H);
    case 'looseStone': return looseStone(W, H);
    case 'flashlight': return flashlight(W, H);
    case 'brick': return brick(W, H);
    case 'shrub': return shrub(W, H);
    case 'car': return car(W, H);
    case 'milkCrate': return milkCrate(W, H, opt);
    case 'catBowl': return catBowl(W, H);
    case 'vinylBag': return vinylBag(W, H);
    case 'flyer': return flyer(W, H);
    case 'ditch': return ditch(W, H);
    case 'wires': return wires(W, H);
    case 'sandCastle': return sandCastle(W, H);
    case 'palmPrint': return palmPrint(W, H);
    case 'footSticker': return footSticker(W, H);
    case 'sticks2': return sticks2(W, H);
    case 'skirtBoard': return skirtBoard(W, H, opt);
    case 'sofaLeg': return sofaLeg(W, H);
    case 'sofaBottom': return sofaBottom(W, H);
    case 'spring': return spring(W, H);
    case 'fringe': return fringe(W, H, opt);
    case 'matchbox': return matchbox(W, H);
    case 'crumbHill': return crumbHill(W, H);
    case 'remoteGiant': return remoteGiant(W, H);
    case 'dustBunny': return dustBunny(W, H);
    case 'buttonGiant': return buttonGiant(W, H, opt);
    case 'candyWrap': return candyWrap(W, H);
    case 'furTuft': return furTuft(W, H);
    case 'coinGiant': return coinGiant(W, H, opt);
    case 'lego': return lego(W, H);
    case 'marble': return marble(W, H);
    case 'sock': return sock(W, H);
    case 'toothpicks': return toothpicks(W, H);
    case 'straw': return straw(W, H);
    case 'bottleCap': return bottleCap(W, H);
    case 'capsule': return capsule(W, H);
    case 'scratcherTip': return scratcherTip(W, H);
    case 'threadRed': return threadRed(W, H);
    case 'penCap': return penCap(W, H);
    default: return null;
  }
}

// ───────────────────────── 주민 ─────────────────────────

type RDir = 'down' | 'up' | 'left' | 'right';

/** 빨래집게 자매 집순이 · 집돌이 (분홍 · 하늘색, 바람에 흔들림) */
function clothespins(dir: RDir, frame: number): Pix {
  const p = new Pix(30, 34);
  const back = dir === 'up';
  const cols = [PINK, hex('#8ac8e8')];
  cols.forEach((c, k) => {
    const x = 5 + k * 12 + (frame === 1 ? (k ? -1 : 1) : 0);
    const top = 6 + k * 3;
    // 두 다리 (집게 날)
    p.rect(x, top, 4, 24 - k * 3, c);
    p.rect(x + 5, top, 4, 24 - k * 3, shade(c, -0.12));
    p.rect(x, top, 1, 24 - k * 3, shade(c, 0.25));
    // 스프링 (허리)
    p.rect(x - 1, top + 10, 11, 3, STEEL);
    p.rect(x - 1, top + 10, 11, 1, shade(STEEL, 0.3));
    if (!back) {
      p.set(x + 1, top + 4, INK);
      p.set(x + 7, top + 4, INK);
      p.set(x + 4, top + 7, hex('#a04a5a'));
      p.set(x + 3, top + 6, shade(c, 0.3));
    }
  });
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 백원 할배 (1998년산 백 원 동전, 옆으로 서서 굴러다님 · 흰 눈썹 · 지팡이 성냥개비) */
function coinElder(dir: RDir, frame: number): Pix {
  const p = new Pix(28, 34);
  const c = hex('#c8ccd4');
  const side = dir === 'left' || dir === 'right';
  const cx = 14;
  const bob = frame === 1 ? 1 : 0;
  if (side) {
    p.rect(cx - 3, 6 + bob, 6, 24, shade(c, -0.15));
    for (let y = 7; y < 29; y += 2) p.set(cx + 2, y + bob, shade(c, -0.35));
    p.rect(cx - 3, 6 + bob, 2, 24, shade(c, 0.2));
  } else {
    p.oval(cx, 18 + bob, 11, 12, shade(c, -0.25));
    p.oval(cx, 18 + bob, 10, 11, c);
    p.oval(cx, 18 + bob, 7, 8, shade(c, 0.08));
    if (dir === 'down') {
      // 얼굴 (이순신 장군처럼 근엄한 흰 눈썹)
      p.rect(cx - 6, 13 + bob, 4, 2, hex('#f4f0e8'));
      p.rect(cx + 2, 13 + bob, 4, 2, hex('#f4f0e8'));
      p.set(cx - 4, 16 + bob, INK);
      p.set(cx + 4, 16 + bob, INK);
      p.rect(cx - 3, 21 + bob, 6, 2, hex('#f4f0e8'));
      p.rect(cx - 2, 23 + bob, 4, 1, hex('#f4f0e8'));
    } else {
      textH(p, '100', cx - 6, 15 + bob, shade(c, -0.4));
    }
  }
  // 성냥개비 지팡이
  p.rect(cx + 11, 10, 2, 22, hex('#e8d0a0'));
  p.ball(cx + 12, 10, 2, 2, RED);
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 개굴 형 (진짜 청개구리, 빗방울이 맺힌 등) */
function frogBro(dir: RDir, frame: number): Pix {
  const p = new Pix(24, 20);
  const c = hex('#6ab048');
  const hop = frame >= 2 ? -3 : 0;
  const side = dir === 'left' || dir === 'right';
  if (side) {
    p.oval(11, 13 + hop, 8, 5, c);
    p.oval(16, 10 + hop, 4, 4, c);
    p.ball(17, 8 + hop, 2, 2, hex('#f0f4d0'));
    p.set(18, 8 + hop, INK);
    p.rect(4, 15 + hop, 6, 3, shade(c, -0.2));
    p.rect(13, 17 + hop, 4, 2, shade(c, -0.2));
    p.line(17, 12 + hop, 20, 12 + hop, hex('#3a5a28'));
  } else {
    p.oval(12, 13 + hop, 8, 6, c);
    p.oval(12, 15 + hop, 5, 3, dir === 'up' ? shade(c, -0.1) : hex('#e8f0c8'));
    for (const dx of [-5, 5]) {
      p.ball(12 + dx, 7 + hop, 3, 3, c);
      if (dir !== 'up') {
        p.ball(12 + dx, 7 + hop, 1.5, 1.5, hex('#f0f4d0'));
        p.set(12 + dx, 7 + hop, INK);
      }
    }
    p.rect(3, 16 + hop, 4, 3, shade(c, -0.2));
    p.rect(17, 16 + hop, 4, 3, shade(c, -0.2));
    if (dir === 'down') p.line(9, 12 + hop, 15, 12 + hop, hex('#3a5a28'));
  }
  p.set(9, 11 + hop, hex('#d8f0ff'));
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 길고양이 얼룩이 (진짜 고양이, 장난감보다 크다: 흰 바탕 · 회색 얼룩 · 노란 눈) */
function alleyCat(dir: RDir, frame: number): Pix {
  const p = new Pix(48, 40);
  const white = hex('#e8e4dc');
  const gray = hex('#6a6670');
  const walk = frame % 2;
  const side = dir === 'left' || dir === 'right';
  if (side) {
    // 몸 · 꼬리 · 다리
    p.oval(22, 24, 15, 8, white);
    p.oval(16, 21, 7, 5, gray);
    p.oval(28, 25, 5, 4, gray);
    for (let t = 0; t < 14; t++) p.rect(6 - Math.round(Math.sin(t / 4 + frame) * 2), 22 - t, 3, 1, gray);
    for (const [x, k] of [[12, 0], [17, 1], [27, 0], [32, 1]] as const) p.rect(x, 30 + (walk === k ? -1 : 0), 3, 8, x < 20 ? gray : white);
    // 머리
    p.oval(38, 16, 8, 7, white);
    p.oval(35, 13, 4, 3, gray);
    p.tri(32, 11, 36, 4, 37, 11, white);
    p.tri(39, 11, 43, 4, 44, 12, white);
    p.ball(41, 15, 1.8, 1.8, hex('#e8c848'));
    p.set(41, 15, INK);
    p.set(46, 18, hex('#d88a8a'));
    p.line(44, 19, 48, 18, hex('#c8c0b8'));
  } else {
    const back = dir === 'up';
    p.oval(24, 27, 12, 10, white);
    p.oval(20, 24, 6, 5, gray);
    for (const x of [16, 28]) p.rect(x, 33 + (walk ? 1 : 0), 4, 6, white);
    p.oval(24, 14, 9, 8, white);
    p.oval(20, 12, 4, 4, gray);
    p.tri(15, 10, 18, 2, 21, 8, white);
    p.tri(27, 8, 30, 2, 33, 10, white);
    if (!back) {
      for (const dx of [-4, 4]) {
        p.ball(24 + dx, 14, 2, 2, hex('#e8c848'));
        p.rect(24 + dx, 13, 1, 3, INK);
      }
      p.set(24, 17, hex('#d88a8a'));
      p.line(14, 17, 19, 17, hex('#c8c0b8'));
      p.line(29, 17, 34, 17, hex('#c8c0b8'));
    } else {
      for (let t = 0; t < 14; t++) p.rect(24 + Math.round(Math.sin(t / 4 + frame) * 3), 26 + t, 3, 1, gray);
    }
  }
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 갈래 D 주민 그림 (모르는 이름이면 null) */
export function residentDSprite(kind: string, dir: RDir, frame: number): Pix | null {
  switch (kind) {
    case 'clothespins': return clothespins(dir, frame % 2);
    case 'coinElder': return coinElder(dir, frame % 2);
    case 'frogBro': return frogBro(dir, frame);
    case 'alleyCat': return alleyCat(dir, frame);
    default: return null;
  }
}
