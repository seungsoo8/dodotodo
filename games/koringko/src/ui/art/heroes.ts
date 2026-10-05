/** 네 인형 그림: 방향 4 × (서기 3 · 걷기 4 · 공격 3 · 맞기). 동작마다 몸 · 팔 · 다리 · 귀 · 꼬리가 따로 움직인다 */
import type { HeroId } from '../../core/types.ts';
import { Pix, hex, shade, type Color } from './paint.ts';

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
  point: [{ armR: -3, armIn: [0, -3], armF: [4, -2] }, { armR: -3, armIn: [0, -4], armF: [5, -2] }],
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

const SPIN: Dir[] = ['down', 'right', 'up', 'left'];
/** 장난감 몸짓 한 장 (모르는 이름이면 null) */
export function heroActSprite(hero: HeroId, dir: Dir, act: string, frame: number): Pix | null {
  const fr = HERO_ACTS[act];
  if (!fr) return null;
  const k = frame % fr.length;
  if (act === 'spin') dir = SPIN[(Math.max(0, SPIN.indexOf(dir)) + k) % 4];
  return lookSprite(LOOKS[hero], dir, 'idle', fr[k]);
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
  toby: { fur: hex('#f6f0f4'), belly: hex('#ffffff'), inner: hex('#ff9ec7'), outfit: hex('#4a78d8'), trim: hex('#e8414f'), eye: hex('#2a1e2e'), ears: 'rabbit', extra: 'scarf', tail: 'puff' },
  bori: { fur: hex('#b07444'), belly: hex('#e8c08c'), inner: hex('#e8a87c'), outfit: hex('#4f9a52'), trim: hex('#f2c94c'), eye: hex('#24160e'), ears: 'bear', extra: 'overalls', tail: 'stub' },
  ruru: { fur: hex('#f28a2e'), belly: hex('#fff4e2'), inner: hex('#ffcfa8'), outfit: hex('#3e7a4a'), trim: hex('#a8d86a'), eye: hex('#2a1a10'), ears: 'fox', extra: 'hood', tail: 'brush' },
  nabi: { fur: hex('#5a5068'), belly: hex('#d8d0e4'), inner: hex('#ff9ec7'), outfit: hex('#7b4fd0'), trim: hex('#ffd84a'), eye: hex('#1a1424'), ears: 'cat', extra: 'hat', tail: 'thin' },
};

const INK = hex('#1c1424');

/** 무기를 쥔 주먹 (무기 위에 겹쳐 그려 쥐고 있게 보인다) */
export function fistSprite(hero: HeroId): Pix {
  const p = new Pix(8, 8);
  p.ball(4, 4, 2.9, 2.9, LOOKS[hero].fur, true);
  return p.outline();
}

