/**
 * 지도: 타일(24px) 글자로 짓는다. 집·분수 같은 큰 것은 '구조물'로 따로 두고 밟지 못하는 자리만 표시한다.
 *   걷는 땅  . 풀  , 꽃  g 긴 풀  : 흙길  # 광장 돌  = 나무다리  _ 동굴 바닥  p 과자 땅  q 과자 길  r 균열 바닥
 *   막힌 곳  T 나무  P 소나무  B 덤불  o 바위  f 울타리  ~ 물  C 동굴 벽  c 수정  k 쿠키 벽  l 막대사탕 나무
 *            H 건물 자리  R 균열 벽  v 허공  X 보이지 않는 벽
 */
import { createRng, type Rng } from './rng.ts';

export const TILE = 24;
const SOLID = new Set(['T', 'P', 'B', 'o', 'f', '~', 'C', 'c', 'k', 'l', 'H', 'R', 'v', 'X']);

export type MapId = 'village' | 'forest' | 'candy' | 'cave' | 'rift';
export type Theme = 'village' | 'forest' | 'candy' | 'cave' | 'rift';

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

export type StructureKind = 'chief' | 'shop' | 'forge' | 'tailor' | 'house' | 'fountain' | 'portal' | 'well' | 'board' | 'tent' | 'gate' | 'altar' | 'lamp' | 'cart';

