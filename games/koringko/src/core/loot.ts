/** 몬스터가 떨어뜨리는 것 */
import { makeItem, rollRarity } from './items.ts';
import type { Rng } from './rng.ts';
import { RARITIES, type HeroId, type Item, type MatId } from './types.ts';

export type Rank = 'normal' | 'elite' | 'boss';

export interface DropInput {
  lv: number;
  rank: Rank;
  gold: [number, number];
  hero: HeroId;
  /** 행운 (레어 이상 확률을 올린다) */
  luck: number;
  uid: () => string;
  /** 이 몬스터가 남기는 재료 */
  mat?: { id: MatId; chance: number };
}

export interface Drops {
  gold: number;
  items: Item[];
  potion: 'hp' | 'sp' | null;
  mats: Partial<Record<MatId, number>>;
}

const ITEM_CHANCE: Record<Rank, number> = { normal: 0.1, elite: 0.6, boss: 1 };
const RANK_GOLD: Record<Rank, number> = { normal: 1, elite: 3, boss: 1 };

export function rollDrops(rng: Rng, d: DropInput): Drops {
  const gold = Math.round((d.gold[0] + rng.next() * (d.gold[1] - d.gold[0])) * RANK_GOLD[d.rank]);
  const items: Item[] = [];
  const count = d.rank === 'boss' ? 2 + rng.int(2) : rng.next() < ITEM_CHANCE[d.rank] ? 1 : 0;
  for (let i = 0; i < count; i++) {
    let rarity = rollRarity(rng, d.luck + (d.rank === 'elite' ? 1 : 0));
    // 보스는 레어 이상
    if (d.rank === 'boss' && RARITIES.indexOf(rarity) < 2) rarity = rng.next() < 0.15 ? 'unique' : 'rare';
    items.push(makeItem(rng, { ilvl: d.lv + (d.rank === 'boss' ? 1 : 0), rarity, hero: d.hero, uid: d.uid() }));
  }
  const r = rng.next();
  const potion = r < 0.05 ? 'hp' : r < 0.08 ? 'sp' : null;
  const mats: Partial<Record<MatId, number>> = {};
  if (d.mat && rng.next() < d.mat.chance * (d.rank === 'normal' ? 1 : 3)) mats[d.mat.id] = 1;
  if (d.rank !== 'normal') mats.dust = 1 + rng.int(d.rank === 'boss' ? 5 : 2);
  return { gold, items, potion, mats };
}
