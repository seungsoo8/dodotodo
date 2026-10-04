/** 도감 묶음: 방마다 나오는 장난감 (지도의 사냥터 · 보스에서 모은다) */
import { buildMap, type MapId } from '../core/maps.ts';
import { MONSTERS } from '../core/monsters.ts';

export interface BookGroup {
  name: string;
  ids: string[];
}

const ROOMS: MapId[] = ['toybox', 'drawer', 'desk', 'underbed', 'attic'];

export function bookGroups(): BookGroup[] {
  const seen = new Set<string>();
  const out: BookGroup[] = [];
  const add = (list: string[], id: string) => {
    if (seen.has(id) || !MONSTERS[id]) return;
    seen.add(id);
    list.push(id);
    const split = MONSTERS[id].split;
    if (split) add(list, split);
  };
  for (const r of ROOMS) {
    const m = buildMap(r);
    const ids: string[] = [];
    for (const z of m.spawns) for (const id of z.pool) add(ids, id);
    if (m.boss) add(ids, m.boss.id);
    out.push({ name: m.name, ids });
  }
  const rest = Object.keys(MONSTERS).filter((id) => !seen.has(id) && !MONSTERS[id].summon);
  if (rest.length) out.push({ name: '다락방 상자', ids: rest });
  return out;
}
