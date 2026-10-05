/**
 * 이야기 어드벤처 한 판: 방을 걷고, 살펴보고, 기억 조각을 모으고, 동료 능력으로 길을 열고,
 * 발소리가 들리면 얼음. 대본(Runner)이 도는 동안에는 조종이 멈춘다.
 */
import { pushOutOfRect } from '../geom.ts';
import { isSolidChar, TILE } from '../maps.ts';
import { createRng, type Rng } from '../rng.ts';
import type { HeroId } from '../types.ts';
import { makeMini, type Mini, type MiniDir } from './mini.ts';
import { FAST, Runner, type Host } from './script.ts';
import { addActor, facingOf, newStage, px, updateStage } from './stage.ts';
import type { Chapter, Cmd, Facing, Pt, RoomDef, Stage, Thing } from './types.ts';

export interface AdvData {
  rooms: Record<string, () => RoomDef>;
  chapters: Chapter[];
}

export interface AdvSave {
  v: 1;
  /** 장 번호 (장이 끼어들면 바뀌므로 불러올 때 ch 로 다시 찾는다) */
  chapter: number;
  /** 장을 가리키는 바뀌지 않는 이름 (그 장의 방 id) */
  ch?: string;
  room: string;
  x: number;
  y: number;
  party: HeroId[];
  flags: Record<string, boolean>;
  /** 모은 기억 (모은 순서) */
  album: string[];
  wind: number;
  /** 밀어 놓은 덩어리 자리 */
  blocks: Record<string, [number, number]>;
  /** 논 시간 (초) */
  time: number;
}

export interface AdvInput {
  move: { x: number; y: number };
  /** 이번에 눌렀다 */
  act: boolean;
  /** 누르고 있다 (빨리 넘기기 · 숨 들이쉬기) */
  hold: boolean;
  /** 이번에 누른 방향 (고르기 · 작은 놀이) */
  dir: MiniDir | null;
}

export const NO_INPUT: AdvInput = { move: { x: 0, y: 0 }, act: false, hold: false, dir: null };

/** 걸음 (초당 픽셀): 장난감 · 사람 */
export const SPEED = { toy: 92, human: 74 };
const RADIUS = { toy: 7, human: 8 };
/** 닿는 거리 (앞쪽 10px 자리에서) */
export const REACH = 34;
/** 동료 사이 간격 (발자국 점 수 · 점 사이 2px) */
const TRAIL_GAP = 15;
const TRAIL_STEP = 2;
/** 앉을 때 의자를 찾는 거리 (칸) */
const SEAT_REACH = 1.5;

/** 앉을 수 있는 칸: 의자 · 걸상은 그 칸, 벤치는 칸마다, 그네는 양 끝 기둥을 뺀 가운데 칸들 (맨 아랫줄) */
function seatCells(f: { kind: string; x: number; y: number; w: number; h: number }): { x: number; y: number }[] {
  const kind = f.kind.split(':')[0];
  const row = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => ({ x: f.x + from + i, y: f.y + f.h - 1 }));
  if (kind === 'chair' || kind === 'stool') return [{ x: f.x, y: f.y }];
  if (kind === 'bench') return row(0, f.w);
  if (kind === 'swingset') return row(1, f.w - 1);
  return [];
}
/** 문 앞이라고 보는 거리 (칸) · 문이 열려 있는 시간 (초) */
const DOOR_REACH = 1.5;
const DOOR_OPEN = 1.2;

const INTERACTIVE = new Set(['spot', 'memory', 'star', 'npc', 'block', 'gap', 'link', 'thread']);

export interface StepsState {
  phase: 'calm' | 'warn' | 'hold';
  t: number;
  caught: number;
}

export class Adv implements Host {
  readonly data: AdvData;
  save: AdvSave;
  stage: Stage = newStage();
  room!: RoomDef;
  runner: Runner | null = null;
  queue: Cmd[][] = [];
  mini: Mini | null = null;
  /** 조종하는 인물 */
  player = 'toby';
  prompt: Thing | null = null;
  trail: { x: number; y: number }[] = [];
  steps: StepsState = { phase: 'calm', t: 0, caught: 0 };
  checkpoint = { x: 0, y: 0 };
  private pending: number | null = null;
  /** 동료가 마지막으로 움직인 뒤 지난 시간 (걷는 그림이 깜빡이지 않게) */
  private still = new Map<string, number>();
  /** 기억 속에서 직접 움직이는 동안 미뤄 둔 마무리: 깃발이 서면 이어서 */
  resume: { flag: string; cmds: Cmd[] } | null = null;
  /** 걸어 들어갈 기억 (장면이 시작되면 정해지고, 들어서면 wandering) */
  private walkMem: Extract<Thing, { kind: 'memory' }> | null = null;
  /** 지금 걷고 있는 기억 */
  wandering: Extract<Thing, { kind: 'memory' }> | null = null;
  private rng: Rng = createRng(7);
  private built = new Map<string, RoomDef>();

