/** 네 인형 그림: 방향 4 × (서기 · 걷기 2 · 공격) */
import type { HeroId } from '../../core/types.ts';
import { Pix, hex, shade, type Color } from './paint.ts';

export type Dir = 'down' | 'up' | 'left' | 'right';
export type Pose = 'idle' | 'walkA' | 'walkB' | 'attack';

export const HERO_W = 26;
/** 귀·모자가 들어가도록 위쪽 여백 */
const Y0 = 8;
export const HERO_H = 32 + Y0;
/** 발 위치 (그림 안 y) */
export const HERO_FOOT = 30 + Y0;

interface Look {
  fur: Color;
  belly: Color;
  inner: Color;
  outfit: Color;
  trim: Color;
  eye: Color;
  ears: 'rabbit' | 'bear' | 'fox' | 'cat';
  extra: 'scarf' | 'overalls' | 'hood' | 'hat' | 'apron' | 'none';
  tail: 'puff' | 'stub' | 'brush' | 'thin';
}

const LOOKS: Record<HeroId, Look> = {
  toby: { fur: hex('#f6f0f4'), belly: hex('#ffffff'), inner: hex('#ff9ec7'), outfit: hex('#4a78d8'), trim: hex('#e8414f'), eye: hex('#2a1e2e'), ears: 'rabbit', extra: 'scarf', tail: 'puff' },
  bori: { fur: hex('#b07444'), belly: hex('#e8c08c'), inner: hex('#e8a87c'), outfit: hex('#4f9a52'), trim: hex('#f2c94c'), eye: hex('#24160e'), ears: 'bear', extra: 'overalls', tail: 'stub' },
  ruru: { fur: hex('#f28a2e'), belly: hex('#fff4e2'), inner: hex('#ffcfa8'), outfit: hex('#3e7a4a'), trim: hex('#a8d86a'), eye: hex('#2a1a10'), ears: 'fox', extra: 'hood', tail: 'brush' },
  nabi: { fur: hex('#5a5068'), belly: hex('#d8d0e4'), inner: hex('#ff9ec7'), outfit: hex('#7b4fd0'), trim: hex('#ffd84a'), eye: hex('#1a1424'), ears: 'cat', extra: 'hat', tail: 'thin' },
};

const INK = hex('#1c1424');

export function heroSprite(hero: HeroId, dir: Dir, pose: Pose): Pix {
  return lookSprite(LOOKS[hero], dir, pose);
}

/** 마을 사람들 */
const NPC_LOOKS: Record<string, Look> = {
  chief: { fur: hex('#e8e0ec'), belly: hex('#ffffff'), inner: hex('#d8a8c8'), outfit: hex('#8a5ac8'), trim: hex('#ffd84a'), eye: hex('#2a1e2e'), ears: 'rabbit', extra: 'scarf', tail: 'puff' },
  shop: { fur: hex('#a86a3a'), belly: hex('#e8c08c'), inner: hex('#e8a87c'), outfit: hex('#e05a4a'), trim: hex('#ffffff'), eye: hex('#24160e'), ears: 'bear', extra: 'apron', tail: 'stub' },
  forge: { fur: hex('#8a8a96'), belly: hex('#e8e4e0'), inner: hex('#4a4450'), outfit: hex('#5a4a3a'), trim: hex('#c8a070'), eye: hex('#1a1424'), ears: 'bear', extra: 'apron', tail: 'brush' },
  tailor: { fur: hex('#ffe4ec'), belly: hex('#ffffff'), inner: hex('#ff9ec7'), outfit: hex('#f08ab0'), trim: hex('#7ad0ff'), eye: hex('#2a1e2e'), ears: 'rabbit', extra: 'apron', tail: 'puff' },
  riftkeeper: { fur: hex('#8a6a4a'), belly: hex('#e8d8b8'), inner: hex('#c8a070'), outfit: hex('#3a4a8a'), trim: hex('#ffd84a'), eye: hex('#1a1424'), ears: 'cat', extra: 'hood', tail: 'stub' },
  baker: { fur: hex('#c8743a'), belly: hex('#fff0d8'), inner: hex('#ffcfa8'), outfit: hex('#ffffff'), trim: hex('#ffcf7a'), eye: hex('#2a1a10'), ears: 'fox', extra: 'apron', tail: 'brush' },
};

