/**
 * 어드벤처 화면 위 글자 · 창: 말풍선 감정, 살펴보기 표시, 대화창(초상화 · 한 글자씩), 고르기,
 * 장 제목 카드, 위아래 검은 띠, 할 일 · 기억 조각 · 태엽, 발소리 경고, 작은 놀이, 크레디트, 기억 색감.
 */
import { toyWalk, type Adv } from '../../core/adv/adv.ts';
import { ASSIST, BREATH, CandlesMini, FlipMini, FOLDS, MemoryPuzzle, OrderMini, PhotoMini, PUPPET_CUES, PUPPETS, PuppetMini, SEW, SewMini, StarsMini, ThreadMini, WindMini, type MiniDir, type PuzzleKind } from '../../core/adv/mini.ts';
import { CREDITS_S } from '../../core/adv/script.ts';
import type { HeroId } from '../../core/types.ts';
import type { Mood } from '../../core/adv/types.ts';
import { markerPop, toastIn } from './anim.ts';
import { pixCanvas } from '../art/canvas.ts';
import { heroActSprite, heroSprite } from '../art/heroes.ts';
import { keepsakeSprite } from '../art/keepsakes.ts';
import { CLEAR, hash2, Pix } from '../art/paint.ts';
import { isPerson, personSprite } from '../art/people.ts';
import { actHint } from '../input.ts';
import { C, type Ui } from '../kit.ts';
import type { AdvFrame } from './render.ts';

export const NAMES: Record<string, string> = {
  toby: '토비',
  bori: '보리',
  ruru: '루루',
  nabi: '나비',
  doll: '태엽 할머니',
  grandoll: '태엽 할머니',
  haru: '하루',
  gm: '할머니',
  grandma: '할머니',
  mom: '엄마',
  suni: '순이',
  gpa: '할아버지',
  gmom: '순이 엄마',
  eunju: '은주',
  jiwoo: '지우',
  cuckoo: '뻐꾹 영감',
  dad: '아빠',
  bear: '곰 대장',
  jelly: '젤리 대왕',
  tin: '깡 장군',
  paper: '색종이 자매',
  dusty: '더스티',
  king: '먼지 왕',
};

const NAME_COLOR: Record<string, string> = { toby: '#bfe0ff', bori: '#ffd8a0', ruru: '#ffb070', nabi: '#d8b8ff', doll: '#e8c8ff', haru: '#ffe07a', gm: '#f0c8f0', suni: '#f0c8f0', gpa: '#d8d0b8', gmom: '#e8d0c0', eunju: '#b8f0c8', jiwoo: '#ffc8a0', mom: '#b8f0c8', dad: '#b8d0ff' };

/** 대사 기록 등에서 쓰는 인물 이름 */
export function speakerName(a: Adv, who: string): string {
  return nameOf(a, who);
}

function nameOf(a: Adv, who: string): string {
  if (NAMES[who]) return NAMES[who];
  const k = a.stage.actors[who]?.kind ?? '';
  if (k.startsWith('haru')) return '하루';
  return NAMES[k] ?? who;
}

/** 장난감 초상화의 표정: 비슷한 몸짓 한 장 (이름 · 프레임) */
const TOY_MOOD: Record<Mood, [string, number]> = { smile: ['laugh', 0], sad: ['sigh', 1], surprise: ['surprise', 0], angry: ['tremble', 0], tear: ['wipe', 0] };

const PORTRAIT = new Map<string, HTMLCanvasElement>();
function portrait(kind: string, mood?: Mood): HTMLCanvasElement | null {
  const key = `${kind}:${mood ?? ''}`;
  let c = PORTRAIT.get(key);
  if (c) return c;
  if (kind === 'toby' || kind === 'bori' || kind === 'ruru' || kind === 'nabi') {
    const m = mood ? TOY_MOOD[mood] : null;
    c = pixCanvas((m && heroActSprite(kind as HeroId, 'down', m[0], m[1])) || heroSprite(kind as HeroId, 'down', 'idle'));
  } else if (isPerson(kind)) c = pixCanvas(headCrop(personSprite(kind, 'down', 'idle', { mood })));
  else return null;
  PORTRAIT.set(key, c);
  return c;
}

/** 사람 초상: 틀(32×48) 안 키가 사람마다 달라서, 정수리 한 칸 위부터 24줄 (머리 · 어깨)만 */
function headCrop(p: Pix): Pix {
  let top = 0;
  while (top < p.h && !p.px.slice(top * p.w, (top + 1) * p.w).some((v) => v !== CLEAR)) top++;
  return new Pix(p.w, 24).stamp(p, 0, 1 - top);
}

export interface Controls {
  act(): void;
  dir(d: MiniDir): void;
  pick(i: number): void;
}

// ───────────────────────── 기억 색감 ─────────────────────────

