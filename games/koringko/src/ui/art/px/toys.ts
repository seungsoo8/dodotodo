/**
 * 장난감 인형 손찍기 본 (토비 · 보리 · 루루 · 나비 · 마을 인형): 머리 · 몸 · 손발 · 귀 · 꼬리 · 옷 조각.
 * heroes.ts 가 뼈대(geo) 자리마다 이 조각들을 찍어 한 장(32×40)으로 합성한다.
 *
 * 글자 (팔레트는 heroes.ts 의 toyPal 이 인형마다 칠한다):
 *   .  투명 · # 외곽선(이웃 색을 어둡게)
 *   G g H h d  털: 반짝 · 밝음 · 바탕 · 그늘 · 깊은 그늘(바느질 · 틈)
 *   V B b      배 · 주둥이 천: 밝음 · 바탕 · 그늘
 *   P p        귓속 · 코 분홍: 바탕 · 그늘
 *   n          코 · 귀끝 먹색
 *   K C c q    옷: 밝음 · 바탕 · 그늘 · 깊은 그늘
 *   Y A a      장식(목도리 · 멜빵 · 별): 밝음 · 바탕 · 그늘
 * 눈 · 입 · 볼은 표정마다 달라서 칠하지 않고 닻(eyes · ey · mouth · cheeks)만 적는다.
 * 옆모습은 오른쪽을 보는 것만 그리고 왼쪽은 뒤집는다. 앞 · 뒤 본의 가운데 선은 ax 열의 왼쪽 경계.
 */
import type { Grid } from './grid.ts';

/** 머리 본: 닻 (ax, ay) 칸이 머리 가운데 자리 (hx, hy) 에 온다 */
export interface ToyHead {
  g: Grid;
  ax: number;
  ay: number;
  /** 눈 왼쪽 열들 (앞 둘 · 옆 하나 · 뒤 없음) · 눈 윗줄 */
  eyes: number[];
  ey: number;
  /** 입 왼칸 [열, 줄] (옆모습은 한 칸) */
  mouth: [number, number];
  /** 볼 왼칸 열들 · 줄 */
  cheeks: number[];
  cy: number;
}
export interface ToyPart {
  g: Grid;
  ax: number;
  ay: number;
}
export type HeadSet = { down: ToyHead; q: ToyHead; right: ToyHead; up: ToyHead };

// ───────────────────────── 토끼 (토비 · 촌장 · 재봉사): 찹쌀떡처럼 둥근 머리, 정수리 바느질 ─────────────────────────
const RABBIT: HeadSet = {
  down: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHhHHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHhHHHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHhHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHPPHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHhhh',
      '.HHHHHHHHHHHHHHHHhh.',
      '.hHHHHHHHHHHHHHHhhh.',
      '..hhHHHHHHHHHHhhhd..',
      '....dhhhhhhhhhhdd...',
    ],
    ax: 10, ay: 8, eyes: [5, 13], ey: 7, mouth: [9, 11], cheeks: [3, 15], cy: 10,
  },
  q: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHHhHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHHHhHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHHHhHHHHHh.',
      'gHHHHHHHHHHHHHHHHHHh',
      'gHHHHHHHHHHHHHHHHHHh',
      'gHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHPPHHHHHHh',
      'HHHHHHHHHHHHHHHHHHhh',
      '.HHHHHHHHHHHHHHHHHh.',
      '.hHHHHHHHHHHHHHHHhh.',
      '..hhHHHHHHHHHHHhhd..',
      '....dhhhhhhhhhhdd...',
    ],
    ax: 10, ay: 8, eyes: [7, 14], ey: 7, mouth: [11, 11], cheeks: [5], cy: 10,
  },
  right: {
    g: [
      '.....gggHHHHH.......',
      '...ggGGgHHHHHHH.....',
      '..gGGgHHHHHHHHHH....',
      '.gGgHHHHHHHHHHHHH...',
      '.gHHHHHHHHHHHHHHHH..',
      'gHHHHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHhP',
      'HHHHHHHHHHHHHHHHHHh.',
      '.HHHHHHHHHHHHHHHHhh.',
      '.hHHHHHHHHHHHHHHhh..',
      '..hhHHHHHHHHHHhhh...',
      '...dhhhhhhhhhhhd....',
      '.....dddddddddd.....',
    ],
    ax: 10, ay: 8, eyes: [14], ey: 7, mouth: [17, 11], cheeks: [15], cy: 10,
  },
  up: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHhHHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHhHHHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHhHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHhhh',
      'HhHHHHHHHHhHHHHHHhhh',
      '.hHHHHHHHHHHHHHHhhh.',
      '.hhHHHHHHHHHHHHhhhh.',
      '..hhhhHHHHHHhhhhhd..',
      '....dhhhhhhhhhhdd...',
    ],
    ax: 10, ay: 8, eyes: [], ey: 7, mouth: [9, 11], cheeks: [], cy: 10,
  },
};

