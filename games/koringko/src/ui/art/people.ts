/**
 * 사람 크기 인물 (기억 속 하루 · 할머니 · 엄마 · 아빠): 머리가 큰 귀여운 비율, 4방향 · 걷기 · 감정 자세.
 * 하루는 나이마다 키 · 머리 비율 · 옷이 바뀌고, 늘 노란 별 머리핀을 한다 (할머니가 준 것).
 */
import { CLEAR, Pix, hex, shade, type Color } from './paint.ts';

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
  /** 발끝에서 정수리까지 */
  h: number;
  /** 머리 지름 비율 */
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
  /** 허리 굽음 (할머니) */
  hunch?: number;
  /** 몸 폭 */
  bodyW: number;
}

const SKIN = hex('#f6d2b4');
const HAIR = hex('#4a3226');
const CLIP = hex('#ffd84a');
const INK = hex('#2a1c24');

export const PEOPLE: Record<string, Look> = {
  haru4: { h: 30, head: 0.5, skin: SKIN, hair: HAIR, hairStyle: 'tuft', clip: CLIP, top: hex('#ffd25a'), topStyle: 'overalls', trim: hex('#ffffff'), bottom: hex('#ffd25a'), shoes: hex('#e8584a'), bodyW: 10 },
  haru5: { h: 32, head: 0.48, skin: SKIN, hair: HAIR, hairStyle: 'tuft', clip: CLIP, top: hex('#ffcf3a'), topStyle: 'raincoat', trim: hex('#e8a020'), bottom: hex('#4a78d8'), shoes: hex('#e8584a'), bodyW: 11 },
  haru6: { h: 34, head: 0.47, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#ffd84a'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#ffd84a'), skirt: true, shoes: hex('#e8584a'), bodyW: 11 },
  haru7: { h: 36, head: 0.46, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#ff9ec7'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#ff9ec7'), skirt: true, shoes: hex('#c8384a'), bodyW: 11 },
  haru8: { h: 38, head: 0.44, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#f2f2f2'), topStyle: 'stripe', trim: hex('#4a90e0'), bottom: hex('#5a6aa8'), shoes: hex('#e8e0d0'), bodyW: 11 },
  haru9: { h: 40, head: 0.43, skin: SKIN, hair: HAIR, hairStyle: 'pony', clip: CLIP, top: hex('#f2f2f2'), topStyle: 'stripe', trim: hex('#e05a5a'), bottom: hex('#4a5a8a'), shoes: hex('#f0f0f0'), bodyW: 11 },
  haru10: { h: 42, head: 0.41, skin: SKIN, hair: HAIR, hairStyle: 'bob', clip: CLIP, top: hex('#5a9ae8'), topStyle: 'hoodie', trim: hex('#ffffff'), bottom: hex('#3a4a6a'), shoes: hex('#f0f0f0'), bodyW: 12 },
  haru11: { h: 44, head: 0.4, skin: SKIN, hair: HAIR, hairStyle: 'bob', clip: CLIP, top: hex('#8ad0a8'), topStyle: 'tee', trim: hex('#ffffff'), bottom: hex('#3a4a6a'), shoes: hex('#f0f0f0'), bodyW: 12 },
  haru12: { h: 46, head: 0.38, skin: SKIN, hair: HAIR, hairStyle: 'long', clip: CLIP, top: hex('#2e3a5e'), topStyle: 'uniform', trim: hex('#e05a5a'), bottom: hex('#2e3a5e'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 12 },
  haru13: { h: 48, head: 0.37, skin: SKIN, hair: HAIR, hairStyle: 'long', clip: CLIP, top: hex('#2a2630'), topStyle: 'black', trim: hex('#f2f2f2'), bottom: hex('#2a2630'), skirt: true, shoes: hex('#1a1418'), bodyW: 12 },
  haru14: { h: 50, head: 0.36, skin: SKIN, hair: HAIR, hairStyle: 'long', top: hex('#8a8a96'), topStyle: 'hoodie', trim: hex('#d8d8e0'), bottom: hex('#3a3e52'), shoes: hex('#f0f0f0'), bodyW: 12 },
  haru15: { h: 52, head: 0.35, skin: SKIN, hair: HAIR, hairStyle: 'long', top: hex('#c8b090'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#4a5a7a'), shoes: hex('#f0f0f0'), bodyW: 12 },
  grandma: { h: 46, head: 0.36, skin: hex('#f0ccb0'), hair: hex('#e8e4ec'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#6a5a7a'), skirt: true, shoes: hex('#5a4038'), glasses: true, hunch: 2, bodyW: 14 },
  // 태엽 할머니 인형: 할머니를 닮게 손바느질한 작은 인형 (장난감 크기)
  grandoll: { h: 28, head: 0.5, skin: hex('#f4d8c0'), hair: hex('#eceaf2'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#7a6a8a'), skirt: true, shoes: hex('#5a4038'), glasses: true, bodyW: 12 },
  // 할머니의 지난날 (보리의 기억): 일곱 살 순이 · 스무 살 순이 · 마흔 살 순이, 젊은 할아버지, 순이 엄마, 어린 엄마 은주
  suni7: { h: 36, head: 0.46, skin: hex('#f2c8a8'), hair: hex('#1e1618'), hairStyle: 'bob', top: hex('#e0505a'), topStyle: 'dress', trim: hex('#ffe08a'), bottom: hex('#e0505a'), skirt: true, shoes: hex('#f0ece0'), bodyW: 11 },
  suni20: { h: 50, head: 0.35, skin: hex('#f2c8a8'), hair: hex('#1e1618'), hairStyle: 'long', top: hex('#8ab8e0'), topStyle: 'dress', trim: hex('#ffffff'), bottom: hex('#8ab8e0'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 12 },
  suni40: { h: 50, head: 0.35, skin: hex('#f0c8ac'), hair: hex('#3a2c2a'), hairStyle: 'bun', top: hex('#a88ad0'), topStyle: 'cardigan', trim: hex('#f4ece0'), bottom: hex('#5a4a6a'), skirt: true, shoes: hex('#4a3a3a'), bodyW: 13 },
  gpa: { h: 58, head: 0.33, skin: hex('#e8c0a0'), hair: hex('#1e1618'), hairStyle: 'short', top: hex('#e8e0cc'), topStyle: 'shirt', trim: hex('#8a7a5a'), bottom: hex('#4a4038'), shoes: hex('#2a2020'), bodyW: 15 },
  gmom: { h: 48, head: 0.36, skin: hex('#e8c0a4'), hair: hex('#9a9098'), hairStyle: 'bun', top: hex('#e8dcc4'), topStyle: 'cardigan', trim: hex('#a8584a'), bottom: hex('#6a5a5a'), skirt: true, shoes: hex('#f0ece0'), hunch: 1, bodyW: 14 },
  eunju6: { h: 34, head: 0.47, skin: SKIN, hair: hex('#5a3a2a'), hairStyle: 'pony', clip: hex('#8ad0a8'), top: hex('#8ad0a8'), topStyle: 'overalls', trim: hex('#ffffff'), bottom: hex('#8ad0a8'), shoes: hex('#e8584a'), bodyW: 11 },
  // 하루의 친구 지우 (열 살 · 열세 살)
  jiwoo10: { h: 42, head: 0.41, skin: hex('#f2c8a4'), hair: hex('#2a1e1c'), hairStyle: 'pony', clip: hex('#e85a6a'), top: hex('#f0a050'), topStyle: 'hoodie', trim: hex('#ffffff'), bottom: hex('#4a5a7a'), shoes: hex('#f0f0f0'), bodyW: 12 },
  jiwoo13: { h: 48, head: 0.37, skin: hex('#f2c8a4'), hair: hex('#2a1e1c'), hairStyle: 'bob', top: hex('#2e3a5e'), topStyle: 'uniform', trim: hex('#e05a5a'), bottom: hex('#2e3a5e'), skirt: true, shoes: hex('#3a2a2a'), bodyW: 12 },
  mom: { h: 54, head: 0.34, skin: SKIN, hair: hex('#5a3a2a'), hairStyle: 'pony', top: hex('#6ab08a'), topStyle: 'shirt', trim: hex('#f4ece0'), bottom: hex('#4a4a5a'), shoes: hex('#4a3a3a'), bodyW: 13 },
  dad: { h: 58, head: 0.33, skin: hex('#f0c8a8'), hair: hex('#2a2226'), hairStyle: 'short', top: hex('#5a7ab8'), topStyle: 'shirt', trim: hex('#f4ece0'), bottom: hex('#3a3a48'), shoes: hex('#3a2a2a'), glasses: true, bodyW: 15 },
};

export function isPerson(kind: string): boolean {
  return kind in PEOPLE;
}

export const PERSON_W = 30;
/** 그림 높이 = 키 + 위 여백 */
export function personH(kind: string): number {
  return (PEOPLE[kind]?.h ?? 40) + 6;
}
/** 발 아래 여백 */
export const PERSON_FOOT_PAD = 2;

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
}

/** 뛰는 몸짓은 그림 위에 여백을 더 둔다 */
const TOP_PAD: Partial<Record<PPose, number>> = { jump: 6, hop: 4, stretch: 6, cheer: 6, surprise: 4, pat: 2 };

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
    case 'peek': set({ headDX: fr ? 3 : 2, low: 0.15, bend: 1 }); break;
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
  const W = PERSON_W;
  const H = L.h + 6 + (TOP_PAD[pose] ?? 0);
  const cx = W / 2;
  const foot = H - PERSON_FOOT_PAD;
  const headD = Math.round(L.h * L.head);
  const legLen = Math.max(4, Math.round((L.h - headD) * 0.38));
  const low = Math.round(legLen * m.low);
  const side = dir === 'right' || dir === 'left';
  const back = dir === 'up';
  const bw = side ? L.bodyW - 3 : L.bodyW;
  const hunch = L.hunch ?? 0;
  const bodyBot = foot - legLen - 1 + low + m.bob;
  const bodyTop = foot - L.h + headD - 2 + low + m.bob + hunch;
  const bodyH = bodyBot - bodyTop;
  const bx = Math.round(cx - bw / 2);
  const armTop = bodyTop + 1;
  const handY = bodyTop + Math.round(bodyH * 0.45);
  /** 받쳐 든 손 높이 (가슴~배 앞) */
  const carryY = bodyTop + Math.round(bodyH * 0.62);
  /** 숙여 집는 손 (무릎 아래) */
  const reachY = Math.min(foot - 3, bodyBot + 3);
  const arms: 'kneel' | 'carry' | 'pose' = pose === 'kneel' ? 'kneel' : opt.carry && pose !== 'sit' && pose !== 'cry' && m.low < 1 ? 'carry' : 'pose';
  // 머리 자리
  const headTop = foot - L.h + low + m.bob + hunch + m.bend + m.headDY + (pose === 'cry' ? 1 : 0);
  const r = headD / 2;
  const hcx = (side ? cx + 1 + (hunch ? 1 : 0) + (m.bend ? 2 : 0) : cx) + m.headDX;
  const hcy = headTop + r;
  const ey = Math.round(hcy + r * 0.12) + (m.eyes === 'up' ? -1 : 0);
  const marks: Marks = {
    c: Math.round(cx), bx, R: bx + bw, armTop, chest: bodyTop + 3, waist: bodyBot - 3, bodyBot, hcx, ey,
    chin: Math.round(hcy + r * 0.8), mouthY: ey + 3, mx: Math.round(hcx + r * 0.62), headTop, back, eyeR: Math.round(hcx + r * 0.38) - 1,
  };
  const spec = arms === 'pose' ? armSpec(pose, fr, marks) : null;
  return { L, pose, step, fr, m, W, H, cx, foot, headD, legLen, low, side, back, bw, hunch, bodyBot, bodyTop, bodyH, bx, armTop, handY, carryY, reachY, arms, headTop, r, hcx, hcy, ey, spec };
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
  const { L, m, W, H, cx, foot, legLen, side, back, bw, bodyBot, bodyTop, bodyH, bx, armTop, handY, headTop, r, hcx, hcy, spec } = f;
  pose = f.pose;
  const p = new Pix(W, H);
  const sk = L.skin;

  // ── 다리 · 신발
  const legW = side ? 3 : 3;
  const legCol = L.skirt ? sk : L.bottom;
  if (m.low >= 1) {
    // 앉기: 다리를 앞으로 (옆모습) / 무릎이 보이게 (앞모습)
    if (side) {
      p.rect(cx - 2, bodyBot - 3, legLen + 3, 4, L.bottom);
      p.rect(cx + legLen, bodyBot - 3, 3, 4, L.shoes);
    } else {
      p.rect(cx - bw / 2 + 1, bodyBot - 2, bw - 2, 4, L.skirt ? L.bottom : L.bottom);
      p.rect(cx - bw / 2 + 1, bodyBot + 2, 4, 2, L.shoes);
      p.rect(cx + bw / 2 - 5, bodyBot + 2, 4, 2, L.shoes);
    }
  } else if (side) {
    const ll = legLen - Math.round(legLen * m.low) - m.tuck;
    for (const [off, k] of [[m.legL, -0.2], [m.legR, 0]] as [number, number][]) {
      const x = Math.round(cx - 1 + off);
      p.rect(x, bodyBot, legW, ll, k ? shade(legCol, k) : legCol);
      p.rect(x, bodyBot + ll - 2, legW + 1, 2, L.shoes);
    }
  } else {
    const ll = legLen - Math.round(legLen * m.low) - m.tuck;
    const lx = Math.round(cx - bw / 4 - 1.5);
    const rx = Math.round(cx + bw / 4 - 1.5);
    p.rect(lx, bodyBot, legW, ll + Math.min(0, m.legL), legCol);
    p.rect(rx, bodyBot, legW, ll + Math.min(0, m.legR), shade(legCol, -0.12));
    p.rect(lx - (back ? 0 : 0), bodyBot + ll - 2 + Math.min(0, m.legL), legW + 1, 2, L.shoes);
    p.rect(rx, bodyBot + ll - 2 + Math.min(0, m.legR), legW + 1, 2, shade(L.shoes, -0.1));
  }

  // ── 몸통
  const top = L.top;
  // 치마는 아래가 넓다
  for (let y = bodyTop; y < bodyBot + (L.skirt && m.low < 1 ? 1 : 0); y++) {
    const t = (y - bodyTop) / Math.max(1, bodyH);
    const flare = L.skirt && t > 0.55 ? Math.round((t - 0.55) * 6) : 0;
    const shoulder = t < 0.12 ? 1 : 0;
    for (let x = bx - flare + shoulder; x < bx + bw + flare - shoulder; x++) {
      const u = (x - bx) / bw;
      let c = top;
      if (L.skirt && t > 0.55) c = L.bottom;
      else if (L.topStyle === 'overalls' && t > 0.3) c = L.bottom;
      if (L.topStyle === 'stripe' && t <= 0.55 && (y - bodyTop) % 3 === 0) c = L.trim;
      // 왼쪽 밝게 · 오른쪽 어둡게
      if (u > 0.72) c = shade(c, -0.18);
      else if (u < 0.2) c = shade(c, 0.1);
      p.set(x, y, c);
    }
  }
  // 옷 꾸밈
  const midY = bodyTop + Math.round(bodyH * 0.35);
  if (!back) {
    if (L.topStyle === 'overalls') {
      p.rect(bx + 2, bodyTop, 2, Math.round(bodyH * 0.35), L.bottom);
      p.rect(bx + bw - 4, bodyTop, 2, Math.round(bodyH * 0.35), L.bottom);
      p.set(bx + 3, midY, L.trim);
      if (!side) p.set(bx + bw - 3, midY, L.trim);
      if (!side) p.rect(cx - 2, midY + 2, 4, 3, shade(L.bottom, -0.15));
    } else if (L.topStyle === 'hoodie') {
      p.line(cx - 1, bodyTop + 1, cx - 1, bodyTop + 4, L.trim);
      if (!side) p.line(cx + 1, bodyTop + 1, cx + 1, bodyTop + 4, L.trim);
      p.rect(bx + 2, bodyTop + Math.round(bodyH * 0.55), bw - 4, 3, shade(top, -0.12));
    } else if (L.topStyle === 'uniform') {
      p.tri(cx - 3, bodyTop, cx + 3, bodyTop, cx, bodyTop + 4, L.trim === hex('#e05a5a') ? hex('#f4f4f4') : L.trim);
      p.rect(cx - 1, bodyTop + 3, 2, 2, L.trim);
    } else if (L.topStyle === 'black') {
      p.tri(cx - 2, bodyTop, cx + 2, bodyTop, cx, bodyTop + 3, L.trim);
    } else if (L.topStyle === 'cardigan') {
      p.rect(cx - 2, bodyTop, side ? 2 : 4, Math.round(bodyH * 0.7), L.trim);
      for (let y = bodyTop + 2; y < bodyTop + bodyH * 0.65; y += 3) p.set(side ? cx - 2 : cx + 2, y, shade(top, -0.35));
    } else if (L.topStyle === 'raincoat') {
      for (let y = bodyTop + 2; y < bodyBot - 1; y += 3) p.set(side ? cx : cx, y, L.trim);
      p.rect(bx, bodyBot - 1, bw, 1, L.trim);
    } else if (L.topStyle === 'dress') {
      p.rect(bx + 1, bodyTop + Math.round(bodyH * 0.5), bw - 2, 1, L.trim);
      p.set(cx, bodyTop + 2, L.trim);
    } else if (L.topStyle === 'shirt') {
      p.tri(cx - 3, bodyTop, cx + 3, bodyTop, cx, bodyTop + 3, L.trim);
    }
  }

  // ── 팔
  const armLen = Math.max(5, Math.round(bodyH * 0.72));
  const sleeve = L.topStyle === 'overalls' || L.topStyle === 'dress' ? sk : top;
  const drawArm = (x: number, swing: number, col: Color) => {
    p.rect(x, armTop + Math.max(0, swing), 2, armLen - Math.abs(swing) + Math.min(0, swing), col);
    p.rect(x, armTop + armLen - 2 + Math.min(0, swing) + Math.max(0, swing) * 0, 2, 2, sk);
  };
  const holding = HOLDING.has(pose) && f.arms === 'pose';
  const hands: [number, number][] = [];
  if (f.arms === 'kneel') {
    // 숙여 집기: 두 팔을 발치로 뻗는다
    const ry = f.reachY;
    if (side) {
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        p.rect(Math.round(cx + t * 4), Math.round(armTop + (ry - 1 - armTop) * t), 2, 2, shade(sleeve, -0.1));
      }
      p.rect(Math.round(cx) + 4, ry - 1, 2, 2, sk);
    } else {
      p.rect(bx, armTop, 2, ry - armTop - 1, sleeve);
      p.rect(bx + bw - 2, armTop, 2, ry - armTop - 1, shade(sleeve, -0.15));
      p.rect(bx, ry - 1, 2, 2, sk);
      p.rect(bx + bw - 2, ry - 1, 2, 2, sk);
    }
  } else if (f.arms === 'carry') {
    // 두 팔을 앞으로 모아 받친다 (물건 그림이 위에 덮인다)
    const cy = f.carryY;
    if (side) {
      p.rect(cx - 1, armTop, 2, cy - armTop, shade(sleeve, -0.1));
      p.rect(cx - 1, cy - 1, 7, 2, shade(sleeve, -0.1));
      p.rect(cx + 6, cy - 1, 2, 2, sk);
    } else if (back) {
      // 뒷모습: 팔꿈치가 양옆으로 살짝 벌어진다
      p.rect(bx - 1, armTop, 2, cy - armTop - 1, sleeve);
      p.rect(bx + bw - 1, armTop, 2, cy - armTop - 1, shade(sleeve, -0.15));
      p.set(bx - 2, cy - 3, sleeve);
      p.set(bx + bw + 1, cy - 3, shade(sleeve, -0.15));
    } else {
      p.rect(bx - 1, armTop, 2, cy - armTop, sleeve);
      p.rect(bx + bw - 1, armTop, 2, cy - armTop, shade(sleeve, -0.15));
      p.rect(bx + 1, cy - 1, 3, 2, sleeve);
      p.rect(bx + bw - 4, cy - 1, 3, 2, shade(sleeve, -0.15));
      p.rect(Math.round(cx) - 4, cy - 1, 2, 2, sk);
      p.rect(Math.round(cx) + 2, cy - 1, 2, 2, sk);
    }
  } else if (spec) {
    const limb = (from: [number, number], l: Limb | undefined, col: Color, def: () => void) => {
      if (l === undefined) return def();
      if (l === null) {
        // 감춘 팔: 어깨만 (손은 등 뒤)
        p.rect(from[0], from[1], 2, 4, col);
        return;
      }
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
    if (side) limb([Math.round(cx) - 1, armTop], spec.s, shade(sleeve, -0.1), () => drawArm(Math.round(cx - 1 + m.armL), 0, shade(sleeve, -0.1)));
    else {
      limb([bx - 2, armTop], spec.l, sleeve, () => drawArm(bx - 2, m.armL, sleeve));
      limb([bx + bw, armTop], spec.r, shade(sleeve, -0.15), () => drawArm(bx + bw, m.armR, shade(sleeve, -0.15)));
    }
  } else if (pose === 'cry' && !back) {
    // 두 손으로 얼굴을 가린다
    p.rect(bx - 1, armTop, 2, 4, sleeve);
    p.rect(bx + bw - 1, armTop, 2, 4, sleeve);
  } else if (holding && !back) {
    if (side) {
      p.rect(cx + 1, handY - 1, 5, 2, sleeve);
      p.rect(cx + 5, handY - 1, 2, 2, sk);
    } else {
      p.rect(bx - 1, armTop, 2, handY - armTop, sleeve);
      p.rect(bx + bw - 1, armTop, 2, handY - armTop, shade(sleeve, -0.15));
      p.rect(bx + 1, handY - 1, 3, 2, sleeve);
      p.rect(bx + bw - 4, handY - 1, 3, 2, shade(sleeve, -0.15));
    }
  } else if (side) {
    if (pose === 'phone') p.rect(cx, armTop - 3, 2, 5, sleeve);
    else if (pose === 'umbrella' || pose === 'wave') p.rect(cx + 1, armTop - 5, 2, 7, sleeve);
    else drawArm(Math.round(cx - 1 + m.armL), 0, shade(sleeve, -0.1));
  } else {
    drawArm(bx - 2, m.armL, sleeve);
    if (pose === 'wave' || pose === 'umbrella') {
      p.rect(bx + bw, armTop - 6, 2, 8, shade(sleeve, -0.15));
      p.rect(bx + bw, armTop - 8, 2, 2, sk);
    } else if (pose === 'phone') {
      p.rect(bx + bw - 1, armTop - 2, 2, 5, shade(sleeve, -0.15));
    } else drawArm(bx + bw, m.armR, shade(sleeve, -0.15));
  }

  // ── 머리
  // 얼굴: 평평한 살색에 가장자리만 살짝 그늘 (얼굴이 더러워 보이지 않게)
  for (let y = Math.floor(hcy - r); y <= hcy + r; y++)
    for (let x = Math.floor(hcx - r); x <= hcx + r; x++) {
      const dx = (x + 0.5 - hcx) / r;
      const dy = (y + 0.5 - hcy) / (r * 0.95);
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      p.set(x, y, d > 0.72 && (dx > 0.3 || dy > 0.5) ? shade(sk, -0.1) : dx < -0.4 && dy < -0.2 ? shade(sk, 0.06) : sk);
    }
  // 머리카락
  const hair = L.hair;
  const hr = r + 1;
  for (let y = Math.floor(hcy - hr); y <= hcy + hr + 8; y++)
    for (let x = Math.floor(hcx - hr - 2); x <= hcx + hr + 2; x++) {
      const dx = (x + 0.5 - hcx) / hr;
      const dy = (y + 0.5 - hcy) / hr;
      const inHead = dx * dx + dy * dy <= 1;
      let on = false;
      if (back) {
        on = inHead && dy < 0.75;
        if (L.hairStyle === 'long' && Math.abs(dx) < 1.02 && dy >= 0 && dy < 1.9) on = true;
        if (L.hairStyle === 'bob' && Math.abs(dx) < 1.05 && dy >= 0 && dy < 1.1) on = true;
      } else if (side) {
        const crown = L.hairStyle === 'bun' ? -0.45 : -0.25;
        on = inHead && (dy < crown + (dx > 0.5 ? 0.1 : 0) || dx < -0.3);
        if (L.hairStyle === 'long' && dx < -0.15 && dx > -1.08 && dy >= 0 && dy < 1.8) on = true;
        if (L.hairStyle === 'bob' && dx < -0.1 && dx > -1.08 && dy >= 0 && dy < 1.05) on = true;
      } else {
        // 앞머리
        const fringe = dy < (L.hairStyle === 'bun' ? -0.5 : -0.2) + Math.abs(Math.sin(dx * 4)) * 0.12;
        on = inHead && fringe;
        if (inHead && Math.abs(dx) > 0.82 && dy < (L.hairStyle === 'bun' ? 0.1 : 0.6)) on = true;
        if (L.hairStyle === 'long' && Math.abs(dx) > 0.78 && Math.abs(dx) < 1.08 && dy >= 0 && dy < 1.8) on = true;
        if (L.hairStyle === 'bob' && Math.abs(dx) > 0.72 && Math.abs(dx) < 1.08 && dy >= 0 && dy < 1.05) on = true;
      }
      // 윤기: 정수리에서 비스듬한 밝은 줄, 아래쪽은 어둡게
      const shine = dy > -0.82 && dy < -0.62 && dx > -0.62 && dx < 0.05;
      if (on) p.set(x, y, shine ? shade(hair, 0.35) : dx < -0.3 && dy < -0.3 ? shade(hair, 0.15) : dy > 0.6 ? shade(hair, -0.18) : hair);
    }
  // 머리 모양 덧붙이기
  if (L.hairStyle === 'bun') p.ball(hcx + (side ? -3 : 0), hcy - hr - 1, 3.2, 2.8, hair, true);
  if (L.hairStyle === 'pony') {
    if (side) p.rect(hcx - hr - 2, hcy - 2, 3, 7, shade(hair, -0.05));
    else if (back) p.rect(hcx - 1, hcy + 1, 3, 7, shade(hair, -0.05));
    else p.rect(hcx + hr - 1, hcy - 1, 3, 6, shade(hair, -0.1));
  }
  if (L.hairStyle === 'tuft') {
    p.set(hcx, hcy - hr - 1, hair);
    p.set(hcx + 1, hcy - hr - 2, hair);
  }
  // 별 머리핀
  if (L.clip !== undefined && !back) {
    const kx = side ? hcx - 2 : hcx + Math.round(r * 0.55);
    const ky = Math.round(hcy - r * 0.55);
    p.set(kx, ky - 1, L.clip);
    p.rect(kx - 1, ky, 3, 1, L.clip);
    p.set(kx - 1, ky + 1, L.clip);
    p.set(kx + 1, ky + 1, L.clip);
  }

  // ── 얼굴
  if (!back) {
    const ey = f.ey;
    const eyes = side ? [Math.round(hcx + r * 0.45)] : [Math.round(hcx - r * 0.38), Math.round(hcx + r * 0.38) - 1];
    const big = L.head >= 0.4;
    const eyeC = hex('#3a2418');
    for (let ex of eyes) {
      if (m.eyes === 'closed') {
        // 감은 눈: 아래로 휜 선
        p.set(ex, ey + 1, INK);
        p.set(ex + 1, ey + 1, INK);
        p.set(ex - 1, ey, INK);
        if (!side) p.set(ex + 2, ey, INK);
      } else if (m.eyes === 'down') {
        // 내리깐 눈: 납작한 줄
        p.rect(ex, ey + 1, 2, 1, eyeC);
        p.set(ex - (side ? 0 : 1), ey + 1, INK);
      } else if (m.eyes === 'wide') {
        // 휘둥그레: 흰자 둘레에 작은 눈동자
        p.rect(ex - (side ? 0 : 1), ey - 1, 3, 3, hex('#ffffff'));
        p.set(ex + (side ? 1 : 0), ey, eyeC);
        p.set(ex + (side ? 1 : 0), ey + 1, eyeC);
      } else {
        // 눈동자 + 반짝 (어릴수록 크다)
        const ex0 = ex;
        ex = ex + m.eyeDX;
        p.rect(ex, ey - (big ? 1 : 0), 2, big ? 3 : 2, eyeC);
        p.set(ex, ey - (big ? 1 : 0), hex('#ffffff'));
        p.set(ex + 1, ey + (big ? 1 : 0), shade(eyeC, -0.4));
        // 속눈썹 · 눈썹
        p.set(ex - (side ? 0 : 1), ey - (big ? 1 : 0), INK);
        if (!L.glasses) {
          p.set(ex0, ey - 3, shade(L.hair, -0.25));
          p.set(ex0 + 1, ey - 3, shade(L.hair, -0.25));
        }
      }
    }
    // 입: 작게 (울 때 · 놀랄 때는 다르게)
    const my = ey + 3;
    const mx = side ? Math.round(hcx + r * 0.62) : Math.round(hcx);
    if (m.mouth === 'o') p.rect(mx - (side ? 0 : 1), my, 2, 2, hex('#8a3a3a'));
    else if (m.mouth === 'open') {
      // 활짝 웃는 입
      p.rect(mx - (side ? 0 : 1), my, side ? 2 : 3, 1, hex('#8a3a3a'));
      p.set(mx, my + 1, hex('#e8707a'));
    } else if (pose !== 'cry') {
      p.set(mx, my, shade(sk, -0.45));
      if (!side) p.set(mx - 1, my, shade(sk, -0.3));
    }
    // 볼
    const cheek = hex('#ff9e9e');
    if (side) p.rect(Math.round(hcx + r * 0.25), ey + 2, 2, 1, cheek);
    else {
      p.rect(eyes[0] - 2, ey + 2, 2, 1, cheek);
      p.rect(eyes[1] + 2, ey + 2, 2, 1, cheek);
    }
    if (L.glasses) {
      // 동그란 안경테
      const gl = hex('#b89a6a');
      for (const ex of eyes) {
        p.rect(ex - 1, ey - 2, 4, 1, gl);
        p.rect(ex - 1, ey + 2, 4, 1, gl);
        p.rect(ex - 2, ey - 1, 1, 3, gl);
        p.rect(ex + 2, ey - 1, 1, 3, gl);
      }
      if (!side) p.rect(eyes[0] + 3, ey - 1, eyes[1] - eyes[0] - 4, 1, gl);
    }
    if (pose === 'cry') {
      const tear = hex('#7ac8ff');
      for (const ex of eyes) p.set(ex, ey + 3, tear);
      // 얼굴을 가린 손
      p.rect(Math.round(hcx - r * 0.7), ey + 1, Math.round(r * 1.4), 3, sk);
      p.rect(Math.round(hcx - r * 0.7), ey + 1, Math.round(r * 1.4), 1, shade(sk, 0.1));
    }
  }

  // ── 얼굴 앞으로 올린 손 (눈물 닦기 · 턱 괴기 · 숟가락질)은 얼굴 위에
  if (!back) for (const [hx, hy] of hands) if (hy < bodyTop) p.rect(hx, hy, 2, 2, sk);

  // ── 쥔 것 (받쳐 들거나 숙였을 때는 손이 비어 있지 않다)
  if (f.arms === 'pose') drawHeld(p, pose, side, cx, handY, hcx, hcy, r, bx, bw, armTop);
  if (spec && !back) drawTool(p, pose, f.fr, hands, side);
  if (m.shiftX || m.lift) return new Pix(W, H).stamp(p, m.shiftX, -m.lift).outline();
  return p.outline();
}

/** 새 자세의 손에 든 것: 책 · 종이와 펜 · 뜨개바늘 · 천과 바늘 · 국자 · 그릇과 숟가락 · 찻잔 */
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

function drawHeld(p: Pix, pose: PPose, side: boolean, cx: number, handY: number, hcx: number, hcy: number, r: number, bx: number, bw: number, armTop: number): void {
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
  if (pose === 'umbrella') umbrella(p, side ? cx + 2 : bx + bw + 1, armTop - 8);
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

function umbrella(p: Pix, x: number, y: number): void {
  const c = hex('#e85a6a');
  for (let i = -7; i <= 7; i++) {
    const h = Math.round(Math.sqrt(Math.max(0, 49 - i * i)) * 0.55);
    p.rect(x + i, y - h, 1, h + 1, i % 4 === 0 ? shade(c, 0.25) : c);
  }
  p.rect(x, y, 1, 9, hex('#5a4038'));
}

/** 누워 자는 모습 (옆으로 눕힌 그림) */
function sleeping(L: Look, awake = false): Pix {
  const w = L.h + 6;
  const h = 18;
  const p = new Pix(w, h);
  const headD = Math.round(L.h * L.head);
  const r = headD / 2;
  // 이불
  p.rect(headD - 2, 5, w - headD - 2, 10, hex('#f0e0c8'));
  p.rect(headD - 2, 5, w - headD - 2, 2, hex('#ffffff'));
  for (let x = headD; x < w - 4; x += 4) p.set(x, 10, hex('#e0c8a8'));
  p.ball(r + 2, 9, r, r * 0.9, L.skin, true);
  for (let y = 9 - r - 1; y < 9 + r; y++) for (let x = 1; x < r + 1; x++) if (Math.hypot(x - (r + 2), y - 9) <= r + 1) p.set(x, y, L.hair);
  if (awake) {
    // 깬 채 누워 있다: 동그란 눈
    p.rect(r + 3, 8, 1, 2, INK);
    p.set(r + 3, 8, hex('#ffffff'));
  } else p.rect(r + 3, 9, 2, 1, INK);
  return p.outline();
}

/** 걷기 그림 순서 */
export const PERSON_WALK: PPose[] = ['walk1', 'walk2', 'walk3', 'walk4'];

export function personHasPixels(p: Pix): boolean {
  return p.px.some((v) => v !== CLEAR);
}
