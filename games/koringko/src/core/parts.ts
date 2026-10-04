/**
 * 장난감 부품 (재봉 토끼): 탐험대가 함께 쓰는 부품 칸에 끼운다.
 * 보통 부품은 만들 수 있고 1~3 단계로 꿰매 올린다. 특별한 부품은 능력을 하나 켜고 보스 · 보물 상자 · 정예에서 나온다.
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
  buttoneye: { name: '단추 눈', color: '#2a1e2e', values: step(4, 6, 8), text: (v) => `치명타 +${v}%`, bonus: (lv) => ({ crit: step(4, 6, 8)(lv) }), craft: { mats: { sugar: 2, gear: 1 }, gold: 80 } },
  rubber: { name: '고무줄', color: '#ff8ab8', values: step(0.06, 0.09, 0.12), text: (v) => `이동 속도 +${pct(v)}`, bonus: (lv) => ({ msPct: step(0.06, 0.09, 0.12)(lv) }), craft: { mats: { sugar: 2 }, gold: 50 } },
  windkey: { name: '태엽 열쇠', color: '#ffd84a', values: step(0.3, 0.45, 0.6), text: (v) => `태엽 감기는 속도 +${pct(v)}`, bonus: (lv) => ({ windPct: step(0.3, 0.45, 0.6)(lv) }), craft: { mats: { gear: 2, dust: 1 }, gold: 90 } },
  marble: { name: '반짝 구슬', color: '#7ad0ff', values: step(10, 15, 20), text: (v) => `스킬 피해 +${v}%`, bonus: (lv) => ({ skillPct: step(10, 15, 20)(lv) }), craft: { mats: { dust: 3 }, gold: 100 } },
  thread: { name: '빨간 실', color: '#e8414f', values: step(0.01, 0.02, 0.03), text: (v) => `준 피해의 ${pct(v)} 회복`, bonus: (lv) => ({ leech: step(0.01, 0.02, 0.03)(lv) }), craft: { mats: { fluff: 2, dust: 2 }, gold: 100 } },
  clover: { name: '행운 클로버', color: '#8ae070', values: step(15, 25, 35), text: (v) => `단추 +${v}%`, bonus: (lv) => ({ goldPct: step(15, 25, 35)(lv) }), craft: { mats: { sugar: 3 }, gold: 60 } },
  hourglass: { name: '모래시계 조각', color: '#e8c27c', values: step(0.05, 0.08, 0.12), text: (v) => `재사용 대기 -${pct(v)}`, bonus: (lv) => ({ cdr: step(0.05, 0.08, 0.12)(lv) }), craft: { mats: { dust: 3, star: 1 }, gold: 150 } },
  bandage: { name: '반창고', color: '#ffcf9a', values: step(0.003, 0.005, 0.008), text: (v) => `초당 최대 HP 의 ${(v * 100).toFixed(1)}% 회복`, bonus: (lv) => ({ regenPct: step(0.003, 0.005, 0.008)(lv) }), craft: { mats: { fluff: 3, sugar: 1 }, gold: 70 } },
};

const SPECIAL: Record<string, { name: string; desc: string; color: string }> = {
  thunder: { name: '번개 단추', desc: '기본 공격이 맞으면 20% 확률로 번개가 떨어진다', color: '#ffe04a' },
  vampire: { name: '흡혈 실밥', desc: '적을 쓰러뜨리면 최대 HP 의 3% 회복', color: '#ff6a8a' },
  swift: { name: '질풍 태엽', desc: '구르고 나면 2초 동안 공격 속도 +40%', color: '#9ad8ff' },
  giant: { name: '거인의 솜', desc: '기본 공격 범위 +30%', color: '#e8e4dc' },
  phoenix: { name: '불사조 깃털', desc: '쓰러질 때 HP 50% 로 일어선다 (2분에 한 번)', color: '#ffb04a' },
  star: { name: '별의 축복', desc: '스킬을 쓰면 25% 확률로 태엽을 돌려받는다', color: '#c890ff' },
  shockwave: { name: '충격파 태엽', desc: '구르기가 끝나면 주변을 터뜨린다', color: '#ffd84a' },
  chill: { name: '서리 발톱', desc: '기본 공격이 적을 느리게 한다', color: '#7ad0ff' },
  thorns: { name: '가시 솜', desc: '몬스터에게 맞으면 그 몬스터에게 공격력의 200% 피해', color: '#8ae070' },
  frenzy: { name: '광란의 단추', desc: '적을 쓰러뜨리면 3초 동안 공격 속도 +25%', color: '#ff6a4a' },
  orbit: { name: '별 위성', desc: '별 두 개가 둘레를 돌며 닿는 적을 친다', color: '#ffe07a' },
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