// ───────────────────────── 곰 (보리 · 가게 · 대장간 · 두더지): 넓적한 머리 + 둥근 귀 + 주둥이 ─────────────────────────
const BEAR: HeadSet = {
  down: {
    g: [
      '.ggHh..........gHHh.',
      'gGPPHh........gPPHhh',
      'gHPpHhgggHHHHHgPpHhh',
      '.HHHgGGgHHhHHHHHHHh.',
      '.gGgHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHhHHHHHHHhh',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHVBBBBBBHHHHHhh',
      'HHHHHVBBnnBBBbHHHHhh',
      'HHHHHBBBBBBBBbHHHhhh',
      '.HHHHbBBBBBBbbHHHhh.',
      '.hHHHHbbbbbbbHHHhhh.',
      '..hhHHHHHHHHHHhhhd..',
      '....dhhhhhhhhhhdd...',
    ],
    ax: 10, ay: 11, eyes: [5, 13], ey: 8, mouth: [9, 14], cheeks: [3, 15], cy: 12,
  },
  q: {
    g: [
      '.ggHh...............',
      'gGPPHh.........gHHh.',
      'gHPpHhgggHHHHHgPPHhh',
      '.HHHgGGgHHHHhHgPpHh.',
      '.gGgHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHHHhHHHHHhh',
      'gHHHHHHHHHHHHHHHHHHh',
      'gHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHVBBBBBBHHHHh',
      'HHHHHHHVBBBnnBBbHHhh',
      'HHHHHHHBBBBBBBBbHHhh',
      '.HHHHHHbBBBBBBbbHHh.',
      '.hHHHHHHbbbbbbbHHhh.',
      '..hhHHHHHHHHHHHhhd..',
      '....dhhhhhhhhhhdd...',
    ],
    ax: 10, ay: 11, eyes: [7, 14], ey: 8, mouth: [11, 14], cheeks: [5], cy: 12,
  },
  right: {
    g: [
      '....gHHh............',
      '...gGPPHh...........',
      '...gHPpHhgHHHH......',
      '....HHHgGGgHHHHHH...',
      '..ggGgHHHHHHHHHHHH..',
      '.gGHHHHHHHHHHHHHHHh.',
      '.gHHHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHHh',
      'gHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHVBBBBn.',
      'HHHHHHHHHHHHVBBBBBBn',
      'hHHHHHHHHHHHBBBBBBb.',
      '.hHHHHHHHHHHbBBBBb..',
      '.hhHHHHHHHHHHbbbb...',
      '..hhHHHHHHHHHhh.....',
      '....dhhhhhhhhd......',
    ],
    ax: 10, ay: 11, eyes: [14], ey: 8, mouth: [17, 14], cheeks: [11], cy: 12,
  },
  up: {
    g: [
      '.ggHh..........gHHh.',
      'gGHHHh........gHHHhh',
      'gHHHHhgggHHHHHgHHHhh',
      '.HHHgGGgHHhHHHHHHHh.',
      '.gGgHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHhHHHHHHHhh',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHhhh',
      'HhHHHHHHHHhHHHHHHhhh',
      '.hHHHHHHHHHHHHHHhhh.',
      '.hhHHHHHHHHHHHHhhhh.',
      '..hhhhHHHHHHhhhhhd..',
      '....dhhhhhhhhhhdd...',
    ],
    ax: 10, ay: 11, eyes: [], ey: 8, mouth: [9, 14], cheeks: [], cy: 12,
  },
};

