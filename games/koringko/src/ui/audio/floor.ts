/** 발소리 바닥 정하기: 장난감 방은 toy, 사람 크기 방은 꾸밈(look)의 바닥 */
import { LOOKS } from '../art/house.ts';
import type { Floor } from './storysfx.ts';

export function floorOf(room: { scale: 'toy' | 'human'; look?: string }): Floor {
  if (room.scale === 'toy') return 'toy';
  const k = LOOKS[room.look ?? '']?.floorKind;
  if (!k || k === 'wood') return 'wood';
  return k === 'lino' ? 'tile' : k;
}
