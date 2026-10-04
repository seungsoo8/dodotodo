/** 타이틀 · 저장 칸 고르기 · 캐릭터 만들기 */
import { CLASSES, HERO_ORDER } from '../../core/classes.ts';
import { newSave } from '../../core/character.ts';
import { buildMap } from '../../core/maps.ts';
import { deleteSlot, listSlots } from '../../core/saveio.ts';
import type { HeroId, Save } from '../../core/types.ts';
import { pixCanvas } from '../art/canvas.ts';
import { heroSprite, type Dir, type Pose } from '../art/heroes.ts';
import { C } from '../kit.ts';
import { store } from '../storage.ts';
import type { App, Screen } from './screen.ts';
import { SettingsScreen } from './settings.ts';

export class TitleScreen implements Screen {
  modal = true;
  draw(app: App): void {
    const ui = app.ui;
    const cx = ui.w / 2;
    const ty = Math.max(30, ui.h * 0.2);
    const bob = Math.sin(ui.time * 2) * 2;
    ui.ctx.fillStyle = 'rgba(10,6,20,0.35)';
    ui.ctx.fillRect(0, 0, ui.w, ui.h);
    ui.outlined('코링코 탐험대', cx, ty + bob, '#ffe8a8', ui.w < 420 ? 26 : 34);
    ui.outlined('장난감 나라를 지키는 네 인형의 모험', cx, ty + 30, C.light, 11);
    // 네 영웅이 걷는다
    const heroes = HERO_ORDER;
    const step = Math.floor(ui.time * 4) % 2 === 0 ? 'walkA' : 'walkB';
    heroes.forEach((h, i) => {
      const x = cx + (i - 1.5) * 44 - 26;
      const img = pixCanvas(heroSprite(h, 'down', step as Pose));
      ui.img(img, x, ty + 50, 52, 80);
    });
    const bw = 140;
    const by = Math.min(ui.h - 80, ty + 140);
    ui.button('start', cx - bw / 2, by, bw, 22, '모험 시작', () => {
      app.sfx('click');
      app.push(new SlotScreen());
    });
    ui.button('settings', cx - bw / 2, by + 28, bw, 22, '설정', () => {
      app.sfx('click');
      app.push(new SettingsScreen());
    });
    const help = app.touch ? '왼쪽을 끌어 이동 · 오른쪽 단추로 공격 · 스킬' : '방향키 이동 · Z 공격/확인 · X 구르기 · A S D F 스킬 · Q W 물약 · Esc 메뉴';
    const lines = ui.wrap(help, ui.w - 24, 9);
    lines.forEach((l, i) => ui.text(l, cx, ui.h - 14 - (lines.length - i) * 11, C.dim, 9, 'center'));
  }
  back(): void {
    /* 타이틀은 닫지 않는다 */
  }
}

function playTime(s: number): string {
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
}

export class SlotScreen implements Screen {
  modal = true;
  confirmDelete: number | null = null;
  draw(app: App): void {
    const ui = app.ui;
    ui.dim(0.5);
    const slots = listSlots(store);
    const pw = Math.min(ui.w - 16, 420);
    const rowH = 54;
    const ph = 40 + slots.length * (rowH + 6) + 30;
    const px = (ui.w - pw) / 2;
    const py = Math.max(8, (ui.h - ph) / 2);
    ui.panel(px, py, pw, ph);
    ui.text('저장 칸', px + pw / 2, py + 8, C.gold, 13, 'center');
    slots.forEach((s, i) => {
      const y = py + 32 + i * (rowH + 6);
      ui.panel(px + 8, y, pw - 16, rowH, C.panel2);
      if (s) {
        ui.img(pixCanvas(heroSprite(s.hero, 'down', 'idle')), px + 12, y - 4, 39, 60);
        ui.text(`${s.name}  Lv ${s.lv}`, px + 56, y + 6, C.light, 12);
        let where = '';
        try {
          where = buildMap(s.map === 'rift' ? 'village' : (s.map as 'village')).name;
        } catch {
          where = '';
        }
        ui.text(`${CLASSES[s.hero].title} · ${where} · ${playTime(s.playTime)}`, px + 56, y + 22, C.dim, 9);
        ui.text(`균열 최고 ${s.riftBest}층 · 골드 ${s.gold}`, px + 56, y + 35, C.dim, 9);
        const bx = px + pw - 16 - 4;
        if (this.confirmDelete === i) {
          ui.button(`del${i}`, bx - 54, y + 6, 54, 20, '정말 지우기', () => {
            deleteSlot(store, i);
            this.confirmDelete = null;
            app.sfx('back');
          }, { color: C.bad, size: 9 });
          ui.button(`keep${i}`, bx - 54, y + 29, 54, 20, '그만두기', () => {
            this.confirmDelete = null;
          }, { size: 9 });
        } else {
          ui.button(`play${i}`, bx - 54, y + 6, 54, 20, '이어하기', () => {
            app.sfx('click');
            app.startGame(s, false);
          }, { color: C.gold });
          ui.button(`delask${i}`, bx - 54, y + 29, 54, 20, '지우기', () => {
            this.confirmDelete = i;
            app.sfx('click');
          }, { size: 9 });
        }
      } else {
        ui.text('빈 칸', px + 20, y + 20, C.dim, 12);
        ui.button(`new${i}`, px + pw - 16 - 4 - 80, y + 16, 80, 22, '새로 만들기', () => {
          app.sfx('click');
          app.push(new CreateScreen(i));
        }, { color: C.gold });
      }
    });
    ui.button('back', px + pw / 2 - 40, py + ph - 26, 80, 20, '뒤로', () => app.pop(), { size: 10 });
  }
}

