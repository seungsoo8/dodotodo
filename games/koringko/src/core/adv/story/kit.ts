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

// ───────────────────────── houseMap: 여러 방 집 지도 (투더문 · RPG Maker 3/4 시점) ─────────────────────────
//
// 글자 (maps.ts · ENGINE0 §1):
//   W 뒷벽 앞면   X 벽 두께 (옆벽 · 칸막이 윗면 · 바깥 테두리)   D 문 자리   w 바닥
//   ^ 높은 바닥 (elev 1)   S 단 앞면   H 막힌 가구 발   U 가구 밑 (사람 막힘 · 장난감 지나감)
//
// 방 rect 는 그 방이 차지하는 칸 (뒷벽 W 줄 포함). 어느 방에도 속하지 않는 칸은 모두 X.
//   → 왼쪽 · 오른쪽 · 아래 가장자리 한 줄은 방을 두지 않아 X, 위쪽은 y=0 에서 시작하는 방의 뒷벽 W.
//   → 세로 칸막이 = 두 방 사이 X 열, 가로 칸막이 = 위 방 아래 X 줄 + 아래 방의 뒷벽 W 줄.

export type Rect4 = [x: number, y: number, w: number, h: number];

/** 지금(이삿날 밤)에만 · 옛날(기억)에만 놓이는 가구 표시 */
export type Era = 'now' | 'past';

/** 객체 꼴 가구 (Furniture + 막힘 · 시대) */
export interface HouseFurn {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 발 자리(w×h) 를 H 로 막음 */
  solid?: boolean;
  /** 인물 위 윗층 (막지 않음) */
  over?: boolean;
  /** 가구 밑: 그 칸이 U (사람 막힘 · 장난감 지나감) */
  under?: boolean;
  /** 앞쪽 가림막 (막지 않음) */
  fg?: boolean;
  /** 이 시대에만 놓임 (없으면 늘) */
  era?: Era;
}

export interface HouseRoomSpec {
  id: string;
  /** 방이 차지하는 칸 (뒷벽 줄 포함) */
  rect: Rect4;
  /** 이 방의 꾸밈 (벽지 · 바닥) */
  look: string;
  /** 뒷벽 앞면 W 줄 수 (기본 3) */
  wallH?: number;
  /** 높은 바닥 영역 (지도 좌표, 방 바닥 안) → ^ · 바로 아래 줄 S */
  raised?: Rect4[];
}

/** 문: 이웃한 두 방 사이 (at = 세로 칸막이면 줄 y, 가로 칸막이면 열 x, w = 폭) 또는 직접 뚫는 칸 */
export type HouseDoor = { between: [string, string]; at: number; w?: number } | { rect: Rect4 };

export interface HouseSpec {
  id: string;
  name?: string;
  w: number;
  h: number;
  rooms: HouseRoomSpec[];
  doors?: HouseDoor[];
  furniture: (F | HouseFurn)[];
  things?: Thing[];
  start?: Pt;
  music?: string;
  rain?: boolean;
  dark?: boolean;
  beams?: RoomDef['beams'];
  lights?: RoomDef['lights'];
  ambient?: RoomDef['ambient'];
}

const inRect = (r: Rect4, x: number, y: number): boolean => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];

