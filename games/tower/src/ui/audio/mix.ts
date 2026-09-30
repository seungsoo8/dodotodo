import type { Face } from '../../core/faces.ts';

/** 좌우로 벌리는 정도 (1 이면 완전히 한쪽 스피커) */
export const PAN_WIDTH = 0.8;

/** 화면 x 위치 → 좌우 소리 위치 (-PAN_WIDTH ~ +PAN_WIDTH) */
export function panForX(x: number, width: number): number {
  const p = ((x - width / 2) / (width / 2)) * PAN_WIDTH;
  return Math.max(-PAN_WIDTH, Math.min(PAN_WIDTH, p));
}

/** 면 → 좌우 소리 위치 (서쪽은 왼쪽, 동쪽은 오른쪽) */
export function facePan(face: Face): number {
  return face === 'w' ? -PAN_WIDTH : face === 'e' ? PAN_WIDTH : 0;
}

/** 체력 비율 → 심장 박동 간격(초). 30% 이상이거나 무너졌으면 null */
export function heartbeatInterval(hpRatio: number): number | null {
  if (hpRatio >= 0.3 || hpRatio <= 0) return null;
  // 30% 에서 1초, 0% 에 가까울수록 0.45초
  return 0.45 + (hpRatio / 0.3) * 0.55;
}