// ───────────────────────── 여우 (루루 · 빵집): 볼 갈기가 뾰족, 흰 주둥이 ─────────────────────────
const FOX: HeadSet = {
  down: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHhHHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHhHHHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHhHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHVBBVHHHHHHhh',
      'VHHHHHHVBnnBBHHHHHhB',
      'VBHHHHVBBBBBBBHHHhBb',
      'VBBHHHBBBBBBBBBHhBBb',
      '.VBBBhBBBBBBBBBbBBb.',
      '..VBb.bBBBBBBBbb.bb.',
      '......bbbbbbbb......',
    ],
    ax: 10, ay: 8, eyes: [5, 13], ey: 6, mouth: [9, 12], cheeks: [3, 15], cy: 9,
  },
  q: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHHhHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHHHhHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHHHhHHHHHh.',
      'gHHHHHHHHHHHHHHHHHHh',
      'gHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHVBBVHHHHHh',
      'VHHHHHHHHVBnnBBHHHHB',
      'VBHHHHHHVBBBBBBBHHBb',
      'VBBHHHHBBBBBBBBBBhBb',
      '.VBBBHhBBBBBBBBBBbb.',
      '..VBb..bBBBBBBBbb...',
      '.......bbbbbbbb.....',
    ],
    ax: 10, ay: 8, eyes: [7, 14], ey: 6, mouth: [11, 12], cheeks: [5], cy: 9,
  },
  right: {
    g: [
      '.....gggHHHH........',
      '...ggGGgHHHHHH......',
      '..gGGgHHHHHHHHH.....',
      '.gGgHHHHHHHHHHHH....',
      '.gHHHHHHHHHHHHHHH...',
      'gHHHHHHHHHHHHHHHHh..',
      'gHHHHHHHHHHHHHHHHh..',
      'HHHHHHHHHHHHHHHHHHh.',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHn',
      'HHHHHHHHHHHHVBBBBBb.',
      'hHHHHHHHHHVBBBBBbb..',
      '.hHHHHHHHVBBBbbb....',
      '..hhHHHhVBBbb.......',
      '...hhhhVBBb.........',
      '.....dbbbb..........',
    ],
    ax: 10, ay: 8, eyes: [13], ey: 6, mouth: [16, 11], cheeks: [11], cy: 9,
  },
  up: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHhHHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHhHHHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHhHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHhHHHHHHHhh',
      'VHHHHHHHHHHHHHHHHHhB',
      'VBHHHHHHHHhHHHHHHhBb',
      'VBBhHHHHHHHHHHHhhBBb',
      '.VBbhhHHHHHHHhhhbBb.',
      '..Vb.hhhhhhhhhh..b..',
      '.....dhhhhhhhhd.....',
    ],
    ax: 10, ay: 8, eyes: [], ey: 6, mouth: [9, 12], cheeks: [], cy: 9,
  },
};

