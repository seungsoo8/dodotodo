/** 망치 너구리의 대장간: 강화 · 분해 */
import { itemTier } from './items.ts';
import type { Rng } from './rng.ts';
import { RARITIES, type Item, type Save, type Slot } from './types.ts';

export const PLUS_MAX = 10;

/** 강화 성공 확률 (지금 단계 0~9) */
const CHANCE = [1, 1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];

export function forgeChance(plus: number): number {
  return CHANCE[plus] ?? 0;
}

export function forgeCost(it: Item): { gold: number; dust: number; star: number } {
  const n = it.plus + 1;
  return { gold: Math.round(n * n * (12 + it.ilvl * 3)), dust: n, star: it.plus >= 4 ? it.plus - 3 : 0 };
}

export type Where = { gear: Slot } | { bag: number };

function itemAt(save: Save, w: Where): Item | undefined {
  return 'gear' in w ? save.gear[w.gear] : save.bag[w.bag];
}

export type ForgeResult = { kind: 'success' | 'fail'; plus: number } | { kind: 'poor' | 'max' | 'none' };

export function upgrade(save: Save, w: Where, rng: Rng): ForgeResult {
  const it = itemAt(save, w);
  if (!it) return { kind: 'none' };
  if (it.plus >= PLUS_MAX) return { kind: 'max' };
  const c = forgeCost(it);
  if (save.gold < c.gold || save.mats.dust < c.dust || save.mats.star < c.star) return { kind: 'poor' };
  save.gold -= c.gold;
  save.mats.dust -= c.dust;
  save.mats.star -= c.star;
  if (rng.next() < forgeChance(it.plus)) {
    it.plus++;
    return { kind: 'success', plus: it.plus };
  }
  // +6 이상에서 실패하면 한 단계 내려간다
  if (it.plus >= 6) it.plus--;
  return { kind: 'fail', plus: it.plus };
}

/** 분해: 별가루 (레어 이상은 별 조각도) */
export function dismantle(save: Save, index: number): { dust: number; star: number } {
  const it = save.bag[index];
  if (!it) return { dust: 0, star: 0 };
  const r = RARITIES.indexOf(it.rarity);
  const dust = 1 + itemTier(it.ilvl) + r * 2 + it.plus;
  const star = r >= 2 ? r - 1 : 0;
  save.bag.splice(index, 1);
  save.mats.dust += dust;
  save.mats.star += star;
  return { dust, star };
}
