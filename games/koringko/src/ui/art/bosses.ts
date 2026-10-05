/**
 * 이야기 주민 다섯 (예전 보스): 곰 대장 · 젤리 대왕 · 깡 장군 · 더스티 · 먼지 왕.
 * 장난감(32×40)과 함께 서는 크기로 손찍기 격자에서 합성한다 (격자 · 합성은 residentsPx.ts).
 * 동작 여섯 장 (숨쉬기 둘 · 모으기 · 내리치기 · 맞기 · 고유 몸짓) × 단계 (화가 나면 모습이 바뀐다). 발은 어떤 동작에서도 같은 줄.
 */
import type { Pix } from './paint.ts';
import { bossPxSprite, type BossPosePx } from './residentsPx.ts';

export type BossPose = BossPosePx;
export const BOSS_POSES: BossPose[] = ['idle0', 'idle1', 'windup', 'strike', 'hurt', 'special'];
export const BOSS_IDS = ['b_bear', 'b_jelly', 'b_tin', 'b_dusty', 'b_king'];

const CACHE = new Map<string, Pix>();

/** 이야기 주민 그림 한 장 (외곽선 포함). phase: 1 · 2 · 3 */
export function bossSprite(id: string, pose: BossPose, phase: number): Pix {
  const key = `${id}${pose}${phase}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const p = bossPxSprite(id, pose, phase);
  CACHE.set(key, p);
  return p;
}
