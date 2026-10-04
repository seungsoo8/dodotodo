/**
 * 장난감 부품 (재봉 토끼): 탐험대가 함께 쓰는 부품 칸에 끼운다.
 * 보통 부품 넷은 만들 수 있고 1~3 단계로 꿰매 올린다. 특별한 부품 다섯은 보스가 처음 쓰러질 때 하나씩 준다.
 */
import type { Bonus } from './stats.ts';
import type { MatId, Save } from './types.ts';

export const PART_MAX = 3;

export interface PartDef {
  name: string;
  desc: (lv: number) => string;
  /** 단계별 효과 */
  bonus?: (lv: number) => Bonus;
  /** 켜지는 능력 (특별한 부품) */
  power?: string;
  /** 재봉 토끼가 만들 수 있으면 재료 */
  craft?: { mats: Partial<Record<MatId, number>>; gold: number };
  /** 부품 그림 색 */
  color: string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const step = (a: number, b: number, c: number) => (lv: number) => [a, b, c][Math.max(0, Math.min(2, lv - 1))];

const BASIC: Record<string, Omit<PartDef, 'desc'> & { text: (v: number) => string; values: (lv: number) => number }> = {
  pin: { name: '날카로운 핀', color: '#c8d2dc', values: step(0.08, 0.12, 0.16), text: (v) => `공격력 +${pct(v)}`, bonus: (lv) => ({ atkPct: step(0.08, 0.12, 0.16)(lv) }), craft: { mats: { gear: 2 }, gold: 60 } },
  stuffing: { name: '솜 듬뿍', color: '#f4f0f8', values: step(0.1, 0.15, 0.2), text: (v) => `최대 HP +${pct(v)}`, bonus: (lv) => ({ hpPct: step(0.1, 0.15, 0.2)(lv) }), craft: { mats: { fluff: 4 }, gold: 40 } },
  cloth: { name: '두꺼운 천', color: '#c8a070', values: step(0.15, 0.25, 0.35), text: (v) => `방어 +${pct(v)}`, bonus: (lv) => ({ defPct: step(0.15, 0.25, 0.35)(lv) }), craft: { mats: { fluff: 3, gear: 1 }, gold: 60 } },
  spring: { name: '강철 스프링', color: '#a8b4c0', values: step(0.06, 0.09, 0.12), text: (v) => `공격 속도 +${pct(v)}`, bonus: (lv) => ({ aspd: step(0.06, 0.09, 0.12)(lv) }), craft: { mats: { gear: 3 }, gold: 80 } },
};

const SPECIAL: Record<string, { name: string; desc: string; color: string }> = {
  thunder: { name: '번개 단추', desc: '기본 공격이 맞으면 20% 확률로 번개가 떨어진다', color: '#ffe04a' },
  vampire: { name: '흡혈 실밥', desc: '적을 쓰러뜨리면 최대 HP 의 3% 회복', color: '#ff6a8a' },
  giant: { name: '거인의 솜', desc: '기본 공격 범위 +30%', color: '#e8e4dc' },
  phoenix: { name: '불사조 깃털', desc: '쓰러질 때 HP 50% 로 일어선다 (2분에 한 번)', color: '#ffb04a' },
  shockwave: { name: '충격파 태엽', desc: '구르기가 끝나면 주변을 터뜨린다', color: '#ffd84a' },
};

export const PARTS: Record<string, PartDef> = {
  ...Object.fromEntries(
    Object.entries(BASIC).map(([id, b]) => [id, { name: b.name, color: b.color, bonus: b.bonus, craft: b.craft, desc: (lv: number) => b.text(b.values(lv)) } satisfies PartDef]),
  ),
  ...Object.fromEntries(Object.entries(SPECIAL).map(([p, d]) => [`p_${p}`, { name: d.name, color: d.color, power: p, desc: () => d.desc } satisfies PartDef])),
};

export const BASIC_PARTS = Object.keys(BASIC);
export const SPECIAL_PARTS = Object.keys(SPECIAL).map((p) => `p_${p}`);

/** 부품 칸 수: 처음 3, 마을 단계마다 하나 (최대 6) */
export function partSlots(save: Save, villageLv = 1): number {
  return Math.min(6, 2 + Math.max(1, villageLv));
}

export function craftPart(save: Save, id: string): boolean {
  const p = PARTS[id];
  if (!p?.craft || save.parts[id]) return false;
  if (save.gold < p.craft.gold) return false;
  for (const [m, n] of Object.entries(p.craft.mats)) if (save.mats[m as MatId] < (n ?? 0)) return false;
  save.gold -= p.craft.gold;
  for (const [m, n] of Object.entries(p.craft.mats)) save.mats[m as MatId] -= n ?? 0;
  save.parts[id] = 1;
  return true;
}

/** 꿰매서 한 단계 올리는 비용 (지금 단계 lv) */
export function sewCost(id: string, lv: number): { gold: number; mats: Partial<Record<MatId, number>> } | null {
  const p = PARTS[id];
  if (!p?.craft || lv >= PART_MAX) return null;
  const mats: Partial<Record<MatId, number>> = {};
  for (const [m, n] of Object.entries(p.craft.mats)) mats[m as MatId] = (n ?? 0) * (lv + 1);
  mats.star = (mats.star ?? 0) + lv;
  return { gold: p.craft.gold * 3 * lv * lv, mats };
}

export function sewPart(save: Save, id: string): boolean {
  const lv = save.parts[id] ?? 0;
  if (!lv) return false;
  const c = sewCost(id, lv);
  if (!c || save.gold < c.gold) return false;
  for (const [m, n] of Object.entries(c.mats)) if (save.mats[m as MatId] < (n ?? 0)) return false;
  save.gold -= c.gold;
  for (const [m, n] of Object.entries(c.mats)) save.mats[m as MatId] -= n ?? 0;
  save.parts[id] = lv + 1;
  return true;
}

export function equipPart(save: Save, id: string, villageLv = 1): boolean {
  if (!save.parts[id] || save.slots.includes(id) || save.slots.length >= partSlots(save, villageLv)) return false;
  save.slots.push(id);
  return true;
}

export function unequipPart(save: Save, id: string): boolean {
  const i = save.slots.indexOf(id);
  if (i < 0) return false;
  save.slots.splice(i, 1);
  return true;
}

/** 낀 부품의 효과 합 */
export function partBonus(save: Save): Bonus {
  const out: Record<string, number> = {};
  for (const id of save.slots) {
    const b = PARTS[id]?.bonus?.(save.parts[id] ?? 1) ?? {};
    for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + (v as number);
  }
  return out as Bonus;
}

export function hasPartPower(save: Save, power: string): boolean {
  return save.slots.some((id) => PARTS[id]?.power === power);
}

/** 아직 없는 부품 하나 (정예 · 보물 상자) */
export function randomMissingPart(save: Save, r: number, special: boolean): string | null {
  const pool = (special ? SPECIAL_PARTS : BASIC_PARTS).filter((id) => !save.parts[id]);
  return pool.length ? pool[Math.floor(r * pool.length) % pool.length] : null;
}
