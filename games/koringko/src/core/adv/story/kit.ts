/** 방 짓는 도구: 장난감 방은 글자 그림으로, 사람 크기 기억 방은 벽 · 바닥 · 가구 목록으로 */
import type { Theme } from '../../maps.ts';
import type { FreezeDef, Furniture, Pt, RoomDef, Thing } from '../types.ts';

export interface ToyOpts {
  name: string;
  theme: Theme;
  start: Pt;
  things: Thing[];
  music?: string;
  steps?: FreezeDef;
  beams?: RoomDef['beams'];
  lights?: RoomDef['lights'];
  ambient?: RoomDef['ambient'];
  rain?: boolean;
}

/** 글자 그림 → 장난감 방 (모든 줄 길이가 같아야 한다) */
export function toyRoom(id: string, rows: string[], o: ToyOpts): RoomDef {
  const w = rows[0].length;
  for (const [i, r] of rows.entries()) if (r.length !== w) throw new Error(`${id} ${i}번째 줄 길이 ${r.length} ≠ ${w}`);
  return {
    id,
    name: o.name,
    theme: o.theme,
    w,
    h: rows.length,
    tiles: rows,
    structures: [],
    warps: [],
    npcs: [],
    spawns: [],
    start: { x: o.start[0], y: o.start[1] },
    safe: true,
    dark: o.theme === 'cave',
    level: '',
    scale: 'toy',
    things: o.things,
    steps: o.steps,
    music: o.music,
    beams: o.beams,
    lights: o.lights,
    ambient: o.ambient,
    rain: o.rain,
  };
}

/** 가구 하나: 'kind:꾸밈' · 자리 · 크기 · 막힘 */
export type F = [kind: string, x: number, y: number, w: number, h: number, solid?: boolean];

/**
 * 사람 크기 방: 위 wallH 줄은 벽, 양옆 · 아래 한 줄도 벽. outdoor 면 벽 대신 덤불.
 * 막히는 가구는 발 자리를 'H' 로.
 */
export function house(id: string, look: string, w: number, h: number, furn: F[], o: { wallH?: number; things?: Thing[]; music?: string; start?: Pt; floor?: string; rain?: boolean } = {}): RoomDef {
  const wallH = o.wallH ?? 3;
  const t: string[][] = [];
  for (let y = 0; y < h; y++) {
    const row: string[] = [];
    for (let x = 0; x < w; x++) row.push(y < wallH || x === 0 || x === w - 1 || y === h - 1 ? 'W' : (o.floor ?? 'w'));
    t.push(row);
  }
  const furniture: Furniture[] = [];
  for (const [kind, x, y, fw, fh, solid] of furn) {
    furniture.push({ kind, x, y, w: fw, h: fh });
    if (solid) for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) if (t[yy]?.[xx] && t[yy][xx] !== 'W') t[yy][xx] = 'H';
  }
  return {
    id,
    name: id,
    theme: 'village',
    w,
    h,
    tiles: t.map((r) => r.join('')),
    structures: [],
    warps: [],
    npcs: [],
    spawns: [],
    start: { x: o.start?.[0] ?? Math.floor(w / 2), y: o.start?.[1] ?? h - 3 },
    safe: true,
    dark: false,
    level: '',
    scale: 'human',
    things: o.things ?? [],
    furniture,
    look,
    music: o.music,
    rain: o.rain,
  };
}

/** 바닥으로 채우고 가장자리를 벽으로 두른 뒤, [글자, x, y, 폭, 높이] 를 차례로 칠한 지도 */
export function grid(w: number, h: number, floor: string, wall: string, ops: [string, number, number, number, number][]): string[] {
  const t: string[][] = [];
  for (let y = 0; y < h; y++) {
    const r: string[] = [];
    for (let x = 0; x < w; x++) r.push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? wall : floor);
    t.push(r);
  }
  for (const [c, x, y, rw, rh] of ops) for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) if (t[yy]?.[xx] !== undefined) t[yy][xx] = c;
  return t.map((r) => r.join(''));
}
