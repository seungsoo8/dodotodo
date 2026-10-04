/** 고장 난 장난감 그림: 몬스터마다 2 프레임 (통통 튀기·날갯짓) */
import { Pix, hex, shade, type Color } from './paint.ts';

const INK = hex('#1c1424');
const WHITE = hex('#ffffff');
const RED = hex('#e8414f');

type Draw = (p: Pix, f: number) => void;

/** 눈 한 쌍 (화난 눈썹은 angry) */
function eyes(p: Pix, x: number, y: number, gap: number, angry = false, color: Color = INK, size = 2): void {
  for (const ex of [x - gap, x + gap - size + 1]) {
    p.rect(ex, y, size, size + 1, color);
    p.set(ex, y, WHITE);
  }
  if (angry) {
    p.line(x - gap - 1, y - 2, x - gap + size, y - 1, INK);
    p.line(x + gap + 1, y - 2, x + gap - size + 1, y - 1, INK);
  }
}

/** 태엽 손잡이 */
function key(p: Pix, x: number, y: number, f: number, c = hex('#d8b040')): void {
  p.rect(x, y, 1, 3, c);
  const w = f ? 2 : 3;
  p.rect(x - w, y - 2, w, 2, c);
  p.rect(x + 1, y - 2, w, 2, c);
}

