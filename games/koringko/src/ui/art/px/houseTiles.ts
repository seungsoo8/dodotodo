/**
 * 사람 크기 방의 바닥 · 벽 손찍기 격자 (24×24 칸을 이어 붙이는 반복 무늬).
 * 색은 방 꾸밈(HouseLook)에서 팔레트로 받는다: 같은 격자를 방마다 다른 색으로 칠한다.
 *
 * 글자 (이 파일 안에서 같은 글자 = 같은 재질):
 *   바닥  d 이음 틈 · g 밝음 · H 바탕 · h 결 · 그늘 · k 옹이 · (A a b) 둘째 판 · (C c e) 셋째 판
 *   벽지  W 벽 바탕 · A 무늬 색(accent 그대로) · a 무늬 그늘 · Y 꽃술 · w 벽 얼룩
 *   벽 띠 K k q 윗면 띠 · M m n 천장 몰딩 · E B x 걸레받이 (B = 걸레받이 색 그대로) · v 걸레받이 위 그늘
 *         P p o r 징두리 판벽 (판 · 판 그늘 · 판 틈 · 판 밝음) · R 몰딩 띠 밝음 · T 몰딩 띠
 */
import { hex, mix, shade, type Color } from '../paint.ts';
import { mat, type Grid, type Palette } from './grid.ts';

// ───────────────────────── 마루 널 (한 널 = 8줄) ─────────────────────────

/** 널빤지 한 장 (길이별). 0줄 이음 틈 · 1줄 빛 받는 모서리 · 7줄 그늘, 0열 이음 틈 · 1열 빛 */
export const PLANKS: Record<number, Grid> = {
  24: [
    'dddddddddddddddddddddddd',
    'dggggggggggggggggggggggg',
    'dgHHHHHHHhhhhHHHHHHHHHHH',
    'dHHHHHHHHHHHHHHHHHHhhhHH',
    'dHHHhhhHHHHHHHHHHHHHHHHH',
    'dHHHHHHHHHHHHhhhhhHHHHHH',
    'dHHHHHHHHHHHHHHHHHHHHHHh',
    'dhhhhhhhhhhhhhhhhhhhhhhh',
  ],
  32: [
    'dddddddddddddddddddddddddddddddd',
    'dggggggggggggggggggggggggggggggg',
    'dgHHHHHHHHHHHHHHHhhhhhhHHHHHHHHH',
    'dHHHhhhhHHHHHHHHHHHHHHHHHHHHHHHH',
    'dHHHHHHHHHHHHHkkHHHHHHHHHHhhhHHH',
    'dHHHHHHHHHHHHkhhkHHHHHHHHHHHHHHH',
    'dHHHHHHhhhhHHHHHHHHHHHHHHHHHHHHh',
    'dhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
  ],
  40: [
    'dddddddddddddddddddddddddddddddddddddddd',
    'dggggggggggggggggggggggggggggggggggggggg',
    'dgHHHHHHHHHHHHhhhhHHHHHHHHHHHHHHHHHHHHHH',
    'dHHHHHHHHHHHHHHHHHHHHHHHHhhhhhhHHHHHHHHH',
    'dHHHHhhhHHHHHHHHHHHHHHHHHHHHHHHHHHHkkHHH',
    'dHHHHHHHHHHHHHHHHhhhhhHHHHHHHHHHHHkhhkHH',
    'dHHHHHHHHHHHHHHHHHHHHHHHHHHHHhhhHHHHHHHh',
    'dhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
  ],
  48: [
    'dddddddddddddddddddddddddddddddddddddddddddddddd',
    'dggggggggggggggggggggggggggggggggggggggggggggggg',
    'dgHHHHHhhhhhHHHHHHHHHHHHHHHHHHHHHhhhhHHHHHHHHHHH',
    'dHHHHHHHHHHHHHHHHHHHhhhhhhHHHHHHHHHHHHHHHHHHHHHH',
    'dHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhhhHHH',
    'dHHHhhhhhHHHHHHHHHHHHHHHHHHHHHHhhhhhhHHHHHHHHHHH',
    'dHHHHHHHHHHHHHHHHHHHHHhhhhHHHHHHHHHHHHHHHHHHHHHh',
    'dhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
  ],
};

/** 마루 한 장 (폭 120 = 다섯 칸): 줄(8px)마다 널 길이와 결 색(0 · 1 · 2)을 다르게 깐다 */
const COURSES: [number, number][][] = [
  [[40, 0], [32, 1], [48, 2]],
  [[24, 1], [48, 0], [48, 1]],
  [[48, 2], [40, 0], [32, 1]],
];
const TONE: Record<string, string>[] = [{}, { g: 'b', H: 'A', h: 'a' }, { g: 'e', H: 'C', h: 'c' }];

