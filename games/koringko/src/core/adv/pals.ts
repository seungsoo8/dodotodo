/**
 * 동료(보리 · 루루 · 나비)가 장난감 방에서 지내는 법: 각자 자기 자리에서 지내다가, 말을 걸어 부르면 따라온다.
 * 여기는 순수한 부분 — 칸 길 찾기 · 기본 자리 고르기 · 자리 자세 · 몸짓 · 말 걸기 대사.
 */
import type { HeroId } from '../types.ts';
import type { Cmd, Facing, Pt } from './types.ts';

export type PalId = 'bori' | 'ruru' | 'nabi';
export const PALS: readonly PalId[] = ['bori', 'ruru', 'nabi'];

export function isPal(h: string): h is PalId {
  return (PALS as readonly string[]).includes(h);
}

/** 네 방향 칸 길 (from 은 빼고 to 는 넣는다). 같은 칸이면 [], 못 가면 null */
export function findPath(from: Pt, to: Pt, open: (x: number, y: number) => boolean, w: number, h: number): [number, number][] | null {
  if (from[0] === to[0] && from[1] === to[1]) return [];
  if (!open(to[0], to[1])) return null;
  const prev = new Int32Array(w * h).fill(-1);
  const start = from[1] * w + from[0];
  prev[start] = start;
  const q = [start];
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    const cx = c % w;
    const cy = (c - cx) / w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (prev[n] >= 0 || !open(nx, ny)) continue;
      prev[n] = c;
      if (nx === to[0] && ny === to[1]) {
        const path: [number, number][] = [];
        for (let k = n; k !== start; k = prev[k]) path.push([k % w, Math.floor(k / w)]);
        return path.reverse();
      }
      q.push(n);
    }
  }
  return null;
}

/** 동료마다 좋아하는 거리 (들어온 칸에서 몇 걸음): 보리는 가까이, 나비는 조금 떨어져, 루루는 멀리 */
const LIKE_DIST: Record<PalId, number> = { bori: 5, nabi: 8, ruru: 11 };

/**
 * 자리표가 없는 방의 기본 자리: 들어온 칸에서 걸어서 닿는 칸 가운데
 * 살펴볼 것(avoid) 바로 옆은 피하고, 가구 · 벽에 기댈 수 있는 칸을 좋아하며, 서로 · 들어온 칸과 떨어지게.
 * 방이 좁으면 간격을 줄여서라도 겹치지 않게 준다.
 */
export function pickHangouts(heroes: readonly HeroId[], entry: Pt, open: (x: number, y: number) => boolean, w: number, h: number, avoid: readonly Pt[]): Partial<Record<PalId, Pt>> {
  // 들어온 칸에서의 걸음 수
  const d = new Int32Array(w * h).fill(-1);
  const q: number[] = [];
  if (open(entry[0], entry[1])) {
    d[entry[1] * w + entry[0]] = 0;
    q.push(entry[1] * w + entry[0]);
  }
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    const cx = c % w;
    const cy = (c - cx) / w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || !open(nx, ny)) continue;
      const n = ny * w + nx;
      if (d[n] >= 0) continue;
      d[n] = d[c] + 1;
      q.push(n);
    }
  }
  const cells = q.map((c) => [c % w, Math.floor(c / w)] as [number, number]);
  const nearThing = (x: number, y: number) => avoid.some((v) => Math.max(Math.abs(v[0] - x), Math.abs(v[1] - y)) <= 1);
  /** 기댈 곳: 네 이웃 중 막힌 칸 수 (막다른 칸 3 이상은 싫어함) */
  const lean = (x: number, y: number) => {
    let n = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) n++;
    return n >= 3 ? -1 : n;
  };
  const out: Partial<Record<PalId, Pt>> = {};
  const taken: Pt[] = [entry];
  const pals = heroes.filter(isPal);
  for (const p of pals) {
    let best: [number, number] | null = null;
    for (const gap of [3, 2, 1]) {
      let bs = -Infinity;
      for (const [x, y] of cells) {
        if (taken.some((t) => Math.hypot(t[0] - x, t[1] - y) < gap)) continue;
        const thing = nearThing(x, y);
        const score = lean(x, y) * 2 - Math.abs(d[y * w + x] - LIKE_DIST[p]) * 0.6 - (thing ? 20 : 0) + ((x * 7 + y * 13) % 5) * 0.01;
        if (score > bs) {
          bs = score;
          best = [x, y];
        }
      }
      if (best) break;
    }
    const at: Pt = best ?? entry;
    out[p] = at;
    taken.push(at);
  }
  return out;
}

