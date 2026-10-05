/** 지도 위 소품(나무·바위·사탕 나무…)과 건물 그림 */
import type { StructureKind } from '../../core/maps.ts';
import { Pix, hash2, hex, shade, type Color } from './paint.ts';
import { T } from './tiles.ts';

const INK = hex('#1c1424');

export interface Sprite {
  pix: Pix;
  /** 그림 왼쪽 위 = 칸 왼쪽 위 + (ox, oy) */
  ox: number;
  oy: number;
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
    const p = new Pix(36, 48);
    p.bar(15, 30, 6, 16, hex('#7a4e2c'));
    p.oval(18, 46, 9, 2, shade(hex('#3e7a34'), -0.4));
    const leaf = [hex('#4f9a44'), hex('#5aa64a'), hex('#47903e')][k];
    p.ball(18, 18, 15, 13, shade(leaf, -0.1), true);
    p.ball(11, 20, 8, 7, leaf, true);
    p.ball(25, 20, 8, 7, leaf, true);
    p.ball(18, 12, 10, 8, shade(leaf, 0.08), true);
    if (k === 1) for (const [x, y] of [[10, 16], [24, 12], [20, 22]]) p.ball(x, y, 1.4, 1.4, hex('#ff6a6a'));
    return p.outline();
  });
}

function pine(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`pine${k}`, () => {
    const p = new Pix(32, 50);
    p.bar(14, 38, 5, 10, hex('#6a4426'));
    const g = k ? hex('#2e7a52') : hex('#357e4a');
    for (let i = 0; i < 4; i++) {
      const y = 8 + i * 8;
      const w = 6 + i * 3;
      p.tri(16 - w, y + 12, 16 + w, y + 12, 16, y - 4, shade(g, -0.12 + i * 0.03));
      p.tri(16 - w + 2, y + 10, 16, y + 10, 16, y - 2, shade(g, 0.12));
    }
    return p.outline();
  });
}

function bush(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`bush${k}`, () => {
    const p = new Pix(24, 20);
    const g = hex('#4a9440');
    p.ball(8, 12, 7, 6, g, true);
    p.ball(16, 12, 7, 6, shade(g, -0.05), true);
    p.ball(12, 8, 7, 6, shade(g, 0.08), true);
    if (k) for (const [x, y] of [[7, 9], [15, 7], [17, 13]]) p.set(x, y, hex('#ffe06a'));
    return p.outline();
  });
}

function rock(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`rock${k}`, () => {
    const p = new Pix(20, 16);
    p.ball(10, 9, 9, 6.5, hex('#9a96a0'));
    if (k) p.ball(14, 11, 4, 3, hex('#8a8690'));
    p.line(6, 8, 9, 10, shade(hex('#9a96a0'), -0.3));
    return p.outline();
  });
}

function fence(): Pix {
  return cached('fence', () => {
    const p = new Pix(24, 18);
    const w = hex('#c8955a');
    p.bar(3, 2, 4, 15, w);
    p.bar(17, 2, 4, 15, w);
    p.rect(0, 6, 24, 3, shade(w, 0.05));
    p.rect(0, 12, 24, 3, shade(w, -0.05));
    return p.outline();
  });
}

function lollipop(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`lolli${k}`, () => {
    const p = new Pix(24, 44);
    p.bar(11, 20, 3, 23, hex('#f4f0e8'));
    const cols = [hex('#ff5a8a'), hex('#5ac8f0'), hex('#a0e05a')];
    p.ball(12, 12, 11, 11, cols[k]);
    for (let a = 0; a < 3; a++) {
      for (let t = 0; t < 30; t++) {
        const r = t / 3;
        const ang = t * 0.42 + a * 2.1;
        p.set(Math.round(12 + Math.cos(ang) * r), Math.round(12 + Math.sin(ang) * r), hex('#ffffff'));
      }
    }
    return p.outline();
  });
}

function cookieBlock(v: number): Pix {
  const k = Math.floor(v * 2);
  return cached(`cookie${k}`, () => {
    const p = new Pix(24, 32);
    const c = hex('#c88a4a');
    p.rect(0, 8, 24, 24, shade(c, -0.15));
    p.rect(0, 0, 24, 10, c);
    p.rect(0, 0, 24, 2, shade(c, 0.25));
    for (const [x, y] of [[5, 16], [15, 20], [10, 26]]) p.oval(x, y, 1.6, 1.6, hex('#5a3420'));
    if (k) {
      p.rect(0, 2, 24, 3, hex('#ffffff'));
      for (let x = 2; x < 24; x += 5) p.rect(x, 5, 2, 2 + (x % 3), hex('#ffffff'));
    }
    return p.outline();
  });
}

