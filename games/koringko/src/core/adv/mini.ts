/**
 * 기억 속 작은 놀이 (화면과 무관한 규칙). 실패해서 끝나는 일은 없다: 이야기를 막지 않는다.
 *   stars   종이별 접기: 할머니 손을 따라 방향 누르기 (별 셋 × 다섯 번 접기)
 *   candles 촛불 끄기: 숨을 들이쉬었다가(누르고 있기) 알맞을 때 놓기
 *   sew     바느질: 바늘이 표시에 올 때 누르기
 *   puppet  인형극: 이야기 줄마다 알맞은 인형 고르기
 *   wind    태엽 감기: 여러 번 눌러 끝까지 감기
 */
export type MiniDir = 'up' | 'down' | 'left' | 'right';

export interface MiniInput {
  act: boolean;
  hold: boolean;
  dir: MiniDir | null;
}

export interface Mini {
  id: string;
  done: boolean;
  /** 이번에 울릴 소리 */
  sfx: string[];
  step(dt: number, inp: MiniInput): void;
}

// ───────── 종이별 접기
export const FOLDS: MiniDir[][] = [
  ['down', 'right', 'down', 'left', 'up'],
  ['right', 'right', 'down', 'up', 'left'],
  ['down', 'left', 'right', 'down', 'up'],
];

export class StarsMini implements Mini {
  id = 'stars';
  done = false;
  sfx: string[] = [];
  star = 0;
  fold = 0;
  /** 틀리면 잠깐 흔들림 */
  wrong = 0;
  /** 별 하나 다 접고 쉬는 시간 */
  rest = 0;
  readonly seq: MiniDir[][];
  constructor(seq: MiniDir[][] = FOLDS) {
    this.seq = seq;
  }
  get want(): MiniDir | null {
    return this.done || this.rest > 0 ? null : this.seq[this.star][this.fold];
  }
  step(dt: number, inp: MiniInput): void {
    this.wrong = Math.max(0, this.wrong - dt);
    if (this.done) return;
    if (this.rest > 0) {
      this.rest -= dt;
      if (this.rest <= 0 && this.star >= this.seq.length) this.done = true;
      return;
    }
    if (!inp.dir) return;
    if (inp.dir !== this.want) {
      this.wrong = 0.4;
      this.sfx.push('miss');
      return;
    }
    this.sfx.push('fold');
    this.fold++;
    if (this.fold >= this.seq[this.star].length) {
      this.fold = 0;
      this.star++;
      this.rest = 1.2;
      this.sfx.push('star');
    }
  }
}

// ───────── 촛불 끄기
export const BREATH = { rise: 0.6, zone: [0.62, 0.9] as const, candles: 7 };

export class CandlesMini implements Mini {
  id = 'candles';
  done = false;
  sfx: string[] = [];
  breath = 0;
  lit = BREATH.candles;
  /** 너무 세게 불어 콜록 (잠깐 쉼) */
  cough = 0;
  holding = false;
  step(dt: number, inp: MiniInput): void {
    if (this.done) return;
    this.cough = Math.max(0, this.cough - dt);
    if (this.cough > 0) return;
    if (inp.hold) {
      this.holding = true;
      this.breath += BREATH.rise * dt;
      if (this.breath > 1) {
        this.breath = 0;
        this.holding = false;
        this.cough = 1;
        this.sfx.push('cough');
      }
      return;
    }
    if (!this.holding) return;
    // 놓았다: 숨만큼 촛불이 꺼진다
    this.holding = false;
    const b = this.breath;
    this.breath = 0;
    const out = b >= BREATH.zone[0] && b <= BREATH.zone[1] ? 3 : b >= 0.3 ? 1 : 0;
    if (out === 0) return;
    this.lit = Math.max(0, this.lit - out);
    this.sfx.push('blow');
    if (this.lit === 0) this.done = true;
  }
}

// ───────── 바느질
export const SEW = { speed: 1.3, zone: 0.12, stitches: 6 };

