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
import { ACT_S, addActor, approachVel, facingOf, gaitScale, newStage, px, SLIDE_S, stepSize, TOAST_S, updateStage } from './stage.ts';
import { GESTURE_S, interactGesture, withGesture } from './gestures.ts';
import { failCmds, type Fail } from './barks.ts';
import { DONE_LINE, findPath, GREET, HOME_DIR, HOME_POSE, IDLE_ACTS, IDLE_GAP, isPal, palTalk, pickHangouts, PALS, type PalId, type PalNeeds } from './pals.ts';
import { dir4Of, DIR4_VEC, flowCells, gearSpin, inRect, noteSfx, rectCells, sightCells, slideDest, traceBeam } from './mech.ts';
import type { Chapter, Cmd, Dir4, Facing, Pt, RoomDef, Stage, Thing, WindDef } from './types.ts';

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
  /** 밀어 놓은 덩어리 · 밀 물건(push) 자리 */
  blocks: Record<string, [number, number]>;
  /** 물건마다 숫자 상태 (손거울 방향 …) */
  marks?: Record<string, number>;
  /** 불러서 함께 다니는 동료 (나머지는 방마다 자기 자리에서 지낸다) */
  with?: HeroId[];
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

/** 토비와 동료가 걸어 다니는 방 (장난감 크기 방 · 장난감이 걷는 사람 크기 장 방) */
export function toyWalk(r: RoomDef): boolean {
  return r.scale === 'toy' || !!r.toys;
}

export const NO_INPUT: AdvInput = { move: { x: 0, y: 0 }, act: false, hold: false, dir: null };

/** 걸음 (초당 픽셀): 장난감 · 사람 */
export const SPEED = { toy: 92, human: 74 };
/** 기억으로 들어갈 때 카메라가 물건 쪽으로 가는 시간 · 기억 속 첫 소리가 흰빛보다 먼저 들리는 시간 · 나와서 물건을 비추는 시간 */
const MEM_PAN_S = 0.6;
const MEM_LEAD_S = 0.1;
const MEM_HOLD_S = 0.8;
/** 밀 때 보리가 힘을 주는 시간 (그 뒤에 물건이 미끄러진다) */
const SHOVE_WINDUP = 0.5;
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

const INTERACTIVE = new Set(['spot', 'memory', 'keepsake', 'star', 'npc', 'block', 'push', 'gap', 'link', 'thread', 'windup', 'climb', 'pull', 'part', 'assemble', 'lamp', 'mirror']);
/** 놓인 칸을 차지하지 않는 것 (밀 물건이 그 칸으로 갈 수 있음) */
const NO_BODY = new Set(['trigger', 'block', 'push', 'pad', 'gap', 'dark', 'seq', 'chase', 'watcher', 'charge', 'beam', 'gears', 'flow']);
/** 숨바꼭질: 들키기까지 시야 안에 머무는 시간 (초) · 기본 시야 반지름 · 반각 · 순찰 걸음 (토비 걸음에 곱) */
const WATCH_GRACE = 0.8;
const WATCH_R = 4;
const WATCH_ARC = 40;
const PATROL_SPEED = 0.7;
/** 바람: 기본 미는 힘 (칸/초) · 예고 시간 (초) */
const WIND_FORCE = 6;
const WIND_WARN = 0.8;
/** 젖은 타일에서 미끄러지는 빠르기 (px/초) */
const SLIP_SPEED = 150;
/** 무거운 조각을 들면 걸음이 이만큼 */
const HEAVY_SPEED = 0.7;
/** 등불 채우는 곳의 기본 반지름 (칸) · 빠르기 (칸/초) · 켜진 등 곁에서 차는 빠르기 */
const CHARGE_R = 1;
const CHARGE_RATE = 2;
/** 시야는 가리지 않는 막힌 칸 (낭떠러지 · 물) */
const SEE_OVER = new Set(['v', '~']);
const NAME: Record<HeroId, string> = { toby: '토비', bori: '보리', ruru: '루루', nabi: '나비' };
const COUNT_WORDS = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
/** 쫓아가기: 도망치는 인물은 조종 인물보다 이만큼 빠르다 · 기본 잡는 거리 (칸) */
const CHASE_SPEED = 1.15;
/** 동료가 자기 자리로 걸어가는 빠르기 (토비 걸음에 곱) · 따라잡는 최대 빠르기 */
const PAL_SPEED = 0.8;
const CATCH_SPEED = 1.9;
/** 토비가 이만큼(칸) 다가오면 돌아보고, 이만큼 멀어지면 다시 제 쪽을 본다 */
const GREET_NEAR = 2.2;
const GREET_FAR = 4;
const CHASE_NEAR = 1.2;

/** 기억 (구슬 memory · 물건 keepsake): 살펴보면 기억 장면, mem_<id> 깃발 · 앨범 */
export type MemThing = Extract<Thing, { kind: 'memory' | 'keepsake' }>;
export function isMemory(t: Thing): t is MemThing {
  return t.kind === 'memory' || t.kind === 'keepsake';
}

