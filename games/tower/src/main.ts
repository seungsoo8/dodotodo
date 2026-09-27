import type { DifficultyId, GameMode } from './core/config.ts';
import { buyItem, canBuy, choosePerk, createGame, reroll, sellWeapon, step, type GameState } from './core/game.ts';
import { evolveSkill, findSkill, fuseSkills, learnSkill, useSkill } from './core/skills.ts';
import { HEROES, type HeroId } from './core/heroes.ts';
import { META_UPGRADES, buyMetaUpgrade, heroUnlocked, metaBonuses } from './core/meta.ts';
import { buildRunReport, finishRun } from './core/progress.ts';
import { emptyProgress, updateProgress } from './ui/tutorial.ts';
import { WEAPON_TYPES, setTier, weaponCounts } from './core/sets.ts';
import { aimableAt, computeLayout, fitScale, hitTest, hitTestChoice, hitTestMeta, hitTestStart, hitTestTree, toLogical } from './ui/layout.ts';
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
import { CHOICE_INPUT_DELAY, END_INPUT_DELAY, inputReady, normalizeKey, shouldIgnoreKey, touchConfirm } from './ui/input.ts';

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
  aiming: null,
  treeOpen: false,
  hoverTree: null,
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
  portrait: false,
  infoOpen: false,
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
  ui.aiming = null;
  ui.sellArmed = null;
  ui.newBest = false;
  ui.reward = null;
  ui.treeOpen = false;
  ui.infoOpen = false;
  pendingTap = null;
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

/** Q W E D → 스킬 칸 번호 */
const SLOT_KEYS: Record<string, number> = { q: 0, w: 1, e: 2, d: 3 };

function canAim(p: { x: number; y: number } | null): p is { x: number; y: number } {
  return !!p && aimableAt(layout, p);
}

/** 터치로 처음 누른 칸 (한 번 더 누르면 확정) */
let pendingTap: string | null = null;

/** 보상 카드·결과 화면이 뜬 시각 (뜨자마자 누른 입력이 잘못 먹히지 않게) */
let choiceOpenedAt: number | null = null;
let choiceSeen: GameState['choice'] = null;
let endOpenedAt: number | null = null;
function nowSec(): number {
  return performance.now() / 1000;
}

/** 스킬 사용. 떨어뜨리는 스킬은 마우스가 전장 위에 있으면 그곳에, 아니면 적이 가장 많은 곳에 */
function trySkill(id: string, at?: { x: number; y: number }): void {
  const target = at ?? (findSkill(id).aimed && canAim(ui.pointer) ? ui.pointer : undefined);
  if (useSkill(state, id, target)) {
    sound.skill(id);
    ui.aiming = null;
  } else sound.denied();
}

/** 칸 번호로 스킬 사용 (빈 칸이면 트리를 연다) */
function trySlot(slot: number, fromButton: boolean): void {
  const owned = state.skills[slot];
  if (!owned) {
    if (state.skillPoints > 0) toggleTree(true);
    else sound.denied();
    return;
  }
  // 버튼으로 누른 떨어뜨리는 스킬은 한 번 더 눌러 자리를 고른다
  if (fromButton && findSkill(owned.id).aimed) ui.aiming = ui.aiming === owned.id ? null : owned.id;
  else trySkill(owned.id);
}

function toggleTree(open = !ui.treeOpen): void {
  if (state.choice || state.status !== 'playing') return;
  ui.treeOpen = open;
  ui.aiming = null;
  ui.hoverTree = null;
  pendingTap = null;
}

