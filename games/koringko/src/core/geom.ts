/** 2D 계산 (화면과 무관) */
export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function normalize(v: Vec): Vec {
  const l = Math.hypot(v.x, v.y);
  return l === 0 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function angleTo(from: Vec, to: Vec): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function fromAngle(a: number, len = 1): Vec {
  return { x: Math.cos(a) * len, y: Math.sin(a) * len };
}

/** b - a 를 -π ~ π 로 */
export function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** origin 에서 facing 방향, 사거리 range, 부채꼴 arcDeg 안에 반지름 r 인 target 이 걸치는가 */
export function inArc(origin: Vec, facing: number, range: number, arcDeg: number, target: Vec, r: number): boolean {
  const d = dist(origin, target);
  if (d - r > range) return false;
  if (arcDeg >= 360 || d <= r) return true;
  const half = (arcDeg / 2) * (Math.PI / 180);
  const slack = Math.asin(Math.min(1, r / d));
  return Math.abs(angleDiff(angleTo(origin, target), facing)) <= half + slack;
}

export function distPointSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

/** 반지름 r 인 원 p 가 네모에 박혔으면 가장 가까운 바깥으로 민다 */
export function pushOutOfRect(p: Vec, r: number, rect: Rect): Vec {
  const cx = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
  const dx = p.x - cx;
  const dy = p.y - cy;
  const d = Math.hypot(dx, dy);
  if (d > 0) {
    if (d >= r) return p;
    return { x: cx + (dx / d) * r, y: cy + (dy / d) * r };
  }
  // 중심이 네모 안: 가장 가까운 변 바깥으로
  const left = p.x - rect.x;
  const right = rect.x + rect.w - p.x;
  const top = p.y - rect.y;
  const bottom = rect.y + rect.h - p.y;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return { x: rect.x - r, y: p.y };
  if (m === right) return { x: rect.x + rect.w + r, y: p.y };
  if (m === top) return { x: p.x, y: rect.y - r };
  return { x: p.x, y: rect.y + rect.h + r };
}

/** 방 벽(두께 wall) 안쪽으로 */
export function clampToRoom(p: Vec, r: number, room: { width: number; height: number }, wall: number): Vec {
  return {
    x: Math.max(wall + r, Math.min(room.width - wall - r, p.x)),
    y: Math.max(wall + r, Math.min(room.height - wall - r, p.y)),
  };
}