  constructor(data: AdvData, save?: AdvSave) {
    this.data = data;
    if (save) save = this.locate(save);
    if (save && this.valid(save)) {
      this.save = { ...save, flags: { ...save.flags }, album: [...save.album], party: [...save.party], blocks: { ...save.blocks } };
      this.goRoom(save.room, [(save.x - TILE / 2) / TILE, (save.y - TILE / 2) / TILE]);
    } else {
      const ch = data.chapters[0];
      this.save = { v: 1, chapter: ch.n, room: ch.room, x: px(ch.start[0]), y: px(ch.start[1]), party: [...ch.party], flags: {}, album: [], wind: ch.wind, blocks: {}, time: 0 };
      this.applyChapter(ch.n);
    }
  }

  get flags(): Record<string, boolean> {
    return this.save.flags;
  }

  /** 저장의 장 번호를 지금 이야기의 번호로: 장 이름(ch) → 없으면 저장된 방이 어느 장의 방인지 */
  private locate(s: AdvSave): AdvSave {
    if (!s || typeof s !== 'object') return s;
    const byCh = s.ch ? this.data.chapters.find((c) => c.room === s.ch) : undefined;
    if (s.ch && !byCh) return { ...s, chapter: -1 };
    const ch = byCh ?? this.data.chapters.find((c) => c.room === s.room);
    return ch ? { ...s, chapter: ch.n, ch: ch.room } : s;
  }

  private valid(s: AdvSave): boolean {
    return s?.v === 1 && this.data.chapters.some((c) => c.n === s.chapter) && !!this.data.rooms[s.room] && Number.isFinite(s.x) && Number.isFinite(s.y) && Array.isArray(s.party) && typeof s.flags === 'object';
  }

  snapshot(): AdvSave {
    const p = this.stage.actors[this.player];
    const ch = this.data.chapters.find((c) => c.n === this.save.chapter);
    return { ...this.save, ch: ch?.room, room: this.room.id, x: p?.x ?? this.save.x, y: p?.y ?? this.save.y, flags: { ...this.save.flags }, album: [...this.save.album], party: [...this.save.party], blocks: { ...this.save.blocks } };
  }

  /** 저장해도 되는 때 (대본 · 놀이 · 기억 속이 아닐 때) */
  canSave(): boolean {
    return !this.runner && !this.mini && !this.resume && this.room.scale === 'toy' && this.player === 'toby';
  }

  // ───────── 집(Host) 일

  goRoom(id: string, at?: Pt, dir?: Facing): void {
    let r = this.built.get(id);
    if (!r) {
      const make = this.data.rooms[id];
      if (!make) throw new Error(`없는 방: ${id}`);
      r = make();
      this.built.set(id, r);
    }
    this.room = r;
    this.save.room = id;
    this.stage.actors = {};
    this.stage.props = {};
    this.stage.items = {};
    this.stage.cam = null;
    const x = at ? px(at[0]) : px(r.start.x);
    const y = at ? px(at[1]) : px(r.start.y);
    this.save.x = x;
    this.save.y = y;
    if (r.scale === 'toy') {
      this.player = 'toby';
      this.syncParty();
      if (dir) this.stage.actors.toby.dir = dir;
    }
    this.trail = [];
    if (r.scale === 'toy') this.spreadParty();
    this.checkpoint = { x, y };
    this.steps = { phase: 'calm', t: this.calmTime(), caught: this.steps.caught };
    if (r.music) this.stage.music = r.music;
    this.syncNpcs();
  }

  chapter(n: number): void {
    this.pending = n;
  }

  nextChapter(): void {
    const i = this.data.chapters.findIndex((c) => c.n === this.save.chapter);
    const next = this.data.chapters[i + 1];
    if (next) this.pending = next.n;
  }

  prop(what: string, state: string, s?: number): void {
    const life = s ?? Infinity;
    if (what === 'light') {
      this.stage.props.light = { state, life };
      return;
    }
    const [kind, at] = what.split('@');
    const [ax, ay] = at ? at.split(',').map(Number) : [NaN, NaN];
    const f = (this.room.furniture ?? []).find((x) => x.kind.split(':')[0] === kind && (!at || (x.x === ax && x.y === ay)));
    if (f) this.stage.props[`${kind}@${f.x},${f.y}`] = { state, life };
  }

