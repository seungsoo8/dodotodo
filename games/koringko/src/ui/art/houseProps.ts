/**
 * 다락방 · 책상 위 소품과 주민 그림 (REDESIGN §4 입체감 규칙: 윗면 밝게 · 앞면 중간 · 오른쪽 옆면 가장 어둡게, 높이는 앞면 길이).
 * 가구 그림(house.ts FurnSprite)과 같은 약속: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 * pix 는 그림 전체. top 이 있으면 pix 의 0..topSplitY-1 줄(사람 · 장난감 키보다 높은 부분)을 같은 (ox, oy) 에
 * 인물보다 나중에 한 번 더 그린다. 윗층(beam · cobweb)은 top = pix 전체.
 * 팔레트: 따뜻한 갈색 · 크림 · 바랜 초록. 순검정 · 순흰색은 쓰지 않는다.
 */
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
import { MOVE_KINDS, moveSprite } from './moveProps.ts';
import { PROPS_B, propsB } from './props_b.ts';
import { PERSON_SPRITE_H, TOY_SPRITE_H } from './sizes.ts';
import { drawGlyph, glyph, textH, textV, textVHeight, textWidth, tiny } from './glyphs.ts';

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
  ...Object.fromEntries(Object.entries(PROPS_B).map(([k, d]) => [k, { w: d.w, h: d.h, scale: 'person' as const }])),
};

export const RESIDENT_KINDS = ['tinSoldier', 'paperSisters', 'cuckooElder'] as const;

// ───────────────────────── 팔레트 ─────────────────────────
const INK = hex('#2a1c24');
const WOOD = hex('#a8703c');
const WOOD_D = hex('#7a4e2c');
const OAK = hex('#c08a52');
const CREAM = hex('#f2e6cc');
const PAPER = hex('#f6efdf');
const CARD = hex('#c89a64');
const TAPE = hex('#e2c890');
const SAGE = hex('#8fa47a');
const SAGE_L = hex('#b4c4a0');
const RUST = hex('#b0603a');
const RED = hex('#c8483c');
const NAVY = hex('#3a4670');
const MUSTARD = hex('#d8a840');
const GOLD = hex('#e8c060');
const LAMP = hex('#f8d878');
const NIGHT = hex('#283058');
const MARKER = hex('#3a2c3a');

// ───────────────────────── 붓 ─────────────────────────
/** 가구 상자 붓: 윗줄 밝게 · 아랫줄 · 오른쪽 어둡게 */
function box(p: Pix, x: number, y: number, w: number, h: number, c: Color): void {
  p.rect(x, y, w, h, c);
  p.rect(x, y, w, 1, shade(c, 0.25));
  p.rect(x, y + h - 1, w, 1, shade(c, -0.3));
  p.rect(x + w - 1, y, 1, h, shade(c, -0.18));
}

/**
 * 3면 덩어리: 윗면(깊이 d, 가장 밝음) + 앞면(높이 h) + 오른쪽 옆면(폭 sw, 가장 어두움).
 * 바닥에 닿는 줄은 진한 접지 선.
 */
function block3(p: Pix, x: number, y: number, w: number, d: number, h: number, c: Color, sw = 3, topC?: Color): Faces {
  const fw = w - sw;
  const tc = topC ?? shade(c, 0.18);
  const sc = shade(c, -0.34);
  p.rect(x, y, fw, d, tc);
  p.rect(x, y, fw, 1, shade(tc, 0.3));
  p.rect(x, y + d, fw, h, c);
  p.rect(x, y + d, fw, 1, shade(c, 0.12));
  // 옆면: 윗면 깊이만큼 비스듬히 올라간다
  for (let k = 0; k < sw; k++) p.rect(x + fw + k, y + 1 + k, 1, d + h - 1 - k, sc);
  p.rect(x + fw, y + d + h - 1, sw, 1, shade(sc, -0.2));
  p.rect(x, y + d + h - 1, fw, 1, shade(c, -0.42));
  return { top: [x, y, fw, d], front: [x, y + d, fw, h], side: [x + fw, y + d, sw, h] };
}

/** 나뭇결 (가로) */
function grain(p: Pix, x: number, y: number, w: number, h: number, c: Color, seed: number): void {
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = 0; xx < w; xx++) {
      const v = hash2(Math.floor((x + xx) / 5), y + yy, seed);
      if (v < 0.32) p.set(x + xx, y + yy, shade(c, -0.12));
    }
  }
}

/** 퍼진 종이별 하나 (5×5) */
function star(p: Pix, x: number, y: number, c: Color): void {
  const rows = ['..#..', '.###.', '#####', '.###.', '.#.#.'];
  rows.forEach((r, yy) => {
    for (let xx = 0; xx < 5; xx++) if (r[xx] === '#') p.set(x + xx, y + yy, yy === 1 && xx === 1 ? shade(c, 0.4) : yy >= 3 ? shade(c, -0.18) : c);
  });
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

// ───────────────────────── 다락방 (사람 크기) ─────────────────────────

function atticWall(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 12;
  const p = new Pix(W, Ht);
  const frontH = 36;
  const fy = Ht - frontH;
  // 비스듬한 천장 널: 위로 갈수록 어둡게 (멀어짐), 널 이음매
  for (let y = 0; y < fy - 4; y++) {
    const t = y / Math.max(1, fy - 4);
    const plank = Math.floor((fy - 4 - y) / 6);
    const c = shade(mix(hex('#5e4030'), hex('#8a6040'), t), plank % 2 ? -0.06 : 0);
    p.rect(0, y, W, 1, c);
    if ((fy - 4 - y) % 6 === 0) p.rect(0, y, W, 1, shade(c, -0.25));
  }
  // 서까래: 아래로 내려오며 앞으로 (아래쪽이 조금 넓게)
  for (let x = 10; x < W; x += 30) {
    for (let y = 0; y < fy - 4; y++) {
      const wd = 4 + Math.floor((y / (fy - 4)) * 2);
      const c = mix(hex('#4a3226'), hex('#7a5236'), y / (fy - 4));
      p.rect(x, y, wd, 1, c);
      p.set(x, y, shade(c, 0.18));
      p.set(x + wd, y, shade(c, -0.35));
    }
  }
  // 도리 (앞면 위 굵은 가로 나무)
  p.rect(0, fy - 4, W, 4, hex('#6a4630'));
  p.rect(0, fy - 4, W, 1, hex('#8e6440'));
  p.rect(0, fy - 1, W, 1, hex('#3e2a22'));
  // 앞면: 세로 널빤지 벽
  for (let x = 0; x < W; x++) {
    const board = Math.floor(x / 8);
    const c = shade(hex('#a07450'), (hash2(board, 1, 41) - 0.5) * 0.12);
    p.rect(x, fy, 1, frontH - 5, x % 8 === 0 ? shade(c, -0.28) : x % 8 === 1 ? shade(c, 0.1) : c);
  }
  for (let i = 0; i < Math.floor(W / 16); i++) {
    const kx = Math.floor(hash2(i, 2, 42) * (W - 4)) + 2;
    const ky = fy + 6 + Math.floor(hash2(i, 3, 42) * (frontH - 16));
    p.oval(kx, ky, 1.5, 1, hex('#6e4a30'));
  }
  // 걸레받이 + 벽 아래 그늘
  p.rect(0, Ht - 5, W, 5, hex('#6e4a32'));
  p.rect(0, Ht - 5, W, 1, hex('#9a7048'));
  p.rect(0, fy, W, 2, hex('#5a3c2a'));
  if (opt.includes('window')) {
    // 가운데 둥근 박공 창 (창살 십자 · 달빛)
    const cx = W / 2;
    const cy = fy - 2;
    const r = 15;
    p.oval(cx, cy, r + 3, r + 3, hex('#d8c4a0'));
    p.oval(cx, cy, r + 2, r + 2, hex('#b89a70'));
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const t = (y + r) / (2 * r);
        p.set(cx + x, cy + y, mix(NIGHT, hex('#506090'), t));
      }
    }
    p.oval(cx - 6, cy - 6, 4.5, 4.5, hex('#f4e8c0'));
    p.oval(cx - 4.5, cy - 7, 3.5, 3.5, mix(NIGHT, hex('#506090'), 0.25));
    for (let i = 0; i < 6; i++) p.set(cx - r + 3 + hash2(i, 1, 43) * (2 * r - 6), cy - r + 3 + hash2(i, 2, 43) * r, hex('#e8ecf4'));
    // 나뭇가지 그림자
    p.line(cx + r - 1, cy + 2, cx + 3, cy + 7, hex('#1c2240'));
    p.line(cx + 7, cy + 4, cx + 9, cy + 9, hex('#1c2240'));
    // 창살
    p.rect(cx - r, cy - 1, 2 * r + 1, 2, hex('#c8ac80'));
    p.rect(cx - 1, cy - r, 2, 2 * r + 1, hex('#c8ac80'));
    p.rect(cx - r, cy - 1, 2 * r + 1, 1, hex('#e8d4a8'));
    // 창턱 (앞면에 걸친 받침)
    box(p, cx - r - 4, cy + r + 2, 2 * r + 9, 3, hex('#c8a878'));
  }
  return { pix: p, ox: 0, oy: -Ht, wall: true };
}

/** 들보: 사람 머리 위 높이에 떠 있는 얇은 각목 (몸통 10px) + 바닥에 옅은 그림자. 장난감이 밑을 지나면 render 가 비친다 */
function beam(W: number): PropSprite {
  const body = 10;
  const p = new Pix(W, body + 13);
  const c = hex('#5e3c28');
  // 윗면 (달빛을 받아 밝게) · 앞면 · 아랫모서리 (바닥보다 짙은 각목이라 떠 보이게)
  p.rect(0, 0, W, 3, shade(c, 0.4));
  p.rect(0, 0, W, 1, shade(c, 0.62));
  p.rect(0, 3, W, 6, c);
  p.rect(0, 3, W, 1, shade(c, -0.22));
  grain(p, 0, 4, W, 5, c, 51);
  p.rect(0, body - 1, W, 1, shade(c, -0.55));
  // 못 · 갈라진 금
  for (let x = 14; x < W - 6; x += 38) {
    p.set(x, 5, hex('#a8a8b0'));
    p.set(x + 1, 6, hex('#5a5a62'));
    p.rect(x + 12, 6, 9, 1, shade(c, -0.35));
  }
  // 거미줄 가닥 (오른쪽 끝, 아래로 처짐)
  const web = hex('#d4cec4');
  const wx = W - 4;
  for (let i = 0; i < 4; i++) p.line(wx, body, wx - 4 - i * 4, body + 9 - i * 2, web);
  for (let k = 1; k < 4; k++) for (let i = 0; i < 3; i++) p.set(wx - 2 - i * 4 - k, body + k * 2 + i, web);
  p.rect(wx - 9, body + 8, 1, 4, web);
  p.set(wx - 9, body + 12, hex('#4a3a3a'));
  // 바닥 그림자: 들보 바로 아래 칸에 옅은 띠 (가장자리는 더 옅게)
  const g = new Pix(W, 9);
  for (let y = 0; y < 9; y++) g.rect(0, y, W, 1, [50, 100, 150, 170, 170, 170, 150, 100, 50][y]);
  return { ...over(p, 0, -(54 + body)), ground: { pix: g, ox: 0, oy: -HT + 4 } };
}

