import type { DifficultyId, GameMode } from './core/config.ts';
import { buyItem, canBuy, choosePerk, createGame, reroll, sellWeapon, step, type GameState } from './core/game.ts';
import { SKILLS, useSkill } from './core/skills.ts';
import { HEROES, type HeroId } from './core/heroes.ts';
import { META_UPGRADES, buyMetaUpgrade, heroUnlocked, metaBonuses } from './core/meta.ts';
import { buildRunReport, finishRun } from './core/progress.ts';
import { emptyProgress, updateProgress } from './ui/tutorial.ts';
import { WEAPON_TYPES, setTier, weaponCounts } from './core/sets.ts';
import { computeLayout, fitScale, hitTest, hitTestChoice, hitTestMeta, hitTestStart, toLogical } from './ui/layout.ts';
import { hitTestOwned, hitTestSetChip, ownedGroups, ownedTileCount } from './ui/owned.ts';
import {
  loadEndless,
  loadMeta,
  loadRecords,
  saveEndless,
  saveMeta,
  saveRecords,
  updateEndless,
  updateRecords,
  type StorageLike,
} from './ui/records.ts';
import { Renderer, type UiState } from './ui/render.ts';
import { Sound } from './ui/sound.ts';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const MUTE_KEY = 'tower-guardian:muted';
const HERO_KEY = 'tower-guardian:hero';
const DIFFICULTY_IDS: DifficultyId[] = ['easy', 'normal', 'hard'];

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
  hoverButton: null,
  hoverSkill: null,
  hoverOwned: null,
  hoverChip: null,
  hoverChoice: null,
  aiming: false,
  pointer: null,
  sellArmed: null,
  difficulty: 'normal',
  mode: 'classic',
  muted: false,
  records: loadRecords(store),
  endless: loadEndless(store),
  newBest: false,
  screen: 'title',
  hero: 'guardian',
  meta: loadMeta(store),
  reward: null,
  tutorial: null,
  hoverStart: null,
  hoverMeta: null,
};
try {
  const saved = store.getItem(HERO_KEY) as HeroId | null;
  if (saved && HEROES.some((h) => h.id === saved) && heroUnlocked(ui.meta, saved)) ui.hero = saved;
} catch {
  // 저장된 탑이 없으면 수호탑
}
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
  state = createGame({ difficulty, mode: ui.mode, hero: ui.hero, meta: metaBonuses(ui.meta) });
  ui.started = true;
  ui.paused = false;
  ui.aiming = false;
  ui.sellArmed = null;
  ui.newBest = false;
  ui.reward = null;
  ui.tutorial = ui.meta.tutorialDone ? null : emptyProgress();
}

function backToTitle(): void {
  ui.started = false;
  ui.screen = 'title';
  state = createGame({ difficulty: ui.difficulty, mode: ui.mode });
}

function selectHero(id: HeroId): void {
  if (!heroUnlocked(ui.meta, id)) {
    sound.denied();
    renderer.onDenyHero(id);
    return;
  }
  ui.hero = id;
  try {
    store.setItem(HERO_KEY, id);
  } catch {
    // 못 저장해도 이번에는 고른 탑으로
  }
}

function buyUpgrade(index: number): void {
  const u = META_UPGRADES[index];
  const next = u && buyMetaUpgrade(ui.meta, u.id);
  if (!next) {
    sound.denied();
    return;
  }
  ui.meta = next;
  saveMeta(store, ui.meta);
  sound.upgrade();
  renderer.onMetaBought(index);
}

function setMode(mode: GameMode): void {
  ui.mode = mode;
  state = createGame({ difficulty: ui.difficulty, mode });
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
  const item = state.shop[slot];
  const before = item?.kind === 'weapon' ? setTier(state.config, weaponCounts(state)[item.type]) : 0;
  if (buyItem(state, slot)) {
    sound.buy();
    if (ui.tutorial) ui.tutorial = { ...ui.tutorial, bought: true };
    renderer.onBuy(slot);
    if (item?.kind === 'weapon') {
      const after = setTier(state.config, weaponCounts(state)[item.type]);
      if (after > before) {
        renderer.onSetReached(state, item.type, after);
        sound.event({ kind: 'round', round: state.round });
      }
    }
  } else if (item) {
    sound.denied();
    renderer.onDeny(slot);
    const check = canBuy(state, slot);
    if (!check.ok && check.reason === 'slots') renderer.info('무기 칸이 꽉 찼다', '왼쪽 목록에서 두 번 눌러 팔거나, 같은 무기 3개로 합성');
  }
}

