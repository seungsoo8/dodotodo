/** 네 인형 그림: 방향 4 × (서기 3 · 걷기 4 · 공격 3 · 맞기). 동작마다 몸 · 팔 · 다리 · 귀 · 꼬리가 따로 움직인다 */
import type { HeroId } from '../../core/types.ts';
import type { Mood } from '../../core/adv/types.ts';
import { Pix, hex, mix, shade, type Color } from './paint.ts';
import { gridPix, gridSize, mat, paintGrid, softOutline, type Palette } from './px/grid.ts';
import {
  APRON, BODY_DOLL, BODY_ROBE, COLLAR, EAR_CAT, EAR_FOX, EAR_RABBIT, EAR_RABBIT_FLOP, FIST, FOOT, FOOT_SIDE, HAT, OVERALLS, PAW, PEEK_CHEEK, PEEK_SNOUT,
  SCARF, SCARF_TAIL, TAIL_BRUSH, TAIL_PUFF, TAIL_STUB, TAIL_THIN, TOY_HEADS, type ToyHead, type ToyPart,
} from './px/toys.ts';

export type Dir = 'down' | 'up' | 'left' | 'right' | 'downRight' | 'downLeft' | 'upRight' | 'upLeft';

const DIR8: Dir[] = ['right', 'downRight', 'down', 'downLeft', 'left', 'upLeft', 'up', 'upRight'];
/** 방향 벡터 → 8방향 (45도씩) */
export function dirOf(v: { x: number; y: number }): Dir {
  const a = Math.atan2(v.y, v.x);
  return DIR8[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

/** 정면 · 뒷모습 · 옆모습 중 무엇이고, 비스듬하면 어느 쪽으로 (-1 왼쪽 · 1 오른쪽) 돌았는가 */
function viewOf(dir: Dir): { side: boolean; back: boolean; turn: number } {
  const side = dir === 'left' || dir === 'right';
  const back = dir === 'up' || dir === 'upRight' || dir === 'upLeft';
  const turn = dir.endsWith('Right') ? 1 : dir.endsWith('Left') ? -1 : 0;
  return { side, back, turn };
}
export type Pose = 'idle' | 'idle2' | 'blink' | 'walk1' | 'walk2' | 'walk3' | 'walk4' | 'windup' | 'attack' | 'follow' | 'hurt' | 'walkA' | 'walkB';

/** 한 장의 몸짓 (픽셀 단위) */
interface Frame {
  /** 몸 전체 위아래 (음수 = 위로) */
  bob: number;
  /** 머리 · 몸이 바라보는 쪽으로 기우는 정도 (음수 = 뒤로) */
  lean: number;
  /** 숨 들이쉬기 · 움츠림: 머리가 내려오고 몸이 퍼진다 */
  squash: number;
  /** 귀가 처지는 정도 · 꼬리가 흔들리는 정도 */
  ear: number;
  tail: number;
  eyes: 'open' | 'closed' | 'hurt';
  /** 앞 · 뒷모습에서 몸이 좌우로 흔들림 */
  sway: number;
  /** 옆모습: 뒷다리 · 앞다리 · 앞팔 · 뒷팔 [앞으로, 아래로] */
  back: [number, number];
  front: [number, number];
  armF: [number, number];
  armB: [number, number];
  /** 앞 · 뒷모습: 왼발 · 오른발 · 왼팔 · 오른팔 (음수 = 들어 올림) */
  legL: number;
  legR: number;
  armL: number;
  armR: number;
  /** 몸짓: 머리만 위아래 · 옆(옆모습은 앞으로) · 앞모습 두 팔을 안쪽으로 [그림 왼팔, 오른팔] · 그림 전체 좌우 떨림 */
  nod: number;
  tilt: number;
  armIn: [number, number];
  shakeX: number;
}

const F0: Frame = { bob: 0, lean: 0, squash: 0, ear: 0, tail: 0, eyes: 'open', sway: 0, back: [0, 0], front: [0, 0], armF: [0, 0], armB: [0, 0], legL: 0, legR: 0, armL: 0, armR: 0, nod: 0, tilt: 0, armIn: [0, 0], shakeX: 0 };

/**
 * 장난감 몸짓 (@act): 이름 → 프레임들. 사람 몸짓과 같은 이름을 쓴다.
 * 팔 값은 앞모습 (음수 = 들어 올림), armF 는 옆모습 앞팔 [앞으로, 아래로].
 */
const UP: Partial<Frame> = { armL: -7, armR: -7, armIn: [-3, -3], armF: [1, -8], armB: [-1, -7] };
export const HERO_ACTS: Record<string, Partial<Frame>[]> = {
  nod: [{}, { nod: 2, eyes: 'closed', ear: 1 }],
  shake: [{ tilt: -1, eyes: 'closed' }, { tilt: 1, eyes: 'closed' }],
  laugh: [{ eyes: 'closed', squash: 1 }, { eyes: 'closed', bob: -1, armL: -1, armR: -1 }],
  giggle: [{ eyes: 'closed', armR: -5, armIn: [0, 4], armF: [0, -5] }, { eyes: 'closed', nod: 1, armR: -5, armIn: [0, 4], armF: [0, -5] }],
  clap: [{ armL: -3, armR: -3, armIn: [4, 4], armF: [3, -3], armB: [3, -3], eyes: 'closed' }, { armL: -3, armR: -3, armIn: [-1, -1], armF: [0, -3], armB: [-1, -3] }],
  jump: [{ squash: 1, bob: 1 }, { ...UP, bob: -4, legL: -2, legR: -2, ear: 2 }, { bob: -2, ear: 1, armL: -3, armR: -3, armF: [1, -3] }, { squash: 1 }],
  hop: [{}, { bob: -2, legL: -1, legR: -1, ear: 1 }],
  bow: [{ lean: 1, nod: 1 }, { lean: 3, nod: 3, eyes: 'closed', ear: 2 }],
  sigh: [{ bob: -1 }, { squash: 2, nod: 1, ear: 3, eyes: 'closed', armL: 1, armR: 1 }],
  wipe: [{ eyes: 'closed', armR: -6, armIn: [0, 3], armF: [1, -6] }, { eyes: 'closed', armR: -5, armIn: [0, 3], armF: [1, -5], nod: 1 }],
  stretch: [{ ...UP, eyes: 'closed' }, { ...UP, armL: -8, armR: -8, bob: -1, eyes: 'closed' }],
  point: [{ armR: -3, armIn: [0, -3], armF: [4, -2] }, { armR: -4, armIn: [0, -4], armF: [5, -3] }],
  think: [{ armR: -4, armIn: [0, 3], armF: [1, -4], tilt: 1 }, { armR: -4, armIn: [0, 3], armF: [1, -4], tilt: 0, ear: 1 }],
  shiver: [{ shakeX: -1, armIn: [2, 2], squash: 1, ear: 1 }, { shakeX: 1, armIn: [2, 2], squash: 1, ear: 1 }],
  tremble: [{ shakeX: -1, ear: 2 }, { shakeX: 1, ear: 2 }],
  spin: [{ armIn: [-2, -2] }, { armIn: [-2, -2] }, { armIn: [-2, -2] }, { armIn: [-2, -2] }],
  pat: [{ armR: -5, armIn: [0, -2], armF: [4, -5] }, { armR: -3, armIn: [0, -2], armF: [4, -3] }],
  stomp: [{ legL: -3, bob: -1 }, { squash: 1, legR: 0 }],
  peek: [{ tilt: 2, lean: 1 }, { tilt: 1, lean: 1 }],
  surprise: [{ bob: -2, ear: 1, armL: -4, armR: -4, armIn: [-1, -1], armF: [2, -4] }, { bob: -1, armL: -3, armR: -3, armF: [1, -3] }],
  lookAround: [{ tilt: -2 }, { tilt: 2 }],
  shrug: [{}, { squash: 1, armL: -2, armR: -2, armIn: [-2, -2], ear: 1, eyes: 'closed', armF: [2, -2] }],
  cheer: [{ ...UP, eyes: 'closed' }, { ...UP, bob: -2, ear: 1, eyes: 'closed' }],
};
/** 몸짓 프레임 넘기는 빠르기 (1초에) */
export const HERO_ACT_RATE: Record<string, number> = { nod: 4, shake: 6, laugh: 8, giggle: 6, clap: 7, jump: 8, hop: 7, bow: 2.5, sigh: 1.5, wipe: 4, stretch: 2, point: 3, think: 1.2, shiver: 14, tremble: 20, spin: 10, pat: 5, stomp: 6, peek: 1.5, surprise: 5, lookAround: 1.4, shrug: 2.5, cheer: 5 };

/** 몸짓에 어울리는 표정 (웃음 · 한숨 · 놀람) */
const ACT_MOOD: Record<string, ToyMood> = { laugh: 'smile', giggle: 'smile', cheer: 'smile', sigh: 'sad', surprise: 'surprise' };

const SPIN: Dir[] = ['down', 'right', 'up', 'left'];
/** 장난감 몸짓 한 장 (모르는 이름이면 null) */
export function heroActSprite(hero: HeroId, dir: Dir, act: string, frame: number, mood?: ToyMood): Pix | null {
  const fr = HERO_ACTS[act];
  if (!fr) return null;
  const k = frame % fr.length;
  if (act === 'spin') dir = SPIN[(Math.max(0, SPIN.indexOf(dir)) + k) % 4];
  return lookSprite(LOOKS[hero], dir, 'idle', fr[k], mood ?? ACT_MOOD[act]);
}

const FRAMES: Record<Pose, Partial<Frame>> = {
  idle: {},
  idle2: { squash: 1, ear: 1 },
  blink: { eyes: 'closed' },
  // 걷기: 발이 앞뒤로 엇갈리고 (1 · 3), 그 사이에는 몸이 떠오르며 발을 든다 (2 · 4)
  walk1: { back: [-4, 0], front: [4, 0], armF: [-3, -1], armB: [3, -1], legL: -2, armL: 1, armR: -1, tail: -1 },
  walk2: { bob: -1, ear: 1, back: [0, -1], sway: -1, armL: 0, armR: 0 },
  walk3: { back: [4, 0], front: [-4, 0], armF: [3, -1], armB: [-3, -1], legR: -2, armL: -1, armR: 1, tail: 1 },
  walk4: { bob: -1, ear: 1, front: [0, -1], sway: 1 },
  // 공격: 뒤로 젖혀 모았다가 → 앞으로 내지르고 → 따라 나간다
  windup: { lean: -2, squash: 1, ear: 1, armF: [-4, -3], armR: -3, tail: -1 },
  attack: { lean: 2, bob: -1, ear: 0, tail: 2, armF: [5, -1], front: [2, 0], armR: 2, armL: -1 },
  follow: { lean: 1, armF: [3, 2], armR: 1 },
  hurt: { lean: -2, eyes: 'hurt', ear: 2, armF: [-1, -2], armB: [1, -2], armL: -2, armR: -2 },
  walkA: {},
  walkB: {},
};
FRAMES.walkA = FRAMES.walk1;
FRAMES.walkB = FRAMES.walk3;

export const WALK_FRAMES: Pose[] = ['walk1', 'walk2', 'walk3', 'walk4'];
/** 걸음 빠르기: 1초에 걷기 그림을 넘기는 횟수 */
export const WALK_RATE = 10;

/** 지금 보여 줄 동작 (화면과 무관한 계산) */
export function heroPose(o: { state: string; walkT: number; time: number; hitIn: number; sinceSwing: number; hurtFor: number }): Pose {
  if (o.hurtFor < 0.18) return 'hurt';
  if (o.state === 'attack' || o.state === 'cast') {
    if (o.hitIn >= 0) return 'windup';
    return o.sinceSwing < 0.09 ? 'attack' : 'follow';
  }
  if (o.state === 'move') return WALK_FRAMES[Math.floor(o.walkT * WALK_RATE) % 4];
  // 3.4초마다 한 번 깜빡, 숨은 천천히
  if (o.time % 3.4 < 0.12) return 'blink';
  return Math.floor(o.time * 1.4) % 2 ? 'idle2' : 'idle';
}

interface Look {
  fur: Color;
  belly: Color;
  inner: Color;
  outfit: Color;
  trim: Color;
  eye: Color;
  ears: 'rabbit' | 'bear' | 'fox' | 'cat';
  extra: 'scarf' | 'overalls' | 'hood' | 'hat' | 'apron' | 'none';
  tail: 'puff' | 'stub' | 'brush' | 'thin';
}

const LOOKS: Record<HeroId, Look> = {
  toby: { fur: hex('#f6f0f4'), belly: hex('#fbf6f2'), inner: hex('#f2a0b8'), outfit: hex('#4f74c4'), trim: hex('#d8484e'), eye: hex('#2a1e2e'), ears: 'rabbit', extra: 'scarf', tail: 'puff' },
  bori: { fur: hex('#b07444'), belly: hex('#e8c08c'), inner: hex('#e8a87c'), outfit: hex('#4f9a52'), trim: hex('#f2c94c'), eye: hex('#24160e'), ears: 'bear', extra: 'overalls', tail: 'stub' },
  ruru: { fur: hex('#f28a2e'), belly: hex('#fff4e2'), inner: hex('#ffcfa8'), outfit: hex('#3e7a4a'), trim: hex('#a8d86a'), eye: hex('#2a1a10'), ears: 'fox', extra: 'hood', tail: 'brush' },
  nabi: { fur: hex('#5a5068'), belly: hex('#d8d0e4'), inner: hex('#ff9ec7'), outfit: hex('#7454b8'), trim: hex('#f2cc58'), eye: hex('#1a1424'), ears: 'cat', extra: 'hat', tail: 'thin' },
};

/** 무기를 쥔 주먹 (무기 위에 겹쳐 그려 쥐고 있게 보인다) */
export function fistSprite(hero: HeroId): Pix {
  return softOutline(gridPix(FIST.g, toyPal(LOOKS[hero]), { outline: false }), WARM_INK, 0.6);
}

/** mood: 초상화 · 대사 표정 (없으면 평소 얼굴) */
export function heroSprite(hero: HeroId, dir: Dir, pose: Pose, mood?: ToyMood): Pix {
  return lookSprite(LOOKS[hero], dir, pose, undefined, mood);
}

/** 마을 사람들 */
const NPC_LOOKS: Record<string, Look> = {
  chief: { fur: hex('#b8b0c4'), belly: hex('#e8e0ec'), inner: hex('#d8a8c8'), outfit: hex('#8a5ac8'), trim: hex('#ffd84a'), eye: hex('#2a1e2e'), ears: 'rabbit', extra: 'hood', tail: 'puff' },
  shop: { fur: hex('#a86a3a'), belly: hex('#e8c08c'), inner: hex('#e8a87c'), outfit: hex('#e05a4a'), trim: hex('#ffffff'), eye: hex('#24160e'), ears: 'bear', extra: 'apron', tail: 'stub' },
  forge: { fur: hex('#8a8a96'), belly: hex('#e8e4e0'), inner: hex('#4a4450'), outfit: hex('#5a4a3a'), trim: hex('#c8a070'), eye: hex('#1a1424'), ears: 'bear', extra: 'apron', tail: 'brush' },
  tailor: { fur: hex('#ffe4ec'), belly: hex('#ffffff'), inner: hex('#ff9ec7'), outfit: hex('#f08ab0'), trim: hex('#7ad0ff'), eye: hex('#2a1e2e'), ears: 'rabbit', extra: 'apron', tail: 'puff' },
  riftkeeper: { fur: hex('#8a6a4a'), belly: hex('#e8d8b8'), inner: hex('#c8a070'), outfit: hex('#3a4a8a'), trim: hex('#ffd84a'), eye: hex('#1a1424'), ears: 'cat', extra: 'hood', tail: 'stub' },
  mole: { fur: hex('#6a5a5a'), belly: hex('#c8a8a0'), inner: hex('#ff9ec7'), outfit: hex('#4a78a8'), trim: hex('#e0b030'), eye: hex('#1a1424'), ears: 'bear', extra: 'overalls', tail: 'stub' },
  baker: { fur: hex('#c8743a'), belly: hex('#fff0d8'), inner: hex('#ffcfa8'), outfit: hex('#ffffff'), trim: hex('#ffcf7a'), eye: hex('#2a1a10'), ears: 'fox', extra: 'apron', tail: 'brush' },
};

export function npcSprite(id: string, dir: Dir = 'down', pose: Pose = 'idle'): Pix {
  return lookSprite(NPC_LOOKS[id] ?? NPC_LOOKS.chief, dir, pose);
}

/** 장난감 그림 한 칸: 사람(32×48)과 같은 폭, 키는 작게 (32×40) */
export const HERO_W = 32;
export const HERO_H = 40;
/** 발 위치 (그림 안 y: 발바닥 외곽선 줄) */
export const HERO_FOOT = 38;
/** 몸 가운데 x */
const CX = HERO_W / 2;
/** 기준 자리: 몸통 가운데 · 머리 가운데 · 발 가운데 (서 있을 때) */
const BODY_Y = 30;
const HEAD_Y = 18;
const LEG_Y = 35;
/** 크기: 머리 · 몸통 · 팔 · 다리 */
const HEAD_RX = 9.6;
const HEAD_RY = 8.2;
const BODY_RX = 7.4;
const BODY_RY = 6.2;
const ARM_X = 8;

/** 한 장의 뼈대 (그림 · 손 자리가 함께 쓴다) */
function geo(F: Frame, dir: Dir) {
  const { side, back, turn: t } = viewOf(dir);
  const f = dir === 'left' ? -1 : 1;
  const cx = CX + (side ? 0 : F.sway);
  const by = BODY_Y + F.bob;
  // 기울기: 옆모습은 앞뒤로, 앞모습은 고개를 숙이거나 젖힌다 (비스듬하면 둘 다 조금씩)
  const leanX = side ? F.lean * f : t * Math.trunc(F.lean / 2);
  const bodyX = cx + Math.trunc(leanX / 2);
  // 머리가 그림 테두리 밖으로 나가지 않게 (가운데에서 4칸까지)
  const hx = Math.max(CX - 4, Math.min(CX + 4, cx + (side ? f : back ? t * 2 : t) + leanX + (side ? F.tilt * f : F.tilt)));
  // 앞으로 숙이면 고개가 내려간다 (뒷모습은 정수리가 그대로: 귀가 그림 위로 넘치지 않게)
  const hy = HEAD_Y + F.bob + F.squash + F.nod + (side ? 0 : back ? (F.lean < 0 ? 1 : 0) : Math.sign(F.lean));
  return { side, back, t, f, cx, by, leanX, bodyX, hx, hy };
}

/** 조각을 찍은 자리 (표정 닻을 그림 좌표로 옮길 때 쓴다) */
interface Placed {
  x0: number;
  y0: number;
  w: number;
  flip: boolean;
}

/**
 * 조각 하나를 (x, y) 에 찍는다: 닻 칸이 x, y 에 온다.
 * flip 이면 좌우를 뒤집어 거울 자리에 (닻 x 를 그대로 쓰면 가운데 선 x-0.5 를 기준으로 대칭).
 * mirror 만 주면 자리는 거울로 잡되 그림은 뒤집지 않는다 (작은 둥근 조각: 빛은 늘 왼쪽 위).
 */
function put(p: Pix, part: ToyPart, x: number, y: number, pal: Palette, flip = false, mirror = flip): Placed {
  const { w } = gridSize(part.g);
  const x0 = Math.round(x) - (mirror ? w - part.ax : part.ax);
  const y0 = Math.round(y) - part.ay;
  paintGrid(p, part.g, x0, y0, pal, flip);
  return { x0, y0, w, flip };
}
/** 조각 안 열 c (폭 n 칸 무늬의 왼칸) → 그림 x */
const colOf = (pl: Placed, c: number, n = 1) => (pl.flip ? pl.x0 + pl.w - n - c : pl.x0 + c);

const NOSE = hex('#3a2228');
const MOUTH = hex('#6a2c38');
const TONGUE = hex('#e8707e');
const SHINE = hex('#fff8f0');
const TEAR = hex('#8ad0f0');
/** 인형 외곽선에 섞는 따뜻한 먹색 (순수 검정 대신) */
const WARM_INK = hex('#3a2030');

/** 인형 팔레트 (글자 뜻은 px/toys.ts 머리말). furK: 털을 밝게(+) · 어둡게(-) (먼 쪽 팔 · 뒷발) */
function toyPal(L: Look, furK = 0): Palette {
  const fur = furK ? shade(L.fur, furK) : L.fur;
  return {
    ...mat('GgHhd', fur, { gloss: 0.4, light: 0.16, shadow: 0.16, deep: 0.34 }),
    ...mat('.VBb.', L.belly, { light: 0.3, shadow: 0.14 }),
    ...mat('..Pp.', L.inner, { shadow: 0.16 }),
    n: NOSE,
    ...mat('.KCcq', L.outfit, { light: 0.2, shadow: 0.2, deep: 0.38 }),
    ...mat('.YAa.', L.trim, { light: 0.32, shadow: 0.22 }),
  };
}
/** 동료 인형의 팔레트 (격자 검사 · 다른 그림에서 같은 색을 쓸 때) */
export function heroPalette(hero: HeroId): Palette {
  return toyPal(LOOKS[hero]);
}

/** 등을 보일 때: 귓속 분홍 대신 털 */
const backPal = (pal: Palette): Palette => ({ ...pal, P: pal.H, p: pal.h });
/** 다른 재질 하나를 털 글자 자리에 (발 · 꼬리 방울) */
const furAs = (pal: Palette, c: Color): Palette => ({ ...pal, ...mat('GgHhd', c, { gloss: 0.4, light: 0.16, shadow: 0.16, deep: 0.34 }) });

type View = 'down' | 'q' | 'right' | 'up';
/** 방향 → 본 하나와 뒤집기 */
function viewKey(dir: Dir): { v: View; flip: boolean } {
  switch (dir) {
    case 'down': return { v: 'down', flip: false };
    case 'downRight': return { v: 'q', flip: false };
    case 'downLeft': return { v: 'q', flip: true };
    case 'right': return { v: 'right', flip: false };
    case 'left': return { v: 'right', flip: true };
    case 'upLeft': return { v: 'up', flip: true };
    default: return { v: 'up', flip: false };
  }
}

/** 장난감 표정: 대사 표정 문법 (Mood) 과 같은 이름 */
export type ToyMood = Mood;

function lookSprite(L: Look, dir: Dir, pose: Pose, act?: Partial<Frame>, mood?: ToyMood): Pix {
  const F: Frame = { ...F0, ...FRAMES[pose], ...act };
  const p = new Pix(HERO_W, HERO_H);
  const { side, back, t, f, cx, by, bodyX, hx, hy } = geo(F, dir);
  const { v, flip } = viewKey(dir);
  const pal = toyPal(L);
  const legC = L.extra === 'overalls' ? L.outfit : shade(L.fur, -0.08);
  const footPal = furAs(pal, legC);
  const tailPal = L.tail === 'puff' ? { ...pal, ...mat('.VBb.', hex('#f4eef0'), { light: 0.3, shadow: 0.14 }) } : pal;
  const tailPart = { puff: TAIL_PUFF, stub: TAIL_STUB, brush: TAIL_BRUSH, thin: TAIL_THIN }[L.tail];

  // 꼬리: 옆 · 비스듬히 앞에서는 몸 뒤로 (등을 보이면 몸을 그린 뒤 몸 위에)
  if (side) {
    const o = -7;
    put(p, tailPart, bodyX + f * o, by + 1 - F.tail, tailPal, f < 0);
  } else if (t && !back) put(p, tailPart, bodyX + t * 2 - t * 7, by + 1 - F.tail, tailPal, t < 0);

  // 뒷팔 (옆모습: 몸 뒤로 살짝)
  if (side) put(p, PAW, bodyX - f * 4 + f * F.armB[0], by - 1 + F.armB[1], toyPal(L, -0.2), false, f < 0);

  // 다리 (짧고 동글동글, 발바닥 천 조각)
  if (side) {
    put(p, FOOT_SIDE, cx + f * (-3 + F.back[0]), LEG_Y + F.back[1], furAs(pal, shade(legC, -0.14)), f < 0);
    put(p, FOOT_SIDE, cx + f * (2 + F.front[0]), LEG_Y + F.front[1], footPal, f < 0);
  } else {
    put(p, FOOT, CX - 3, LEG_Y + F.legL, footPal, false, true);
    put(p, FOOT, CX + 3, LEG_Y + F.legR, furAs(pal, shade(legC, -0.06)));
  }

  // 몸통 + 옷 조각
  const bodySet = L.extra === 'hat' ? BODY_ROBE : BODY_DOLL;
  put(p, bodySet[v], bodyX, by, pal, flip);
  if (L.extra === 'overalls' && !back) put(p, OVERALLS[v === 'up' ? 'down' : v], bodyX, by, pal, flip);
  if (L.extra === 'apron' && !back) {
    const ap = L.outfit === hex('#ffffff') ? hex('#ffcf7a') : hex('#f8f4ec');
    put(p, side ? APRON.right : APRON.down, bodyX + (v === 'q' ? t : 0), by, { ...pal, ...mat('.VBb.', ap, { light: 0.2, shadow: 0.12 }) }, flip && side);
  }
  if (back) put(p, tailPart, bodyX + F.tail - t * 4, by + 2, backPal(tailPal), t < 0);

  // 팔 (머리 높이까지 든 팔은 머리를 그린 뒤 한 번 더: 머리에 가리지 않게)
  const raised: (() => void)[] = [];
  /** 뻗은 팔도 그림 테두리 안쪽에 (외곽선 한 칸 남기고) */
  const paw = (x: number, y: number, k: number) => put(p, PAW, Math.max(5, Math.min(HERO_W - 5, Math.round(x))), y, k ? toyPal(L, k) : pal);
  if (side) {
    const front = () => paw(bodyX + f * 5 + f * F.armF[0], by + F.armF[1], 0);
    front();
    if (F.armF[1] <= -4) raised.push(front);
  } else {
    // 앞모습: 오른손(그림 왼쪽)이 무기 손. 비스듬하면 돌아선 쪽 팔은 몸 뒤로 조금 숨는다
    const weaponL = !back;
    const arm = (sideX: number, dy: number) => {
      const far = t !== 0 && Math.sign(sideX) === t;
      const inward = sideX < 0 ? F.armIn[0] : F.armIn[1];
      const reach = (far ? 6 : ARM_X) - inward;
      const draw = () => paw(bodyX + sideX * reach, by - 1 + dy - (far ? 1 : 0), far ? -0.15 : 0);
      draw();
      if (dy <= -4 && !back) raised.push(draw);
    };
    arm(-1, weaponL ? F.armR : F.armL);
    arm(1, weaponL ? F.armL : F.armR);
  }

  // 귀 (머리가 귀뿌리를 덮는다)
  ears(p, L, hx, hy, dir, F.ear, back ? backPal(pal) : pal);
  // 머리
  const tpl = TOY_HEADS[L.ears][v];
  const head = put(p, tpl, hx, hy, pal, flip);
  if (!back) face(p, L, tpl, head, F, side, mood);
  else if (t) {
    // 비스듬한 뒷모습: 돌아선 쪽으로 주둥이 · 볼이 살짝 비친다
    const snout = L.ears === 'bear' || L.ears === 'fox';
    put(p, snout ? PEEK_SNOUT : PEEK_CHEEK, t > 0 ? hx + 8 : hx - 8, hy + 3, pal, t < 0);
  }
  if (L.extra === 'scarf') {
    // 목도리: 줄무늬 + 매듭 끝이 걸음 · 공격에 따라 펄럭인다
    const sy = hy + 7 - F.squash;
    put(p, back ? SCARF.up : side ? SCARF.right : SCARF.down, bodyX, sy, pal, flip);
    const flap = side ? -f * (F.bob < 0 || F.lean > 0 ? 2 : 0) : -t * (F.bob < 0 ? 1 : 0);
    if (!side || dir === 'left') put(p, SCARF_TAIL, bodyX + (back ? -4 : 3) + t + flap + 1, sy + 3, pal);
    else put(p, SCARF_TAIL, bodyX - 6 + flap + 1, sy + 3, pal);
  }
  if (L.extra === 'hood') put(p, back || side ? COLLAR.up : COLLAR.down, bodyX + (v === 'q' ? t : 0), hy + 7, pal, flip);
  if (L.extra === 'hat') {
    const flop = Math.max(0, -F.bob - 1);
    put(p, HAT[v], hx, hy - 3 + flop, pal, flip);
  }
  for (const d of raised) d();
  const out = F.shakeX ? new Pix(HERO_W, HERO_H).stamp(p, F.shakeX, 0) : p;
  return softOutline(out, WARM_INK, 0.6);
}

function ears(p: Pix, L: Look, hx: number, hy: number, dir: Dir, droop: number, pal: Palette): void {
  const { side, turn: t } = viewOf(dir);
  const f = dir === 'left' ? -1 : 1;
  /** 비스듬하면 돌아선 쪽 귀가 조금 안쪽 · 아래로 (몸이 돈 것처럼) */
  const far = (s: number) => t !== 0 && s === t;
  /** 쫑긋(음수)은 반만: 그림 위로 넘치지 않게 */
  const dy = droop < 0 ? Math.trunc(droop / 2) : droop;
  switch (L.ears) {
    case 'rabbit': {
      const flop = droop >= 2;
      if (side) {
        // 옆모습: 두 귀가 앞뒤로 겹친다 (뒤쪽 귀는 그늘), 처지면 뒤로 눕는다
        const backPal2 = { ...pal, ...mat('GgHhd', shade(pal.H, -0.12)) };
        for (const [o, pp] of [[-2, backPal2], [1, pal]] as [number, Palette][]) {
          if (flop) put(p, EAR_RABBIT_FLOP, hx + f * (o - 1), hy - 5 + 1, pp, f > 0, f > 0);
          else put(p, EAR_RABBIT, hx + f * o, hy - 5 + dy, pp, f < 0);
        }
        break;
      }
      for (const s of [-1, 1]) {
        const x = hx + s * 4 - (far(s) ? t : 0);
        const y = hy - 5 + (far(s) ? 1 : 0);
        if (flop) put(p, EAR_RABBIT_FLOP, x, y + 1, pal, s < 0);
        else put(p, EAR_RABBIT, x, y + dy, pal, s < 0);
      }
      break;
    }
    case 'bear':
      // 곰 귀는 머리 본에 함께 찍혀 있다
      break;
    case 'fox':
    case 'cat': {
      const part = L.ears === 'fox' ? EAR_FOX : EAR_CAT;
      const y0 = hy - 4 + Math.max(0, droop);
      if (side) {
        put(p, part, hx - f * 3, y0, pal, f > 0);
        break;
      }
      for (const s of [-1, 1]) put(p, part, hx + s * 5 - (far(s) ? t : 0), y0 + (far(s) ? 1 : 0), pal, s < 0);
      break;
    }
  }
}

/** 표정: 눈 · 입 · 볼을 머리 본의 닻 자리에 */
function face(p: Pix, L: Look, tpl: ToyHead, head: Placed, F: Frame, side: boolean, mood?: ToyMood): void {
  const E = L.eye;
  const brow = mix(E, L.fur, 0.3);
  const ey = head.y0 + tpl.ey;
  const eyes = F.eyes;
  // 볼 (연분홍)
  const blush = mix(L.inner, L.fur, 0.35);
  for (const c of tpl.cheeks) {
    const x = colOf(head, c, side ? 1 : 2);
    p.rect(x, head.y0 + tpl.cy, side ? 1 : 2, 1, mood === 'angry' ? mix(blush, hex('#e05050'), 0.4) : blush);
  }
  tpl.eyes.forEach((c, i) => {
    const x = colOf(head, c, 2);
    /** 바깥쪽: 앞모습 왼눈은 왼쪽, 오른눈은 오른쪽, 옆모습은 머리 뒤쪽 */
    const out = side ? (head.flip ? 1 : -1) : i === 0 ? -1 : 1;
    const ox = out < 0 ? x - 1 : x + 2;
    if (eyes === 'hurt') {
      // > < 꼭 감은 눈
      const o = out < 0 ? 0 : 1;
      p.set(x + o, ey, E);
      p.set(x + 1 - o, ey + 1, E);
      p.set(x + o, ey + 2, E);
      return;
    }
    if (eyes === 'closed' || mood === 'tear') {
      if (mood === 'smile') {
        // 웃는 눈 ^ ^
        p.rect(x, ey + 1, 2, 1, E);
        p.set(x - 1, ey + 2, E);
        p.set(x + 2, ey + 2, E);
      } else {
        p.rect(x, ey + 2, 2, 1, E);
        p.set(ox, ey + 1, E);
      }
      if (mood === 'tear') {
        p.set(x + (out < 0 ? 0 : 1), ey + 3, TEAR);
        p.set(x + (out < 0 ? 0 : 1), ey + 4, shade(TEAR, 0.3));
      }
      return;
    }
    if (mood === 'surprise') {
      p.rect(x, ey - 1, 2, 4, E);
      p.set(x, ey - 1, SHINE);
      p.set(x + 1, ey + 2, shade(E, 0.3));
      return;
    }
    if (mood === 'sad' || mood === 'angry') {
      // 눈은 아래 두 줄, 눈썹 바느질 한 땀 (슬프면 안쪽이 올라가고, 화나면 안쪽이 내려간다)
      p.rect(x, ey + 1, 2, 2, E);
      p.set(x, ey + 1, SHINE);
      const inner = out < 0 ? x + 1 : x;
      const outer = out < 0 ? x : x + 1;
      const up = mood === 'sad' ? inner : outer;
      const down = mood === 'sad' ? outer : inner;
      p.set(up, ey - 2, brow);
      p.set(down, ey - 1, brow);
      return;
    }
    // 단추 눈: 진한 눈동자 + 왼쪽 위 반짝 + 아래 반사
    p.rect(x, ey, 2, 3, E);
    p.set(x, ey, SHINE);
    p.set(x + 1, ey + 2, shade(E, 0.3));
  });
  // 입
  const [mc, mr] = tpl.mouth;
  const my = head.y0 + mr;
  if (side) {
    const x = colOf(head, mc);
    if (mood === 'smile' || mood === 'surprise') {
      p.set(x, my, MOUTH);
      p.set(x, my + 1, TONGUE);
    } else p.set(x, my, mix(MOUTH, L.fur, 0.35));
    return;
  }
  const x = colOf(head, mc, 2);
  const m = eyes === 'hurt' ? 'angry' : mood;
  switch (m) {
    case 'smile':
      p.rect(x - 1, my, 4, 1, MOUTH);
      p.rect(x, my + 1, 2, 1, TONGUE);
      break;
    case 'sad':
    case 'tear':
      p.rect(x, my, 2, 1, MOUTH);
      p.set(x - 1, my + 1, MOUTH);
      p.set(x + 2, my + 1, MOUTH);
      break;
    case 'surprise':
      p.rect(x, my, 2, 2, MOUTH);
      p.set(x + 1, my + 1, TONGUE);
      break;
    case 'angry':
      p.rect(x - 1, my, 4, 1, MOUTH);
      break;
    default:
      p.rect(x, my, 2, 1, mix(MOUTH, L.fur, 0.25));
  }
}


// ───────────────────────── 손 · 무기 ─────────────────────────

/** 무기를 쥔 손 자리 (그림 안 좌표). behind: 몸 뒤에 있어 무기를 몸보다 먼저 그린다 */
export function heroHand(dir: Dir, pose: Pose): { x: number; y: number; behind: boolean } {
  const F: Frame = { ...F0, ...FRAMES[pose] };
  const { side, back, t, f, by, bodyX } = geo(F, dir);
  if (side) return { x: bodyX + f * 5 + f * F.armF[0], y: by + F.armF[1], behind: false };
  // 앞모습은 그림 왼쪽 손, 뒷모습은 그림 오른쪽 손이 무기 손 (lookSprite 의 팔과 같은 자리)
  const sx = back ? 1 : -1;
  const far = t !== 0 && Math.sign(sx) === t;
  return { x: bodyX + sx * (far ? 6 : ARM_X), y: by - 1 + F.armR - (far ? 1 : 0), behind: back || far };
}

const FACE_ANGLE: Record<Dir, number> = { right: 0, downRight: Math.PI / 4, down: Math.PI / 2, downLeft: (Math.PI * 3) / 4, left: Math.PI, upLeft: (-Math.PI * 3) / 4, up: -Math.PI / 2, upRight: -Math.PI / 4 };

/**
 * 무기 각도 (오른쪽 = 0, 시계 방향). swingT: 휘두르기 진행 0~1, rev: 되돌려 베기.
 * 평소엔 날을 세워 들고, 예비 동작에선 뒤로 젖히고, 휘두르면 바라보는 쪽을 쓸고 지나가며, 마무리는 앞 아래로.
 */
export function weaponAngle(dir: Dir, pose: Pose, kind: WeaponKind, swingT = 1, rev = false): number {
  const a = FACE_ANGLE[dir];
  const { side, back } = viewOf(dir);
  // 무기 손이 그림에서 어느 쪽인가
  const s = side ? (dir === 'left' ? -1 : 1) : back ? 1 : -1;
  const k = rev ? 1 : -1;
  const ranged = kind === 'bow' || kind === 'staff';
  switch (pose) {
    case 'windup':
      return ranged ? a : a + Math.PI * 0.75 * -k;
    case 'attack':
      return ranged ? a : a + Math.PI * 0.75 * -k * (1 - swingT) + 0.4 * k * swingT;
    case 'follow':
      return ranged ? a : a + 0.9 * k;
    default:
      // 활은 평소엔 몸 옆에 세워 든다 (옆을 겨눈 각도 = 활대가 세로)
      if (kind === 'bow') return side ? a : s > 0 ? 0 : Math.PI;
      return -Math.PI / 2 + s * (kind === 'staff' ? 0.35 : 0.5);
  }
}

// ───────────────────────── 무기 ─────────────────────────

export type WeaponKind = 'sword' | 'axe' | 'bow' | 'staff';

/** 오른쪽을 가리키는 무기 그림 (손잡이가 왼쪽 끝) */
export function weaponSprite(kind: WeaponKind): Pix {
  switch (kind) {
    case 'sword': {
      const p = new Pix(20, 7);
      p.rect(0, 3, 4, 2, hex('#7a4a2a'));
      p.rect(4, 1, 2, 6, hex('#e8c040'));
      p.bar(6, 2, 13, 3, hex('#e8eef8'));
      p.set(19, 3, hex('#ffffff'));
      p.line(7, 2, 17, 2, hex('#ffffff'));
      return p.outline();
    }
    case 'axe': {
      const p = new Pix(22, 14);
      p.rect(0, 6, 15, 2, hex('#8a5a32'));
      p.ball(16, 7, 5, 6, hex('#c8d2dc'));
      p.rect(13, 3, 3, 9, hex('#9aa6b2'));
      return p.outline();
    }
    case 'bow': {
      const p = new Pix(10, 22);
      for (let y = 0; y < 22; y++) {
        const x = Math.round(2 + Math.sin((y / 21) * Math.PI) * 5);
        p.set(x, y, hex('#a0642e'));
        p.set(x + 1, y, hex('#c88a4a'));
      }
      p.line(2, 0, 2, 21, hex('#f0f0f0'));
      p.rect(6, 9, 2, 4, hex('#e8414f'));
      return p.outline();
    }
    case 'staff': {
      const p = new Pix(22, 9);
      p.rect(0, 4, 16, 2, hex('#8a5a32'));
      p.ball(18, 4.5, 3.6, 3.6, hex('#ffd84a'));
      p.set(17, 3, hex('#ffffff'));
      return p.outline();
    }
  }
}

export const HERO_POSES: Pose[] = ['idle', 'idle2', 'blink', 'walk1', 'walk2', 'walk3', 'walk4', 'windup', 'attack', 'follow', 'hurt'];
export const HERO_DIRS: Dir[] = ['down', 'up', 'left', 'right', 'downRight', 'downLeft', 'upRight', 'upLeft'];
