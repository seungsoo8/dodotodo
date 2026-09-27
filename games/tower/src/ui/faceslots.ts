import type { Face } from '../core/faces.ts';
import { FACES } from '../core/faces.ts';
import type { GameState } from '../core/game.ts';
import { inside, type Rect } from './layout.ts';
import { TOWER_SCALE, TOWER_SPRITE } from './sprites.ts';

/** 탑 둘레 무기 칸 한 칸 크기와 간격 */
export const SLOT_SIZE = 16;
export const SLOT_GAP = 3;
/** 탑 그림과 칸 사이 */
const MARGIN = 5;
/** 누르는 범위를 조금 넓힌다 */
const HIT_PAD = 1.5;

interface TowerPos {
  x: number;
  y: number;
  radius: number;
}

/** 탑 그림이 차지하는 상자 (바닥이 탑 반지름 아래 끝) */
function towerBox(t: TowerPos): Rect {
  const w = TOWER_SPRITE.width * TOWER_SCALE;
  const h = TOWER_SPRITE.height * TOWER_SCALE;
  return { x: t.x - w / 2, y: t.y + t.radius - h, w, h };
}

/** 면 f 의 k 번째 칸 (그 면 칸이 n 개일 때). 북·남은 가로 한 줄, 동·서는 세로 한 줄 */
export function slotRect(t: TowerPos, face: Face, k: number, n: number): Rect {
  const box = towerBox(t);
  const span = n * SLOT_SIZE + (n - 1) * SLOT_GAP;
  const along = k * (SLOT_SIZE + SLOT_GAP) - span / 2;
  const midY = box.y + box.h / 2;
  switch (face) {
    case 'n':
      // 깃발 위로
      return { x: t.x + along, y: box.y - MARGIN - 10 - SLOT_SIZE, w: SLOT_SIZE, h: SLOT_SIZE };
    case 's':
      return { x: t.x + along, y: box.y + box.h + MARGIN, w: SLOT_SIZE, h: SLOT_SIZE };
    case 'e':
      return { x: box.x + box.w + MARGIN, y: midY + along, w: SLOT_SIZE, h: SLOT_SIZE };
    case 'w':
      return { x: box.x - MARGIN - SLOT_SIZE, y: midY + along, w: SLOT_SIZE, h: SLOT_SIZE };
  }
}

export interface FaceHit {
  face: Face;
  slot: number;
}

export function hitTestFaces(t: TowerPos, n: number, x: number, y: number): FaceHit | null {
  for (const face of FACES) {
    for (let k = 0; k < n; k++) if (inside(slotRect(t, face, k, n), x, y, HIT_PAD)) return { face, slot: k };
  }
  return null;
}

/** 집은 무기 옆 판매 버튼 (탑 바깥쪽으로) */
export function sellButtonRect(t: TowerPos, face: Face, k: number, n: number): Rect {
  const r = slotRect(t, face, k, n);
  const w = 34;
  const h = 13;
  switch (face) {
    case 'n':
      return { x: r.x + r.w / 2 - w / 2, y: r.y - h - 3, w, h };
    case 's':
      return { x: r.x + r.w / 2 - w / 2, y: r.y + r.h + 3, w, h };
    case 'e':
      return { x: r.x + r.w + 3, y: r.y + r.h / 2 - h / 2, w, h };
    case 'w':
      return { x: r.x - w - 3, y: r.y + r.h / 2 - h / 2, w, h };
  }
}

/** 그 면에 달린 무기 번호 (state.weapons 순서) */
export function weaponsOn(state: GameState, face: Face): number[] {
  const out: number[] = [];
  state.weapons.forEach((w, i) => {
    if (w.face === face) out.push(i);
  });
  return out;
}

export type FaceClick =
  | { kind: 'select'; face: Face }
  | { kind: 'pick'; index: number; face: Face }
  | { kind: 'move'; index: number; face: Face }
  | { kind: 'cancel' };

/**
 * 탑 둘레 칸을 눌렀을 때 할 일.
 * 집은 무기가 있으면: 다른 면 → 옮기기, 같은 무기 → 내려놓기.
 * 없으면: 무기 칸 → 집기, 빈 칸 → 그 면 고르기.
 */
export function faceClick(state: GameState, picked: number | null, hit: FaceHit): FaceClick {
  const here = weaponsOn(state, hit.face)[hit.slot];
  const pickedWeapon = picked === null ? undefined : state.weapons[picked];
  if (pickedWeapon) {
    if (hit.face !== pickedWeapon.face) return { kind: 'move', index: picked!, face: hit.face };
    if (here === picked) return { kind: 'cancel' };
  }
  if (here !== undefined) return { kind: 'pick', index: here, face: hit.face };
  return { kind: 'select', face: hit.face };
}