export const WOOD_SHEET: Grid = COURSES.flatMap((course) =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((r) => course.map(([n, t]) => [...PLANKS[n][r]].map((ch) => TONE[t][ch] ?? ch).join('')).join('')),
);

export function woodPal(f: Color): Palette {
  return {
    d: shade(f, -0.3),
    g: shade(f, 0.1),
    H: f,
    h: shade(f, -0.09),
    k: shade(f, -0.24),
    b: shade(f, 0.04),
    A: shade(f, -0.06),
    a: shade(f, -0.14),
    e: shade(f, 0.14),
    C: shade(f, 0.05),
    c: shade(f, -0.04),
  };
}

// ───────────────────────── 타일 바닥 (12px 네모 · 바둑 두 색) ─────────────────────────

export const TILE_FLOOR: Grid = [
  'ddddddddddddddddddddddddd'.slice(0, 24),
  'dggggggggggHdbbbbbbbbbbA',
  'dgHHHHHHHHHHdbAAAAAAAAAA',
  'dgHHHHHHHHHHdbAAAAAAAAAA',
  'dHHHHHHHHHHHdAAAAAAAAAAA',
  'dHHHHHHHHHHHdAAAAAAAAAAA',
  'dHHHHHHHHHHHdAAAAAAAAAAA',
  'dHHHHHHHHHHHdAAAAAAAAAAA',
  'dHHHHHHHHHHHdAAAAAAAAAAA',
  'dHHHHHHHHHHHdAAAAAAAAAAA',
  'dHHHHHHHHHHhdAAAAAAAAAAa',
  'dHhhhhhhhhhhdAaaaaaaaaaa',
  'dddddddddddddddddddddddd',
  'dbbbbbbbbbbAdggggggggggH',
  'dbAAAAAAAAAAdgHHHHHHHHHH',
  'dbAAAAAAAAAAdgHHHHHHHHHH',
  'dAAAAAAAAAAAdHHHHHHHHHHH',
  'dAAAAAAAAAAAdHHHHHHHHHHH',
  'dAAAAAAAAAAAdHHHHHHHHHHH',
  'dAAAAAAAAAAAdHHHHHHHHHHH',
  'dAAAAAAAAAAAdHHHHHHHHHHH',
  'dAAAAAAAAAAAdHHHHHHHHHHH',
  'dAAAAAAAAAAadHHHHHHHHHHh',
  'dAaaaaaaaaaadHhhhhhhhhhh',
];

export function tilePal(f: Color): Palette {
  return { d: shade(f, -0.16), g: shade(f, 0.1), H: f, h: shade(f, -0.05), b: shade(f, 0.04), A: shade(f, -0.06), a: shade(f, -0.1) };
}

// ───────────────────────── 장판 · 리놀륨 (넓은 판, 24줄마다 이음) ─────────────────────────

export const LINO_FLOOR: Grid = [
  'hhhhhhhhhhhhhhhhhhhhhhhh',
  'gggggggggggggggggggggggg',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHwHHHHHHH',
  'HHHwHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHwwHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHgH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHgHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHwHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HwHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHgHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHwHHHHHHHHHHHHwH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHgHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHwwHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHwHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHgHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
];

export function linoPal(f: Color): Palette {
  return { h: shade(f, -0.08), g: shade(f, 0.05), H: f, w: shade(f, -0.06) };
}

// ───────────────────────── 마당 풀밭 ─────────────────────────

export const GRASS_FLOOR: Grid = [
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHgHHHHHHHHHHHHHHgHHHHH',
  'HHHhHHHHHHHgHHHHHHhHHHHH',
  'HHhHhHHHHHHhHHHHHhHHHHHH',
  'HHHHHHHHHHhHhHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHgHH',
  'HHHHHHHAAAHHHHHHHHHHHhHH',
  'HgHHHHAAAAAHHHHHHHHHhHhH',
  'HhHHHHHAAAHHHHgHHHHHHHHH',
  'hHhHHHHHHHHHHHhHHHHHHHHH',
  'HHHHHHHHHHHHHhHhHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHgHHHHHHHHHHHHHH',
  'HHHHHHHHHhHHHHHHHHHAAAAH',
  'HHHgHHHHhHhHHHHHHHAAAAAA',
  'HHHhHHHHHHHHHHHHHHHAAAAH',
  'HHhHhHHHHHHHHHHgHHHHHHHH',
  'HHHHHHHHHHHHHHHhHHHHHHHH',
  'HHHHHHHHHHHHHHhHhHHHHHHH',
  'HHHHHHHHgHHHHHHHHHHHgHHH',
  'HHHHHHHHhHHHHHHHHHHHhHHH',
  'HHHHHHHhHhHHHHHHHHHhHhHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
];

export function grassPal(f: Color): Palette {
  return { H: f, g: shade(f, 0.2), h: shade(f, -0.2), A: shade(f, 0.06) };
}

