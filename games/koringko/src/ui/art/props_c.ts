/**
 * 갈래 C 소품 (3장 안방 · 7장 현관 · 10장 욕실 · 12장 · 19장 부엌): 사람 크기 집(24px 칸)의 큰 가구와 기억 물건.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 * 3면 규칙 (윗면 밝게 · 앞면 중간 · 오른쪽 옆면 가장 어둡게), 사람 키보다 높은 부분은 top 으로 나뉜다. 순검정 · 순흰색 없음.
 */
import { Pix, hex, shade, type Color } from './paint.ts';
import type { Faces, PropSprite } from './houseProps.ts';
import { PERSON_SPRITE_H } from './sizes.ts';

const HT = 24;
const INK = hex('#2a1c24');
const CREAM = hex('#ece6d6');
const WOOD = hex('#a8703c');
const OAK = hex('#c08a52');
const STEEL = hex('#b8bec4');
const RED = hex('#c8483c');
const GOLD = hex('#e8c060');

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

// ───────────────────────── 붓 ─────────────────────────

function block3(p: Pix, x: number, y: number, w: number, d: number, h: number, c: Color, sw = 3, topC?: Color): Faces {
  const fw = w - sw;
  const tc = topC ?? shade(c, 0.18);
  const sc = shade(c, -0.34);
  p.rect(x, y, fw, d, tc);
  p.rect(x, y, fw, 1, shade(tc, 0.3));
  p.rect(x, y + d, fw, h, c);
  p.rect(x, y + d, fw, 1, shade(c, 0.12));
  for (let k = 0; k < sw; k++) p.rect(x + fw + k, y + 1 + k, 1, d + h - 1 - k, sc);
  p.rect(x + fw, y + d + h - 1, sw, 1, shade(sc, -0.2));
  p.rect(x, y + d + h - 1, fw, 1, shade(c, -0.42));
  return { top: [x, y, fw, d], front: [x, y + d, fw, h], side: [x + fw, y + d, sw, h] };
}

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

/** 문 · 서랍 손잡이 */
function knob(p: Pix, x: number, y: number, w = 4): void {
  p.rect(x, y, w, 1, shade(STEEL, 0.2));
  p.rect(x, y + 1, w, 1, shade(STEEL, -0.3));
}

/** 'drawer@3' → 3 */
function at(opt: string, key: string): number {
  const m = new RegExp(`${key}@(\\d+)`).exec(opt);
  return m ? Number(m[1]) : -1;
}

// ───────────────────────── 부엌 ─────────────────────────

/** 냉장고 (2×1): 위 냉동칸 · 아래 냉장칸, 자석 · 메모 · 하루 그림. ajar 면 문틈 빛 */
function fridge(W: number, opt: string): PropSprite {
  const Ht = 78;
  const p = new Pix(W, Ht);
  const c = hex('#e4e2da');
  const faces = block3(p, 1, 0, W - 2, 6, Ht - 7, c, 5, hex('#f0eee6'));
  const fw = W - 7;
  // 문 이음매 (냉동 · 냉장)
  p.rect(2, 26, fw - 2, 1, shade(c, -0.3));
  p.rect(2, 27, fw - 2, 1, shade(c, 0.1));
  // 손잡이 (세로)
  p.rect(fw - 4, 12, 2, 10, shade(STEEL, -0.1));
  p.rect(fw - 4, 31, 2, 16, shade(STEEL, -0.1));
  p.rect(fw - 4, 12, 1, 10, shade(STEEL, 0.25));
  p.rect(fw - 4, 31, 1, 16, shade(STEEL, 0.25));
  // 자석 · 메모 · 하루 크레용 그림
  p.rect(5, 32, 12, 14, hex('#f6efdf'));
  p.line(7, 42, 10, 36, hex('#e0784a'));
  p.line(10, 36, 14, 43, hex('#e0784a'));
  p.oval(11, 38, 2, 2, hex('#f0c040'));
  p.rect(10, 31, 3, 2, RED);
  p.rect(20, 14, 9, 7, hex('#f8e8a0'));
  for (let y = 16; y < 20; y += 2) p.rect(21, y, 6, 1, hex('#a89a7a'));
  p.rect(23, 13, 3, 2, hex('#4a8ac8'));
  p.oval(8, 18, 2, 2, hex('#6ab04a'));
  p.oval(27, 50, 2, 2, hex('#e8a040'));
  if (opt.includes('ajar')) {
    // 문이 덜 닫혀 문틈으로 하얀 빛
    p.rect(fw, 28, 1, Ht - 36, hex('#f8f4d8'));
    p.rect(fw + 1, 28, 1, Ht - 36, hex('#e8ecd0'));
  }
  // 아래 받침 그늘
  p.rect(2, Ht - 4, fw - 2, 2, shade(c, -0.45));
  p.outline(INK);
  return out(p, { faces });
}

