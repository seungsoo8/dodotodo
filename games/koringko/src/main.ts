/** 태엽이 멈추기 전에: 화면 · 입력 · 이야기 진행 · 소리 · 저장을 잇는다 */
import { Adv, NO_INPUT, type AdvInput, type AdvSave } from './core/adv/adv.ts';
import type { MiniDir } from './core/adv/mini.ts';
import { STORY } from './core/adv/story/index.ts';
import { ALBUM } from './core/adv/story/album.ts';
import { songFor } from './ui/audio/score.ts';
import { DIAGONAL_GRACE, MoveSmoother } from './ui/keys.ts';
import { C, Ui } from './ui/kit.ts';
import { applyTone, drawOverlay, type Controls } from './ui/adv/overlay.ts';
import { drawAdv } from './ui/adv/render.ts';
import { StorySound } from './ui/storysound.ts';
import { store } from './ui/storage.ts';
import { chooseView, type View } from './ui/view.ts';

void DIAGONAL_GRACE;

const SAVE_KEY = 'koringko:story1';
const VOL_KEY = 'koringko:volume2';
const CLEAR_KEY = 'koringko:story1-clear';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const world = document.createElement('canvas');
const wctx = world.getContext('2d')!;
const ui = new Ui();
const sound = new StorySound();

let view: View = { scale: 1, w: 1, h: 1 };
let dpr = 1;
let touch = matchMedia('(pointer: coarse)').matches;

function loadVolume(): { sfx: number; bgm: number } {
  try {
    const v = JSON.parse(store.getItem(VOL_KEY) ?? '');
    if (typeof v.sfx === 'number' && typeof v.bgm === 'number') return v;
  } catch {
    /* 처음 */
  }
  return { sfx: 0.8, bgm: 0.6 };
}
let volume = loadVolume();
sound.setVolume(volume);

function loadSave(): AdvSave | null {
  try {
    const v = JSON.parse(store.getItem(SAVE_KEY) ?? '');
    return v && v.v === 1 ? v : null;
  } catch {
    return null;
  }
}

// ───────────────────────── 화면 상태 ─────────────────────────

type Mode = 'title' | 'play' | 'pause' | 'album' | 'settings';
let mode: Mode = 'title';
let back: Mode = 'title';
let adv: Adv | null = null;
/** 타이틀 뒤 배경으로 도는 다락방 */
let backdrop = new Adv(STORY);
let lastSave = 0;
let confirmNew = false;

function save(): void {
  if (!adv || !adv.canSave()) return;
  store.setItem(SAVE_KEY, JSON.stringify(adv.snapshot()));
  lastSave = performance.now();
}

function start(fresh: boolean): void {
  const s = fresh ? undefined : (loadSave() ?? undefined);
  adv = new Adv(STORY, s);
  mode = 'play';
  confirmNew = false;
  ui.focus = null;
  if (fresh) store.setItem(SAVE_KEY, JSON.stringify(adv.snapshot()));
}

// ───────────────────────── 크기 ─────────────────────────

function resize(): void {
  dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  view = chooseView(canvas.width, canvas.height);
  world.width = view.w;
  world.height = view.h;
}
window.addEventListener('resize', resize);
resize();

// ───────────────────────── 입력 ─────────────────────────

const held = new Set<string>();
let actQueued = false;
let dirQueued: MiniDir | null = null;
let stick: { id: number; ox: number; oy: number; x: number; y: number } | null = null;
let touchHold = false;
let holdTimer = 0;

const ACT = new Set(['KeyZ', 'Space', 'Enter', 'NumpadEnter']);
const DIRS: Record<string, MiniDir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };

function menuKey(code: string): void {
  if (DIRS[code]) {
    const d = DIRS[code];
    ui.move(d === 'left' ? -1 : d === 'right' ? 1 : 0, d === 'up' ? -1 : d === 'down' ? 1 : 0);
    sound.sfx('move');
  } else if (ACT.has(code)) {
    ui.activate();
    sound.sfx('click');
  } else if (code === 'Escape' || code === 'KeyX' || code === 'Backspace') {
    if (mode === 'pause') mode = 'play';
    else if (mode === 'album' || mode === 'settings') mode = back;
    sound.sfx('back');
  }
}

