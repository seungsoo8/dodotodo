/** 곰돌이 잡화점: 포션 · 장비 진열 */
import { itemValue, makeItem } from './items.ts';
import { addItem, nextUid } from './inventory.ts';
import type { Rng } from './rng.ts';
import { SLOTS, type Item, type Save } from './types.ts';

export function potionPrice(lv: number, kind: 'hp' | 'sp'): number {
  return Math.round((kind === 'hp' ? 20 : 25) * (1 + (lv - 1) * 0.15));
}

export function buyPotion(save: Save, kind: 'hp' | 'sp'): boolean {
  const price = potionPrice(save.lv, kind);
  if (save.gold < price) return false;
  save.gold -= price;
  save.potions[kind]++;
  return true;
}

export interface ShopOffer {
  item: Item;
  price: number;
  sold: boolean;
}

/** 장비 진열: 부위마다 하나, 내 레벨 근처의 일반·매직 */
export function shopStock(rng: Rng, save: Save): ShopOffer[] {
  return SLOTS.map((slot, i) => {
    const item = makeItem(rng, {
      ilvl: Math.max(1, save.lv + rng.int(5) - 2),
      slot,
      hero: save.hero,
      rarity: rng.next() < 0.35 ? 'magic' : 'normal',
      uid: `shop-${i}`,
    });
    return { item, price: itemValue(item) * 4, sold: false };
  });
}

export function buyItem(save: Save, stock: ShopOffer[], index: number): boolean {
  const o = stock[index];
  if (!o || o.sold || save.gold < o.price) return false;
  const item = { ...o.item, uid: nextUid(save) };
  if (!addItem(save, item)) return false;
  save.gold -= o.price;
  o.sold = true;
  return true;
}
