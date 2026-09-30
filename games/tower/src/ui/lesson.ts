import { findEnemy, findItem } from '../core/data.ts';
import { FACES, FACE_INFO, type Face, type WavePlan } from '../core/faces.ts';
import { createGame, selectFace, spawnFromRoad, type GameState } from '../core/game.ts';
import type { GameEvent } from '../core/types.ts';

/**
 * 튜토리얼 판: 처음 하는 사람이 한 번씩 직접 해 보며 배운다.
 * 단계마다 게임이 멈추고, 할 일을 해야(또는 설명이면 "다음"을 눌러야) 넘어간다.
 */

/** 화면에서 반짝여 줄 곳 */
export type LessonTarget = 'cards' | 'face' | 'otherFace' | 'rotate' | 'forecast' | 'skill' | null;

export interface LessonStep {
  id: 'intro' | 'buy' | 'wedge' | 'otherFace' | 'otherWave' | 'rotate' | 'forecast' | 'skill' | 'done';
  title: string;
  text: string;
  target: LessonTarget;
  /** 설명만 있는 단계: "다음" 으로 넘어간다 */
  next?: boolean;
  /** 이 단계 동안 게임이 흐른다 (적이 움직인다) */
  running?: boolean;
  /** 핵심 몇 번째 (1~LESSON_PARTS). 마지막 인사는 없음 */
  part?: number;
}

/** 튜토리얼이 가르치는 핵심: 사기 · 면 · 돌리기 · 스킬 */
export const LESSON_PARTS = 4;

export const LESSON_STEPS: LessonStep[] = [
  {
    id: 'buy',
    title: '무기 사기',
    text: '안개 괴물이 길로 몰려온다. 탑 무기는 알아서 쏜다. 아래 카드를 눌러 무기를 사자 (1~4 키).',
    target: 'cards',
    part: 1,
  },
  {
    id: 'wedge',
    title: '부채꼴 쪽만 쏜다',
    text: '산 무기는 탑 옆 칸에 붙고, 노란 부채꼴 쪽만 쏜다. 그쪽 길로 적이 온다!',
    target: 'face',
    running: true,
    part: 1,
  },
  {
    id: 'otherFace',
    title: '반대쪽에서도 온다',
    text: '이번엔 반대쪽 {face}쪽 길이다. {key} 키나 탑 옆 {face}쪽 빈 칸을 눌러 그 면을 고르고 무기를 하나 더 사자.',
    target: 'otherFace',
    part: 2,
  },
  { id: 'otherWave', title: '잘했어!', text: '새 무기가 새 길을 맡는다. 면마다 따로 쏜다는 것만 기억하자.', target: 'otherFace', running: true, part: 2 },
  {
    id: 'rotate',
    title: '급하면 탑을 돌린다',
    text: 'Z · X (또는 스킬 바 양옆 버튼)로 탑을 통째로 90° 돌린다. 센 면을 적 쪽으로 휙! 한 번 돌려 보자.',
    target: 'rotate',
    part: 3,
  },
  {
    id: 'skill',
    title: '몰려오면 스킬',
    text: 'Q 를 누르면 마우스가 있는 곳(없으면 적이 가장 많은 곳)에 메테오가 떨어진다. 써 보자!',
    target: 'skill',
    running: true,
    part: 4,
  },
  {
    id: 'done',
    title: '준비 끝!',
    text: '이제 탑과 난이도를 골라 진짜 판으로! 15라운드를 버티면 잿빛 왕의 장수가 온다. 첫 판은 쉬움 추천.',
    target: null,
    next: true,
  },
];

export interface Lesson {
  step: number;
  finished: boolean;
  /** 처음 무기를 다는 면 */
  face: Face;
  /** 두 번째로 무기를 다는 반대쪽 면 */
  otherFace: Face;
  /** 이번 단계의 적을 이미 내보냈는지 */
  spawned: boolean;
}

const LESSON_SHOP = ['sling', 'longbow', 'twin_daggers', 'chain_bolt'];
const LESSON_GOLD = 600;
const WAVE_SIZE = 4;
const SKILL_WAVE = 6;

function only(face: Face): WavePlan {
  return { n: 0, e: 0, s: 0, w: 0, [face]: 1 };
}

const opposite = (f: Face): Face => FACES[(FACES.indexOf(f) + 2) % 4];

/** 연습용 판: 적이 저절로 나오지 않고 라운드도 넘어가지 않는다 */
export function createLessonGame(seed = 7): GameState {
  const s = createGame({
    seed,
    difficulty: 'easy',
    config: {
      startWeapons: [],
      roundSeconds: 1e6,
      waves: { baseCount: 0, countPerRound: 0, eliteEvery: 0 },
      rewards: { every: 0 },
    },
  });
  s.plan = only('e');
  selectFace(s, 'e');
  return s;
}

