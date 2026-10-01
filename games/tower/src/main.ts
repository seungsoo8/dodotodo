import type { DifficultyId, GameMode } from './core/config.ts';
import { buyItem, canBuy, chooseReward, createGame, giveUp, moveWeapon, reroll, rotateTower, selectFace, sellWeapon, step, type GameState } from './core/game.ts';
import { FACE_INFO, mainFace, type Face } from './core/faces.ts';
import type { OwnedWeapon } from './core/types.ts';
import { findSkill, useSkill } from './core/skills.ts';
import { HEROES, type HeroId } from './core/heroes.ts';
import { META_UPGRADES, buyMetaUpgrade, heroUnlocked, metaBonuses, suggestedDifficulty } from './core/meta.ts';
import { buildRunReport, finishRun } from './core/progress.ts';
import { endingCards, markSeen, prologueCards, storyPages } from './core/story.ts';
import { advanceCard, openCard } from './ui/storycard.ts';
import { afterSplash, splashCues, splashFrame, splashPress, type SplashCue } from './ui/splash.ts';
import type { AudioPanel } from './ui/layout.ts';
import { emptyBeatMemo, storyBeats } from './ui/storybeats.ts';
import { emptyProgress, updateProgress } from './ui/tutorial.ts';
import { setTier, weaponCounts } from './core/sets.ts';
import {
  aimableAt,
  computeLayout,
  fitScale,
  hitTest,
  hitTestAudio,
  hitTestChoice,
  hitTestLesson,
  hitTestMeta,
  hitTestPause,
  hitTestStart,
  hitTestStory,
  hitTestStoryCard,
  inside,
  sliderValue,
  toLogical,
  toMenu,
  toWorld,
  computeView,
  WORLD_W,
} from './ui/layout.ts';
import { LESSON_STEPS, advanceLesson, createLessonGame, lessonRunning, skipLesson, startLesson } from './ui/lesson.ts';
import { faceClick, hitTestFaces, sellButtonRect, weaponsOn } from './ui/faceslots.ts';
import {
  loadAudio,
  loadEndless,
  loadMeta,
  loadRecords,
  saveAudio,
  saveEndless,
  saveMeta,
  saveRecords,
  updateEndless,
  updateRecords,
  HERO_KEY,
  resetProgress,
  type AudioSettings,
  type StorageLike,
} from './ui/records.ts';
import { Renderer, type UiState } from './ui/render.ts';
import { Sound } from './ui/sound.ts';
import { musicMood } from './ui/audio/music.ts';
import { emptyFaceHits } from './ui/warnings.ts';
import { forecastVisible } from './ui/forecast.ts';
import { skyAt } from './ui/fx.ts';
import { CHOICE_INPUT_DELAY, END_INPUT_DELAY, inputReady, normalizeKey, shouldIgnoreKey } from './ui/input.ts';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;
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
const firstView = computeView(window.innerWidth, window.innerHeight);
let layout = computeLayout(firstView.width, firstView.height, state.config.shop.slots);
const renderer = new Renderer(ctx, layout);
const ui: UiState = {
  started: false,
  paused: false,
  speed: 1,
  hover: null,
  hoverButton: null,
  hoverSkill: null,
  hoverRotate: null,
  hoverFace: null,
  hoverFacePad: null,
  picked: null,
  hoverSell: false,
  hoverChoice: null,
  aiming: null,
  pointer: null,
  difficulty: 'normal',
  mode: 'classic',
  audio: loadAudio(store),
  audioOpen: false,
  records: loadRecords(store),
  endless: loadEndless(store),
  newBest: false,
  screen: 'splash',
  // 첫 화면은 한 번 눌러야 연출·음악이 시작된다 (브라우저가 누르기 전 소리를 막는다)
  splashAt: null,
  resetArmed: null,
  giveUpArmed: null,
  hero: 'guardian',
  meta: loadMeta(store),
  reward: null,
  tutorial: null,
  hoverStart: null,
  hoverMeta: null,
  infoOpen: false,
  lesson: null,
  hoverLesson: null,
  storyPage: 0,
  storyCard: null,
};
// 첫 판은 쉬움을 먼저 골라 둔다
ui.difficulty = suggestedDifficulty(ui.meta);
try {
  const saved = store.getItem(HERO_KEY) as HeroId | null;
  if (saved && HEROES.some((h) => h.id === saved) && heroUnlocked(ui.meta, saved)) ui.hero = saved;
} catch {
  // 저장된 탑이 없으면 수호탑
}
sound.setSettings(ui.audio);