// ───────────────────────── 집 밖 바닥 ─────────────────────────

/** 아스팔트: 굵은 알갱이 (밝은 돌 g · 어두운 구멍 h), 큰 얼룩 A */
export const ASPHALT: Grid = [
  'HHHHHHHHHgHHHHHHHHHHHHhH',
  'HHhHHHHHHHHHHHHgHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHgHHHHhHHHHHHHHgHHH',
  'HgHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHhHHHHHH',
  'HHHHhHHHHHHHHgHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHgH',
  'HHHHHHHHHgHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHgHHhHHHH',
  'HhHHHHHHHHHHAAAHHHHHHHHH',
  'HHHHHHgHHHHAAAAAHHHHHHHH',
  'HHHHHHHHHHHHAAAHHHHHHHHh',
  'HHHgHHHHHHHHHHHHHHHgHHHH',
  'HHHHHHHHHhHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHhHHHHHHHHH',
  'HHHhHHHHgHHHHHHHHHHHHgHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HgHHHHHHHHHHHHHHgHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHhHHHHHHHHhHHH',
  'HHHHHgHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHgHHHHH',
];

/** 아스팔트 금 (칸 몇 개에만) */
export const ASPHALT_CRACKS: Grid[] = [
  [
    '........d...............',
    '........d...............',
    '.........d..............',
    '.........d..............',
    '........dd..............',
    '........d...............',
    '.......d................',
    '.......d.ddd............',
    '.......d....dd..........',
    '........d.....d.........',
    '........d...............',
    '.........d..............',
    '.........d..............',
    '..........d.............',
    '..........d.............',
  ],
  [
    '................d.......',
    '...............d........',
    '...............d........',
    '..............dd........',
    '.............d..........',
    '.............d..........',
    '..........ddd...........',
    '.........d..d...........',
    '........d....d..........',
    '.............d..........',
    '..............d.........',
  ],
];

/** 맨홀 뚜껑 (20×16) */
export const MANHOLE: Grid = [
  '......dddddddd......',
  '....ddmmmmmmmmdd....',
  '...dmMMmmmmmmmmmd...',
  '..dmMmmMMmMMmMMmmd..',
  '.dmmmmmmmmmmmmmmmmd.',
  '.dmMMmMMmMMmMMmMMmd.',
  'dmmmmmmmmmmmmmmmmmmd',
  'dmMMmMMmmooMMmMMmmmd',
  'dmmmmmmmmoommmmmmmmd',
  'dmMMmMMmMMmMMmMMmmmd',
  '.dmmmmmmmmmmmmmmmmd.',
  '.dmMMmMMmMMmMMmMMmd.',
  '..dmmmmmmmmmmmmmmd..',
  '...dmmmmmmmmmmmmd...',
  '....ddmmmmmmmmdd....',
  '......dddddddd......',
];

export function asphaltPal(f: Color): Palette {
  const iron = shade(f, -0.3);
  return { H: f, g: shade(f, 0.14), h: shade(f, -0.12), A: shade(f, -0.1), d: shade(f, -0.38), m: iron, M: shade(iron, 0.18), o: shade(iron, -0.3) };
}

/** 보도블록: 16×8 블록을 줄마다 반씩 엇갈려 (A 는 색이 조금 다른 블록, p 는 분홍 블록) */
export const PAVING: Grid = [
  'dddddddddddddddddddddddddddddddd',
  'dggggggggggggggHdbbbbbbbbbbbbbbA',
  'dgHHHHHHHHHHHHHhdbAAAAAAAAAAAAAa',
  'dgHHHHHHHHwHHHHhdbAAAAAAAAAAAAAa',
  'dgHHHHHHHHHHHHHhdbAAAAAAAwAAAAAa',
  'dgHHHwHHHHHHHHHhdbAAAAAAAAAAAAAa',
  'dgHHHHHHHHHHHHHhdbAAAAAAAAAAAAAa',
  'dhhhhhhhhhhhhhhhdaaaaaaaaaaaaaaa',
  'dddddddddddddddddddddddddddddddd',
  'bbbbbbbAdpppppppppppppppdbbbbbbb',
  'AAAAAAAadpPPPPPPPPPPPPPqdbAAAAAA',
  'AAAAAAAadpPPPPPPPPPPPPPqdbAAAAAA',
  'AAAwAAAadpPPPPPPPPPPPPPqdbAAAAAA',
  'AAAAAAAadpPPPPPPwPPPPPPqdbAAwAAA',
  'AAAAAAAadpPPPPPPPPPPPPPqdbAAAAAA',
  'aaaaaaaadqqqqqqqqqqqqqqqdaaaaaaa',
];

