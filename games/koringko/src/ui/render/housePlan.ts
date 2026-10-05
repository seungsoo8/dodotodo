/**
 * 사람 크기 방을 층으로 미리 그린다 (E2 · E3 · E7 · E9). 캔버스 없이 도트 버퍼만 써서 시험할 수 있다.
 *  - back : 바닥 · 뒷벽 앞면(W) · 벽 두께(X) · 문 자리(D) · 단(S · ^) · 가구 밑(U) · 바닥에 까는 것 · 벽 붙박이, 그림자 · AO 를 구워 넣음
 *  - props: 가구 아랫부분 (발 정렬)   - tops: 키 큰 가구 윗부분 (인물 다음)
 *  - over : 문 인방 · Furniture.over (윗층)   - fg: Furniture.fg (앞쪽 가림막)
 */
import type { Furniture, RoomDef } from '../../core/adv/types.ts';
import { TILE } from '../../core/maps.ts';
import { eaveTile, FLAT, floorTile, furnitureSprite, lookOf, stepTile, thicknessTile, wallCap, wallFaceTile, type FurnSprite, type HouseLook } from '../art/house.ts';
import { CLEAR, Pix, hex, shade } from '../art/paint.ts';
import type { Beam, Cone, Light, Pool, RGB } from './light.ts';
import { MOVE_LIVE } from '../art/moveProps.ts';
import { wornCells } from './wornPath.ts';
import * as HX from '../art/px/houseTiles.ts';
import { paintTiled } from '../art/px/slice.ts';

/**
 * 움직이는 부분 (render 가 매 프레임 덧그린다, 세계 px):
 *  - pendulum: 매단 점 (x, y) · 길이 len · 추 반지름 r      - hands: 시계판 가운데 (x, y) · 반지름 r (장의 시각)
 *  - pane: 창유리 (x, y, w, h) · 창밖 sky (빗줄기 · 눈 · 구름)  - curtain: 커튼 자락 (x, y, w, h) · side
 *  - drip: 수도꼭지 끝 (x, y) 에서 len 아래 물에 떨어지는 물방울
 */
export interface LivePart {
  kind: 'pendulum' | 'hands' | 'pane' | 'curtain' | 'drip';
  x: number;
  y: number;
  w?: number;
  h?: number;
  len?: number;
  r?: number;
  sky?: string;
  side?: 'l' | 'r';
  /** 커튼 천 색 (0xRRGGBB) */
  color?: number;
}

/** 그림에서 추 · 바늘을 빼고 render 가 움직여 그리는 가구 */
const LIVE_KINDS = new Set(['cuckoo', 'clock', 'grandClock']);

/** 움직이는 가구면 꾸밈에 live 를 붙인다 (그림이 추 · 바늘을 그리지 않게) */
export function liveOpt(kind: string, opt: string): string {
  if (!LIVE_KINDS.has(kind) || /\blive\b/.test(opt)) return opt;
  return opt ? `${opt},live` : 'live';
}

/** 가구 하나의 움직이는 부분 (그림 왼쪽 위 x, y · 그림 크기 pw × ph) */
export function livePartsOf(kind: string, opt: string, x: number, y: number, pw: number, ph: number, sky: string, accent = 0xc8a0b8): LivePart[] {
  switch (kind) {
    case 'cuckoo': {
      const cx = x + Math.floor(pw / 2);
      return [
        { kind: 'pendulum', x: cx, y: y + 28, len: 10, r: 2.5 },
        { kind: 'hands', x: cx, y: y + 23, r: 4 },
      ];
    }
    case 'clock':
      return [{ kind: 'hands', x: x + pw / 2, y: y + ph / 2, r: Math.max(3, Math.min(pw, ph) / 2 - 4) }];
    case 'grandClock': {
      const L = MOVE_LIVE.grandClock;
      return [
        { kind: 'pendulum', x: x + L.pendulum!.x, y: y + L.pendulum!.y, len: L.pendulum!.len, r: L.pendulum!.r },
        { kind: 'hands', x: x + L.face!.x, y: y + L.face!.y, r: L.face!.r },
      ];
    }
    case 'window':
      return [
        { kind: 'pane', x: x + 3, y: y + 3, w: pw - 6, h: ph - 6, sky: opt.split(',')[0] || sky },
        { kind: 'curtain', x, y, w: 6, h: ph, side: 'l', color: shade(accent, -0.1) },
        { kind: 'curtain', x: x + pw - 6, y, w: 6, h: ph, side: 'r', color: shade(accent, -0.1) },
      ];
    case 'sink':
      return [{ kind: 'drip', x: x + Math.floor(pw / 2), y: y + 16, len: 5 }];
    case 'bathtub':
      return [{ kind: 'drip', x: x + pw - 8, y: y + 6, len: 4 }];
    default:
      return [];
  }
}