let pixelScale = 1;
function resize(): void {
  // 화면 비율에 맞춰 게임 화면 크기(가로·세로 배치)를 다시 잡는다
  const view = computeView(window.innerWidth, window.innerHeight);
  if (view.width !== layout.width || view.height !== layout.height) {
    layout = computeLayout(view.width, view.height, state.config.shop.slots);
    renderer.setLayout(layout);
  }
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
  ui.lesson = null;
  state = createGame({ difficulty, mode: ui.mode, hero: ui.hero, meta: metaBonuses(ui.meta) });
  ui.started = true;
  ui.paused = false;
  ui.aiming = null;
  setPicked(null);
  ui.newBest = false;
  ui.reward = null;
  ui.infoOpen = false;
  // 튜토리얼에서 배운 것(사기·면 고르기·돌리기·스킬)은 다시 알려 주지 않는다
  ui.tutorial = ui.meta.tutorialDone ? null : ui.meta.lessonDone ? { bought: true, meteor: true, faced: true, rotated: true } : emptyProgress();
  // 처음 고른 탑이면 서장부터 (판은 카드를 닫을 때까지 멈춘다)
  beatMemo = emptyBeatMemo();
  ui.storyCard = openCard(prologueCards(ui.meta, ui.hero, ui.mode), nowSec());
  if (ui.storyCard) sound.ui('storyOpen');
}

/** 이번 판에서 수호자가 이미 한 말 */
let beatMemo = emptyBeatMemo();

/** 이야기 카드 넘기기 (끝나면 읽은 쪽으로 저장) */
function advanceStory(skip: boolean): void {
  const card = ui.storyCard;
  if (!card) return;
  const next = skip ? null : advanceCard(card, nowSec());
  if (next) {
    if (next.index !== card.index) sound.ui('page');
    ui.storyCard = next;
    return;
  }
  ui.storyCard = null;
  for (const p of card.pages) ui.meta = markSeen(ui.meta, p.id);
  saveMeta(store, ui.meta);
  sound.ui('page');
  // 결말을 닫자마자 누른 입력이 결과 화면을 넘기지 않게
  if (state.status !== 'playing') endOpenedAt = nowSec();
}

/** 이야기 책 열기: 안 읽은 쪽이 있으면 그 쪽부터 */
function openStoryBook(): void {
  const pages = storyPages(ui.meta);
  const unread = pages.findIndex((p) => p.unlocked && !p.seen);
  ui.screen = 'story';
  selectStoryPage(unread >= 0 ? unread : 0);
}

function selectStoryPage(i: number): void {
  const page = storyPages(ui.meta)[i];
  if (!page) return;
  ui.storyPage = i;
  if (page.unlocked && !page.seen) {
    ui.meta = markSeen(ui.meta, page.id);
    saveMeta(store, ui.meta);
  }
}

/** 이번 프레임에 누른 "다음" */
let lessonInput: 'next' | null = null;

/** 튜토리얼 판 (처음 켰을 때 타이틀 다음, 또는 ⚙ 에서 다시 하기). 끝나면 메뉴로 */
function beginLesson(): void {
  ui.audioOpen = false;
  ui.resetArmed = null;
  state = createLessonGame();
  ui.lesson = startLesson(state);
  ui.started = true;
  ui.paused = false;
  ui.aiming = null;
  setPicked(null);
  ui.reward = null;
  ui.infoOpen = false;
  ui.tutorial = null;
}

function finishLesson(): void {
  ui.lesson = null;
  lessonInput = null;
  if (!ui.meta.lessonDone) {
    ui.meta = { ...ui.meta, lessonDone: true };
    saveMeta(store, ui.meta);
  }
  // 첫 판은 쉬움을 골라 둔다
  ui.difficulty = suggestedDifficulty(ui.meta);
  backToTitle();
}

/** 타이틀 누름: 연출 중이면 끝으로 건너뛰고, 다 떴으면 (처음이면 튜토리얼, 아니면) 메뉴로 */
function pressSplash(): void {
  const press = splashPress(ui.splashAt === null ? null : nowSec() - ui.splashAt);
  if (press.kind === 'begin') {
    beginSplash();
    return;
  }
  if (press.kind === 'skip') {
    // 건너뛰면 쿵 소리 없이 등불 켜지는 소리만
    ui.splashAt = nowSec() - press.t;
    splashCueAt = press.t;
    sound.ui('splashLight');
    return;
  }
  sound.ui('start');
  if (afterSplash(ui.meta) === 'lesson') beginLesson();
  else ui.screen = 'title';
}

/** 타이틀 연출을 처음부터 (소리 신호도 처음부터) */
function beginSplash(): void {
  ui.screen = 'splash';
  ui.splashAt = nowSec();
  splashCueAt = -1;
}

/** 타이틀 연출에서 이미 소리를 낸 시점 */
let splashCueAt = -1;
const CUE_SOUND: Record<SplashCue, 'splashFall' | 'splashImpact' | 'splashLight'> = {
  fall: 'splashFall',
  impact: 'splashImpact',
  light: 'splashLight',
};

