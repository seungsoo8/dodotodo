/**
 * 음악 감독 (MusicDirector 표): 지금 문맥에서 어떤 곡을 틀지 정한다. 화면 · 소리와 무관한 계산.
 *
 * 대본의 `@music <낱말>` 과 방의 `music` 은 대부분 분위기 낱말(HINTS: night · box · piano · grandma · sorrow …)이다.
 * 감독은 그 낱말을 문맥(기억 id · 기억 방 꾸밈 · 방 id · 방 꾸밈 · 장(막) · 깃발 · 새벽빛)으로 구체적인 곡으로 바꾼다.
 * 그래서 대본을 고치지 않아도 기억마다 인물 테마가, 방마다 그곳의 탐험 곡이 흐른다.
 *
 * 우선순위
 *   1. 발소리(얼음 땡)가 들리면 긴장 곡            by 'tension'
 *   2. @music none 은 고요                          by 'silence'
 *   3. 낱말이 아닌 곡 이름(toby · ex_bath …) 또는 '!낱말' 은 그대로   by 'explicit'
 *   4. 모르는 이름은 고요                           by 'unknown'
 *   5. 기억 속: 기억 id → 기억 id 앞머리(가장 긴 것) → 기억 방 꾸밈 → 기억 기본   by 'memory-id' | 'memory-prefix' | 'memory-look' | 'tone'
 *      (방 id 연출 ROOM_HINTS 는 지금 · 새벽 장면용: 같은 방을 빌려 쓰는 기억 속으로는 새지 않는다)
 *   6. 지금 · 새벽: 탐험 낱말(night 이거나 방 음악과 같은 낱말)이면 깃발 → 방 id → 방 꾸밈 → 장 묶음   by 'flag' | 'room' | 'look' | 'act'
 *      그 밖의 낱말(장면 연출)은 방 id 연출 → 새벽빛 기본                             by 'room-hint' | 'tone'
 *   7. 낱말 그대로                                  by 'default'
 *
 * 이야기를 막(act)으로 다시 묶어도: 표는 방 id · 꾸밈 · 기억 id 앞머리로만 고르므로 장 번호를 고칠 일이 없다.
 * 새 방은 ROOM_CUES 한 줄, 새 기억 묶음은 MEMORY_PREFIX 한 줄이면 된다. 아무것도 없으면 장 묶음 밤 곡(night · night2 · night3).
 */
import type { AdvData } from '../../core/adv/adv.ts';
import { exploreSong, SONGS, type SongId } from './score.ts';

/** 분위기 낱말 → 갈래 (따뜻 · 놀이 · 슬픔 · 비 · 밤) */
export const HINTS = {
  night: 'night',
  box: 'warm',
  piano: 'warm',
  grandma: 'warm',
  memory: 'warm',
  hope: 'warm',
  finale: 'warm',
  waltz: 'play',
  playful: 'play',
  minor: 'sad',
  sorrow: 'sad',
  longing: 'sad',
  dark: 'sad',
  rain: 'rain',
} as const satisfies Record<string, 'night' | 'warm' | 'play' | 'sad' | 'rain'>;

export type Hint = keyof typeof HINTS;
type HintClass = (typeof HINTS)[Hint];
/** 낱말 · 갈래 · '*'(아무 낱말) → 곡. 위에서부터: 낱말, 갈래, '*' */
export type Slot = Partial<Record<Hint | HintClass | '*', SongId>>;

const isHint = (t: string): t is Hint => t in HINTS;

/** 이 슬롯에서 낱말의 곡 (낱말 → 갈래 → '*') */
function pick(slot: Slot | undefined, hint: Hint): SongId | undefined {
  if (!slot) return undefined;
  return slot[hint] ?? slot[HINTS[hint]] ?? slot['*'];
}

