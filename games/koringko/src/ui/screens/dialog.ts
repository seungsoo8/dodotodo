/** NPC 와 이야기: 퀘스트 받기 · 보고 · 가게 열기 */
import { accept, complete, questFor, type QuestDef } from '../../core/quests.ts';
import { NPCS } from '../../core/story.ts';
import { pixCanvas } from '../art/canvas.ts';
import { npcSprite } from '../art/heroes.ts';
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';
import { ShopScreen } from './shop.ts';
import { ForgeScreen } from './forge.ts';
import { RiftScreen } from './rift.ts';

interface Option {
  id: string;
  label: string;
  color?: string;
  act: (app: App) => void;
}

const talkIndex: Record<string, number> = {};

function rewardText(q: QuestDef): string {
  const r = q.reward;
  const parts = [`경험치 ${r.exp}`, `골드 ${r.gold}`];
  if (r.potions?.hp) parts.push(`빨간 물약 ${r.potions.hp}`);
  if (r.potions?.sp) parts.push(`파란 물약 ${r.potions.sp}`);
  if (r.item) parts.push('장비');
  return parts.join(' · ');
}

export class DialogScreen implements Screen {
  modal = true;
  pages: string[] = [];
  i = 0;
  shown = 0;
  options: Option[] = [];
  readonly npc: string;

  constructor(app: App, npc: string) {
    this.npc = npc;
    this.build(app);
  }

  build(app: App): void {
    const g = app.g!;
    const info = NPCS[this.npc];
    const q = questFor(g.save, this.npc);
    this.options = [];
    this.i = 0;
    this.shown = 0;
    if (q?.mode === 'offer') {
      this.pages = [...q.quest.talk.offer, `[퀘스트] ${q.quest.name}: ${q.quest.goal} (${q.quest.count}) — 보상: ${rewardText(q.quest)}`];
      this.options.push({
        id: 'accept',
        label: '좋아요!',
        color: C.gold,
        act: (a) => {
          accept(a.g!.save, q.quest.id);
          a.sfx('quest');
          a.toast(`퀘스트 시작: ${q.quest.name}`, C.gold);
          a.saveNow();
          this.build(a);
          this.afterQuest(a);
        },
      });
      this.options.push({ id: 'later', label: '나중에', act: (a) => a.pop() });
      return;
    }
    if (q?.mode === 'done') {
      this.pages = [...q.quest.talk.done];
      this.options.push({
        id: 'reward',
        label: `보상 받기`,
        color: C.gold,
        act: (a) => {
          const lv = a.g!.save.lv;
          if (complete(a.g!.save, q.quest.id, a.g!.rng)) {
            a.sfx('quest');
            a.toast(`퀘스트 완료! ${rewardText(q.quest)}`, C.good);
            a.changed(lv);
            a.saveNow();
          }
          this.build(a);
        },
      });
      return;
    }
    if (q?.mode === 'progress') this.pages = [q.quest.talk.progress];
    else {
      const n = talkIndex[this.npc] ?? 0;
      talkIndex[this.npc] = n + 1;
      this.pages = [info.lines[n % info.lines.length]];
    }
    this.afterQuest(app);
  }

  /** 퀘스트 이야기가 없을 때: 가게 · 대장간 · 균열 */
  afterQuest(app: App): void {
    const info = NPCS[this.npc];
    this.options = [];
    if (info.menu === 'shop') this.options.push({ id: 'shop', label: '가게 보기', color: C.gold, act: (a) => (a.pop(), a.push(new ShopScreen())) });
    if (info.menu === 'forge') this.options.push({ id: 'forge', label: '강화 · 분해', color: C.gold, act: (a) => (a.pop(), a.push(new ForgeScreen())) });
    if (info.menu === 'rift') this.options.push({ id: 'rift', label: '균열로 가기', color: '#d8c0ff', act: (a) => (a.pop(), a.push(new RiftScreen())) });
    this.options.push({ id: 'bye', label: '안녕!', act: (a) => a.pop() });
    void app;
  }

  draw(app: App, dt: number): void {
    const ui = app.ui;
    const info = NPCS[this.npc];
    const text = this.pages[this.i] ?? '';
    this.shown = Math.min(text.length, this.shown + dt * 36);
    const pw = Math.min(ui.w - 12, 460);
    const px = (ui.w - pw) / 2;
    const lines = ui.wrap(text, pw - 70, 11);
    const ph = Math.max(78, 34 + lines.length * 15 + 30);
    const py = ui.h - ph - 8;
    ui.panel(px, py, pw, ph);
    ui.panel(px + 6, py + 6, 50, 50, '#4a3e66');
    ui.img(pixCanvas(npcSprite(this.npc)), px + 6 + 25 - 19.5, py + 4, 39, 60);
    ui.text(`${info.name}`, px + 62, py + 6, info.color, 11);
    ui.text(info.title, px + 62 + ui.measure(info.name, 11) + 6, py + 8, C.dim, 9);
    let left = Math.floor(this.shown);
    lines.forEach((l, k) => {
      ui.text(l.slice(0, Math.max(0, left)), px + 62, py + 24 + k * 15, C.light, 11);
      left -= l.length + 1;
    });
    const last = this.i >= this.pages.length - 1 && this.shown >= text.length;
    if (!last) {
      ui.button('more', px + pw - 64, py + ph - 24, 56, 18, '▶', () => this.next(app), { size: 10 });
      ui.focus = 'more';
      return;
    }
    // 고르기
    let x = px + pw - 8;
    for (const o of [...this.options].reverse()) {
      const bw = Math.max(54, ui.measure(o.label, 10) + 16);
      x -= bw;
      ui.button(`opt-${o.id}`, x, py + ph - 24, bw, 18, o.label, () => o.act(app), { size: 10, color: o.color });
      x -= 4;
    }
    if (!ui.focus?.startsWith('opt-') && this.options.length) ui.focus = `opt-${this.options[0].id}`;
  }

  next(app: App): void {
    const text = this.pages[this.i] ?? '';
    if (this.shown < text.length) {
      this.shown = text.length;
      return;
    }
    if (this.i < this.pages.length - 1) {
      this.i++;
      this.shown = 0;
      app.sfx('page');
    }
  }

  key(app: App, a: string): boolean {
    const last = this.i >= this.pages.length - 1 && this.shown >= (this.pages[this.i] ?? '').length;
    if (a === 'attack' && !last) {
      this.next(app);
      return true;
    }
    return false;
  }
}
