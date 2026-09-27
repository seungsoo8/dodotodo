import type { GameConfig } from './config.ts';
import type { Rng } from './rng.ts';
import type { Point } from './types.ts';

/** 탑의 네 면 (북·동·남·서). 화면 위가 북쪽 */
export type Face = 'n' | 'e' | 's' | 'w';

export const FACES: Face[] = ['n', 'e', 's', 'w'];

export const FACE_INFO: Record<Face, { label: string; angle: number; dx: number; dy: number }> = {
  n: { label: '북', angle: -Math.PI / 2, dx: 0, dy: -1 },
  e: { label: '동', angle: 0, dx: 1, dy: 0 },
  s: { label: '남', angle: Math.PI / 2, dx: 0, dy: 1 },
  w: { label: '서', angle: Math.PI, dx: -1, dy: 0 },
};

/** 탑에서 (dx, dy) 쪽이 가장 가까운 면 */
export function faceOf(dx: number, dy: number): Face {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'e' : 'w';
  return dy >= 0 ? 's' : 'n';
}

/** (dx, dy) 가 그 면이 바라보는 arc° 부채꼴 안인가 */
export function inArc(face: Face, dx: number, dy: number, arcDeg: number): boolean {
  const f = FACE_INFO[face];
  const len = Math.hypot(dx, dy);
  if (len === 0) return true;
  const cos = (dx * f.dx + dy * f.dy) / len;
  return cos >= Math.cos(((arcDeg / 2) * Math.PI) / 180) - 1e-9;
}

/** 그 면 쪽 길이 시작되는 화면 가장자리 */
export function roadStart(config: GameConfig, face: Face): Point {
  const { width, height } = config;
  switch (face) {
    case 'n':
      return { x: width / 2, y: 0 };
    case 'e':
      return { x: width, y: height / 2 };
    case 's':
      return { x: width / 2, y: height };
    case 'w':
      return { x: 0, y: height / 2 };
  }
}

/** 라운드에 길마다 오는 적의 비율 (합 1) */
export type WavePlan = Record<Face, number>;

/** 가장 많이 오는 길 */
export function mainFace(plan: WavePlan): Face {
  return FACES.reduce((a, b) => (plan[b] > plan[a] ? b : a));
}

/**
 * 라운드의 방향 예보.
 * 처음 몇 라운드는 한 길(같은 길), 그다음은 두 길, 나중에는 네 길 모두.
 * 한 길 구간이 끝나면 가장 많이 오는 길이 앞 라운드와 달라진다.
 */
export function makePlan(config: GameConfig, round: number, rng: Rng, prev: WavePlan | null): WavePlan {
  const { oneRoadUntil, twoRoadsUntil, twoRoadsMain, fourRoadsMain } = config.waves;
  const plan: WavePlan = { n: 0, e: 0, s: 0, w: 0 };
  if (round <= oneRoadUntil) {
    if (prev) return { ...prev };
    plan[FACES[rng.int(4)]] = 1;
    return plan;
  }
  const choices = prev ? FACES.filter((f) => f !== mainFace(prev)) : FACES;
  const main = choices[rng.int(choices.length)];
  if (round <= twoRoadsUntil) {
    const rest = FACES.filter((f) => f !== main);
    plan[main] = twoRoadsMain;
    plan[rest[rng.int(rest.length)]] = 1 - twoRoadsMain;
    return plan;
  }
  for (const f of FACES) plan[f] = f === main ? fourRoadsMain : (1 - fourRoadsMain) / 3;
  return plan;
}

/** 예보 비율대로 길 하나를 뽑는다 */
export function pickRoad(plan: WavePlan, rng: Rng): Face {
  let roll = rng.next();
  for (const f of FACES) {
    roll -= plan[f];
    if (roll < 0) return f;
  }
  return mainFace(plan);
}