/** 세계 그림 위에 덧입히는 색감: 기억은 세피아 · 필름 결, 새벽은 분홍빛 */
export function applyTone(ctx: CanvasRenderingContext2D, tone: string, vw: number, vh: number, time: number): void {
  if (tone === 'memory') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(128,128,128,0.82)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#f2d6a8';
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(60,34,14,0.55)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'source-over';
    // 필름 결 · 긁힘
    const seed = Math.floor(time * 12);
    ctx.fillStyle = 'rgba(255,240,210,0.08)';
    for (let i = 0; i < 70; i++) ctx.fillRect(Math.floor(hash2(i, seed, 1) * vw), Math.floor(hash2(i, seed, 2) * vh), 1, 1);
    ctx.fillStyle = 'rgba(40,20,10,0.07)';
    for (let i = 0; i < 50; i++) ctx.fillRect(Math.floor(hash2(i, seed, 3) * vw), Math.floor(hash2(i, seed, 4) * vh), 1, 1);
    if (hash2(seed, 5, 6) < 0.25) {
      ctx.fillStyle = 'rgba(255,240,210,0.07)';
      ctx.fillRect(Math.floor(hash2(seed, 7, 8) * vw), 0, 1, vh);
    }
    const gr = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.3, vw / 2, vh / 2, Math.hypot(vw, vh) * 0.6);
    gr.addColorStop(0, 'rgba(40,22,10,0)');
    gr.addColorStop(1, 'rgba(40,22,10,0.55)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, vw, vh);
    ctx.restore();
  } else if (tone === 'dawn') {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const gr = ctx.createLinearGradient(0, 0, 0, vh);
    gr.addColorStop(0, 'rgba(255,170,150,0.7)');
    gr.addColorStop(1, 'rgba(255,220,170,0.5)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, vw, vh);
    ctx.restore();
  }
}

// ───────────────────────── 그리기 ─────────────────────────

export function drawOverlay(ui: Ui, a: Adv, f: AdvFrame, time: number, touch: boolean, ctl: Controls): void {
  const st = a.stage;
  const c = ui.ctx;
  // 기억 색감은 main 에서 세계 그림에. 여기는 화면 해상도 글자
  for (const b of f.bubbles) bubble(ui, b.x, b.y, b.e, b.life, time);
  if (f.marker && !st.dialog && !a.mini) {
    const m = f.marker;
    const yy = m.y + Math.sin(time * 4) * 1.5;
    // 처음 뜰 때 0.6 → 1.1 → 1 배로 톡 튄다
    const pop = m.pop ?? markerPop(1);
    ui.outlined('▼', m.x, yy, C.gold, Math.max(5, Math.round(9 * pop)));
    if (m.text && pop >= 1) ui.outlined(m.text, m.x, yy - 11, C.light, 9);
    // 서장 · 1장에서는 조작 글리프를 곁들인다 (키보드 [Z] · 손가락 「톡」)
    if (a.save.chapter <= 2 && pop >= 1) ui.outlined(actHint(touch), m.x + 6, yy, C.dim, 8, 'left');
  }

  // 화면 가리기
  if (st.fade > 0) {
    c.fillStyle = st.fadeColor === 'white' ? `rgba(255,250,240,${st.fade})` : `rgba(6,4,10,${st.fade})`;
    c.fillRect(0, 0, ui.w, ui.h);
  }
  // 위아래 검은 띠
  if (st.bars > 0) {
    const bh = Math.round(ui.h * 0.11 * st.bars);
    c.fillStyle = '#000';
    c.fillRect(0, 0, ui.w, bh);
    c.fillRect(0, ui.h - bh, ui.w, bh);
  }

  if (!st.bars && !st.dialog && st.fade < 0.5 && !a.mini && st.credits <= 0) hud(ui, a, time);
  steps(ui, a, time);
  if (st.title) titleCard(ui, st.title);
  if (a.mini) drawMini(ui, a, time, touch, ctl);
  if (st.toast) toast(ui, st.toast);
  if (st.dialog) dialog(ui, a, time, touch, ctl);
  if (st.choice) choice(ui, a, ctl);
  if (a.runner && st.credits > 0) credits(ui, st.credits);
}

function bubble(ui: Ui, x: number, y: number, e: string, life: number, time: number): void {
  const c = ui.ctx;
  const pop = Math.min(1, (1.4 - life) * 8 + 0.3);
  const w = 16 * pop;
  const h = 14 * pop;
  const bx = Math.round(x - w / 2);
  const by = Math.round(y - 22 - h / 2 + (1 - pop) * 4);
  ui.panel(bx, by, w, h, '#fffaf0', '#2a1c24');
  c.fillStyle = '#fffaf0';
  c.fillRect(Math.round(x) - 2, by + h - 1, 4, 2);
  c.fillStyle = '#2a1c24';
  c.fillRect(Math.round(x) - 1, by + h + 1, 2, 1);
  if (pop < 0.9) return;
  const sym: Record<string, [string, string]> = { '!': ['!', '#e8414f'], '?': ['?', '#4a78d8'], '…': ['…', '#5a4a6a'], '♪': ['♪', '#d85aa8'], '♥': ['♥', '#e8414f'], sweat: ['💧', '#4a9ae0'], anger: ['💢', '#e8414f'], zz: ['z', '#5a4a6a'], idea: ['💡', '#e8b030'], tear: ['💧', '#4a9ae0'] };
  const [s, col] = sym[e] ?? [e, '#2a1c24'];
  if (e === 'sweat' || e === 'tear') {
    c.fillStyle = col;
    c.fillRect(bx + w / 2 - 1, by + 3, 2, 2);
    c.fillRect(bx + w / 2 - 2, by + 5, 4, 4);
    return;
  }
  if (e === 'zz') {
    ui.text('z', bx + 3, by + 1 + Math.sin(time * 3), col, 8, 'left', false);
    ui.text('z', bx + 8, by + 3, col, 7, 'left', false);
    return;
  }
  if (e === 'anger') {
    c.fillStyle = col;
    for (const [dx, dy] of [[-3, -3], [2, -3], [-3, 2], [2, 2]]) c.fillRect(bx + w / 2 + dx, by + h / 2 + dy, 2, 2);
    return;
  }
  ui.text(s, bx + w / 2, by + 2, col, 10, 'center', false);
}

