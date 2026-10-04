/** 코링코 탐험대: 화면 · 입력 · 놀이 진행을 잇는다 */
import { newSave, skillLv } from './core/character.ts';
import { skillForKey } from './core/classes.ts';
import { changeMap, leaveRift, newGame, step, type Game } from './core/game.ts';
import { RIFT_MAX, TILE } from './core/maps.ts';
import { saveSlot } from './core/saveio.ts';
import { CUTSCENES, PROLOGUE } from './core/story.ts';
import { refreshStats } from './core/combat.ts';
import type { Save } from './core/types.ts';
import { NO_INPUT, type Input, type WorldEvent } from './core/world.ts';
import { musicMood } from './ui/audio/music.ts';
import { Hud } from './ui/hud.ts';
import { autoAttackTarget, HINTS, nextHint, type HintState } from './core/hints.ts';
import { interactTarget } from './core/game.ts';
import { keyAction, moveFromKeys } from './ui/keys.ts';
import { C, Ui } from './ui/kit.ts';
import { hudLayout, type TouchId } from './ui/layout.ts';
import { Fx } from './ui/render/fx.ts';
import { drawScene, preloadMap, swingColor } from './ui/render/scene.ts';
import { DialogScreen } from './ui/screens/dialog.ts';
import { MenuScreen, type Tab } from './ui/screens/menu.ts';
import type { App, Screen, Sfx } from './ui/screens/screen.ts';
import { StoryScreen } from './ui/screens/story.ts';
import { BlessingScreen, PortalScreen } from './ui/screens/rift.ts';
import { TitleScreen } from './ui/screens/title.ts';
import { Sound } from './ui/sound.ts';
import { store } from './ui/storage.ts';
import { cameraFor, chooseView, type View } from './ui/view.ts';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const world = document.createElement('canvas');
const wctx = world.getContext('2d')!;

const ui = new Ui();
const fx = new Fx();
const hud = new Hud();
const sound = new Sound();

const VOL_KEY = 'koringko:volume';
const PREF_KEY = 'koringko:prefs';
function loadPrefs(): { autoAttack: boolean; shake: boolean; hints: boolean } {
  const d = { autoAttack: true, shake: true, hints: true };
  try {
    const v = JSON.parse(store.getItem(PREF_KEY) ?? '');
    return { autoAttack: v.autoAttack !== false, shake: v.shake !== false, hints: v.hints !== false };
  } catch {
    return d;
  }
}
function loadVolume(): { sfx: number; bgm: number } {
  try {
    const v = JSON.parse(store.getItem(VOL_KEY) ?? '');
    if (typeof v.sfx === 'number' && typeof v.bgm === 'number') return { sfx: v.sfx, bgm: v.bgm };
  } catch {
    /* 처음 */
  }
  return { sfx: 0.8, bgm: 0.5 };
}

let view: View = { scale: 1, w: 1, h: 1 };
let dpr = 1;
const stack: Screen[] = [];
let lastSave = 0;

// 타이틀 뒤 배경으로 쓰는 마을
const backdrop: Game = newGame(newSave(0, 'toby'), 7);
backdrop.world.player.x = -200;
backdrop.world.events = [];

