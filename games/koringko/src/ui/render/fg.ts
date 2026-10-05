/**
 * 앞쪽 가림막 (E11): 카메라에 가장 가까운 큰 실루엣. 1.2배로 움직이고(패럴랙스), 짙은 색 + 가장자리 흐림.
 * 상호작용할 물건과 겹치면 옅게 비킨다.
 */

/** 패럴랙스 k 일 때 화면 가운데에서 멀어진 만큼 더 밀리는 양 (k = 1 이면 0) */
export function parallaxShift(worldCenter: number, camCenter: number, k: number): number {
  return (worldCenter - camCenter) * (k - 1);
}

const SIL = new WeakMap<CanvasImageSource, HTMLCanvasElement>();

/** 그림 → 짙은 실루엣 (가장자리 흐림, 2px 여백) */
export function silhouette(img: HTMLCanvasElement): HTMLCanvasElement {
  const hit = SIL.get(img);
  if (hit) return hit;
  const m = 3;
  const flat = document.createElement('canvas');
  flat.width = img.width + m * 2;
  flat.height = img.height + m * 2;
  const f = flat.getContext('2d')!;
  f.drawImage(img, m, m);
  f.globalCompositeOperation = 'source-in';
  f.fillStyle = 'rgb(30,20,26)';
  f.fillRect(0, 0, flat.width, flat.height);
  const out = document.createElement('canvas');
  out.width = flat.width;
  out.height = flat.height;
  const o = out.getContext('2d')!;
  // 흐림: 1px 씩 비낀 옅은 사본을 겹친 뒤 가운데를 진하게
  o.globalAlpha = 0.22;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]]) o.drawImage(flat, dx, dy);
  o.globalAlpha = 0.8;
  o.drawImage(flat, 0, 0);
  SIL.set(img, out);
  return out;
}

export interface FgItem {
  img: HTMLCanvasElement;
  x: number;
  y: number;
}

/** 세계 좌표가 이미 옮겨진 ctx 에 가림막 하나: cam 은 화면 왼쪽 위의 세계 좌표 */
export function drawFg(ctx: CanvasRenderingContext2D, it: FgItem, cam: { x: number; y: number }, vw: number, vh: number, blocked: (x: number, y: number, w: number, h: number) => boolean): void {
  const s = silhouette(it.img);
  const dx = parallaxShift(it.x + it.img.width / 2, cam.x + vw / 2, 1.2);
  const dy = parallaxShift(it.y + it.img.height / 2, cam.y + vh / 2, 1.2);
  const x = Math.round(it.x + dx - 3);
  const y = Math.round(it.y + dy - 3);
  ctx.globalAlpha = blocked(x, y, s.width, s.height) ? 0.25 : 1;
  ctx.drawImage(s, x, y);
  ctx.globalAlpha = 1;
}