/** 지금 보이는 목표와 바뀐 때 (바뀌면 0.6초 동안 펼친다) */
const goalShown = { text: null as string | null, t0: -99 };
const GOAL_UNFOLD = 0.6;

/** 목표 줄이 펼쳐진 정도 (0~1): 마지막으로 바뀐 뒤 0.6초에 다 펼쳐짐 */
export function goalReveal(time: number): number {
  const u = Math.max(0, Math.min(1, (time - goalShown.t0) / GOAL_UNFOLD));
  return u >= 1 ? 1 : 1 - (1 - u) * (1 - u);
}

/** 이 아래로 태엽이 떨어지면 HUD 에 게이지를 보인다 */
const WIND_LOW = 0.3;

/** 탐험 HUD (E13 · A6): 왼쪽 위 목표 한 줄 (바뀌면 펼침). 기억 수는 앨범에서만, 태엽 게이지는 모자랄 때만 */
function hud(ui: Ui, a: Adv, time: number): void {
  const st = a.stage;
  const c = ui.ctx;
  // 기억을 다 모았으면 기억의 문으로 안내
  const m0 = a.memories();
  const link = a.room.things.find((t) => t.kind === 'link');
  const goal = st.tone === 'now' && link && m0.total > 0 && m0.got >= m0.total ? `기억이 모였다 — 「${link.kind === 'link' ? link.name : ''}」을(를) 살펴보자` : st.goal;
  if (goal !== goalShown.text) {
    goalShown.text = goal;
    goalShown.t0 = time;
  }
  let y = 6;
  if (goal) {
    const w = ui.measure(goal, 10) + 26;
    const k = goalReveal(time);
    c.save();
    c.beginPath();
    c.rect(0, 0, Math.ceil(w * k) + 2, 24);
    c.clip();
    // 단정한 띠: 왼쪽은 짙고 오른쪽 끝으로 스러진다 + 금빛 마름모
    const gr = c.createLinearGradient(4, 0, w + 4, 0);
    gr.addColorStop(0, 'rgba(20,12,28,0.78)');
    gr.addColorStop(0.75, 'rgba(20,12,28,0.6)');
    gr.addColorStop(1, 'rgba(20,12,28,0)');
    c.fillStyle = gr;
    c.fillRect(4, y, w, 16);
    c.fillStyle = 'rgba(255,216,106,0.9)';
    c.fillRect(4, y, 1, 16);
    c.fillRect(11, y + 6, 3, 3);
    c.fillRect(12, y + 5, 1, 5);
    c.fillRect(10, y + 7, 5, 1);
    ui.text(goal, 19, y + 3, C.light, 10);
    c.restore();
    y += 19;
  }
  // 걷는 기억: 모은 실
  const th = a.threadCount();
  if (th && !a.runner) {
    const w = 52 + th.total * 12;
    const x = ui.w - w - 6;
    ui.panel(x, 6, w, 18, 'rgba(38,28,20,0.85)');
    ui.text('기억의 실', x + 6, 10, '#f0d8a8', 9);
    for (let i = 0; i < th.total; i++) {
      const cx = x + 56 + i * 11;
      const on = i < th.got;
      ui.ctx.fillStyle = on ? '#ffe2a0' : 'rgba(255,226,160,0.25)';
      ui.ctx.fillRect(cx - 4, 14 + (on ? Math.round(Math.sin(time * 4 + i)) : 0), 8, 2);
    }
  }
  // 태엽: 넉넉하면 토비 머리 위 열쇠만으로 보이고, 모자랄 때(0.3 아래)만 게이지
  if (toyWalk(a.room) && st.tone === 'now' && a.save.wind < WIND_LOW) {
    const x = 8 + ui.text('태엽', 8, y, C.dim, 8) + 4;
    ui.bar(x, y + 3, 40, 4, a.save.wind, Math.floor(time * 3) % 2 ? '#ff6a6a' : '#ffc83a');
  }
}

function steps(ui: Ui, a: Adv, time: number): void {
  const s = a.steps;
  if (a.runner || s.phase === 'calm' || !a.room.steps) return;
  const c = ui.ctx;
  // 흔들림 · 깜빡임 줄이기면 비네트가 고동치지 않는다
  const calm = (a.stage as { noShake?: boolean }).noShake;
  const k = s.phase === 'warn' ? 0.25 + (calm ? 0 : Math.sin(time * 10) * 0.1) : 0.4;
  const gr = c.createRadialGradient(ui.w / 2, ui.h / 2, Math.min(ui.w, ui.h) * 0.35, ui.w / 2, ui.h / 2, Math.hypot(ui.w, ui.h) * 0.6);
  gr.addColorStop(0, 'rgba(120,20,40,0)');
  gr.addColorStop(1, `rgba(120,20,40,${k})`);
  c.fillStyle = gr;
  c.fillRect(0, 0, ui.w, ui.h);
  if (s.phase === 'warn') ui.outlined('쿵… 쿵… 발소리가 다가온다! 숨을 곳으로!', ui.w / 2, 40, '#ffd0d0', 11);
  else {
    ui.outlined('얼음!', ui.w / 2, 44, '#bfe8ff', 22);
    ui.outlined('움직이지 마!', ui.w / 2, 64, C.light, 10);
  }
}

