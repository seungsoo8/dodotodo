/**
 * 아이 방 꾸미기: 장난감 상자의 나무 벽, 바닥에 흩어진 작은 물건, 둥근 러그.
 * 지도(글자)만 보고 정하는 것들이라 테스트할 수 있다. 그림은 mapLayer 가 굽는다.
 */
import { isSolid, TILE, type MapDef } from '../../core/maps.ts';
import { Pix, hash2, hex, shade, type Color } from './paint.ts';
import { paintGrid } from './px/grid.ts';
import { paintFit, paintTiled } from './px/slice.ts';
import * as TX from './px/toyTiles.ts';

/** 지도 가장자리와 이어진 블록 칸 = 장난감 상자의 벽 (나머지 블록은 안쪽 더미) */
export function outerWalls(m: MapDef): Set<number> {
  const out = new Set<number>();
  const q: number[] = [];
  const isWall = (x: number, y: number) => m.tiles[y][x] === 'Q';
  for (let x = 0; x < m.w; x++)
    for (const y of [0, m.h - 1])
      if (isWall(x, y)) {
        out.add(y * m.w + x);
        q.push(y * m.w + x);
      }
  for (let y = 0; y < m.h; y++)
    for (const x of [0, m.w - 1])
      if (isWall(x, y) && !out.has(y * m.w + x)) {
        out.add(y * m.w + x);
        q.push(y * m.w + x);
      }
  while (q.length) {
    const k = q.pop()!;
    const x = k % m.w;
    const y = (k - x) / m.w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ax = x + dx;
      const ay = y + dy;
      if (ax < 0 || ay < 0 || ax >= m.w || ay >= m.h) continue;
      const kk = ay * m.w + ax;
      if (out.has(kk) || !isWall(ax, ay)) continue;
      // 가장자리에서 3칸 넘게 들어온 블록은 벽이 아니라 더미로 본다
      if (Math.min(ax, ay, m.w - 1 - ax, m.h - 1 - ay) > 2) continue;
      out.add(kk);
      q.push(kk);
    }
  }
  return out;
}

export type DecalKind = 'crayon' | 'button' | 'brick' | 'star' | 'puzzle' | 'sock' | 'clip' | 'eraser' | 'shaving' | 'pin';

export interface Decal {
  kind: DecalKind;
  x: number;
  y: number;
  /** 0~1 (색 · 방향 고르기) */
  v: number;
}

const DECAL_KINDS: DecalKind[] = ['crayon', 'crayon', 'button', 'brick', 'brick', 'star', 'puzzle', 'button'];
const VILLAGE_KINDS: DecalKind[] = ['crayon', 'button', 'brick', 'sock', 'button'];
const DESK_KINDS: DecalKind[] = ['clip', 'eraser', 'shaving', 'shaving', 'pin', 'clip'];

/** 장난감 상자 바닥에 흩어진 작은 물건 (늘 같은 자리) */
export function toyDecals(m: MapDef): Decal[] {
  const village = m.theme === 'village';
  const desk = m.theme === 'factory';
  if (m.theme !== 'toybox' && !village && !desk) return [];
  const kinds = village ? VILLAGE_KINDS : desk ? DESK_KINDS : DECAL_KINDS;
  const out: Decal[] = [];
  for (let ty = 1; ty < m.h - 1; ty++)
    for (let tx = 1; tx < m.w - 1; tx++) {
      if (isSolid(m, tx, ty)) continue;
      // 마을: 양탄자 위에만 (길 · 건물 둘레 · 쉼터 시설 자리는 비운다)
      if (village && (m.tiles[ty][tx] !== 'a' || m.structures.some((s) => tx >= s.x - 1 && tx <= s.x + s.w && ty >= s.y - 1 && ty <= s.y + s.h))) continue;
      const h = hash2(tx, ty, 501);
      if (h > (village ? 0.03 : 0.035)) continue;
      const kind = kinds[Math.floor(hash2(tx, ty, 502) * kinds.length)];
      out.push({ kind, x: tx * TILE + 5 + Math.floor(hash2(tx, ty, 503) * 14), y: ty * TILE + 5 + Math.floor(hash2(tx, ty, 504) * 14), v: hash2(tx, ty, 505) });
    }
  return out;
}

export interface Rug {
  /** oval: 둥근 꼰 러그 · paper: 줄 공책 종이 (rx, ry 는 반 너비 · 반 높이) */
  shape: 'oval' | 'paper';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  colors: Color[];
}

/** 둥근 꼰 러그: 곰 대장 싸움터, 입구 쉼터 */
export function rugsFor(m: MapDef): Rug[] {
  if (m.id === 'desk') {
    // 사냥터마다 공책 종이 한 장 (조금씩 비뚤게 놓인 자리)
    return m.spawns.map((z, i) => ({
      shape: 'paper' as const,
      cx: (z.x + 0.5) * TILE + (hash2(i, 1, 520) - 0.5) * TILE,
      cy: (z.y + 0.5) * TILE + (hash2(i, 2, 520) - 0.5) * TILE,
      rx: (z.r + 1.6) * TILE,
      ry: (z.r + 0.6) * TILE,
      colors: [hex('#c9bea4'), hex('#7890c0'), hex('#c86a6a')],
    }));
  }
  if (m.id !== 'toybox') return [];
  const out: Rug[] = [{ shape: 'oval', cx: 10.5 * TILE, cy: 18.5 * TILE, rx: 4.2 * TILE, ry: 2.8 * TILE, colors: ['#6f86a8', '#d9ccb0', '#6f86a8', '#b58a78'].map(hex) }];
  if (m.boss) out.push({ shape: 'oval', cx: (m.boss.x + 0.5) * TILE, cy: (m.boss.y + 0.5) * TILE, rx: 6.2 * TILE, ry: 3.6 * TILE, colors: ['#9a5a4c', '#d9ccb0', '#9a5a4c', '#c9a25a'].map(hex) });
  return out;
}

