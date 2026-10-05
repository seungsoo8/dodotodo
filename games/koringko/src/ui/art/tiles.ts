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
  if (theme === 'factory') {
    if (c === 'K' || c === 'M' || c === 'H' || c === '.') return 'm';
  }
  if ('.,g:#=_pqrm~vawdubnyjsh'.includes(c)) return c;
  if (c === 'F') return 'n';
  if (c === 'G' || c === 'E') return 'd';
  if (c === 'L' || c === 'Y') return 'u';
  if (c === 'c') return theme === 'rift' ? 'r' : '_';
  if (c === 'C') return '_';
  if (c === 'R') return 'r';
  if (c === 'k' || c === 'l') return 'p';
  if (theme === 'cave') return '_';
  if (theme === 'candy') return 'p';
  if (theme === 'village') return 'a';
  if (theme === 'toybox') return 'w';
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
    case '#':
      puzzleMat(p, tx, ty);
      break;
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
      fondant(p, tx, ty);
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
      biscuit(p, tx, ty);
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
    case 'm': {
      // 쇠 바닥: 큰 판 · 리벳 · 줄무늬
      const M = hex('#7a7e8a');
      p.rect(0, 0, T, T, shade(M, (hash2(tx >> 1, ty >> 1, 77) - 0.5) * 0.08));
      if (ty % 2 === 0) p.rect(0, 0, T, 1, shade(M, -0.3));
      if (tx % 2 === 0) p.rect(0, 0, 1, T, shade(M, -0.3));
      p.rect(1, 1, T - 1, 1, shade(M, 0.12));
      for (const [rx, ry] of [[3, 3], [T - 4, 3], [3, T - 4], [T - 4, T - 4]]) {
        p.set(rx, ry, shade(M, 0.35));
        p.set(rx + 1, ry + 1, shade(M, -0.35));
      }
      if (h(3) < 0.15) for (let i = 0; i < 4; i++) p.line(4 + i * 4, 18, 8 + i * 4, 14, hex('#e0b030'));
      if (h(5) < 0.1) p.oval(h(6) * 14 + 5, h(7) * 14 + 5, 3, 1.6, hex('#3a3a44'));
      speckle(p, M, tx, ty, 6, 78, 0.1, -0.12);
      break;
    }
    case 'b': {
      // 욕실 타일: 반 칸짜리 네모 · 줄눈 · 모서리 광택, 가끔 금 간 타일
      const B = hex('#c6d2d8');
      const G = shade(B, -0.32);
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const k = hash2(tx * 2 + i, ty * 2 + j, 611);
          const c = shade(B, (k - 0.5) * 0.08);
          p.rect(i * 12, j * 12, 12, 12, c);
          p.rect(i * 12 + 1, j * 12 + 1, 4, 1, shade(c, 0.18));
          p.rect(i * 12 + 1, j * 12 + 1, 1, 3, shade(c, 0.12));
          if (k < 0.04) p.line(i * 12 + 3, j * 12 + 9, i * 12 + 9, j * 12 + 4, shade(c, -0.25));
        }
      p.rect(0, 0, T, 1, G);
      p.rect(0, 12, T, 1, G);
      p.rect(0, 0, 1, T, G);
      p.rect(12, 0, 1, T, G);
      break;
    }
    case 'n': {
      // 조각보 이불: 큰 네모 천 조각마다 색이 다르고, 가장자리에 바느질 땀
      const QUILT = ['#c88a7a', '#d8b884', '#8aa0b8', '#b89ac0', '#a8c08a', '#e0c8b0'].map(hex);
      const c = shade(QUILT[Math.floor(hash2(tx >> 1, ty >> 1, 640) * QUILT.length)], -0.22);
      p.rect(0, 0, T, T, c);
      speckle(p, c, tx, ty, 8, 641, 0.08, -0.08);
      if (tx % 2 === 0) for (let y = 1; y < T; y += 4) p.rect(0, y, 1, 2, shade(c, 0.35));
      if (ty % 2 === 0) for (let x = 1; x < T; x += 4) p.rect(x, 0, 2, 1, shade(c, 0.35));
      if (hash2(tx, ty, 642) < 0.12) p.oval(12, 12, 3, 3, shade(c, -0.12));
      break;
    }
    case 'y': {
      // 책가방 안감: 짙은 남색 나일론 결 · 박음질 줄
      const Y = hex('#3a4a6a');
      p.rect(0, 0, T, T, Y);
      for (let y = 0; y < T; y += 3) p.rect(0, y, T, 1, shade(Y, (y / 3) % 2 ? 0.05 : -0.04));
      if (ty % 4 === 0) for (let x = 0; x < T; x += 4) p.rect(x, 6, 2, 1, shade(Y, 0.4));
      speckle(p, Y, tx, ty, 5, 650, 0.12, -0.1);
      break;
    }
    case 'a':
      wovenRug(p, tx, ty);
      break;
    case 'w':
      plankFloor(p, tx, ty);
      break;
    case 'd':
      deskWood(p, tx, ty);
      break;
    case 'u': {
      // 침대 밑 바닥: 잿빛 먼지 · 보풀 · 머리카락
      const U = hex('#5a5262');
      p.rect(0, 0, T, T, U);
      speckle(p, U, tx, ty, 18, 95, 0.14, -0.12);
      for (let i = 0; i < 2; i++) if (h(96 + i) < 0.4) p.line(h(98 + i) * 20, h(100 + i) * 20, h(102 + i) * 24, h(104 + i) * 24, shade(U, 0.22));
      if (h(106) < 0.08) p.oval(12, 12, 4, 3, shade(U, 0.3));
      break;
    }
    case 'j': {
      // 아스팔트 (장난감 눈높이): 굵은 자갈알 · 검은 땜질 자국 · 가끔 갈라진 금
      const A = hex('#3c3f48');
      p.rect(0, 0, T, T, shade(A, (hash2(tx >> 2, ty >> 2, 660) - 0.5) * 0.06));
      speckle(p, A, tx, ty, 34, 661, 0.18, -0.2);
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(h(662 + i) * 20) + 2;
        const y = Math.floor(h(665 + i) * 20) + 2;
        p.rect(x, y, 2, 1, shade(A, 0.28));
        p.set(x, y + 1, shade(A, -0.3));
      }
      if (h(668) < 0.08) p.oval(h(669) * 14 + 5, h(670) * 14 + 5, 5, 3, shade(A, -0.22));
      if (h(671) < 0.1) {
        let x = Math.floor(h(672) * 12) + 6;
        for (let y = 0; y < T; y += 3) {
          x += hash2(tx, y, 673) < 0.5 ? -1 : 1;
          p.rect(x, y, 1, 3, shade(A, -0.4));
        }
      }
      break;
    }
    case 's': {
      // 놀이터 모래: 고운 알갱이 · 작은 돌 · 가끔 발자국처럼 팬 자리
      const S = hex('#d6bc84');
      p.rect(0, 0, T, T, shade(S, (hash2(tx >> 1, ty >> 1, 680) - 0.5) * 0.06));
      speckle(p, S, tx, ty, 40, 681, 0.12, -0.12);
      if (h(682) < 0.18) p.oval(h(683) * 14 + 5, h(684) * 14 + 5, 3.5, 2, shade(S, -0.1));
      if (h(685) < 0.2) {
        const x = Math.floor(h(686) * 18) + 3;
        const y = Math.floor(h(687) * 18) + 3;
        p.rect(x, y, 2, 2, hex('#9a9084'));
        p.set(x, y, hex('#c8c0b4'));
      }
      break;
    }
    case 'h': {
      // 보도블록: 반 칸짜리 네모 돌 · 줄눈 · 돌마다 조금씩 다른 색
      const Hc = hex('#9c968a');
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const k = hash2(tx * 2 + i, ty * 2 + j, 690);
          const c = shade(Hc, (k - 0.5) * 0.14);
          p.rect(i * 12, j * 12, 12, 12, c);
          p.rect(i * 12 + 1, j * 12 + 1, 10, 1, shade(c, 0.12));
          speckle(p, c, tx * 2 + i, ty * 2 + j, 3, 691, 0.1, -0.12);
        }
      const g = shade(Hc, -0.38);
      p.rect(0, 0, T, 1, g);
      p.rect(0, 12, T, 1, g);
      p.rect(0, 0, 1, T, g);
      p.rect(12, 0, 1, T, g);
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
      return hex('#3e3038');
    case 'q':
      return shade(BISCUIT, -0.25);
    default:
      return null;
  }
}

