/** 곰돌 아저씨의 가게: 사탕 · 오늘의 부품 */
import { BASIC_PARTS, PARTS } from './parts.ts';
import type { Rng } from './rng.ts';
import type { Save } from './types.ts';

export function candyPrice(lv: number): number {
  return Math.round(20 * (1 + (lv - 1) * 0.15));
}

export function buyCandy(save: Save): boolean {
  const price = candyPrice(save.lv);
  if (save.gold < price) return false;
  save.gold -= price;
  save.potions.hp++;
  return true;
}

export interface ShopOffer {
  part: string;
  price: number;
  sold: boolean;
}

/** 오늘의 부품: 아직 없는 보통 부품 몇 개 (마을 단계가 오르면 더 많이) */
export function shopStock(rng: Rng, save: Save, villageLv: number): ShopOffer[] {
  if (villageLv < 2) return [];
  const pool = BASIC_PARTS.filter((id) => !save.parts[id]);
  const out: ShopOffer[] = [];
  const n = Math.min(pool.length, villageLv >= 4 ? 3 : villageLv >= 3 ? 2 : 1);
  for (let i = 0; i < n; i++) {
    const id = pool.splice(rng.int(pool.length), 1)[0];
    out.push({ part: id, price: (PARTS[id].craft?.gold ?? 100) * 4, sold: false });
  }
  return out;
}

export function buyPart(save: Save, stock: ShopOffer[], i: number): boolean {
  const o = stock[i];
  if (!o || o.sold || save.parts[o.part] || save.gold < o.price) return false;
  save.gold -= o.price;
  save.parts[o.part] = 1;
  o.sold = true;
  return true;
}