function crystal(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`crystal${k}`, () => {
    const p = new Pix(20, 28);
    const cols = [hex('#7ad8ff'), hex('#c890ff'), hex('#8affc8')];
    const c = cols[k];
    p.tri(4, 26, 12, 26, 8, 4, shade(c, -0.1));
    p.tri(9, 26, 17, 26, 13, 10, c);
    p.tri(6, 26, 9, 26, 8, 8, shade(c, 0.4));
    return p.outline();
  });
}

// ───────────────────────── 건물 ─────────────────────────

const ROOF: Partial<Record<StructureKind, Color>> = { chief: hex('#8a5ac8'), shop: hex('#e05a4a'), forge: hex('#6a7888'), tailor: hex('#f08ab0'), house: hex('#d0784a') };

/** 건물 그림. 칸 사각형(x,y,w,h) 위로 지붕이 솟는다 */
export function structureSprite(kind: StructureKind, w: number, h: number, frame = 0): Sprite {
  const key = `${kind}${w}x${h}f${frame}`;
  switch (kind) {
    case 'chief':
    case 'shop':
    case 'forge':
    case 'tailor':
    case 'house':
      return { pix: cached(key, () => house(kind, w * T, h * T)), ox: 0, oy: -14 };
    case 'fountain':
      return { pix: cached(key, () => fountain(frame)), ox: -6, oy: -16 };
    case 'well':
      return { pix: cached(key, () => well()), ox: 0, oy: -16 };
    case 'board':
      return { pix: cached(key, () => board()), ox: 2, oy: -10 };
    case 'lamp':
      return { pix: cached(key, () => lamp()), ox: -1, oy: -18 };
    case 'tent':
      return { pix: cached(key, () => tent(w * T, h * T)), ox: 0, oy: -12 };
    case 'gate':
      return { pix: cached(key, () => gate(w * T, h * T)), ox: 0, oy: -8 };
    case 'altar':
      return { pix: cached(key, () => altar(frame)), ox: 0, oy: -8 };
    case 'cart':
      return { pix: cached(key, () => cart()), ox: 0, oy: 0 };
    case 'portal':
      return { pix: cached(key, () => portalArt(frame)), ox: -8, oy: -24 };
    case 'cocoon':
      return { pix: cached(key, () => cocoon(frame)), ox: 0, oy: -14 };
    case 'chest':
      return { pix: cached(key, () => chest(frame)), ox: 0, oy: -6 };
    case 'ladder':
      return { pix: cached(key, () => ladder(h * T)), ox: 4, oy: -10 };
    case 'door':
      return { pix: cached(key, () => door(w * T, h * T)), ox: 0, oy: -8 };
    case 'slide':
      return { pix: cached(key, () => slide()), ox: 0, oy: -20 };
    case 'stage':
      return { pix: cached(key, () => stage(frame)), ox: 0, oy: -18 };
  }
}

/** 원목 블록이 절반쯤, 나머지는 차분하게 칠한 블록 */
const BLOCK_COLORS = ['#cfa06a', '#cfa06a', '#c48f5a', '#c8574b', '#4f7fb8', '#e0b04a', '#5f9a62', '#d98fa0', '#8a76b8'].map(hex);
const WOODEN = 3;
const LETTERS = ['ㄱ', 'A', '★', '♥', '1', 'ㅋ', 'B', '○'];

