/** 가방 칸 격자 (40칸) */
import { BAG_MAX } from '../core/inventory.ts';
import type { Item } from '../core/types.ts';
import { drawItemIcon } from './itemview.ts';
import { C, type Ui } from './kit.ts';

/** 격자가 차지할 크기 */
export function bagSize(w: number): { cols: number; cell: number; h: number } {
  const cols = 8;
  const cell = Math.max(18, Math.min(26, Math.floor((w - (cols - 1) * 2) / cols)));
  return { cols, cell, h: Math.ceil(BAG_MAX / cols) * (cell + 2) };
}

export function drawBag(ui: Ui, bag: Item[], x: number, y: number, w: number, selected: number | null, onPick: (i: number) => void, prefix = 'bag', mark?: (it: Item) => boolean): number {
  const { cols, cell, h } = bagSize(w);
  for (let i = 0; i < BAG_MAX; i++) {
    const cx = x + (i % cols) * (cell + 2);
    const cy = y + Math.floor(i / cols) * (cell + 2);
    const it = bag[i];
    const focus = ui.hit(`${prefix}${i}`, cx, cy, cell, cell, () => onPick(i), !!it);
    if (it) {
      drawItemIcon(ui, it, cx, cy, cell);
      if (mark?.(it)) ui.outlined('▲', cx + 4, cy + 5, C.good, 7);
    } else {
      ui.ctx.fillStyle = '#211a2e';
      ui.ctx.fillRect(cx, cy, cell, cell);
    }
    if (selected === i) {
      ui.ctx.strokeStyle = '#ffffff';
      ui.ctx.lineWidth = 1;
      ui.ctx.strokeRect(cx - 0.5, cy - 0.5, cell + 1, cell + 1);
    }
    if (focus || ui.hover === `${prefix}${i}`) ui.focusRing(cx, cy, cell, cell);
  }
  return h;
}

/** 창 크기와 두 칸 나누기 (가로 화면은 좌우, 세로 화면은 위아래) */
export function frame(ui: Ui, maxW = 520, maxH = 340): { px: number; py: number; pw: number; ph: number; side: boolean } {
  const pw = Math.min(ui.w - 8, maxW);
  const side = ui.w >= 440;
  const ph = Math.min(ui.h - 8, side ? maxH : 640);
  return { px: Math.round((ui.w - pw) / 2), py: Math.round((ui.h - ph) / 2), pw, ph, side };
}