/** 부엌 조리대 (w×1): 아래 문짝 · 서랍, 윗판. sink@n · stove@n · drawer@n (n 번째 칸), open 이면 그 서랍이 빠져나옴 */
function kcounter(W: number, opt: string): PropSprite {
  const fh = 24;
  const d = 9;
  const Ht = fh + d + 2;
  const open = opt.includes('open');
  const p = new Pix(W, Ht + (open ? 10 : 0));
  const body = hex('#d8c8a8');
  const top = hex('#b8bcc0');
  const faces = block3(p, 0, 2, W, d, fh, body, 3, top);
  const cells = Math.floor(W / HT);
  for (let i = 0; i < cells; i++) {
    const x0 = i * HT;
    // 문짝 테두리 · 이음매
    p.rect(x0 + 2, d + 5, HT - 4, fh - 6, shade(body, 0.06));
    p.rect(x0 + 2, d + 5, HT - 4, 1, shade(body, 0.2));
    p.rect(x0 + HT - 1, d + 3, 1, fh - 2, shade(body, -0.25));
    knob(p, x0 + HT / 2 - 2, d + 9);
  }
  const sink = at(opt, 'sink');
  if (sink >= 0) {
    const x0 = sink * HT;
    p.rect(x0 + 3, 4, HT * 2 - 8, d - 3, hex('#8a9098'));
    p.rect(x0 + 4, 5, HT * 2 - 10, d - 5, hex('#6a7078'));
    // 수도꼭지
    p.rect(x0 + HT - 1, 0, 2, 5, STEEL);
    p.rect(x0 + HT - 1, 0, 5, 2, STEEL);
  }
  const stove = at(opt, 'stove');
  if (stove >= 0) {
    const x0 = stove * HT;
    p.rect(x0 + 2, 3, HT - 4, d - 2, hex('#3a3a44'));
    p.oval(x0 + 8, 6, 3, 2, hex('#5a5a66'));
    p.oval(x0 + 16, 7, 3, 2, hex('#5a5a66'));
    // 냄비
    p.rect(x0 + 11, -1 + 2, 9, 5, hex('#a0a6ae'));
  }
  const dr = at(opt, 'drawer');
  if (dr >= 0) {
    const x0 = dr * HT;
    // 과자 서랍 (아래 칸) 앞판
    p.rect(x0 + 3, d + 4, HT - 6, 8, shade(OAK, 0.05));
    p.rect(x0 + 3, d + 4, HT - 6, 1, shade(OAK, 0.3));
    knob(p, x0 + 9, d + 7, 6);
    if (open) {
      // 빠져나온 서랍: 속에 사탕 봉지 · 과자 상자
      const y = d + 12;
      block3(p, x0 + 1, y, HT - 2, 8, 6, OAK, 2, shade(OAK, -0.5));
      p.rect(x0 + 4, y + 2, 5, 4, hex('#e85a6a'));
      p.rect(x0 + 11, y + 1, 6, 5, hex('#f0c040'));
      p.set(x0 + 6, y + 2, hex('#f8e0e0'));
    }
  }
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht, faces };
}