const DRAW: Record<string, { w: number; h: number; draw: Draw }> = {
  fluff: {
    w: 20,
    h: 18,
    draw: (p, f) => {
      const sq = f ? 1 : 0;
      p.ball(10, 10 + sq, 7.5 + sq * 0.6, 6.5 - sq * 0.6, hex('#ecebf2'), true);
      for (let i = 0; i < 6; i++) p.ball(4 + i * 2.4, 5 + sq + (i % 2), 2, 2, hex('#f6f6fb'), true);
      eyes(p, 10, 9 + sq, 4, true);
      p.rect(9, 13 + sq, 2, 1, shade(hex('#a090a0'), 0));
    },
  },
  mushroom: {
    w: 22,
    h: 22,
    draw: (p, f) => {
      p.bar(7, 11 + f, 8, 9 - f, hex('#f0e2c8'));
      p.ball(11, 9 + f, 10, 6.5, hex('#e8505a'));
      for (const [x, y] of [[6, 7], [12, 5], [15, 9]]) p.oval(x, y + f, 1.6, 1.3, hex('#fff2f2'));
      eyes(p, 11, 13 + f, 3, true);
    },
  },
  mouse: {
    w: 22,
    h: 16,
    draw: (p, f) => {
      p.line(2, 10, 5, 9 + f, hex('#d08090'));
      p.ball(11, 10, 7, 4.8, hex('#a8a8b8'));
      p.ball(16, 9, 3.6, 3.2, hex('#b8b8c8'));
      p.ball(14, 5, 2.2, 2.2, hex('#c8c8d8'));
      p.set(14, 5, hex('#f0a0b0'));
      p.rect(17, 8, 1, 2, INK);
      p.set(20, 9, hex('#f07080'));
      key(p, 10, 3, f);
      p.rect(7 + f, 14, 2, 1, INK);
      p.rect(13 - f, 14, 2, 1, INK);
    },
  },
  wolf: {
    w: 28,
    h: 22,
    draw: (p, f) => {
      const c = hex('#8c8ca8');
      p.ball(13, 13, 9, 5.5, c, true);
      p.ball(21, 9, 5, 4.5, shade(c, 0.08), true);
      p.tri(18, 6, 21, 6, 19, 1, c);
      p.tri(22, 6, 25, 6, 24, 1, c);
      p.ball(25, 11, 2.6, 2, hex('#d8d8e8'), true);
      p.set(27, 11, INK);
      p.rect(21, 8, 2, 2, hex('#ffe040'));
      // 기운 헝겊 조각
      p.rect(9, 10, 4, 3, hex('#d87870'));
      p.line(9, 10, 12, 12, hex('#f0e0d0'));
      p.line(4, 12, 1, 9 + f, c);
      for (const x of [7, 12, 16, 20]) p.rect(x, 17 + ((x + f * 3) % 2), 2, 3, shade(c, -0.25));
    },
  },
  ragdoll: {
    w: 22,
    h: 26,
    draw: (p, f) => {
      p.bar(6, 13, 10, 9, hex('#a07858'));
      p.rect(7, 22, 3, 3 - f, hex('#6a4a38'));
      p.rect(12, 22, 3, 2 + f, hex('#6a4a38'));
      p.ball(11, 8, 7, 6.5, hex('#e8c8a0'), true);
      p.rect(4, 2, 14, 3, hex('#7a4a8a'));
      // 단추 눈
      p.ball(8, 8, 1.8, 1.8, INK);
      p.line(13, 7, 15, 9, INK);
      p.line(15, 7, 13, 9, INK);
      p.line(8, 12, 14, 12, hex('#8a3030'));
      p.ball(3, 15 + f, 2, 2.4, hex('#e8c8a0'), true);
      p.ball(19, 15 - f, 2, 2.4, hex('#e8c8a0'), true);
    },
  },
  jelly: {
    w: 24,
    h: 20,
    draw: (p, f) => {
      const c = hex('#ff5a8a');
      p.ball(12, 12 + f, 10 + f, 7 - f, c);
      p.oval(8, 8 + f, 2.6, 1.6, shade(c, 0.6));
      eyes(p, 12, 11 + f, 4, false);
      p.rect(11, 15 + f, 2, 1, INK);
    },
  },
  jellet: {
    w: 14,
    h: 12,
    draw: (p, f) => {
      const c = hex('#ffb04a');
      p.ball(7, 7 + f, 5.5 + f * 0.5, 4 - f * 0.5, c);
      p.set(5, 5 + f, shade(c, 0.6));
      p.set(5, 7 + f, INK);
      p.set(9, 7 + f, INK);
    },
  },
  cookie: {
    w: 22,
    h: 26,
    draw: (p, f) => {
      const c = hex('#c88a4a');
      p.ball(11, 8, 6.5, 6, c, true);
      p.ball(11, 17, 6, 5.5, c, true);
      p.ball(4, 15 + f, 2.4, 2.4, c, true);
      p.ball(18, 15 - f, 2.4, 2.4, c, true);
      p.rect(7, 22, 3, 3 - f, c);
      p.rect(12, 22, 3, 2 + f, c);
      // 아이싱
      p.line(6, 2, 16, 2, WHITE);
      p.line(8, 11, 14, 11, WHITE);
      p.set(11, 15, hex('#e8414f'));
      p.set(11, 18, hex('#4ad88a'));
      eyes(p, 11, 7, 3, true);
      // 사탕 지팡이 창
      p.line(20, 4, 20, 22, WHITE);
      for (let y = 4; y < 22; y += 3) p.set(20, y, RED);
    },
  },
  bee: {
    w: 22,
    h: 18,
    draw: (p, f) => {
      p.oval(8, 4 - f, 4, 2.6 + f, hex('#e8f4ff'));
      p.oval(14, 4 - f, 4, 2.6 + f, hex('#d8ecff'));
      p.ball(11, 10, 7, 5.5, hex('#ffd84a'));
      for (const x of [8, 12]) p.rect(x, 6, 2, 9, hex('#e8414f'));
      eyes(p, 15, 9, 1, false);
      p.tri(3, 10, 5, 9, 5, 12, INK);
    },
  },
  gum: {
    w: 22,
    h: 22,
    draw: (p, f) => {
      const c = hex('#ff8ad8');
      p.ball(11, 13, 9, 7.5 + f * 0.5, c);
      p.ball(15, 6 - f, 4.5 + f, 4.5 + f, shade(c, 0.3));
      p.rect(3, 9, 6, 2, hex('#68d0f0'));
      eyes(p, 10, 12, 3, true);
    },
  },
  choco: {
    w: 32,
    h: 32,
    draw: (p, f) => {
      const c = hex('#6a3e26');
      p.ball(16, 18, 12, 11, c);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) p.rect(9 + x * 5, 11 + y * 5, 4, 4, shade(c, 0.12));
      p.ball(5, 18 + f, 4, 5, c);
      p.ball(27, 18 - f, 4, 5, c);
      p.rect(10, 28, 4, 3, shade(c, -0.2));
      p.rect(18, 28, 4, 3, shade(c, -0.2));
      eyes(p, 16, 9, 4, true, hex('#ff8a30'));
      p.oval(16, 4, 6, 2, hex('#fff2e0'));
    },
  },
  bat: {
    w: 26,
    h: 18,
    draw: (p, f) => {
      const wc = hex('#5a5a78');
      const wy = f ? 4 : 9;
      p.tri(13, 9, 1, wy, 6, 14, wc);
      p.tri(13, 9, 25, wy, 20, 14, wc);
      p.ball(13, 10, 5, 4.5, hex('#8a8aa8'));
      key(p, 13, 3, f);
      eyes(p, 13, 9, 2, true, hex('#ff4a4a'), 1);
    },
  },
  tin: {
    w: 22,
    h: 28,
    draw: (p, f) => {
      const c = hex('#9aa8b8');
      p.bar(6, 12, 10, 11, hex('#4a6ad8'));
      p.rect(6, 15, 10, 1, hex('#ffd84a'));
      p.bar(6, 3, 10, 9, c);
      p.rect(5, 1, 12, 2, shade(c, -0.2));
      p.rect(9, 0, 4, 1, hex('#e8414f'));
      eyes(p, 11, 6, 2, false);
      p.rect(7, 23, 3, 4 - f, shade(c, -0.25));
      p.rect(12, 23, 3, 3 + f, shade(c, -0.25));
      p.line(18, 4, 18, 22, hex('#c8c8d8'));
      p.tri(16, 4, 20, 4, 18, 0, hex('#e8eef8'));
    },
  },
  spider: {
    w: 26,
    h: 18,
    draw: (p, f) => {
      for (let i = 0; i < 4; i++) {
        const y = 8 + i * 2;
        p.line(13, y, 2, y - 3 + ((i + f) % 2) * 3, hex('#8a8aa0'));
        p.line(13, y, 24, y - 3 + ((i + f + 1) % 2) * 3, hex('#8a8aa0'));
      }
      p.ball(13, 9, 6, 5, hex('#b8b8c8'));
      // 나사 머리
      p.line(10, 9, 16, 9, shade(hex('#b8b8c8'), -0.4));
      eyes(p, 13, 11, 3, true, hex('#ff4a4a'), 1);
    },
  },
  lamp: {
    w: 20,
    h: 24,
    draw: (p, f) => {
      p.oval(10, 12 + f, 8, 8, hex('#fff3b0'));
      p.ball(10, 12 + f, 5, 6, hex('#ffd84a'));
      p.rect(6, 4 + f, 8, 2, hex('#a07040'));
      p.rect(9, 1 + f, 2, 3, hex('#a07040'));
      eyes(p, 10, 11 + f, 2, false, hex('#8a4a10'), 1);
      p.oval(4, 15 - f, 2.4, 1.4, hex('#e8f4ff'));
      p.oval(16, 15 - f, 2.4, 1.4, hex('#e8f4ff'));
    },
  },
  dustling: {
    w: 22,
    h: 20,
    draw: (p, f) => {
      const c = hex('#8a8494');
      p.ball(11, 11 + f, 8, 7 - f * 0.5, c, true);
      for (let i = 0; i < 7; i++) p.ball(4 + i * 2.2, 5 + f + ((i * 3) % 2), 1.8, 1.8, shade(c, 0.12), true);
      eyes(p, 11, 10 + f, 3, true, hex('#ffd84a'), 1);
    },
  },
  shadow: {
    w: 22,
    h: 28,
    draw: (p, f) => {
      const c = hex('#3a3050');
      p.ball(11, 18, 7, 8, c, true);
      p.ball(11, 8, 6.5, 6, shade(c, 0.1), true);
      p.ball(3, 17 + f, 2.4, 3, c, true);
      p.ball(19, 17 - f, 2.4, 3, c, true);
      eyes(p, 11, 7, 3, true, hex('#ff5a8a'), 1);
      p.line(8, 11, 14, 11, hex('#ff5a8a'));
    },
  },
  eye: {
    w: 22,
    h: 22,
    draw: (p, f) => {
      p.oval(4, 11, 3, 2 + f, hex('#5a4a6a'));
      p.oval(18, 11, 3, 2 + f, hex('#5a4a6a'));
      p.ball(11, 11, 8, 8, hex('#e8e0d0'));
      for (const [x, y] of [[8, 8], [14, 8], [8, 14], [14, 14]]) p.oval(x, y, 1.4, 1.4, hex('#6a5a4a'));
      p.ball(11, 11, 3, 3, hex('#d83a6a'));
      p.set(10, 10, WHITE);
    },
  },
  dustknight: {
    w: 28,
    h: 30,
    draw: (p, f) => {
      const c = hex('#6a6478');
      p.ball(14, 19, 9, 9, c);
      p.bar(8, 3, 12, 10, shade(c, 0.15));
      p.rect(9, 7, 10, 2, INK);
      p.rect(10, 7, 2, 2, hex('#ff8a30'));
      p.rect(16, 7, 2, 2, hex('#ff8a30'));
      p.rect(12, 0, 4, 3, hex('#a83a3a'));
      p.ball(3, 19, 3.6, 7, hex('#8a7a5a'));
      p.line(24, 4 + f, 24, 26, hex('#c8c8d8'));
      p.rect(9, 27, 4, 3, shade(c, -0.2));
      p.rect(15, 27, 4, 3, shade(c, -0.2));
    },
  },
  // ───── 보스
  b_bear: {
    w: 56,
    h: 56,
    draw: (p, f) => {
      const c = hex('#9a6038');
      p.ball(28, 36, 19, 16, c, true);
      p.oval(28, 38, 10, 9, hex('#e8c08c'));
      p.ball(28, 18, 15, 13, c, true);
      p.ball(15, 7, 5, 5, c, true);
      p.ball(41, 7, 5, 5, c, true);
      p.oval(15, 7, 2.4, 2.4, hex('#e8a87c'));
      p.oval(41, 7, 2.4, 2.4, hex('#e8a87c'));
      p.ball(28, 24, 6, 4.5, hex('#e8c08c'), true);
      p.rect(26, 21, 4, 2, INK);
      eyes(p, 28, 15, 7, true, INK, 3);
      // 등의 큰 태엽
      key(p, 46, 26, f, hex('#e8c040'));
      p.ball(8, 36 + f, 6, 7, c, true);
      p.ball(48, 36 - f, 6, 7, c, true);
      p.ball(18, 51, 6, 4, shade(c, -0.15), true);
      p.ball(38, 51, 6, 4, shade(c, -0.15), true);
      // 군모
      p.rect(20, 3, 16, 4, hex('#3a5a9a'));
      p.rect(26, 4, 4, 2, hex('#ffd84a'));
    },
  },
  b_jelly: {
    w: 60,
    h: 56,
    draw: (p, f) => {
      const c = hex('#a85ae8');
      p.ball(30, 34 + f, 26 - f, 19 + f, c);
      p.oval(20, 24 + f, 6, 3, shade(c, 0.6));
      eyes(p, 30, 30 + f, 9, true, INK, 3);
      p.line(25, 41 + f, 35, 41 + f, INK);
      // 왕관
      const g = hex('#ffd84a');
      p.rect(20, 12 + f, 20, 5, g);
      for (const x of [20, 27, 34, 39]) p.tri(x, 12 + f, x + 3, 12 + f, x + 1.5, 6 + f, g);
      p.oval(30, 14 + f, 1.6, 1.6, RED);
    },
  },
  b_tin: {
    w: 52,
    h: 60,
    draw: (p, f) => {
      const c = hex('#a8b4c4');
      p.bar(12, 26, 28, 22, hex('#c83a3a'));
      for (let y = 30; y < 46; y += 5) p.rect(24, y, 4, 2, hex('#ffd84a'));
      p.bar(14, 6, 24, 20, c);
      p.rect(12, 2, 28, 4, shade(c, -0.2));
      p.rect(22, 0, 8, 2, hex('#ffd84a'));
      p.rect(17, 12, 18, 4, INK);
      p.rect(19, 13, 4, 2, hex('#ff4a4a'));
      p.rect(29, 13, 4, 2, hex('#ff4a4a'));
      p.bar(4, 26, 8, 16, c);
      p.bar(40, 26, 8, 16, c);
      p.rect(42, 40 + f, 6, 6, hex('#5a5a68'));
      p.rect(16, 48, 8, 10 - f, shade(c, -0.25));
      p.rect(28, 48, 8, 9 + f, shade(c, -0.25));
    },
  },
  b_dusty: {
    w: 44,
    h: 48,
    draw: (p, f) => {
      const c = hex('#4a4058');
      p.tri(6, 46, 38, 46, 22, 12, c);
      p.tri(10, 46, 34, 46, 22, 18, shade(c, 0.12));
      p.ball(22, 14 + f, 9, 8, hex('#9a94a8'), true);
      for (let i = 0; i < 6; i++) p.ball(14 + i * 3, 7 + f + (i % 2), 2.4, 2.4, hex('#b8b0c8'), true);
      eyes(p, 22, 13 + f, 4, true, hex('#ffd84a'), 2);
      p.line(19, 18 + f, 25, 18 + f, INK);
      // 빗자루 지팡이
      p.line(38, 8, 38, 44, hex('#8a5a32'));
      p.tri(34, 40, 42, 40, 38, 47, hex('#d8b060'));
    },
  },
  b_king: {
    w: 72,
    h: 72,
    draw: (p, f) => {
      const c = hex('#3a3048');
      p.ball(36, 46, 30, 24, c, true);
      for (let i = 0; i < 12; i++) p.ball(10 + i * 4.6, 26 + (i % 3), 4, 4, shade(c, 0.15), true);
      p.ball(36, 30, 18, 15, hex('#6a6080'), true);
      eyes(p, 36, 28, 8, true, hex('#ff3a5a'), 3);
      p.rect(28, 37, 16, 2, INK);
      const g = hex('#c8a040');
      p.rect(22, 10 + f, 28, 6, g);
      for (const x of [22, 30, 38, 46]) p.tri(x, 10 + f, x + 4, 10 + f, x + 2, 2 + f, g);
      p.oval(36, 13 + f, 2, 2, hex('#7a3ad8'));
      p.ball(6, 46 + f, 6, 9, c, true);
      p.ball(66, 46 - f, 6, 9, c, true);
    },
  },
};

const CACHE = new Map<string, Pix[]>();

/** 몬스터 그림 두 장 (없는 id 는 회색 공) */
export function monsterFrames(id: string): Pix[] {
  let fr = CACHE.get(id);
  if (fr) return fr;
  const d = DRAW[id] ?? { w: 16, h: 16, draw: (p: Pix) => p.ball(8, 8, 6, 6, hex('#888888')) };
  fr = [0, 1].map((f) => {
    const p = new Pix(d.w + 2, d.h + 2);
    const inner = new Pix(d.w, d.h);
    d.draw(inner, f);
    p.stamp(inner, 1, 1);
    return p.outline();
  });
  CACHE.set(id, fr);
  return fr;
}

export const MONSTER_ART_IDS = Object.keys(DRAW);
