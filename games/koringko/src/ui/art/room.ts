/**
 * 아이 방 꾸미기: 장난감 상자의 나무 벽, 바닥에 흩어진 작은 물건, 둥근 러그.
 * 지도(글자)만 보고 정하는 것들이라 테스트할 수 있다. 그림은 mapLayer 가 굽는다.
 */
import { isSolid, TILE, type MapDef } from '../../core/maps.ts';
import { Pix, hash2, hex, shade, type Color } from './paint.ts';

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

/** 러그 한 점의 색 (러그 밖이면 null) */
export function rugColor(r: Rug, x: number, y: number): Color | null {
  if (r.shape === 'paper') return paperColor(r, x, y);
  const nx = (x + 0.5 - r.cx) / r.rx;
  const ny = (y + 0.5 - r.cy) / r.ry;
  const d = Math.sqrt(nx * nx + ny * ny);
  if (d > 1) return null;
  const rings = 9;
  const ring = Math.min(rings - 1, Math.floor(d * rings));
  const base = r.colors[ring % r.colors.length];
  if (d > 0.965) return shade(base, -0.45);
  // 꼰 줄: 둘레를 따라 비스듬한 마디
  const a = Math.atan2(ny, nx);
  const t = (a / (Math.PI * 2)) * (40 + ring * 18) + d * rings * 2;
  const knot = ((Math.floor(t) % 2) + 2) % 2;
  const edge = d * rings - ring;
  let c = shade(base, knot ? 0.06 : -0.08);
  if (edge < 0.12) c = shade(base, -0.22);
  return c;
}

/** 줄 공책 종이: 위 여백 · 파란 줄 · 왼쪽 빨간 여백 줄 · 가장자리 그늘 */
function paperColor(r: Rug, x: number, y: number): Color | null {
  const lx = Math.floor(x - (r.cx - r.rx));
  const ly = Math.floor(y - (r.cy - r.ry));
  const W = r.rx * 2;
  const H = r.ry * 2;
  if (lx < 0 || ly < 0 || lx >= W || ly >= H) return null;
  const [paper, line, margin] = r.colors;
  let c = paper;
  if (ly >= 14 && (ly - 14) % 9 === 0) c = line;
  if (Math.floor(lx) === 16 || Math.floor(lx) === 17) c = margin;
  if (hash2(Math.floor(x), Math.floor(y), 521) < 0.02) c = shade(c, -0.05);
  if (lx < 1 || ly < 1) c = shade(paper, 0.08);
  if (lx >= W - 1 || ly >= H - 1) c = shade(paper, -0.35);
  return c;
}

// ───────────────────────── 작은 물건 그림 ─────────────────────────

const CRAYON = ['#d8473f', '#3d78c9', '#e9b93a', '#4c9a55', '#8a5bc4', '#ee8a3a'].map(hex);

/** 바닥에 굽는 작은 그림 (가운데 기준) */
export function decalSprite(d: Decal): Pix {
  switch (d.kind) {
    case 'crayon': {
      const c = CRAYON[Math.floor(d.v * CRAYON.length)];
      const p = new Pix(16, 16);
      const flip = d.v > 0.5;
      for (let i = 0; i < 11; i++) {
        const x = 2 + i;
        const y = flip ? 4 + Math.floor(i * 0.6) : 10 - Math.floor(i * 0.6);
        p.set(x, y, i > 8 ? shade(c, 0.1) : c);
        p.set(x, y + 1, i > 8 ? c : shade(c, -0.3));
        if (i === 3 || i === 7) {
          p.set(x, y, hex('#f2ead8'));
          p.set(x, y + 1, hex('#d8ccb0'));
        }
      }
      return p.outline(hex('#2a1c14'));
    }
    case 'button': {
      const c = [hex('#e0a040'), hex('#c85a6a'), hex('#5a8ac8'), hex('#e8e0d0')][Math.floor(d.v * 4)];
      const p = new Pix(10, 10);
      p.ball(5, 5, 4, 3.6, c);
      p.set(4, 4, shade(c, -0.5));
      p.set(6, 4, shade(c, -0.5));
      p.set(4, 6, shade(c, -0.5));
      p.set(6, 6, shade(c, -0.5));
      return p.outline(hex('#2a1c14'));
    }
    case 'brick': {
      const c = [hex('#d8473f'), hex('#3d78c9'), hex('#e9b93a'), hex('#4c9a55')][Math.floor(d.v * 4)];
      const p = new Pix(14, 10);
      p.rect(1, 3, 12, 6, shade(c, -0.15));
      p.rect(1, 3, 12, 2, c);
      for (const x of [3, 7, 11]) {
        p.rect(x - 1, 1, 3, 3, shade(c, 0.1));
        p.set(x - 1, 1, shade(c, 0.35));
      }
      return p.outline(hex('#2a1c14'));
    }
    case 'star': {
      const p = new Pix(11, 11);
      const c = hex('#d8f0a0');
      p.tri(5.5, 0, 2, 8, 9, 8, c);
      p.tri(0, 3.5, 11, 3.5, 5.5, 9, c);
      p.tri(1.5, 10.5, 5.5, 6, 5.5, 8, c);
      p.tri(9.5, 10.5, 5.5, 6, 5.5, 8, c);
      p.set(5, 4, hex('#ffffff'));
      return p;
    }
    case 'puzzle': {
      const c = [hex('#6aa0c8'), hex('#d88a8a'), hex('#a8c870')][Math.floor(d.v * 3)];
      const p = new Pix(12, 12);
      p.rect(2, 2, 8, 8, c);
      p.oval(6, 1.5, 2, 1.6, c);
      p.oval(10.5, 6, 1.6, 2, c);
      p.rect(2, 9, 8, 1, shade(c, -0.3));
      return p.outline(hex('#2a1c14'));
    }
    case 'clip': {
      const p = new Pix(14, 8);
      const c = d.v > 0.5 ? hex('#c8d0dc') : hex('#e0a0c0');
      p.rect(1, 1, 12, 1, c);
      p.rect(1, 6, 12, 1, c);
      p.rect(1, 1, 1, 6, c);
      p.rect(3, 3, 9, 1, c);
      p.rect(12, 1, 1, 3, c);
      p.rect(3, 3, 1, 3, c);
      return p;
    }
    case 'eraser': {
      const p = new Pix(14, 10);
      p.rect(1, 2, 12, 6, hex('#f0a0b0'));
      p.rect(1, 2, 5, 6, hex('#5a8ad8'));
      p.rect(1, 2, 12, 1, hex('#ffd0d8'));
      return p.outline(hex('#2a1c14'));
    }
    case 'shaving': {
      const p = new Pix(12, 10);
      const wood = hex('#e8c890');
      for (let a = 0; a < 6.2; a += 0.15) {
        const r = 2 + a * 0.55;
        p.set(6 + Math.cos(a) * r, 5 + Math.sin(a) * r * 0.7, a > 5 ? hex('#d8473f') : wood);
      }
      return p;
    }
    case 'pin': {
      const p = new Pix(10, 10);
      const c = [hex('#d8473f'), hex('#3d78c9'), hex('#e9b93a')][Math.floor(d.v * 3)];
      p.ball(5, 4, 3.5, 3, c);
      p.set(5, 8, hex('#c8c8d0'));
      return p.outline(hex('#2a1c14'));
    }
    case 'sock': {
      const p = new Pix(14, 12);
      const c = hex('#d8d0e0');
      p.rect(2, 1, 5, 7, c);
      p.oval(7, 9, 5, 2.4, c);
      p.rect(2, 3, 5, 1, hex('#c85a6a'));
      return p.outline(hex('#2a1c14'));
    }
  }
}

