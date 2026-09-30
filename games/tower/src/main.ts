import type { DifficultyId, GameMode } from './core/config.ts';
import { buyItem, canBuy, chooseReward, createGame, moveWeapon, reroll, rotateTower, selectFace, sellWeapon, step, type GameState } from './core/game.ts';
import { FACE_INFO, mainFace, type Face } from './core/faces.ts';
import type { OwnedWeapon } from './core/types.ts';
import { findSkill, useSkill } from './core/skills.ts';
import { HEROES, type HeroId } from './core/heroes.ts';
import { META_UPGRADES, buyMetaUpgrade, heroUnlocked, metaBonuses, suggestedDifficulty } from './core/meta.ts';
import { buildRunReport, finishRun } from './core/progress.ts';
import { endingCards, markSeen, prologueCards, storyPages } from './core/story.ts';
import { advanceCard, openCard } from './ui/storycard.ts';
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
  hitTestStart,
  hitTestStory,
  hitTestStoryCard,
  inside,
  sliderValue,
  toLogical,
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
  hoverRotate: null,
  hoverFace: null,
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
  screen: 'title',
  hero: 'guardian',
  meta: loadMeta(store),
  reward: null,
  tutorial: null,
  hoverStart: null,
  hoverMeta: null,
  portrait: false,
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
  // 처음이면 연습 판부터 (건너뛸 수 있다). 끝나면 이 난이도로 진짜 판을 시작한다
  if (!ui.meta.lessonDone) {
    beginLesson(difficulty);
    return;
  }
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
  // 연습 판에서 배운 것(사기·면 고르기·돌리기·스킬)은 다시 알려 주지 않는다
  ui.tutorial = ui.meta.tutorialDone ? null : ui.meta.lessonDone ? { bought: true, meteor: true, faced: true, rotated: true } : emptyProgress();
  // 처음 고른 탑이면 서장부터 (판은 카드를 닫을 때까지 멈춘다)
  beatMemo = emptyBeatMemo();
  ui.storyCard = openCard(prologueCards(ui.meta, ui.hero, ui.mode), nowSec());
}

/** 이번 판에서 수호자가 이미 한 말 */
let beatMemo = emptyBeatMemo();

