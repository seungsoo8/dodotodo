/** 방향키로 단추 사이 초점 옮기기 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** cur 에서 (dx, dy) 쪽으로 가장 가까운 상자. 그쪽에 없으면 반대편 끝으로 돈다 */
export function pickNext<T extends Box>(list: T[], cur: T | null, dx: number, dy: number): T | null {
  if (!list.length) return null;
  if (!cur) return list[0];
  const cx = cur.x + cur.w / 2;
  const cy = cur.y + cur.h / 2;
  let best: T | null = null;
  let bs = Infinity;
  let wrap: T | null = null;
  let ws = Infinity;
  for (const b of list) {
    if (b === cur) continue;
    const ox = b.x + b.w / 2 - cx;
    const oy = b.y + b.h / 2 - cy;
    const ahead = ox * dx + oy * dy;
    const side = Math.abs(ox * dy - oy * dx);
    if (ahead > 1) {
      const s = ahead + side * 2;
      if (s < bs) [best, bs] = [b, s];
    } else {
      // 반대편: 가장 멀고 같은 줄에 가까운 것
      const s = side * 0.5 + ahead;
      if (s < ws) [wrap, ws] = [b, s];
    }
  }
  return best ?? wrap ?? cur;
}
