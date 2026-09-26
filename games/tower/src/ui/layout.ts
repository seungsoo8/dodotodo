export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  width: number;
  height: number;
  /** 전장 높이 (그 아래가 상점) */
  fieldHeight: number;
  cards: Rect[];
  reroll: Rect;
  speed: Rect;
  pause: Rect;
}

export type Hit = { kind: 'card'; index: number } | { kind: 'reroll' } | { kind: 'speed' } | { kind: 'pause' };

const PANEL_HEIGHT = 80;
const PAD = 6;
const BUTTON_COLUMN = 120;

export function computeLayout(width: number, fieldHeight: number, slots: number): Layout {
  const top = fieldHeight + PAD;
  const innerH = PANEL_HEIGHT - PAD * 2;
  const cardsWidth = width - BUTTON_COLUMN - PAD * 2;
  const cardW = (cardsWidth - PAD * (slots - 1)) / slots;
  const cards = Array.from({ length: slots }, (_, i) => ({ x: PAD + i * (cardW + PAD), y: top, w: cardW, h: innerH }));

  const bx = width - BUTTON_COLUMN;
  const bw = BUTTON_COLUMN - PAD;
  const half = (innerH - PAD) / 2;
  const smallW = (bw - PAD) / 2;
  return {
    width,
    height: fieldHeight + PANEL_HEIGHT,
    fieldHeight,
    cards,
    reroll: { x: bx, y: top, w: bw, h: half },
    speed: { x: bx, y: top + half + PAD, w: smallW, h: half },
    pause: { x: bx + smallW + PAD, y: top + half + PAD, w: smallW, h: half },
  };
}

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function hitTest(layout: Layout, x: number, y: number): Hit | null {
  const index = layout.cards.findIndex((c) => inside(c, x, y));
  if (index >= 0) return { kind: 'card', index };
  if (inside(layout.reroll, x, y)) return { kind: 'reroll' };
  if (inside(layout.speed, x, y)) return { kind: 'speed' };
  if (inside(layout.pause, x, y)) return { kind: 'pause' };
  return null;
}

/** 비율을 유지하며 (availW × availH) 안에 들어가는 가장 큰 배율 */
export function fitScale(w: number, h: number, availW: number, availH: number): number {
  return Math.min(availW / w, availH / h);
}

/** 브라우저 좌표 → 게임 좌표 */
export function toLogical(
  rect: { left: number; top: number; width: number; height: number },
  w: number,
  h: number,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) / rect.width) * w,
    y: ((clientY - rect.top) / rect.height) * h,
  };
}