export type CellKind = 'front' | 'thick' | 'door' | 'step' | 'high' | 'under' | 'floor';

export interface Cell {
  kind: CellKind;
  look: HouseLook;
  /** 뒷벽 앞면: 위에서부터 몇 번째 줄 · 벽 줄 수 */
  row: number;
  rows: number;
}

export type PlanLayer = 'props' | 'top' | 'over' | 'fg';

export interface PlanSprite {
  pix: Pix;
  x: number;
  y: number;
  /** 발 높이 (앞뒤 정렬) */
  foot: number;
  kind: string;
  f?: Furniture;
}

export interface HousePlan {
  back: Pix;
  props: PlanSprite[];
  tops: PlanSprite[];
  over: PlanSprite[];
  fg: PlanSprite[];
  lights: Light[];
  beams: Beam[];
  pools: Pool[];
  cones: Cone[];
  ambient: RGB;
  live: LivePart[];
}

const WALL = new Set(['W', 'X']);

const inRect = (r: readonly [number, number, number, number], x: number, y: number) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];

/** 칸이 속한 방의 꾸밈 (방 rect 밖 칸막이는 이웃한 방의 꾸밈) */
export function lookIdAt(r: RoomDef, x: number, y: number): string | undefined {
  const looks = r.looks ?? [];
  const find = (xx: number, yy: number) => {
    let id: string | undefined;
    for (const l of looks) if (inRect(l.rect, xx, yy)) id = l.look;
    return id;
  };
  return find(x, y) ?? find(x + 1, y) ?? find(x - 1, y) ?? find(x, y - 1) ?? find(x, y + 1) ?? r.look;
}

/** 칸 종류: W 는 아래로 이어진 벽 줄이 바닥에서 끝나면 뒷벽 앞면, 아니면(옆 · 아래 테두리) 벽 두께 */
export function houseCells(r: RoomDef): Cell[][] {
  const at = (x: number, y: number) => r.tiles[y]?.[x];
  const out: Cell[][] = [];
  for (let y = 0; y < r.h; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < r.w; x++) {
      const c = at(x, y);
      const look = lookOf(lookIdAt(r, x, y));
      let kind: CellKind = 'floor';
      let wr = 0;
      let wn = 0;
      if (c === 'W') {
        let y1 = y;
        while (at(x, y1 - 1) === 'W') y1--;
        let y2 = y;
        while (at(x, y2) === 'W') y2++;
        const below = at(x, y2);
        if (below !== undefined && !WALL.has(below)) {
          kind = 'front';
          wr = y - y1;
          wn = y2 - y1;
        } else kind = 'thick';
      } else if (c === 'X') kind = 'thick';
      else if (c === 'D') kind = 'door';
      else if (c === 'S') kind = 'step';
      else if (c === '^') kind = 'high';
      else if (c === 'U') kind = 'under';
      row.push({ kind, look, row: wr, rows: wn });
    }
    out.push(row);
  }
  return out;
}

const SKY_AMBIENT: Record<string, RGB> = { day: [255, 250, 242], dusk: [255, 222, 196], rain: [206, 210, 222], night: [118, 116, 168] };

