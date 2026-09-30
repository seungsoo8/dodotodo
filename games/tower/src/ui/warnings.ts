import type { Face } from '../core/faces.ts';
import { faceWeaponCount, type GameState } from '../core/game.ts';
import type { GameEvent } from '../core/types.ts';

/** 같은 면의 "비었다" 알림 사이 최소 간격(초) */
export const EMPTY_WARN_COOLDOWN = 4;

/** 이번 이벤트 중 무기가 없는 면으로 맞은 면 (면마다 한 번, 맞은 순서대로) */
export function emptyFaceHits(state: GameState, events: GameEvent[]): Face[] {
  const faces: Face[] = [];
  for (const ev of events) {
    if (ev.kind !== 'towerHit' || faces.includes(ev.face)) continue;
    if (faceWeaponCount(state, ev.face) === 0) faces.push(ev.face);
  }
  return faces;
}

/** 이 면을 지금 알려도 되는가 (방금 알렸으면 참는다) */
export function shouldWarn(last: Partial<Record<Face, number>>, face: Face, now: number): boolean {
  const at = last[face];
  return at === undefined || now - at >= EMPTY_WARN_COOLDOWN - 1e-9;
}
