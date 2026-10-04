/** 먼지 고치(동료 구출) · 보물 상자 */
import { onRescue } from './quests.ts';
import { joinParty } from './party.ts';
import { TILE, buildMap, isSolid, type Structure } from './maps.ts';
import { PARTS } from './parts.ts';
import { spawnMonster, type World } from './world.ts';
import type { Game } from './game.ts';
import type { HeroId } from './types.ts';

/** 먼지 무리 차례 (마리 수) */
export const RESCUE_WAVES = [3, 4, 5];
/** 상자 단추 (부품이 든 상자 · 이미 가진 부품이면 더) */
export const CHEST_GOLD = { base: 50, dup: 150 };

export interface RescueState {
  hero: HeroId;
  wave: number;
  /** 지금 무리의 몬스터 */
  ids: number[];
  x: number;
  y: number;
}

/** 구조물 앞 말 거는 자리 (아래쪽 한가운데) */
export function structureSpot(s: Structure): { x: number; y: number } {
  return { x: (s.x + s.w / 2) * TILE, y: (s.y + s.h) * TILE + TILE / 2 };
}

export function chestFlag(w: World, s: Structure): string {
  return `chest_${w.map.id}_${s.id}`;
}

/** 아직 열 수 있는 상자 · 아직 구하지 않은 고치 */
export function liveStructures(g: Game): Structure[] {
  const w = g.world;
  return w.map.structures.filter((s) => {
    if (s.kind === 'cocoon') return !g.save.party.includes(s.id as HeroId);
    if (s.kind === 'chest') return !g.save.flags[chestFlag(w, s)];
    return false;
  });
}

/** 고치에 말을 걸었다: 먼지 무리 시작 */
export function startRescue(g: Game, hero: HeroId): boolean {
  const w = g.world;
  if (w.rescue || g.save.party.includes(hero)) return false;
  const s = w.map.structures.find((x) => x.kind === 'cocoon' && x.id === hero);
  if (!s) return false;
  const at = structureSpot(s);
  w.rescue = { hero, wave: 0, ids: [], x: at.x, y: at.y - TILE };
  spawnWave(g);
  w.events.push({ kind: 'rescueStart', hero });
  return true;
}

function spawnWave(g: Game): void {
  const w = g.world;
  const r = w.rescue!;
  // 고치에서 가장 가까운 사냥터의 몬스터 (지도를 처음 모습으로 보고 고른다)
  const zones = buildMap(w.map.id).spawns;
  const tx = r.x / TILE;
  const ty = r.y / TILE;
  const zone = zones.reduce((a, b) => (Math.hypot(b.x - tx, b.y - ty) < Math.hypot(a.x - tx, a.y - ty) ? b : a));
  const n = RESCUE_WAVES[r.wave];
  r.ids = [];
  for (let i = 0; i < n; i++) {
    let x = r.x;
    let y = r.y;
    for (let k = 0; k < 12; k++) {
      const a = g.rng.next() * Math.PI * 2;
      const d = TILE * (2.5 + g.rng.next() * 2);
      const cx = r.x + Math.cos(a) * d;
      const cy = r.y + Math.sin(a) * d;
      if (!isSolid(w.map, Math.floor(cx / TILE), Math.floor(cy / TILE))) {
        x = cx;
        y = cy;
        break;
      }
    }
    const m = spawnMonster(w, zone.pool[i % zone.pool.length], x, y, zone.lv[1] + (r.wave === RESCUE_WAVES.length - 1 ? 1 : 0));
    m.spawnLeft = 0.6 + i * 0.15;
    m.ai.state = 'chase';
    r.ids.push(m.id);
  }
}

/** 무리를 다 물리쳤으면 다음 무리, 마지막이면 동료 합류 */
export function updateRescue(g: Game): void {
  const w = g.world;
  const r = w.rescue;
  if (!r) return;
  if (w.monsters.some((m) => r.ids.includes(m.id) && m.hp > 0)) return;
  r.wave++;
  if (r.wave < RESCUE_WAVES.length) {
    spawnWave(g);
    w.events.push({ kind: 'rescueWave', wave: r.wave + 1, of: RESCUE_WAVES.length });
    return;
  }
  w.rescue = null;
  joinParty(g.save, r.hero);
  g.save.flags[`rescued_${r.hero}`] = true;
  w.events.push({ kind: 'join', hero: r.hero });
  for (const id of onRescue(g.save, r.hero)) w.events.push({ kind: 'quest', id, state: g.save.quests[id].state });
}

/** 보물 상자 열기 */
export function openChest(g: Game, s: Structure): void {
  const w = g.world;
  const save = g.save;
  const flag = chestFlag(w, s);
  if (save.flags[flag]) return;
  save.flags[flag] = true;
  const id = s.id && PARTS[s.id] ? s.id : null;
  const part = id && !save.parts[id] ? id : null;
  const gold = part ? CHEST_GOLD.base : CHEST_GOLD.base + CHEST_GOLD.dup;
  if (part) save.parts[part] = 1;
  save.gold += gold;
  w.events.push({ kind: 'chest', part, gold });
}
