/** 키보드 배치. e.code 를 써서 한글 입력 상태에서도 같은 키로 동작한다 */
import type { Vec } from '../core/geom.ts';

export type KeyAction =
  | 'attack'
  | 'roll'
  | 'skillA'
  | 'skillS'
  | 'skillD'
  | 'skillF'
  | 'potionHp'
  | 'wind'
  | 'next'
  | 'hero1'
  | 'hero2'
  | 'hero3'
  | 'hero4'
  | 'menu'
  | 'back'
  | 'parts'
  | 'party'
  | 'book'
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
  KeyW: 'wind',
  KeyE: 'next',
  Digit1: 'hero1',
  Digit2: 'hero2',
  Digit3: 'hero3',
  Digit4: 'hero4',
  Numpad1: 'hero1',
  Numpad2: 'hero2',
  Numpad3: 'hero3',
  Numpad4: 'hero4',
  Escape: 'menu',
  Backspace: 'back',
  KeyI: 'parts',
  KeyC: 'party',
  KeyB: 'book',
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