/** 벽 찬장 (w×2, 벽에 붙음): 위 칸 문짝 둘씩. open 이면 한쪽 문이 열려 밥그릇 · 꿀단지가 보인다 */
function wallCab(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 8;
  const p = new Pix(W, Ht);
  const c = hex('#c8a878');
  block3(p, 0, 0, W, 5, Ht - 8, c, 3);
  const doors = Math.max(2, Math.floor(W / 18));
  const dw = Math.floor((W - 5) / doors);
  for (let i = 0; i < doors; i++) {
    const x0 = 1 + i * dw;
    if (open(opt) && i === doors - 1) {
      p.rect(x0 + 1, 7, dw - 2, Ht - 17, hex('#5a4030'));
      p.rect(x0 + 3, 14, 6, 5, hex('#f0ece0'));
      p.rect(x0 + 2, 19, 8, 2, hex('#e8e0d0'));
      p.oval(x0 + dw - 7, 16, 4, 4, hex('#e0a040'));
      p.rect(x0 + dw - 10, 11, 7, 2, hex('#c88a48'));
      continue;
    }
    p.rect(x0 + 1, 7, dw - 2, Ht - 17, shade(c, 0.08));
    p.rect(x0 + 1, 7, dw - 2, 1, shade(c, 0.25));
    p.rect(x0 + dw - 2, 7, 1, Ht - 17, shade(c, -0.2));
    knob(p, i % 2 ? x0 + 3 : x0 + dw - 7, Ht - 16, 3);
  }
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht, wall: true };
}
const open = (opt: string) => opt.split(',').includes('open');

/** 쌀 포대 (1×1) */
function riceSack(W: number): PropSprite {
  const Ht = 30;
  const p = new Pix(W, Ht);
  const c = hex('#e8dcc0');
  for (let y = 4; y < Ht - 1; y++) {
    const inset = y < 8 ? 6 - Math.floor((y - 4) / 1.5) : 2;
    p.rect(inset, y, W - inset * 2, 1, y % 5 === 0 ? shade(c, -0.08) : c);
  }
  p.rect(5, 2, W - 10, 3, shade(c, -0.15));
  p.rect(W - 5, 8, 3, Ht - 10, shade(c, -0.25));
  // 붉은 글씨 띠 · 쌀알
  p.rect(5, 14, W - 10, 5, hex('#c85a4a'));
  p.rect(7, 16, W - 14, 1, hex('#f0d8c8'));
  p.set(3, Ht - 1, c);
  p.set(W - 2, Ht - 2, c);
  p.outline(INK);
  return out(p);
}

