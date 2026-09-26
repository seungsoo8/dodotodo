import { ACHIEVEMENTS, checkAchievements, type AchievementDef } from './achievements.ts';
import type { DifficultyId, GameMode } from './config.ts';
import { SHOP_POOL } from './data.ts';
import type { GameState } from './game.ts';
import type { HeroId } from './heroes.ts';
import type { MetaState } from './meta.ts';
import type { WeaponType } from './types.ts';

/** 판이 끝났을 때 업적·보상 판정에 쓰는 결과 */
export interface RunReport {
  mode: GameMode;
  difficulty: DifficultyId;
  hero: HeroId | null;
  /** 클래식 승리 (무한 모드는 늘 false) */
  won: boolean;
  round: number;
  kills: number;
  /** 무기 계열별로 준 피해 (스킬·가시·시체 폭발은 빠짐) */
  weaponDamage: Record<WeaponType, number>;
  skillsUsed: number;
  bossesKilled: number;
  maxStar: number;
  /** 남은 체력 비율 (0~1) */
  hpRatio: number;
  gold: number;
}

export function buildRunReport(state: GameState): RunReport {
  const weaponDamage: Record<WeaponType, number> = { normal: 0, pierce: 0, magic: 0, siege: 0, chaos: 0 };
  for (const [id, dmg] of Object.entries(state.damageByWeapon)) {
    const item = SHOP_POOL.find((i) => i.id === id);
    if (item?.kind === 'weapon') weaponDamage[item.type] += dmg;
  }
  return {
    mode: state.mode,
    difficulty: state.difficulty,
    hero: state.hero,
    won: state.status === 'won',
    round: state.round,
    kills: state.kills,
    weaponDamage,
    skillsUsed: state.stats.skillsUsed,
    bossesKilled: state.stats.bossesKilled,
    maxStar: state.stats.maxStar,
    hpRatio: Math.max(0, state.tower.hp / state.tower.maxHp),
    gold: Math.floor(state.gold),
  };
}

/** 난이도별 별조각 배율 */
export const SHARD_MUL: Record<DifficultyId, number> = { easy: 0.7, normal: 1, hard: 1.5 };

/** 별조각 = 라운드×2 + 처치/40 + (클래식 승리 25 | 무한 보스당 15), 난이도 배율, 올림 */
export function shardsForRun(r: RunReport): number {
  let base = r.round * 2 + Math.floor(r.kills / 40);
  if (r.mode === 'classic' && r.won) base += 25;
  if (r.mode === 'endless') base += r.bossesKilled * 15;
  return Math.ceil(base * SHARD_MUL[r.difficulty]);
}

export interface RunReward {
  meta: MetaState;
  /** 판 결과로 받은 별조각 (업적 보상 빼고) */
  shards: number;
  /** 이번에 처음 얻은 업적 */
  achieved: AchievementDef[];
}

/** 판 결과를 영구 진행에 반영한 새 상태 */
export function finishRun(meta: MetaState, r: RunReport): RunReward {
  const shards = shardsForRun(r);
  const owned = new Set(meta.achievements);
  const achieved = checkAchievements(r, meta.heroWins)
    .filter((id) => !owned.has(id))
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id)!);
  const reward = achieved.reduce((sum, a) => sum + a.reward, 0);
  const heroWins = r.won && r.mode === 'classic' && r.hero && !meta.heroWins.includes(r.hero) ? [...meta.heroWins, r.hero] : meta.heroWins;
  return {
    shards,
    achieved,
    meta: {
      ...meta,
      shards: meta.shards + shards + reward,
      achievements: [...meta.achievements, ...achieved.map((a) => a.id)],
      heroWins,
      tutorialDone: true,
      runs: meta.runs + 1,
    },
  };
}