function trapdoor(W: number, H: number, opt: string): PropSprite {
  const open = opt.includes('open');
  const lift = open ? 30 : 0;
  const p = new Pix(W, H + lift);
  const y0 = lift;
  const frame = hex('#5a3c28');
  p.rect(1, y0 + 2, W - 2, H - 4, frame);
  p.rect(1, y0 + 2, W - 2, 1, shade(frame, 0.25));
  if (!open) {
    for (let x = 4; x < W - 4; x++) {
      const pl = Math.floor((x - 4) / 10);
      const c = shade(hex('#9a6c44'), pl % 2 ? -0.06 : 0.02);
      p.rect(x, y0 + 5, 1, H - 10, (x - 4) % 10 === 0 ? shade(c, -0.25) : c);
    }
    grain(p, 4, y0 + 7, W - 8, H - 14, hex('#9a6c44'), 61);
    // 경첩 · 손잡이 고리
    p.rect(8, y0 + 6, 7, 3, hex('#4a4a52'));
    p.rect(W - 15, y0 + 6, 7, 3, hex('#4a4a52'));
    p.oval(W / 2, H - 11 + y0, 3, 2.5, hex('#5a5a62'));
    p.oval(W / 2, H - 11 + y0, 1.5, 1.2, hex('#9a6c44'));
    // 틈으로 새는 노란 빛
    p.rect(4, y0 + H - 6, W - 8, 1, LAMP);
    p.rect(W - 5, y0 + 6, 1, H - 12, shade(LAMP, -0.15));
  } else {
    // 구멍: 맞은편 안벽 (아래층 빛을 받아 아래로 갈수록 노랗다)
    for (let y = y0 + 5; y < y0 + H - 5; y++) {
      const t = (y - y0 - 5) / (H - 10);
      p.rect(4, y, W - 8, 1, mix(hex('#2a1e1c'), hex('#e8b860'), t * t));
    }
    // 사다리 끝
    const lx = W / 2 - 9;
    p.rect(lx, y0 - 4, 3, H - 4, hex('#b08050'));
    p.rect(lx + 15, y0 - 4, 3, H - 4, hex('#8a6038'));
    p.rect(lx, y0 - 4, 1, H - 4, hex('#d0a070'));
    for (let y = y0 + 4; y < y0 + H - 6; y += 7) p.rect(lx + 3, y, 12, 2, hex('#a07448'));
    // 세워 둔 뚜껑문 (밑면이 보인다)
    for (let x = 4; x < W - 4; x++) {
      const c = shade(hex('#7a5436'), ((x - 4) % 10 === 0 ? -0.22 : 0));
      p.rect(x, 2, 1, lift + 1, c);
    }
    p.rect(4, 2, W - 8, 1, hex('#a07850'));
    p.rect(4, lift / 2, W - 8, 3, hex('#6a462c'));
    p.rect(W - 6, 2, 2, lift + 1, hex('#4e3424'));
    // 빛이 위로 번짐
    p.rect(4, y0 + 3, W - 8, 2, shade(LAMP, -0.1));
  }
  p.outline();
  return { pix: p, ox: 0, oy: -(H + lift) };
}

function cuckoo(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const body = hex('#6e4630');
  const cx = Math.floor(W / 2);
  // 사슬 · 솔방울 추
  p.rect(cx - 5, 28, 1, H - 36, hex('#a89060'));
  p.rect(cx + 4, 28, 1, H - 32, hex('#a89060'));
  p.oval(cx - 5, H - 6, 2.5, 4, hex('#7a5a30'));
  p.oval(cx + 4, H - 3, 2.5, 3, hex('#7a5a30'));
  for (const [x, y] of [[cx - 5, H - 8], [cx - 5, H - 5], [cx + 4, H - 4]]) p.set(x, y, hex('#a88050'));
  // 시계추 (live: render 가 흔들며 그린다)
  const live = /\blive\b/.test(opt);
  if (!live) {
    p.rect(cx, 28, 1, 10, hex('#8a7040'));
    p.oval(cx, 39, 2.5, 2.5, GOLD);
  }
  // 몸통
  box(p, cx - 8, 10, 17, 19, body);
  grain(p, cx - 7, 12, 15, 15, body, 71);
  // 지붕 (나뭇잎 조각)
  p.tri(cx - 12, 12, cx + 12, 12, cx, 1, hex('#5a3a28'));
  p.tri(cx - 10, 11, cx + 10, 11, cx, 3, hex('#7a5038'));
  for (let i = -2; i <= 2; i++) p.oval(cx + i * 5, 12, 2.5, 1.6, shade(SAGE, -0.12));
  p.oval(cx, 1, 2, 1.5, SAGE);
  // 작은 문
  if (opt.includes('bird')) {
    // 문이 활짝 (문짝은 왼쪽으로 젖혀짐), 안은 깜깜
    p.rect(cx - 3, 12, 6, 6, hex('#2e1e1a'));
    p.rect(cx - 7, 11, 3, 7, hex('#9a6a44'));
    p.rect(cx - 7, 11, 1, 7, hex('#c08a58'));
    // 뻐꾸기: 막대를 타고 문 밖으로 튀어나와 날개를 펴고 입을 벌림
    p.rect(cx, 15, 1, 4, hex('#c8a060'));
    p.ball(cx + 1, 12, 5, 4, hex('#c89058'), true);
    p.oval(cx - 1, 9, 3.5, 3, hex('#d8a468'));
    p.set(cx - 2, 8, INK);
    p.set(cx - 1, 8, hex('#f4ecdc'));
    p.tri(cx + 2, 8, cx + 8, 6, cx + 2, 11, hex('#e8984a'));
    p.tri(cx + 2, 10, cx + 7, 11, cx + 2, 12, hex('#c8683a'));
    p.set(cx + 3, 10, hex('#8a3a2a'));
    // 날개 (위로 펼침) · 꼬리
    p.tri(cx - 2, 12, cx - 9, 6, cx + 1, 10, hex('#a06a3a'));
    p.tri(cx + 3, 12, cx + 10, 8, cx + 5, 14, hex('#a06a3a'));
    p.rect(cx - 3, 15, 3, 1, hex('#8a5a30'));
    // 울음 자국 (짧은 소리 줄)
    p.set(cx + 10, 4, hex('#f4ecdc'));
    p.set(cx + 11, 2, hex('#f4ecdc'));
  } else {
    box(p, cx - 3, 12, 6, 6, hex('#9a6a44'));
    p.set(cx + 1, 15, GOLD);
  }
  // 시계판
  p.oval(cx, 23, 5.5, 4.5, hex('#e8dcc0'));
  for (const [dx, dy] of [[0, -3], [4, 0], [0, 3], [-4, 0]]) p.set(cx + dx, 23 + dy, INK);
  if (!live) {
    p.line(cx, 23, cx - 2, 21, INK);
    p.line(cx, 23, cx + 3, 23, INK);
  }
  p.outline();
  return { pix: p, ox: 0, oy: -H, wall: true };
}

function xmasbox(W: number, H: number): PropSprite {
  const Ht = H + 10;
  const p = new Pix(W, Ht);
  const x0 = 3;
  const bw = W - 7;
  const d = 10;
  const fh = 16;
  const y0 = Ht - d - fh - 1;
  const faces = block3(p, x0, y0, bw, d, fh, hex('#b8865a'), 4);
  // 열린 상자 속: 안쪽 그늘 + 장식 공
  p.rect(x0 + 2, y0 + 1, bw - 8, d - 2, hex('#6a4a34'));
  const balls = [hex('#c84a44'), hex('#7a9a5a'), GOLD, hex('#5a7ab0'), hex('#c84a44')];
  balls.forEach((c, i) => p.ball(x0 + 6 + i * 8, y0 + 3 + (i % 2), 3.5, 3.5, c));
  // 뚜껑 날개 (앞뒤로 젖혀짐)
  p.rect(x0 - 1, y0 - 3, bw - 2, 3, shade(hex('#b8865a'), 0.25));
  // 반짝이 줄: 상자 밖으로 흘러 바닥까지
  const tin = [hex('#e8c860'), hex('#f4e4a0'), hex('#c8a040')];
  let tx = x0 + bw - 14;
  for (let y = y0 + 2; y < Ht - 1; y++) {
    tx += Math.round(Math.sin(y * 0.7) * 1.2);
    p.set(tx, y, tin[y % 3]);
    p.set(tx + 1, y, tin[(y + 1) % 3]);
  }
  for (let x = tx - 6; x < tx + 8; x++) p.set(x, Ht - 2 - (x % 2), tin[x % 3]);
  // 글씨 쪽지 (리본 그림)
  box(p, x0 + 5, y0 + d + 4, 14, 8, PAPER);
  p.rect(x0 + 11, y0 + d + 4, 2, 8, hex('#c84a44'));
  p.rect(x0 + 5, y0 + d + 7, 14, 2, hex('#c84a44'));
  p.outline();
  return out(p, 0, -Ht, 'person', { faces: { ...faces, top: [x0 - 1, y0 - 3, bw - 2, 3] } });
}


function honeycandy(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const cx = W / 2;
  const cy = H - 6;
  const amber = hex('#e8a838');
  // 비틀린 양 끝
  p.tri(cx - 4, cy, cx - 8, cy - 3, cx - 8, cy + 3, hex('#f4d890'));
  p.tri(cx + 4, cy, cx + 8, cy - 3, cx + 8, cy + 3, hex('#e8c878'));
  p.ball(cx, cy, 4.5, 3.5, amber);
  p.set(cx - 2, cy - 2, hex('#fcecc0'));
  p.set(cx + 1, cy + 2, shade(amber, -0.3));
  p.outline();
  return { pix: p, ox: 0, oy: -H };
}

