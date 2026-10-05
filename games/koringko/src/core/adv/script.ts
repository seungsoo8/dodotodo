/**
 * 대본 실행기: 명령을 차례로 실행한다. 기다리는 명령(대사 · 걷기 · 기다리기 · 어두워지기 …)에서 멈췄다가
 * 끝나면 다음으로. 방 옮기기 · 장 넘기기처럼 놀이 상태를 바꾸는 일은 집(Host)에 맡긴다.
 */
import type { HeroId } from '../types.ts';
import { EMOTE_LIFE, facingOf, px, TEXT_RATE, WALK_SPEED } from './stage.ts';
import type { Cmd, Facing, Pt, Stage } from './types.ts';

/** 빨리 넘기기 (누르고 있을 때) 배율 */
export const FAST = 4;
/** 감정 말풍선에서 멈추는 시간 */
const EMOTE_PAUSE = 0.7;
/** 엔딩 크레디트 길이 (초) */
export const CREDITS_S = 48;

export interface Host {
  stage: Stage;
  flags: Record<string, boolean>;
  goRoom(id: string, at?: Pt, dir?: Facing): void;
  chapter(n: number): void;
  /** 다음 장 (목록 차례) */
  nextChapter(): void;
  /** 지금 장 제목 · 부제 */
  chapterTitle(): { text: string; sub: string };
  join(who: HeroId): void;
  leave(who: HeroId): void;
  control(who: string): void;
  startMini(id: string): void;
  miniDone(): boolean;
  wind(v: number): void;
  album(id: string): void;
}

const FACINGS = new Set(['down', 'up', 'left', 'right', 'downRight', 'downLeft', 'upRight', 'upLeft']);

export class Runner {
  private readonly cmds: Cmd[];
  i = 0;
  t = 0;
  done = false;
  private entered = false;
  private said = false;

  constructor(cmds: readonly Cmd[]) {
    this.cmds = [...cmds];
  }

  update(h: Host, dt: number, fast = false): void {
    const d = dt * (fast ? FAST : 1);
    let spent = false;
    for (let guard = 0; guard < 1000 && !this.done; guard++) {
      if (this.i >= this.cmds.length) {
        this.done = true;
        h.stage.dialog = null;
        break;
      }
      const c = this.cmds[this.i];
      if (!this.entered) {
        this.enter(h, c);
        this.entered = true;
        this.t = 0;
      } else if (!spent) {
        this.t += d;
        this.tick(h, c, d);
        spent = true;
      } else break;
      if (this.finished(h, c)) {
        this.i++;
        this.entered = false;
      }
    }
  }

  /** 누름: 대사를 다 보이거나 넘기고, 제목 카드는 빨리 닫는다 */
  advance(h: Host): void {
    const c = this.cmds[this.i];
    if (!c || !this.entered) return;
    if (c.t === 'say' && h.stage.dialog) {
      if (h.stage.dialog.shown < h.stage.dialog.text.length) h.stage.dialog.shown = h.stage.dialog.text.length;
      else this.said = true;
    } else if ((c.t === 'title' || c.t === 'chtitle') && h.stage.title) h.stage.title.life = Math.min(h.stage.title.life, 0.4);
  }

  /** 지금 대사를 기다리는 중인가 (화면이 ▼ 표시) */
  waitingSay(h: Host): boolean {
    const c = this.cmds[this.i];
    return !!c && c.t === 'say' && !!h.stage.dialog && h.stage.dialog.shown >= h.stage.dialog.text.length;
  }

