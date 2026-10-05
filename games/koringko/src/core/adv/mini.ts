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
export type Flip = ['row' | 'col', number];
/** 다 맞추고 끝나기까지 */
const MEMENTO_REST = 1.2;

/**
 * 가장 짧은 풀이 횟수. 같은 줄을 두 번 뒤집으면 제자리이고,
 * 네 줄을 모두 뒤집는 것은 네 칸을 모두 뒤집는 것과 같다 (둘 다 판 전체가 뒤집힌다)
 */
export function leastFlips(scramble: Flip[]): number {
  const odd = new Set<string>();
  for (const [k, i] of scramble) {
    const key = `${k}${i}`;
    if (odd.has(key)) odd.delete(key);
    else odd.add(key);
  }
  return Math.min(odd.size, 8 - odd.size);
}

export class MementoMini implements Mini {
  id = 'memento';
  done = false;
  sfx: string[] = [];
  /** 4×4, true = 앞면 */
  grid: boolean[] = new Array(16).fill(true);
  cursor: { kind: 'row' | 'col'; i: number } = { kind: 'row', i: 0 };
  moves = 0;
  /** 풀기까지 최소 횟수 (보여 주기용) */
  readonly least: number;
  /** 다 맞춘 뒤 남은 시간 */
  solved = 0;
  private readonly start: boolean[];
  constructor(scramble: Flip[]) {
    for (const [k, i] of scramble) this.apply(k, i);
    this.start = [...this.grid];
    this.least = leastFlips(scramble);
  }
  private apply(kind: 'row' | 'col', i: number): void {
    for (let j = 0; j < 4; j++) {
      const k = kind === 'row' ? i * 4 + j : j * 4 + i;
      this.grid[k] = !this.grid[k];
    }
  }
  flip(kind: 'row' | 'col', i: number): void {
    if (this.solved > 0) return;
    this.apply(kind, i);
    this.moves++;
    this.sfx.push('fold');
    if (this.grid.every((v) => v)) {
      this.solved = MEMENTO_REST;
      this.sfx.push('memory');
    }
  }
  reset(): void {
    this.grid = [...this.start];
    this.moves = 0;
  }
  step(dt: number, inp: MiniInput): void {
    if (this.done) return;
    if (this.solved > 0) {
      this.solved -= dt;
      if (this.solved <= 0) this.done = true;
      return;
    }
    if (this.grid.every((v) => v)) {
      this.solved = MEMENTO_REST;
      return;
    }
    const c = this.cursor;
    if (inp.dir === 'up' || inp.dir === 'down') {
      if (c.kind === 'row') c.i = Math.max(0, Math.min(3, c.i + (inp.dir === 'down' ? 1 : -1)));
      else if (inp.dir === 'down') this.cursor = { kind: 'row', i: 0 };
    }
    if (inp.dir === 'left' || inp.dir === 'right') {
      if (c.kind === 'col') {
        if (inp.dir === 'left' && c.i === 0) this.cursor = { kind: 'row', i: 0 };
        else c.i = Math.max(0, Math.min(3, c.i + (inp.dir === 'right' ? 1 : -1)));
      } else if (inp.dir === 'right') this.cursor = { kind: 'col', i: 0 };
    }
    if (inp.act) this.flip(this.cursor.kind, this.cursor.i);
  }
}

/** 장마다 기억의 문 문제 (뒤집는 순서). 장이 갈수록 길어진다 */
export const MEMENTOS: Flip[][] = [
  [['row', 1], ['col', 2]],
  [['row', 0], ['col', 3], ['row', 2]],
  [['col', 1], ['row', 3], ['col', 0]],
  [['row', 1], ['col', 1], ['col', 3]],
  [['row', 1], ['col', 1], ['row', 2], ['col', 3]],
  [['col', 0], ['row', 0], ['col', 2], ['row', 3]],
  [['row', 2], ['col', 1], ['row', 0], ['row', 1]],
  [['col', 2], ['row', 3], ['col', 0], ['col', 3]],
  [['row', 0], ['col', 1], ['row', 2], ['col', 2]],
  [['col', 3], ['row', 1], ['col', 0], ['row', 2]],
  [['row', 3], ['col', 2], ['row', 1], ['col', 0]],
  [['col', 1], ['row', 2], ['row', 0], ['row', 3]],
  [['row', 1], ['col', 0], ['col', 3], ['col', 2]],
];

const MINIS: Record<string, () => Mini> = {
  stars: () => new StarsMini(),
  /** 천 번째 별: 하나만 */
  star1000: () => Object.assign(new StarsMini([FOLDS[0]]), { id: 'star1000' }),
  candles: () => new CandlesMini(),
  sew: () => new SewMini(),
  puppet: () => new PuppetMini(),
  wind: () => new WindMini(),
  ...Object.fromEntries(MEMENTOS.map((f, i) => [`memento${i + 1}`, () => Object.assign(new MementoMini(f), { id: `memento${i + 1}` })])),
};

export function makeMini(id: string): Mini {
  const f = MINIS[id];
  if (!f) throw new Error(`없는 놀이: ${id}`);
  return f();
}

export const MINI_IDS = Object.keys(MINIS);