/** 타이틀 연출 시간에 맞춰 별 떨어짐·쿵·등불 소리 */
function splashSounds(): void {
  if (ui.started || ui.screen !== 'splash' || ui.splashAt === null) return;
  const t = nowSec() - ui.splashAt;
  for (const cue of splashCues(splashCueAt, t)) sound.ui(CUE_SOUND[cue]);
  splashCueAt = t;
}

/** 포기: 두 번 눌러야 한다. 그 자리에서 진 것으로 끝나고 결과 화면 */
function pressGiveUp(): void {
  if (ui.giveUpArmed === null || nowSec() - ui.giveUpArmed > RESET_CONFIRM) {
    ui.giveUpArmed = nowSec();
    sound.ui('warn');
    return;
  }
  ui.giveUpArmed = null;
  if (giveUp(state)) ui.paused = false;
}

/** 초기화를 한 번 누르고 이 시간(초) 안에 다시 눌러야 확정 */
const RESET_CONFIRM = 4;

/** 게임 초기화: 두 번 눌러야 한다. 진행을 모두 지우고 처음 켠 것처럼 타이틀부터 */
function pressReset(): void {
  if (ui.resetArmed === null || nowSec() - ui.resetArmed > RESET_CONFIRM) {
    ui.resetArmed = nowSec();
    sound.ui('warn');
    return;
  }
  resetProgress(store);
  ui.meta = loadMeta(store);
  ui.records = loadRecords(store);
  ui.endless = loadEndless(store);
  ui.hero = 'guardian';
  ui.mode = 'classic';
  ui.difficulty = suggestedDifficulty(ui.meta);
  ui.resetArmed = null;
  ui.audioOpen = false;
  ui.storyPage = 0;
  beginSplash();
  state = createGame({ difficulty: ui.difficulty, mode: ui.mode });
  sound.ui('reset');
}

/** 소리(설정) 창 누름 처리. 창이 받았으면 true */
/** x·y 는 그 창의 좌표 (메뉴 창은 메뉴 상자 기준), ox 는 화면 좌표와의 차이 */
function pressAudio(which: 'audio' | 'menuAudio', x: number, y: number, pointerId: number, ox = 0): boolean {
  const a = hitTestAudio(layout, x, y, which);
  if (a?.kind === 'sfx' || a?.kind === 'music') {
    audioDrag = { kind: a.kind, track: layout[which][a.kind], ox };
    setAudio({ ...ui.audio, [a.kind]: a.value }, false);
    canvas.setPointerCapture?.(pointerId);
  } else if (a?.kind === 'mute') toggleMute();
  else if (a?.kind === 'lesson') beginLesson();
  else if (a?.kind === 'reset') pressReset();
  return !!a;
}