function titleCard(ui: Ui, t: { text: string; sub: string; life: number; max: number }): void {
  const el = t.max - t.life;
  const al = Math.min(1, el / 0.6, t.life / 0.6);
  const c = ui.ctx;
  c.globalAlpha = Math.max(0, al);
  c.fillStyle = 'rgba(6,4,10,0.55)';
  c.fillRect(0, ui.h / 2 - 34, ui.w, 68);
  ui.outlined(t.text, ui.w / 2, ui.h / 2 - 8, '#fff4dc', 18);
  if (t.sub) ui.outlined(t.sub, ui.w / 2, ui.h / 2 + 16, '#d8c8b0', 10);
  c.fillStyle = 'rgba(255,240,210,0.6)';
  const lw = Math.min(160, el * 200);
  c.fillRect(ui.w / 2 - lw / 2, ui.h / 2 + 4, lw, 1);
  c.globalAlpha = 1;
}

function dialog(ui: Ui, a: Adv, time: number, touch: boolean, ctl: Controls): void {
  const d = a.stage.dialog!;
  const narr = d.who === '';
  const pw = Math.min(ui.w - 16, 470);
  const px = Math.round((ui.w - pw) / 2);
  const kind = a.stage.actors[d.who]?.kind ?? (d.who === 'haru' ? 'haru15' : d.who === 'gm' ? 'grandma' : d.who === 'doll' ? 'grandoll' : d.who);
  const pic = narr ? null : portrait(kind, d.mood);
  const tx = px + (pic ? 56 : 14);
  const tw = pw - (pic ? 70 : 28);
  const lines = ui.wrap(d.text, tw, 12);
  const ph = Math.max(narr ? 30 : 58, 22 + lines.length * 17 + (narr ? 0 : 14));
  const bh = Math.round(ui.h * 0.11 * a.stage.bars);
  const py = Math.round(ui.h - ph - Math.max(8, bh + 4));
  if (narr) {
    ui.ctx.fillStyle = 'rgba(6,4,10,0.6)';
    ui.ctx.fillRect(px, py, pw, ph);
  } else ui.panel(px, py, pw, ph, 'rgba(34,26,48,0.94)');
  let y = py + 10;
  if (pic) {
    ui.panel(px + 8, py + 8, 40, 40, '#3a3050');
    const s = Math.max(1, Math.floor(36 / Math.max(24, pic.width * 0.9)) || 1) * 2;
    ui.ctx.save();
    ui.ctx.beginPath();
    ui.ctx.rect(px + 9, py + 9, 38, 38);
    ui.ctx.clip();
    ui.ctx.imageSmoothingEnabled = false;
    ui.ctx.drawImage(pic, Math.round(px + 28 - (pic.width * s) / 2), py + 9 - (isPerson(kind) ? 0 : 10), pic.width * s, pic.height * s);
    ui.ctx.restore();
  }
  if (!narr) {
    ui.text(nameOf(a, d.who), tx, y, NAME_COLOR[d.who] ?? C.gold, 10);
    y += 15;
  }
  let left = Math.floor(d.shown);
  for (const l of lines) {
    const part = l.slice(0, Math.max(0, left));
    left -= l.length + 1;
    if (narr) ui.text(part, px + pw / 2 - ui.measure(l, 12) / 2, y, '#efe4d4', 12);
    else ui.text(part, tx, y, C.light, 12);
    y += 17;
  }
  if (d.shown >= d.text.length && Math.floor(time * 2.5) % 2 === 0) ui.text('▼', px + pw - 16, py + ph - 14, C.gold, 9);
  // 어디를 눌러도 넘긴다 (손가락)
  ui.hit('dlg', 0, 0, ui.w, ui.h, () => ctl.act());
  if (touch && ui.focus !== 'dlg') ui.focus = 'dlg';
}

/** 종이별 알림: 오른쪽 위에 "★ n" 이 올라와 머물고, 별 글귀가 아랫줄에 */
function toast(ui: Ui, t: { text: string; sub: string; life: number; max: number }): void {
  const k = toastIn(t.life, t.max);
  if (k <= 0) return;
  const c = ui.ctx;
  const w = Math.max(64, ui.measure(t.text, 12) + 26, t.sub ? ui.measure(t.sub, 10) + 20 : 0);
  const h = t.sub ? 40 : 26;
  const x = Math.round(ui.w - w - 10);
  const y = Math.round(30 + (1 - Math.min(1, k * 1.2)) * -14);
  c.save();
  c.globalAlpha = k;
  ui.panel(x, y, w, h, 'rgba(34,26,48,0.9)');
  ui.text(t.text, x + 12, y + 7, C.gold, 12);
  if (t.sub) ui.text(t.sub, x + 10, y + 24, '#efe4d4', 10);
  c.restore();
}

function choice(ui: Ui, a: Adv, ctl: Controls): void {
  const ch = a.stage.choice!;
  const w = Math.min(ui.w - 40, Math.max(...ch.options.map((o) => ui.measure(o, 12))) + 48);
  // 손가락으로도 누르기 쉽게 단추를 높게
  const h = 28;
  const x0 = Math.round((ui.w - w) / 2);
  const y0 = Math.round(ui.h * 0.42 - (ch.options.length * (h + 6)) / 2);
  ch.options.forEach((o, i) => {
    const sel = ch.sel === i;
    ui.panel(x0, y0 + i * (h + 6), w, h, sel ? '#4a3e66' : 'rgba(34,26,48,0.94)', sel ? C.focus : C.edge);
    ui.text(`${sel ? '▶ ' : ''}${o}`, x0 + w / 2, y0 + i * (h + 6) + 8, sel ? C.gold : C.light, 12, 'center');
    ui.hit(`ch${i}`, x0, y0 + i * (h + 6), w, h, () => ctl.pick(i));
  });
}

