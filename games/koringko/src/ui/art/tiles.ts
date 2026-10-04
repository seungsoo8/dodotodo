/** 땅 타일 (24×24): 자리마다 무늬가 조금씩 다르다 */
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';

export const T = 24;

const GRASS = hex('#5ea24e');
const DIRT = hex('#c89a64');
const PLAZA = hex('#cfc4ae');
const WOOD = hex('#a8743e');
const CAVE = hex('#6a5e58');
const CANDY = hex('#f7b8d2');
const BISCUIT = hex('#e8c27c');
const RIFT = hex('#4e3e72');
const WATER = hex('#4a9ae0');
const CHOCO = hex('#7a4a30');

/** 바탕 땅 글자: 막힌 칸(나무 등) 아래에 깔 땅 */
export function groundUnder(c: string, theme: string): string {
  if (theme === 'candy') {
    // 과자 언덕: 꽃은 젤리꽃, 강은 초콜릿
    if (c === ',' || c === 'g') return '*';
    if (c === '~') return '%';
    if (c === '.') return 'p';
  }
  if ('.,g:#=_pqr~v'.includes(c)) return c;
  if (c === 'c') return theme === 'rift' ? 'r' : '_';
  if (c === 'C') return '_';
  if (c === 'R') return 'r';
  if (c === 'k' || c === 'l') return 'p';
  if (theme === 'cave') return '_';
  if (theme === 'candy') return 'p';
  if (theme === 'rift') return 'r';
  return '.';
}

function speckle(p: Pix, base: Color, tx: number, ty: number, n: number, seed: number, light = 0.12, dark = -0.15): void {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash2(tx * 31 + i, ty * 17, seed) * T);
    const y = Math.floor(hash2(tx * 13, ty * 29 + i, seed + 1) * T);
    p.set(x, y, shade(base, hash2(i, seed, tx + ty) < 0.5 ? light : dark));
  }
}

