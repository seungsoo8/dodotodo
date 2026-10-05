/**
 * 밤의 시계 팔레트 (QUALITY C5): 장이 지날수록 달빛이 푸름 → 보라 → 분홍으로, 빛줄기는 더 비스듬하게,
 * 어둠(곱하기 색)은 한밤에 가장 깊고 새벽에 밝아진다. 화면과 무관한 계산만.
 */
import { clockLabel, DAWN, NIGHT_FIRST, parseClock } from '../../core/adv/clock.ts';
import type { RGB } from './light.ts';

export interface NightPalette {
  /** 달빛 (창 빛줄기 · 빛 웅덩이) 색 */
  moon: RGB;
  /** 방 어둠 색에 곱하는 배율 (채널마다, 0.8 ~ 1.25) */
  tint: readonly [number, number, number];
  /** 빛줄기 기울기 배율 (달이 낮아질수록 커짐) */
  slantK: number;
  /** 새벽 기운 0 (한밤) → 1 (05:00) */
  dawn: number;
  /** 0 (23:10) → 1 (05:00) */
  progress: number;
  label: string;
}

/** 시각 (이어지는 분) 별 색 멈춤점: 23:10 푸른 달 · 01:30 라벤더 · 03:30 보라 · 04:40 분홍 · 05:00 새벽 */
const STOPS: { t: string; moon: RGB; tint: [number, number, number] }[] = [
  { t: '23:10', moon: [150, 180, 255], tint: [1, 1, 1] },
  { t: '01:30', moon: [168, 168, 250], tint: [0.94, 0.92, 0.98] },
  { t: '03:30', moon: [196, 160, 236], tint: [0.96, 0.9, 1.0] },
  { t: '04:40', moon: [246, 176, 206], tint: [1.06, 0.97, 1.0] },
  { t: '05:00', moon: [255, 198, 184], tint: [1.18, 1.06, 1.0] },
];
const T = STOPS.map((s) => parseClock(s.t));

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export function nightPalette(min: number): NightPalette {
  const a = T[0];
  const b = T[T.length - 1];
  const m = Math.max(a, Math.min(b, Number.isFinite(min) ? min : a));
  let i = 0;
  while (i < T.length - 2 && m > T[i + 1]) i++;
  const u = T[i + 1] === T[i] ? 0 : (m - T[i]) / (T[i + 1] - T[i]);
  const s0 = STOPS[i];
  const s1 = STOPS[i + 1];
  const moon = [0, 1, 2].map((k) => Math.round(lerp(s0.moon[k], s1.moon[k], u))) as unknown as RGB;
  const tint = [0, 1, 2].map((k) => +lerp(s0.tint[k], s1.tint[k], u).toFixed(3)) as unknown as [number, number, number];
  const progress = (m - a) / (b - a);
  // 새벽 기운은 03:30 부터 오른다
  const d0 = parseClock('03:30');
  const dawn = m <= d0 ? 0 : Math.min(1, (m - d0) / (b - d0));
  return { moon, tint, slantK: +lerp(0.8, 1.4, progress).toFixed(3), dawn: +dawn.toFixed(3), progress, label: clockLabel(m) };
}

/** 장의 시각 · 방 → 팔레트. 시계가 없는 장(서장 · 에필로그)이나 기억 방(m_…)은 null */
export function chapterPalette(clock: string | undefined, roomId: string): NightPalette | null {
  if (!clock || roomId.startsWith('m_')) return null;
  const m = parseClock(clock);
  if (Number.isNaN(m)) return null;
  return nightPalette(m);
}

/** 달빛(moon) 빛줄기 · 웅덩이에 팔레트 색 · 기울기를 입힌다 (팔레트가 없으면 그대로) */
export function tintLights<T extends { color: RGB; slant: number; moon?: boolean }>(ls: readonly T[], p: NightPalette | null): T[] {
  if (!p) return [...ls];
  return ls.map((l) => (l.moon ? { ...l, color: p.moon, slant: Math.round(l.slant * p.slantK) } : l));
}

/** 방 어둠(곱하기 색)에 팔레트 tint 를 곱한다 */
export function tintAmbient(a: RGB, p: NightPalette | null): RGB {
  if (!p) return a;
  return [0, 1, 2].map((k) => Math.max(0, Math.min(255, Math.round(a[k] * p.tint[k])))) as unknown as RGB;
}

export { NIGHT_FIRST, DAWN };