const CREDIT_LINES = [
  '태엽이 멈추기 전에',
  '',
  '— 이야기 —',
  '하루와 할머니, 그리고 장난감 친구들',
  '',
  '— 나온 이들 —',
  '토비 · 태엽 토끼',
  '보리 · 꿀을 좋아하는 곰',
  '루루 · 장난꾸러기 여우',
  '나비 · 등불 고양이',
  '태엽 할머니 · 할머니가 만든 인형',
  '하루 · 4살부터 15살까지',
  '할머니',
  '',
  '— 그리고 —',
  '다락방의 먼지, 침대 밑의 어둠,',
  '책상의 종이별, 서랍 속 과자,',
  '비 오는 마당의 진흙까지',
  '',
  '장난감을 아끼던 모든 아이들에게',
  '',
  '',
  '태엽은 천천히 감아야 오래 간단다.',
];

function credits(ui: Ui, t: number): void {
  const c = ui.ctx;
  c.fillStyle = `rgba(6,4,10,${Math.min(0.85, t / 2)})`;
  c.fillRect(0, 0, ui.w, ui.h);
  const speed = (ui.h + CREDIT_LINES.length * 22) / (CREDITS_S - 4);
  CREDIT_LINES.forEach((l, i) => {
    const y = ui.h - t * speed + i * 22 + 20;
    if (y < -20 || y > ui.h + 20) return;
    const head = i === 0;
    ui.outlined(l, ui.w / 2, y, head ? '#ffe07a' : l.startsWith('—') ? '#d8c8b0' : '#f4ecdc', head ? 18 : 11);
  });
}

// ───────────────────────── 작은 놀이 ─────────────────────────

const ARROW: Record<MiniDir, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };

function dirPad(ui: Ui, ctl: Controls, x: number, y: number): void {
  const s = 26;
  ui.button('mu', x - s / 2, y - s * 1.5, s, s, '▲', () => ctl.dir('up'), { size: 11 });
  ui.button('md', x - s / 2, y + s * 0.5, s, s, '▼', () => ctl.dir('down'), { size: 11 });
  ui.button('ml', x - s * 1.5, y - s / 2, s, s, '◀', () => ctl.dir('left'), { size: 11 });
  ui.button('mr', x + s * 0.5, y - s / 2, s, s, '▶', () => ctl.dir('right'), { size: 11 });
}

// ── 기억 맞추기 (네 가지 놀이)

const PUZZLE_TITLE: Record<PuzzleKind, string> = {
  flip: '기억 맞추기 — 줄이나 칸을 뒤집어 그림을 맞추자',
  order: '기억 잇기 — 흐릿한 장면부터 또렷한 장면까지 차례로',
  thread: '실 잇기 — 모든 못을 한 번씩 지나 기억을 꿰자',
  photo: '찢어진 사진 — 조각을 돌려 바로 세우자',
};

/** 조작 안내: 휴대폰이면 누르기, 아니면 방향키 · Z */
export function puzzleHelp(kind: PuzzleKind, touch: boolean): string {
  switch (kind) {
    case 'flip':
      return touch ? '줄 ▶ · 칸 ▼ 를 눌러 뒤집기' : '방향키로 고르고 Z 로 뒤집기';
    case 'order':
      return touch ? '흐릿한 장면부터 눌러 놓기' : '←→ 로 고르고 Z 로 놓기';
    case 'thread':
      return touch ? '옆 못을 눌러 잇기 · 지난 못을 누르면 되감기' : '방향키로 잇기 · 온 쪽으로 가면 되감기';
    case 'photo':
      return touch ? '조각을 눌러 돌리기' : '방향키로 고르고 Z 로 돌리기';
  }
}

/** 순서 놓기 카드에서 조각이 드러나는 차례 (4×4 중) */
const REVEAL = [5, 10, 0, 15, 6, 9, 3, 12, 1, 14, 7, 8, 2, 13, 4, 11];

function memPic(a: Adv): HTMLCanvasElement {
  const link = a.room.things.find((t) => t.kind === 'link');
  const icon = link?.kind === 'link' ? link.icon : 'star';
  let pic = PORTRAIT.get(`ks${icon}`);
  if (!pic) {
    pic = pixCanvas(keepsakeSprite(icon));
    PORTRAIT.set(`ks${icon}`, pic);
  }
  return pic;
}

/** 힌트 자리를 반짝이는 테로 */
function hintRing(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
  c.save();
  c.globalAlpha = 0.5 + Math.sin(time * 8) * 0.5;
  c.strokeStyle = '#bfffd0';
  c.lineWidth = 1;
  c.strokeRect(Math.round(x) - 1.5, Math.round(y) - 1.5, Math.round(w) + 3, Math.round(h) + 3);
  c.restore();
}

