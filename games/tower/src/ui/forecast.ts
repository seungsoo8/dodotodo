import { FACES, type Face, type WavePlan } from '../core/faces.ts';
import type { GameState } from '../core/game.ts';

/** 라운드가 끝나기 이만큼(초) 전부터 다음 라운드 방향을 크게 보여 준다 */
export const FORECAST_LEAD = 6;

function hasNextRound(state: GameState): boolean {
  return state.mode === 'endless' || state.round < state.config.totalRounds;
}

export function forecastVisible(state: GameState): boolean {
  if (state.status !== 'playing' || !hasNextRound(state)) return false;
  return state.config.roundSeconds - state.roundTime <= FORECAST_LEAD + 1e-9;
}

/** 오는 길과 비율(%), 많은 순 */
export function roadShares(plan: WavePlan): { face: Face; pct: number }[] {
  return FACES.filter((f) => plan[f] > 0)
    .map((face) => ({ face, pct: Math.round(plan[face] * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

/** 다음 라운드에 보스가 나오는가 */
export function nextIsBoss(state: GameState): boolean {
  const next = state.round + 1;
  const c = state.config;
  return state.mode === 'endless' ? next % c.endless.bossEvery === 0 : next === c.totalRounds;
}