/** 여러 방을 칸막이 · 문으로 이은 사람 크기 집 지도. era 기본 'now' */
export function houseMap(spec: HouseSpec, o: { era?: Era } = {}): RoomDef {
  const era = o.era ?? 'now';
  const { w, h, id } = spec;
  if (!spec.rooms.length) throw new Error(`${id}: 방이 없다`);
  const t: string[][] = Array.from({ length: h }, () => new Array<string>(w).fill('X'));
  const el: string[][] = Array.from({ length: h }, () => new Array<string>(w).fill('0'));
  const byId = new Map<string, HouseRoomSpec>();
  const wallOf = (r: HouseRoomSpec): number => r.wallH ?? 3;

  // 방: 뒷벽 W 줄 + 바닥
  for (const r of spec.rooms) {
    const [rx, ry, rw, rh] = r.rect;
    if (rx < 1 || ry < 0 || rx + rw > w - 1 || ry + rh > h - 1 || rw < 1 || rh < 1) throw new Error(`${id}/${r.id}: 방이 지도 가장자리(왼 · 오른 · 아래 X 한 줄)를 침범`);
    if (wallOf(r) < 0 || wallOf(r) >= rh) throw new Error(`${id}/${r.id}: 뒷벽 높이 ${wallOf(r)} 가 방 높이 ${rh} 이상`);
    for (const other of byId.values()) {
      const [ox, oy, ow, oh] = other.rect;
      if (rx < ox + ow && ox < rx + rw && ry < oy + oh && oy < ry + rh) throw new Error(`${id}: 방 ${r.id} 와 ${other.id} 가 겹친다`);
    }
    byId.set(r.id, r);
    for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) t[y][x] = y < ry + wallOf(r) ? 'W' : 'w';
  }

  // 높은 바닥: ^ (elev 1) + 바로 아래 줄 앞면 S (바닥 칸에만)
  for (const r of spec.rooms) {
    const floor: Rect4 = [r.rect[0], r.rect[1] + wallOf(r), r.rect[2], r.rect[3] - wallOf(r)];
    for (const a of r.raised ?? []) {
      const [ax, ay, aw, ah] = a;
      if (!inRect(floor, ax, ay) || !inRect(floor, ax + aw - 1, ay + ah - 1)) throw new Error(`${id}/${r.id}: 높은 바닥 [${a}] 이 방 바닥 밖`);
      for (let y = ay; y < ay + ah; y++) for (let x = ax; x < ax + aw; x++) {
        t[y][x] = '^';
        el[y][x] = '1';
      }
    }
    for (const [ax, ay, aw, ah] of r.raised ?? []) for (let x = ax; x < ax + aw; x++) if (t[ay + ah]?.[x] === 'w') t[ay + ah][x] = 'S';
  }

  // 문
  const room = (rid: string): HouseRoomSpec => {
    const r = byId.get(rid);
    if (!r) throw new Error(`${id}: 문이 가리키는 방 ${rid} 가 없다`);
    return r;
  };
  for (const d of spec.doors ?? []) {
    if ('rect' in d) {
      const [dx, dy, dw, dh] = d.rect;
      for (let y = dy; y < dy + dh; y++) for (let x = dx; x < dx + dw; x++) if (t[y]?.[x] !== undefined) t[y][x] = 'D';
      continue;
    }
    let a = room(d.between[0]);
    let b = room(d.between[1]);
    const dw = d.w ?? 1;
    const bad = (why: string): Error => new Error(`${id}: 문 ${a.id}-${b.id} @${d.at}: ${why}`);
    const [ax, ay, aw, ah] = a.rect;
    const [bx, by, bw, bh] = b.rect;
    if (ax + aw <= bx || bx + bw <= ax) {
      // 나란한 방 (세로 칸막이): 줄 at..at+dw-1 의 사이 열을 뚫음. 그 줄은 두 방 모두 바닥이어야 함
      if (bx + bw <= ax) [a, b] = [b, a];
      const lo = Math.max(a.rect[1] + wallOf(a), b.rect[1] + wallOf(b));
      const hi = Math.min(a.rect[1] + a.rect[3], b.rect[1] + b.rect[3]);
      if (d.at < lo || d.at + dw > hi) throw bad(`두 방 바닥이 함께 닿는 줄(${lo}~${hi - 1}) 밖`);
      for (let y = d.at; y < d.at + dw; y++) for (let x = a.rect[0] + a.rect[2]; x < b.rect[0]; x++) {
        if (t[y][x] !== 'X') throw bad(`칸막이 (${x},${y}) 가 벽 두께가 아님`);
        t[y][x] = 'D';
      }
    } else if (ay + ah <= by || by + bh <= ay) {
      // 위아래 방 (가로 칸막이): 열 at..at+dw-1 의 X 줄 + 아래 방 뒷벽 W 줄을 뚫음
      if (by + bh <= ay) [a, b] = [b, a];
      const lo = Math.max(a.rect[0], b.rect[0]);
      const hi = Math.min(a.rect[0] + a.rect[2], b.rect[0] + b.rect[2]);
      if (d.at < lo || d.at + dw > hi) throw bad(`두 방이 함께 닿는 열(${lo}~${hi - 1}) 밖`);
      for (let x = d.at; x < d.at + dw; x++) for (let y = a.rect[1] + a.rect[3]; y < b.rect[1] + wallOf(b); y++) {
        if (t[y][x] !== 'X' && t[y][x] !== 'W') throw bad(`칸막이 (${x},${y}) 가 벽이 아님`);
        t[y][x] = 'D';
      }
    } else throw bad('두 방이 이웃하지 않음');
  }

  // 가구: 이 시대 것만. solid → H, under → U (바닥 · 높은 바닥 칸에만)
  const furniture: Furniture[] = [];
  for (const f of spec.furniture) {
    const g: HouseFurn = Array.isArray(f) ? { kind: f[0], x: f[1], y: f[2], w: f[3], h: f[4], solid: f[5] } : f;
    if (g.era && g.era !== era) continue;
    const out: Furniture = { kind: g.kind, x: g.x, y: g.y, w: g.w, h: g.h };
    if (g.over) out.over = true;
    if (g.under) out.under = true;
    if (g.fg) out.fg = true;
    furniture.push(out);
    const mark = g.under ? 'U' : g.solid ? 'H' : null;
    if (!mark) continue;
    for (let y = g.y; y < g.y + g.h; y++) for (let x = g.x; x < g.x + g.w; x++) if (t[y]?.[x] === 'w' || t[y]?.[x] === '^') t[y][x] = mark;
  }

  const first = spec.rooms[0];
  const start = spec.start ?? [first.rect[0] + Math.floor(first.rect[2] / 2), first.rect[1] + first.rect[3] - 2];
  return {
    id,
    name: spec.name ?? id,
    theme: 'village',
    w,
    h,
    tiles: t.map((r) => r.join('')),
    structures: [],
    warps: [],
    npcs: [],
    spawns: [],
    start: { x: start[0], y: start[1] },
    safe: true,
    dark: spec.dark ?? false,
    level: '',
    scale: 'human',
    things: spec.things ?? [],
    furniture,
    look: first.look,
    looks: spec.rooms.map((r) => ({ rect: [...r.rect] as Rect4, look: r.look })),
    elev: el.map((r) => r.join('')),
    music: spec.music,
    rain: spec.rain,
    beams: spec.beams,
    lights: spec.lights,
    ambient: spec.ambient,
  };
}