/** 블록 한 개 (윗면 + 앞면). 원목은 글자를 새기고, 칠한 블록은 크림색 글자 */
function blockFace(p: Pix, x0: number, y0: number, c: Color, letter: string | null, wooden: boolean): void {
  const top = shade(c, 0.22);
  // 윗면 (모서리를 깎은 판)
  p.rect(x0 + 1, y0, 22, 10, top);
  p.rect(x0 + 1, y0, 22, 1, shade(top, 0.25));
  p.rect(x0 + 2, y0 + 2, 20, 6, shade(top, -0.04));
  // 앞면
  p.rect(x0, y0 + 10, 24, 24, c);
  p.rect(x0, y0 + 10, 24, 1, shade(c, 0.3));
  p.rect(x0 + 21, y0 + 10, 3, 24, shade(c, -0.18));
  p.rect(x0, y0 + 32, 24, 2, shade(c, -0.4));
  // 둘레 홈 (판)
  const groove = shade(c, -0.2);
  p.rect(x0 + 3, y0 + 13, 16, 1, groove);
  p.rect(x0 + 3, y0 + 13, 1, 17, groove);
  p.rect(x0 + 3, y0 + 29, 16, 1, shade(c, 0.12));
  p.rect(x0 + 18, y0 + 13, 1, 17, shade(c, 0.12));
  if (wooden) {
    // 나뭇결
    for (let i = 0; i < 4; i++) p.rect(x0 + 1, y0 + 15 + i * 4 + (i % 2), 2, 1, shade(c, -0.1));
    for (let i = 0; i < 3; i++) p.rect(x0 + 4 + i * 6, y0 + 3 + (i % 2) * 3, 4, 1, shade(top, -0.1));
  }
  if (!letter) return;
  const mark = wooden ? shade(c, -0.42) : hex('#f2e6cc');
  const cx = x0 + 11;
  const cy = y0 + 21;
  switch (letter) {
    case '★':
      p.tri(cx, cy - 6, cx - 4, cy + 5, cx + 4, cy + 5, mark);
      p.tri(cx - 5, cy - 2, cx + 5, cy - 2, cx, cy + 3, mark);
      break;
    case '♥':
      p.ball(cx - 2, cy - 2, 2.5, 2.5, mark);
      p.ball(cx + 2, cy - 2, 2.5, 2.5, mark);
      p.tri(cx - 5, cy - 1, cx + 5, cy - 1, cx, cy + 5, mark);
      break;
    case 'A':
      p.line(cx - 4, cy + 5, cx, cy - 5, mark);
      p.line(cx + 4, cy + 5, cx, cy - 5, mark);
      p.line(cx - 2, cy + 1, cx + 2, cy + 1, mark);
      break;
    case 'B':
      p.rect(cx - 3, cy - 5, 2, 11, mark);
      p.rect(cx - 3, cy - 5, 5, 2, mark);
      p.rect(cx - 3, cy, 5, 1, mark);
      p.rect(cx - 3, cy + 4, 5, 2, mark);
      p.rect(cx + 2, cy - 4, 1, 4, mark);
      p.rect(cx + 2, cy + 1, 1, 3, mark);
      break;
    case '○':
      p.oval(cx, cy, 4.5, 4.5, mark);
      p.oval(cx, cy, 2.5, 2.5, wooden ? c : c);
      break;
    case '1':
      p.rect(cx - 1, cy - 5, 2, 10, mark);
      p.line(cx - 3, cy - 3, cx - 1, cy - 5, mark);
      break;
    case 'ㄱ':
      p.rect(cx - 4, cy - 4, 8, 2, mark);
      p.rect(cx + 2, cy - 4, 2, 9, mark);
      break;
    default:
      p.rect(cx - 4, cy - 4, 8, 2, mark);
      p.rect(cx + 2, cy - 4, 2, 9, mark);
      p.rect(cx - 3, cy, 6, 2, mark);
  }
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
    const y0 = tall ? 22 : 0;
    blockFace(p, 0, y0, BLOCK_COLORS[k], li >= 0 ? LETTERS[li] : null, k < WOODEN);
    if (tall) blockFace(p, 0, 0, BLOCK_COLORS[k2], li2 >= 0 ? LETTERS[li2] : null, k2 < WOODEN);
    return p.outline(hex('#24160f'));
  });
}

/** 굴러다니는 구슬 */
function marbleProp(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`marble${k}`, () => {
    const c = [hex('#7ad0ff'), hex('#ff8ab8'), hex('#8ae070')][k];
    const p = new Pix(18, 18);
    p.ball(9, 9, 8, 8, c);
    p.line(4, 10, 13, 6, hex('#ffffff'));
    p.line(5, 12, 12, 9, shade(c, 0.4));
    p.set(6, 5, hex('#ffffff'));
    return p.outline();
  });
}