/** 자리에서의 자세 (몸짓이 끝나면 돌아갈 자세) */
export const HOME_POSE: Record<PalId, string> = { bori: 'chinRest', ruru: 'idle', nabi: 'sleepSit' };

/** 자리에서 가끔 하는 몸짓 (차례로 돈다) */
export const IDLE_ACTS: Record<PalId, readonly string[]> = {
  bori: ['stretch', 'nod', 'sigh', 'pat'],
  ruru: ['lookAround', 'hop', 'spin', 'giggle', 'peek'],
  nabi: ['stretch', 'lookAround', 'nod'],
};

/** 몸짓 사이 (초): 루루가 가장 부산스럽다 */
export const IDLE_GAP: Record<PalId, readonly [number, number]> = { bori: [7, 4], ruru: [4, 3], nabi: [9, 5] };

/** 다가가면 반기는 감정 */
export const GREET: Record<PalId, '♪' | '!' | '…'> = { bori: '♪', ruru: '!', nabi: '…' };

/** 방에 남은 일 (말을 걸면 귀띔) */
export interface PalNeeds {
  /** 밀어야 할 물건이 남았다 */
  push: boolean;
  /** 무게 2 물건이 남았다 */
  heavy: boolean;
  /** 루루 밧줄이 필요한 곳 (오르기 · 틈) */
  high: boolean;
  /** 어둠 속에 숨은 것 */
  dark: boolean;
}

const CHAT: Record<PalId, readonly string[]> = {
  bori: [
    '여기 앉아 있으면 꿀 냄새가 나는 것 같아. …기분 탓인가.',
    '천천히 둘러봐, 토비. 난 여기서 기다릴게.',
    '하루가 날 안고 낮잠 자던 게 생각나. 그때도 이렇게 조용했어.',
    '배는 안 고파. …조금 고파.',
  ],
  ruru: [
    '토비 토비, 저쪽 봤어? 아직 아무도 안 만져 본 데가 있어!',
    '가만히 있는 거 제일 싫어. 뭐 재밌는 거 없어?',
    '난 높은 데가 좋아. 다 내려다보이잖아.',
    '쉿, 나 지금 숨바꼭질 연습 중이야. 못 본 척해.',
  ],
  nabi: [
    '…졸린 거 아니야. 눈 감고 듣는 중이야.',
    '서두르지 마. 기억은 도망가지 않아.',
    '이 집 냄새, 아직 하루 냄새가 나.',
    '네 태엽 소리, 아까보다 조금 느려. …무리하지 마.',
  ],
};

const HINT: Record<PalId, (n: PalNeeds) => string | null> = {
  bori: (n) => (n.push ? '저 무거운 거 밀어야 해? 그럼 나를 불러. 힘은 자신 있어.' : null),
  ruru: (n) => (n.high ? '저 위에 올라가 보고 싶지? 내 밧줄이면 금방이야.' : n.heavy ? '보리 혼자 밀기엔 무거워 보이던데. 필요하면 나도 거들게.' : null),
  nabi: (n) => (n.dark ? '어두운 데는 나를 데려가. 내 눈이 밝으니까.' : n.heavy ? '그 무거운 거, 보리 혼자는 못 밀 거야. …거들어 줄 수는 있어.' : null),
};