export function pavingPal(f: Color): Palette {
  const pink = mix(f, hex('#c49890'), 0.22);
  return {
    d: shade(f, -0.17), g: shade(f, 0.08), H: f, h: shade(f, -0.07), w: shade(f, -0.06),
    b: shade(f, 0.06), A: shade(f, -0.04), a: shade(f, -0.1),
    p: shade(pink, 0.08), P: pink, q: shade(pink, -0.07),
  };
}

/** 젖은 보도: 줄눈에 고인 물 반짝임 */
export const PAVING_WET: Grid = ['.....ssss...........ss...', '.........................'].map((r) => r.slice(0, 24));

/** 모래: 고운 알갱이 */
export const SAND: Grid = [
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHgHHHHHHHHHHHHHHhHHHHH',
  'HHHHHHHHHHhHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHgHHHHHHHH',
  'HhHHHHHHHHHHHHHHHHHHHHgH',
  'HHHHHHgHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHhHHHHH',
  'HHHHHHHHHHHHgHHHHHHHHHHH',
  'HHHAAAAHHHHHHHHHHHHHHHHH',
  'HHAAAAAAHHHHHHHHHHHgHHHH',
  'HHHAAAAHHHHHHhHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHgHHHHHHHHHHHhHH',
  'HgHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHgHHHHHHH',
  'HHHHHHhHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHgHHHHHAAAHH',
  'HHHhHHHHHHHHHHHHHHAAAAAH',
  'HHHHHHHHHgHHHHHHHHHAAAHH',
  'HHHHHHHHHHHHHHHhHHHHHHHH',
  'HHHHHgHHHHHHHHHHHHHHHHgH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
];

/** 모래 물결 · 발자국 · 작은 돌 */
export const SAND_RIPPLE: Grid = [
  '..hhh.....hhh.....hhh...',
  '.h...hh..h...hh..h...hh.',
];
export const SAND_STEPS: Grid = [
  '.hh.........',
  'hhhh........',
  'hhhh........',
  '.hh.........',
  '.......hh...',
  '......hhhh..',
  '......hhhh..',
  '.......hh...',
  '.hh.........',
  'hhhh........',
  'hhhh........',
  '.hh.........',
];
export const PEBBLE: Grid = ['.sS.', 'sSSo', '.oo.'];

export function sandPal(f: Color): Palette {
  return { H: f, g: shade(f, 0.16), h: shade(f, -0.12), A: shade(f, 0.04), s: hex('#d8d0c4'), S: hex('#c0b8ac'), o: hex('#948c80') };
}

/** 흙길: 마른 흙덩이 (A 밝은 덩이 · a 어두운 덩이), 길섶 풀 포기 */
export const DIRT: Grid = [
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHAAAAHHHHHHHHHHHH',
  'HHHhHHHAAAAAAHHHHHHhHHHH',
  'HHHHHHHHAAAAHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHhHHHHHHHH',
  'HaaaHHHHHHHHHHHHHHHHHHHH',
  'aaaaaHHHHHHHHHHHHHHAAAHH',
  'HaaaHHHHHHhHHHHHHHAAAAAH',
  'HHHHHHHHHHHHHHHHHHHAAAHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHhHHHHHHHaaaaHHHHHHH',
  'HHHHHHHHHHHHaaaaaaHHHHhH',
  'HHHHHHHHHHHHHaaaaHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHAAAHHHHHHHHHHHHHHHHHH',
  'HHAAAAAHHHHHHHHHHhHHHHHH',
  'HHHAAAHHHHHHHHHHHHHHHHHH',
  'HHHHHHHHHHhHHHHHHHHHHHHH',
  'HHHHHHHHHHHHHHHHHHHaaaHH',
  'HHHHHHHHHHHHHHHHHHaaaaaH',
  'HhHHHHHHHHHHHHHHHHHaaaHH',
  'HHHHHHHHHHHHHHHHHHHHHHHH',
];
export const TUFT: Grid = ['l...l', '.l.l.', 'lLlLl', '.lLl.'];

export function dirtPal(f: Color, grass: Color): Palette {
  return { H: f, h: shade(f, -0.12), A: shade(f, 0.05), a: shade(f, -0.06), l: shade(grass, -0.1), L: shade(grass, 0.12), s: hex('#d0c8b8'), S: hex('#b0a898'), o: hex('#8a8478') };
}

// ───────────────────────── 집 밖 담 ─────────────────────────

/** 벽돌 담 (줄 5px · 벽돌 12px, 줄마다 반씩 엇갈림): m 줄눈 (벽돌보다 밝은 시멘트) */
export const BRICKS: Grid = [
  'mmmmmmmmmmmmmmmmmmmmmmmm',
  'mBBBBBBBBBBBmCCCCCCCCCCC',
  'mBBBBBBBBBBBmCCCCCCCCCCC',
  'mBBBBBBBBBBBmCCCCCCCCCCC',
  'mbbbbbbbbbbbmccccccccccc',
  'mmmmmmmmmmmmmmmmmmmmmmmm',
  'DDDDDmBBBBBBBBBBBmDDDDDD',
  'DDDDDmBBBBBBBBBBBmDDDDDD',
  'DDDDDmBBBBBBBBBBBmDDDDDD',
  'dddddmbbbbbbbbbbbmdddddd',
];