/** 벽 붙박이지만 앞으로 솟아 인물과 앞뒤를 가리는 것 */
const STANDING_WALL = new Set(['shelf', 'wardrobe', 'tv']);

/** 가구 그림자 (E7): 오른쪽 아래로 높이의 1/3 만큼 기울어진 평행사변형 (18% 어둡게) + 바닥에 닿는 2px 접지 선 */
export function castShadow(back: Pix, s: FurnSprite, x: number, y: number, floorAt: (px: number, py: number) => boolean, mask: Uint8Array): void {
  const p = s.base;
  // 바닥에 닿는 줄의 폭: 아래 4줄에서 그려진 칸
  let x0 = Infinity;
  let x1 = -Infinity;
  for (let yy = Math.max(0, p.h - 4); yy < p.h; yy++)
    for (let xx = 0; xx < p.w; xx++)
      if (p.get(xx, yy) !== CLEAR) {
        x0 = Math.min(x0, xx);
        x1 = Math.max(x1, xx);
      }
  if (x0 > x1) return;
  x0 += x;
  x1 += x;
  const bottom = y + p.h;
  const L = Math.max(3, Math.min(32, Math.round(s.height / 3)));
  const up = Math.min(Math.round(L * 0.4), 20);
  const down = Math.max(6, Math.round(L * 0.6));
  const ya = bottom - 3 - up;
  const yb = bottom - 3 + down;
  const dark = (px: number, py: number, k: number, bit: number) => {
    if (px < 0 || py < 0 || px >= back.w || py >= back.h || !floorAt(px, py)) return;
    const i = py * back.w + px;
    if (mask[i] & bit) return;
    mask[i] |= bit;
    back.px[i] = shade(back.px[i], k);
  };
  for (let yy = ya; yy <= yb; yy++) {
    const sh = Math.round((L * (yy - ya)) / (yb - ya));
    for (let xx = x0 + 2 + sh; xx <= x1 + sh; xx++) dark(xx, yy, -0.18, 1);
  }
  for (let yy = bottom - 1; yy <= bottom; yy++) for (let xx = x0 + 1; xx < x1; xx++) dark(xx, yy, -0.32, 2);
}

/** 바닥 칸 그늘 (AO): 뒷벽 아래 8px, 옆벽 · 위 두께 옆 4px */
function ambientOcclusion(back: Pix, cells: Cell[][], tx: number, ty: number): void {
  const k = (dx: number, dy: number) => cells[ty + dy]?.[tx + dx]?.kind;
  const x0 = tx * TILE;
  const y0 = ty * TILE;
  const dk = (x: number, y: number, v: number) => back.set(x0 + x, y0 + y, shade(back.get(x0 + x, y0 + y), v));
  if (k(0, -1) === 'front') for (let y = 0; y < 8; y++) for (let x = 0; x < TILE; x++) dk(x, y, -0.34 + y * 0.042);
  else if (k(0, -1) === 'thick') for (let y = 0; y < 4; y++) for (let x = 0; x < TILE; x++) dk(x, y, -0.24 + y * 0.06);
  if (k(-1, 0) === 'thick' || k(-1, 0) === 'front') for (let x = 0; x < 4; x++) for (let y = 0; y < TILE; y++) dk(x, y, -0.22 + x * 0.055);
  if (k(1, 0) === 'thick' || k(1, 0) === 'front') for (let x = 0; x < 4; x++) for (let y = 0; y < TILE; y++) dk(TILE - 1 - x, y, -0.22 + x * 0.055);
}

const POST = hex('#8a5a34');

/** 다락 낮은 구석의 깊이 (지도 가장자리에서 4칸 안에 방이 시작하는 줄의 양옆 두께 칸만) */
const EAVE_MAX = 4;
export function eaveAt(cells: Cell[][], tx: number, ty: number): { side: 'l' | 'r'; d: number; n: number } | null {
  const row = cells[ty];
  if (!row) return null;
  const solid = (k: CellKind) => k === 'thick';
  let first = -1;
  let last = -1;
  for (let x = 0; x < row.length; x++)
    if (!solid(row[x].kind)) {
      if (first < 0) first = x;
      last = x;
    }
  if (first < 0) return null;
  if (tx < first && first <= EAVE_MAX) return { side: 'l', d: first - 1 - tx, n: first };
  const rn = row.length - 1 - last;
  if (tx > last && rn <= EAVE_MAX) return { side: 'r', d: tx - last - 1, n: rn };
  return null;
}