// ───────────────────────── 고양이 (나비 · 틈새지기): 볼털이 아래로 삐죽, 작은 흰 주둥이 ─────────────────────────
const CAT: HeadSet = {
  down: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHhHHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHhHHHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHhHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHPPHHHHHHHhh',
      'gHHHHHHVBBBBbHHHHHhh',
      'HgHHHHHHBBBbHHHHHhhh',
      'HHhHHHHHHHHHHHHHhhhh',
      '.hhhhHHHHHHHHHhhhhd.',
      'h...dhhhhhhhhhhd...d',
    ],
    ax: 10, ay: 8, eyes: [5, 13], ey: 7, mouth: [9, 11], cheeks: [3, 15], cy: 10,
  },
  q: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHHhHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHHHhHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHHHhHHHHHh.',
      'gHHHHHHHHHHHHHHHHHHh',
      'gHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHPPHHHHHHh',
      'gHHHHHHHHVBBBBbHHHhh',
      'HgHHHHHHHHBBBbHHHHhh',
      'HHhHHHHHHHHHHHHHHhhh',
      '.hhhhHHHHHHHHHHhhhd.',
      'h...dhhhhhhhhhhhdd..',
    ],
    ax: 10, ay: 8, eyes: [7, 14], ey: 7, mouth: [11, 11], cheeks: [5], cy: 10,
  },
  right: {
    g: [
      '.....gggHHHHH.......',
      '...ggGGgHHHHHHH.....',
      '..gGGgHHHHHHHHHH....',
      '.gGgHHHHHHHHHHHHH...',
      '.gHHHHHHHHHHHHHHHH..',
      'gHHHHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHHHHh',
      'HHHHHHHHHHHHHHHHVBBP',
      'HHHHHHHHHHHHHHHVBBb.',
      'gHHHHHHHHHHHHHHHbbh.',
      'HgHHHHHHHHHHHHHHhh..',
      'HHhhHHHHHHHHHHhhh...',
      '.hh.dhhhhhhhhhhd....',
      'h.....ddddddddd.....',
    ],
    ax: 10, ay: 8, eyes: [14], ey: 7, mouth: [17, 11], cheeks: [14], cy: 10,
  },
  up: {
    g: [
      '......gggHHHHH......',
      '....ggGGgHhHHHHH....',
      '...gGGgHHHHHHHHHh...',
      '..gGgHHHHHhHHHHHHh..',
      '.ggHHHHHHHHHHHHHHhh.',
      '.gHHHHHHHHhHHHHHHHh.',
      'gHHHHHHHHHHHHHHHHHhh',
      'gHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHHhh',
      'HHHHHHHHHHhHHHHHHHhh',
      'HHHHHHHHHHHHHHHHHhhh',
      'gHHHHHHHHHhHHHHHHhhh',
      'HgHHHHHHHHHHHHHHhhhh',
      'HHhhHHHHHHHHHHHhhhhh',
      '.hhhhhHHHHHHhhhhhhd.',
      'h...dhhhhhhhhhhd...d',
    ],
    ax: 10, ay: 8, eyes: [], ey: 7, mouth: [9, 11], cheeks: [], cy: 10,
  },
};

export const TOY_HEADS: Record<'rabbit' | 'bear' | 'fox' | 'cat', HeadSet> = { rabbit: RABBIT, bear: BEAR, fox: FOX, cat: CAT };

/** 비스듬한 뒷모습에서 돌아선 쪽으로 살짝 비치는 주둥이 · 볼 (오른쪽으로 돌았을 때, 왼쪽은 뒤집는다) */
export const PEEK_SNOUT: ToyPart = { g: ['.VB', 'VBb', '.b.'], ax: 1, ay: 1 };
export const PEEK_CHEEK: ToyPart = { g: ['P', 'p'], ax: 0, ay: 0 };

// ───────────────────────── 귀 ─────────────────────────

