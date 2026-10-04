/** 정예 몬스터의 특수 성질 */
import type { Rng } from './rng.ts';

export type EliteAffix = 'fast' | 'armored' | 'vampire' | 'fire' | 'frost' | 'blink';

export const ELITE_AFFIX: Record<EliteAffix, { name: string; desc: string; color: string }> = {
  fast: { name: '재빠른', desc: '훨씬 빠르게 움직인다', color: '#9ad8ff' },
  armored: { name: '단단한', desc: '받는 피해가 줄어든다', color: '#c8d2dc' },
  vampire: { name: '흡혈', desc: '때리면 체력을 회복한다', color: '#ff6a8a' },
  fire: { name: '불꽃', desc: '지나간 자리에 불을 남긴다', color: '#ff8a3a' },
  frost: { name: '서리', desc: '쓰러질 때 얼음이 터진다', color: '#7ad0ff' },
  blink: { name: '순간이동', desc: '멀어지면 곁으로 건너온다', color: '#c8a0ff' },
};

export const ELITE_AFFIXES = Object.keys(ELITE_AFFIX) as EliteAffix[];

/** 서로 다른 성질 n 개 */
export function rollEliteAffixes(rng: Rng, n: number): EliteAffix[] {
  const pool = [...ELITE_AFFIXES];
  const out: EliteAffix[] = [];
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(rng.int(pool.length), 1)[0]);
  return out;
}

/** 성질 효과 수치 */
export const AFFIX = {
  fastSpeed: 1.55,
  armoredTaken: 0.55,
  /** 흡혈: 준 피해의 몇 배를 회복 */
  vampireHeal: 1.5,
  fireEvery: 0.4,
  blinkEvery: 3.5,
};
