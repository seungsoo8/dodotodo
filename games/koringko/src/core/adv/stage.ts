/** 무대: 인물이 걷고 돌아보고, 화면이 어두워지고, 띠가 내려온다 (시간에 따라) */
import { TILE } from '../maps.ts';
import type { Actor, Facing, Pt, Stage } from './types.ts';

/** 1초에 나오는 글자 수 */
export const TEXT_RATE = 30;
/** 기본 걸음 (초당 픽셀) */
export const WALK_SPEED = 60;
/** 감정 말풍선이 떠 있는 시간 */
export const EMOTE_LIFE = 1.4;
const BAR_RATE = 1.6;

/** 칸 → 칸 가운데 픽셀 */
export function px(t: number): number {
  return t * TILE + TILE / 2;
}

export function ptPx(p: Pt): { x: number; y: number } {
  return { x: px(p[0]), y: px(p[1]) };
}

export function newStage(): Stage {
  return { actors: {}, fade: 0, fadeTo: 0, fadeRate: 2, fadeColor: 'black', bars: 0, barsOn: false, music: null, sfx: [], cam: null, dialog: null, title: null, shake: 0, tone: 'now', goal: null, credits: 0, choice: null, props: {}, items: {}, textSpeed: 1, toast: null, slides: {} };
}

// ───────── 대사 호흡

