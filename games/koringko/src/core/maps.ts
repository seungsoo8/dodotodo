/**
 * 지도: 타일(24px) 글자로 짓는다. 집·분수 같은 큰 것은 '구조물'로 따로 두고 밟지 못하는 자리만 표시한다.
 *   걷는 땅  . 풀  , 꽃  g 긴 풀  : 흙길  # 광장 돌  = 나무다리  _ 동굴 바닥  p 과자 땅  q 과자 길  r 균열 바닥
 *   막힌 곳  T 나무  P 소나무  B 덤불  o 바위  f 울타리  ~ 물  C 동굴 벽  c 수정  k 쿠키 벽  l 막대사탕 나무
 *            H 건물 자리  R 균열 벽  v 허공  X 보이지 않는 벽  M 공장 벽  K 나무 상자  Q 장난감 블록  O 구슬
 *   집 안    a 양탄자  w 나무 바닥  m 쇠 바닥  d 책상 나무판  u 먼지 바닥
 *            E 책 더미 벽  G 지우개 · 시계 톱니  Y 먼지 덩이 벽  L 잃어버린 야광 별
 */
import { createRng, type Rng } from './rng.ts';

export const TILE = 24;
const SOLID = new Set(['T', 'P', 'B', 'o', 'f', '~', 'C', 'c', 'k', 'l', 'H', 'R', 'v', 'X', 'M', 'K', 'Q', 'O', 'E', 'G', 'Y', 'L', 'W', 'F']);

export type Theme = 'village' | 'toybox' | 'candy' | 'factory' | 'cave' | 'rift';

export interface Warp {
  /** 타일 칸 (밟으면 이동) */
  x: number;
  y: number;
  w: number;
  h: number;
  to: string;
  /** 도착 타일 */
  tx: number;
  ty: number;
  label: string;
  /** 이 깃발이 있어야 지나갈 수 있다 */
  need?: string;
  /** 못 지나갈 때 하는 말 */
  locked?: string;
}

export interface NpcPlace {
  id: string;
  x: number;
  y: number;
}

export interface SpawnZone {
  x: number;
  y: number;
  /** 반지름 (타일) */
  r: number;
  pool: string[];
  max: number;
  lv: [number, number];
}

export type StructureKind = 'chief' | 'shop' | 'forge' | 'tailor' | 'house' | 'fountain' | 'portal' | 'well' | 'board' | 'tent' | 'gate' | 'altar' | 'lamp' | 'cart' | 'cocoon' | 'chest' | 'ladder' | 'door' | 'slide' | 'stage';

export interface Structure {
  kind: StructureKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 밟지 못하는 칸 (구조물 아랫부분) */
  solid: boolean;
  /** 먼지 고치 안의 동료 · 보물 상자 안의 부품 */
  id?: string;
}

export interface MapDef {
  id: string;
  name: string;
  theme: Theme;
  w: number;
  h: number;
  tiles: string[];
  warps: Warp[];
  npcs: NpcPlace[];
  spawns: SpawnZone[];
  structures: Structure[];
  /** 처음 들어왔을 때 서는 타일 */
  start: { x: number; y: number };
  /** 몬스터가 없는 곳 (마을) */
  safe: boolean;
  /** 이 방의 얼음 땡 종류 (없으면 still) */
  freeze?: 'still' | 'hands' | 'light' | 'king';
  dark: boolean;
  /** 보스 자리 (들어오면 나타난다) */
  boss?: { id: string; x: number; y: number; lv: number };
  /** 균열 깊이 */
  depth?: number;
  /** 지도 이름 옆 권장 레벨 */
  level: string;
}

// ───────────────────────── 짓는 도구 ─────────────────────────

export class Builder {
  readonly w: number;
  readonly h: number;
  readonly t: string[];
  readonly rng: Rng;
  structures: Structure[] = [];

  constructor(w: number, h: number, fill: string, seed: number) {
    this.w = w;
    this.h = h;
    this.t = new Array(w * h).fill(fill);
    this.rng = createRng(seed);
  }

