/** 판을 멈추고 고르는 창: 보상 카드 · 밤 지도 갈림길 · 안개 속 사건 · 모루 (한 번에 하나만 뜬다) */
import { chooseReward, type GameState } from '../core/game.ts';
import { canForge, chooseEncounter, chooseForge, chooseRoute, forgeTarget } from '../core/route.ts';
import { hitTestFaces, weaponsOn } from './faceslots.ts';

export type PickKind = 'choice' | 'route' | 'encounter' | 'forge';

export function activePick(state: GameState): PickKind | null {
  if (state.encounter) return 'encounter';
  if (state.forging) return 'forge';
  if (state.route) return 'route';
  if (state.choice) return 'choice';
  return null;
}

/** 화면의 카드 칸 번호(0~2) → 고를 번호. 사건은 가운데 칸이 이야기라 고를 수 없고, 모루는 카드가 없다 */
export function pickIndexForCard(kind: PickKind, card: number): number | null {
  if (kind === 'forge') return null;
  if (kind !== 'encounter') return card;
  return card === 0 ? 0 : card === 2 ? 1 : null;
}

export function pickIndexForKey(kind: PickKind, key: string): number | null {
  if (kind === 'forge') return null;
  const i = ['1', '2', '3'].indexOf(key);
  if (i < 0 || (kind === 'encounter' && i > 1)) return null;
  return i;
}

/** 모루: 전장 좌표 p 의 탑 둘레 칸에 있는, 올릴 수 있는 무기 번호 */
export function forgeIndexAt(state: GameState, p: { x: number; y: number }): number | null {
  const hit = hitTestFaces(state.tower, state.config.tower.faceSlots, p.x, p.y);
  if (!hit) return null;
  const index = weaponsOn(state, hit.face)[hit.slot];
  return index !== undefined && canForge(state, index) ? index : null;
}

/** 모루: Enter 는 추천 무기 */
export function forgeKeyIndex(state: GameState, key: string): number | null {
  if (key !== 'Enter') return null;
  const w = forgeTarget(state);
  return w ? state.weapons.indexOf(w) : null;
}

export function choosePick(state: GameState, kind: PickKind, index: number): boolean {
  if (kind === 'choice') return chooseReward(state, index);
  if (kind === 'route') return chooseRoute(state, index);
  if (kind === 'forge') return chooseForge(state, index);
  return chooseEncounter(state, index);
}
