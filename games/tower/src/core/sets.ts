import type { GameConfig } from './config.ts';
import type { GameState } from './game.ts';
import type { WeaponBehavior, WeaponDef, WeaponType } from './types.ts';

/** 세트 보너스·강화까지 반영한 무기의 실제 능력치 */
export interface WeaponStats {
  damage: number;
  cooldown: number;
  range: number;
  behavior: WeaponBehavior;
  chaosMin: number;
  chaosMax: number;
}

export const WEAPON_TYPES: WeaponType[] = ['normal', 'pierce', 'magic', 'siege', 'chaos'];

/** 2단계 특수 효과 설명 (화면 표시용) */
export const SET_SPECIALS: Record<WeaponType, string> = {
  normal: '공격 속도 +25%',
  pierce: '사거리 +40',
  magic: '연쇄 +2회 · 둔화 +1초',
  siege: '폭발 반경 ×1.3',
  chaos: '피해 하한 100%',
};

export function setTier(config: GameConfig, count: number): 0 | 1 | 2 {
  const [t1, t2] = config.sets.thresholds;
  if (count >= t2) return 2;
  if (count >= t1) return 1;
  return 0;
}

export function weaponCounts(state: GameState): Record<WeaponType, number> {
  const counts: Record<WeaponType, number> = { normal: 0, pierce: 0, magic: 0, siege: 0, chaos: 0 };
  for (const w of state.weapons) counts[w.def.type]++;
  return counts;
}

export function effectiveWeapon(
  state: GameState,
  def: WeaponDef,
  counts: Record<WeaponType, number> = weaponCounts(state),
): WeaponStats {
  const { config, tower } = state;
  const tier = setTier(config, counts[def.type]);
  const full = tier === 2;
  const setBonus = tier === 0 ? 0 : config.sets.damageBonus[tier - 1];

  let behavior = def.behavior;
  if (full && behavior.kind === 'chain') behavior = { ...behavior, jumps: behavior.jumps + 2 };
  if (full && behavior.kind === 'slow') behavior = { ...behavior, duration: behavior.duration + 1 };
  if (full && behavior.kind === 'splash') behavior = { ...behavior, radius: behavior.radius * 1.3 };

  const speed = tower.attackSpeedMul * (full && def.type === 'normal' ? 1.25 : 1);
  return {
    damage: def.damage * tower.damageMul * (1 + setBonus),
    cooldown: def.cooldown / speed,
    range: def.range + tower.rangeBonus + (full && def.type === 'pierce' ? 40 : 0),
    behavior,
    chaosMin: full && def.type === 'chaos' ? 1 : config.chaosRange[0],
    chaosMax: config.chaosRange[1],
  };
}