  inb(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): string | null {
    return this.inb(x, y) ? this.t[y * this.w + x] : null;
  }

  set(x: number, y: number, c: string): void {
    if (this.inb(x, y)) this.t[y * this.w + x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: string): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: string, rough = 0): void {
    for (let yy = Math.floor(cy - ry - 2); yy <= cy + ry + 2; yy++) {
      for (let xx = Math.floor(cx - rx - 2); xx <= cx + rx + 2; xx++) {
        const d = ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2;
        const n = rough ? (this.noise(xx, yy) - 0.5) * rough : 0;
        if (d <= 1 + n) this.set(xx, yy, c);
      }
    }
  }

  /** 굵은 꺾은선 */
  path(pts: [number, number][], width: number, c: string, only?: (ch: string | null) => boolean): void {
    const r = (width - 1) / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
      for (let k = 0; k <= n; k++) {
        const px = x0 + ((x1 - x0) * k) / n;
        const py = y0 + ((y1 - y0) * k) / n;
        for (let yy = Math.round(py - r); yy <= Math.round(py + r); yy++) {
          for (let xx = Math.round(px - r); xx <= Math.round(px + r); xx++) if (!only || only(this.get(xx, yy))) this.set(xx, yy, c);
        }
      }
    }
  }

  /** 흩뿌리기 (on 에 있는 땅에만, spacing 칸 안에 같은 것이 없게) */
  scatter(c: string, prob: number, x0: number, y0: number, x1: number, y1: number, on: string, spacing = 0): void {
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        if (!on.includes(this.get(xx, yy) ?? '?')) continue;
        if (this.rng.next() >= prob) continue;
        if (spacing && this.near(xx, yy, spacing, c)) continue;
        this.set(xx, yy, c);
      }
    }
  }

  near(x: number, y: number, r: number, chars: string): boolean {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if ((dx || dy) && chars.includes(this.get(x + dx, y + dy) ?? '?')) return true;
    return false;
  }

  /** 가장자리 숲 (gaps 는 열어 둔다) */
  border(th: number, chars: string, gaps: [number, number, number, number][] = []): void {
    for (let yy = 0; yy < this.h; yy++) {
      for (let xx = 0; xx < this.w; xx++) {
        const e = Math.min(xx, yy, this.w - 1 - xx, this.h - 1 - yy);
        if (e >= th + this.noise(xx, yy) * 2.2) continue;
        if (gaps.some((g) => xx >= g[0] && xx <= g[2] && yy >= g[1] && yy <= g[3])) continue;
        this.set(xx, yy, chars[(xx * 7 + yy * 13) % chars.length]);
      }
    }
  }

  /** 0~1 값 (자리마다 고정) */
  noise(x: number, y: number): number {
    const s = Math.sin(x * 12.9898 + y * 78.233 + this.w * 3.17) * 43758.5453;
    return s - Math.floor(s);
  }

  /** 구조물: 아래쪽 solidRows 줄만 막힌다 (지붕 뒤로 걸어갈 수 있게) */
  structure(kind: StructureKind, x: number, y: number, w: number, h: number, solidRows = h, id?: string): void {
    this.structures.push({ kind, x, y, w, h, solid: solidRows > 0, id });
    if (solidRows > 0) this.rect(x, y + h - solidRows, w, solidRows, 'H');
  }

  rows(): string[] {
    const out: string[] = [];
    for (let y = 0; y < this.h; y++) out.push(this.t.slice(y * this.w, (y + 1) * this.w).join(''));
    return out;
  }
}

export function isSolidChar(c: string | undefined | null): boolean {
  return c == null || SOLID.has(c);
}

export function tileAt(m: MapDef, tx: number, ty: number): string | null {
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return null;
  return m.tiles[ty][tx];
}

export function isSolid(m: MapDef, tx: number, ty: number): boolean {
  return isSolidChar(tileAt(m, tx, ty));
}
