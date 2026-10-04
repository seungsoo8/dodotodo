/** 망치 너구리의 대장간: 강화 · 분해 */
import { refreshStats } from '../../core/combat.ts';
import { dismantle, forgeChance, forgeCost, PLUS_MAX, upgrade, type Where } from '../../core/forge.ts';
import { SLOT_NAME } from '../../core/items.ts';
import { onForge } from '../../core/quests.ts';
import { SLOTS, type Item } from '../../core/types.ts';
import { pixCanvas } from '../art/canvas.ts';
import { matIcon, goldIcon } from '../art/icons.ts';
import { drawBag, frame } from '../baggrid.ts';
import { drawItemIcon, drawItemInfo } from '../itemview.ts';
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';

export class ForgeScreen implements Screen {
  modal = true;
  sel: Where | null = null;
  result: { text: string; color: string; life: number } | null = null;

  item(app: App): Item | undefined {
    const s = app.g!.save;
    if (!this.sel) return undefined;
    return 'gear' in this.sel ? s.gear[this.sel.gear] : s.bag[this.sel.bag];
  }

  draw(app: App, dt: number): void {
    const ui = app.ui;
    const s = app.g!.save;
    ui.dim(0.5);
    const F = frame(ui);
    ui.panel(F.px, F.py, F.pw, F.ph);
    ui.text('망치 너구리의 대장간', F.px + 8, F.py + 6, C.gold, 12);
    // 재료
    let mx = F.px + F.pw - 8;
    for (const [icon, n] of [
      [matIcon('star'), s.mats.star],
      [matIcon('dust'), s.mats.dust],
      [goldIcon(), s.gold],
    ] as const) {
      const w = ui.measure(String(n), 10);
      mx -= w;
      ui.text(String(n), mx, F.py + 7, C.light, 10);
      mx -= 14;
      ui.img(pixCanvas(icon), mx, F.py + 5, 12, 12);
      mx -= 8;
    }
    const lx = F.px + 8;
    const lw = F.side ? Math.floor(F.pw * 0.5) : F.pw - 16;
    ui.text('낀 장비', lx, F.py + 24, C.dim, 9);
    const cell = 22;
    SLOTS.forEach((slot, i) => {
      const x = lx + i * (cell + 3);
      const y = F.py + 36;
      const it = s.gear[slot];
      const f = ui.hit(`g${slot}`, x, y, cell, cell, () => this.pick(app, { gear: slot }), !!it);
      if (it) drawItemIcon(ui, it, x, y, cell);
      else {
        ui.ctx.fillStyle = '#211a2e';
        ui.ctx.fillRect(x, y, cell, cell);
        ui.text(SLOT_NAME[slot][0], x + cell / 2, y + 6, '#4a3e66', 9, 'center');
      }
      if (this.sel && 'gear' in this.sel && this.sel.gear === slot) {
        ui.ctx.strokeStyle = '#fff';
        ui.ctx.strokeRect(x - 0.5, y - 0.5, cell + 1, cell + 1);
      }
      if (f || ui.hover === `g${slot}`) ui.focusRing(x, y, cell, cell);
    });
    ui.text('가방', lx, F.py + 64, C.dim, 9);
    const bh = drawBag(ui, s.bag, lx, F.py + 76, lw, this.sel && 'bag' in this.sel ? this.sel.bag : null, (i) => this.pick(app, { bag: i }), 'fb');
    const ix = F.side ? lx + lw + 8 : lx;
    const iy = F.side ? F.py + 24 : F.py + 80 + bh;
    const iw = F.side ? F.pw - lw - 24 : F.pw - 16;
    const it = this.item(app);
    if (!it) {
      ui.paragraph('강화할 장비를 고르세요. 강화하면 기본 피해·방어가 단계마다 8% 올라요. 실패해도 재료만 쓰고 단계는 그대로예요. 가방의 장비는 분해해서 별가루로 만들 수 있어요.', ix, iy, iw, C.dim, 10);
    } else {
      let y = iy + drawItemInfo(ui, it, ix, iy, iw, s, false) + 4;
      if (it.plus >= PLUS_MAX) {
        ui.text('더 강화할 수 없어요 (최고 +10)', ix, y, C.gold, 10);
        y += 16;
      } else {
        const c = forgeCost(it);
        ui.text(`+${it.plus} → +${it.plus + 1}   성공 ${Math.round(forgeChance(it.plus) * 100)}%`, ix, y, C.light, 10);
        y += 14;
        ui.text(`골드 ${c.gold} · 별가루 ${c.dust}${c.star ? ` · 별 조각 ${c.star}` : ''}`, ix, y, s.gold >= c.gold && s.mats.dust >= c.dust && s.mats.star >= c.star ? C.dim : C.bad, 9);
        y += 14;
        ui.button('up', ix, y + 2, 70, 20, '강화', () => this.forge(app), { color: C.gold, size: 10 });
      }
      if (this.sel && 'bag' in this.sel) ui.button('dis', ix + 76, y + 2, 70, 20, '분해', () => this.dismantle(app), { size: 10 });
    }
    if (this.result) {
      this.result.life -= dt;
      ui.ctx.globalAlpha = Math.min(1, this.result.life);
      ui.outlined(this.result.text, F.px + F.pw / 2, F.py + F.ph - 14, this.result.color, 14);
      ui.ctx.globalAlpha = 1;
      if (this.result.life <= 0) this.result = null;
    }
  }

  pick(app: App, w: Where): void {
    this.sel = w;
    app.sfx('move');
  }

  forge(app: App): void {
    if (!this.sel) return;
    const g = app.g!;
    const r = upgrade(g.save, this.sel, g.rng);
    if (r.kind === 'success') {
      this.result = { text: `강화 성공! +${r.plus}`, color: C.gold, life: 2 };
      app.sfx('forgeOk');
      for (const id of onForge(g.save)) g.world.events.push({ kind: 'quest', id, state: g.save.quests[id].state });
    } else if (r.kind === 'fail') {
      this.result = { text: `강화 실패… (+${r.plus})`, color: C.bad, life: 2 };
      app.sfx('forgeFail');
      for (const id of onForge(g.save)) g.world.events.push({ kind: 'quest', id, state: g.save.quests[id].state });
    } else if (r.kind === 'poor') {
      this.result = { text: '재료가 모자라요', color: C.bad, life: 1.5 };
      app.sfx('error');
    }
    refreshStats(g);
    app.saveNow();
  }

  dismantle(app: App): void {
    if (!this.sel || !('bag' in this.sel)) return;
    const g = app.g!;
    const r = dismantle(g.save, this.sel.bag);
    this.result = { text: `별가루 +${r.dust}${r.star ? ` · 별 조각 +${r.star}` : ''}`, color: '#d8c0ff', life: 2 };
    app.sfx('sell');
    if (!g.save.bag[this.sel.bag]) this.sel = null;
    app.saveNow();
  }
}
