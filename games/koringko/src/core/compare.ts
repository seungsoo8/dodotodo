/** 장비를 바꿔 끼면 전투력이 얼마나 달라지는지 (실제로 끼지는 않는다) */
import { computeStats, power } from './stats.ts';
import type { Item, Save } from './types.ts';

export function powerChange(save: Save, item: Item): number {
  const now = power(computeStats(save));
  const trial: Save = { ...save, gear: { ...save.gear, [item.slot]: item } };
  return power(computeStats(trial)) - now;
}