window.addEventListener('keydown', (e) => {
  sound.unlock();
  touch = false;
  const code = e.code;
  if (!ACT.has(code) && !DIRS[code] && code !== 'Escape' && code !== 'KeyX' && code !== 'Backspace') return;
  e.preventDefault();
  if (e.repeat && !DIRS[code]) return;
  held.add(code);
  if (mode !== 'play') {
    menuKey(code);
    return;
  }
  if (code === 'Escape' || code === 'KeyX' || code === 'Backspace') {
    mode = 'pause';
    ui.focus = null;
    sound.sfx('click');
    return;
  }
  if (ACT.has(code)) actQueued = true;
  if (DIRS[code] && !e.repeat) dirQueued = DIRS[code];
});
window.addEventListener('keyup', (e) => held.delete(e.code));
window.addEventListener('blur', () => {
  held.clear();
  stick = null;
  touchHold = false;
});

function logical(e: PointerEvent): { x: number; y: number } {
  return { x: (e.clientX * dpr) / view.scale, y: (e.clientY * dpr) / view.scale };
}

canvas.addEventListener('pointerdown', (e) => {
  sound.unlock();
  e.preventDefault();
  const p = logical(e);
  touch = e.pointerType !== 'mouse';
  ui.keyboard = false;
  if (ui.click(p.x, p.y)) {
    sound.sfx('click');
    return;
  }
  if (mode !== 'play' || !adv) return;
  // 오른쪽 위 작은 단추 영역은 ui 가 처리. 왼쪽 60% 는 막대, 나머지는 누르기 · 누르고 있기
  if (p.x < view.w * 0.55 && !adv.runner && !adv.mini && !stick) {
    stick = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  actQueued = true;
  touchHold = true;
  holdTimer = 0;
});
canvas.addEventListener('pointermove', (e) => {
  const p = logical(e);
  if (stick && e.pointerId === stick.id) {
    stick.x = p.x;
    stick.y = p.y;
    const dx = p.x - stick.ox;
    const dy = p.y - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > 40) {
      stick.ox = p.x - (dx / d) * 40;
      stick.oy = p.y - (dy / d) * 40;
    }
  } else if (e.pointerType === 'mouse') ui.pointer(p.x, p.y);
});
const release = (e: PointerEvent) => {
  if (stick && e.pointerId === stick.id) stick = null;
  touchHold = false;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

const smoother = new MoveSmoother();
function input(dt: number): AdvInput {
  const kx = (held.has('ArrowRight') || held.has('KeyD') ? 1 : 0) - (held.has('ArrowLeft') || held.has('KeyA') ? 1 : 0);
  const ky = (held.has('ArrowDown') || held.has('KeyS') ? 1 : 0) - (held.has('ArrowUp') || held.has('KeyW') ? 1 : 0);
  let move = smoother.step({ x: kx, y: ky }, performance.now() / 1000);
  if (stick) {
    const dx = stick.x - stick.ox;
    const dy = stick.y - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > 4) {
      const k = Math.min(1, d / 30) / d;
      move = { x: dx * k, y: dy * k };
    }
  }
  if (touchHold) holdTimer += dt;
  const hold = [...ACT].some((k) => held.has(k)) || (touchHold && holdTimer > 0.35);
  const inp: AdvInput = { move, act: actQueued, hold, dir: dirQueued };
  actQueued = false;
  dirQueued = null;
  return inp;
}

const controls: Controls = {
  act: () => (actQueued = true),
  dir: (d) => (dirQueued = d),
  pick: (i) => {
    const ch = adv?.stage.choice;
    if (ch) {
      ch.sel = i;
      actQueued = true;
    }
  },
};

// ───────────────────────── 고리 ─────────────────────────

