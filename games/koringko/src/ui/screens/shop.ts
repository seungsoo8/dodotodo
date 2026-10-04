/** 곰돌 아저씨의 잡화점: 물약 · 장비 사기, 장비 팔기 */
import { refreshStats } from '../../core/combat.ts';
import { buyItem, buyPotion, potionPrice, shopStock } from '../../core/shop.ts';
import { itemValue } from '../../core/items.ts';
import { sell } from '../../core/inventory.ts';
import { powerChange } from '../../core/compare.ts';
import { pixCanvas } from '../art/canvas.ts';
import { potionIcon } from '../art/icons.ts';
import { drawBag, frame } from '../baggrid.ts';
import { drawItemIcon, drawItemInfo } from '../itemview.ts';
import { C } from '../kit.ts';
import { RARITY } from '../../core/items.ts';
import type { App, Screen } from './screen.ts';

type Sel = { kind: 'potion'; p: 'hp' | 'sp' } | { kind: 'stock'; i: number } | { kind: 'bag'; i: number } | null;

export class ShopScreen implements Screen {
  modal = true;
  tab: 'buy' | 'sell' = 'buy';
  sel: Sel = null;

  draw(app: App): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    g.shop ??= shopStock(g.rng, s);
    ui.dim(0.5);
    const F = frame(ui);
    ui.panel(F.px, F.py, F.pw, F.ph);
    ui.text('곰돌 아저씨의 잡화점', F.px + 8, F.py + 6, C.gold, 12);
    ui.text(`골드 ${s.gold}`, F.px + F.pw - 8, F.py + 7, C.gold, 10, 'right');
    ui.button('tab-buy', F.px + 8, F.py + 22, 60, 18, '사기', () => ((this.tab = 'buy'), (this.sel = null)), { active: this.tab === 'buy', size: 10 });
    ui.button('tab-sell', F.px + 72, F.py + 22, 60, 18, '팔기', () => ((this.tab = 'sell'), (this.sel = null)), { active: this.tab === 'sell', size: 10 });
    const lx = F.px + 8;
    const ly = F.py + 46;
    const lw = F.side ? Math.floor(F.pw * 0.5) : F.pw - 16;
    const infoX = F.side ? lx + lw + 8 : lx;
    let infoY = F.side ? ly : ly;
    const infoW = F.side ? F.pw - lw - 24 : F.pw - 16;

    if (this.tab === 'buy') {
      const rowH = 22;
      const rows: { id: string; draw: (x: number, y: number) => void; pick: () => void; on: boolean }[] = [];
      (['hp', 'sp'] as const).forEach((p) =>
        rows.push({
          id: `p${p}`,
          on: this.sel?.kind === 'potion' && this.sel.p === p,
          pick: () => this.pick(app, { kind: 'potion', p }),
          draw: (x, y) => {
            ui.img(pixCanvas(potionIcon(p)), x + 3, y + 3, 16, 16);
            ui.text(p === 'hp' ? '빨간 물약' : '파란 물약', x + 24, y + 5, p === 'hp' ? C.hp : C.sp, 10);
            ui.text(`${potionPrice(s.lv, p)} G`, x + lw - 4, y + 5, C.gold, 10, 'right');
          },
        }),
      );
      g.shop.forEach((o, i) =>
        rows.push({
          id: `s${i}`,
          on: this.sel?.kind === 'stock' && this.sel.i === i,
          pick: () => this.pick(app, { kind: 'stock', i }),
          draw: (x, y) => {
            drawItemIcon(ui, o.item, x + 1, y + 1, 20);
            ui.text(o.sold ? '다 팔렸어요' : o.item.name, x + 24, y + 5, o.sold ? C.dim : RARITY[o.item.rarity].color, 10);
            if (!o.sold) ui.text(`${o.price} G`, x + lw - 4, y + 5, s.gold >= o.price ? C.gold : C.bad, 10, 'right');
          },
        }),
      );
      rows.forEach((r, k) => {
        const y = ly + k * (rowH + 2);
        const f = ui.hit(r.id, lx, y, lw, rowH, r.pick);
        ui.panel(lx, y, lw, rowH, r.on ? '#4a3e66' : C.panel2, f || ui.hover === r.id ? C.focus : C.edge);
        r.draw(lx, y);
      });
      if (!F.side) infoY = ly + rows.length * (rowH + 2) + 6;
    } else {
      const bagW = lw;
      const h = drawBag(ui, s.bag, lx, ly, bagW, this.sel?.kind === 'bag' ? this.sel.i : null, (i) => this.pick(app, { kind: 'bag', i }), 'bag', (it) => powerChange(s, it) > 0);
      if (!F.side) infoY = ly + h + 6;
    }

    // 고른 것 설명
    const sel = this.sel;
    if (!sel) {
      ui.paragraph(this.tab === 'buy' ? '사고 싶은 것을 고르세요. 한 번 더 누르면 바로 사요.' : '팔 장비를 고르세요. 한 번 더 누르면 바로 팔아요.', infoX, infoY, infoW, C.dim, 10);
      return;
    }
    let y = infoY;
    let label = '';
    let can = true;
    if (sel.kind === 'potion') {
      ui.text(sel.p === 'hp' ? '빨간 물약' : '파란 물약', infoX, y, sel.p === 'hp' ? C.hp : C.sp, 11);
      y += ui.paragraph(sel.p === 'hp' ? '최대 HP 의 40% 를 바로 회복해요. (Q)' : '최대 SP 의 40% 를 바로 회복해요. (W)', infoX, y + 16, infoW, C.light, 10) + 18;
      ui.text(`가진 개수 ${s.potions[sel.p]}`, infoX, y, C.dim, 10);
      y += 16;
      label = `${potionPrice(s.lv, sel.p)} G 에 사기`;
      can = s.gold >= potionPrice(s.lv, sel.p);
    } else if (sel.kind === 'stock') {
      const o = g.shop[sel.i];
      y += drawItemInfo(ui, o.item, infoX, y, infoW, s, true) + 4;
      label = o.sold ? '다 팔렸어요' : `${o.price} G 에 사기`;
      can = !o.sold && s.gold >= o.price;
    } else {
      const it = s.bag[sel.i];
      if (!it) {
        this.sel = null;
        return;
      }
      y += drawItemInfo(ui, it, infoX, y, infoW, s, true) + 4;
      label = `${itemValue(it)} G 에 팔기`;
    }
    ui.button('act', infoX, Math.min(y, F.py + F.ph - 26), Math.min(infoW, 140), 20, label, () => this.act(app), { enabled: can, color: C.gold, size: 10 });
  }

  pick(app: App, s: Sel): void {
    if (JSON.stringify(s) === JSON.stringify(this.sel)) {
      this.act(app);
      return;
    }
    this.sel = s;
    app.sfx('move');
  }

  act(app: App): void {
    const g = app.g!;
    const s = g.save;
    const sel = this.sel;
    if (!sel) return;
    let ok = false;
    if (sel.kind === 'potion') ok = buyPotion(s, sel.p);
    else if (sel.kind === 'stock') {
      ok = buyItem(s, g.shop!, sel.i);
      if (!ok && !g.shop![sel.i].sold && s.gold >= g.shop![sel.i].price) app.toast('가방이 가득 찼어요!', C.bad);
    } else {
      ok = sell(s, sel.i) > 0;
      if (ok) {
        app.sfx('sell');
        this.sel = s.bag[sel.i] ? sel : null;
        refreshStats(g);
        app.saveNow();
        return;
      }
    }
    app.sfx(ok ? 'buy' : 'error');
    if (ok) app.saveNow();
  }
}