function fan(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 26;
  const p = new Pix(W, Ht);
  const body = SAGE_L;
  // 받침: 3면 (앞면에 피아노 단추)
  const by = Ht - 12;
  const faces = block3(p, 2, by, W - 4, 4, 7, body, 3);
  const keys = [hex('#e8dcc0'), hex('#e8dcc0'), hex('#d0846a'), hex('#e8dcc0')];
  keys.forEach((c, i) => p.rect(4 + i * 4, by + 6 + (i === 2 ? 1 : 0), 3, 3, c));
  // 목
  p.bar(W / 2 - 1, 18, 3, by - 17, hex('#c8c8b8'));
  // 모터 · 망
  const cx = W / 2;
  const cy = 12;
  p.oval(cx, cy, 11, 11, hex('#d8dcc8'));
  p.oval(cx, cy, 9, 9, hex('#7a8a80'));
  // 날개 (바람에 아주 조금 돎)
  const a0 = opt.includes('spin') ? 0.5 : 0;
  for (let k = 0; k < 3; k++) {
    const a = a0 + (k * Math.PI * 2) / 3;
    const bx = cx + Math.cos(a) * 5;
    const byy = cy + Math.sin(a) * 5;
    p.oval(bx, byy, 4, 3, hex('#a8c8c0'));
    p.set(bx - 1, byy - 1, hex('#d4ece4'));
  }
  // 망 살
  for (let r = 4; r <= 10; r += 3) {
    for (let t = 0; t < 40; t++) {
      const a = (t / 40) * Math.PI * 2;
      p.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, hex('#e4e6dc'));
    }
  }
  p.line(cx - 10, cy, cx + 10, cy, hex('#e4e6dc'));
  p.line(cx, cy - 10, cx, cy + 10, hex('#e4e6dc'));
  p.oval(cx, cy, 2.5, 2.5, hex('#c84a44'));
  p.set(cx - 1, cy - 1, hex('#e8907a'));
  p.outline();
  return out(p, 0, -Ht, 'person', { faces });
}

function tricycle(W: number, H: number): PropSprite {
  const Ht = H + 10;
  const p = new Pix(W, Ht);
  const red = hex('#b84a3a');
  const rust = RUST;
  const tire = hex('#3a3236');
  const g = Ht - 1;
  // 뒷바퀴 (먼 쪽 · 가까운 쪽)
  p.oval(W - 12, g - 6, 6, 6, shade(tire, 0.1));
  p.oval(W - 12, g - 6, 3.5, 3.5, hex('#8a8a8a'));
  // 앞 큰 바퀴
  p.oval(12, g - 9, 9, 9, tire);
  p.oval(12, g - 9, 6, 6, hex('#a0a0a0'));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI;
    p.line(12 - Math.cos(a) * 6, g - 9 - Math.sin(a) * 6, 12 + Math.cos(a) * 6, g - 9 + Math.sin(a) * 6, hex('#c8c8c0'));
  }
  p.oval(12, g - 9, 1.5, 1.5, red);
  // 몸통
  p.line(12, g - 9, 18, g - 26, red);
  p.line(13, g - 9, 19, g - 26, red);
  p.line(18, g - 18, W - 12, g - 8, red);
  p.line(18, g - 17, W - 12, g - 7, shade(red, -0.2));
  p.rect(W - 18, g - 9, 12, 3, shade(red, -0.1));
  // 녹
  for (let i = 0; i < 8; i++) p.set(18 + hash2(i, 1, 81) * (W - 30), g - 17 + hash2(i, 2, 81) * 10, rust);
  p.set(16, g - 20, rust);
  // 안장 · 손잡이 (바랜 술)
  p.rect(W - 22, g - 14, 9, 3, hex('#5a4038'));
  p.rect(W - 22, g - 14, 9, 1, hex('#7a5a50'));
  p.rect(14, g - 27, 10, 2, hex('#c8c0b0'));
  p.rect(12, g - 27, 3, 2, hex('#e8c8a0'));
  p.rect(12, g - 25, 1, 4, hex('#e0a090'));
  p.rect(14, g - 25, 1, 3, hex('#d8d098'));
  // 페달
  p.rect(9, g - 9, 6, 1, hex('#5a5a5a'));
  p.outline();
  return out(p, 0, -Ht, 'person');
}

function mat(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const straw = hex('#d4ba84');
  const y = H - 15;
  // 둘둘 만 원통 (가로로 누움)
  for (let yy = 0; yy < 13; yy++) {
    const t = yy / 12;
    const c = t < 0.25 ? shade(straw, 0.2) : t < 0.7 ? straw : shade(straw, -0.22);
    p.rect(4, y + yy, W - 12, 1, c);
  }
  for (let x = 6; x < W - 10; x += 3) for (let yy = 1; yy < 12; yy += 2) p.set(x + (yy % 4 === 1 ? 1 : 0), y + yy, shade(straw, -0.12));
  // 테두리 천 (바랜 초록)
  p.rect(4, y, 3, 13, SAGE);
  // 끝 단면: 소용돌이
  const ex = W - 8;
  p.oval(ex, y + 6.5, 4.5, 6.5, shade(straw, -0.08));
  for (let r = 1; r <= 4; r += 1.5) {
    for (let t = 0; t < 20; t++) {
      const a = (t / 20) * Math.PI * 2;
      p.set(ex + Math.cos(a) * r * 0.7, y + 6.5 + Math.sin(a) * r * 1.3, shade(straw, -0.3));
    }
  }
  // 끈 두 줄
  for (const bx of [14, W - 22]) {
    p.rect(bx, y - 1, 2, 15, hex('#c84a44'));
    p.set(bx, y - 1, hex('#e07a6a'));
  }
  p.outline();
  return out(p, 0, -H, 'person', { faces: { top: [6, y, W - 14, 3], front: [6, y + 4, W - 14, 5], side: [6, y + 10, W - 14, 3] } });
}

function dresserCloth(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const p = new Pix(W, Ht);
  const cloth = hex('#e6dece');
  const g = Ht - 1;
  // 다리 (천 아래로 삐죽)
  p.rect(5, g - 4, 3, 4, WOOD_D);
  p.rect(W - 9, g - 4, 3, 4, WOOD_D);
  // 거울 덮인 혹 (위)
  p.ball(W / 2, 16, W / 2 - 10, 14, cloth, true);
  // 몸통 3면 (천으로 덮인)
  const faces = block3(p, 2, 22, W - 4, 8, g - 4 - 30, cloth, 4, shade(cloth, 0.12));
  // 천 주름 (세로)
  for (let x = 6; x < W - 8; x += 7) {
    p.rect(x, 31, 1, g - 36, shade(cloth, -0.1));
    p.rect(x + 1, 31, 1, g - 36, shade(cloth, 0.08));
  }
  for (let x = 12; x < W - 14; x += 9) p.line(x, 4, x + 2, 26, shade(cloth, -0.08));
  // 들쭉날쭉 단
  for (let x = 2; x < W - 4; x++) {
    const d = Math.round(Math.sin(x * 0.6) * 1.2);
    p.rect(x, g - 5, 1, 1 + d, shade(cloth, -0.2));
  }
  if (opt.includes('frame')) {
    // 엎어 놓은 빈 액자 (뒤판이 보임)
    box(p, W / 2 - 8, 23, 15, 5, hex('#8a5a3a'));
    p.rect(W / 2 - 1, 22, 1, 2, hex('#5a3a28'));
  }
  p.outline();
  return out(p, 0, -Ht, 'person', { faces });
}

function bookbundle(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  const cols = [hex('#c86a5a'), hex('#6a8ab0'), MUSTARD, SAGE];
  let y = Ht - 1;
  let faces: Faces | null = null;
  cols.forEach((c, i) => {
    const bw = W - 6 - (i % 2) * 2;
    const x = 2 + (i % 2);
    const th = 5;
    y -= th;
    // 표지 앞면 + 종이 결
    p.rect(x, y, bw - 3, th, c);
    // 책등이 앞을 본다: 제목 띠 · 금줄
    p.rect(x + 4, y + 2, bw - 12, 1, shade(c, 0.3));
    p.set(x + 1, y + 1, GOLD);
    p.set(x + bw - 5, y + 1, GOLD);
    p.rect(x + bw - 3, y, 3, th, shade(c, -0.34));
    p.rect(x, y + th - 1, bw - 3, 1, shade(c, -0.3));
    if (i === cols.length - 1) {
      // 맨 위 표지 (윗면)
      p.rect(x, y - 8, bw - 3, 8, shade(c, 0.18));
      p.rect(x, y - 8, bw - 3, 1, shade(c, 0.45));
      for (let k = 0; k < 3; k++) p.rect(x + bw - 3 + k, y - 7 + k, 1, 8 - k, shade(c, -0.34));
      p.oval(x + 7, y - 4, 2.5, 2, hex('#f0d880'));
      faces = { top: [x, y - 8, bw - 3, 8], front: [x, y, bw - 3, Ht - 1 - y], side: [x + bw - 3, y, 3, Ht - 1 - y] };
      y -= 8;
    }
  });
  // 끈 (열십자)
  const tw = hex('#c8b088');
  p.rect(W / 2 - 1, y, 1, Ht - y - 1, tw);
  p.rect(2, y + 3, W - 7, 1, tw);
  p.rect(W / 2 - 3, y + 2, 5, 3, shade(tw, 0.1));
  p.outline();
  return out(p, 0, -Ht, 'person', { faces: faces! });
}

