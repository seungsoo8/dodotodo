/**
 * 도트 그림 붓: 픽셀 버퍼에 빛을 받는 공·막대·선을 그리고 외곽선을 두른다.
 * 색은 0xRRGGBB (투명은 -1). 화면과 무관해서 테스트할 수 있다.
 */

export type Color = number;
export const CLEAR = -1;

export function hex(c: string): Color {
  return parseInt(c.replace('#', '').slice(0, 6), 16);
}

export function rgb(c: Color): [number, number, number] {
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

export function toHex(c: Color): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

/** k > 0 이면 밝게(흰색 쪽), k < 0 이면 어둡게. 어두울수록 살짝 푸르게 (그림자 색) */
export function shade(c: Color, k: number): Color {
  const [r, g, b] = rgb(c);
  if (k >= 0) {
    const f = (v: number) => Math.round(v + (255 - v) * k);
    return (f(r) << 16) | (f(g) << 8) | f(b);
  }
  const m = 1 + k;
  const f = (v: number, cool: number) => Math.max(0, Math.min(255, Math.round(v * m + cool * -k)));
  return (f(r, 10) << 16) | (f(g, 14) << 8) | f(b, 40);
}

export function mix(a: Color, b: Color, t: number): Color {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t);
  return (f(r1, r2) << 16) | (f(g1, g2) << 8) | f(b1, b2);
}

/** 한 색으로 명암 다섯 단계: 그림자 · 어둠 · 바탕 · 밝음 · 반짝 */
export function ramp(c: Color): [Color, Color, Color, Color, Color] {
  return [shade(c, -0.5), shade(c, -0.25), c, shade(c, 0.28), shade(c, 0.6)];
}

const LIGHT = (() => {
  const l = [-0.45, -0.62, 0.64];
  const n = Math.hypot(l[0], l[1], l[2]);
  return l.map((v) => v / n);
})();

export class Pix {
  readonly w: number;
  readonly h: number;
  readonly px: Int32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Int32Array(w * h).fill(CLEAR);
  }

  get(x: number, y: number): Color {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return CLEAR;
    return this.px[y * this.w + x];
  }

  set(x: number, y: number, c: Color): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c === CLEAR) return;
    this.px[y * this.w + x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: Color): this {
    for (let yy = Math.floor(y); yy < y + h; yy++) for (let xx = Math.floor(x); xx < x + w; xx++) this.set(xx, yy, c);
    return this;
  }

  /** 납작한 타원 (한 색) */
  oval(cx: number, cy: number, rx: number, ry: number, c: Color): this {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.set(x, y, c);
      }
    }
    return this;
  }

  /**
   * 빛을 받는 공 (왼쪽 위에서 빛). 명암은 깔끔한 덩어리로 (바둑판 디더 없이)
   * soft: 반짝이를 줄인다 (천·솜)
   */
  ball(cx: number, cy: number, rx: number, ry: number, base: Color, soft = false): this {
    const r = ramp(base);
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        const lit = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
        const v = lit;
        let c: Color;
        if (!soft && v > 0.9) c = r[4];
        else if (v > 0.68) c = r[3];
        else if (v > 0.3) c = r[2];
        else if (v > 0.02) c = r[1];
        else c = r[0];
        this.set(x, y, c);
      }
    }
    return this;
  }

  /** 세로 막대 (원기둥 명암): 왼쪽이 밝고 오른쪽이 어둡다 */
  bar(x: number, y: number, w: number, h: number, base: Color): this {
    const r = ramp(base);
    for (let xx = 0; xx < w; xx++) {
      const t = w <= 1 ? 0.5 : xx / (w - 1);
      const c = t < 0.25 ? r[3] : t < 0.7 ? r[2] : r[1];
      for (let yy = 0; yy < h; yy++) this.set(x + xx, y + yy, c);
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  /** 꽉 찬 삼각형 */
  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, c: Color): this {
    const minX = Math.floor(Math.min(ax, bx, cx));
    const maxX = Math.ceil(Math.max(ax, bx, cx));
    const minY = Math.floor(Math.min(ay, by, cy));
    const maxY = Math.ceil(Math.max(ay, by, cy));
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (area === 0) return this;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
        const w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) this.set(x, y, c);
      }
    }
    return this;
  }

  /** 투명한 칸 중 그림에 닿은 칸에 외곽선 (이웃 색을 아주 어둡게) */
  outline(ink?: Color): this {
    const out: [number, number, Color][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== CLEAR) continue;
        const n = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)].find((c) => c !== CLEAR);
        if (n !== undefined) out.push([x, y, ink ?? shade(n, -0.72)]);
      }
    }
    for (const [x, y, c] of out) this.set(x, y, c);
    return this;
  }

  /** 다른 그림을 (dx, dy) 에 찍는다 */
  stamp(o: Pix, dx: number, dy: number, flip = false): this {
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) this.set(dx + x, dy + y, o.get(flip ? o.w - 1 - x : x, y));
    return this;
  }

  /** 좌우 뒤집은 새 그림 */
  flipped(): Pix {
    return new Pix(this.w, this.h).stamp(this, 0, 0, true);
  }

  /** 그려진 칸 수 */
  count(): number {
    let n = 0;
    for (const c of this.px) if (c !== CLEAR) n++;
    return n;
  }
}

/** 0~1 값 (자리마다 고정) */
export function hash2(x: number, y: number, seed = 0): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
