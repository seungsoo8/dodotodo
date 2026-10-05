/** 추억 앨범: 장마다 모은 기억 (방의 기억 조각에서 만든다) */
import { CHAPTERS, ROOMS } from './index.ts';

export interface AlbumItem {
  id: string;
  name: string;
  line: string;
}

export const ALBUM: { title: string; items: AlbumItem[] }[] = CHAPTERS.map((ch) => {
  const room = ROOMS[ch.room]();
  return {
    title: `${ch.title} — ${ch.sub}`,
    items: room.things.flatMap((t) => (t.kind === 'memory' ? [{ id: t.id, name: t.name, line: t.caption ?? '' }] : [])),
  };
}).filter((c) => c.items.length > 0);

/** 앨범을 열 쪽: 가장 최근에 모은 기억이 든 장 (없으면 첫 쪽) */
export function albumStart(album: { items: AlbumItem[] }[], got: readonly string[]): number {
  for (let k = got.length - 1; k >= 0; k--) {
    const i = album.findIndex((p) => p.items.some((it) => it.id === got[k]));
    if (i >= 0) return i;
  }
  return 0;
}