/** 한 칸의 땅 그림 (tx, ty: 자리 · 무늬 고르기용) */
export function groundTile(c: string, tx: number, ty: number, frame = 0): Pix {
  const p = new Pix(T, T);
  const h = (i: number) => hash2(tx, ty, i);
  switch (c) {
    case '.':
    case ',':
    case 'g':
    case 'H':
    case 'X':
    default: {
      p.rect(0, 0, T, T, GRASS);
      // 풀잎
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(hash2(tx * 7 + i, ty, 3) * T);
        const y = Math.floor(hash2(tx, ty * 5 + i, 4) * (T - 2)) + 2;
        const cl = i % 3 === 0 ? shade(GRASS, 0.18) : shade(GRASS, -0.18);
        p.set(x, y, cl);
        p.set(x, y - 1, i % 3 === 0 ? shade(GRASS, 0.3) : cl);
      }
      if (h(9) < 0.25) p.oval(h(1) * 18 + 3, h(2) * 18 + 3, 3, 2, shade(GRASS, 0.08));
      if (c === ',') {
        const cols = [hex('#ffffff'), hex('#ffd84a'), hex('#ff8ab8'), hex('#a8c8ff')];
        for (let i = 0; i < 5; i++) {
          const x = Math.floor(hash2(tx, ty + i, 7) * 20) + 2;
          const y = Math.floor(hash2(tx + i, ty, 8) * 20) + 2;
          const col = cols[Math.floor(hash2(tx, ty, i + 11) * cols.length)];
          p.set(x, y, col);
          p.set(x - 1, y, shade(col, -0.2));
          p.set(x + 1, y, shade(col, -0.2));
          p.set(x, y - 1, shade(col, -0.2));
          p.set(x, y + 1, hex('#3e7a34'));
        }
      }
      if (c === 'g') {
        for (let i = 0; i < 4; i++) {
          const x = Math.floor(hash2(tx + i, ty, 12) * 18) + 3;
          const y = Math.floor(hash2(tx, ty + i, 13) * 12) + 10;
          const d = shade(GRASS, -0.3);
          p.line(x, y, x - 2, y - 6, d);
          p.line(x + 1, y, x + 1, y - 7, shade(GRASS, 0.15));
          p.line(x + 2, y, x + 4, y - 5, d);
        }
      }
      break;
    }
    case ':':
      p.rect(0, 0, T, T, DIRT);
      speckle(p, DIRT, tx, ty, 18, 21);
      for (let i = 0; i < 2; i++) {
        const x = h(i + 3) * 18 + 3;
        const y = h(i + 5) * 18 + 3;
        p.oval(x, y, 1.6, 1.2, hex('#9a8a7a'));
        p.set(Math.floor(x) - 1, Math.floor(y) - 1, hex('#d8d0c4'));
      }
      break;
    case '#': {
      p.rect(0, 0, T, T, PLAZA);
      const m = shade(PLAZA, -0.25);
      for (let row = 0; row < 3; row++) {
        const y = row * 8;
        p.rect(0, y, T, 1, m);
        const off = (row + ty) % 2 ? 0 : 6;
        for (let x = off; x < T; x += 12) p.rect(x, y, 1, 8, m);
        for (let x = off + 1; x < T; x += 12) p.rect(x, y + 1, 10, 1, shade(PLAZA, 0.15));
      }
      speckle(p, PLAZA, tx, ty, 6, 31, 0.08, -0.1);
      break;
    }
    case '=':
      for (let i = 0; i < 4; i++) {
        const c2 = shade(WOOD, (i % 2 ? -0.06 : 0.04) + (hash2(tx, ty, i) - 0.5) * 0.08);
        p.rect(0, i * 6, T, 6, c2);
        p.rect(0, i * 6 + 5, T, 1, shade(WOOD, -0.35));
        p.rect(0, i * 6, T, 1, shade(WOOD, 0.2));
        p.set(4 + i * 3, i * 6 + 2, shade(WOOD, -0.4));
        p.set(18 - i * 2, i * 6 + 3, shade(WOOD, -0.4));
      }
      break;
    case '_':
      p.rect(0, 0, T, T, CAVE);
      speckle(p, CAVE, tx, ty, 22, 41, 0.1, -0.18);
      if (h(4) < 0.3) p.oval(h(5) * 16 + 4, h(6) * 16 + 4, 4, 2.5, shade(CAVE, -0.08));
      break;
    case 'p':
      p.rect(0, 0, T, T, CANDY);
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(hash2(tx + i, ty, 51) * 21) + 1;
        const y = Math.floor(hash2(tx, ty + i, 52) * 21) + 1;
        const cols = [hex('#ffffff'), hex('#7ad8f0'), hex('#ffe04a'), hex('#a0e070'), hex('#c890f0')];
        const col = cols[i % cols.length];
        if (hash2(i, tx, ty) < 0.5) p.rect(x, y, 2, 1, col);
        else p.rect(x, y, 1, 2, col);
      }
      break;
    case '*': {
      p.rect(0, 0, T, T, CANDY);
      const cols = [hex('#ff6aa8'), hex('#7ad8f0'), hex('#ffe04a'), hex('#a0e070')];
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(hash2(tx, ty + i, 57) * 18) + 3;
        const y = Math.floor(hash2(tx + i, ty, 58) * 16) + 4;
        const col = cols[Math.floor(hash2(tx, ty, i + 59) * cols.length)];
        // 젤리 방울
        p.rect(x - 1, y, 3, 2, col);
        p.set(x, y - 1, col);
        p.set(x - 1, y, shade(col, 0.45));
        p.rect(x - 1, y + 2, 3, 1, shade(col, -0.35));
      }
      for (let i = 0; i < 4; i++) p.set(Math.floor(hash2(tx + i, ty, 56) * T), Math.floor(hash2(tx, ty + i, 55) * T), hex('#ffffff'));
      break;
    }
    case '%': {
      p.rect(0, 0, T, T, CHOCO);
      for (let i = 0; i < 4; i++) {
        const y = Math.floor(hash2(tx, ty + i, 85) * 20) + 2;
        const x = (Math.floor(hash2(tx + i, ty, 86) * 18) + frame * 3) % 20;
        p.rect(x, y, 5, 1, shade(CHOCO, 0.3));
        p.set(x + 1, y - 1, shade(CHOCO, 0.5));
      }
      speckle(p, CHOCO, tx, ty, 6, 87, 0.1, -0.15);
      break;
    }
    case 'q':
      p.rect(0, 0, T, T, BISCUIT);
      speckle(p, BISCUIT, tx, ty, 10, 61, 0.15, -0.12);
      for (let i = 0; i < 3; i++) p.oval(4 + i * 8, 12 + ((i + tx) % 2) * 6 - 3, 1.2, 1.2, shade(BISCUIT, -0.3));
      break;
    case 'r': {
      // 큰 돌판 (2×2 칸마다 줄눈)
      p.rect(0, 0, T, T, shade(RIFT, (hash2(tx >> 1, ty >> 1, 70) - 0.5) * 0.1));
      const m = shade(RIFT, -0.28);
      if (ty % 2 === 0) {
        p.rect(0, 0, T, 1, m);
        p.rect(0, 1, T, 1, shade(RIFT, 0.12));
      }
      if (tx % 2 === 0) p.rect(0, 0, 1, T, m);
      speckle(p, RIFT, tx, ty, 8, 71, 0.12, -0.12);
      if (h(8) < 0.12) {
        // 반짝이는 먼지
        const x = Math.floor(h(9) * 16) + 4;
        const y = Math.floor(h(10) * 16) + 4;
        p.set(x, y, hex('#d8c4ff'));
        p.set(x + 2, y + 1, hex('#8a6ad0'));
        p.set(x - 1, y + 2, hex('#8a6ad0'));
      }
      break;
    }
    case '~': {
      p.rect(0, 0, T, T, WATER);
      for (let i = 0; i < 5; i++) {
        const y = Math.floor(hash2(tx, ty + i, 81) * 20) + 2;
        const x = (Math.floor(hash2(tx + i, ty, 82) * 18) + frame * 3) % 20;
        p.rect(x, y, 4, 1, shade(WATER, 0.35));
        p.set(x + 1, y - 1, shade(WATER, 0.55));
      }
      speckle(p, WATER, tx, ty + frame, 6, 83, 0.12, -0.12);
      break;
    }
    case 'v':
      break;
  }
  return p;
}

