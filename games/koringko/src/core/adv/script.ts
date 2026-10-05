/**
 * 대본 실행기: 명령을 차례로 실행한다. 기다리는 명령(대사 · 걷기 · 기다리기 · 어두워지기 …)에서 멈췄다가
 * 끝나면 다음으로. 방 옮기기 · 장 넘기기처럼 놀이 상태를 바꾸는 일은 집(Host)에 맡긴다.
 */
import type { HeroId } from '../types.ts';
import { ACT_DEFAULT_S, ACT_S, EMOTE_LIFE, facingOf, pauseAfter, px, TEXT_RATE, textRate, WALK_SPEED } from './stage.ts';
import type { Cmd, Facing, Pt, Stage } from './types.ts';

/** 빨리 넘기기 (누르고 있을 때) 배율 */
export const FAST = 4;
/** 감정 말풍선에서 멈추는 시간 */
const EMOTE_PAUSE = 0.7;
/** 말소리가 나는 글자 (한글 · 영문 · 숫자) */
const VOICED = /[가-힣a-zA-Z0-9]/;
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
  /** 앉는 자세가 되면 가까운 의자로 (없으면 그 자리) */
  seat?(who: string): void;
  /** 문 앞에서 나타나거나 사라지면 문이 잠깐 열린다 */
  doorway?(who: string): void;
  /** 물건 상태 바꾸기 */
  prop?(what: string, state: string, s?: number): void;
  /** 기억 속을 걷기 시작 · 끝 */
  wander?(mem: string | null): void;
  /** 밀 물건을 처음 자리로 */
  resetPush?(ids: string[]): void;
  /** 동료를 불러 함께 다니거나 자기 자리로 돌려보낸다 */
  call?(who: HeroId | 'all', on: boolean): void;
}

/** 물건을 집거나 내려놓을 때 숙이는 시간 (초) */
export const TAKE_S = 0.4;
const FRONT: Record<string, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0], downRight: [1, 1], downLeft: [-1, 1], upRight: [1, -1], upLeft: [-1, -1] };

const FACINGS = new Set(['down', 'up', 'left', 'right', 'downRight', 'downLeft', 'upRight', 'upLeft']);

export class Runner {
  private readonly cmds: Cmd[];
  i = 0;
  t = 0;
  done = false;
  private entered = false;
  private said = false;
  /** 지금 대사에서 소리 낸 글자 수 */
  private letters = 0;
  /** 대사가 다 나온 뒤 지난 실제 초 (자동 넘김) */
  private shownFor = 0;
  /** 이번 update 의 실제 초 (빨리 넘기기 배율 전) */
  private realDt = 0;
  /** 이번 update 가 빨리 넘기기인가 */
  private fast = false;
  /** 집기 · 내려놓기: 할 수 있는가 · 마쳤는가 */
  private bend: { ok: boolean; did: boolean } = { ok: false, did: false };

  constructor(cmds: readonly Cmd[]) {
    this.cmds = [...cmds];
  }