function umbrellaStand(W: number, H: number): PropSprite {
  const Ht = H + 22;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  // 우산들 (뒤에서 위로 솟음)
  p.rect(7, 4, 2, 30, hex('#3a4a70'));
  p.tri(5, 30, 11, 30, 8, 10, hex('#4a5a84'));
  p.line(8, 4, 5, 1, hex('#8a6a4a'));
  p.line(5, 1, 3, 4, hex('#8a6a4a'));
  p.rect(14, 8, 2, 26, hex('#9a4a44'));
  p.tri(12, 32, 18, 32, 15, 12, hex('#b85a50'));
  for (let y = 16; y < 30; y += 4) p.rect(13, y, 4, 1, hex('#e0c8a0'));
  p.oval(15, 7, 2.5, 2, hex('#6a4a34'));
  // 통 (바랜 초록 도자기)
  const pot = SAGE;
  for (let y = 22; y <= g - 1; y++) p.bar(3, y, W - 6, 1, pot);
  p.oval(W / 2, 22, W / 2 - 3, 3, shade(pot, 0.2));
  p.oval(W / 2, 22, W / 2 - 5, 2, shade(pot, -0.5));
  p.rect(3, 28, W - 6, 2, shade(pot, -0.15));
  p.rect(3, g - 7, W - 6, 2, shade(pot, -0.15));
  p.rect(3, g - 1, W - 6, 1, shade(pot, -0.45));
  p.outline();
  return out(p, 0, -Ht, 'person');
}

function sewbox(W: number, H: number, opt: string): PropSprite {
  const Ht = H;
  const p = new Pix(W, Ht);
  const wood = hex('#8a5a3c');
  const y0 = Ht - 21;
  const faces = block3(p, 1, y0 + 3, W - 3, 7, 10, wood, 3);
  // 뚜껑: 살짝 튀어나온 판
  p.rect(0, y0, W - 3, 4, shade(wood, 0.2));
  p.rect(0, y0, W - 3, 1, shade(wood, 0.4));
  p.rect(0, y0 + 9, W - 3, 2, shade(wood, -0.12));
  grain(p, 2, y0 + 12, W - 7, 7, wood, 91);
  // 손잡이 · 놋쇠 걸쇠
  p.rect(W / 2 - 5, y0 - 2, 8, 2, hex('#5a3a28'));
  p.rect(W / 2 - 3, y0 + 10, 4, 4, GOLD);
  p.set(W / 2 - 3, y0 + 10, hex('#f8e8a8'));
  // 틈으로 빠져나온 붉은 실
  p.line(3, y0 + 11, 0, y0 + 18, hex('#c84a44'));
  if (opt.includes('needle')) {
    p.line(W - 8, y0 + 10, W - 3, y0 + 7, hex('#c8ccd4'));
    p.set(W - 3, y0 + 7, hex('#f4f4ec'));
  }
  // 긁힌 자국
  p.line(6, y0 + 14, 10, y0 + 15, shade(wood, 0.2));
  p.outline();
  return out(p, 0, -Ht, 'person', { faces });
}

function mousetrap(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const y0 = H - 11;
  const faces = block3(p, 3, y0, W - 6, 6, 3, hex('#c89a64'), 2);
  // 쇠 고리 · 발판
  p.rect(5, y0 + 1, W - 12, 1, hex('#b8bcc4'));
  p.rect(5, y0 + 1, 1, 4, hex('#b8bcc4'));
  p.rect(W - 8, y0 + 1, 1, 4, hex('#b8bcc4'));
  p.rect(W / 2 - 2, y0 + 3, 4, 2, hex('#e0c890'));
  p.set(W / 2 + 3, y0 + 2, hex('#8a8e98'));
  p.outline();
  return out(p, 0, -H, 'person', { faces });
}

function paintcan(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const tin = hex('#c8ccd0');
  const g = H - 1;
  const top = g - 17;
  for (let y = top; y < g; y++) p.bar(4, y, W - 9, 1, tin);
  p.oval(4 + (W - 9) / 2, top, (W - 9) / 2, 3, hex('#ece6d8'));
  p.oval(4 + (W - 9) / 2, top, (W - 9) / 2 - 2, 2, hex('#f4f0e4'));
  // 흘러내린 흰 페인트 (말랐다)
  p.rect(5, top, 3, 7, hex('#f0ece0'));
  p.rect(6, top + 7, 1, 2, hex('#f0ece0'));
  p.rect(11, top, 2, 5, hex('#f0ece0'));
  // 상표 띠
  p.rect(4, top + 8, W - 9, 5, hex('#5a7aa0'));
  p.rect(7, top + 10, 6, 1, hex('#e8e0c8'));
  p.rect(4, g - 1, W - 9, 1, shade(tin, -0.4));
  // 붓 (뚜껑 위에 가로)
  p.rect(1, top - 3, 14, 2, WOOD);
  p.rect(15, top - 4, 3, 4, hex('#a8a8b0'));
  p.rect(18, top - 4, 4, 4, hex('#ece6d8'));
  p.outline();
  return out(p, 0, -H, 'person');
}

function railing(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  const wd = hex('#8e5e3a');
  const g = Ht - 1;
  // 아래 가름대
  p.rect(0, g - 4, W, 4, shade(wd, -0.08));
  p.rect(0, g - 4, W, 1, shade(wd, 0.15));
  // 살
  for (let x = 3; x < W - 2; x += 8) {
    p.rect(x, g - 22, 3, 18, wd);
    p.set(x, g - 22, shade(wd, 0.25));
    p.rect(x + 2, g - 21, 1, 17, shade(wd, -0.3));
  }
  // 손잡이 (윗면 + 앞면)
  p.rect(0, g - 27, W, 3, shade(wd, 0.25));
  p.rect(0, g - 24, W, 3, wd);
  p.rect(0, g - 27, W, 1, shade(wd, 0.45));
  p.rect(0, g - 22, W, 1, shade(wd, -0.35));
  grain(p, 0, g - 24, W, 2, wd, 101);
  if (opt.includes('yarn')) {
    // 걸린 노란 털실 한 가닥
    const yx = Math.floor(W * 0.6);
    for (let y = g - 24; y < g - 6; y++) p.set(yx + Math.round(Math.sin(y * 0.5) * 1.5), y, hex('#f0c848'));
    p.set(yx - 1, g - 24, hex('#f8e088'));
  }
  p.outline();
  return out(p, 0, -Ht, 'person');
}

function cobweb(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const web = hex('#d8d2c8');
  const right = opt.includes('right');
  const ax = right ? W - 1 : 0;
  const sx = right ? -1 : 1;
  for (let k = 0; k < 5; k++) {
    const a = (k / 4) * (Math.PI / 2);
    p.line(ax, 0, ax + sx * Math.cos(a) * (W - 2), Math.sin(a) * (H - 2), web);
  }
  for (let r = 6; r < W; r += 5) {
    for (let t = 0; t <= 16; t++) {
      const a = (t / 16) * (Math.PI / 2);
      const sag = Math.sin(a * 2) * 1.5;
      p.set(ax + sx * Math.cos(a) * (r - sag), Math.sin(a) * (r - sag), shade(web, -0.08));
    }
  }
  // 거미 한 마리 (작게)
  p.rect(ax + sx * 10, 12, 2, 2, hex('#4a3a3a'));
  return over(p, 0, -H);
}

function labelsOf(opt: string, defaults: string[]): string[] {
  const parts = opt.split(',').map((s) => s.trim()).filter((s) => s && [...s].some((c) => glyph(c)));
  return parts.length ? parts : defaults;
}

function movingBoxes(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const p = new Pix(W, Ht);
  const [l1, l2] = [...labelsOf(opt, ['하루 방', '깨짐주의']), '깨짐주의'];
  const g = Ht - 1;
  // 아래 큰 상자
  const bw = W - 2;
  const fb = block3(p, 0, g - 31, bw, 9, 22, CARD, 4);
  p.rect(bw / 2 - 3, g - 31, 5, 9, TAPE);
  p.rect(bw / 2 - 3, g - 22, 5, 4, shade(TAPE, -0.08));
  // 긴 이름은 글자 사이를 붙여 앞면 안에 (옆면으로 넘치지 않게)
  const gap1 = textWidth(l1) > bw - 8 ? 0 : 1;
  const tw = textWidth(l1, gap1);
  textH(p, l1, Math.max(2, Math.floor((bw - 4 - tw) / 2)), g - 18, MARKER, gap1);
  // 위 작은 상자 (왼쪽으로 치우침)
  const sw = W - 6;
  block3(p, 3, g - 31 - 26, sw, 8, 18, shade(CARD, 0.04), 3);
  p.rect(3 + sw / 2 - 3, g - 57, 5, 8, TAPE);
  const gap2 = textWidth(l2) > sw - 8 ? 0 : 1;
  const tw2 = textWidth(l2, gap2);
  textH(p, l2, 3 + Math.max(1, Math.floor((sw - 3 - tw2) / 2)), g - 47, hex('#b83a34'), gap2);
  p.outline();
  return out(p, 0, -Ht, 'person', { faces: fb });
}

function chairOld(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 22;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const wd = hex('#9a6640');
  // 등받이 (뒤 다리가 길게)
  p.rect(4, 2, 3, g - 2, shade(wd, -0.1));
  p.rect(W - 8, 2, 3, g - 2, shade(wd, -0.2));
  p.rect(4, 2, W - 9, 3, shade(wd, 0.2));
  p.rect(4, 9, W - 9, 2, wd);
  for (let x = 9; x < W - 9; x += 4) p.rect(x, 5, 2, 5, shade(wd, -0.05));
  // 앉는 판 3면
  const faces = block3(p, 2, g - 16, W - 4, 8, 4, wd, 3);
  grain(p, 3, g - 15, W - 9, 6, shade(wd, 0.18), 111);
  // 앞다리
  p.rect(3, g - 5, 3, 5, shade(wd, -0.15));
  p.rect(W - 8, g - 5, 3, 5, shade(wd, -0.3));
  // 등받이에 붙은 쪽지 「두고 가는 짐」
  if (!opt.includes('plain')) {
    box(p, 8, 12, 10, 8, PAPER);
    p.rect(9, 11, 3, 2, hex('#e8d8a8'));
    for (let y = 14; y < 19; y += 2) for (let x = 10; x < 16; x++) if (hash2(x, y, 112) < 0.7) p.set(x, y, MARKER);
  }
  p.outline();
  return out(p, 0, -Ht, 'person', { faces });
}

// ───────────────────────── 책상 위 (장난감 눈높이) ─────────────────────────

