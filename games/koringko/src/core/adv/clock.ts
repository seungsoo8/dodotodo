/**
 * 이삿날 전날 밤의 시계 (REDESIGN 3-1): 1장 23:10 → 마지막 밤 장 04:40, 그 뒤 새벽 05:00.
 * 시각은 "이어지는 분"으로 센다: 12시 전(새벽)은 24시를 더해 자정을 넘어도 늘어나기만 한다.
 */

export const NIGHT_FIRST = '23:10';
export const NIGHT_LAST = '04:40';
export const DAWN = '05:00';

/** 'HH:MM' → 이어지는 분 (새벽 0~11시는 +24시간). 잘못된 글자는 NaN */
export function parseClock(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return NaN;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return NaN;
  return (h < 12 ? h + 24 : h) * 60 + mi;
}

/** 이어지는 분 → 'HH:MM' */
export function clockLabel(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** 밤 장 n 개의 시각: 첫 장 23:10, 마지막 장 04:40, 사이는 고르게 (5분 단위, 늘어나기만) */
export function nightClocks(n: number): string[] {
  if (n <= 0) return [];
  const a = parseClock(NIGHT_FIRST);
  const b = parseClock(NIGHT_LAST);
  const out: string[] = [];
  let prev = -Infinity;
  for (let i = 0; i < n; i++) {
    let m = n === 1 ? a : Math.round((a + ((b - a) * i) / (n - 1)) / 5) * 5;
    if (m <= prev) m = prev + 5;
    prev = m;
    out.push(clockLabel(m));
  }
  return out;
}
