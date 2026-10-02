/** 판을 멈추고 고르는 창: 보상 카드 · 밤 지도 갈림길 · 안개 속 사건 (한 번에 하나만 뜬다) */
import { chooseReward, type GameState } from '../core/game.ts';
import { chooseEncounter, chooseRoute } from '../core/route.ts';

export type PickKind = 'choice' | 'route' | 'encounter';

export function activePick(state: GameState): PickKind | null {
  if (state.encounter) return 'encounter';
  if (state.route) return 'route';
  if (state.choice) return 'choice';
  return null;
}

/** 화면의 카드 칸 번호(0~2) → 고를 번호. 사건은 가운데 칸이 이야기라 고를 수 없다 */
export function pickIndexForCard(kind: PickKind, card: number): number | null {
  if (kind !== 'encounter') return card;
  return card === 0 ? 0 : card === 2 ? 1 : null;
}

export function pickIndexForKey(kind: PickKind, key: string): number | null {
  const i = ['1', '2', '3'].indexOf(key);
  if (i < 0 || (kind === 'encounter' && i > 1)) return null;
  return i;
}

export function choosePick(state: GameState, kind: PickKind, index: number): boolean {
  if (kind === 'choice') return chooseReward(state, index);
  if (kind === 'route') return chooseRoute(state, index);
  return chooseEncounter(state, index);
}
