/** 소리 크기 */
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';

export class SettingsScreen implements Screen {
  modal = true;
  draw(app: App): void {
    const ui = app.ui;
    ui.dim(0.5);
    const pw = Math.min(ui.w - 16, 260);
    const ph = 120;
    const px = (ui.w - pw) / 2;
    const py = (ui.h - ph) / 2;
    ui.panel(px, py, pw, ph);
    ui.text('설정', px + pw / 2, py + 8, C.gold, 13, 'center');
    (['bgm', 'sfx'] as const).forEach((k, i) => {
      const y = py + 34 + i * 28;
      ui.text(k === 'bgm' ? '음악' : '효과음', px + 12, y + 4, C.light, 11);
      const v = app.volume[k];
      ui.button(`${k}-`, px + 70, y, 22, 20, '-', () => app.setVolume(k, Math.max(0, Math.round((v - 0.1) * 10) / 10)));
      ui.bar(px + 98, y + 7, pw - 160, 6, v, C.gold);
      ui.button(`${k}+`, px + pw - 56, y, 22, 20, '+', () => app.setVolume(k, Math.min(1, Math.round((v + 0.1) * 10) / 10)));
      ui.text(`${Math.round(v * 10)}`, px + pw - 22, y + 4, C.light, 10);
    });
    ui.button('close', px + pw / 2 - 40, py + ph - 26, 80, 20, '닫기', () => app.pop(), { size: 10 });
  }
}