/** 빨간 리본 한 토막 (냉장고 옆면 자석 밑) */
function ribbon(W: number): PropSprite {
  const p = new Pix(W, 16);
  p.tri(6, 4, 11, 8, 6, 12, RED);
  p.tri(17, 4, 12, 8, 17, 12, RED);
  p.oval(11.5, 8, 2, 2, shade(RED, -0.2));
  p.line(11, 9, 8, 15, shade(RED, -0.1));
  p.line(12, 9, 15, 15, shade(RED, -0.1));
  p.set(7, 5, hex('#f0a0a0'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -16 };
}

/** 앞치마 걸이: 큰 앞치마와 작은 앞치마, 주머니에 열쇠 꾸러미 */
function apron(W: number): PropSprite {
  const Ht = 30;
  const p = new Pix(W, Ht);
  p.rect(2, 1, W - 4, 2, WOOD);
  p.rect(4, 3, 9, Ht - 6, hex('#d8a0a0'));
  p.rect(4, 3, 9, 1, hex('#e8c0c0'));
  p.rect(5, 14, 7, 6, hex('#c88888'));
  p.rect(7, 12, 3, 3, GOLD);
  p.set(8, 11, hex('#f8e8a8'));
  p.rect(14, 3, 7, Ht - 12, hex('#a0c0d8'));
  p.rect(14, 3, 7, 1, hex('#c0d8e8'));
  for (let y = 6; y < Ht - 10; y += 4) p.rect(15, y, 5, 1, hex('#f0f0e8'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht };
}

/** 서랍 앞판 (1×1, 당기기 · 서랍 계단): open 이면 빠져나온 서랍 속 */
function drawerFront(W: number, opt: string): PropSprite {
  const Ht = 22;
  const p = new Pix(W, Ht);
  const c = shade(OAK, opt.includes('dark') ? -0.2 : 0);
  if (open(opt)) {
    block3(p, 1, 4, W - 2, 9, 8, c, 2, shade(c, -0.55));
    p.rect(4, 6, 5, 5, hex('#e85a6a'));
    p.rect(11, 6, 6, 4, hex('#f0c040'));
    knob(p, 8, 15, 6);
  } else {
    block3(p, 1, 8, W - 2, 3, 10, c, 2);
    knob(p, 8, 13, 6);
  }
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht };
}

/** 깔린 선반 판 (찬장 속 단면, w×1) */
function shelfBoard(W: number): PropSprite {
  const Ht = 12;
  const p = new Pix(W, Ht);
  block3(p, 0, 2, W, 4, 6, hex('#b88a58'), 2);
  for (let x = 4; x < W - 4; x += 9) p.rect(x, 3, 3, 1, shade(hex('#b88a58'), 0.25));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht };
}

// ───────────────────────── 안방 ─────────────────────────



/** 보석함 (1×1): open 이면 뚜껑이 열리고 발레리나 · 동백꽃 머리핀 */
function jewelBox(W: number, opt: string): PropSprite {
  const Ht = 24;
  const p = new Pix(W, Ht);
  const c = hex('#c8607a');
  block3(p, 3, 10, W - 6, 6, 7, c, 2);
  p.rect(W / 2 - 2, 18, 3, 3, GOLD);
  p.set(W / 2 - 1, 19, INK);
  if (open(opt)) {
    p.rect(3, 2, W - 8, 8, shade(c, 0.15));
    p.rect(W / 2 - 1, 4, 2, 7, hex('#f0d8e0'));
    p.oval(W / 2, 4, 2, 2, hex('#f2c8a0'));
    p.oval(7, 12, 2, 2, RED);
  } else {
    p.rect(3, 8, W - 8, 3, shade(c, 0.25));
  }
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht };
}

/** 빨래 건조대 (2×1): 아빠 수건 · 엄마 고무장갑 한 짝. 밑 그늘에 숨을 수 있다 */
function dryRack(W: number): PropSprite {
  const Ht = 40;
  const p = new Pix(W, Ht);
  const bar = hex('#c8ccd4');
  p.line(2, Ht - 1, 10, 6, bar);
  p.line(W - 3, Ht - 1, W - 11, 6, bar);
  p.rect(4, 6, W - 8, 2, bar);
  p.rect(4, 6, W - 8, 1, shade(bar, 0.3));
  // 수건 · 장갑
  p.rect(7, 8, 14, 20, hex('#7a9ac8'));
  p.rect(7, 8, 14, 1, hex('#a0b8e0'));
  for (let y = 12; y < 27; y += 5) p.rect(7, y, 14, 1, hex('#6a88b4'));
  p.rect(26, 8, 6, 12, hex('#f0c040'));
  p.rect(25, 18, 8, 4, hex('#e8b030'));
  p.rect(35, 8, 8, 16, hex('#f0ece0'));
  p.outline(INK);
  return out(p);
}

// ───────────────────────── 현관 ─────────────────────────

