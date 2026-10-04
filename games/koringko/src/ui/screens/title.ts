/** 타이틀 · 저장 칸 고르기 · 새 모험 */
import { CLASSES, HERO_ORDER } from '../../core/classes.ts';
import { newSave } from '../../core/character.ts';
import { buildMap } from '../../core/maps.ts';
import { deleteSlot, isOldSave, listSlots } from '../../core/saveio.ts';
import type { Difficulty, Save } from '../../core/types.ts';
import { CLEAR, Pix } from '../art/paint.ts';
import { DIFFICULTIES, DIFFICULTY } from '../../core/difficulty.ts';
import { pixCanvas } from '../art/canvas.ts';
import { heroSprite, type Pose } from '../art/heroes.ts';
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
    // 제목 뒤는 어둡게 가라앉히고 가운데만 은은하게
    const c = ui.ctx;
    const gr = c.createRadialGradient(cx, ty + 70, 20, cx, ty + 70, Math.max(ui.w, ui.h) * 0.7);
    gr.addColorStop(0, 'rgba(10,6,20,0.15)');
    gr.addColorStop(1, 'rgba(10,6,20,0.7)');
    c.fillStyle = gr;
    c.fillRect(0, 0, ui.w, ui.h);
    ui.outlined('코링코 탐험대', cx, ty + bob, '#ffe8a8', ui.w < 420 ? 26 : 34);
    ui.outlined('태엽 인형들의 집 안 대모험', cx, ty + 30, C.light, 11);
    // 토비가 앞장서고, 아직 먼지 속에 있는 동료들은 그림자
    const step = Math.floor(ui.time * 4) % 2 === 0 ? 'walkA' : 'walkB';
    HERO_ORDER.forEach((h, i) => {
      const x = cx + (i - 1.5) * 44 - 26;
      const img = i === 0 ? pixCanvas(heroSprite(h, 'down', step as Pose)) : shade(h);
      ui.img(img, x, ty + 50 + (i ? 4 : 0), 52, 80);
      if (i) ui.outlined('?', x + 26, ty + 72, '#a898c0', 14);
    });
    const bw = 140;
    const by = Math.min(ui.h - 80, ty + 140);
    ui.button('start', cx - bw / 2, by, bw, 22, '모험 시작', () => {
      app.sfx('click');
      // 저장이 하나도 없으면 바로 새 모험
      const slots = listSlots(store);
      const fresh = slots.every((x, i) => !x && !isOldSave(store, i));
      app.push(fresh ? new CreateScreen(0) : new SlotScreen());
    });
    ui.button('settings', cx - bw / 2, by + 28, bw, 22, '설정', () => {
      app.sfx('click');
      app.push(new SettingsScreen());
    });
    const help = app.touch ? '왼쪽을 끌어 이동 · 오른쪽 단추로 공격 · 구르기' : '방향키 이동 · Z 공격/확인 · X 구르기 · Q 사탕 · Esc 메뉴';
    const lines = ui.wrap(help, ui.w - 24, 9);
    lines.forEach((l, i) => ui.text(l, cx, ui.h - 14 - (lines.length - i) * 11, C.dim, 9, 'center'));
  }
  back(): void {
    /* 타이틀은 닫지 않는다 */
  }
}

