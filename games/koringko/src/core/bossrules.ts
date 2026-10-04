/**
 * 보스마다 장난감다운 규칙:
 *   곰 대장 — 기술마다 태엽이 풀리고, 다 풀리면 멈춰서 크게 맞는다
 *   젤리 여왕 — 20% 마다 조각으로 쪼개지고, 조각이 돌아오면 다시 합쳐진다
 *   깡통 대장 — 자석으로 끌어당긴 뒤 둘레를 내려친다, 태엽 쥐 부하
 *   더스티 — 불을 꺼서 더 어둡게, 한 대에 터지는 먼지 분신
 *   먼지 왕 — 직접 "얼음!" 을 외친다 (움직이면 크게 다친다)
 */
import type { Monster } from './world.ts';

export const BEAR = { spring: 100, cost: 25, costP2: 20, unwound: 4, taken: 2 };
export const JELLY = { step: 0.2, blobs: 3, heal: 0.04, crawl: 45 };
export const TIN = { magnetWindup: 0.8, magnetTime: 1.6, pull: 80, slamR: 70 };
export const DUSTY = { lightsOut: 6 };
export const KING = { warn: 1.2, freeze: 2.5, hpLoss: 0.35 };

/** 받는 피해 배율 (태엽이 풀린 곰 대장) */
export function bossTakenMul(m: Monster): number {
  return m.boss && m.boss.unwound > 0 ? BEAR.taken : 1;
}