export class CreateScreen implements Screen {
  modal = true;
  pick: HeroId = 'toby';
  readonly slot: number;
  constructor(slot: number) {
    this.slot = slot;
  }
  draw(app: App): void {
    const ui = app.ui;
    ui.dim(0.6);
    const pw = Math.min(ui.w - 12, 460);
    const portrait = ui.w < ui.h;
    const ph = Math.min(ui.h - 12, portrait ? 420 : 300);
    const px = (ui.w - pw) / 2;
    const py = (ui.h - ph) / 2;
    ui.panel(px, py, pw, ph);
    ui.text('탐험대원 고르기', px + pw / 2, py + 8, C.gold, 13, 'center');
    const cw = (pw - 16 - 3 * 6) / 4;
    HERO_ORDER.forEach((h, i) => {
      const x = px + 8 + i * (cw + 6);
      const y = py + 28;
      const on = this.pick === h;
      const focus = ui.hit(`h${h}`, x, y, cw, 76, () => {
        this.pick = h;
        app.sfx('move');
      });
      ui.panel(x, y, cw, 76, on ? '#4a3e66' : C.panel2, on || focus ? C.focus : C.edge);
      const dirs: Dir[] = ['down', 'right', 'up', 'left'];
      const d = on ? dirs[Math.floor(ui.time * 1.5) % 4] : 'down';
      const pose: Pose = on ? (Math.floor(ui.time * 5) % 2 ? 'walkA' : 'walkB') : 'idle';
      const sz = Math.min(1.5, cw / 30);
      ui.img(pixCanvas(heroSprite(h, d, pose)), x + cw / 2 - 13 * sz, y + 2, 26 * sz, 40 * sz);
      ui.text(CLASSES[h].name, x + cw / 2, y + 62, on ? C.gold : C.light, 11, 'center');
    });
    const c = CLASSES[this.pick];
    let yy = py + 112;
    ui.text(`${c.name} · ${c.title}`, px + 12, yy, c.color, 12);
    yy += 16;
    ui.text(c.role, px + 12, yy, C.dim, 9);
    yy += 14;
    yy += ui.paragraph(c.desc, px + 12, yy, pw - 24, C.light, 10, 4);
    const b = c.base;
    ui.text(`힘 ${b.str}  체력 ${b.vit}  민첩 ${b.dex}  지능 ${b.int}   HP ${c.hpBase}`, px + 12, yy + 4, C.dim, 9);
    ui.button('go', px + pw / 2 - 70, py + ph - 30, 140, 22, `${c.name}로 시작!`, () => {
      app.sfx('click');
      const save: Save = newSave(this.pick, c.name, this.slot);
      app.startGame(save, true);
    }, { color: C.gold });
  }
  key(app: App, a: string): boolean {
    if (a === 'left' || a === 'right') {
      const i = HERO_ORDER.indexOf(this.pick);
      this.pick = HERO_ORDER[(i + (a === 'left' ? 3 : 1)) % 4];
      app.ui.focus = `h${this.pick}`;
      app.sfx('move');
      return true;
    }
    return false;
  }
}