/** 토끼 귀: 선 귀 (닻 = 귀뿌리 가운데 아래) */
export const EAR_RABBIT: ToyPart = {
  g: [
    '.gHh.',
    'gGHHh',
    'gHPHh',
    'gHPHh',
    'HHPHh',
    'HHPph',
    'HHPph',
    'HHPph',
    'HHPph',
    'hHHhh',
    '.hhd.',
  ],
  ax: 2,
  ay: 10,
};
/** 처진 토끼 귀 (오른쪽 귀: 바깥으로 눕는다. 왼쪽은 뒤집기) */
export const EAR_RABBIT_FLOP: ToyPart = {
  g: [
    '.....ggh',
    '....gGHh',
    '...gHPHh',
    '..gHPPh.',
    '.gHPPh..',
    'gHPph...',
    'HHPh....',
    'hHHh....',
    '.hd.....',
  ],
  ax: 2,
  ay: 8,
};
/** 여우 귀 (오른쪽 귀: 끝이 바깥으로, 귀끝 먹색) */
export const EAR_FOX: ToyPart = {
  g: [
    '.....n.',
    '....nH.',
    '...gHh.',
    '..gPHh.',
    '.gPPHh.',
    'gHPPPhh',
    'gHPpPhh',
    'HHHHHhh',
  ],
  ax: 3,
  ay: 7,
};
/** 고양이 귀 (오른쪽 귀) */
export const EAR_CAT: ToyPart = {
  g: [
    '....g..',
    '...gHh.',
    '..gPHh.',
    '.gPPHh.',
    'gHPpPhh',
    'HHHHHhh',
  ],
  ax: 3,
  ay: 5,
};

// ───────────────────────── 몸통 (천 인형: 둥근 몸 + 배 천 조각 + 바느질) ─────────────────────────

export type BodySet = { down: ToyPart; q: ToyPart; right: ToyPart; up: ToyPart };

export const BODY_DOLL: BodySet = {
  down: {
    g: [
      '....KKKCCCCc....',
      '..KKCCCCCCCCcc..',
      '.KKCCCCCCCCCCCc.',
      '.KCCVBbBBbBBCCc.',
      'KCCCBBBBBBBBCCcc',
      'KCCbBBBBBBBBbCcc',
      'KCCCBBBBBBBBCCcc',
      'CCCbBBBBBBBBbCcc',
      'CCCCbBbBBbBbCccc',
      '.CCCCCCCCCCCCcc.',
      '.cCCCCCCCCCCccq.',
      '..qccccccccccq..',
    ],
    ax: 8,
    ay: 6,
  },
  q: {
    g: [
      '....KKKCCCCc....',
      '..KKCCCCCCCCcc..',
      '.KKCCCCCCCCCCCc.',
      '.KCCCCVBbBBbBBc.',
      'KCCCCCBBBBBBBBcc',
      'KCCCCbBBBBBBBBbc',
      'KCCCCCBBBBBBBBcc',
      'CCCCCbBBBBBBBBbc',
      'CCCCCCbBbBBbBbcc',
      '.CCCCCCCCCCCCcc.',
      '.cCCCCCCCCCCccq.',
      '..qccccccccccq..',
    ],
    ax: 8,
    ay: 6,
  },
  right: {
    g: [
      '....KKKCCCc.....',
      '..KKCCCCCCCcc...',
      '.KKCCCCCCCCCCc..',
      '.KCCCCCCVBbBBc..',
      'KCCCCCCCBBBBBbc.',
      'KCCCCCCbBBBBBBc.',
      'KCCCCCCCBBBBBbc.',
      'CCCCCCCbBBBBBBc.',
      'CCCCCCCCbBbBbcc.',
      '.CCCCCCCCCCCcc..',
      '.cCCCCCCCCCccq..',
      '..qcccccccccq...',
    ],
    ax: 8,
    ay: 6,
  },
  up: {
    g: [
      '....KKKCCCCc....',
      '..KKCCCCCCCCcc..',
      '.KKCCCCcCCCCCCc.',
      '.KCCCCCCCCCCCCc.',
      'KCCCCCCcCCCCCCcc',
      'KCCCCCCCCCCCCCcc',
      'KCCCCCCcCCCCCCcc',
      'CCCCCCCCCCCCCccc',
      'CCCCCCCcCCCCCccc',
      '.CCCCCCCCCCCCcc.',
      '.cCCCCCCCCCCccq.',
      '..qccccccccccq..',
    ],
    ax: 8,
    ay: 6,
  },
};