/** 먼지 고치: 회색 먼지 뭉치가 꿈틀댄다. 사이로 동료 털빛이 보인다 */
function cocoon(frame: number): Pix {
  const p = new Pix(48, 62);
  const dust = hex('#8a8098');
  const wob = frame % 2;
  p.oval(24, 58, 18, 4, shade(dust, -0.5));
  p.ball(24, 36 - wob, 19, 22, dust, true);
  for (let i = 0; i < 14; i++) {
    const a = i * 0.9 + frame * 0.3;
    p.ball(24 + Math.cos(a) * 15, 36 + Math.sin(a) * 18, 4, 4, shade(dust, (i % 3) * 0.08 - 0.08), true);
  }
  // 틈 사이 반짝
  p.oval(24, 34 - wob, 5, 8, hex('#ffe8b0'));
  p.oval(24, 34 - wob, 3, 6, hex('#ffd060'));
  for (const [x, y] of [[12, 18], [36, 22], [30, 50]]) p.set(x, y + wob, hex('#ffffff'));
  return p.outline();
}

/** 보물 상자 (frame 1: 열림) */
function chest(frame: number): Pix {
  const p = new Pix(48, 46);
  const wood = hex('#b07a40');
  const gold = hex('#ffc83a');
  p.oval(24, 43, 20, 3, shade(wood, -0.6));
  p.rect(4, 22, 40, 20, wood);
  p.rect(4, 22, 40, 2, shade(wood, 0.2));
  for (const x of [4, 40]) p.rect(x, 22, 4, 20, gold);
  p.rect(4, 40, 40, 2, shade(wood, -0.45));
  if (frame === 1) {
    // 열린 뚜껑과 빈 속
    p.rect(6, 18, 36, 6, hex('#3a2010'));
    p.rect(4, 4, 40, 12, shade(wood, -0.1));
    p.rect(4, 14, 40, 3, gold);
  } else {
    p.ball(24, 18, 20, 9, wood);
    p.rect(4, 18, 40, 5, wood);
    for (const x of [4, 40]) p.rect(x, 12, 4, 11, gold);
    p.rect(20, 20, 8, 8, gold);
    p.rect(23, 23, 2, 3, hex('#3a2010'));
    p.set(10, 13, hex('#ffffff'));
  }
  return p.outline();
}

/** 다락방 사다리 */
function ladder(H: number): Pix {
  const p = new Pix(40, H + 10);
  const wood = hex('#c8955a');
  for (const x of [4, 32]) p.bar(x, 0, 4, H + 8, wood);
  for (let y = 6; y < H + 6; y += 9) p.rect(6, y, 28, 3, shade(wood, -0.1));
  return p.outline();
}

function door(W: number, H: number): Pix {
  const p = new Pix(W, H + 8);
  p.rect(2, 0, W - 4, H + 8, hex('#7a4a2a'));
  p.rect(4, 2, W - 8, H + 4, hex('#9a6a3a'));
  p.ball(W - 10, H / 2 + 4, 2, 2, hex('#ffd84a'));
  return p.outline();
}

const WALL_OF: Partial<Record<StructureKind, Color>> = { chief: hex('#e9dcc0'), shop: hex('#ecd2a8'), forge: hex('#aaa49c'), tailor: hex('#f0d8d4'), house: hex('#e2cfa8') };