/** 스킬 트리에서 누른 칸: 배우기·진화·합체 */
function tryTree(kind: 'learn' | 'evolve' | 'fuse', id: string): void {
  const ok = kind === 'learn' ? learnSkill(state, id) : kind === 'evolve' ? evolveSkill(state, id) : fuseSkills(state, id);
  if (ok) sound.upgrade();
  else sound.denied();
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
  const touch = ev.pointerType !== 'mouse';
  // 가운데·옆 버튼은 오른쪽 클릭(조준 취소) 말고는 무시
  if (ev.button !== 0 && ev.button !== 2) return;
  if (ev.button === 2 && !(ui.started && state.status === 'playing')) return;
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
  ui.pointer = { x, y };
  if (state.status !== 'playing') {
    if (inputReady(endOpenedAt, nowSec(), END_INPUT_DELAY)) backToTitle();
    return;
  }
  if (state.choice) {
    if (ev.button !== 0 || !inputReady(choiceOpenedAt, nowSec(), CHOICE_INPUT_DELAY)) return;
    const i = hitTestChoice(layout, x, y);
    ui.hoverChoice = i;
    if (i !== null) tryChoose(i);
    return;
  }
  if (ui.treeOpen) {
    if (ev.button !== 0) return;
    const t = hitTestTree(layout, x, y);
    ui.hoverTree = t;
    if (t?.kind === 'close') toggleTree(false);
    else if (t) {
      // 터치는 설명을 볼 수 없으니 첫 번째는 보기, 한 번 더 누르면 확정
      const tap = touch ? touchConfirm(pendingTap, `${t.kind}:${t.id}`) : { confirm: true, next: null };
      pendingTap = tap.next;
      if (tap.confirm) tryTree(t.kind, t.id);
    } else pendingTap = null;
    return;
  }
  if (ev.button === 2) {
    ui.aiming = null;
    return;
  }
  const hit = hitTest(layout, x, y);
  if (hit?.kind !== 'info') ui.infoOpen = false;
  if (!hit) {
    if (ui.paused) return;
    // 조준 중이면 전장을 누른 것이 먼저 (무기 칸 근처라도 겹치지 않게 aimableAt 이 막아 준다)
    if (ui.aiming && canAim({ x, y })) {
      trySkill(ui.aiming, { x, y });
      return;
    }
    const owned = hitTestOwned(ownedGroups(state), x, y);
    if (owned !== null) clickOwned(owned);
    return;
  }
  if (hit.kind === 'info') ui.infoOpen = touch ? !ui.infoOpen : false;
  else if (hit.kind === 'pause') ui.paused = !ui.paused;
  else if (hit.kind === 'speed') ui.speed = ui.speed === 1 ? 2 : 1;
  else if (hit.kind === 'mute') toggleMute();
  else if (ui.paused) return;
  else if (hit.kind === 'card') tryBuy(hit.index);
  else if (hit.kind === 'reroll') tryReroll();
  else if (hit.kind === 'skill') trySlot(hit.index, true);
  else if (hit.kind === 'tree') toggleTree();
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
  if (ui.treeOpen) {
    ui.hoverTree = hitTestTree(layout, x, y);
    canvas.style.cursor = ui.hoverTree ? 'pointer' : 'default';
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

const GAME_KEYS = new Set([' ', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

window.addEventListener('keydown', (ev) => {
  // 한글 입력 상태에서도 같은 자리의 키로 읽는다 (ㅂ → q)
  const key = normalizeKey(ev.code, ev.key);
  if (shouldIgnoreKey(ev)) {
    // 누르고 있는 키의 반복은 스크롤만 막고, Ctrl·Cmd 조합(새로고침 등)은 브라우저에 맡긴다
    if (ev.repeat && GAME_KEYS.has(key)) ev.preventDefault();
    return;
  }
  sound.unlock();
  if (key === 'm') {
    toggleMute();
    return;
  }
  if (!ui.started) {
    if (GAME_KEYS.has(key)) ev.preventDefault();
    if (ui.screen !== 'title') {
      if (key === 'Escape' || key === 'Enter' || key === ' ') ui.screen = 'title';
      return;
    }
    const idx = ['1', '2', '3'].indexOf(key);
    if (idx >= 0) start(DIFFICULTY_IDS[idx]);
    else if (key === 'Enter' || key === ' ') start(ui.difficulty);
    else if (key === 's') ui.screen = 'meta';
    else if (key === 'a') ui.screen = 'achievements';
    else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      // 잠긴 탑은 건너뛴다
      const open = HEROES.filter((h) => heroUnlocked(ui.meta, h.id)).map((h) => h.id);
      const i = open.indexOf(ui.hero) + (key === 'ArrowLeft' ? -1 : 1);
      selectHero(open[(i + open.length) % open.length]);
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      const i = DIFFICULTY_IDS.indexOf(ui.difficulty) + (key === 'ArrowUp' ? -1 : 1);
      ui.difficulty = DIFFICULTY_IDS[Math.max(0, Math.min(DIFFICULTY_IDS.length - 1, i))];
    } else if (key === 'Tab') {
      setMode(ui.mode === 'classic' ? 'endless' : 'classic');
    }
    return;
  }
  if (GAME_KEYS.has(key)) ev.preventDefault();
  if (state.status !== 'playing') {
    if ((key === 'Enter' || key === ' ') && inputReady(endOpenedAt, nowSec(), END_INPUT_DELAY)) backToTitle();
    return;
  }
  if (state.choice) {
    const i = ['1', '2', '3'].indexOf(key);
    if (i >= 0 && inputReady(choiceOpenedAt, nowSec(), CHOICE_INPUT_DELAY)) tryChoose(i);
    return;
  }
  if (key === 't') {
    toggleTree();
    return;
  }
  if (ui.treeOpen) {
    if (key === 'Escape') toggleTree(false);
    return;
  }
  if (key === 'Escape') {
    ui.aiming = null;
    ui.infoOpen = false;
    return;
  }
  if (key === ' ') {
    ui.paused = !ui.paused;
    return;
  }
  if (key === 'f') ui.speed = ui.speed === 1 ? 2 : 1;
  if (ui.paused) return;
  if (key >= '1' && key <= '9' && key.length === 1) tryBuy(Number(key) - 1);
  if (key === 'r') tryReroll();
  const slot = SLOT_KEYS[key];
  if (slot !== undefined) trySlot(slot, false);
});

canvas.addEventListener('pointerleave', () => {
  ui.pointer = null;
});

// 창을 떠나면 자동으로 멈춘다
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ui.started && state.status === 'playing') ui.paused = true;
});

