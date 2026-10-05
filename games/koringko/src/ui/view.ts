/** 화면 크기 → 정수 배율과 논리 해상도, 카메라 자리 */

/** 짧은 변이 이 논리 픽셀보다 작아지지 않게 배율을 고른다 */
export const MIN_SHORT = 300;

export interface View {
  scale: number;
  w: number;
  h: number;
}

export function chooseView(devW: number, devH: number): View {
  const short = Math.min(devW, devH);
  const scale = Math.max(1, Math.floor(short / MIN_SHORT));
  return { scale, w: Math.max(1, Math.ceil(devW / scale)), h: Math.max(1, Math.ceil(devH / scale)) };
}

/** 카메라 왼쪽 위 (정수). 지도가 화면보다 작은 축은 가운데 */
export function cameraFor(px: number, py: number, mapW: number, mapH: number, vw: number, vh: number): { x: number; y: number } {
  const axis = (p: number, m: number, v: number) => (m <= v ? Math.round((m - v) / 2) : Math.round(Math.max(0, Math.min(m - v, p - v / 2))));
  return { x: axis(px, mapW, vw), y: axis(py, mapH, vh) };
}

/**
 * 세계 화면: 가로 화면이면 세로가 360 논리 픽셀 안팎이 되게 정수 배율을 고른다 (투더문처럼 어른 48줄 틀이 화면 높이의 10~13%).
 * 방은 화면보다 작게 가운데 떠 보이고, 큰 지도는 카메라가 따라간다. k = 세계 배율 ÷ 글자 배율
 */
export const WORLD_VIEW_H = 360;

export function worldView(devW: number, devH: number, ui: View): View & { k: number } {
  const scale = devH > devW ? ui.scale : Math.max(1, Math.floor(devH / WORLD_VIEW_H));
  return { scale, w: Math.max(1, Math.ceil(devW / scale)), h: Math.max(1, Math.ceil(devH / scale)), k: scale / ui.scale };
}
