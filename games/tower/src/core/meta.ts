import { LEGENDARY_WEAPONS } from './data.ts';
import { findHero, type HeroId } from './heroes.ts';

/** 판과 판 사이에 남는 영구 진행 (저장된다) */
export interface MetaState {
  /** 별조각: 영구 강화에 쓰는 재화 */
  shards: number;
  /** 강화 id → 단계 */
  levels: Record<string, number>;
  /** 얻은 업적 id */
  achievements: string[];
  /** 클래식에서 이겨 본 탑 id */
  heroWins: string[];
  tutorialDone: boolean;
  runs: number;
}

export interface MetaUpgradeDef {
  id: string;
  name: string;
  desc: string;
  kind: 'stat' | 'hero' | 'weapon';
  /** 단계별 값 (길이 = 최고 단계) */
  costs: number[];
}

/** 단계당 효과 */
export const META = {
  startGold: 40,
  maxHp: 80,
  damage: 0.04,
  income: 1,
  skillCooldown: 0.08,
};

export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: 'start_gold', name: '비상금', desc: `시작 골드 +${META.startGold}`, kind: 'stat', costs: [10, 20, 35, 55, 80] },
  { id: 'max_hp', name: '두꺼운 성벽', desc: `탑 최대 체력 +${META.maxHp}`, kind: 'stat', costs: [10, 20, 35, 55, 80] },
  { id: 'power', name: '대장간', desc: `모든 무기 피해 +${META.damage * 100}%`, kind: 'stat', costs: [15, 30, 50, 75, 110] },
  { id: 'income', name: '세금', desc: `초당 골드 +${META.income}`, kind: 'stat', costs: [20, 45, 80] },
  { id: 'skill_cd', name: '명상', desc: `스킬 재사용 대기 -${META.skillCooldown * 100}%`, kind: 'stat', costs: [15, 35, 60] },
  ...(
    [
      ['archer', 30],
      ['mage', 40],
      ['fortress', 50],
      ['gambler', 60],
    ] as [HeroId, number][]
  ).map(([id, cost]): MetaUpgradeDef => ({ id: `hero_${id}`, name: findHero(id).name, desc: findHero(id).desc, kind: 'hero', costs: [cost] })),
  ...LEGENDARY_WEAPONS.map(
    (w, i): MetaUpgradeDef => ({ id: `weapon_${w.id}`, name: w.name, desc: `상점에 등장 · ${w.desc}`, kind: 'weapon', costs: [70 + i * 10] }),
  ),
];

export function emptyMeta(): MetaState {
  return { shards: 0, levels: {}, achievements: [], heroWins: [], tutorialDone: false, runs: 0 };
}

export function metaLevel(meta: MetaState, id: string): number {
  return meta.levels[id] ?? 0;
}

/** 다음 단계 값. 최고 단계이거나 없는 강화면 null */
export function nextCost(meta: MetaState, id: string): number | null {
  const def = META_UPGRADES.find((u) => u.id === id);
  if (!def) return null;
  return def.costs[metaLevel(meta, id)] ?? null;
}

/** 한 단계 올린 새 상태. 살 수 없으면 null */
export function buyMetaUpgrade(meta: MetaState, id: string): MetaState | null {
  const cost = nextCost(meta, id);
  if (cost === null || meta.shards < cost) return null;
  return { ...meta, shards: meta.shards - cost, levels: { ...meta.levels, [id]: metaLevel(meta, id) + 1 } };
}

export function heroUnlocked(meta: MetaState, hero: HeroId): boolean {
  return hero === 'guardian' || metaLevel(meta, `hero_${hero}`) > 0;
}

/** 게임을 만들 때 더해지는 영구 효과 */
export interface MetaBonuses {
  startGold: number;
  maxHp: number;
  damage: number;
  income: number;
  skillCooldownMul: number;
  /** 아직 해금하지 않은 상점 아이템 */
  lockedItems: string[];
}

export function metaBonuses(meta: MetaState): MetaBonuses {
  const lv = (id: string) => metaLevel(meta, id);
  return {
    startGold: META.startGold * lv('start_gold'),
    maxHp: META.maxHp * lv('max_hp'),
    damage: META.damage * lv('power'),
    income: META.income * lv('income'),
    skillCooldownMul: 1 - META.skillCooldown * lv('skill_cd'),
    lockedItems: LEGENDARY_WEAPONS.map((w) => w.id).filter((id) => lv(`weapon_${id}`) === 0),
  };
}
