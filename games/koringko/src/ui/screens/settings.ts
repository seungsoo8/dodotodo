/** 소리 크기 */
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';

export class SettingsScreen implements Screen {
  modal = true;
  draw(app: App): void {
    const ui = app.ui;
    ui.dim(0.5);
    const pw = Math.min(ui.w - 16, 260);
    const ph = 200;
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
    const prefs: ['autoAttack' | 'shake' | 'hints', string][] = [
      ['autoAttack', '휴대폰 자동 공격'],
      ['shake', '화면 흔들림'],
      ['hints', '처음 안내 보기'],
    ];
    prefs.forEach(([k, name], i) => {
      const y = py + 92 + i * 24;
      ui.text(name, px + 12, y + 4, C.light, 10);
      const on = app.prefs[k];
      ui.button(`p-${k}`, px + pw - 70, y, 58, 18, on ? '켜짐' : '꺼짐', () => app.setPref(k, !on), { active: on, size: 9, color: on ? C.good : C.dim });
    });
    ui.button('close', px + pw / 2 - 40, py + ph - 26, 80, 20, '닫기', () => app.pop(), { size: 10 });
  }
}