export const BOOK_TITLES = ['수학 4-2', '어린 왕자', '중3 영어', '종이접기 백과', '국어 5-1', '과학 3-2', '동화', '일기', '영어 사전', '수학 6-1', '백과 사전', '이야기'];
const BOOK_COLS = [hex('#b84a40'), hex('#3e5a8a'), MUSTARD, hex('#6a8a5a'), hex('#e8dcc0'), hex('#8a5a8a'), hex('#c87a48'), hex('#4a7a7a')];

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
  let firstFaces: Faces | undefined;
  while (x < W - 6) {
    const title = given.length ? given[i % given.length] : BOOK_TITLES[(i + seed * 5) % BOOK_TITLES.length];
    const c = BOOK_COLS[(i * 3 + seed) % BOOK_COLS.length];
    const thin = !given.length && hash2(i, seed, 121) < 0.18;
    const bw = Math.min(W - x, thin ? 7 : 15);
    if (bw < 6) break;
    const need = textVHeight(title) + 14;
    const bh = Math.max(thin ? 62 : need, Math.round(tallest - 26 + hash2(i, seed, 122) * 26));
    const top = g - bh;
    // 윗면: 책장 종이 (크림) + 표지 가장자리
    p.rect(x, top - 3, bw - 2, 3, shade(c, 0.15));
    p.rect(x + 1, top - 2, bw - 4, 2, PAPER);
    // 책등 (앞면)
    p.rect(x, top, bw - 2, bh, c);
    p.rect(x, top, 1, bh, shade(c, 0.18));
    // 금 띠
    const band = c === hex('#e8dcc0') ? hex('#a07040') : GOLD;
    p.rect(x + 1, top + 3, bw - 4, 1, band);
    p.rect(x + 1, g - 5, bw - 4, 1, band);
    // 옆면 그늘 (책 사이 틈)
    p.rect(x + bw - 2, top - 2, 2, bh + 2, shade(c, -0.4));
    p.rect(x, g, bw, 1, shade(c, -0.5));
    if (!thin) {
      const ink = c === hex('#e8dcc0') || c === MUSTARD ? hex('#3a2a2a') : hex('#f4ead4');
      textV(p, title, x + Math.floor((bw - 2) / 2), top + 7, ink);
    }
    if (!firstFaces) firstFaces = { top: [x + 1, top - 2, bw - 4, 2], front: [x + 1, top, bw - 4, bh - 1], side: [x + bw - 2, top, 2, bh] };
    x += bw;
    i++;
    if (gap && i === 3) x += 10;
  }
  p.outline();
  return out(p, 0, -Ht, 'toy');
}

function pencilCup(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 70;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const cw = W - 10;
  const cx0 = 4;
  const cupTop = g - 46;
  // 연필 숲 (뒤 → 앞)
  const pcs = [hex('#e8b840'), hex('#5a8ab0'), hex('#c85a4a'), hex('#6a9a5a'), hex('#e8b840'), hex('#8a6ab0'), hex('#d87a48')];
  pcs.forEach((c, k) => {
    const px = cx0 + 4 + k * Math.floor((cw - 10) / (pcs.length - 1));
    const lean = (k - 3) * 1.4;
    const tipY = 4 + Math.floor(hash2(k, 1, 131) * 20);
    for (let y = tipY + 8; y < cupTop + 4; y++) {
      const xx = Math.round(px + (lean * (cupTop - y)) / 60);
      p.rect(xx, y, 4, 1, c);
      p.set(xx, y, shade(c, 0.3));
      p.set(xx + 3, y, shade(c, -0.3));
    }
    const tx = Math.round(px + (lean * (cupTop - tipY)) / 60);
    // 깎은 나무 · 심
    p.tri(tx - 0.5, tipY + 9, tx + 4.5, tipY + 9, tx + 2, tipY + 1, hex('#e8c898'));
    p.rect(tx + 1, tipY + 1, 2, 3, k === 5 ? hex('#8a6ab0') : hex('#4a4450'));
  });
  // 가위 손잡이 하나
  p.oval(W - 14, cupTop - 6, 4, 3, hex('#c84a44'));
  p.oval(W - 14, cupTop - 6, 2, 1.5, hex('#3a3434'));
  if (opt.includes('yarn')) {
    // 보라색 털실 자투리가 테두리에 걸침
    for (let y = cupTop - 2; y < cupTop + 14; y++) p.set(cx0 + 7 + Math.round(Math.sin(y * 0.6) * 1.5), y, hex('#9a6ab8'));
    p.oval(cx0 + 8, cupTop - 2, 3, 2, hex('#a878c8'));
  }
  // 깡통: 원기둥
  const tin = hex('#7a9a80');
  for (let y = cupTop; y < g; y++) p.bar(cx0, y, cw, 1, tin);
  // 앞쪽 테두리 (입구 타원의 아래 절반만 연필 앞)
  p.oval(cx0 + cw / 2, cupTop, cw / 2, 4, shade(tin, 0.3));
  p.oval(cx0 + cw / 2, cupTop, cw / 2 - 2, 3, shade(tin, -0.55));
  // 입구 안쪽에 연필 꽂힌 자리 다시 칠하기
  pcs.forEach((c, k) => {
    const px = cx0 + 4 + k * Math.floor((cw - 10) / (pcs.length - 1));
    const lean = (k - 3) * 1.4;
    const xx = Math.round(px + (lean * 2) / 60);
    p.rect(xx, cupTop - 2, 4, 3, c);
  });
  p.rect(cx0, cupTop + 2, cw, 2, shade(tin, 0.25));
  // 상표 띠 (크림 · 줄)
  p.rect(cx0, cupTop + 12, cw, 16, hex('#efe2c4'));
  for (let x = cx0; x < cx0 + cw; x++) p.set(x, cupTop + 12, shade(hex('#efe2c4'), x - cx0 < cw * 0.2 ? 0.2 : x - cx0 > cw * 0.75 ? -0.2 : 0));
  p.rect(cx0, cupTop + 16, cw, 2, hex('#c85a4a'));
  p.rect(cx0, cupTop + 22, cw, 2, hex('#c85a4a'));
  for (let x = cx0 + Math.floor(cw * 0.75); x < cx0 + cw; x++) for (let y = cupTop + 13; y < cupTop + 28; y++) p.set(x, y, shade(p.get(x, y), -0.18));
  // 아래 테 · 접지
  p.rect(cx0, g - 3, cw, 1, shade(tin, 0.2));
  p.rect(cx0 + 2, g, cw - 4, 1, shade(tin, -0.5));
  p.outline();
  return out(p, 0, -Ht, 'toy');
}

/**
 * 스탠드 받침: 장난감이 올라서는 높은 층 2 (12px × 2) 둥근 북 모양. 윗면은 발자리를 그만큼 올린 자리, 앞면 22px.
 * 목은 받침 뒤쪽에서 위로 사라지고 (갓은 화면 밖), 스위치는 윗면 가운데 (보리가 엉덩이로 누르는 자리).
 * behind = 앞면 위쪽 전부 (목 · 윗면), front = 앞면 아래쪽 — 위에 선 장난감은 그 사이에 그린다.
 */
function lampBase(W: number, H: number, opt: string): PropSprite {
  const lift = 24;
  const neckH = 104;
  const Ht = H + neckH - lift + 4;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const on = opt.includes('on');
  const metal = hex('#7aa090');
  const face = 22;
  const rx = W / 2 - 3;
  const ry = Math.floor((H - 4) / 2);
  const bcx = W / 2 - 1;
  const cy = g - face - ry;
  // 앞면 (둥근 북의 옆면: 왼쪽은 빛, 오른쪽은 그늘)
  for (let x = -rx; x <= rx; x++) {
    const nx = x / rx;
    const y0 = cy + Math.round(Math.sqrt(Math.max(0, 1 - nx * nx)) * ry);
    const c = nx > 0.55 ? shade(metal, -0.42) : nx < -0.6 ? shade(metal, -0.04) : shade(metal, -0.2 + (nx < 0 ? 0.06 : 0));
    for (let y = y0; y <= y0 + face; y++) p.set(bcx + x, y, y === y0 + face ? shade(metal, -0.6) : y > y0 + face - 3 ? shade(c, -0.12) : c);
    if ((x + rx) % 9 === 0 && Math.abs(nx) < 0.85) p.rect(bcx + x, y0 + 4, 1, face - 7, shade(c, -0.1));
  }
  // 윗면 (타원)
  p.oval(bcx, cy, rx, ry, shade(metal, 0.18));
  p.oval(bcx - 4, cy - 3, rx - 12, ry - 7, shade(metal, 0.28));
  for (let x = -rx + 2; x <= rx - 2; x++) {
    const nx = x / rx;
    p.set(bcx + x, cy + Math.round(Math.sqrt(Math.max(0, 1 - nx * nx)) * ry) - 1, shade(metal, 0.4));
  }
  if (on) {
    // 갓에서 내려온 빛이 윗면에 고인다
    p.oval(bcx + 2, cy + 2, rx - 6, ry - 5, mix(shade(metal, 0.28), LAMP, 0.45));
    p.oval(bcx + 2, cy + 3, rx - 16, ry - 10, mix(shade(metal, 0.3), LAMP, 0.7));
  }
  // 목: 받침 뒤쪽에서 위로 사라진다 (위쪽은 어두워짐), 스프링 관절
  const nx0 = bcx + 4;
  const neckBase = cy - ry + 6;
  for (let y = 0; y < neckBase; y++) {
    const t = y / neckBase;
    const xx = Math.round(nx0 + 3 - t * 3);
    const c = mix(hex('#4a5a58'), metal, Math.min(1, t * 1.6));
    p.bar(xx, y, 5, 1, c);
    if (on && y > 4) p.set(xx, y, mix(c, LAMP, 0.5));
  }
  const jy = Math.floor(neckBase * 0.5);
  for (let k = 0; k < 6; k++) p.rect(nx0 - 1, jy + k * 2, 8, 1, hex('#b8bcb4'));
  p.oval(nx0 + 2, neckBase, 6, 3, shade(metal, -0.25));
  p.oval(nx0 + 2, neckBase - 1, 4, 2, shade(metal, 0.05));
  // 스위치 (윗면 가운데)
  const bx = bcx + 1;
  const by = cy + 4;
  p.oval(bx, by + 1, 6, 3.5, shade(metal, -0.45));
  p.oval(bx, by - (on ? 0 : 1), 5, 3, on ? hex('#f0c060') : hex('#d8d0b8'));
  p.set(bx - 2, by - (on ? 1 : 2), hex('#f8f0dc'));
  if (on) p.set(bx + 2, by, hex('#fff0b8'));
  p.outline();
  // 앞면 윗선(가운데) 줄부터 아래는 앞부분
  const split = cy + ry - 2;
  const behind = new Pix(W, Ht);
  const front = new Pix(W, Ht);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < W; x++) (y < split ? behind : front).set(x, y, p.get(x, y));
  return { pix: p, ox: 0, oy: -Ht, behind, front };
}

