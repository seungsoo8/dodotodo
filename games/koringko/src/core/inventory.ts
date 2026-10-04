/** 가방 · 장착 · 팔기 */
import { itemValue } from './items.ts';
import type { Item, Save, Slot } from './types.ts';

export const BAG_MAX = 40;

export function addItem(save: Save, item: Item): boolean {
  if (save.bag.length >= BAG_MAX) return false;
  save.bag.push(item);
  return true;
}

export type EquipCheck = { ok: true } | { ok: false; reason: 'level' | 'hero' };

export function equipCheck(save: Save, item: Item): EquipCheck {
  if (item.req > save.lv) return { ok: false, reason: 'level' };
  if (item.slot === 'weapon' && item.hero && item.hero !== save.hero) return { ok: false, reason: 'hero' };
  return { ok: true };
}

/** 가방 index 번째 장비를 낀다 (끼고 있던 것은 그 자리로) */
export function equip(save: Save, index: number): boolean {
  const item = save.bag[index];
  if (!item || !equipCheck(save, item).ok) return false;
  const prev = save.gear[item.slot];
  save.gear[item.slot] = item;
  if (prev) save.bag[index] = prev;
  else save.bag.splice(index, 1);
  return true;
}

export function unequip(save: Save, slot: Slot): boolean {
  const item = save.gear[slot];
  if (!item || save.bag.length >= BAG_MAX) return false;
  delete save.gear[slot];
  save.bag.push(item);
  return true;
}

/** 판다. 받은 골드를 돌려준다 (없으면 0) */
export function sell(save: Save, index: number): number {
  const item = save.bag[index];
  if (!item) return 0;
  const v = itemValue(item);
  save.bag.splice(index, 1);
  save.gold += v;
  return v;
}

/** 새 아이템 번호 */
export function nextUid(save: Save): string {
  return `${save.slot}-${save.nextUid++}`;
}