/** 이야기 카드 넘기기 (끝나면 읽은 쪽으로 저장) */
function advanceStory(skip: boolean): void {
  const card = ui.storyCard;
  if (!card) return;
  const next = skip ? null : advanceCard(card, nowSec());
  if (next) {
    if (next.index !== card.index) sound.lessonStep();
    ui.storyCard = next;
    return;
  }
  ui.storyCard = null;
  for (const p of card.pages) ui.meta = markSeen(ui.meta, p.id);
  saveMeta(store, ui.meta);
  sound.lessonStep();
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

/** 연습 판이 끝나면 시작할 난이도 (null 이면 시작 화면으로) */
let afterLesson: DifficultyId | null = null;
/** 이번 프레임에 누른 "다음" */
let lessonInput: 'next' | null = null;

function beginLesson(then: DifficultyId | null): void {
  afterLesson = then;
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
  if (afterLesson) start(ui.meta.runs === 0 ? 'easy' : afterLesson);
  else backToTitle();
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
let audioDrag: 'sfx' | 'music' | null = null;

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
        sound.events([{ kind: 'round', round: state.round }], layout.width);
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
function trySkill(id: string, at?: { x: number; y: number }): void {
  const target = at ?? (findSkill(id).aimed && canAim(ui.pointer) ? ui.pointer : undefined);
  if (useSkill(state, id, target)) {
    sound.skill(id, target?.x, layout.width);
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
  sound.end(won);
  // 그 탑으로 처음 이겼으면 결말 (다섯 탑 모두면 마지막 이야기까지)
  if (won && state.hero) ui.storyCard = openCard(endingCards(before, ui.meta, state.hero), nowSec());
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
    if (ui.screen === 'story') {
      const hit = hitTestStory(layout, x, y);
      if (hit?.kind === 'back') ui.screen = 'title';
      else if (hit?.kind === 'page') {
        selectStoryPage(hit.index);
        sound.tick();
      }
      return;
    }
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
    else if (hit?.kind === 'story') openStoryBook();
    else if (hit?.kind === 'lesson') beginLesson(null);
    return;
  }
  ui.pointer = { x, y };
  if (ui.storyCard) {
    if (ev.button === 0) advanceStory(hitTestStoryCard(layout, x, y) === 'skip');
    return;
  }
  if (ui.audioOpen && ev.button === 0) {
    const a = hitTestAudio(layout, x, y);
    if (a?.kind === 'sfx' || a?.kind === 'music') {
      audioDrag = a.kind;
      setAudio({ ...ui.audio, [a.kind]: a.value }, false);
      canvas.setPointerCapture?.(ev.pointerId);
    } else if (a?.kind === 'mute') toggleMute();
    if (a) return;
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
    if (ev.button !== 0 || !inputReady(choiceOpenedAt, nowSec(), CHOICE_INPUT_DELAY)) return;
    const i = hitTestChoice(layout, x, y);
    ui.hoverChoice = i;
    if (i !== null) tryChoose(i);
    return;
  }
  if (ev.button === 2) {
    ui.aiming = null;
    setPicked(null);
    return;
  }
  const hit = hitTest(layout, x, y);
  if (hit?.kind !== 'info') ui.infoOpen = false;
  if (!hit) {
    if (ui.paused) return;
    // 조준 중이면 전장을 누른 것이 먼저
    if (ui.aiming && canAim({ x, y })) {
      trySkill(ui.aiming, { x, y });
      return;
    }
    const sell = sellRect();
    if (sell && inside(sell, x, y, 2)) {
      trySell();
      return;
    }
    const face = hitTestFaces(state.tower, state.config.tower.faceSlots, x, y);
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
});

canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

canvas.addEventListener('pointerup', () => {
  if (!audioDrag) return;
  audioDrag = null;
  saveAudio(store, ui.audio);
});

canvas.addEventListener('pointermove', (ev) => {
  if (audioDrag) {
    const { x } = logicalFromEvent(ev);
    setAudio({ ...ui.audio, [audioDrag]: sliderValue(layout.audio[audioDrag], x) }, false);
    return;
  }
  const { x, y } = logicalFromEvent(ev);
  if (!ui.started) {
    if (ui.screen === 'story') {
      const hit = hitTestStory(layout, x, y);
      ui.hoverStart = !hit ? null : hit.kind === 'page' ? `page:${hit.index}` : 'back';
      canvas.style.cursor = hit ? 'pointer' : 'default';
      return;
    }
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
  ui.hoverLesson = null;
  if (ui.lesson) {
    const l = hitTestLesson(layout, x, y);
    if (l === 'next' || l === 'skip') ui.hoverLesson = l;
    if (l) {
      canvas.style.cursor = l === 'panel' ? 'default' : 'pointer';
      return;
    }
  }
  const hit = hitTest(layout, x, y);
  ui.hover = hit?.kind === 'card' ? hit.index : null;
  ui.hoverButton = hit && hit.kind !== 'card' ? hit.kind : null;
  ui.hoverSkill = hit?.kind === 'skill' ? hit.index : null;
  ui.hoverRotate = hit?.kind === 'rotate' ? hit.dir : null;
  const sell = sellRect();
  ui.hoverSell = !hit && !!sell && inside(sell, x, y, 2);
  ui.hoverFace = hit || ui.hoverSell || ui.aiming ? null : hitTestFaces(state.tower, state.config.tower.faceSlots, x, y);
  canvas.style.cursor = hit || ui.hoverFace || ui.hoverSell ? 'pointer' : ui.aiming ? 'crosshair' : 'default';
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
    else if (key === 'l') beginLesson(null);
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
  // 연습 판: Enter · Space 는 "다음"
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
    if (pickedValid()) clickFace({ face: arrowFace, slot: weaponsOn(state, arrowFace).length });
    else {
      setPicked(null);
      chooseFace(arrowFace);
    }
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
  // 이번 프레임의 이벤트는 여기서 한 번 꺼내 소리·안내·연출에 나눠 준다
  const events = state.events.splice(0);
  if (ui.started) {
    sound.events(events, layout.width);
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
    for (const b of said.beats) renderer.say(b);
  }
  syncPicked();
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  renderer.draw(state, ui, nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
