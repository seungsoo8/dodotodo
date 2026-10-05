/** 목표 화살표: 지금 할 일을 하려면 이 지도에서 어디로 가야 하나 */
import type { Game } from './game.ts';
import { TILE, buildMap, type MapDef, type MapId } from './maps.ts';
import { currentGoal, QUEST_BY_ID } from './quests.ts';
import { structureSpot } from './rescue.ts';
import { NPCS } from './story.ts';
import { tileCenter } from './world.ts';

export interface GoalPoint {
  x: number;
  y: number;
  label: string;
}

const MAPS: MapId[] = ['village', 'toybox', 'drawer', 'desk', 'underbed', 'attic'];
const DEFS = new Map<MapId, MapDef>();
function def(id: MapId): MapDef {
  let d = DEFS.get(id);
  if (!d) {
    d = buildMap(id);
    DEFS.set(id, d);
  }
  return d;
}

/** 목표가 있는 지도와 그 안의 자리 */
function target(g: Game): { map: MapId; at: (m: MapDef) => GoalPoint | null } | null {
  const goal = currentGoal(g.save);
  if (!goal) return null;
  const q = goal.quest;
  const st = goal.state.state;
  // 받기 · 보고: 맡긴 주민
  if (st === 'none' || st === 'ready') {
    const map = MAPS.find((id) => def(id).npcs.some((n) => n.id === q.giver));
    if (!map) return null;
    return {
      map,
      at: (m) => {
        const n = m.npcs.find((x) => x.id === q.giver)!;
        return { x: tileCenter(n.x), y: tileCenter(n.y), label: NPCS[q.giver].name };
      },
    };
  }
  switch (q.kind) {
    case 'kill':
    case 'collect': {
      const map = MAPS.find((id) => def(id).spawns.some((z) => z.pool.includes(q.target)) || (q.kind === 'collect' && def(id).spawns.some((z) => z.pool.length)));
      if (!map) return null;
      return {
        map,
        at: (m) => {
          const p = g.world.player;
          const live = g.world.monsters.filter((x) => x.hp > 0 && x.def.id === q.target);
          if (live.length) {
            const n = live.reduce((a, b) => (Math.hypot(b.x - p.x, b.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? b : a));
            return { x: n.x, y: n.y, label: n.def.name };
          }
          const zones = def(m.id).spawns.filter((z) => z.pool.includes(q.target));
          const z = zones[0] ?? def(m.id).spawns[0];
          return z ? { x: tileCenter(z.x), y: tileCenter(z.y), label: q.goal } : null;
        },
      };
    }
    case 'rescue': {
      const map = MAPS.find((id) => def(id).structures.some((s) => s.kind === 'cocoon' && s.id === q.target));
      if (!map) return null;
      return {
        map,
        at: (m) => {
          const s = m.structures.find((x) => x.kind === 'cocoon' && x.id === q.target)!;
          return { ...structureSpot(s), label: '먼지 고치' };
        },
      };
    }
    case 'boss': {
      const map = MAPS.find((id) => def(id).boss?.id === q.target);
      if (!map) return null;
      return {
        map,
        at: (m) => {
          const live = g.world.monsters.find((x) => x.boss && x.def.id === q.target && x.hp > 0);
          if (live) return { x: live.x, y: live.y, label: live.name };
          const b = m.boss!;
          return { x: tileCenter(b.x), y: tileCenter(b.y), label: QUEST_BY_ID[q.id].name };
        },
      };
    }
    case 'fetch': {
      const f = q.fetch!;
      return { map: f.map, at: () => ({ x: tileCenter(f.x), y: tileCenter(f.y), label: f.item }) };
    }
    default:
      return null;
  }
}

/** 이 지도에서 가리킬 곳 (다른 방이면 그쪽 출구 · 마을로 가는 출구) */
export function goalPoint(g: Game): GoalPoint | null {
  const t = target(g);
  if (!t) return null;
  const m = g.world.map;
  if (m.id === t.map) return t.at(m);
  // 방끼리는 블록 마을로 이어진다
  const via = m.id === 'village' ? t.map : 'village';
  const wp = m.warps.find((w) => w.to === via);
  if (!wp) return null;
  return { x: (wp.x + wp.w / 2) * TILE, y: (wp.y + wp.h / 2) * TILE, label: wp.label };
}