export class SewMini implements Mini {
  id = 'sew';
  done = false;
  sfx: string[] = [];
  /** 바늘 자리 0~1 (오가며) */
  t = 0;
  dirSign = 1;
  stitches = 0;
  /** 표시 자리 */
  mark = 0.5;
  miss = 0;
  step(dt: number, inp: MiniInput): void {
    if (this.done) return;
    this.miss = Math.max(0, this.miss - dt);
    this.t += this.dirSign * SEW.speed * dt;
    if (this.t > 1) {
      this.t = 2 - this.t;
      this.dirSign = -1;
    } else if (this.t < 0) {
      this.t = -this.t;
      this.dirSign = 1;
    }
    if (!inp.act) return;
    if (Math.abs(this.t - this.mark) <= SEW.zone) {
      this.stitches++;
      this.sfx.push('stitch');
      // 다음 표시는 다른 자리
      this.mark = [0.3, 0.7, 0.45, 0.2, 0.8, 0.55][this.stitches % 6];
      if (this.stitches >= SEW.stitches) this.done = true;
    } else {
      this.miss = 0.4;
      this.sfx.push('miss');
    }
  }
}

// ───────── 인형극
export interface PuppetCue {
  line: string;
  /** 고를 인형 (보리 · 루루 · 나비 · 토비) */
  answer: string;
  /** 틀린 인형을 고르면 하루가 웃으며 하는 말 */
  silly: string;
}

export const PUPPET_CUES: PuppetCue[] = [
  { line: '옛날 옛적, 꿀을 너무 좋아하는 곰이 살았어요.', answer: 'bori', silly: '"이 친구는 꿀보다 생선을 좋아하는데?" 하루가 깔깔 웃는다.' },
  { line: '숲에는 장난을 좋아하는 꼬마 여우도 있었지요.', answer: 'ruru', silly: '"에이, 그건 여우가 아니잖아!"' },
  { line: '밤이 되면 등불을 든 고양이가 길을 밝혀 주었어요.', answer: 'nabi', silly: '"고양이는 어디 갔어? 등불이 없으면 깜깜해!"' },
  { line: '그리고 태엽이 달린 토끼가 모두를 집으로 데려왔답니다.', answer: 'toby', silly: '"토비가 빠지면 안 되지!"' },
];
export const PUPPETS = ['toby', 'bori', 'ruru', 'nabi'];

export class PuppetMini implements Mini {
  id = 'puppet';
  done = false;
  sfx: string[] = [];
  cue = 0;
  sel = 0;
  /** 틀린 인형을 골랐을 때 잠깐 보이는 말 */
  silly: string | null = null;
  sillyT = 0;
  /** 맞히고 다음 줄로 넘어가기 전 */
  cheer = 0;
  step(dt: number, inp: MiniInput): void {
    if (this.done) return;
    if (this.sillyT > 0) {
      this.sillyT -= dt;
      if (this.sillyT <= 0) this.silly = null;
    }
    if (this.cheer > 0) {
      this.cheer -= dt;
      if (this.cheer <= 0) {
        this.cue++;
        if (this.cue >= PUPPET_CUES.length) this.done = true;
      }
      return;
    }
    if (inp.dir === 'left') this.sel = (this.sel + PUPPETS.length - 1) % PUPPETS.length;
    if (inp.dir === 'right') this.sel = (this.sel + 1) % PUPPETS.length;
    if (!inp.act) return;
    const c = PUPPET_CUES[this.cue];
    if (PUPPETS[this.sel] === c.answer) {
      this.cheer = 1.4;
      this.silly = null;
      this.sfx.push('cheer');
    } else {
      this.silly = c.silly;
      this.sillyT = 2.2;
      this.sfx.push('giggle');
    }
  }
}

// ───────── 태엽 감기
export const WIND = { per: 0.07, decay: 0.05 };

export class WindMini implements Mini {
  id = 'wind';
  done = false;
  sfx: string[] = [];
  v = 0;
  step(dt: number, inp: MiniInput): void {
    if (this.done) return;
    if (inp.act) {
      this.v = Math.min(1, this.v + WIND.per);
      this.sfx.push('windTick');
      if (this.v >= 1) this.done = true;
      return;
    }
    this.v = Math.max(0, this.v - WIND.decay * dt);
  }
}