/** 벽 칸 (동굴 C · 균열 R): 위는 바위 윗면, 아래가 바닥이면 앞면이 보인다 */
export function wallTile(c: string, tx: number, ty: number, frontVisible: boolean): Pix {
  if (c === 'E') return bookWall(tx, ty, frontVisible);
  if (c === 'F') return blanketWall(tx, ty, frontVisible);
  if (c === 'Y') return dustWall(tx, ty, frontVisible);
  if (c === 'J') return brickWall(tx, ty, frontVisible);
  if (c === 'Z') return curbWall(tx, ty, frontVisible);
  if (c === 'I') return ironPole(tx, ty, frontVisible);
  const base = c === 'R' ? hex('#2a2044') : c === 'M' ? hex('#3a3e4a') : hex('#33291f');
  const p = new Pix(T, T);
  p.rect(0, 0, T, T, base);
  if (c === 'M') {
    // 쇠판 윗면: 판 테두리와 리벳
    p.rect(0, 0, T, 1, shade(base, 0.25));
    p.rect(0, 0, 1, T, shade(base, 0.15));
    p.rect(T - 1, 0, 1, T, shade(base, -0.25));
    for (const [rx, ry] of [[3, 3], [T - 4, 3]]) p.set(rx, ry, shade(base, 0.45));
    if ((tx + ty) % 3 === 0) p.rect(4, 8, T - 8, 2, shade(base, -0.2));
  } else
  // 울퉁불퉁한 바위 윗면
  for (let i = 0; i < 3; i++) {
    const x = hash2(tx, ty, 92 + i) * 16 + 4;
    const y = hash2(ty, tx, 95 + i) * (frontVisible ? 6 : 16) + 4;
    p.oval(x, y, 4 + hash2(tx, i, 9) * 3, 3, shade(base, 0.12 + i * 0.04));
    p.set(Math.floor(x) - 1, Math.floor(y) - 2, shade(base, 0.35));
  }
  if (c !== 'M') speckle(p, base, tx, ty, 10, 91, 0.2, -0.15);
  if (frontVisible) {
    const face = c === 'R' ? hex('#4a3a70') : c === 'M' ? hex('#5a6070') : hex('#6e5c4a');
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

/** 벽돌 담: 위는 시멘트 갓돌, 앞은 붉은 벽돌 줄 */
function brickWall(tx: number, ty: number, front: boolean): Pix {
  const p = new Pix(T, T);
  // 위에서 본 담 머리: 어두운 벽돌을 눕혀 쌓은 줄 · 사이사이 이끼
  const cap = hex('#5a3a32');
  p.rect(0, 0, T, T, shade(cap, -0.35));
  for (let row = 0; row < 4; row++) {
    const off = (row + tx) % 2 ? 6 : 0;
    for (let x = -12 + off; x < T; x += 12) {
      const c = shade(cap, (hash2(tx * 2 + x, ty * 4 + row, 700) - 0.5) * 0.25);
      p.rect(Math.max(0, x + 1), row * 6 + 1, Math.min(10, 10 + x + 1, T - x - 1), 4, c);
    }
  }
  if (hash2(tx, ty, 701) < 0.2) p.oval(hash2(tx, ty, 702) * 14 + 5, hash2(tx, ty, 703) * 8 + 4, 3, 1.5, hex('#3e5a34'));
  if (front) {
    const brick = hex('#94503c');
    const mortar = hex('#5a4038');
    p.rect(0, 10, T, 14, mortar);
    for (let row = 0; row < 3; row++) {
      const y = 11 + row * 4;
      const off = (row + ty) % 2 ? 4 : 0;
      for (let x = -8 + off; x < T; x += 8) {
        const c = shade(brick, (hash2(tx * 4 + x, ty * 3 + row, 704) - 0.5) * 0.2);
        p.rect(Math.max(0, x), y, Math.min(7, 7 + x, T - x), 3, c);
        if (x >= 0) p.rect(x, y, Math.min(7, T - x), 1, shade(c, 0.15));
      }
    }
    p.rect(0, 10, T, 1, hex('#8a847a'));
    p.rect(0, 23, T, 1, shade(mortar, -0.4));
  }
  return p;
}

/** 보도 연석: 낮은 시멘트 턱 (장난감에겐 넘을 수 없는 절벽) */
function curbWall(tx: number, ty: number, front: boolean): Pix {
  const p = new Pix(T, T);
  const top = hex('#b4b0a6');
  p.rect(0, 0, T, T, top);
  speckle(p, top, tx, ty, 14, 710, 0.1, -0.14);
  p.rect(0, 0, T, 1, shade(top, 0.2));
  if (tx % 2 === 0) p.rect(0, 0, 1, T, shade(top, -0.3));
  if (front) {
    const face = hex('#8a8680');
    p.rect(0, 14, T, 10, face);
    speckle(p, face, tx, ty + 50, 8, 711, 0.1, -0.15);
    p.rect(0, 14, T, 1, shade(top, 0.25));
    p.rect(0, 23, T, 1, shade(face, -0.45));
    if (tx % 2 === 0) p.rect(0, 14, 1, 10, shade(face, -0.3));
  }
  return p;
}

/** 쇠 기둥 (전봇대 · 가로등 · 그네 · 미끄럼틀 다리): 위에서 본 둥근 기둥, 앞은 원통 */
function ironPole(tx: number, ty: number, front: boolean): Pix {
  const p = new Pix(T, T);
  const ground = hex('#2a2c32');
  const iron = hex('#4e6466');
  p.rect(0, 0, T, T, ground);
  p.oval(12, front ? 9 : 12, 10, front ? 7 : 10, shade(iron, -0.2));
  p.oval(11, front ? 8 : 11, 8, front ? 5 : 8, iron);
  p.oval(9, front ? 7 : 9, 3, 2, shade(iron, 0.3));
  if (front) {
    for (let x = 2; x < 22; x++) {
      const k = x < 6 ? 0.25 : x < 9 ? 0.1 : x > 18 ? -0.35 : -0.08;
      p.rect(x, 9, 1, 15, shade(iron, k));
    }
    p.rect(2, 16, 20, 1, shade(iron, -0.3));
    p.rect(2, 23, 20, 1, shade(iron, -0.5));
    if (hash2(tx, ty, 720) < 0.5) p.rect(9, 12, 6, 3, hex('#d8d0b0'));
  }
  return p;
}

const SPINES = ['#c84a4a', '#3a6ab8', '#e8b040', '#4a9a5a', '#8a5ab8', '#e8e0d0', '#d87a3a'].map(hex);

/** 책 더미 벽: 위는 책 표지, 앞은 알록달록 책등 */
function bookWall(tx: number, ty: number, front: boolean): Pix {
  const p = new Pix(T, T);
  // 위에서 보면 쌓인 책 표지: 차분한 가죽색, 큰 덩어리마다 조금씩 다르다
  const leather = [hex('#5a3a2e'), hex('#4a3a4e'), hex('#3e4a3a')][Math.floor(hash2(tx >> 2, ty >> 2, 120) * 3)];
  p.rect(0, 0, T, T, leather);
  p.rect(0, 0, T, 1, shade(leather, 0.18));
  if ((tx + ty * 3) % 4 === 0) p.rect(0, 11, T, 2, hex('#e8dcc0'));
  if (hash2(tx, ty, 121) < 0.15) p.rect(5, 4, 8, 3, hex('#d8b040'));
  if (front) {
    let x = 0;
    let k = 0;
    while (x < T) {
      const w = 3 + Math.floor(hash2(tx * 7 + k, ty, 122) * 4);
      const c = SPINES[Math.floor(hash2(tx + k, ty * 3, 123) * SPINES.length)];
      const hh = 9 + Math.floor(hash2(k, tx, ty) * 3);
      p.rect(x, T - hh, w, hh, c);
      p.rect(x, T - hh, 1, hh, shade(c, 0.25));
      p.rect(x + w - 1, T - hh, 1, hh, shade(c, -0.35));
      p.rect(x + 1, T - hh + 3, w - 2, 1, hex('#f0e0a0'));
      x += w;
      k++;
    }
    p.rect(0, T - 1, T, 1, hex('#2a1810'));
  }
  return p;
}

const BLANKETS = ['#e8d0c0', '#b8c8e0', '#e0b8b8', '#d0e0c0', '#e8e0b0', '#c8b8d8'].map(hex);

/** 개어 쌓은 이불 벽: 위는 부드러운 천, 앞은 겹겹이 쌓인 이불 단 */
function blanketWall(tx: number, ty: number, front: boolean): Pix {
  const p = new Pix(T, T);
  const top = BLANKETS[Math.floor(hash2(tx >> 1, ty >> 1, 660) * BLANKETS.length)];
  p.rect(0, 0, T, T, top);
  for (let i = 0; i < 3; i++) p.ball(hash2(tx, ty, 661 + i) * T, hash2(ty, tx, 664 + i) * (front ? 10 : T), 6, 3, shade(top, 0.08), true);
  p.rect(0, 0, T, 1, shade(top, 0.2));
  if (front) {
    let y = 10;
    let k = 0;
    while (y < T - 1) {
      const c = BLANKETS[Math.floor(hash2(tx >> 1, ty * 5 + k, 667) * BLANKETS.length)];
      const h = 3 + Math.floor(hash2(k, tx >> 1, ty) * 2);
      p.rect(0, y, T, h, c);
      p.rect(0, y, T, 1, shade(c, 0.25));
      p.rect(0, y + h - 1, T, 1, shade(c, -0.3));
      // 접힌 끝이 둥글게
      if ((tx + k) % 3 === 0) p.rect(T - 2, y + 1, 2, h - 2, shade(c, -0.15));
      y += h;
      k++;
    }
    p.rect(0, T - 1, T, 1, shade(top, -0.55));
  }
  return p;
}

/** 먼지 덩이 벽: 뭉게뭉게 회색 먼지 */
function dustWall(tx: number, ty: number, front: boolean): Pix {
  const p = new Pix(T, T);
  const base = hex('#3e3848');
  p.rect(0, 0, T, T, base);
  for (let i = 0; i < 4; i++) p.ball(hash2(tx, ty, 130 + i) * T, hash2(ty, tx, 134 + i) * (front ? 12 : T), 5 + hash2(i, tx, ty) * 3, 4, shade(base, 0.12 + i * 0.03), true);
  if (front) {
    const face = hex('#4e4658');
    p.rect(0, 13, T, 11, face);
    for (let x = 0; x < T; x += 4) p.ball(x + 2, 13, 3, 2.5, shade(face, 0.15), true);
    p.rect(0, 23, T, 1, shade(face, -0.5));
  }
  return p;
}

// ───────────────────────── 아이 방 바닥 (전체 좌표로 그려 타일 무늬가 되풀이되지 않는다) ─────────────────────────

const OAK = hex('#b47c4c');

/** 마룻바닥: 길이가 제각각인 판자, 물결 나뭇결, 옹이, 못 */
function plankFloor(p: Pix, tx: number, ty: number): void {
  for (let y = 0; y < T; y++) {
    const gy = ty * T + y;
    const row = Math.floor(gy / 16);
    const ry = gy % 16;
    const L = 60 + Math.floor(hash2(row, 0, 62) * 70);
    const off = Math.floor(hash2(row, 1, 63) * L);
    for (let x = 0; x < T; x++) {
      const gx = tx * T + x;
      const pid = Math.floor((gx + off) / L);
      const px = (gx + off) % L;
      const base = shade(OAK, (hash2(pid, row, 64) - 0.5) * 0.14);
      let c = base;
      const grain = ry + Math.sin(gx * 0.05 + pid * 2.3) * 1.7 + Math.sin(gx * 0.17 + row) * 0.5;
      if (Math.abs(grain - 5) < 0.4 || Math.abs(grain - 11) < 0.3) c = shade(base, -0.07);
      else if (Math.abs(grain - 8) < 0.3) c = shade(base, 0.04);
      if (hash2(pid, row, 65) < 0.22) {
        const kx = 6 + Math.floor(hash2(pid, row, 66) * Math.max(1, L - 12));
        const d = Math.hypot((px - kx) * 0.5, ry - 8);
        if (d < 1.5) c = shade(base, -0.18);
        else if (d < 3) c = shade(base, -0.08);
      }
      if (ry === 0) c = shade(c, 0.06);
      if (ry === 15) c = shade(OAK, -0.3);
      if (px === 0) c = shade(OAK, -0.28);
      else if (px === 1) c = shade(c, 0.05);
      if (px === 3 && (ry === 4 || ry === 11)) c = shade(base, -0.25);
      p.set(x, y, c);
    }
  }
}

const RUG = hex('#9c5446');
const RUG_LINE = hex('#e3cfa4');
const RUG_GOLD = hex('#d8a548');
const RUG_NAVY = hex('#3e4a78');
const RUG_P = 112;

/** 블록 마을 양탄자: 짠 결, 비스듬한 격자, 격자 가운데 꽃 무늬 */
function wovenRug(p: Pix, tx: number, ty: number): void {
  const mod = (v: number) => ((v % RUG_P) + RUG_P) % RUG_P;
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const gx = tx * T + x;
      const gy = ty * T + y;
      const u = mod(gx + gy);
      const v = mod(gx - gy);
      // 손으로 짠 결: 실 매듭마다 염색이 조금씩 다르다
      const dye = (hash2(Math.floor(gx / 3), Math.floor(gy / 2), 84) - 0.5) * 0.09;
      let c = shade(RUG, dye + ((gx + (gy >> 1)) % 2 === 0 ? 0 : -0.05));
      if (gy % 3 === 0) c = shade(c, -0.04);
      if (u < 2 || v < 2) c = mix(RUG_LINE, RUG, 0.35);
      else if (u === 2 || v === 2) c = shade(RUG, -0.2);
      // 격자 가운데 꽃: 꽃잎 여섯
      const du = (u - 56) / 1.414;
      const dv = (v - 56) / 1.414;
      const r = Math.hypot(du, dv);
      const petal = 8 + 2.5 * Math.cos(Math.atan2(dv, du) * 6);
      if (r < 2.5) c = RUG_NAVY;
      else if (r < petal) c = r < 4 ? shade(RUG_GOLD, 0.15) : RUG_GOLD;
      else if (r < petal + 1.2) c = shade(RUG, -0.3);
      if (hash2(gx, gy, 83) < 0.03) c = shade(c, 0.14);
      p.set(x, y, c);
    }
}

const MAT = ['#c98f78', '#8fb3a8', '#d8bf86', '#a39bbf'].map((c) => mix(hex(c), hex('#b8a898'), 0.35));
/** 매트 한 장 = 2×2 칸 */
const PIECE = T * 2;
const matColor = (px: number, py: number) => MAT[(((px + py * 2) % 4) + 4) % 4];

/** 전체 좌표 (gx, gy) 의 매트 색: 이웃 매트의 돌기가 파고든 곳은 그 매트 색 */
function matAt(gx: number, gy: number): Color {
  const px = Math.floor(gx / PIECE);
  const py = Math.floor(gy / PIECE);
  const lx = gx - px * PIECE;
  const ly = gy - py * PIECE;
  const mid = PIECE / 2;
  const knob = (cx: number, cy: number, neck: boolean) => Math.hypot(lx + 0.5 - cx, ly + 0.5 - cy) < 5 || neck;
  if (hash2(px, py, 71) >= 0.5 && knob(PIECE - 6, mid, lx >= PIECE - 3 && Math.abs(ly + 0.5 - mid) < 3)) return matColor(px + 1, py);
  if (hash2(px - 1, py, 71) < 0.5 && knob(6, mid, lx <= 2 && Math.abs(ly + 0.5 - mid) < 3)) return matColor(px - 1, py);
  if (hash2(px, py, 72) >= 0.5 && knob(mid, PIECE - 6, ly >= PIECE - 3 && Math.abs(lx + 0.5 - mid) < 3)) return matColor(px, py + 1);
  if (hash2(px, py - 1, 72) < 0.5 && knob(mid, 6, ly <= 2 && Math.abs(lx + 0.5 - mid) < 3)) return matColor(px, py - 1);
  return matColor(px, py);
}

/** 퍼즐 매트 길: 큰 매트 조각, 이웃과 맞물리는 돌기, 폭신한 결 */
function puzzleMat(p: Pix, tx: number, ty: number): void {
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const gx = tx * T + x;
      const gy = ty * T + y;
      const c = matAt(gx, gy);
      let out = c;
      if (matAt(gx + 1, gy) !== c || matAt(gx, gy + 1) !== c) out = shade(c, -0.3);
      else if (matAt(gx - 1, gy) !== c || matAt(gx, gy - 1) !== c) out = shade(c, 0.16);
      else if (hash2(gx, gy, 73) < 0.05) out = shade(c, -0.05);
      p.set(x, y, out);
    }
}

