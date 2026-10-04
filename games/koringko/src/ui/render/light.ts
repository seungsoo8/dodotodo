/**
 * 한밤의 아이 방 조명: 방마다 어둠의 색(곱하기), 그 위에 더하는 빛(가로등 · 창문 달빛 · 주인공 불빛 …).
 * 화면과 무관한 계산만 여기 둔다 (테스트할 수 있게). 그리기는 scene.ts.
 */
import { npcShown, type Game } from '../../core/game.ts';
import { TILE, type MapDef, type Theme } from '../../core/maps.ts';
import { errandsHere } from '../../core/quests.ts';
import { chestFlag } from '../../core/rescue.ts';
import type { World } from '../../core/world.ts';
import { tileCenter } from '../../core/world.ts';
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

export const PLAYER_LIGHT = 104;
const PLAYER_LIGHT_OUT = 56;

const WARM: RGB = [255, 196, 120];
const LAMP: RGB = [255, 210, 130];
const MOON: RGB = [150, 180, 255];
const DANGER: RGB = [255, 70, 80];

/** 방마다 밤의 색 (곱하기). 블록 마을은 야간등 덕에 덜 어둡고, 침대 밑은 깜깜하다 */
const AMBIENT: Record<Theme, RGB> = {
  village: [104, 100, 156],
  toybox: [84, 86, 140],
  candy: [118, 92, 150],
  factory: [92, 92, 124],
  cave: [34, 30, 52],
  rift: [44, 32, 80],
};

export function ambientFor(map: MapDef, w: World): RGB {
  const a = AMBIENT[map.theme];
  let k = 1;
  if (w.lightsOut > 0) k = 0.35;
  else if (w.rift?.rule === 'dark') k = 0.6;
  return [Math.round(a[0] * k), Math.round(a[1] * k), Math.round(a[2] * k)];
}

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

const SHOT_COLOR: Record<string, RGB> = {
  fireball: [255, 150, 70],
  orb: [200, 150, 255],
  arrow: [255, 240, 200],
  bolt: [160, 220, 255],
};

/** 움직이는 빛 (매 프레임) */
export function dynamicLights(g: Game, time: number): Light[] {
  const w = g.world;
  const out: Light[] = [];
  const p = w.player;
  const flick = Math.sin(time * 3.1) * 2 + Math.sin(time * 7.3) * 1;
  out.push({ x: p.x, y: p.y - 8, r: w.lightsOut > 0 ? PLAYER_LIGHT_OUT : PLAYER_LIGHT, color: WARM, k: 0.8 + flick * 0.01, glow: 0.12 });

  for (const m of w.monsters) {
    if (m.hp <= 0) continue;
    out.push({ x: m.x, y: m.y, r: m.boss ? 76 : 26, color: m.boss ? [255, 220, 200] : [200, 200, 255], k: m.boss ? 0.55 : 0.3 });
  }
  for (const n of w.map.npcs) {
    if (!npcShown(g.save, n.id)) continue;
    out.push({ x: tileCenter(n.x), y: tileCenter(n.y), r: 38, color: WARM, k: 0.25 });
  }
  for (const d of w.drops) out.push({ x: d.x, y: d.y - 4, r: 22, color: [255, 230, 150], k: 0.5 });
  for (const q of errandsHere(g.save, w.map.id)) out.push({ x: tileCenter(q.fetch!.x), y: tileCenter(q.fetch!.y), r: 48, color: [255, 224, 138], k: 0.8, glow: 0.3 });
  for (const s of w.map.structures) {
    const cx = (s.x + s.w / 2) * TILE;
    const cy = (s.y + s.h / 2) * TILE;
    if (s.kind === 'cocoon' && !g.save.party.includes(s.id as never)) out.push({ x: cx, y: cy, r: 52, color: [255, 220, 140], k: 0.6, glow: 0.2 });
    if (s.kind === 'chest' && !g.save.flags[chestFlag(w, s)]) out.push({ x: cx, y: cy, r: 34, color: [255, 210, 90], k: 0.5 });
  }
  for (const pr of w.projectiles) if (pr.life > 0) out.push({ x: pr.x, y: pr.y, r: 34, color: SHOT_COLOR[pr.kind] ?? [255, 230, 180], k: 0.7, glow: 0.3 });
  for (const h of w.hazards) {
    const s = h.shape;
    const x = s.type === 'circle' ? s.x : (s.x1 + s.x2) / 2;
    const y = s.type === 'circle' ? s.y : (s.y1 + s.y2) / 2;
    const r = s.type === 'circle' ? s.r * 1.25 : Math.hypot(s.x2 - s.x1, s.y2 - s.y1) * 0.6;
    if (h.from === 'monster') {
      const t = h.telegraph > 0 ? 1 - h.delay / h.telegraph : 1;
      out.push({ x, y, r, color: DANGER, k: 0.45 + 0.4 * Math.max(0, t) });
    } else out.push({ x, y, r, color: [255, 220, 160], k: 0.6 });
  }
  const L = w.freeze.light;
  if (L) out.push({ x: L.x, y: L.y, r: L.r * 1.4, color: [255, 250, 215], k: 1.3, glow: 0.35 });
  if (w.rift?.portal) out.push({ x: w.rift.portal.x, y: w.rift.portal.y, r: 90, color: [190, 140, 255], k: 0.9, glow: 0.35 });
  return out;
}
