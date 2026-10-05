/** 대사 기록(백로그): 무대의 대사가 새로 바뀔 때마다 적어 두고, 최근 몇 줄만 남긴다 */

export interface LogLine {
  who: string;
  text: string;
}

export const BACKLOG_MAX = 80;

export class Backlog {
  private readonly items: LogLine[] = [];
  /** 마지막으로 적은 대사 객체 (같은 줄을 두 번 적지 않게) */
  private last: object | null = null;

  /** 매 장면 부른다: 대사 객체가 새것이면 적는다 */
  track(d: { readonly who: string; readonly text: string; shown?: number } | null): void {
    if (!d || d === this.last) return;
    this.last = d;
    this.items.push({ who: d.who, text: d.text });
    if (this.items.length > BACKLOG_MAX) this.items.splice(0, this.items.length - BACKLOG_MAX);
  }

  lines(): readonly LogLine[] {
    return this.items;
  }

  clear(): void {
    this.items.length = 0;
    this.last = null;
  }
}

/** 보기 창: scroll 은 맨 아래(최신)에서 위로 올라간 줄 수. 범위를 넘으면 붙잡는다 */
export function logWindow<T>(items: readonly T[], scroll: number, rows: number): { items: T[]; scroll: number; max: number } {
  const max = Math.max(0, items.length - rows);
  const s = Math.max(0, Math.min(max, Math.floor(scroll)));
  const end = items.length - s;
  return { items: items.slice(Math.max(0, end - rows), end), scroll: s, max };
}