/** 신발장 (2×1, 키 큼): open 이면 아래 칸 문이 반쯤 열려 할머니 털신이 보인다. 위에 거울 틀 */
function shoeCabinet(W: number, opt: string): PropSprite {
  const Ht = 74;
  const p = new Pix(W, Ht);
  const c = hex('#c8a87c');
  // 거울 틀 (위)
  p.rect(6, 0, W - 14, 18, shade(WOOD, -0.05));
  p.rect(8, 2, W - 18, 14, hex('#8a9ab8'));
  p.rect(10, 4, 6, 6, hex('#e8e0d0'));
  p.rect(11, 5, 4, 4, hex('#c8a080'));
  const faces = block3(p, 0, 20, W, 7, Ht - 28, c, 4);
  // 문짝 셋 (위 · 가운데 · 아래)
  for (let i = 0; i < 3; i++) {
    const y = 29 + i * 14;
    if (i === 2 && open(opt)) {
      p.rect(2, y, W - 8, 12, hex('#4a3428'));
      p.rect(5, y + 6, 8, 5, hex('#8a6a5a'));
      p.rect(14, y + 6, 8, 5, hex('#8a6a5a'));
      p.rect(5, y + 5, 8, 2, hex('#e8dcc8'));
      p.rect(14, y + 5, 8, 2, hex('#e8dcc8'));
      continue;
    }
    p.rect(2, y, W - 8, 12, shade(c, 0.07));
    p.rect(2, y, W - 8, 1, shade(c, 0.25));
    knob(p, W - 13, y + 5, 3);
  }
  p.outline(INK);
  return out(p, { faces });
}

/** 신발 한 켤레 (1×1): dad 구두 · mom 운동화 · haru 운동화 · small 작아진 운동화 · fur 할머니 털신 */
function shoePair(W: number, opt: string): PropSprite {
  const Ht = 16;
  const p = new Pix(W, Ht);
  const col: Record<string, Color> = { dad: hex('#3a3040'), mom: hex('#e8a0b0'), haru: hex('#e8e4d8'), small: hex('#6aa0d8'), fur: hex('#a07858') };
  const key = Object.keys(col).find((k) => opt.includes(k)) ?? 'haru';
  const c = col[key];
  for (const x0 of [3, 12]) {
    p.oval(x0 + 4, 10, 4.5, 3.5, c);
    p.rect(x0, 11, 9, 3, c);
    p.rect(x0, 13, 9, 1, shade(c, -0.4));
    p.oval(x0 + 4, 9, 2, 1.5, shade(c, -0.5));
    if (key === 'fur') p.rect(x0, 6, 9, 2, hex('#f0e8d8'));
    if (key === 'haru' || key === 'small') p.rect(x0 + 1, 11, 7, 1, hex('#e05a4a'));
  }
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht };
}

/** 천장 센서등 (윗층): 둥근 갓 */
function ceilLamp(W: number): PropSprite {
  const p = new Pix(W, 12);
  p.oval(W / 2, 5, 9, 4, hex('#f0ece0'));
  p.oval(W / 2, 4, 6, 2, hex('#f8f4e8'));
  p.rect(W / 2 - 1, 0, 2, 2, hex('#a8a8a8'));
  p.set(W / 2 + 4, 6, hex('#e85a4a'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -12, top: p, topSplitY: 12 };
}

// ───────────────────────── 욕실 ─────────────────────────

/** 고무 오리 */
function duck(W: number): PropSprite {
  const p = new Pix(W, 18);
  const y = hex('#f0c838');
  p.oval(12, 12, 7, 4, y);
  p.oval(15, 7, 4, 4, y);
  p.rect(18, 7, 4, 2, hex('#e8783a'));
  p.set(15, 6, INK);
  p.rect(7, 10, 5, 2, shade(y, 0.25));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -18 };
}