/** 문장 부호 뒤 멈춤 (초) */
const PAUSE_COMMA = 0.12;
const PAUSE_STOP = 0.25;
const PAUSE_ELLIPSIS = 0.4;
const COMMA = new Set([',', '、', '，']);
const STOP = new Set(['.', '!', '?', '。', '！', '？']);
const PUNCT = /[,、，.!?。！？…~]/;
/** 마침표 뒤에 이것이 오면 문장이 끝난 것 (띄어쓰기 · 닫는 따옴표 · 괄호) */
const AFTER_STOP = /[\s"'”’)」』\]]/;

/**
 * text[i] 를 보인 뒤 멈출 시간: 쉼표 0.12 · 마침표 물음표 느낌표 0.25 · 말줄임표(… 또는 ...) 0.4.
 * 이어진 부호(?! · ...)는 마지막 부호 뒤에서 한 번만, 마지막 글자 뒤와 숫자 속 점(1.5)에서는 멈추지 않는다.
 */
export function pauseAfter(text: string, i: number): number {
  const ch = text[i];
  const next = text[i + 1];
  if (ch === undefined || next === undefined) return 0;
  if (PUNCT.test(next)) return 0;
  if (ch === '…') return PAUSE_ELLIPSIS;
  if (COMMA.has(ch)) return PAUSE_COMMA;
  if (!STOP.has(ch)) return 0;
  if (ch !== '.') return PAUSE_STOP;
  if (text[i - 1] === '.') return PAUSE_ELLIPSIS;
  if (STOP.has(text[i - 1] ?? '') || AFTER_STOP.test(next)) return PAUSE_STOP;
  return 0;
}

/** 글자 속도 설정값 (이상한 값이면 1배) */
export function textRate(st: Stage): number {
  const v = st.textSpeed;
  return typeof v === 'number' && v > 0 && Number.isFinite(v) ? v : 1;
}

// ───────── 종이별 알림 · 미끄러짐 · 걸음

/** 종이별 알림이 떠 있는 시간: 0.4초 올라오고 1.5초 머문다 */
export const TOAST_S = 1.9;
/** 밀린 물건이 한 칸 미끄러지는 시간 */
export const SLIDE_S = 0.18;
/** 다 미끄러진 뒤 먼지가 이는 시간 (그림용으로 미끄러짐을 이만큼 더 둔다) */
export const DUST_S = 0.35;
/** 멈출 때 흔들림 */
const SLIDE_SHAKE = 0.08;

/** 물건의 그림 자리 (칸, 소수): 미끄러지는 중이면 from 과 to 사이, 아니면 저장 자리 */
export function slideAt(st: Stage, id: string, cell: readonly [number, number]): [number, number] {
  const s = st.slides?.[id];
  if (!s) return [cell[0], cell[1]];
  const k = Math.max(0, Math.min(1, s.t / Math.max(1e-6, s.dur)));
  // 끝에서 살짝 느려진다 (밀린 물건이 멈추듯)
  const e = 1 - (1 - k) * (1 - k);
  return [s.from[0] + (s.to[0] - s.from[0]) * e, s.from[1] + (s.to[1] - s.from[1]) * e];
}

/** 가속 · 감속 시간 (초): 아주 짧게, 손맛만 */
export const ACCEL_S = 0.08;
export const DECEL_S = 0.06;

/** 속도를 목표 속도 쪽으로: 빨라질 때는 ACCEL_S, 느려질 때는 DECEL_S 동안 최고 속도만큼 바뀐다 */
export function approachVel(v: { x: number; y: number }, target: { x: number; y: number }, dt: number, top?: number): { x: number; y: number } {
  const dx = target.x - v.x;
  const dy = target.y - v.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return { x: target.x, y: target.y };
  const speedUp = Math.hypot(target.x, target.y) >= Math.hypot(v.x, v.y);
  const max = top ?? Math.max(Math.hypot(target.x, target.y), Math.hypot(v.x, v.y));
  const step = (max / (speedUp ? ACCEL_S : DECEL_S)) * dt;
  if (step >= d - 1e-9) return { x: target.x, y: target.y };
  return { x: v.x + (dx / d) * step, y: v.y + (dy / d) * step };
}

/** 태엽이 이보다 적으면 토비 걸음이 느려진다 */
export const LOW_WIND = 0.3;
/** 토비 걸음 박자 배율 (태엽이 적으면 0.7) */
export function gaitScale(wind: number): number {
  return wind < LOW_WIND ? 0.7 : 1;
}

/** 듣는 이가 말하는 이를 바라볼 거리 (px) */
const LISTEN_R = 24 * 5;
/** 바라보기를 하지 않는 자세 */
const NO_TURN = new Set(['sleep', 'stop', 'lie', 'sit', 'sleepSit', 'kneel', 'hurt']);
/**
 * 듣는 이가 말하는 이 쪽으로 돌아볼 방향 (그림만, 저장 방향은 그대로).
 * 대본이 돌려세웠거나(@face) 걷거나 몸짓 중이거나 눕거나 앉았거나 멀면 null.
 */
export function listenDir(listener: Actor, speaker: Actor): Facing | null {
  if (listener === speaker || listener.id === speaker.id) return null;
  if (listener.faced || listener.moving || listener.act || listener.seat || NO_TURN.has(listener.pose)) return null;
  const dx = speaker.x - listener.x;
  const dy = speaker.y - listener.y;
  const d = Math.hypot(dx, dy);
  if (d < 1 || d > LISTEN_R) return null;
  // 사람 그림은 네 방향뿐이라 가까운 네 방향으로
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

function updateSlides(st: Stage, dt: number): void {
  if (!st.slides) return;
  for (const [id, s] of Object.entries(st.slides)) {
    const was = s.t;
    s.t += dt;
    if (was < s.dur && s.t >= s.dur) {
      st.shake = Math.max(st.shake, SLIDE_SHAKE);
      st.sfx.push('thud');
    }
    if (s.t >= s.dur + DUST_S) delete st.slides[id];
  }
}

export function addActor(st: Stage, id: string, kind: string, x: number, y: number, dir: Facing = 'down', pose = 'idle'): Actor {
  const a: Actor = { id, kind, x, y, dir, pose, walkT: 0, moving: false, goal: null, emote: null };
  st.actors[id] = a;
  return a;
}

const DIR8: Facing[] = ['right', 'downRight', 'down', 'downLeft', 'left', 'upLeft', 'up', 'upRight'];
/** 방향 벡터 → 8방향 */
export function facingOf(dx: number, dy: number): Facing {
  const a = Math.atan2(dy, dx);
  return DIR8[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

/** 몸짓마다 기본 길이 (초) */
export const ACT_S: Record<string, number> = {
  nod: 0.7, shake: 0.8, laugh: 1.2, giggle: 1, clap: 1, jump: 0.6, hop: 0.5, bow: 0.9, sigh: 1.3, wipe: 1.3, stretch: 1.3,
  point: 1, think: 1.5, shiver: 1.2, tremble: 1.2, spin: 0.8, pat: 1.1, stomp: 0.6, peek: 1, surprise: 0.7, lookAround: 1.5, shrug: 0.9, cheer: 1.1,
};
export const ACT_DEFAULT_S = 1;

export function updateStage(st: Stage, dt: number): void {
  followItems(st);
  for (const a of Object.values(st.actors)) {
    if (!a.act) continue;
    a.act.life -= dt;
    if (a.act.life <= 0) {
      a.pose = a.act.back;
      delete a.act;
    }
  }
  for (const [k, p] of Object.entries(st.props)) {
    p.life -= dt;
    if (p.life <= 0) delete st.props[k];
  }
  for (const a of Object.values(st.actors)) {
    if (a.goal) {
      const dx = a.goal.x - a.x;
      const dy = a.goal.y - a.y;
      const d = Math.hypot(dx, dy);
      const step = a.goal.speed * dt;
      if (d <= step || d < 0.01) {
        a.x = a.goal.x;
        a.y = a.goal.y;
        a.goal = null;
        a.moving = false;
      } else {
        a.x += (dx / d) * step;
        a.y += (dy / d) * step;
        a.dir = facingOf(dx, dy);
        a.moving = true;
        a.walkT += dt;
      }
    }
    if (a.emote) {
      a.emote.life -= dt;
      if (a.emote.life <= 0) a.emote = null;
    }
  }
  if (st.fade !== st.fadeTo) {
    const s = st.fadeRate * dt;
    st.fade = Math.abs(st.fadeTo - st.fade) <= s ? st.fadeTo : st.fade + Math.sign(st.fadeTo - st.fade) * s;
  }
  const bt = st.barsOn ? 1 : 0;
  if (st.bars !== bt) st.bars = Math.abs(bt - st.bars) <= BAR_RATE * dt ? bt : st.bars + Math.sign(bt - st.bars) * BAR_RATE * dt;
  if (st.title) {
    st.title.life -= dt;
    if (st.title.life <= 0) st.title = null;
  }
  st.shake = Math.max(0, st.shake - dt);
  if (st.toast) {
    st.toast.life -= dt;
    if (st.toast.life <= 0) st.toast = null;
  }
  updateSlides(st, dt);
  footfalls(st);
}

/** 장난감 크기 인물 (작고 높은 발소리) */
const TOY_KINDS = new Set(['toby', 'bori', 'ruru', 'nabi', 'grandoll', 'bear', 'jelly', 'tin', 'dusty', 'king']);

export function stepSize(kind: string): 'toy' | 'human' {
  return TOY_KINDS.has(kind) ? 'toy' : 'human';
}

/**
 * 1초(walkT) 에 내딛는 발 수 = 걸음 그림 박자의 절반 (그림 4장 한 바퀴에 두 발).
 * 장난감 그림 10장/초 · 할머니 인형 5장/초 · 사람 7장/초 (ui/adv/render.ts 와 맞춘다).
 */
export function stepRate(kind: string): number {
  if (kind === 'grandoll') return 2.5;
  return TOY_KINDS.has(kind) ? 5 : 3.5;
}

/** 걷는 인물마다 걸음 그림이 발을 디딜 때 `step:<toy|human>` 소리를 낸다 (바닥은 화면 쪽에서 방을 보고 정한다) */
export function footfalls(st: Stage): void {
  for (const a of Object.values(st.actors)) {
    const prev = a.stepT ?? a.walkT;
    a.stepT = a.walkT;
    if (!a.moving || a.seat) continue;
    const r = stepRate(a.kind);
    if (Math.floor(a.walkT * r) > Math.floor(prev * r)) st.sfx.push(`step:${stepSize(a.kind)}`);
  }
}

/** 든 물건은 든 사람 자리로 (사람이 사라졌으면 물건도 치운다) */
export function followItems(st: Stage): void {
  for (const [id, it] of Object.entries(st.items)) {
    if (!it.on) continue;
    const a = st.actors[it.on];
    if (!a || a.carry !== id) {
      delete st.items[id];
      continue;
    }
    it.x = a.x;
    it.y = a.y;
  }
}