function notebook(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const pg = PAPER;
  const y0 = 4;
  const ph = H - 10;
  // 표지 테 (조금 보임)
  p.rect(1, y0 - 1, W - 2, ph + 3, hex('#d87a6a'));
  // 두 쪽
  for (const [x0, w0] of [[3, W / 2 - 4], [W / 2 + 1, W / 2 - 4]] as const) {
    p.rect(x0, y0, w0, ph, pg);
    for (let y = y0 + 8; y < y0 + ph - 2; y += 7) p.rect(x0 + 1, y, w0 - 2, 1, hex('#c4d0dc'));
    p.rect(x0 + 6, y0 + 1, 1, ph - 2, hex('#e8b0a8'));
    // 하루 글씨 흉내 (연필 자국)
    for (let r = 0; r * 7 + y0 + 4 < y0 + ph - 6; r++) {
      const len = Math.floor(hash2(r, x0, 141) * (w0 - 14)) + 6;
      if (hash2(r, x0, 142) < 0.25) continue;
      for (let k = 0; k < len; k++) {
        const v = hash2(k, r + x0, 143);
        if (v < 0.6) p.set(x0 + 9 + k, y0 + 5 + r * 7 + (v < 0.2 ? -1 : 0), hex('#6a6a7a'));
      }
    }
  }
  // 가운데 접힌 골 그늘
  p.rect(W / 2 - 2, y0, 3, ph, shade(pg, -0.22));
  p.rect(W / 2 - 1, y0, 1, ph, shade(pg, -0.35));
  // 앞쪽 종이 두께 (앞면)
  for (let k = 0; k < 4; k++) p.rect(3, y0 + ph + k, W - 7, 1, k % 2 ? shade(pg, -0.12) : shade(pg, -0.04));
  p.rect(W - 4, y0 + 1, 3, ph + 3, shade(pg, -0.32));
  // 귀퉁이 말림
  p.tri(W - 5, y0 + ph, W - 16, y0 + ph, W - 5, y0 + ph - 10, shade(pg, -0.08));
  p.outline();
  return { pix: p, ox: 0, oy: -H, faces: { top: [8, y0 + 2, W / 2 - 12, ph - 4], front: [6, y0 + ph, W - 12, 4], side: [W - 4, y0 + 4, 3, ph - 4] } };
}

function eraser(W: number, H: number, opt: string): PropSprite {
  const small = opt.includes('small');
  const Ht = H + (small ? 4 : 10);
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const bw = small ? Math.min(W - 2, 22) : W - 2;
  const d = small ? 7 : 12;
  const fh = small ? 9 : 15;
  const x0 = Math.floor((W - bw) / 2);
  const y0 = g - d - fh;
  const faces = block3(p, x0, y0, bw, d, fh, hex('#ece4d4'), small ? 2 : 3, hex('#f6f0e4'));
  // 종이 띠 (파랑 · 줄)
  const sx = x0 + Math.floor(bw * 0.4);
  const sw = Math.floor(bw * 0.55);
  p.rect(sx, y0, Math.min(sw, bw - (sx - x0) - (small ? 2 : 3)), d, hex('#6a9ad0'));
  p.rect(sx, y0 + d, Math.min(sw, bw - (sx - x0) - (small ? 2 : 3)), fh - 1, hex('#4a7ab8'));
  p.rect(sx, y0 + d + 2, Math.min(sw, bw - (sx - x0) - (small ? 2 : 3)), 1, hex('#e8dcc0'));
  p.rect(sx, y0 + d + fh - 4, Math.min(sw, bw - (sx - x0) - (small ? 2 : 3)), 1, hex('#e8dcc0'));
  p.rect(x0 + bw - (small ? 2 : 3), y0 + d, small ? 2 : 3, fh - 1, hex('#3a5a90'));
  p.outline();
  return out(p, 0, -Ht, 'toy', { faces });
}

function eraserDust(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const g = H - 2;
  const c = hex('#d8d0c4');
  for (const [cx, r] of [[12, 7], [26, 9], [38, 5]] as const) {
    for (let y = -r; y <= 0; y++) {
      const hw = Math.round(Math.sqrt(1 - (y / r) ** 2) * (r + 3));
      for (let x = -hw; x <= hw; x++) {
        const v = hash2(cx + x, y, 151);
        p.set(cx + x, g + y * 0.8, v < 0.25 ? shade(c, -0.15) : v > 0.85 ? shade(c, 0.25) : c);
      }
    }
  }
  // 돌돌 말린 부스러기
  for (let i = 0; i < 8; i++) {
    const x = 2 + Math.floor(hash2(i, 1, 152) * (W - 6));
    const y = g - 1 + Math.floor(hash2(i, 2, 152) * 2);
    p.rect(x, y, 3, 1, hex('#c8c0b4'));
    p.set(x + 1, y - 1, hex('#e8e0d4'));
  }
  p.outline();
  return { pix: p, ox: 0, oy: -H };
}

function ruler(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const pl = hex('#cfe0c8');
  const y0 = H - 18;
  // 윗면 (반투명 플라스틱 흉내 · 바랜 초록)
  p.rect(1, y0, W - 4, 13, pl);
  p.rect(1, y0, W - 4, 1, shade(pl, 0.4));
  for (let x = 3; x < W - 6; x += 7) p.rect(x, y0 + 3, 3, 1, shade(pl, 0.3));
  // 눈금 · 숫자
  const ink = hex('#3a4a42');
  for (let i = 0, x = 4; x < W - 6; i++, x += 3) {
    const len = i % 10 === 0 ? 6 : i % 5 === 0 ? 4 : 2;
    p.rect(x, y0 + 1, 1, len, ink);
    if (i % 10 === 0) tiny(p, String(i / 10), x - 1, y0 + 7, ink);
  }
  // 앞면 (두께) · 옆면
  p.rect(1, y0 + 13, W - 4, 3, shade(pl, -0.18));
  p.rect(W - 3, y0 + 1, 2, 15, shade(pl, -0.36));
  p.rect(1, y0 + 15, W - 4, 1, shade(pl, -0.4));
  p.outline();
  return { pix: p, ox: 0, oy: -H, faces: { top: [2, y0 + 1, W - 8, 12], front: [2, y0 + 13, W - 8, 3], side: [W - 3, y0 + 1, 2, 15] } };
}

function pencil(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const body = opt.includes('red') ? hex('#c8483c') : opt.includes('green') ? hex('#6a9a5a') : hex('#e8b840');
  const y0 = H - 14;
  const x0 = 12;
  const x1 = W - 16;
  // 육각 기둥: 윗면 · 가운데 면 · 아랫면
  p.rect(x0, y0, x1 - x0, 3, shade(body, 0.28));
  p.rect(x0, y0 + 3, x1 - x0, 5, body);
  p.rect(x0, y0 + 8, x1 - x0, 3, shade(body, -0.3));
  p.rect(x0, y0 + 3, x1 - x0, 1, shade(body, -0.08));
  p.rect(x0, y0 + 8, x1 - x0, 1, shade(body, -0.16));
  // 금박 글씨 흉내
  for (let x = x0 + 14; x < x0 + 40; x += 2) p.set(x, y0 + 5, GOLD);
  // 쇠 고리 · 지우개
  p.rect(x1, y0, 6, 11, hex('#b8b8b0'));
  for (let x = x1 + 1; x < x1 + 6; x += 2) p.rect(x, y0, 1, 11, hex('#8a8a84'));
  p.rect(x1 + 6, y0 + 1, 8, 9, hex('#e8a0a0'));
  p.rect(x1 + 6, y0 + 1, 8, 2, hex('#f4c0b8'));
  p.rect(x1 + 6, y0 + 8, 8, 2, hex('#c87878'));
  // 깎은 나무 · 심
  p.tri(x0 + 1, y0, x0 + 1, y0 + 11, 2, y0 + 5.5, hex('#e8c898'));
  for (let y = y0 + 1; y < y0 + 11; y += 3) p.line(x0, y, x0 - 3, y0 + 5, hex('#c8a070'));
  p.tri(5, y0 + 3.5, 5, y0 + 7.5, 1, y0 + 5.5, hex('#4a4450'));
  p.outline();
  return { pix: p, ox: 0, oy: -H, faces: { top: [x0, y0, x1 - x0, 3], front: [x0, y0 + 3, x1 - x0, 5], side: [x0, y0 + 8, x1 - x0, 3] } };
}

function paperStrips(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const cols = [hex('#e87a8a'), hex('#7ab0d8'), hex('#a8d098'), hex('#c8a0d8'), hex('#f0a868'), hex('#e87a8a'), hex('#7ab0d8')];
  const y0 = H - 30;
  cols.forEach((c, k) => {
    const y = y0 + k * 3;
    const tilt = (k % 3) - 1;
    for (let x = 4; x < W - 22; x++) {
      const yy = y + Math.round((tilt * (x - 4)) / 30);
      p.rect(x, yy, 1, 4, c);
      p.set(x, yy, shade(c, 0.25));
      p.set(x, yy + 3, shade(c, -0.22));
    }
  });
  // 고무줄로 따로 묶은 노란 띠
  const yx = W - 20;
  for (let k = 0; k < 4; k++) {
    const y = H - 20 + k * 3;
    p.rect(yx, y, 17, 4, hex('#f4d050'));
    p.rect(yx, y, 17, 1, hex('#fae890'));
    p.rect(yx, y + 3, 17, 1, hex('#d0a830'));
  }
  p.rect(yx + 7, H - 21, 2, 14, hex('#c84a44'));
  p.set(yx + 7, H - 21, hex('#e88070'));
  p.outline();
  return { pix: p, ox: 0, oy: -H };
}