// ───────── 기억의 문 맞추기 (투더문의 기억 퍼즐처럼)
/**
 * 장마다 네 가지 놀이를 돌아가며 연다. 같은 놀이는 장이 갈수록 다음 단계(더 크고 길게).
 *   flip   뒤집기: 줄 · 칸을 뒤집어 그림 맞추기 (3×3 → 5×5)
 *   order  순서 놓기: 흐릿한 기억부터 또렷한 기억까지 차례로 고르기 (3 → 6장)
 *   thread 실 잇기: 모든 못을 한 번씩 지나는 한붓그리기
 *   photo  찢어진 사진: 돌아간 조각을 돌려 바로 세우기 (2×2 → 4×4)
 * 틀린 수를 세어 ASSIST.hint 번이면 힌트를 보여 주고, ASSIST.skip 번이면 건너뛸 수 있다
 * (이야기 게임이므로 퍼즐이 이야기를 막지 않는다).
 */
export const PUZZLE_KINDS = ['flip', 'order', 'thread', 'photo'] as const;
export type PuzzleKind = (typeof PUZZLE_KINDS)[number];

/** 다 맞추고 끝나기까지 */
export const PUZZLE_REST = 1.2;
/** hint: 이만큼 틀리면 힌트, skip: 이만큼 틀리면 건너뛰기, hold: 건너뛰려고 꾹 누르는 초 */
export const ASSIST = { hint: 2, skip: 3, hold: 1.2 };

export function puzzleId(kind: PuzzleKind, level: number): string {
  return `${kind}${level}`;
}

export function parsePuzzleId(id: string): { kind: PuzzleKind; level: number } | null {
  const m = /^(flip|order|thread|photo)(\d+)$/.exec(id);
  return m ? { kind: m[1] as PuzzleKind, level: Number(m[2]) } : null;
}

const DXY: Record<MiniDir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** 네 놀이가 함께 쓰는 틀: 틀린 수 · 힌트 · 건너뛰기 · 다 맞춘 뒤 쉬기 */
export class MemoryPuzzle implements Mini {
  id: string;
  kind: PuzzleKind;
  level = 1;
  done = false;
  sfx: string[] = [];
  moves = 0;
  fails = 0;
  /** 틀리면 잠깐 흔들림 */
  wrong = 0;
  /** 다 맞춘 뒤 남은 시간 */
  solved = 0;
  skipped = false;
  /** 건너뛰려고 꾹 누른 시간 */
  holdT = 0;
  constructor(kind: PuzzleKind) {
    this.kind = kind;
    this.id = kind;
  }
  /** 판 크기 (칸 · 장 · 못 수): 난이도 */
  get size(): number {
    return 0;
  }
  /** 처음 판을 푸는 가장 짧은 수 */
  get least(): number {
    return 0;
  }
  get hinting(): boolean {
    return this.fails >= ASSIST.hint && !this.isSolved();
  }
  get canSkip(): boolean {
    return this.fails >= ASSIST.skip;
  }
  isSolved(): boolean {
    return false;
  }
  /** 건너뛸 때 판을 다 맞춘 모습으로 */
  protected solveNow(): void {}
  /** 놀이별 입력 */
  protected play(_dt: number, _inp: MiniInput): void {}
  /** 입력을 받을 수 있는가 (다 맞춘 뒤 · 끝난 뒤는 아님) */
  protected get live(): boolean {
    return !this.done && this.solved <= 0;
  }
  skip(): void {
    if (!this.canSkip || !this.live) return;
    this.solveNow();
    this.skipped = true;
    this.sfx.push('sparkle');
    this.win();
  }
  protected fail(): void {
    this.fails++;
    this.wrong = 0.4;
    this.sfx.push('miss');
  }
  /** 한 수를 둔 뒤: 다 맞았으면 쉬기 시작 */
  protected check(): void {
    if (this.isSolved()) this.win();
  }
  private win(): void {
    this.solved = PUZZLE_REST;
    this.sfx.push('memory');
  }
  step(dt: number, inp: MiniInput): void {
    this.wrong = Math.max(0, this.wrong - dt);
    if (this.done) return;
    if (this.solved > 0) {
      this.solved -= dt;
      if (this.solved <= 0) this.done = true;
      return;
    }
    if (this.canSkip && inp.hold) {
      this.holdT += dt;
      if (this.holdT >= ASSIST.hold) {
        this.skip();
        return;
      }
    } else this.holdT = 0;
    this.play(dt, inp);
  }
}