// ───────────────────────── 장난감 상자 나무 벽 ─────────────────────────

const BOX_DARK = hex('#1c1410');
const BOX_LEDGE = hex('#6e4a32');
const BOX_FACE = hex('#8a5e3c');

/**
 * 상자 벽 한 칸. edge: 바닥과 맞닿은 벽 (위에서 보면 두꺼운 나무 턱) · 아니면 상자 바깥 어둠.
 * front: 바로 아래가 바닥이라 벽 앞면이 보인다. rim: 그쪽 이웃이 바닥이면 모서리를 밝게.
 */
export function boxWallTile(tx: number, ty: number, front: boolean, rim: { up: boolean; left: boolean; right: boolean }, edge = true): Pix {
  const T = TILE;
  const p = new Pix(T, T);
  if (!edge) {
    p.rect(0, 0, T, T, BOX_DARK);
    for (let i = 0; i < 2; i++) if (hash2(tx, ty, 612 + i) < 0.3) p.set(Math.floor(hash2(tx, i, 613) * T), Math.floor(hash2(i, ty, 614) * T), shade(BOX_DARK, 0.12));
    return p;
  }
  // 나무 턱 윗면: 결이 가로로 길다
  for (let y = 0; y < T; y++) {
    const gy = ty * T + y;
    for (let x = 0; x < T; x++) {
      const gx = tx * T + x;
      let c = shade(BOX_LEDGE, (hash2(Math.floor(gy / 6), 0, 615) - 0.5) * 0.1);
      if (gy % 6 === 5) c = shade(BOX_LEDGE, -0.28);
      else if (Math.sin(gx * 0.08 + Math.floor(gy / 6) * 2.1) > 0.94) c = shade(c, -0.1);
      p.set(x, y, c);
    }
  }
  const rimC = hex('#c69a6a');
  if (rim.up) {
    p.rect(0, 0, T, 2, rimC);
    p.rect(0, 2, T, 1, shade(rimC, -0.3));
  }
  if (rim.left) p.rect(0, 0, 2, T, shade(rimC, -0.05));
  if (rim.right) p.rect(T - 2, 0, 2, T, shade(rimC, -0.3));
  if (front) {
    // 앞면: 세로 판자, 아래로 갈수록 그늘, 못
    const top = 6;
    p.rect(0, top - 2, T, 2, rimC);
    for (let y = top; y < T; y++) {
      const k = (y - top) / (T - top);
      for (let x = 0; x < T; x++) {
        const gx = tx * T + x;
        const board = Math.floor(gx / 12);
        let c = shade(BOX_FACE, (hash2(board, ty, 611) - 0.5) * 0.12 - k * 0.22);
        if (gx % 12 === 0) c = shade(BOX_FACE, -0.45);
        else if (gx % 12 === 1) c = shade(BOX_FACE, 0.12 - k * 0.2);
        else if (Math.sin(gx * 0.9 + y * 0.15 + board * 3) > 0.93) c = shade(c, -0.12);
        p.set(x, y, c);
      }
    }
    if ((tx & 1) === 0) {
      p.set(6, top + 3, hex('#d8c8a0'));
      p.set(18, top + 3, hex('#d8c8a0'));
    }
    p.rect(0, T - 1, T, 1, shade(BOX_FACE, -0.6));
  }
  return p;
}