function starJarGiant(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 90;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const jx = 4;
  const jw = W - 10;
  const jTop = 12;
  const glass = hex('#b8d4d8');
  // 굴절 무지개 얼룩 (책상 위, 병 오른쪽 아래)
  const rainbow = [hex('#e89a9a'), hex('#f0c890'), hex('#f0e8a0'), hex('#b0d8a8'), hex('#a0c0e8'), hex('#c0a8e0')];
  rainbow.forEach((c, k) => p.rect(jx + jw - 6 + k, g - 7 + Math.floor(k / 2), 6, 1, c));
  // 유리 몸통 (뒤 벽 → 별 → 앞 유리)
  for (let y = jTop + 6; y < g; y++) p.rect(jx, y, jw, 1, mix(glass, NIGHT, 0.25));
  // 별 빽빽
  const sc = [hex('#f4c850'), hex('#e87a8a'), hex('#7ab0d8'), hex('#a8d098'), hex('#c8a0d8'), hex('#f0a868'), hex('#f6efdf')];
  const fill = jTop + 22;
  for (let row = 0, y = g - 7; y > fill; row++, y -= 4) {
    for (let x = jx + 1 + (row % 2) * 2; x < jx + jw - 5; x += 4) {
      const c = sc[Math.floor(hash2(x, y, 161) * sc.length)];
      star(p, x, y, c);
    }
  }
  // 맨 밑 삐뚤어진 첫 별 (m5a) · 중간 금색 별 「100」 (m5d)
  p.rect(jx + 8, g - 8, 7, 6, mix(glass, NIGHT, 0.25));
  p.tri(jx + 8, g - 3, jx + 14, g - 6, jx + 10, g - 9, hex('#f0a0a8'));
  p.set(jx + 10, g - 6, hex('#f8d0d0'));
  const gy = Math.floor((g + fill) / 2);
  const gx = jx + Math.floor(jw / 2) - 6;
  p.tri(gx, gy + 3, gx + 13, gy + 3, gx + 6.5, gy - 4, GOLD);
  p.tri(gx + 1, gy + 1, gx + 12, gy + 1, gx + 6.5, gy + 9, GOLD);
  p.tri(gx + 2, gy + 1, gx + 11, gy + 1, gx + 6.5, gy + 7, shade(GOLD, 0.12));
  tiny(p, '100', gx + 1, gy, hex('#8a5a20'));
  // 유리 앞면: 왼쪽 반사 줄 · 오른쪽 그늘 · 굴절 얼룩
  for (let y = jTop + 8; y < g - 3; y++) {
    p.set(jx + 2, y, hex('#e8f4f0'));
    p.set(jx + 3, y, hex('#d0e8e8'));
    p.set(jx + jw - 2, y, mix(glass, NIGHT, 0.55));
    p.set(jx + jw - 1, y, mix(glass, NIGHT, 0.7));
  }
  for (let y = jTop + 14; y < jTop + 30; y++) p.set(jx + 7, y, hex('#e0f0ec'));
  rainbow.forEach((c, k) => p.rect(jx + jw - 10, g - 30 + k * 2, 3, 2, mix(c, glass, 0.35)));
  // 어깨 · 목 · 코르크 뚜껑
  p.rect(jx + 3, jTop + 2, jw - 6, 5, mix(glass, NIGHT, 0.15));
  p.rect(jx + 3, jTop + 2, jw - 6, 1, hex('#e0f0ec'));
  p.oval(jx + jw / 2, jTop + 2, jw / 2 - 3, 3, hex('#d0e4e4'));
  block3(p, jx + 8, jTop - 10, jw - 16, 6, 6, hex('#c09060'), 3);
  // 바닥 두께 · 접지
  p.rect(jx, g - 2, jw, 2, mix(glass, hex('#d0e8e8'), 0.5));
  p.rect(jx + 1, g, jw - 2, 1, shade(glass, -0.5));
  if (opt.includes('glow')) for (let i = 0; i < 6; i++) p.set(jx + 4 + hash2(i, 1, 162) * (jw - 8), fill + hash2(i, 2, 162) * (g - fill - 10), hex('#fcf4d8'));
  p.outline();
  return out(p, 0, -Ht, 'toy');
}

function phoneGiant(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const body = hex('#3a3a44');
  const x0 = 4;
  const y0 = 2;
  const pw = W - 10;
  const ph = H - 12;
  // 케이블 (아래쪽으로 굽이쳐 나감)
  const cable = hex('#e4ded2');
  let cx = x0 + pw / 2;
  for (let y = y0 + ph + 4; y < H; y++) {
    cx += Math.sin(y * 0.4) * 0.8;
    p.rect(Math.round(cx), y, 2, 1, cable);
  }
  // 몸통 앞면 두께 · 옆면
  p.rect(x0 + 1, y0 + ph, pw - 2, 4, hex('#5a5a66'));
  p.rect(x0 + 1, y0 + ph, pw - 2, 1, hex('#8a8a98'));
  p.rect(x0 + pw, y0 + 3, 3, ph, hex('#26262e'));
  // 윗면
  p.rect(x0 + 2, y0, pw - 4, ph, body);
  p.rect(x0, y0 + 2, pw, ph - 4, body);
  p.rect(x0 + 1, y0 + 1, pw - 2, ph - 2, body);
  // 검은 호수 화면
  const sx = x0 + 3;
  const sy = y0 + 7;
  const sw = pw - 6;
  const sh = ph - 14;
  for (let y = 0; y < sh; y++) p.rect(sx, sy + y, sw, 1, mix(hex('#141820'), hex('#1e2638'), y / sh));
  // 달빛 반사 (비스듬한 줄)
  for (let k = 0; k < sw; k++) {
    const y = sy + Math.floor(sh * 0.2) + Math.floor(k * 0.6);
    p.set(sx + k, y, hex('#4a5878'));
    p.set(sx + k, y + 1, hex('#36405a'));
  }
  p.set(sx + 3, sy + 3, hex('#8a98b8'));
  // 충전 표시 (작은 배터리, 숨쉬기: opt 'dim' 이면 흐리게)
  const bat = opt.includes('dim') ? hex('#3a6a4a') : hex('#6ac080');
  const bx = sx + sw / 2 - 5;
  const by = sy + sh / 2 + 6;
  p.rect(bx, by, 10, 5, hex('#2a3a30'));
  p.rect(bx + 1, by + 1, 6, 3, bat);
  p.rect(bx + 10, by + 1, 1, 3, hex('#2a3a30'));
  // 스피커 · 카메라
  p.rect(x0 + pw / 2 - 4, y0 + 3, 8, 1, hex('#1e1e24'));
  p.oval(x0 + pw / 2 + 7, y0 + 3.5, 1, 1, hex('#5a6a8a'));
  p.rect(x0 + 2, y0 + 1, pw - 6, 1, hex('#6a6a78'));
  // 충전 단자 · 플러그
  p.rect(x0 + pw / 2 - 2, y0 + ph + 2, 5, 3, hex('#d8d2c6'));
  p.outline();
  return { pix: p, ox: 0, oy: -H, faces: { top: [x0 + 1, y0 + 3, 2, ph - 6], front: [x0 + 2, y0 + ph + 1, pw - 4, 3], side: [x0 + pw, y0 + 3, 3, ph] } };
}

function calendarDesk(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 40;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const num = (opt.match(/\d+/)?.[0] ?? '12').slice(0, 2);
  const x0 = 4;
  const cw = W - 12;
  // 받침 (삼각 텐트 · 뒷판이 오른쪽으로 보임)
  p.tri(x0 + cw, 6, x0 + cw + 6, g - 2, x0 + cw, g - 2, hex('#8a6a4a'));
  // 앞장
  const top = 8;
  p.rect(x0, top, cw, g - top - 2, PAPER);
  p.rect(x0, top, cw, 9, hex('#7a9a6a'));
  p.rect(x0, top, cw, 1, hex('#a8c098'));
  // 스프링
  for (let x = x0 + 3; x < x0 + cw - 2; x += 4) {
    p.rect(x, top - 4, 2, 6, hex('#9a9aa4'));
    p.set(x, top - 4, hex('#d0d0d8'));
  }
  // 큰 날짜
  const nw = textWidth(num);
  textH(p, num, x0 + 3, top + 12, hex('#3a3040'));
  // 날짜 칸 (작은 숫자 · 줄)
  const gx = x0 + nw + 7;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const d = r * 4 + c + 1;
    tiny(p, String(d % 10), gx + c * 6, top + 12 + r * 7, c === 3 ? hex('#c84a44') : hex('#6a6070'));
  }
  // 동그라미 친 날 (빨강)
  const rx = x0 + 2 + nw / 2;
  const ry = top + 16;
  for (let t = 0; t < 30; t++) {
    const a = (t / 30) * Math.PI * 2;
    p.set(rx + Math.cos(a) * (nw / 2 + 3), ry + Math.sin(a) * 7, hex('#d04a44'));
  }
  // 아래 두께 · 접지
  p.rect(x0, g - 2, cw, 2, shade(PAPER, -0.25));
  p.rect(x0, g, cw + 6, 1, shade(hex('#8a6a4a'), -0.4));
  p.outline();
  return out(p, 0, -Ht, 'toy');
}

function testPapers(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 6;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const score = opt.match(/\d+/)?.[0] ?? '60';
  const d = 26;
  // 아래 장들 (살짝 어긋남) → 앞면에 종이 결
  for (let k = 0; k < 4; k++) {
    const off = Math.round((hash2(k, 1, 171) - 0.5) * 6);
    p.rect(4 + off, g - 8 - d + k, W - 12, d, shade(PAPER, -0.08 * (4 - k) * 0.5));
  }
  const y0 = g - 10 - d;
  const faces = block3(p, 3, y0, W - 8, d, 8, hex('#e2d8c2'), 3, PAPER);
  for (let y = y0 + d + 1; y < y0 + d + 7; y += 2) p.rect(3, y, W - 11, 1, hex('#cdbfa4'));
  // 맨 위 시험지: 문제 줄 · 빨간 비 무늬 (틀린 문제 빗금)
  const red = hex('#d04a44');
  for (let r = 0; r < 4; r++) {
    const ly = y0 + 4 + r * 5;
    p.rect(8, ly, W - 30, 1, hex('#9a9aa8'));
    if (r % 2 === 0) for (let k = 0; k < 4; k++) p.line(10 + k * 9, ly - 2, 13 + k * 9, ly + 2, red);
    else p.oval(10, ly, 2, 2, red);
  }
  // 점수 (빨강)
  const sx = W - 22;
  tiny(p, score, sx, y0 + 4, red);
  p.line(sx - 2, y0 + 11, sx + 11, y0 + 11, red);
  p.line(sx - 1, y0 + 12, sx + 10, y0 + 13, red);
  p.outline();
  return out(p, 0, -Ht, 'toy', { faces });
}

