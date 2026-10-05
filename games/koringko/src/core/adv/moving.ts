/**
 * 이삿날 밤에만 있는 소품 이름 (REDESIGN §3-1 · §8). houseMap(…, { era: 'past' }) 은 era 를 적지 않은 이 소품들을 저절로 뺀다.
 * 그림은 ui/art/moveProps.ts (이름이 모두 그려지는지 시험이 지킨다).
 */
export const MOVING_KINDS: readonly string[] = [
  'cartonS', 'cartonM', 'cartonL', 'cartonOpen', 'cartonHalf', 'rolledRug', 'sofaWrap', 'bookTied', 'bubbleWrap', 'dishWrap',
  'curtainPile', 'tapeBit', 'markerPen', 'frameGhost', 'dragMarks', 'newsSheet', 'trashBag',
];

const SET = new Set(MOVING_KINDS);

/** 가구 이름(꾸밈 옵션 포함 'cartonM:부엌')이 이삿짐 소품인가 */
export function isMovingKind(kind: string): boolean {
  return SET.has(kind.split(':')[0]);
}
