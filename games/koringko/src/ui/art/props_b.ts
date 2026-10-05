/**
 * 갈래 B 소품 (복도 · 할머니 방 · 이불장 · 거실): 사람 크기 방(24px 칸), 3면 규칙 · 순검정/순흰색 없음.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 *  - sheet      흰 천 덮개 (opt tall · mid · low). 상태 off = 걷혀서 발치에 구겨진 천 (대본 @prop sheet@x,y off)
 *  - quilts     개어 쌓은 이불 더미 (opt 단 수 2~4 · pouch: 귀퉁이에 꿰맨 작은 주머니)
 *  - dustRing   먼지 위 동그란 빈 자국 (opt four: 네 개) — 바닥 데칼
 *  - flashlight 배터리 뺀 낡은 손전등
 *  - glowStar   야광 별 스티커 (opt many: 여럿) — 바닥 · 벽 데칼
 *  - fogPane    김 서린 유리 조각에 손가락 글씨
 *  - cordKnot   꼬인 전화선 매듭 (opt over: 위로 넘기 · under: 밑으로) — 바닥 데칼
 *  - phoneCord  바닥을 가로지르는 꼬불꼬불 전화선 (opt v: 세로) — 바닥 데칼
 *  - visitorPass 병원 면회증 목걸이
 *  - tickets    고무줄로 묶은 색종이 표 열 장
 */
import type { PropSprite } from './houseProps.ts';
import { Pix, hash2, hex, shade, type Color } from './paint.ts';
import { PERSON_SPRITE_H } from './sizes.ts';

const HT = 24;
const INK = hex('#2a1c24');
const CLOTH = hex('#e6dece');
const WOOD = hex('#8a5432');

/** 갈래 B 소품 이름 · 기본 칸 크기 (PROP_KINDS 에 덧붙인다) */
export const PROPS_B: Record<string, { w: number; h: number }> = {
  sheet: { w: 2, h: 1 },
  quilts: { w: 2, h: 1 },
  dustRing: { w: 1, h: 1 },
  flashlight: { w: 1, h: 1 },
  glowStar: { w: 1, h: 1 },
  fogPane: { w: 1, h: 1 },
  cordKnot: { w: 1, h: 1 },
  phoneCord: { w: 1, h: 1 },
  visitorPass: { w: 1, h: 1 },
  tickets: { w: 1, h: 1 },
};

/** 사람 키보다 높은 윗줄을 top 으로 (없어도 빈 top 을 두어 상태 그림이 원래 윗부분을 덮게) */
function stand(pix: Pix, keepTop: boolean): PropSprite {
  const s: PropSprite = { pix, ox: 0, oy: -pix.h };
  const split = pix.h - PERSON_SPRITE_H;
  if (split >= 6) {
    const top = new Pix(pix.w, split);
    if (keepTop) for (let y = 0; y < split; y++) for (let x = 0; x < pix.w; x++) top.set(x, y, pix.get(x, y));
    s.top = top;
    s.topSplitY = split;
  }
  return s;
}
const flat = (pix: Pix): PropSprite => ({ pix, ox: 0, oy: -pix.h, wall: true });

/** 흰 천: 덮인 가구 모양대로 늘어진 천 (높이 tall 76 · mid 34 · low 28), off 면 발치에 구겨진 천만 */
function sheet(W: number, opt: string): PropSprite {
  const Ht = opt.includes('tall') ? 80 : opt.includes('mid') ? 36 : 30;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  if (opt.includes('off')) {
    // 걷힌 천: 왼쪽 발치에 뭉친 주름 더미 + 바닥에 늘어진 자락
    p.oval(10, g - 4, 9, 4, shade(CLOTH, -0.12));
    p.oval(9, g - 5, 7, 3, CLOTH);
    p.oval(6, g - 7, 4, 2, shade(CLOTH, 0.1));
    for (let x = 14; x < Math.min(W - 2, 30); x++) p.set(x, g - 1 - (x % 3 === 0 ? 1 : 0), shade(CLOTH, -0.08));
    p.line(5, g - 4, 13, g - 6, shade(CLOTH, -0.22));
    p.outline(INK);
    return stand(p, false);
  }
  // 덮인 몸통: 둥근 어깨 · 늘어진 옆 · 바닥에 닿는 들쭉날쭉한 단
  const top = opt.includes('tall') ? 4 : 6;
  p.oval(W / 2, top + 6, W / 2 - 3, 6, shade(CLOTH, 0.12));
  p.rect(2, top + 6, W - 4, g - top - 8, CLOTH);
  // 오른쪽 옆면 그늘 · 윗면 밝음
  p.rect(W - 7, top + 6, 4, g - top - 8, shade(CLOTH, -0.2));
  p.rect(4, top + 3, W - 12, 2, shade(CLOTH, 0.2));
  // 세로 주름
  for (let x = 6; x < W - 9; x += 6 + (x % 4)) {
    const k = Math.round(hash2(x, Ht, 3) * 4);
    p.rect(x, top + 10 + k, 1, g - top - 14 - k, shade(CLOTH, -0.12));
    p.rect(x + 1, top + 10 + k, 1, g - top - 14 - k, shade(CLOTH, 0.08));
  }
  // 단: 바닥에 끌리는 물결
  for (let x = 1; x < W - 1; x++) {
    const d = Math.round(Math.sin(x * 0.55) * 1.4);
    p.rect(x, g - 3 + d, 1, 3 - d, shade(CLOTH, -0.18));
  }
  // 먼지 몇 점
  for (let i = 0; i < 10; i++) p.set(4 + hash2(i, W, 7) * (W - 10), top + 2 + hash2(i, 2, 9) * 10, shade(CLOTH, -0.28));
  p.outline(INK);
  return stand(p, true);
}

