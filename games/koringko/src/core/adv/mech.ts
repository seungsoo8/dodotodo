/**
 * 놀이 규칙의 순수 계산 (칸 단위, 무대 · 대본과 무관): 지켜보는 이의 시야, 손거울 빛줄기,
 * 젖은 타일 미끄럼, 톱니 전달, 물길, 음 발판 효과음. adv.ts 가 이것으로 놀이를 돌리고, 그림(render)도 같은 값을 그린다.
 */
import type { Dir4, Pt } from './types.ts';

const k = (x: number, y: number) => `${x},${y}`;

export const DIR4_VEC: Record<Dir4, readonly [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE: Record<Dir4, Dir4> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** 방향 벡터 → 네 방향 (긴 축 쪽, 0 이면 null) */
export function dir4Of(dx: number, dy: number): Dir4 | null {
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return null;
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

/** 칸 가운데 a → b 를 잇는 선이 지나는 칸 (두 끝 칸 제외). 모서리를 정확히 스치는 것은 지나지 않은 것으로 */
function lineCells(ax: number, ay: number, bx: number, by: number): Pt[] {
  const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 4) * 2);
  const out: Pt[] = [];
  const seen = new Set<string>();
  const [sx, sy] = [Math.floor(ax), Math.floor(ay)];
  const [ex, ey] = [Math.floor(bx), Math.floor(by)];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = Math.floor(ax + (bx - ax) * t);
    const y = Math.floor(ay + (by - ay) * t);
    if ((x === sx && y === sy) || (x === ex && y === ey)) continue;
    const id = k(x, y);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push([x, y]);
  }
  return out;
}

/**
 * 지켜보는 이의 시야 칸 ('x,y'): from 칸 가운데에서 dir 쪽으로 반지름 r 칸 · 반각 arc 도 (180 이상이면 둘레 원).
 * blocks 칸(벽 · 가구 · 밀어 둔 상자 · 가구 밑)은 그 뒤를 가리고, 그 칸 자체도 보이는 칸이 아니다.
 */
export function sightCells(from: Pt, dir: Dir4, r: number, arc: number, blocks: (x: number, y: number) => boolean, w: number, h: number): Set<string> {
  const out = new Set<string>();
  if (r <= 0) return out;
  const [fx, fy] = [from[0] + 0.5, from[1] + 0.5];
  const [vx, vy] = DIR4_VEC[dir];
  const cosArc = Math.cos((Math.min(arc, 180) * Math.PI) / 180);
  const R = Math.ceil(r);
  for (let y = Math.max(0, from[1] - R); y <= Math.min(h - 1, from[1] + R); y++)
    for (let x = Math.max(0, from[0] - R); x <= Math.min(w - 1, from[0] + R); x++) {
      if (x === from[0] && y === from[1]) continue;
      const dx = x + 0.5 - fx;
      const dy = y + 0.5 - fy;
      const d = Math.hypot(dx, dy);
      if (d > r + 1e-6) continue;
      if (arc < 180 && (dx * vx + dy * vy) / d < cosArc - 1e-9) continue;
      if (blocks(x, y)) continue;
      if (lineCells(fx, fy, x + 0.5, y + 0.5).some(([qx, qy]) => blocks(qx, qy))) continue;
      out.add(k(x, y));
    }
  return out;
}

/**
 * 손거울: 비추는 두 면. 0 위↔오른쪽 · 1 오른쪽↔아래 · 2 아래↔왼쪽 · 3 왼쪽↔위 (살펴볼 때마다 0→1→2→3→0).
 * travel 쪽으로 가던 빛이 거울에 닿아 나가는 쪽 (뒷면이면 null = 막힘).
 */
const MIRROR_SIDES: readonly (readonly [Dir4, Dir4])[] = [['up', 'right'], ['right', 'down'], ['down', 'left'], ['left', 'up']];
export function mirrorTurn(face: number, travel: Dir4): Dir4 | null {
  const sides = MIRROR_SIDES[((face % 4) + 4) % 4];
  const entry = OPPOSITE[travel];
  if (entry === sides[0]) return sides[1];
  if (entry === sides[1]) return sides[0];
  return null;
}

/**
 * 빛줄기: start 칸에서 dir 로 곧게, 거울에서 꺾이고, opaque 칸 앞이나 지도 끝에서 멈춘다.
 * cells 는 빛이 지난 칸 (시작 칸 포함), hit 은 target 칸에 닿았나 (막힌 칸이어도 과녁이면 닿음).
 */
