/**
 * 손찍기 격자를 늘이고 붙이는 합성 (그림은 격자, 여기는 자리 계산만).
 *
 * - 조각 맞춤 (9-조각의 일반형): 격자를 가로 · 세로 조각(seg)으로 나누고, 반복 조각은 칸을 되풀이해 원하는 크기를 채운다.
 *   seg 는 길이 숫자(고정) 또는 [길이, 'r'](반복). 예: 9-조각 = cols [3, [2,'r'], 3] · rows [3, [2,'r'], 3].
 *   늘이지 않고 되풀이하므로 도트가 뭉개지지 않는다 (나뭇결 · 판자 · 이불 줄무늬가 그대로 이어진다).
 * - 반복 무늬: 벽지 · 마루 · 타일 격자를 전체 좌표 (X, Y) 로 되풀이해 한 칸(24×24)을 잘라 낸다.
 */
import { Pix } from '../paint.ts';
import { gridSize, paintGrid, type Grid, type Palette } from './grid.ts';

export type Seg = number | readonly [number, 'r'];

const segLen = (s: Seg): number => (typeof s === 'number' ? s : s[0]);
const segRep = (s: Seg): boolean => typeof s !== 'number';

/**
 * 한 축의 칸 맞춤: 결과 칸 i → 원본 칸. 고정 조각은 그대로, 반복 조각은 남는(모자라는) 길이를 나눠 갖고 제 칸을 되풀이한다.
 * 줄여야 하면 반복 조각부터 줄이고 (0 까지), 그래도 크면 고정 조각의 가운데를 잘라 낸다.
 */
export function axisMap(segs: readonly Seg[], total: number): number[] {
  const src = segs.reduce<number>((a, s) => a + segLen(s), 0);
  const reps = segs.map((s, i) => (segRep(s) ? i : -1)).filter((i) => i >= 0);
  const len = segs.map(segLen);
  let extra = total - src;
  if (reps.length) {
    if (extra >= 0) {
      const each = Math.floor(extra / reps.length);
      reps.forEach((i, k) => (len[i] += each + (k < extra - each * reps.length ? 1 : 0)));
      extra = 0;
    } else {
      for (const i of reps) {
        const cut = Math.min(len[i], -extra);
        len[i] -= cut;
        extra += cut;
      }
    }
  }
  const out: number[] = [];
  let s0 = 0;
  segs.forEach((s, i) => {
    const n = segLen(s);
    for (let k = 0; k < len[i]; k++) out.push(s0 + (n ? k % n : 0));
    s0 += n;
  });
  // 고정 조각만으로도 클 때: 가운데를 잘라 낸다 · 고정만으로 모자랄 때: 가운데 칸을 되풀이
  while (out.length > total) out.splice(Math.floor(out.length / 2), 1);
  while (out.length < total) out.splice(Math.floor(out.length / 2), 0, out[Math.floor(out.length / 2)] ?? 0);
  return out;
}

/** 조각 맞춤으로 W×H 새 격자 */
export function fitGrid(g: Grid, W: number, H: number, cols: readonly Seg[], rows: readonly Seg[]): string[] {
  const { w, h } = gridSize(g);
  const sumC = cols.reduce<number>((a, s) => a + segLen(s), 0);
  const sumR = rows.reduce<number>((a, s) => a + segLen(s), 0);
  if (sumC !== w || sumR !== h) throw new Error(`조각 길이 ${sumC}×${sumR} ≠ 격자 ${w}×${h}`);
  const mx = axisMap(cols, W);
  const my = axisMap(rows, H);
  return my.map((sy) => mx.map((sx) => g[sy][sx]).join(''));
}

/** 조각 맞춤 격자를 (x, y) 에 찍는다 */
export function paintFit(p: Pix, g: Grid, pal: Palette, x: number, y: number, W: number, H: number, cols: readonly Seg[], rows: readonly Seg[], flip = false): Pix {
  return paintGrid(p, fitGrid(g, W, H, cols, rows), x, y, pal, flip);
}

/** 9-조각: 모서리 l · r · t · b 칸은 그대로, 가운데 줄 · 칸은 되풀이 */
export function nine(g: Grid, W: number, H: number, l: number, r: number, t: number, b: number): string[] {
  const { w, h } = gridSize(g);
  return fitGrid(g, W, H, [l, [w - l - r, 'r'], r], [t, [h - t - b, 'r'], b]);
}

/** 반복 무늬 격자의 전체 좌표 (X, Y) 글자 */
export function tileChar(g: Grid, X: number, Y: number): string {
  const h = g.length;
  const w = g[0].length;
  return g[((Y % h) + h) % h][((X % w) + w) % w];
}

/** 반복 무늬 격자에서 전체 좌표 (gx, gy) 부터 w×h 를 잘라 새 격자로 */
export function cutTile(g: Grid, gx: number, gy: number, w: number, h: number): string[] {
  gridSize(g);
  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += tileChar(g, gx + x, gy + y);
    out.push(row);
  }
  return out;
}

/** 반복 무늬를 p 의 (x, y) 부터 w×h 칸에 칠한다 (무늬 원점 = 전체 좌표 gx, gy) */
export function paintTiled(p: Pix, g: Grid, pal: Palette, x: number, y: number, w: number, h: number, gx = x, gy = y): Pix {
  return paintGrid(p, cutTile(g, gx, gy, w, h), x, y, pal);
}

/** 같은 폭의 여러 띠를 위에서 아래로 이어 붙인 격자 */
export function stackRows(...parts: Grid[]): string[] {
  const out: string[] = [];
  for (const g of parts) out.push(...g);
  gridSize(out);
  return out;
}
