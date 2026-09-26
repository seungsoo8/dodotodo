import { WEAPONS } from '../core/data.ts';
import type { GameState } from '../core/game.ts';
import { WEAPON_TYPES } from '../core/sets.ts';
import type { WeaponType } from '../core/types.ts';

/** 왼쪽 위 보유 무기 목록의 첫 줄 위치와 줄 크기 */
export const OWNED_ROW = { x: 4, y: 31, w: 196, h: 11 };

export interface OwnedGroup {
  id: string;
  name: string;
  type: WeaponType;
  level: number;
  count: number;
  /** state.weapons 안의 칸 번호 (판매용) */
  indices: number[];
}

/** 같은 무기·같은 ★ 끼리 묶어 계열 순서 → ★ 높은 순 → 무기 순서로 */
export function ownedGroups(state: GameState): OwnedGroup[] {
  const map = new Map<string, OwnedGroup>();
  state.weapons.forEach((w, i) => {
    const key = `${w.def.id}:${w.level}`;
    const g = map.get(key);
    if (g) {
      g.count++;
      g.indices.push(i);
    } else map.set(key, { id: w.def.id, name: w.def.name, type: w.def.type, level: w.level, count: 1, indices: [i] });
  });
  const order = (id: string) => WEAPONS.findIndex((w) => w.id === id);
  return [...map.values()].sort(
    (a, b) => WEAPON_TYPES.indexOf(a.type) - WEAPON_TYPES.indexOf(b.type) || b.level - a.level || order(a.id) - order(b.id),
  );
}

/** 목록에서 누른 줄의 묶음 번호 */
export function hitTestOwned(groups: OwnedGroup[], x: number, y: number): number | null {
  if (x < OWNED_ROW.x || x >= OWNED_ROW.x + OWNED_ROW.w || y < OWNED_ROW.y) return null;
  const i = Math.floor((y - OWNED_ROW.y) / OWNED_ROW.h);
  return i < groups.length ? i : null;
}
