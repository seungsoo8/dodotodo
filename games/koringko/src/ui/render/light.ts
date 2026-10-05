/**
 * 한밤의 아이 방 조명: 방마다 어둠의 색(곱하기), 그 위에 더하는 빛(가로등 · 창문 달빛 · 주인공 불빛 …).
 * 화면과 무관한 계산만 여기 둔다 (테스트할 수 있게). 그리기는 scene.ts.
 */
import { TILE, type MapDef, type Theme } from '../../core/maps.ts';
import { hash2 } from '../art/paint.ts';
import { toyDecals } from '../art/room.ts';

export type RGB = readonly [number, number, number];

export interface Light {
  x: number;
  y: number;
  r: number;
  color: RGB;
  /** 세기 (1 = 그 색 그대로 더한다) */
  k: number;
  /** 빛 둘레가 번지는 정도 (0 = 없음) */
  glow?: number;
}

/** 창문으로 들어오는 달빛: 위 가장자리 (x, y) 에서 폭 w, 길이 h, 아래로 갈수록 slant 만큼 옆으로 */
export interface Beam {
  x: number;
  y: number;
  w: number;
  h: number;
  slant: number;
  color: RGB;
  k: number;
}

/** 창 모양 빛 웅덩이 (E9): 바닥 (x, y) 에서 폭 w · 깊이 h, 아래로 갈수록 slant 만큼 옆으로. 창살 십자로 cols × rows 칸 */
export interface Pool {
  x: number;
  y: number;
  w: number;
  h: number;
  slant: number;
  cols: number;
  rows: number;
  /** 창살 굵기 px */
  bar: number;
  color: RGB;
  k: number;
}

/** 스탠드 원뿔: 꼭짓점 (x, y) 에서 아래로 len, 바닥 폭 spread */
export interface Cone {
  x: number;
  y: number;
  len: number;
  spread: number;
  color: RGB;
  k: number;
}

/** 웅덩이 창유리 칸들 (평행사변형 네 꼭짓점) — 창살 자리는 비운다 */
export function poolPanes(p: Pool): [number, number][][] {
  const out: [number, number][][] = [];
  const pw = (p.w - p.bar * (p.cols - 1)) / p.cols;
  const ph = (p.h - p.bar * (p.rows - 1)) / p.rows;
  const at = (u: number, v: number): [number, number] => [p.x + u + (v / p.h) * p.slant, p.y + v];
  for (let r = 0; r < p.rows; r++)
    for (let c = 0; c < p.cols; c++) {
      const u0 = c * (pw + p.bar);
      const v0 = r * (ph + p.bar);
      out.push([at(u0, v0), at(u0 + pw, v0), at(u0 + pw, v0 + ph), at(u0, v0 + ph)]);
    }
  return out;
}

const tileCenter =(t: number) => t * TILE + TILE / 2;

const WARM: RGB = [255, 196, 120];
const LAMP: RGB = [255, 210, 130];
const MOON: RGB = [150, 180, 255];

/** 방마다 밤의 색 (곱하기). 블록 마을은 야간등 덕에 덜 어둡고, 침대 밑은 깜깜하다 */
export const AMBIENT: Record<Theme, RGB> = {
  village: [104, 100, 156],
  toybox: [84, 86, 140],
  candy: [118, 92, 150],
  factory: [92, 92, 124],
  cave: [34, 30, 52],
  rift: [44, 32, 80],
};

/** 방의 창문 (방마다 손으로 정한 자리) */
const WINDOWS: Partial<Record<string, Omit<Beam, 'color' | 'k'>[]>> = {
  toybox: [
    { x: 19 * TILE, y: 0, w: 3 * TILE, h: 15 * TILE, slant: 7 * TILE },
    { x: 24 * TILE, y: 0, w: 2 * TILE, h: 15 * TILE, slant: 7 * TILE },
  ],
  village: [{ x: 6 * TILE, y: 0, w: 5 * TILE, h: 30 * TILE, slant: 14 * TILE }],
  drawer: [{ x: 24 * TILE, y: 0, w: 9 * TILE, h: 6 * TILE, slant: 0 }],
  attic: [{ x: 20 * TILE, y: 0, w: 4 * TILE, h: 16 * TILE, slant: -6 * TILE }],
};

export function moonBeams(map: MapDef): Beam[] {
  const ws = WINDOWS[map.id] ?? [];
  // 서랍은 살짝 열린 틈으로 들어오는 방 불빛 (따뜻하게)
  const warm = map.id === 'drawer';
  return ws.map((b) => ({ ...b, color: warm ? [210, 190, 200] : MOON, k: warm ? 0.32 : 0.42 }));
}

const HOUSE = new Set(['chief', 'shop', 'forge', 'tailor', 'house']);

/** 지도에 붙박인 빛 (지도 한 장에 한 번 계산) */
export function staticLights(map: MapDef): Light[] {
  const out: Light[] = [];
  for (let ty = 0; ty < map.h; ty++)
    for (let tx = 0; tx < map.w; tx++) {
      const c = map.tiles[ty][tx];
      const x = tileCenter(tx);
      const y = tileCenter(ty);
      if (c === 'c') out.push({ x, y, r: 54, color: [110, 200, 255], k: 0.75, glow: 0.25 });
      else if (c === 'L') out.push({ x, y, r: 56, color: [190, 255, 150], k: 0.7, glow: 0.25 });
      else if (c === 'l' && hash2(tx, ty, 7) < 0.25) out.push({ x, y: y - 14, r: 40, color: [255, 150, 200], k: 0.35 });
    }
  // 책상: 사냥터와 보스 자리를 비추는 스탠드
  if (map.theme === 'factory') for (const z of [...map.spawns, ...(map.boss ? [map.boss] : [])]) out.push({ x: (z.x + 0.5) * TILE, y: (z.y + 0.5) * TILE, r: 150, color: [255, 214, 150], k: 0.55 });
  // 야광 별 스티커
  for (const d of toyDecals(map)) if (d.kind === 'star') out.push({ x: d.x, y: d.y, r: 18, color: [200, 255, 150], k: 0.45, glow: 0.5 });
  for (const s of map.structures) {
    const cx = (s.x + s.w / 2) * TILE;
    if (s.kind === 'lamp') out.push({ x: cx, y: s.y * TILE, r: 96, color: LAMP, k: 0.75, glow: 0.3 });
    else if (s.kind === 'altar') out.push({ x: cx, y: s.y * TILE + 6, r: 80, color: [255, 216, 120], k: 0.8, glow: 0.3 });
    else if (s.kind === 'portal') out.push({ x: cx, y: s.y * TILE + 6, r: 90, color: [190, 140, 255], k: 0.9, glow: 0.35 });
    else if (s.kind === 'fountain') out.push({ x: cx, y: (s.y + s.h / 2) * TILE, r: 56, color: [120, 210, 255], k: 0.45 });
    else if (HOUSE.has(s.kind) && !s.id?.startsWith('v_')) {
      // 창문 두 개에서 새어 나오는 불빛 + 문 앞
      for (const fx of [0.25, 0.75]) out.push({ x: (s.x + s.w * fx) * TILE, y: (s.y + s.h * 0.55) * TILE, r: 44, color: WARM, k: 0.55, glow: 0.2 });
      out.push({ x: cx, y: (s.y + s.h) * TILE + 6, r: 60, color: WARM, k: 0.45 });
    }
  }
  return out;
}