export interface Structure {
  kind: StructureKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 밟지 못하는 칸 (구조물 아랫부분) */
  solid: boolean;
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
  structure(kind: StructureKind, x: number, y: number, w: number, h: number, solidRows = h): void {
    this.structures.push({ kind, x, y, w, h, solid: solidRows > 0 });
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

// ───────────────────────── 지도들 ─────────────────────────

function village(): MapDef {
  const b = new Builder(40, 30, '.', 101);
  b.border(1.3, 'TTP', [[37, 13, 39, 16], [18, 0, 21, 2]]);
  // 길: 동쪽(숲) · 북쪽(과자 언덕) · 집 앞
  b.path([[22, 15], [39, 15]], 2, ':');
  b.path([[19, 15], [19, 0]], 2, ':');
  b.path([[8, 9], [8, 15], [12, 15]], 2, ':');
  b.path([[30, 9], [30, 13]], 2, ':');
  b.path([[8, 21], [8, 18], [13, 18]], 2, ':');
  b.path([[30, 21], [30, 18], [26, 18]], 2, ':');
  // 둥근 광장과 분수
  b.ellipse(20, 15.5, 7.5, 5.2, ',');
  b.ellipse(20, 15.5, 6.5, 4.4, '#');
  b.structure('fountain', 19, 14, 2, 2);
  // 연못
  b.ellipse(14, 6, 3.6, 2.3, ',');
  b.ellipse(14, 6, 2.8, 1.6, '~');
  // 집: 지붕은 위로 솟고 아래 2줄만 막힌다
  b.structure('chief', 5, 4, 6, 5, 2);
  b.structure('shop', 27, 4, 6, 5, 2);
  b.structure('forge', 27, 20, 6, 5, 2);
  b.structure('tailor', 5, 20, 6, 5, 2);
  b.structure('board', 23, 11, 2, 2, 1);
  b.structure('well', 33, 15, 2, 2, 1);
  b.structure('lamp', 13, 13, 1, 2, 1);
  b.structure('lamp', 26, 13, 1, 2, 1);
  b.structure('lamp', 13, 18, 1, 2, 1);
  b.structure('lamp', 26, 18, 1, 2, 1);
  // 꽃밭 · 울타리 · 덤불
  b.scatter(',', 0.35, 2, 24, 37, 27, '.');
  b.scatter('g', 0.08, 2, 2, 37, 27, '.');
  b.path([[16, 22], [16, 26]], 1, 'f', (c) => c === '.');
  b.path([[24, 22], [24, 26]], 1, 'f', (c) => c === '.');
  b.scatter('B', 0.04, 2, 2, 37, 27, '.', 2);
  return {
    id: 'village',
    name: '코링코 마을',
    theme: 'village',
    w: b.w,
    h: b.h,
    tiles: b.rows(),
    structures: b.structures,
    warps: [
      { x: 39, y: 13, w: 1, h: 4, to: 'forest', tx: 2, ty: 18, label: '곰인형 숲' },
      { x: 18, y: 0, w: 4, h: 1, to: 'candy', tx: 28, ty: 33, label: '과자 언덕', need: 'candy_open', locked: '과자 언덕 길은 아직 막혀 있다. 촌장 할머니께 여쭤 보자' },
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
    level: '',
  };
}

function forest(): MapDef {
  const b = new Builder(56, 36, '.', 202);
  b.border(1.6, 'TTPB', [[0, 16, 2, 19], [51, 2, 55, 5]]);
  b.path([[0, 18], [10, 18], [18, 14], [28, 16], [36, 10], [44, 8], [53, 4]], 3, ':');
  b.path([[18, 14], [16, 26], [26, 30]], 2, ':');
  b.path([[28, 16], [40, 24], [48, 28]], 2, ':');
  // 냇물과 다리
  b.path([[30, 0], [32, 8], [31, 18], [34, 26], [33, 35]], 2, '~');
  b.path([[30, 15], [33, 15]], 3, '=', (c) => c === '~' || c === ':');
  b.path([[31, 9], [34, 9]], 3, '=', (c) => c === '~');
  b.path([[32, 24], [36, 24]], 3, '=', (c) => c === '~');
  // 나무 · 덤불 · 꽃
  b.scatter('T', 0.07, 3, 3, 52, 32, '.', 1);
  b.scatter('P', 0.03, 3, 3, 52, 32, '.', 1);
  b.scatter('B', 0.03, 3, 3, 52, 32, '.', 1);
  b.scatter(',', 0.08, 3, 3, 52, 32, '.');
  b.scatter('g', 0.12, 3, 3, 52, 32, '.');
  b.scatter('o', 0.012, 3, 3, 52, 32, '.', 2);
  // 사냥터 빈터
  for (const [cx, cy, rx, ry] of [[12, 22, 5, 4], [22, 8, 5, 3], [44, 18, 5, 4], [40, 30, 6, 3]] as const) b.ellipse(cx, cy, rx, ry, '.', 0.4);
  b.structure('cart', 6, 15, 2, 2, 1);
  b.structure('gate', 51, 1, 4, 3, 2);
  return {
    id: 'forest',
    name: '곰인형 숲',
    theme: 'forest',
    w: b.w,
    h: b.h,
    tiles: b.rows(),
    structures: b.structures,
    warps: [
      { x: 0, y: 16, w: 1, h: 4, to: 'village', tx: 37, ty: 15, label: '코링코 마을' },
      { x: 52, y: 4, w: 2, h: 1, to: 'cave', tx: 24, ty: 33, label: '태엽 동굴', need: 'cave_open', locked: '동굴 입구가 태엽 자물쇠로 잠겨 있다' },
    ],
    npcs: [],
    spawns: [
      { x: 12, y: 21, r: 4, pool: ['fluff', 'fluff', 'mushroom'], max: 6, lv: [1, 2] },
      { x: 22, y: 8, r: 4, pool: ['fluff', 'mushroom', 'mouse'], max: 6, lv: [2, 3] },
      { x: 44, y: 18, r: 4, pool: ['mouse', 'wolf'], max: 6, lv: [3, 5] },
      { x: 40, y: 30, r: 5, pool: ['wolf', 'ragdoll'], max: 7, lv: [4, 6] },
      { x: 24, y: 28, r: 4, pool: ['mushroom', 'ragdoll'], max: 5, lv: [3, 5] },
    ],
    start: { x: 2, y: 18 },
    safe: false,
    dark: false,
    level: 'Lv 1~6',
  };
}

function candy(): MapDef {
  const b = new Builder(56, 36, 'p', 303);
  b.border(1.6, 'lkl', [[26, 34, 30, 35]]);
  b.path([[28, 35], [28, 26], [20, 18], [12, 10], [8, 4]], 3, 'q');
  b.path([[28, 26], [38, 20], [46, 12]], 3, 'q');
  b.path([[20, 18], [34, 14]], 2, 'q');
  // 초콜릿 강 (막힘) 과 비스킷 다리
  b.path([[0, 22], [10, 24], [18, 28], [24, 30]], 2, '~');
  b.path([[14, 25], [14, 28]], 3, '=', (c) => c === '~');
  b.scatter('l', 0.05, 3, 3, 52, 32, 'p', 1);
  b.scatter('k', 0.025, 3, 3, 52, 32, 'p', 2);
  b.scatter(',', 0.06, 3, 3, 52, 32, 'p');
  for (const [cx, cy, rx, ry] of [[12, 10, 5, 4], [36, 18, 5, 4], [46, 10, 5, 4], [22, 28, 4, 3], [44, 28, 6, 4]] as const) b.ellipse(cx, cy, rx, ry, 'p', 0.4);
  b.structure('tent', 30, 30, 3, 3, 2);
  return {
    id: 'candy',
    name: '과자 언덕',
    theme: 'candy',
    w: b.w,
    h: b.h,
    tiles: b.rows(),
    structures: b.structures,
    warps: [{ x: 26, y: 35, w: 5, h: 1, to: 'village', tx: 20, ty: 2, label: '코링코 마을' }],
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
    level: 'Lv 6~12',
  };
}

function cave(): MapDef {
  const b = new Builder(48, 36, 'C', 404);
  // 굴: 아래 입구에서 위 보스 방까지 구불구불
  b.path([[24, 35], [24, 28], [14, 24], [10, 16], [18, 10], [30, 12], [38, 18], [36, 26], [28, 24]], 4, '_');
  b.path([[30, 12], [24, 6]], 3, '_');
  b.ellipse(24, 5, 9, 4, '_', 0.3);
  b.ellipse(12, 20, 5, 4, '_', 0.5);
  b.ellipse(38, 22, 5, 5, '_', 0.5);
  b.ellipse(22, 27, 4, 3, '_', 0.5);
  b.scatter('c', 0.04, 1, 1, 46, 34, '_', 2);
  b.scatter('o', 0.02, 1, 1, 46, 34, '_', 2);
  b.structure('altar', 23, 2, 2, 2, 1);
  return {
    id: 'cave',
    name: '태엽 동굴',
    theme: 'cave',
    w: b.w,
    h: b.h,
    tiles: b.rows(),
    structures: b.structures,
    warps: [{ x: 22, y: 35, w: 5, h: 1, to: 'forest', tx: 52, ty: 6, label: '곰인형 숲' }],
    npcs: [],
    spawns: [
      { x: 18, y: 26, r: 4, pool: ['bat', 'tin'], max: 6, lv: [8, 10] },
      { x: 12, y: 18, r: 4, pool: ['bat', 'spider'], max: 6, lv: [9, 11] },
      { x: 24, y: 11, r: 4, pool: ['tin', 'spider', 'lamp'], max: 6, lv: [10, 12] },
      { x: 38, y: 21, r: 4, pool: ['lamp', 'tin'], max: 6, lv: [11, 13] },
    ],
    start: { x: 24, y: 33 },
    safe: false,
    dark: true,
    boss: { id: 'b_bear', x: 24, y: 5, lv: 14 },
    level: 'Lv 8~14',
  };
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

/** 깊이에 맞는 몬스터 레벨 */
export function riftLevel(depth: number): number {
  return Math.min(60, 10 + depth);
}

const RIFT_POOLS = [
  ['dustling', 'shadow', 'eye'],
  ['dustling', 'bat', 'spider', 'eye'],
  ['jelly', 'cookie', 'bee', 'dustling'],
  ['tin', 'lamp', 'shadow', 'dustknight'],
  ['shadow', 'eye', 'dustknight', 'wolf'],
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
  const pool = RIFT_POOLS[depth % RIFT_POOLS.length];
  const lv = riftLevel(depth);
  const last = rooms[rooms.length - 1];
  const bossId = riftBoss(depth);
  return {
    id: 'rift',
    name: `다락방 균열 ${depth}단계`,
    theme: 'rift',
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
    boss: bossId ? { id: bossId, x: last.x, y: last.y, lv: Math.max(lv + 2, bossId === 'b_king' ? 50 : 0) } : undefined,
    depth,
    level: `Lv ${lv}`,
  };
}

const BUILT = new Map<MapId, MapDef>();

export function buildMap(id: MapId, depth = 1, seed = 1): MapDef {
  if (id === 'rift') return rift(depth, seed);
  let m = BUILT.get(id);
  if (!m) {
    m = { village, forest, candy, cave }[id]();
    BUILT.set(id, m);
  }
  return m;
}
