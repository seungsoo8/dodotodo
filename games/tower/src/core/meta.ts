import type { DifficultyId } from './config.ts';
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
  /** 연습 판을 끝냈거나 건너뛰었는지 */
  lessonDone: boolean;
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
};

/** 없앤 강화와 단계별 값 (예전에 산 별조각을 돌려주려고 남겨 둔다) */
const RETIRED: Record<string, number[]> = {
  income: [20, 45, 80],
  skill_cd: [15, 35, 60],
};

export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: 'start_gold', name: '비상금', desc: `시작 골드 +${META.startGold}`, kind: 'stat', costs: [10, 20, 35, 55, 80] },
  { id: 'max_hp', name: '두꺼운 성벽', desc: `탑 최대 체력 +${META.maxHp}`, kind: 'stat', costs: [10, 20, 35, 55, 80] },
  { id: 'power', name: '대장간', desc: `모든 무기 피해 +${META.damage * 100}%`, kind: 'stat', costs: [15, 30, 50, 75, 110] },
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
  return { shards: 0, levels: {}, achievements: [], heroWins: [], tutorialDone: false, lessonDone: false, runs: 0 };
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

/** 없앤 강화에 썼던 별조각을 돌려주고 그 단계를 지운 새 상태 */
export function refundRetired(meta: MetaState): MetaState {
  let refund = 0;
  const levels: Record<string, number> = {};
  for (const [id, lv] of Object.entries(meta.levels)) {
    const costs = RETIRED[id];
    if (costs) refund += costs.slice(0, lv).reduce((a, b) => a + b, 0);
    else levels[id] = lv;
  }
  return refund === 0 && Object.keys(levels).length === Object.keys(meta.levels).length ? meta : { ...meta, shards: meta.shards + refund, levels };
}

/** 시작 화면에서 먼저 골라 둘 난이도: 첫 판은 쉬움 */
export function suggestedDifficulty(meta: MetaState): DifficultyId {
  return meta.runs === 0 ? 'easy' : 'normal';
}

export function heroUnlocked(meta: MetaState, hero: HeroId): boolean {
  return hero === 'guardian' || metaLevel(meta, `hero_${hero}`) > 0;
}

/** 게임을 만들 때 더해지는 영구 효과 */
export interface MetaBonuses {
  startGold: number;
  maxHp: number;
  damage: number;
  /** 아직 해금하지 않은 상점 아이템 */
  lockedItems: string[];
}

export function metaBonuses(meta: MetaState): MetaBonuses {
  const lv = (id: string) => metaLevel(meta, id);
  return {
    startGold: META.startGold * lv('start_gold'),
    maxHp: META.maxHp * lv('max_hp'),
    damage: META.damage * lv('power'),
    lockedItems: LEGENDARY_WEAPONS.map((w) => w.id).filter((id) => lv(`weapon_${id}`) === 0),
  };
}
