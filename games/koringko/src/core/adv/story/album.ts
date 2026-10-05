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
