import type { DifficultyId } from './core/config.ts';
import { buyItem, createGame, reroll, step, type GameState } from './core/game.ts';
import { computeLayout, fitScale, hitTest, hitTestStart, toLogical } from './ui/layout.ts';
import { loadRecords, saveRecords, updateRecords, type StorageLike } from './ui/records.ts';
import { Renderer, type UiState } from './ui/render.ts';
import { Sound } from './ui/sound.ts';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const MUTE_KEY = 'tower-guardian:muted';

/** localStorage 에 닿는 것 자체가 막힌 환경(사생활 보호 등)에서도 동작하도록 */
function storage(): StorageLike {
  try {
    return window.localStorage;
  } catch {
    const mem: Record<string, string> = {};
    return { getItem: (k) => mem[k] ?? null, setItem: (k, v) => void (mem[k] = v) };
  }
}

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const store = storage();
const sound = new Sound();

let state: GameState = createGame();
const layout = computeLayout(state.config.width, state.config.height, state.config.shop.slots);
const renderer = new Renderer(ctx, layout);
const ui: UiState = {
  started: false,
  paused: false,
  speed: 1,
  hover: null,
  message: null,
  difficulty: 'normal',
  muted: false,
  records: loadRecords(store),
  newBest: false,
};
try {
  ui.muted = store.getItem(MUTE_KEY) === '1';
} catch {
  ui.muted = false;
}
sound.muted = ui.muted;

let pixelScale = 1;
function resize(): void {
  const scale = fitScale(layout.width, layout.height, window.innerWidth, window.innerHeight);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${Math.floor(layout.width * scale)}px`;
  canvas.style.height = `${Math.floor(layout.height * scale)}px`;
  pixelScale = scale * dpr;
  canvas.width = Math.floor(layout.width * pixelScale);
  canvas.height = Math.floor(layout.height * pixelScale);
}
window.addEventListener('resize', resize);
resize();

function start(difficulty: DifficultyId): void {
  ui.difficulty = difficulty;
  state = createGame({ difficulty });
  ui.started = true;
  ui.paused = false;
  ui.message = null;
  ui.newBest = false;
}

function backToTitle(): void {
  ui.started = false;
  state = createGame({ difficulty: ui.difficulty });
}

function toggleMute(): void {
  ui.muted = !ui.muted;
  sound.muted = ui.muted;
  try {
    store.setItem(MUTE_KEY, ui.muted ? '1' : '0');
  } catch {
    // 저장 못 해도 이번 판에는 적용된다
  }
}

function tryBuy(slot: number): void {
  if (buyItem(state, slot)) sound.buy();
  else if (state.shop[slot]) sound.denied();
}

function tryReroll(): void {
  if (reroll(state)) sound.reroll();
  else sound.denied();
}

/** 판이 끝나는 순간 한 번만 기록을 남긴다 */
let recorded = false;
function recordIfFinished(): void {
  if (state.status === 'playing') {
    recorded = false;
    return;
  }
  if (recorded || !ui.started) return;
  recorded = true;
  const before = ui.records[state.difficulty];
  const won = state.status === 'won';
  ui.records = updateRecords(ui.records, { difficulty: state.difficulty, won, round: state.round, time: state.time, kills: state.kills });
  const after = ui.records[state.difficulty];
  ui.newBest = after.bestRound > before.bestRound || (won && after.fastestWin !== before.fastestWin);
  saveRecords(store, ui.records);
  sound.end(won);
}

function logicalFromEvent(ev: PointerEvent): { x: number; y: number } {
  return toLogical(canvas.getBoundingClientRect(), layout.width, layout.height, ev.clientX, ev.clientY);
}

canvas.addEventListener('pointerdown', (ev) => {
  sound.unlock();
  const { x, y } = logicalFromEvent(ev);
  if (!ui.started) {
    const hit = hitTestStart(layout, x, y);
    if (hit) start(hit.id);
    return;
  }
  if (state.status !== 'playing') {
    backToTitle();
    return;
  }
  const hit = hitTest(layout, x, y);
  if (!hit) return;
  if (hit.kind === 'pause') ui.paused = !ui.paused;
  else if (hit.kind === 'speed') ui.speed = ui.speed === 1 ? 2 : 1;
  else if (hit.kind === 'mute') toggleMute();
  else if (ui.paused) return;
  else if (hit.kind === 'card') tryBuy(hit.index);
  else if (hit.kind === 'reroll') tryReroll();
});

canvas.addEventListener('pointermove', (ev) => {
  const { x, y } = logicalFromEvent(ev);
  if (!ui.started) {
    const hit = hitTestStart(layout, x, y);
    if (hit) ui.difficulty = hit.id;
    canvas.style.cursor = hit ? 'pointer' : 'default';
    return;
  }
  const hit = hitTest(layout, x, y);
  ui.hover = hit?.kind === 'card' ? hit.index : null;
  canvas.style.cursor = hit ? 'pointer' : 'default';
});

const DIFFICULTY_KEYS: Record<string, DifficultyId> = { '1': 'easy', '2': 'normal', '3': 'hard' };

window.addEventListener('keydown', (ev) => {
  sound.unlock();
  if (ev.key === 'm' || ev.key === 'M') {
    toggleMute();
    return;
  }
  if (!ui.started) {
    if (DIFFICULTY_KEYS[ev.key]) start(DIFFICULTY_KEYS[ev.key]);
    else if (ev.key === 'Enter' || ev.key === ' ') start(ui.difficulty);
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      const ids: DifficultyId[] = ['easy', 'normal', 'hard'];
      const i = ids.indexOf(ui.difficulty) + (ev.key === 'ArrowLeft' ? -1 : 1);
      ui.difficulty = ids[Math.max(0, Math.min(ids.length - 1, i))];
    }
    ev.preventDefault();
    return;
  }
  if (state.status !== 'playing') {
    if (ev.key === 'Enter' || ev.key === ' ') backToTitle();
    ev.preventDefault();
    return;
  }
  if (ev.key === ' ') {
    ui.paused = !ui.paused;
    ev.preventDefault();
    return;
  }
  if (ev.key === 'f' || ev.key === 'F') ui.speed = ui.speed === 1 ? 2 : 1;
  if (ui.paused) return;
  if (ev.key >= '1' && ev.key <= '9') tryBuy(Number(ev.key) - 1);
  if (ev.key === 'r' || ev.key === 'R') tryReroll();
});

// 창을 떠나면 자동으로 멈춘다
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ui.started && state.status === 'playing') ui.paused = true;
});

let last = performance.now();
let acc = 0;
function frame(nowMs: number): void {
  const dt = Math.min(MAX_FRAME, (nowMs - last) / 1000);
  last = nowMs;
  if (ui.started && !ui.paused && state.status === 'playing') {
    acc += dt * ui.speed;
    while (acc >= STEP) {
      step(state, STEP);
      acc -= STEP;
    }
  } else acc = 0;

  recordIfFinished();
  if (ui.started) for (const ev of state.events) sound.event(ev);
  renderer.consume(state.events, ui);
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  renderer.draw(state, ui, nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