/** 장난감 벽돌로 쌓은 집: 비늘 지붕, 둥근 다락 창, 불 켜진 창문 */
function house(kind: StructureKind, W: number, H: number): Pix {
  const p = new Pix(W, H + 14);
  const roof = ROOF[kind] ?? hex('#d0784a');
  const wall = WALL_OF[kind] ?? hex('#e2cfa8');
  const wallTop = Math.floor(H * 0.48) + 14;
  const bottom = H + 12;
  // 벽돌 벽
  for (let y = wallTop; y < bottom; y++) {
    const row = Math.floor((y - wallTop) / 10);
    const ry = (y - wallTop) % 10;
    for (let x = 6; x < W - 6; x++) {
      const bx = (x - 6 + (row % 2) * 10) % 20;
      let c = shade(wall, (hash2(Math.floor((x - 6 + (row % 2) * 10) / 20), row, 90) - 0.5) * 0.08);
      if (ry === 9 || bx === 19) c = shade(wall, -0.22);
      else if (ry === 0 || bx === 0) c = shade(c, 0.12);
      p.set(x, y, c);
    }
  }
  p.rect(6, bottom - 2, W - 12, 2, shade(wall, -0.4));
  // 모서리 기둥 (둥근 블록)
  for (const x of [3, W - 11]) p.bar(x, wallTop - 2, 8, bottom - wallTop + 2, shade(roof, -0.15));
  // 지붕: 삼각 박공 + 비늘 기와
  const rh = wallTop + 4;
  const cx = W / 2;
  for (let y = 4; y < rh; y++) {
    const half = ((y - 4) / (rh - 4)) * (W / 2 + 2);
    const row = Math.floor((y - 4) / 7);
    const ry = (y - 4) % 7;
    for (let x = Math.floor(cx - half); x < cx + half; x++) {
      const sx = (x + (row % 2) * 6) % 12;
      const scallop = Math.hypot(sx - 6, ry - 1) < 6.5;
      let c = scallop ? roof : shade(roof, -0.25);
      if (ry === 0) c = shade(roof, 0.18);
      p.set(x, y, c);
    }
  }
  // 처마 (두꺼운 테)
  for (let i = 0; i < 4; i++) p.line(cx, 1 + i, -2, rh - 2 + i, shade(roof, i < 2 ? 0.3 : -0.35));
  for (let i = 0; i < 4; i++) p.line(cx, 1 + i, W + 1, rh - 2 + i, shade(roof, i < 2 ? 0.1 : -0.45));
  p.ball(cx, 3, 4, 4, hex('#e0b04a'));
  // 둥근 다락 창
  const ay = Math.floor(rh * 0.55);
  p.oval(cx, ay, 9, 9, shade(roof, -0.45));
  p.oval(cx, ay, 7, 7, hex('#ffe3a0'));
  p.oval(cx - 2, ay - 2, 3, 3, hex('#fff4d0'));
  p.rect(cx - 0.5, ay - 7, 1, 14, shade(roof, -0.45));
  p.rect(cx - 7, ay - 0.5, 14, 1, shade(roof, -0.45));
  // 아치 문
  const dx = Math.floor(W / 2) - 9;
  p.rect(dx, H - 12, 18, 24, hex('#7a4a2a'));
  p.oval(dx + 9, H - 12, 9, 6, hex('#7a4a2a'));
  p.rect(dx + 2, H - 10, 14, 22, hex('#94603a'));
  p.oval(dx + 9, H - 10, 7, 4, hex('#94603a'));
  p.rect(dx + 8, H - 12, 2, 24, hex('#6a3e22'));
  p.ball(dx + 14, H + 1, 1.4, 1.4, hex('#ffd84a'));
  p.rect(dx - 3, bottom - 2, 24, 3, hex('#cfa06a'));
  // 창문 (따뜻한 불빛)
  for (const wx of [16, W - 34]) {
    p.rect(wx, wallTop + 10, 18, 16, hex('#5a3a22'));
    p.rect(wx + 2, wallTop + 12, 14, 12, hex('#ffd98a'));
    p.rect(wx + 2, wallTop + 12, 14, 4, hex('#ffeab8'));
    p.rect(wx + 8, wallTop + 12, 2, 12, hex('#5a3a22'));
    p.rect(wx + 2, wallTop + 17, 14, 1, hex('#5a3a22'));
    // 꽃 상자
    p.rect(wx - 1, wallTop + 26, 20, 4, hex('#a0603a'));
    for (const fx of [2, 7, 12, 16]) p.ball(wx + fx, wallTop + 25, 1.8, 1.8, hex(fx % 2 ? '#ff8ab0' : '#ffd84a'));
  }
  // 간판
  const sx = W - 22;
  const sy = wallTop + 4;
  if (kind === 'shop') {
    p.ball(sx, sy - 10, 7, 7, hex('#f2e4c8'));
    p.ball(sx, sy - 9, 3.5, 4, hex('#e8414f'));
    p.rect(sx - 1, sy - 15, 2, 2, hex('#c8c8d8'));
  } else if (kind === 'forge') {
    p.ball(sx, sy - 10, 7, 7, hex('#f2e4c8'));
    p.rect(sx - 4, sy - 10, 8, 3, hex('#4a4a58'));
    p.rect(sx - 2, sy - 13, 4, 3, hex('#4a4a58'));
    // 굴뚝 (블록 둘)
    p.rect(W - 40, 8, 12, 10, hex('#8a6a5a'));
    p.rect(W - 41, 4, 14, 5, hex('#a07a68'));
  } else if (kind === 'tailor') {
    p.ball(sx, sy - 10, 7, 7, hex('#f2e4c8'));
    p.line(sx - 3, sy - 7, sx + 3, sy - 13, hex('#9aa8b8'));
    p.ball(sx - 2, sy - 8, 1.5, 1.5, hex('#ff8ab8'));
  } else if (kind === 'chief') {
    // 태엽 열쇠 장식
    p.ball(cx, ay + 16, 4, 4, hex('#d8b040'));
    p.rect(cx - 0.5, ay + 18, 1, 6, hex('#8a6a20'));
  }
  return p.outline(hex('#24160f'));
}