/** 개어 쌓은 이불: 단마다 색이 다르고 앞면에 접힌 결 */
function quilts(W: number, opt: string): PropSprite {
  const n = Math.max(1, Math.min(5, Number(opt.match(/\d/)?.[0] ?? (W > HT ? 3 : 2))));
  const cols = [hex('#d88a9a'), hex('#8ab0c8'), hex('#e8d08a'), hex('#a8c890'), hex('#c8a0d0')];
  const th = 7;
  const Ht = n * th + 6;
  const p = new Pix(W, Ht);
  let y = Ht - 1;
  for (let i = 0; i < n; i++) {
    const c = cols[(i + W) % cols.length];
    const inset = i % 2;
    y -= th;
    p.rect(1 + inset, y, W - 3 - inset, th, c);
    p.rect(1 + inset, y, W - 3 - inset, 1, shade(c, 0.25));
    p.rect(1 + inset, y + th - 1, W - 3 - inset, 1, shade(c, -0.3));
    p.rect(W - 5, y + 1, 3, th - 1, shade(c, -0.25));
    // 꽃무늬 점 · 접힌 결
    for (let x = 4 + inset; x < W - 7; x += 5) p.set(x, y + 3, shade(c, i % 2 ? 0.3 : -0.2));
    p.rect(3 + inset, y + th - 3, 2, 1, shade(c, -0.15));
  }
  // 맨 위 윗면
  p.rect(2, y - 4, W - 6, 4, shade(cols[(n - 1 + W) % cols.length], 0.18));
  if (opt.includes('pouch')) {
    // 귀퉁이에 꿰맨 작은 주머니 (빨간 땀)
    const px = W - 13;
    p.rect(px, Ht - 13, 8, 7, hex('#f0e0c0'));
    p.rect(px, Ht - 13, 8, 1, shade(hex('#f0e0c0'), 0.2));
    for (let i = 0; i < 8; i += 2) p.set(px + i, Ht - 7, hex('#c8483c'));
    p.set(px + 3, Ht - 11, hex('#c8483c'));
  }
  p.outline(INK);
  return stand(p, true);
}

/** 먼지 위의 빈 자국: 둘레만 뽀얗고 가운데는 깨끗한 원 */
function dustRing(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const dust = hex('#cfc4b4');
  const rings: [number, number][] = opt.includes('four') ? [[6, 12], [13, 11], [8, 18], [16, 18]] : [[12, 15]];
  const r = opt.includes('four') ? 3 : 6;
  for (let i = 0; i < 70; i++) {
    const x = 1 + Math.floor(hash2(i, 3, W) * (W - 2));
    const y = 7 + Math.floor(hash2(i, 5, H) * (H - 8));
    if (rings.some(([cx, cy]) => Math.hypot(x - cx, (y - cy) * 1.6) < r + 1)) continue;
    p.set(x, y, i % 3 ? dust : shade(dust, 0.12));
  }
  for (const [cx, cy] of rings)
    for (let t = 0; t < 28; t++) {
      const a = (t / 28) * Math.PI * 2;
      p.set(cx + Math.cos(a) * (r + 1), cy + Math.sin(a) * (r + 1) * 0.62, shade(dust, -0.18));
    }
  return flat(p);
}

function flashlight(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const body = hex('#c84a4a');
  const g = H - 4;
  // 누운 손전등: 몸통 · 머리(렌즈) · 고리
  p.rect(5, g - 5, 11, 5, body);
  p.rect(5, g - 5, 11, 1, shade(body, 0.3));
  p.rect(5, g - 1, 11, 1, shade(body, -0.35));
  p.rect(16, g - 7, 4, 8, hex('#b8b8c0'));
  p.rect(19, g - 6, 1, 6, hex('#e8e0b8'));
  p.rect(9, g - 4, 3, 2, hex('#e8c048'));
  p.rect(2, g - 4, 3, 3, shade(body, -0.2));
  p.set(1, g - 3, INK);
  // 열린 건전지 뚜껑
  p.rect(1, g + 1, 4, 2, shade(body, -0.1));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -H };
}

/** 야광 별: 연둣빛 오각 별 (many 면 셋) */
function glowStar(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#c8f088');
  const star = (cx: number, cy: number, r: number) => {
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
      p.line(cx, cy, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), c);
    }
    p.set(cx, cy, shade(c, 0.3));
  };
  if (opt.includes('many')) {
    star(6, 9, 3);
    star(16, 7, 3);
    star(12, 17, 3);
  } else star(12, 14, 5);
  return flat(p);
}

