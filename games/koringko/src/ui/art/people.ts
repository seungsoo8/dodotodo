/**
 * 사람 크기 인물 (기억 속 하루 · 할머니 · 엄마 · 아빠): 머리가 큰 귀여운 비율, 4방향 · 걷기 · 감정 자세.
 * 하루는 나이마다 키 · 머리 비율 · 옷이 바뀌고, 늘 노란 별 머리핀을 한다 (할머니가 준 것).
 */
import { CLEAR, Pix, hex, shade, type Color } from './paint.ts';

export type PDir = 'down' | 'up' | 'left' | 'right';
export type PPose = 'idle' | 'blink' | 'walk1' | 'walk2' | 'walk3' | 'walk4' | 'sit' | 'cry' | 'hold' | 'holdStar' | 'holdPhoto' | 'holdDoll' | 'phone' | 'umbrella' | 'wave' | 'kneel' | 'hug' | 'lookUp' | 'sleep';

export const PERSON_POSES: PPose[] = ['idle', 'blink', 'walk1', 'walk2', 'walk3', 'walk4', 'sit', 'cry', 'hold', 'holdStar', 'holdPhoto', 'holdDoll', 'phone', 'umbrella', 'wave', 'kneel', 'hug', 'lookUp', 'sleep'];
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
  eyes: 'open' | 'closed' | 'up';
  low: number;
  /** 상체 숙임: 머리가 이만큼 더 내려간다 (집기) */
  bend: number;
}

/** 걸음 한 칸: 0 · 2 는 다리가 엇갈리고, 1 · 3 은 몸이 1칸 들썩인다 */
export type PStep = 0 | 1 | 2 | 3;

export interface PersonOpt {
  /** 걸음 프레임 (자세와 따로): 팔 자세 · 든 것은 그대로, 다리 · 들썩임만 걷는다 */
  step?: PStep;
  /** 두 팔을 앞으로 모아 물건을 받쳐 든다 (물건 그림은 따로) */
  carry?: boolean;
}

const WALK_POSE: Partial<Record<PPose, PStep>> = { walk1: 0, walk2: 1, walk3: 2, walk4: 3 };

function motion(pose: PPose, step: PStep | undefined): Motion {
  const m: Motion = { bob: 0, legL: 0, legR: 0, armL: 0, armR: 0, eyes: 'open', low: 0, bend: 0 };
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
    default:
      break;
  }
  return m;
}

const HOLDING = new Set<PPose>(['hold', 'holdStar', 'holdPhoto', 'holdDoll', 'hug']);

/** 그림 한 장의 뼈대 (그리기 · 손 자리 계산이 함께 쓴다). 방향은 오른쪽 기준 */
function frame(kind: string, dir: PDir, pose0: PPose, opt: PersonOpt) {
  const L = PEOPLE[kind] ?? PEOPLE.haru10;
  const walkStep = WALK_POSE[pose0];
  const pose: PPose = walkStep !== undefined ? 'idle' : pose0;
  const step = walkStep ?? opt.step;
  const m = motion(pose, step);
  const W = PERSON_W;
  const H = L.h + 6;
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
  const arms: 'kneel' | 'carry' | 'pose' = pose === 'kneel' ? 'kneel' : opt.carry && pose !== 'sit' && pose !== 'cry' ? 'carry' : 'pose';
  return { L, pose, step, m, W, H, cx, foot, headD, legLen, low, side, back, bw, hunch, bodyBot, bodyTop, bodyH, bx, armTop, handY, carryY, reachY, arms };
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
  if (dir === 'left') return personSprite(kind, 'right', pose, opt).flipped();
  const f = frame(kind, dir, pose, opt);
  const { L, m, W, H, cx, foot, headD, legLen, low, side, back, bw, hunch, bodyBot, bodyTop, bodyH, bx, armTop, handY } = f;
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
    const ll = legLen - Math.round(legLen * m.low);
    for (const [off, k] of [[m.legL, -0.2], [m.legR, 0]] as [number, number][]) {
      const x = Math.round(cx - 1 + off);
      p.rect(x, bodyBot, legW, ll, k ? shade(legCol, k) : legCol);
      p.rect(x, bodyBot + ll - 2, legW + 1, 2, L.shoes);
    }
  } else {
    const ll = legLen - Math.round(legLen * m.low);
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
  const headTop = foot - L.h + low + m.bob + hunch + m.bend + (pose === 'cry' ? 1 : 0);
  const r = headD / 2;
  const hcx = side ? cx + 1 + (hunch ? 1 : 0) + (m.bend ? 2 : 0) : cx;
  const hcy = headTop + r;
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
    const ey = Math.round(hcy + r * 0.12) + (m.eyes === 'up' ? -1 : 0);
    const eyes = side ? [Math.round(hcx + r * 0.45)] : [Math.round(hcx - r * 0.38), Math.round(hcx + r * 0.38) - 1];
    const big = L.head >= 0.4;
    const eyeC = hex('#3a2418');
    for (const ex of eyes) {
      if (m.eyes === 'closed') {
        // 감은 눈: 아래로 휜 선
        p.set(ex, ey + 1, INK);
        p.set(ex + 1, ey + 1, INK);
        p.set(ex - 1, ey, INK);
        if (!side) p.set(ex + 2, ey, INK);
      } else {
        // 눈동자 + 반짝 (어릴수록 크다)
        p.rect(ex, ey - (big ? 1 : 0), 2, big ? 3 : 2, eyeC);
        p.set(ex, ey - (big ? 1 : 0), hex('#ffffff'));
        p.set(ex + 1, ey + (big ? 1 : 0), shade(eyeC, -0.4));
        // 속눈썹 · 눈썹
        p.set(ex - (side ? 0 : 1), ey - (big ? 1 : 0), INK);
        if (!L.glasses) {
          p.set(ex, ey - 3, shade(L.hair, -0.25));
          p.set(ex + 1, ey - 3, shade(L.hair, -0.25));
        }
      }
    }
    // 입: 작게 (울 때 · 놀랄 때는 다르게)
    const my = ey + 3;
    const mx = side ? Math.round(hcx + r * 0.62) : Math.round(hcx);
    if (pose !== 'cry') {
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

  // ── 쥔 것 (받쳐 들거나 숙였을 때는 손이 비어 있지 않다)
  if (f.arms === 'pose') drawHeld(p, pose, side, cx, handY, hcx, hcy, r, bx, bw, armTop);
  return p.outline();
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
function sleeping(L: Look): Pix {
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
  p.rect(r + 3, 9, 2, 1, INK);
  return p.outline();
}

/** 걷기 그림 순서 */
export const PERSON_WALK: PPose[] = ['walk1', 'walk2', 'walk3', 'walk4'];

export function personHasPixels(p: Pix): boolean {
  return p.px.some((v) => v !== CLEAR);
}