export function brickPal(wall: Color, dim: boolean): Palette {
  const k = dim ? -0.12 : 0;
  return {
    m: shade(wall, 0.32), B: shade(wall, k), b: shade(wall, k - 0.12), C: shade(wall, k + 0.06), c: shade(wall, k - 0.06), D: shade(wall, k - 0.06), d: shade(wall, k - 0.18),
  };
}

/** 담 위 갓돌 (5줄) + 담 밑 그늘 */
export const COPING: Grid = ['GGGGGGGG', 'gggggggg', 'gggggggG', 'gggggggg', 'hhhhhhhh', 'ssssssss', 'ssssssss'];
/** 담쟁이 덩굴 (갓돌 아래 늘어진다) */
export const IVY: Grid = [
  '.lLLl..........lLl......',
  'lLGLLl..lLl...lLGLl.....',
  'lLLLll.lLGLl..lLLLl..lLl',
  '.lLlL.lLLLLl...lLl..lLGL',
  '..lll..lLLl...lLLl..lLLl',
  '.lLLl...ll...lLGLLl..ll.',
  'lLGLLl.......lLLLll.....',
  'lLLLll........lLl.......',
  '.lll...........l........',
];

/** 덤불 (울타리 너머 · 마당 가장자리) */
export const HEDGE: Grid = [
  'hHHHhddhgGgHHhdhHgGgHHhd',
  'HHHhhdhgGGgHHHhhgGGgHHHh',
  'HHhhdhgGgHHHHHhhgGHHHHHh',
  'hhhddhgHHHHHHHhdhHHHHHhh',
  'ddddhHHHHHHHHhhddhHHHhhd',
  'gGghhHHHHHHHhhddddhhhhdd',
  'GGgHhhHHHHhhhddhgGgHhddh',
  'GgHHHhhhhhhdddhgGGgHHhdd',
  'gHHHHHhddddddhgGgHHHHHhd',
  'HHHHHhhddhgGghgHHHHHHHhh',
  'HHHHhhddhgGGgHHHHHHHHhhd',
  'hHhhhdddhgGgHHHHHHHHhhdd',
  'hhhddhggdhHHHHHHHHHhhddh',
  'ddddhgGGghHHHHHHHhhhddhg',
  'dhhhgGGgHhhHHHHhhhhdddgG',
  'hgGgHgGHHHhhhhhhhdddhgGG',
  'gGGgHHHHHHHhddddddhhgGgH',
  'GGgHHHHHHHHhhdhgGghHHHHH',
  'GgHHHHHHHHhhdhgGGgHHHHHH',
  'gHHHHHHHHhhddhgGgHHHHHHh',
  'HHHHHHHHhhdddhHHHHHHHHhh',
  'hHHHHHhhhddhhhHHHHHHHhhd',
  'hhhhhhhddddhgGhHHHHhhhdd',
  'ddhhhddhhddhGGgHhhhhhddd',
];

/** 덤불 사이 작은 꽃 */
export const BLOSSOM: Grid = ['.y.', 'yYy', '.y.'];

export function hedgePal(wall: Color, k = -0.2): Palette {
  const b = shade(wall, k);
  return { H: b, h: shade(b, -0.16), d: shade(b, -0.32), g: shade(b, 0.12), G: shade(b, 0.24), y: hex('#f8e8a0'), Y: hex('#e8b84a') };
}

/** 말뚝 울타리 한 칸 (8px 마다 말뚝 하나, 뾰족한 머리) */
export const PICKETS: Grid = [
  '..GW....',
  '.GWWw...',
  'GWWWWw..',
  'GWWWWw..',
  'GWWWWw..',
  'RRRRRRRR',
  'rrrrrrrr',
  'GWWWWw..',
  'GWWWWw..',
  'GWWWWw..',
  'GWWWWw..',
  'RRRRRRRR',
  'rrrrrrrr',
  'GWWWWw..',
  'GWWWWw..',
  'GWWWWw..',
  'ssssssss',
  'ssssssss',
];

export function picketPal(wood: Color, wall: Color): Palette {
  return { W: wood, G: shade(wood, 0.25), w: shade(wood, -0.25), R: shade(wood, 0.1), r: shade(wood, -0.15), s: shade(wall, -0.45) };
}