/** 찻잔 분수 */
function fountain(frame: number): Pix {
  const p = new Pix(60, 64);
  const china = hex('#f2ede4');
  // 받침 접시
  p.oval(30, 54, 29, 9, shade(china, -0.12));
  p.oval(30, 53, 26, 7, china);
  p.oval(30, 53, 26, 7, china);
  for (let a = 0; a < 24; a++) p.set(Math.round(30 + Math.cos(a * 0.26) * 27), Math.round(54 + Math.sin(a * 0.26) * 8.4), hex('#5a7ab8'));
  // 찻잔 (아래가 둥근 그릇)
  for (let y = 26; y < 52; y++) {
    const t = (y - 26) / 26;
    const half = 22 * Math.sqrt(Math.max(0, 1 - t * t * 0.7)) - t * 4;
    for (let x = Math.floor(30 - half); x < 30 + half; x++) {
      const lx = (x - (30 - half)) / (half * 2);
      let c = lx < 0.25 ? shade(china, 0.08) : lx > 0.78 ? shade(china, -0.18) : china;
      if (y >= 31 && y < 35) c = lx > 0.78 ? shade(hex('#e48aa0'), -0.2) : hex('#e48aa0');
      if (y === 36 && Math.floor(x / 3) % 2 === 0) c = hex('#5a7ab8');
      p.set(x, y, c);
    }
  }
  // 손잡이
  for (let a = -1.4; a < 1.4; a += 0.05) {
    const x = 52 + Math.cos(a) * 6;
    const y = 36 + Math.sin(a) * 7;
    p.set(x, y, china);
    p.set(x + 1, y, shade(china, -0.2));
  }
  // 물 (찰랑)
  p.oval(30, 26, 22, 5, shade(china, -0.25));
  p.oval(30, 26, 20, 4, hex('#4a9ae0'));
  for (let i = 0; i < 5; i++) p.rect(14 + i * 7 + ((frame + i) % 2) * 2, 25 + (i % 2) * 2, 3, 1, hex('#bfe4ff'));
  // 가운데 물줄기
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + frame * 0.5;
    p.line(30, 10, 30 + Math.cos(a) * 11, 22 + Math.abs(Math.sin(a)) * 3, hex('#bfe4ff'));
  }
  p.rect(29, 4, 2, 18, hex('#e8f4ff'));
  p.ball(30, 4, 2, 2, hex('#ffffff'));
  return p.outline(hex('#24160f'));
}

function well(): Pix {
  const p = new Pix(48, 64);
  p.oval(24, 50, 20, 10, hex('#a8a098'));
  p.oval(24, 48, 15, 6, hex('#2a3a5a'));
  for (const x of [6, 38]) p.bar(x, 14, 4, 34, hex('#8a5a34'));
  for (let y = 0; y < 14; y++) p.rect(y * 0.6, y, 48 - y * 1.2, 1, y % 4 === 3 ? hex('#8a3a2a') : hex('#c85a3a'));
  p.rect(22, 14, 4, 20, hex('#c8c8c8'));
  p.bar(20, 30, 8, 6, hex('#8a5a34'));
  return p.outline();
}

function board(): Pix {
  const p = new Pix(44, 50);
  for (const x of [4, 36]) p.bar(x, 10, 4, 38, hex('#8a5a34'));
  p.rect(0, 6, 44, 28, hex('#a8743e'));
  p.rect(0, 6, 44, 2, hex('#c8955a'));
  for (const [x, y, c] of [[4, 11, '#f2e4c8'], [18, 10, '#ffe08a'], [30, 13, '#f2e4c8'], [10, 22, '#c8e8ff']] as const) {
    p.rect(x, y, 10, 10, hex(c));
    p.rect(x + 4, y, 2, 2, hex('#e8414f'));
  }
  return p.outline();
}