const app: App = {
  g: null,
  ui,
  touch: matchMedia('(pointer: coarse)').matches,
  volume: loadVolume(),
  prefs: loadPrefs(),
  setPref(kind, v) {
    app.prefs = { ...app.prefs, [kind]: v };
    store.setItem(PREF_KEY, JSON.stringify(app.prefs));
  },
  push(s) {
    stack.push(s);
    ui.focus = null;
  },
  pop() {
    stack.pop();
    ui.focus = null;
  },
  closeAll() {
    stack.length = 0;
    ui.focus = null;
  },
  top() {
    return stack[stack.length - 1] ?? null;
  },
  startGame(save: Save, fresh: boolean) {
    stack.length = 0;
    const g = newGame(save);
    app.g = g;
    fx.clear();
    hud.toasts = [];
    preloadMap(g.world.map);
    saveSlot(store, save);
    lastSave = performance.now();
    if (fresh)
      app.push(
        new StoryScreen(
          PROLOGUE.map((t) => ({ text: t })),
          '코링코 탐험대',
          (a) => a.toast('노란 표시를 따라 태엽 할머니에게 가 보자', C.gold),
        ),
      );
  },
  toTitle() {
    app.g = null;
    stack.length = 0;
    fx.clear();
    app.push(new TitleScreen());
  },
  saveNow() {
    if (!app.g) return;
    saveSlot(store, app.g.save);
    lastSave = performance.now();
  },
  sfx(name: Sfx) {
    sound.sfx(name);
  },
  toast(text, color) {
    hud.toast(text, color);
  },
  changed(lvBefore) {
    const g = app.g;
    if (!g) return;
    refreshStats(g);
    if (lvBefore !== undefined && g.save.lv > lvBefore) {
      g.save.hp = g.stats.maxHp;
      g.save.sp = g.stats.maxSp;
      hud.onEvent({ kind: 'levelUp', lv: g.save.lv });
      fx.onEvent({ kind: 'levelUp', lv: g.save.lv }, g.world.time, '#fff');
      sound.sfx('levelUp');
    }
  },
  setVolume(kind, v) {
    app.volume = { ...app.volume, [kind]: v };
    sound.setVolume(app.volume);
    store.setItem(VOL_KEY, JSON.stringify(app.volume));
  },
};
sound.setVolume(app.volume);

// ───────────────────────── 화면 크기 ─────────────────────────

function resize(): void {
  dpr = Math.min(3, window.devicePixelRatio || 1);
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  canvas.style.width = `${cw}px`;
  canvas.style.height = `${ch}px`;
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  view = chooseView(canvas.width, canvas.height);
  world.width = view.w;
  world.height = view.h;
}
window.addEventListener('resize', resize);
resize();

// ───────────────────────── 입력 ─────────────────────────

const held = new Set<string>();
let attackPressed = false;
let rollQueued = false;
let skillQueued: Input['skill'] = null;
let potionQueued: Input['potion'] = null;
let swapQueued: Input['swap'] = null;
/** 손가락 */
const touchHeld = new Map<number, TouchId>();
let stick: { id: number; ox: number; oy: number; x: number; y: number } | null = null;

function learnedKey(k: 'A' | 'S' | 'D' | 'F'): boolean {
  const g = app.g;
  const def = g ? skillForKey(g.save.hero, k) : undefined;
  return !!g && !!def && skillLv(g.save, def.id) > 0;
}

function playing(): boolean {
  return !!app.g && stack.length === 0;
}

function onAction(a: string, repeat: boolean): void {
  const top = app.top();
  if (top) {
    if (top.key?.(app, a)) return;
    if (a === 'up') ui.move(0, -1);
    else if (a === 'down') ui.move(0, 1);
    else if (a === 'left') ui.move(-1, 0);
    else if (a === 'right') ui.move(1, 0);
    else if (a === 'attack' && !repeat) ui.activate();
    else if ((a === 'roll' || a === 'menu' || a === 'back') && !repeat) {
      if (top.back) top.back(app);
      else {
        app.pop();
        sound.sfx('back');
      }
    }
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') sound.sfx('move');
    return;
  }
  if (!app.g || repeat) return;
  const tabs: Record<string, Tab> = { menu: 'party', party: 'party', parts: 'parts', skills: 'skills', quests: 'quests', book: 'book' };
  if (tabs[a]) {
    app.push(new MenuScreen(app, tabs[a]));
    sound.sfx('click');
    return;
  }
  if (a === 'attack') attackPressed = true;
  else if (a === 'roll') rollQueued = true;
  else if (a === 'skillA' || a === 'skillS' || a === 'skillD' || a === 'skillF') skillQueued = a.slice(5) as Input['skill'];
  else if (a === 'potionHp') potionQueued = 'hp';
  else if (a === 'next') swapQueued = 'next';
  else if (a.startsWith('hero')) {
    const h = app.g.save.party[Number(a.slice(4)) - 1];
    if (h && h !== app.g.save.hero) swapQueued = h;
  }
}

window.addEventListener('keydown', (e) => {
  sound.unlock();
  app.touch = false;
  const a = keyAction(e.code);
  if (!a) return;
  e.preventDefault();
  held.add(e.code);
  onAction(a, e.repeat);
});
window.addEventListener('keyup', (e) => held.delete(e.code));
window.addEventListener('blur', () => {
  held.clear();
  touchHeld.clear();
  stick = null;
});