// ── (a) 뒤집기
export type Flip = ['row' | 'col', number];

/**
 * 판을 모두 앞면으로 만드는 가장 짧은 뒤집기 (없으면 null).
 * 칸 (y,x) 가 뒤집혀 있다 ⇔ 줄 y 와 칸 x 중 하나만 뒤집어야 한다. 줄 넷 = 칸 넷이므로 답과 그 보수 중 짧은 쪽.
 */
export function solveFlip(grid: boolean[], n: number): Flip[] | null {
  const col = Array.from({ length: n }, (_, x) => !grid[x]);
  const row = Array.from({ length: n }, (_, y) => !grid[y * n] !== col[0]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((row[y] !== col[x]) !== !grid[y * n + x]) return null;
  const count = row.filter(Boolean).length + col.filter(Boolean).length;
  const want = count <= 2 * n - count;
  const out: Flip[] = [];
  row.forEach((v, i) => v === want && out.push(['row', i]));
  col.forEach((v, i) => v === want && out.push(['col', i]));
  return out;
}

export class FlipMini extends MemoryPuzzle {
  readonly n: number;
  /** n×n, true = 앞면 */
  grid: boolean[];
  cursor: { kind: 'row' | 'col'; i: number } = { kind: 'row', i: 0 };
  private readonly start: boolean[];
  private readonly first: number;
  constructor(n: number, scramble: Flip[]) {
    super('flip');
    this.n = n;
    this.grid = new Array(n * n).fill(true);
    for (const [k, i] of scramble) this.apply(k, i);
    this.start = [...this.grid];
    this.first = this.remaining();
  }
  override get size(): number {
    return this.n * this.n;
  }
  override get least(): number {
    return this.first;
  }
  remaining(): number {
    return solveFlip(this.grid, this.n)?.length ?? Infinity;
  }
  override isSolved(): boolean {
    return this.grid.every((v) => v);
  }
  private apply(kind: 'row' | 'col', i: number): void {
    for (let j = 0; j < this.n; j++) {
      const k = kind === 'row' ? i * this.n + j : j * this.n + i;
      this.grid[k] = !this.grid[k];
    }
  }
  flip(kind: 'row' | 'col', i: number): void {
    if (!this.live) return;
    const before = this.remaining();
    this.apply(kind, i);
    this.moves++;
    this.sfx.push('fold');
    if (this.remaining() > before) this.fail();
    this.check();
  }
  reset(): void {
    if (!this.live) return;
    this.grid = [...this.start];
    this.moves = 0;
  }
  hint(): Flip | null {
    return solveFlip(this.grid, this.n)?.[0] ?? null;
  }
  protected override solveNow(): void {
    this.grid.fill(true);
  }
  protected override play(_dt: number, inp: MiniInput): void {
    const c = this.cursor;
    const last = this.n - 1;
    if (inp.dir === 'up' || inp.dir === 'down') {
      if (c.kind === 'row') c.i = Math.max(0, Math.min(last, c.i + (inp.dir === 'down' ? 1 : -1)));
      else if (inp.dir === 'down') this.cursor = { kind: 'row', i: 0 };
    }
    if (inp.dir === 'left' || inp.dir === 'right') {
      if (c.kind === 'col') {
        if (inp.dir === 'left' && c.i === 0) this.cursor = { kind: 'row', i: 0 };
        else c.i = Math.max(0, Math.min(last, c.i + (inp.dir === 'right' ? 1 : -1)));
      } else if (inp.dir === 'right') this.cursor = { kind: 'col', i: 0 };
    }
    if (inp.act) this.flip(this.cursor.kind, this.cursor.i);
  }
}

// ── (b) 순서 놓기
export class OrderMini extends MemoryPuzzle {
  /** 놓인 자리마다 그 장면의 차례 (0 = 가장 흐릿한 처음 장면) */
  readonly cards: number[];
  /** 지금까지 차례대로 놓은 장 수 */
  placed = 0;
  sel = 0;
  constructor(shuffle: number[]) {
    super('order');
    const sorted = [...shuffle].sort((a, b) => a - b);
    if (sorted.some((v, i) => v !== i)) throw new Error(`순서 놓기 카드가 0…n-1 이 아니다: ${shuffle}`);
    this.cards = [...shuffle];
  }
  override get size(): number {
    return this.cards.length;
  }
  override get least(): number {
    return this.cards.length;
  }
  override isSolved(): boolean {
    return this.placed >= this.cards.length;
  }
  isPlaced(i: number): boolean {
    return this.cards[i] < this.placed;
  }
  pick(i: number): void {
    if (!this.live || i < 0 || i >= this.cards.length || this.isPlaced(i)) return;
    this.sel = i;
    if (this.cards[i] !== this.placed) {
      this.fail();
      return;
    }
    this.placed++;
    this.moves++;
    this.sfx.push('page');
    this.check();
    if (!this.isSolved()) this.sel = this.nextFree(i, 1) ?? this.nextFree(i, -1) ?? i;
  }
  private nextFree(from: number, d: number): number | null {
    for (let i = from + d; i >= 0 && i < this.cards.length; i += d) if (!this.isPlaced(i)) return i;
    return null;
  }
  hint(): number | null {
    return this.isSolved() ? null : this.cards.indexOf(this.placed);
  }
  protected override solveNow(): void {
    this.placed = this.cards.length;
  }
  protected override play(_dt: number, inp: MiniInput): void {
    if (inp.dir === 'left' || inp.dir === 'right') this.sel = this.nextFree(this.sel, inp.dir === 'left' ? -1 : 1) ?? this.sel;
    if (inp.act) this.pick(this.sel);
  }
}

// ── (c) 실 잇기
interface Board {
  w: number;
  h: number;
  open: boolean[];
  start: number;
}

function board(rows: string[]): Board {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const open: boolean[] = [];
  let start = -1;
  rows.forEach((r, y) => {
    if (r.length !== w) throw new Error(`실 잇기 판의 줄 길이가 다르다: ${rows}`);
    for (let x = 0; x < w; x++) {
      open.push(r[x] !== '#');
      if (r[x] === 'S') start = y * w + x;
    }
  });
  if (start < 0) throw new Error(`실 잇기 판에 시작 못(S)이 없다: ${rows}`);
  return { w, h, open, start };
}

function neighbors(b: Board, c: number): number[] {
  const x = c % b.w;
  const y = Math.floor(c / b.w);
  const out: number[] = [];
  for (const [dx, dy] of Object.values(DXY)) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < b.w && ny < b.h && b.open[ny * b.w + nx]) out.push(ny * b.w + nx);
  }
  return out;
}