/** 버섯 야간등 */
function lamp(): Pix {
  const p = new Pix(26, 50);
  const stem = hex('#efe4cc');
  p.oval(13, 47, 9, 2.5, hex('#8a6a4a'));
  p.bar(10, 20, 6, 27, stem);
  p.rect(9, 44, 8, 3, shade(stem, -0.2));
  // 빛나는 갓
  p.ball(13, 14, 12, 10, hex('#ffd27a'), true);
  p.rect(1, 14, 24, 6, hex('#ffd27a'));
  p.ball(13, 11, 9, 6, hex('#ffe9b0'), true);
  for (const [x, y, r] of [[7, 10, 2.2], [17, 8, 1.8], [19, 14, 1.6], [10, 16, 1.5]] as const) p.ball(x, y, r, r, hex('#ff9a6a'));
  p.rect(1, 19, 24, 2, hex('#e0a050'));
  return p.outline(hex('#24160f'));
}

function tent(W: number, H: number): Pix {
  const p = new Pix(W, H + 12);
  const a = hex('#ff8ab8');
  const b = hex('#ffffff');
  for (let x = 0; x < W; x++) {
    const top = Math.abs(x - W / 2) * 0.6;
    for (let y = Math.floor(top); y < H + 10; y++) p.set(x, y, Math.floor(x / 8) % 2 ? a : b);
  }
  p.rect(W / 2 - 8, H - 12, 16, 22, hex('#7a3a5a'));
  p.ball(W / 2, 2, 3, 3, hex('#ffd84a'));
  return p.outline();
}

function gate(W: number, H: number): Pix {
  const p = new Pix(W, H + 8);
  const r = hex('#8a8098');
  p.ball(W / 2, H / 2 + 6, W / 2, H / 2 + 4, r);
  p.oval(W / 2, H / 2 + 12, W / 2 - 14, H / 2 - 2, hex('#1a1424'));
  // 태엽 자물쇠 장식
  p.ball(W / 2, 6, 6, 6, hex('#d8b040'));
  p.rect(W / 2 - 1, 2, 2, 8, hex('#8a6a20'));
  return p.outline();
}

function altar(frame: number): Pix {
  const p = new Pix(48, 56);
  p.bar(8, 24, 32, 28, hex('#8a8098'));
  p.rect(4, 20, 40, 6, hex('#a8a0b8'));
  p.ball(24, 12 + frame, 8, 8, hex('#ffd84a'));
  p.ball(24, 12 + frame, 4, 4, hex('#fff4c0'));
  return p.outline();
}

function cart(): Pix {
  const p = new Pix(48, 44);
  p.rect(2, 10, 44, 18, hex('#a8743e'));
  p.rect(2, 10, 44, 2, hex('#c8955a'));
  for (const [x, c] of [[8, '#ff6a6a'], [18, '#ffd84a'], [28, '#6ad86a'], [38, '#ff9a3c']] as const) p.ball(x, 9, 4, 4, hex(c));
  for (const x of [10, 38]) {
    p.ball(x, 32, 7, 7, hex('#6a4426'));
    p.ball(x, 32, 2, 2, hex('#c8955a'));
  }
  return p.outline();
}

function portalArt(frame: number): Pix {
  const p = new Pix(64, 72);
  p.oval(32, 64, 26, 7, hex('#4a3a6a'));
  for (let i = 0; i < 3; i++) p.oval(32, 36, 22 - i * 6, 28 - i * 7, [hex('#5a3ad8'), hex('#8a5aff'), hex('#d8c8ff')][i]);
  for (let t = 0; t < 40; t++) {
    const a = t * 0.5 + frame * 0.8;
    const r = 4 + t * 0.45;
    p.set(Math.round(32 + Math.cos(a) * r * 0.8), Math.round(36 + Math.sin(a) * r), hex('#ffffff'));
  }
  return p.outline();
}

/** 나무 상자 (공장) */
function crate(v: number): Pix {
  const p = new Pix(22, 28);
  const wood = v < 0.5 ? hex('#b07a40') : hex('#a06a38');
  p.rect(1, 8, 20, 19, wood);
  p.rect(1, 1, 20, 8, shade(wood, 0.18));
  p.rect(1, 8, 20, 1, shade(wood, -0.35));
  for (const x of [1, 19]) p.rect(x, 1, 2, 26, shade(wood, -0.25));
  p.line(3, 10, 18, 25, shade(wood, -0.3));
  p.line(3, 25, 18, 10, shade(wood, -0.3));
  p.rect(1, 26, 20, 1, shade(wood, -0.45));
  if (v > 0.7) {
    p.rect(8, 2, 6, 5, hex('#e0b030'));
    p.set(10, 4, hex('#5a4020'));
  }
  return p.outline();
}