export function npcSprite(id: string, dir: Dir = 'down', pose: Pose = 'idle'): Pix {
  return lookSprite(NPC_LOOKS[id] ?? NPC_LOOKS.chief, dir, pose);
}

function lookSprite(L: Look, dir: Dir, pose: Pose): Pix {
  const p = new Pix(HERO_W, HERO_H);
  const cx = 13;
  const side = dir === 'left' || dir === 'right';
  const back = dir === 'up';
  // 걷기: 몸이 살짝 튀고 다리가 엇갈린다
  const bob = pose === 'walkA' || pose === 'walkB' ? -1 : 0;
  const legL = pose === 'walkA' ? -2 : pose === 'walkB' ? 1 : 0;
  const legR = pose === 'walkA' ? 1 : pose === 'walkB' ? -2 : 0;
  const by = 21 + Y0 + bob;

  // 꼬리 (뒤·옆에서 보인다)
  if (back || side) tail(p, L, cx, by, dir);

  // 다리 (짧고 동글동글)
  const legC = L.extra === 'overalls' ? L.outfit : shade(L.fur, -0.08);
  if (side) {
    p.ball(cx - 2 + legL, 27 + Y0, 2.6, 2.2, legC, true);
    p.ball(cx + 2 + legR, 27 + Y0, 2.6, 2.2, legC, true);
  } else {
    p.ball(cx - 3, 27 + Y0 + Math.min(0, legL), 2.6, 2.4, legC, true);
    p.ball(cx + 3, 27 + Y0 + Math.min(0, legR), 2.6, 2.4, legC, true);
  }

  // 몸통
  p.ball(cx, by, 6.6, 6, L.outfit, true);
  if (!back && L.extra !== 'hat') p.oval(cx + (side ? 1 : 0), by + 1, 3.6, 3.4, L.belly);
  if (L.extra === 'overalls' && !back) {
    p.rect(cx - 4, by - 4, 1, 4, L.trim);
    p.rect(cx + 3, by - 4, 1, 4, L.trim);
    p.set(cx - 4, by, shade(L.trim, 0.3));
    p.set(cx + 3, by, shade(L.trim, 0.3));
  }
  if (L.extra === 'apron' && !back) {
    const ap = L.outfit === hex('#ffffff') ? hex('#ffcf7a') : hex('#f8f4ec');
    p.rect(cx - 3 + (side ? 1 : 0), by - 2, 6, 7, ap);
    p.rect(cx - 3 + (side ? 1 : 0), by - 2, 6, 1, shade(ap, -0.2));
    p.set(cx + (side ? 1 : 0), by + 2, L.trim);
  }
  if (L.extra === 'hat') {
    // 망토
    p.ball(cx, by + 1, 7.2, 5.6, shade(L.outfit, -0.12), true);
    if (!back) p.rect(cx - 1, by - 4, 2, 7, L.trim);
  }

  // 팔
  const reach = pose === 'attack' ? 3 : 0;
  if (side) {
    const f = dir === 'right' ? 1 : -1;
    p.ball(cx + f * (4 + reach), by + (pose === 'attack' ? -2 : 0), 2.4, 2.4, L.fur, true);
  } else {
    p.ball(cx - 6.5, by - 1 + (pose === 'attack' && !back ? -2 : 0), 2.3, 2.6, L.fur, true);
    p.ball(cx + 6.5, by - 1, 2.3, 2.6, L.fur, true);
  }

  // 머리
  const hy = 11 + Y0 + bob;
  const hx = cx + (side ? (dir === 'right' ? 1 : -1) : 0);
  ears(p, L, hx, hy, dir);
  p.ball(hx, hy, 8.4, 7.6, L.fur, true);
  // 주둥이 (곰·여우)
  if (!back && (L.ears === 'bear' || L.ears === 'fox')) {
    const sx = side ? hx + (dir === 'right' ? 4 : -4) : hx;
    p.ball(sx, hy + 4, side ? 3.2 : 3.4, 2.4, L.belly, true);
    p.rect(sx - 1 + (side ? (dir === 'right' ? 2 : -1) : 0), hy + 2, 2, 1, INK);
  }
  if (!back) face(p, L, hx, hy, dir);
  if (L.extra === 'scarf') {
    p.rect(cx - 6, hy + 6, 12, 2, L.trim);
    p.rect(cx - 6, hy + 7, 12, 1, shade(L.trim, -0.25));
    if (!side || dir === 'left') p.rect(cx + (back ? -3 : 3), hy + 8, 2, 4, shade(L.trim, -0.1));
  }
  if (L.extra === 'hood') {
    // 초록 망토 깃
    p.rect(cx - 6, hy + 6, 12, 2, L.outfit);
    p.rect(cx - 2, hy + 7, 4, 1, L.trim);
  }
  if (L.extra === 'hat') hat(p, L, hx, hy, dir);
  return p.outline();
}