function finishPath(b: Board, path: number[]): number[] | null {
  const total = b.open.filter(Boolean).length;
  const seen = new Set(path);
  const p = [...path];
  const go = (): boolean => {
    if (p.length === total) return true;
    for (const n of neighbors(b, p[p.length - 1])) {
      if (seen.has(n)) continue;
      seen.add(n);
      p.push(n);
      if (go()) return true;
      p.pop();
      seen.delete(n);
    }
    return false;
  };
  return go() ? p : null;
}

/** 시작 못에서 (또는 이미 이은 실 path 에서 이어) 모든 못을 지나는 길. 없으면 null */
export function solveThread(rows: string[], path?: number[]): number[] | null {
  const b = board(rows);
  return finishPath(b, path ?? [b.start]);
}

/** 갇혔다가 실이 처음 못으로 돌아가기까지 */
const THREAD_STUCK = 0.6;

export class ThreadMini extends MemoryPuzzle {
  readonly rows: string[];
  readonly w: number;
  readonly h: number;
  readonly open: boolean[];
  readonly start: number;
  readonly openCount: number;
  path: number[];
  /** 막다른 곳에 갇힌 뒤 남은 시간 (그동안 입력 없음) */
  stuck = 0;
  private readonly b: Board;
  constructor(rows: string[]) {
    super('thread');
    this.rows = rows;
    this.b = board(rows);
    this.w = this.b.w;
    this.h = this.b.h;
    this.open = this.b.open;
    this.start = this.b.start;
    this.openCount = this.open.filter(Boolean).length;
    this.path = [this.start];
  }
  override get size(): number {
    return this.openCount;
  }
  override get least(): number {
    return this.openCount - 1;
  }
  override isSolved(): boolean {
    return this.path.length === this.openCount;
  }
  get head(): number {
    return this.path[this.path.length - 1];
  }
  /** 실을 한 못으로: 머리 옆 빈 못이면 늘이고, 바로 앞 못이면 감는다 */
  private to(c: number): boolean {
    if (this.path.length > 1 && c === this.path[this.path.length - 2]) {
      this.path.pop();
      this.sfx.push('rope');
      return true;
    }
    if (!neighbors(this.b, this.head).includes(c) || this.path.includes(c)) {
      this.wrong = 0.2;
      return false;
    }
    this.path.push(c);
    this.moves++;
    this.sfx.push('stitch');
    if (this.isSolved()) this.check();
    else if (neighbors(this.b, c).every((n) => this.path.includes(n))) {
      this.fail();
      this.stuck = THREAD_STUCK;
    }
    return true;
  }
  move(d: MiniDir): void {
    if (!this.live || this.stuck > 0) return;
    const x = (this.head % this.w) + DXY[d][0];
    const y = Math.floor(this.head / this.w) + DXY[d][1];
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) {
      this.wrong = 0.2;
      return;
    }
    this.to(y * this.w + x);
  }
  /** 못을 누르기: 지난 못이면 거기까지 감고, 머리 옆이면 늘인다 */
  tap(c: number): void {
    if (!this.live || this.stuck > 0) return;
    const at = this.path.indexOf(c);
    if (at >= 0) {
      if (at < this.path.length - 1) {
        this.path.length = at + 1;
        this.sfx.push('rope');
      }
      return;
    }
    this.to(c);
  }
  /** 다음에 갈 못 (지금 실에서 풀이가 없으면 하나 되감기) */
  hint(): number | null {
    if (this.isSolved()) return null;
    const p = finishPath(this.b, this.path);
    if (p) return p[this.path.length];
    return this.path.length > 1 ? this.path[this.path.length - 2] : null;
  }
  protected override solveNow(): void {
    this.path = finishPath(this.b, [this.start]) ?? this.path;
    this.stuck = 0;
  }
  protected override play(dt: number, inp: MiniInput): void {
    if (this.stuck > 0) {
      this.stuck -= dt;
      if (this.stuck <= 0) {
        this.stuck = 0;
        this.path = [this.start];
      }
      return;
    }
    if (inp.dir) this.move(inp.dir);
  }
}

