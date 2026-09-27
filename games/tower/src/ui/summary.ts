import { SHOP_POOL } from '../core/data.ts';
import { PERKS } from '../core/perks.ts';
import { ALL_SKILLS, COMBOS } from '../core/skills.ts';

export interface DamageRow {
  id: string;
  name: string;
  damage: number;
  percent: number;
}

function sourceName(id: string): string {
  if (id === 'thorns') return '가시';
  return [...SHOP_POOL, ...ALL_SKILLS, ...COMBOS, ...PERKS].find((i) => i.id === id)?.name ?? id;
}

/** 피해가 큰 순서로 n 개 (비율은 전체 대비 %, 정수) */
export function topDamage(damageByWeapon: Record<string, number>, n: number): DamageRow[] {
  const entries = Object.entries(damageByWeapon).filter(([, d]) => d > 0);
  const total = entries.reduce((sum, [, d]) => sum + d, 0);
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, damage]) => ({ id, name: sourceName(id), damage, percent: Math.round((damage / total) * 100) }));
}

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