let last = performance.now();
let time = 0;

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  const a = mode === 'title' || !adv ? backdrop : adv;
  if (mode === 'play' && adv) {
    adv.step(dt, input(dt));
    for (const n of adv.stage.sfx.splice(0)) sound.sfx(n);
    if (now - lastSave > 15000) save();
    // 끝: 다 본 것을 적어 두고 타이틀로
    if (adv.flags.ending && !adv.runner) {
      store.setItem(CLEAR_KEY, '1');
      store.setItem(SAVE_KEY, JSON.stringify({ ...adv.snapshot(), room: STORY.chapters.at(-1)!.room }));
      adv = null;
      backdrop = new Adv(STORY);
      mode = 'title';
      ui.focus = null;
    }
  } else if (mode === 'title') {
    backdrop.stage.sfx.length = 0;
  }
  // 세계
  wctx.imageSmoothingEnabled = false;
  const f = drawAdv(wctx, a, view.w, view.h, time, dt);
  if (mode === 'play') applyTone(wctx, a.stage.tone, view.w, view.h, time);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(world, 0, 0, view.w * view.scale, view.h * view.scale);
  // 글자 · 창
  ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
  ui.begin(ctx, view.w, view.h, time);
  if (mode === 'title') drawTitle();
  else if (adv) {
    drawOverlay(ui, adv, f, time, touch, controls);
    if (mode === 'play' && !adv.runner && !adv.mini) {
      ui.button('pause', view.w - 30, view.h - 30, 24, 22, 'Ⅱ', () => {
        mode = 'pause';
        ui.focus = null;
      }, { size: 10 });
      if (stick) drawStick();
    }
    if (mode === 'pause') drawPause();
  }
  if (mode === 'album') drawAlbum();
  if (mode === 'settings') drawSettings();
  ui.end();
  // 소리
  if (mode === 'title') sound.music('title');
  else if (adv) sound.music(songFor(adv.stage.music, adv.runner ? 'calm' : adv.steps.phase));
  const rainy = adv && mode !== 'title' && (adv.room.rain || adv.room.look === 'living' || adv.room.look === 'hospital');
  sound.rainLevel(rainy ? 1 : 0);
  requestAnimationFrame(frame);
}

function drawStick(): void {
  if (!stick) return;
  const c = ui.ctx;
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.beginPath();
  c.arc(stick.ox, stick.oy, 34, 0, Math.PI * 2);
  c.fill();
  const dx = stick.x - stick.ox;
  const dy = stick.y - stick.oy;
  const d = Math.min(30, Math.hypot(dx, dy));
  const an = Math.atan2(dy, dx);
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.beginPath();
  c.arc(stick.ox + Math.cos(an) * d, stick.oy + Math.sin(an) * d, 14, 0, Math.PI * 2);
  c.fill();
}

// ───────────────────────── 타이틀 ─────────────────────────

function drawTitle(): void {
  const c = ui.ctx;
  c.fillStyle = 'rgba(8,6,16,0.45)';
  c.fillRect(0, 0, ui.w, ui.h);
  const cx = ui.w / 2;
  const ty = ui.h * 0.3;
  ui.outlined('태엽이 멈추기 전에', cx, ty, '#fff4dc', 24);
  ui.outlined(store.getItem(CLEAR_KEY) ? '— 끝까지 함께해 줘서 고마워요 —' : '— 코링코 탐험대 —', cx, ty + 24, '#d8c8b0', 10);
  const has = !!loadSave();
  const bw = 150;
  let y = ui.h * 0.5;
  const btn = (id: string, label: string, f: () => void, en = true) => {
    ui.button(id, cx - bw / 2, y, bw, 24, label, f, { enabled: en });
    y += 30;
  };
  if (has) btn('cont', '이어하기', () => start(false));
  btn('new', confirmNew ? '정말 처음부터? (다시 누르기)' : '처음부터', () => {
    if (has && !confirmNew) {
      confirmNew = true;
      return;
    }
    start(true);
  });
  btn('album', '추억 앨범', () => {
    back = 'title';
    mode = 'album';
    ui.focus = null;
  });
  btn('set', '소리', () => {
    back = 'title';
    mode = 'settings';
    ui.focus = null;
  });
  ui.text(touch ? '왼쪽을 끌어 걷기 · 오른쪽을 눌러 살펴보기 · 꾹 누르면 대사 빨리' : '방향키 걷기 · Z 살펴보기/넘기기 (꾹: 빨리) · Esc 멈춤', cx, ui.h - 22, C.dim, 9, 'center');
  if (!ui.focus) ui.focus = has ? 'cont' : 'new';
}

