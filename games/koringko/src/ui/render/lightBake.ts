/**
 * 빛의 질감 (QUALITY C3): 매끈한 원형 그라데이션 대신 4단 계단 감쇠 + 2×2 Bayer 디더.
 * 빛 하나(반지름 r)를 한 번 가면으로 구워 두고, 그리기는 색 · 세기만 바꿔 drawImage 한다.
 */

/** 가운데부터 바깥까지 4단 세기 */
export const LIGHT_STEPS = [1, 0.74, 0.47, 0.2] as const;
/** 각 단의 바깥 경계 (반지름 비) */
const EDGES = [0.32, 0.58, 0.82, 1] as const;
/** 경계 안쪽 이만큼은 다음 단과 바둑판으로 섞는다 */
const BAND = 0.09;
const BAYER2 = [
  [0, 2],
  [3, 1],
];

/** 반지름 비 d (0 = 가운데, 1 = 끝) 의 세기. (x, y) 는 픽셀 자리 (디더 무늬) */
export function lightLevel(d: number, x: number, y: number): number {
  if (d >= 1) return 0;
  let i = 0;
  while (d >= EDGES[i]) i++;
  const next = i + 1 < LIGHT_STEPS.length ? LIGHT_STEPS[i + 1] : 0;
  const into = (d - (EDGES[i] - BAND)) / BAND;
  if (into <= 0) return LIGHT_STEPS[i];
  const th = (BAYER2[((y % 2) + 2) % 2][((x % 2) + 2) % 2] + 0.5) / 4;
  return into > th ? next : LIGHT_STEPS[i];
}

/** 지름 2r 정사각형 세기 가면 (0..1) */
export function lightMask(r: number): { size: number; data: Float32Array } {
  const size = Math.max(2, Math.round(r) * 2);
  const c = size / 2;
  const R = Math.max(1, size / 2);
  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / R;
      data[y * size + x] = lightLevel(d, x, y);
    }
  // 한가운데 픽셀은 늘 가장 밝게
  data[Math.floor(c) * size + Math.floor(c)] = 1;
  return { size, data };
}
