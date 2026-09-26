import type { GameState } from '../core/game.ts';
import type { GameEvent } from '../core/types.ts';

/** 첫 판에서 한 번씩 배운 것 */
export interface TutorialProgress {
  bought: boolean;
  meteor: boolean;
  blizzard: boolean;
}

export interface Hint {
  title: string;
  text: string;
}

export function emptyProgress(): TutorialProgress {
  return { bought: false, meteor: false, blizzard: false };
}

/** 이벤트로 배운 것을 채운 새 진행 상태 */
export function updateProgress(p: TutorialProgress, events: GameEvent[]): TutorialProgress {
  const next = { ...p };
  for (const ev of events) {
    if (ev.kind === 'skill' && ev.id === 'meteor') next.meteor = true;
    if (ev.kind === 'skill' && ev.id === 'blizzard') next.blizzard = true;
    if (ev.kind === 'merge') next.bought = true;
  }
  return next;
}

/** 지금 보여 줄 안내. 급한 것부터 하나만 */
export function tutorialHint(state: GameState, p: TutorialProgress): Hint | null {
  if (state.enemies.some((e) => e.pattern?.phase === 'windup')) {
    return { title: '보스가 기를 모은다', text: 'W 눈보라로 얼리거나 메테오로 크게 때리면 끊긴다' };
  }
  if (!p.bought) return { title: '아래 상점에서 무기 사기', text: '카드 클릭 또는 1~4 · 산 무기는 탑이 알아서 쏜다' };
  const ones = new Map<string, number>();
  for (const w of state.weapons) if (w.level === 1) ones.set(w.def.id, (ones.get(w.def.id) ?? 0) + 1);
  if ([...ones.values()].some((n) => n === 2)) return { title: '하나만 더', text: '같은 무기 3개가 모이면 ★2 로 합쳐진다' };
  if (!p.meteor && state.enemies.filter((e) => e.hp > 0).length >= 4) {
    return { title: 'Q 메테오', text: '적이 몰린 곳에 마우스를 두고 Q' };
  }
  if (!p.blizzard && state.round >= 3) return { title: 'W 눈보라', text: '급할 때 모든 적을 3초 얼린다' };
  return null;
}