const ASK_WITH: Record<PalId, string> = { bori: '응, 토비. 계속 같이 갈까?', ruru: '왜? 벌써 심심해졌어?', nabi: '…왜. 할 말 있어?' };
const YES: Record<PalId, string> = { bori: '좋아, 앞장서!', ruru: '야호, 모험이다!', nabi: '…그래. 같이 가 줄게.' };
const NO: Record<PalId, string> = { bori: '알았어. 여기서 기다릴게.', ruru: '쳇. 재밌는 거 생기면 꼭 불러!', nabi: '응. 여기 있을게.' };
const REST: Record<PalId, string> = { bori: '그럼 아까 거기 가서 쉴게. 또 불러.', ruru: '알았어~ 필요하면 크게 불러!', nabi: '응. 아까 그 자리에 있을게.' };
const STAY: Record<PalId, string> = { bori: '응. 계속 붙어 있을게.', ruru: '그럼 그렇지!', nabi: '…알았어.' };

/** 일이 끝나면 자기 자리로 돌아가며 하는 말 */
export const DONE_LINE: Record<PalId, string> = {
  bori: '다 됐다! 난 아까 그 자리에 가 있을게. 또 필요하면 불러.',
  ruru: '이 정도야 뭐. 난 저쪽에서 놀고 있을게!',
  nabi: '끝났으면 됐어. 난 아까 거기로 갈게.',
};

/** 최근 본 기억 감상을 꺼낼 때의 첫마디 (기억 이름으로 어느 기억인지 알린다) · 몸짓 */
const RECALL: Record<PalId, (name: string) => string> = {
  bori: (m) => `토비, 아까 그 「${m}」 말이야…`,
  ruru: (m) => `있잖아. 「${m}」, 그거 말인데.`,
  nabi: (m) => `…「${m}」. 아직 생각하고 있었어.`,
};
const RECALL_ACT: Record<PalId, string> = { bori: 'think', ruru: 'lookAround', nabi: 'sigh' };

/**
 * 동료에게 말을 걸 때의 장면: 돌아보고 → (방 대사 · 귀띔 · 잡담) → 고르기 → 따라오거나 남거나.
 * talk 는 그 방 자리표의 대사 (처음 한 번), n 은 이 동료와 말한 횟수,
 * recent 는 이 동료가 아직 들려주지 않은 최근 기억 감상 (있으면 그것부터).
 */
export function palTalk(p: PalId, opt: { withMe: boolean; needs: PalNeeds; talk?: Cmd[]; n: number; recent?: { name: string; text: Cmd[] }; follow?: boolean }): Cmd[] {
  const q = `talk_${p}`;
  const lines: Cmd[] = [];
  if (opt.recent) lines.push({ t: 'act', who: p, name: RECALL_ACT[p], wait: false }, { t: 'say', who: p, text: RECALL[p](opt.recent.name) }, ...opt.recent.text);
  else if (opt.withMe && !opt.follow) lines.push({ t: 'say', who: p, text: ASK_WITH[p] });
  else if (opt.talk && opt.n === 0) lines.push(...opt.talk);
  else {
    const hint = opt.follow ? null : HINT[p](opt.needs);
    lines.push({ t: 'say', who: p, text: hint && opt.n % 2 === 0 ? hint : CHAT[p][opt.n % CHAT[p].length] });
  }
  // 늘 따라다니는 막: 감상 · 자리 대사 · 잡담만 (같이 가자 / 여기 있어 고르기는 없다)
  if (opt.follow) return [{ t: 'face', who: p, dir: 'toby' }, ...lines];
  const [yes, no] = opt.withMe ? ['계속 같이 가자', '여기서 쉬어'] : ['같이 가자', '여기 있어'];
  return [
    { t: 'face', who: p, dir: 'toby' },
    ...lines,
    { t: 'flag', name: `${q}_0`, v: false },
    { t: 'flag', name: `${q}_1`, v: false },
    { t: 'choice', flag: q, options: [yes, no] },
    {
      t: 'if',
      flag: `${q}_0`,
      then: [{ t: 'act', who: p, name: p === 'ruru' ? 'hop' : 'nod', wait: false }, { t: 'say', who: p, text: opt.withMe ? STAY[p] : YES[p] }, { t: 'call', who: p, on: true }],
      else: [{ t: 'say', who: p, text: opt.withMe ? REST[p] : NO[p] }, { t: 'call', who: p, on: false }],
    },
  ];
}

/** 동료가 자기 자리에서 보는 쪽 (자리표가 없으면 아래) */
export const HOME_DIR: Facing = 'down';
