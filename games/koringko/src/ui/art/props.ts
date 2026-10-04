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
    case 'Q':
      return { pix: toyBlock(tx, ty), ox: 0, oy: -10 };
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
      return { pix: cached(key, () => lamp()), ox: 6, oy: -18 };
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
  }
}

const BLOCK_COLORS = ['#e8414f', '#3a8ae0', '#ffc83a', '#4fb04a', '#f08ab0', '#9a6ad8'].map(hex);
const LETTERS = ['ㄱ', 'A', '★', '♥', '1', 'ㅋ'];

/** 장난감 블록 (마을 · 장난감 상자 벽): 윗면에 동그란 돌기, 앞면에 글자 */
function toyBlock(tx: number, ty: number): Pix {
  const k = Math.floor(hash2(tx, ty, 71) * BLOCK_COLORS.length);
  return cached(`block${k}`, () => {
    const c = BLOCK_COLORS[k];
    const p = new Pix(24, 34);
    // 윗면
    p.rect(0, 0, 24, 10, shade(c, 0.2));
    for (const x of [6, 17]) {
      p.oval(x, 5, 3.5, 2.4, shade(c, 0.35));
      p.rect(x - 3, 5, 7, 2, shade(c, 0.05));
    }
    // 앞면
    p.rect(0, 10, 24, 24, c);
    p.rect(0, 10, 24, 1, shade(c, -0.3));
    p.rect(22, 10, 2, 24, shade(c, -0.25));
    p.rect(0, 32, 24, 2, shade(c, -0.45));
    // 글자 판
    p.rect(5, 14, 14, 14, shade(c, 0.45));
    const mark = shade(c, -0.45);
    switch (LETTERS[k]) {
      case '★':
        p.tri(12, 15, 8, 26, 16, 26, mark);
        p.tri(7, 19, 17, 19, 12, 24, mark);
        break;
      case '♥':
        p.ball(10, 19, 2.5, 2.5, mark);
        p.ball(14, 19, 2.5, 2.5, mark);
        p.tri(7, 20, 17, 20, 12, 26, mark);
        break;
      case 'A':
        p.line(8, 26, 12, 16, mark);
        p.line(16, 26, 12, 16, mark);
        p.line(10, 22, 14, 22, mark);
        break;
      case '1':
        p.rect(11, 16, 2, 10, mark);
        p.line(9, 18, 11, 16, mark);
        break;
      case 'ㄱ':
        p.rect(8, 17, 8, 2, mark);
        p.rect(14, 17, 2, 9, mark);
        break;
      default:
        p.rect(8, 17, 8, 2, mark);
        p.rect(14, 17, 2, 9, mark);
        p.rect(9, 21, 6, 2, mark);
    }
    return p.outline();
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

function house(kind: StructureKind, W: number, H: number): Pix {
  const p = new Pix(W, H + 14);
  const roof = ROOF[kind] ?? hex('#d0784a');
  const wall = kind === 'forge' ? hex('#b8aa98') : hex('#f2e4c8');
  const wallTop = Math.floor(H * 0.48) + 14;
  // 벽
  p.rect(6, wallTop, W - 12, H + 14 - wallTop - 2, wall);
  p.rect(6, wallTop, W - 12, 2, shade(wall, -0.25));
  for (const x of [6, W - 10]) p.bar(x, wallTop, 4, H + 14 - wallTop - 2, hex('#8a5a34'));
  p.rect(6, H + 10, W - 12, 2, shade(wall, -0.35));
  // 지붕
  const rh = wallTop + 2;
  for (let y = 0; y < rh; y++) {
    const inset = Math.max(0, Math.round((rh - y) * 0.18));
    const c = y % 6 === 5 ? shade(roof, -0.3) : y < rh * 0.3 ? shade(roof, 0.15) : roof;
    p.rect(inset, y, W - inset * 2, 1, c);
  }
  for (let x = 4; x < W - 4; x += 8) p.rect(x, 2, 1, rh - 4, shade(roof, -0.18));
  p.rect(0, rh - 2, W, 3, shade(roof, -0.4));
  // 문
  const dx = Math.floor(W / 2) - 8;
  p.rect(dx, H - 14, 16, 24, hex('#7a4a2a'));
  p.rect(dx + 1, H - 13, 14, 1, hex('#9a6a3a'));
  p.ball(dx + 12, H - 2, 1.2, 1.2, hex('#ffd84a'));
  p.rect(dx - 2, H + 10, 20, 2, shade(wall, -0.4));
  // 창문 (따뜻한 불빛)
  for (const wx of [14, W - 30]) {
    p.rect(wx, wallTop + 10, 16, 12, hex('#5a3a22'));
    p.rect(wx + 2, wallTop + 12, 12, 8, hex('#ffe08a'));
    p.rect(wx + 7, wallTop + 12, 2, 8, hex('#5a3a22'));
    p.rect(wx + 2, wallTop + 15, 12, 1, hex('#5a3a22'));
    p.rect(wx - 1, wallTop + 22, 18, 3, hex('#4f9a44'));
  }
  // 간판
  const sx = W - 24;
  const sy = wallTop - 4;
  if (kind === 'shop') {
    p.ball(sx, sy, 6, 6, hex('#f2e4c8'));
    p.ball(sx, sy + 1, 3, 3.5, hex('#e8414f'));
    p.rect(sx - 1, sy - 4, 2, 2, hex('#c8c8d8'));
  } else if (kind === 'forge') {
    p.ball(sx, sy, 6, 6, hex('#f2e4c8'));
    p.rect(sx - 4, sy, 8, 3, hex('#4a4a58'));
    p.rect(sx - 2, sy - 3, 4, 3, hex('#4a4a58'));
    // 굴뚝
    p.bar(W - 22, 0, 8, 14, hex('#8a6a5a'));
  } else if (kind === 'chief') {
    p.ball(Math.floor(W / 2), 10, 7, 7, hex('#f2e4c8'));
    p.line(Math.floor(W / 2), 10, Math.floor(W / 2), 5, INK);
    p.line(Math.floor(W / 2), 10, Math.floor(W / 2) + 3, 11, INK);
  } else if (kind === 'tailor') {
    p.ball(sx, sy, 6, 6, hex('#f2e4c8'));
    p.line(sx - 3, sy + 3, sx + 3, sy - 3, hex('#9aa8b8'));
    p.ball(sx - 2, sy + 2, 1.5, 1.5, hex('#ff8ab8'));
  }
  return p.outline();
}

function fountain(frame: number): Pix {
  const p = new Pix(60, 64);
  p.oval(30, 48, 28, 14, hex('#b8b0a0'));
  p.oval(30, 47, 25, 11, hex('#4a9ae0'));
  for (let i = 0; i < 6; i++) p.rect(10 + i * 7 + frame * 2, 44 + (i % 2) * 4, 3, 1, hex('#bfe4ff'));
  p.bar(26, 22, 8, 26, hex('#cfc4ae'));
  p.oval(30, 22, 10, 4, hex('#b8b0a0'));
  p.oval(30, 21, 8, 3, hex('#5aaaf0'));
  // 물줄기
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + frame * 0.5;
    p.line(30, 14, 30 + Math.cos(a) * 12, 18 + Math.abs(Math.sin(a)) * 4, hex('#bfe4ff'));
  }
  p.rect(29, 6, 2, 10, hex('#e8f4ff'));
  return p.outline();
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

function lamp(): Pix {
  const p = new Pix(14, 50);
  p.bar(5, 12, 4, 36, hex('#4a4a58'));
  p.rect(2, 46, 10, 3, hex('#4a4a58'));
  p.rect(2, 2, 10, 12, hex('#3a3a48'));
  p.rect(4, 4, 6, 8, hex('#ffe08a'));
  p.rect(1, 0, 12, 2, hex('#3a3a48'));
  return p.outline();
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