function candyTin(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const tin = hex('#c8584a');
  const cx = W / 2 - 1;
  const rx = W / 2 - 4;
  const top = g - 26;
  for (let y = top; y < g - 1; y++) p.bar(cx - rx, y, 2 * rx, 1, tin);
  // 사탕 그림 띠
  p.rect(cx - rx, top + 8, 2 * rx, 9, hex('#f0e2c4'));
  for (let x = cx - rx + 3; x < cx + rx - 4; x += 8) {
    p.oval(x + 2, top + 12, 2.5, 2.5, [hex('#e87a8a'), hex('#7ab0d8'), MUSTARD][Math.floor(x / 8) % 3]);
    p.set(x - 1, top + 12, hex('#d8c8a8'));
    p.set(x + 5, top + 12, hex('#d8c8a8'));
  }
  for (let x = Math.floor(cx + rx * 0.5); x < cx + rx; x++) for (let y = top + 8; y < top + 17; y++) p.set(x, y, shade(p.get(x, y), -0.2));
  // 뚜껑
  p.oval(cx, top, rx + 1, 5, shade(tin, 0.22));
  p.oval(cx - 2, top - 1, rx - 6, 2.5, shade(tin, 0.4));
  p.rect(cx - rx - 1, top, 2 * rx + 2, 3, shade(tin, -0.1));
  p.oval(cx, top - 1, rx + 1, 4, shade(tin, 0.22));
  p.oval(cx - 4, top - 2, rx - 8, 1.5, shade(tin, 0.45));
  p.rect(cx - rx, g - 1, 2 * rx, 1, shade(tin, -0.5));
  p.outline();
  return out(p, 0, -Ht, 'toy');
}

function tapeCutter(W: number, H: number): PropSprite {
  const Ht = H + 10;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const body = hex('#6a8a74');
  // 투명 테이프 롤 (호박색 고리)
  p.oval(W / 2 - 4, g - 18, 11, 11, hex('#e8c888'));
  p.oval(W / 2 - 4, g - 18, 9, 9, hex('#f0dca8'));
  p.oval(W / 2 - 4, g - 18, 5, 5, hex('#b89868'));
  p.oval(W / 2 - 4, g - 18, 3.5, 3.5, hex('#4a5a4e'));
  p.set(W / 2 - 10, g - 23, hex('#fcf0d4'));
  // 몸통 3면
  const faces = block3(p, 1, g - 15, W - 3, 5, 10, body, 3);
  p.rect(3, g - 8, W - 10, 1, shade(body, 0.15));
  // 톱니 칼날 (앞쪽 왼편)
  p.rect(1, g - 17, 7, 2, hex('#b8bcc0'));
  for (let x = 1; x < 8; x += 2) p.set(x, g - 18, hex('#d8dce0'));
  p.outline();
  return out(p, 0, -Ht, 'toy', { faces });
}

function hairTie(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#e07a8a');
  const cx = W / 2;
  const cy = H - 8;
  for (let t = 0; t < 60; t++) {
    const a = (t / 60) * Math.PI * 2;
    const x = cx + Math.cos(a) * 7;
    const y = cy + Math.sin(a) * 4;
    p.rect(x, y, 2, 2, Math.sin(a) < -0.3 ? shade(c, 0.2) : Math.sin(a) > 0.4 ? shade(c, -0.22) : c);
  }
  p.ball(cx + 6, cy - 3, 3, 3, hex('#f0d060'));
  p.outline();
  return { pix: p, ox: 0, oy: -H };
}

function milkCarton(W: number, H: number): PropSprite {
  const Ht = H + 44;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const x0 = 6;
  const cw = W - 16;
  const sw = 6;
  const bodyTop = g - 60;
  const wht = hex('#f2ece0');
  // 앞면 · 옆면
  p.rect(x0, bodyTop, cw, g - bodyTop, wht);
  for (let k = 0; k < sw; k++) p.rect(x0 + cw + k, bodyTop - Math.floor(k / 2), 1, g - bodyTop + Math.floor(k / 2), shade(wht, -0.3));
  // 파랑 · 초록 무늬, 「우유」
  p.rect(x0, bodyTop + 30, cw, 20, hex('#6a9ad0'));
  p.oval(x0 + cw / 2, bodyTop + 30, cw / 2, 5, hex('#6a9ad0'));
  p.rect(x0, g - 10, cw, 10, hex('#7aa86a'));
  p.rect(x0 + cw, g - 10, sw, 10, shade(hex('#7aa86a'), -0.3));
  p.rect(x0 + cw, bodyTop + 26, sw, 24, shade(hex('#6a9ad0'), -0.3));
  textH(p, '우유', x0 + Math.floor((cw - textWidth('우유')) / 2), bodyTop + 9, hex('#3a5a9a'));
  // 지붕 (뾰족 · 한쪽이 벌어진 주둥이)
  p.tri(x0, bodyTop, x0 + cw, bodyTop, x0 + cw / 2, bodyTop - 14, shade(wht, -0.08));
  p.tri(x0 + cw, bodyTop, x0 + cw + sw, bodyTop - 3, x0 + cw / 2, bodyTop - 14, shade(wht, -0.35));
  p.rect(x0 + cw / 2 - 6, bodyTop - 18, 12, 4, shade(wht, -0.05));
  p.rect(x0 + cw / 2 - 6, bodyTop - 18, 12, 1, shade(wht, 0.3));
  p.tri(x0 + 2, bodyTop - 1, x0 + 10, bodyTop - 9, x0 - 3, bodyTop - 7, shade(wht, 0.1));
  // 빨대 (구부러진)
  p.rect(x0 + cw / 2 + 2, bodyTop - 32, 3, 18, hex('#e87a8a'));
  p.rect(x0 + cw / 2 + 2, bodyTop - 32, 9, 3, hex('#e87a8a'));
  for (let y = bodyTop - 30; y < bodyTop - 14; y += 3) p.set(x0 + cw / 2 + 2, y, hex('#f8d0d0'));
  p.rect(x0, g, cw + sw, 1, shade(wht, -0.55));
  p.outline();
  return out(p, 0, -Ht, 'toy', { faces: { top: [x0 + 2, bodyTop - 8, cw - 4, 6], front: [x0 + 1, bodyTop + 2, cw - 2, g - bodyTop - 3], side: [x0 + cw, bodyTop + 2, sw, g - bodyTop - 3] } });
}

function memoWall(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  // 시간표 아랫부분 (위로 잘림)
  const tx = 6;
  const tw = Math.floor(W * 0.55);
  const th = H - 10;
  p.rect(tx, 0, tw, th, PAPER);
  const subj = [hex('#f0b0b8'), hex('#b0d0f0'), hex('#c8e4b8'), hex('#f4e0a0'), hex('#d8c4ec')];
  const cw = Math.floor((tw - 4) / 5);
  for (let r = 0; r < Math.floor((th - 4) / 9); r++) {
    for (let c = 0; c < 5; c++) {
      const col = subj[Math.floor(hash2(r, c, 181) * subj.length)];
      p.rect(tx + 2 + c * cw, 2 + r * 9, cw - 1, 8, col);
      p.rect(tx + 4 + c * cw, 5 + r * 9, cw - 6, 1, shade(col, -0.35));
    }
  }
  p.rect(tx, th - 1, tw, 1, shade(PAPER, -0.3));
  // 귀퉁이 테이프
  p.rect(tx - 2, th - 5, 7, 4, mix(TAPE, PAPER, 0.4));
  p.rect(tx + tw - 5, th - 5, 7, 4, mix(TAPE, PAPER, 0.4));
  // 메모지 둘 (노랑 · 분홍)
  const notes = [[tx + tw + 8, 6, hex('#f4dc78')], [tx + tw + 30, 18, hex('#f4b8c0')]] as const;
  for (const [nx, ny, c] of notes) {
    if (nx + 26 > W) continue;
    p.rect(nx, ny, 24, 24, c);
    p.rect(nx, ny, 24, 2, shade(c, -0.1));
    p.tri(nx + 24, ny + 24, nx + 18, ny + 24, nx + 24, ny + 18, shade(c, -0.25));
    for (let y = ny + 6; y < ny + 20; y += 4) for (let x = nx + 3; x < nx + 20; x++) if (hash2(x, y, 182) < 0.65) p.set(x, y, MARKER);
    p.oval(nx + 12, ny + 1, 2, 2, hex('#c84a44'));
    p.set(nx + 11, ny, hex('#f0a090'));
  }
  return { pix: p.outline(), ox: 0, oy: -H, wall: true };
}

function deskEdge(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const wd = OAK;
  // 윗면 끝 (둥글게 깎은 모서리 하이라이트)
  p.rect(0, 0, W, 6, shade(wd, 0.1));
  grain(p, 0, 1, W, 4, shade(wd, 0.1), 191);
  p.rect(0, 5, W, 1, shade(wd, 0.45));
  // 앞판 (두께 14)
  p.rect(0, 6, W, 14, shade(wd, -0.18));
  grain(p, 0, 8, W, 11, shade(wd, -0.18), 192);
  p.rect(0, 6, W, 1, shade(wd, -0.05));
  p.rect(0, 19, W, 1, shade(wd, -0.5));
  // 아래로 떨어지는 어둠 (낭떠러지)
  for (let y = 20; y < H; y++) p.rect(0, y, W, 1, mix(hex('#3a2a28'), hex('#5a4438'), (y - 20) / (H - 20)));
  return { pix: p, ox: 0, oy: -H, faces: { top: [0, 0, W, 5], front: [0, 7, W, 12], side: [0, 21, W, H - 21] } };
}

function numberPad(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const on = /\bon\b/.test(opt);
  const digit = opt.match(/\d/)?.[0] ?? '1';
  const c = on ? hex('#f4d878') : hex('#ece2cc');
  const th = on ? 1 : 4;
  const y0 = H - 20 - th + (on ? 0 : 0);
  const faces = block3(p, 2, y0, W - 4, 17, th, shade(c, -0.08), 2, c);
  p.rect(3, y0 + 1, W - 9, 15, c);
  p.rect(4, y0 + 2, W - 11, 13, shade(c, -0.05));
  drawGlyph(p, digit, Math.floor(W / 2) - 3, y0 + 3, on ? hex('#c8483c') : hex('#5a4a40'));
  p.outline();
  return { pix: p, ox: 0, oy: -H, faces };
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
    case 'fan': return fan(W, H, opt);
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
    default: return propsB(kind, w, h, opt) ?? moveSprite(kind, w, h, opt);
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
    default: return null;
  }
}