  doorway(who: string): void {
    const a = this.stage.actors[who];
    if (!a || this.room.scale !== 'human') return;
    const tx = Math.floor(a.x / TILE);
    const ty = Math.floor(a.y / TILE);
    for (const f of this.room.furniture ?? []) {
      if (f.kind.split(':')[0] !== 'door' || Math.hypot(f.x - tx, f.y + f.h - ty) > DOOR_REACH) continue;
      this.stage.props[`door@${f.x},${f.y}`] = { state: 'open', life: DOOR_OPEN };
      // 대본이 방금 문소리를 냈으면 겹쳐 내지 않는다
      if (!this.stage.sfx.some((s) => s === 'doorOpen' || s === 'doorClose' || s === 'door')) this.stage.sfx.push('door');
    }
  }

  seat(who: string): void {
    const a = this.stage.actors[who];
    if (!a) return;
    a.seat = false;
    if (a.pose !== 'sit' || this.room.scale !== 'human') return;
    const fur = this.room.furniture ?? [];
    const taken = new Set(Object.values(this.stage.actors).filter((o) => o !== a && o.seat).map((o) => `${Math.floor(o.x / TILE)},${Math.floor(o.y / TILE)}`));
    const tx = Math.floor(a.x / TILE);
    const ty = Math.floor(a.y / TILE);
    const chairs = fur.flatMap(seatCells).filter((f) => !taken.has(`${f.x},${f.y}`) && Math.hypot(f.x - tx, f.y - ty) <= SEAT_REACH);
    chairs.sort((p, q) => Math.hypot(p.x - tx, p.y - ty) - Math.hypot(q.x - tx, q.y - ty));
    const c = chairs[0];
    if (!c) return;
    a.x = px(c.x);
    a.y = px(c.y);
    a.seat = true;
    // 식탁 쪽을 본다
    const tables = fur.filter((f) => f.kind.split(':')[0] === 'table');
    const near = (f: { x: number; y: number; w: number; h: number }) => Math.hypot(f.x + f.w / 2 - (c.x + 0.5), f.y + f.h / 2 - (c.y + 0.5));
    const t = tables.sort((p, q) => near(p) - near(q))[0];
    if (t && near(t) < 4) {
      const dx = t.x + t.w / 2 - (c.x + 0.5);
      const dy = t.y + t.h / 2 - (c.y + 0.5);
      a.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    }
  }

  chapterTitle(): { text: string; sub: string } {
    const ch = this.data.chapters.find((c) => c.n === this.save.chapter);
    return { text: ch?.title ?? '', sub: ch?.sub ?? '' };
  }

  join(who: HeroId): void {
    if (!this.save.party.includes(who)) this.save.party.push(who);
    // 방에 서 있던 그 동료(잠든 모습 등)가 그 자리에서 줄에 낀다
    const here = Object.values(this.stage.actors).find((a) => a.kind === who && a.id !== who);
    this.syncParty();
    const a = this.stage.actors[who];
    if (here && a) {
      a.x = here.x;
      a.y = here.y;
      a.dir = here.dir;
      delete this.stage.actors[here.id];
    }
  }

  leave(who: HeroId): void {
    this.save.party = this.save.party.filter((h) => h !== who);
    delete this.stage.actors[who];
    this.syncParty();
  }

  control(who: string): void {
    this.player = who;
    if (who === 'toby') this.syncParty();
    else for (const h of ['toby', 'bori', 'ruru', 'nabi']) if (h !== who) delete this.stage.actors[h];
  }

  startMini(id: string): void {
    this.mini = makeMini(id);
  }

  miniDone(): boolean {
    return this.mini === null;
  }

  wind(v: number): void {
    this.save.wind = v;
  }

  wander(mem: string | null): void {
    if (mem === null) {
      this.wandering = null;
      for (const h of ['toby', 'bori', 'ruru', 'nabi']) delete this.stage.actors[h];
      return;
    }
    const t = this.walkMem;
    if (!t?.explore || t.id !== mem) return;
    this.wandering = t;
    this.player = 'toby';
    for (const h of ['toby', 'bori', 'ruru', 'nabi']) delete this.stage.actors[h];
    this.save.x = px(t.explore.enter[0]);
    this.save.y = px(t.explore.enter[1]);
    this.trail = [];
    this.syncParty();
    this.spreadParty();
  }