export function traceBeam(start: Pt, dir: Dir4, mirrorAt: (x: number, y: number) => number | null, opaque: (x: number, y: number) => boolean, target: Pt, w: number, h: number): { cells: Pt[]; hit: boolean } {
  const cells: Pt[] = [[start[0], start[1]]];
  const seen = new Set<string>();
  let [x, y] = start;
  let d: Dir4 = dir;
  for (let guard = 0; guard < w * h * 4 + 4; guard++) {
    const [vx, vy] = DIR4_VEC[d];
    const nx = x + vx;
    const ny = y + vy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) return { cells, hit: false };
    if (nx === target[0] && ny === target[1]) {
      cells.push([nx, ny]);
      return { cells, hit: true };
    }
    if (opaque(nx, ny)) return { cells, hit: false };
    const state = `${nx},${ny},${d}`;
    if (seen.has(state)) return { cells, hit: false };
    seen.add(state);
    cells.push([nx, ny]);
    x = nx;
    y = ny;
    const face = mirrorAt(x, y);
    if (face !== null) {
      const out = mirrorTurn(face, d);
      if (!out) return { cells, hit: false };
      d = out;
    }
  }
  return { cells, hit: false };
}

/** 젖은 타일: from 에서 d 쪽으로 미끄러져 멈추는 칸 (앞이 막히면 그 앞, 마른 칸에 닿으면 그 칸) */
export function slideDest(from: Pt, d: readonly [number, number], slip: (x: number, y: number) => boolean, free: (x: number, y: number) => boolean): Pt {
  let [x, y] = from;
  for (let guard = 0; guard < 1000; guard++) {
    const nx = x + d[0];
    const ny = y + d[1];
    if (!free(nx, ny)) break;
    x = nx;
    y = ny;
    if (!slip(x, y)) break;
  }
  return [x, y];
}

/**
 * 톱니: source 톱니가 시계 방향(+1)으로 돌 때, 네 방향으로 맞닿은 톱니(gears)로 번갈아 전해진 회전 ('x,y' → +1 · -1).
 * jam(녹슨 톱니)이 이어진 무리에 있으면 모두 멈춘다.
 */
export function gearSpin(source: Pt, gears: readonly Pt[], jam: readonly Pt[]): { spin: Map<string, number>; jammed: boolean } {
  const all = new Set<string>([k(source[0], source[1]), ...gears.map(([x, y]) => k(x, y))]);
  const stuck = new Set(jam.map(([x, y]) => k(x, y)));
  const spin = new Map<string, number>([[k(source[0], source[1]), 1]]);
  const q: [number, number, number][] = [[source[0], source[1], 1]];
  while (q.length) {
    const [x, y, s] = q.shift()!;
    for (const [dx, dy] of Object.values(DIR4_VEC)) {
      const id = k(x + dx, y + dy);
      if (stuck.has(id)) return { spin: new Map(), jammed: true };
      if (!all.has(id) || spin.has(id)) continue;
      spin.set(id, -s);
      q.push([x + dx, y + dy, -s]);
    }
  }
  return { spin, jammed: false };
}

/** 물길: source 에서 channel 칸('x,y')을 따라 네 방향으로 퍼지는 물 (blocked 칸 · 물길 밖으로는 안 감) */
export function flowCells(source: Pt, channel: ReadonlySet<string>, blocked: (x: number, y: number) => boolean): Set<string> {
  const wet = new Set<string>();
  if (blocked(source[0], source[1])) return wet;
  wet.add(k(source[0], source[1]));
  const q: Pt[] = [source];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of Object.values(DIR4_VEC)) {
      const nx = x + dx;
      const ny = y + dy;
      const id = k(nx, ny);
      if (wet.has(id) || !channel.has(id) || blocked(nx, ny)) continue;
      wet.add(id);
      q.push([nx, ny]);
    }
  }
  return wet;
}

/** 음 발판 (seq 의 note): 음 이름 → 효과음 이름 */
export const NOTE_SFX: Readonly<Record<string, string>> = {
  도: 'noteDo',
  레: 'noteRe',
  미: 'noteMi',
  파: 'noteFa',
  솔: 'noteSol',
  라: 'noteLa',
  시: 'noteSi',
  높은도: 'noteDo2',
};

export function noteSfx(note: string): string | null {
  return NOTE_SFX[note] ?? null;
}

/** 칸 영역들 [x, y, w, h] 에 든 칸 ('x,y') */
export function rectCells(rects: readonly (readonly [number, number, number, number])[]): Set<string> {
  const out = new Set<string>();
  for (const [x, y, w, h] of rects) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.add(k(x + i, y + j));
  return out;
}

export function inRect(r: readonly [number, number, number, number], x: number, y: number): boolean {
  return x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
}
