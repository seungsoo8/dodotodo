/** 16×16 아이콘: 무기 · 사탕 · 태엽 · 부품 · 재료 · 단추 · 스킬 */
import type { WeaponType } from '../../core/classes.ts';
import type { MatId } from '../../core/types.ts';
import { Pix, hex, shade, type Color } from './paint.ts';

const N = 16;
const CACHE = new Map<string, Pix>();

function cached(key: string, make: () => Pix): Pix {
  let p = CACHE.get(key);
  if (!p) {
    p = make().outline();
    CACHE.set(key, p);
  }
  return p;
}

const METAL = hex('#c8d0d8');

/** 동료 무기 (무기 손질 화면) */
export function weaponIcon(t: WeaponType): Pix {
  return cached(`w${t}`, () => {
    const p = new Pix(N, N);
    const m = METAL;
    const wood = hex('#8a5a34');
    switch (t) {
      case 'sword':
        for (let i = 0; i < 9; i++) {
          p.set(4 + i, 11 - i, m);
          p.set(5 + i, 11 - i, shade(m, 0.3));
          p.set(5 + i, 12 - i, shade(m, -0.25));
        }
        p.line(2, 10, 6, 14, hex('#c89a3a'));
        p.line(2, 14, 4, 12, wood);
        p.set(1, 15, hex('#ffd84a'));
        break;
      case 'axe':
        p.line(3, 14, 11, 3, wood);
        p.line(4, 14, 12, 3, shade(wood, 0.2));
        p.ball(11, 5, 4, 4, m);
        p.rect(7, 2, 3, 3, m);
        p.line(13, 2, 15, 7, shade(m, 0.4));
        break;
      case 'bow':
        for (let a = -1.2; a <= 1.2; a += 0.08) p.set(Math.round(5 + Math.cos(a) * 8), Math.round(8 + Math.sin(a) * 7), wood);
        p.line(5, 1, 5, 15, hex('#f0f0f0'));
        p.line(3, 8, 14, 8, shade(m, -0.2));
        p.tri(14, 8, 11, 6, 11, 10, m);
        p.set(2, 7, hex('#ff8ab8'));
        p.set(2, 9, hex('#ff8ab8'));
        break;
      case 'staff':
        p.line(3, 15, 10, 6, wood);
        p.line(4, 15, 11, 6, shade(wood, 0.2));
        p.ball(11, 4, 3.5, 3.5, hex('#c890f0'));
        p.set(10, 3, hex('#ffffff'));
        p.set(14, 1, hex('#fff4c0'));
        p.set(7, 2, hex('#fff4c0'));
        break;
    }
    return p;
  });
}

/** 사탕 (Q): 비닐에 싼 동그란 사탕 */
export function candyIcon(): Pix {
  return cached('candy', () => {
    const p = new Pix(N, N);
    const wrap = hex('#ffd0e0');
    p.tri(1, 4, 5, 8, 1, 12, wrap);
    p.tri(15, 4, 11, 8, 15, 12, wrap);
    p.ball(8, 8, 5, 5, hex('#ff5a7a'));
    p.line(5, 5, 11, 11, hex('#ffe0ea'));
    p.line(4, 8, 8, 12, hex('#ffe0ea'));
    p.line(8, 4, 12, 8, hex('#ffe0ea'));
    p.set(6, 5, hex('#ffffff'));
    return p;
  });
}

/** 태엽 열쇠 (W 감기) */
export function windIcon(): Pix {
  return cached('wind', () => {
    const p = new Pix(N, N);
    const brass = hex('#ffc83a');
    p.ball(5, 5, 3.5, 3.5, brass);
    p.ball(11, 5, 3.5, 3.5, brass);
    p.ball(5, 5, 1.2, 1.2, hex('#5a3a1a'));
    p.ball(11, 5, 1.2, 1.2, hex('#5a3a1a'));
    p.rect(7, 6, 2, 9, shade(brass, -0.15));
    p.rect(7, 6, 1, 9, shade(brass, 0.25));
    p.rect(5, 13, 6, 2, shade(brass, -0.3));
    return p;
  });
}

