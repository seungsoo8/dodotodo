import type { MetaState } from '../core/meta.ts';

/**
 * 타이틀 화면 연출 (초).
 * 길잡이별이 떨어져 번쩍 → 잿빛 안개가 차오름 → 탑 등불이 켜지며 로고 → "눌러 시작"
 */
export const SPLASH = {
  /** 별이 떨어지는 시간 */
  fall: 1.4,
  /** 떨어진 뒤 번쩍임이 사그라드는 시간 */
  burst: 0.6,
  /** 로고가 떠오르기 시작하는 때 (안개가 다 차오른 때) */
  logoAt: 2.4,
  logoIn: 0.8,
  /** "눌러 시작" 이 나오는 때 */
  promptAt: 3.2,
};

export interface SplashFrame {
  /** 별이 떨어진 정도 0~1 */
  fall: number;
  /** 번쩍임 1~0 (떨어지기 전 0) */
  burst: number;
  /** 안개 0~1 */
  fog: number;
  /** 로고 0~1 */
  logo: number;
  prompt: boolean;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function splashFrame(t: number): SplashFrame {
  const after = t - SPLASH.fall;
  return {
    fall: clamp01(t / SPLASH.fall),
    burst: after < 0 ? 0 : clamp01(1 - after / SPLASH.burst),
    fog: after < 0 ? 0 : clamp01(after / (SPLASH.logoAt - SPLASH.fall)),
    logo: clamp01((t - SPLASH.logoAt) / SPLASH.logoIn),
    prompt: t >= SPLASH.promptAt,
  };
}

/** 누름: 연출 중이면 끝으로 건너뛰고, 다 떴으면 시작 */
export function splashPress(t: number): { kind: 'skip'; t: number } | { kind: 'start' } {
  return t < SPLASH.promptAt ? { kind: 'skip', t: SPLASH.promptAt } : { kind: 'start' };
}

/** 타이틀 다음: 처음이면 튜토리얼, 아니면 메뉴 */
export function afterSplash(meta: MetaState): 'lesson' | 'menu' {
  return meta.lessonDone ? 'menu' : 'lesson';
}
