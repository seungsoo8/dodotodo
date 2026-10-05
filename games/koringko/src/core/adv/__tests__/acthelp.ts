/** 막 구조 시험 도우미: 방 이름으로 그 방이 든 막을 시작하고, 막의 둘째 · 셋째 방이면 그 방에 들어선다 */
import { Adv } from '../adv.ts';
import { actOfRoom, CHAPTERS, STORY } from '../story/index.ts';
import { ROOM_WIND } from '../story/acts.ts';
import type { AdvData } from '../adv.ts';
import type { Chapter } from '../types.ts';

/**
 * 옛 「장 = 방 하나」 눈으로 본 목록: 막의 방마다 한 묶음 (방 · 그 방에 들어설 때의 장면 · 그 방의 밤 시각 · 옛 장 태엽).
 * 막 첫 방은 막 도입, 둘째 · 셋째 방은 그 방의 enter. 방 하나짜리 장(프롤로그 · 새벽)은 그대로
 */
export const ROOM_CHAPTERS: Chapter[] = CHAPTERS.flatMap((c) =>
  (c.rooms ?? [{ id: c.room, name: c.sub }]).map((r, i): Chapter => ({
    ...c,
    room: r.id,
    intro: i === 0 ? c.intro : ('enter' in r ? (r.enter ?? []) : []),
    ...('clock' in r && r.clock ? { clock: r.clock } : {}),
    ...(ROOM_WIND[r.id] !== undefined ? { wind: ROOM_WIND[r.id] } : {}),
    title: c.rooms && c.rooms.length > 1 ? `${c.title} — ${r.name}` : c.title,
  })),
);

/** 그 방이 든 막을 바로 시작해 막 도입을 끝까지 돌리고 (finish), 둘째 · 셋째 방이면 문 없이 들어서서 들어선 장면도 끝까지 */
export function startIn(room: string, finish: (a: Adv) => unknown, data: AdvData = STORY): Adv {
  const ch = actOfRoom(room);
  if (!ch) throw new Error(`막에 없는 방: ${room}`);
  const a = new Adv(data);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(ch.n);
  finish(a);
  if (a.room.id !== room) {
    a.enterRoom(room);
    finish(a);
  }
  return a;
}