/** 물가 거품 · 길 가장자리: 이웃이 다른 땅이면 경계에 테두리 */
export function edgeColor(c: string): Color | null {
  switch (c) {
    case '~':
      return hex('#d8f0ff');
    case ':':
      return mix(DIRT, GRASS, 0.5);
    case '#':
      return shade(PLAZA, -0.35);
    case 'q':
      return shade(BISCUIT, -0.25);
    default:
      return null;
  }
}

/** 벽 칸 (동굴 C · 균열 R): 위는 바위 윗면, 아래가 바닥이면 앞면이 보인다 */
export function wallTile(c: string, tx: number, ty: number, frontVisible: boolean): Pix {
  const base = c === 'R' ? hex('#2a2044') : hex('#33291f');
  const p = new Pix(T, T);
  p.rect(0, 0, T, T, base);
  // 울퉁불퉁한 바위 윗면
  for (let i = 0; i < 3; i++) {
    const x = hash2(tx, ty, 92 + i) * 16 + 4;
    const y = hash2(ty, tx, 95 + i) * (frontVisible ? 6 : 16) + 4;
    p.oval(x, y, 4 + hash2(tx, i, 9) * 3, 3, shade(base, 0.12 + i * 0.04));
    p.set(Math.floor(x) - 1, Math.floor(y) - 2, shade(base, 0.35));
  }
  speckle(p, base, tx, ty, 10, 91, 0.2, -0.15);
  if (frontVisible) {
    const face = c === 'R' ? hex('#4a3a70') : hex('#6e5c4a');
    p.rect(0, 12, T, 12, face);
    for (let x = 0; x < T; x += 6) {
      const xx = x + ((ty + tx) % 2) * 3;
      p.rect(xx, 13, 1, 11, shade(face, -0.35));
      p.rect(xx + 1, 13, 1, 11, shade(face, 0.12));
    }
    p.rect(0, 18 + (tx % 2), T, 1, shade(face, -0.25));
    p.rect(0, 12, T, 1, shade(face, 0.35));
    p.rect(0, 23, T, 1, shade(face, -0.5));
  }
  return p;
}
