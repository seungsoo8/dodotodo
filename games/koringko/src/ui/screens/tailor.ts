/** 재봉 토끼: 부품 만들기 · 꿰매서 단계 올리기 */
import { refreshStats } from '../../core/combat.ts';
import { BASIC_PARTS, PART_MAX, PARTS, craftPart, sewCost, sewPart } from '../../core/parts.ts';
import type { MatId } from '../../core/types.ts';
import { pixCanvas } from '../art/canvas.ts';
import { goldIcon, matIcon, partIcon } from '../art/icons.ts';
import { C, frame } from '../kit.ts';
import { MAT_NAME } from '../hud.ts';
import type { App, Screen } from './screen.ts';

export class TailorScreen implements Screen {
  modal = true;
  sel = BASIC_PARTS[0];

  draw(app: App): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    ui.dim(0.5);
    const F = frame(ui, 500, 320);
    ui.panel(F.px, F.py, F.pw, F.ph);
    ui.text('재봉 토끼의 부품 공방', F.px + 8, F.py + 6, C.gold, 12);
    ui.img(pixCanvas(goldIcon()), F.px + F.pw - 70, F.py + 6, 11, 11);
    ui.text(`${s.gold}`, F.px + F.pw - 8, F.py + 7, C.gold, 10, 'right');
    ui.button('close', F.px + F.pw - 26, F.py + F.ph - 24, 20, 18, '✕', () => app.pop(), { size: 10 });
    const x = F.px + 8;
    const y = F.py + 26;
    const lw = F.side ? Math.floor(F.pw * 0.46) : F.pw - 16;
    const rowH = 19;
    BASIC_PARTS.forEach((id, i) => {
      const col = F.side ? 0 : i % 2;
      const row = F.side ? i : Math.floor(i / 2);
      const bw = F.side ? lw : lw / 2 - 2;
      const rx = x + col * (bw + 4);
      const ry = y + row * (rowH + 2);
      const p = PARTS[id];
      const lv = s.parts[id] ?? 0;
      const f = ui.hit(`t-${id}`, rx, ry, bw, rowH, () => (this.sel = id));
      ui.panel(rx, ry, bw, rowH, this.sel === id ? '#4a3e66' : C.panel2, f ? C.focus : C.edge);
      ui.img(pixCanvas(partIcon(id, p.color)), rx + 2, ry + 2, 15, 15);
      ui.text(p.name, rx + 20, ry + 4, lv ? C.light : C.dim, 9);
      ui.text(lv ? '●'.repeat(lv) + '○'.repeat(PART_MAX - lv) : '없음', rx + bw - 4, ry + 4, lv ? C.gold : C.dim, 8, 'right');
    });
    const rows = F.side ? BASIC_PARTS.length : Math.ceil(BASIC_PARTS.length / 2);
    const ix = F.side ? x + lw + 10 : x;
    let iy = F.side ? y : y + rows * (rowH + 2) + 6;
    const iw = F.side ? F.pw - lw - 26 : F.pw - 16;
    const id = this.sel;
    const p = PARTS[id];
    const lv = s.parts[id] ?? 0;
    ui.img(pixCanvas(partIcon(id, p.color)), ix, iy, 28, 28);
    ui.text(p.name, ix + 34, iy + 2, p.color, 12);
    ui.text(lv ? `${lv}단계 / ${PART_MAX}` : '아직 없어요', ix + 34, iy + 17, C.dim, 9);
    iy += 34;
    iy += ui.paragraph(p.desc(Math.max(1, lv)), ix, iy, iw, C.light, 10);
    let cost: { gold: number; mats: Partial<Record<MatId, number>> } | null;
    let label: string;
    if (!lv) {
      cost = p.craft ? { gold: p.craft.gold, mats: p.craft.mats } : null;
      label = '만들기';
    } else {
      cost = sewCost(id, lv);
      label = '꿰매기';
      if (cost) iy += ui.paragraph(`꿰매면: ${p.desc(lv + 1)}`, ix, iy, iw, C.good, 9);
    }
    if (!cost) {
      ui.paragraph('더 꿰맬 곳이 없어요. 최고 단계!', ix, iy + 4, iw, C.gold, 10);
      return;
    }
    iy += 6;
    let cx = ix;
    const need: [HTMLCanvasElement, string, number, number][] = [[pixCanvas(goldIcon()), '단추', cost.gold, s.gold]];
    for (const [m, n] of Object.entries(cost.mats)) if (n) need.push([pixCanvas(matIcon(m as MatId)), MAT_NAME[m], n, s.mats[m as MatId]]);
    for (const [im, name, n, have] of need) {
      const t = `${name} ${n} (${have})`;
      if (cx + ui.measure(t, 9) + 16 > ix + iw) {
        cx = ix;
        iy += 14;
      }
      ui.img(im, cx, iy, 12, 12);
      ui.text(t, cx + 14, iy + 1, have >= n ? C.light : C.bad, 9);
      cx += ui.measure(t, 9) + 22;
    }
    iy += 20;
    const ok = s.gold >= cost.gold && Object.entries(cost.mats).every(([m, n]) => s.mats[m as MatId] >= (n ?? 0));
    ui.button('make', ix, iy, 100, 22, label, () => {
      const done = lv ? sewPart(s, id) : craftPart(s, id);
      if (done) {
        app.sfx('forgeOk');
        app.toast(lv ? `「${p.name}」 ${s.parts[id]}단계!` : `「${p.name}」 완성! 메뉴 › 부품에서 끼워요`, C.gold);
        refreshStats(g);
        app.saveNow();
      } else app.sfx('error');
    }, { enabled: ok, color: C.gold });
  }
}