/** 아직 구하지 않은 동료: 먼지 그림자 */
const SHADE = new Map<string, HTMLCanvasElement>();
function shade(h: Save['hero']): HTMLCanvasElement {
  let c = SHADE.get(h);
  if (!c) {
    const p = heroSprite(h, 'down', 'idle');
    const q = new Pix(p.w, p.h);
    for (let i = 0; i < p.px.length; i++) if (p.px[i] !== CLEAR) q.px[i] = 0x4a4058;
    c = pixCanvas(q);
    SHADE.set(h, c);
  }
  return c;
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
        s.party.forEach((h, k) => ui.img(pixCanvas(heroSprite(h, 'down', 'idle')), px + 10 + k * 13, y - 2 + (k % 2) * 3, 30, 46));
        const tx = px + 18 + s.party.length * 13 + 22;
        ui.text(`${s.name}  Lv ${s.lv}`, tx, y + 6, C.light, 12);
        let where = '';
        try {
          where = buildMap(s.map === 'rift' ? 'village' : (s.map as 'village')).name;
        } catch {
          where = '';
        }
        ui.text(`동료 ${s.party.length}/4 · ${where} · ${playTime(s.playTime)}`, tx, y + 22, C.dim, 9);
        ui.text(`친구 ${s.rescued.length} · 단추 ${s.gold}${s.riftBest ? ` · 다락방 상자 ${s.riftBest}층` : ''}`, tx, y + 35, C.dim, 9);
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
      } else if (isOldSave(store, i)) {
        ui.text('예전 코링코 저장', px + 20, y + 8, C.dim, 11);
        ui.paragraph('게임이 새 규칙으로 바뀌어 이어할 수 없어요.', px + 20, y + 24, pw - 140, C.dim, 9);
        ui.button(`wipe${i}`, px + pw - 16 - 4 - 80, y + 16, 80, 22, '지우고 새로', () => {
          deleteSlot(store, i);
          app.sfx('click');
          app.push(new CreateScreen(i));
        }, { color: C.gold, size: 10 });
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
  diff: Difficulty = 'normal';
  readonly slot: number;
  private focused = false;
  constructor(slot: number) {
    this.slot = slot;
  }
  draw(app: App): void {
    const ui = app.ui;
    // 처음엔 '모험 시작!' 에 손가락이 가 있다 (Z 두 번이면 바로 시작)
    if (!this.focused) {
      this.focused = true;
      ui.focus = 'go';
    }
    ui.dim(0.6);
    const pw = Math.min(ui.w - 12, 420);
    const ph = Math.min(ui.h - 12, 200);
    const px = (ui.w - pw) / 2;
    const py = (ui.h - ph) / 2;
    ui.panel(px, py, pw, ph);
    ui.text('새 모험', px + pw / 2, py + 8, C.gold, 13, 'center');
    const step: Pose = Math.floor(ui.time * 5) % 2 ? 'walkA' : 'walkB';
    ui.img(pixCanvas(heroSprite('toby', 'down', step)), px + 14, py + 28, 39, 60);
    const c = CLASSES.toby;
    ui.text(`${c.name} · ${c.title}`, px + 62, py + 32, c.color, 12);
    ui.paragraph('아이 방 장난감들의 밤 모험. 발소리가 들리면… 얼음!', px + 62, py + 50, pw - 74, C.light, 10);
    // 난이도
    const dy = py + ph - 64;
    ui.text('난이도', px + 12, dy + 4, C.light, 10);
    const dw = Math.min(70, (pw - 70) / 3 - 4);
    DIFFICULTIES.forEach((d, i) =>
      ui.button(`d-${d}`, px + 56 + i * (dw + 4), dy, dw, 18, DIFFICULTY[d].name, () => {
        this.diff = d;
        app.sfx('move');
      }, { active: this.diff === d, size: 10 }),
    );
    ui.text(DIFFICULTY[this.diff].desc, px + 12, dy + 22, C.dim, 9);
    ui.button('go', px + pw / 2 - 70, py + ph - 30, 140, 22, '모험 시작!', () => {
      app.sfx('click');
      const save: Save = newSave(this.slot, 'toby');
      save.difficulty = this.diff;
      app.startGame(save, true);
    }, { color: C.gold });
  }
  key(app: App, a: string): boolean {
    if (a === 'left' || a === 'right') {
      const i = DIFFICULTIES.indexOf(this.diff);
      this.diff = DIFFICULTIES[(i + (a === 'left' ? 2 : 1)) % 3];
      app.ui.focus = `d-${this.diff}`;
      app.sfx('move');
      return true;
    }
    return false;
  }
}
