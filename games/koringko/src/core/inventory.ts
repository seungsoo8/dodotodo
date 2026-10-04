/** 가방 · 장착 · 팔기 */
import { itemValue } from './items.ts';
import { powerChange } from './compare.ts';
import { dismantle } from './forge.ts';
import { RARITIES, type Rarity } from './types.ts';
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

/** 한꺼번에 정리할 장비: 그 등급 이하이고, 끼면 더 세지는 장비는 아닌 것 */
function junk(save: Save, upTo: Rarity): number[] {
  const max = RARITIES.indexOf(upTo);
  const out: number[] = [];
  save.bag.forEach((it, i) => {
    if (RARITIES.indexOf(it.rarity) > max) return;
    if (equipCheck(save, it).ok && powerChange(save, it) > 0) return;
    out.push(i);
  });
  return out;
}

export function sellAll(save: Save, upTo: Rarity): { count: number; gold: number } {
  const idx = junk(save, upTo);
  let gold = 0;
  for (const i of idx.reverse()) gold += sell(save, i);
  return { count: idx.length, gold };
}

export function dismantleAll(save: Save, upTo: Rarity): { count: number; dust: number; star: number } {
  const idx = junk(save, upTo);
  let dust = 0;
  let star = 0;
  for (const i of idx.reverse()) {
    const r = dismantle(save, i);
    dust += r.dust;
    star += r.star;
  }
  return { count: idx.length, dust, star };
}