/** 장난감 부품: 종류마다 모양, 부품 색으로 칠한다 */
export function partIcon(id: string, color: string): Pix {
  return cached(`part${id}`, () => {
    const p = new Pix(N, N);
    const c = hex(color);
    const special = id.startsWith('p_');
    switch (id) {
      case 'pin':
        p.line(3, 13, 12, 4, c);
        p.line(4, 13, 13, 4, shade(c, -0.3));
        p.ball(13, 3, 2.5, 2.5, hex('#ff5a6a'));
        break;
      case 'stuffing':
        p.ball(6, 9, 4, 4, c, true);
        p.ball(10, 8, 4, 4, c, true);
        p.ball(8, 6, 3.5, 3.5, shade(c, 0.1), true);
        break;
      case 'cloth':
        p.rect(2, 3, 12, 10, c);
        for (let i = 2; i < 14; i += 3) p.line(i, 3, i, 12, shade(c, -0.2));
        p.line(2, 13, 13, 13, shade(c, -0.4));
        break;
      case 'spring':
        for (let i = 0; i < 5; i++) p.oval(8, 3 + i * 2.4, 5, 1.6, i % 2 ? shade(c, -0.25) : c);
        break;
      case 'buttoneye':
        p.ball(8, 8, 6, 6, c);
        for (const [x, y] of [[6, 6], [10, 6], [6, 10], [10, 10]]) p.set(x, y, hex('#e8e0f0'));
        break;
      case 'rubber':
        for (let a = 0; a < Math.PI * 2; a += 0.12) p.set(Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 4), c);
        for (let a = 0; a < Math.PI * 2; a += 0.12) p.set(Math.round(8 + Math.cos(a) * 5), Math.round(8 + Math.sin(a) * 3), shade(c, -0.25));
        break;
      case 'windkey':
        return windIcon();
      case 'marble':
        p.ball(8, 8, 6, 6, c);
        p.line(4, 9, 11, 6, hex('#ffffff'));
        break;
      case 'thread':
        p.rect(5, 2, 6, 2, hex('#c8a070'));
        p.rect(5, 12, 6, 2, hex('#c8a070'));
        p.rect(6, 4, 4, 8, c);
        for (let y = 5; y < 12; y += 2) p.line(6, y, 9, y, shade(c, -0.3));
        p.line(10, 8, 14, 13, c);
        break;
      case 'clover':
        for (const [x, y] of [[6, 5], [10, 5], [6, 9], [10, 9]]) p.ball(x, y, 2.6, 2.6, c);
        p.line(8, 9, 10, 15, shade(c, -0.3));
        break;
      case 'hourglass':
        p.rect(3, 1, 10, 2, hex('#8a5a34'));
        p.rect(3, 13, 10, 2, hex('#8a5a34'));
        p.tri(4, 3, 12, 3, 8, 8, hex('#d8eef8'));
        p.tri(4, 13, 12, 13, 8, 8, hex('#d8eef8'));
        p.tri(5, 12, 11, 12, 8, 9, c);
        break;
      case 'bandage':
        p.rect(2, 5, 12, 6, c);
        p.rect(6, 5, 4, 6, shade(c, 0.2));
        for (const [x, y] of [[7, 7], [8, 8], [7, 9]]) p.set(x, y, shade(c, -0.3));
        break;
      default:
        // 특별한 부품: 반짝이는 별 메달
        p.ball(8, 9, 6, 6, c);
        star(p, 8, 9, 4.5, 2, special ? hex('#ffffff') : shade(c, 0.3));
        p.rect(6, 1, 4, 3, hex('#e8414f'));
        break;
    }
    return p;
  });
}

