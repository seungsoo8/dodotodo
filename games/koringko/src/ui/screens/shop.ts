/** 곰돌 아저씨의 가게: 사탕 · 오늘의 부품 (마을이 커지면 늘어난다) */
import { refreshStats } from '../../core/combat.ts';
import { villageLevel } from '../../core/friends.ts';
import { PARTS } from '../../core/parts.ts';
import { buyCandy, buyPart, candyPrice, shopStock } from '../../core/shop.ts';
import { pixCanvas } from '../art/canvas.ts';
import { candyIcon, goldIcon, partIcon } from '../art/icons.ts';
import { C, frame } from '../kit.ts';
import type { App, Screen } from './screen.ts';

export class ShopScreen implements Screen {
  modal = true;
  /** -1: 사탕, 0~: 오늘의 부품 */
  sel = -1;

  draw(app: App): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    const vlv = villageLevel(s);
    g.shop ??= shopStock(g.rng, s, vlv);
    ui.dim(0.5);
    const F = frame(ui, 460, 280);
    ui.panel(F.px, F.py, F.pw, F.ph);
    ui.text('곰돌 아저씨의 가게', F.px + 8, F.py + 6, C.gold, 12);
    ui.img(pixCanvas(goldIcon()), F.px + F.pw - 70, F.py + 6, 11, 11);
    ui.text(`${s.gold}`, F.px + F.pw - 8, F.py + 7, C.gold, 10, 'right');
    ui.button('close', F.px + F.pw - 26, F.py + F.ph - 24, 20, 18, '✕', () => app.pop(), { size: 10 });
    const lx = F.px + 8;
    const ly = F.py + 26;
    const lw = F.side ? Math.floor(F.pw * 0.5) : F.pw - 16;
    const rowH = 24;
    const row = (id: string, i: number, on: boolean, pick: () => void, draw: (x: number, y: number) => void) => {
      const y = ly + i * (rowH + 3);
      const f = ui.hit(id, lx, y, lw, rowH, pick);
      ui.panel(lx, y, lw, rowH, on ? '#4a3e66' : C.panel2, f ? C.focus : C.edge);
      draw(lx, y);
    };
    row('candy', 0, this.sel === -1, () => this.pick(app, -1), (x, y) => {
      ui.img(pixCanvas(candyIcon()), x + 4, y + 4, 16, 16);
      ui.text('사탕', x + 24, y + 7, C.hp, 10);
      ui.text(`${candyPrice(s.lv)}`, x + lw - 4, y + 7, C.gold, 10, 'right');
    });
    g.shop.forEach((o, i) =>
      row(`stock${i}`, i + 1, this.sel === i, () => this.pick(app, i), (x, y) => {
        const p = PARTS[o.part];
        ui.img(pixCanvas(partIcon(o.part, p.color)), x + 4, y + 4, 16, 16);
        ui.text(p.name, x + 24, y + 7, o.sold || s.parts[o.part] ? C.dim : p.color, 10);
        ui.text(o.sold || s.parts[o.part] ? '있음' : `${o.price}`, x + lw - 4, y + 7, C.gold, 10, 'right');
      }),
    );
    const n = g.shop.length;
    if (vlv < 2) ui.paragraph('친구를 3명 구하면 블록 마을이 커져서 부품도 팔아요!', lx, ly + (n + 1) * (rowH + 3) + 4, lw, C.dim, 9);
    else ui.paragraph(`오늘의 부품 (블록 마을 ${vlv}단계). 마을 밖에 다녀오면 바뀌어요.`, lx, ly + (n + 1) * (rowH + 3) + 4, lw, C.dim, 9);
    // 설명 · 사기
    const ix = F.side ? lx + lw + 10 : lx;
    const iy = F.side ? ly : ly + (n + 1) * (rowH + 3) + 30;
    const iw = F.side ? F.pw - lw - 26 : F.pw - 16;
    if (this.sel === -1) {
      ui.text('사탕', ix, iy, C.hp, 12);
      ui.paragraph(`Q 로 먹으면 HP 를 많이 채워요. 지금 ${s.potions.hp} 개.`, ix, iy + 18, iw, C.light, 10);
      ui.button('buy', ix, iy + 54, 90, 22, '사기', () => this.buy(app), { enabled: s.gold >= candyPrice(s.lv), color: C.gold });
      return;
    }
    const o = g.shop[this.sel];
    if (!o) return;
    const p = PARTS[o.part];
    ui.text(p.name, ix, iy, p.color, 12);
    const used = ui.paragraph(p.desc(1), ix, iy + 18, iw, C.light, 10);
    const owned = o.sold || !!s.parts[o.part];
    ui.button('buy', ix, iy + 24 + used, 90, 22, owned ? '이미 있어요' : '사기', () => this.buy(app), { enabled: !owned && s.gold >= o.price, color: C.gold });
  }

  pick(app: App, i: number): void {
    if (this.sel === i) {
      this.buy(app);
      return;
    }
    this.sel = i;
    app.sfx('move');
  }

  buy(app: App): void {
    const g = app.g!;
    const ok = this.sel === -1 ? buyCandy(g.save) : buyPart(g.save, g.shop!, this.sel);
    app.sfx(ok ? 'buy' : 'error');
    if (ok) {
      if (this.sel >= 0) app.toast(`「${PARTS[g.shop![this.sel].part].name}」 샀어요! 메뉴 › 부품에서 끼워요`, C.gold);
      refreshStats(g);
      app.saveNow();
    }
  }
}