const SKILL_KEYS: Record<string, string> = Object.fromEntries(SKILLS.map((sk) => [sk.key.toLowerCase(), sk.id]));

function onField(p: { x: number; y: number } | null): p is { x: number; y: number } {
  return !!p && p.x >= 0 && p.x < layout.width && p.y >= 24 && p.y < layout.fieldHeight;
}

/** 스킬 사용. 메테오는 마우스가 전장 위에 있으면 그곳에, 아니면 적이 가장 많은 곳에 */
function trySkill(id: string, at?: { x: number; y: number }): void {
  const target = at ?? (id === 'meteor' && onField(ui.pointer) ? ui.pointer : undefined);
  if (useSkill(state, id, target)) {
    sound.skill(id);
    ui.aiming = false;
  } else sound.denied();
}

/** 보유 무기 묶음을 누름: 첫 번째는 확인, 3초 안에 한 번 더 누르면 판매 */
function clickOwned(index: number): void {
  const g = ownedGroups(state)[index];
  if (!g) return;
  const key = `${g.id}:${g.level}`;
  const now = performance.now() / 1000;
  if (ui.sellArmed?.key === key && ui.sellArmed.until > now) {
    if (sellWeapon(state, g.indices[0]) > 0) sound.sell();
    ui.sellArmed = null;
  } else ui.sellArmed = { key, until: now + 3 };
}

function tryChoose(index: number): void {
  if (choosePerk(state, index)) sound.perk();
}

function tryReroll(): void {
  if (reroll(state)) {
    sound.reroll();
    renderer.onReroll();
  } else sound.denied();
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
  const won = state.status === 'won';
  const reward = finishRun(ui.meta, buildRunReport(state));
  ui.meta = reward.meta;
  ui.reward = reward;
  ui.tutorial = null;
  saveMeta(store, ui.meta);
  if (state.mode === 'endless') {
    const before = ui.endless[state.difficulty];
    ui.endless = updateEndless(ui.endless, { difficulty: state.difficulty, round: state.round, kills: state.kills });
    const after = ui.endless[state.difficulty];
    ui.newBest = after.bestRound > before.bestRound || after.bestKills > before.bestKills;
    saveEndless(store, ui.endless);
  } else {
    const before = ui.records[state.difficulty];
    ui.records = updateRecords(ui.records, { difficulty: state.difficulty, won, round: state.round, time: state.time, kills: state.kills });
    const after = ui.records[state.difficulty];
    ui.newBest = after.bestRound > before.bestRound || (won && after.fastestWin !== before.fastestWin);
    saveRecords(store, ui.records);
  }
  sound.end(won);
}

function logicalFromEvent(ev: PointerEvent): { x: number; y: number } {
  return toLogical(canvas.getBoundingClientRect(), layout.width, layout.height, ev.clientX, ev.clientY);
}

canvas.addEventListener('pointerdown', (ev) => {
  sound.unlock();
  const { x, y } = logicalFromEvent(ev);
  if (!ui.started) {
    if (ui.screen !== 'title') {
      const hit = hitTestMeta(layout, x, y);
      if (hit?.kind === 'back') ui.screen = 'title';
      else if (hit?.kind === 'upgrade' && ui.screen === 'meta') buyUpgrade(hit.index);
      return;
    }
    const hit = hitTestStart(layout, x, y);
    if (hit?.kind === 'difficulty') start(hit.id);
    else if (hit?.kind === 'mode') setMode(hit.id);
    else if (hit?.kind === 'hero') selectHero(hit.id);
    else if (hit?.kind === 'meta') ui.screen = 'meta';
    else if (hit?.kind === 'achievements') ui.screen = 'achievements';
    return;
  }
  if (state.status !== 'playing') {
    backToTitle();
    return;
  }
  if (state.choice) {
    const i = hitTestChoice(layout, x, y);
    if (i !== null) tryChoose(i);
    return;
  }
  if (ev.button === 2) {
    ui.aiming = false;
    return;
  }
  const hit = hitTest(layout, x, y);
  if (!hit) {
    if (ui.paused) return;
    const owned = hitTestOwned(ownedGroups(state), x, y);
    if (owned !== null) clickOwned(owned);
    else if (ui.aiming && onField({ x, y })) trySkill('meteor', { x, y });
    return;
  }
  if (hit.kind === 'pause') ui.paused = !ui.paused;
  else if (hit.kind === 'speed') ui.speed = ui.speed === 1 ? 2 : 1;
  else if (hit.kind === 'mute') toggleMute();
  else if (ui.paused) return;
  else if (hit.kind === 'card') tryBuy(hit.index);
  else if (hit.kind === 'reroll') tryReroll();
  else if (hit.kind === 'skill') {
    const skill = SKILLS[hit.index];
    // 메테오는 떨어뜨릴 곳을 한 번 더 누른다
    if (skill.id === 'meteor') ui.aiming = !ui.aiming;
    else trySkill(skill.id);
  }
});

canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

canvas.addEventListener('pointermove', (ev) => {
  const { x, y } = logicalFromEvent(ev);
  if (!ui.started) {
    if (ui.screen !== 'title') {
      const hit = hitTestMeta(layout, x, y);
      ui.hoverMeta = hit?.kind === 'upgrade' && ui.screen === 'meta' ? hit.index : null;
      ui.hoverStart = hit?.kind === 'back' ? 'back' : null;
      canvas.style.cursor = ui.hoverMeta !== null || ui.hoverStart ? 'pointer' : 'default';
      return;
    }
    const hit = hitTestStart(layout, x, y);
    if (hit?.kind === 'difficulty') ui.difficulty = hit.id;
    ui.hoverStart = !hit ? null : hit.kind === 'hero' || hit.kind === 'mode' ? `${hit.kind}:${hit.id}` : hit.kind;
    canvas.style.cursor = hit ? 'pointer' : 'default';
    return;
  }
  ui.pointer = { x, y };
  if (state.choice) {
    ui.hoverChoice = hitTestChoice(layout, x, y);
    canvas.style.cursor = ui.hoverChoice !== null ? 'pointer' : 'default';
    return;
  }
  const hit = hitTest(layout, x, y);
  ui.hover = hit?.kind === 'card' ? hit.index : null;
  ui.hoverButton = hit && hit.kind !== 'card' ? hit.kind : null;
  ui.hoverSkill = hit?.kind === 'skill' ? hit.index : null;
  const groups = ownedGroups(state);
  ui.hoverOwned = hit ? null : hitTestOwned(groups, x, y);
  const counts = weaponCounts(state);
  const chips = WEAPON_TYPES.filter((type) => counts[type] > 0).length;
  ui.hoverChip = hit || ui.hoverOwned !== null ? null : hitTestSetChip(chips, ownedTileCount(state, groups), x, y);
  canvas.style.cursor = hit || ui.hoverOwned !== null ? 'pointer' : ui.aiming ? 'crosshair' : 'default';
});

window.addEventListener('keydown', (ev) => {
  sound.unlock();
  if (ev.key === 'm' || ev.key === 'M') {
    toggleMute();
    return;
  }
  if (!ui.started) {
    ev.preventDefault();
    if (ui.screen !== 'title') {
      if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') ui.screen = 'title';
      return;
    }
    const idx = ['1', '2', '3'].indexOf(ev.key);
    if (idx >= 0) start(DIFFICULTY_IDS[idx]);
    else if (ev.key === 'Enter' || ev.key === ' ') start(ui.difficulty);
    else if (ev.key === 's' || ev.key === 'S') ui.screen = 'meta';
    else if (ev.key === 'a' || ev.key === 'A') ui.screen = 'achievements';
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      // 잠긴 탑은 건너뛴다
      const open = HEROES.filter((h) => heroUnlocked(ui.meta, h.id)).map((h) => h.id);
      const i = open.indexOf(ui.hero) + (ev.key === 'ArrowLeft' ? -1 : 1);
      selectHero(open[(i + open.length) % open.length]);
    } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      const i = DIFFICULTY_IDS.indexOf(ui.difficulty) + (ev.key === 'ArrowUp' ? -1 : 1);
      ui.difficulty = DIFFICULTY_IDS[Math.max(0, Math.min(DIFFICULTY_IDS.length - 1, i))];
    } else if (ev.key === 'Tab') {
      setMode(ui.mode === 'classic' ? 'endless' : 'classic');
    }
    return;
  }
  if (state.status !== 'playing') {
    if (ev.key === 'Enter' || ev.key === ' ') backToTitle();
    ev.preventDefault();
    return;
  }
  if (state.choice) {
    const i = ['1', '2', '3'].indexOf(ev.key);
    if (i >= 0) tryChoose(i);
    return;
  }
  if (ev.key === 'Escape') {
    ui.aiming = false;
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
  const skillId = SKILL_KEYS[ev.key.toLowerCase()];
  if (skillId) trySkill(skillId);
});

canvas.addEventListener('pointerleave', () => {
  ui.pointer = null;
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
  if (ui.tutorial && state.events.length) ui.tutorial = updateProgress(ui.tutorial, state.events);
  renderer.consume(state, nowMs / 1000);
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  renderer.draw(state, ui, nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