/** 그 물건이 놓인 칸 (seq 는 첫 발판, chase 는 첫 점) */
function anchor(t: Thing): Pt {
  if (t.kind === 'trigger') return [t.rect[0], t.rect[1]];
  if (t.kind === 'seq') return t.keys[0]?.at ?? [-1, -1];
  if (t.kind === 'chase') return t.path[0] ?? [-1, -1];
  return t.at;
}

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
  private walkMem: MemThing | null = null;
  /** 지금 걷고 있는 기억 */
  wandering: MemThing | null = null;
  /** 발판 순서 퍼즐: 맞게 밟은 발판 (keys 번호) · 지금 서 있는 발판 */
  private seqs = new Map<string, { pressed: number[]; on: number }>();
  /** 쫓아가기: 따라잡은 수 */
  private chases = new Map<string, number>();
  private rng: Rng = createRng(7);
  /** 동료가 이 방에서 지내는 자리 */
  private homes = new Map<PalId, { at: Pt; pose: string; dir: Facing; talk?: Cmd[] }>();
  /** 방마다 고른 기본 자리 (다시 와도 같은 자리) */
  private homeCache = new Map<string, Partial<Record<PalId, Pt>>>();
  /** 자리로 걸어가는 길 (픽셀 점) */
  private palPath = new Map<PalId, { x: number; y: number }[]>();
  /** 자리에서의 몸짓 시계 · 몇 번째 몸짓 */
  private palIdle = new Map<PalId, { t: number; n: number }>();
  /** 이 방에서 토비를 반긴 동료 · 토비 쪽을 보고 있는 동료 */
  private greeted = new Set<PalId>();
  private looking = new Set<PalId>();
  /** 동료와 말한 횟수 */
  private talkN = new Map<PalId, number>();
  /** 실패 종류마다 몇 번 실패했나 (대사 돌려 쓰기) */
  private fails = new Map<Fail, number>();
  /** 기억 장면으로 나갔다 돌아올 때 되살릴 동료 자리 */
  private parked: { room: string; at: Partial<Record<PalId, { x: number; y: number; dir: Facing; pose: string; elev?: number }>> } | null = null;
  private built = new Map<string, RoomDef>();
  /** 조종하는 인물의 지금 속도 (px/초): 가속 · 감속 */
  private vel = { x: 0, y: 0 };
  /** 마지막으로 보인 살펴보기 표시 */
  private shownPrompt: string | null = null;
  /** 숨바꼭질: 지켜보는 이마다 박자 시계 · 지금 박자 · 들킬 뻔한 정도(초) · 시야 안에서 움직인 거리(px) · 보이는 중 */
  private watch = new Map<string, { t: number; step: number; alert: number; moved: number; seen: boolean }>();
  /** 이 방에서 들킨 수 (같은 방으로 돌아와도 남는다) */
  private watchCaught = new Map<string, number>();
  /** 협동 당기기: 당긴 수 */
  private tugs = new Map<string, number>();
  /** 나비 등불 반지름 (방마다, 칸) */
  private lantern = new Map<string, number>();
  /** 바람마다 시계 · 지난 틱에 불고 있었나 */
  private winds = new Map<string, { t: number; was: boolean }>();
  /** 젖은 타일에서 미끄러져 가는 곳 (px) · 지난 틱의 칸 */
  private sliding: { x: number; y: number } | null = null;
  private lastTile: Pt = [-1, -1];
  /** 물길 계산 (밀 물건 자리 · 깃발이 같으면 다시 셈하지 않음) */
  private flowMemo: { sig: string; wet: Map<string, Set<string>> } | null = null;
  /** 들킨 수를 세는 방 */
  private watchRoom = '';

  constructor(data: AdvData, save?: AdvSave) {
    this.data = data;
    if (save) save = this.locate(save);
    if (save && this.valid(save)) {
      this.save = { ...save, flags: { ...save.flags }, album: [...save.album], party: [...save.party], with: [...(save.with ?? [])], blocks: { ...save.blocks }, marks: { ...(save.marks ?? {}) } };
      this.goRoom(save.room, [(save.x - TILE / 2) / TILE, (save.y - TILE / 2) / TILE]);
    } else {
      const ch = data.chapters[0];
      this.save = { v: 1, chapter: ch.n, room: ch.room, x: px(ch.start[0]), y: px(ch.start[1]), party: [...ch.party], with: [], flags: {}, album: [], wind: ch.wind, blocks: {}, time: 0 };
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
    return { ...this.save, ch: ch?.room, room: this.room.id, x: p?.x ?? this.save.x, y: p?.y ?? this.save.y, flags: { ...this.save.flags }, album: [...this.save.album], party: [...this.save.party], with: this.withMe(), blocks: { ...this.save.blocks }, marks: { ...(this.save.marks ?? {}) } };
  }

  /** 저장해도 되는 때 (대본 · 놀이 · 기억 속이 아닐 때) */
  canSave(): boolean {
    return !this.runner && !this.mini && !this.resume && toyWalk(this.room) && this.player === 'toby';
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
    if (this.room && this.free()) this.park();
    this.room = r;
    this.save.room = id;
    this.stage.actors = {};
    this.stage.props = {};
    for (const k of r.keepProps ?? []) if (this.flags[k.flag]) this.stage.props[k.key] = { state: k.state, life: Infinity };
    this.stage.items = {};
    this.stage.cam = null;
    const x = at ? px(at[0]) : px(r.start.x);
    const y = at ? px(at[1]) : px(r.start.y);
    this.save.x = x;
    this.save.y = y;
    if (toyWalk(r)) {
      this.player = 'toby';
      this.syncParty();
      if (dir) this.stage.actors.toby.dir = dir;
    }
    this.trail = [];
    if (toyWalk(r)) this.spreadParty();
    this.setupHomes();
    this.unpark(id);
    this.checkpoint = { x, y };
    this.steps = { phase: 'calm', t: this.calmTime(), caught: this.steps.caught };
    if (r.music) this.stage.music = r.music;
    this.seqs.clear();
    this.chases.clear();
    if (id !== this.watchRoom) this.watchCaught.clear();
    this.watchRoom = id;
    this.watch.clear();
    this.winds.clear();
    this.sliding = null;
    this.lastTile = [Math.floor(x / TILE), Math.floor(y / TILE)];
    this.syncNpcs();
    this.syncChases();
    this.syncWatchers();
    this.syncHeld();
    this.syncElev();
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
    // 밤의 시계: 이삿날 밤의 시각을 부제 끝에 (1장 23:10 → 새벽)
    const sub = ch?.sub ?? '';
    return { text: ch?.title ?? '', sub: ch?.clock ? `${sub}${sub ? '  ·  ' : ''}${ch.clock}` : sub };
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
    // 깨어난 그 자리가 자기 자리 (방 자리표가 있으면 그쪽)
    if (a && isPal(who) && this.free() && !this.room.hangouts?.[who]) {
      this.homes.set(who, { at: [Math.floor(a.x / TILE), Math.floor(a.y / TILE)], pose: HOME_POSE[who], dir: a.dir });
      this.palPath.delete(who);
    }
  }

  leave(who: HeroId): void {
    this.save.party = this.save.party.filter((h) => h !== who);
    this.save.with = (this.save.with ?? []).filter((h) => h !== who);
    this.syncWithFlags();
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

  /** 밀 물건을 처음 자리로, 손거울을 처음 방향으로 (되돌리기) */
  resetPush(ids: string[]): void {
    for (const id of ids) {
      delete this.save.blocks[id];
      if (this.save.marks) delete this.save.marks[id];
    }
  }

  // ───────── 동료: 자기 자리에서 지내다가, 부르면 따라온다

  /** 동료가 자기 자리에서 지내는 방인가 (장난감이 걷는 방 · 걷는 기억 밖 · 토비를 조종 중) */
  free(): boolean {
    return !!this.room && toyWalk(this.room) && !this.wandering && this.player === 'toby';
  }

  /** 불러서 함께 다니는 동료 (보리 · 루루 · 나비 차례) */
  withMe(): PalId[] {
    const w = this.save.with ?? [];
    return PALS.filter((h) => w.includes(h) && this.save.party.includes(h));
  }

  /** 이 방에서 그 동료의 자리 (칸) */
  palHome(h: PalId): Pt | null {
    return this.homes.get(h)?.at ?? null;
  }

  call(who: HeroId | 'all', on: boolean): void {
    const ids = who === 'all' ? [...PALS] : isPal(who) ? [who] : [];
    const w = new Set(this.save.with ?? []);
    for (const h of ids) {
      if (on && !this.save.party.includes(h)) continue;
      if (on) w.add(h);
      else w.delete(h);
      this.palPath.delete(h);
      const a = this.stage.actors[h];
      if (a && on) {
        delete a.act;
        a.pose = 'idle';
        a.seat = false;
      }
    }
    this.save.with = PALS.filter((h) => w.has(h));
    this.syncWithFlags();
  }

  /** 대본에서 쓰라고: with_bori · with_ruru · with_nabi 깃발 (불러 와 함께 다니는 중) */
  private syncWithFlags(): void {
    const w = this.withMe();
    for (const h of PALS) {
      if (w.includes(h)) this.flags[`with_${h}`] = true;
      else delete this.flags[`with_${h}`];
    }
  }

  /** 동료가 걸을 수 있는 칸 (같은 높이 · 덩어리 없음 · 가구 밑은 장난감이라 지나감) */
  private palOpen(x: number, y: number, e: number, who?: PalId): boolean {
    if (x < 0 || y < 0 || x >= this.room.w || y >= this.room.h) return false;
    if (this.blockOn(x, y)) return false;
    if (who === 'bori' && this.lowAt(x, y)) return false;
    if (this.room.elev && this.elevAt(x, y) !== e) return false;
    if (this.room.tiles[y][x] === 'U') return true;
    return !this.groundSolid(x, y);
  }

  /** 이 방의 동료 자리: 방 자리표, 없으면 들어온 칸에서 골라 둔다 (다시 와도 같은 자리) */
  private setupHomes(): void {
    this.homes.clear();
    this.palPath.clear();
    this.palIdle.clear();
    this.greeted.clear();
    this.looking.clear();
    if (!this.free()) return;
    const r = this.room;
    let auto = this.homeCache.get(r.id);
    if (!auto) {
      const p = this.stage.actors.toby;
      const entry: Pt = p ? [Math.floor(p.x / TILE), Math.floor(p.y / TILE)] : [r.start.x, r.start.y];
      const e = this.elevAt(entry[0], entry[1]);
      const skip = new Set(['trigger', 'dark', 'chase']);
      const avoid: Pt[] = [
        ...r.things.flatMap((t): Pt[] => (skip.has(t.kind) ? [] : t.kind === 'seq' ? t.keys.map((k) => k.at) : [anchor(t)])),
        ...PALS.flatMap((h) => (r.hangouts?.[h] ? [r.hangouts[h]!.at] : [])),
      ];
      const want = PALS.filter((h) => !r.hangouts?.[h]);
      auto = pickHangouts(want, entry, (x, y) => this.palOpen(x, y, e) && r.tiles[y][x] !== 'D', r.w, r.h, avoid);
      this.homeCache.set(r.id, auto);
    }
    for (const h of PALS) {
      const def = r.hangouts?.[h];
      const at = def?.at ?? auto[h];
      if (at) this.homes.set(h, { at, pose: def?.pose ?? HOME_POSE[h], dir: def?.dir ?? HOME_DIR, talk: def?.talk });
    }
  }

  /** 기억 장면으로 나가기 전에 동료들이 있던 자리를 적어 둔다 */
  private park(): void {
    const at: NonNullable<typeof this.parked>['at'] = {};
    const w = this.withMe();
    for (const h of PALS) {
      const a = this.stage.actors[h];
      if (a && !w.includes(h)) at[h] = { x: a.x, y: a.y, dir: a.dir, pose: a.act?.back ?? a.pose, elev: a.elev };
    }
    this.parked = { room: this.room.id, at };
  }

  /** 같은 방으로 돌아왔으면 동료들을 있던 자리에 */
  private unpark(id: string): void {
    const pk = this.parked;
    if (!pk || pk.room !== id || !this.free()) return;
    this.parked = null;
    for (const h of PALS) {
      const a = this.stage.actors[h];
      const q = pk.at[h];
      if (!a || !q || this.withMe().includes(h)) continue;
      Object.assign(a, { x: q.x, y: q.y, dir: q.dir, pose: q.pose, elev: q.elev, moving: false });
      // 자기 자리에 앉아 있던 동료는 반긴 셈 (다시 돌아볼 필요 없음)
      this.greeted.add(h);
    }
  }

  /** 부르지 않은 동료: 자기 자리로 걸어가 머물고, 가끔 몸짓하고, 토비가 다가오면 돌아본다 */
  private roam(dt: number): void {
    if (!this.free()) return;
    const p = this.stage.actors.toby;
    const w = this.withMe();
    for (const h of PALS) {
      const a = this.stage.actors[h];
      const home = this.homes.get(h);
      if (!a || !home || !p || w.includes(h) || !this.save.party.includes(h) || a.goal) continue;
      const hx = px(home.at[0]);
      const hy = px(home.at[1]);
      if (Math.hypot(a.x - hx, a.y - hy) > 0.5) {
        let path = this.palPath.get(h);
        if (!path) {
          const from: Pt = [Math.floor(a.x / TILE), Math.floor(a.y / TILE)];
          const tiles = findPath(from, home.at, (x, y) => this.palOpen(x, y, this.elevAt(from[0], from[1]), h), this.room.w, this.room.h);
          path = tiles ? tiles.map(([x, y]) => ({ x: px(x), y: px(y) })) : [];
          if (!path.length) path.push({ x: hx, y: hy });
          if (!tiles) Object.assign(a, { x: hx, y: hy });
          this.palPath.set(h, path);
          delete a.act;
          a.pose = 'idle';
          a.seat = false;
        }
        let budget = SPEED.toy * PAL_SPEED * dt;
        while (budget > 0 && path.length) {
          const q = path[0];
          const dx = q.x - a.x;
          const dy = q.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.01) a.dir = facingOf(dx, dy);
          if (d <= budget) {
            a.x = q.x;
            a.y = q.y;
            budget -= d;
            path.shift();
          } else {
            a.x += (dx / d) * budget;
            a.y += (dy / d) * budget;
            budget = 0;
          }
        }
        a.moving = true;
        a.walkT += dt;
        if (this.room.elev) a.elev = this.elevAt(Math.floor(a.x / TILE), Math.floor(a.y / TILE));
        if (path.length) continue;
        Object.assign(a, { x: hx, y: hy, moving: false, pose: home.pose, dir: home.dir });
        this.palPath.delete(h);
        continue;
      }
      // 자리에 있다
      this.palPath.delete(h);
      if (a.moving) a.moving = false;
      if (!a.act && a.pose === 'idle' && home.pose !== 'idle') a.pose = home.pose;
      const near = Math.hypot(p.x - a.x, p.y - a.y);
      if (near < TILE * GREET_NEAR) {
        a.dir = facingOf(p.x - a.x, p.y - a.y);
        this.looking.add(h);
        if (!this.greeted.has(h)) {
          this.greeted.add(h);
          a.emote = { e: GREET[h], life: 1.2 };
        }
      } else if (this.looking.has(h) && near > TILE * GREET_FAR) {
        this.looking.delete(h);
        a.dir = home.dir;
      }
      const it = this.palIdle.get(h) ?? { t: IDLE_GAP[h][0] * 0.5, n: 0 };
      this.palIdle.set(h, it);
      if (a.act) continue;
      it.t += dt;
      const [g0, g1] = IDLE_GAP[h];
      if (it.t >= g0 + ((it.n * 7) % 5) * (g1 / 4)) {
        const name = IDLE_ACTS[h][it.n % IDLE_ACTS[h].length];
        a.act = { life: ACT_S[name] ?? 1, back: home.pose };
        a.pose = name;
        it.n++;
        it.t = 0;
      }
    }
  }

  /** 바로 한 번 하는 몸짓 (대본 밖: 발판 · 쫓아가기) */
  private gesture(who: string, name: string): void {
    const a = this.stage.actors[who];
    if (!a) return;
    a.act = { life: ACT_S[name] ?? 1, back: a.act?.back ?? a.pose };
    a.pose = name;
  }

  /** 방에 남은 일 (동료가 귀띔) */
  private palNeeds(): PalNeeds {
    const things = this.room.things;
    const open = (id: string) => things.some((pd) => pd.kind === 'pad' && pd.accepts.includes(id) && !this.flags[pd.flag]);
    const pushes = things.filter((t): t is Extract<Thing, { kind: 'push' }> => t.kind === 'push' && open(t.id));
    return {
      push: pushes.length > 0,
      heavy: pushes.some((t) => (t.weight ?? 1) >= 2),
      high: things.some((t) => (t.kind === 'climb' && t.who === 'ruru' && this.cond(t)) || (t.kind === 'gap' && !this.flags[`gap_${t.id}`])),
      dark: things.some((t) => (isMemory(t) && t.dark && !this.flags[`mem_${t.id}`]) || (t.kind === 'star' && t.dark && !this.flags[`star_${t.id}`])),
    };
  }

  private talkPal(h: PalId): void {
    const n = this.talkN.get(h) ?? 0;
    const recent = this.recentAside(h);
    // 기억 감상을 들려준 말은 세지 않는다 (방 자리표의 첫 대사 · 잡담 차례는 그대로 남는다)
    if (!recent) this.talkN.set(h, n + 1);
    this.run(withGesture(palTalk(h, { withMe: this.withMe().includes(h), needs: this.palNeeds(), talk: this.homes.get(h)?.talk, n, recent }), this.player, 'pat'));
  }

  /** 이 방에서 본 기억 가운데 이 동료가 아직 들려주지 않은 감상 (가장 최근에 본 것부터). 들려주면 aside_<id> 깃발 */
  private recentAside(h: PalId): { name: string; text: Cmd[] } | undefined {
    let best: MemThing | null = null;
    let bi = -1;
    for (const t of this.room.things) {
      if (!isMemory(t) || t.aside?.who !== h || !this.flags[`mem_${t.id}`] || this.flags[`aside_${t.id}`]) continue;
      const i = this.save.album.lastIndexOf(t.id);
      if (i >= bi) {
        best = t;
        bi = i;
      }
    }
    if (!best?.aside) return undefined;
    return { name: best.name, text: [{ t: 'flag', name: `aside_${best.id}` }, ...best.aside.text] };
  }

  /** 같은 실패를 거듭하면 대사를 돌려 쓰고, 두 번째부터는 다른 동료가 거든다 */
  private failBark(kind: Fail): Cmd[] {
    const n = this.fails.get(kind) ?? 0;
    this.fails.set(kind, n + 1);
    return failCmds(kind, n, this.save.party);
  }

  /** 일을 마친 동료: 한마디 하고 자기 자리로 (자기 자리에서 지내는 방일 때만) */
  private doneCmds(hs: HeroId[]): Cmd[] {
    if (!this.free()) return [];
    const ps = hs.filter(isPal);
    if (!ps.length) return [];
    return [{ t: 'say', who: ps[0], text: DONE_LINE[ps[0]] }, ...ps.map((h): Cmd => ({ t: 'call', who: h, on: false }))];
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
    if ((!toyWalk(this.room) && !this.wandering) || this.player !== 'toby') return;
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
    const fs = (['bori', 'ruru', 'nabi'] as HeroId[]).filter((h) => this.save.party.includes(h) && this.stage.actors[h]);
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
    const w = this.free() ? this.withMe() : null;
    return (['bori', 'ruru', 'nabi'] as HeroId[]).filter((h) => this.save.party.includes(h) && this.stage.actors[h] && (!w || w.includes(h as PalId)));
  }

  place(x: number, y: number): void {
    const p = this.stage.actors[this.player];
    if (!p) return;
    p.x = x;
    p.y = y;
    this.save.x = x;
    this.save.y = y;
    this.vel = { x: 0, y: 0 };
    this.trail = [];
    this.sliding = null;
    this.lastTile = [Math.floor(x / TILE), Math.floor(y / TILE)];
    for (const h of this.followers()) {
      const a = this.stage.actors[h];
      a.x = x;
      a.y = y;
      a.moving = false;
    }
    this.syncElev();
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
    return this.save.party.includes(h) && this.player === 'toby' && (!this.free() || this.withMe().includes(h as PalId));
  }

  /** 곁에서 도울 수 있는 동료 (자기 자리에서 지내는 방이면 불러 온 동료만) */
  private helpers(): HeroId[] {
    return this.free() ? this.withMe() : this.save.party.filter((h) => h !== 'toby');
  }

  /** 무리에는 있지만 불러 오지 않은 동료면, 토비가 「불러 와야겠다」고 한다 */
  private away(h: PalId): boolean {
    return this.free() && this.save.party.includes(h) && !this.withMe().includes(h);
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
      if (isMemory(t)) return !this.flags[`mem_${t.id}`] && (!t.dark || this.litAt(t.at));
      if (t.kind === 'star') return !this.flags[`star_${t.id}`] && (!t.dark || this.litAt(t.at));
      if (t.kind === 'part') return !this.flags[`got_${t.id}`] && (!t.dark || this.litAt(t.at));
      if (t.kind === 'gap') return !this.flags[`gap_${t.id}`];
      return true;
    })];
  }

  /** 덩어리(block) · 밀 물건(push) 의 지금 칸 */
  blockAt(id: string): [number, number] {
    const b = this.save.blocks[id];
    if (b) return b;
    const t = this.room.things.find((x) => x.id === id && (x.kind === 'block' || x.kind === 'push'));
    return t && (t.kind === 'block' || t.kind === 'push') ? [t.at[0], t.at[1]] : [-1, -1];
  }

  private thingPos(t: Thing): { x: number; y: number } {
    if (t.kind === 'block' || t.kind === 'push') {
      const [bx, by] = this.blockAt(t.id);
      return { x: px(bx), y: px(by) };
    }
    const [x, y] = anchor(t);
    return { x: px(x), y: px(y) };
  }

  /** 기억 조각 (memory · keepsake): 이 방에서 모은 수 / 모두 */
  memories(): { got: number; total: number } {
    const ms = this.room.things.filter(isMemory);
    return { got: ms.filter((m) => this.flags[`mem_${m.id}`]).length, total: ms.length };
  }

  private bridged(tx: number, ty: number): boolean {
    for (const t of this.room.things) if (t.kind === 'gap' && this.flags[`gap_${t.id}`] && t.tiles.some((p) => p[0] === tx && p[1] === ty)) return true;
    return false;
  }

  private blockOn(tx: number, ty: number, except?: string): boolean {
    for (const t of this.room.things) {
      if ((t.kind !== 'block' && t.kind !== 'push') || t.id === except) continue;
      const [bx, by] = this.blockAt(t.id);
      if (bx === tx && by === ty) return true;
    }
    return false;
  }

  /** 이 칸에 놓인 물건 (기억 조각 · 종이별 · 기억의 문 · 인물 · 살펴볼 곳) */
  private thingOn(x: number, y: number, except: string): boolean {
    return this.things().some((t) => t.id !== except && !NO_BODY.has(t.kind) && anchor(t)[0] === x && anchor(t)[1] === y);
  }

  /** 땅이 막혔나 (덩어리는 빼고, 가구 밑 U 는 막힘으로) */
  private groundSolid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.room.w || ty >= this.room.h) return true;
    const c = this.room.tiles[ty][tx];
    if (this.poolFull(tx, ty)) return true;
    return (c === 'U' || isSolidChar(c)) && !this.bridged(tx, ty);
  }

  /** 칸의 높이 (RoomDef.elev 없으면 0) */
  elevAt(tx: number, ty: number): number {
    const row = this.room.elev?.[ty];
    const v = row ? Number(row[tx]) : 0;
    return Number.isFinite(v) ? v : 0;
  }

  /** 조종 인물이 장난감인가 (가구 밑 U 를 지나간다) */
  private toyPlayer(): boolean {
    const p = this.stage.actors[this.player];
    return stepSize(p?.kind ?? this.player) === 'toy';
  }

  /** 조종 인물에게 막힌 칸: 땅 · 덩어리 · 다른 높이 (가구 밑 U 는 장난감이면 지나감) */
  solid(tx: number, ty: number): boolean {
    if (this.blockOn(tx, ty)) return true;
    if (this.room.elev && tx >= 0 && ty >= 0 && tx < this.room.w && ty < this.room.h) {
      const p = this.stage.actors[this.player];
      if (this.elevAt(tx, ty) !== (p?.elev ?? 0)) return true;
    }
    if (this.lowAt(tx, ty) && (!this.toyPlayer() || this.hasHero('bori'))) return true;
    if (this.room.tiles[ty]?.[tx] === 'U' && !this.bridged(tx, ty)) return !this.toyPlayer();
    return this.groundSolid(tx, ty);
  }

  /** 조종 인물 · 동료의 높이를 서 있는 칸에 맞춘다 */
  private syncElev(): void {
    if (!this.room.elev) return;
    const p = this.stage.actors[this.player];
    if (!p) return;
    const e = this.elevAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
    p.elev = e;
    for (const h of this.followers()) this.stage.actors[h].elev = e;
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
    this.save.with = [];
    this.syncWithFlags();
    this.save.wind = ch.wind;
    this.player = 'toby';
    this.goRoom(ch.room, ch.start);
    this.stage.tone = 'now';
    this.stage.goal = null;
    this.run(ch.intro);
  }

  /**
   * 기억 장면을 감싼다: 카메라가 그 물건 쪽으로 → (기억 속 첫 소리가 먼저 들리고) 하얗게 → 기억 방 (세피아)
   * → 하얗게 → 원래 자리에서 그 물건을 잠깐 비추며 반짝 → 카메라를 돌려주고 동료 말
   */
  private memoryScene(t: MemThing): Cmd[] {
    const p = this.stage.actors[this.player];
    const back: Pt = [(p.x - TILE / 2) / TILE, (p.y - TILE / 2) / TILE];
    const setup = new Set(['room', 'show', 'pose', 'face', 'tone', 'music', 'cam', 'control', 'goal', 'item', 'carry', 'prop']);
    // 소리 먼저: 첫 대사 전의 첫 효과음을 흰빛보다 앞으로 당긴다 (빗소리 · 웃음소리가 먼저 들린다)
    const scene = [...t.scene];
    const firstSay = scene.findIndex((c) => c.t === 'say');
    const si = scene.findIndex((c, i) => c.t === 'sfx' && (firstSay < 0 || i < firstSay));
    const early: Cmd[] = si >= 0 ? scene.splice(si, 1) : [];
    let k = 0;
    while (k < scene.length && setup.has(scene[k].t)) k++;
    const music = this.room.music ?? this.stage.music;
    const goal = this.stage.goal;
    const at = t.at;
    const head: Cmd[] = [
      { t: 'bars', on: true },
      { t: 'sfx', name: 'memory' },
      { t: 'cam', to: at, s: early.length ? MEM_LEAD_S : MEM_PAN_S },
      ...early,
      ...(early.length ? [{ t: 'wait', s: MEM_PAN_S - MEM_LEAD_S } as Cmd] : []),
      { t: 'fade', to: 1, s: 0.9, color: 'white' },
      { t: 'tone', v: 'memory' },
      ...scene.slice(0, k),
      { t: 'fade', to: 0, s: 1.2 },
    ];
    const body = scene.slice(k);
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
      // 나와서 그 물건을 잠깐 붙잡는다 (살펴본 그림 look2 로 바뀌며 반짝)
      { t: 'cam', to: at },
      { t: 'fade', to: 0, s: 0.9 },
      { t: 'sfx', name: 'sparkle' },
      { t: 'wait', s: MEM_HOLD_S },
      { t: 'cam', to: null },
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
    const g = (cmds: Cmd[]) => withGesture(cmds, this.player, interactGesture(t));
    switch (t.kind) {
      case 'npc':
        if (t.pal && isPal(t.pal)) {
          this.talkPal(t.pal);
          break;
        }
        this.run(g([...t.scene, { t: 'flag', name: `seen_${t.id}` }]));
        break;
      case 'spot':
        this.run(g([...t.scene, { t: 'flag', name: `seen_${t.id}` }]));
        break;
      case 'memory':
      case 'keepsake':
        this.run(g(this.memoryScene(t)));
        break;
      case 'star': {
        this.flags[`star_${t.id}`] = true;
        const n = Object.keys(this.flags).filter((k) => k.startsWith('star_') && this.flags[k]).length;
        // 대화창 대신 알림 (걷기를 막지 않는다): ★ n · 별 글귀 한 줄, 토비는 숙여 줍는다
        this.stage.sfx.push('star');
        this.stage.toast = { text: `★ ${n}`, sub: t.text, life: TOAST_S, max: TOAST_S, x: px(t.at[0]), y: px(t.at[1]) };
        const me = this.stage.actors[this.player];
        const bow = interactGesture(t);
        if (me && bow) {
          me.act = { life: GESTURE_S, back: me.act?.back ?? me.pose };
          me.pose = bow;
        }
        break;
      }
      case 'block':
        this.push(t);
        break;
      case 'push':
        this.shove(t);
        break;
      case 'windup':
        this.windup(t);
        break;
      case 'climb':
        this.climb(t);
        break;
      case 'gap':
        if (this.hasHero('ruru')) {
          this.flags[`gap_${t.id}`] = true;
          this.run([{ t: 'act', who: 'ruru', name: 'spin', s: GESTURE_S }, { t: 'emote', who: 'ruru', e: '♪' }, { t: 'sfx', name: 'rope' }, { t: 'say', who: 'ruru', text: '밧줄 간다~! 이 정도 틈은 누워서 떡 먹기지.' }, ...this.doneCmds(['ruru'])]);
        } else this.run(this.failBark(this.away('ruru') ? 'gapCall' : 'gap'));
        break;
      case 'link':
        if (this.memories().got >= this.memories().total) this.run(withGesture(t.scene, this.player, 'peek'));
        else this.run(g(t.locked));
        break;
      case 'thread': {
        this.flags[t.id] = true;
        const c = this.threadCount();
        const all = c && c.got >= c.total && this.wandering ? [{ t: 'flag' as const, name: `${this.wandering.id}_threads` }] : [];
        this.run(g([{ t: 'sfx', name: 'star' }, ...t.text, ...all]));
        break;
      }
      case 'pull':
        this.pull(t);
        break;
      case 'part':
        this.pick(t);
        break;
      case 'assemble':
        this.assemble(t);
        break;
      case 'lamp':
        this.light(t);
        break;
      case 'mirror':
        this.turnMirror(t);
        break;
      case 'trigger':
      case 'dark':
      case 'pad':
      case 'seq':
      case 'chase':
      case 'watcher':
      case 'charge':
      case 'beam':
      case 'gears':
      case 'flow':
        break;
    }
  }

  /** 보리가 한 칸 민다 (roll 이면 막힐 때까지 구른다). 무게 2 는 보리 말고 동료가 하나 더 */
  private shove(t: Extract<Thing, { kind: 'push' }>): void {
    if (!this.hasHero('bori')) {
      this.run([{ t: 'act', who: 'toby', name: 'tremble', s: 0.6 }, ...this.failBark(this.away('bori') ? 'noBoriCall' : 'noBori')]);
      return;
    }
    const partner = this.helpers().find((h) => h !== 'bori');
    if ((t.weight ?? 1) >= 2 && !partner) {
      const more = this.free() && this.save.party.some((h) => h !== 'toby' && h !== 'bori');
      this.run([{ t: 'emote', who: 'bori', e: 'sweat' }, { t: 'say', who: 'bori', text: more ? '으으… 혼자는 무거워. 다른 친구도 불러 와 줘.' : '으으… 혼자는 무거워. 누가 같이 밀어 줘야 해.' }]);
      return;
    }
    const p = this.stage.actors[this.player];
    const [bx, by] = this.blockAt(t.id);
    const dx = px(bx) - p.x;
    const dy = px(by) - p.y;
    const [sx, sy] = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    const e = this.elevAt(bx, by);
    const free = (x: number, y: number) => !this.groundSolid(x, y) && !this.blockOn(x, y, t.id) && !this.thingOn(x, y, t.id) && (!this.room.elev || this.elevAt(x, y) === e);
    let nx = bx;
    let ny = by;
    while (free(nx + sx, ny + sy)) {
      nx += sx;
      ny += sy;
      if (!t.roll) break;
    }
    if (nx === bx && ny === by) {
      this.run([{ t: 'emote', who: 'bori', e: 'sweat' }, ...this.failBark('blocked')]);
      return;
    }
    this.save.blocks[t.id] = [nx, ny];
    this.slide(t.id, [bx, by], [nx, ny]);
    const cmds: Cmd[] = [
      { t: 'act', who: 'toby', name: 'point', s: GESTURE_S, wait: false },
      { t: 'act', who: 'bori', name: 'stomp', s: 0.5 },
      ...(partner && (t.weight ?? 1) >= 2 ? [{ t: 'act', who: partner, name: 'stomp', s: 0.5, wait: false } as Cmd] : []),
      { t: 'sfx', name: t.roll ? 'roll' : 'push' },
      { t: 'emote', who: 'bori', e: '!' },
    ];
    for (const pad of this.room.things) {
      if (pad.kind !== 'pad' || pad.at[0] !== nx || pad.at[1] !== ny || !pad.accepts.includes(t.id)) continue;
      this.flags[pad.flag] = true;
      cmds.push({ t: 'sfx', name: 'chime' });
    }
    // 받침에 놓였으면 일이 끝났다: 이 방에 더 밀 일이 없으면 보리는, 더 무거운 일이 없으면 거든 동료는 자기 자리로
    if (this.room.things.some((pd) => pd.kind === 'pad' && pd.at[0] === nx && pd.at[1] === ny && pd.accepts.includes(t.id))) {
      const left = this.palNeeds();
      const back: HeroId[] = [];
      if (!left.push) back.push('bori');
      if ((t.weight ?? 1) >= 2 && partner && !left.heavy) back.push(partner);
      cmds.push(...this.doneCmds(back));
    }
    this.run(cmds);
  }

  /** 밀린 물건의 그림이 칸마다 SLIDE_S 초 동안 미끄러진다 (보리가 힘을 주는 동안은 출발 전) */
  private slide(id: string, from: Pt, to: Pt): void {
    const cells = Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1]);
    (this.stage.slides ??= {})[id] = { from: [from[0], from[1]], to: [to[0], to[1]], t: -SHOVE_WINDUP, dur: SLIDE_S * cells };
  }

  /** 토비가 태엽을 나눠 준다: wind 에서 cost 를 덜고 장면 (모자라면 하지 않음) */
  private windup(t: Extract<Thing, { kind: 'windup' }>): void {
    if (this.player !== 'toby' || this.flags[`windup_${t.id}`]) return;
    if (this.save.wind + 1e-9 < t.cost) {
      this.run([{ t: 'emote', who: 'toby', e: 'sweat' }, ...this.failBark('wind')]);
      return;
    }
    this.save.wind = Math.max(0, Math.round((this.save.wind - t.cost) * 1e6) / 1e6);
    this.flags[`windup_${t.id}`] = true;
    this.run(withGesture([{ t: 'sfx', name: 'windup' }, ...t.scene], 'toby', 'stretch'));
  }

  /** at ↔ to 오르내리기: 가까운 쪽에서 반대쪽으로 (동료도 함께) */
  private climb(t: Extract<Thing, { kind: 'climb' }>): void {
    if (t.who === 'ruru' && !this.hasHero('ruru')) {
      this.run([{ t: 'say', who: 'toby', text: this.away('ruru') ? '너무 높아. 루루를 불러 와야겠어. 루루 밧줄이면 오를 수 있어.' : '너무 높아. 루루 밧줄이 있으면 오를 수 있을 텐데…' }]);
      return;
    }
    const p = this.stage.actors[this.player];
    const da = Math.hypot(px(t.at[0]) - p.x, px(t.at[1]) - p.y);
    const db = Math.hypot(px(t.to[0]) - p.x, px(t.to[1]) - p.y);
    const dest = da <= db ? t.to : t.at;
    const dir = p.dir;
    this.place(px(dest[0]), px(dest[1]));
    p.dir = dir;
    this.run([{ t: 'sfx', name: 'rope' }, { t: 'act', who: this.player, name: 'hop', s: GESTURE_S }]);
  }

  // ───────── 발판 순서 · 쫓아가기

  /** 발판 순서 퍼즐의 지금: 맞게 밟은 발판(keys 번호, 차례대로) · 모두 · 풀었나. 없는 id 면 null */
  seqState(id: string): { pressed: number[]; total: number; done: boolean } | null {
    const t = this.room.things.find((x) => x.id === id && x.kind === 'seq');
    if (!t || t.kind !== 'seq') return null;
    const done = !!this.flags[t.flag];
    return { pressed: done ? [...t.order] : [...(this.seqs.get(id)?.pressed ?? [])], total: t.order.length, done };
  }

  private checkSeqs(): void {
    const p = this.stage.actors[this.player];
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    for (const t of this.room.things) {
      if (t.kind !== 'seq' || this.flags[t.flag]) continue;
      let st = this.seqs.get(t.id);
      if (!st) this.seqs.set(t.id, (st = { pressed: [], on: -1 }));
      const k = t.keys.findIndex((key) => key.at[0] === tx && key.at[1] === ty);
      if (k === st.on) continue;
      st.on = k;
      if (k < 0) continue;
      // 음 발판: 맞든 틀리든 밟은 발판의 음이 난다
      const note = t.keys[k].note ? noteSfx(t.keys[k].note!) : null;
      if (note) this.stage.sfx.push(note);
      if (t.order[st.pressed.length] === k) {
        st.pressed.push(k);
        this.gesture(this.player, 'hop');
        if (st.pressed.length >= t.order.length) {
          this.flags[t.flag] = true;
          this.stage.sfx.push('chime');
        } else if (!note) this.stage.sfx.push('click');
      } else {
        st.pressed = [];
        this.gesture(this.player, 'shiver');
        this.stage.sfx.push('wrong');
        if (t.wrong?.length) this.run(t.wrong);
      }
    }
  }

  /** 쫓아가기의 지금: 따라잡은 수 · 모두 · 끝났나 · 달아나는 중인가. 없는 id 면 null */
  chaseState(id: string): { caught: number; laps: number; done: boolean; running: boolean } | null {
    const t = this.room.things.find((x) => x.id === id && x.kind === 'chase');
    if (!t || t.kind !== 'chase') return null;
    const done = !!this.flags[t.flag];
    return { caught: done ? t.laps : (this.chases.get(id) ?? 0), laps: t.laps, done, running: !!this.stage.actors[id]?.goal };
  }

  /** 도망치는 인물을 무대에 (다 잡았으면 새로 세우지 않는다) */
  private syncChases(): void {
    for (const t of this.room.things) {
      if (t.kind !== 'chase' || this.flags[t.flag] || this.stage.actors[t.id] || !t.path.length) continue;
      const n = this.chases.get(t.id) ?? 0;
      const at = t.path[n % t.path.length];
      addActor(this.stage, t.id, t.actor, px(at[0]), px(at[1]));
    }
  }

  private checkChases(): void {
    const p = this.stage.actors[this.player];
    for (const t of this.room.things) {
      if (t.kind !== 'chase' || this.flags[t.flag]) continue;
      const a = this.stage.actors[t.id];
      if (!a || a.goal) continue;
      if (Math.hypot(a.x - p.x, a.y - p.y) > (t.near ?? CHASE_NEAR) * TILE) continue;
      const n = (this.chases.get(t.id) ?? 0) + 1;
      this.chases.set(t.id, n);
      this.stage.sfx.push('catch');
      this.gesture(this.player, 'jump');
      if (n >= t.laps) {
        this.flags[t.flag] = true;
        this.run([{ t: 'emote', who: t.id, e: '!' }, ...(t.scene ?? [])]);
        return;
      }
      const to = t.path[n % t.path.length];
      a.goal = { x: px(to[0]), y: px(to[1]), speed: SPEED[this.room.scale] * CHASE_SPEED };
      a.emote = { e: '♪', life: 1 };
    }
  }

  private push(t: Extract<Thing, { kind: 'block' }>): void {
    if (!this.hasHero('bori')) {
      this.run([{ t: 'act', who: 'toby', name: 'tremble', s: 0.6 }, ...this.failBark('noBori')]);
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
      this.run([{ t: 'emote', who: 'bori', e: 'sweat' }, ...this.failBark('blocked')]);
      return;
    }
    this.save.blocks[t.id] = [nx, ny];
    this.slide(t.id, [bx, by], [nx, ny]);
    this.run([{ t: 'act', who: 'toby', name: 'point', s: GESTURE_S, wait: false }, { t: 'act', who: 'bori', name: 'stomp', s: 0.5 }, { t: 'sfx', name: 'push' }, { t: 'emote', who: 'bori', e: '!' }]);
  }

  // ───────── 숨바꼭질 (watcher)

  private watcherOn(t: Extract<Thing, { kind: 'watcher' }>): boolean {
    return toyWalk(this.room) && this.player === 'toby' && !this.wandering && this.cond(t) && !(t.until && this.flags[t.until]);
  }

  /** 지켜보는 이를 무대에 (actor 가 '' 이면 그림 없음: 센서등) */
  private syncWatchers(): void {
    for (const t of this.room.things) {
      if (t.kind !== 'watcher' || !t.actor || this.stage.actors[t.id]) continue;
      const s0 = t.pattern[0];
      const at = s0?.at ?? t.at;
      addActor(this.stage, t.id, t.actor, px(at[0]), px(at[1]), s0?.dir ?? t.dir ?? 'down', s0?.pose ?? 'idle');
      // 높은 칸(소파 · 침대 위)에 누운 지켜보는 이는 그만큼 위에 그린다
      if (this.room.elev) this.stage.actors[t.id].elev = this.elevAt(at[0], at[1]);
    }
  }

  private watcherThing(id: string): Extract<Thing, { kind: 'watcher' }> | null {
    const t = this.room.things.find((x) => x.id === id && x.kind === 'watcher');
    return t && t.kind === 'watcher' ? t : null;
  }

  /** 시야 · 빛을 가리는 칸: 벽 · 가구 (낭떠러지 · 물은 아님) · 가구 밑 U · 밀 물건 */
  private opaque(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.room.w || y >= this.room.h) return true;
    const c = this.room.tiles[y][x];
    if (c === 'U') return true;
    if (isSolidChar(c) && !SEE_OVER.has(c)) return true;
    return this.blockOn(x, y);
  }

  /** 지켜보는 이가 지금 보는 칸 ('x,y'). 눈 감았거나 쉬는 중이면 빈 집합 */
  watchCells(id: string): Set<string> {
    const t = this.watcherThing(id);
    if (!t || !this.watcherOn(t)) return new Set();
    const st = this.watch.get(id);
    const step = t.pattern[Math.max(0, st?.step ?? 0)];
    if (!step?.dir) return new Set();
    const a = this.stage.actors[id];
    const from: Pt = a ? [Math.floor(a.x / TILE), Math.floor(a.y / TILE)] : t.at;
    return sightCells(from, step.dir, step.r ?? WATCH_R, step.arc ?? WATCH_ARC, (x, y) => this.opaque(x, y), this.room.w, this.room.h);
  }

  /** 숨바꼭질의 지금: 박자 번호 · 보이는 중 · 들킬 뻔한 정도(0~1) · 시야 안에서 움직인 칸 · 들킨 수. 없는 id 면 null */
  watchState(id: string): { step: number; seen: boolean; alert: number; moved: number; caught: number } | null {
    const t = this.watcherThing(id);
    if (!t) return null;
    const st = this.watch.get(id);
    return { step: Math.max(0, st?.step ?? 0), seen: !!st?.seen, alert: Math.min(1, (st?.alert ?? 0) / (t.grace ?? WATCH_GRACE)), moved: (st?.moved ?? 0) / TILE, caught: this.watchCaught.get(id) ?? 0 };
  }

  /** 숨은 칸: 숨을 곳(hide) · 가구 밑 */
  private hiddenAt(t: Extract<Thing, { kind: 'watcher' }>, x: number, y: number): boolean {
    return this.room.tiles[y]?.[x] === 'U' || !!t.hide?.some((h) => h[0] === x && h[1] === y);
  }

  /** 박자를 돌리고, 시야에 든 토비를 센다. 들키면 장면을 띄운다 */
  private watchers(dt: number, moving: boolean, dist: number): void {
    const p = this.stage.actors[this.player];
    if (!p || this.runner) return;
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    for (const t of this.room.things) {
      if (t.kind !== 'watcher' || !this.watcherOn(t) || !t.pattern.length) continue;
      let st = this.watch.get(t.id);
      if (!st) this.watch.set(t.id, (st = { t: 0, step: -1, alert: 0, moved: 0, seen: false }));
      st.t += dt;
      const total = t.pattern.reduce((n, q) => n + Math.max(0.01, q.s), 0);
      let u = st.t % total;
      let k = 0;
      while (k < t.pattern.length - 1 && u >= Math.max(0.01, t.pattern[k].s)) u -= Math.max(0.01, t.pattern[k++].s);
      const a = this.stage.actors[t.id];
      const step = t.pattern[k];
      if (k !== st.step) {
        st.step = k;
        if (a) {
          if (step.at) a.goal = { x: px(step.at[0]), y: px(step.at[1]), speed: SPEED.toy * PATROL_SPEED };
          if (step.pose) a.pose = step.pose;
          if (step.emote) a.emote = { e: step.emote, life: 1.2 };
        }
      }
      if (a && !a.goal && step.dir) a.dir = step.dir;
      if (this.hiddenAt(t, tx, ty)) {
        // 숨은 곳: 들키면 여기로 돌아온다
        this.checkpoint = { x: px(tx), y: px(ty) };
        st.seen = false;
        st.alert = 0;
        st.moved = 0;
        continue;
      }
      const inSight = this.watchCells(t.id).has(`${tx},${ty}`);
      st.seen = inSight;
      let caught = false;
      if (t.motion !== undefined) {
        st.moved = inSight ? st.moved + dist : 0;
        caught = st.moved > t.motion * TILE;
      } else {
        const counts = inSight && (!t.moveOnly || moving);
        if (counts && st.alert === 0 && a) a.emote = { e: '?', life: 1 };
        st.alert = counts ? st.alert + dt : Math.max(0, st.alert - dt);
        caught = st.alert >= (t.grace ?? WATCH_GRACE) - 1e-9;
      }
      if (caught) {
        this.caughtBy(t);
        return;
      }
    }
  }

  private caughtBy(t: Extract<Thing, { kind: 'watcher' }>): void {
    const n = (this.watchCaught.get(t.id) ?? 0) + 1;
    this.watchCaught.set(t.id, n);
    this.vel = { x: 0, y: 0 };
    const cp: Pt = [(this.checkpoint.x - TILE / 2) / TILE, (this.checkpoint.y - TILE / 2) / TILE];
    const who = this.stage.actors[t.id] ? t.id : this.player;
    this.run([
      { t: 'shake', s: 0.3 },
      { t: 'sfx', name: 'caught' },
      { t: 'emote', who, e: '!' },
      ...t.caught,
      ...(n >= 3 ? (t.hint ?? []) : []),
      { t: 'fade', to: 1, s: 0.5 },
      { t: 'room', id: this.room.id, at: cp },
      { t: 'fade', to: 0, s: 0.5 },
    ]);
  }

  // ───────── 협동 당기기 (pull)

  /** 지금까지 당긴 수 */
  pullCount(id: string): number {
    return this.tugs.get(id) ?? 0;
  }

  private pull(t: Extract<Thing, { kind: 'pull' }>): void {
    if (this.flags[t.flag]) return;
    const missing = t.need.filter((h) => h !== 'toby' && !this.hasHero(h));
    if (missing.length) {
      const names = missing.map((h) => NAME[h]).join('랑 ');
      const call = missing.every((h) => isPal(h) && this.away(h));
      this.run([
        { t: 'act', who: this.player, name: 'tremble', s: 0.6 },
        { t: 'say', who: 'toby', text: call ? `끄응… 혼자서는 꿈쩍도 안 해. ${names}를 불러 와야겠어. 같이 당겨야 해.` : `끄응… 꿈쩍도 안 해. ${names} 같은 친구가 더 있어야 해.` },
      ]);
      return;
    }
    const n = (this.tugs.get(t.id) ?? 0) + 1;
    this.tugs.set(t.id, n);
    const tugs = t.tugs ?? 1;
    const cmds: Cmd[] = [
      ...t.need.filter((h) => h !== 'toby').map((h): Cmd => ({ t: 'act', who: h, name: 'stomp', s: 0.6, wait: false })),
      { t: 'act', who: this.player, name: 'stomp', s: 0.6 },
      { t: 'sfx', name: 'rope' },
    ];
    if (tugs > 1) cmds.push({ t: 'say', who: 'toby', text: `${COUNT_WORDS[Math.min(n, COUNT_WORDS.length) - 1]}!` });
    if (n >= tugs) {
      this.flags[t.flag] = true;
      cmds.push({ t: 'sfx', name: 'open' }, ...(t.scene ?? []), ...this.doneCmds(t.need));
    }
    this.run(cmds);
  }

  // ───────── 조각 맞추기 (part · assemble)

  /** 손에 든 조각 (방에 놓인 차례) */
  held(): string[] {
    return this.room.things.filter((t) => t.kind === 'part' && this.flags[`got_${t.id}`] && !this.flags[`put_${t.id}`]).map((t) => t.id);
  }

  private heavyHeld(): boolean {
    const h = new Set(this.held());
    return this.room.things.some((t) => t.kind === 'part' && t.heavy && h.has(t.id));
  }

  /** 맞추는 자리: 놓은 수 · 필요한 수 · 끝났나. 없는 id 면 null */
  assembled(id: string): { placed: number; need: number; done: boolean } | null {
    const t = this.room.things.find((x) => x.id === id && x.kind === 'assemble');
    if (!t || t.kind !== 'assemble') return null;
    const parts = this.room.things.filter((p) => p.kind === 'part' && p.set === t.set);
    return { placed: parts.filter((p) => this.flags[`put_${p.id}`]).length, need: t.need ?? parts.length, done: !!this.flags[t.flag] };
  }

  /** 든 조각을 토비 손에 (그림: stage.items · carry) */
  private syncHeld(): void {
    const p = this.stage.actors[this.player];
    for (const k of Object.keys(this.stage.items)) if (k.startsWith('part:')) delete this.stage.items[k];
    if (p?.carry?.startsWith('part:')) delete p.carry;
    if (!p || this.player !== 'toby') return;
    const h = this.held();
    const last = h[h.length - 1];
    const t = this.room.things.find((x) => x.id === last);
    if (!t || t.kind !== 'part') return;
    this.stage.items[`part:${t.id}`] = { kind: t.look, x: p.x, y: p.y, on: p.id };
    p.carry = `part:${t.id}`;
  }

  private pick(t: Extract<Thing, { kind: 'part' }>): void {
    if (this.heavyHeld()) {
      this.run([{ t: 'emote', who: 'toby', e: 'sweat' }, { t: 'say', who: 'toby', text: '손이 꽉 찼어. 들고 있는 걸 먼저 갖다 놓자.' }]);
      return;
    }
    if (t.heavy && !this.hasHero('bori')) {
      this.run([{ t: 'act', who: 'toby', name: 'tremble', s: 0.6 }, { t: 'say', who: 'toby', text: this.away('bori') ? '무거워… 보리를 불러 와야겠어. 같이 들면 될 거야.' : '무거워… 혼자서는 못 들겠어.' }]);
      return;
    }
    this.flags[`got_${t.id}`] = true;
    this.syncHeld();
    this.run(withGesture([{ t: 'sfx', name: 'lift' }, ...(t.heavy ? [{ t: 'act', who: 'bori', name: 'stomp', s: 0.5 } as Cmd] : [])], this.player, 'bow'));
  }

  private assemble(t: Extract<Thing, { kind: 'assemble' }>): void {
    if (this.flags[t.flag]) return;
    const mine = this.held().filter((id) => this.room.things.some((p) => p.id === id && p.kind === 'part' && p.set === t.set));
    if (!mine.length) {
      const st = this.assembled(t.id)!;
      const other = this.held().length > 0;
      this.run([{ t: 'say', who: 'toby', text: other ? '이 조각은 여기 맞지 않아. 다른 자리 것 같아.' : `아직 조각이 ${st.need - st.placed}개 더 있어야 해. 어디 흩어져 있을 거야.` }]);
      return;
    }
    for (const id of mine) this.flags[`put_${id}`] = true;
    this.syncHeld();
    const st = this.assembled(t.id)!;
    const cmds: Cmd[] = [{ t: 'act', who: this.player, name: 'bow', s: 0.6 }, { t: 'sfx', name: 'put' }];
    if (st.placed >= st.need) {
      this.flags[t.flag] = true;
      cmds.push({ t: 'sfx', name: 'chime' }, ...(t.scene ?? []));
    } else cmds.push({ t: 'say', who: 'toby', text: `맞췄다! 앞으로 ${st.need - st.placed}개.` });
    this.run(cmds);
  }

  // ───────── 나비 등불 (lantern · lamp · charge)

  /** 나비 등불 반지름 (칸). 등불 자원이 없는 방이면 0 */
  lanternR(): number {
    const l = this.room.lantern;
    if (!l) return 0;
    return this.lantern.get(this.room.id) ?? l.max;
  }

  /** 등불을 든 자리 (나비, 없으면 조종 인물) */
  private lightPos(): { x: number; y: number } | null {
    return this.stage.actors.nabi ?? this.stage.actors[this.player] ?? null;
  }

  /** 그 칸이 밝은가: 켜진 등 반지름 안, 또는 나비가 함께 있고 (등불 자원 방이면 반지름 안) */
  litAt(at: Pt): boolean {
    for (const t of this.room.things) if (t.kind === 'lamp' && this.flags[`lamp_${t.id}`] && Math.hypot(t.at[0] - at[0], t.at[1] - at[1]) <= t.r + 1e-6) return true;
    if (!this.hasHero('nabi')) return false;
    if (!this.room.lantern) return true;
    const q = this.lightPos();
    if (!q) return false;
    return Math.hypot(q.x - px(at[0]), q.y - px(at[1])) <= this.lanternR() * TILE + 1e-6;
  }

  private tickLantern(dt: number): void {
    const l = this.room.lantern;
    if (!l) return;
    let r = this.lanternR();
    const q = this.lightPos();
    let rate = 0;
    if (q) {
      const near = (at: Pt, rr: number) => Math.hypot(q.x - px(at[0]), q.y - px(at[1])) <= rr * TILE + 1e-6;
      for (const t of this.room.things) {
        if (t.kind === 'charge' && this.cond(t) && near(t.at, t.r ?? CHARGE_R)) rate = Math.max(rate, t.rate ?? CHARGE_RATE);
        if (t.kind === 'lamp' && this.flags[`lamp_${t.id}`] && near(t.at, t.r)) rate = Math.max(rate, CHARGE_RATE);
      }
    }
    const p = this.stage.actors[this.player];
    const inDark = !l.zones || (!!p && l.zones.some((z) => inRect(z, Math.floor(p.x / TILE), Math.floor(p.y / TILE))));
    if (rate > 0) r = Math.min(l.max, r + rate * dt);
    else if (this.hasHero('nabi') && inDark) r = Math.max(l.min, r - l.drain * dt);
    this.lantern.set(this.room.id, Math.round(r * 1e6) / 1e6);
  }

  private light(t: Extract<Thing, { kind: 'lamp' }>): void {
    if (this.flags[`lamp_${t.id}`]) return;
    if (t.who && t.who !== 'toby' && !this.hasHero(t.who)) {
      const n = NAME[t.who];
      this.run([{ t: 'say', who: 'toby', text: isPal(t.who) && this.away(t.who) ? `불을 붙일 수가 없어. ${n}를 불러 와야겠어.` : `불을 붙일 수가 없어. ${n}가 있으면 좋을 텐데…` }]);
      return;
    }
    this.flags[`lamp_${t.id}`] = true;
    this.run(withGesture([{ t: 'sfx', name: 'click' }, ...(t.who && t.who !== 'toby' ? [{ t: 'emote', who: t.who, e: '♪' } as Cmd] : [])], this.player, 'point'));
  }

  // ───────── 손거울 빛 (beam · mirror)

  /** 손거울 방향 (0~3) */
  mirrorFace(id: string): number {
    const v = this.save.marks?.[id];
    if (v !== undefined) return v;
    const t = this.room.things.find((x) => x.id === id && x.kind === 'mirror');
    return t && t.kind === 'mirror' ? (t.face ?? 0) : 0;
  }

  private turnMirror(t: Extract<Thing, { kind: 'mirror' }>): void {
    if (t.who && t.who !== 'toby' && !this.hasHero(t.who)) {
      this.run([{ t: 'say', who: 'toby', text: `혼자서는 안 돌아가. ${NAME[t.who]}가 있어야겠어.` }]);
      return;
    }
    (this.save.marks ??= {})[t.id] = (this.mirrorFace(t.id) + 1) % 4;
    this.run(withGesture([{ t: 'sfx', name: 'click' }], this.player, 'point'));
    this.checkBeams();
  }

  /** 빛줄기가 지나는 칸 · 과녁에 닿았나. 빛이 없으면 (깃발 · 나비가 없음) null */
  beamPath(id: string): { cells: Pt[]; hit: boolean } | null {
    const t = this.room.things.find((x) => x.id === id && x.kind === 'beam');
    if (!t || t.kind !== 'beam' || !this.cond(t)) return null;
    if (t.who && t.who !== 'toby' && !this.hasHero(t.who)) return null;
    const mirrors = new Map<string, string>();
    for (const m of this.room.things) if (m.kind === 'mirror' && this.cond(m)) mirrors.set(`${m.at[0]},${m.at[1]}`, m.id);
    const at = (x: number, y: number) => {
      const m = mirrors.get(`${x},${y}`);
      return m ? this.mirrorFace(m) : null;
    };
    return traceBeam(t.at, t.dir, at, (x, y) => this.opaque(x, y), t.target, this.room.w, this.room.h);
  }

  private checkBeams(): void {
    for (const t of this.room.things) {
      if (t.kind !== 'beam' || this.flags[t.flag]) continue;
      if (!this.beamPath(t.id)?.hit) continue;
      this.flags[t.flag] = true;
      this.stage.sfx.push('chime');
      if (t.scene?.length) this.run(t.scene);
    }
  }

  // ───────── 젖은 타일 (slip)

  /** 젖은 칸인가 (때수건 grip 은 마른 칸) */
  slipAt(x: number, y: number): boolean {
    const r = this.room;
    if (!r.slip || r.grip?.some((g) => g[0] === x && g[1] === y)) return false;
    return r.slip.some((q) => inRect(q, x, y));
  }

  /** 젖은 칸에 들어섰거나 젖은 칸에서 걸으려 하면: 막히거나 마른 칸에 닿을 때까지 미끄러지기 시작 */
  private startSlide(p: { x: number; y: number }, input: [number, number] | null): void {
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    const [lx, ly] = this.lastTile;
    this.lastTile = [tx, ty];
    if (!this.room.slip || !this.slipAt(tx, ty)) return;
    const entered = lx !== tx || ly !== ty;
    // 들어선 쪽 (이웃 칸에서 왔으면 그 방향, 아니면 누른 방향)
    const near = Math.abs(tx - lx) + Math.abs(ty - ly) === 1;
    const d: Dir4 | null = entered && near ? dir4Of(tx - lx, ty - ly) : input ? dir4Of(input[0], input[1]) : null;
    if (!d) return;
    const v = DIR4_VEC[d];
    const dest = slideDest([tx, ty], v, (x, y) => this.slipAt(x, y), (x, y) => !this.solid(x, y));
    if (!entered && dest[0] === tx && dest[1] === ty) return;
    this.sliding = { x: px(dest[0]), y: px(dest[1]) };
    // 미끄러지는 줄의 가운데로
    if (v[0] !== 0) p.y = px(ty);
    else p.x = px(tx);
    this.vel = { x: 0, y: 0 };
  }

  private slideStep(p: { x: number; y: number; moving: boolean }, dt: number): void {
    const sl = this.sliding!;
    const dx = sl.x - p.x;
    const dy = sl.y - p.y;
    const d = Math.hypot(dx, dy);
    const step = SLIP_SPEED * dt;
    p.moving = false;
    if (d <= step) {
      p.x = sl.x;
      p.y = sl.y;
      this.sliding = null;
      this.vel = { x: 0, y: 0 };
    } else {
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
    }
    this.lastTile = [Math.floor(p.x / TILE), Math.floor(p.y / TILE)];
  }

  /** 미끄러지는 중인가 (그림: 미끄럼 자세) */
  slidingNow(): boolean {
    return !!this.sliding;
  }

  // ───────── 바람 (wind)

  private windOn(t: WindDef): boolean {
    return this.cond(t) && !(t.until && this.flags[t.until]);
  }

  /** 바람의 지금: 부는 중 · 곧 분다(예고). 없거나 쉬는 바람이면 null */
  windState(id: string): { blowing: boolean; warn: boolean } | null {
    const t = this.room.winds?.find((x) => x.id === id);
    if (!t || !this.windOn(t)) return null;
    const tt = this.winds.get(id)?.t ?? 0;
    const ph = t.phase ?? 0;
    if (tt < ph) return { blowing: false, warn: ph - tt <= WIND_WARN };
    const u = (tt - ph) % t.period;
    const blowing = u < t.gust;
    return { blowing, warn: !blowing && t.period - u <= WIND_WARN };
  }

  private blowWinds(dt: number, p: { x: number; y: number }, radius: number): void {
    for (const t of this.room.winds ?? []) {
      if (!this.windOn(t)) continue;
      let st = this.winds.get(t.id);
      if (!st) this.winds.set(t.id, (st = { t: 0, was: false }));
      st.t += dt;
      const blowing = !!this.windState(t.id)?.blowing;
      const [vx, vy] = DIR4_VEC[t.dir];
      if (blowing && !st.was) {
        // 바람이 일 때: 날리는 물건이 한 칸
        for (const id of t.blows ?? []) {
          const [bx, by] = this.blockAt(id);
          if (!inRect(t.rect, bx, by)) continue;
          const nx = bx + vx;
          const ny = by + vy;
          if (this.groundSolid(nx, ny) || this.blockOn(nx, ny, id) || this.thingOn(nx, ny, id)) continue;
          this.save.blocks[id] = [nx, ny];
          this.slide(id, [bx, by], [nx, ny]);
          this.stage.slides![id].t = 0;
        }
        this.stage.sfx.push('blow');
      }
      st.was = blowing;
      if (!blowing || this.player !== 'toby') continue;
      const tx = Math.floor(p.x / TILE);
      const ty = Math.floor(p.y / TILE);
      if (!inRect(t.rect, tx, ty) || t.shelter?.some((h) => h[0] === tx && h[1] === ty)) continue;
      const f = (t.force ?? WIND_FORCE) * TILE * dt;
      this.moveActor(p, vx * f, vy * f, radius);
    }
  }

  // ───────── 톱니 (gears)

  /** 톱니의 지금: 도는 칸 ('x,y' → 1 시계 · -1 반시계) · 녹슨 톱니에 걸렸나 · 동력이 있나. 없는 id 면 null */
  gearState(id: string): { spin: Map<string, number>; jammed: boolean; powered: boolean } | null {
    const t = this.room.things.find((x) => x.id === id && x.kind === 'gears');
    if (!t || t.kind !== 'gears') return null;
    if (!this.cond(t)) return { spin: new Map(), jammed: false, powered: false };
    const onPeg = (q: Pt) => !t.pegs || t.pegs.some((g) => g[0] === q[0] && g[1] === q[1]);
    const gears: Pt[] = [...t.gears.map((g): Pt => this.blockAt(g)).filter(onPeg), t.target];
    return { ...gearSpin(t.at, gears, t.jam ?? []), powered: true };
  }

  private checkGears(): void {
    for (const t of this.room.things) {
      if (t.kind !== 'gears' || this.flags[t.flag]) continue;
      if (!this.gearState(t.id)?.spin.has(`${t.target[0]},${t.target[1]}`)) continue;
      this.flags[t.flag] = true;
      this.stage.sfx.push('windup');
      if (t.scene?.length) this.run(t.scene);
    }
  }

  // ───────── 물길 (flow)

  /** 물이 닿은 칸 ('x,y'). 없는 id 면 빈 집합 */
  flowCells(id: string): Set<string> {
    return this.flowWet().get(id) ?? new Set();
  }

  private flowWet(): Map<string, Set<string>> {
    const flows = this.room.things.filter((t): t is Extract<Thing, { kind: 'flow' }> => t.kind === 'flow');
    if (!flows.length) return new Map();
    const sig = `${this.room.id}|${JSON.stringify(this.save.blocks)}|${flows.map((t) => (this.cond(t) ? 1 : 0)).join('')}`;
    if (this.flowMemo?.sig === sig) return this.flowMemo.wet;
    const wet = new Map<string, Set<string>>();
    for (const t of flows) wet.set(t.id, this.cond(t) ? flowCells(t.at, rectCells(t.channel), (x, y) => this.blockOn(x, y)) : new Set());
    this.flowMemo = { sig, wet };
    return wet;
  }

  /** 물이 찬 웅덩이 (지나갈 수 없음) */
  private poolFull(x: number, y: number): boolean {
    let wet: Map<string, Set<string>> | null = null;
    for (const t of this.room.things) {
      if (t.kind !== 'flow' || !t.pools.some((q) => q.at[0] === x && q.at[1] === y)) continue;
      wet ??= this.flowWet();
      if (wet.get(t.id)?.has(`${x},${y}`)) return true;
    }
    return false;
  }

  /** 웅덩이 깃발을 물 상태에 맞추고, 조건(fill · dry)이 맞으면 flag + 장면 (한 번) */
  private syncFlows(): void {
    for (const t of this.room.things) {
      if (t.kind !== 'flow') continue;
      const wet = this.flowCells(t.id);
      const full = t.pools.map((q) => wet.has(`${q.at[0]},${q.at[1]}`));
      t.pools.forEach((q, i) => {
        if (!q.flag) return;
        if (full[i]) this.flags[q.flag] = true;
        else delete this.flags[q.flag];
      });
      if (!t.flag || this.flags[t.flag] || !this.cond(t)) continue;
      if (!(t.fill ?? []).every((i) => full[i]) || !(t.dry ?? []).every((i) => !full[i])) continue;
      this.flags[t.flag] = true;
      this.stage.sfx.push('chime');
      if (t.scene?.length) this.run(t.scene);
    }
  }

  // ───────── 낮은 천장 (low)

  private lowAt(x: number, y: number): boolean {
    return !!this.room.low?.some((l) => this.cond(l) && inRect(l.rect, x, y));
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
      if (!this.runner && !this.mini) this.roam(dt);
    }
    if (this.runner) {
      this.runner.update(this, dt, fast);
      if (this.runner.done) this.endRunner();
    }
    updateStage(this.stage, fast && this.runner ? dt * FAST : dt);
    this.prompt = this.runner || this.mini ? null : this.nearest();
    if (this.runner || this.mini) this.vel = { x: 0, y: 0 };
    else {
      // 살펴보기 표시가 새로 뜨면 작은 반짝 소리 (대본이 끝나 같은 표시가 다시 뜰 때는 조용히)
      const id = this.prompt?.id ?? null;
      if (id !== null && id !== this.shownPrompt) this.stage.sfx.push('sparkle');
      this.shownPrompt = id;
    }
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
    if (inp.act && !this.sliding) {
      const t = this.nearest();
      if (t) {
        this.interact(t);
        return;
      }
    }
    const before = { x: p.x, y: p.y };
    const scale = toyWalk(this.room) && this.player === 'toby' ? 'toy' : this.room.scale;
    if (this.sliding) this.slideStep(p, dt);
    else {
      // 아주 짧은 가속 · 감속 (손맛). 무거운 조각을 들면 느리다
      const top = SPEED[scale] * (this.heavyHeld() ? HEAVY_SPEED : 1);
      this.vel = approachVel(this.vel, moving ? { x: mx * top, y: my * top } : { x: 0, y: 0 }, dt, top);
      const sp = Math.hypot(this.vel.x, this.vel.y);
      if (sp > 0.01) {
        this.moveActor(p, this.vel.x * dt, this.vel.y * dt, RADIUS[scale]);
        if (moving) p.dir = facingOf(mx, my);
      }
      if (moving) {
        p.moving = true;
        // 태엽이 적으면 토비 걸음 박자가 느려진다 (그림 · 발소리 함께)
        p.walkT += dt * (this.player === 'toby' ? gaitScale(this.save.wind) : 1);
      } else p.moving = false;
    }
    this.blowWinds(dt, p, RADIUS[scale]);
    if (!this.sliding) this.startSlide(p, moving ? [mx, my] : null);
    this.save.x = p.x;
    this.save.y = p.y;
    this.follow(dt);
    this.checkTriggers();
    this.checkSeqs();
    this.checkChases();
    this.syncNpcs();
    this.tickLantern(dt);
    this.syncFlows();
    this.checkGears();
    this.checkBeams();
    this.watchers(dt, moving || !!this.sliding, Math.hypot(p.x - before.x, p.y - before.y));
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
      const d = Math.hypot(dx, dy);
      if (d > 0.3) {
        a.dir = facingOf(dx, dy);
        this.still.set(h, 0);
      } else this.still.set(h, (this.still.get(h) ?? 1) + dt);
      a.moving = (this.still.get(h) ?? 1) < 0.15;
      if (a.moving) a.walkT += dt;
      // 멀리 있던 동료(방금 부름)는 순간이동하지 않고 달려와 줄에 낀다
      const max = SPEED.toy * CATCH_SPEED * dt;
      const k = d > max ? max / d : 1;
      a.x += dx * k;
      a.y += dy * k;
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
      if (t.kind === 'windup' && this.flags[`windup_${t.id}`]) continue;
      if ((t.kind === 'pull' || t.kind === 'assemble') && this.flags[t.flag]) continue;
      if (t.kind === 'lamp' && this.flags[`lamp_${t.id}`]) continue;
      const q = this.thingPos(t);
      const r = t.kind === 'spot' && t.r ? t.r : REACH;
      let d = Math.hypot(q.x - fx, q.y - fy);
      if (t.kind === 'climb') d = Math.min(d, Math.hypot(px(t.to[0]) - fx, px(t.to[1]) - fy));
      if (d <= Math.max(r, bd) && d <= r && (best === null || d < bd)) {
        best = t;
        bd = d;
      }
    }
    // 동료에게 말 걸기 (살펴볼 것이 가까이 없을 때만: 물건이 먼저)
    if (this.free() && best === null)
      for (const h of PALS) {
        const a = this.stage.actors[h];
        if (!a || !this.save.party.includes(h)) continue;
        // 바라보는 쪽 앞에 선 동료만 (발치에 겹친 · 등 뒤 동료는 아님)
        if ((a.x - p.x) * f[0] + (a.y - p.y) * f[1] < 6) continue;
        const d = Math.hypot(a.x - fx, a.y - fy);
        if (d <= REACH && d < bd) {
          best = { kind: 'npc', id: `pal_${h}`, at: [(a.x - TILE / 2) / TILE, (a.y - TILE / 2) / TILE], actor: h, scene: [], pal: h };
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