function logical(e: PointerEvent): { x: number; y: number } {
  return { x: (e.clientX * dpr) / view.scale, y: (e.clientY * dpr) / view.scale };
}

canvas.addEventListener('pointerdown', (e) => {
  sound.unlock();
  e.preventDefault();
  const p = logical(e);
  if (e.pointerType === 'touch') app.touch = true;
  else app.touch = app.touch && e.pointerType !== 'mouse';
  ui.keyboard = false;
  // 창 · HUD 단추
  if (ui.click(p.x, p.y)) {
    sound.sfx('click');
    return;
  }
  if (!playing() || !app.touch) return;
  const L = hudLayout(view.w, view.h, true);
  for (const [id, c] of Object.entries(L.touch) as [TouchId, { x: number; y: number; r: number }][]) {
    // 아직 배우지 않은 스킬 단추는 없는 것으로
    if ((id === 'A' || id === 'S' || id === 'D' || id === 'F') && !learnedKey(id)) continue;
    if (Math.hypot(p.x - c.x, p.y - c.y) <= c.r + 4) {
      touchHeld.set(e.pointerId, id);
      if (id === 'attack') attackPressed = true;
      else if (id === 'roll') rollQueued = true;
      else if (id === 'hp') potionQueued = 'hp';
      else skillQueued = id;
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
  if (p.x < view.w * 0.6 && !stick) {
    stick = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', (e) => {
  const p = logical(e);
  if (stick && e.pointerId === stick.id) {
    stick.x = p.x;
    stick.y = p.y;
    // 멀리 끌면 받침이 따라온다
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
  touchHeld.delete(e.pointerId);
  if (stick && e.pointerId === stick.id) stick = null;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function gameInput(): Input {
  let move = moveFromKeys(held);
  if (stick) {
    const dx = stick.x - stick.ox;
    const dy = stick.y - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > 4) {
      const k = Math.min(1, d / 30) / d;
      move = { x: dx * k, y: dy * k };
    }
  }
  let attackHeld = held.has('KeyZ') || held.has('Space') || held.has('Enter') || [...touchHeld.values()].includes('attack');
  // 휴대폰 자동 공격: 멈춰 있고 가까이 적이 있으면
  if (app.touch && app.prefs.autoAttack && app.g && autoAttackTarget(app.g, Math.hypot(move.x, move.y) > 0.1)) attackHeld = true;
  const inp: Input = { move, attack: attackHeld || attackPressed, attackPressed, roll: rollQueued, skill: skillQueued, potion: potionQueued, swap: swapQueued };
  swapQueued = null;
  attackPressed = false;
  rollQueued = false;
  skillQueued = null;
  potionQueued = null;
  return inp;
}

// ───────────────────────── 사건 ─────────────────────────

function handleEvents(g: Game, evs: WorldEvent[]): void {
  const sc = swingColor(g.save.hero);
  for (const e of evs) {
    fx.onEvent(e, g.world.time, sc);
    hud.onEvent(e);
    if (e.kind === 'bossIntro') {
      const b = g.world.monsters.find((m) => m.boss && m.hp > 0);
      if (b) fx.cinema = { x: b.x, y: b.y, life: 2, max: 2 };
    }
    switch (e.kind) {
      case 'talk':
        app.push(new DialogScreen(app, e.npc));
        break;
      case 'portal':
        if (g.run) app.push(new PortalScreen());
        else {
          leaveRift(g);
          app.saveNow();
        }
        break;
      case 'enter':
        fx.clear();
        preloadMap(g.world.map);
        app.saveNow();
        break;
      case 'bossDown': {
        const cut = ({ b_bear: 'bear', b_jelly: 'jelly', b_tin: 'tin', b_dusty: 'dusty', b_king: 'ending' } as Record<string, keyof typeof CUTSCENES>)[e.id];
        if (cut && !g.world.rift && !g.save.flags[`cut_${cut}`]) {
          g.save.flags[`cut_${cut}`] = true;
          const end = cut === 'ending';
          app.push(
            new StoryScreen(CUTSCENES[cut].map((c) => ({ who: c.who, text: c.text })), end ? '아이 방에 아침이 왔다' : '', (a) => {
              if (end) a.toast('엔딩을 봤어요! 블록 마을 촌장에게 보고하면 다락방 상자 도전이 열려요', C.gold);
              a.saveNow();
            }),
          );
        }
        app.saveNow();
        break;
      }
      case 'join': {
        const cut = `join_${e.hero}` as 'join_bori';
        if (CUTSCENES[cut] && !g.save.flags[`cut_${cut}`]) {
          g.save.flags[`cut_${cut}`] = true;
          app.push(new StoryScreen(CUTSCENES[cut].map((c) => ({ who: c.who, text: c.text })), '', () => app.saveNow()));
        }
        fx.flash = { color: '#fff4c0', life: 0.4, max: 0.4 };
        app.saveNow();
        break;
      }
      case 'chest':
        if (e.part) gotPart = true;
        app.saveNow();
        break;
      case 'riftClear':
        if (g.run?.offer) app.push(new BlessingScreen());
        if (e.depth >= RIFT_MAX && !g.save.flags.cut_attic_box) {
          g.save.flags.cut_attic_box = true;
          app.toast('다락방 상자 끝까지 정리했어요! 진짜 대단해요', C.gold);
        }
        app.saveNow();
        break;
      case 'levelUp':
      case 'quest':
        app.saveNow();
        break;
      case 'pickup':
        if (e.drop === 'part') gotPart = true;
        break;
      default:
        break;
    }
  }
  sound.events(evs, g.save.hero, g.world.player.x);
}

// ───────────────────────── 고리 ─────────────────────────

const STEP = 1 / 60;
let acc = 0;
let last = performance.now();
let time = 0;

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  const g = app.g;
  const top = app.top();

  if (g) {
    if (!top || !top.modal) {
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        // 보스 등장 연출 동안은 멈춘다
        if (fx.cinema && fx.cinema.life > 0.7) {
          fx.update(STEP);
          continue;
        }
        if (fx.hitstop > 0) {
          fx.hitstop = Math.max(0, fx.hitstop - STEP);
          continue;
        }
        step(g, STEP, gameInput());
        const evs = g.world.events.splice(0);
        if (evs.length) handleEvents(g, evs);
        if (app.top()) break;
      }
    } else {
      acc = 0;
      // 창이 열린 동안 쌓인 사건 (퀘스트 완료 등)
      const evs = g.world.events.splice(0);
      if (evs.length) handleEvents(g, evs);
    }
    fx.update(dt);
    hud.update(dt);
    if (now - lastSave > 20000) app.saveNow();
  } else hud.update(dt);

  // 세계
  const G = g ?? backdrop;
  let cam: { x: number; y: number };
  if (g) {
    let fxp = g.world.player.x;
    let fyp = g.world.player.y - 8;
    if (fx.cinema) {
      // 보스 쪽으로 카메라를 옮겼다가 돌아온다
      const t = fx.cinema.life / fx.cinema.max;
      const k = Math.min(1, (1 - t) * 3, t * 2.2);
      const e = k * k * (3 - 2 * k);
      fxp += (fx.cinema.x - fxp) * e;
      fyp += (fx.cinema.y - fyp) * e;
    }
    cam = cameraFor(fxp, fyp, g.world.map.w * TILE, g.world.map.h * TILE, view.w, view.h);
  }
  else {
    const m = backdrop.world.map;
    cam = cameraFor(m.w * TILE * (0.5 + Math.sin(time * 0.05) * 0.3), m.h * TILE * (0.45 + Math.cos(time * 0.04) * 0.2), m.w * TILE, m.h * TILE, view.w, view.h);
  }
  wctx.imageSmoothingEnabled = false;
  if (!app.prefs.shake) fx.shake = 0;
  if (g && app.prefs.hints && !app.top()) checkHint(g, dt);
  const out = drawScene(wctx, G, cam, view.w, view.h, g ? fx : backdropFx, g ? g.world.time : time);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(world, 0, 0, view.w * view.scale, view.h * view.scale);

  // 글자 · 창
  ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
  ui.begin(ctx, view.w, view.h, time);
  if (g) {
    const L = hudLayout(view.w, view.h, app.touch);
    hud.draw(ui, g, L, app.touch, out.labels, fx, cam, { menu: () => app.push(new MenuScreen(app, 'party')), swap: (h) => (swapQueued = h) });
    if (g.world.player.state === 'dead') {
      ui.dim(0.35);
      ui.outlined('쓰러졌다…', view.w / 2, view.h * 0.42, C.bad, 20);
      ui.outlined('곧 마을에서 깨어납니다', view.w / 2, view.h * 0.42 + 20, C.light, 10);
    }
    if (stick && !app.top()) drawStick();
  }
  if (app.top()) {
    // 창이 열려 있으면 HUD 단추는 고를 수 없게
    ui.btns = [];
    app.top()!.draw(app, dt);
  }
  ui.end();

  // 음악
  if (g) {
    const p = g.world.player;
    const near = g.world.monsters.filter((m) => m.hp > 0 && Math.hypot(m.x - p.x, m.y - p.y) < 160).length;
    const mood = musicMood({ playing: true, theme: g.world.map.theme, boss: g.world.monsters.some((m) => m.boss && m.hp > 0), nearEnemies: near, frozen: g.world.freeze.phase === 'freeze' && (g.world.freeze.kind === 'still' || g.world.freeze.kind === 'king') });
    sound.music(mood.track, mood.level);
    // 얼음을 버티며 태엽 감는 소리
    if (g.world.freeze.phase === 'freeze' && !g.world.freeze.caught && !app.top()) {
      windClock -= dt;
      if (windClock <= 0) {
        windClock = 0.11;
        sound.sfx('windTick');
      }
    }
  } else sound.music('title', 2);

  requestAnimationFrame(frame);
}

const backdropFx = new Fx();

// ───────────────────────── 처음 안내 ─────────────────────────

let hintClock = 0;
let gotPart = false;
let windClock = 0;
function checkHint(g: Game, dt: number): void {
  hintClock -= dt;
  if (hintClock > 0 || hud.hint) return;
  hintClock = 0.5;
  const w = g.world;
  const p = w.player;
  const near = (r: number, f: (m: (typeof w.monsters)[number]) => boolean = () => true) => w.monsters.some((m) => m.hp > 0 && m.spawnLeft <= 0 && f(m) && Math.hypot(m.x - p.x, m.y - p.y) < r);
  const st: HintState = {
    map: w.map.id,
    nearNpc: interactTarget(g)?.kind === 'npc',
    nearMonster: near(120),
    lowHp: g.save.hp < g.stats.maxHp * 0.35,
    skillPts: g.save.skillPts,
    partNew: gotPart,
    elite: near(170, (m) => m.rank === 'elite'),
    hazard: w.hazards.some((h) => h.from === 'monster' && h.delay > 0 && h.damage > 0 && h.shape.type === 'circle' && Math.hypot(h.shape.x - p.x, h.shape.y - p.y) < h.shape.r + 40),
    inRift: !!w.rift,
    lowWind: g.save.sp < 15 && !w.map.safe,
    party: g.save.party.length,
    nearCocoon: interactTarget(g)?.kind === 'cocoon',
  };
  const seen = new Set(Object.keys(HINTS).filter((k) => g.save.flags[`hint_${k}`]));
  const id = nextHint(st, seen);
  if (!id) return;
  g.save.flags[`hint_${id}`] = true;
  hud.hint = { text: app.touch ? HINTS[id].touch : HINTS[id].key, life: 6 };
}

function drawStick(): void {
  if (!stick) return;
  const c = ui.ctx;
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.beginPath();
  c.arc(stick.ox, stick.oy, 34, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 1;
  c.stroke();
  const dx = stick.x - stick.ox;
  const dy = stick.y - stick.oy;
  const d = Math.min(30, Math.hypot(dx, dy));
  const a = Math.atan2(dy, dx);
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.beginPath();
  c.arc(stick.ox + Math.cos(a) * d, stick.oy + Math.sin(a) * d, 14, 0, Math.PI * 2);
  c.fill();
}

// 탭을 떠날 때 저장
document.addEventListener('visibilitychange', () => {
  if (document.hidden) app.saveNow();
});
window.addEventListener('pagehide', () => app.saveNow());

// 개발 · 확인용: 주소 끝에 #debug 를 붙이면 콘솔에서 다룰 수 있다
if (location.hash === '#debug') (window as unknown as Record<string, unknown>).koringko = { app, changeMap, step, NO_INPUT, newSave };

app.push(new TitleScreen());
void document.fonts?.load(`12px Galmuri11`).catch(() => undefined);
requestAnimationFrame(frame);