/** 김 서린 유리 조각 (창턱에 기대 놓인 액자 유리): 뽀얀 면에 손가락 글씨 줄 */
function fogPane(W: number, H: number): PropSprite {
  const p = new Pix(W, H + 10);
  const g = H + 9;
  const frame = shade(WOOD, 0.1);
  p.rect(3, 2, W - 6, g - 3, frame);
  p.rect(5, 4, W - 10, g - 7, hex('#b8c8d4'));
  for (let i = 0; i < 30; i++) p.set(5 + hash2(i, 1, 4) * (W - 10), 4 + hash2(i, 3, 6) * (g - 7), hex('#d8e0e8'));
  // 손가락 글씨 (세 줄 낙서 + 하트)
  const ink = hex('#7a8a9a');
  p.line(7, 9, 12, 9, ink);
  p.line(13, 8, 16, 11, ink);
  p.line(7, 14, 15, 14, ink);
  p.set(10, 20, ink);
  p.set(12, 20, ink);
  p.line(9, 21, 11, 23, ink);
  p.line(13, 21, 11, 23, ink);
  p.rect(3, g - 1, W - 6, 1, shade(frame, -0.4));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -p.h };
}

/** 꼬인 전화선 매듭: 동그란 고리 셋 + 위(over) / 아래(under) 표시 화살 */
function cordKnot(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#e8e0c8');
  for (let k = 0; k < 3; k++)
    for (let t = 0; t < 14; t++) {
      const a = (t / 14) * Math.PI * 2;
      p.set(6 + k * 5 + Math.cos(a) * 3, 15 + Math.sin(a) * 2, t % 4 ? c : shade(c, -0.3));
    }
  p.line(1, 15, 3, 15, c);
  p.line(19, 15, 23, 15, c);
  const mark = hex('#e8a048');
  if (opt.includes('over')) {
    p.line(12, 4, 9, 7, mark);
    p.line(12, 4, 15, 7, mark);
    p.line(12, 4, 12, 10, mark);
  } else if (opt.includes('under')) {
    p.line(12, 21, 9, 18, mark);
    p.line(12, 21, 15, 18, mark);
    p.line(12, 15, 12, 21, mark);
  }
  return flat(p);
}

/** 바닥을 가로지르는 꼬불꼬불 전화선 */
function phoneCord(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#ddd4bc');
  const v = opt.includes('v');
  for (let t = 0; t < 24; t++) {
    const w = Math.round(Math.sin(t * 1.3) * 1.5);
    if (v) p.set(12 + w, t, t % 3 ? c : shade(c, -0.25));
    else p.set(t, 16 + w, t % 3 ? c : shade(c, -0.25));
  }
  return flat(p);
}

function visitorPass(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const g = H - 3;
  // 늘어진 목줄 고리 · 카드 (하늘색 띠 · 이름 칸)
  for (let t = 0; t < 18; t++) {
    const a = Math.PI + (t / 17) * Math.PI;
    p.set(12 + Math.cos(a) * 8, g - 8 + Math.sin(a) * 5, hex('#5a8ac8'));
  }
  p.rect(7, g - 9, 10, 9, hex('#f0ece0'));
  p.rect(7, g - 9, 10, 2, hex('#6aa8d8'));
  p.rect(9, g - 5, 6, 1, hex('#7a7068'));
  p.rect(9, g - 3, 4, 1, hex('#7a7068'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -H };
}

function tickets(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const g = H - 3;
  const cols: Color[] = [hex('#e8a0b8'), hex('#a8c8e8'), hex('#f0d888'), hex('#b8e0a8')];
  for (let i = 0; i < 4; i++) {
    const c = cols[i];
    p.rect(4 + i, g - 9 - i * 2, 14, 7, c);
    p.rect(4 + i, g - 9 - i * 2, 14, 1, shade(c, 0.25));
    p.set(6 + i, g - 6 - i * 2, shade(c, -0.35));
  }
  // 고무줄
  p.rect(11, g - 17, 2, 15, hex('#c8483c'));
  p.outline(INK);
  return { pix: p, ox: 0, oy: -H };
}

/** 갈래 B 소품 그림. 모르는 kind 는 null */
export function propsB(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = Math.max(1, w) * HT;
  const H = Math.max(1, h) * HT;
  switch (kind) {
    case 'sheet': return sheet(W, opt);
    case 'quilts': return quilts(W, opt);
    case 'dustRing': return dustRing(W, H, opt);
    case 'flashlight': return flashlight(W, H);
    case 'glowStar': return glowStar(W, H, opt);
    case 'fogPane': return fogPane(W, H);
    case 'cordKnot': return cordKnot(W, H, opt);
    case 'phoneCord': return phoneCord(W, H, opt);
    case 'visitorPass': return visitorPass(W, H);
    case 'tickets': return tickets(W, H);
    default: return null;
  }
}
