/** 난이도: 몬스터 체력 · 공격력 · 보상 배율 */
import type { Game } from './game.ts';
import type { Difficulty } from './types.ts';

export const DIFFICULTY: Record<Difficulty, { name: string; desc: string; hp: number; atk: number; reward: number }> = {
  easy: { name: '쉬움', desc: '이야기를 편하게 즐기고 싶을 때', hp: 0.7, atk: 0.6, reward: 0.9 },
  normal: { name: '보통', desc: '피하고 노려야 이기는 기본 난이도', hp: 1.25, atk: 1.6, reward: 1 },
  hard: { name: '어려움', desc: '한 번의 실수가 아픈 난이도. 경험치 · 골드 1.5배', hp: 1.8, atk: 2.4, reward: 1.5 },
};

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** 난이도를 바꾼다 (지금 지도에서 새로 나오는 몬스터부터) */
export function setDifficulty(g: Game, d: Difficulty): void {
  g.save.difficulty = d;
  applyDifficulty(g);
}

export function applyDifficulty(g: Game): void {
  const D = DIFFICULTY[g.save.difficulty] ?? DIFFICULTY.normal;
  g.world.mods = { hp: D.hp, atk: D.atk };
}
