import { FACE_INFO, FACES, faceOf, mainFace } from '../core/faces.ts';
import { faceWeaponCount, type GameState } from '../core/game.ts';
import type { GameEvent } from '../core/types.ts';
import { forecastVisible } from './forecast.ts';

/** 첫 판에서 한 번씩 배운 것 */
export interface TutorialProgress {
  bought: boolean;
  meteor: boolean;
  /** 면을 골라 보거나 무기를 옮겨 봤는지 */
  faced: boolean;
  /** 탑을 돌려 봤는지 */
  rotated: boolean;
}

export interface Hint {
  title: string;
  text: string;
}

export function emptyProgress(): TutorialProgress {
  return { bought: false, meteor: false, faced: false, rotated: false };
}

/** 이벤트로 배운 것을 채운 새 진행 상태 */
export function updateProgress(p: TutorialProgress, events: GameEvent[]): TutorialProgress {
  const next = { ...p };
  for (const ev of events) {
    if (ev.kind === 'skill' && ev.id === 'meteor') next.meteor = true;
    if (ev.kind === 'move') next.faced = true;
    if (ev.kind === 'rotate') next.rotated = true;
    if (ev.kind === 'merge') next.bought = true;
  }
  return next;
}

/** 지금 보여 줄 안내. 급한 것부터 하나만 */
export function tutorialHint(state: GameState, p: TutorialProgress): Hint | null {
  if (state.enemies.some((e) => e.pattern?.phase === 'windup')) {
    return { title: '보스가 기를 모은다', text: '그 길에 눈보라를 쓰거나 스킬로 크게 때리면 끊긴다' };
  }
  if (!p.bought) return { title: '아래 상점에서 무기 사기', text: '카드 클릭 또는 1~4 · 산 무기는 노란 부채꼴(고른 면) 쪽을 쏜다' };
  if (!p.faced) {
    const how = '방향키나 탑 옆 칸을 눌러 그 면을 고르고 사기';
    if (forecastVisible(state)) {
      const next = mainFace(state.nextPlan);
      if (faceWeaponCount(state, next) === 0) return { title: `다음 라운드는 ${FACE_INFO[next].label}쪽에서 몰려온다`, text: how };
    }
    const t = state.tower;
    const open = FACES.find(
      (f) => faceWeaponCount(state, f) === 0 && state.enemies.some((e) => e.hp > 0 && faceOf(e.x - t.x, e.y - t.y) === f),
    );
    if (open) return { title: `${FACE_INFO[open].label}쪽이 비었다`, text: how };
  }
  if (!p.rotated && (state.round >= 4 || state.enemies.some((e) => e.isBoss))) {
    return { title: '탑 돌리기', text: 'Z · X (또는 스킬 바 양옆 버튼) · 가장 센 면을 적이 몰린 쪽으로 휙 돌린다' };
  }
  const ones = new Map<string, number>();
  for (const w of state.weapons) if (w.level === 1) ones.set(w.def.id, (ones.get(w.def.id) ?? 0) + 1);
  if ([...ones.values()].some((n) => n === 2)) return { title: '하나만 더', text: '같은 무기 3개가 모이면 ★2 로 합쳐진다' };
  if (!p.meteor && state.enemies.filter((e) => e.hp > 0).length >= 4) {
    return { title: 'Q 메테오', text: '적이 몰린 곳에 마우스를 두고 Q' };
  }
  return null;
}
