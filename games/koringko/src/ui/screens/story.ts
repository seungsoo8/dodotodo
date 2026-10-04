/** 이야기 장 넘기기 (서막 · 보스 뒤 장면 · 엔딩) */
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';

export interface Page {
  who?: string;
  text: string;
}

export class StoryScreen implements Screen {
  modal = true;
  i = 0;
  shown = 0;
  private readonly pages: Page[];
  private readonly title: string;
  private readonly done: (app: App) => void;
  constructor(pages: Page[], title: string, done: (app: App) => void) {
    this.pages = pages;
    this.title = title;
    this.done = done;
  }

  draw(app: App, dt: number): void {
    const ui = app.ui;
    ui.dim(0.72);
    const p = this.pages[this.i];
    this.shown = Math.min(p.text.length, this.shown + dt * 28);
    const pw = Math.min(ui.w - 16, 440);
    const px = (ui.w - pw) / 2;
    const lines = ui.wrap(p.text, pw - 24, 12);
    const ph = 50 + lines.length * 17 + 30;
    const py = Math.max(8, ui.h * 0.62 - ph / 2);
    if (this.title) ui.outlined(this.title, ui.w / 2, Math.max(20, py - 30), C.gold, 16);
    ui.panel(px, py, pw, ph);
    let y = py + 10;
    if (p.who) {
      ui.text(p.who, px + 12, y, C.gold, 11);
      y += 18;
    }
    let left = Math.floor(this.shown);
    for (const l of lines) {
      const part = l.slice(0, Math.max(0, left));
      left -= l.length + 1;
      ui.text(part, px + 12, y, C.light, 12);
      y += 17;
    }
    ui.text(`${this.i + 1} / ${this.pages.length}`, px + 12, py + ph - 18, C.dim, 9);
    const full = this.shown >= p.text.length;
    ui.button('next', px + pw - 78, py + ph - 24, 70, 18, full ? (this.i + 1 < this.pages.length ? '다음 ▶' : '닫기') : '▶▶', () => this.next(app), { size: 10 });
    ui.button('skip', px + pw - 150, py + ph - 24, 66, 18, '건너뛰기', () => this.finish(app), { size: 9, color: C.dim });
    if (ui.focus !== 'next' && ui.focus !== 'skip') ui.focus = 'next';
  }

  next(app: App): void {
    const p = this.pages[this.i];
    if (this.shown < p.text.length) {
      this.shown = p.text.length;
      return;
    }
    app.sfx('page');
    if (this.i + 1 < this.pages.length) {
      this.i++;
      this.shown = 0;
    } else this.finish(app);
  }

  finish(app: App): void {
    app.pop();
    this.done(app);
  }

  back(app: App): void {
    this.finish(app);
  }

  key(app: App, a: string): boolean {
    if (a === 'attack') {
      this.next(app);
      return true;
    }
    return false;
  }
}