/** 나비의 마법사 망토: 아래로 퍼지는 종 모양, 가운데 별빛 띠, 자락 주름 */
export const BODY_ROBE: BodySet = {
  down: {
    g: [
      '.....KKCCCCc......',
      '...KKCCCYACCcc....',
      '..KKCCCCAaCCCcc...',
      '..KCCCCCAaCCCCc...',
      '.KCCCCCCAaCCCCcc..',
      '.KCCCCCCYaCCCCcc..',
      '.KCCCCCCAaCCCCccc.',
      'KCCCCCCCAaCCCCCcc.',
      'KCCCCCCCAaCCCCCccc',
      'KCCqCCCqAaCqCCCqcc',
      'CCqcCCCqAaCqCCqccq',
      '.qq.qqq.qq.qqq.qq.',
    ],
    ax: 9,
    ay: 6,
  },
  q: {
    g: [
      '.....KKCCCCc......',
      '...KKCCCCCYAcc....',
      '..KKCCCCCCAaCcc...',
      '..KCCCCCCCAaCCc...',
      '.KCCCCCCCCAaCCcc..',
      '.KCCCCCCCCYaCCcc..',
      '.KCCCCCCCCAaCCccc.',
      'KCCCCCCCCCAaCCCcc.',
      'KCCCCCCCCCAaCCCccc',
      'KCCqCCCqCCAaCqCqcc',
      'CCqcCCCqCCAaCqcccq',
      '.qq.qqq.qqqq.qq.q.',
    ],
    ax: 9,
    ay: 6,
  },
  right: {
    g: [
      '....KKCCCCc.......',
      '..KKCCCCCYAc......',
      '.KKCCCCCCAac......',
      '.KCCCCCCCAacc.....',
      '.KCCCCCCCCAac.....',
      'KCCCCCCCCCYacc....',
      'KCCCCCCCCCAaccc...',
      'KCCCCCCCCCCAacc...',
      'KCCCCCCCCCCAaccc..',
      'KCqCCCqCCCCqAacq..',
      'CqcCCqcCCCqccAqcq.',
      '.q.qqq.qqqq.qqqq..',
    ],
    ax: 9,
    ay: 6,
  },
  up: {
    g: [
      '.....KKCCCCc......',
      '...KKCCCCCCCcc....',
      '..KKCCCCCCCCCcc...',
      '..KCCCCCCCCCCCc...',
      '.KCCCCCCcCCCCCcc..',
      '.KCCCCCCCCCCCCcc..',
      '.KCCCCCCcCCCCCccc.',
      'KCCCCCCCCCCCCCCcc.',
      'KCCCCCCCcCCCCCCccc',
      'KCCqCCCqCCCqCCCqcc',
      'CCqcCCCqcCCqCCqccq',
      '.qq.qqq.qqq.qq.qq.',
    ],
    ax: 9,
    ay: 6,
  },
};

/** 멜빵바지 끈 · 단추 · 앞주머니 (보리 · 두더지): 몸통 위에 한 겹 */
export const OVERALLS: { down: ToyPart; q: ToyPart; right: ToyPart } = {
  down: {
    g: [
      '...A......A...',
      '...A......A...',
      '...a......a...',
      '...A......A...',
      '...Y......Y...',
      '..............',
      '.....qccq.....',
      '.....cCCc.....',
    ],
    ax: 7,
    ay: 4,
  },
  q: {
    g: [
      '.....A......A.',
      '.....A......A.',
      '.....a......a.',
      '.....A......A.',
      '.....Y......Y.',
      '..............',
      '.......qccq...',
      '.......cCCc...',
    ],
    ax: 7,
    ay: 4,
  },
  right: {
    g: [
      '.........A....',
      '.........A....',
      '.........a....',
      '.........A....',
      '.........Y....',
      '..............',
      '..........qcc.',
      '..........cCc.',
    ],
    ax: 7,
    ay: 4,
  },
};