function drawPuzzle(ui: Ui, a: Adv, m: MemoryPuzzle, time: number, touch: boolean, ctl: Controls, px: number, py: number, pw: number, ph: number): void {
  const c = ui.ctx;
  const cx = px + pw / 2;
  const pic = memPic(a);
  const shake = m.wrong > 0 ? Math.round(Math.sin(time * 60) * 2) : 0;
  ui.text(PUZZLE_TITLE[m.kind], cx, py + 8, '#ffe8c0', 9, 'center');
  c.imageSmoothingEnabled = false;
  const top = py + 30;
  const hint = m.hinting;

  if (m instanceof FlipMini) {
    const n = m.n;
    const S = n >= 5 ? 18 : n === 4 ? 22 : 28;
    const gx = Math.round(cx - (S * n) / 2) + shake;
    const gy = top + 14;
    const k = (S * n) / pic.width;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const tx = gx + x * S;
        const ty = gy + y * S;
        if (m.grid[y * n + x]) {
          c.fillStyle = '#f4e8d0';
          c.fillRect(tx, ty, S - 1, S - 1);
          c.save();
          c.beginPath();
          c.rect(tx, ty, S - 1, S - 1);
          c.clip();
          c.drawImage(pic, gx, gy, pic.width * k, pic.height * k);
          c.restore();
        } else {
          c.fillStyle = '#5a4a6a';
          c.fillRect(tx, ty, S - 1, S - 1);
          c.fillStyle = '#7a6a8a';
          c.fillRect(tx + S / 2 - 2, ty + S / 2 - 2, 3, 3);
        }
      }
    const cur = m.cursor;
    const h = hint ? m.hint() : null;
    for (let i = 0; i < n; i++) {
      const rowOn = cur.kind === 'row' && cur.i === i;
      const colOn = cur.kind === 'col' && cur.i === i;
      ui.text('▶', gx - 14, gy + i * S + S / 2 - 6, rowOn ? C.gold : '#6a5a50', 10);
      ui.text('▼', gx + i * S + S / 2 - 5, gy - 14, colOn ? C.gold : '#6a5a50', 10);
      if (h && h[0] === 'row' && h[1] === i) hintRing(c, gx - 16, gy + i * S, 14, S - 1, time);
      if (h && h[0] === 'col' && h[1] === i) hintRing(c, gx + i * S, gy - 16, S - 1, 14, time);
      ui.hit(`mr${i}`, gx - 18, gy + i * S, 16, S, () => m.flip('row', i));
      ui.hit(`mc${i}`, gx + i * S, gy - 18, S, 16, () => m.flip('col', i));
    }
    ui.text(`최소 ${m.least}번 · 지금 ${m.moves}번`, px + 12, top, '#a89070', 8);
    ui.button('mreset', px + pw - 74, py + ph - 48, 64, 18, '되돌리기', () => m.reset(), { size: 9 });
  } else if (m instanceof OrderMini) {
    const n = m.cards.length;
    const W = Math.min(44, Math.floor((pw - 24) / n) - 6);
    const gap = 6;
    const x0 = Math.round(cx - (n * (W + gap) - gap) / 2);
    const y0 = top + 10;
    const T = W / 4;
    const h = hint ? m.hint() : null;
    m.cards.forEach((v, i) => {
      const placed = m.isPlaced(i);
      const sel = m.sel === i && !placed;
      const x = x0 + i * (W + gap) + (sel ? shake : 0);
      const y = y0 + (sel ? -3 : 0);
      // 사진 테
      c.fillStyle = placed ? '#6a5a48' : '#efe2c4';
      c.fillRect(x - 2, y - 2, W + 4, W + 10);
      c.fillStyle = '#c8b08a';
      c.fillRect(x, y, W, W);
      // 앞 장면일수록 조각이 적게 드러난다
      const shown = Math.ceil((16 * (v + 1)) / n);
      for (let r = 0; r < shown; r++) {
        const t = REVEAL[r];
        const tx = t % 4;
        const ty = Math.floor(t / 4);
        const sw = pic.width / 4;
        c.drawImage(pic, tx * sw, ty * sw, sw, sw, x + tx * T, y + ty * T, T, T);
      }
      if (placed) {
        c.fillStyle = 'rgba(40,30,24,0.55)';
        c.fillRect(x, y, W, W);
        ui.outlined(String(v + 1), x + W / 2, y + W / 2 - 6, '#ffe07a', 12);
      }
      if (sel) ui.focusRing(x - 2, y - 2, W + 4, W + 10);
      if (h === i) hintRing(c, x - 2, y - 2, W + 4, W + 10, time);
      ui.hit(`mo${i}`, x - 2, y0 - 2, W + 4, W + 10, () => m.pick(i), !placed);
    });
    // 놓은 차례 띠
    const ty = y0 + W + 16;
    for (let i = 0; i < n; i++) {
      c.fillStyle = i < m.placed ? '#ffe07a' : '#5a4a3a';
      c.fillRect(Math.round(cx - n * 7 + i * 14), ty, 10, 3);
    }
  } else if (m instanceof ThreadMini) {
    const G = Math.min(18, Math.floor(96 / Math.max(m.w, m.h - 0.5)));
    const ox = Math.round(cx - ((m.w - 1) * G) / 2) + shake;
    const oy = top + 14;
    const at = (i: number): [number, number] => [ox + (i % m.w) * G, oy + Math.floor(i / m.w) * G];
    // 천 바탕
    c.fillStyle = '#d8c8a8';
    c.fillRect(ox - G / 2, oy - G / 2, m.w * G, m.h * G);
    c.fillStyle = 'rgba(120,90,60,0.18)';
    for (let y = 0; y < m.h * G; y += 3) c.fillRect(ox - G / 2, oy - G / 2 + y, m.w * G, 1);
    // 실
    c.fillStyle = m.stuck > 0 ? '#ff8a8a' : '#e85a6a';
    for (let k = 1; k < m.path.length; k++) {
      const [x1, y1] = at(m.path[k - 1]);
      const [x2, y2] = at(m.path[k]);
      c.fillRect(Math.min(x1, x2) - 1, Math.min(y1, y2) - 1, Math.abs(x2 - x1) + 2, Math.abs(y2 - y1) + 2);
    }
    const h = hint ? m.hint() : null;
    for (let i = 0; i < m.open.length; i++) {
      const [x, y] = at(i);
      if (!m.open[i]) {
        c.fillStyle = '#8a7058';
        c.fillRect(x - 3, y - 3, 6, 6);
        c.fillStyle = '#6a5440';
        c.fillRect(x - 2, y - 2, 4, 4);
        continue;
      }
      const on = m.path.includes(i);
      c.fillStyle = '#3a2a1a';
      c.fillRect(x - 2, y - 2, 5, 5);
      c.fillStyle = on ? '#ffe07a' : '#c8a060';
      c.fillRect(x - 1, y - 1, 3, 3);
      if (i === m.start) {
        c.fillStyle = '#fff4dc';
        c.fillRect(x, y - 1, 1, 1);
      }
      if (i === m.head && !m.isSolved()) hintRing(c, x - 3, y - 3, 6, 6, time * 0.6);
      if (h === i) hintRing(c, x - 4, y - 4, 8, 8, time);
      ui.hit(`mt${i}`, x - G / 2, y - G / 2, G, G, () => m.tap(i));
    }
    ui.text(`못 ${m.path.length} / ${m.openCount}`, px + 12, top, '#a89070', 8);
    if (m.stuck > 0) ui.outlined('막혔다… 처음부터!', cx, py + ph - 42, '#ffb0b0', 10);
    if (touch) dirPad(ui, ctl, px + pw - 44, top + 50);
  } else if (m instanceof PhotoMini) {
    const n = m.n;
    const P = Math.floor(84 / n);
    const gx = Math.round(cx - (P * n + (n - 1) * 2) / 2);
    const gy = top + 6;
    const sw = pic.width / n;
    const solved = m.isSolved();
    const h = hint ? m.hint() : null;
    for (let i = 0; i < n * n; i++) {
      const ix = i % n;
      const iy = Math.floor(i / n);
      // 다 맞추면 틈이 닫힌다
      const g = solved ? 0 : 2;
      const x = gx + ix * (P + g) + (m.cursor.x === ix && m.cursor.y === iy ? shake : 0);
      const y = gy + iy * (P + g);
      c.fillStyle = '#efe2c4';
      c.fillRect(x, y, P, P);
      c.save();
      c.translate(x + P / 2, y + P / 2);
      c.rotate((m.rot[i] * Math.PI) / 2);
      c.drawImage(pic, ix * sw, iy * sw, sw, sw, -P / 2, -P / 2, P, P);
      c.restore();
      if (!solved) {
        // 찢긴 가장자리: 흰 종이 결
        c.fillStyle = '#fff8e8';
        for (let k = 0; k < P; k += 2) {
          if (hash2(i, k, 1) < 0.5) c.fillRect(x + k, y, 1, 1);
          if (hash2(i, k, 2) < 0.5) c.fillRect(x + k, y + P - 1, 1, 1);
          if (hash2(i, k, 3) < 0.5) c.fillRect(x, y + k, 1, 1);
          if (hash2(i, k, 4) < 0.5) c.fillRect(x + P - 1, y + k, 1, 1);
        }
      }
      if (!touch && m.cursor.x === ix && m.cursor.y === iy && !solved) ui.focusRing(x, y, P, P);
      if (h === i) hintRing(c, x, y, P, P, time);
      ui.hit(`mp${i}`, x, y, P, P, () => m.turn(i));
    }
  }

  if (m.solved > 0) ui.outlined('기억이 이어졌다', cx, py + ph - 42, '#fff4dc', 11);

  // 도움: 힌트 · 건너뛰기
  const by = py + ph - 22;
  if (m.canSkip && m.solved <= 0) {
    if (touch) ui.button('mskip', px + pw - 84, by - 2, 74, 20, '건너뛰기', () => m.skip(), { size: 9 });
    else {
      ui.text('Z 꾹: 건너뛰기', px + pw - 12, by, '#d8c8a8', 8, 'right');
      ui.bar(px + pw - 80, by + 11, 68, 3, m.holdT / ASSIST.hold, '#bfffd0');
    }
  } else if (hint && m.solved <= 0) ui.text('반짝이는 곳을 해 봐', px + pw - 12, by, '#bfffd0', 8, 'right');
  ui.text(puzzleHelp(m.kind, touch), px + 12, by, '#a89070', 8);
}