/** 바닥 · 벽 칸을 back 에 */
function paintCells(back: Pix, cells: Cell[][], over: PlanSprite[]): void {
  const H = cells.length;
  const W = cells[0]?.length ?? 0;
  const kind = (x: number, y: number) => cells[y]?.[x]?.kind;
  const isWall = (x: number, y: number) => {
    const k = kind(x, y);
    return k === 'thick' || k === 'front';
  };
  for (let ty = 0; ty < H; ty++)
    for (let tx = 0; tx < W; tx++) {
      const c = cells[ty][tx];
      const L = c.look;
      const x0 = tx * TILE;
      const y0 = ty * TILE;
      switch (c.kind) {
        case 'front':
          back.stamp(wallFaceTile(L, tx, ty, c.row, c.rows), x0, y0);
          break;
        case 'thick': {
          const eave = L.eaves ? eaveAt(cells, tx, ty) : null;
          if (eave) {
            back.stamp(eaveTile(L, tx, ty, eave.side, eave.d, eave.n), x0, y0);
            break;
          }
          const open = (dx: number, dy: number) => {
            const k = kind(tx + dx, ty + dy);
            return k !== undefined && k !== 'thick';
          };
          back.stamp(thicknessTile(L, tx, ty, { u: open(0, -1), d: open(0, 1), l: open(-1, 0), r: open(1, 0), ul: open(-1, -1), ur: open(1, -1), dl: open(-1, 1), dr: open(1, 1) }), x0, y0);
          break;
        }
        case 'step': {
          const hi = cells[ty - 1]?.[tx]?.look ?? L;
          back.stamp(stepTile(hi, L, tx, ty, kind(tx - 1, ty) !== 'step', kind(tx + 1, ty) !== 'step'), x0, y0);
          break;
        }
        case 'high': {
          const t = floorTile(L, tx, ty);
          for (let i = 0; i < t.px.length; i++) t.px[i] = shade(t.px[i], 0.07);
          const lowL = kind(tx - 1, ty) !== 'high' && kind(tx - 1, ty) !== 'step' && !isWall(tx - 1, ty);
          const lowR = kind(tx + 1, ty) !== 'high' && kind(tx + 1, ty) !== 'step' && !isWall(tx + 1, ty);
          if (lowL) t.rect(0, 0, 1, TILE, shade(L.floor, -0.45));
          if (lowR) t.rect(TILE - 1, 0, 1, TILE, shade(L.floor, -0.45));
          back.stamp(t, x0, y0);
          break;
        }
        case 'under': {
          const t = floorTile(L, tx, ty);
          for (let i = 0; i < t.px.length; i++) t.px[i] = shade(t.px[i], -0.25);
          back.stamp(t, x0, y0);
          break;
        }
        case 'door': {
          back.stamp(floorTile(L, tx, ty), x0, y0);
          // 문틀 기둥 (옆이 벽이면, 격자 DOOR_POST) · 인방 (위가 벽이면, 격자 LINTEL: 벽 윗면 + 나무 들보, 윗층)
          const pp = HX.postPal(POST, wallCap(L));
          if (isWall(tx - 1, ty)) paintTiled(back, HX.DOOR_POST, pp, x0, y0, 3, TILE);
          if (isWall(tx + 1, ty)) paintTiled(back, HX.DOOR_POST, pp, x0 + TILE - 3, y0, 3, TILE);
          if (isWall(tx, ty - 1) || ty === 0) {
            const lin = new Pix(TILE + 4, HX.LINTEL.length);
            paintTiled(lin, HX.LINTEL, pp, 0, 0, TILE + 4, HX.LINTEL.length);
            over.push({ pix: lin, x: x0 - 2, y: y0 - 3, foot: y0, kind: 'lintel' });
          }
          break;
        }
        default:
          back.stamp(floorTile(L, tx, ty), x0, y0);
      }
    }
  for (let ty = 0; ty < H; ty++)
    for (let tx = 0; tx < W; tx++) {
      const k = cells[ty][tx].kind;
      if (k !== 'front' && k !== 'thick') ambientOcclusion(back, cells, tx, ty);
    }
}

