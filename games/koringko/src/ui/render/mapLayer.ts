/** 지도 한 장을 미리 그려 둔다: 땅 + 경계 + 벽 + 그림자, 그리고 y 순서로 그릴 소품·건물 목록 */
import { isSolidChar as isSolidTile, TILE, type MapDef } from '../../core/maps.ts';
import { pixCanvas } from '../art/canvas.ts';
import { Pix, hash2, hex, shade, type Color } from '../art/paint.ts';
import { propSprite, structureSprite } from '../art/props.ts';
import { edgeColor, groundTile, groundUnder, wallTile } from '../art/tiles.ts';
import { boxWallTile, decalSprite, outerWalls, rugColor, rugsFor, toyDecals } from '../art/room.ts';

export interface PropDraw {
  img: HTMLCanvasElement;
  x: number;
  y: number;
  /** 발 높이 (y 순서) */
  foot: number;
  /** 움직이는 건물 (분수 · 제단 · 귀환문) */
  anim?: { kind: Parameters<typeof structureSprite>[0]; w: number; h: number; ox: number; oy: number };
}

export interface MapLayer {
  ground: HTMLCanvasElement;
  props: PropDraw[];
  /** 물 칸 (반짝임) */
  water: { x: number; y: number }[];
}

const WALL = new Set(['C', 'R', 'M', 'E', 'Y', 'F', 'J', 'Z', 'I']);
const VOID_BG = hex('#120a22');

function tileOf(m: MapDef, tx: number, ty: number): string {
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return m.theme === 'rift' ? 'v' : 'X';
  return m.tiles[ty][tx];
}

/** 이미 그린 땅을 타원으로 어둡게 (그림자) */
function shadow(p: Pix, cx: number, cy: number, rx: number, ry: number, k = -0.28): void {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const c = p.get(x, y);
      if (c >= 0) p.set(x, y, shade(c, k));
    }
}

function voidTile(tx: number, ty: number, cliff: boolean, cliffColor: Color, space = true): Pix {
  const p = new Pix(TILE, TILE);
  p.rect(0, 0, TILE, TILE, space ? VOID_BG : hex('#0e0a0e'));
  // 방 안의 낭떠러지: 별 대신 저 아래 바닥이 어렴풋이
  if (!space) {
    for (let y = 10; y < TILE; y++) for (let x = 0; x < TILE; x++) if (hash2(x + tx * TILE, y + ty * TILE, 77) < 0.05) p.set(x, y, hex('#1c1418'));
  }
  for (let i = 0; i < (space ? 3 : 0); i++) {
    if (hash2(tx, ty, i + 40) < 0.45) continue;
    const x = Math.floor(hash2(tx + i, ty, 41) * TILE);
    const y = Math.floor(hash2(tx, ty + i, 42) * TILE);
    p.set(x, y, hash2(i, tx, ty) < 0.3 ? hex('#c8b0ff') : hex('#5a4890'));
  }
  if (cliff) {
    // 떠 있는 바닥의 옆면
    p.rect(0, 0, TILE, 9, shade(cliffColor, -0.35));
    for (let x = 0; x < TILE; x += 5) p.rect(x + (tx % 2) * 2, 0, 1, 9 - ((x + tx) % 3), shade(cliffColor, -0.55));
    p.rect(0, 0, TILE, 1, shade(cliffColor, 0.05));
    for (let x = 0; x < TILE; x++) if (hash2(x, tx, ty) < 0.35) p.set(x, 9, shade(cliffColor, -0.45));
  }
  return p;
}

const ROUNDED = new Set([':', '~', '%', 'q']);
const R = 7;