function ears(p: Pix, L: Look, hx: number, hy: number, dir: Dir): void {
  const side = dir === 'left' || dir === 'right';
  const f = dir === 'left' ? -1 : 1;
  switch (L.ears) {
    case 'rabbit': {
      const pairs = side ? [hx - f * 2, hx + f * 1] : [hx - 4, hx + 4];
      for (const [i, x] of pairs.entries()) {
        const tilt = side ? -f * 1 : i === 0 ? -1 : 1;
        p.ball(x + tilt, hy - 10, 2.4, 6.2, L.fur, true);
        if (dir !== 'up') p.oval(x + tilt, hy - 9, 1, 4.2, L.inner);
      }
      break;
    }
    case 'bear':
      for (const x of side ? [hx - f * 3] : [hx - 6, hx + 6]) {
        p.ball(x, hy - 6, 3.2, 3, L.fur, true);
        if (dir !== 'up') p.oval(x, hy - 6, 1.6, 1.4, L.inner);
      }
      break;
    case 'fox':
    case 'cat': {
      const big = L.ears === 'fox' ? 1 : 0;
      const xs = side ? [hx - f * 3] : [hx - 5, hx + 5];
      for (const [i, x] of xs.entries()) {
        const o = side ? -f : i === 0 ? -1 : 1;
        p.tri(x - 3, hy - 4, x + 3, hy - 4, x + o * 1.5, hy - 11 - big, L.fur);
        if (dir !== 'up') p.tri(x - 1.5, hy - 4, x + 1.5, hy - 4, x + o * 1, hy - 8 - big, L.inner);
        if (L.ears === 'fox') p.set(x + o * 1.5, hy - 11 - big, INK);
      }
      break;
    }
  }
}

function face(p: Pix, L: Look, hx: number, hy: number, dir: Dir): void {
  const snout = L.ears === 'bear' || L.ears === 'fox';
  const eye = (x: number, y: number) => {
    const yy = snout ? y - 2 : y;
    p.rect(x, yy, 2, 3, L.eye);
    p.set(x, yy, hex('#ffffff'));
  };
  if (dir === 'down') {
    eye(hx - 4, hy);
    eye(hx + 2, hy);
    p.oval(hx - 5.5, hy + 4, 1.6, 0.9, shade(L.inner, 0.15));
    p.oval(hx + 5.5, hy + 4, 1.6, 0.9, shade(L.inner, 0.15));
    if (L.ears !== 'bear' && L.ears !== 'fox') {
      p.set(hx, hy + 3, L.inner);
      p.set(hx - 1, hy + 4, L.eye);
      p.set(hx + 1, hy + 4, L.eye);
    }
    if (L.ears === 'cat') {
      p.line(hx - 9, hy + 3, hx - 6, hy + 3, shade(L.belly, -0.3));
      p.line(hx + 6, hy + 3, hx + 9, hy + 3, shade(L.belly, -0.3));
    }
  } else {
    const f = dir === 'right' ? 1 : -1;
    eye(hx + f * 3 - (f < 0 ? 1 : 0), hy);
    p.oval(hx + f * 5, hy + 4, 1.4, 0.9, shade(L.inner, 0.15));
  }
}