/** 앞치마 (가게 · 대장간 · 재봉사 · 빵집): 바탕 V · 그늘 B · 주머니 b · 매듭 A */
export const APRON: { down: ToyPart; right: ToyPart } = {
  down: {
    g: [
      'bBBBBBBb',
      'VVVVVVVB',
      'VVVVVVVB',
      'VVVAVVVB',
      'VVbbbbVB',
      'VVbVVbVB',
      'VVVVVVBB',
      'BBBBBBBb',
    ],
    ax: 4,
    ay: 3,
  },
  right: {
    g: [
      '...bBBBb',
      '...VVVVB',
      '...VVVVB',
      '...VVAVB',
      '...VbbbB',
      '...VbVbB',
      '...VVVBB',
      '...BBBBb',
    ],
    ax: 4,
    ay: 3,
  },
};

// ───────────────────────── 손 · 발 ─────────────────────────

/** 둥근 앞발 (닻 = 가운데) */
export const PAW: ToyPart = {
  g: [
    '.gHHh.',
    'gGHHHh',
    'gHHHHh',
    'HHHHhh',
    'hHHhhd',
    '.hddd.',
  ],
  ax: 3,
  ay: 3,
};
/** 앞모습 발 (발바닥 천 조각이 아래로 살짝) */
export const FOOT: ToyPart = {
  g: [
    '.gHHHh.',
    'gGHHHhh',
    'HHHHHhh',
    'hHHHHhd',
    '.hBBbd.',
  ],
  ax: 3,
  ay: 2,
};
/** 옆모습 발 (오른쪽으로 뭉툭) */
export const FOOT_SIDE: ToyPart = {
  g: [
    '.gHHHh..',
    'gGHHHHh.',
    'HHHHHHhh',
    'hHHHHHhd',
    '.hBBBbd.',
  ],
  ax: 4,
  ay: 2,
};

// ───────────────────────── 꼬리 (오른쪽을 볼 때 몸 뒤 = 그림 왼쪽으로 뻗는다) ─────────────────────────

export const TAIL_PUFF: ToyPart = { g: ['.VVB.', 'VVVVB', 'VVVBb', 'VVBBb', '.Bbb.'], ax: 2, ay: 2 };
export const TAIL_STUB: ToyPart = { g: ['.gH.', 'gHHh', 'HHhh', '.hd.'], ax: 2, ay: 2 };
/** 여우 꼬리: 굵고 위로 휘며 끝이 희다 */
export const TAIL_BRUSH: ToyPart = {
  g: [
    '.VVB....',
    'VVVBb...',
    'VBBBb...',
    'gHHHh...',
    'gHHHHh..',
    'gHHHHh..',
    '.gHHHhh.',
    '.gHHHHh.',
    '..HHHHhh',
    '..hHHHhh',
    '...hHhhd',
    '....hdd.',
  ],
  ax: 6,
  ay: 9,
};
/** 고양이 꼬리: 가늘게 휘어 올라가고 끝에 별빛 방울 */
export const TAIL_THIN: ToyPart = {
  g: [
    '.A..',
    'YAa.',
    '.gh.',
    '.Hh.',
    'gH..',
    'Hh..',
    'Hh..',
    'gHh.',
    '.Hhh',
    '..hd',
  ],
  ax: 3,
  ay: 8,
};

// ───────────────────────── 옷 조각: 목도리 · 망토 깃 · 마법사 모자 ─────────────────────────

