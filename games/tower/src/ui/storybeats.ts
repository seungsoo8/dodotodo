import type { GameState } from '../core/game.ts';
import { findHero } from '../core/heroes.ts';
import { CHAPTERS, STORY_ROUNDS } from '../core/story.ts';
import type { GameEvent } from '../core/types.ts';

/** 체력이 이 비율 아래로 내려가면 위기 대사 */
export const LOW_HP_LINE = 0.3;

export interface Beat {
  keeper: string;
  text: string;
  color: string;
}

export interface BeatMemo {
  /** 이미 지나간 라운드 대사 중 가장 늦은 라운드 */
  roundLine: number;
  lowHp: boolean;
}

export function emptyBeatMemo(): BeatMemo {
  return { roundLine: 0, lowHp: false };
}

/** 이번 프레임에 탑(수호자)이 할 말 */
export function storyBeats(state: GameState, events: GameEvent[], memo: BeatMemo): { beats: Beat[]; memo: BeatMemo } {
  if (!state.hero) return { beats: [], memo };
  const c = CHAPTERS[state.hero];
  const say = (text: string): Beat => ({ keeper: c.keeper, text, color: findHero(state.hero!).color });
  const beats: Beat[] = [];
  let next = memo;

  if (state.mode === 'classic') {
    // 지나친 라운드 대사가 여럿이면 가장 최근 것 하나만
    const due = STORY_ROUNDS.filter((r) => r <= state.round).at(-1);
    if (due !== undefined && due > memo.roundLine) {
      beats.push(say(c.lines.rounds[due]));
      next = { ...next, roundLine: due };
    }
  }
  for (const ev of events) {
    if (ev.kind === 'boss' && c.boss[ev.id]) beats.push(say(c.boss[ev.id]));
  }
  const t = state.tower;
  if (!memo.lowHp && t.hp > 0 && t.hp < t.maxHp * LOW_HP_LINE) {
    beats.push(say(c.lines.lowHp));
    next = { ...next, lowHp: true };
  }
  return { beats, memo: next };
}
