/**
 * 사람이 손에 든 것 · 쓰는 도구 · 누운 그림 (손찍기). 색은 물건마다 정해져 있어 팔레트를 함께 둔다.
 * 닻(ax, ay) = 손(또는 두 손 가운데)이 닿는 격자 칸.
 */
import { hex, type Color } from '../../paint.ts';
import type { Grid } from '../grid.ts';

export interface Held {
  g: Grid;
  ax: number;
  ay: number;
}

/** 물건 색 (시험이 찾는 색: 책 종이 #fffaf0 · 털실 #ffd84a · 찻잔 분홍 #ff9ec7) */
export const HELD_PAL: Record<string, Color> = {
  // 토비 인형
  F: hex('#f6f0f4'), f: hex('#d8ccd8'), K: hex('#ff9ec7'), I: hex('#2a1c24'), R: hex('#e8414f'), B: hex('#4a78d8'), b: hex('#3a5ab0'),
  // 별 · 종이 · 나무 · 쇠
  Y: hex('#ffe07a'), y: hex('#e8b84a'), w: hex('#fff6c8'),
  P: hex('#fffaf0'), p: hex('#d8ccb4'), q: hex('#a8a090'), N: hex('#4a90e0'),
  W: hex('#8a5a3a'), V: hex('#6a4028'), O: hex('#f0e4c8'), o: hex('#e8e4ec'), h: hex('#4a3226'),
  M: hex('#d8dce8'), m: hex('#a0a4b8'),
  // 털실 · 천 · 찻잔 · 그릇 · 우산 · 전화 · 인형 할머니
  G: hex('#ffd84a'), g: hex('#d8b030'), k: hex('#ff9ec7'), r: hex('#e8414f'), C: hex('#ffffff'), c: hex('#d8d8e0'),
  E: hex('#f4ecdc'), e: hex('#e8a860'), U: hex('#e85a6a'), u: hex('#b8404e'), j: hex('#5a4038'), T: hex('#d8e0f0'), t: hex('#8a96b0'),
  S: hex('#f0ccb0'), H: hex('#e8e4ec'), A: hex('#a88ad0'), a: hex('#8a6ab0'),
};

export const HELD: Record<string, Held> = {
  /** 품에 안은 토비 인형 (hug 는 눈을 감은 것: 얼굴을 묻는다) */
  plush: { g: ['.F..F.', '.K..K.', '.F..F.', '.FFFF.', 'FFFFFf', 'FIFFIf', 'FFFFFf', '.RRRR.', '.BBBBb', '.BBBBb'], ax: 3, ay: 7 },
  plushHug: { g: ['.F..F.', '.K..K.', '.F..F.', '.FFFF.', 'FFFFFf', 'FFFFFf', 'FFFFFf', '.RRRR.', '.BBBBb', '.BBBBb'], ax: 3, ay: 7 },
  star: { g: ['..Y..', 'YYwYY', '.YYY.', 'Y...Y'], ax: 2, ay: 2 },
  /** 태엽 할머니 인형 (흰 머리 · 보라 옷) */
  doll: { g: ['.HHH.', 'HSSSH', 'SISIS', '.SSS.', 'AAAAa', 'AAAAa', '.A.a.'], ax: 2, ay: 4 },
  photo: { g: ['WWWWWWWW', 'WOOOOOOV', 'WOoOOOOV', 'WOOOOhOV', 'WOOOOOOV', 'WOOOOOOV', 'VVVVVVVV'], ax: 4, ay: 5 },
  phone: { g: ['tT', 'TT', 'TT', 'tt'], ax: 0, ay: 2 },
  /** 우산: 손잡이 아래 끝을 쥔다 */
  umbrella: {
    g: [
      '........j........',
      '.....UUUUUUU.....',
      '...UUUUUUUUUUU...',
      '.uUUUUUUUUUUUUUu.',
      'uuUUuUUUuUUUuUUuu',
      'u...u...j...u...u',
      '........j........',
      '........j........',
      '........j........',
      '........j........',
      '........jj.......',
    ],
    ax: 8, ay: 10,
  },
  // ── 도구 (두 손 가운데 아래)
  book: { g: ['PPPpPPPP', 'PqPpPqPP', 'PPPpPPPP', 'PqPpPqPP', 'NNNNNNNN'], ax: 4, ay: 3 },
  bookSide: { g: ['PPPPPP', 'PqPqPP', 'PPPPPP', 'PqPqPP', 'NNNNNN'], ax: 3, ay: 3 },
  paper: { g: ['......r', '......r', 'PPPPPPr', 'PPPPPPP'], ax: 3, ay: 2 },
  knit: { g: ['M....M', '.M..M.', '..MM..', 'GGGGGg', 'GgGGgg', 'GGGGGg'], ax: 3, ay: 2 },
  sew: { g: ['....M', '....r', 'kkkkr', 'krkkk', 'kkkkk', 'kkkkk'], ax: 2, ay: 2 },
  ladle: { g: ['.W.', '.W.', '.W.', '.W.', 'MMM', 'mMm'], ax: 1, ay: 0 },
  bowl: { g: ['....M', '....M', 'eeeee', 'EEEEE', '.EEE.'], ax: 2, ay: 2 },
  cup: { g: ['CCC', 'kkk', 'CCc'], ax: 1, ay: 1 },
};

/** 누운 그림: 베개 · 이불 · 옆으로 누운 머리 (이불은 키에 맞춰 sc 열을 늘인다) */
export const BED = {
  pillow: ['.ccccccccccccc.', 'cCCCCCCCCCCCCCc', 'CCCCCCCCCCCCCCc', 'CCCCCCCCCCCCCCc', 'CCCCCCCCCCCCCCc', '.ccccccccccccc.'],
  quilt: {
    g: [
      '...EEEEEEEEEE...........',
      'CCCCCCCCCCCCCCCCCCCCCCC.',
      'CCCCCCCCCCCCCCCCCCCCCCCC',
      'cccccccccccccccccccccccc',
      'EEEEEEEEEEEEEEEEEEEEEEEE',
      'EEEeEEEEeEEEEeEEEEeEEEEE',
      'EEEEEEEEEEEEEEEEEEEEEEEE',
      'EEEEEEeEEEEEEeEEEEeEEEEE',
      'EEEEEEEEEEEEEEEEEEEEEEEE',
      'EEEEEEEEEEEEEEEEEEEEEEEE',
      'eeeeeeeeeeeeeeeeeeeeeeee',
    ],
    sc: 12,
  },
};
/** 이불 색 */
export const BED_PAL: Record<string, Color> = { C: hex('#ffffff'), c: hex('#e0d0b8'), E: hex('#f0e0c8'), e: hex('#d0b898') };
/** 베개 색 */
export const PILLOW_PAL: Record<string, Color> = { C: hex('#f4f0f8'), c: hex('#d8d0e0') };

/** 옆으로 누운 머리 (머리 · 살 팔레트): l 감은 눈 / 뜬 눈은 people.ts 가 덧찍는다 */
export const LYING_HEAD: Grid = [
  '..HHHHHH....',
  '.HgGgHHHSS..',
  'HgHHHHHSSSS.',
  'HHHHHHSSSSSS',
  'HHHHHhSSllSS',
  'HHHHhSSSSSSs',
  'hHHHhSSqqSSs',
  '.hhhSSSSSSs.',
  '..hh.ssss...',
];
/** 누운 머리의 눈 자리 (뜬 눈은 E W 두 칸) */
export const LYING_EYE: [number, number] = [8, 4];