export function startLesson(state: GameState): Lesson {
  return enter({ step: 0, finished: false, face: state.face, otherFace: opposite(state.face), spawned: false }, state);
}

/** 지금 몇 번째 핵심을 배우는 중인지 (마지막 인사면 null) */
export function lessonPart(l: Lesson): number | null {
  return LESSON_STEPS[l.step]?.part ?? null;
}

export function lessonRunning(l: Lesson): boolean {
  return !l.finished && !!LESSON_STEPS[l.step].running;
}

export function skipLesson(l: Lesson): Lesson {
  return { ...l, finished: true };
}

function stockShop(state: GameState): void {
  state.shop = LESSON_SHOP.map((id) => findItem(id));
  state.gold = Math.max(state.gold, LESSON_GOLD);
}

function wave(state: GameState, face: Face, count: number): void {
  state.plan = only(face);
  const goblin = findEnemy('goblin');
  for (let i = 0; i < count; i++) {
    const e = spawnFromRoad(state, goblin);
    // 한꺼번에 몰려오지 않게 조금씩 뒤로
    const f = FACE_INFO[face];
    e.x += f.dx * i * 18;
    e.y += f.dy * i * 18;
  }
}

/** 스킬 연습용 무리: 무기가 없는 길(긴 동·서 길 먼저)로 와서 메테오를 쓸 틈이 있다 */
function skillWave(state: GameState): void {
  const armed = new Set(state.weapons.map((w) => w.face));
  const road = (['e', 'w', 'n', 's'] as Face[]).find((f) => !armed.has(f)) ?? 'e';
  wave(state, road, SKILL_WAVE);
}

const ARROW: Record<Face, string> = { n: '↑', e: '→', s: '↓', w: '←' };

/** 단계 설명 (방향이 들어가는 곳은 이번 연습의 실제 방향으로) */
export function lessonText(step: LessonStep, l: Lesson): string {
  return step.text.replaceAll('{face}', FACE_INFO[l.otherFace].label).replaceAll('{key}', ARROW[l.otherFace]);
}

/** 단계에 들어설 때 판을 그 단계에 맞게 차린다 */
function enter(l: Lesson, state: GameState): Lesson {
  const id = LESSON_STEPS[l.step]?.id;
  const next = { ...l, spawned: false };
  switch (id) {
    case 'buy':
      stockShop(state);
      break;
    case 'wedge':
      wave(state, state.weapons[0]?.face ?? l.face, WAVE_SIZE);
      next.spawned = true;
      break;
    case 'otherFace': {
      const first = state.weapons[0]?.face ?? l.face;
      next.face = first;
      next.otherFace = opposite(first);
      stockShop(state);
      break;
    }
    case 'otherWave':
      wave(state, l.otherFace, WAVE_SIZE);
      next.spawned = true;
      break;
    case 'skill':
      state.roundTime = 0;
      state.skillCooldowns.meteor = 0;
      skillWave(state);
      next.spawned = true;
      break;
  }
  return next;
}

function stepDone(l: Lesson, state: GameState, events: GameEvent[], input: 'next' | null): boolean {
  const st = LESSON_STEPS[l.step];
  if (st.next) return input === 'next';
  switch (st.id) {
    case 'buy':
      return state.weapons.length > 0;
    case 'wedge':
    case 'otherWave':
      return l.spawned && state.enemies.length === 0;
    case 'otherFace':
      return state.weapons.some((w) => w.face === l.otherFace);
    case 'rotate':
      return events.some((ev) => ev.kind === 'rotate');
    case 'skill':
      return events.some((ev) => ev.kind === 'skill' && ev.id === 'meteor');
    default:
      return false;
  }
}

/** 이번 프레임의 이벤트·입력으로 연습 판을 한 걸음 진행한 새 상태 */
export function advanceLesson(l: Lesson, state: GameState, events: GameEvent[], input: 'next' | null): Lesson {
  if (l.finished) return l;
  if (!stepDone(l, state, events, input)) {
    // 스킬을 쓰기 전에 무리가 다 사라졌으면 다시 보낸다
    if (LESSON_STEPS[l.step].id === 'skill' && state.enemies.length === 0) skillWave(state);
    return l;
  }
  if (l.step + 1 >= LESSON_STEPS.length) return { ...l, finished: true };
  return enter({ ...l, step: l.step + 1 }, state);
}