/** 옛 마을 돌담: 둥근 돌 (S 돌 · s 돌 그늘 · G 돌 밝음 · m 진흙 틈) */
export const STONES: Grid = [
  'mmGGGSSmmGGSSSSmmGGGSSSm',
  'mGSSSSSsmGSSSSSsmGSSSSSs',
  'mSSSSSssmSSSSSssmSSSSSsm',
  'mmsssssmmmssssmmmmssssmm',
  'GGSSmmHHHNNNmmmGGSSSmmHH',
  'SSSSsmHNNNNNNnmGSSSSsmHN',
  'SSSssmNNNNNNnnmSSSSssmNN',
  'sssmmmmnnnnnnmmmsssmmmnn',
  'mmGGGSSmmGGSSSSmmGGGSSSm',
  'mGSSSSSsmGSAASSsmGSSSSSs',
  'mSSSSSssmSSSSSssmSSAASsm',
  'mmsssssmmmssssmmmmssssmm',
];

export function stonePal(wall: Color, base: Color, moss: Color, dim: boolean): Palette {
  const s = shade(wall, dim ? -0.1 : 0);
  const t = shade(s, -0.08);
  return { S: s, s: shade(s, -0.18), G: shade(s, 0.16), N: t, n: shade(t, -0.18), H: shade(t, 0.14), m: shade(base, -0.2), A: shade(moss, -0.1) };
}

// ───────────────────────── 집 안 벽지 ─────────────────────────

export const WALLPAPER: Record<string, Grid> = {
  // 세로 줄무늬 (12px 마다 5px 줄, 줄 오른쪽에 그늘 한 칸)
  stripes: ['AAAAAaWWWWWW'],
  // 물방울 (12px 마다 2×2, 줄마다 반씩 엇갈림)
  dots: [
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'AAWWWWWWWWWW',
    'AaWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWAAWWWW',
    'WWWWWWAaWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
  ],
  // 별 (16px 마다, 줄마다 반씩 엇갈림)
  stars: [
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWAWWWWWWW',
    'WWWWWWAAAAAWWWWW',
    'WWWWWWWAAAWWWWWW',
    'WWWWWWWAWaWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'AWWWWWWWWWWWWWWW',
    'AAAWWWWWWWWWWWAA',
    'AAWWWWWWWWWWWWWA',
    'WaWWWWWWWWWWWWWA',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
  ],
  // 잔꽃 (14px 마다 꽃잎 넷 + 노란 꽃술, 줄마다 반씩 엇갈림)
  flowers: [
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWAWWWWWW',
    'WWWWWWAYAWWWWW',
    'WWWWWWWaWWWWWW',
    'WWWWWWllWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'AWWWWWWWWWWWWW',
    'YAWWWWWWWWWWWA',
    'aWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWl',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
  ],
  // 벽 타일 (12px 네모 · 줄눈 = accent)
  tiles: [
    'AAAAAAAAAAAA',
    'AggggggWWWWW',
    'AgWWWWWWWWWW',
    'AWWWWWWWWWWW',
    'AWWWWWWWWWWW',
    'AWWWWWWWWWWW',
    'AWWWWWWWWWWW',
    'AWWWWWWWWWWW',
    'AWWWWWWWWWWW',
    'AWWWWWWWWWWW',
    'AWWWWWWWWWWa',
    'AWWWWWWWWWaa',
  ],
  // 민무늬 (아주 옅은 얼룩)
  plain: [
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWwWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWwWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWwWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WwWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWwW',
    'WWWWWWWWwWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWwWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWwWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWwWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWwWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWwWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWwWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWW',
  ],
};

export function wallPal(wall: Color, accent: Color): Palette {
  return { W: wall, w: shade(wall, -0.04), A: accent, a: shade(accent, -0.14), Y: hex('#e8c860'), l: mix(wall, hex('#7aa060'), 0.4), g: shade(wall, 0.12) };
}

/** 뒷벽 맨 윗줄: 윗면 띠 6줄 (K k q) + 천장 몰딩 3줄 (M m n) — 8px 마다 되풀이 */
export const WALL_TOP: Grid = [
  'KKKKKKKK',
  'kkkkkkkk',
  'kkkkkkkk',
  'kkkkkkkk',
  'kkkkkkkk',
  'qqqqqqqq',
  'MMMMMMMM',
  'mmmnmmmm',
  'nnnnnnnn',
];

/** 걸레받이 7줄: 벽 그늘 v · 윗선 밝음 E · 걸레받이 B (5줄 중 셋째 줄에 홈) · 바닥과 닿는 짙은 줄 x — 12px 마다 이음 */
export const BASEBOARD: Grid = [
  'vvvvvvvvvvvv',
  'EEEEEEEEEEEE',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'bbbbbbbbbbbb',
  'BBBBBBBBBBBy',
  'xxxxxxxxxxxx',
];

