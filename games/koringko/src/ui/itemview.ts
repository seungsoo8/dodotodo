/** 장비 설명 상자 */
import { CLASSES } from '../core/classes.ts';
import { powerChange } from '../core/compare.ts';
import { equipCheck } from '../core/inventory.ts';
import { affixText, POWERS, RARITY, SLOT_NAME } from '../core/items.ts';
import { PLUS_STEP } from '../core/stats.ts';
import type { Item, Save } from '../core/types.ts';
import { pixCanvas } from './art/canvas.ts';
import { itemIcon } from './art/icons.ts';
import { C, type Ui } from './kit.ts';

export function drawItemIcon(ui: Ui, it: Item, x: number, y: number, size: number): void {
  const col = RARITY[it.rarity].color;
  ui.ctx.fillStyle = it.rarity === 'normal' ? '#3a3050' : col + '44';
  ui.ctx.fillRect(x, y, size, size);
  ui.ctx.strokeStyle = col;
  ui.ctx.lineWidth = 1;
  ui.ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  const k = Math.floor((size - 4) / 16) || 1;
  const s = Math.min(size - 4, 16 * Math.max(1, k));
  ui.img(pixCanvas(itemIcon(it.slot, it.rarity, it.hero ? CLASSES[it.hero].weapon : 'sword')), x + (size - s) / 2, y + (size - s) / 2, s, s);
  if (it.plus > 0) ui.outlined(`+${it.plus}`, x + size - 6, y + size - 5, C.gold, 8);
}

/** 설명 줄들 (위에서 아래로) */
export function itemLines(it: Item, save: Save | null): { text: string; color: string }[] {
  const out: { text: string; color: string }[] = [];
  const k = 1 + it.plus * PLUS_STEP;
  out.push({ text: `${RARITY[it.rarity].name} ${SLOT_NAME[it.slot]}${it.plus ? `  +${it.plus}` : ''}`, color: C.dim });
  if (it.dmg) out.push({ text: `피해 ${Math.round(it.dmg[0] * k)}~${Math.round(it.dmg[1] * k)}  속도 ${it.spd?.toFixed(2)}`, color: C.light });
  if (it.def) out.push({ text: `방어 ${Math.round(it.def * k)}`, color: C.light });
  for (const a of it.affixes) out.push({ text: affixText(a), color: '#9ad8ff' });
  if (it.power) out.push({ text: `★ ${POWERS[it.power].name}: ${POWERS[it.power].desc}`, color: RARITY.legendary.color });
  if (save) {
    const chk = equipCheck(save, it);
    if (!chk.ok) out.push({ text: chk.reason === 'level' ? `레벨 ${it.req} 부터 쓸 수 있어요` : `${CLASSES[it.hero!].name} 전용 무기`, color: C.bad });
    else out.push({ text: `요구 레벨 ${it.req}`, color: C.dim });
  }
  return out;
}

/** 이름 + 설명 + (가방 장비면) 전투력 변화. 그린 높이를 돌려준다 */
export function drawItemInfo(ui: Ui, it: Item, x: number, y: number, w: number, save: Save | null, compare: boolean): number {
  drawItemIcon(ui, it, x, y, 24);
  const nameLines = ui.wrap(it.name, w - 30, 11);
  nameLines.forEach((l, i) => ui.text(l, x + 30, y + 1 + i * 13, RARITY[it.rarity].color, 11));
  let yy = y + Math.max(28, nameLines.length * 13 + 4);
  for (const l of itemLines(it, save)) yy += ui.paragraph(l.text, x, yy, w, l.color, 9, 3);
  if (save && compare) {
    const d = powerChange(save, it);
    const same = save.gear[it.slot]?.uid === it.uid;
    if (!same) {
      ui.text(d === 0 ? '전투력 변화 없음' : `전투력 ${d > 0 ? '▲' : '▼'} ${Math.abs(d)}`, x, yy + 2, d > 0 ? C.good : d < 0 ? C.bad : C.dim, 10);
      yy += 14;
    }
  }
  return yy - y;
}
