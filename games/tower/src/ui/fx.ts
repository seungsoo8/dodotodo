import type { Rng } from '../core/rng.ts';
import type { Point } from '../core/types.ts';

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 처음에 빠르고 끝에서 부드럽게 멈춤 */
export function easeOutCubic(t: number): number {
  const u = 1 - clamp01(t);
  return 1 - u * u * u;
}

/** 목표를 살짝 넘었다가 돌아옴 (튕기듯 나타나는 연출) */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = clamp01(t) - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
}

/** 0~1 의 고정 난수 (같은 입력이면 같은 값) */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** 화면 흔들림 오프셋. 폭은 duration 동안 intensity → 0 으로 줄어든다. */
export function shakeOffset(intensity: number, elapsed: number, duration: number, seed: number): Point {
  const k = 1 - elapsed / duration;
  if (k <= 0) return { x: 0, y: 0 };
  const frame = Math.floor(elapsed * 60);
  const amp = intensity * k;
  return {
    x: amp * (hash(seed * 997 + frame) * 2 - 1),
    y: amp * (hash(seed * 991 + frame + 0.5) * 2 - 1),
  };
}

/** from → to 로 이어지는 지그재그 번개. 중간 점만 선에 수직으로 ±jitter 흔든다. */
export function lightningPath(from: Point, to: Point, segments: number, jitter: number, rng: Rng): Point[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const points: Point[] = [{ ...from }];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const off = rng.range(-jitter, jitter);
    points.push({ x: from.x + dx * t + nx * off, y: from.y + dy * t + ny * off });
  }
  points.push({ ...to });
  return points;
}

/** 진행도 t 에서 투사체 위치. arc 만큼 포물선으로 떠오른다 (화면 위쪽 = y 감소). */
export function projectilePos(from: Point, to: Point, t: number, arc: number): Point {
  const p = clamp01(t);
  if (p === 0) return { ...from };
  if (p === 1) return { ...to };
  return {
    x: lerp(from.x, to.x, p),
    y: lerp(from.y, to.y, p) - arc * 4 * p * (1 - p),
  };
}

/** 12345 → '12.3k', 2500000 → '2.5M' */
export function formatNumber(n: number): string {
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, '');
  if (Math.round(n) < 1000) return String(Math.round(n));
  if (n < 1_000_000) return `${trim(n / 1000)}k`;
  return `${trim(n / 1_000_000)}M`;
}

/** 탑 체력 비율 → 화면 가장자리 붉은 테두리 진하기 */
export function vignetteAlpha(hpRatio: number): number {
  const start = 0.35;
  if (hpRatio >= start) return 0;
  return 0.5 * (1 - Math.max(0, hpRatio) / start);
}

export interface SkyInput {
  round: number;
  roundTime: number;
  roundSeconds: number;
  totalRounds: number;
  mode: 'classic' | 'endless';
}

export interface Sky {
  /** 0 = 한낮, 1 = 한밤 */
  night: number;
  /** 노을 세기 (중반에 가장 짙다) */
  dusk: number;
}

/** 라운드 진행에 따라 낮 → 노을 → 밤. 무한 모드는 totalRounds 마다 다시 아침 */
export function skyAt(s: SkyInput): Sky {
  const span = Math.max(1, s.totalRounds - 1);
  const round = s.mode === 'endless' ? ((s.round - 1) % s.totalRounds) + 1 : s.round;
  const p = clamp01((round - 1 + s.roundTime / s.roundSeconds) / span);
  return {
    night: clamp01((p - 0.6) / 0.3),
    dusk: clamp01(1 - Math.abs(p - 0.62) / 0.25),
  };
}