export interface FurnitureLayers {
  props: PlanSprite[];
  tops: PlanSprite[];
  over: PlanSprite[];
  fg: PlanSprite[];
  /** 움직이는 부분 (추 · 바늘 · 창유리 · 커튼 · 물방울) */
  live?: LivePart[];
}

/** 바닥 그늘 굽기: mask 의 칠한 칸 자리 바닥만 어둡게 */
function darkenGround(back: Pix, mask: Pix, x: number, y: number, floorAt: (px: number, py: number) => boolean): void {
  for (let yy = 0; yy < mask.h; yy++)
    for (let xx = 0; xx < mask.w; xx++) {
      const c = mask.get(xx, yy);
      const X = x + xx;
      const Y = y + yy;
      if (c === CLEAR || X < 0 || Y < 0 || X >= back.w || Y >= back.h || !floorAt(X, Y)) continue;
      // 칠한 색의 파랑 값 = 어둡게 하는 세기 (0..255 → 0..0.4)
      back.px[Y * back.w + X] = shade(back.px[Y * back.w + X], -((c & 255) / 255) * 0.4);
    }
}

/** 벽 · 바닥 밝히기: mask 의 칠한 칸 자리를 밝게 (파랑 값 0..255 → 0..0.4) — 떼어 낸 액자 자국 */
export function lightenBack(back: Pix, mask: Pix, x: number, y: number): void {
  for (let yy = 0; yy < mask.h; yy++)
    for (let xx = 0; xx < mask.w; xx++) {
      const c = mask.get(xx, yy);
      const X = x + xx;
      const Y = y + yy;
      if (c === CLEAR || X < 0 || Y < 0 || X >= back.w || Y >= back.h) continue;
      const i = Y * back.w + X;
      if (back.px[i] === CLEAR) continue;
      back.px[i] = shade(back.px[i], ((c & 255) / 255) * 0.4);
    }
}

/**
 * 가구를 층으로 나눠 놓고 그림자를 back 에 굽는다 (사람 크기 · 장난감 크기 방 공용).
 * floorAt: 그림자가 떨어질 수 있는 바닥 픽셀인가, lookFor: 가구의 꾸밈.
 */
export function placeFurniture(furniture: Furniture[], back: Pix, floorAt: (x: number, y: number) => boolean, lookFor: (f: Furniture) => HouseLook, onEach?: (f: Furniture, s: FurnSprite, L: HouseLook) => void): FurnitureLayers {
  const out: FurnitureLayers = { props: [], tops: [], over: [], fg: [], live: [] };
  const later: (() => void)[] = [];
  const mask = new Uint8Array(back.w * back.h);
  for (const f of furniture) {
    const [kind, opt0] = f.kind.split(':');
    const opt = liveOpt(kind, opt0 ?? '');
    const L = lookFor(f);
    const s = furnitureSprite(kind, f.w, f.h, L, opt);
    const x = f.x * TILE + s.ox;
    const y = (f.y + f.h) * TILE + s.oy;
    if (!f.fg) out.live!.push(...livePartsOf(kind, opt0 ?? '', x, y, s.pix.w, s.pix.h, L.sky, L.accent));
    const foot = (f.y + f.h) * TILE - 2;
    onEach?.(f, s, L);
    if (s.ground) darkenGround(back, s.ground.pix, f.x * TILE + s.ground.ox, (f.y + f.h) * TILE + s.ground.oy, floorAt);
    if (s.lighten) later.unshift(() => lightenBack(back, s.lighten!.pix, f.x * TILE + s.lighten!.ox, (f.y + f.h) * TILE + s.lighten!.oy));
    if (f.fg) out.fg.push({ pix: s.pix, x, y, foot, kind, f });
    else if (f.over) out.over.push({ pix: s.pix, x, y, foot, kind, f });
    else if (FLAT.has(kind)) back.stamp(s.pix, x, y);
    else if (s.wall && !STANDING_WALL.has(kind)) later.push(() => back.stamp(s.pix, x, y));
    else {
      castShadow(back, s, x, y, floorAt, mask);
      out.props.push({ pix: s.base, x, y, foot, kind, f });
      // 열린 상자처럼 안에 인물이 서는 가구: 뒷부분은 맨 뒷줄 인물보다 먼저
      if (s.behind) out.props.push({ pix: s.behind, x, y, foot: f.y * TILE - 1, kind, f });
      if (s.top) out.tops.push({ pix: s.top, x, y, foot, kind, f });
    }
  }
  for (const l of later) l();
  return out;
}