// ───────── 탐험: 방 id → 곳마다 곡 ─────────
export const ROOM_CUES: Record<string, SongId> = {
  h_yard_eve: 'haru_teen', // 서장: 이삿날 전날 저녁, 열다섯 하루
  attic: 'ex_attic',
  grandroom: 'ex_grandma',
  closet: 'ex_grandma',
  dresser: 'ex_haru',
  underbed: 'dark',
  window: 'ex_living',
  shelf: 'ex_living',
  sofa: 'ex_living',
  entrance: 'ex_hall',
  schoolbag: 'ex_haru',
  desk: 'ex_desk',
  bath: 'ex_bath',
  drawer: 'ex_kitchen',
  cupboard: 'ex_kitchen',
  balcony: 'ex_outside',
  outside: 'ex_outside',
  yard: 'ex_rain',
  tobykey: 'ex_clock',
  toybox: 'box',
  sewbox: 'ex_sewing',
  attic_dawn: 'ex_dawn',
  newroom_toy: 'epilogue',
};

/** 탐험: 방 id 가 표에 없으면 방 꾸밈으로 (새로 지은 방 · 막 재구성 대비) */
export const LOOK_CUES: Record<string, SongId> = {
  attic: 'ex_attic',
  gmNight: 'ex_grandma',
  grandma: 'ex_grandma',
  living: 'ex_living',
  living8: 'ex_living',
  kitchenNight: 'ex_kitchen',
  kitchen: 'ex_kitchen',
  haru13: 'ex_haru',
  haru14: 'ex_haru',
  haru15: 'ex_haru',
  bathNight: 'ex_bath',
  bath: 'ex_bath',
  balcony: 'ex_outside',
  alley: 'ex_outside',
  playground: 'ex_outside',
  yardNight: 'ex_rain',
  newroom: 'epilogue',
};

/** 깃발이 서면 그 방 탐험 곡을 바꾼다 (위에서부터 처음 맞는 것) */
export const FLAG_CUES: { flag: string; room?: string; track: SongId }[] = [
  // 토비의 태엽 속에서 「끝이 기억 안 나는 노래」를 본 뒤: 태엽 속이 못 다 부른 오르골을 흥얼거린다
  { flag: 'mem_mTe', room: 'tobykey', track: 'orgel' },
];

// ───────── 장면 연출: 지금 · 새벽 장면에서 방 id 로 낱말을 바꾼다 (탐험 낱말이 아닐 때) ─────────
export const ROOM_HINTS: Record<string, Slot> = {
  // 마지막 장: 하루가 오르골을 열지만 끝은 아직 → 못 다 부른 오르골
  h_attic: { box: 'orgel', longing: 'haru_teen' },
  // 끝 자막 뒤 새 방의 오르골 = 끝 노래
  h_newroom: { box: 'credits', piano: 'main_hope' },
  // 새벽 골목: 지우가 기다리고 있다
  m_out_alley_d: { longing: 'jiwoo' },
};

/** 빛(tone)마다 기본: 기억 속 밤 낱말은 탐험 곡이 아니라 세피아, 새벽의 finale 는 끝까지 부르는 새벽 노래 */
export const TONE_HINTS: Record<'memory' | 'dawn' | 'now', Slot> = {
  memory: { night: 'grandma_sepia', memory: 'grandma_sepia' },
  dawn: { finale: 'dawn_song', hope: 'main_hope' },
  now: {},
};

// ───────── 기억 ─────────
/** 기억 하나에 매긴 곡 (앞머리보다 앞선다) */
export const MEMORY_IDS: Record<string, Slot> = {
  // 토비의 「끝이 기억 안 나는 노래」
  mTe: { '*': 'orgel' },
  // 할머니가 숨긴 병: 진찰실 · 비밀로 해 다오
  mGa: { sad: 'reveal' },
  mGb: { sad: 'reveal' },
  // 아빠가 앞에 선 기억
  m1g: { warm: 'dad', play: 'dad' },
  m3f: { warm: 'dad', play: 'dad' },
  m6b: { warm: 'dad', play: 'dad' },
  mRe: { warm: 'dad', play: 'dad' },
  mRf: { warm: 'dad', play: 'dad' },
  mVd: { warm: 'dad', play: 'dad' },
  mEPd: { warm: 'dad', play: 'dad' },
  mEPe: { warm: 'dad', play: 'dad' },
  // 지우와 둘이
  mOUf: { warm: 'jiwoo', play: 'jiwoo', longing: 'jiwoo' },
  // 네 살: 선물 상자는 메인 테마 오르골, 어린이집 첫날은 어린 하루
  m9a: { '*': 'box' },
  m9g: { warm: 'haru_child' },
  // 마당의 밤하늘 별
  mBd: { warm: 'lullaby' },
};

