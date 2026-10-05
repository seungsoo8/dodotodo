/**
 * 사람 크기 인물 (기억 속 하루 · 할머니 · 엄마 · 아빠): 머리가 큰 귀여운 비율, 4방향 · 걷기 · 감정 자세.
 * 하루는 나이마다 키 · 머리 비율 · 옷이 바뀌고, 늘 노란 별 머리핀을 한다 (할머니가 준 것).
 */
import { CLEAR, Pix, hex, mix, shade, type Color } from './paint.ts';
import type { Mood } from '../../core/adv/types.ts';
import { HEAD_SETS, headPalette, type HeadKind, type HeadTpl } from './peopleHeads.ts';
import { paintGrid, softOutline } from './px/grid.ts';

export type PDir = 'down' | 'up' | 'left' | 'right';
/** 몸짓 (@act: 한 번 하는 동작, 시간으로 프레임이 돈다) */
export const PERSON_ACTS = ['nod', 'shake', 'laugh', 'giggle', 'clap', 'jump', 'hop', 'bow', 'sigh', 'wipe', 'stretch', 'point', 'think', 'shiver', 'tremble', 'spin', 'pat', 'stomp', 'peek', 'surprise', 'lookAround', 'shrug', 'cheer'] as const;
/** 새 계속 자세 (@pose) */
export const PERSON_MORE = ['read', 'write', 'knit', 'sew', 'cook', 'eat', 'drink', 'lie', 'hugKnees', 'handsBack', 'hipsHands', 'chinRest', 'lookDown', 'sleepSit', 'wavePush', 'carryBack'] as const;
export type PAct = (typeof PERSON_ACTS)[number];
export type PPose = 'idle' | 'blink' | 'walk1' | 'walk2' | 'walk3' | 'walk4' | 'sit' | 'cry' | 'hold' | 'holdStar' | 'holdPhoto' | 'holdDoll' | 'phone' | 'umbrella' | 'wave' | 'kneel' | 'hug' | 'lookUp' | 'sleep' | PAct | (typeof PERSON_MORE)[number];

export const PERSON_POSES: PPose[] = ['idle', 'blink', 'walk1', 'walk2', 'walk3', 'walk4', 'sit', 'cry', 'hold', 'holdStar', 'holdPhoto', 'holdDoll', 'phone', 'umbrella', 'wave', 'kneel', 'hug', 'lookUp', 'sleep', ...PERSON_ACTS, ...PERSON_MORE];

/** 움직이는 자세: 프레임 수 · 1초에 넘기는 횟수 (그 밖의 자세는 한 장) */
export const PERSON_ANIM: Partial<Record<PPose, { n: number; rate: number }>> = {
  nod: { n: 2, rate: 4 }, shake: { n: 2, rate: 6 }, laugh: { n: 2, rate: 8 }, giggle: { n: 2, rate: 6 }, clap: { n: 2, rate: 7 },
  jump: { n: 4, rate: 8 }, hop: { n: 2, rate: 7 }, bow: { n: 2, rate: 2.5 }, sigh: { n: 2, rate: 1.5 }, wipe: { n: 2, rate: 4 },
  stretch: { n: 2, rate: 2 }, point: { n: 2, rate: 3 }, think: { n: 2, rate: 1.2 }, shiver: { n: 2, rate: 14 }, tremble: { n: 2, rate: 20 },
  spin: { n: 4, rate: 10 }, pat: { n: 2, rate: 5 }, stomp: { n: 2, rate: 6 }, peek: { n: 2, rate: 1.5 }, surprise: { n: 2, rate: 5 },
  lookAround: { n: 2, rate: 1.4 }, shrug: { n: 2, rate: 2.5 }, cheer: { n: 2, rate: 5 },
  write: { n: 2, rate: 3 }, knit: { n: 2, rate: 4 }, sew: { n: 2, rate: 2 }, cook: { n: 2, rate: 2.5 }, eat: { n: 2, rate: 1.2 }, drink: { n: 2, rate: 0.6 },
  sleepSit: { n: 2, rate: 0.7 }, wavePush: { n: 2, rate: 1.2 },
};

/** 지금 보여 줄 프레임 (시간 → 0..n-1) */
export function personFrame(pose: string, time: number): number {
  const a = PERSON_ANIM[pose as PPose];
  return a ? Math.floor(time * a.rate) % a.n : 0;
}
export const PERSON_DIRS: PDir[] = ['down', 'up', 'left', 'right'];

type Top = 'overalls' | 'tee' | 'hoodie' | 'uniform' | 'dress' | 'cardigan' | 'raincoat' | 'stripe' | 'black' | 'apron' | 'shirt';
type Hair = 'bob' | 'pony' | 'bun' | 'short' | 'long' | 'tuft';

interface Look {
  /** 발바닥에서 정수리까지 칠하는 높이 (외곽선 빼고). 어른 43~45 · 네 살 31 */
  h: number;
  /** 머리(머리카락 포함) 높이 ÷ 키: 어릴수록 크다 (2~2.7등신) */
  head: number;
  skin: Color;
  hair: Color;
  hairStyle: Hair;
  clip?: Color;
  top: Color;
  topStyle: Top;
  trim: Color;
  bottom: Color;
  skirt?: boolean;
  shoes: Color;
  glasses?: boolean;
  /** 허리 굽음 (할머니): 머리가 이만큼 낮고 옆모습에서 앞으로 */
  hunch?: number;
  /** 몸통 폭 (짝수: 가운데 맞춤) */
  bodyW: number;
  /** 손으로 찍은 머리 본 (peopleHeads.ts): 있으면 머리 · 얼굴을 본으로 그리고 몸도 새 비율 */
  tpl?: HeadKind;
}

const SKIN = hex('#f6d2b4');
const HAIR = hex('#4a3226');
const CLIP = hex('#ffd84a');
const INK = hex('#2a1c24');
const EYE = hex('#3a2418');

