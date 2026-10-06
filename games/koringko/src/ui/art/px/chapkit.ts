/**
 * 장(章) 소품용 격자 도구: 손으로 찍은 격자를 늘이고(가운데 열 · 줄 반복) 겹쳐서 한 장으로 만든 뒤 칠한다.
 * 모양은 모두 격자 글자에 있고, 여기서는 붙이기 · 늘이기 · 칠하기만 한다.
 *
 * 공용 글자 (재질 하나 = 반짝 · 밝음 · 바탕 · 그늘 · 깊은 그늘):
 *   C 주된 색  O L C c k      A 둘째 색  U M A a m      W 나무  Y V W w v
 *   S 쇠 · 회색  I T S s t     F 천 · 종이  Z P F f p    B 셋째 색  X R B b r
 *   G 넷째 색  Q H G g h      N 다섯째 색  . E N n j
 * 그 밖의 글자(숫자 · 남은 소문자)는 한 칸짜리 포인트 색으로 팔레트에 직접 적는다.
 */
import { Pix, hex, mix, shade, type Color } from '../paint.ts';
import { mat, paintGrid, softOutline, type Grid, type Palette } from './grid.ts';

export const SLOTS: Record<string, string> = { C: 'OLCck', A: 'UMAam', W: 'YVWwv', S: 'ITSst', F: 'ZPFfp', B: 'XRBbr', G: 'QHGgh', N: '.ENnj' };
/** 외곽선에 섞는 따뜻한 먹색 (순검정 대신) */
export const INK_WARM = hex('#3a2230');

type Spec = Record<string, Color | string>;
/** 팔레트 만들기: 재질 자리(C A W S F B G N)는 다섯 단계로 펼치고, 나머지 글자는 한 색 */
export function pal(spec: Spec): Palette {
  const out: Record<string, Color> = {};
  for (const [k, v] of Object.entries(spec)) {
    const c = typeof v === 'string' ? hex(v) : v;
    if (SLOTS[k]) Object.assign(out, k === 'W' ? woodMat(c) : mat(SLOTS[k], c));
    else out[k] = c;
  }
  return out;
}
/** 나무: 그늘이 붉은 쪽으로 따뜻하다 */
function woodMat(c: Color): Record<string, Color> {
  return { Y: shade(c, 0.4), V: shade(c, 0.2), W: c, w: mix(shade(c, -0.22), hex('#5a2820'), 0.18), v: mix(shade(c, -0.42), hex('#4a2028'), 0.25) };
}