function tail(p: Pix, L: Look, cx: number, by: number, dir: Dir): void {
  const f = dir === 'right' ? -1 : dir === 'left' ? 1 : 0;
  const tx = cx + f * 7;
  const ty = by + (dir === 'up' ? 2 : 1);
  switch (L.tail) {
    case 'puff':
      p.ball(tx, ty, 2.6, 2.4, hex('#ffffff'), true);
      break;
    case 'stub':
      p.ball(tx, ty, 2, 1.8, L.fur, true);
      break;
    case 'brush':
      p.ball(tx + f * 2, ty - 2, 4, 5.5, L.fur, true);
      p.ball(tx + f * 3, ty - 6, 2.4, 2, L.belly, true);
      break;
    case 'thin':
      p.line(tx, ty, tx + f * 3, ty - 6, L.fur);
      p.line(tx + 1, ty, tx + f * 3 + 1, ty - 6, L.fur);
      p.set(tx + f * 3, ty - 7, L.trim);
      break;
  }
}

function hat(p: Pix, L: Look, hx: number, hy: number, dir: Dir): void {
  // 커다란 마법사 모자 (별 장식)
  const lean = dir === 'left' ? -2 : dir === 'right' ? 2 : 1;
  p.oval(hx, hy - 5, 10, 2.4, shade(L.outfit, -0.1));
  p.tri(hx - 6, hy - 5, hx + 6, hy - 5, hx + lean * 3, hy - 17, L.outfit);
  p.tri(hx - 4, hy - 6, hx - 1, hy - 6, hx + lean * 2, hy - 15, shade(L.outfit, 0.25));
  p.rect(hx - 6, hy - 7, 12, 2, L.trim);
  if (dir !== 'up') {
    p.set(hx + 2, hy - 11, L.trim);
    p.set(hx + 1, hy - 10, L.trim);
    p.set(hx + 3, hy - 10, L.trim);
    p.set(hx + 2, hy - 9, L.trim);
  }
}

// ───────────────────────── 무기 ─────────────────────────

export type WeaponKind = 'sword' | 'axe' | 'bow' | 'staff';

/** 오른쪽을 가리키는 무기 그림 (손잡이가 왼쪽 끝) */
export function weaponSprite(kind: WeaponKind): Pix {
  switch (kind) {
    case 'sword': {
      const p = new Pix(20, 7);
      p.rect(0, 3, 4, 2, hex('#7a4a2a'));
      p.rect(4, 1, 2, 6, hex('#e8c040'));
      p.bar(6, 2, 13, 3, hex('#e8eef8'));
      p.set(19, 3, hex('#ffffff'));
      p.line(7, 2, 17, 2, hex('#ffffff'));
      return p.outline();
    }
    case 'axe': {
      const p = new Pix(22, 14);
      p.rect(0, 6, 15, 2, hex('#8a5a32'));
      p.ball(16, 7, 5, 6, hex('#c8d2dc'));
      p.rect(13, 3, 3, 9, hex('#9aa6b2'));
      return p.outline();
    }
    case 'bow': {
      const p = new Pix(10, 22);
      for (let y = 0; y < 22; y++) {
        const x = Math.round(2 + Math.sin((y / 21) * Math.PI) * 5);
        p.set(x, y, hex('#a0642e'));
        p.set(x + 1, y, hex('#c88a4a'));
      }
      p.line(2, 0, 2, 21, hex('#f0f0f0'));
      p.rect(6, 9, 2, 4, hex('#e8414f'));
      return p.outline();
    }
    case 'staff': {
      const p = new Pix(22, 9);
      p.rect(0, 4, 16, 2, hex('#8a5a32'));
      p.ball(18, 4.5, 3.6, 3.6, hex('#ffd84a'));
      p.set(17, 3, hex('#ffffff'));
      return p.outline();
    }
  }
}

export const HERO_POSES: Pose[] = ['idle', 'walkA', 'walkB', 'attack'];
export const HERO_DIRS: Dir[] = ['down', 'up', 'left', 'right'];