function backToTitle(): void {
  ui.lesson = null;
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

/** 소리 설정을 바꾸고 바로 들려준 뒤 저장한다 */
function setAudio(next: AudioSettings, save = true): void {
  ui.audio = next;
  sound.setSettings(next);
  if (save) saveAudio(store, next);
}

function toggleMute(): void {
  setAudio({ ...ui.audio, muted: !ui.audio.muted });
}

/** 소리 창에서 끌고 있는 막대 */
let audioDrag: { kind: 'sfx' | 'music'; track: AudioPanel['sfx']; ox: number } | null = null;

function tryBuy(slot: number): void {
  const item = state.shop[slot];
  const face = state.face;
  const before = item?.kind === 'weapon' ? setTier(state.config, weaponCounts(state, face)[item.type]) : 0;
  if (buyItem(state, slot)) {
    sound.buy();
    if (ui.tutorial) ui.tutorial = { ...ui.tutorial, bought: true };
    renderer.onBuy(slot);
    if (item?.kind === 'weapon') {
      const after = setTier(state.config, weaponCounts(state, face)[item.type]);
      if (after > before) {
        renderer.onSetReached(state, item.type, after, face);
        sound.events([{ kind: 'round', round: state.round }], WORLD_W);
      }
    }
  } else if (item) {
    sound.denied();
    renderer.onDeny(slot);
    const check = canBuy(state, slot);
    if (!check.ok && check.reason === 'slots') renderer.info(`${FACE_INFO[state.face].label}쪽 면이 꽉 찼다`, '방향키·탑 옆 빈 칸으로 다른 면을 고르거나, 무기를 옮기거나 팔기');
  }
}

/** Q W E D → 스킬 칸 번호 */
const SLOT_KEYS: Record<string, number> = { q: 0, w: 1, e: 2, d: 3 };

function canAim(p: { x: number; y: number } | null): p is { x: number; y: number } {
  return !!p && aimableAt(layout, p);
}

/** 보상 카드·결과 화면이 뜬 시각 (뜨자마자 누른 입력이 잘못 먹히지 않게) */
let choiceOpenedAt: number | null = null;
let choiceSeen: GameState['choice'] = null;
let endOpenedAt: number | null = null;
function nowSec(): number {
  return performance.now() / 1000;
}

/** 스킬 사용. 떨어뜨리는 스킬은 마우스가 전장 위에 있으면 그곳에, 아니면 적이 가장 많은 곳에 */
/** at: 전장 좌표 */
function trySkill(id: string, at?: { x: number; y: number }): void {
  const target = at ?? (findSkill(id).aimed && canAim(ui.pointer) ? toWorld(layout, ui.pointer) : undefined);
  if (useSkill(state, id, target)) {
    sound.skill(id, target?.x, WORLD_W);
    ui.aiming = null;
  } else sound.denied();
}

/** 칸 번호로 스킬 사용 */
function trySlot(slot: number, fromButton: boolean): void {
  const owned = state.skills[slot];
  if (!owned) {
    sound.denied();
    return;
  }
  // 버튼으로 누른 떨어뜨리는 스킬은 한 번 더 눌러 자리를 고른다
  if (fromButton && findSkill(owned.id).aimed) ui.aiming = ui.aiming === owned.id ? null : owned.id;
  else trySkill(owned.id);
}

/** 산 무기가 붙을 면 고르기 */
function chooseFace(face: Face): void {
  if (state.face !== face) sound.tick();
  selectFace(state, face);
  if (ui.tutorial) ui.tutorial = { ...ui.tutorial, faced: true };
}

/** 집은 무기 (번호는 사고팔 때마다 바뀌니 무기 자체를 기억한다) */
let pickedWeapon: OwnedWeapon | null = null;
function setPicked(index: number | null): void {
  pickedWeapon = index === null ? null : (state.weapons[index] ?? null);
  ui.picked = pickedWeapon ? index : null;
}

/** 집은 무기의 지금 번호를 맞춘다 (팔리거나 합쳐져 없어졌으면 놓는다) */
function syncPicked(): void {
  const i = pickedWeapon ? state.weapons.indexOf(pickedWeapon) : -1;
  if (i < 0) pickedWeapon = null;
  ui.picked = i >= 0 ? i : null;
}

function pickedValid(): boolean {
  syncPicked();
  return ui.picked !== null;
}

/** 탑 둘레 칸을 눌렀다 */
function clickFace(hit: { face: Face; slot: number }): void {
  const action = faceClick(state, pickedValid() ? ui.picked : null, hit);
  switch (action.kind) {
    case 'select':
      setPicked(null);
      chooseFace(action.face);
      break;
    case 'pick':
      setPicked(action.index);
      chooseFace(action.face);
      break;
    case 'cancel':
      setPicked(null);
      break;
    case 'move':
      if (moveWeapon(state, action.index, action.face)) {
        setPicked(null);
        chooseFace(action.face);
      } else {
        sound.denied();
        renderer.info(`${FACE_INFO[action.face].label}쪽 면이 꽉 찼다`, '그 면 무기를 먼저 옮기거나 팔기');
      }
      break;
  }
}

/** 집은 무기의 판매 버튼 자리 */
function sellRect(): ReturnType<typeof sellButtonRect> | null {
  if (!pickedValid()) return null;
  const w = state.weapons[ui.picked!];
  return sellButtonRect(state.tower, w.face, weaponsOn(state, w.face).indexOf(ui.picked!), state.config.tower.faceSlots);
}

function trySell(): void {
  if (!pickedValid()) return;
  if (sellWeapon(state, ui.picked!) > 0) sound.sell();
  setPicked(null);
  ui.hoverSell = false;
}

/** 방향키 → 면 */
const ARROW_FACES: Record<string, Face> = { ArrowUp: 'n', ArrowRight: 'e', ArrowDown: 's', ArrowLeft: 'w' };

function tryChoose(index: number): void {
  if (chooseReward(state, index)) sound.perk();
}

/** 탑 돌리기 (집은 무기는 놓는다: 칸 자리가 바뀌니까) */
function tryRotate(dir: 1 | -1): void {
  if (rotateTower(state, dir)) {
    setPicked(null);
    sound.rotate();
  } else sound.denied();
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
  if (recorded || !ui.started || ui.lesson) return;
  recorded = true;
  const won = state.status === 'won';
  const before = ui.meta;
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
  if (state.gaveUp) sound.ui('giveUp');
  else sound.end(won);
  // 그 탑으로 처음 이겼으면 결말 (다섯 탑 모두면 마지막 이야기까지)
  if (won && state.hero) ui.storyCard = openCard(endingCards(before, ui.meta, state.hero), nowSec());
  if (ui.storyCard) sound.ui('storyOpen');
}

function logicalFromEvent(ev: PointerEvent): { x: number; y: number } {
  return toLogical(canvas.getBoundingClientRect(), layout.width, layout.height, ev.clientX, ev.clientY);
}

canvas.addEventListener('pointerdown', (ev) => {
  sound.unlock();
  const p = logicalFromEvent(ev);
  const touch = ev.pointerType !== 'mouse';
  // 손가락: 판 위 버튼·칸은 뗄 때 누른 것으로 치고, 길게 누르면 설명만 보여 준다
  if (touch && ev.button === 0 && deferTouch(p)) {
    startLongPress(p);
    return;
  }
  press(p.x, p.y, ev.button, touch, ev.pointerId);
});

/** 누르기 (x·y: 화면 좌표) */
function press(x: number, y: number, button: number, touch: boolean, pointerId: number): void {
  // 가운데·옆 버튼은 오른쪽 클릭(조준 취소) 말고는 무시
  if (button !== 0 && button !== 2) return;
  if (button === 2 && !(ui.started && state.status === 'playing')) return;
  if (!ui.started) {
    if (ui.screen === 'splash') {
      if (button === 0) pressSplash();
      return;
    }
    // 메뉴 칸은 메뉴 상자 기준
    const m = toMenu(layout, { x, y });
    if (ui.screen === 'story') {
      const hit = hitTestStory(layout, m.x, m.y);
      if (hit?.kind === 'back') ui.screen = 'title';
      else if (hit?.kind === 'page') {
        selectStoryPage(hit.index);
        sound.tick();
      }
      return;
    }
    if (ui.screen !== 'title') {
      const hit = hitTestMeta(layout, m.x, m.y);
      if (hit?.kind === 'back') ui.screen = 'title';
      else if (hit?.kind === 'upgrade' && ui.screen === 'meta') buyUpgrade(hit.index);
      return;
    }
    if (ui.audioOpen) {
      if (button === 0 && pressAudio('menuAudio', m.x, m.y, pointerId, layout.menu.x)) return;
      // 창 밖을 누르면 닫기만 한다 (⚙ 는 아래에서 다시 여닫는다)
      if (hitTestStart(layout, m.x, m.y)?.kind !== 'settings') {
        ui.audioOpen = false;
        ui.resetArmed = null;
        return;
      }
    }
    const hit = hitTestStart(layout, m.x, m.y);
    if (hit?.kind === 'settings') {
      ui.audioOpen = !ui.audioOpen;
      ui.resetArmed = null;
      sound.tick();
    } else if (hit?.kind === 'difficulty') start(hit.id);
    else if (hit?.kind === 'mode') setMode(hit.id);
    else if (hit?.kind === 'hero') selectHero(hit.id);
    else if (hit?.kind === 'meta') ui.screen = 'meta';
    else if (hit?.kind === 'achievements') ui.screen = 'achievements';
    else if (hit?.kind === 'story') openStoryBook();
    return;
  }
  ui.pointer = { x, y };
  if (ui.storyCard) {
    if (button === 0) advanceStory(hitTestStoryCard(layout, x, y) === 'skip');
    return;
  }
  if (ui.audioOpen && button === 0) {
    if (pressAudio('audio', x, y, pointerId)) return;
    // 창 밖을 누르면 닫는다 (♪ 버튼은 아래에서 다시 여닫는다)
    if (hitTest(layout, x, y)?.kind !== 'mute') ui.audioOpen = false;
  }
  if (ui.lesson) {
    const l = hitTestLesson(layout, x, y);
    if (l === 'skip') {
      ui.lesson = skipLesson(ui.lesson);
      finishLesson();
      return;
    }
    if (l === 'next') lessonInput = 'next';
    if (l) return;
  }
  if (state.status !== 'playing') {
    if (inputReady(endOpenedAt, nowSec(), END_INPUT_DELAY)) backToTitle();
    return;
  }
  if (state.choice) {
    if (button !== 0 || !inputReady(choiceOpenedAt, nowSec(), CHOICE_INPUT_DELAY)) return;
    const i = hitTestChoice(layout, x, y);
    ui.hoverChoice = i;
    if (i !== null) tryChoose(i);
    return;
  }
  if (button === 2) {
    ui.aiming = null;
    setPicked(null);
    return;
  }
  // 일시정지 창: 계속하기 · 포기하기
  if (ui.paused && !ui.audioOpen) {
    const p = hitTestPause(layout, x, y);
    if (p === 'resume') {
      ui.paused = false;
      return;
    }
    if (p === 'giveUp' && !ui.lesson) {
      pressGiveUp();
      return;
    }
    if (p) return;
  }
  const hit = hitTest(layout, x, y);
  if (hit?.kind !== 'info') ui.infoOpen = false;
  if (!hit) {
    if (ui.paused) return;
    const w = toWorld(layout, { x, y });
    // 조준 중이면 전장을 누른 것이 먼저
    if (ui.aiming && canAim({ x, y })) {
      trySkill(ui.aiming, w);
      return;
    }
    const sell = sellRect();
    if (sell && inside(sell, w.x, w.y, 2)) {
      trySell();
      return;
    }
    const face = hitTestFaces(state.tower, state.config.tower.faceSlots, w.x, w.y);
    if (face) clickFace(face);
    else setPicked(null);
    return;
  }
  if (hit.kind === 'info') ui.infoOpen = touch ? !ui.infoOpen : false;
  else if (hit.kind === 'pause') ui.paused = !ui.paused;
  else if (hit.kind === 'speed') ui.speed = ui.speed === 1 ? 2 : 1;
  else if (hit.kind === 'mute') ui.audioOpen = !ui.audioOpen;
  else if (ui.paused) return;
  else if (hit.kind === 'card') tryBuy(hit.index);
  else if (hit.kind === 'reroll') tryReroll();
  else if (hit.kind === 'skill') trySlot(hit.index, true);
  else if (hit.kind === 'rotate') tryRotate(hit.dir);
  else if (hit.kind === 'face') pressFace(hit.face);
}

/** 면 고르기 (방향키·면 버튼): 무기를 집고 있으면 그 면으로 옮기기 */
function pressFace(face: Face): void {
  if (pickedValid()) clickFace({ face, slot: weaponsOn(state, face).length });
  else {
    setPicked(null);
    chooseFace(face);
  }
}

// ───────── 손가락: 길게 누르면 설명 ─────────

/** 이만큼(초) 누르고 있으면 길게 누른 것 */
const LONG_PRESS = 0.45;
/** 이만큼(논리 픽셀) 움직이면 누르기를 취소 */
const TOUCH_SLOP = 12;
let touchHold: { x: number; y: number; timer: number; long: boolean } | null = null;

/** 판 위 버튼·탑 칸을 손가락으로 눌렀는가 (뗄 때 처리) */
function deferTouch(p: { x: number; y: number }): boolean {
  if (!ui.started || state.status !== 'playing' || state.choice || ui.storyCard || ui.paused || ui.audioOpen || ui.aiming) return false;
  const hit = hitTest(layout, p.x, p.y);
  if (hit) return hit.kind === 'card' || hit.kind === 'skill' || hit.kind === 'rotate' || hit.kind === 'reroll' || hit.kind === 'face';
  const w = toWorld(layout, p);
  return !!hitTestFaces(state.tower, state.config.tower.faceSlots, w.x, w.y);
}

function startLongPress(p: { x: number; y: number }): void {
  cancelLongPress();
  const hold = { x: p.x, y: p.y, long: false, timer: 0 };
  hold.timer = window.setTimeout(() => {
    hold.long = true;
    hoverAt(hold.x, hold.y);
  }, LONG_PRESS * 1000);
  touchHold = hold;
}

function cancelLongPress(): void {
  if (!touchHold) return;
  window.clearTimeout(touchHold.timer);
  if (touchHold.long) clearHover();
  touchHold = null;
}

function clearHover(): void {
  ui.hover = null;
  ui.hoverButton = null;
  ui.hoverSkill = null;
  ui.hoverRotate = null;
  ui.hoverFace = null;
  ui.hoverFacePad = null;
  ui.hoverSell = false;
}

canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

canvas.addEventListener('pointerup', (ev) => {
  if (audioDrag) {
    audioDrag = null;
    saveAudio(store, ui.audio);
    return;
  }
  const hold = touchHold;
  if (hold) {
    // 짧게 눌렀으면 그제야 누른 것으로, 길게 눌렀으면 설명만 닫는다
    touchHold = null;
    window.clearTimeout(hold.timer);
    if (hold.long) clearHover();
    else press(hold.x, hold.y, 0, true, ev.pointerId);
    return;
  }
  if (ev.pointerType !== 'mouse') clearHover();
});

canvas.addEventListener('pointercancel', () => cancelLongPress());

canvas.addEventListener('pointermove', (ev) => {
  if (audioDrag) {
    const { x } = logicalFromEvent(ev);
    setAudio({ ...ui.audio, [audioDrag.kind]: sliderValue(audioDrag.track, x - audioDrag.ox) }, false);
    return;
  }
  const { x, y } = logicalFromEvent(ev);
  if (touchHold) {
    if (Math.hypot(x - touchHold.x, y - touchHold.y) > TOUCH_SLOP) cancelLongPress();
    return;
  }
  if (!ui.started) {
    if (ui.screen === 'splash') {
      canvas.style.cursor = 'pointer';
      return;
    }
    const m = toMenu(layout, { x, y });
    if (ui.screen === 'story') {
      const hit = hitTestStory(layout, m.x, m.y);
      ui.hoverStart = !hit ? null : hit.kind === 'page' ? `page:${hit.index}` : 'back';
      canvas.style.cursor = hit ? 'pointer' : 'default';
      return;
    }
    if (ui.screen !== 'title') {
      const hit = hitTestMeta(layout, m.x, m.y);
      ui.hoverMeta = hit?.kind === 'upgrade' && ui.screen === 'meta' ? hit.index : null;
      ui.hoverStart = hit?.kind === 'back' ? 'back' : null;
      canvas.style.cursor = ui.hoverMeta !== null || ui.hoverStart ? 'pointer' : 'default';
      return;
    }
    const a = ui.audioOpen ? hitTestAudio(layout, m.x, m.y, 'menuAudio') : null;
    if (a) {
      ui.hoverStart = a.kind === 'lesson' || a.kind === 'reset' ? `set:${a.kind}` : null;
      canvas.style.cursor = a.kind === 'panel' ? 'default' : 'pointer';
      return;
    }
    const hit = hitTestStart(layout, m.x, m.y);
    ui.hoverStart = !hit ? null : hit.kind === 'hero' || hit.kind === 'mode' ? `${hit.kind}:${hit.id}` : hit.kind;
    canvas.style.cursor = hit ? 'pointer' : 'default';
    return;
  }
  ui.pointer = { x, y };
  hoverAt(x, y);
});

/** 판 화면에서 마우스(길게 누른 손가락)가 올라간 것 (x·y: 화면 좌표) */
function hoverAt(x: number, y: number): void {
  if (state.choice) {
    ui.hoverChoice = hitTestChoice(layout, x, y);
    canvas.style.cursor = ui.hoverChoice !== null ? 'pointer' : 'default';
    return;
  }
  ui.hoverLesson = null;
  if (ui.lesson) {
    const l = hitTestLesson(layout, x, y);
    if (l === 'next' || l === 'skip') ui.hoverLesson = l;
    if (l) {
      canvas.style.cursor = l === 'panel' ? 'default' : 'pointer';
      return;
    }
  }
  if (ui.paused) {
    const p = hitTestPause(layout, x, y);
    ui.hoverStart = p === 'resume' || p === 'giveUp' ? `pause:${p}` : null;
  }
  const hit = hitTest(layout, x, y);
  ui.hover = hit?.kind === 'card' ? hit.index : null;
  ui.hoverButton = hit && hit.kind !== 'card' ? hit.kind : null;
  ui.hoverSkill = hit?.kind === 'skill' ? hit.index : null;
  ui.hoverRotate = hit?.kind === 'rotate' ? hit.dir : null;
  ui.hoverFacePad = hit?.kind === 'face' ? hit.face : null;
  const w = toWorld(layout, { x, y });
  const sell = sellRect();
  ui.hoverSell = !hit && !!sell && inside(sell, w.x, w.y, 2);
  ui.hoverFace = hit || ui.hoverSell || ui.aiming ? null : hitTestFaces(state.tower, state.config.tower.faceSlots, w.x, w.y);
  canvas.style.cursor = hit || ui.hoverFace || ui.hoverSell ? 'pointer' : ui.aiming ? 'crosshair' : 'default';
}

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
    if (ui.screen === 'splash') {
      pressSplash();
      return;
    }
    if (ui.audioOpen && key === 'Escape') {
      ui.audioOpen = false;
      ui.resetArmed = null;
      return;
    }
    if (ui.screen === 'story' && (key === 'ArrowUp' || key === 'ArrowDown')) {
      const n = storyPages(ui.meta).length;
      selectStoryPage((ui.storyPage + (key === 'ArrowUp' ? -1 : 1) + n) % n);
      return;
    }
    if (ui.screen !== 'title') {
      if (key === 'Escape' || key === 'Enter' || key === ' ') ui.screen = 'title';
      return;
    }
    const idx = ['1', '2', '3'].indexOf(key);
    if (idx >= 0) start(DIFFICULTY_IDS[idx]);
    else if (key === 'Enter' || key === ' ') start(ui.difficulty);
    else if (key === 's') ui.screen = 'meta';
    else if (key === 'a') ui.screen = 'achievements';
    else if (key === 't') openStoryBook();
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
  if (ui.storyCard) {
    if (key === 'Enter' || key === ' ') advanceStory(false);
    else if (key === 'Escape') advanceStory(true);
    return;
  }
  if (state.status !== 'playing') {
    if ((key === 'Enter' || key === ' ') && inputReady(endOpenedAt, nowSec(), END_INPUT_DELAY)) backToTitle();
    return;
  }
  if (state.choice) {
    const i = ['1', '2', '3'].indexOf(key);
    if (i >= 0 && inputReady(choiceOpenedAt, nowSec(), CHOICE_INPUT_DELAY)) tryChoose(i);
    return;
  }
  // 튜토리얼: Enter · Space 는 "다음"
  if (ui.lesson && (key === 'Enter' || key === ' ') && LESSON_STEPS[ui.lesson.step].next) {
    lessonInput = 'next';
    return;
  }
  if (key === 'Escape') {
    ui.aiming = null;
    setPicked(null);
    ui.infoOpen = false;
    return;
  }
  if (key === ' ') {
    ui.paused = !ui.paused;
    return;
  }
  if (key === 'f') ui.speed = ui.speed === 1 ? 2 : 1;
  if (ui.paused) return;
  // 방향키: 면 고르기 (무기를 집고 있으면 그 면으로 옮기기)
  const arrowFace = ARROW_FACES[key];
  if (arrowFace) {
    pressFace(arrowFace);
    return;
  }
  if (key >= '1' && key <= '9' && key.length === 1) tryBuy(Number(key) - 1);
  if (key === 'r') tryReroll();
  if (key === 'z') tryRotate(-1);
  if (key === 'x') tryRotate(1);
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

// 휴대폰을 돌리면 (세로 ↔ 가로) 배치를 다시 잡는다
window.addEventListener('orientationchange', () => window.setTimeout(resize, 100));

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

/** 다음 라운드 예고가 떠 있었는가 (새로 뜬 순간에만 알림) */
let forecastShown = false;

/** 판 상황에 맞춰 배경음악과 심장 박동을 고른다 */
function updateMusic(): void {
  const c = state.config;
  const playing = ui.started && !ui.lesson && state.status === 'playing';
  const mood = musicMood({
    started: ui.started,
    lesson: !!ui.lesson,
    status: state.status,
    bossAlive: state.enemies.some((e) => e.isBoss && e.hp > 0),
    night: playing ? skyAt({ round: state.round, roundTime: state.roundTime, roundSeconds: c.roundSeconds, totalRounds: c.totalRounds, mode: state.mode }).night : 0,
    enemies: state.enemies.filter((e) => e.hp > 0).length,
    splash: ui.screen === 'splash' && ui.splashAt !== null ? (splashFrame(nowSec() - ui.splashAt).logo > 0 ? 'lit' : 'dark') : undefined,
  });
  sound.update(mood.track, mood.level, playing ? state.tower.hp / state.tower.maxHp : null);
}

let last = performance.now();
let acc = 0;
function frame(nowMs: number): void {
  const dt = Math.min(MAX_FRAME, (nowMs - last) / 1000);
  last = nowMs;
  const lessonPaused = (!!ui.lesson && !lessonRunning(ui.lesson)) || !!ui.storyCard;
  if (ui.started && !ui.paused && !lessonPaused && state.status === 'playing') {
    acc += dt * ui.speed;
    while (acc >= STEP) {
      step(state, STEP);
      acc -= STEP;
    }
  } else acc = 0;

  recordIfFinished();
  trackOverlays();
  // 초기화·포기 확인은 잠깐만 유효하다 (포기는 일시정지를 풀면 취소)
  if (ui.resetArmed !== null && nowSec() - ui.resetArmed > RESET_CONFIRM) ui.resetArmed = null;
  if (ui.giveUpArmed !== null && (!ui.paused || nowSec() - ui.giveUpArmed > RESET_CONFIRM)) ui.giveUpArmed = null;
  splashSounds();
  // 이번 프레임의 이벤트는 여기서 한 번 꺼내 소리·안내·연출에 나눠 준다
  const events = state.events.splice(0);
  if (ui.started) {
    sound.events(events, WORLD_W);
    for (const f of emptyFaceHits(state, events)) sound.emptyFace(f);
    const fc = forecastVisible(state);
    if (fc && !forecastShown) sound.forecast(mainFace(state.nextPlan));
    forecastShown = fc;
  }
  if (ui.tutorial && events.length) ui.tutorial = updateProgress(ui.tutorial, events);
  if (ui.lesson) {
    const before = ui.lesson.step;
    ui.lesson = advanceLesson(ui.lesson, state, events, lessonInput);
    if (ui.lesson.step !== before || ui.lesson.finished) sound.lessonStep();
    lessonInput = null;
    if (ui.lesson.finished) finishLesson();
  }
  updateMusic();
  renderer.consume(state, events, nowMs / 1000);
  // 말풍선은 연출 시계(consume)가 이 판에 맞춰진 뒤에
  if (ui.started && !ui.lesson && !ui.storyCard && state.status === 'playing') {
    const said = storyBeats(state, events, beatMemo);
    beatMemo = said.memo;
    for (const b of said.beats) {
      renderer.say(b);
      sound.ui('speech');
    }
  }
  syncPicked();
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  renderer.draw(state, ui, nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
