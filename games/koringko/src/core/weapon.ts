/** 무기 손질 (망치 너구리): 동료마다 1~20 단계 */
import { CLASSES } from './classes.ts';
import type { HeroId, Save } from './types.ts';

export const WEAPON_MAX = 20;
/** 무기 종류: 공격 속도와 피해 배율 */
export const WEAPON_TYPES = {
  sword: { spd: 1, dmg: 1 },
  axe: { spd: 0.86, dmg: 1.4 },
  bow: { spd: 1, dmg: 0.95 },
  staff: { spd: 0.92, dmg: 1.12 },
} as const;
export const WEAPON_NAME: Record<HeroId, string> = { toby: '솜털 검', bori: '나무 도끼', ruru: '고무줄 활', nabi: '별 지팡이' };

/** 무기 평균 피해: 탐험대 레벨과 손질 단계로 자란다 */
export function weaponDamage(h: HeroId, wlv: number, teamLv: number): number {
  return (5 + teamLv * 2) * WEAPON_TYPES[CLASSES[h].weapon].dmg * (1 + (wlv - 1) * 0.06);
}

export function weaponSpeed(h: HeroId): number {
  return WEAPON_TYPES[CLASSES[h].weapon].spd;
}

export function weaponCost(wlv: number): { gold: number; gear: number; dust: number; star: number } {
  return { gold: Math.round(40 * wlv * wlv), gear: wlv < 8 ? Math.ceil(wlv / 2) : 3, dust: wlv >= 5 ? Math.ceil((wlv - 3) / 2) : 0, star: wlv >= 12 ? wlv - 11 : 0 };
}

/** 지금 싸우는 동료의 무기를 한 단계 손질 */
export function upgradeWeapon(save: Save): boolean {
  if (save.weaponLv >= WEAPON_MAX) return false;
  const c = weaponCost(save.weaponLv);
  if (save.gold < c.gold || save.mats.gear < c.gear || save.mats.dust < c.dust || save.mats.star < c.star) return false;
  save.gold -= c.gold;
  save.mats.gear -= c.gear;
  save.mats.dust -= c.dust;
  save.mats.star -= c.star;
  save.weaponLv++;
  return true;
}
