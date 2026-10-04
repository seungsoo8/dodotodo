/** 키보드 배치 (레퍼런스 게임 기준). e.code 를 써서 한글 입력 상태에서도 같은 키로 동작한다 */
import type { Vec } from '../core/geom.ts';

export type KeyAction =
  | 'attack'
  | 'roll'
  | 'skillA'
  | 'skillS'
  | 'skillD'
  | 'skillF'
  | 'potionHp'
  | 'potionSp'
  | 'menu'
  | 'back'
  | 'bag'
  | 'status'
  | 'skills'
  | 'quests'
  | 'up'
  | 'down'
  | 'left'
  | 'right';

const MAP: Record<string, KeyAction> = {
  KeyZ: 'attack',
  Enter: 'attack',
  Space: 'attack',
  NumpadEnter: 'attack',
  KeyX: 'roll',
  ShiftLeft: 'roll',
  ShiftRight: 'roll',
  KeyA: 'skillA',
  KeyS: 'skillS',
  KeyD: 'skillD',
  KeyF: 'skillF',
  KeyQ: 'potionHp',
  KeyW: 'potionSp',
  Escape: 'menu',
  Backspace: 'back',
  KeyI: 'bag',
  KeyE: 'bag',
  KeyC: 'status',
  KeyK: 'skills',
  KeyJ: 'quests',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function keyAction(code: string): KeyAction | null {
  return MAP[code] ?? null;
}

export function moveFromKeys(held: Set<string>): Vec {
  const x = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  const y = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  if (x && y) return { x: x * Math.SQRT1_2, y: y * Math.SQRT1_2 };
  return { x, y };
}