/** 토비의 빨간 목도리 (닻 = 가운데 윗줄). 매듭 끝은 SCARF_TAIL 로 따로 */
export const SCARF: { down: ToyPart; right: ToyPart; up: ToyPart } = {
  down: { g: ['.YAAYAAAYAAAYAa.', 'AAYAAAYAAAYAAAaa', '.aaaaaaaaaaaaaa.'], ax: 8, ay: 0 },
  right: { g: ['.YAAYAAAYAAAYAa.', 'AAYAAAYAAAYAAAaa', '.aaaaaaaaaaaaaa.'], ax: 8, ay: 0 },
  up: { g: ['.AAAaAAAaAAAaAa.', 'AAaAAAaAAAaAAAaa', '.aaaaaaaaaaaaaa.'], ax: 8, ay: 0 },
};
export const SCARF_TAIL: ToyPart = { g: ['AAa', 'YAa', 'AAa', 'AAa', 'YYA'], ax: 1, ay: 0 };

/** 루루 · 촌장 · 틈새지기의 망토 깃 + 둥근 단추 (닻 = 가운데 윗줄) */
export const COLLAR: { down: ToyPart; up: ToyPart } = {
  down: { g: ['KKCCCCCYACCCCCcc', '.cccccCAacccccq.'], ax: 8, ay: 0 },
  up: { g: ['KKCCCCCCCCCCCCcc', '.cccccccccccccq.'], ax: 8, ay: 0 },
};

/** 나비의 마법사 모자 (닻 = 챙 가운데 아랫줄). 끝이 살짝 휘고 별 장식 */
export const HAT: { down: ToyPart; q: ToyPart; right: ToyPart; up: ToyPart } = {
  down: {
    g: [
      '.............Y.......',
      '............KCa......',
      '...........KCCc......',
      '..........KCCCc......',
      '.........KCCCCc......',
      '........KKCYCCc......',
      '.......KKCYYYCcc.....',
      '.......KCCCYCCcc.....',
      '......KCCCCCCCCcc....',
      '....YAAAAAAAAAAAAa...',
      '....aaaaaaaaaaaaaa...',
      '..qKKCCCCCCCCCCCccq..',
      '.qccccccccccccccccqq.',
    ],
    ax: 10,
    ay: 12,
  },
  q: {
    g: [
      '..............Y......',
      '.............KCa.....',
      '............KCCc.....',
      '...........KCCCc.....',
      '..........KCCCCc.....',
      '.........KKCCCYc.....',
      '........KKCCCYYYc....',
      '.......KKCCCCCYCc....',
      '.......KCCCCCCCCcc...',
      '.....YAAAAAAAAAAAAa..',
      '.....aaaaaaaaaaaaaa..',
      '..qKKCCCCCCCCCCCCccq.',
      '.qcccccccccccccccccq.',
    ],
    ax: 10,
    ay: 12,
  },
  right: {
    g: [
      '.Y...................',
      '.aCK.................',
      '..cCCK...............',
      '...cCCKK.............',
      '....cCCCKK...........',
      '.....cCCCCK..........',
      '......cCCCCKK........',
      '......cCCCCCCK.......',
      '......cCCCCCCCKc.....',
      '.....aAAAAAAAAAAY....',
      '.....aaaaaaaaaaaa....',
      '...qKKCCCCCCCCCCCccq.',
      '..qcccccccccccccccqq.',
    ],
    ax: 10,
    ay: 12,
  },
  up: {
    g: [
      '.......Y.............',
      '......aCK............',
      '......cCCK...........',
      '......cCCCK..........',
      '......cCCCCK.........',
      '......cCCCCKK........',
      '.....ccCCCCCKK.......',
      '.....ccCCCCCCK.......',
      '....ccCCCCCCCCK......',
      '...aAAAAAAAAAAAAY....',
      '...aaaaaaaaaaaaaa....',
      '..qccCCCCCCCCCCCKKq..',
      '.qqccccccccccccccccq.',
    ],
    ax: 10,
    ay: 12,
  },
};

/** 무기를 쥔 주먹 */
export const FIST: ToyPart = {
  g: [
    '.gHh.',
    'gGHHh',
    'gHHhh',
    '.hhd.',
  ],
  ax: 2,
  ay: 2,
};
