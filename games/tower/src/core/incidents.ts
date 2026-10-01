/**
 * 매 판 다른 전개: 라운드 사건과 중간 장수(부관).
 * 사건은 한 라운드 전에 정해져 예보에 뜨고, 그 라운드 동안 적 구성·현상금·사거리를 바꾼다.
 */
import type { GameConfig, GameMode } from './config.ts';
import { FACES, type Face, type WavePlan } from './faces.ts';
import type { Rng } from './rng.ts';

export type IncidentId = 'bats' | 'fog' | 'golems' | 'thieves' | 'gold' | 'pincer';

export interface IncidentDef {
  name: string;
  desc: string;
  /** 이 라운드부터 나올 수 있다 */
  minRound: number;
}

export const INCIDENTS: Record<IncidentId, IncidentDef> = {
  gold: { name: '황금 웨이브', desc: '현상금 두 배', minRound: 2 },
  thieves: { name: '도둑 습격', desc: '도둑 고블린이 떼로 온다', minRound: 3 },
  fog: { name: '짙은 안개', desc: '무기 사거리가 줄고 다음 예보가 가려진다', minRound: 3 },
  bats: { name: '박쥐 떼의 밤', desc: '날아오는 박쥐가 가득 (공성 무기는 못 맞힌다)', minRound: 4 },
  pincer: { name: '양쪽 협공', desc: '마주 보는 두 길로 더 많이 온다', minRound: 4 },
  golems: { name: '골렘 행진', desc: '적은 적지만 모두 튼튼하다', minRound: 6 },
};

export const INCIDENT = {
  batShare: 0.6,
  thiefShare: 0.45,
  golemCountMul: 0.5,
  golemPool: ['golem', 'shield', 'orc'],
  pincerCountMul: 1.25,
  goldMul: 2,
  fogRangeMul: 0.8,
};

/** 중간 장수: 그 라운드 정예의 몇 배 */
export const OFFICER = {
  eliteMul: 5,
  /** 장수 공격력 대비 */
  atkMul: 0.35,
  bounty: 150,
  /** 장수보다 이만큼 작게 */
  radiusLess: 6,
};

/** 부관이 나오는 라운드인가 (장수 라운드는 아님) */
export function isOfficerRound(config: GameConfig, round: number, mode: GameMode): boolean {
  const every = config.waves.eliteEvery;
  if (every <= 0 || round % every !== 0) return false;
  return !isBossRound(config, round, mode);
}

export function isBossRound(config: GameConfig, round: number, mode: GameMode): boolean {
  return mode === 'endless' ? round % config.endless.bossEvery === 0 : round === config.totalRounds;
}

/** round 라운드의 사건 (없으면 null). 바로 전 라운드 사건은 빼고 */
export function rollIncident(config: GameConfig, round: number, mode: GameMode, rng: Rng, prev: IncidentId | null): IncidentId | null {
  if (round < 2 || isBossRound(config, round, mode) || isOfficerRound(config, round, mode)) return null;
  if (mode === 'classic' && round > config.totalRounds) return null;
  if (rng.next() >= config.incidents.chance) return null;
  const pool = (Object.keys(INCIDENTS) as IncidentId[]).filter((id) => INCIDENTS[id].minRound <= round && id !== prev);
  return pool.length ? pool[rng.int(pool.length)] : null;
}

const OPPOSITE: Record<Face, Face> = { n: 's', s: 'n', e: 'w', w: 'e' };

/** 협공: 가장 많이 오던 길과 그 맞은편으로 반반 */
export function pincerPlan(plan: WavePlan): WavePlan {
  const main = FACES.reduce((a, b) => (plan[b] > plan[a] ? b : a));
  const out: WavePlan = { n: 0, e: 0, s: 0, w: 0 };
  out[main] = 0.5;
  out[OPPOSITE[main]] = 0.5;
  return out;
}

/** 사건이 바꾸는 이번 라운드 적 수 배율 */
export function incidentCountMul(id: IncidentId | null): number {
  if (id === 'golems') return INCIDENT.golemCountMul;
  if (id === 'pincer') return INCIDENT.pincerCountMul;
  return 1;
}

/** 사건이 바꾸는 적 (바꾸지 않으면 null) */
export function incidentEnemyId(id: IncidentId | null, rng: Rng): string | null {
  switch (id) {
    case 'bats':
      return rng.next() < INCIDENT.batShare ? 'bat' : null;
    case 'thieves':
      return rng.next() < INCIDENT.thiefShare ? 'thief' : null;
    case 'golems':
      return INCIDENT.golemPool[rng.int(INCIDENT.golemPool.length)];
    default:
      return null;
  }
}