  /** 걷는 기억 안의 실 (없으면 null) */
  private threads(): Extract<Thing, { kind: 'thread' }>[] {
    const m = this.wandering;
    if (!m?.explore) return [];
    return m.explore.threads.map((th, i) => ({ kind: 'thread' as const, id: `thr_${m.id}_${i}`, at: th.at, text: th.text }));
  }

  /** 기억의 실: 모은 수 / 모두 (걷는 기억 밖이면 null) */
  threadCount(): { got: number; total: number } | null {
    if (!this.wandering) return null;
    const ts = this.threads();
    return { got: ts.filter((th) => this.flags[th.id]).length, total: ts.length };
  }

  album(id: string): void {
    if (!this.save.album.includes(id)) this.save.album.push(id);
  }

  // ───────── 무대 정리

  /** 장난감 방이면 토비와 동료를 무대에 (없는 동료는 뺀다) */
  syncParty(): void {
    if ((this.room.scale !== 'toy' && !this.wandering) || this.player !== 'toby') return;
    const st = this.stage;
    let p = st.actors.toby;
    if (!p) p = addActor(st, 'toby', 'toby', this.save.x, this.save.y);
    for (const h of ['bori', 'ruru', 'nabi'] as HeroId[]) {
      if (this.save.party.includes(h)) {
        if (!st.actors[h]) addActor(st, h, h, p.x, p.y, p.dir);
      } else delete st.actors[h];
    }
  }

