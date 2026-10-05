/** 고장 난 장난감 그림: 몬스터마다 2 프레임 (통통 튀기·날갯짓) + 동작 일곱 장 (숨쉬기 · 이동 · 모으기 · 공격 · 맞기) */
import { CLEAR, Pix, hex, shade, type Color } from './paint.ts';
import { BOSS_IDS, bossSprite } from './bosses.ts';
import { MONSTERS } from '../../core/monsters.ts';

const INK = hex('#1c1424');
const WHITE = hex('#ffffff');
const RED = hex('#e8414f');

type Draw = (p: Pix, f: number) => void;

/** 지금 그리는 얼굴 (동작 그림을 만들 때만 바뀐다): 모으기 · 공격은 화난 얼굴, 맞으면 질끈 감은 눈 */
let FACE: 'normal' | 'angry' | 'hurt' = 'normal';

/** 눈 한 쌍 (화난 눈썹은 angry) */
function eyes(p: Pix, x: number, y: number, gap: number, angry = false, color: Color = INK, size = 2): void {
  if (FACE === 'hurt') {
    // > < 꼭 감은 눈
    const l = x - gap;
    const r = x + gap - size + 1;
    p.line(l, y, l + size - 1, y + 1, INK);
    p.line(l + size - 1, y + 1, l, y + 2, INK);
    p.line(r + size - 1, y, r, y + 1, INK);
    p.line(r, y + 1, r + size - 1, y + 2, INK);
    return;
  }
  for (const ex of [x - gap, x + gap - size + 1]) {
    p.rect(ex, y, size, size + 1, color);
    p.set(ex, y, WHITE);
  }
  if (angry || FACE === 'angry') {
    // 눈썹은 눈과 한 칸 띄워 짧게 (붙으면 숫자 7처럼 보인다)
    p.line(x - gap - 1, y - 3, x - gap + size - 1, y - 2, INK);
    p.line(x + gap, y - 3, x + gap - size, y - 2, INK);
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
      // 발그레한 볼
      p.set(4, 12 + sq, hex('#f0b8c8'));
      p.set(15, 12 + sq, hex('#f0b8c8'));
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
  marble: {
    w: 20,
    h: 20,
    draw: (p, f) => {
      // 굴러가는 유리구슬: 안의 무늬가 돈다
      const c = hex('#6ab8f0');
      p.ball(10, 10, 8.5, 8.5, c);
      const a = f * 1.2;
      p.line(10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 10 - Math.cos(a) * 6, 10 - Math.sin(a) * 6, hex('#ff8ab8'));
      p.line(10 + Math.cos(a + 1.6) * 5, 10 + Math.sin(a + 1.6) * 5, 10 - Math.cos(a + 1.6) * 5, 10 - Math.sin(a + 1.6) * 5, hex('#ffd84a'));
      p.set(6, 5, WHITE);
      p.set(7, 5, WHITE);
      eyes(p, 10, 8, 4, true);
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
  pencil: {
    w: 18,
    h: 30,
    draw: (p, f) => {
      // 연필 병정: 노란 몸통, 분홍 지우개 모자, 뾰족한 심이 아래
      const y = f;
      p.rect(5, 2 + y, 8, 4, hex('#ff8ab8'));
      p.rect(5, 6 + y, 8, 2, hex('#c8c8d8'));
      p.bar(5, 8 + y, 8, 14, hex('#ffc83a'));
      p.rect(8, 8 + y, 1, 14, hex('#e8a020'));
      p.tri(5, 22 + y, 13, 22 + y, 9, 28, hex('#f2d8b0'));
      p.tri(8, 26, 10, 26, 9, 29, INK);
      eyes(p, 9, 11 + y, 2, true);
      // 팔과 작은 지우개 창
      p.line(3, 14 + y, 5, 12 + y, INK);
      p.line(13, 12 + y, 16, 9 + y - f, INK);
    },
  },
  sock: {
    w: 24,
    h: 26,
    draw: (p, f) => {
      // 짝 잃은 양말 유령: 줄무늬, 아래가 펄럭인다
      const c = hex('#f0f0f8');
      p.ball(11, 9, 8, 8, c, true);
      p.rect(3, 9, 16, 9, c);
      for (let y = 4; y < 18; y += 4) p.rect(3, y, 16, 2, hex('#e8414f'));
      p.ball(11, 9, 6, 2, c, true);
      for (let x = 3; x < 19; x += 4) p.tri(x, 18, x + 4, 18, x + 2, 22 + ((x + f) % 2) * 2, c);
      p.ball(19, 18, 4, 3, c, true);
      eyes(p, 11, 9, 3, false);
      p.rect(9, 13, 4, 1, INK);
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
  dusty_clone: {
    w: 26,
    h: 30,
    draw: (p, f) => {
      // 먼지 분신: 반쯤 비치는 더스티 (회색 고깔 + 노란 눈)
      const c = hex('#6a6278');
      p.tri(4, 29, 22, 29, 13, 8, c);
      for (let x = 5; x < 22; x += 4) p.set(x, 27 - ((x + f) % 3), hex('#9a94a8'));
      p.ball(13, 9 + f, 6, 5.5, hex('#b8b0c8'), true);
      eyes(p, 13, 8 + f, 3, true, hex('#ffd84a'), 2);
    },
  },
};

const CACHE = new Map<string, Pix[]>();

/** 몬스터 그림 두 장 (없는 id 는 회색 공) */
export function monsterFrames(id: string): Pix[] {
  let fr = CACHE.get(id);
  if (fr) return fr;
  // 보스는 새 동작 그림의 숨쉬기 두 장 (도감 · 쓰러짐 · 마을 친구)
  if (BOSS_IDS.includes(id)) {
    fr = [bossSprite(id, 'idle0', 1), bossSprite(id, 'idle1', 1)];
    CACHE.set(id, fr);
    return fr;
  }
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

export const MONSTER_ART_IDS = [...Object.keys(DRAW), ...BOSS_IDS];

// ───────────────────────── 동작 ─────────────────────────

export type MonPose = 'idle0' | 'idle1' | 'move0' | 'move1' | 'windup' | 'attack' | 'hurt';
export const MON_POSES: MonPose[] = ['idle0', 'idle1', 'move0', 'move1', 'windup', 'attack', 'hurt'];

/** 지금 보여 줄 몬스터 동작 (화면과 무관한 계산). moving: 이번 프레임에 움직였나, hurtFor: 맞은 뒤 지난 시간 */
export function monPose(m: { ai: { state: string; timer?: number }; def: { ai: string } }, moving: boolean, time: number, hurtFor: number): MonPose {
  const s = m.ai.state;
  if (s === 'windup') return 'windup';
  if (s === 'dash' || s === 'hop') return 'attack';
  // 할퀸 직후 잠깐은 덮친 자세 그대로
  if (s === 'recover' && m.def.ai === 'melee' && (m.ai.timer ?? 0) > 0.35) return 'attack';
  if (hurtFor < 0.15) return 'hurt';
  if (moving) return Math.floor(time * 7) % 2 ? 'move1' : 'move0';
  return Math.floor(time * 1.6) % 2 ? 'idle1' : 'idle0';
}

/** 동작마다 몸을 어떻게 바꿀지 (픽셀): 폭 · 키 변화, 꼭대기가 앞으로 기우는 정도, 몸 전체 앞뒤 이동 */
interface Shape {
  f: number;
  dw: number;
  dh: number;
  shear: number;
  shift: number;
  face: 'normal' | 'angry' | 'hurt';
}

function shapeOf(id: string, pose: MonPose, w: number, h: number): Shape {
  const kind = MONSTERS[id]?.ai ?? 'melee';
  const k = (r: number, min = 1) => Math.max(min, Math.round(r));
  switch (pose) {
    case 'idle0':
      return { f: 0, dw: 0, dh: 0, shear: 0, shift: 0, face: 'normal' };
    case 'idle1':
      // 숨: 한 칸 낮아지고 살짝 퍼진다
      return { f: 0, dw: 1, dh: -1, shear: 0, shift: 0, face: 'normal' };
    case 'move0':
      return { f: 0, dw: 0, dh: 0, shear: 1, shift: 0, face: 'normal' };
    case 'move1':
      return { f: 1, dw: 0, dh: -1, shear: 1, shift: 0, face: 'normal' };
    case 'windup':
      // 모으기: 납작하게 웅크리며 뒤로 젖힌다
      return { f: 0, dw: k(w * 0.14), dh: -k(h * 0.16, 2), shear: -2, shift: -1, face: 'angry' };
    case 'hurt':
      return { f: 0, dw: 1, dh: -k(h * 0.1), shear: -2, shift: -2, face: 'hurt' };
    case 'attack':
      if (kind === 'charger') return { f: 1, dw: k(w * 0.26, 3), dh: -k(h * 0.12), shear: 2, shift: 2, face: 'angry' };
      if (kind === 'hopper') return { f: 0, dw: -k(w * 0.1), dh: k(h * 0.18, 2), shear: 0, shift: 0, face: 'angry' };
      if (kind === 'melee') return { f: 1, dw: 1, dh: 0, shear: 4, shift: 2, face: 'angry' };
      return { f: 1, dw: 2, dh: 1, shear: 3, shift: 1, face: 'angry' };
  }
}

const POSE_CACHE = new Map<string, Pix>();

/**
 * 몬스터 동작 그림. 모든 동작이 같은 크기의 판에 그려지고 발바닥 줄이 같다 (화면에서 자리가 흔들리지 않게).
 * 몸은 가장 가까운 점으로 늘이고 줄이고 기울인 뒤 외곽선을 두른다.
 */
export function monsterSprite(id: string, pose: MonPose): Pix {
  const key = `${id}${pose}`;
  const hit = POSE_CACHE.get(key);
  if (hit) return hit;
  const d = DRAW[id] ?? { w: 16, h: 16, draw: (p: Pix) => p.ball(8, 8, 6, 6, hex('#888888')) };
  const sh = shapeOf(id, pose, d.w, d.h);
  const inner = new Pix(d.w, d.h);
  FACE = sh.face;
  try {
    d.draw(inner, sh.f);
  } finally {
    FACE = 'normal';
  }
  const padX = Math.ceil(d.w * 0.3) + 6;
  const padY = Math.ceil(d.h * 0.25) + 2;
  const W = d.w + padX * 2 + 2;
  const H = d.h + padY + 2;
  const out = new Pix(W, H);
  const tw = d.w + sh.dw;
  const th = d.h + sh.dh;
  const bottom = H - 2;
  const top = bottom - th + 1;
  const left = Math.round((W - tw) / 2) + sh.shift;
  for (let oy = top; oy <= bottom; oy++) {
    const sy = Math.min(d.h - 1, Math.floor(((oy - top) * d.h) / th));
    const lean = Math.round(sh.shear * (1 - sy / Math.max(1, d.h - 1)));
    for (let ox = left; ox < left + tw; ox++) {
      const sx = Math.floor(((ox - left) * d.w) / tw);
      const c = inner.get(sx, sy);
      if (c !== CLEAR) out.set(ox + lean, oy, c);
    }
  }
  // 발바닥 맞추기: 그림마다 아래 여백이 달라도 숨쉬기 그림의 발 줄에 닿게
  const lowest = (q: Pix) => {
    for (let y = q.h - 1; y >= 0; y--) for (let x = 0; x < q.w; x++) if (q.get(x, y) !== CLEAR) return y;
    return q.h - 1;
  };
  const base = new Pix(d.w, d.h);
  d.draw(base, 0);
  const want = bottom - (d.h - 1 - lowest(base));
  const got = lowest(out);
  const fixed = new Pix(W, H);
  fixed.stamp(out, 0, want - got);
  fixed.outline();
  POSE_CACHE.set(key, fixed);
  return fixed;
}
