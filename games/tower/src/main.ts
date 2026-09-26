import { buyItem, createGame, reroll, step, type GameState } from './core/game.ts';
import { computeLayout, fitScale, hitTest, toLogical } from './ui/layout.ts';
import { Renderer, type UiState } from './ui/render.ts';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let state: GameState = createGame();
const layout = computeLayout(state.config.width, state.config.height, state.config.shop.slots);
const renderer = new Renderer(ctx, layout);
const ui: UiState = { started: false, paused: false, speed: 1, hover: null, message: null };

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

function restart(): void {
  state = createGame();
  ui.paused = false;
  ui.message = null;
}

function startOrRestart(): boolean {
  if (!ui.started) {
    ui.started = true;
    return true;
  }
  if (state.status !== 'playing') {
    restart();
    return true;
  }
  return false;
}

function logicalFromEvent(ev: PointerEvent): { x: number; y: number } {
  return toLogical(canvas.getBoundingClientRect(), layout.width, layout.height, ev.clientX, ev.clientY);
}

canvas.addEventListener('pointerdown', (ev) => {
  if (startOrRestart()) return;
  const { x, y } = logicalFromEvent(ev);
  const hit = hitTest(layout, x, y);
  if (!hit) return;
  if (hit.kind === 'pause') ui.paused = !ui.paused;
  else if (hit.kind === 'speed') ui.speed = ui.speed === 1 ? 2 : 1;
  else if (ui.paused) return;
  else if (hit.kind === 'card') buyItem(state, hit.index);
  else if (hit.kind === 'reroll') reroll(state);
});

canvas.addEventListener('pointermove', (ev) => {
  const { x, y } = logicalFromEvent(ev);
  const hit = hitTest(layout, x, y);
  ui.hover = hit?.kind === 'card' ? hit.index : null;
  canvas.style.cursor = hit ? 'pointer' : 'default';
});

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' || (!ui.started && ev.key === ' ')) {
    startOrRestart();
    ev.preventDefault();
    return;
  }
  if (!ui.started || state.status !== 'playing') return;
  if (ev.key === ' ') {
    ui.paused = !ui.paused;
    ev.preventDefault();
    return;
  }
  if (ev.key === 'f' || ev.key === 'F') ui.speed = ui.speed === 1 ? 2 : 1;
  if (ui.paused) return;
  if (ev.key >= '1' && ev.key <= '9') buyItem(state, Number(ev.key) - 1);
  if (ev.key === 'r' || ev.key === 'R') reroll(state);
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

  renderer.consume(state.events, ui);
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  renderer.draw(state, ui, nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
