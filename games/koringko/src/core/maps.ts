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
const SOLID = new Set(['T', 'P', 'B', 'o', 'f', '~', 'C', 'c', 'k', 'l', 'H', 'R', 'v', 'X', 'M', 'K', 'Q', 'O', 'E', 'G', 'Y', 'L']);

export type MapId = 'village' | 'toybox' | 'drawer' | 'desk' | 'underbed' | 'attic' | 'rift';
export type Theme = 'village' | 'toybox' | 'candy' | 'factory' | 'cave' | 'rift';

export interface Warp {
  /** 타일 칸 (밟으면 이동) */
  x: number;
  y: number;
  w: number;
  h: number;
  to: MapId;
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

export type StructureKind = 'chief' | 'shop' | 'forge' | 'tailor' | 'house' | 'fountain' | 'portal' | 'well' | 'board' | 'tent' | 'gate' | 'altar' | 'lamp' | 'cart' | 'cocoon' | 'chest' | 'ladder' | 'door';

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
  id: MapId;
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

// ───────────────────────── 지도들 (집 안의 방) ─────────────────────────

function mapDef(b: Builder, o: Omit<MapDef, 'w' | 'h' | 'tiles' | 'structures'>): MapDef {
  return { ...o, w: b.w, h: b.h, tiles: b.rows(), structures: b.structures };
}

/** 블록 마을: 아이 방 양탄자 위, 블록으로 지은 쉼터 */
function village(): MapDef {
  const b = new Builder(40, 30, 'a', 101);
  b.border(1.2, 'Q', [[37, 13, 39, 16], [18, 0, 21, 2], [0, 13, 2, 16], [18, 27, 21, 29]]);
  b.path([[22, 15], [39, 15]], 2, '#');
  b.path([[19, 15], [19, 0]], 2, '#');
  b.path([[0, 15], [17, 15]], 2, '#');
  b.path([[19, 17], [19, 29]], 2, '#');
  b.ellipse(20, 15.5, 6.5, 4.4, '#');
  b.structure('fountain', 19, 14, 2, 2);
  b.structure('chief', 5, 4, 6, 5, 2);
  b.structure('shop', 27, 4, 6, 5, 2);
  b.structure('forge', 27, 20, 6, 5, 2);
  b.structure('tailor', 5, 20, 6, 5, 2);
  b.structure('board', 23, 11, 2, 2, 1);
  b.structure('ladder', 34, 1, 2, 3, 1);
  b.structure('lamp', 13, 13, 1, 2, 1);
  b.structure('lamp', 26, 13, 1, 2, 1);
  b.structure('lamp', 13, 18, 1, 2, 1);
  b.structure('lamp', 26, 18, 1, 2, 1);
  b.scatter('O', 0.012, 3, 3, 36, 26, 'a', 4);
  return mapDef(b, {
    id: 'village',
    name: '블록 마을',
    theme: 'village',
    warps: [
      { x: 39, y: 13, w: 1, h: 4, to: 'toybox', tx: 2, ty: 18, label: '장난감 상자' },
      { x: 18, y: 0, w: 4, h: 1, to: 'drawer', tx: 28, ty: 33, label: '과자 서랍', need: 'drawer_open', locked: '과자 서랍이 꽉 닫혀 있다. 태엽 할머니께 여쭤 보자' },
      { x: 0, y: 13, w: 1, h: 4, to: 'desk', tx: 3, ty: 30, label: '책상 시계 공장', need: 'desk_open', locked: '책상 위로 올라갈 길이 아직 없다' },
      { x: 18, y: 29, w: 4, h: 1, to: 'underbed', tx: 24, ty: 2, label: '침대 밑', need: 'bed_open', locked: '침대 밑은 너무 어둡다. 아직은 무섭다' },
      { x: 34, y: 3, w: 2, h: 1, to: 'attic', tx: 8, ty: 30, label: '다락방', need: 'attic_open', locked: '사다리 위 다락방 문이 잠겨 있다' },
    ],
    npcs: [
      { id: 'chief', x: 8, y: 10 },
      { id: 'shop', x: 30, y: 10 },
      { id: 'forge', x: 30, y: 26 },
      { id: 'tailor', x: 8, y: 26 },
      { id: 'riftkeeper', x: 22, y: 11 },
    ],
    spawns: [],
    start: { x: 20, y: 19 },
    safe: true,
    dark: false,
    level: '쉼터',
  });
}

/** 장난감 상자: 나무 바닥, 블록 벽, 구슬이 굴러다닌다 */
function toybox(): MapDef {
  const b = new Builder(56, 36, 'w', 202);
  b.border(1.4, 'Q', [[0, 16, 2, 19]]);
  // 큰 블록 더미로 길을 나눈다
  for (const [x, y, w, h] of [[14, 4, 4, 9], [26, 18, 5, 10], [38, 6, 3, 12], [8, 26, 9, 3], [44, 24, 6, 3]] as const) b.rect(x, y, w, h, 'Q');
  b.scatter('O', 0.012, 3, 3, 52, 32, 'w', 3);
  b.scatter('Q', 0.008, 3, 3, 52, 32, 'w', 3);
  for (const [cx, cy, rx, ry] of [[10, 18, 5, 4], [22, 8, 5, 3], [34, 26, 5, 4], [46, 14, 5, 4], [22, 30, 5, 3]] as const) b.ellipse(cx, cy, rx, ry, 'w');
  b.ellipse(46, 30, 6, 3.5, 'w');
  b.ellipse(10, 18, 2, 2, 'w');
  b.structure('cocoon', 21, 29, 2, 2, 1, 'bori');
  b.structure('chest', 47, 4, 2, 2, 1, 'pin');
  b.structure('chest', 3, 30, 2, 2, 1, 'cloth');
  return mapDef(b, {
    id: 'toybox',
    name: '장난감 상자',
    theme: 'toybox',
    warps: [{ x: 0, y: 16, w: 1, h: 4, to: 'village', tx: 37, ty: 15, label: '블록 마을' }],
    npcs: [],
    spawns: [
      { x: 10, y: 18, r: 4, pool: ['fluff', 'fluff', 'mushroom'], max: 6, lv: [1, 2] },
      { x: 22, y: 8, r: 4, pool: ['fluff', 'mushroom', 'mouse'], max: 6, lv: [2, 3] },
      { x: 34, y: 26, r: 4, pool: ['mouse', 'marble', 'wolf'], max: 6, lv: [3, 5] },
      { x: 46, y: 14, r: 4, pool: ['wolf', 'ragdoll', 'marble'], max: 6, lv: [4, 6] },
    ],
    start: { x: 3, y: 18 },
    safe: false,
    dark: false,
    boss: { id: 'b_bear', x: 46, y: 30, lv: 7 },
    level: 'Lv 1~6',
  });
}

/** 과자 서랍: 사탕 나무 · 쿠키 벽 · 초콜릿 강 */
function drawer(): MapDef {
  const b = new Builder(56, 36, 'p', 303);
  b.border(1.6, 'lkl', [[26, 34, 30, 35]]);
  b.path([[28, 35], [28, 26], [20, 18], [12, 10], [8, 4]], 3, 'q');
  b.path([[28, 26], [38, 20], [46, 12]], 3, 'q');
  b.path([[20, 18], [34, 14]], 2, 'q');
  b.path([[34, 14], [30, 7]], 2, 'q');
  b.ellipse(30, 5, 7, 3.2, 'p');
  b.path([[0, 22], [10, 24], [18, 28], [24, 30]], 2, '~');
  b.path([[14, 25], [14, 28]], 3, '=', (c) => c === '~');
  b.scatter('l', 0.05, 3, 3, 52, 32, 'p', 1);
  b.scatter('k', 0.025, 3, 3, 52, 32, 'p', 2);
  b.scatter(',', 0.06, 3, 3, 52, 32, 'p');
  for (const [cx, cy, rx, ry] of [[12, 10, 5, 4], [36, 18, 5, 4], [46, 10, 5, 4], [22, 28, 4, 3], [44, 28, 6, 4]] as const) b.ellipse(cx, cy, rx, ry, 'p', 0.4);
  b.ellipse(30, 5, 6, 2.6, 'p');
  b.ellipse(8, 5, 3, 2, 'p');
  b.structure('tent', 30, 30, 3, 3, 2);
  b.structure('cocoon', 7, 4, 2, 2, 1, 'ruru');
  b.structure('chest', 50, 30, 2, 2, 1, 'rubber');
  return mapDef(b, {
    id: 'drawer',
    name: '과자 서랍',
    theme: 'candy',
    warps: [{ x: 26, y: 35, w: 5, h: 1, to: 'village', tx: 20, ty: 2, label: '블록 마을' }],
    npcs: [{ id: 'baker', x: 32, y: 33 }],
    spawns: [
      { x: 12, y: 10, r: 4, pool: ['jelly', 'cookie'], max: 6, lv: [6, 8] },
      { x: 36, y: 18, r: 4, pool: ['jelly', 'bee'], max: 6, lv: [7, 9] },
      { x: 46, y: 10, r: 4, pool: ['bee', 'gum'], max: 6, lv: [8, 10] },
      { x: 22, y: 28, r: 3, pool: ['cookie', 'gum'], max: 5, lv: [8, 10] },
      { x: 44, y: 28, r: 5, pool: ['cookie', 'choco', 'gum'], max: 6, lv: [10, 12] },
    ],
    start: { x: 28, y: 33 },
    safe: false,
    dark: false,
    boss: { id: 'b_jelly', x: 30, y: 5, lv: 13 },
    level: 'Lv 6~12',
  });
}

/** 책상 시계 공장: 쇠 바닥 · 연필 · 상자 */
function desk(): MapDef {
  const b = new Builder(52, 36, 'E', 505);
  b.path([[1, 30], [10, 30], [16, 24], [26, 26], [36, 22], [42, 14], [34, 8], [26, 6]], 4, 'd');
  b.path([[16, 24], [12, 14], [20, 10]], 3, 'd');
  b.path([[36, 22], [46, 28]], 3, 'd');
  for (const [cx, cy, rx, ry] of [[10, 28, 5, 4], [12, 14, 5, 4], [26, 25, 6, 4], [44, 27, 5, 4], [42, 15, 5, 4]] as const) b.rect(cx - rx, cy - ry, rx * 2, ry * 2, 'd');
  b.rect(16, 2, 20, 8, 'd');
  b.scatter('G', 0.035, 2, 2, 49, 33, 'd', 2);
  b.rect(19, 12, 4, 4, 'd');
  b.structure('cocoon', 20, 12, 2, 2, 1, 'nabi');
  b.structure('chest', 46, 30, 2, 2, 1, 'windkey');
  return mapDef(b, {
    id: 'desk',
    name: '책상 시계 공장',
    theme: 'factory',
    warps: [{ x: 0, y: 29, w: 1, h: 3, to: 'village', tx: 2, ty: 15, label: '블록 마을' }],
    npcs: [{ id: 'mole', x: 6, y: 27 }],
    spawns: [
      { x: 26, y: 25, r: 4, pool: ['tin', 'pencil'], max: 6, lv: [12, 14] },
      { x: 12, y: 14, r: 4, pool: ['spider', 'tin'], max: 6, lv: [13, 15] },
      { x: 44, y: 27, r: 4, pool: ['lamp', 'pencil', 'tin'], max: 6, lv: [14, 16] },
      { x: 42, y: 15, r: 4, pool: ['tin', 'spider', 'pencil'], max: 7, lv: [16, 18] },
    ],
    start: { x: 3, y: 30 },
    safe: false,
    dark: false,
    boss: { id: 'b_tin', x: 26, y: 5, lv: 19 },
    level: 'Lv 12~18',
  });
}

/** 침대 밑: 어둡고 먼지투성이, 잃어버린 구슬이 반짝인다 */
function underbed(): MapDef {
  const b = new Builder(48, 36, 'Y', 404);
  b.path([[24, 0], [24, 8], [14, 12], [10, 20], [18, 26], [30, 24], [38, 18], [36, 10], [28, 12]], 4, 'u');
  b.path([[18, 26], [24, 31]], 3, 'u');
  b.ellipse(24, 31, 9, 4, 'u', 0.3);
  b.ellipse(12, 16, 5, 4, 'u', 0.5);
  b.ellipse(38, 14, 5, 5, 'u', 0.5);
  b.ellipse(22, 9, 4, 3, 'u', 0.5);
  b.scatter('L', 0.04, 1, 1, 46, 34, 'u', 2);
  b.ellipse(24, 31, 3, 2, 'u');
  b.structure('chest', 40, 10, 2, 2, 1, 'marble');
  return mapDef(b, {
    id: 'underbed',
    name: '침대 밑',
    theme: 'cave',
    warps: [{ x: 22, y: 0, w: 5, h: 1, to: 'village', tx: 20, ty: 27, label: '블록 마을' }],
    npcs: [],
    spawns: [
      { x: 18, y: 26, r: 4, pool: ['bat', 'dustling'], max: 6, lv: [18, 20] },
      { x: 12, y: 16, r: 4, pool: ['bat', 'sock', 'spider'], max: 6, lv: [19, 21] },
      { x: 22, y: 9, r: 3, pool: ['dustling', 'sock'], max: 5, lv: [19, 21] },
      { x: 38, y: 14, r: 4, pool: ['shadow', 'eye', 'sock'], max: 6, lv: [21, 23] },
    ],
    start: { x: 24, y: 2 },
    safe: false,
    dark: true,
    boss: { id: 'b_dusty', x: 24, y: 31, lv: 25 },
    level: 'Lv 18~24',
  });
}

/** 다락방: 먼지 왕이 기다리는 곳 (이야기의 끝) */
function attic(): MapDef {
  const b = new Builder(50, 36, 'v', 606);
  for (const [cx, cy, rx, ry] of [[8, 30, 5, 4], [20, 24, 6, 4], [34, 26, 6, 4], [40, 14, 6, 4], [24, 8, 9, 5]] as const) {
    b.ellipse(cx, cy, rx + 1, ry + 1, 'R', 0.4);
  }
  for (const [[x0, y0], [x1, y1]] of [[[8, 30], [20, 24]], [[20, 24], [34, 26]], [[34, 26], [40, 14]], [[40, 14], [24, 8]]] as [[number, number], [number, number]][])
    b.path([[x0, y0], [x1, y0], [x1, y1]], 3, '=', (c) => c === 'v' || c === 'R');
  for (const [cx, cy, rx, ry] of [[8, 30, 5, 4], [20, 24, 6, 4], [34, 26, 6, 4], [40, 14, 6, 4], [24, 8, 9, 5]] as const) b.ellipse(cx, cy, rx, ry, 'r', 0.4);
  for (const [cx, cy] of [[8, 30], [20, 24], [34, 26], [40, 14], [24, 8]]) b.ellipse(cx, cy, 2, 2, 'r');
  b.structure('chest', 33, 28, 2, 2, 1, 'hourglass');
  return mapDef(b, {
    id: 'attic',
    name: '다락방',
    theme: 'rift',
    warps: [{ x: 6, y: 33, w: 4, h: 1, to: 'village', tx: 34, ty: 5, label: '블록 마을' }],
    npcs: [],
    spawns: [
      { x: 20, y: 24, r: 4, pool: ['dustling', 'shadow', 'eye'], max: 6, lv: [24, 25] },
      { x: 34, y: 26, r: 4, pool: ['shadow', 'dustknight', 'sock'], max: 6, lv: [25, 26] },
      { x: 40, y: 14, r: 4, pool: ['dustknight', 'eye', 'shadow'], max: 6, lv: [26, 28] },
    ],
    start: { x: 8, y: 30 },
    safe: false,
    dark: true,
    boss: { id: 'b_king', x: 24, y: 7, lv: 30 },
    level: 'Lv 24~28',
  });
}

// ───────────────────────── 다락방 균열 ─────────────────────────

export const RIFT_MAX = 50;
/** 다섯 깊이마다 보스. 50 은 먼지 왕 */
export const RIFT_BOSSES = ['b_bear', 'b_jelly', 'b_tin', 'b_dusty'];

export function riftBoss(depth: number): string | null {
  if (depth >= RIFT_MAX) return 'b_king';
  if (depth % 5 !== 0) return null;
  // 5 단계는 이야기 순서대로 더스티
  if (depth === 5) return 'b_dusty';
  return RIFT_BOSSES[(depth / 5 - 2 + RIFT_BOSSES.length) % RIFT_BOSSES.length];
}

/** 깊이에 맞는 몬스터 레벨 (엔딩 뒤 도전이라 28 부터) */
export function riftLevel(depth: number): number {
  return Math.min(55, 26 + Math.round(depth * 0.6));
}

const RIFT_POOLS = [
  ['wolf', 'marble', 'ragdoll', 'dustling'],
  ['jelly', 'cookie', 'bee', 'gum'],
  ['tin', 'pencil', 'lamp', 'spider'],
  ['bat', 'sock', 'dustling', 'eye'],
  ['shadow', 'eye', 'dustknight', 'sock'],
];

/** 다락방 상자 층마다 모습: 바닥 · 벽 · 소품 */
const BOX_LOOKS: { theme: Theme; floor: string; wall: string; prop: string }[] = [
  { theme: 'toybox', floor: 'w', wall: 'Q', prop: 'O' },
  { theme: 'candy', floor: 'p', wall: 'k', prop: 'l' },
  { theme: 'factory', floor: 'd', wall: 'E', prop: 'G' },
  { theme: 'cave', floor: 'u', wall: 'Y', prop: 'L' },
  { theme: 'rift', floor: 'r', wall: 'R', prop: 'c' },
];

export function rift(depth: number, seed: number): MapDef {
  const b = new Builder(60, 44, 'v', seed);
  const rng = b.rng;
  // 섬 같은 방들을 흩어 놓고 다리로 잇는다
  const rooms: { x: number; y: number; rx: number; ry: number }[] = [{ x: 8, y: 22, rx: 5, ry: 4 }];
  let tries = 0;
  while (rooms.length < 7 && tries++ < 400) {
    const r = { x: 8 + rng.int(46), y: 6 + rng.int(32), rx: 4 + rng.int(4), ry: 3 + rng.int(3) };
    if (rooms.some((o) => Math.abs(o.x - r.x) < o.rx + r.rx + 3 && Math.abs(o.y - r.y) < o.ry + r.ry + 3)) continue;
    rooms.push(r);
  }
  // 가장 먼 방이 마지막 (보스 · 출구)
  rooms.sort((a, c) => Math.hypot(a.x - 8, a.y - 22) - Math.hypot(c.x - 8, c.y - 22));
  for (const r of rooms) b.ellipse(r.x, r.y, r.rx + 1, r.ry + 1, 'R', 0.4);
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const c = rooms[i];
    b.path([[a.x, a.y], [c.x, a.y], [c.x, c.y]], 3, '=', (ch) => ch === 'v' || ch === 'R');
  }
  for (const r of rooms) b.ellipse(r.x, r.y, r.rx, r.ry, 'r', 0.4);
  // 길가 벽: 허공과 닿은 다리는 그대로, 방 테두리는 R
  b.scatter('c', 0.03, 1, 1, 58, 42, 'r', 3);
  // 방 가운데(시작 자리 · 보스 자리 · 사냥터)는 비워 둔다
  for (const r of rooms) b.ellipse(r.x, r.y, 2, 2, 'r');
  // 상자마다 다른 방 모습
  const look = BOX_LOOKS[(depth - 1) % BOX_LOOKS.length];
  for (let i = 0; i < b.t.length; i++) {
    if (b.t[i] === 'r') b.t[i] = look.floor;
    else if (b.t[i] === 'R') b.t[i] = look.wall;
    else if (b.t[i] === 'c' && look.floor !== 'r') b.t[i] = look.prop;
  }
  const pool = RIFT_POOLS[(depth - 1) % RIFT_POOLS.length];
  const lv = riftLevel(depth);
  const last = rooms[rooms.length - 1];
  const bossId = riftBoss(depth);
  return {
    id: 'rift',
    name: `다락방 상자 ${depth}층`,
    theme: look.theme,
    w: b.w,
    h: b.h,
    tiles: b.rows(),
    structures: b.structures,
    warps: [],
    npcs: [],
    spawns: rooms.slice(1).map((r) => ({ x: r.x, y: r.y, r: Math.min(r.rx, r.ry), pool, max: 4 + Math.min(4, Math.floor(depth / 8)), lv: [lv, lv + 1] as [number, number] })),
    start: { x: rooms[0].x, y: rooms[0].y },
    safe: false,
    dark: true,
    boss: bossId ? { id: bossId, x: last.x, y: last.y, lv: lv + 2 } : undefined,
    depth,
    level: `Lv ${lv}`,
  };
}

const BUILT = new Map<MapId, MapDef>();

export function buildMap(id: MapId, depth = 1, seed = 1): MapDef {
  if (id === 'rift') return rift(depth, seed);
  let m = BUILT.get(id);
  if (!m) {
    m = { village, toybox, drawer, desk, underbed, attic }[id]();
    BUILT.set(id, m);
  }
  return m;
}
