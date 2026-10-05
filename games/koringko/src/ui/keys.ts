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

/** 대각선에서 한 키를 먼저 뗀 뒤 이만큼은 대각선을 유지한다 (초) */
export const DIAGONAL_GRACE = 0.08;

/**
 * 키보드 이동 다듬기: 두 키를 거의 같이 떼도 대각선을 바라본 채 멈추게.
 * 남은 키가 대각선의 한쪽 성분이면 잠깐 대각선을 유지하고, 오래 누르거나 다른 쪽으로 꺾으면 바로 따른다.
 */
export class MoveSmoother {
  private diag: Vec | null = null;
  private since = -1;

  step(raw: Vec, now: number): Vec {
    if (raw.x !== 0 && raw.y !== 0) {
      this.diag = raw;
      this.since = -1;
      return raw;
    }
    const d = this.diag;
    if (d && (raw.x !== 0 || raw.y !== 0) && (raw.x === 0 || Math.sign(raw.x) === Math.sign(d.x)) && (raw.y === 0 || Math.sign(raw.y) === Math.sign(d.y))) {
      if (this.since < 0) this.since = now;
      if (now - this.since < DIAGONAL_GRACE) return d;
    }
    this.diag = null;
    this.since = -1;
    return raw;
  }
}
