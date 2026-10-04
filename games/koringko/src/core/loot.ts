/** 몬스터가 떨어뜨리는 것: 단추 · 재료 · 사탕 · (정예) 부품 */
import type { Rng } from './rng.ts';
import type { MatId } from './types.ts';

export type Rank = 'normal' | 'elite' | 'boss';

export interface DropInput {
  rank: Rank;
  gold: [number, number];
  /** 이 몬스터가 남기는 재료 */
  mat?: { id: MatId; chance: number };
}

export interface Drops {
  gold: number;
  candy: boolean;
  mats: Partial<Record<MatId, number>>;
  /** 정예: 부품을 떨어뜨릴 차례인가 (어떤 부품인지는 가진 부품을 보고 정한다) */
  part: boolean;
}

const RANK_GOLD: Record<Rank, number> = { normal: 1, elite: 3, boss: 1 };
const MATS: MatId[] = ['fluff', 'gear', 'sugar'];

export function rollDrops(rng: Rng, d: DropInput): Drops {
  const gold = Math.round((d.gold[0] + rng.next() * (d.gold[1] - d.gold[0])) * RANK_GOLD[d.rank]);
  const candy = rng.next() < (d.rank === 'normal' ? 0.05 : 0.5);
  const mats: Partial<Record<MatId, number>> = {};
  if (d.mat && rng.next() < d.mat.chance * (d.rank === 'normal' ? 1 : 3)) mats[d.mat.id] = 1;
  if (d.rank !== 'normal') {
    mats.dust = 1 + rng.int(d.rank === 'boss' ? 5 : 2);
    const m = MATS[rng.int(MATS.length)];
    mats[m] = (mats[m] ?? 0) + 1 + rng.int(d.rank === 'boss' ? 4 : 2);
  }
  if (d.rank === 'boss') mats.star = 1 + rng.int(2);
  return { gold, candy, mats, part: d.rank === 'elite' && rng.next() < 0.2 };
}