/** 기억 id 앞머리 (장 · 동료 묶음): 가장 긴 앞머리가 이긴다 */
export const MEMORY_PREFIX: Record<string, Slot> = {
  m1: { warm: 'haru_teen' }, // 열다섯, 떠나기 전
  m2: { piano: 'grandma', minor: 'grandma_sepia' }, // 할머니 방, 열네 살
  m3: { night: 'haru_teen' }, // 장례 무렵, 열세 살
  m4: { box: 'grandma_sepia' }, // 병원, 비
  m5: { grandma: 'grandma', box: 'grandma_sepia', play: 'haru_child', night: 'lullaby' }, // 종이별, 열 살
  m6: { waltz: 'toby', playful: 'haru_child', box: 'grandma_sepia' }, // 토비 극장, 여덟 살
  m7: { play: 'haru_child', night: 'lullaby' }, // 일곱 살 생일, 오르골
  m8: { waltz: 'haru_child' }, // 비 오는 마당, 다섯 살
  m9: { warm: 'toby' }, // 네 살, 토비를 만난 날
  mE: { box: 'grandma_sepia', play: 'haru_child' }, // 현관: 놓지 마, 미역국
  mB: { box: 'grandma_sepia', play: 'haru_child' }, // 욕실: 할머니 머리 감기
  mV: { box: 'grandma_sepia', play: 'haru_child' }, // 베란다: 하루 꽃
  mG: { box: 'grandma_sepia', grandma: 'grandma_sepia' }, // 재봉 상자: 할머니의 비밀
  mN: { warm: 'nabi', play: 'nabi', night: 'nabi' }, // 나비
  mR: { warm: 'ruru', play: 'ruru', grandma: 'grandma_sepia' }, // 루루
  mO: { warm: 'bori', play: 'bori', night: 'bori' }, // 보리 (옛집)
  mOU: { piano: 'haru_child', waltz: 'haru_child' }, // 골목 · 놀이터
  mM: { warm: 'mom', play: 'mom', night: 'mom' }, // 엄마
  mJ: { warm: 'jiwoo', play: 'jiwoo' }, // 지우
  mT: { warm: 'toby', play: 'toby', night: 'toby' }, // 토비의 태엽
  mEP: { piano: 'main_hope', waltz: 'haru_child', box: 'box' }, // 새 방, 에필로그: 오르골은 메인 테마
};

/** 기억 id 를 모를 때: 기억 방 꾸밈으로 */
export const MEMORY_LOOKS: Record<string, Slot> = {
  haru4: { warm: 'box' },
  haru7: { play: 'haru_child' },
  haru10: { play: 'haru_child' },
  haru13: { warm: 'haru_teen', night: 'haru_teen' },
  haru14: { warm: 'haru_teen' },
  haru15: { warm: 'haru_teen', night: 'haru_teen' },
  grandma: { warm: 'grandma' },
  grandma14: { warm: 'grandma_sepia' },
  gmNight: { warm: 'grandma_sepia', night: 'lullaby' },
  oldhome: { warm: 'bori', play: 'bori' },
  oldhomeNight: { warm: 'bori', night: 'bori' },
  arcade: { warm: 'ruru', play: 'ruru' },
  hospital: { warm: 'grandma_sepia' },
  hospitalNight: { warm: 'grandma_sepia' },
  newroom: { warm: 'main_hope' },
};

