/**
 * 3면 상자 조각 (윗면 · 앞면 · 옆면) 과 문짝 · 손잡이: 여러 갈래의 상자 모양 가구가 같이 쓴다.
 * W(나무) 글자로 적어 두고, 가구마다 재질 자리를 바꿔 칠한다 (swap).
 */
import { hs, nine, swap, vs } from './chapkit.ts';
import type { Grid } from './grid.ts';

/** 3면 상자의 윗면 (가로: 왼 2 · 오른 4 = 앞 끝 1 + 옆면 3, 세로: 뒤 2 · 가운데 1 · 앞 1) */
export const BOX_TOP: Grid = [
  '.VVVVVVVVv..',
  'VYYVVVVVVwv.',
  'VVVVVVVVVwwv',
  'VVVVVVVVVwwv',
];
/** 3면 상자의 앞면 (세로: 위 1 · 가운데 1 · 아래 2) */
export const BOX_FRONT: Grid = [
  'YVVVVVVVVwwv',
  'WWWWWWWWWwwv',
  'wwwwwwwwwwwv',
  '.vvvvvvvvvv.',
];
/** 문짝 (9-조각 2·2·2·3): 밝은 위 · 왼 테, 어두운 아래 · 오른 테, 가운데 판 */
export const DOOR: Grid = [
  'YYYYYYYV',
  'YVVVVVVw',
  'YVWWWWVw',
  'YVwwwwVw',
  'Vwwwwwww',
  'wvvvvvvv',
];
/** 쇠 손잡이 (가로 늘이기 1·1) */
export const KNOB: Grid = ['ITTs', 'sstt'];

/** 3면 상자 격자: 폭 w · 윗면 깊이 d · 앞면 높이 h (오른쪽 3칸이 옆면). 윗면 · 앞면 재질 자리를 따로 고른다 */
export function box(w: number, d: number, h: number, top = 'W', front = 'W'): string[] {
  const t = swap(hs(vs(BOX_TOP, d, 2, 1), w, 2, 4), 'W', top);
  const f = swap(hs(vs(BOX_FRONT, h, 1, 2), w, 2, 4), 'W', front);
  return [...t, ...f];
}
export const door = (w: number, h: number, slot = 'W'): string[] => swap(nine(DOOR, w, h, 2, 2, 2, 3), 'W', slot);
export const knob = (w: number): string[] => hs(KNOB, w, 1, 1);
