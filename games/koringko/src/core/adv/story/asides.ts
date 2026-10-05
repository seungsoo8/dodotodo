/**
 * 기억 뒤 감상 줄이기: 기억이 끝나고 저절로 나오는 감상(after)은 말 0~2 줄만 남기고,
 * 나머지는 그 대화를 가장 많이 한 동료에게 옮겨 둔다 (aside — 말을 걸면 한 번 듣는다).
 * 원래 대사는 버리지 않고 차례 그대로 옮긴다. 남긴 after 는 그 동료의 「…」 로 끝나 말을 걸어 볼 실마리를 준다.
 */
import type { Aside, Cmd, Thing } from '../types.ts';

/** 말하는 장난감 (감상 줄 수를 셀 때) */
const VOICES = new Set(['toby', 'bori', 'ruru', 'nabi', 'doll']);
const PALS = ['bori', 'ruru', 'nabi'] as const;
type Pal = (typeof PALS)[number];
/** 대사에 딸린 연출: 다음 대사와 함께 남거나 옮겨 간다 */
const STAGING = new Set(['act', 'emote', 'face', 'wait', 'pose']);

const isPalId = (w: string): w is Pal => (PALS as readonly string[]).includes(w);

/** 방 안 몇 번째 기억인지에 따라 남길 감상 줄 수: 두 줄 · 한 줄 · 말 없이 (셋 중 하나는 몸짓으로만 끝난다) */
export const KEEP_PATTERN = [2, 1, 0] as const;

/**
 * 이야기가 걸린 감상은 남길 줄 수를 따로 정한다 (앞에서부터 몇 줄).
 * 장의 고비(깨달음 · 다음 할 일)를 여는 말은 저절로 들리게, 그 뒤 이야기는 말을 걸어서.
 */
export const KEEP: Record<string, number> = {
  m1f: 2, // 「정말 두고 가고 싶었으면 한 번에 썼겠지」
  m2c: 1,
  m3b: 2, // 나비 등불로 찾자 (놀이 귀띔)
  m3c: 2, // 마지막 태엽
  m4c: 1,
  mNf: 2, // 나비를 돌려놓은 건 할머니
  m8c: 1, // 「날 찾으러 와 줬어」
  mTf: 2, // 「멈춘 게 아니라 기다리고 있었던 거야」
  m9c: 2, // 할머니의 부탁
  mGc: 2, // 눈을 뜬 인형
  mGe: 2, // 「태엽이 멈추기 전에」
  mEPf: 2, // 이루어진 소원
};

/**
 * after 를 남길 것(앞에서부터 keep 줄)과 옮길 것으로 나눈다.
 * 대사에 딸린 연출(몸짓 · 감정)은 그 대사를 따라가고, 깃발 · 소리 같은 일은 늘 남긴다.
 * @if 갈래가 있는 감상(깨우기 전후로 말하는 이가 바뀌는 것)은 그대로 둔다.
 */
export function splitAfter(after: readonly Cmd[], keep: number): { after: Cmd[]; aside?: Aside } {
  if (after.some((c) => c.t === 'if')) return { after: [...after] };
  const kept: Cmd[] = [];
  const moved: Cmd[] = [];
  let buf: Cmd[] = [];
  let said = 0;
  let last = kept;
  for (const c of after) {
    if (STAGING.has(c.t)) {
      buf.push(c);
      continue;
    }
    if (c.t === 'say') {
      last = said < keep ? kept : moved;
      last.push(...buf, c);
      buf = [];
      if (VOICES.has(c.who)) said++;
      continue;
    }
    last.push(...buf);
    buf = [];
    kept.push(c);
  }
  last.push(...buf);
  const lines = (cs: Cmd[]) => cs.filter((c): c is Extract<Cmd, { t: 'say' }> => c.t === 'say' && VOICES.has(c.who));
  if (!lines(moved).length) return { after: [...after] };
  const who = owner(lines(moved).map((c) => c.who), lines(kept).map((c) => c.who));
  if (!who) return { after: [...after] };
  return { after: [...kept, { t: 'emote', who, e: '…' }], aside: { who, text: moved } };
}

/** 옮긴 감상을 맡을 동료: 옮긴 말 가운데 가장 많이 말한 동료 (같으면 먼저 말한 이), 없으면 남긴 말의 동료 */
function owner(moved: string[], kept: string[]): Pal | null {
  let best: Pal | null = null;
  let bn = 0;
  for (const w of moved) {
    if (!isPalId(w)) continue;
    const n = moved.filter((x) => x === w).length;
    if (n > bn) {
      best = w;
      bn = n;
    }
  }
  return best ?? (kept.find(isPalId) as Pal | undefined) ?? null;
}

/** 방의 기억마다 감상을 나눈다 (방 안 차례로 KEEP_PATTERN 을 돌린다). pals: 이 방에서 말을 걸 수 있는 동료 */
export function trimAfters(things: Thing[], pals?: ReadonlySet<string>): Thing[] {
  let i = 0;
  return things.map((t) => {
    if ((t.kind !== 'memory' && t.kind !== 'keepsake') || !t.after) return t;
    const keep = KEEP[t.id] ?? KEEP_PATTERN[i % KEEP_PATTERN.length];
    i++;
    const { after, aside } = splitAfter(t.after, keep);
    // 그 방에 없는 동료에게는 옮기지 않는다 (들을 수 없는 감상이 되지 않게)
    if (!aside || (pals && !pals.has(aside.who))) return { ...t, after: [...t.after] };
    return { ...t, after, aside };
  });
}
