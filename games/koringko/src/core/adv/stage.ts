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
  return { actors: {}, fade: 0, fadeTo: 0, fadeRate: 2, fadeColor: 'black', bars: 0, barsOn: false, music: null, sfx: [], cam: null, dialog: null, title: null, shake: 0, tone: 'now', goal: null, credits: 0, choice: null, props: {}, items: {} };
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

export function updateStage(st: Stage, dt: number): void {
  followItems(st);
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