/** 징두리 판벽 (16px 판 한 장): 판 테 r(밝음) · o(틈) 안에 살짝 도드라진 판 P */
export const WAINSCOT: Grid = [
  'opppppppppppppp',
  'orrrrrrrrrrrrrp',
  'orPPPPPPPPPPPop',
  'orPPPPPPPPPPPop',
  'orPPPPPPPPPPPop',
  'orPPPPPPPPPPPop',
  'orPPPPPPPPPPPop',
  'orPPPPPPPPPPPop',
  'orPPPPPPPPPPPop',
  'oroooooooooooop',
  'oppppppppppppppp'.slice(0, 15),
].map((r) => r + 'p');

/** 판벽 위 몰딩 띠 3줄 + 그늘 1줄 */
export const WAINSCOT_RAIL: Grid = ['RRRRRRRR', 'TTTTTTTT', 'TTTTTTTT', 'oooooooo'];

export function wallBandPal(L: { wall: Color; base: Color }, cap: Color): Palette {
  const mold = shade(L.base, 0.12);
  const panel = shade(mix(L.wall, L.base, 0.45), -0.06);
  const rail = shade(L.base, 0.06);
  return {
    K: shade(cap, 0.2), k: cap, q: shade(cap, -0.3),
    M: shade(mold, 0.3), m: mold, n: shade(L.base, -0.28),
    v: shade(L.wall, -0.2), E: shade(L.base, 0.28), B: L.base, b: shade(L.base, -0.1), y: shade(L.base, -0.18), x: shade(L.base, -0.4),
    P: panel, p: shade(panel, -0.08), o: shade(panel, -0.24), r: shade(panel, 0.12),
    R: shade(rail, 0.3), T: rail,
  };
}

// ───────────────────────── 벽 두께 윗면 ─────────────────────────

/** 위에서 본 벽 두께: 넓은 판 결 (C 바탕 · c 결 · D 얼룩) */
export const CAP_TOP: Grid = [
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCccccCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCDDDDCCCC',
  'CCCCCCCCCCCCCCCCDDDDCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CDDDDCCCCCCCCcccccCCCCCC',
  'CDDDDCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCDDDDCCCCCCCCcc',
  'CCCCCCCCCCDDDDCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCcccCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCDDDDCC',
  'CCCCCCCCCCCCCCCCCCDDDDCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
];
/** 트인 쪽 가장자리 (위 기준 두 줄: 짙은 선 e · 안쪽 밝은 선 i) · 대각선만 트인 안쪽 모서리 */
export const CAP_EDGE: Grid = ['e', 'i'];
export const CAP_CORNER: Grid = ['ei', 'i.'];

export function capPal(cap: Color): Palette {
  return { C: cap, c: shade(cap, -0.04), D: shade(cap, 0.03), e: shade(cap, -0.42), i: shade(cap, 0.3) };
}

// ───────────────────────── 다락 낮은 구석 ─────────────────────────

/**
 * 다락 경사 천장 (바깥으로 올라가는 널 7px · 비스듬한 서까래). 가로 = 바닥과 만나는 가장자리에서 잰 거리 e (깔도리 다음부터),
 * 세로 = 화면 y. 서까래는 오른쪽으로 갈수록 위로 (63px 에 34줄) 올라가 반복이 이어진다.
 * B 널 · b 널 결 · s 널 이음 틈 · R 서까래 · T 서까래 밝은 모서리 · t 서까래 그늘 모서리 · u 서까래 아래 그늘
 */
export const EAVE_SHEET: Grid = buildEave();

function buildEave(): string[] {
  // 손으로 찍은 서까래 한 마디 (세로 9줄: 밝은 모서리 · 몸 4 · 그늘 모서리 · 아래 그늘 3)
  const RAFTER = ['T', 'R', 'R', 'R', 'R', 't', 'u', 'u', 'u'];
  // 널 한 장 (7px 폭): 이음 틈 · 결
  const BOARD = ['sBBBBbB', 'sBBbBBB', 'sBBBBBB', 'sBBBBBb', 'sbBBBBB', 'sBBBBBB'];
  const rows: string[] = [];
  for (let y = 0; y < 34; y++) {
    let row = '';
    for (let e = 0; e < 63; e++) {
      const r = (y + Math.round(e * 0.54)) % 34;
      row += r < RAFTER.length ? RAFTER[r] : BOARD[y % BOARD.length][e % 7];
    }
    rows.push(row);
  }
  return rows;
}

/** 깔도리 (천장이 바닥에 닿는 나무, 가로 5px = e 방향) · 서까래 색 */
export const SILL: Grid = ['TRRRt', 'TRRrt', 'TRRRt', 'TrRRt'];

/** 거미줄 (깔도리 구석) · 먼지 뭉치 */
export const COBWEB: Grid = [
  'w.......',
  '.w...w..',
  'w.w.w...',
  '..ww....',
  'wwWwwwww',
  '..ww....',
  '.w..w...',
  'w....w..',
  '......w.',
];
export const DUSTBALL: Grid = ['.dD.', 'dDDd', '.dd.'];