export const PEOPLE: Record<string, Look> = {
  haru4: { h: 30, head: 0.5, skin: SKIN, hair: HAIR, hairStyle: 'tuft', clip: CLIP, top: hex('#ffd25a'), topStyle: 'overalls', trim: hex('#ffffff'), bottom: hex('#ffd25a'), shoes: hex('#e8584a'), bodyW: 10 },
  haru5: { h: 31, head: 0.5, skin: SKIN, hair: HAIR, hairStyle: 'tuft', clip: CLIP, top: hex('#ffcf3a'), topStyle: 'raincoat', trim: hex('#e8a020'), bottom: hex('#4a78d8'), shoes: hex('#e8584a'), bodyW: 10 },
  haru6: { h: 33, head: 0.49, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#ffd84a'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#ffd84a'), skirt: true, shoes: hex('#e8584a'), bodyW: 10 },
  haru7: { h: 34, head: 0.47, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#ff9ec7'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#ff9ec7'), skirt: true, shoes: hex('#c8384a'), bodyW: 10 },
  haru8: { h: 35, head: 0.46, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#f2f2f2'), topStyle: 'stripe', trim: hex('#4a90e0'), bottom: hex('#5a6aa8'), shoes: hex('#e8e0d0'), bodyW: 10 },
  haru9: { h: 36, head: 0.45, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#f2f2f2'), topStyle: 'stripe', trim: hex('#e05a5a'), bottom: hex('#4a5a8a'), shoes: hex('#f0f0f0'), bodyW: 10 },
  haru10: { h: 37, head: 0.44, skin: SKIN, hair: HAIR, hairStyle: 'bob', clip: CLIP, top: hex('#5a9ae8'), topStyle: 'hoodie', trim: hex('#ffffff'), bottom: hex('#3a4a6a'), shoes: hex('#f0f0f0'), bodyW: 10, tpl: 'kidBob' },
  haru11: { h: 38, head: 0.43, skin: SKIN, hair: HAIR, hairStyle: 'bob', clip: CLIP, top: hex('#8ad0a8'), topStyle: 'tee', trim: hex('#ffffff'), bottom: hex('#3a4a6a'), shoes: hex('#f0f0f0'), bodyW: 12 },
  haru12: { h: 39, head: 0.42, skin: SKIN, hair: HAIR, hairStyle: 'long', clip: CLIP, top: hex('#2e3a5e'), topStyle: 'uniform', trim: hex('#e05a5a'), bottom: hex('#2e3a5e'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 12 },
  haru13: { h: 40, head: 0.41, skin: SKIN, hair: HAIR, hairStyle: 'long', clip: CLIP, top: hex('#2a2630'), topStyle: 'black', trim: hex('#f2f2f2'), bottom: hex('#2a2630'), skirt: true, shoes: hex('#1a1418'), bodyW: 12 },
  haru14: { h: 41, head: 0.4, skin: SKIN, hair: HAIR, hairStyle: 'long', top: hex('#8a8a96'), topStyle: 'hoodie', trim: hex('#d8d8e0'), bottom: hex('#3a3e52'), shoes: hex('#f0f0f0'), bodyW: 12 },
  haru15: { h: 42, head: 0.39, skin: SKIN, hair: HAIR, hairStyle: 'long', top: hex('#c8b090'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#4a5a7a'), shoes: hex('#f0f0f0'), bodyW: 10, tpl: 'teenLong' },
  grandma: { h: 43, head: 0.38, skin: hex('#f0ccb0'), hair: hex('#e8e4ec'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#6a5a7a'), skirt: true, shoes: hex('#5a4038'), glasses: true, hunch: 2, bodyW: 12, tpl: 'elderBun' },
  // 태엽 할머니 인형: 할머니를 닮게 손바느질한 작은 인형 (장난감 크기 · 32×40 틀)
  grandoll: { h: 32, head: 0.5, skin: hex('#f4d8c0'), hair: hex('#eceaf2'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#7a6a8a'), skirt: true, shoes: hex('#5a4038'), glasses: true, bodyW: 12 },
  // 할머니의 지난날 (보리의 기억): 일곱 살 순이 · 스무 살 순이 · 마흔 살 순이, 젊은 할아버지, 순이 엄마, 어린 엄마 은주
  suni7: { h: 34, head: 0.47, skin: hex('#f2c8a8'), hair: hex('#1e1618'), hairStyle: 'bob', top: hex('#e0505a'), topStyle: 'dress', trim: hex('#ffe08a'), bottom: hex('#e0505a'), skirt: true, shoes: hex('#f0ece0'), bodyW: 10 },
  suni20: { h: 43, head: 0.38, skin: hex('#f2c8a8'), hair: hex('#1e1618'), hairStyle: 'long', top: hex('#8ab8e0'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#8ab8e0'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 12 },
  suni40: { h: 42, head: 0.38, skin: hex('#f0c8ac'), hair: hex('#3a2c2a'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#5a4a6a'), skirt: true, shoes: hex('#4a3a3a'), bodyW: 12 },
  gpa: { h: 44, head: 0.36, skin: hex('#e8c0a0'), hair: hex('#1e1618'), hairStyle: 'short', top: hex('#e8e0cc'), topStyle: 'shirt', trim: hex('#8a7a5a'), bottom: hex('#4a4038'), shoes: hex('#2a2020'), bodyW: 14 },
  gmom: { h: 42, head: 0.38, skin: hex('#e8c0a4'), hair: hex('#9a9098'), hairStyle: 'bun', top: hex('#e8dcc4'), topStyle: 'cardigan', trim: hex('#a8584a'), bottom: hex('#6a5a5a'), skirt: true, shoes: hex('#f0ece0'), hunch: 1, bodyW: 14 },
  eunju6: { h: 33, head: 0.49, skin: SKIN, hair: hex('#5a3a2a'), hairStyle: 'pony', clip: hex('#8ad0a8'), top: hex('#8ad0a8'), topStyle: 'overalls', trim: hex('#ffffff'), bottom: hex('#8ad0a8'), shoes: hex('#e8584a'), bodyW: 10 },
  // 하루의 친구 지우 (열 살 · 열세 살)
  jiwoo10: { h: 37, head: 0.44, skin: hex('#f2c8a4'), hair: hex('#2a1e1c'), hairStyle: 'pony', clip: hex('#e85a6a'), top: hex('#f0a050'), topStyle: 'hoodie', trim: hex('#ffffff'), bottom: hex('#4a5a7a'), shoes: hex('#f0f0f0'), bodyW: 12 },
  jiwoo13: { h: 40, head: 0.41, skin: hex('#f2c8a4'), hair: hex('#2a1e1c'), hairStyle: 'bob', top: hex('#2e3a5e'), topStyle: 'uniform', trim: hex('#e05a5a'), bottom: hex('#2e3a5e'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 12 },
  mom: { h: 43, head: 0.37, skin: SKIN, hair: hex('#5a3a2a'), hairStyle: 'pony', top: hex('#6ab08a'), topStyle: 'shirt', trim: hex('#f4ece0'), bottom: hex('#4a4a5a'), shoes: hex('#4a3a3a'), bodyW: 10, tpl: 'womanPony' },
  dad: { h: 44, head: 0.36, skin: hex('#f0c8a8'), hair: hex('#2a2226'), hairStyle: 'short', top: hex('#5a7ab8'), topStyle: 'shirt', trim: hex('#f4ece0'), bottom: hex('#3a3a48'), shoes: hex('#3a2a2a'), glasses: true, bodyW: 12, tpl: 'manShort' },
};

export function isPerson(kind: string): boolean {
  return kind in PEOPLE;
}

/** 그림 한 칸 폭 (RPG 만들기 XP 캐릭터 칸) */
export const PERSON_W = 32;
/** 사람 그림 높이: 사람 32×48, 장난감 크기 인형은 32×40 (뛰는 몸짓은 위에 여백을 더) */
export function personH(kind: string): number {
  return kind === 'grandoll' ? 40 : 48;
}
/** 발 아래 여백: 맨 아래 줄은 발바닥 외곽선 */
export const PERSON_FOOT_PAD = 1;

/** 머리 높이 · 다리 길이 (그림 뼈대) */
export function personBody(kind: string): { headD: number; legLen: number } {
  const L = PEOPLE[kind] ?? PEOPLE.haru10;
  const headD = L.tpl ? HEAD_SETS[L.tpl].down.hd : Math.round(L.h * L.head);
  // 본으로 그린 어른은 다리가 조금 길다 (어른이 「늘인 아이」로 보이지 않게)
  const legK = L.tpl && L.h >= 40 ? 0.56 : 0.5;
  return { headD, legLen: Math.max(4, Math.round((L.h - headD) * legK)) };
}


interface Motion {
  bob: number;
  legL: number;
  legR: number;
  armL: number;
  armR: number;
  eyes: 'open' | 'closed' | 'up' | 'down' | 'wide';
  low: number;
  /** 상체 숙임: 머리가 이만큼 더 내려간다 (집기) */
  bend: number;
  /** 머리만 옮기기 (옆모습에서 x 는 앞으로) */
  headDX: number;
  headDY: number;
  /** 눈동자 옆으로 */
  eyeDX: number;
  mouth: '' | 'o' | 'open';
  /** 그림 전체: 좌우 떨림 · 위로 뜸 (뛰기) · 다리 접기 */
  shiftX: number;
  lift: number;
  tuck: number;
}

/** 걸음 한 칸: 0 · 2 는 다리가 엇갈리고, 1 · 3 은 몸이 1칸 들썩인다 */
export type PStep = 0 | 1 | 2 | 3;

export interface PersonOpt {
  /** 걸음 프레임 (자세와 따로): 팔 자세 · 든 것은 그대로, 다리 · 들썩임만 걷는다 */
  step?: PStep;
  /** 두 팔을 앞으로 모아 물건을 받쳐 든다 (물건 그림은 따로) */
  carry?: boolean;
  /** 움직이는 자세 · 몸짓의 프레임 (personFrame) */
  frame?: number;
  /** 표정: 자세와 상관없이 눈 · 입 · 눈썹을 덧그린다 */
  mood?: Mood;
  /** 말하는 중 (입을 벌린다) */
  talk?: boolean;
  /** 몸 들썩임 더하기 (숨: -1 이면 1px 위로) */
  bob?: number;
}

/** 표정 → 눈 · 입 */
const MOOD_FACE: Record<Mood, { eyes: Motion['eyes']; mouth: Motion['mouth'] }> = {
  smile: { eyes: 'closed', mouth: 'open' },
  sad: { eyes: 'down', mouth: '' },
  surprise: { eyes: 'wide', mouth: 'o' },
  angry: { eyes: 'open', mouth: '' },
  tear: { eyes: 'closed', mouth: '' },
};

/** 뛰는 몸짓은 그림 위에 여백을 더 둔다 */
const TOP_PAD: Partial<Record<PPose, number>> = { jump: 6, hop: 4, stretch: 6, cheer: 6, surprise: 4, pat: 2, umbrella: 7 };

const WALK_POSE: Partial<Record<PPose, PStep>> = { walk1: 0, walk2: 1, walk3: 2, walk4: 3 };

function motion(pose: PPose, step: PStep | undefined, fr: number): Motion {
  const m: Motion = { bob: 0, legL: 0, legR: 0, armL: 0, armR: 0, eyes: 'open', low: 0, bend: 0, headDX: 0, headDY: 0, eyeDX: 0, mouth: '', shiftX: 0, lift: 0, tuck: 0 };
  const set = (o: Partial<Motion>) => Object.assign(m, o);
  if (step === 0) {
    m.legL = -2;
    m.legR = 1;
    m.armL = 2;
    m.armR = -2;
  } else if (step === 1 || step === 3) m.bob = -1;
  else if (step === 2) {
    m.legL = 1;
    m.legR = -2;
    m.armL = -2;
    m.armR = 2;
  }
  switch (pose) {
    case 'blink':
      m.eyes = 'closed';
      break;
    case 'cry':
    case 'hug':
      m.eyes = 'closed';
      break;
    case 'lookUp':
      m.eyes = 'up';
      break;
    case 'kneel':
      m.low = 0.5;
      m.bend = 3;
      break;
    case 'sit':
      m.low = 1;
      break;
    // ── 몸짓
    case 'nod': set(fr ? { headDY: 1, eyes: 'closed' } : { headDY: -1 }); break;
    case 'shake': set({ headDX: fr ? 1 : -1, eyes: 'closed' }); break;
    case 'laugh': set(fr ? { bob: -1, eyes: 'closed', mouth: 'open' } : { headDY: 1, eyes: 'closed', mouth: 'open' }); break;
    case 'giggle': set({ headDY: fr, eyes: 'closed' }); break;
    case 'clap': set({ eyes: fr ? 'open' : 'closed', mouth: 'open' }); break;
    case 'jump': set([{ low: 0.25 }, { lift: 5, tuck: 2, mouth: 'open' as const }, { lift: 3, tuck: 1, mouth: 'open' as const }, { low: 0.15 }][fr % 4]); break;
    case 'hop': set(fr ? { lift: 3, tuck: 1 } : { low: 0.2 }); break;
    case 'bow': set({ bend: fr ? 5 : 2, headDX: fr ? 2 : 1, eyes: fr ? 'closed' : 'open' }); break;
    case 'sigh': set(fr ? { headDY: 2, eyes: 'closed' } : { bob: -1 }); break;
    case 'wipe': set({ eyes: 'closed', headDY: fr ? 1 : 0 }); break;
    case 'stretch': set({ eyes: 'closed', mouth: 'o', bob: fr ? -1 : 0 }); break;
    case 'think': set({ eyes: 'up', eyeDX: fr ? 1 : 0 }); break;
    case 'shiver': set({ shiftX: fr ? 1 : -1 }); break;
    case 'tremble': set({ shiftX: fr ? 1 : -1, eyes: 'wide' }); break;
    case 'pat': set({ mouth: 'open' }); break;
    case 'stomp': set(fr ? { legR: -1, headDY: 1 } : { legL: -3, legR: 0 }); break;
    case 'peek': set({ headDX: fr ? 2 : 1, low: 0.15, bend: 1 }); break;
    case 'surprise': set({ eyes: 'wide', mouth: 'o', lift: fr ? 1 : 2 }); break;
    case 'lookAround': set({ headDX: fr ? 1 : -1, eyeDX: fr ? 1 : -1 }); break;
    case 'shrug': set(fr ? { headDY: 1, eyes: 'closed' } : { eyes: 'up' }); break;
    case 'cheer': set({ eyes: 'closed', mouth: 'open', lift: fr ? 2 : 0 }); break;
    // ── 계속 자세
    case 'read':
    case 'knit':
    case 'sew':
    case 'cook':
      m.eyes = 'down';
      break;
    case 'write': set({ eyes: 'down', headDY: 1 }); break;
    case 'eat': set(fr ? { mouth: 'o' } : { eyes: 'down' }); break;
    case 'drink': set(fr ? {} : { eyes: 'closed' }); break;
    case 'hugKnees': set({ low: 1, bend: 2, eyes: 'down' }); break;
    case 'lookDown': set({ headDY: 1, eyes: 'down' }); break;
    case 'sleepSit': set({ low: 1, headDY: fr ? 3 : 2, headDX: 1, eyes: 'closed' }); break;
    case 'wavePush': set({ bend: 1 }); break;
    case 'carryBack': set({ bend: 2 }); break;
    default:
      break;
  }
  return m;
}

type Limb = { h: [number, number]; e?: [number, number] } | null;
/** 팔 모양: 앞 · 뒷모습의 그림 왼팔(l) · 오른팔(r), 옆모습의 앞팔(s). 없으면 보통 팔, null 이면 감춘 팔 */
interface ArmSpec {
  l?: Limb;
  r?: Limb;
  s?: Limb;
}
interface Marks {
  c: number;
  bx: number;
  R: number;
  armTop: number;
  chest: number;
  waist: number;
  bodyBot: number;
  hcx: number;
  ey: number;
  chin: number;
  mouthY: number;
  mx: number;
  headTop: number;
  back: boolean;
  eyeR: number;
}

function armSpec(pose: PPose, fr: number, g: Marks): ArmSpec | null {
  const { c, bx, R, armTop, chest, waist, bodyBot, hcx, ey, chin, mouthY, mx, headTop } = g;
  switch (pose) {
    case 'clap':
      return fr ? { l: { e: [bx - 3, chest + 3], h: [bx - 4, chest] }, r: { e: [R + 1, chest + 3], h: [R + 2, chest] }, s: { e: [c, chest + 3], h: [c + 3, chest] } } : { l: { e: [bx - 2, chest + 3], h: [c - 2, chest] }, r: { e: [R, chest + 3], h: [c, chest] }, s: { e: [c + 1, chest + 3], h: [c + 6, chest] } };
    case 'wipe':
      return { r: { e: [R, chest + 2], h: [g.eyeR, ey + fr] }, s: { e: [c + 1, chest + 2], h: [mx - 1, ey + fr] } };
    case 'giggle':
      return { r: { e: [R, chest + 2], h: [Math.round(hcx), mouthY - 1] }, s: { e: [c + 1, chest + 2], h: [mx - 1, mouthY - 1] } };
    case 'stretch':
      return { l: { h: [bx - 3, headTop - 4 - fr] }, r: { h: [R + 1, headTop - 4 - fr] }, s: { h: [c + 1, headTop - 4 - fr] } };
    case 'cheer':
      return { l: { e: [bx - 4, armTop - 3], h: [bx - 5, headTop - 1] }, r: { e: [R + 2, armTop - 3], h: [R + 3, headTop - 1] }, s: { e: [c + 1, armTop - 3], h: [c + 3, headTop - 2] } };
    case 'surprise':
      return { l: { e: [bx - 4, chest], h: [bx - 5, armTop - 3] }, r: { e: [R + 2, chest], h: [R + 3, armTop - 3] }, s: { e: [c + 2, chest], h: [c + 4, armTop - 3] } };
    case 'jump':
      return fr === 1 || fr === 2 ? { l: { h: [bx - 4, armTop - 4] }, r: { h: [R + 2, armTop - 4] }, s: { h: [c + 2, armTop - 5] } } : null;
    case 'point':
      return { r: { h: [R + 5 + fr, armTop + 1] }, s: { h: [c + 8 + fr, armTop] } };
    case 'think':
      return { l: { e: [bx - 1, waist - 1], h: [c - 1, waist - 2] }, r: { e: [R, chest + 4], h: [Math.round(hcx) + 1, chin] }, s: { e: [c + 2, chest + 4], h: [mx - 1, chin] } };
    case 'shiver':
      return { l: { e: [bx - 2, chest + 3], h: [c + 1, chest + 1] }, r: { e: [R, chest + 3], h: [c - 3, chest + 1] }, s: { e: [c + 1, chest + 3], h: [c + 2, chest + 1] } };
    case 'pat':
      return { r: { h: [R + 3, armTop - 3 + fr * 2] }, s: { h: [c + 8, armTop - 3 + fr * 2] } };
    case 'shrug':
      return fr ? { l: { e: [bx - 3, chest + 2], h: [bx - 5, chest] }, r: { e: [R + 1, chest + 2], h: [R + 3, chest] }, s: { e: [c, chest + 2], h: [c + 3, chest] } } : { l: { h: [bx - 3, waist] }, r: { h: [R + 1, waist] }, s: { h: [c + 2, waist] } };
    case 'spin':
      return { l: { h: [bx - 4, chest + 3] }, r: { h: [R + 2, chest + 3] }, s: { h: [c + 4, chest + 3] } };
    case 'bow':
      return { l: { h: [bx, waist] }, r: { h: [R - 2, waist] }, s: { h: [c + 2, waist + 1] } };
    case 'hipsHands':
      return { l: { e: [bx - 4, chest + 2], h: [bx, waist - 1] }, r: { e: [R + 2, chest + 2], h: [R - 2, waist - 1] }, s: { e: [c - 3, chest + 2], h: [c - 1, waist - 1] } };
    case 'handsBack':
    case 'carryBack':
      if (g.back) return { l: { e: [bx - 2, chest + 3], h: [c - 3, waist + 1] }, r: { e: [R, chest + 3], h: [c + 1, waist + 1] } };
      return pose === 'handsBack' ? { l: null, r: null, s: { h: [c - 4, waist] } } : { l: { e: [bx - 3, chest + 3], h: [bx - 2, waist + 2] }, r: { e: [R + 1, chest + 3], h: [R, waist + 2] }, s: { h: [c - 5, waist + 1] } };
    case 'chinRest':
      return { l: { e: [bx, chest + 4], h: [Math.round(hcx) - 3, chin] }, r: { e: [R - 2, chest + 4], h: [Math.round(hcx) + 1, chin] }, s: { e: [c + 2, chest + 4], h: [mx - 1, chin] } };
    case 'read':
    case 'knit':
    case 'sew':
      return {
        l: { e: [bx - 2, chest + 4], h: [c - 4 + (pose === 'knit' ? fr : 0), chest + 2] },
        r: { e: [R, chest + 4], h: [c + 2, chest + 2 - (pose === 'sew' ? fr * 2 : 0)] },
        s: { e: [c, chest + 4], h: [c + 5, chest + 2 - (pose === 'sew' ? fr * 2 : 0)] },
      };
    case 'write':
      return { l: { h: [c - 4, waist - 1] }, r: { h: [c + 2 + fr, waist - 1] }, s: { h: [c + 5 + fr, waist - 1] } };
    case 'cook':
      return { r: { e: [R, chest + 3], h: [R + 1 + fr, waist - 2] }, s: { e: [c, chest + 3], h: [c + 6 + fr, waist - 2] } };
    case 'eat':
      return fr
        ? { l: { e: [bx - 2, chest + 4], h: [c - 4, chest + 3] }, r: { e: [R, chest + 3], h: [Math.round(hcx), mouthY - 1] }, s: { e: [c + 1, chest + 3], h: [mx - 1, mouthY - 1] } }
        : { l: { e: [bx - 2, chest + 4], h: [c - 4, chest + 3] }, r: { e: [R, chest + 4], h: [c + 1, chest + 2] }, s: { h: [c + 5, chest + 2] } };
    case 'drink':
      return fr
        ? { l: { e: [bx - 2, chest + 4], h: [c - 3, chest + 1] }, r: { e: [R, chest + 4], h: [c + 1, chest + 1] }, s: { h: [c + 4, chest + 1] } }
        : { l: { e: [bx - 2, chest + 3], h: [Math.round(hcx) - 3, mouthY] }, r: { e: [R, chest + 3], h: [Math.round(hcx) + 1, mouthY] }, s: { e: [c + 1, chest + 3], h: [mx - 1, mouthY] } };
    case 'hugKnees':
      return { l: { h: [c - 4, bodyBot] }, r: { h: [c + 2, bodyBot] }, s: { e: [c + 2, chest + 3], h: [c + 5, bodyBot - 1] } };
    case 'wavePush':
      return { l: { h: [c - 4, chest - 1 - fr] }, r: { h: [c + 2, chest - 1 - fr] }, s: { h: [c + 8 + fr * 2, chest] } };
    default:
      return null;
  }
}

const HOLDING = new Set<PPose>(['hold', 'holdStar', 'holdPhoto', 'holdDoll', 'hug']);

/** 그림 한 장의 뼈대 (그리기 · 손 자리 계산이 함께 쓴다). 방향은 오른쪽 기준 */
function frame(kind: string, dir: PDir, pose0: PPose, opt: PersonOpt) {
  const L = PEOPLE[kind] ?? PEOPLE.haru10;
  const walkStep = WALK_POSE[pose0];
  const pose: PPose = walkStep !== undefined ? 'idle' : pose0;
  const step = walkStep ?? opt.step;
  const fr = opt.frame ?? 0;
  const m = motion(pose, step, fr);
  if (opt.mood) Object.assign(m, MOOD_FACE[opt.mood]);
  if (opt.talk) m.mouth = m.mouth === 'open' ? 'o' : 'open';
  if (opt.bob) m.bob += opt.bob;
  const W = PERSON_W;
  const H = personH(kind) + (TOP_PAD[pose] ?? 0);
  const cx = W / 2;
  /** 발바닥 외곽선 줄 · 발바닥 줄 */
  const foot = H - PERSON_FOOT_PAD;
  const sole = foot - 1;
  const { headD, legLen } = personBody(kind);
  const low = Math.round(legLen * m.low);
  const side = dir === 'right' || dir === 'left';
  const back = dir === 'up';
  const bw = side ? L.bodyW - 4 : L.bodyW;
  const hunch = L.hunch ?? 0;
  const rise = low + m.bob;
  /** 다리가 시작하는 줄 (몸통은 그 위) */
  const bodyBot = sole - legLen + 1 + rise;
  const bodyTop = sole - L.h + 1 + headD - (L.tpl ? 1 : 2) + rise + hunch;
  const bodyH = bodyBot - bodyTop;
  const bx = Math.round(cx - bw / 2);
  const armTop = bodyTop + 1;
  const handY = bodyTop + Math.round(bodyH * 0.45);
  /** 받쳐 든 손 높이 (가슴~배 앞) */
  const carryY = bodyTop + Math.round(bodyH * 0.62);
  /** 숙여 집는 손 (무릎 아래) */
  const reachY = Math.min(foot - 3, bodyBot + 3);
  const arms: 'kneel' | 'carry' | 'pose' = pose === 'kneel' ? 'kneel' : opt.carry && pose !== 'sit' && pose !== 'cry' && m.low < 1 ? 'carry' : 'pose';
  // 머리 자리: headTop = 머리카락 꼭대기
  const headTop = sole - L.h + 1 + rise + hunch + m.bend + m.headDY + (pose === 'cry' ? 1 : 0);
  const r = headD / 2;
  // 옆모습은 머리가 앞으로 나가도 콧날이 그림 밖으로 나가지 않게
  const hcx = side ? Math.min(cx + 4, cx + 1 + hunch + (m.bend ? 1 : 0) + m.headDX) : cx + m.headDX;
  const hcy = headTop + r;
  /** 머리 폭 (머리카락 포함, 짝수) · 얼굴 */
  const hw = 2 * Math.round((headD + 2) / 2);
  const fcx = hcx + (side ? 1.5 : 0);
  const fcy = headTop + headD * 0.58;
  const frx = hw / 2 - 1.5;
  const fry = headD * 0.42;
  const ey = Math.round(fcy - 0.5) + (m.eyes === 'up' ? -1 : 0);
  const eg = Math.max(2, Math.round(frx * 0.3));
  const eyes = side ? [Math.round(fcx + frx * 0.42) - 1] : [Math.round(hcx) - eg - 2, Math.round(hcx) + eg];
  const mx = side ? Math.round(fcx + frx * 0.7) : Math.round(hcx);
  // 본 머리: 틀 자리 (얼굴 닻으로 눈 · 입 · 턱 자리를 다시 잡는다)
  let tpl: HeadTpl | null = null;
  let tx = 0;
  let eyesV = eyes;
  let eyV = ey;
  let mxV = mx;
  let chinV = headTop + headD - 1;
  let mouthYV = ey + 3;
  let hcxV = hcx;
  if (L.tpl) {
    tpl = HEAD_SETS[L.tpl][side ? 'right' : back ? 'up' : 'down'];
    const fwd = side ? Math.min(2, hunch) + (m.bend ? 1 : 0) + m.headDX : m.headDX;
    tx = Math.min(Math.round(cx) - tpl.ax + fwd, W - 2 - tpl.rows[0].length);
    eyesV = tpl.eyes.length ? tpl.eyes.map((e) => tx + e) : [tx + 3, tx + 9];
    eyV = headTop + tpl.ey + (m.eyes === 'up' ? -1 : 0);
    mxV = tx + tpl.mouth[0];
    mouthYV = headTop + tpl.mouth[1];
    chinV = headTop + tpl.chin;
    hcxV = tx + tpl.ax;
  }
  const marks: Marks = {
    c: Math.round(cx), bx, R: bx + bw, armTop, chest: bodyTop + 3, waist: bodyBot - 3, bodyBot, hcx: hcxV, ey: eyV,
    chin: chinV, mouthY: mouthYV, mx: mxV, headTop, back, eyeR: eyesV[eyesV.length - 1],
  };
  const spec = arms === 'pose' ? armSpec(pose, fr, marks) : null;
  return { L, pose, step, fr, m, W, H, cx, foot, sole, headD, legLen, low, side, back, bw, hunch, bodyBot, bodyTop, bodyH, bx, armTop, handY, carryY, reachY, arms, headTop, r, hcx, hcy, hw, fcx, fcy, frx, fry, ey, eyes, mx, spec, tpl, tx, eyesV, eyV, mxV, mouthYV };
}

/**
 * 손 자리 (그림 왼쪽 위 기준 픽셀): 든 물건을 이 자리에 그린다.
 * carry 면 몸 앞 가슴~배, kneel 이면 발치 앞, 그 밖에는 안는 손 높이.
 */
export function personHand(kind: string, dir: PDir, pose: PPose, opt: PersonOpt = {}): { x: number; y: number } {
  const f = frame(kind, dir, pose, opt);
  let x = Math.round(f.cx);
  let y = f.handY;
  if (f.arms === 'kneel') {
    y = f.reachY;
    if (f.side) x = Math.round(f.cx) + 5;
  } else if (f.arms === 'carry') {
    y = f.carryY;
    if (f.side) x = Math.round(f.cx) + 5;
  }
  if (dir === 'left') x = f.W - 1 - x;
  return { x, y };
}

/** 소매: 짧은 소매 옷은 팔 위쪽만 옷 색 */
const SHORT_SLEEVE = new Set<Top>(['tee', 'dress', 'overalls']);
/** 치마처럼 다리 위로 내려오는 옷 (치마 · 원피스 · 비옷) */
const LONG_HEM = new Set<Top>(['dress', 'raincoat']);

/** 슈퍼타원 안인가 (머리 · 얼굴의 둥근 네모 모양) */
function inBlob(dx: number, dy: number, e = 2.6): boolean {
  return Math.abs(dx) ** e + Math.abs(dy) ** e <= 1;
}

/** 사람 한 장. pose 가 walk1~4 이면 서 있는 팔 + 그 걸음 (예전 그대로) */
export function personSprite(kind: string, dir: PDir, pose: PPose, opt: PersonOpt = {}): Pix {
  const L0 = PEOPLE[kind] ?? PEOPLE.haru10;
  if (pose === 'sleep') return sleeping(L0);
  if (pose === 'lie') return sleeping(L0, true);
  if (pose === 'spin' && opt.frame) {
    // 빙글: 프레임마다 바라보는 쪽이 한 칸씩 돈다
    const ROT: PDir[] = ['down', 'right', 'up', 'left'];
    dir = ROT[(ROT.indexOf(dir) + opt.frame) % 4];
    opt = { ...opt, frame: 0 };
  }
  if (dir === 'left') return personSprite(kind, 'right', pose, opt).flipped();
  const f = frame(kind, dir, pose, opt);
  const { L, m, W, H, cx, sole, legLen, side, back, bw, bodyBot, bodyTop, bodyH, bx, armTop, handY, headTop, headD, hcx, hcy, hw, fcx, fcy, frx, fry, spec } = f;
  pose = f.pose;
  const p = new Pix(W, H);
  const sk = L.skin;
  const skD = shade(sk, -0.16);
  const adult = L.h >= 40;
  const kid = L.h < 36;
  /** 팔 · 다리 굵기 */
  const v2 = !!L.tpl;
  const aw = adult && (!v2 || L.tpl === 'manShort') ? 3 : 2;
  /** 본 그림 여자 어른 · 십대: 허리가 들어간다 */
  const slim = L.tpl === 'teenLong' || L.tpl === 'womanPony';
  const lw = adult ? 4 : 3;
  const top = L.top;
  const dark = (c: Color, k = 0.2) => shade(c, -k);
  const lite = (c: Color, k = 0.14) => shade(c, k);
  const skirtish = !!L.skirt || LONG_HEM.has(L.topStyle);
  /** 치마 · 원피스 자락이 다리 위로 내려오는 줄 수 */
  const hem = skirtish && m.low < 1 ? Math.max(2, Math.round(legLen * ((L.hunch ?? 0) ? 0.7 : L.topStyle === 'raincoat' ? 0.55 : 0.42))) : 0;
  const sleeveC = L.topStyle === 'overalls' ? L.trim : top;
  const shortSleeve = SHORT_SLEEVE.has(L.topStyle);
  const hpal = L.tpl ? headPalette(L.hair, sk, L.clip ?? hex('#c8a0d8')) : null;
  // 몸 뒤로 넘어가는 머리채는 몸보다 먼저
  if (f.tpl?.under && hpal) paintGrid(p, f.tpl.under, f.tx, headTop, hpal);

  // ── 다리 · 신발
  const legC = skirtish ? sk : L.bottom;
  const sock = skirtish && !adult ? hex('#f8f4ec') : null;
  const shoe = (x: number, y: number, w: number, k = 0) => {
    p.rect(x, y, w, 1, k ? dark(L.shoes, k) : L.shoes);
    p.set(x + (side ? w - 2 : 1), y, lite(L.shoes, 0.35));
    p.rect(x, y + 1, w, 1, dark(L.shoes, 0.25 + k));
  };
  /** 다리 한 짝: 위에서 아래로 (x0 → x1 비스듬히) */
  const leg = (x0: number, x1: number, y0: number, y1: number, k: number) => {
    const n = Math.max(1, y1 - y0);
    for (let y = y0; y <= y1; y++) {
      const x = Math.round(x0 + ((x1 - x0) * (y - y0)) / n);
      const sockRow = sock && y >= y1 - 3;
      const c = sockRow ? sock : k ? dark(legC, k) : legC;
      p.rect(x, y, lw, 1, c);
      // 안쪽 그늘 · 무릎 주름
      p.set(x + lw - 1, y, dark(c, 0.14 + k));
      if (!skirtish && y === Math.round((y0 + y1) / 2)) p.set(x + 1, y, dark(c, 0.2));
    }
    return Math.round(x1);
  };
  if (m.low >= 1) {
    // 앉기: 허벅지가 앞으로 (옆모습) / 무릎이 보이게 (앞모습)
    if (side) {
      // 허벅지 길이: 다리가 긴 사람도 무릎 · 신발이 그림 안에 (외곽선 한 칸 남기고)
      const sl = Math.min(legLen, W - 1 - cx - lw);
      p.rect(cx - 3, bodyBot - 3, sl + 2, 4, skirtish ? (L.skirt ? L.bottom : top) : L.bottom);
      p.rect(cx - 3, bodyBot, sl + 2, 1, dark(skirtish ? (L.skirt ? L.bottom : top) : L.bottom));
      p.rect(cx + sl - 2, bodyBot - 2, 2, 4, legC);
      shoe(cx + sl - 2, bodyBot + 1, lw + 1);
    } else {
      const kc = skirtish ? (L.skirt ? L.bottom : top) : L.bottom;
      p.rect(bx, bodyBot - 2, bw, 4, kc);
      p.rect(bx, bodyBot + 1, bw, 1, dark(kc));
      p.set(cx - 1, bodyBot - 1, dark(kc, 0.25));
      p.rect(bx + 1, bodyBot + 2, 2, 2, legC);
      p.rect(bx + bw - 3, bodyBot + 2, 2, 2, legC);
      shoe(bx, bodyBot + 3, lw);
      shoe(bx + bw - lw, bodyBot + 3, lw, 0.1);
    }
  } else if (side) {
    const y1 = sole - 2 - m.tuck;
    // 걸음: 다리가 비스듬히 앞뒤로 (뒷다리는 어둡게)
    const k = 1.5;
    const xb = leg(cx - 2, cx - 2 + m.legL * k, bodyBot, y1, 0.18);
    shoe(xb, y1 + 1, lw + 1, 0.12);
    const xf = leg(cx - 2, cx - 2 + m.legR * k, bodyBot, y1, 0);
    shoe(xf, y1 + 1, lw + 1);
  } else {
    const y1 = sole - 2 - m.tuck;
    const lx = cx - lw;
    const rx = cx;
    leg(lx, lx, bodyBot, y1 + Math.min(0, m.legL), 0);
    shoe(lx, y1 + 1 + Math.min(0, m.legL), lw);
    leg(rx, rx, bodyBot, y1 + Math.min(0, m.legR), 0.1);
    shoe(rx, y1 + 1 + Math.min(0, m.legR), lw, 0.1);
    // 두 다리 사이: 바지는 진한 솔기, 맨다리는 틈
    for (let y = bodyBot + 2; y <= y1; y++) {
      if (skirtish) p.px[y * p.w + cx] = y <= y1 + Math.min(0, m.legR) ? CLEAR : p.get(cx, y);
      else p.set(cx - 1, y, dark(legC, 0.45));
    }
  }

  // ── 몸통 (옷)
  const waistT = L.topStyle === 'hoodie' ? 0.86 : L.topStyle === 'overalls' ? 0.62 : LONG_HEM.has(L.topStyle) ? 2 : 0.66;
  const endY = bodyBot + hem;
  const style = L.topStyle;
  for (let y = bodyTop; y < endY; y++) {
    const t = (y - bodyTop) / Math.max(1, bodyH);
    // 어깨는 둥글게 (본 그림은 목에서 어깨로 비스듬히 내려온다)
    const inset = y === bodyTop ? (v2 ? 3 : 2) : y === bodyTop + 1 ? 1 : 0;
    const waistIn = slim && !side && t > 0.42 && t < 0.72 ? 1 : 0;
    const flare = (skirtish && t > 0.62 ? Math.min(side || v2 ? 1 : 2, Math.round((t - 0.62) * 4)) : 0) - waistIn;
    const x0 = bx + inset - flare;
    const x1 = bx + bw - inset + flare;
    for (let x = x0; x < x1; x++) {
      const u = (x - x0) / Math.max(1, x1 - x0 - 1);
      let c = top;
      const lower = t >= waistT;
      if (lower) c = L.bottom;
      if (style === 'overalls' && t > 0.3 && !lower && !back && Math.abs(x + 0.5 - (side ? cx + 1 : cx)) < bw / 2 - 1.5) c = L.bottom;
      if (style === 'overalls' && !(t > 0.3) && c === top) c = L.trim;
      if (style === 'stripe' && !lower && (y - bodyTop) % 3 === 1) c = L.trim;
      // 빛은 왼쪽 위: 왼쪽 밝게 · 오른쪽 어둡게, 자락 끝줄은 그늘
      if (u > 0.74) c = dark(c, 0.18);
      else if (u < 0.2 && !back) c = lite(c, 0.1);
      if (skirtish && y === endY - 1) c = dark(c, 0.12);
      // 치마 주름: 세로로 어두운 줄
      if (skirtish && lower && t > 0.75 && (x - x0) % 3 === 2) c = dark(c, 0.14);
      if (skirtish && LONG_HEM.has(style) && t > 0.8 && (x - x0) % 3 === 2) c = dark(c, 0.12);
      p.set(x, y, c);
    }
  }
  const waistY = bodyTop + Math.round(bodyH * Math.min(1, waistT));
  const ccx = side ? cx + 1 : cx;
  // 옷 꾸밈 (앞 · 옆모습)
  if (!back) {
    switch (style) {
      case 'overalls':
        p.rect(ccx - 3, bodyTop + 1, 1, waistY - bodyTop - 4, L.bottom);
        if (!side) p.rect(ccx + 2, bodyTop + 1, 1, waistY - bodyTop - 4, L.bottom);
        p.set(ccx - 3, waistY - 4, lite(L.bottom, 0.5));
        if (!side) p.set(ccx + 2, waistY - 4, lite(L.bottom, 0.5));
        if (!side) p.rect(ccx - 1, waistY - 2, 2, 2, dark(L.bottom, 0.15));
        break;
      case 'hoodie':
        // 모자 깃 · 끈 · 앞주머니
        p.rect(ccx - 3, bodyTop, side ? 3 : 6, 1, dark(top, 0.25));
        p.line(ccx - 1, bodyTop + 1, ccx - 1, bodyTop + 3, L.trim);
        if (!side) p.line(ccx, bodyTop + 1, ccx, bodyTop + 3, L.trim);
        p.rect(bx + 2, waistY - 4, bw - (side ? 3 : 4), 3, dark(top, 0.1));
        p.rect(bx + 2, waistY - 4, bw - (side ? 3 : 4), 1, dark(top, 0.22));
        break;
      case 'uniform': {
        // 세일러 깃 + 빨간 스카프 매듭
        const wc = hex('#f4f4f4');
        p.tri(ccx - 4, bodyTop, ccx + (side ? 1 : 4), bodyTop, ccx, bodyTop + 4, wc);
        p.tri(ccx - 2, bodyTop, ccx + (side ? 0 : 2), bodyTop, ccx, bodyTop + 2, sk);
        p.rect(ccx - 1, bodyTop + 3, 2, 2, L.trim);
        p.set(ccx - 2, bodyTop + 5, dark(L.trim));
        if (!side) p.set(ccx + 1, bodyTop + 5, dark(L.trim));
        break;
      }
      case 'black':
        p.rect(ccx - 3, bodyTop, 2, 2, L.trim);
        if (!side) p.rect(ccx + 1, bodyTop, 2, 2, L.trim);
        for (let y = bodyTop + 3; y < waistY; y += 3) p.set(ccx, y, lite(top, 0.3));
        break;
      case 'cardigan': {
        // 열린 앞섶 속 블라우스 · 단추
        const iw = side ? 2 : 4;
        p.rect(ccx - (side ? 0 : 2), bodyTop, iw, Math.round(bodyH * 0.6), L.trim);
        p.rect(ccx - (side ? 0 : 2), bodyTop, iw, 1, dark(L.trim, 0.1));
        for (let y = bodyTop + 3; y < bodyTop + bodyH * 0.62; y += 3) {
          p.set(side ? ccx + 2 : ccx + 2, y, dark(top, 0.35));
          if (!side) p.set(ccx - 3, y, dark(top, 0.35));
        }
        if (!side) p.rect(bx + 1, waistY - 3, 3, 2, dark(top, 0.12));
        break;
      }
      case 'raincoat':
        p.rect(ccx - 2, bodyTop, side ? 3 : 4, 1, L.trim);
        for (let y = bodyTop + 3; y < endY - 1; y += 3) p.set(ccx, y, L.trim);
        p.rect(bx - 2, endY - 1, bw + 4, 1, L.trim);
        break;
      case 'dress':
        p.rect(ccx - 3, bodyTop, side ? 3 : 6, 1, L.trim);
        p.set(ccx - 3, bodyTop + 1, L.trim);
        if (!side) p.set(ccx + 2, bodyTop + 1, L.trim);
        p.rect(bx, bodyTop + Math.round(bodyH * 0.58), bw, 1, L.trim);
        p.set(ccx, bodyTop + Math.round(bodyH * 0.58), lite(L.trim, 0.5));
        break;
      case 'shirt':
        // 깃 · 단추 · 허리띠 · 셔츠 자락 주름
        p.tri(ccx - 3, bodyTop, ccx + (side ? 1 : 3), bodyTop, ccx, bodyTop + 3, L.trim);
        p.set(ccx, bodyTop, sk);
        for (let y = bodyTop + 4; y < waistY - 1; y += 3) p.set(ccx, y, dark(top, 0.3));
        p.rect(bx, waistY - 1, bw, 1, hex('#5a4030'));
        if (!side) p.set(ccx - 1, waistY - 1, hex('#d8b860'));
        p.set(bx + bw - 3, waistY - 2, dark(top, 0.25));
        p.set(bx + bw - 4, waistY - 3, dark(top, 0.2));
        break;
      case 'tee':
        p.rect(ccx - 2, bodyTop, side ? 2 : 4, 1, dark(top, 0.25));
        if (!side) p.rect(ccx - 1, bodyTop + 4, 2, 2, L.trim);
        p.set(bx + bw - 3, waistY - 2, dark(top, 0.25));
        break;
      case 'stripe':
        p.rect(ccx - 2, bodyTop, side ? 2 : 4, 1, dark(L.trim, 0.1));
        break;
      default:
        break;
    }
  } else {
    // 뒷모습: 깃 · 모자 · 허리 주름
    if (style === 'uniform') {
      p.rect(cx - 4, bodyTop, 8, 4, hex('#f4f4f4'));
      p.rect(cx - 4, bodyTop + 3, 8, 1, L.trim);
    } else if (style === 'hoodie') {
      p.rect(cx - 4, bodyTop, 8, 3, dark(top, 0.12));
      p.rect(cx - 3, bodyTop + 3, 6, 1, dark(top, 0.25));
    } else if (style === 'shirt' || style === 'dress' || style === 'black') p.rect(cx - 3, bodyTop, 6, 1, style === 'black' ? L.trim : dark(top, 0.2));
    if (!skirtish && waistT < 1) p.rect(bx, waistY - 1, bw, 1, dark(style === 'shirt' ? hex('#5a4030') : top, style === 'shirt' ? 0 : 0.18));
  }

  // ── 팔
  const armLen = Math.max(6, bodyBot - armTop + (adult ? 1 : 0));
  /** 팔 한 짝 (세로): 소매 · 맨팔 · 손. side: 1 이면 몸 오른쪽(그늘 쪽) */
  const drawArm = (x: number, swing: number, sideK: number) => {
    const len = armLen - Math.max(0, -swing);
    const y0 = armTop + Math.max(0, swing > 0 ? 0 : 0);
    /** 본 그림: 팔꿈치 아래는 몸에서 한 칸 벌어진다 (차렷 막대가 아니게) */
    const tiltAt = v2 ? 3 : 99;
    const out = sideK ? 1 : -1;
    for (let i = 0; i < len - 2; i++) {
      const y = y0 + i;
      x = i === tiltAt ? x + out : x;
      const bare = shortSleeve && i >= 3;
      const base = bare ? sk : sleeveC;
      const c = sideK ? dark(base, bare ? 0.1 : 0.14) : base;
      p.rect(x, y, aw, 1, c);
      // 어깨 둥글게: 맨 윗줄 바깥 칸은 비운다
      if (i === 0) p.px[y * p.w + (sideK ? x + aw - 1 : x)] = CLEAR;
      // 몸 쪽 줄은 어둡게 (몸통과 갈라 보이게) · 바깥은 밝게
      p.set(sideK ? x : x + aw - 1, y, dark(c, 0.18));
      if (aw > 2) p.set(sideK ? x + aw - 1 : x, y, lite(c, 0.12));
      // 팔꿈치 주름
      if (!bare && i === Math.round(len * 0.5)) p.set(x + (sideK ? 1 : aw - 2), y, dark(c, 0.3));
      if (!bare && i === len - 3 && !shortSleeve) p.rect(x, y, aw, 1, dark(c, 0.12));
    }
    if (v2) {
      // 손: 소매 끝 아래 둥근 손 (아랫줄 바깥 칸은 비워 둥글게, 안쪽은 그늘)
      p.rect(x, y0 + len - 2, aw, 1, sk);
      p.set(sideK ? x : x + aw - 1, y0 + len - 1, skD);
      if (aw > 2) p.set(x + 1, y0 + len - 1, skD);
    } else {
      p.rect(x, y0 + len - 2, aw, 2, sk);
      p.set(x + (sideK ? 0 : aw - 1), y0 + len - 1, skD);
    }
  };
  /** 옆모습 팔: 어깨에서 손까지 비스듬히 */
  const sideArm = (sx: number, hx: number, col: Color) => {
    const len = armLen;
    for (let i = 0; i < len - 2; i++) {
      const x = Math.round(sx + ((hx - sx) * i) / (len - 2));
      const bare = shortSleeve && i >= 3;
      const c = bare ? sk : col;
      p.rect(x, armTop + i, aw, 1, c);
      p.set(x, armTop + i, dark(c, 0.3));
      if (aw > 2) p.set(x + 1, armTop + i, lite(c, 0.06));
      if (!bare && i === Math.round(len * 0.5)) p.set(x, armTop + i, dark(c, 0.28));
    }
    p.rect(Math.round(hx), armTop + len - 2, aw, 2, sk);
    p.set(Math.round(hx) + aw - 1, armTop + len - 1, skD);
  };
  const holding = HOLDING.has(pose) && f.arms === 'pose';
  const hands: [number, number][] = [];
  const sleeveS = dark(sleeveC, 0.1);
  const L0x = bx - aw;
  const R0x = bx + bw;
  if (f.arms === 'kneel') {
    // 숙여 집기: 두 팔을 발치로 뻗는다
    const ry = f.reachY;
    if (side) {
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        p.rect(Math.round(cx + t * 4), Math.round(armTop + (ry - 1 - armTop) * t), aw, 2, sleeveS);
      }
      p.rect(Math.round(cx) + 4, ry - 1, aw, 2, sk);
    } else {
      p.rect(L0x + 1, armTop, aw, ry - armTop - 1, sleeveC);
      p.rect(R0x - 1, armTop, aw, ry - armTop - 1, dark(sleeveC, 0.15));
      p.rect(L0x + 1, ry - 1, aw, 2, sk);
      p.rect(R0x - 1, ry - 1, aw, 2, sk);
    }
  } else if (f.arms === 'carry') {
    // 두 팔을 앞으로 모아 받친다 (물건 그림이 위에 덮인다)
    const cy = f.carryY;
    if (side) {
      p.rect(cx - 1, armTop, aw, cy - armTop, sleeveS);
      p.rect(cx - 1, cy - 1, 7, 2, sleeveS);
      p.rect(cx + 6, cy - 1, 2, 2, sk);
    } else if (back) {
      // 뒷모습: 팔꿈치가 양옆으로 살짝 벌어진다
      p.rect(L0x + 1, armTop, aw, cy - armTop - 1, sleeveC);
      p.rect(R0x - 1, armTop, aw, cy - armTop - 1, dark(sleeveC, 0.15));
      p.set(L0x, cy - 3, sleeveC);
      p.set(R0x + aw - 1, cy - 3, dark(sleeveC, 0.15));
    } else {
      p.rect(L0x + 1, armTop, aw, cy - armTop, sleeveC);
      p.rect(R0x - 1, armTop, aw, cy - armTop, dark(sleeveC, 0.15));
      p.rect(L0x + 1, cy - 1, cx - L0x - 4, 2, sleeveC);
      p.rect(cx + 3, cy - 1, R0x - cx - 3, 2, dark(sleeveC, 0.15));
      p.rect(Math.round(cx) - 4, cy - 1, 2, 2, sk);
      p.rect(Math.round(cx) + 2, cy - 1, 2, 2, sk);
    }
  } else if (spec) {
    const limb = (from: [number, number], l: Limb | undefined, col: Color, def: () => void) => {
      if (l === undefined) return def();
      if (l === null) {
        // 감춘 팔: 어깨만 (손은 등 뒤)
        p.rect(from[0], from[1], aw, 5, col);
        return;
      }
      // 팔 끝이 그림 테두리에 닿지 않게 (외곽선 한 칸 남기고)
      const keep = (q: [number, number]): [number, number] => [Math.max(2, Math.min(W - 4, q[0])), Math.max(2, q[1])];
      l = { e: l.e && keep(l.e), h: keep(l.h) };
      const pts: [number, number][] = l.e ? [from, l.e, l.h] : [from, l.h];
      for (let k = 0; k + 1 < pts.length; k++) {
        const [x0, y0] = pts[k];
        const [x1, y1] = pts[k + 1];
        const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 0; i <= n; i++) p.rect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 2, 2, col);
      }
      p.rect(l.h[0], l.h[1], 2, 2, sk);
      hands.push(l.h);
    };
    if (side) limb([Math.round(cx) - 1, armTop], spec.s, sleeveS, () => sideArm(cx - 1, cx - 1 + m.armL * 1.2, sleeveS));
    else {
      limb([bx - 2, armTop], spec.l, sleeveC, () => drawArm(L0x, m.armL, 0));
      limb([bx + bw, armTop], spec.r, dark(sleeveC, 0.15), () => drawArm(R0x, m.armR, 1));
    }
  } else if (pose === 'cry' && !back) {
    // 두 손으로 얼굴을 가린다
    p.rect(L0x + 1, armTop, aw, 5, sleeveC);
    p.rect(R0x - 1, armTop, aw, 5, dark(sleeveC, 0.15));
  } else if (holding && !back) {
    if (side) {
      p.rect(cx - 1, armTop, aw, handY - armTop, sleeveS);
      p.rect(cx + 1, handY - 1, 5, 2, sleeveS);
      p.rect(cx + 5, handY - 1, 2, 2, sk);
    } else {
      p.rect(L0x + 1, armTop, aw, handY - armTop, sleeveC);
      p.rect(R0x - 1, armTop, aw, handY - armTop, dark(sleeveC, 0.15));
      p.rect(L0x + 1, handY - 1, 4, 2, sleeveC);
      p.rect(R0x - 3, handY - 1, 4, 2, dark(sleeveC, 0.15));
    }
  } else if (side) {
    if (pose === 'phone') p.rect(cx, armTop - 3, 2, 6, sleeveC);
    else if (pose === 'umbrella' || pose === 'wave') p.rect(cx + 1, armTop - 5, 2, 8, sleeveC);
    else sideArm(cx - 1, cx - 1 + m.armL * 1.2, sleeveS);
  } else {
    drawArm(L0x, m.armL, 0);
    if (pose === 'wave' || pose === 'umbrella') {
      p.rect(R0x, armTop - 6, 2, 8, dark(sleeveC, 0.15));
      p.rect(R0x, armTop - 8, 2, 2, sk);
    } else if (pose === 'phone') {
      p.rect(R0x - 1, armTop - 2, 2, 6, dark(sleeveC, 0.15));
    } else drawArm(R0x, m.armR, 1);
  }

  if (f.tpl && hpal) drawTplHead(p, f, hpal, opt, pose);
  else {
  // ── 머리
  // 얼굴: 둥근 네모(찹쌀떡) 모양, 오른쪽 · 아래 가장자리에 그늘 한 단
  const face = (x: number, y: number) => {
    const dx = (x + 0.5 - fcx) / frx;
    const dy = (y + 0.5 - fcy) / fry;
    return inBlob(dx, dy, dy > 0 ? 2.1 : 2.8) ? { dx, dy } : null;
  };
  const hairCy = headTop + headD / 2;
  const hrx = hw / 2;
  const hry = headD / 2;
  const hair = L.hair;
  const hairD = dark(hair, 0.22);
  const hairDD = dark(hair, 0.4);
  const hairL = lite(hair, 0.3);
  const style2 = L.hairStyle;
  const fringeAt = style2 === 'short' ? -0.42 : style2 === 'bun' ? -0.55 : -0.3;
  const sideLock = style2 === 'long' ? 1.0 : style2 === 'bob' ? 0.75 : style2 === 'short' || style2 === 'bun' ? -0.25 : 0.25;
  /** 긴 머리는 어깨 아래까지 */
  const longEnd = headTop + headD + (style2 === 'long' ? Math.round(headD * 0.55) : 0);
  for (let y = headTop - 1; y <= longEnd; y++)
    for (let x = Math.floor(hcx - hrx - 2); x <= hcx + hrx + 2; x++) {
      const hdx = (x + 0.5 - hcx) / hrx;
      const hdy = (y + 0.5 - hairCy) / hry;
      const inHair = inBlob(hdx, hdy, 2.4);
      const fc = face(x, y);
      let on = false;
      let edge = false;
      if (back) {
        on = inHair;
        // 짧은 · 묶은 머리는 뒷목(살)이 보인다
        if (inHair && hdy > 0.7 && Math.abs(hdx) < 0.5 && style2 !== 'long' && style2 !== 'bob') {
          p.set(x, y, Math.abs(hdx) > 0.4 ? dark(sk, 0.24) : skD);
          continue;
        }
        if (style2 === 'long' && Math.abs(hdx) <= 1.0 && hdy >= 0 && y <= longEnd) on = true;
        if (style2 === 'bob' && Math.abs(hdx) <= 1.0 && hdy >= 0 && hdy < 1.15) on = true;
      } else if (side) {
        const jag = (x % 2) * 0.08;
        const shortish = style2 !== 'long' && style2 !== 'bob';
        on = inHair && (!fc || fc.dy < fringeAt + jag || fc.dx < -0.25);
        if (on && shortish && hdy > 0.6 && (!fc || fc.dx < -0.25)) {
          // 짧은 · 묶은 머리: 뒷목은 살
          if (hdx > -0.4) p.set(x, y, dark(sk, 0.2));
          on = hdx <= -0.7 && hdy < 0.8;
          if (!on) continue;
        }
        if (style2 === 'long' && hdx < -0.1 && hdx > -1.05 && hdy >= 0 && y <= longEnd) on = true;
        if (style2 === 'bob' && hdx < 0 && hdx > -1.05 && hdy >= 0 && hdy < 1.12) on = true;
        edge = !!fc && on && fc.dy >= fringeAt - 0.18;
      } else {
        // 앞머리: 가닥 끝이 들쭉날쭉
        const jag = ((Math.abs(x - Math.round(hcx)) + 1) % 3 === 0 ? 0.12 : 0) - (style2 === 'bun' && x < hcx ? 0.15 : 0);
        on = inHair && (!fc || fc.dy < fringeAt + jag);
        // 옆머리 (귀 앞으로 내려온다)
        if (inHair && fc && Math.abs(fc.dx) > 0.84 && fc.dy < sideLock) on = true;
        if (!fc && inHair && hdy > 0.3 && sideLock < 0) on = false;
        if ((style2 === 'long' || style2 === 'bob') && Math.abs(x + 0.5 - hcx) > frx * 0.78 && Math.abs(x + 0.5 - hcx) <= hrx + 0.6 && hdy >= 0 && (style2 === 'long' ? y <= longEnd : hdy < 1.12)) on = !fc || Math.abs(fc.dx) > 0.8;
        edge = !!fc && on && fc.dy >= fringeAt - 0.2 && Math.abs(fc.dx) < 0.8;
      }
      if (!on) continue;
      // 머리 명암: 윤기 줄 · 아래 그늘 · 앞머리 끝은 진하게 · 가닥 선
      let c = hair;
      const shine = hdy > -0.8 && hdy < -0.6 && hdx > -0.62 && hdx < 0.2;
      if (shine) c = hdx > -0.4 && hdx < -0.1 ? hairL : lite(hair, 0.14);
      else if (hdx > 0.55 || hdy > 0.75) c = hairD;
      if (edge) c = hairD;
      if (!back && !side && fc && (x - Math.round(hcx)) % 4 === 1 && fc.dy > fringeAt - 0.35) c = hairD;
      if (back && hdy > 0.1 && (x - Math.round(hcx) + 16) % 4 === 0) c = hairD;
      if (y > headTop + headD - 1) c = (x + y) % 3 ? hairD : hairDD;
      p.set(x, y, c);
    }
  // 얼굴 칠하기
  if (!back)
    for (let y = headTop; y < headTop + headD; y++)
      for (let x = Math.floor(fcx - frx - 1); x <= fcx + frx + 1; x++) {
        const fc = face(x, y);
        if (!fc || p.get(x, y) !== CLEAR) continue;
        p.set(x, y, fc.dx > 0.62 || fc.dy > 0.78 ? skD : fc.dx < -0.5 && fc.dy < 0 ? lite(sk, 0.08) : sk);
      }
  // 귀 (짧은 머리 · 묶은 머리)
  if (!back && style2 !== 'long' && style2 !== 'bob') {
    const eyY = f.ey;
    if (side) {
      const ex = Math.round(hcx - 1);
      p.rect(ex, eyY, 2, 3, sk);
      p.set(ex + 1, eyY + 1, skD);
    } else {
      p.rect(Math.round(hcx - hrx) - 0, eyY + 1, 1, 2, skD);
      p.rect(Math.round(hcx + hrx) - 1, eyY + 1, 1, 2, dark(sk, 0.24));
    }
  }
  // 머리 모양 덧붙이기
  if (style2 === 'bun') {
    const bx0 = hcx + (side ? -3 : 0);
    p.ball(bx0, headTop + 0.5, 3.2, 2.5, hair, true);
    p.set(bx0 - 1, headTop - 1, hairL);
  }
  if (style2 === 'pony') {
    const tie = L.clip ?? hex('#e85a6a');
    if (side) {
      const tx = Math.round(hcx - hrx) - 1;
      p.rect(tx, hcy - 2, 3, 8, hair);
      p.rect(tx, hcy - 2, 1, 8, hairL);
      p.rect(tx + 2, hcy + 1, 1, 5, hairD);
      p.rect(tx + 1, hcy + 6, 1, 2, hairD);
      p.rect(tx + 1, hcy - 2, 2, 1, tie);
    } else if (back) {
      p.rect(hcx - 2, hcy + 1, 4, 8, hair);
      p.rect(hcx - 2, hcy + 1, 1, 8, hairL);
      p.rect(hcx + 1, hcy + 2, 1, 7, hairD);
      p.rect(hcx - 1, hcy + 9, 2, 1, hairD);
      p.rect(hcx - 2, hcy, 4, 1, tie);
    } else {
      // 앞모습: 머리 뒤로 꼬리 끝이 살짝 보인다
      const tx = Math.round(hcx + hrx) - 1;
      if (p.get(tx + 1, hcy) === CLEAR) {
        p.rect(tx, hcy, 2, 6, hairD);
        p.set(tx + 1, hcy + 6, hairDD);
      }
    }
  }
  if (style2 === 'tuft') {
    // 정수리에 삐친 머리 한 가닥
    p.set(hcx, headTop - 1, hair);
    p.set(hcx + 1, headTop - 1, hairD);
    p.set(hcx - 1, headTop, hairL);
  }
  // 별 머리핀
  if (L.clip !== undefined && !back) {
    const kx = Math.round(side ? hcx - 1 : hcx + frx * 0.6);
    const ky = Math.round(headTop + headD * 0.24);
    p.set(kx, ky - 1, L.clip);
    p.rect(kx - 1, ky, 3, 1, L.clip);
    p.set(kx - 1, ky + 1, L.clip);
    p.set(kx + 1, ky + 1, L.clip);
    p.set(kx, ky, lite(L.clip, 0.5));
  }

  // ── 얼굴
  if (!back) {
    const ey = f.ey;
    const eyes = f.eyes;
    const tall = !adult;
    for (let i = 0; i < eyes.length; i++) {
      let ex = eyes[i];
      /** 바깥쪽 (속눈썹 · 볼이 가는 쪽) */
      const out = side ? 1 : i === 0 ? -1 : 1;
      if (m.eyes === 'closed') {
        if (m.mouth === 'open') {
          // 웃는 눈: ∩
          p.set(ex - (out < 0 ? 1 : 0), ey + 2, INK);
          p.set(ex + 1 + (out > 0 ? 1 : 0), ey + 2, INK);
          p.rect(ex, ey + 1, 2, 1, INK);
        } else {
          // 감은 눈: 아래로 휜 선
          p.rect(ex, ey + 2, 2, 1, INK);
          p.set(out < 0 ? ex - 1 : ex + 2, ey + 1, INK);
        }
      } else if (m.eyes === 'down') {
        // 내리깐 눈: 눈꺼풀 + 납작한 눈동자
        p.rect(ex, ey + 1, 2, 1, INK);
        p.set(out < 0 ? ex - 1 : ex + 2, ey + 1, INK);
        p.rect(ex, ey + 2, 2, 1, EYE);
      } else if (m.eyes === 'wide') {
        // 휘둥그레: 흰자 둘레에 작은 눈동자
        p.rect(ex - (side ? 0 : 0), ey - 1, 2, 4, hex('#ffffff'));
        p.set(ex + (side ? 2 : out > 0 ? 2 : -1), ey, hex('#ffffff'));
        p.rect(ex + (side ? 1 : 0), ey + 1, 1, 2, EYE);
        p.set(ex + (side ? 1 : 1), ey + 1, EYE);
      } else {
        // 눈: 위 눈꺼풀(진한 선) · 눈동자 · 반짝 (어릴수록 세로로 길다)
        ex += m.eyeDX;
        const eh = tall ? 3 : 2;
        p.rect(ex, ey, 2, 1, INK);
        p.set(out < 0 ? ex - 1 : ex + 2, ey, INK);
        p.rect(ex, ey + 1, 2, eh, EYE);
        p.set(ex + (out > 0 ? 0 : 1), ey + 1, hex('#ffffff'));
        p.set(ex + (out > 0 ? 1 : 0), ey + eh, dark(EYE, 0.35));
      }
    }
    // 표정 눈썹 · 눈물
    const brow = dark(L.hair, 0.35);
    if (opt.mood === 'sad' || opt.mood === 'angry') {
      for (let i = 0; i < eyes.length; i++) {
        const ex = eyes[i];
        const out = side ? 1 : i === 0 ? -1 : 1;
        const inner = out < 0 ? ex + 1 : ex;
        const outer = out < 0 ? ex - 1 : ex + 2;
        const sad = opt.mood === 'sad';
        p.set(inner, ey + (sad ? -3 : -1), brow);
        p.set((inner + outer) / 2 + 0.5, ey - 2, brow);
        p.set(outer, ey + (sad ? -1 : -3), brow);
      }
    }
    if (opt.mood === 'tear') {
      const tx = eyes[eyes.length - 1] + (side ? 0 : 1);
      p.set(tx, ey + 3, hex('#9ad8ff'));
      p.set(tx, ey + 4, hex('#6ab8f0'));
      p.set(tx, ey + 5, hex('#6ab8f0'));
    }
    // 볼
    const cheek = hex('#ff9e9e');
    if (side) p.rect(eyes[0] - 1, ey + 3 + (tall ? 1 : 0), 2, 1, cheek);
    else {
      p.rect(eyes[0] - 1, ey + 3 + (tall ? 1 : 0), 2, 1, cheek);
      p.rect(eyes[1] + 1, ey + 3 + (tall ? 1 : 0), 2, 1, cheek);
    }
    // 코 (옆모습은 콧날이 살짝 튀어나온다)
    if (side) p.set(Math.floor(fcx + frx), ey + 2, sk);
    else if (adult) p.set(Math.round(hcx) - 1, ey + 3, skD);
    // 입
    const my = ey + 4 + (tall ? 1 : 0);
    const mx = f.mx;
    if (m.mouth === 'o') {
      p.rect(mx - (side ? 0 : 1), my, 2, 2, hex('#8a3a3a'));
      p.set(mx - (side ? 0 : 1), my, hex('#5a2a2a'));
    } else if (m.mouth === 'open') {
      // 활짝 웃는 입
      p.rect(mx - (side ? 0 : 1), my, side ? 2 : 3, 1, hex('#8a3a3a'));
      p.rect(mx - (side ? 0 : 0), my + 1, side ? 1 : 1, 1, hex('#e8707a'));
    } else if (pose !== 'cry') {
      const sad = opt.mood === 'sad' || opt.mood === 'tear' || opt.mood === 'angry';
      p.set(mx, my, dark(sk, 0.42));
      if (!side) p.set(mx - 1, my + (sad ? 0 : 0), dark(sk, sad ? 0.42 : 0.28));
      if (sad && !side) {
        p.set(mx - 2, my + 1, dark(sk, 0.3));
        p.set(mx + 1, my + 1, dark(sk, 0.3));
      }
    }
    if (L.glasses) {
      // 동그란 안경테
      const gl = hex('#b89a6a');
      for (const ex of eyes) {
        p.rect(ex - 1, ey - 1, 4, 1, gl);
        p.rect(ex - 1, ey + 3, 4, 1, gl);
        p.rect(ex - 2, ey, 1, 3, gl);
        p.rect(ex + 2, ey, 1, 3, gl);
      }
      if (!side) p.rect(eyes[0] + 3, ey, eyes[1] - eyes[0] - 4, 1, gl);
      else p.rect(Math.round(hcx) - 1, ey, eyes[0] - Math.round(hcx), 1, gl);
    }
    if (pose === 'cry') {
      const tear = hex('#7ac8ff');
      for (const ex of eyes) p.set(ex, ey + 4, tear);
      // 얼굴을 가린 손
      const hx0 = Math.round(fcx - frx * 0.75);
      const hwd = Math.round(frx * 1.5);
      p.rect(hx0, ey + 1, hwd, 3, sk);
      p.rect(hx0, ey + 1, hwd, 1, lite(sk, 0.1));
      p.set(Math.round(fcx), ey + 2, skD);
      p.rect(hx0, ey + 3, hwd, 1, skD);
    }
  }

  }

  // ── 얼굴 앞으로 올린 손 (눈물 닦기 · 턱 괴기 · 숟가락질)은 얼굴 위에
  if (!back)
    for (const [hx, hy] of hands) {
      if (hy >= bodyTop) continue;
      // 얼굴과 섞이지 않게 손가락 끝 그늘 · 소매 끝
      p.rect(hx, hy, 2, 2, sk);
      p.rect(hx, hy + 1, 2, 1, dark(sk, 0.2));
      p.rect(hx, hy + 2, 2, 1, dark(L.top, 0.15));
    }

  // ── 쥔 것 (받쳐 들거나 숙였을 때는 손이 비어 있지 않다)
  if (f.arms === 'pose') drawHeld(p, pose, side, cx, handY, hcx, hcy, f.r, bx, bw, armTop, headTop);
  if (spec && !back) drawTool(p, pose, f.fr, hands, side);
  const ol = (q: Pix) => (L.tpl ? softOutline(q, OUTLINE_WARM) : q.outline());
  if (m.shiftX || m.lift) return ol(new Pix(W, H).stamp(p, m.shiftX, -m.lift));
  return ol(p);
}

/** 본 그림 외곽선이 섞이는 따뜻한 먹색 */
const OUTLINE_WARM = hex('#3a2230');
const WHITE = hex('#ffffff');

/** 본으로 찍은 머리 + 표정 (눈 · 눈썹 · 입 · 볼 · 안경 · 눈물) */
function drawTplHead(p: Pix, f: ReturnType<typeof frame>, pal: Record<string, Color>, opt: PersonOpt, pose: PPose): void {
  const tpl = f.tpl!;
  const { m, L, side, back, headTop } = f;
  paintGrid(p, tpl.rows, f.tx, headTop, pal);
  if (back) return;
  // 노란 별 머리핀 (할머니가 준 것): 앞머리 오른쪽 위 · 옆모습은 관자놀이 위
  if (L.clip !== undefined) {
    const kx = f.tx + (side ? 7 : 10);
    const ky = headTop + 4;
    p.set(kx, ky - 1, L.clip);
    p.rect(kx - 1, ky, 3, 1, L.clip);
    p.set(kx - 1, ky + 1, shade(L.clip, -0.15));
    p.set(kx + 1, ky + 1, shade(L.clip, -0.15));
    p.set(kx, ky, shade(L.clip, 0.5));
  }
  const sk = L.skin;
  const ey = f.eyV;
  const eh = tpl.eh;
  const lashC = mix(EYE, sk, 0.15);
  const browC = shade(L.hair, -0.3);
  const eyes = f.eyesV;
  for (let i = 0; i < eyes.length; i++) {
    const ex = eyes[i] + (m.eyes === 'open' || m.eyes === 'up' ? m.eyeDX : 0);
    /** 바깥쪽: 왼눈은 왼쪽, 오른눈 · 옆모습은 오른쪽 */
    const out = !side && i === 0 ? -1 : 1;
    const ox = out < 0 ? ex - 1 : ex + 2;
    const bot = ey + eh - 1;
    if (m.eyes === 'closed') {
      if (m.mouth === 'open') {
        // 웃는 눈 ∩
        p.rect(ex, bot - 1, 2, 1, lashC);
        p.set(ex - 1, bot, lashC);
        p.set(ex + 2, bot, lashC);
      } else {
        // 감은 눈: 아래로 둥근 속눈썹 선
        p.rect(ex, bot, 2, 1, lashC);
        p.set(ox, bot - 1, lashC);
      }
    } else if (m.eyes === 'down') {
      // 내리깐 눈: 눈꺼풀 선 + 아래 반쪽 눈동자
      p.rect(ex, bot - 1, 2, 1, lashC);
      p.rect(ex, bot, 2, 1, EYE);
    } else if (m.eyes === 'wide') {
      p.rect(ex, ey - 1, 2, eh + 1, WHITE);
      p.rect(ex + (out < 0 ? 1 : 0), ey, 1, eh, EYE);
    } else {
      // 뜬 눈: 둥근 눈동자 (아래쪽은 밝은 갈색) + 흰 반짝 한 칸
      p.rect(ex, ey, 2, eh, EYE);
      p.rect(ex, bot, 2, 1, mix(EYE, hex('#8a5a3a'), 0.6));
      p.set(ex + (side ? 1 : 0), ey, WHITE);
      if (tpl.lash) p.set(ox, ey, lashC);
    }
  }
  // 표정 눈썹 (평소에는 그리지 않는다: 순한 얼굴)
  if (opt.mood === 'sad' || opt.mood === 'angry') {
    const sad = opt.mood === 'sad';
    for (let i = 0; i < eyes.length; i++) {
      const ex = eyes[i];
      const inner = side ? ex : i === 0 ? ex + 1 : ex;
      const outer = side ? ex + 1 : i === 0 ? ex : ex + 1;
      p.set(inner, ey - (sad ? 3 : 2), browC);
      p.set(outer, ey - (sad ? 2 : 3), browC);
    }
  }
  // 볼: 살빛에 섞은 연한 분홍 (네모 도장이 아니라 은은하게)
  const blush = mix(sk, hex('#ff8a8a'), 0.42);
  const cy = ey + eh;
  for (const c of tpl.cheeks ?? []) {
    const x = f.tx + c;
    if (p.get(x, cy) !== CLEAR) p.set(x, cy, blush);
    if (!side && p.get(x + 1, cy) !== CLEAR) p.set(x + 1, cy, mix(sk, blush, 0.5));
  }
  // 코 (어른 앞모습: 그늘 한 칸)
  if (!side && L.h >= 40) p.set(f.tx + tpl.ax - 1, ey + eh, pal.s);
  // 입
  const mx = f.mxV;
  const my = f.mouthYV;
  const lip = mix(sk, hex('#9a3a42'), 0.55);
  if (m.mouth === 'o') {
    p.rect(mx, my - 1, side ? 1 : 2, 2, hex('#8a3a3a'));
    p.set(mx, my - 1, hex('#5a2a2a'));
  } else if (m.mouth === 'open') {
    if (side) {
      p.set(mx, my - 1, hex('#8a3a3a'));
      p.set(mx, my, hex('#e8707a'));
    } else {
      p.rect(mx - 1, my - 1, 4, 1, hex('#8a3a3a'));
      p.rect(mx, my, 2, 1, hex('#e8707a'));
    }
  } else if (pose !== 'cry') {
    const sad = opt.mood === 'sad' || opt.mood === 'tear' || opt.mood === 'angry';
    if (side) p.set(mx, my - 1, lip);
    else if (sad) {
      p.rect(mx, my - 1, 2, 1, lip);
      p.set(mx - 1, my, mix(sk, lip, 0.6));
      p.set(mx + 2, my, mix(sk, lip, 0.6));
    } else {
      // 살짝 웃는 입: 가운데 두 칸 + 입꼬리 한 칸 위
      p.rect(mx, my - 1, 2, 1, lip);
    }
  }
  if (opt.mood === 'tear') {
    const tx = eyes[eyes.length - 1] + (side ? 0 : 1);
    p.set(tx, ey + eh, hex('#9ad8ff'));
    p.set(tx, ey + eh + 1, hex('#6ab8f0'));
  }
  if (L.glasses) {
    // 가는 동그란 안경테 (모서리를 비워 둥글게)
    const gl = mix(hex('#a8885a'), sk, 0.15);
    for (const ex of eyes) {
      p.rect(ex, ey - 1, 2, 1, gl);
      p.rect(ex, ey + eh, 2, 1, gl);
      if (!side) p.rect(ex - 1, ey, 1, eh, gl);
      p.rect(ex + 2, ey, 1, eh, gl);
    }
    if (!side) p.rect(eyes[0] + 3, ey, eyes[1] - eyes[0] - 3, 1, gl);
    else p.rect(f.tx + tpl.ax - 1, ey, eyes[0] - (f.tx + tpl.ax - 1), 1, gl);
  }
  if (pose === 'cry') {
    const tear = hex('#7ac8ff');
    for (const ex of eyes) p.set(ex, ey + eh, tear);
    const x0 = eyes[0] - 1;
    const w = side ? 5 : eyes[eyes.length - 1] - eyes[0] + 4;
    p.rect(x0, ey, w, 3, sk);
    p.rect(x0, ey, w, 1, shade(sk, 0.12));
    p.rect(x0, ey + 2, w, 1, pal.s);
    if (!side) p.set(Math.round(f.cx), ey + 1, pal.s);
  }
}


function drawTool(p: Pix, pose: PPose, fr: number, hands: [number, number][], side: boolean): void {
  if (!hands.length) return;
  const [ax, ay] = hands[0];
  const [bx, by] = hands[hands.length - 1];
  const silver = hex('#d8dce8');
  switch (pose) {
    case 'read': {
      // 펼친 책: 양 손 사이 (옆모습은 손 앞)
      const x0 = side ? bx - 2 : ax;
      const w = side ? 6 : bx - ax + 2;
      p.rect(x0, ay - 3, w, 4, hex('#fffaf0'));
      p.rect(x0, ay + 1, w, 1, hex('#4a90e0'));
      if (!side) p.rect(x0 + Math.floor(w / 2), ay - 3, 1, 4, hex('#d8ccb4'));
      for (let x = x0 + 1; x < x0 + w - 1; x += 2) p.set(x, ay - 2, hex('#a8a090'));
      break;
    }
    case 'write':
      p.rect(side ? bx - 3 : ax - 1, ay + 1, side ? 6 : bx - ax + 4, 2, hex('#fffaf0'));
      p.rect(bx + 1, by - 3, 1, 3, hex('#e8414f'));
      break;
    case 'knit':
      p.line(ax, ay + 1, ax + 3 - fr, ay - 4, silver);
      p.line(bx + 1, by + 1, bx - 2 + fr, by - 4, silver);
      p.rect(Math.min(ax, bx) + 1, ay + 2, Math.max(3, Math.abs(bx - ax)), 3, hex('#ffd84a'));
      p.set(Math.min(ax, bx) + 2, ay + 3, shade(hex('#ffd84a'), -0.2));
      break;
    case 'sew':
      p.rect(side ? bx - 2 : ax, ay + 1, 5, 4, hex('#ff9ec7'));
      p.set(side ? bx : ax + 2, ay + 2, hex('#e8414f'));
      p.line(side ? bx + 1 : ax + 3, ay + 1, bx + 1, by, hex('#e8414f'));
      p.set(bx + 1, by - 1, silver);
      break;
    case 'cook':
      // 국자: 손에서 아래로
      p.rect(bx + 1, by + 2, 1, 4, hex('#8a6a4a'));
      p.rect(bx, by + 5, 3, 2, silver);
      break;
    case 'eat':
      p.rect(ax - 1, ay + 1, 5, 2, hex('#f4ecdc'));
      p.rect(ax - 1, ay + 1, 5, 1, hex('#e8a860'));
      p.rect(bx + (side ? 2 : 1), by - (fr ? 0 : 2), 1, 2, silver);
      break;
    case 'drink': {
      const [cx, cy] = side ? [bx + 1, by - 1] : [Math.round((ax + bx) / 2), Math.min(ay, by) - 1];
      p.rect(cx, cy, 3, 3, hex('#ffffff'));
      p.rect(cx, cy + 1, 3, 1, hex('#ff9ec7'));
      break;
    }
    default:
      break;
  }
}

function drawHeld(p: Pix, pose: PPose, side: boolean, cx: number, handY: number, hcx: number, hcy: number, r: number, bx: number, bw: number, armTop: number, headTop: number): void {
  if (pose === 'hold' || pose === 'hug') drawPlush(p, side ? cx + 3 : cx - 3, handY - 6, pose === 'hug');
  if (pose === 'holdStar') drawStar(p, side ? cx + 5 : cx - 2, handY - 3);
  if (pose === 'holdDoll') {
    // 태엽 할머니 인형: 흰 머리 · 보라 옷
    const dx = side ? cx + 3 : cx - 3;
    p.ball(dx + 3, handY - 4, 3, 2.8, hex('#f0ccb0'), true);
    p.oval(dx + 3, handY - 6, 3.4, 1.6, hex('#e8e4ec'));
    p.rect(dx + 1, handY - 1, 5, 4, hex('#a88ad0'));
    p.set(dx + 2, handY - 4, INK);
    p.set(dx + 4, handY - 4, INK);
  }
  if (pose === 'holdPhoto') {
    const fx = side ? cx + 3 : cx - 4;
    p.rect(fx, handY - 6, 8, 7, hex('#8a5a3a'));
    p.rect(fx + 1, handY - 5, 6, 5, hex('#f0e4c8'));
    p.set(fx + 2, handY - 4, hex('#e8e4ec'));
    p.set(fx + 5, handY - 3, hex('#4a3226'));
  }
  if (pose === 'phone') p.rect(side ? hcx + r - 2 : bx + bw - 1, side ? hcy - 1 : armTop - 4, 2, 4, hex('#d8e0f0'));
  if (pose === 'umbrella') umbrella(p, side ? cx + 2 : cx + 4, headTop - 2, side ? cx + 2 : bx + bw + 1, armTop - 6);
}

/** 품에 안은 토비 인형 (작게) */
function drawPlush(p: Pix, x: number, y: number, hugged: boolean): void {
  const fur = hex('#f6f0f4');
  p.rect(x + 1, y - 3, 1, 3, fur);
  p.rect(x + 4, y - 3, 1, 3, fur);
  p.set(x + 1, y - 2, hex('#ff9ec7'));
  p.set(x + 4, y - 2, hex('#ff9ec7'));
  p.ball(x + 3, y + 2, 3, 2.6, fur, true);
  p.rect(x + 1, y + 4, 5, 3, hex('#4a78d8'));
  p.rect(x + 1, y + 4, 5, 1, hex('#e8414f'));
  if (!hugged) {
    p.set(x + 2, y + 2, INK);
    p.set(x + 4, y + 2, INK);
  }
}

function drawStar(p: Pix, x: number, y: number): void {
  const c = hex('#ffe07a');
  p.set(x + 2, y, c);
  p.rect(x, y + 1, 5, 1, c);
  p.rect(x + 1, y + 2, 3, 1, c);
  p.set(x, y + 3, c);
  p.set(x + 4, y + 3, c);
  p.set(x + 2, y + 1, shade(c, 0.4));
}

function umbrella(p: Pix, x: number, y: number, hx: number, hy: number): void {
  const c = hex('#e85a6a');
  // 손잡이 (손에서 우산 꼭지까지)
  p.line(hx, hy + 1, x, y, hex('#5a4038'));
  p.set(hx, hy + 2, hex('#5a4038'));
  for (let i = -8; i <= 8; i++) {
    const h = Math.round(Math.sqrt(Math.max(0, 64 - i * i)) * 0.6);
    const k = i < -3 ? 0.18 : i > 4 ? -0.18 : 0;
    p.rect(x + i, y - h, 1, h + 1, Math.abs(i) % 4 === 0 ? shade(c, k - 0.22) : shade(c, k));
  }
  // 우산살 끝 · 꼭지
  for (let i = -8; i <= 8; i += 4) p.set(x + i, y + 1, shade(c, -0.3));
  p.set(x, y - 6, hex('#5a4038'));
}

/** 누워 자는 모습 (옆으로 눕힌 그림): 베개 · 이불 · 머리 */
function sleeping(L: Look, awake = false): Pix {
  const w = L.h + 6;
  const h = 18;
  const p0 = new Pix(w + 2, h + 2);
  const p = new Pix(w, h);
  const headD = Math.min(14, Math.round(L.h * L.head));
  const r = headD / 2;
  const cy = 8;
  // 베개
  p.rect(1, cy + 1, headD + 3, 6, hex('#f4f0f8'));
  p.rect(1, cy + 6, headD + 3, 1, hex('#d8d0e0'));
  // 이불: 위 접힌 단 · 결 · 아래 그늘
  const bx = headD;
  const quilt = hex('#f0e0c8');
  p.rect(bx, 5, w - bx - 2, 11, quilt);
  p.rect(bx, 5, w - bx - 2, 2, hex('#ffffff'));
  p.rect(bx, 7, w - bx - 2, 1, hex('#e0d0b8'));
  for (let x = bx + 3; x < w - 4; x += 4) {
    p.set(x, 10, hex('#e0c8a8'));
    p.set(x + 2, 13, hex('#e0c8a8'));
  }
  p.rect(bx, 15, w - bx - 2, 1, hex('#d0b898'));
  // 이불 아래 몸 굴곡
  p.rect(bx + 2, 4, Math.round((w - bx) * 0.4), 1, quilt);
  // 머리: 얼굴 + 머리카락 (뒤통수 쪽)
  p.ball(r + 3, cy, r, r * 0.92, L.skin, true);
  for (let y = Math.floor(cy - r - 1); y < cy + r; y++)
    for (let x = 1; x < r + 2; x++) if (Math.hypot(x + 0.5 - (r + 3), y + 0.5 - cy) <= r + 1) p.set(x, y, (x + y) % 5 ? L.hair : shade(L.hair, -0.2));
  p.rect(r + 2, Math.floor(cy - r), 3, 1, L.hair);
  if (awake) {
    // 깬 채 누워 있다: 동그란 눈
    p.rect(r + 5, cy - 1, 1, 2, EYE);
    p.set(r + 5, cy - 1, hex('#ffffff'));
  } else p.rect(r + 5, cy, 2, 1, INK);
  p.rect(r + 4, cy + 2, 2, 1, hex('#ff9e9e'));
  // 테두리에 닿지 않게 한 칸 안쪽으로
  return p0.stamp(p, 1, 2).outline();
}

/** 걷기 그림 순서 */
export const PERSON_WALK: PPose[] = ['walk1', 'walk2', 'walk3', 'walk4'];

export function personHasPixels(p: Pix): boolean {
  return p.px.some((v) => v !== CLEAR);
}
