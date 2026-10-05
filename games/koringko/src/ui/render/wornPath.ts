/**
 * 사람이 다니던 자리 (REDESIGN 3-2-3): 출발점에서 문 · 물건까지 가장 짧은 길을 BFS 나무로 이어,
 * 그 칸들의 마루를 조금 덜 바래게(밝게) 굽는다. 길이 바닥 색으로 읽힌다. 화면과 무관.
 */
import { isSolidChar } from '../../core/maps.ts';

interface Grid {
  tiles: readonly string[];
  w: number;
  h: number;
}

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** 다니던 칸들 ("x,y"). 목적지가 막힌 칸이면 그 옆 칸까지 */
export function wornCells(m: Grid, from: readonly [number, number], to: readonly (readonly [number, number])[]): Set<string> {
  const out = new Set<string>();
  if (!to.length) return out;
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && !isSolidChar(m.tiles[y]?.[x]);
  if (!open(from[0], from[1])) return out;
  const parent = new Map<string, string | null>();
  const key = (x: number, y: number) => `${x},${y}`;
  parent.set(key(from[0], from[1]), null);
  const q: [number, number][] = [[from[0], from[1]]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (parent.has(k) || !open(nx, ny)) continue;
      parent.set(k, key(x, y));
      q.push([nx, ny]);
    }
  }
  for (const [tx, ty] of to) {
    let end: string | null = null;
    if (parent.has(key(tx, ty))) end = key(tx, ty);
    else
      for (const [dx, dy] of DIRS)
        if (parent.has(key(tx + dx, ty + dy))) {
          end = key(tx + dx, ty + dy);
          break;
        }
    for (let k = end; k !== null; k = parent.get(k) ?? null) {
      if (out.has(k)) break;
      out.add(k);
    }
  }
  return out;
}