export function eavePal(floor: Color): Palette {
  const board = hex('#7a5438');
  const rafter = hex('#4e3424');
  const web = hex('#cfc8bc');
  return {
    B: shade(board, -0.2), b: shade(board, -0.28), s: shade(board, -0.42),
    R: shade(rafter, 0.02), T: shade(rafter, 0.24), t: shade(rafter, -0.35), u: shade(board, -0.36), r: shade(rafter, -0.08),
    w: web, W: shade(web, -0.15), d: shade(floor, -0.35), D: shade(floor, -0.2),
  };
}

// ───────────────────────── 단 앞면 · 문틀 ─────────────────────────

/** 단 앞판 10줄 (나무: 널 마구리 · 그 밖: 줄눈 한 줄) */
export const STEP_WOOD: Grid = [
  'GGGGGGGGGGGGGGGGGGGGGGGG',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFFfFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFfFFFFFFFFFFFFFFfFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFfFFFFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFfFFFFFFFFFFFFFFF',
  'dddddddddddddddddddddddd',
];
export const STEP_TILE: Grid = [
  'GGGGGGGGGGGGGGGGGGGGGGGG',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'jjjjjjjjjjjjjjjjjjjjjjjj',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'dddddddddddddddddddddddd',
];
export const STEP_END: Grid = ['e'];

export function stepPal(f: Color): Palette {
  return { G: shade(f, 0.22), F: shade(f, -0.14), f: shade(f, -0.2), j: shade(f, -0.28), d: shade(f, -0.42), e: shade(f, -0.5) };
}

/** 문틀 기둥 3px (밝음 · 바탕 · 그늘) */
export const DOOR_POST: Grid = ['gPp'];
/** 문 위 인방: 벽 윗면 4줄 + 나무 들보 5줄 */
export const LINTEL: Grid = ['KKKK', 'kkkk', 'kkkk', 'kkkk', 'gggg', 'PPPP', 'PPPP', 'PPPP', 'pppp'];

export function postPal(post: Color, cap: Color): Palette {
  return { g: shade(post, 0.22), P: post, p: shade(post, -0.35), K: shade(cap, 0.25), k: cap };
}

/** 이 파일의 격자와 팔레트 (시험용 목록) */
export function allHouseTileGrids(): [string, Grid, Palette][] {
  const f = hex('#b07848');
  const out: [string, Grid, Palette][] = [
    ['wood', WOOD_SHEET, woodPal(f)], ['tile', TILE_FLOOR, tilePal(f)], ['lino', LINO_FLOOR, linoPal(f)], ['grass', GRASS_FLOOR, grassPal(f)],
    ['asphalt', ASPHALT, asphaltPal(f)], ['manhole', MANHOLE, asphaltPal(f)], ['paving', PAVING, pavingPal(f)], ['sand', SAND, sandPal(f)],
    ['steps', SAND_STEPS, sandPal(f)], ['ripple', SAND_RIPPLE, sandPal(f)], ['pebble', PEBBLE, sandPal(f)], ['dirt', DIRT, dirtPal(f, f)], ['tuft', TUFT, dirtPal(f, f)],
    ['bricks', BRICKS, brickPal(f, false)], ['coping', COPING, { G: f, g: f, h: f, s: f }], ['ivy', IVY, { l: f, L: f }], ['hedge', HEDGE, hedgePal(f)], ['blossom', BLOSSOM, hedgePal(f)],
    ['pickets', PICKETS, picketPal(f, f)], ['stones', STONES, stonePal(f, f, f, false)], ['top', WALL_TOP, wallBandPal({ wall: f, base: f }, f)],
    ['baseboard', BASEBOARD, wallBandPal({ wall: f, base: f }, f)], ['wainscot', WAINSCOT, wallBandPal({ wall: f, base: f }, f)], ['rail', WAINSCOT_RAIL, wallBandPal({ wall: f, base: f }, f)],
    ['cap', CAP_TOP, capPal(f)], ['capEdge', CAP_EDGE, capPal(f)], ['capCorner', CAP_CORNER, capPal(f)], ['eave', EAVE_SHEET, eavePal(f)], ['sill', SILL, eavePal(f)],
    ['cobweb', COBWEB, eavePal(f)], ['dust', DUSTBALL, eavePal(f)], ['stepWood', STEP_WOOD, stepPal(f)], ['stepTile', STEP_TILE, stepPal(f)], ['post', DOOR_POST, postPal(f, f)], ['lintel', LINTEL, postPal(f, f)],
    ['wet', PAVING_WET, { s: f }],
  ];
  for (const k of ASPHALT_CRACKS.keys()) out.push([`crack${k}`, ASPHALT_CRACKS[k], asphaltPal(f)]);
  for (const [k, g] of Object.entries(WALLPAPER)) out.push([`paper.${k}`, g, wallPal(f, f)]);
  return out;
}
