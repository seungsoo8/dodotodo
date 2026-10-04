/** 구해 주면 친구: 깨끗하게 만든 장난감이 모이면 구출되어 마을 주민이 된다 */
import { MONSTERS } from './monsters.ts';
import type { Bonus } from './stats.ts';
import type { Save } from './types.ts';

/** 몇 번 깨끗하게 하면 구출되는가 (보스는 한 번) */
export function rescueNeed(defId: string): number {
  const d = MONSTERS[defId];
  if (!d) return Infinity;
  if (d.boss) return 1;
  if (d.split || defId === 'jellet') return 12;
  return d.hp >= 200 ? 5 : 8;
}

/** 쓰러뜨렸다 → 깨끗해졌다. 이번에 구출되었으면 true */
export function cleanToy(save: Save, defId: string): boolean {
  if (!MONSTERS[defId] || MONSTERS[defId].summon || save.rescued.includes(defId)) return false;
  save.friends[defId] = (save.friends[defId] ?? 0) + 1;
  if (save.friends[defId] >= rescueNeed(defId)) {
    save.rescued.push(defId);
    return true;
  }
  return false;
}

/** 마을 단계: 친구 셋마다 하나 (1~6) */
export function villageLevel(save: Save): number {
  return Math.min(6, 1 + Math.floor(save.rescued.length / 3));
}

/** 친구 하나마다 탐험대 공격 · HP +1% */
export function friendBonus(save: Save): Bonus {
  const n = save.rescued.length;
  return { atkPct: n * 0.01, hpPct: n * 0.01 };
}