export function matIcon(m: MatId): Pix {
  return cached(`m${m}`, () => {
    const p = new Pix(N, N);
    switch (m) {
      case 'fluff':
        p.ball(6, 9, 4, 4, hex('#f4f0f8'), true);
        p.ball(10, 8, 4, 4, hex('#f4f0f8'), true);
        p.ball(8, 6, 3.5, 3.5, hex('#ffffff'), true);
        break;
      case 'gear':
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) p.rect(Math.round(7 + Math.cos(a) * 5), Math.round(7 + Math.sin(a) * 5), 2, 2, hex('#a8b4c0'));
        p.ball(8, 8, 4.5, 4.5, hex('#a8b4c0'));
        p.ball(8, 8, 1.5, 1.5, hex('#4a5058'));
        break;
      case 'sugar':
        p.tri(8, 2, 14, 8, 8, 14, hex('#ffffff'));
        p.tri(8, 2, 2, 8, 8, 14, hex('#e8f0ff'));
        p.set(7, 5, hex('#ffb3c8'));
        break;
      case 'dust':
        for (let i = 0; i < 9; i++) p.ball(4 + ((i * 5) % 9), 4 + ((i * 7) % 9), 1.5, 1.5, hex(i % 2 ? '#c8b0ff' : '#8a6ad0'));
        break;
      case 'star':
        star(p, 8, 8, 7, 3, hex('#ffd84a'));
        p.set(7, 6, hex('#ffffff'));
        break;
    }
    return p;
  });
}

function star(p: Pix, cx: number, cy: number, R: number, r: number, c: Color): void {
  for (let i = 0; i < 5; i++) {
    const a0 = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const a1 = a0 + Math.PI / 5;
    const a2 = a0 - Math.PI / 5;
    p.tri(cx, cy, cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, c);
    p.tri(cx, cy, cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, shade(c, -0.15));
  }
}

/** 단추 (돈) */
export function goldIcon(): Pix {
  return cached('gold', () => {
    const p = new Pix(N, N);
    p.ball(8, 8, 6.5, 6.5, hex('#ffc83a'));
    p.oval(8, 8, 4, 4, hex('#e8a82a'));
    for (const [x, y] of [[6, 6], [10, 6], [6, 10], [10, 10]]) p.rect(x - 0.5, y - 0.5, 1.5, 1.5, hex('#7a4a10'));
    return p;
  });
}

// ───────────────────────── 스킬 ─────────────────────────