function drawPause(): void {
  ui.dim(0.6);
  const cx = ui.w / 2;
  let y = ui.h * 0.28;
  ui.outlined('잠깐 멈춤', cx, y, '#fff4dc', 16);
  if (adv) {
    const ch = STORY.chapters.find((c) => c.n === adv!.save.chapter);
    ui.text(`${ch?.title ?? ''} — ${ch?.sub ?? ''}`, cx, y + 16, C.dim, 10, 'center');
    const stars = Object.keys(adv.flags).filter((k) => k.startsWith('star_')).length;
    const mins = Math.floor(adv.save.time / 60);
    ui.text(`모은 기억 ${adv.save.album.length} · 종이별 ${stars} · ${Math.floor(mins / 60)}시간 ${mins % 60}분`, cx, y + 30, C.dim, 9, 'center');
  }
  y = ui.h * 0.46;
  const bw = 140;
  const btn = (id: string, label: string, f: () => void) => {
    ui.button(id, cx - bw / 2, y, bw, 22, label, f);
    y += 28;
  };
  btn('resume', '계속하기', () => (mode = 'play'));
  btn('palbum', '추억 앨범', () => {
    back = 'pause';
    mode = 'album';
    ui.focus = null;
  });
  btn('pset', '소리', () => {
    back = 'pause';
    mode = 'settings';
    ui.focus = null;
  });
  btn('ptitle', '저장하고 타이틀로', () => {
    save();
    adv = null;
    backdrop = new Adv(STORY);
    mode = 'title';
    ui.focus = null;
  });
  if (adv && !adv.canSave()) ui.text('장면이 끝나면 저장돼요', cx, y + 4, C.dim, 9, 'center');
}

function drawAlbum(): void {
  ui.dim(0.85);
  const s = adv?.save ?? loadSave();
  const got = new Set(s?.album ?? []);
  const pw = Math.min(ui.w - 16, 460);
  const px = (ui.w - pw) / 2;
  ui.outlined('추억 앨범', ui.w / 2, 18, '#fff4dc', 14);
  let y = 34;
  const colW = (pw - 12) / 3;
  for (const ch of ALBUM) {
    if (y > ui.h - 40) break;
    ui.text(ch.title, px, y, C.gold, 9);
    y += 13;
    ch.items.forEach((it, i) => {
      const x = px + (i % 3) * (colW + 6);
      const has = got.has(it.id);
      ui.panel(x, y, colW, 26, has ? '#3a2e24' : '#221a2c', has ? '#c8a070' : '#4a3e5a');
      ui.text(has ? it.name : '???', x + 6, y + 3, has ? '#fff4dc' : '#6a5a7a', 9);
      if (has) ui.text(it.line, x + 6, y + 14, '#c8b090', 7);
    });
    y += 30;
  }
  ui.button('aback', ui.w / 2 - 50, ui.h - 28, 100, 20, '닫기', () => (mode = back), { size: 10 });
  if (!ui.focus) ui.focus = 'aback';
}

function drawSettings(): void {
  ui.dim(0.8);
  const cx = ui.w / 2;
  ui.outlined('소리', cx, ui.h * 0.28, '#fff4dc', 14);
  const row = (id: 'sfx' | 'bgm', label: string, y: number) => {
    ui.text(label, cx - 110, y + 4, C.light, 11);
    ui.button(`${id}-`, cx - 30, y, 24, 20, '−', () => setVol(id, volume[id] - 0.1));
    ui.bar(cx, y + 7, 70, 6, volume[id], C.gold);
    ui.button(`${id}+`, cx + 76, y, 24, 20, '+', () => setVol(id, volume[id] + 0.1));
  };
  row('bgm', '음악', ui.h * 0.4);
  row('sfx', '효과음', ui.h * 0.4 + 30);
  ui.button('sback', cx - 50, ui.h * 0.4 + 70, 100, 22, '닫기', () => (mode = back), { size: 10 });
}

function setVol(k: 'sfx' | 'bgm', v: number): void {
  volume = { ...volume, [k]: Math.round(Math.max(0, Math.min(1, v)) * 10) / 10 };
  sound.setVolume(volume);
  store.setItem(VOL_KEY, JSON.stringify(volume));
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});
window.addEventListener('pagehide', () => save());

if (location.hash === '#debug') (window as unknown as Record<string, unknown>).tm = { get adv() { return adv; }, start, STORY };

void document.fonts?.load('12px Galmuri11').catch(() => undefined);
void NO_INPUT;
requestAnimationFrame(frame);
