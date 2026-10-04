/** 별지기 부엉이: 다락방 균열 깊이 고르기 */
import { enterRift } from '../../core/game.ts';
import { RIFT_MAX, riftBoss, riftLevel } from '../../core/maps.ts';
import { MONSTERS } from '../../core/monsters.ts';
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';

export class RiftScreen implements Screen {
  modal = true;
  depth = 1;
  constructor() {}
  draw(app: App): void {
    const ui = app.ui;
    const s = app.g!.save;
    const max = Math.min(RIFT_MAX, s.riftBest + 1);
    if (this.depth === 1 && s.riftDepth > 1) this.depth = Math.min(max, s.riftDepth);
    this.depth = Math.max(1, Math.min(max, this.depth));
    ui.dim(0.5);
    const pw = Math.min(ui.w - 16, 300);
    const ph = 170;
    const px = (ui.w - pw) / 2;
    const py = (ui.h - ph) / 2;
    ui.panel(px, py, pw, ph);
    ui.text('다락방 균열', px + pw / 2, py + 8, '#d8c0ff', 13, 'center');
    ui.text(`가장 깊이 간 곳: ${s.riftBest}층`, px + pw / 2, py + 26, C.dim, 9, 'center');
    ui.button('d-10', px + 12, py + 46, 30, 22, '-10', () => (this.depth -= 10), { size: 9 });
    ui.button('d-1', px + 46, py + 46, 26, 22, '◀', () => (this.depth -= 1));
    ui.text(`${this.depth}층`, px + pw / 2, py + 50, C.gold, 14, 'center');
    ui.button('d+1', px + pw - 72, py + 46, 26, 22, '▶', () => (this.depth += 1));
    ui.button('d+10', px + pw - 42, py + 46, 30, 22, '+10', () => (this.depth += 10), { size: 9 });
    const boss = riftBoss(this.depth);
    ui.text(`권장 레벨 ${riftLevel(this.depth)}`, px + pw / 2, py + 78, C.light, 10, 'center');
    ui.text(boss ? `수호 보스: ${MONSTERS[boss].name}` : '몬스터를 쓰러뜨려 게이지를 채우면 수호자가 나와요', px + pw / 2, py + 94, boss ? C.bad : C.dim, 9, 'center');
    ui.button('go', px + pw / 2 - 60, py + 116, 120, 22, '들어가기', () => {
      app.sfx('click');
      app.closeAll();
      enterRift(app.g!, this.depth);
    }, { color: '#d8c0ff' });
    ui.button('close', px + pw / 2 - 30, py + 142, 60, 18, '닫기', () => app.pop(), { size: 9 });
  }
  key(app: App, a: string): boolean {
    if (a === 'left' || a === 'right') {
      this.depth += a === 'left' ? -1 : 1;
      app.sfx('move');
      return true;
    }
    return false;
  }
}