  update(h: Host, dt: number, fast = false): void {
    const d = dt * (fast ? FAST : 1);
    this.realDt = dt;
    this.fast = fast;
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
      if (h.stage.dialog.shown < h.stage.dialog.text.length) {
        h.stage.dialog.shown = h.stage.dialog.text.length;
        h.stage.dialog.hold = 0;
      } else this.said = true;
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
        st.dialog = c.mood ? { who: c.who, text: c.text, shown: 0, hold: 0, mood: c.mood } : { who: c.who, text: c.text, shown: 0, hold: 0 };
        this.letters = 0;
        this.said = false;
        this.shownFor = 0;
        break;
      case 'emote': {
        const a = actor(c.who);
        if (a) a.emote = { e: c.e, life: c.s ?? EMOTE_LIFE };
        break;
      }
      case 'walk': {
        const a = actor(c.who);
        if (!a) break;
        // 앉아 있었으면 일어나서 걷는다
        if (a.seat || a.pose === 'sit') {
          a.seat = false;
          a.pose = 'idle';
        }
        a.faced = false;
        a.goal = { x: px(c.to[0]), y: px(c.to[1]), speed: c.speed ?? WALK_SPEED };
        break;
      }
      case 'face': {
        const a = actor(c.who);
        if (!a) break;
        a.faced = true;
        if (FACINGS.has(c.dir)) a.dir = c.dir as Facing;
        else {
          const o = actor(c.dir) ?? st.items[c.dir];
          if (o) a.dir = facingOf(o.x - a.x, o.y - a.y);
        }
        break;
      }
      case 'pose': {
        const a = actor(c.who);
        if (a) a.pose = c.pose;
        h.seat?.(c.who);
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
        st.musicFade = c.fade;
        break;
      case 'sfx':
        st.sfx.push(c.name);
        break;
      case 'cam':
        st.cam = c.to === null ? null : typeof c.to === 'string' ? c.to : { x: px(c.to[0]), y: px(c.to[1]) };
        break;
      case 'show': {
        const p = { x: px(c.at[0]), y: px(c.at[1]) };
        st.actors[c.who] = { id: c.who, kind: c.kind, x: p.x, y: p.y, dir: c.dir ?? 'down', pose: c.pose ?? 'idle', walkT: 0, moving: false, goal: null, emote: null, faced: !!c.dir };
        h.seat?.(c.who);
        h.doorway?.(c.who);
        break;
      }
      case 'hide': {
        h.doorway?.(c.who);
        const carry = st.actors[c.who]?.carry;
        if (carry) delete st.items[carry];
        delete st.actors[c.who];
        break;
      }
      case 'prop':
        h.prop?.(c.what, c.state, c.s);
        break;
      case 'act': {
        const a = actor(c.who);
        if (!a) break;
        a.act = { life: c.s ?? ACT_S[c.name] ?? ACT_DEFAULT_S, back: a.act?.back ?? a.pose };
        a.pose = c.name;
        break;
      }
      case 'item': {
        const it = st.items[c.id];
        if (it) it.kind = c.kind;
        if (c.at) {
          if (it) {
            if (it.on && st.actors[it.on]?.carry === c.id) delete st.actors[it.on].carry;
            Object.assign(it, { x: px(c.at[0]), y: px(c.at[1]), on: null });
          } else st.items[c.id] = { kind: c.kind, x: px(c.at[0]), y: px(c.at[1]), on: null };
        }
        break;
      }
      case 'take':
      case 'put': {
        const a = actor(c.who);
        const it = st.items[c.id];
        const ok = !!a && !!it && (c.t === 'take' ? !it.on && !a.carry : it.on === c.who);
        this.bend = { ok, did: false };
        if (ok) a.pose = 'kneel';
        break;
      }
      case 'give': {
        const from = actor(c.from);
        const to = actor(c.to);
        const it = st.items[c.id];
        if (!from || !to || !it || it.on !== c.from || to.carry) break;
        delete from.carry;
        to.carry = c.id;
        it.on = c.to;
        break;
      }
      case 'carry': {
        const a = actor(c.who);
        if (!a) break;
        if (a.carry) delete st.items[a.carry];
        delete a.carry;
        if (c.kind === 'none') break;
        st.items[c.id] = { kind: c.kind, x: a.x, y: a.y, on: c.who };
        a.carry = c.id;
        break;
      }
      case 'wander':
        h.wander?.(c.mem);
        break;
      case 'reset':
        h.resetPush?.(c.ids);
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
      case 'call':
        h.call?.(c.who, c.on);
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
        // 기억 id: 새로 주면 그것, 기억 빛 안에서 빛만 다시 정하면 그대로, 그 밖에는 지운다
        st.mem = c.v !== 'memory' ? null : (c.mem ?? (st.tone === 'memory' ? (st.mem ?? null) : null));
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
    if (c.t === 'say' && st.dialog) {
      const dl = st.dialog;
      const from = Math.floor(dl.shown);
      const speed = textRate(st);
      if (this.fast) {
        // 빨리 넘기기: 문장 부호에서 멈추지 않는다
        dl.hold = 0;
        dl.shown = Math.min(dl.text.length, dl.shown + d * TEXT_RATE * speed);
      } else {
        // 문장 부호 뒤에서 잠깐 숨을 고른다 (dl.hold 초)
        let left = d;
        while (left > 1e-12 && dl.shown < dl.text.length) {
          if ((dl.hold ?? 0) > 0) {
            const use = Math.min(left, dl.hold!);
            dl.hold! -= use;
            left -= use;
            continue;
          }
          const before = Math.floor(dl.shown);
          const toNext = (before + 1 - dl.shown) / (TEXT_RATE * speed);
          if (left < toNext) {
            dl.shown += left * TEXT_RATE * speed;
            break;
          }
          dl.shown = before + 1;
          left -= toNext;
          dl.hold = pauseAfter(dl.text, before) / speed;
        }
        dl.shown = Math.min(dl.text.length, dl.shown);
      }
      // 자동 넘김: 다 나온 뒤 실제 초로 센다
      if (dl.shown >= dl.text.length) {
        this.shownFor += this.realDt;
        const auto = st.autoAdvance ?? 0;
        if (auto > 0 && this.shownFor >= auto) this.said = true;
      }
      // 말소리: 새로 보인 글자(띄어쓰기 · 문장 부호 빼고) 두 개마다 한 번
      for (let i = from; i < Math.floor(dl.shown); i++) {
        if (!VOICED.test(dl.text[i])) continue;
        this.letters++;
        if (this.letters % 2 === 0) st.sfx.push(`voice:${dl.who}`);
      }
    }
    if (c.t === 'credits') st.credits = this.t;
    // 기다리는 몸짓은 대본이 넘어가는 순간 원래 자세로
    if (c.t === 'act' && c.wait !== false && this.t >= (c.s ?? ACT_S[c.name] ?? ACT_DEFAULT_S)) {
      const a = st.actors[c.who];
      if (a?.act) {
        a.pose = a.act.back;
        delete a.act;
      }
    }
    if ((c.t === 'take' || c.t === 'put') && this.bend.ok && !this.bend.did && this.t >= TAKE_S) {
      this.bend.did = true;
      const a = st.actors[c.who];
      const it = st.items[c.id];
      if (!a || !it) return;
      a.pose = 'idle';
      if (c.t === 'take') {
        it.on = c.who;
        a.carry = c.id;
        st.sfx.push('lift');
      } else {
        const [fx, fy] = FRONT[a.dir] ?? [0, 1];
        const tx = c.at ? c.at[0] : Math.round((a.x - px(0)) / (px(1) - px(0))) + fx;
        const ty = c.at ? c.at[1] : Math.round((a.y - px(0)) / (px(1) - px(0))) + fy;
        Object.assign(it, { x: px(tx), y: px(ty), on: null });
        delete a.carry;
        st.sfx.push('put');
      }
    }
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
      case 'take':
      case 'put':
        return !this.bend.ok || this.bend.did;
      case 'act':
        return c.wait === false || !st.actors[c.who] || this.t >= (c.s ?? ACT_S[c.name] ?? ACT_DEFAULT_S);
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