const MAPLE = hex('#b07444');

/** 책상 윗판: 넓은 판 두 장이 맞붙은 니스칠 나무, 길게 흐르는 나뭇결, 반짝이는 니스 */
function deskWood(p: Pix, tx: number, ty: number): void {
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const gx = tx * T + x;
      const gy = ty * T + y;
      const board = Math.floor(gy / 96);
      const by = gy % 96;
      const wave = Math.sin(gx * 0.012 + board * 1.7) * 9 + Math.sin(gx * 0.045 + board) * 2.5;
      const g = (by + wave) / 5;
      const band = g - Math.floor(g);
      let c = shade(MAPLE, (hash2(board, 0, 64) - 0.5) * 0.08 + (band < 0.18 ? -0.12 : band > 0.8 ? 0.05 : 0));
      // 니스 반짝임 (비스듬한 띠)
      const sheen = ((gx + gy * 0.6) % 220) / 220;
      if (sheen > 0.46 && sheen < 0.5) c = shade(c, 0.1);
      if (by === 0) c = shade(MAPLE, -0.45);
      else if (by === 1) c = shade(c, 0.12);
      if (hash2(gx, gy, 66) < 0.015) c = shade(c, -0.08);
      p.set(x, y, c);
    }
}

/** 과자 서랍 바닥: 누빈 설탕 반죽 (비스듬한 누빔 줄, 만나는 곳에 은구슬, 아주 가끔 스프링클) */
function fondant(p: Pix, tx: number, ty: number): void {
  const P = 40;
  const mod = (v: number) => ((v % P) + P) % P;
  const sprinkle = [hex('#ffffff'), hex('#7ad8f0'), hex('#ffe04a'), hex('#a0e070')];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const gx = tx * T + x;
      const gy = ty * T + y;
      const u = mod(gx + gy);
      const v = mod(gx - gy);
      const puff = Math.min(u, P - u, v, P - v) / (P / 2);
      let c = shade(CANDY, (puff - 0.5) * 0.12 + (hash2(gx >> 3, gy >> 3, 53) - 0.5) * 0.04);
      if (u === 0 || v === 0) c = shade(CANDY, -0.16);
      if (Math.hypot(u < P / 2 ? u : u - P, v < P / 2 ? v : v - P) < 2.2) c = hex('#f4f0f8');
      const sp = hash2(gx, gy, 54);
      if (sp < 0.0016) c = sprinkle[Math.floor(hash2(gy, gx, 55) * sprinkle.length)];
      p.set(x, y, c);
    }
}

/** 과자 길: 큰 네모 비스킷이 이어진다 (구멍 · 노릇한 가장자리) */
function biscuit(p: Pix, tx: number, ty: number): void {
  const B = 36;
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const gx = tx * T + x;
      const gy = ty * T + y;
      const bx = Math.floor(gx / B);
      const by = Math.floor(gy / B);
      const lx = gx - bx * B;
      const ly = gy - by * B;
      const edge = Math.min(lx, ly, B - 1 - lx, B - 1 - ly);
      let c = shade(BISCUIT, (hash2(bx, by, 62) - 0.5) * 0.1);
      if (edge === 0) c = shade(BISCUIT, -0.4);
      else if (edge < 3) c = shade(c, -0.14);
      else if (edge < 5) c = shade(c, 0.06);
      if ((lx - 8) % 10 === 0 && (ly - 8) % 10 === 0 && lx > 4 && ly > 4 && lx < B - 4 && ly < B - 4) c = shade(BISCUIT, -0.35);
      if (hash2(gx, gy, 61) < 0.04) c = shade(c, hash2(gy, gx, 60) < 0.5 ? 0.1 : -0.1);
      p.set(x, y, c);
    }
}
