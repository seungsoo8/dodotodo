/** 추억 앨범: 막의 방마다 모은 기억 (방의 기억 조각에서 만든다) */
import { isMemory } from '../adv.ts';
import { CHAPTERS, ROOMS } from './index.ts';

export interface AlbumItem {
  id: string;
  name: string;
  line: string;
}

/** 쪽은 막의 방마다 하나 (막이 아닌 장은 그 장의 방 하나): 「막 제목 — 방 이름」, 기억이 없는 방은 뺀다 */
export const ALBUM: { title: string; items: AlbumItem[] }[] = CHAPTERS.flatMap((ch) =>
  (ch.rooms ?? [{ id: ch.room, name: ch.sub }]).map((r) => ({
    title: `${ch.title} — ${r.name}`,
    items: ROOMS[r.id]().things.flatMap((t) => (isMemory(t) ? [{ id: t.id, name: t.name, line: t.caption ?? '' }] : [])),
  })),
).filter((c) => c.items.length > 0);

/** 앨범을 열 쪽: 가장 최근에 모은 기억이 든 쪽 (없으면 첫 쪽) */
export function albumStart(album: { items: AlbumItem[] }[], got: readonly string[]): number {
  for (let k = got.length - 1; k >= 0; k--) {
    const i = album.findIndex((p) => p.items.some((it) => it.id === got[k]));
    if (i >= 0) return i;
  }
  return 0;
}
