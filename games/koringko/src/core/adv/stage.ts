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
  return { actors: {}, fade: 0, fadeTo: 0, fadeRate: 2, fadeColor: 'black', bars: 0, barsOn: false, music: null, sfx: [], cam: null, dialog: null, title: null, shake: 0, tone: 'now', goal: null, credits: 0, choice: null, props: {} };
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
}
