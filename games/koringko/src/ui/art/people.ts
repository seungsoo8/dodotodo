/**
 * 사람 크기 인물 (기억 속 하루 · 할머니 · 엄마 · 아빠): 머리가 큰 귀여운 비율, 4방향 · 걷기 · 감정 자세.
 * 하루는 나이마다 키 · 머리 비율 · 옷이 바뀌고, 늘 노란 별 머리핀을 한다 (할머니가 준 것).
 */
import { CLEAR, Pix, hex, mix, shade, type Color } from './paint.ts';
import type { Mood } from '../../core/adv/types.ts';
import { HEAD_SETS, headPalette, type HeadKind, type HeadTpl } from './peopleHeads.ts';
import { mirror, paintGrid, paintGridOn, softOutline, stretchCol, stretchRow, type Grid, type Palette } from './px/grid.ts';
import { ARM_FRONT, ARM_SIDE, type ArmPart } from './px/people/arms.ts';
import { DECO, LAP, LEGS, SKIRT, STRIDE, TORSO, type Part } from './px/people/body.ts';
import { EYE_OPEN, FACE } from './px/people/face.ts';
import { BED, BED_PAL, HELD, HELD_PAL, LYING_EYE, LYING_HEAD, PILLOW_PAL } from './px/people/held.ts';

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
  /** 손으로 찍은 머리 본 (peopleHeads.ts) */
  tpl: HeadKind;
  /** 허리가 들어간 몸통 (십대 · 여자 어른) */
  slim?: boolean;
}

const SKIN = hex('#f6d2b4');
const HAIR = hex('#4a3226');
const CLIP = hex('#ffd84a');
const EYE = hex('#3a2418');