  private enter(h: Host, c: Cmd): void {
    const st = h.stage;
    const actor = (id: string) => st.actors[id];
    switch (c.t) {
      case 'say':
        st.dialog = { who: c.who, text: c.text, shown: 0 };
        this.said = false;
        break;
      case 'emote': {
        const a = actor(c.who);
        if (a) a.emote = { e: c.e, life: c.s ?? EMOTE_LIFE };
        break;
      }
      case 'walk': {
        const a = actor(c.who);
        if (a) a.goal = { x: px(c.to[0]), y: px(c.to[1]), speed: c.speed ?? WALK_SPEED };
        break;
      }
      case 'face': {
        const a = actor(c.who);
        if (!a) break;
        if (FACINGS.has(c.dir)) a.dir = c.dir as Facing;
        else {
          const o = actor(c.dir);
          if (o) a.dir = facingOf(o.x - a.x, o.y - a.y);
        }
        break;
      }
      case 'pose': {
        const a = actor(c.who);
        if (a) a.pose = c.pose;
        break;
      }
      case 'fade':
        st.fadeTo = c.to;
        st.fadeRate = Math.abs(c.to - st.fade) / Math.max(0.001, c.s ?? 0.6) || 1;
        if (c.color) st.fadeColor = c.color;
        if ((c.s ?? 0.6) <= 0) st.fade = c.to;
        break;
      case 'bars':
        st.barsOn = c.on;
        break;
      case 'music':
        st.music = c.track;
        break;
      case 'sfx':
        st.sfx.push(c.name);
        break;
      case 'cam':
        st.cam = c.to === null ? null : typeof c.to === 'string' ? c.to : { x: px(c.to[0]), y: px(c.to[1]) };
        break;
      case 'show': {
        const p = { x: px(c.at[0]), y: px(c.at[1]) };
        st.actors[c.who] = { id: c.who, kind: c.kind, x: p.x, y: p.y, dir: c.dir ?? 'down', pose: c.pose ?? 'idle', walkT: 0, moving: false, goal: null, emote: null };
        break;
      }
      case 'hide':
        delete st.actors[c.who];
        break;
      case 'flag':
        h.flags[c.name] = c.v ?? true;
        break;
      case 'title':
        st.title = { text: c.text, sub: c.sub ?? '', life: c.s ?? 3.2, max: c.s ?? 3.2 };
        break;
      case 'room':
        h.goRoom(c.id, c.at, c.dir);
        break;
      case 'shake':
        st.shake = c.s;
        break;
      case 'join':
        h.join(c.who);
        break;
      case 'leave':
        h.leave(c.who);
        break;
      case 'control':
        h.control(c.who);
        break;
      case 'goal':
        st.goal = c.text;
        break;
      case 'mini':
        st.dialog = null;
        h.startMini(c.id);
        break;
      case 'if': {
        const branch = h.flags[c.flag] ? c.then : (c.else ?? []);
        this.cmds.splice(this.i + 1, 0, ...branch);
        break;
      }
      case 'chapter':
        h.chapter(c.n);
        break;
      case 'next':
        h.nextChapter();
        break;
      case 'chtitle': {
        const t = h.chapterTitle();
        st.title = { text: t.text, sub: t.sub, life: 3.2, max: 3.2 };
        break;
      }
      case 'wind':
        h.wind(c.v);
        break;
      case 'tone':
        st.tone = c.v;
        break;
      case 'album':
        h.album(c.id);
        break;
      case 'credits':
        st.dialog = null;
        st.credits = 0;
        break;
      case 'choice':
        st.choice = { flag: c.flag, options: c.options, sel: 0, picked: null };
        break;
      case 'wait':
        break;
    }
  }

  private tick(h: Host, c: Cmd, d: number): void {
    const st = h.stage;
    if (c.t === 'say' && st.dialog) st.dialog.shown = Math.min(st.dialog.text.length, st.dialog.shown + d * TEXT_RATE);
    if (c.t === 'credits') st.credits = this.t;
  }

  private finished(h: Host, c: Cmd): boolean {
    const st = h.stage;
    switch (c.t) {
      case 'say':
        return this.said;
      case 'emote':
        return c.wait === false || this.t >= Math.min(c.s ?? EMOTE_PAUSE, EMOTE_PAUSE);
      case 'walk':
        return c.wait === false || !st.actors[c.who]?.goal;
      case 'wait':
        return this.t >= c.s;
      case 'fade':
        return st.fade === st.fadeTo;
      case 'title':
      case 'chtitle':
        return !st.title;
      case 'cam':
        return this.t >= (c.s ?? 0);
      case 'mini':
        return h.miniDone();
      case 'credits':
        return this.t >= CREDITS_S;
      case 'choice':
        if (!st.choice || st.choice.picked === null) return false;
        h.flags[`${c.flag}_${st.choice.picked}`] = true;
        st.choice = null;
        return true;
      default:
        return true;
    }
  }
}
