/**
 * 새 기능을 처음 만났을 때 한 번씩 짧게 알려 준다 (궁극기 · 직접 때리기 · 밤 지도 · 사건 · 부관 · 모루).
 * 본 안내는 저장해 두고 다시 보여 주지 않는다. 게임 초기화를 하면 처음부터.
 */
import type { GameState } from '../core/game.ts';
import type { GameEvent } from '../core/types.ts';
import { ultReady } from '../core/ultimate.ts';
import { forecastVisible, nextBig, nextIncidentShown } from './forecast.ts';
import { INTRO_KEY, type StorageLike } from './records.ts';

export type IntroId = 'route' | 'encounter' | 'forge' | 'officer' | 'incident' | 'ult' | 'tap';

export const INTROS: Record<IntroId, { title: string; text: string }> = {
  route: { title: '밤 지도', text: '3라운드마다 갈 길을 하나 고른다 · 모루로 무기를 키우거나, 상인·모닥불·도박·사건 중 지금 필요한 것을' },
  encounter: { title: '안개 속 사건', text: '두 갈래 중 하나를 고른다 · 무언가를 내주면 무언가를 얻는다' },
  forge: { title: '모루', text: '탑 둘레의 무기를 눌러 ★ 를 하나 올린다 · "추천" 칸은 가장 많이 싸운 무기' },
  officer: { title: '부관이 온다', text: '장수의 기술을 쓰는 큰 적 · 위쪽 체력바를 보며 몰아 잡으면 보상 카드' },
  incident: { title: '라운드 사건', text: '왼쪽 위 보라 칩이 이번·다음 라운드 사건 · 예보를 보고 무기를 준비하자' },
  ult: { title: '궁극기가 찼다!', text: 'G 키 또는 ★ 버튼 · 탑마다 궁극기가 다르다 (버튼에 올리면 설명)' },
  tap: { title: '직접 때리기', text: '전장의 적을 누르면 약하게 때린다 · 궁극기 게이지가 조금 찬다' },
};

/** 급한 순서 (멈춰 있는 창 → 다가오는 큰 일 → 손으로 할 수 있는 것) */
const ORDER: IntroId[] = ['route', 'encounter', 'forge', 'officer', 'incident', 'ult', 'tap'];

function triggered(id: IntroId, state: GameState, events: GameEvent[]): boolean {
  const forecast = forecastVisible(state);
  switch (id) {
    case 'route':
      return !!state.route;
    case 'encounter':
      return !!state.encounter;
    case 'forge':
      return state.forging;
    case 'officer':
      return events.some((e) => e.kind === 'officer') || (forecast && nextBig(state) === 'officer');
    case 'incident': {
      const next = nextIncidentShown(state);
      return events.some((e) => e.kind === 'incident') || (forecast && next !== null && next !== 'hidden');
    }
    case 'ult':
      return ultReady(state);
    case 'tap':
      return state.round >= 2 && state.enemies.some((e) => e.hp > 0);
  }
}

/** 지금 보여 줄 첫 안내 (없으면 null) */
export function introDue(state: GameState, events: GameEvent[], seen: readonly string[]): IntroId | null {
  if (state.status !== 'playing' || state.finaleLeft !== null) return null;
  return ORDER.find((id) => !seen.includes(id) && triggered(id, state, events)) ?? null;
}

export function loadIntros(storage: StorageLike): IntroId[] {
  try {
    const raw = storage.getItem(INTRO_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return list.filter((x): x is IntroId => typeof x === 'string' && x in INTROS);
  } catch {
    return [];
  }
}

export function saveIntros(storage: StorageLike, seen: IntroId[]): void {
  try {
    storage.setItem(INTRO_KEY, JSON.stringify(seen));
  } catch {
    // 막힌 저장소: 이번 세션에만 기억한다
  }
}
