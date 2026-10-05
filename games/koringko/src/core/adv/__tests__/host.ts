/** 대본 실행기만 따로 시험할 때 쓰는 집: 무대 · 깃발은 진짜, 방 옮기기 같은 일은 적어 둔다 */
import type { Host } from '../script.ts';
import { newStage } from '../stage.ts';

export function simpleHost(): Host & { log: string[]; miniOver: boolean } {
  const log: string[] = [];
  const h = {
    stage: newStage(),
    flags: {} as Record<string, boolean>,
    log,
    miniOver: false,
    goRoom: (id: string, at?: readonly [number, number], dir?: string) => log.push(`room ${id}${at ? ` ${at[0]},${at[1]}` : ''}${dir ? ` ${dir}` : ''}`),
    chapter: (n: number) => log.push(`chapter ${n}`),
    nextChapter: () => log.push('next'),
    chapterTitle: () => ({ text: '1장', sub: '' }),
    join: (w: string) => log.push(`join ${w}`),
    leave: (w: string) => log.push(`leave ${w}`),
    control: (w: string) => log.push(`control ${w}`),
    startMini: (id: string) => log.push(`mini ${id}`),
    miniDone: () => h.miniOver,
    wind: (v: number) => log.push(`wind ${v}`),
    album: (id: string) => log.push(`album ${id}`),
  };
  return h;
}