  /** 방에 들어오면 동료들이 한 칸에 겹치지 않게 토비 뒤로 한 줄 (걸을 수 있는 쪽으로) */
  spreadParty(): void {
    const p = this.stage.actors.toby;
    if (!p) return;
    const fs = this.followers();
    if (!fs.length) return;
    const len = (fs.length + 1) * TRAIL_GAP + 1;
    // 가장 길게 비어 있는 쪽 (아래 · 왼쪽 · 오른쪽 · 위 순으로 우선)
    let best: { x: number; y: number }[] = [];
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < len; i++) {
        const q = { x: p.x + dx * i * TRAIL_STEP, y: p.y + dy * i * TRAIL_STEP };
        if (this.solid(Math.floor(q.x / TILE), Math.floor(q.y / TILE))) break;
        pts.push(q);
      }
      if (pts.length > best.length) best = pts;
      if (pts.length === len) break;
    }
    if (best.length < 2) return;
    // 길이가 모자라면 간격을 좁힌다
    const gap = Math.max(1, Math.min(TRAIL_GAP, Math.floor((best.length - 1) / fs.length)));
    this.trail = best;
    fs.forEach((h, i) => {
      const q = best[Math.min(best.length - 1, (i + 1) * gap)];
      const a = this.stage.actors[h];
      a.x = q.x;
      a.y = q.y;
      a.dir = p.dir;
    });
  }

  private syncNpcs(): void {
    for (const t of this.room.things) {
      if (t.kind !== 'npc') continue;
      const show = this.cond(t);
      const a = this.stage.actors[t.id];
      if (show && !a) addActor(this.stage, t.id, t.actor, px(t.at[0]), px(t.at[1]), t.dir ?? 'down', t.pose ?? 'idle');
      else if (!show && a && a.kind === t.actor) delete this.stage.actors[t.id];
    }
  }

  private followers(): HeroId[] {
    return (['bori', 'ruru', 'nabi'] as HeroId[]).filter((h) => this.save.party.includes(h) && this.stage.actors[h]);
  }

  place(x: number, y: number): void {
    const p = this.stage.actors[this.player];
    if (!p) return;
    p.x = x;
    p.y = y;
    this.save.x = x;
    this.save.y = y;
    this.trail = [];
    for (const h of this.followers()) {
      const a = this.stage.actors[h];
      a.x = x;
      a.y = y;
      a.moving = false;
    }
  }

  face(dir: Facing): void {
    const p = this.stage.actors[this.player];
    if (p) p.dir = dir;
  }

  // ───────── 방에 놓인 것

  private cond(t: { when?: string; unless?: string }): boolean {
    if (t.when && !this.flags[t.when]) return false;
    if (t.unless && this.flags[t.unless]) return false;
    return true;
  }

  hasHero(h: HeroId): boolean {
    return this.save.party.includes(h) && this.player === 'toby';
  }

  /** 지금 보이는 것들 (모은 조각 · 놓인 다리 · 불빛 없는 어둠 속은 뺀다) */
  things(): Thing[] {
    const m = this.wandering;
    const extra: Thing[] = m?.explore
      ? [
          ...this.threads().filter((th) => !this.flags[th.id]),
          ...(m.explore.looks ?? []).map((l, i): Thing => ({ kind: 'spot', id: `look_${m.id}_${i}`, at: l.at, scene: l.text })),
        ]
      : [];
    return [...extra, ...this.room.things.filter((t) => {
      if (!this.cond(t as { when?: string; unless?: string })) return false;
      if (t.kind === 'memory') return !this.flags[`mem_${t.id}`] && (!t.dark || this.hasHero('nabi'));
      if (t.kind === 'star') return !this.flags[`star_${t.id}`] && (!t.dark || this.hasHero('nabi'));
      if (t.kind === 'gap') return !this.flags[`gap_${t.id}`];
      return true;
    })];
  }

  blockAt(id: string): [number, number] {
    const b = this.save.blocks[id];
    if (b) return b;
    const t = this.room.things.find((x) => x.id === id && x.kind === 'block');
    return t && t.kind === 'block' ? [t.at[0], t.at[1]] : [-1, -1];
  }

  private thingPos(t: Thing): { x: number; y: number } {
    if (t.kind === 'block') {
      const [bx, by] = this.blockAt(t.id);
      return { x: px(bx), y: px(by) };
    }
    if (t.kind === 'trigger') return { x: px(t.rect[0]), y: px(t.rect[1]) };
    return { x: px(t.at[0]), y: px(t.at[1]) };
  }

  /** 기억 조각: 이 방에서 모은 수 / 모두 */
  memories(): { got: number; total: number } {
    const ms = this.room.things.filter((t) => t.kind === 'memory');
    return { got: ms.filter((m) => this.flags[`mem_${m.id}`]).length, total: ms.length };
  }

  private bridged(tx: number, ty: number): boolean {
    for (const t of this.room.things) if (t.kind === 'gap' && this.flags[`gap_${t.id}`] && t.tiles.some((p) => p[0] === tx && p[1] === ty)) return true;
    return false;
  }

  private blockOn(tx: number, ty: number, except?: string): boolean {
    for (const t of this.room.things) {
      if (t.kind !== 'block' || t.id === except) continue;
      const [bx, by] = this.blockAt(t.id);
      if (bx === tx && by === ty) return true;
    }
    return false;
  }

  /** 이 칸에 놓인 물건 (기억 조각 · 종이별 · 기억의 문 · 인물 · 살펴볼 곳) */
  private thingOn(x: number, y: number, except: string): boolean {
    return this.things().some((t) => t.id !== except && t.kind !== 'trigger' && t.kind !== 'block' && t.kind !== 'gap' && t.kind !== 'dark' && t.at[0] === x && t.at[1] === y);
  }

  /** 땅이 막혔나 (덩어리는 빼고) */
  private groundSolid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.room.w || ty >= this.room.h) return true;
    return isSolidChar(this.room.tiles[ty][tx]) && !this.bridged(tx, ty);
  }

  solid(tx: number, ty: number): boolean {
    return this.groundSolid(tx, ty) || this.blockOn(tx, ty);
  }

  // ───────── 대본

  run(cmds: Cmd[]): void {
    if (this.runner) this.queue.push(cmds);
    else this.runner = new Runner(cmds);
  }

  private applyChapter(n: number): void {
    const ch = this.data.chapters.find((c) => c.n === n);
    if (!ch) return;
    this.save.chapter = n;
    this.save.party = [...ch.party];
    this.save.wind = ch.wind;
    this.player = 'toby';
    this.goRoom(ch.room, ch.start);
    this.stage.tone = 'now';
    this.stage.goal = null;
    this.run(ch.intro);
  }

  /** 기억 장면을 감싼다: 하얗게 → 기억 방 (세피아) → 하얗게 → 원래 자리 */
  private memoryScene(t: Extract<Thing, { kind: 'memory' }>): Cmd[] {
    const p = this.stage.actors[this.player];
    const back: Pt = [(p.x - TILE / 2) / TILE, (p.y - TILE / 2) / TILE];
    const setup = new Set(['room', 'show', 'pose', 'face', 'tone', 'music', 'cam', 'control', 'goal', 'item', 'carry', 'prop']);
    let k = 0;
    while (k < t.scene.length && setup.has(t.scene[k].t)) k++;
    const music = this.room.music ?? this.stage.music;
    const goal = this.stage.goal;
    const head: Cmd[] = [
      { t: 'bars', on: true },
      { t: 'sfx', name: 'memory' },
      { t: 'fade', to: 1, s: 0.9, color: 'white' },
      { t: 'tone', v: 'memory' },
      ...t.scene.slice(0, k),
      { t: 'fade', to: 0, s: 1.2 },
    ];
    const body = t.scene.slice(k);
    // 직접 움직이는 기억: @control 뒤에서 잠시 멈췄다가, 이 기억의 끝 깃발(<id>_end)이 서면 마무리
    const ctl = body.findIndex((c) => c.t === 'control' && c.who !== 'toby');
    const tail: Cmd[] = [
      { t: 'fade', to: 1, s: 1, color: 'white' },
      { t: 'goal', text: null },
      { t: 'room', id: this.room.id, at: back, dir: p.dir },
      { t: 'goal', text: goal },
      { t: 'tone', v: 'now' },
      { t: 'music', track: music },
      { t: 'flag', name: `mem_${t.id}` },
      { t: 'album', id: t.id },
      { t: 'fade', to: 0, s: 0.9 },
      ...(t.after ?? []),
      { t: 'bars', on: false },
    ];
    // 걷는 기억: 멈춘 순간에 장난감들이 서고, 실을 다 모으면(<id>_threads) 장면이 흐른다
    if (t.explore) {
      this.walkMem = t;
      this.resume = { flag: `${t.id}_threads`, cmds: [{ t: 'sfx', name: 'chime' }, { t: 'say', who: '', text: '흩어져 있던 실이 하나로 이어졌다. 멈춰 있던 순간이 흐르기 시작한다.' }, { t: 'fade', to: 1, s: 0.8, color: 'white' }, { t: 'wander', mem: null }, { t: 'fade', to: 0, s: 1.2 }, ...body, ...tail] };
      return [...head.slice(0, -1), { t: 'wander', mem: t.id }, head[head.length - 1], { t: 'bars', on: false }, ...(t.explore.intro ?? [])];
    }
    if (ctl >= 0) {
      this.resume = { flag: `${t.id}_end`, cmds: tail };
      return [...head, ...body.slice(0, ctl + 1), { t: 'bars', on: false }];
    }
    return [...head, ...body, ...tail];
  }

  private interact(t: Thing): void {
    switch (t.kind) {
      case 'spot':
      case 'npc':
        this.run([...t.scene, { t: 'flag', name: `seen_${t.id}` }]);
        break;
      case 'memory':
        this.run(this.memoryScene(t));
        break;
      case 'star': {
        this.flags[`star_${t.id}`] = true;
        const n = Object.keys(this.flags).filter((k) => k.startsWith('star_') && this.flags[k]).length;
        this.run([{ t: 'sfx', name: 'star' }, { t: 'say', who: '', text: `${t.text}  (종이별 ${n}개)` }]);
        break;
      }
      case 'block':
        this.push(t);
        break;
      case 'gap':
        if (this.hasHero('ruru')) {
          this.flags[`gap_${t.id}`] = true;
          this.run([{ t: 'emote', who: 'ruru', e: '♪' }, { t: 'sfx', name: 'rope' }, { t: 'say', who: 'ruru', text: '밧줄 간다~! 이 정도 틈은 누워서 떡 먹기지.' }]);
        } else this.run([{ t: 'say', who: 'toby', text: '건너기엔 너무 멀어. 밧줄이 있으면 좋을 텐데…' }]);
        break;
      case 'link':
        if (this.memories().got >= this.memories().total) this.run(t.scene);
        else this.run(t.locked);
        break;
      case 'thread': {
        this.flags[t.id] = true;
        const c = this.threadCount();
        const all = c && c.got >= c.total && this.wandering ? [{ t: 'flag' as const, name: `${this.wandering.id}_threads` }] : [];
        this.run([{ t: 'sfx', name: 'star' }, ...t.text, ...all]);
        break;
      }
      case 'trigger':
      case 'dark':
        break;
    }
  }

  private push(t: Extract<Thing, { kind: 'block' }>): void {
    if (!this.hasHero('bori')) {
      this.run([{ t: 'say', who: 'toby', text: '끙… 꿈쩍도 안 해. 힘센 보리라면 밀 수 있을 텐데.' }]);
      return;
    }
    const p = this.stage.actors.toby;
    const [bx, by] = this.blockAt(t.id);
    // 바라보는 쪽 (덩어리가 있는 쪽으로 가장 가까운 네 방향)
    const dx = px(bx) - p.x;
    const dy = px(by) - p.y;
    const [sx, sy] = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    // 막힐 때까지 미끄러진다 (벽 · 낭떠러지 · 다른 덩어리 · 놓인 물건 앞에서 멈춤)
    const free = (x: number, y: number) => !this.groundSolid(x, y) && !this.blockOn(x, y, t.id) && !this.thingOn(x, y, t.id);
    let nx = bx;
    let ny = by;
    while (free(nx + sx, ny + sy)) {
      nx += sx;
      ny += sy;
    }
    if (nx === bx && ny === by) {
      this.run([{ t: 'emote', who: 'bori', e: 'sweat' }, { t: 'say', who: 'bori', text: '으라차… 저쪽은 막혀서 안 밀려.' }]);
      return;
    }
    this.save.blocks[t.id] = [nx, ny];
    this.run([{ t: 'sfx', name: 'push' }, { t: 'emote', who: 'bori', e: '!' }]);
  }

  // ───────── 발소리 (얼음 땡)

  private calmTime(): number {
    const s = this.room?.steps;
    if (!s) return 0;
    return s.calm[0] + this.rng.next() * (s.calm[1] - s.calm[0]);
  }

  private stepsOn(): boolean {
    const s = this.room.steps;
    if (!s || this.player !== 'toby') return false;
    if (s.when && !this.flags[s.when]) return false;
    if (s.until && this.flags[s.until]) return false;
    return true;
  }

  private updateSteps(dt: number, moving: boolean): boolean {
    const s = this.room.steps!;
    const st = this.steps;
    const p = this.stage.actors.toby;
    if (st.phase === 'calm') {
      st.t -= dt;
      if (st.t <= 0) {
        st.phase = 'warn';
        st.t = s.warn;
        this.stage.sfx.push('steps');
        if (p) p.emote = { e: '!', life: s.warn };
      }
    } else if (st.phase === 'warn') {
      st.t -= dt;
      if (st.t <= 0) {
        st.phase = 'hold';
        st.t = s.hold;
        this.stage.sfx.push('freeze');
      }
    } else {
      if (moving) {
        st.caught++;
        st.phase = 'calm';
        st.t = this.calmTime();
        const lines = s.caught[(st.caught - 1) % Math.max(1, s.caught.length)] ?? [];
        const cp: Pt = [(this.checkpoint.x - TILE / 2) / TILE, (this.checkpoint.y - TILE / 2) / TILE];
        this.run([{ t: 'shake', s: 0.3 }, { t: 'sfx', name: 'caught' }, { t: 'emote', who: 'toby', e: '!' }, ...lines, { t: 'fade', to: 1, s: 0.5 }, { t: 'room', id: this.room.id, at: cp }, { t: 'fade', to: 0, s: 0.5 }]);
        return true;
      }
      st.t -= dt;
      if (st.t <= 0) {
        st.phase = 'calm';
        st.t = this.calmTime();
        if (p) this.checkpoint = { x: p.x, y: p.y };
        this.stage.sfx.push('safe');
      }
    }
    return false;
  }

  // ───────── 한 걸음

  step(dt: number, inp: AdvInput): void {
    this.save.time += dt;
    const fast = inp.hold && !this.mini;
    if (this.mini) {
      this.mini.step(dt, { act: inp.act, hold: inp.hold, dir: inp.dir });
      this.stage.sfx.push(...this.mini.sfx.splice(0));
      if (this.mini.done) this.mini = null;
    } else if (this.runner) {
      const ch = this.stage.choice;
      if (ch) {
        if (inp.dir === 'up') ch.sel = Math.max(0, ch.sel - 1);
        if (inp.dir === 'down') ch.sel = Math.min(ch.options.length - 1, ch.sel + 1);
        if (inp.act) ch.picked = ch.sel;
      } else if (inp.act) this.runner.advance(this);
    } else {
      this.explore(dt, inp);
    }
    if (this.runner) {
      this.runner.update(this, dt, fast);
      if (this.runner.done) this.endRunner();
    }
    updateStage(this.stage, fast && this.runner ? dt * FAST : dt);
    this.prompt = this.runner || this.mini ? null : this.nearest();
  }

  private endRunner(): void {
    this.runner = null;
    if (this.pending !== null) {
      const n = this.pending;
      this.pending = null;
      this.queue = [];
      this.applyChapter(n);
      return;
    }
    if (this.resume && this.flags[this.resume.flag]) {
      const cmds = this.resume.cmds;
      this.resume = null;
      this.runner = new Runner([{ t: 'bars', on: true }, ...cmds]);
      return;
    }
    const next = this.queue.shift();
    if (next) this.runner = new Runner(next);
  }

  private explore(dt: number, inp: AdvInput): void {
    const p = this.stage.actors[this.player];
    if (!p) return;
    let mx = inp.move.x;
    let my = inp.move.y;
    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    const moving = len > 0.1;
    if (this.stepsOn() && this.updateSteps(dt, moving)) return;
    if (inp.act) {
      const t = this.nearest();
      if (t) {
        this.interact(t);
        return;
      }
    }
    const scale = this.room.scale;
    if (moving) {
      const sp = SPEED[scale] * dt;
      this.moveActor(p, mx * sp, my * sp, RADIUS[scale]);
      p.dir = facingOf(mx, my);
      p.moving = true;
      p.walkT += dt;
    } else p.moving = false;
    this.save.x = p.x;
    this.save.y = p.y;
    this.follow(dt);
    this.checkTriggers();
    this.syncNpcs();
  }

  private moveActor(p: { x: number; y: number }, dx: number, dy: number, r: number): void {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.8)));
    for (let i = 0; i < steps; i++) {
      p.x += dx / steps;
      p.y += dy / steps;
      const x0 = Math.floor((p.x - r) / TILE);
      const x1 = Math.floor((p.x + r) / TILE);
      const y0 = Math.floor((p.y - r) / TILE);
      const y1 = Math.floor((p.y + r) / TILE);
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++) {
          if (!this.solid(tx, ty)) continue;
          const q = pushOutOfRect(p, r, { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE });
          p.x = q.x;
          p.y = q.y;
        }
    }
  }

  /** 동료는 토비의 발자국을 따라 */
  private follow(dt: number): void {
    if (this.player !== 'toby') return;
    const p = this.stage.actors.toby;
    const head = this.trail[0];
    if (!head) this.trail.unshift({ x: p.x, y: p.y });
    else {
      const d = Math.hypot(p.x - head.x, p.y - head.y);
      if (d >= TRAIL_STEP) {
        const n = Math.floor(d / TRAIL_STEP);
        for (let i = 1; i <= n; i++) this.trail.unshift({ x: head.x + ((p.x - head.x) * i * TRAIL_STEP) / d, y: head.y + ((p.y - head.y) * i * TRAIL_STEP) / d });
      }
    }
    const fs = this.followers();
    const keep = (fs.length + 1) * TRAIL_GAP + 2;
    if (this.trail.length > keep) this.trail.length = keep;
    fs.forEach((h, i) => {
      const a = this.stage.actors[h];
      const spot = this.trail[Math.min(this.trail.length - 1, (i + 1) * TRAIL_GAP)];
      if (!spot || this.trail.length <= (i + 1) * TRAIL_GAP) {
        a.moving = false;
        return;
      }
      const dx = spot.x - a.x;
      const dy = spot.y - a.y;
      if (Math.hypot(dx, dy) > 0.3) {
        a.dir = facingOf(dx, dy);
        this.still.set(h, 0);
      } else this.still.set(h, (this.still.get(h) ?? 1) + dt);
      a.moving = (this.still.get(h) ?? 1) < 0.15;
      if (a.moving) a.walkT += dt;
      a.x = spot.x;
      a.y = spot.y;
    });
  }

  private checkTriggers(): void {
    const p = this.stage.actors[this.player];
    for (const t of this.room.things) {
      if (t.kind !== 'trigger' || !this.cond(t)) continue;
      if (!t.repeat && this.flags[`trig_${t.id}`]) continue;
      const [x, y, w, h] = t.rect;
      if (p.x < x * TILE || p.x >= (x + w) * TILE || p.y < y * TILE || p.y >= (y + h) * TILE) continue;
      if (!t.repeat) this.flags[`trig_${t.id}`] = true;
      this.run(t.scene);
      return;
    }
  }

  private nearest(): Thing | null {
    const p = this.stage.actors[this.player];
    if (!p) return null;
    const f = FACE_VEC[p.dir];
    const fx = p.x + f[0] * 10;
    const fy = p.y + f[1] * 10;
    let best: Thing | null = null;
    let bd = REACH;
    for (const t of this.things()) {
      if (!INTERACTIVE.has(t.kind)) continue;
      const q = this.thingPos(t);
      const r = t.kind === 'spot' && t.r ? t.r : REACH;
      const d = Math.hypot(q.x - fx, q.y - fy);
      if (d <= Math.max(r, bd) && d <= r && (best === null || d < bd)) {
        best = t;
        bd = d;
      }
    }
    return best;
  }
}

const D = Math.SQRT1_2;
export const FACE_VEC: Record<Facing, [number, number]> = {
  down: [0, 1],
  up: [0, -1],
  left: [-1, 0],
  right: [1, 0],
  downRight: [D, D],
  downLeft: [-D, D],
  upRight: [D, -D],
  upLeft: [-D, -D],
};