export const PEOPLE: Record<string, Look> = {
  // 하루: 네 · 다섯 살 정수리 삐침 → 여섯~아홉 살 묶은 머리 → 열 · 열한 살 단발 → 열두 살부터 긴 머리. 같은 얼굴 본이 자란다
  haru4: { h: 30, head: 0.5, skin: SKIN, hair: HAIR, hairStyle: 'tuft', clip: CLIP, top: hex('#ffd25a'), topStyle: 'overalls', trim: hex('#ffffff'), bottom: hex('#ffd25a'), shoes: hex('#e8584a'), bodyW: 10, tpl: 'kidTuft' },
  haru5: { h: 31, head: 0.5, skin: SKIN, hair: HAIR, hairStyle: 'tuft', clip: CLIP, top: hex('#ffcf3a'), topStyle: 'raincoat', trim: hex('#e8a020'), bottom: hex('#4a78d8'), shoes: hex('#e8584a'), bodyW: 10, tpl: 'kidTuft' },
  haru6: { h: 33, head: 0.49, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#ffd84a'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#ffd84a'), skirt: true, shoes: hex('#e8584a'), bodyW: 10, tpl: 'kidPony' },
  haru7: { h: 34, head: 0.47, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#ff9ec7'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#ff9ec7'), skirt: true, shoes: hex('#c8384a'), bodyW: 10, tpl: 'kidPony' },
  haru8: { h: 35, head: 0.46, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#f2f2f2'), topStyle: 'stripe', trim: hex('#4a90e0'), bottom: hex('#5a6aa8'), shoes: hex('#e8e0d0'), bodyW: 10, tpl: 'kidPony' },
  haru9: { h: 36, head: 0.45, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#f2f2f2'), topStyle: 'stripe', trim: hex('#e05a5a'), bottom: hex('#4a5a8a'), shoes: hex('#f0f0f0'), bodyW: 10, tpl: 'kidPony' },
  haru10: { h: 37, head: 0.44, skin: SKIN, hair: HAIR, hairStyle: 'bob', clip: CLIP, top: hex('#5a9ae8'), topStyle: 'hoodie', trim: hex('#ffffff'), bottom: hex('#3a4a6a'), shoes: hex('#f0f0f0'), bodyW: 10, tpl: 'kidBob' },
  haru11: { h: 38, head: 0.43, skin: SKIN, hair: HAIR, hairStyle: 'bob', clip: CLIP, top: hex('#8ad0a8'), topStyle: 'tee', trim: hex('#ffffff'), bottom: hex('#3a4a6a'), shoes: hex('#f0f0f0'), bodyW: 10, tpl: 'kidBob' },
  haru12: { h: 39, head: 0.42, skin: SKIN, hair: HAIR, hairStyle: 'long', clip: CLIP, top: hex('#2e3a5e'), topStyle: 'uniform', trim: hex('#e05a5a'), bottom: hex('#2e3a5e'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 10, tpl: 'teenLong' },
  haru13: { h: 40, head: 0.41, skin: SKIN, hair: HAIR, hairStyle: 'long', clip: CLIP, top: hex('#2a2630'), topStyle: 'black', trim: hex('#f2f2f2'), bottom: hex('#2a2630'), skirt: true, shoes: hex('#1a1418'), bodyW: 10, tpl: 'teenLong' },
  haru14: { h: 41, head: 0.4, skin: SKIN, hair: HAIR, hairStyle: 'long', top: hex('#8a8a96'), topStyle: 'hoodie', trim: hex('#d8d8e0'), bottom: hex('#3a3e52'), shoes: hex('#f0f0f0'), bodyW: 10, slim: true, tpl: 'teenLong' },
  haru15: { h: 42, head: 0.39, skin: SKIN, hair: HAIR, hairStyle: 'long', top: hex('#c8b090'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#4a5a7a'), shoes: hex('#f0f0f0'), bodyW: 10, slim: true, tpl: 'teenLong' },
  grandma: { h: 43, head: 0.38, skin: hex('#f0ccb0'), hair: hex('#e8e4ec'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#6a5a7a'), skirt: true, shoes: hex('#5a4038'), glasses: true, hunch: 2, bodyW: 12, tpl: 'elderBun' },
  // 태엽 할머니 인형: 할머니를 닮게 손바느질한 작은 인형 (장난감 크기 · 32×40 틀)
  grandoll: { h: 32, head: 0.5, skin: hex('#f4d8c0'), hair: hex('#eceaf2'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#7a6a8a'), skirt: true, shoes: hex('#5a4038'), glasses: true, bodyW: 10, tpl: 'elderBun' },
  // 할머니의 지난날 (보리의 기억): 일곱 살 순이 · 스무 살 순이 · 마흔 살 순이, 젊은 할아버지, 순이 엄마, 어린 엄마 은주
  suni7: { h: 34, head: 0.47, skin: hex('#f2c8a8'), hair: hex('#1e1618'), hairStyle: 'bob', top: hex('#e0505a'), topStyle: 'dress', trim: hex('#ffe08a'), bottom: hex('#e0505a'), skirt: true, shoes: hex('#f0ece0'), bodyW: 10, tpl: 'kidBob' },
  suni20: { h: 43, head: 0.38, skin: hex('#f2c8a8'), hair: hex('#1e1618'), hairStyle: 'long', top: hex('#8ab8e0'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#8ab8e0'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 10, slim: true, tpl: 'teenLong' },
  suni40: { h: 42, head: 0.38, skin: hex('#f0c8ac'), hair: hex('#3a2c2a'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#5a4a6a'), skirt: true, shoes: hex('#4a3a3a'), bodyW: 10, slim: true, tpl: 'elderBun' },
  gpa: { h: 44, head: 0.36, skin: hex('#e8c0a0'), hair: hex('#1e1618'), hairStyle: 'short', top: hex('#e8e0cc'), topStyle: 'shirt', trim: hex('#8a7a5a'), bottom: hex('#4a4038'), shoes: hex('#2a2020'), bodyW: 12, tpl: 'manShort' },
  gmom: { h: 42, head: 0.38, skin: hex('#e8c0a4'), hair: hex('#9a9098'), hairStyle: 'bun', top: hex('#e8dcc4'), topStyle: 'cardigan', trim: hex('#a8584a'), bottom: hex('#6a5a5a'), skirt: true, shoes: hex('#f0ece0'), hunch: 1, bodyW: 12, tpl: 'elderBun' },
  eunju6: { h: 33, head: 0.49, skin: SKIN, hair: hex('#5a3a2a'), hairStyle: 'pony', clip: hex('#8ad0a8'), top: hex('#8ad0a8'), topStyle: 'overalls', trim: hex('#ffffff'), bottom: hex('#8ad0a8'), shoes: hex('#e8584a'), bodyW: 10, tpl: 'kidPony' },
  // 하루의 친구 지우 (열 살 · 열세 살)
  jiwoo10: { h: 37, head: 0.44, skin: hex('#f2c8a4'), hair: hex('#2a1e1c'), hairStyle: 'pony', clip: hex('#e85a6a'), top: hex('#f0a050'), topStyle: 'hoodie', trim: hex('#ffffff'), bottom: hex('#4a5a7a'), shoes: hex('#f0f0f0'), bodyW: 10, tpl: 'kidPony' },
  jiwoo13: { h: 40, head: 0.41, skin: hex('#f2c8a4'), hair: hex('#2a1e1c'), hairStyle: 'bob', top: hex('#2e3a5e'), topStyle: 'uniform', trim: hex('#e05a5a'), bottom: hex('#2e3a5e'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 10, tpl: 'kidBob' },
  mom: { h: 43, head: 0.37, skin: SKIN, hair: hex('#5a3a2a'), hairStyle: 'pony', top: hex('#6ab08a'), topStyle: 'shirt', trim: hex('#f4ece0'), bottom: hex('#4a4a5a'), shoes: hex('#4a3a3a'), bodyW: 10, slim: true, tpl: 'womanPony' },
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
  const headD = HEAD_SETS[L.tpl].down.hd;
  // 어른은 다리가 조금 길다 (어른이 「늘인 아이」로 보이지 않게)
  const legK = L.h >= 40 ? 0.56 : 0.5;
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
  const bodyTop = sole - L.h + 1 + headD - 1 + rise + hunch;
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
  // 머리 본 자리 (얼굴 닻으로 눈 · 입 · 턱 자리를 잡는다)
  const tpl: HeadTpl = HEAD_SETS[L.tpl][side ? 'right' : back ? 'up' : 'down'];
  const fwd = side ? Math.min(2, hunch) + (m.bend ? 1 : 0) + m.headDX : m.headDX;
  const tx = Math.min(Math.round(cx) - tpl.ax + fwd, W - 2 - tpl.rows[0].length);
  const eyesV = tpl.eyes.length ? tpl.eyes.map((e) => tx + e) : [tx + 3, tx + 9];
  const eyV = headTop + tpl.ey + (m.eyes === 'up' ? -1 : 0);
  const mxV = tx + tpl.mouth[0];
  const mouthYV = headTop + tpl.mouth[1];
  const chinV = headTop + tpl.chin;
  const hcxV = tx + tpl.ax;
  const marks: Marks = {
    c: Math.round(cx), bx, R: bx + bw, armTop, chest: bodyTop + 3, waist: bodyBot - 3, bodyBot, hcx: hcxV, ey: eyV,
    chin: chinV, mouthY: mouthYV, mx: mxV, headTop, back, eyeR: eyesV[eyesV.length - 1],
  };
  const spec = arms === 'pose' ? armSpec(pose, fr, marks) : null;
  return { L, pose, step, fr, m, W, H, cx, foot, sole, headD, legLen, low, side, back, bw, hunch, bodyBot, bodyTop, bodyH, bx, armTop, handY, carryY, reachY, arms, headTop, spec, tpl, tx, eyesV, eyV, mxV, mouthYV };
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
/** 치마처럼 다리 위로 내려오는 옷 (원피스 · 비옷) */
const LONG_HEM = new Set<Top>(['dress', 'raincoat']);

const WHITE = hex('#ffffff');
/** 본 그림 외곽선이 섞이는 따뜻한 먹색 */
const OUTLINE_WARM = hex('#3a2230');

/** 세 단 명암 (밝음 · 바탕 · 그늘 · 깊은 그늘) → 글자 넷 */
function tones(letters: string, c: Color, k = 1): Record<string, Color> {
  const t = [shade(c, 0.16 * k), c, shade(c, -0.16 * k), shade(c, -0.32 * k)];
  const out: Record<string, Color> = {};
  for (let i = 0; i < 4; i++) if (letters[i] && letters[i] !== '.') out[letters[i]] = t[i];
  return out;
}

/** 아래옷이 치마 · 자락인가 */
function skirtish(L: Look): boolean {
  return !!L.skirt || LONG_HEM.has(L.topStyle);
}

/** 사람 한 명의 몸 팔레트 (팔레트 바꾸기로 옷 · 살 · 신발 색을 입힌다) */
function bodyPalette(L: Look): Record<string, Color> {
  const sk = L.skin;
  const adult = L.h >= 40;
  const bare = skirtish(L);
  /** 치마 · 자락 · 앉은 무릎 색: 원피스 · 비옷은 윗옷 색 */
  const lower = LONG_HEM.has(L.topStyle) ? L.top : L.bottom;
  const shirtC = L.topStyle === 'overalls' ? L.trim : L.top;
  const pal: Record<string, Color> = {
    ...tones('UCce', shirtC),
    T: L.trim, t: shade(L.trim, -0.18), W: hex('#f4f4f4'),
    ...(bare ? { V: shade(sk, 0.2), B: sk, b: mix(sk, hex('#c86a5a'), 0.22), v: mix(sk, hex('#a85a50'), 0.4) } : tones('VBbv', L.bottom)),
    M: shade(lower, 0.14), N: lower, m: shade(lower, -0.16), r: shade(lower, -0.3),
    J: L.topStyle === 'dress' ? L.trim : L.topStyle === 'raincoat' ? L.top : shade(lower, -0.22),
    j: L.topStyle === 'dress' ? shade(L.trim, -0.2) : shade(lower, -0.3),
    k: L.topStyle === 'raincoat' ? L.trim : shade(lower, -0.2),
    O: bare ? (adult ? sk : hex('#f8f4ec')) : shade(L.bottom, -0.3),
    o: bare ? (adult ? mix(sk, hex('#c86a5a'), 0.22) : hex('#d8d0c8')) : shade(L.bottom, -0.42),
    X: shade(L.shoes, 0.35), Z: L.shoes, z: shade(L.shoes, -0.25),
    R: hex('#5a4030'), Q: L.topStyle === 'overalls' ? shade(L.bottom, 0.5) : hex('#d8b860'),
  };
  // 살 · 머리 (머리 본과 같은 글자)
  Object.assign(pal, headPalette(L.hair, sk, L.clip ?? (L.hairStyle === 'bun' ? hex('#b89ad8') : hex('#e85a6a'))));
  return pal;
}

/** 팔 팔레트: A a 소매 · Y y 윗팔/아래팔 (짧은 소매면 살) · S s 손. far 면 그늘 쪽 팔 (조금 어둡게) */
function armPalette(L: Look, far: boolean): Record<string, Color> {
  const sleeve = L.topStyle === 'overalls' ? L.trim : L.top;
  const k = far ? -0.12 : 0;
  const sh = (c: Color) => (k ? shade(c, k) : c);
  const short = SHORT_SLEEVE.has(L.topStyle);
  const skS = mix(L.skin, hex('#c86a5a'), 0.22);
  return {
    A: sh(sleeve), a: sh(shade(sleeve, -0.16)),
    Y: sh(short ? L.skin : sleeve), y: sh(short ? skS : shade(sleeve, -0.16)),
    S: sh(L.skin), s: sh(skS),
  };
}

/** 얼굴 조각 팔레트 */
function facePalette(L: Look): Record<string, Color> {
  const sk = L.skin;
  return {
    E: EYE, e: mix(EYE, hex('#8a5a3a'), 0.6), W: WHITE, l: mix(EYE, sk, 0.15), b: shade(L.hair, -0.3),
    m: mix(sk, hex('#9a3a42'), 0.55), c: mix(sk, mix(sk, hex('#9a3a42'), 0.55), 0.6), D: hex('#8a3a3a'), d: hex('#5a2a2a'), P: hex('#e8707a'),
    q: mix(sk, hex('#ff8a8a'), 0.42), Q: mix(sk, hex('#ff8a8a'), 0.21), t: hex('#9ad8ff'), T: hex('#6ab8f0'),
    g: mix(hex('#a8885a'), sk, 0.15), L: shade(sk, 0.12), S: sk, s: mix(sk, hex('#c86a5a'), 0.22),
  };
}

/** 격자를 n 만큼 늘인 뒤 닻이 어디로 갔는가 (줄) */
function shiftAt(v: number, at: number, n: number): number {
  if (n >= 0) return v >= at ? v + n : v;
  const k = Math.min(-n, at + 1);
  return v > at ? v - k : v;
}

/**
 * 팔 하나를 어깨 P 에 붙여 찍는다. 목표 손 자리 T 가 있으면 늘이는 줄 · 열로 손을 그쪽에 맞춘다.
 * flip: 오른팔 (본은 왼팔). 돌려주는 값 = 손 자리 (손 두 칸의 왼칸 윗줄).
 */
function placeArm(p: Pix, part: ArmPart, P: [number, number], T: [number, number] | null, pal: Palette, flip: boolean): [number, number] {
  let g: string[] = [...part.g];
  let [shx, shy] = part.sh;
  let [hdx, hdy] = part.hd;
  if (T && part.sr !== undefined) {
    const now = hdy - shy;
    const want = T[1] - P[1];
    const n = Math.max(-2, hdy > shy ? want - now : now - want);
    g = stretchRow(g, part.sr, n);
    shy = shiftAt(shy, part.sr, n);
    hdy = shiftAt(hdy, part.sr, n);
  }
  if (T && part.sc !== undefined) {
    const now = hdx - shx;
    const want = flip ? P[0] - T[0] : T[0] - P[0];
    const n = Math.max(-2, hdx > shx ? want - now : now - want);
    g = stretchCol(g, part.sc, n);
    shx = shiftAt(shx, part.sc, n);
    hdx = shiftAt(hdx, part.sc, n);
  }
  const w = g[0].length;
  if (flip) {
    g = mirror(g);
    shx = w - 2 - shx;
    hdx = w - 2 - hdx;
  }
  const x0 = P[0] - shx;
  const y0 = P[1] - shy;
  paintGrid(p, g, x0, y0, pal);
  return [x0 + hdx, y0 + hdy];
}

/** 격자를 지정한 높이로 (늘이는 줄 하나) */
function fitRows(part: Part, h: number, which = 0): string[] {
  const sr = part.sr?.[which];
  return sr === undefined ? [...part.g] : stretchRow(part.g, sr, h - part.g.length);
}

type Limb2 = { k: string; t?: [number, number] | null } | null;
interface ArmPlan {
  l?: Limb2;
  r?: Limb2;
  s?: Limb2;
}

/** 자세 → 팔 본 (armSpec 의 손 자리를 목표로 쓴다) */
function armPieces(pose: PPose, fr: number, back: boolean): { l?: string; r?: string; s?: string } | null {
  switch (pose) {
    case 'clap': return fr ? { l: 'out', r: 'out', s: 'fwd' } : { l: 'bent', r: 'bent', s: 'fwd' };
    case 'wipe': return { r: 'face', s: 'face' };
    case 'giggle': return { r: 'chin', s: 'face' };
    case 'stretch': return { l: 'up', r: 'up', s: 'up' };
    case 'cheer':
    case 'surprise': return { l: 'raise', r: 'raise', s: 'raise' };
    case 'jump': return { l: 'up', r: 'up', s: 'up' };
    case 'point': return { r: 'out', s: 'fwd' };
    case 'think': return { l: 'low', r: 'chin', s: 'face' };
    case 'shiver': return { l: 'bent', r: 'bent', s: 'fwd' };
    case 'pat': return fr ? { r: 'out', s: 'fwd' } : { r: 'raise', s: 'raise' };
    case 'shrug': return fr ? { l: 'out', r: 'out', s: 'fwd' } : { l: 'hang', r: 'hang', s: 'hang' };
    case 'spin': return { l: 'out', r: 'out', s: 'fwd' };
    case 'bow': return { l: 'low', r: 'low', s: 'low' };
    case 'hipsHands': return { l: 'hips', r: 'hips', s: 'back' };
    case 'handsBack':
    case 'carryBack': return back ? { l: 'low', r: 'low' } : pose === 'handsBack' ? { l: 'back', r: 'back', s: 'back' } : { l: 'hang', r: 'hang', s: 'back' };
    case 'chinRest': return { l: 'chin', r: 'chin', s: 'face' };
    case 'read':
    case 'knit':
    case 'sew': return { l: 'bent', r: 'bent', s: 'fwd' };
    case 'write': return { l: 'low', r: 'low', s: 'low' };
    case 'cook': return { r: fr ? 'bent' : 'low', s: 'fwd' };
    case 'eat': return fr ? { l: 'bent', r: 'chin', s: 'face' } : { l: 'bent', r: 'bent', s: 'fwd' };
    case 'drink': return fr ? { l: 'bent', r: 'bent', s: 'fwd' } : { l: 'chin', r: 'chin', s: 'face' };
    case 'hugKnees': return { l: 'low', r: 'low', s: 'fwd' };
    case 'wavePush': return { l: 'bent', r: 'bent', s: 'fwd' };
    default: return null;
  }
}

/** 그림 위쪽(얼굴 · 머리 위)으로 올라가는 팔: 머리를 그린 뒤에 찍는다 */
const ABOVE_HEAD = new Set(['face', 'chin', 'up', 'raise']);

/** 사람 한 장. pose 가 walk1~4 이면 서 있는 팔 + 그 걸음 */
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
  const { L, m, W, H, cx, sole, legLen, side, back, bw, bodyBot, bodyTop, bodyH, bx, armTop, handY, headTop, spec } = f;
  pose = f.pose;
  const p = new Pix(W, H);
  const pal = bodyPalette(L);
  const wide = L.bodyW >= 12;
  const skirt = skirtish(L);
  const sitting = m.low >= 1;

  // ── 아래옷 경계: 바지는 윗옷 밑단(waistY)부터, 치마는 skirtTop 부터
  const style = L.topStyle;
  const waistT = style === 'hoodie' ? 0.86 : style === 'overalls' ? 0.62 : 0.66;
  const waistY = bodyTop + Math.round(bodyH * waistT);
  const skirtTop = bodyTop + Math.round(bodyH * 0.6);
  const hem = skirt && !sitting ? Math.max(2, Math.round(legLen * ((L.hunch ?? 0) ? 0.7 : style === 'raincoat' ? 0.55 : 0.42))) : 0;

  // ── 다리
  const tuck = m.tuck;
  const legBot = sole - tuck;
  const legTop = skirt ? bodyBot - 1 : waistY;
  if (sitting) {
    if (side) {
      const sl = Math.min(legLen, W - 1 - cx - 3);
      const g = stretchCol(LAP.side.g, LAP.side.sc!, sl + 4 - LAP.side.g[0].length);
      paintGrid(p, g, cx - 3, bodyBot - 3, pal);
    } else paintGrid(p, wide ? LAP.front12.g : LAP.front10.g, bx, bodyBot - 3, pal);
  } else if (side) {
    const stride = f.step === 0 ? 'a' : f.step === 2 ? 'b' : m.legL < m.legR ? 'b' : m.legR < m.legL ? 'a' : null;
    const len = legBot - bodyBot + 1;
    if (stride) {
      const key = [13, 10, 7].find((k) => k <= len) ?? 7;
      let g: string[] = [...STRIDE[key][stride]];
      g = stretchRow(g, 0, legBot - legTop + 1 - g.length);
      const off = g[0].search(/[^.]/);
      paintGrid(p, g, cx - 2 - off - (wide ? 1 : 0), legBot - g.length + 1, pal);
    } else {
      const part = wide ? LEGS.sideWide : LEGS.side;
      let g = stretchRow(part.g, part.sr![0], Math.max(1, bodyBot - legTop) - 1);
      g = stretchRow(g, part.sr![1] + g.length - part.g.length, legBot - legTop + 1 - g.length);
      paintGrid(p, g, cx - 4 - (wide ? 1 : 0), legBot - g.length + 1, pal);
    }
  } else {
    // 엉덩이 줄 (윗옷 밑단 ~ 다리 시작) · 두 다리 (든 발은 그만큼 짧게)
    const kind2 = `${skirt ? 'bare' : 'pants'}`;
    const wn = wide ? 12 : 10;
    const hips = LEGS[`${kind2}Hips${wn}`].g;
    for (let y = legTop; y < bodyBot; y++) paintGrid(p, hips, bx, y, pal);
    const leg = (part: Part, x: number, lift: number) => {
      const bot = legBot - lift;
      paintGrid(p, fitRows(part, bot - bodyBot + 1), x, bodyBot, pal);
    };
    leg(LEGS[`${kind2}L${wn}`], bx + 1, -Math.min(0, m.legL));
    leg(LEGS[`${kind2}R${wn}`], bx + (skirt ? (wide ? 7 : 6) : wide ? 6 : 5), -Math.min(0, m.legR));
  }

  // ── 몸통 (윗옷)
  const torsoEnd = skirt ? skirtTop + 1 : waistY;
  const tPart = side ? (wide ? TORSO.side8 : TORSO.side6) : wide ? TORSO.w12 : L.slim ? TORSO.slim10 : TORSO.w10;
  const torsoPal = pal;
  paintGrid(p, fitRows(tPart, torsoEnd - bodyTop), bx, bodyTop, torsoPal);
  // 옷 꾸밈 (몸통 위에만)
  const deco = DECO[style]?.[side ? 'side' : back ? 'back' : 'front'];
  if (deco) {
    const dx = side ? bx : bx + (wide ? 1 : 0);
    // 몸통 줄 안에서만 (아래옷 · 다리에 무늬가 번지지 않게)
    if (deco.top) paintGridOn(p, deco.top.slice(0, torsoEnd - bodyTop), dx, bodyTop, pal);
    if (deco.bot) paintGridOn(p, deco.bot, dx, torsoEnd - deco.bot.length, pal);
  }
  // ── 치마 · 자락
  if (skirt && !sitting) {
    const sPart = side ? (wide ? SKIRT.side8 : SKIRT.side6) : wide ? SKIRT.w12 : SKIRT.w10;
    const g = fitRows(sPart, bodyBot + hem - skirtTop);
    paintGrid(p, g, bx - 1, skirtTop, pal);
  }

  // ── 팔
  const near = armPalette(L, false);
  const far = armPalette(L, true);
  const armLen = Math.max(6, bodyBot - armTop + (L.h >= 40 ? 1 : 0));
  const hangY = (swing: number) => armTop + armLen - 2 - Math.max(0, -swing);
  const PL: [number, number] = [bx - 2, armTop];
  const PR: [number, number] = [bx + bw, armTop];
  const PS: [number, number] = [Math.round(cx) - 1, armTop];
  const hands: [number, number][] = [];
  const plan: ArmPlan = {};
  const tgt = (l: Limb | undefined): [number, number] | null => (l ? l.h : null);
  if (f.arms === 'kneel') {
    plan.l = { k: 'reach', t: [PL[0], f.reachY - 1] };
    plan.r = { k: 'reach', t: [PR[0], f.reachY - 1] };
    plan.s = { k: 'reach', t: [Math.round(cx) + 4, f.reachY - 1] };
  } else if (f.arms === 'carry') {
    const cy = f.carryY;
    plan.l = { k: 'bent', t: [Math.round(cx) - 4, cy - 1] };
    plan.r = { k: 'bent', t: [Math.round(cx) + 2, cy - 1] };
    plan.s = { k: 'fwd', t: [Math.round(cx) + 6, cy - 1] };
  } else if (spec) {
    const pc = armPieces(pose, f.fr, back) ?? {};
    const one = (k: string | undefined, l: Limb | undefined, P: [number, number], swing: number): Limb2 =>
      l === null ? { k: 'back' } : k && l ? { k, t: tgt(l) } : { k: 'hang', t: [P[0], hangY(swing)] };
    plan.l = one(pc.l, spec.l, PL, m.armL);
    plan.r = one(pc.r, spec.r, PR, m.armR);
    plan.s = pc.s && spec.s !== undefined && spec.s !== null ? { k: pc.s, t: tgt(spec.s) } : spec.s === null ? { k: 'back' } : null;
  } else if (pose === 'cry') {
    plan.l = { k: 'chin', t: [f.eyesV[0], f.eyV + 2] };
    plan.r = { k: 'chin', t: [f.eyesV[f.eyesV.length - 1], f.eyV + 2] };
    plan.s = { k: 'face', t: [f.eyesV[0], f.eyV + 1] };
  } else if (HOLDING.has(pose)) {
    plan.l = { k: 'bent', t: [Math.round(cx) - 3, handY - 1] };
    plan.r = { k: 'bent', t: [Math.round(cx) + 1, handY - 1] };
    plan.s = { k: 'fwd', t: [Math.round(cx) + 5, handY - 1] };
  } else if (pose === 'phone') {
    plan.r = { k: 'face', t: [f.tx + 11, f.eyV + 1] };
    plan.s = { k: 'face', t: [f.tx + 7, f.eyV + 1] };
  } else if (pose === 'wave' || pose === 'umbrella') {
    plan.r = { k: 'up', t: [PR[0], armTop - 8] };
    plan.s = { k: 'up', t: [Math.round(cx) + 1, armTop - 6] };
  }
  if (!side) {
    plan.l ??= { k: 'hang', t: [PL[0], hangY(m.armL)] };
    plan.r ??= { k: 'hang', t: [PR[0], hangY(m.armR)] };
  } else if (!plan.s) {
    const sw = m.armL;
    plan.s = { k: sw > 0 ? 'swingF' : sw < 0 ? 'swingB' : 'hang', t: [PS[0] + Math.round(sw), hangY(0)] };
  }
  const drawArms = (above: boolean) => {
    if (side) {
      const s = plan.s;
      if (s && ABOVE_HEAD.has(s.k) === above) hands.push(placeArm(p, ARM_SIDE[s.k] ?? ARM_SIDE.hang, PS, s.t ?? null, near, false));
      return;
    }
    for (const [lim, P, flip, ap] of [[plan.l, PL, false, near], [plan.r, PR, true, far]] as const) {
      if (!lim || ABOVE_HEAD.has(lim.k) !== above) continue;
      const part = ARM_FRONT[lim.k] ?? ARM_FRONT.hang;
      const h = placeArm(p, part, P, lim.t ?? null, ap, flip);
      if (lim.k !== 'back') hands.push(h);
    }
  };
  drawArms(false);

  // ── 머리 · 얼굴 (뒷모습은 팔을 머리가 가린다)
  if (back) drawArms(true);
  drawTplHead(p, f, pal, opt, pose);
  if (!back) drawArms(true);
  if (pose === 'cry' && !back) {
    const fp = facePalette(L);
    const c = side ? FACE.sideCryHands : FACE.cryHands;
    paintGrid(p, c.g, f.eyesV[0] + c.ox, f.eyV + c.oy, fp);
  }

  // ── 든 것 · 쓰는 도구
  if (f.arms === 'pose') drawHeld(p, pose, side, cx, handY, f, hands);
  if (spec && !back) drawTool(p, pose, f.fr, hands, side);
  const ol = (q: Pix) => softOutline(q, OUTLINE_WARM);
  if (m.shiftX || m.lift) return ol(new Pix(W, H).stamp(p, m.shiftX, -m.lift));
  return ol(p);
}

/** 본으로 찍은 머리 + 표정 조각 (눈 · 눈썹 · 입 · 볼 · 안경 · 눈물 · 별 머리핀) */
function drawTplHead(p: Pix, f: ReturnType<typeof frame>, pal: Record<string, Color>, opt: PersonOpt, pose: PPose): void {
  const tpl = f.tpl;
  const { m, L, side, back, headTop } = f;
  paintGrid(p, tpl.rows, f.tx, headTop, pal);
  if (back) return;
  // 노란 별 머리핀 (할머니가 준 것): 앞머리 오른쪽 위 · 옆모습은 관자놀이 위
  if (L.clip !== undefined) {
    const kx = f.tx + (side ? 7 : 10);
    paintGrid(p, CLIP_STAR, kx - 1, headTop + 3, { Y: L.clip, y: shade(L.clip, -0.15), w: shade(L.clip, 0.5) });
  }
  const fp = facePalette(L);
  const put = (pc: { g: Grid; ox: number; oy: number }, x: number, y: number, flip = false) => paintGrid(p, flip ? mirror(pc.g) : pc.g, x + pc.ox, y + pc.oy, fp);
  const ey = f.eyV;
  const eh = tpl.eh;
  const bot = ey + eh - 1;
  const eyes = f.eyesV;
  for (let i = 0; i < eyes.length; i++) {
    const ex = eyes[i] + (m.eyes === 'open' || m.eyes === 'up' ? m.eyeDX : 0);
    /** 왼눈(앞모습 첫째)만 바깥이 왼쪽 */
    const leftEye = !side && i === 0;
    if (m.eyes === 'closed') {
      if (m.mouth === 'open') put(FACE.smile, ex, bot);
      else put(leftEye ? FACE.closedL : FACE.closedR, ex, bot);
    } else if (m.eyes === 'down') put(FACE.down, ex, bot);
    else if (m.eyes === 'wide') paintGrid(p, (leftEye ? FACE.wideL : FACE.wideR)[eh], ex, ey - 1, fp);
    else {
      paintGrid(p, side ? EYE_OPEN[eh].side : EYE_OPEN[eh].front, ex, ey, fp);
      if (tpl.lash) put(leftEye ? FACE.lashL : FACE.lashR, ex, ey);
    }
  }
  // 표정 눈썹 (평소에는 없다: 순한 얼굴)
  if (opt.mood === 'sad' || opt.mood === 'angry') {
    const sad = opt.mood === 'sad';
    for (let i = 0; i < eyes.length; i++) {
      const leftEye = !side && i === 0;
      put(sad ? (leftEye ? FACE.browSadL : FACE.browSadR) : leftEye ? FACE.browAngryL : FACE.browAngryR, eyes[i], ey);
    }
  }
  // 볼 (살 칸 위에만)
  for (const c of tpl.cheeks ?? []) paintGridOn(p, side ? FACE.sideCheek.g : FACE.cheek.g, f.tx + c, ey + eh, fp);
  // 코 (어른 앞모습: 그늘 한 칸)
  if (!side && L.h >= 40) paintGrid(p, ['s'], f.tx + tpl.ax - 1, ey + eh, pal);
  // 입
  const mx = f.mxV;
  const my = f.mouthYV;
  if (m.mouth === 'o') put(side ? FACE.sideO : FACE.mouthO, mx, my);
  else if (m.mouth === 'open') put(side ? FACE.sideOpen : FACE.mouthOpen, mx, my);
  else if (pose !== 'cry') {
    const sad = opt.mood === 'sad' || opt.mood === 'tear' || opt.mood === 'angry';
    put(side ? FACE.sideMouth : sad ? FACE.mouthSad : FACE.mouth, mx, my);
  }
  if (opt.mood === 'tear' || pose === 'cry') {
    for (const ex of pose === 'cry' ? eyes : [eyes[eyes.length - 1] + (side ? 0 : 1)]) put(FACE.tear, ex, ey + eh);
  }
  if (L.glasses) {
    if (side) put(FACE.sideGlasses, eyes[0], ey);
    else put(FACE.glasses, eyes[0], ey);
  }
}

/** 노란 별 머리핀 */
const CLIP_STAR: Grid = ['.Y.', 'YwY', 'y.y'];

/** 손에 든 것 (안은 인형 · 별 · 사진 · 인형 할머니 · 전화 · 우산) */
function drawHeld(p: Pix, pose: PPose, side: boolean, cx: number, handY: number, f: ReturnType<typeof frame>, hands: [number, number][]): void {
  const put = (k: string, x: number, y: number) => paintGrid(p, HELD[k].g, x, y, HELD_PAL);
  if (pose === 'hold' || pose === 'hug') put(pose === 'hug' ? 'plushHug' : 'plush', side ? cx + 3 : cx - 3, handY - 9);
  if (pose === 'holdStar') put('star', side ? cx + 5 : cx - 2, handY - 3);
  if (pose === 'holdDoll') put('doll', side ? cx + 4 : cx - 2, handY - 7);
  if (pose === 'holdPhoto') put('photo', side ? cx + 3 : cx - 4, handY - 6);
  const h = hands[hands.length - 1];
  if (!h) return;
  if (pose === 'phone') put('phone', h[0], h[1] - 2);
  if (pose === 'umbrella') {
    const u = HELD.umbrella;
    paintGrid(p, u.g, Math.min(f.W - 2 - u.g[0].length, h[0] - u.ax), Math.max(1, h[1] - u.ay), HELD_PAL);
  }
}

/** 쓰는 도구 (책 · 종이 · 뜨개 · 바느질 · 국자 · 그릇 · 찻잔): 두 손 자리에 */
function drawTool(p: Pix, pose: PPose, fr: number, hands: [number, number][], side: boolean): void {
  if (!hands.length) return;
  const [ax, ay] = hands[0];
  const [bx, by] = hands[hands.length - 1];
  const mid = Math.round((ax + bx) / 2) + 1;
  const put = (k: string, x: number, y: number) => {
    const h = HELD[k];
    paintGrid(p, h.g, x - h.ax, y - h.ay, HELD_PAL);
  };
  switch (pose) {
    case 'read': put(side ? 'bookSide' : 'book', side ? bx : mid, ay); break;
    case 'write': put('paper', side ? bx : mid, ay + 2); break;
    case 'knit': put('knit', (side ? bx : mid) - fr, ay + 1); break;
    case 'sew': put('sew', side ? bx : mid, ay + 1 - fr); break;
    case 'cook': put('ladle', bx + 1, by + 2); break;
    case 'eat': put('bowl', side ? bx + 1 : ax + 1, ay + 1 - (side && fr ? 0 : 0)); break;
    case 'drink': put('cup', side ? bx + 1 : mid, Math.min(ay, by)); break;
    default: break;
  }
}

/** 누워 자는 모습 (옆으로 눕힌 그림): 베개 · 이불 · 머리. awake 면 눈을 뜨고 있다 */
function sleeping(L: Look, awake = false): Pix {
  const w = L.h + 6;
  const h = 18;
  const p0 = new Pix(w + 2, h + 2);
  const p = new Pix(w, h);
  paintGrid(p, BED.pillow, 1, 9, PILLOW_PAL);
  const q = BED.quilt;
  const qw = w - 14;
  paintGrid(p, stretchCol(q.g, q.sc, qw - q.g[0].length), 13, 5, BED_PAL);
  const hp = { ...headPalette(L.hair, L.skin, L.clip ?? hex('#e85a6a')), l: mix(EYE, L.skin, 0.15), q: mix(L.skin, hex('#ff8a8a'), 0.42), E: EYE, W: WHITE };
  paintGrid(p, LYING_HEAD, 1, 3, hp);
  if (awake) paintGrid(p, ['EW'], 1 + LYING_EYE[0], 3 + LYING_EYE[1], hp);
  // 테두리에 닿지 않게 한 칸 안쪽으로
  return softOutline(p0.stamp(p, 1, 2), OUTLINE_WARM);
}

/** 걷기 그림 순서 */
export const PERSON_WALK: PPose[] = ['walk1', 'walk2', 'walk3', 'walk4'];

export function personHasPixels(p: Pix): boolean {
  return p.px.some((v) => v !== CLEAR);
}