/** 러그 그림 (격자 BRAID_RUG 둥근 꼰 러그 · PAPER 줄 공책 종이를 크기에 맞춰), 왼쪽 위가 (cx - rx, cy - ry) */
const rugCache = new Map<Rug, Pix>();
export function rugSprite(r: Rug): Pix {
  const hit = rugCache.get(r);
  if (hit) return hit;
  const w = Math.round(r.rx * 2);
  const h = Math.round(r.ry * 2);
  const p = new Pix(w, h);
  const s = r.shape === 'paper' ? TX.PAPER : TX.BRAID_RUG;
  const pal = r.shape === 'paper' ? TX.paperPal(r.colors) : TX.braidPal([r.colors[0], r.colors[1], r.colors[3] ?? r.colors[1]]);
  paintFit(p, s.g, pal, 0, 0, w, h, s.cols, s.rows);
  rugCache.set(r, p);
  return p;
}

/** 러그 한 점의 색 (러그 밖이면 null) */
export function rugColor(r: Rug, x: number, y: number): Color | null {
  const c = rugSprite(r).get(Math.floor(x - (r.cx - r.rx)), Math.floor(y - (r.cy - r.ry)));
  return c < 0 ? null : c;
}

// ───────────────────────── 작은 물건 그림 (손찍기 격자) ─────────────────────────

const CRAYON = ['#d8473f', '#3d78c9', '#e9b93a', '#4c9a55', '#8a5bc4', '#ee8a3a'].map(hex);

/** 바닥에 굽는 작은 그림 (가운데 기준) */
export function decalSprite(d: Decal): Pix {
  const pick = <T,>(xs: T[]) => xs[Math.min(xs.length - 1, Math.floor(d.v * xs.length))];
  const stamp = (g: readonly string[], pal: Record<string, Color>, flip = false) => {
    const p = new Pix(g[0].length + 2, g.length + 2);
    paintGrid(p, g, 1, 1, pal, flip);
    return p;
  };
  switch (d.kind) {
    case 'crayon':
      return stamp(TX.DEC_CRAYON, TX.crayonPal(pick(CRAYON)), d.v > 0.5);
    case 'button':
      return stamp(TX.DEC_BUTTON, TX.decalPal(pick([hex('#e0a040'), hex('#c85a6a'), hex('#5a8ac8'), hex('#e8e0d0')])));
    case 'brick':
      return stamp(TX.DEC_BRICK, TX.decalPal(pick([hex('#d8473f'), hex('#3d78c9'), hex('#e9b93a'), hex('#4c9a55')])));
    case 'star':
      return stamp(TX.DEC_STAR, TX.decalPal(hex('#d8f0a0')));
    case 'puzzle':
      return stamp(TX.DEC_PUZZLE, TX.decalPal(pick([hex('#6aa0c8'), hex('#d88a8a'), hex('#a8c870')])));
    case 'clip':
      return stamp(TX.DEC_CLIP, TX.clipPal(d.v > 0.5 ? hex('#c8d0dc') : hex('#e0a0c0')));
    case 'eraser':
      return stamp(TX.DEC_ERASER, TX.decalPal(hex('#5a8ad8')));
    case 'shaving':
      return stamp(TX.DEC_SHAVING, TX.decalPal(hex('#e8c890')), d.v > 0.5);
    case 'pin':
      return stamp(TX.DEC_PIN, TX.decalPal(pick([hex('#d8473f'), hex('#3d78c9'), hex('#e9b93a')])));
    case 'sock':
      return stamp(TX.DEC_SOCK, TX.decalPal(hex('#d8d0e0')));
  }
}

// ───────────────────────── 장난감 상자 나무 벽 ─────────────────────────

/**
 * 상자 벽 한 칸. edge: 바닥과 맞닿은 벽 (위에서 보면 두꺼운 나무 턱, 격자 BOX_LEDGE) · 아니면 상자 바깥 어둠.
 * front: 바로 아래가 바닥이라 벽 앞면 (격자 BOX_FACE) 이 보인다. rim: 그쪽 이웃이 바닥이면 모서리를 밝게.
 */
export function boxWallTile(tx: number, ty: number, front: boolean, rim: { up: boolean; left: boolean; right: boolean }, edge = true): Pix {
  const T = TILE;
  const p = new Pix(T, T);
  const bp = TX.boxWallPal();
  if (!edge) {
    paintTiled(p, ['D'], bp, 0, 0, T, T);
    paintTiled(p, TX.VOID_DUST, { s: bp.E, S: bp.E }, 0, 0, T, T, tx * 7, ty * T);
    return p;
  }
  paintTiled(p, TX.BOX_LEDGE, bp, 0, 0, T, T, tx * T, ty * T);
  if (rim.up) paintTiled(p, ['R', 'R', 'r'], bp, 0, 0, T, 3);
  if (rim.left) paintTiled(p, ['RR'], bp, 0, 0, 2, T);
  if (rim.right) paintTiled(p, ['rr'], bp, T - 2, 0, 2, T);
  if (front) paintTiled(p, TX.BOX_FACE, bp, 0, T - TX.BOX_FACE.length, T, TX.BOX_FACE.length, tx * T, 0);
  return p;
}