/** 스킬 아이콘: 바탕색 + 기호 */
export function skillIcon(id: string): Pix {
  return cached(`s${id}`, () => {
    const p = new Pix(N, N);
    const W = hex('#ffffff');
    const Y = hex('#ffd84a');
    const R = hex('#ff6a4a');
    const B = hex('#7ad0ff');
    const G = hex('#8ae070');
    const P = hex('#c890ff');
    switch (id) {
      case 't_rush':
        for (let i = 0; i < 3; i++) p.line(2, 5 + i * 3, 9, 5 + i * 3, shade(B, -i * 0.15));
        p.tri(9, 3, 15, 8, 9, 13, W);
        break;
      case 't_spin':
        for (let a = 0; a < Math.PI * 1.7; a += 0.1) p.set(Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6), W);
        for (let a = 0; a < Math.PI * 1.7; a += 0.12) p.set(Math.round(8 + Math.cos(a) * 4), Math.round(8 + Math.sin(a) * 4), B);
        p.tri(14, 6, 15, 10, 11, 9, W);
        break;
      case 't_leap':
        for (let x = 1; x < 14; x++) p.set(x, Math.round(12 - Math.sin((x / 13) * Math.PI) * 9), W);
        p.rect(10, 12, 5, 2, Y);
        p.set(9, 13, Y);
        p.set(15, 11, Y);
        break;
      case 't_dance':
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 4;
          p.line(Math.round(8 - Math.cos(a) * 7), Math.round(8 - Math.sin(a) * 7), Math.round(8 + Math.cos(a) * 7), Math.round(8 + Math.sin(a) * 7), i % 2 ? B : W);
        }
        star(p, 8, 8, 3, 1.5, Y);
        break;
      case 'b_slam':
        p.rect(3, 2, 10, 5, hex('#a8b4c0'));
        p.rect(7, 7, 2, 4, hex('#8a5a34'));
        p.line(1, 14, 15, 14, Y);
        p.line(3, 12, 1, 10, Y);
        p.line(13, 12, 15, 10, Y);
        break;
      case 'b_roar':
        for (let k = 0; k < 3; k++)
          for (let a = -0.9; a <= 0.9; a += 0.1) p.set(Math.round(4 + Math.cos(a) * (4 + k * 4)), Math.round(8 + Math.sin(a) * (4 + k * 4)), k === 0 ? W : shade(R, -k * 0.1));
        p.ball(3, 8, 2, 2, R);
        break;
      case 'b_axe':
        p.ball(8, 8, 5, 5, hex('#a8b4c0'));
        p.ball(8, 8, 2, 2, hex('#8a5a34'));
        for (let a = 0; a < Math.PI; a += 0.15) p.set(Math.round(8 + Math.cos(a) * 7), Math.round(8 - Math.sin(a) * 7), W);
        break;
      case 'b_rage':
        p.tri(8, 1, 14, 14, 2, 14, R);
        p.tri(8, 5, 11, 14, 5, 14, Y);
        p.ball(8, 12, 1.5, 1.5, W);
        break;
      case 'r_fan':
        for (let i = -2; i <= 2; i++) {
          const a = -Math.PI / 4 + i * 0.25;
          p.line(2, 14, Math.round(2 + Math.cos(a) * 13), Math.round(14 + Math.sin(a) * 13), i === 0 ? W : G);
        }
        break;
      case 'r_rain':
        for (let i = 0; i < 5; i++) {
          const x = 2 + i * 3;
          const y = 2 + ((i * 5) % 6);
          p.line(x, y, x, y + 6, W);
          p.set(x, y + 7, G);
        }
        p.rect(1, 14, 14, 1, G);
        break;
      case 'r_bomb':
        p.ball(7, 10, 5, 5, hex('#4a4a5a'));
        p.set(5, 8, W);
        p.line(10, 5, 13, 2, hex('#c8a070'));
        star(p, 13, 2, 3, 1, Y);
        break;
      case 'r_hunt':
        for (let a = 0; a < Math.PI * 2; a += 0.12) p.set(Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6), R);
        p.ball(8, 8, 2, 2, R);
        p.line(8, 0, 8, 4, W);
        p.line(8, 12, 8, 15, W);
        p.line(0, 8, 4, 8, W);
        p.line(12, 8, 15, 8, W);
        break;
      case 'n_fire':
        p.ball(9, 9, 5, 5, hex('#ff8a3a'));
        p.ball(10, 10, 3, 3, Y);
        p.tri(5, 6, 1, 3, 6, 10, R);
        break;
      case 'n_frost':
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3;
          p.line(Math.round(8 - Math.cos(a) * 7), Math.round(8 - Math.sin(a) * 7), Math.round(8 + Math.cos(a) * 7), Math.round(8 + Math.sin(a) * 7), B);
        }
        p.ball(8, 8, 2, 2, W);
        break;
      case 'n_chain':
        p.line(3, 1, 9, 6, Y);
        p.line(9, 6, 5, 9, Y);
        p.line(5, 9, 12, 15, Y);
        p.line(4, 1, 10, 6, W);
        p.line(6, 9, 13, 15, W);
        break;
      case 'n_meteor':
        p.line(1, 1, 9, 9, hex('#ff8a3a'));
        p.line(2, 1, 10, 8, Y);
        p.line(1, 3, 8, 10, R);
        p.ball(11, 11, 4, 4, hex('#a85a3a'));
        p.set(10, 10, Y);
        break;
      default:
        // 지속 효과
        star(p, 8, 8, 7, 3, P);
        p.ball(8, 8, 2, 2, W);
    }
    return p;
  });
}

/** 스킬 아이콘 바탕 (직업 색) */
export const SKILL_BG: Record<string, string> = { t: '#3a5a8a', b: '#8a4a3a', r: '#3a7a4a', n: '#6a4a9a' };

/** 심부름 물건: 리본 묶은 보따리 */
export function errandIcon(): Pix {
  return cached('errand', () => {
    const p = new Pix(N, N);
    p.ball(8, 10, 6, 5, hex('#f0c870'), true);
    p.tri(4, 5, 12, 5, 8, 9, hex('#e8b050'));
    p.rect(6, 4, 4, 2, hex('#e8414f'));
    p.set(5, 3, hex('#e8414f'));
    p.set(10, 3, hex('#e8414f'));
    p.set(6, 8, hex('#fff4c0'));
    return p;
  });
}
