/**
 * 손찍기 격자 붙이기 도구 (소품 · 물건 공용): 격자를 늘이고 · 잇고 · 겹치는 합성 로직만 둔다.
 * 그림은 늘 손으로 찍은 격자에서 나오고, 여기서는 크기에 맞춰 조각을 반복하거나 자리에 놓기만 한다.
 *
 *   hrep(g, 3, 5, 40)        가운데 열(3..4)을 되풀이해 폭 40 으로 (왼쪽 · 오른쪽 끝은 그대로)
 *   nine(g, 4, 8, 4, 8, W, H) 9-조각: 모서리는 그대로, 변은 한 방향, 가운데는 두 방향으로 되풀이
 *   tile(t, W, H)            무늬 한 장을 W×H 로 이어 깔기
 *   stack([[g, x, y], ...])  여러 격자를 한 장의 격자로 (뒤 → 앞, '.' 은 밑그림 유지)
 *   recolor(g, {a: 'b'})     글자 바꾸기 (같은 본의 다른 색 · 다른 상태)
 */
import { Pix, type Color } from '../paint.ts';
import { gridSize, paintGrid, softOutline, type Grid, type Palette } from './grid.ts';

/** 열 [x0, x1) 을 되풀이해 폭 W 로 (W 가 원래보다 작으면 가운데를 줄인다) */
export function hrep(g: Grid, x0: number, x1: number, W: number): string[] {
  const { w } = gridSize(g);
  const left = x0;
  const right = w - x1;
  const midW = Math.max(0, W - left - right);
  const per = Math.max(1, x1 - x0);
  return g.map((r) => {
    let mid = '';
    for (let i = 0; i < midW; i++) mid += r[x0 + (i % per)];
    return (r.slice(0, left) + mid + r.slice(x1)).slice(0, W).padEnd(W, '.');
  });
}

/** 줄 [y0, y1) 을 되풀이해 높이 H 로 */
export function vrep(g: Grid, y0: number, y1: number, H: number): string[] {
  const top = g.slice(0, y0);
  const bot = g.slice(y1);
  const per = Math.max(1, y1 - y0);
  const midH = Math.max(0, H - top.length - bot.length);
  const mid: string[] = [];
  for (let i = 0; i < midH; i++) mid.push(g[y0 + (i % per)]);
  return [...top, ...mid, ...bot].slice(0, H);
}

/** 9-조각 늘이기 */
export function nine(g: Grid, x0: number, x1: number, y0: number, y1: number, W: number, H: number): string[] {
  return vrep(hrep(g, x0, x1, W), y0, y1, H);
}

/** 무늬 한 장을 W×H 로 이어 깔기 (dx: 무늬를 옆으로 미는 시작 열) */
export function tile(t: Grid, W: number, H: number, dx = 0, dy = 0): string[] {
  const { w, h } = gridSize(t);
  const out: string[] = [];
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < W; x++) r += t[(y + dy) % h][(x + dx) % w];
    out.push(r);
  }
  return out;
}

/** 빈 격자 */
export function blank(w: number, h: number): string[] {
  return Array.from({ length: h }, () => '.'.repeat(w));
}

/** 여러 격자를 한 격자로 겹친다 (뒤 → 앞). '.' 칸은 밑의 글자를 남긴다 */
export function stack(w: number, h: number, parts: [Grid, number, number][]): string[] {
  const rows = blank(w, h).map((r) => r.split(''));
  for (const [g, x0, y0] of parts) {
    gridSize(g);
    g.forEach((r, y) => {
      const yy = y0 + y;
      if (yy < 0 || yy >= h) return;
      for (let x = 0; x < r.length; x++) {
        const xx = x0 + x;
        if (xx < 0 || xx >= w || r[x] === '.' || r[x] === ' ') continue;
        rows[yy][xx] = r[x];
      }
    });
  }
  return rows.map((r) => r.join(''));
}

/** 글자 바꾸기 */
export function recolor(g: Grid, map: Record<string, string>): string[] {
  return g.map((r) => r.replace(/./g, (c) => map[c] ?? c));
}

/** 좌우 뒤집기 */
export function mirror(g: Grid): string[] {
  return g.map((r) => r.split('').reverse().join(''));
}

/** 격자 → 새 Pix (여백 없이). ink 를 주면 둘레에 따뜻한 색 외곽선 */
export function pixOf(g: Grid, pal: Palette, ink?: Color): Pix {
  const { w, h } = gridSize(g);
  const p = paintGrid(new Pix(w, h), g, 0, 0, pal);
  return ink === undefined ? p : softOutline(p, ink);
}

/** W×H 그림에 여러 격자를 찍고 (뒤 → 앞) 둘레 외곽선 */
export function compose(W: number, H: number, parts: { g: Grid; x?: number; y?: number; pal: Palette; flip?: boolean }[], ink?: Color): Pix {
  const p = new Pix(W, H);
  for (const l of parts) paintGrid(p, l.g, l.x ?? 0, l.y ?? 0, l.pal, l.flip);
  return ink === undefined ? p : softOutline(p, ink);
}

/** 그림의 [y0, y0+h) 줄 */
export function rowsOf(p: Pix, y0: number, h: number): Pix {
  const q = new Pix(p.w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < p.w; x++) q.set(x, y, p.get(x, y0 + y));
  return q;
}