/** 책상 위 물건: 지우개 · 시계 톱니 · 연필깎이 */
function deskThing(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`desk${k}`, () => {
    const p = new Pix(24, 32);
    if (k === 0) {
      // 지우개: 분홍 몸 + 파란 띠
      p.rect(2, 12, 20, 18, hex('#ff9ab8'));
      p.rect(2, 8, 20, 5, hex('#ffc0d4'));
      p.rect(2, 16, 20, 6, hex('#3a6ab8'));
      p.rect(4, 18, 16, 1, hex('#ffffff'));
      p.rect(2, 29, 20, 1, hex('#c86a88'));
    } else if (k === 1) {
      // 시계 톱니
      const c = hex('#d8b040');
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) p.rect(Math.round(10 + Math.cos(a) * 10), Math.round(18 + Math.sin(a) * 10), 4, 4, c);
      p.ball(12, 20, 9, 9, c);
      p.ball(12, 20, 3, 3, hex('#5a4020'));
    } else {
      // 연필깎이
      p.rect(3, 12, 18, 18, hex('#e04a4a'));
      p.rect(3, 8, 18, 5, hex('#ff7a7a'));
      p.ball(12, 20, 4, 4, hex('#2a1a1a'));
      p.rect(20, 18, 4, 3, hex('#c8c8d0'));
    }
    return p.outline();
  });
}

/** 침대 밑 잃어버린 물건: 야광 별 · 단추 · 양말 한 짝 (빛이 난다) */
function lostThing(v: number): Pix {
  const k = Math.floor(v * 3);
  return cached(`lost${k}`, () => {
    const p = new Pix(20, 22);
    if (k === 0) {
      const c = hex('#c8ff9a');
      p.tri(10, 1, 3, 20, 17, 20, c);
      p.tri(1, 8, 19, 8, 10, 16, c);
      p.set(10, 9, hex('#ffffff'));
    } else if (k === 1) {
      p.ball(10, 12, 8, 8, hex('#9ad8ff'));
      for (const [x, y] of [[8, 10], [12, 10], [8, 14], [12, 14]]) p.set(x, y, hex('#2a3a5a'));
    } else {
      const c = hex('#f0f0f8');
      p.rect(4, 2, 7, 12, c);
      p.ball(10, 16, 7, 4, c, true);
      for (let y = 3; y < 13; y += 3) p.rect(4, y, 7, 1, hex('#5ad88a'));
    }
    return p.outline();
  });
}

/** 놀이터 미끄럼틀 */
function slide(): Pix {
  const p = new Pix(72, 68);
  const red = hex('#e8414f');
  const blue = hex('#3a8ae0');
  for (const x of [4, 22]) p.bar(x, 10, 4, 54, blue);
  for (let y = 16; y < 60; y += 8) p.rect(4, y, 22, 2, shade(blue, 0.2));
  p.rect(2, 8, 28, 5, red);
  for (let i = 0; i < 40; i++) p.rect(26 + i, 12 + i * 1.2, 6, 4, i % 2 ? shade(hex('#ffc83a'), 0.1) : hex('#ffc83a'));
  return p.outline();
}

/** 축제 무대: 깃발 줄과 반짝 조명 */
function stage(frame: number): Pix {
  const p = new Pix(96, 90);
  const wood = hex('#b07a40');
  p.rect(4, 50, 88, 30, wood);
  p.rect(4, 50, 88, 3, shade(wood, 0.25));
  for (let x = 4; x < 92; x += 10) p.rect(x, 53, 1, 27, shade(wood, -0.3));
  for (const x of [6, 86]) p.bar(x, 8, 4, 44, hex('#8a5a34'));
  const flags = [hex('#e8414f'), hex('#ffc83a'), hex('#3a8ae0'), hex('#4fb04a'), hex('#f08ab0')];
  for (let i = 0; i < 9; i++) {
    const x = 10 + i * 9;
    const y = 10 + Math.round(Math.sin((i / 8) * Math.PI) * 8);
    p.tri(x, y, x + 7, y, x + 3, y + 8, flags[(i + frame) % flags.length]);
  }
  p.ball(48, 36, 6, 6, hex('#ffe08a'));
  return p.outline();
}