/** 마루 길이 덜 바랜다: 출발점 → 문 · 살펴볼 물건까지 다니던 칸을 조금 밝게, 가장자리는 디더로 흐리게 (실내 바닥만) */
const WORN_FLOORS = new Set(['wood', 'lino', 'tile']);
export function bakeWorn(back: Pix, r: RoomDef, cells: Cell[][]): void {
  const doors: [number, number][] = [];
  for (let y = 0; y < cells.length; y++) for (let x = 0; x < cells[y].length; x++) if (cells[y][x].kind === 'door') doors.push([x, y]);
  const spots = r.things.flatMap((t) => ('at' in t && (t.kind === 'keepsake' || t.kind === 'spot' || t.kind === 'npc' || t.kind === 'link' || t.kind === 'memory') ? [t.at] : []));
  const worn = wornCells(r, [Math.floor(r.start.x), Math.floor(r.start.y)], [...doors, ...spots]);
  const on = (x: number, y: number) => worn.has(`${x},${y}`);
  for (const k of worn) {
    const [tx, ty] = k.split(',').map(Number);
    const c = cells[ty]?.[tx];
    if (!c || (c.kind !== 'floor' && c.kind !== 'door') || !WORN_FLOORS.has(c.look.floorKind)) continue;
    for (let y = 0; y < TILE; y++)
      for (let x = 0; x < TILE; x++) {
        // 이웃이 길이 아니면 그쪽 가장자리 6px 를 흐리게 (바깥으로 갈수록 드문드문)
        let edge = 1;
        if (!on(tx - 1, ty)) edge = Math.min(edge, x / 6);
        if (!on(tx + 1, ty)) edge = Math.min(edge, (TILE - 1 - x) / 6);
        if (!on(tx, ty - 1)) edge = Math.min(edge, y / 6);
        if (!on(tx, ty + 1)) edge = Math.min(edge, (TILE - 1 - y) / 6);
        if (edge < 1 && ((x + y) % 2 === 0 ? 0.25 : 0.75) > edge) continue;
        const X = tx * TILE + x;
        const Y = ty * TILE + y;
        back.px[Y * back.w + X] = shade(back.px[Y * back.w + X], 0.06);
      }
  }
}