/** 문맥 */
export interface CueCtx {
  /** 무대 음악 (대본 · 방이 정한 낱말이나 곡 이름, null = 고요) */
  track: string | null;
  steps?: 'calm' | 'warn' | 'hold';
  tone?: 'now' | 'memory' | 'dawn';
  /** 지금 방 id · 꾸밈 · 방의 음악 낱말 */
  room?: string;
  look?: string;
  roomMusic?: string;
  /** 지금 보는 기억 id (기억 속일 때) */
  memory?: string | null;
  /** 장(막) 번호 / 전체 */
  act?: { n: number; of: number };
  flags?: Readonly<Record<string, unknown>>;
}

export type CueBy = 'tension' | 'silence' | 'explicit' | 'unknown' | 'memory-id' | 'memory-prefix' | 'room-hint' | 'memory-look' | 'tone' | 'flag' | 'room' | 'look' | 'act' | 'default';

export interface Cue {
  id: SongId | null;
  by: CueBy;
}

const isSong = (t: string): t is SongId => t in SONGS;

/** 가장 긴 맞는 앞머리 */
function prefixSlot(mem: string): Slot | undefined {
  let best = '';
  for (const p of Object.keys(MEMORY_PREFIX)) if (mem.startsWith(p) && p.length > best.length) best = p;
  return best ? MEMORY_PREFIX[best] : undefined;
}

export function resolveCue(c: CueCtx): Cue {
  if (c.steps && c.steps !== 'calm') return { id: 'tension', by: 'tension' };
  const t = c.track;
  if (t === null) return { id: null, by: 'silence' };
  if (t.startsWith('!')) {
    const lit = t.slice(1);
    return isSong(lit) ? { id: lit, by: 'explicit' } : { id: null, by: 'unknown' };
  }
  if (!isHint(t)) return isSong(t) ? { id: t, by: 'explicit' } : { id: null, by: 'unknown' };
  const tone = c.tone ?? 'now';
  if (tone === 'memory') {
    const mem = c.memory ?? '';
    const byId = mem ? pick(MEMORY_IDS[mem], t) : undefined;
    if (byId) return { id: byId, by: 'memory-id' };
    const byPrefix = mem ? pick(prefixSlot(mem), t) : undefined;
    if (byPrefix) return { id: byPrefix, by: 'memory-prefix' };
    const byLook = c.look ? pick(MEMORY_LOOKS[c.look], t) : undefined;
    if (byLook) return { id: byLook, by: 'memory-look' };
    const byTone = TONE_HINTS.memory[t];
    if (byTone) return { id: byTone, by: 'tone' };
    return { id: t, by: 'default' };
  }
  const explore = t === 'night' || (c.roomMusic !== undefined && t === c.roomMusic);
  if (explore) {
    for (const f of FLAG_CUES) if (c.flags?.[f.flag] && (!f.room || f.room === c.room)) return { id: f.track, by: 'flag' };
    const byRoom = c.room ? ROOM_CUES[c.room] : undefined;
    if (byRoom) return { id: byRoom, by: 'room' };
    const byLook = c.look ? LOOK_CUES[c.look] : undefined;
    if (byLook) return { id: byLook, by: 'look' };
    if (t === 'night') return { id: c.act ? exploreSong(c.act.n, c.act.of) : 'night', by: 'act' };
  }
  const roomHint = c.room ? pick(ROOM_HINTS[c.room], t) : undefined;
  if (roomHint) return { id: roomHint, by: 'room-hint' };
  const byTone = TONE_HINTS[tone][t];
  if (byTone) return { id: byTone, by: 'tone' };
  return { id: t, by: 'default' };
}

/** 지금 틀 곡 (resolveCue 의 곡만) */
export function cueFor(c: CueCtx): SongId | null {
  return resolveCue(c).id;
}

/** 방 하나의 탐험 곡: 방 음악 낱말(없으면 night)로 지금 빛에서 고른다 */
export function exploreCue(roomId: string, data: Pick<AdvData, 'rooms'>, act?: { n: number; of: number }): SongId | null {
  const f = data.rooms[roomId];
  if (!f) return null;
  const r = f();
  return cueFor({ track: r.music ?? 'night', tone: 'now', room: r.id, look: r.look, roomMusic: r.music, act });
}
