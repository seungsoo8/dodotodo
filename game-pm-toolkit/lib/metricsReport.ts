export type PeriodKind = "week" | "month";

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface PeriodRanges {
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
}

export function computePeriodRanges(endDate: string, kind: PeriodKind): PeriodRanges {
  const end = new Date(`${endDate}T00:00:00`);

  if (kind === "week") {
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6);
    return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd) };
  }

  const y = end.getFullYear();
  const m = end.getMonth();
  const start = new Date(y, m, 1);
  const monthEnd = new Date(y, m + 1, 0);
  const prevMonthEnd = new Date(y, m, 0);
  const prevMonthStart = new Date(y, m - 1, 1);
  return {
    start: fmt(start),
    end: fmt(monthEnd),
    prevStart: fmt(prevMonthStart),
    prevEnd: fmt(prevMonthEnd),
  };
}

export function summarize(entries: { value: number }[]): {
  sum: number;
  avg: number;
  count: number;
} {
  const sum = entries.reduce((acc, e) => acc + e.value, 0);
  const count = entries.length;
  return { sum, avg: count ? sum / count : 0, count };
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}