/** 길 · 물 · 광장의 바깥 모서리를 둥글게 깎고 가장자리를 조금 들쭉날쭉하게: 이웃 땅 그림으로 채운다 */
function roundCorners(p: Pix, g: string, tx: number, ty: number, under: (x: number, y: number) => string | null): void {
  if (!ROUNDED.has(g)) return;
  const x0 = tx * TILE;
  const y0 = ty * TILE;
  const other = (dx: number, dy: number) => {
    const o = under(tx + dx, ty + dy);
    if (o === null || o === g) return null;
    return ',g'.includes(o) ? '.' : o;
  };
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  for (const [dx, dy] of corners) {
    const a = other(dx, 0);
    const b = other(0, dy);
    if (!a || !b || a !== b) continue;
    const fill = groundTile(a, tx, ty);
    const cx = dx < 0 ? R : TILE - R;
    const cy = dy < 0 ? R : TILE - R;
    for (let y = 0; y < R; y++)
      for (let x = 0; x < R; x++) {
        const px = dx < 0 ? x : TILE - 1 - x;
        const py = dy < 0 ? y : TILE - 1 - y;
        if (Math.hypot(px + 0.5 - cx, py + 0.5 - cy) > R) p.set(x0 + px, y0 + py, fill.get(px, py));
      }
  }
  // 들쭉날쭉
  const sides: [number, number][] = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  for (const [dx, dy] of sides) {
    const o = other(dx, dy);
    if (!o || g === '#') continue;
    const fill = groundTile(o, tx, ty);
    for (let i = 0; i < TILE; i++) {
      const v = hash2(tx * 3 + i, ty * 5 + dx * 7 + dy * 11, 99);
      const d = v < 0.12 ? 2 : v < 0.45 ? 1 : 0;
      for (let k = 0; k < d; k++) {
        const px = dx === 0 ? i : dx < 0 ? k : TILE - 1 - k;
        const py = dy === 0 ? i : dy < 0 ? k : TILE - 1 - k;
        p.set(x0 + px, y0 + py, fill.get(px, py));
      }
    }
  }
}

const FLOOR_OF: Record<string, Color> = { r: hex('#4e3e72'), _: hex('#6a5e58'), p: hex('#f7b8d2'), q: hex('#e8c27c'), m: hex('#7a7e8a'), w: hex('#c08850'), a: hex('#b85a68'), d: hex('#8a5432'), u: hex('#5a5262'), b: hex('#c6d2d8'), n: hex('#c88a7a'), y: hex('#3a4a6a'), j: hex('#3c3f48'), s: hex('#d6bc84'), h: hex('#9c968a') };