/** 개켜 쌓은 수건 더미 */
function towelPile(W: number): PropSprite {
  const Ht = 22;
  const p = new Pix(W, Ht);
  const cs = [hex('#a8c8e0'), hex('#f0e8d8'), hex('#e8b0b8'), hex('#c8e0c0')];
  for (let i = 0; i < 4; i++) {
    const y = Ht - 5 - i * 4;
    p.rect(3 + (i % 2), y, W - 7, 4, cs[i]);
    p.rect(3 + (i % 2), y, W - 7, 1, shade(cs[i], 0.2));
  }
  // 비닐에 싼 공책 모서리
  p.rect(W - 9, Ht - 12, 6, 3, hex('#e8ecf0'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht };
}

/** 꽃무늬 바가지 */
function gourd(W: number): PropSprite {
  const p = new Pix(W, 14);
  const c = hex('#e8d0a0');
  p.oval(11, 9, 8, 4, c);
  p.oval(11, 7, 6, 2, shade(c, -0.35));
  p.rect(18, 7, 5, 2, c);
  for (let i = 0; i < 3; i++) p.set(6 + i * 4, 10 + (i % 2), hex('#e8708a'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -14 };
}

/** 향수병 (엄마 화장대 위, 빛을 가린다) */
function perfume(W: number): PropSprite {
  const Ht = 26;
  const p = new Pix(W, Ht);
  const g = hex('#e8b0c8');
  p.rect(6, 10, W - 12, Ht - 11, g);
  p.rect(6, 10, 3, Ht - 11, shade(g, 0.25));
  p.rect(W - 9, 10, 3, Ht - 11, shade(g, -0.25));
  p.rect(9, 5, 6, 5, GOLD);
  p.rect(10, 2, 4, 3, shade(GOLD, -0.2));
  p.rect(8, 15, 8, 4, hex('#f6efdf'));
  p.outline(INK);
  return out(p);
}

/** 현관 바닥 타일 (납작한 데칼, 막지 않음): 회색 돌 타일 · 줄눈 */
function tileFloor(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#9a9690');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const gx = x % 12 === 0;
    const gy = y % 12 === 0;
    const k = ((Math.floor(x / 12) * 7 + Math.floor(y / 12) * 3) % 5) * 0.015;
    p.set(x, y, gx || gy ? shade(c, -0.22) : shade(c, k + (y % 12 === 1 ? 0.08 : 0)));
  }
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 꿀단지 (뚜껑이 무거운 옛 항아리) */
function honeyJar(W: number, opt: string): PropSprite {
  const Ht = 30;
  const p = new Pix(W, Ht);
  const c = hex('#c88a48');
  p.ball(W / 2, 18, 10, 11, c);
  p.rect(W / 2 - 6, 4, 12, 4, hex('#e8c060'));
  p.rect(W / 2 - 5, 7, 10, 2, shade(c, -0.3));
  if (open(opt)) p.rect(W / 2 - 4, 6, 8, 2, hex('#f0b030'));
  else p.rect(W / 2 - 7, 3, 14, 3, shade(WOOD, 0.1));
  p.rect(W / 2 - 4, 15, 8, 6, hex('#f0e0b0'));
  p.outline(INK);
  return out(p);
}

/** 딸기 사탕 한 알 (빨간 비닐 포장, 양 끝을 비튼) */
function candyRed(W: number): PropSprite {
  const p = new Pix(W, 14);
  const c = hex('#e04858');
  p.oval(12, 8, 5, 4, c);
  p.tri(7, 8, 3, 4, 3, 12, shade(c, 0.1));
  p.tri(17, 8, 21, 4, 21, 12, shade(c, 0.1));
  p.oval(10, 6, 2, 1, hex('#f8c0c8'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -14 };
}

/** 밥그릇 · 국그릇 탑 (one 이면 큰 그릇 하나): 맨 밑 토끼 그림 어린이 밥그릇 */
function bowlStack(W: number, opt: string): PropSprite {
  const n = opt.includes('one') ? 1 : 4;
  const Ht = 8 + n * 6;
  const p = new Pix(W, Ht);
  const cs = [hex('#f0ece0'), hex('#d8e4ec'), hex('#f4e4c8'), hex('#e8d0d8')];
  for (let i = 0; i < n; i++) {
    const y = Ht - 7 - i * 6;
    const w = 18 - i * 2;
    const x = (W - w) / 2;
    p.rect(x, y, w, 6, cs[i % 4]);
    p.rect(x, y, w, 1, shade(cs[i % 4], 0.15));
    p.rect(x + 1, y + 5, w - 2, 1, shade(cs[i % 4], -0.3));
    p.rect(x + w - 2, y + 1, 2, 4, shade(cs[i % 4], -0.2));
  }
  if (n > 1) p.oval(W / 2, Ht - 4, 2, 1.5, hex('#e8a0b0'));
  p.outline(INK);
  return out(p);
}

/** 엄마가 누운 침대 (w×h): 머리판 · 베개 위 엄마 얼굴과 머리카락 · 이불 아래 몸. 밑은 장난감이 숨는 자리 */
function bedMom(W: number, H: number): PropSprite {
  const fh = 12;
  const p = new Pix(W, H + fh);
  const wood = hex('#8a5a3c');
  const sheet = hex('#e8e2d4');
  const quilt = hex('#9a9ab8');
  block3(p, 1, 8, W - 2, H - 8, fh, shade(wood, -0.1), 3, sheet);
  // 베개 · 엄마 (옆으로 누워 문 쪽을 본다)
  p.oval(W / 2 - 8, 22, 16, 5, hex('#f0ece4'));
  p.oval(W / 2 - 12, 20, 7, 6, hex('#3a2a28'));
  p.oval(W / 2 - 13, 22, 4, 4, hex('#f2c8a0'));
  p.set(W / 2 - 15, 22, hex('#3a2a28'));
  // 이불 · 몸의 굴곡 (숨 쉬듯 낮게)
  const qy = 26;
  p.rect(2, qy, W - 5, H - qy, quilt);
  p.rect(2, qy, W - 5, 2, shade(quilt, 0.22));
  p.oval(W / 2 - 4, qy + 22, 18, 12, shade(quilt, 0.08));
  p.oval(W / 2 - 6, qy + 16, 12, 6, shade(quilt, 0.15));
  for (let y = qy + 8; y < H - 1; y += 9) p.rect(3, y, W - 7, 1, shade(quilt, -0.1));
  // 이불 밖으로 나온 손
  p.oval(W / 2 + 6, qy + 4, 3, 2, hex('#f2c8a0'));
  p.rect(2, H, W - 5, 6, shade(quilt, -0.14));
  p.rect(2, H, W - 5, 1, shade(quilt, 0.12));
  block3(p, 0, 0, W, 3, 11, wood, 3);
  p.rect(W - 4, 3, 3, H + fh - 4, shade(wood, -0.42));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -(H + fh) };
}

/**
 * 장난감이 올라서는 가구 윗면 (납작한 데칼, 높은 층 ^ 칸 위에 깔린다): cloth 식탁보 · wood 화장대 나무 · marble 세면대.
 * 위에 놓인 물건 · 순서 발판이 가려지지 않게 바닥에 구워 넣는다. 앞면은 surfaceFront (단 앞면 S 줄).
 */
function surfaceTop(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const cloth = opt.includes('cloth');
  const c = cloth ? hex('#e8d8d8') : opt.includes('marble') ? hex('#dfe4e8') : hex('#d8b890');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let k = 0;
    if (cloth) k = (Math.floor(x / 6) + Math.floor(y / 6)) % 2 ? 0.05 : -0.02;
    else if (opt.includes('marble')) k = ((x * 7 + y * 13) % 29 === 0 ? -0.12 : 0) + (y % 24 < 2 ? 0.06 : 0);
    else k = (y % 6 === 0 ? -0.06 : 0) + ((x + y * 3) % 17 === 0 ? -0.08 : 0);
    p.set(x, y, shade(c, k));
  }
  // 둘레 (앞 가장자리 밝은 선 · 뒤 그늘)
  p.rect(0, 0, W, 2, shade(c, -0.22));
  p.rect(0, H - 2, W, 1, shade(c, 0.22));
  p.rect(0, 0, 2, H, shade(c, -0.1));
  p.rect(W - 2, 0, 2, H, shade(c, -0.25));
  if (cloth) for (let x = 2; x < W - 2; x += 4) p.set(x, H - 1, hex('#f4ecec'));
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 윗면 아래 앞면 (단 앞면 S 줄, w×1): cloth 늘어진 식탁보 · 다리, vanity 화장대 서랍, chest 3단 서랍 (stairs 면 계단처럼), sink 세면대 문짝 */
function surfaceFront(W: number, opt: string): PropSprite {
  const Ht = 26;
  const p = new Pix(W, Ht);
  if (opt.includes('cloth')) {
    const c = hex('#e0c8c8');
    p.rect(0, 0, W, 10, c);
    p.rect(0, 0, W, 1, shade(c, 0.2));
    for (let x = 0; x < W; x += 3) p.set(x, 10, shade(c, -0.1));
    for (let x = 3; x < W - 3; x += 7) p.rect(x, 2, 1, 8, shade(c, -0.08));
    // 다리
    p.rect(4, 10, 3, Ht - 11, shade(WOOD, -0.1));
    p.rect(W - 8, 10, 3, Ht - 11, shade(WOOD, -0.25));
  } else {
    const c = opt.includes('sink') ? hex('#c8d0d8') : opt.includes('chest') ? hex('#a87850') : hex('#e8d8c0');
    block3(p, 0, 0, W, 2, Ht - 2, c, 3);
    const n = opt.includes('chest') ? 3 : Math.max(1, Math.floor(W / 24));
    const stairs = opt.includes('stairs');
    if (opt.includes('chest')) {
      for (let i = 0; i < 3; i++) {
        const y = 3 + i * 7;
        const ext = stairs ? 1 + (2 - i) * 2 : 0;
        p.rect(2, y, W - 8, 6, shade(c, 0.1));
        if (ext) {
          p.rect(1, y + 6, W - 6, ext, shade(c, -0.4));
          p.rect(1, y + 6, W - 6, 1, shade(c, 0.25));
        }
        knob(p, W / 2 - 4, y + 2, 5);
      }
    } else {
      const dw = Math.floor((W - 3) / n);
      for (let i = 0; i < n; i++) {
        p.rect(2 + i * dw, 4, dw - 3, Ht - 8, shade(c, 0.07));
        p.rect(2 + i * dw, 4, dw - 3, 1, shade(c, 0.22));
        knob(p, 2 + i * dw + dw / 2 - 3, 9, 4);
      }
    }
  }
  p.outline(INK);
  return { pix: p, ox: 0, oy: -Ht };
}

/** 화장대 거울 (뒷벽에 붙은 둥근 거울 · 귀퉁이에 꽂힌 주차권과 사진) */
function vanityMirror(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const cx = W / 2;
  const cy = H / 2 + 4;
  p.oval(cx, cy, W / 2 - 10, H / 2 - 4, shade(WOOD, 0.15));
  p.oval(cx, cy, W / 2 - 14, H / 2 - 8, hex('#7a8ab0'));
  p.oval(cx - 8, cy - 8, 6, 9, hex('#a0b0d0'));
  p.line(cx + 6, cy - 14, cx + 14, cy - 4, hex('#c0cce0'));
  p.rect(cx + W / 2 - 22, cy + 6, 6, 8, hex('#f0e8c8'));
  p.rect(cx - W / 2 + 14, cy - 12, 7, 9, hex('#f6efdf'));
  p.rect(cx - W / 2 + 15, cy - 11, 5, 5, hex('#c8a080'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -H, wall: true };
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