// ── (d) 찢어진 사진
export class PhotoMini extends MemoryPuzzle {
  readonly n: number;
  /** 조각마다 돌아간 정도 (시계 방향 90° 단위, 0 = 바로 섬) */
  rot: number[];
  cursor = { x: 0, y: 0 };
  private readonly first: number;
  constructor(n: number, rot: number[]) {
    super('photo');
    if (rot.length !== n * n) throw new Error(`사진 조각 수가 ${n}×${n} 이 아니다`);
    if (rot.some((r) => !Number.isInteger(r) || r < 0 || r > 3)) throw new Error(`사진 조각 돌림은 0~3: ${rot}`);
    this.n = n;
    this.rot = [...rot];
    this.first = this.rot.reduce((s, r) => s + ((4 - r) % 4), 0);
  }
  override get size(): number {
    return this.n * this.n;
  }
  override get least(): number {
    return this.first;
  }
  override isSolved(): boolean {
    return this.rot.every((r) => r === 0);
  }
  /** 조각 하나를 시계 방향으로 한 번. 바로 선 조각을 돌리면 틀린 수 */
  turn(i: number): void {
    if (!this.live || i < 0 || i >= this.rot.length) return;
    this.cursor = { x: i % this.n, y: Math.floor(i / this.n) };
    if (this.rot[i] === 0) this.fail();
    this.rot[i] = (this.rot[i] + 1) % 4;
    this.moves++;
    this.sfx.push('paper');
    this.check();
  }
  hint(): number | null {
    const i = this.rot.findIndex((r) => r !== 0);
    return i < 0 ? null : i;
  }
  protected override solveNow(): void {
    this.rot.fill(0);
  }
  protected override play(_dt: number, inp: MiniInput): void {
    if (inp.dir) {
      const [dx, dy] = DXY[inp.dir];
      this.cursor = { x: Math.max(0, Math.min(this.n - 1, this.cursor.x + dx)), y: Math.max(0, Math.min(this.n - 1, this.cursor.y + dy)) };
    }
    if (inp.act) this.turn(this.cursor.y * this.n + this.cursor.x);
  }
}