/** 사람 크기 방 한 장 */
export function buildHousePlan(r: RoomDef): HousePlan {
  const cells = houseCells(r);
  const back = new Pix(r.w * TILE, r.h * TILE);
  const over: PlanSprite[] = [];
  paintCells(back, cells, over);
  bakeWorn(back, r, cells);
  const floorAt = (px: number, py: number) => {
    const k = cells[Math.floor(py / TILE)]?.[Math.floor(px / TILE)]?.kind;
    return k !== undefined && k !== 'front' && k !== 'thick';
  };
  const lights: Light[] = [];
  const beams: Beam[] = [];
  const pools: Pool[] = [];
  const cones: Cone[] = [];
  const main = lookOf(r.look);
  const lay = placeFurniture(r.furniture ?? [], back, floorAt, (f) => cells[Math.min(r.h - 1, f.y + f.h - 1)]?.[f.x]?.look ?? main, (f, s, L) => {
    const kind = f.kind.split(':')[0];
    const opt = f.kind.split(':')[1] ?? '';
    const foot = (f.y + f.h) * TILE;
    const dim = L.sky !== 'day';
    if (kind === 'window') {
      // 창 아래 첫 바닥 줄부터 창살 십자 모양 빛 웅덩이
      let fy = f.y + f.h;
      while (cells[fy]?.[f.x]?.kind === 'front') fy++;
      const night = L.sky === 'night';
      const color: RGB = night ? [150, 180, 255] : L.sky === 'dusk' ? [255, 190, 130] : L.sky === 'rain' ? [200, 214, 236] : [255, 244, 214];
      const ww = f.w * TILE - 10;
      const hh = Math.round(f.h * TILE * 0.85);
      pools.push({ x: f.x * TILE + 5, y: fy * TILE + 3, w: ww, h: hh, slant: Math.round(hh * 0.55), cols: 2, rows: 2, bar: 3, color, k: night ? 0.42 : 0.3, moon: night });
      beams.push({ x: f.x * TILE + 4, y: foot, w: f.w * TILE - 8, h: (fy - f.y - f.h) * TILE + hh + 6, slant: Math.round(hh * 0.55), color, k: night ? 0.12 : 0.08, moon: night });
    }
    if (kind === 'lamp' && dim) {
      lights.push({ x: f.x * TILE + 24, y: foot - 76, r: 34, color: [255, 220, 150], k: 0.7, glow: 0.45 });
      lights.push({ x: f.x * TILE + 20, y: foot - 6, r: 64, color: [255, 214, 150], k: 0.32, glow: 0 });
    }
    if (kind === 'shop' && dim) lights.push({ x: f.x * TILE + (f.w * TILE) / 2, y: foot - 30, r: f.w * TILE * 0.55, color: [255, 220, 160], k: 0.45, glow: 0.2 });
    if (kind === 'thatch' && dim) for (const t of [0.27, 0.52]) lights.push({ x: f.x * TILE + f.w * TILE * (t - 0.12), y: foot - 46, r: 44, color: [255, 196, 120], k: 0.55, glow: 0.3 });
    if (kind === 'bldg' && opt === 'hospital' && dim) lights.push({ x: f.x * TILE + (f.w * TILE) / 2, y: foot - 14, r: 70, color: [230, 245, 230], k: 0.4, glow: 0.2 });
    if (kind === 'desk') {
      // 스탠드: 갓 아래 원뿔 + 책상 위 둥근 빛
      const top = foot - s.pix.h;
      const night = L.sky === 'night';
      cones.push({ x: f.x * TILE + 8, y: top + 8, len: 34, spread: 30, color: [255, 220, 160], k: night ? 0.55 : 0.2 });
      lights.push({ x: f.x * TILE + 12, y: top + 26, r: 60, color: [255, 214, 150], k: night ? 0.7 : 0.22, glow: 0.3 });
    }
  });
  over.push(...lay.over);
  const extra = (r.lights ?? []).map((l) => ({ x: (l.at[0] + 0.5) * TILE, y: (l.at[1] + 0.5) * TILE, r: l.r, color: l.color, k: l.k, glow: 0.25 }));
  const xb: Beam[] = (r.beams ?? []).map((b) => ({ x: b.x * TILE, y: 0, w: b.w * TILE, h: b.h * TILE, slant: b.slant * TILE, color: [150, 180, 255] as RGB, k: 0.42, moon: true }));
  return { back, props: lay.props, tops: lay.tops, over, fg: lay.fg, lights: [...lights, ...extra], beams: [...beams, ...xb], pools, cones, ambient: r.ambient ?? SKY_AMBIENT[main.sky], live: lay.live ?? [] };
}