export function buildMapLayer(m: MapDef): MapLayer {
  const W = m.w * TILE;
  const H = m.h * TILE;
  const p = new Pix(W, H);
  const water: { x: number; y: number }[] = [];
  const unders: string[][] = [];
  for (let ty = 0; ty < m.h; ty++) {
    unders.push([]);
    for (let tx = 0; tx < m.w; tx++) unders[ty].push(groundUnder(m.tiles[ty][tx], m.theme));
  }
  // 건물 자리 밑은 둘레에서 가장 많은 땅으로
  for (let ty = 0; ty < m.h; ty++)
    for (let tx = 0; tx < m.w; tx++) {
      if (m.tiles[ty][tx] !== 'H') continue;
      const count = new Map<string, number>();
      for (let r = 1; r <= 3; r++)
        for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
          const c = m.tiles[ty + dy]?.[tx + dx];
          if (c && '.,g:#_pqrm'.includes(c)) count.set(c, (count.get(c) ?? 0) + 1);
        }
      let best = unders[ty][tx];
      let bn = 0;
      for (const [c, n] of count) if (n > bn) [best, bn] = [c, n];
      unders[ty][tx] = ',g'.includes(best) ? '.' : best;
    }
  const under = (tx: number, ty: number) => (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h ? null : unders[ty][tx]);

  // 장난감 상자: 가장자리 블록은 상자의 나무 벽으로
  const box = m.theme === 'toybox' ? outerWalls(m) : new Set<number>();
  const isBox = (tx: number, ty: number) => tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || box.has(ty * m.w + tx);
  const blocked = (tx: number, ty: number) => isBox(tx, ty) || WALL.has(tileOf(m, tx, ty));
  for (let ty = 0; ty < m.h; ty++)
    for (let tx = 0; tx < m.w; tx++) {
      const c = m.tiles[ty][tx];
      const x0 = tx * TILE;
      const y0 = ty * TILE;
      if (box.has(ty * m.w + tx)) {
        const open = (dx: number, dy: number) => !isBox(tx + dx, ty + dy) && tileOf(m, tx + dx, ty + dy) !== 'Q';
        let edge = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!isBox(tx + dx, ty + dy)) edge = true;
        p.stamp(boxWallTile(tx, ty, !isBox(tx, ty + 1), { up: open(0, -1), left: open(-1, 0), right: open(1, 0) }, edge), x0, y0);
        continue;
      }
      if (WALL.has(c)) {
        p.stamp(wallTile(c, tx, ty, !WALL.has(tileOf(m, tx, ty + 1))), x0, y0);
        continue;
      }
      if (c === 'v') {
        const up = tileOf(m, tx, ty - 1);
        const cliff = up !== 'v' && !WALL.has(up);
        p.stamp(voidTile(tx, ty, cliff, FLOOR_OF[groundUnder(up, m.theme)] ?? FLOOR_OF[up] ?? FLOOR_OF.r, m.theme === 'rift'), x0, y0);
        continue;
      }
      const g = unders[ty][tx];
      p.stamp(groundTile(g, tx, ty), x0, y0);
      if (g === '~' || g === '%') water.push({ x: x0, y: y0 });
      roundCorners(p, g, tx, ty, under);
      const ec = g === '#' ? edgeColor(g) : null;
      if (ec !== null) {
        const n = (dx: number, dy: number) => {
          const o = under(tx + dx, ty + dy);
          return o !== null && o !== g;
        };
        if (n(0, -1)) p.rect(x0, y0, TILE, 1, ec);
        if (n(0, 1)) p.rect(x0, y0 + TILE - 1, TILE, 1, ec);
        if (n(-1, 0)) p.rect(x0, y0, 1, TILE, ec);
        if (n(1, 0)) p.rect(x0 + TILE - 1, y0, 1, TILE, ec);
      }
      // 벽 바로 아래 바닥은 그늘
      if (blocked(tx, ty - 1)) for (let y = 0; y < 4; y++) for (let x = 0; x < TILE; x++) p.set(x0 + x, y0 + y, shade(p.get(x0 + x, y0 + y), -0.3 + y * 0.07));
    }

  // 둥근 러그 · 흩어진 작은 물건 (바닥에만)
  const floorAt = (x: number, y: number) => {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return !blocked(tx, ty) && !isSolidTile(m.tiles[ty]?.[tx]);
  };
  for (const r of rugsFor(m))
    for (let y = Math.floor(r.cy - r.ry); y <= r.cy + r.ry; y++)
      for (let x = Math.floor(r.cx - r.rx); x <= r.cx + r.rx; x++) {
        if (!floorAt(x, y)) continue;
        const c = rugColor(r, x, y);
        if (c !== null) p.set(x, y, c);
      }
  for (const d of toyDecals(m)) {
    const s = decalSprite(d);
    shadow(p, d.x + 1, d.y + 2, s.w / 2 - 1, 2, -0.18);
    p.stamp(s, Math.round(d.x - s.w / 2), Math.round(d.y - s.h / 2));
  }

  // 소품 · 건물 (그림자는 땅에 굽는다)
  const props: PropDraw[] = [];
  for (let ty = 0; ty < m.h; ty++)
    for (let tx = 0; tx < m.w; tx++) {
      const c = m.tiles[ty][tx];
      if (box.has(ty * m.w + tx)) continue;
      const s = propSprite(c, tx, ty);
      if (!s) continue;
      const x = tx * TILE + s.ox;
      const y = ty * TILE + s.oy;
      if (c !== 'f') shadow(p, tx * TILE + TILE / 2 + 1, ty * TILE + TILE - 3, Math.min(13, s.pix.w / 2 - 1), 5);
      props.push({ img: pixCanvas(s.pix), x, y, foot: ty * TILE + TILE - 2 });
    }
  for (const st of m.structures) {
    // 마을 시설 · 고치는 생기거나 사라지므로 그림자도 굽지 않는다
    if (st.id?.startsWith('v_') || st.kind === 'cocoon') continue;
    const s = structureSprite(st.kind, st.w, st.h, 0);
    const x = st.x * TILE + s.ox;
    const y = st.y * TILE + s.oy;
    const foot = (st.y + st.h) * TILE - 2;
    const narrow = st.kind === 'lamp' || st.kind === 'board';
    if (st.kind !== 'portal') shadow(p, (st.x + st.w / 2) * TILE + (narrow ? 0 : 2), foot - 2, narrow ? 6 : (st.w * TILE) / 2 + 2, narrow ? 3 : 6, -0.25);
    // 고치 · 상자는 놀이 상태에 따라 바뀌므로 그때그때 그린다
    if (st.kind === 'chest') continue;
    const anim = st.kind === 'fountain' || st.kind === 'altar' || st.kind === 'portal' ? { kind: st.kind, w: st.w, h: st.h, ox: s.ox, oy: s.oy } : undefined;
    props.push({ img: pixCanvas(s.pix), x, y, foot, anim });
  }
  return { ground: pixCanvas(p), props, water };
}

/** 움직이는 건물의 지금 그림 */
export function animFrame(d: PropDraw, time: number): HTMLCanvasElement {
  if (!d.anim) return d.img;
  const frame = Math.floor(time * 5) % 4;
  return pixCanvas(structureSprite(d.anim.kind, d.anim.w, d.anim.h, frame).pix);
}
