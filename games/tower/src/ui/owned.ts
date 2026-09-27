import { WEAPONS } from '../core/data.ts';
import type { GameState } from '../core/game.ts';
import { WEAPON_TYPES } from '../core/sets.ts';
import type { WeaponType } from '../core/types.ts';

/** 왼쪽 위 보유 무기: 작은 아이콘 칸 한 줄(10칸), 그 아래 세트 칩 */
export const OWNED = { x: 6, y: 30, w: 236, cols: 10, tileW: 20, tileH: 20, gap: 3, chipW: 40, chipH: 13, chipCols: 5, top: 0, pad: 2 };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** i 번째 무기 칸 */
export function tileRect(i: number): Rect {
  const { x, y, cols, tileW, tileH, gap, top, pad } = OWNED;
  return { x: x + pad + (i % cols) * (tileW + gap), y: y + top + Math.floor(i / cols) * (tileH + gap), w: tileW, h: tileH };
}

/** 무기 칸이 몇 줄인지 (없어도 한 줄 자리는 둔다) */
export function tileRows(groupCount: number): number {
  return Math.max(1, Math.ceil(groupCount / OWNED.cols));
}

/** j 번째 세트 칩 (무기 칸 줄 바로 아래) */
export function setChipRect(j: number, groupCount: number): Rect {
  const { x, y, tileH, gap, top, pad, chipW, chipH, chipCols } = OWNED;
  const y0 = y + top + tileRows(groupCount) * (tileH + gap) + 1;
  return { x: x + pad + (j % chipCols) * (chipW + gap), y: y0 + Math.floor(j / chipCols) * (chipH + gap), w: chipW, h: chipH };
}

const inside = (r: Rect, px: number, py: number) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;

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

/** 누른 무기 칸의 묶음 번호 */
export function hitTestOwned(groups: OwnedGroup[], x: number, y: number): number | null {
  const i = groups.findIndex((_, k) => inside(tileRect(k), x, y));
  return i >= 0 ? i : null;
}

/** 누른 세트 칩 번호 */
export function hitTestSetChip(chipCount: number, groupCount: number, x: number, y: number): number | null {
  for (let j = 0; j < chipCount; j++) if (inside(setChipRect(j, groupCount), x, y)) return j;
  return null;
}

/** 보여 줄 칸 수: 가진 무기 묶음 + 지금 줄을 채울 만큼의 빈 칸 (남은 무기 칸보다 많이는 아님) */
export function ownedTileCount(state: GameState, groups: OwnedGroup[]): number {
  const free = Math.max(0, state.config.tower.weaponSlots - state.weapons.length);
  const rowEnd = tileRows(groups.length) * OWNED.cols;
  return groups.length + Math.min(free, rowEnd - groups.length);
}