// 휴대폰을 세로로 들면 멈추고 가로로 돌리라고 알려 준다
const portraitQuery = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
function onOrientation(): void {
  ui.portrait = portraitQuery.matches;
  if (ui.portrait && ui.started && state.status === 'playing') ui.paused = true;
}
portraitQuery.addEventListener('change', onOrientation);
onOrientation();

/** 보상 카드·결과 화면이 새로 뜬 순간을 기억한다 */
function trackOverlays(): void {
  if (state.choice !== choiceSeen) {
    choiceSeen = state.choice;
    choiceOpenedAt = state.choice ? nowSec() : null;
    ui.hoverChoice = null;
  }
  if (state.status === 'playing') endOpenedAt = null;
  else if (endOpenedAt === null) endOpenedAt = nowSec();
}

let last = performance.now();
let acc = 0;
function frame(nowMs: number): void {
  const dt = Math.min(MAX_FRAME, (nowMs - last) / 1000);
  last = nowMs;
  if (ui.started && !ui.paused && !ui.treeOpen && state.status === 'playing') {
    acc += dt * ui.speed;
    while (acc >= STEP) {
      step(state, STEP);
      acc -= STEP;
    }
  } else acc = 0;

  recordIfFinished();
  trackOverlays();
  // 이번 프레임의 이벤트는 여기서 한 번 꺼내 소리·안내·연출에 나눠 준다
  const events = state.events.splice(0);
  if (ui.started) for (const ev of events) sound.event(ev);
  if (ui.tutorial && events.length) ui.tutorial = updateProgress(ui.tutorial, events);
  renderer.consume(state, events, nowMs / 1000);
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  renderer.draw(state, ui, nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