// ── 단계 표 (앞일수록 쉽다)
export const FLIP_LEVELS: { n: number; scramble: Flip[] }[] = [
  { n: 3, scramble: [['row', 1], ['col', 2]] },
  { n: 3, scramble: [['row', 0], ['col', 1], ['row', 2]] },
  { n: 4, scramble: [['row', 1], ['col', 1], ['col', 3]] },
  { n: 4, scramble: [['row', 1], ['col', 1], ['row', 2], ['col', 3]] },
  { n: 5, scramble: [['row', 0], ['col', 1], ['row', 3], ['col', 3], ['row', 4]] },
];

/** 놓인 자리마다 장면의 차례 */
export const ORDER_LEVELS: number[][] = [
  [2, 0, 1],
  [1, 3, 0, 2],
  [3, 0, 4, 1, 2],
  [4, 1, 3, 0, 2],
  [5, 2, 0, 4, 1, 3],
];

/** S 시작 못, # 빈자리, . 못 */
export const THREAD_LEVELS: string[][] = [
  ['S..', '.#.', '...'],
  ['S...', '..#.', '....'],
  ['S...', '....', '.#..', '....'],
  ['S.....', '..#...', '....#.', '......'],
  ['S....', '.....', '..#..', '....#', '.....'],
];

export const PHOTO_LEVELS: { n: number; rot: number[] }[] = [
  { n: 2, rot: [0, 1, 0, 3] },
  { n: 3, rot: [0, 3, 0, 1, 0, 2, 0, 0, 3] },
  { n: 3, rot: [3, 1, 0, 2, 3, 0, 1, 0, 3] },
  { n: 4, rot: [0, 3, 0, 2, 1, 0, 3, 0, 0, 2, 0, 3, 3, 0, 1, 0] },
  { n: 4, rot: [2, 3, 0, 0, 3, 0, 2, 1, 0, 1, 3, 0, 1, 0, 0, 3] },
];

const PUZZLES: Record<PuzzleKind, ((lv: number) => MemoryPuzzle)[]> = {
  flip: FLIP_LEVELS.map((l) => () => new FlipMini(l.n, l.scramble)),
  order: ORDER_LEVELS.map((l) => () => new OrderMini(l)),
  thread: THREAD_LEVELS.map((l) => () => new ThreadMini(l)),
  photo: PHOTO_LEVELS.map((l) => () => new PhotoMini(l.n, l.rot)),
};

const MINIS: Record<string, () => Mini> = {
  stars: () => new StarsMini(),
  /** 천 번째 별: 하나만 */
  star1000: () => Object.assign(new StarsMini([FOLDS[0]]), { id: 'star1000' }),
  candles: () => new CandlesMini(),
  sew: () => new SewMini(),
  puppet: () => new PuppetMini(),
  wind: () => new WindMini(),
  ...Object.fromEntries(
    PUZZLE_KINDS.flatMap((k) =>
      PUZZLES[k].map((make, i) => [
        puzzleId(k, i + 1),
        () => Object.assign(make(i + 1), { id: puzzleId(k, i + 1), level: i + 1 }),
      ]),
    ),
  ),
};

export function makeMini(id: string): Mini {
  const f = MINIS[id];
  if (!f) throw new Error(`없는 놀이: ${id}`);
  return f();
}

export const MINI_IDS = Object.keys(MINIS);