function drawMini(ui: Ui, a: Adv, time: number, touch: boolean, ctl: Controls): void {
  const m = a.mini!;
  const pw = Math.min(ui.w - 16, 360);
  const ph = m instanceof MemoryPuzzle ? 190 : 150;
  const px = Math.round((ui.w - pw) / 2);
  const py = Math.round(ui.h * 0.18);
  ui.panel(px, py, pw, ph, 'rgba(40,30,24,0.95)', '#c8a070');
  const cx = px + pw / 2;
  const c = ui.ctx;
  if (m instanceof MemoryPuzzle) {
    drawPuzzle(ui, a, m, time, touch, ctl, px, py, pw, ph);
  } else if (m instanceof StarsMini) {
    ui.text('종이별 접기 — 할머니 손을 따라 해 보자', cx, py + 8, '#ffe8c0', 10, 'center');
    const shakeX = m.wrong > 0 ? Math.sin(time * 60) * 3 : 0;
    // 종이 띠
    c.fillStyle = '#ffe07a';
    const folded = m.fold / 5;
    c.fillRect(cx - 60 + shakeX, py + 44, 120 * (1 - folded * 0.8), 10);
    c.fillStyle = '#f0c850';
    c.fillRect(cx - 60 + shakeX, py + 44, 120 * (1 - folded * 0.8), 2);
    const want = m.want;
    if (want) ui.outlined(ARROW[want], cx, py + 82, '#fff4dc', 24);
    else ui.outlined('★', cx, py + 82, '#ffe07a', 24 + Math.sin(time * 8) * 2);
    for (let i = 0; i < FOLDS.length; i++) ui.outlined(i < m.star ? '★' : '☆', cx - 20 + i * 20, py + 112, i < m.star ? '#ffe07a' : '#8a7a60', 12);
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i < m.fold ? '#ffe07a' : '#5a4a3a';
      c.fillRect(cx - 22 + i * 10, py + 126, 6, 3);
    }
    ui.text(touch ? '화살표를 눌러 접기' : '방향키로 접기', cx, py + ph - 14, '#a89070', 8, 'center');
    if (touch) dirPad(ui, ctl, px + pw - 50, py + 80);
  } else if (m instanceof CandlesMini) {
    ui.text('촛불 끄기 — 꾹 눌러 숨을 모았다가 노란 칸에서 놓기', cx, py + 8, '#ffe8c0', 10, 'center');
    // 케이크와 초
    c.fillStyle = '#fff0f4';
    c.fillRect(cx - 50, py + 70, 100, 30);
    c.fillStyle = '#f8a0b8';
    c.fillRect(cx - 50, py + 70, 100, 6);
    for (let i = 0; i < BREATH.candles; i++) {
      const x = cx - 42 + i * 14;
      c.fillStyle = ['#8ad0ff', '#ffd84a', '#f06a8a'][i % 3];
      c.fillRect(x, py + 52, 3, 18);
      if (i < m.lit) {
        const fl = Math.sin(time * 14 + i) * 1;
        c.fillStyle = '#ffd84a';
        c.fillRect(x - 1 + fl, py + 44, 5, 7);
        c.fillStyle = '#fff';
        c.fillRect(x + fl, py + 47, 2, 3);
      }
    }
    // 숨 막대
    const bx = px + pw - 34;
    c.fillStyle = '#2a2018';
    c.fillRect(bx, py + 34, 12, 90);
    c.fillStyle = 'rgba(255,216,74,0.5)';
    c.fillRect(bx, py + 34 + 90 * (1 - BREATH.zone[1]), 12, 90 * (BREATH.zone[1] - BREATH.zone[0]));
    c.fillStyle = m.cough > 0 ? '#ff6a6a' : '#bfe8ff';
    c.fillRect(bx + 2, py + 34 + 90 * (1 - m.breath), 8, 90 * m.breath);
    if (m.cough > 0) ui.outlined('콜록콜록!', cx, py + 118, '#ffb0b0', 11);
    if (touch) ui.button('mhold', px + 12, py + ph - 34, 70, 24, '후—', () => ctl.act(), { size: 11 });
  } else if (m instanceof SewMini) {
    ui.text('바느질 — 바늘이 표시에 오면 누르기', cx, py + 8, '#ffe8c0', 10, 'center');
    const x0 = px + 30;
    const w = pw - 60;
    c.fillStyle = '#e8dcc8';
    c.fillRect(x0, py + 64, w, 24);
    c.fillStyle = 'rgba(232,90,106,0.45)';
    c.fillRect(x0 + w * (m.mark - SEW.zone), py + 64, w * SEW.zone * 2, 24);
    for (let i = 0; i < m.stitches; i++) {
      c.fillStyle = '#e85a6a';
      c.fillRect(x0 + 8 + i * 14, py + 96, 8, 2);
    }
    c.fillStyle = '#c8d0d8';
    c.fillRect(x0 + w * m.t - 1, py + 50, 2, 40);
    c.fillStyle = '#fff';
    c.fillRect(x0 + w * m.t - 1, py + 50, 2, 3);
    if (m.miss > 0) ui.outlined('삐끗!', cx, py + 120, '#ffb0b0', 11);
    if (touch) ui.button('msew', cx - 35, py + ph - 30, 70, 22, '콕!', () => ctl.act(), { size: 11 });
  } else if (m instanceof PuppetMini) {
    const cue = PUPPET_CUES[Math.min(m.cue, PUPPET_CUES.length - 1)];
    ui.text('인형극 — 이야기에 맞는 인형을 골라요', cx, py + 8, '#ffe8c0', 10, 'center');
    ui.paragraph(m.silly ?? cue.line, px + 16, py + 26, pw - 32, m.silly ? '#ffd0a0' : '#fff4dc', 11);
    PUPPETS.forEach((h, i) => {
      const x = cx - 78 + i * 52;
      const sel = m.sel === i;
      ui.panel(x - 2, py + 70 + (sel ? -4 : 0), 48, 50, sel ? '#5a4a3a' : '#3a2e24', sel ? C.focus : '#8a7050');
      ui.img(portrait(h)!, x + 4, py + 74 + (sel ? -4 : 0), 36, 44);
      ui.hit(`pp${i}`, x - 2, py + 70, 48, 50, () => {
        if (m.sel === i) ctl.act();
        else m.sel = i;
      });
    });
    if (m.cheer > 0) ui.outlined('짝짝짝!', cx, py + 64, '#ffe07a', 12);
  } else if (m instanceof WindMini) {
    ui.text('태엽 감기 — 여러 번 눌러 끝까지!', cx, py + 8, '#ffe8c0', 10, 'center');
    const ang = m.v * Math.PI * 12;
    const w = Math.max(2, Math.abs(Math.cos(ang)) * 26);
    c.fillStyle = '#ffc83a';
    c.fillRect(cx - w, py + 54, w * 2, 14);
    c.fillRect(cx - 3, py + 68, 6, 18);
    ui.bar(px + 30, py + 104, pw - 60, 8, m.v, '#ffc83a');
    if (touch) ui.button('mwind', cx - 35, py + ph - 30, 70, 22, '끼릭!', () => ctl.act(), { size: 11 });
  }
}