/** 같은 줄을 n 번 (격자 안에서 곧은 기둥 · 판을 적을 때) */
export function rep(row: string, n: number): string[] {
  return Array.from({ length: Math.max(0, n) }, () => row);
}
/** 빈 격자 (모두 투명) */
export function blank(w: number, h: number): string[] {
  return Array.from({ length: h }, () => '.'.repeat(w));
}
/** dst 위에 src 를 (x, y) 에 겹쳐 찍는다 ('.' 은 밑을 그대로). 밖으로 나간 칸은 버린다 */
export function put(dst: string[], src: Grid, x: number, y: number): string[] {
  x = Math.round(x);
  y = Math.round(y);
  for (let r = 0; r < src.length; r++) {
    const yy = y + r;
    if (yy < 0 || yy >= dst.length) continue;
    const row = dst[yy].split('');
    for (let c = 0; c < src[r].length; c++) {
      const xx = x + c;
      const ch = src[r][c];
      if (xx < 0 || xx >= row.length || ch === '.' || ch === ' ') continue;
      row[xx] = ch;
    }
    dst[yy] = row.join('');
  }
  return dst;
}
/** put 과 같지만 밑에 이미 칠한 칸 위에만 찍는다 (녹 얼룩 · 골 · 창살이 모양 밖으로 나가지 않게) */
export function putOn(dst: string[], src: Grid, x: number, y: number): string[] {
  const masked = src.map((r, j) =>
    r
      .split('')
      .map((ch, i) => (dst[Math.round(y) + j]?.[Math.round(x) + i] ?? '.') === '.' ? '.' : ch)
      .join(''),
  );
  return put(dst, masked, x, y);
}
/** 글자 바꾸기: from 의 i 번째 글자를 to 의 i 번째 글자로 (같은 무늬를 띠마다 다른 밝기로) */
export function remap(g: Grid, from: string, to: string): string[] {
  return g.map((r) =>
    r
      .split('')
      .map((ch) => {
        const i = from.indexOf(ch);
        return i >= 0 ? to[i] : ch;
      })
      .join(''),
  );
}
/** 가로로 늘이기: 왼쪽 l 열 · 오른쪽 r 열은 그대로, 가운데 열들을 되풀이해 폭 W 로 */
export function hs(g: Grid, W: number, l: number, r: number): string[] {
  return g.map((row) => {
    const mid = row.slice(l, row.length - r);
    let m = '';
    const need = Math.max(0, W - l - r);
    while (m.length < need) m += mid || '.';
    return (row.slice(0, l) + m.slice(0, need) + row.slice(row.length - r)).slice(0, Math.max(W, 0)).padEnd(W, '.');
  });
}
/** 세로로 늘이기: 위 t 줄 · 아래 b 줄은 그대로, 가운데 줄들을 되풀이해 높이 H 로 */
export function vs(g: Grid, H: number, t: number, b: number): string[] {
  const mid = g.slice(t, g.length - b);
  const out = g.slice(0, t).map(String);
  const need = Math.max(0, H - t - b);
  for (let i = 0; i < need; i++) out.push(mid.length ? mid[i % mid.length] : '.'.repeat(g[0].length));
  return out.concat(g.slice(g.length - b)).slice(0, H);
}
/** 9-조각: 모서리 그대로 · 변과 가운데 되풀이 */
export function nine(g: Grid, W: number, H: number, l: number, r: number, t: number, b: number): string[] {
  return vs(hs(g, W, l, r), H, t, b);
}
/** 무늬 타일을 W×H 에 되풀이 (ox, oy 만큼 밀어서 시작) */
export function tile(g: Grid, W: number, H: number, ox = 0, oy = 0): string[] {
  const tw = g[0].length;
  const th = g.length;
  return Array.from({ length: H }, (_, y) => {
    let s = '';
    for (let x = 0; x < W; x++) s += g[(((y + oy) % th) + th) % th][(((x + ox) % tw) + tw) % tw];
    return s;
  });
}
/** 재질 바꾸기: 격자 속 from 재질 다섯 글자를 to 재질 글자로 (같은 모양 · 다른 색 단) */
export function swap(g: Grid, from: string, to: string): string[] {
  const a = SLOTS[from];
  const b = SLOTS[to];
  return g.map((r) =>
    r
      .split('')
      .map((ch) => {
        const i = a.indexOf(ch);
        return ch !== '.' && i >= 0 && b[i] !== '.' ? b[i] : ch;
      })
      .join(''),
  );
}
/** 세로로 눕히기 (x ↔ y): 가로 무늬 격자를 세로로 쓸 때 */
export function transpose(g: Grid): string[] {
  return Array.from({ length: g[0].length }, (_, x) => g.map((r) => r[x]).join(''));
}
/** 좌우 뒤집기 */
export function flipG(g: Grid): string[] {
  return g.map((r) => r.split('').reverse().join(''));
}
/** 격자를 그림으로 (그림 크기 = 격자 크기). outline 이면 둘레에 따뜻한 색 외곽선 */
export function draw(g: Grid, p: Palette, outline = true): Pix {
  const out = paintGrid(new Pix(g[0].length, g.length), g, 0, 0, p);
  return outline ? softOutline(out, INK_WARM) : out;
}
/** 크기가 정해진 판(W×H)에 격자를 (x, y) 에 놓아 칠한다 */
export function onto(W: number, H: number, parts: [Grid, number, number][], p: Palette, outline = true): Pix {
  const g = blank(W, H);
  for (const [s, x, y] of parts) put(g, s, x, y);
  return draw(g, p, outline);
}
