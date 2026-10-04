/**
 * 탐험대 손발 맞추기:
 *   교대 연계 — 바꿔 든 뒤 잠깐 동안 첫 스킬은 태엽이 들지 않고 더 세다
 *   합동 기술 — 스킬을 쓰자마자 바꿔 들면 두 동료가 함께 큰 기술
 *   태엽 풀림 — 태엽이 바닥나면 잠깐 느려진다 (다시 감으면 또 일어날 수 있다)
 */
import type { HeroId } from './types.ts';

export const LINK = { time: 3, skillPct: 60, buff: 1.2 };
export const DUO = { window: 1.5, mult: 2.5, r: 84, stun: 0.6 };
export const UNWOUND = { slow: 0.6, time: 2, rearm: 20 };

const DUO_NAME: Record<string, string> = {
  'bori+toby': '솜털 도끼 회오리',
  'ruru+toby': '바람 칼 화살',
  'nabi+toby': '별빛 베기',
  'bori+ruru': '땅울림 화살비',
  'bori+nabi': '얼음 도끼 쿵',
  'nabi+ruru': '별똥 화살',
};

/** 두 동료의 합동 기술 이름 */
export function duoName(a: HeroId, b: HeroId): string {
  return DUO_NAME[[a, b].sort().join('+')] ?? '합동 기술';
}
