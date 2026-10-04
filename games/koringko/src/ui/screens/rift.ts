/** 다락방 균열: 시작 층 고르기 · 축복 카드 · 돌아가는 문 */
import { RIFT_MAX, riftBoss, riftLevel } from '../../core/maps.ts';
import { MONSTERS } from '../../core/monsters.ts';
import { BLESSINGS, checkpoints, chooseBlessing, endRun, nextFloor, RULES, startRun } from '../../core/riftrun.ts';
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';

export class RiftScreen implements Screen {
  modal = true;
  pick = -1;
  draw(app: App): void {
    const ui = app.ui;
    const s = app.g!.save;
    const cps = checkpoints(s.riftBest);
    if (this.pick < 0) this.pick = cps.length - 1;
    this.pick = Math.max(0, Math.min(cps.length - 1, this.pick));
    const depth = cps[this.pick];
    ui.dim(0.5);
    const pw = Math.min(ui.w - 16, 320);
    const ph = 196;
    const px = (ui.w - pw) / 2;
    const py = (ui.h - ph) / 2;
    ui.panel(px, py, pw, ph);
    ui.text('다락방 균열', px + pw / 2, py + 8, '#d8c0ff', 13, 'center');
    ui.text(`가장 깊이 간 곳: ${s.riftBest}층 / ${RIFT_MAX}층`, px + pw / 2, py + 26, C.dim, 9, 'center');
    ui.button('d-', px + 40, py + 46, 26, 22, '◀', () => (this.pick -= 1), { enabled: this.pick > 0 });
    ui.text(`${depth}층부터`, px + pw / 2, py + 50, C.gold, 14, 'center');
    ui.button('d+', px + pw - 66, py + 46, 26, 22, '▶', () => (this.pick += 1), { enabled: this.pick < cps.length - 1 });
    ui.text(`권장 레벨 ${riftLevel(depth)} · 5층마다 보스`, px + pw / 2, py + 76, C.light, 10, 'center');
    const nextBoss = Array.from({ length: 5 }, (_, i) => depth + i).find((d) => riftBoss(d));
    if (nextBoss) ui.text(`${nextBoss}층 보스: ${MONSTERS[riftBoss(nextBoss)!].name}`, px + pw / 2, py + 90, C.bad, 9, 'center');
    ui.paragraph('한 층을 깰 때마다 축복 카드를 하나 골라요. 쓰러지거나 마을로 돌아오면 판이 끝나고 축복은 사라져요. 5층마다 시작 층이 열려요.', px + 12, py + 106, pw - 24, C.dim, 9, 3);
    ui.button('go', px + pw / 2 - 60, py + ph - 48, 120, 22, '들어가기', () => {
      app.sfx('click');
      app.closeAll();
      startRun(app.g!, depth);
    }, { color: '#d8c0ff' });
    ui.button('close', px + pw / 2 - 30, py + ph - 22, 60, 16, '닫기', () => app.pop(), { size: 9 });
  }
  key(app: App, a: string): boolean {
    if (a === 'left' || a === 'right') {
      this.pick += a === 'left' ? -1 : 1;
      app.sfx('move');
      return true;
    }
    return false;
  }
}

/** 층을 깬 뒤 축복 셋 중 하나 */
export class BlessingScreen implements Screen {
  modal = true;
  draw(app: App): void {
    const ui = app.ui;
    const run = app.g?.run;
    if (!run?.offer) {
      app.pop();
      return;
    }
    ui.dim(0.65);
    ui.outlined(`${run.depth}층 정화! 축복을 하나 고르세요`, ui.w / 2, Math.max(24, ui.h * 0.2), C.gold, 14);
    const n = run.offer.length;
    const portrait = ui.w < 420;
    const cw = portrait ? Math.min(ui.w - 32, 260) : Math.min(150, (ui.w - 40) / n - 8);
    const ch = portrait ? 62 : 120;
    run.offer.forEach((id, i) => {
      const b = BLESSINGS[id];
      const x = portrait ? (ui.w - cw) / 2 : ui.w / 2 + (i - (n - 1) / 2) * (cw + 10) - cw / 2;
      const y = portrait ? ui.h * 0.28 + i * (ch + 8) : ui.h * 0.32;
      const f = ui.hit(`b${i}`, x, y, cw, ch, () => {
        chooseBlessing(app.g!, i);
        app.sfx('quest');
        app.toast(`축복: ${b.name}`, C.gold);
        app.pop();
      });
      const power = !!b.power;
      ui.panel(x, y, cw, ch, power ? '#4a3a20' : '#352c58', f || ui.hover === `b${i}` ? C.focus : power ? C.gold : C.edge);
      ui.text(b.name, x + cw / 2, y + 10, power ? C.gold : C.light, 12, 'center');
      ui.paragraph(b.desc, x + 8, y + 30, cw - 16, C.dim, 10);
      const count = run.blessings.filter((x2) => x2 === id).length;
      if (count) ui.text(`가진 수 ${count}`, x + cw / 2, y + ch - 14, C.dim, 8, 'center');
    });
  }
  back(): void {
    /* 꼭 하나 골라야 한다 */
  }
}

/** 돌아가는 문: 다음 층 · 마을 */
export class PortalScreen implements Screen {
  modal = true;
  draw(app: App): void {
    const ui = app.ui;
    const g = app.g!;
    const run = g.run!;
    ui.dim(0.5);
    const pw = Math.min(ui.w - 16, 300);
    const ph = 150;
    const px = (ui.w - pw) / 2;
    const py = (ui.h - ph) / 2;
    ui.panel(px, py, pw, ph);
    ui.text('돌아가는 문', px + pw / 2, py + 8, '#d8c0ff', 13, 'center');
    const next = run.depth + 1;
    ui.text(`축복 ${run.blessings.length}개 · HP ${Math.ceil(g.save.hp)}/${g.stats.maxHp}`, px + pw / 2, py + 28, C.dim, 9, 'center');
    if (next <= RIFT_MAX) {
      const boss = riftBoss(next);
      ui.text(boss ? `${next}층: 보스 ${MONSTERS[boss].name}` : `${next}층으로`, px + pw / 2, py + 46, boss ? C.bad : C.light, 10, 'center');
      ui.button('next', px + pw / 2 - 70, py + 66, 140, 22, '다음 층으로', () => {
        app.closeAll();
        nextFloor(g);
      }, { color: C.gold });
    } else ui.text('가장 깊은 곳이에요!', px + pw / 2, py + 46, C.gold, 10, 'center');
    ui.button('home', px + pw / 2 - 70, py + 94, 140, 22, '마을로 (판 끝)', () => {
      app.closeAll();
      endRun(g);
      app.saveNow();
    });
    ui.button('stay', px + pw / 2 - 30, py + 122, 60, 16, '더 둘러보기', () => app.pop(), { size: 9 });
  }
}

export function ruleText(rule: keyof typeof RULES): string {
  return rule === 'none' ? '' : `${RULES[rule].name}: ${RULES[rule].desc}`;
}