export function heroSprite(hero: HeroId, dir: Dir, pose: Pose): Pix {
  return lookSprite(LOOKS[hero], dir, pose);
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

function lookSprite(L: Look, dir: Dir, pose: Pose, act?: Partial<Frame>): Pix {
  const F: Frame = { ...F0, ...FRAMES[pose], ...act };
  const p = new Pix(HERO_W, HERO_H);
  const { side, back, t, f, cx, by, bodyX, hx, hy } = geo(F, dir);
  const legC = L.extra === 'overalls' ? L.outfit : shade(L.fur, -0.08);
  const legY = LEG_Y;

  // 꼬리 (뒤 · 옆 · 비스듬히 앞에서 보인다)
  if (back || side) tail(p, L, bodyX + (side ? 0 : F.tail - t * 4), by, side ? dir : 'up', F.tail);
  else if (t) tail(p, L, bodyX + t * 2, by, t > 0 ? 'right' : 'left', F.tail);

  // 뒷팔 (옆모습: 몸 뒤로 살짝 보인다)
  if (side) p.ball(bodyX - f * 4 + f * F.armB[0], by - 1 + F.armB[1], 2.7, 2.7, shade(L.fur, -0.2), true);

  // 다리 (짧고 동글동글) + 발바닥 (앞모습에서 밝은 천 조각)
  const foot = (x: number, y: number, c: Color, rx = 3.2) => {
    p.ball(x, y, rx, 2.7, c, true);
    p.rect(Math.round(x - 1), Math.round(y + 1), 2, 1, shade(c, -0.22));
  };
  if (side) {
    foot(cx - f * 2.5 + f * F.back[0], legY + F.back[1], shade(legC, -0.14));
    foot(cx + f * 2.5 + f * F.front[0], legY + F.front[1], legC, 3.4);
  } else {
    foot(CX - 3.6, legY + F.legL, legC);
    foot(CX + 3.6, legY + F.legR, shade(legC, -0.06));
  }

  // 몸통 (천 인형: 둥근 몸 + 배 천 조각 + 바느질 자국)
  p.ball(bodyX, by, BODY_RX + F.squash * 0.4, BODY_RY - F.squash * 0.3, L.outfit, true);
  if (!back && L.extra !== 'hat') {
    const bx0 = bodyX + (side ? f * 1.5 : t * 1.5);
    p.oval(bx0, by + 1, 4.2 - Math.abs(t) * 0.6 - (side ? 1 : 0), 3.8, L.belly);
    // 배 천 조각 둘레 바느질 (점선)
    for (let a = 0; a < 12; a += 2) {
      const ang = (a / 12) * Math.PI * 2;
      p.set(Math.round(bx0 + Math.cos(ang) * 3.4), Math.round(by + 1 + Math.sin(ang) * 3), shade(L.belly, -0.18));
    }
  }
  if (back) p.line(bodyX, by - 4, bodyX, by + 4, shade(L.outfit, -0.22));
  if (L.extra === 'overalls' && !back) {
    // 멜빵 · 단추 · 앞주머니
    p.rect(bodyX - 5 + t, by - 5, 1, 5, L.trim);
    p.rect(bodyX + 4 + t, by - 5, 1, 5, L.trim);
    p.set(bodyX - 5 + t, by, shade(L.trim, 0.35));
    p.set(bodyX + 4 + t, by, shade(L.trim, 0.35));
    p.rect(bodyX - 2 + t, by + 2, 4, 2, shade(L.outfit, -0.15));
    p.rect(bodyX - 2 + t, by + 2, 4, 1, shade(L.outfit, -0.3));
  }
  if (L.extra === 'apron' && !back) {
    const ap = L.outfit === hex('#ffffff') ? hex('#ffcf7a') : hex('#f8f4ec');
    p.rect(bodyX - 4 + (side ? 1 : 0), by - 3, 8, 8, ap);
    p.rect(bodyX - 4 + (side ? 1 : 0), by - 3, 8, 1, shade(ap, -0.2));
    p.rect(bodyX - 2 + (side ? 1 : 0), by + 2, 4, 2, shade(ap, -0.1));
    p.set(bodyX + (side ? 1 : 0), by + 1, L.trim);
  }
  if (L.extra === 'hat') {
    // 망토 (아래 자락 주름)
    p.ball(bodyX, by + 1, BODY_RX + 1, BODY_RY - 0.4, shade(L.outfit, -0.12), true);
    for (let x = -6; x <= 6; x += 3) p.set(bodyX + x, by + 5, shade(L.outfit, -0.35));
    if (!back) {
      p.rect(bodyX - 1, by - 5, 2, 8, L.trim);
      p.set(bodyX - 1, by - 5, shade(L.trim, 0.4));
    }
  }

  // 팔 (머리 높이까지 든 팔은 머리를 그린 뒤 한 번 더: 머리에 가리지 않게)
  const raised: (() => void)[] = [];
  const paw = (x: number, y: number, c: Color) => {
    // 뻗은 팔도 그림 테두리 안쪽에 (외곽선 한 칸 남기고)
    x = Math.max(4.4, Math.min(HERO_W - 4.4, x));
    p.ball(x, y, 2.8, 3, c, true);
    p.set(Math.round(x), Math.round(y + 2), shade(c, -0.2));
  };
  if (side) {
    const front = () => paw(bodyX + f * 5 + f * F.armF[0], by + F.armF[1], L.fur);
    front();
    if (F.armF[1] <= -4) raised.push(front);
  } else {
    // 앞모습: 오른손(그림 왼쪽)이 무기 손. 비스듬하면 돌아선 쪽 팔은 몸 뒤로 조금 숨는다
    const weaponL = !back;
    const arm = (sideX: number, dy: number) => {
      const far = t !== 0 && Math.sign(sideX) === t;
      const inward = sideX < 0 ? F.armIn[0] : F.armIn[1];
      const draw = () => paw(bodyX + sideX * ((far ? 6 : ARM_X) - inward), by - 1 + dy - (far ? 1 : 0), far ? shade(L.fur, -0.15) : L.fur);
      draw();
      if (dy <= -4 && !back) raised.push(draw);
    };
    arm(-1, weaponL ? F.armR : F.armL);
    arm(1, weaponL ? F.armL : F.armR);
  }

  // 머리
  ears(p, L, hx, hy, dir, F.ear);
  p.ball(hx, hy, HEAD_RX, HEAD_RY, L.fur, true);
  // 머리 가운데 바느질 (천 인형): 정수리에서 이마로
  if (!side) for (let y = Math.round(hy - HEAD_RY + 1); y < hy - (back ? -3 : 4); y += 2) p.set(hx + (back ? 0 : t * 2), y, shade(L.fur, -0.14));
  // 주둥이 (곰 · 여우)
  if (!back && (L.ears === 'bear' || L.ears === 'fox')) {
    const sx = side ? hx + f * 5 : hx + t * 2;
    p.ball(sx, hy + 4, side ? 3.6 : 4, 2.8, L.belly, true);
    p.rect(sx - 1 + (side ? (f > 0 ? 2 : -1) : t), hy + 2, 2, 1, INK);
    p.set(sx + (side ? (f > 0 ? 2 : -1) : t), hy + 2, shade(INK, 0.4));
    if (!side) p.set(sx, hy + 3, shade(L.belly, -0.3));
  }
  if (!back) face(p, L, hx, hy, dir, F.eyes);
  else if (t) {
    // 비스듬한 뒷모습: 돌아선 쪽으로 주둥이 · 볼이 살짝 비친다
    if (L.ears === 'bear' || L.ears === 'fox') p.ball(hx + t * 8, hy + 3, 2.2, 2, L.belly, true);
    else p.set(hx + t * 9, hy + 3, shade(L.inner, 0.15));
  }
  if (L.extra === 'scarf') {
    // 목도리: 줄무늬 + 매듭 끝이 걸음 · 공격에 따라 펄럭인다
    const sy = hy + 7 - F.squash;
    p.rect(bodyX - 7, sy, 14, 3, L.trim);
    p.rect(bodyX - 7, sy + 2, 14, 1, shade(L.trim, -0.25));
    for (let x = -6; x <= 6; x += 3) p.set(bodyX + x, sy + 1, shade(L.trim, 0.3));
    const flap = side ? -f * (F.bob < 0 || F.lean > 0 ? 2 : 0) : -t * (F.bob < 0 ? 1 : 0);
    if (!side || dir === 'left') {
      const kx = bodyX + (back ? -4 : 3) + t + flap;
      p.rect(kx, sy + 3, 3, 5, shade(L.trim, -0.08));
      p.rect(kx, sy + 7, 3, 1, shade(L.trim, 0.3));
    } else {
      p.rect(bodyX - 6 + flap, sy + 3, 3, 4, shade(L.trim, -0.08));
      p.rect(bodyX - 6 + flap, sy + 6, 3, 1, shade(L.trim, 0.3));
    }
  }
  if (L.extra === 'hood') {
    // 초록 망토 깃 + 둥근 단추
    p.rect(bodyX - 7, hy + 7, 14, 2, L.outfit);
    p.rect(bodyX - 7, hy + 8, 14, 1, shade(L.outfit, -0.2));
    if (!back) {
      p.rect(bodyX - 1 + t, hy + 8, 3, 2, L.trim);
      p.set(bodyX + t, hy + 8, shade(L.trim, 0.4));
    }
  }
  if (L.extra === 'hat') hat(p, L, hx, hy, dir, F.lean, Math.max(0, -F.bob - 1));
  for (const d of raised) d();
  if (F.shakeX) return new Pix(HERO_W, HERO_H).stamp(p, F.shakeX, 0).outline();
  return p.outline();
}

function ears(p: Pix, L: Look, hx: number, hy: number, dir: Dir, droop = 0): void {
  const { side, back, turn: t } = viewOf(dir);
  const f = dir === 'left' ? -1 : 1;
  // 비스듬하면 돌아선 쪽 귀가 조금 안쪽 · 아래로 (몸이 돈 것처럼)
  const farX = (x: number) => (t !== 0 && Math.sign(x - hx) === t ? -t : 0);
  const farY = (x: number) => (t !== 0 && Math.sign(x - hx) === t ? 1 : 0);
  switch (L.ears) {
    case 'rabbit': {
      const pairs = side ? [hx - f * 2, hx + f * 1] : [hx - 4.5, hx + 4.5];
      for (const [i, x0] of pairs.entries()) {
        const x = x0 + (side ? 0 : farX(x0));
        const dy = side ? 0 : farY(x0);
        // 처지면 끝이 바깥(옆모습은 뒤)으로 눕는다
        const tilt = (side ? -f : i === 0 ? -1 : 1) * (1 + Math.max(0, droop) * 0.8);
        const ry = 5.6 - Math.max(0, droop) * 0.6;
        /** 쫑긋(음수)은 반만: 그림 위로 넘치지 않게 */
        const ear = droop < 0 ? droop * 0.5 : droop;
        p.ball(x + tilt, hy - 9.6 + ear + dy, 2.7, ry, L.fur, true);
        if (!back) {
          p.oval(x + tilt, hy - 8.8 + ear + dy, 1.1, ry - 1.8, L.inner);
          p.set(Math.round(x + tilt), Math.round(hy - 6 + ear + dy), shade(L.inner, -0.15));
        }
      }
      break;
    }
    case 'bear':
      for (const x0 of side ? [hx - f * 3] : [hx - 7, hx + 7]) {
        const x = x0 + (side ? 0 : farX(x0));
        const y = hy - 7.8 + Math.max(0, droop) * 0.5 + (side ? 0 : farY(x0));
        p.ball(x, y, 3.6, 3.4, L.fur, true);
        if (!back) {
          p.oval(x, y + 0.4, 1.8, 1.6, L.inner);
          p.set(Math.round(x), Math.round(y + 1), shade(L.inner, -0.18));
        }
      }
      break;
    case 'fox':
    case 'cat': {
      const big = L.ears === 'fox' ? 1 : 0;
      const xs = side ? [hx - f * 3] : [hx - 5.5, hx + 5.5];
      for (const [i, x0] of xs.entries()) {
        const x = x0 + (side ? 0 : farX(x0));
        const o = side ? -f : i === 0 ? -1 : 1;
        const tip = o * (1.5 + Math.max(0, droop));
        const top = hy - 12 - big + Math.max(0, droop) + (side ? 0 : farY(x0));
        p.tri(x - 3.5, hy - 4, x + 3.5, hy - 4, x + tip, top, L.fur);
        if (!back) p.tri(x - 1.8, hy - 4, x + 1.8, hy - 4, x + tip * 0.7, top + 3, L.inner);
        if (L.ears === 'fox') {
          p.set(x + tip, top, INK);
          p.set(x + tip * 0.9, top + 1, shade(L.fur, -0.4));
        }
      }
      break;
    }
  }
}

function face(p: Pix, L: Look, hx: number, hy: number, dir: Dir, eyes: Frame['eyes'] = 'open'): void {
  const snout = L.ears === 'bear' || L.ears === 'fox';
  // 단추 눈: 진한 눈동자 + 위쪽 반짝 + 아래 반사
  const eye = (x: number, y: number, right = false) => {
    const yy = snout ? y - 2 : y - 1;
    if (eyes === 'closed') {
      p.rect(x, yy + 2, 2, 1, L.eye);
      p.set(right ? x + 2 : x - 1, yy + 1, L.eye);
      return;
    }
    if (eyes === 'hurt') {
      // > < 꼭 감은 눈
      const o = right ? 1 : 0;
      p.set(x + o, yy, L.eye);
      p.set(x + 1 - o, yy + 1, L.eye);
      p.set(x + o, yy + 2, L.eye);
      return;
    }
    p.rect(x, yy, 2, 4, L.eye);
    p.set(x, yy, hex('#ffffff'));
    p.set(x + 1, yy + 3, shade(L.eye, 0.3));
  };
  const t = viewOf(dir).turn;
  if (dir === 'down' || dir === 'downRight' || dir === 'downLeft') {
    // 비스듬하면 얼굴이 그쪽으로 돈다: 눈 · 코가 옆으로, 먼 쪽 볼은 가려진다
    hx += t * 2;
    eye(hx - 5 + (t < 0 ? 1 : 0), hy);
    eye(hx + 3 - (t > 0 ? 1 : 0), hy, true);
    if (eyes === 'hurt') {
      // 앙 다문 입
      p.rect(hx - 1, hy + 5, 3, 1, L.eye);
    }
    if (t >= 0) p.oval(hx - 6.5, hy + 3.5, 1.8, 1, shade(L.inner, 0.15));
    if (t <= 0) p.oval(hx + 6.5, hy + 3.5, 1.8, 1, shade(L.inner, 0.15));
    if (L.ears !== 'bear' && L.ears !== 'fox') {
      p.rect(hx, hy + 2, 1, 1, L.inner);
      p.set(hx, hy + 3, shade(L.eye, 0.2));
      p.set(hx - 1, hy + 4, L.eye);
      p.set(hx + 1, hy + 4, L.eye);
    }
    if (L.ears === 'cat') {
      if (t <= 0) {
        p.line(hx + 7, hy + 2, hx + 10, hy + 1, shade(L.belly, -0.3));
        p.line(hx + 7, hy + 4, hx + 10, hy + 4, shade(L.belly, -0.3));
      }
      if (t >= 0) {
        p.line(hx - 10, hy + 1, hx - 7, hy + 2, shade(L.belly, -0.3));
        p.line(hx - 10, hy + 4, hx - 7, hy + 4, shade(L.belly, -0.3));
      }
    }
  } else {
    const f = dir === 'right' ? 1 : -1;
    eye(hx + f * 4 - (f < 0 ? 1 : 0), hy, f < 0);
    p.oval(hx + f * 6, hy + 4, 1.6, 1, shade(L.inner, 0.15));
    if (!snout) p.set(hx + f * 9, hy + 2, L.inner);
  }
}

function tail(p: Pix, L: Look, cx: number, by: number, dir: Dir, swing = 0): void {
  const f = dir === 'right' ? -1 : dir === 'left' ? 1 : 0;
  const tx = cx + f * 7.5;
  const ty = by + (dir === 'up' ? 2 : 1) - (f !== 0 ? swing : 0);
  switch (L.tail) {
    case 'puff':
      p.ball(tx, ty, 3, 2.8, hex('#ffffff'), true);
      p.set(tx - 1, ty - 1, hex('#ffffff'));
      break;
    case 'stub':
      p.ball(tx, ty, 2.4, 2.2, L.fur, true);
      break;
    case 'brush':
      p.ball(tx + f, ty - 2, 4, 6, L.fur, true);
      p.ball(tx + f * 2, ty - 6.5, 2.6, 2.2, L.belly, true);
      p.set(tx + f, ty, shade(L.fur, -0.25));
      break;
    case 'thin':
      p.line(tx, ty, tx + f * 3, ty - 7, L.fur);
      p.line(tx + 1, ty, tx + f * 3 + 1, ty - 7, shade(L.fur, -0.15));
      p.set(tx + f * 3, ty - 8, L.trim);
      break;
  }
}

/** flop: 뛰어오르면 모자 끝이 눌린다 (칸) */
function hat(p: Pix, L: Look, hx: number, hy: number, dir: Dir, sway = 0, flop = 0): void {
  // 커다란 마법사 모자 (별 장식 · 띠). 몸이 기울면 끝이 반대로 휜다
  const f = dir === 'left' ? -1 : 1;
  const t = viewOf(dir).turn;
  const lean = (dir === 'left' ? -2 : dir === 'right' ? 2 : t ? t * 2 : 1) - Math.sign(sway) * f;
  p.oval(hx, hy - 5, 10, 2.6, shade(L.outfit, -0.1));
  p.oval(hx, hy - 5.5, 9, 1.4, shade(L.outfit, -0.28));
  p.tri(hx - 6.5, hy - 5, hx + 6.5, hy - 5, hx + lean * 2.5 + flop, hy - 14 + flop, L.outfit);
  p.tri(hx - 4.5, hy - 6, hx - 1.5, hy - 6, hx + lean * 1.8 + flop, hy - 12.5 + flop, shade(L.outfit, 0.25));
  p.rect(hx - 6, hy - 8, 12, 2, L.trim);
  p.rect(hx - 6, hy - 7, 12, 1, shade(L.trim, -0.2));
  p.set(Math.round(hx + lean * 2.5 + flop), Math.round(hy - 13.5 + flop), L.trim);
  if (!viewOf(dir).back) {
    p.set(hx + 2, hy - 12, L.trim);
    p.set(hx + 1, hy - 11, L.trim);
    p.set(hx + 3, hy - 11, L.trim);
    p.set(hx + 2, hy - 10, L.trim);
    p.set(hx + 2, hy - 11, shade(L.trim, 0.5));
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
