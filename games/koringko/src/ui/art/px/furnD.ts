/**
 * 가구 손찍기 격자 4: 집 밖 (전봇대 · 가로등 · 나무 · 대문 · 이웃집 담 · 구멍가게 · 병원 · 학교 · 정류장 · 벤치 · 놀이 기구 ·
 * 찻길 · 모래밭 · 우물 · 초가 · 돌담 · 이정표 · 리어카 · 장독 · 집 앞면 · 이삿짐 트럭).
 * 큰 건물은 부분 격자(창 · 간판 · 문 · 차양 …)를 자리에 맞춰 붙여 만든다 (붙이는 자리 계산만 코드).
 */
import { hex, mix, shade, type Color } from '../paint.ts';
import { type Grid, type Palette } from './grid.ts';
import { woodPal, type Sliced } from './furnA.ts';
import { CLUMP_L, CLUMP_M, CLUMP_S } from './furnC.ts';
import { type Seg } from './slice.ts';

const R = (n: number): Seg => [n, 'r'];

/** 세 단 명암 (밝음 · 바탕 · 그늘) 을 글자 셋에 */
export function tri(letters: string, base: Color, k = 0.22): Palette {
  return { [letters[0]]: shade(base, k), [letters[1]]: base, [letters[2]]: shade(base, -k) };
}

export function polePal(): Palette {
  return {
    ...tri('LCc', hex('#c2beb4'), 0.18), A: hex('#a8a8b0'), a: hex('#7a7a82'), I: hex('#f4f4f0'), i: hex('#c8c8c4'),
    T: hex('#9aa4ac'), t: shade(hex('#9aa4ac'), -0.25), U: hex('#d8dce0'), b: hex('#6a6a70'), k: hex('#2a2a30'), Y: hex('#f0d040'), z: shade(hex('#f0d040'), -0.25),
    P: hex('#f4ecd8'), p: shade(hex('#f4ecd8'), -0.15), q: hex('#8a8080'), Q: hex('#f0b0a0'), r: shade(hex('#f0b0a0'), -0.18),
  };
}

export function lampPal(on: boolean, lit: Color): Palette {
  const iron = hex('#4a5660');
  return { L: shade(iron, 0.28), M: iron, m: shade(iron, -0.22), H: hex('#5a6870'), h: shade(hex('#5a6870'), 0.25), g: shade(hex('#5a6870'), -0.25), B: on ? lit : hex('#d8dcd4'), b: on ? shade(lit, 0.4) : -1 };
}

export function treePal(leaf: Color, bark: Color): Palette {
  const iron = hex('#4a5660');
  return {
    L: shade(bark, 0.2), B: bark, b: shade(bark, -0.12), d: shade(bark, -0.32),
    G: shade(leaf, 0.22), g: shade(leaf, 0.1), H: leaf, h: shade(leaf, -0.16), e: shade(leaf, -0.36),
    O: hex('#f07a28'), o: shade(hex('#f07a28'), -0.2), m: shade(iron, -0.2), M: shade(iron, 0.15), Y: hex('#f4d050'), y: hex('#e0b838'),
  };
}

export function inkPal(c: Color): Palette {
  return { k: c };
}

export function gatePal(base: Color, wall: Color): Palette {
  const blue = hex('#3a78c8');
  return {
    B: blue, G: shade(blue, 0.18), b: shade(blue, -0.18), v: shade(blue, -0.32), k: hex('#24303e'),
    g: base, h: shade(base, -0.25), P: hex('#e8dcb8'), p: shade(hex('#e8dcb8'), -0.15), r: hex('#e84a4a'),
    M: hex('#e8dcc4'), D: hex('#7a4a3a'), d: hex('#6a3a2a'), Y: hex('#e8c860'), S: hex('#c8bca8'), s: hex('#a89c88'), w: wall,
  };
}

export function nwallPal(roof: Color, evening: boolean, lit: Color, accent: Color): Palette {
  return {
    R: roof, r: shade(roof, 0.1), h: shade(roof, -0.2), E: hex('#e8e4dc'), f: shade(hex('#e8e4dc'), -0.15), k: hex('#5a5a62'),
    W: evening ? shade(lit, 0.2) : hex('#d8eef8'), w: evening ? lit : hex('#8ab0c8'), M: hex('#3a8a5a'),
    g: shade(accent, 0.1), G: shade(accent, 0.25), H: hex('#ece2d0'),
  };
}

export function shopPal(evening: boolean, lit: Color): Palette {
  return {
    R: shade(hex('#d84a42'), 0.3), r: hex('#d84a42'), s: shade(hex('#d84a42'), -0.15), W: shade(hex('#f4f0e8'), 0.3), w: hex('#f4f0e8'), x: shade(hex('#f4f0e8'), -0.15),
    a: hex('#e8584a'), A: shade(hex('#e8584a'), 0.3), b: hex('#f0c840'), B: shade(hex('#f0c840'), 0.3), c: hex('#5a9ad8'), C: shade(hex('#5a9ad8'), 0.3),
    d: hex('#f0f0e8'), D: hex('#ffffff'), e: hex('#6ab05a'), E: shade(hex('#6ab05a'), 0.3), f: hex('#e88a3a'), F: shade(hex('#e88a3a'), 0.3), S: hex('#a8a098'),
    I: evening ? hex('#8a6a48') : hex('#3a3a44'), J: hex('#c8ccd0'), K: evening ? shade(lit, 0.3) : hex('#8a9aa8'),
  };
}

export function freezerPal(): Palette {
  return {
    X: hex('#ffffff'), G: hex('#cfe8f4'), g: shade(hex('#cfe8f4'), -0.15), '1': hex('#f0c840'), '2': hex('#e85a8a'), '3': hex('#8a5a3a'), '4': hex('#f8f8f8'), '5': hex('#6ac0e8'),
    W: hex('#f4f4f0'), w: shade(hex('#f4f4f0'), -0.14), B: hex('#3a78d8'), r: hex('#e8584a'),
  };
}

export function cratePal(): Palette {
  return { ...woodPal(hex('#c89a64')), r: hex('#e8584a'), '1': hex('#e8584a'), '2': hex('#f0a838'), B: hex('#3a8ad8'), b: shade(hex('#3a8ad8'), -0.2) };
}

export function pyeongPal(): Palette {
  return { ...woodPal(hex('#b8844a')), v: hex('#6a4426'), Y: hex('#e8c878'), y: hex('#8a6a3a'), F: hex('#7aa8d8'), f: shade(hex('#7aa8d8'), -0.2) };
}

export function hospPal(rain: boolean, accent: Color): Palette {
  const tile = rain ? hex('#d8dcdc') : hex('#eceeea');
  return {
    T: tile, t: shade(tile, -0.06), F: hex('#9aa8b0'), f: shade(hex('#9aa8b0'), -0.2), X: hex('#b8d0e0'), g: rain ? hex('#5a7488') : hex('#7aa8c8'),
    W: hex('#f8f8f8'), w: shade(hex('#f8f8f8'), -0.12), R: hex('#e03a3a'), C: hex('#c8ccd0'), c: shade(hex('#c8ccd0'), -0.2), N: hex('#3a8a7a'), k: hex('#f4f8f4'),
    A: hex('#a8c0c8'), a: shade(hex('#a8c0c8'), -0.25), i: mix(hex('#e8eed8'), hex('#8aa8b8'), 0.4), G: shade(accent, 0.24), h: shade(accent, -0.15), m: hex('#b8b4ac'),
  };
}

export function hospCrossPal(): Palette {
  return { W: hex('#f8f8f8'), w: shade(hex('#f8f8f8'), -0.12), R: hex('#e03a3a'), X: hex('#f86a6a') };
}

export function schoolPal(): Palette {
  const bw = hex('#f0e2c4');
  return {
    B: shade(bw, -0.06), b: bw, X: hex('#d0e8f4'), g: hex('#9ac4dc'), x: hex('#e8e8e0'), k: hex('#2a1c24'), D: hex('#6a5a4a'), d: shade(hex('#6a5a4a'), -0.25),
    P: hex('#f8f8f4'), p: shade(hex('#f8f8f4'), -0.15), G: hex('#6a8a9a'), M: hex('#3a8a5a'), F: hex('#d4b884'), f: hex('#c0a070'), C: hex('#cbc6bc'), c: shade(hex('#cbc6bc'), -0.2),
  };
}

export function busPal(): Palette {
  return {
    B: hex('#2a68b8'), b: shade(hex('#2a68b8'), -0.2), W: hex('#f4f4f0'), k: hex('#2a1c24'), M: hex('#9aa0a8'), P: hex('#f4f4ec'), p: shade(hex('#f4f4ec'), -0.15), l: hex('#5a6a8a'),
    S: hex('#9ab4d0'), s: hex('#8aa4c0'), T: hex('#8aa4c0'), t: shade(hex('#8aa4c0'), -0.2), m: hex('#7a8088'),
  };
}

export function benchPal(wet: boolean): Palette {
  return { ...woodPal(wet ? hex('#8a5a36') : hex('#b07a46')), i: hex('#3a4a44') };
}

export function playPal(): Palette {
  return {
    S: hex('#d8dee4'), s: hex('#b8c0c8'), t: hex('#8a929a'), Y: hex('#f0c030'), y: shade(hex('#f0c030'), 0.3), z: shade(hex('#f0c030'), -0.25),
    R: hex('#e85048'), Q: shade(hex('#e85048'), 0.4), r: shade(hex('#e85048'), -0.25), q: shade(hex('#e85048'), -0.35),
    B: hex('#3a78c8'), b: shade(hex('#3a78c8'), -0.18), v: shade(hex('#3a78c8'), -0.35), c: hex('#a8b0b8'), C: hex('#6a7078'), K: hex('#3a3a44'), k: hex('#6a6a7a'),
    P: hex('#3aa070'), p: shade(hex('#3aa070'), -0.3), G: hex('#3aa070'), g: shade(hex('#3aa070'), -0.15), d: hex('#2a3038'),
  };
}

export function junglePal(): Palette {
  const c = ['#e8584a', '#f0c030', '#3a78c8', '#3aa070'].map(hex);
  return {
    R: c[0], r: shade(c[0], -0.3), Y: c[1], y: shade(c[1], -0.3), B: c[2], b: shade(c[2], -0.3), G: shade(c[3], 0.2), g: shade(c[3], -0.15), d: hex('#2a3038'),
  };
}

export function roadPal(): Palette {
  return { C: hex('#c8c6be'), c: hex('#a8a69e'), k: hex('#8a8880'), W: hex('#e8e8e0'), w: hex('#c8c8c0'), X: shade(hex('#eeeee6'), 0.3), Y: hex('#e8c040') };
}

export function sandboxPal(floor: Color): Palette {
  const log = hex('#a87444');
  return {
    L: shade(log, 0.15), l: shade(log, -0.15), o: shade(log, -0.35), S: shade(floor, 0.1), s: shade(floor, 0.02),
    R: hex('#e8584a'), r: hex('#f88a7a'), Y: hex('#f0c030'),
  };
}

export function rutsPal(floor: Color, grass: Color): Palette {
  return { h: shade(floor, -0.1), d: shade(floor, -0.2), g: shade(floor, 0.12), L: shade(grass, 0.1), l: shade(grass, -0.1) };
}

export function wellPal(stone: Color): Palette {
  return { ...woodPal(hex('#7a5a3a')), G: shade(stone, 0.22), S: shade(stone, 0.06), s: shade(stone, -0.14), n: shade(stone, -0.32), k: hex('#1e2a32'), b: hex('#8aa8c0'), r: hex('#d8c8a0'), m: hex('#5a5a5a') };
}

export function stonePal(stone: Color, mud: Color, grass: Color): Palette {
  return { m: shade(mud, -0.1), G: shade(stone, 0.18), S: stone, s: shade(stone, -0.15), n: shade(stone, -0.3), L: shade(grass, 0.1), l: shade(grass, -0.1) };
}

export function signPal(): Palette {
  const board = hex('#c8a46a');
  return {
    ...woodPal(hex('#8a6a44')), B: board, b: shade(board, 0.2), A: shade(board, -0.06), k: hex('#4a3020'),
    S: hex('#a8b0b8'), s: shade(hex('#a8b0b8'), -0.2), R: hex('#d83a3a'), Y: hex('#f4d040'), P: hex('#f4f0e4'), p: shade(hex('#f4f0e4'), -0.12), r: hex('#d83a3a'),
  };
}

export function cartPal(): Palette {
  return {
    ...woodPal(hex('#9a7044')), M: hex('#4a4a50'), k: hex('#2a2a30'), m: hex('#8a8a90'), S: hex('#c8c8d0'), o: hex('#e8e8f0'),
    Y: hex('#d8b860'), y: shade(hex('#d8b860'), -0.15), z: shade(hex('#d8b860'), -0.3), L: hex('#8ab85a'), l: hex('#7aa84a'), e: shade(hex('#7aa84a'), -0.25),
  };
}

export function crockPal(stand: Color): Palette {
  const brown = hex('#6a3a24');
  return { G: shade(brown, 0.3), O: brown, o: shade(brown, -0.15), v: shade(brown, -0.3), X: shade(brown, 0.55), S: stand, s: shade(stand, -0.1), n: shade(stand, -0.3) };
}

export function thatchPal(evening: boolean, stone: Color): Palette {
  const straw = hex('#c8a25a');
  const mud = evening ? hex('#d8ccb4') : hex('#ece2c8');
  return {
    G: shade(straw, 0.24), S: straw, s: shade(straw, -0.18), d: shade(straw, -0.42), r: shade(straw, -0.28),
    M: mud, m: shade(mud, -0.08), ...woodPal(hex('#7a5a3a')), P: evening ? hex('#ffd890') : hex('#f6eed8'), k: shade(evening ? hex('#ffd890') : hex('#f6eed8'), -0.28),
    D: hex('#5a4030'), L: hex('#8a9a4a'), l: shade(hex('#8a9a4a'), -0.2), Y: hex('#c8a060'), y: shade(hex('#c8a060'), -0.2),
    X: hex('#f4f4ee'), n: shade(stone, -0.3),
  };
}

/** 초가 지붕 볏짚 (빛 G · 결 S s · 처마 끝 d · 용마름 R r) */
export function thatchRoofPal(): Palette {
  const straw = hex('#c8a25a');
  return { G: shade(straw, 0.24), S: straw, s: shade(straw, -0.14), d: shade(straw, -0.42), R: shade(straw, -0.08), r: shade(straw, -0.3) };
}

/** 시소 널판 (초록) */
export function plankPal(): Palette {
  const g = hex('#3aa070');
  return { Q: shade(g, 0.3), P: g, p: shade(g, -0.3) };
}

export function marPal(): Palette {
  return { G: hex('#d0a070'), W: hex('#a87848'), w: hex('#7a5430'), k: hex('#3a2a20') };
}

export function stepStonePal(): Palette {
  return { S: hex('#c8c0b0'), s: hex('#b8b0a0'), n: hex('#8a8478'), X: hex('#f4f4ee'), k: hex('#3a3a3e') };
}

export function facadePal(): Palette {
  const roof = hex('#7a4a3a');
  const wall = hex('#e8dcc4');
  return {
    R: roof, r: shade(roof, -0.06), h: shade(roof, -0.3), W: wall, w: shade(wall, -0.06), k: hex('#3a2a28'), L: hex('#ffd890'), l: shade(hex('#ffd890'), -0.2), X: hex('#fff0b0'),
    F: hex('#8a6a4a'), f: shade(hex('#8a6a4a'), -0.25),
  };
}

export function truckPal(): Palette {
  const box = hex('#f0ece4');
  const cab = hex('#4a7ac8');
  return {
    X: hex('#ffffff'), W: box, w: shade(box, -0.15), B: hex('#5a8ad8'), b: hex('#5a8ad8'),
    C: cab, Q: shade(cab, 0.25), c: shade(cab, -0.22), g: hex('#bfe0ff'), k: hex('#2a2a32'), Y: hex('#f8e8a0'), S: hex('#c8c8d0'),
  };
}

export function signboardPal(): Palette {
  return { B: hex('#2a5aa8'), b: shade(hex('#2a5aa8'), -0.2), L: hex('#4a7ad0'), Q: shade(hex('#e8584a'), 0.35), R: hex('#e8584a'), r: shade(hex('#e8584a'), -0.2), l: hex('#3a7a2a') };
}

export function shrubPal(accent: Color): Palette {
  return { G: shade(accent, 0.22), g: accent, h: shade(accent, -0.2) };
}


/** 가로수 밑동 철망 덮개 */
export const GRATE: Grid = [
  '#######################',
  '#mMmMmMmMmMmMmMmMmMmMm#',
  '#mMmMmMmMmMmMmMmMmMmMm#',
  '#mMmMmMmMmMmMmMmMmMmMm#',
  '#######################',
];

/** 은행잎 떨어진 자리 */
export const LEAF_FALL: Grid = [
  '..Y.......y.........Y..',
  'y.....Y.......y.Y......',
  '....y......Y.......y...',
];

/** 간판 글씨 (9줄, 한글 모양 덩어리 다섯) */
export const GLYPHS9: Grid = [
  'kkkkkk..k..kkkkk.....k..kkkkkk..k..k.kkkkk..kk..kkkkkk..k.',
  '.....k..k..k.........k.......k..k..k.....k..k........k..k.',
  '.....k..kk.k.........kk.....k...kk.k.....k..kk......k...kk',
  '....k...k..kkkkk..kkkk.....k....k..kkkkkkk..k......k....k.',
  '...k....k...........k.....k.....k........k..k.....k.....k.',
  '........k..kkkkkk...k.....k.....k..kkkkkk...k...........k.',
  'kkkkkk..k.......k...k..kkkkkk...k.......k...k..kkkkkk...k.',
  '.....k..k.......k...k.......k...k.......k...k.......k...k.',
  '.....k..k..kkkkkk...k.......k...k..kkkkkk...k.......k...k.',
];

/** 작은 글씨 (5줄) */
export const GLYPHS5: Grid = [
  'kkk.k.k.kk.k.kkk.k.kk.k.kkk.k.',
  '..k.k.k....k...k.k.k..k...k.kk',
  '.k..kk.kkk.k..k..k.kkkk..k..k.',
  'k...k.k..k.k.k...k...k..k...k.',
  'kkk.k.kkkk.k.kkk.k.kkk..kkk.k.',
];

/** 파란 철 대문 한 짝: 뾰족 창살 머리 · 위 창살 (뒤가 어둡게 비친다) · 아래 볼록 철판 */
export const GATE_LEAF: Sliced = {
  g: [
    '.#...#...#...#...#...#..',
    '#B#.#B#.#B#.#B#.#B#.#B#.',
    '########################',
    '#GGGGGGGGGGGGGGGGGGGGGb#',
    '#G####################b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G#kGBkkGBkkGBkkGBkkG#b#',
    '#G####################b#',
    '#GBBBBBBBBBBBBBBBBBBBBb#',
    '#GBBBBBBBBBBBBBBBBBBBBb#',
    '#GB##################Bb#',
    '#GB#GGGGGGGGGGGGGGGG#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#GBBBBBBBBBBBBBBb#Bb#',
    '#GB#bbbbbbbbbbbbbbbb#Bb#',
    '#GB##################Bb#',
    '#GBBBBBBBBBBBBBBBBBBBBb#',
    '#bbbbbbbbbbbbbbbbbbbbbb#',
    '########################',
  ],
  cols: [5, R(12), 7],
  rows: [5, R(14), 5, R(10), 5],
};

/** 창살 가운데 둥근 장식 */
export const GATE_KNOB: Grid = [
  '.###.',
  '#GBb#',
  '#BBb#',
  '#bbv#',
  '.###.',
];

/** 대문 기둥 갓돌 */
export const PILLAR_CAP: Grid = [
  '#########',
  '#GGGGGGG#',
  '#ggggggg#',
  '#hhhhhhh#',
  '#########',
];

/** 문패 */
export const NAMEPLATE_S: Grid = [
  '#####',
  '#PPP#',
  '#kkP#',
  '#PPP#',
  '#kkP#',
  '#PPP#',
  '#kPP#',
  '#ppp#',
  '#####',
];

/** 초인종 */
export const BELL: Grid = [
  '####',
  '#PP#',
  '#Pr#',
  '#pp#',
  '####',
];

/** 열린 대문 틈으로 보이는 마당 · 현관문 · 계단 (위 정렬, 아래로 계단 되풀이) */
export const YARD_VIEW: Sliced = {
  g: [
    'DDDDDDDDDDDDDDDDDDDDDDDDDDD',
    'MMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MMM#################MMMMMMM',
    'MMM#ddddddddddddddd#MMMMMMM',
    'MMM#dDDDDDDDDDDDDDd#MMMMMMM',
    'MMM#dD#########DDDd#MMMMMMM',
    'MMM#dD#dddddddd#DDd#MMMMMMM',
    'MMM#dD#dddddddd#DDd#MMMMMMM',
    'MMM#dD#ddddddYd#DDd#MMMMMMM',
    'MMM#dD#dddddddd#DDd#MMMMMMM',
    'MMM#dD#dddddddd#DDd#MMMMMMM',
    'MMM#dD##########DDd#MMMMMMM',
    'MMM#dDDDDDDDDDDDDDd#MMMMMMM',
    'MMM#ddddddddddddddd#MMMMMMM',
    'MMM#################MMMMMMM',
    'MMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'GGGGGGGGGGGGGGGGGGGGGGGGGGG',
    'gGGgGGGgGGGGgGGGGgGGgGGGgGG',
    'GGGG#####################GG',
    'GgGG#SSSSSSSSSSSSSSSSSSS#GG',
    'GGGG#sssssssssssssssssss#gG',
    'gGGG#SSSSSSSSSSSSSSSSSSS#GG',
    'GGGG#sssssssssssssssssss#GG',
    'GGgG#SSSSSSSSSSSSSSSSSSS#Gg',
    'GGGG#sssssssssssssssssss#GG',
  ],
  cols: [4, R(16), 7],
  rows: [22, R(2), 5],
};

/** 기와 지붕 (반복) */
export const ROOF_TILES: Grid = [
  'RRRRRRRRRR',
  'rRRRRrRRRR',
  'rRRRRrRRRR',
  'hhhhhhhhhh',
  'RRrRRRRrRR',
  'RRrRRRRrRR',
  'hhhhhhhhhh',
  'rRRRRrRRRR',
  'rRRRRrRRRR',
  'hhhhhhhhhh',
  'RRrRRRRrRR',
  'RRrRRRRrRR',
];

/** 이웃집 창 (방범창 살 k · 유리 W 위 반짝 · w 유리) */
export const HOUSE_WIN: Grid = [
  '########################',
  '#EEEEEEEEEEEEEEEEEEEEEf#',
  '#EkWkWkWkWkWkWkWkWkW#Ef#',
  '#EkWWkWWkWWkWWkWWkWWkEf#',
  '#EkWWkWWkWWkWWkWWkWWkEf#',
  '#EkwwkwwkwwkwwkwwkwwkEf#',
  '#EkwwkwwkwwkwwkwwkwwkEf#',
  '#EkwwkwwkwwkwwkwwkwwkEf#',
  '#EkwwkwwkwwkwwkwwkwwkEf#',
  '#EkwwkwwkwwkwwkwwkwwkEf#',
  '#EkwwkwwkwwkwwkwwkwwkEf#',
  '#EkwwkwwkwwkwwkwwkwwkEf#',
  '#fffffffffffffffffffff##',
  '########################',
];

/** 초록 철망 (반복) */
export const MESH: Grid = [
  'M.....',
  '.M...M',
  '..M.M.',
  '...M..',
  '..M.M.',
  '.M...M',
];

/** 줄무늬 차양 (빨강 · 흰 줄 8px, 아래 물결 단) */
export const AWNING: Grid = [
  'RRRRRRRRWWWWWWWW',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'rrrrrrrrwwwwwwww',
  'ssssssssxxxxxxxx',
  '.ssssss..xxxxxx.',
  '..ssss....xxxx..',
];

/** 가게 선반 한 칸 (물건 · 선반 널, 반복) */
export const GOODS: Grid = [
  'aaa.bb.ccc.dd.eee.ff.aa.bbb.cc.dd.',
  'aAa.bB.cCc.dD.eEe.fF.aA.bBb.cC.dD.',
  'aaa.bb.ccc.dd.eee.ff.aA.bbb.cc.dd.',
  'aaa.bb.ccc.dd.eee.ff.aa.bbb.cc.dd.',
  'aaa.bb.ccc.dd.eee.ff.aa.bbb.cc.dd.',
  '##################################',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
  '..................................',
  '..................................',
];

/** 아이스크림 냉장고: 유리 뚜껑 안 아이스크림 · 흰 몸통 · 파란 띠 · 빨간 글씨 */
export const FREEZER: Grid = [
  '.######################################.',
  '#XXXXXXXXXXXXXXGGGGGGGGGGGGGGGGGGGGGGGg#',
  '#G1##2##3##4##5##1##2##3##4##GGGGGGGGGg#',
  '#G11#22#33#44#55#11#22#33#44#GGGGGGGGGg#',
  '#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#',
  '#gggggggggggggggggggggggggggggggggggggg#',
  '########################################',
  '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWw#',
  '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWw#',
  '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWw#',
  '#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBw#',
  '#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBw#',
  '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWw#',
  '#WWWrrrWrWWrrWrWrWWWWWWWWWWWWWWWWWWWWWw#',
  '#WWWWrWWrWWrWWrrWWWWWWWWWWWWWWWWWWWWWWw#',
  '#WWWrrrWrrWrrWrWrWWWWWWWWWWWWWWWWWWWWWw#',
  '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#',
  '.######################################.',
];

/** 라면 상자 · 과일 바구니 (1 빨강 · 2 주황) · 파란 통 */
export const CRATES: Grid = [
  '.##############.....................',
  '#OOOOOOOOOOOOOw#....................',
  '#OrrrrrrrrrrrOw#....................',
  '#OrrrrrrrrrrrOw#.##################.',
  '#OOOOOOOOOOOOOw##WWWWWWWWWWWWWWWWw#.',
  '#WWWWWWWWWWWWWw##W1#2#1#2#1#2#WWWw#.',
  '#WWWWWWWWWWWWWw##W11#22#11#22#WWWw#.',
  '#WWWWWWWWWWWWWw##WWWWWWWWWWWWWWWWw#.',
  '#WWWWWWWWWWWWWw##WWWWWWWWWWWWWWWWw#.',
  '#wwwwwwwwwwwwww##wwwwwwwwwwwwwwwww#.',
  '###############.###################.',
  '..#BBBBBBBB#........................',
  '.#BBBBBBBBBB#.......................',
  '.#BBBBBBBBBB#.......................',
  '.#BBBBBBBBBB#.......................',
  '.#BBBBBBBBBB#.......................',
  '.#bbbbbbbbbb#.......................',
  '..##########........................',
];

/** 평상 (나무 판 · 다리) 위 바둑판 Y · 부채 F */
export const PYEONGSANG: Grid = [
  '........#####................############.................',
  '.......#FfFfF#...............#YyYyYyYyYY#.................',
  '.......#FFFFF#...............#YyYyYyYyYY#.................',
  '........##F##................#YYYYYYYYYY#.................',
  '##########################################################',
  '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO#',
  '#OOOOOOwOOOOOOwOOOOOOwOOOOOOwOOOOOOwOOOOOOwOOOOOOwOOOOOOw#',
  '#WWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWw#',
  '#WWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWw#',
  '#WWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWw#',
  '#WWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWw#',
  '#WWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWwWWWWWWw#',
  '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#',
  '##########################################################',
  '..#vv#..............................................#vv#..',
  '..#vv#..............................................#vv#..',
  '..#vv#..............................................#vv#..',
  '..####..............................................####..',
];

/** 병원 창 (회색 틀 · 하늘 비친 유리) */
export const HOSP_WIN: Grid = [
  '##############',
  '#FFFFFFFFFFFf#',
  '#F#####F####f#',
  '#F#XXXXFXXX#f#',
  '#F#ggggFggg#f#',
  '#F#ggggFggg#f#',
  '#F#ggggFggg#f#',
  '#F#ggggFggg#f#',
  '#F#ggggFggg#f#',
  '#F#####F####f#',
  '#fffffffffff##',
  '##############',
];

/** 빨간 십자 간판 (20×20) */
export const RED_CROSS: Grid = [
  '####################',
  '#WWWWWWWWWWWWWWWWWw#',
  '#WWWWWWW####WWWWWWw#',
  '#WWWWWWW#XR#WWWWWWw#',
  '#WWWWWWW#XR#WWWWWWw#',
  '#WWWWWWW#XR#WWWWWWw#',
  '#WWW#####XR#####WWw#',
  '#WWW#RRRRRRRRRRRWWw#',
  '#WWW#RRRRRRRRRRRWWw#',
  '#WWW#RRRRRRRRRRRWWw#',
  '#WWW#####XR#####WWw#',
  '#WWWWWWW#XR#WWWWWWw#',
  '#WWWWWWW#XR#WWWWWWw#',
  '#WWWWWWW#XR#WWWWWWw#',
  '#WWWWWWW#XR#WWWWWWw#',
  '#WWWWWWW####WWWWWWw#',
  '#WWWWWWWWWWWWWWWWWw#',
  '#wwwwwwwwwwwwwwwwww#',
  '####################',
  '....................',
];

/** 병원 차양 (콘크리트 판 · 초록 이름 띠) */
export const CANOPY: Sliced = {
  g: [
    '##########',
    '#CCCCCCCC#',
    '#CNNNNNNC#',
    '#CNNNNNNC#',
    '#CNNNNNNC#',
    '#CNNNNNNC#',
    '#CNNNNNNC#',
    '#cccccccc#',
    '##########',
  ],
  cols: [2, R(6), 2],
  rows: [9],
};

/** 유리 자동문 한 짝 (안 불빛 · 비친 빛줄) */
export const GLASS_DOOR: Sliced = {
  g: [
    '###############',
    '#AAAAAAAAAAAAa#',
    '#A###########a#',
    '#A#iiiXiiiiii#a',
    '#A#iiiiXiiiii#a',
    '#A#iXiiiXiiii#a',
    '#A#iiXiiiXiii#a',
    '#A#iiiXiiiiii#a',
    '#A#iiiiiiiiii#a',
    '#A#iiiiiiiiii#a',
    '#A#iiiiiiiiii#a',
    '#A###########a#',
    '#aaaaaaaaaaaaa#',
    '###############',
  ],
  cols: [9, R(4), 2],
  rows: [8, R(3), 3],
};

/** 학교 창 */
export const SCHOOL_WIN: Grid = [
  '##########',
  '#XXXXXXXX#',
  '#gggggggg#',
  '#gggggggg#',
  '#gggggggg#',
  '#gggggggg#',
  '#gggggggg#',
  '#gggggggg#',
  '#gggggggg#',
  '##########',
];

/** 학교 시계탑: 둥근 시계 (12시 · 3시 바늘) · 현관문 */
export const CLOCK_TOWER: Grid = [
  '.######################.',
  '#bbbbbbbbbbbbbbbbbbbbbb#',
  '#BBBBBBBBBBBBBBBBBBBBBB#',
  '#BBBBBBBBB#####BBBBBBBB#',
  '#BBBBBBB##XXXXX##BBBBBB#',
  '#BBBBBB#XXXXkXXXx#BBBBB#',
  '#BBBBBB#XXXXkXXXx#BBBBB#',
  '#BBBBB#XXXXXkXXXXx#BBBB#',
  '#BBBBB#XXXXXkXXXXx#BBBB#',
  '#BBBBB#XXXXXkkkkXx#BBBB#',
  '#BBBBB#XXXXXXXXXXx#BBBB#',
  '#BBBBB#XXXXXXXXXxx#BBBB#',
  '#BBBBBB#XXXXXXXxx#BBBBB#',
  '#BBBBBB#xXXXXXxxx#BBBBB#',
  '#BBBBBBB##xxxxx##BBBBBB#',
  '#BBBBBBBBB#####BBBBBBBB#',
  '#BBBBBBBBBBBBBBBBBBBBBB#',
  '#BBBBBBBBBBBBBBBBBBBBBB#',
  '#BBBBBBBBBBBBBBBBBBBBBB#',
  '#BBBBBBBBBBBBBBBBBBBBBB#',
  '#BBBBBBBBBBBBBBBBBBBBBB#',
  '#BBBBB############BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
  '#BBBBB#DDDDDdDDDD#BBBBB#',
];

/** 학교 이름판 (세로) */
export const NAME_BOARD: Grid = [
  '########',
  '#PPPPPP#',
  '#PkkkkP#',
  '#PPPPPP#',
  '#PPPPPP#',
  '#PkkkkP#',
  '#PPPPPP#',
  '#PPPPPP#',
  '#PkkkkP#',
  '#PPPPPP#',
  '#PPPPPP#',
  '#PkkkkP#',
  '#PPPPPP#',
  '#PPPPPP#',
  '#PkkkkP#',
  '#PPPPPP#',
  '#pppppp#',
  '########',
];

/** 밀어 여는 철문 (반쯤 열림 · 바퀴) */
export const SLIDE_GATE: Grid = [
  '##########################',
  '#GGGGGGGGGGGGGGGGGGGGGGGg#',
  '##########################',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '.#g#.#g#.#g#.#g#.#g#.#g#..',
  '##########################',
  '#GGGGGGGGGGGGGGGGGGGGGGGg#',
  '##########################',
  '.###...............###....',
  '#kkk#.............#kkk#...',
  '.###...............###....',
];

/** 버스 정류장 표지판: 파란 판 (버스 그림) · 노선표 · 기둥 (아래로 기둥 되풀이) */
export const BUS_SIGN: Sliced = {
  g: [
    '##############',
    '#BBBBBBBBBBBb#',
    '#BB########bb#',
    '#BB#WWWWWW#bb#',
    '#BB#WBBBBW#bb#',
    '#BB#WBBBBW#bb#',
    '#BB#WWWWWW#bb#',
    '#BB#k####k#bb#',
    '#BB########bb#',
    '#bbbbbbbbbbbb#',
    '##############',
    '.....#MM#.....',
    '.....#MM#.....',
    '.....#MM#.....',
    '..##########..',
    '.#PPPPPPPPPP#.',
    '.#PlllllllPP#.',
    '.#PPPPPPPPPP#.',
    '.#PllllllPPP#.',
    '.#PPPPPPPPPP#.',
    '.#PlllllllPP#.',
    '.#PPPPPPPPPP#.',
    '.#PllllllPPP#.',
    '.#PPPPPPPPPP#.',
    '.#PlllllllPP#.',
    '.#PPPPPPPPPP#.',
    '.#pppppppppp#.',
    '..##########..',
    '.....#MM#.....',
  ],
  cols: [14],
  rows: [28, R(1)],
};

/** 정류장 철제 의자 */
export const BUS_SEAT: Sliced = {
  g: [
    '.########.',
    '#SSSSSSSs#',
    '#SSSSSSSs#',
    '#ssssssss#',
    '.#M####M#.',
    '.#M#..#M#.',
    '##########',
    '#TTTTTTTt#',
    '#TTTTTTTt#',
    '#tttttttt#',
    '##########',
    '.#M#..#M#.',
    '.#m#..#m#.',
  ],
  cols: [3, R(4), 3],
  rows: [11, R(1), 1],
};

/** 나무 벤치: 등받이 판 둘 · 쇠 팔걸이 · 앉는 판 · 다리 */
export const BENCH: Sliced = {
  g: [
    '.##################.',
    '#i#OOOOOOOOOOOOO#i#.',
    '#i#WWWWWWWWWWWWW#i#.',
    '#i#wwwwwwwwwwwww#i#.',
    '#i###############i#.',
    '#i#OOOOOOOOOOOOO#i#.',
    '#i#WWWWWWWWWWWWW#i#.',
    '#i#wwwwwwwwwwwww#i#.',
    '#i###############i#.',
    '#i#.............#i#.',
    '####################',
    '#GGGGGGGGGGGGGGGGGG#',
    '#OOOOOOOOOOOOOOOOOO#',
    '#OOOOOOOOOOOOOOOOOO#',
    '#OOOOOOOOOOOOOOOOOO#',
    '####################',
    '#WWWWWWWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWWWWWWW#',
    '#wwwwwwwwwwwwwwwwww#',
    '####################',
    '.#i#............#i#.',
    '.#i#............#i#.',
    '.#i#............#i#.',
    '.#i#............#i#.',
    '.###............###.',
    '....................',
  ],
  cols: [4, R(12), 4],
  rows: [26],
};

/** 그네 A 기둥 (위 꼭지 · 두 다리 되풀이 · 굽) */
export const SWING_FRAME: Sliced = {
  g: [
    '....####....',
    '...#BBbv#...',
    '..#BBbBbv#..',
    '.#Bbv##Bbv#.',
    '.#Bbv#.#Bbv#',
    '#Bbv#..#Bbv#',
    '#Bbv#..#Bbv#',
    '#####..#####',
  ],
  cols: [12],
  rows: [6, R(1), 1],
};

/** 그네 가로 막대 (되풀이) */
export const SWING_BAR: Grid = [
  '#####',
  'QQQQQ',
  'RRRRR',
  'RRRRR',
  'rrrrr',
  '#####',
];

/** 그네 한 칸: 쇠사슬 둘 (3줄 되풀이) · 고무 앉을판 */
export const SWING_SEAT: Sliced = {
  g: [
    '..C..........C....',
    '..c..........c....',
    '..c..........c....',
    '..c..........c....',
    '################..',
    '#kkkkkkkkkkkkkk#..',
    '#KKKKKKKKKKKKKK#..',
    '#KKKKKKKKKKKKKK#..',
    '################..',
  ],
  cols: [18],
  rows: [R(3), 6],
};

/** 연석 (16px 마다 이음) */
export const CURB: Grid = [
  'CCCCCCCCCCCCCCCc',
  'CCCCCCCCCCCCCCCc',
  'CCCCCCCCCCCCCCCc',
  'kkkkkkkkkkkkkkkk',
];

/** 가운데 흰 점선 (18px 되풀이) */
export const DASH: Grid = [
  '....WWWWWWWWWW....',
  '....wwwwwwwwww....',
];

/** 횡단보도 흰 줄 (9px 되풀이, 군데군데 닳음) */
export const ZEBRA: Grid = [
  '...XWWWw.',
  '...XWWWw.',
  '...XWWWw.',
  '...XW.Ww.',
  '...XWWWw.',
  '...XWWWw.',
  '...XWW.w.',
  '...XWWWw.',
];

/** 젖은 찻길 번들거림 (반복) */
export const PUDDLE_STREAK: Grid = [
  'wwwwwwwwww......................',
  '................................',
  '.............wwwwwwwwwwwwww.....',
  '................................',
  '................................',
  'wwwww...................wwwwwww.',
];

/** 모래밭: 통나무 테 (6px 마다 마디) · 고운 모래 */
export const SANDBOX: Sliced = {
  g: [
    '.##################.',
    '#LLlLLLLLlLLLLLlLLL#',
    '#LooooooooooooooooL#',
    '#Lo##############oL#',
    '#Lo#SSSSSSsSSSSS#oL#',
    '#lo#SSSSSSSSSSSS#ol#',
    '#Lo#SSSsSSSSSSSS#oL#',
    '#Lo#SSSSSSSSSsSS#oL#',
    '#lo#SSSSSSSSSSSS#ol#',
    '#Lo#SsSSSSSSSSSS#oL#',
    '#Lo##############oL#',
    '#LooooooooooooooooL#',
    '#llLlllllLlllllLlll#',
    '.##################.',
  ],
  cols: [4, R(12), 4],
  rows: [4, R(6), 4],
};

/** 빨간 양동이 · 노란 삽 · 모래성 */
export const SAND_TOYS: Grid = [
  '..................#.......',
  '.................#R#......',
  '................#ss#......',
  '...............#SSSs#.....',
  '#######.......#SSSSSs#....',
  '#rRRRr#......#SSSSSSss#...',
  '#RRRRR#.......########....',
  '#RRRRR#..#Y#..............',
  '#rrrrr#.#YY#..............',
  '#######.#Y#...............',
  '.......#Y#................',
  '......#Y#.................',
];

/** 흙길 바큇자국 두 줄 · 그 사이 풀 포기 */
export const RUTS: Sliced = {
  g: [
    '................................................',
    '................................................',
    '................................................',
    '................................................',
    '................................................',
    'hhhhhhhhhhhh........................hhhhhhhhhhhh',
    'ddddddddddddhhhhhhhhhhhhhhhhhhhhhhhhdddddddddddd',
    'dddddddddddddddddddddddddddddddddddddddddddddddd',
    'dddddddddddddddddddddddddddddddddddddddddddddddd',
    'ggggggggggggddddddddddddddddddddddddgggggggggggg',
    '............gggggggggggggggggggggggg............',
    '................................................',
    '......lLl...........lLl..............lLl........',
    '.......l.............l................l.........',
    '................................................',
    '............hhhhhhhhhhhhhhhhhhhhhhhh............',
    'hhhhhhhhhhhhddddddddddddddddddddddddhhhhhhhhhhhh',
    'dddddddddddddddddddddddddddddddddddddddddddddddd',
    'dddddddddddddddddddddddddddddddddddddddddddddddd',
    'ddddddddddddggggggggggggggggggggggggdddddddddddd',
    'gggggggggggg........................gggggggggggg',
    '................................................',
    '................................................',
    '................................................',
  ],
  cols: [R(48)],
  rows: [R(4), 7, R(4), 7, R(2)],
};

/** 돌담: 둥근 돌 (빛 G · 바탕 S · 그늘 s · 틈 n) · 흙 m · 위에 풀 */
export const STONE_ROW: Sliced = {
  g: [
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '..lLl.......lLl........lLl.....lLl..',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'nGGSSSSsnnGGSSSSsnnGGSSSSsnnGGSSSSsn',
    'nGSSSSSsnnGSSSSSsnnGSSSSSsnnGSSSSSsn',
    'nSSSSSssnnSSSSSssnnSSSSSssnnSSSSSssn',
    'nsSSSsssnnsSSSsssnnsSSSsssnnsSSSsssn',
    'nnsssssnnnnsssssnnnnsssssnnnnsssssnn',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'SSSsnnGGSSSSsnnGGSSSSsnnGGSSSSsnnGGS',
    'SSSsnnGSSSSSsnnGSSSSSsnnGSSSSSsnnGSS',
    'SSssnnSSSSSssnnSSSSSssnnSSSSSssnnSSS',
    'SsssnnsSSSsssnnsSSSsssnnsSSSsssnnsSS',
    'sssnnnnsssssnnnnsssssnnnnsssssnnnnss',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'nGGSSSSsnnGGSSSSsnnGGSSSSsnnGGSSSSsn',
    'nGSSSSSsnnGSSSSSsnnGSSSSSsnnGSSSSSsn',
    'nSSSSSssnnSSSSSssnnSSSSSssnnSSSSSssn',
    'nsSSSsssnnsSSSsssnnsSSSsssnnsSSSsssn',
    'nnsssssnnnnsssssnnnnsssssnnnnsssssnn',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'SSSsnnGGSSSSsnnGGSSSSsnnGGSSSSsnnGGS',
    'SSSsnnGSSSSSsnnGSSSSSsnnGSSSSSsnnGSS',
    'SSssnnSSSSSssnnSSSSSssnnSSSSSssnnSSS',
    'SsssnnsSSSsssnnsSSSsssnnsSSSsssnnsSS',
    'sssnnnnsssssnnnnsssssnnnnsssssnnnnss',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'nGGSSSSsnnGGSSSSsnnGGSSSSsnnGGSSSSsn',
    'nGSSSSSsnnGSSSSSsnnGSSSSSsnnGSSSSSsn',
    'nSSSSSssnnSSSSSssnnSSSSSssnnSSSSSssn',
    'nsSSSsssnnsSSSsssnnsSSSsssnnsSSSsssn',
    'nnsssssnnnnsssssnnnnsssssnnnnsssssnn',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
  ],
  cols: [R(36)],
  rows: [R(6), 30],
};

/** 옛 마을 이정표: 나무 말뚝 · 화살 판 둘 (글씨 k) */
export const SIGNPOST: Sliced = {
  g: [
    '........................................',
    '........................................',
    '........................................',
    '.................#######................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '...##################wv#................',
    '..#bbbbbbbbbbbbbbbbb#wv#................',
    '.#BkkBkBkkBkBkkBBBBB#wv#................',
    '#BBkBkkBBkBkkBkBBBBB#wv#................',
    '.#BkkBkBBkkBkkBkBBBB#wv#................',
    '..#AAAAAAAAAAAAAAAAA#wv#................',
    '...##################wv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OW##################..',
    '.................#OW#bbbbbbbbbbbbbbbb#..',
    '.................#OW#BkBkkBkkBkBBBBBBB#.',
    '.................#OW#BkkBkBkkBBBBBBBBBB#',
    '.................#OW#BkBkkBkBBBBBBBBBB#.',
    '.................#OW#AAAAAAAAAAAAAAAA#..',
    '.................#OW##################..',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
    '.................#OWWwv#................',
  ],
  cols: [40],
  rows: [30, R(1)],
};

/** 어린이 보호구역 표지판: 빨간 세모 안 아이 둘 · 글씨 판 · 기둥 */
export const SCHOOL_SIGN: Sliced = {
  g: [
    '...................#....................',
    '..................#R#...................',
    '.................#RRR#..................',
    '.................#RYR#..................',
    '................#RYYYR#.................',
    '................#RYkYR#.................',
    '...............#RYYkYYR#................',
    '...............#RYkkkYR#................',
    '..............#RYYYkYYYR#...............',
    '..............#RYYkYkYYR#...............',
    '.............#RYYYkYkYYYR#..............',
    '.............#RYYYYYYYYYR#..............',
    '............#RYYYYYYYYYYYR#.............',
    '............#RRRRRRRRRRRRR#.............',
    '...........#RRRRRRRRRRRRRRR#............',
    '...........#################............',
    '..................#Ss#..................',
    '..................#Ss#..................',
    '..................#Ss#..................',
    '..................#Ss#..................',
    '.........######################.........',
    '.........#PPPPPPPPPPPPPPPPPPPP#.........',
    '.........#PrrPrPrrPrPrrPrPrrPP#.........',
    '.........#PrPrrPrPPrrPrPrrPrPP#.........',
    '.........#pppppppppppppppppppp#.........',
    '.........######################.........',
    '..................#Ss#..................',
  ],
  cols: [40],
  rows: [26, R(1)],
};

/** 큰 옹기 항아리 (뚜껑 · 윤 X) */
export const CROCK_BIG: Grid = [
  '......########......',
  '.....#vvvvvvvv#.....',
  '....#OOOOOOOOOO#....',
  '.....##########.....',
  '...##GGOOOOOOOO##...',
  '..#GGOOOOOOOOOOoo#..',
  '.#GXOOOOOOOOOOOOoo#.',
  '.#GOOOOOOOOOOOOOoo#.',
  '#GOOOOOOOOOOOOOOOoo#',
  '#GOOOOOOOOOOOOOOOoo#',
  '#OOOOOOOOOOOOOOOooo#',
  '#OOOOOOOOOOOOOOoooo#',
  '#OOOOOOOOOOOOOooooo#',
  '#oOOOOOOOOOOOoooooo#',
  '.#oOOOOOOOOOooooov#.',
  '.#ooOOOOOOoooooovv#.',
  '..#ooooooooooovvv#..',
  '...##oooooooovv##...',
  '.....##########.....',
];

/** 작은 옹기 항아리 */
export const CROCK_SMALL: Grid = [
  '....######......',
  '...#vvvvvv#.....',
  '..#OOOOOOOO#....',
  '...########.....',
  '..##GGOOOOOo##..',
  '.#GXOOOOOOOOoo#.',
  '#GOOOOOOOOOOOoo#',
  '#GOOOOOOOOOOooo#',
  '#OOOOOOOOOOoooo#',
  '#oOOOOOOOOoooov#',
  '.#oOOOOOOoooovv.',
  '..#ooooooooov#..',
  '...##ooooovv#...',
  '.....######.....',
];

/** 장독대 돌 단 */
export const CROCK_STAND: Sliced = {
  g: [
    '##########',
    '#SSSSSSSs#',
    '#ssssssss#',
    '#ssssssss#',
    '#ssssssss#',
    '#ssssssss#',
    '#nnnnnnnn#',
    '##########',
  ],
  cols: [2, R(6), 2],
  rows: [8],
};

/** 초가 지붕: 둥글게 부푼 볏짚 (빛 G · 결 S s) · 꼭대기 땋은 용마름 R r · 처마 끝 d */
export const THATCH_ROOF: Sliced = {
  g: [
    '......................########################......................',
    '..................####RrRrRrRrRrRrRrRrRrrRrRrR####..................',
    '...............###RrRrrRrRrRrRrRrRrRrRrRRrRrRrrRrR###...............',
    '............###rRrrRrRddddddddddddddddddddddddRrRrrRr###............',
    '..........##RrRRrRddddSsSSsSSSSsSSsSSSSsSsSSsSddddRrRRrR##..........',
    '........##RrrRrdddSSsSSSSSSSsSSSSSSSsSSSSSSSSSSsSSdddrRrrR##........',
    '.......#GGrRdddSSSsSSSsSSSsSSSsSSSsSSSsSSsSSSsSSSsSSSdddRrGG#.......',
    '......#GGGddsSSSSsSSsSSSSsSSsSSSSsSSsSSSSSsSSSSsSSsSSSSsddGGG#......',
    '.....#GGGGSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSsSSSSsSSsSSSSsSSsSGGGG#.....',
    '....#GGGsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSSSSsSSsSSSSsSSsSSSSsGGG#....',
    '...#GGGsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSsSSsSSSSsSSsSSSSsSSsGGG#...',
    '..#GGGSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSSSSsSSSSSSSsSSSSSSGGG#..',
    '..GGGSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSsSSSsSSSsSSSsSSSsSSSsSGGG..',
    '.#GGsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSSsSSSSsSSsSSSSsSSsSSSSsGG#.',
    '.GGsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSsSSSSsSSsSSSSsSSsSSSSsSSsGG.',
    '#GSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSSSSsSSsSSSSsSSsSSSSsSSsSSSG#',
    'GGsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSsSSsSSSSsSSsSSSSsSSsSSSSsGG',
    'GSSSsSSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSSSSsSSSSSSSsSSSSSSSsSSSG',
    'GSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSsSSSsSSSsSSSsSSSsSSSsSSSsSG',
    'SsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSSsSSSSsSSsSSSSsSSsSSSSsSSsS',
    'SSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSsSSSSsSSsSSSSsSSsSSSSsSSsSSS',
    'sSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSSSSsSSsSSSSsSSsSSSSsSSsSSSSs',
    'SSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSsSSsSSSSsSSsSSSSsSSsSSSSsSS',
    'SSSSsSSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSSSSsSSSSSSSsSSSSSSSsSSSS',
    'SSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSsSSSsSSSsSSSsSSSsSSSsSSSsSS',
    'SsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSSsSSSSsSSsSSSSsSSsSSSSsSSsS',
    'dSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSsSSSSsSSsSSSSsSSsSSSSsSSsSSd',
    'ddSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSSSSsSSsSSSSsSSsSSSSsSSsSSSdd',
    '#dsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSsSSsSSSSsSSsSSSSsSSsSSSSsd#',
    '.#dSsSSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSsSSSSSSSSSSsSSSSSSSsSSSSSSSsSd#.',
    '..ddSSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSSsSSsSSSsSSSsSSSsSSSsSSSsSSdd..',
    '..#ddSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSSSSSsSSSSsSSsSSSSsSSsSSSSdd#..',
    '...#dddSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSsSsSSSSsSSsSSSSsSSsSSSSddd#...',
    '....#ddddSSSSsSSsSSSSsSSsSSSSsSSsSSSSsSSSSSsSSsSSSSsSSsSSSSdddd#....',
    '.....##dddddSSSsSSsSSSSsSSsSSSSsSSsSSSSsSsSSsSSSSsSSsSSSddddd##.....',
    '.......##dddddddSSSSsSSSSSSSsSSSSSSSsSSSSSSSSSSsSSSSddddddd##.......',
    '.........###dddddddddddddddddddddddddddddddddddddddddddd###.........',
    '............####dddddddddddddddddddddddddddddddddddd####............',
    '................####################################................',
    '....................................................................',
  ],
  cols: [28, R(12), 28],
  rows: [40],
};

/** 흙벽 (반복) */
export const MUD_WALL: Grid = [
  'MMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMmMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMmMMMM',
  'MMmMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMmMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMmM',
  'MMMMMmMMMMMMMMMMMMMM',
];

/** 나무 기둥 (세로 되풀이) */
export const POST: Grid = [
  'OWWwv',
];

/** 창호지 문 (나무 살 격자, 불빛은 P) */
export const PAPER_DOOR: Sliced = {
  g: [
    '###########',
    '#WWWWWWWWWw',
    '#W#########',
    '#W#PPPkPPP#',
    '#W#PPPkPPP#',
    '#W#kkkkkkk#',
    '#W#PPPkPPP#',
    '#W#PPPkPPP#',
    '#W#PPPkPPP#',
    '#W#kkkkkkk#',
    '#W#########',
    '#wwwwwwwwww',
  ],
  cols: [3, R(4), 4],
  rows: [3, R(5), 4],
};

/** 부엌 널문 */
export const PLANK_DOOR: Sliced = {
  g: [
    '#########',
    '#DDdDDDdD',
    '#DDdDDDdD',
    '#DDdDDDdD',
    '#DDdDDDdD',
    '#ddddddd#',
  ],
  cols: [1, R(4), 4],
  rows: [1, R(4), 1],
};

/** 처마에 걸어 둔 시래기 */
export const SIRAEGI: Grid = [
  'L.L.L.L',
  'LlLlLlL',
  'lLlLlLl',
  'L.L.L.L',
  'l.l.l.l',
  'L...L..',
  'l...l..',
];

/** 소쿠리 */
export const BASKET: Grid = [
  '..#########..',
  '.#YYYYYYYYY#.',
  '#YyYyYyYyYyY#',
  '#yYyYyYyYyYy#',
  '.#yyyyyyyyy#.',
  '..#########..',
];

/** 툇마루 (나무 판 12px · 아래 그늘) */
export const MARU: Grid = [
  'GGGGGGGGGGGG',
  'WWWWWWWWWWWw',
  'WWWWWWWWWWWw',
  'WWWWWWWWWWWw',
  'WWWWWWWWWWWw',
  'WWWWWWWWWWWw',
  'wwwwwwwwwwww',
  'kkkkkkkkkkkk',
  'kkkkkkkkkkkk',
  'kkkkkkkkkkkk',
  'kkkkkkkkkkkk',
];

/** 댓돌 위 고무신 한 켤레 (순이 것 흰 X · 어른 것 검정 k) */
export const STEP_STONE: Grid = [
  '....###..###..###..###......',
  '...#XXX##XXX##kkk##kkk#.....',
  '############################',
  '#ssssssssssssssssssssssssss#',
  '#SSSSSSSSSSSSSSSSSSSSSSSSSS#',
  '#SSSSSSSSSSSSSSSSSSSSSSSSSS#',
  '#nnnnnnnnnnnnnnnnnnnnnnnnnn#',
  '############################',
];

/** 기와 지붕 (반복, 엇갈린 기와) */
export const FACADE_ROOF: Grid = [
  'RRRRRRRhRRRRRRRh',
  'RRRRRRRhRRRRRRRh',
  'rrrrrrrhrrrrrrrh',
  'hhhhhhhhhhhhhhhh',
  'RRRhRRRRRRRhRRRR',
  'RRRhRRRRRRRhRRRR',
  'rrrhrrrrrrrhrrrr',
  'hhhhhhhhhhhhhhhh',
];

/** 벽 널 (6줄 되풀이) */
export const SIDING: Grid = [
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'wwwwwwwwwwwwwwww',
];

/** 다락방 둥근 창 (열십자 살 · 불빛) */
export const ROUND_WIN: Grid = [
  '....######....',
  '..##kkkkkk##..',
  '.#kLLLkLLLLk#.',
  '.#kLXLkLLLLk#.',
  '#kLXLLkLLLLlk#',
  '#kkkkkkkkkkkk#',
  '#kLLLLkLLLLlk#',
  '.#kLLLkLLLlk#.',
  '.#kLLLkLLllk#.',
  '..##kkkkkk##..',
  '....######....',
];

/** 불 켜진 창 (나무 틀 · 열십자 살) */
export const FACADE_WIN: Grid = [
  '##################################',
  '#FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF#',
  '#F##############################f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#FFFFFFFFFFFFFFFFFFFFFFFFFFFF#f#',
  '#F#FFFFFFFFFFFFFFFFFFFFFFFFFFFF#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F#LLLLLLLLLLLLLFFLLLLLLLLLLLLL#f#',
  '#F##############################f#',
  '#ffffffffffffffffffffffffffffffff#',
  '##################################',
];

/** 문등 */
export const PORCH_LAMP: Grid = [
  '.###.',
  '#XLL#',
  '#LLL#',
  '#LLl#',
  '.###.',
];

/** 트럭 짐칸 (흰 상자 · 파란 띠 둘) */
export const TRUCK_BOX: Sliced = {
  g: [
    '.######################.',
    '#XWWWWWWWWWWWWWWWWWWWWw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#WBBBBBBBBBBBBBBBBBBBBw#',
    '#WBBBBBBBBBBBBBBBBBBBBw#',
    '#WBBBBBBBBBBBBBBBBBBBBw#',
    '#WBBBBBBBBBBBBBBBBBBBBw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#WbbbbbbbbbbbbWWWWWWWWw#',
    '#WbbbbbbbbbbbbWWWWWWWWw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#wwwwwwwwwwwwwwwwwwwwww#',
    '.######################.',
  ],
  cols: [2, R(12), 10],
  rows: [9, 3, R(3), 2],
};

/** 트럭 운전석: 파란 몸 (빛 Q · 그늘 c) · 앞창 · 문 손잡이 · 전조등 */
export const TRUCK_CAB: Sliced = {
  g: [
    '.##############################.',
    '#QQQQQQQQQQQQQQQQQQQQQQQQQQQQQc#',
    '#QC####################CCCCCCcc#',
    '#QC#XXXggggggggggggggg#CCCCCCcc#',
    '#QC#Xggggggggggggggggg#CCCCCCcc#',
    '#QC#Xggggggggggggggggg#CCCCCCcc#',
    '#QC#gggggggggggggggggg#CCCCCCcc#',
    '#QC#gggggggggggggggggg#CCCCCCcc#',
    '#QC#gggggggggggggggggg#CCCCCCcc#',
    '#QC#gggggggggggggggggg#CCCCCCcc#',
    '#QC#gggggggggggggggggg#CCCCCCcc#',
    '#QC####################CCCCCCcc#',
    '#QCCCCCCCCCCCCCCCCCCCCCCCCCCCcc#',
    '#QCCCCCCCCCCCCCCCCCCCCCCCCCCCcc#',
    '#QcCCCCCCCCCCCCCkkkkCCCCCCCCCcc#',
    '#QcCCCCCCCCCCCCCCCCCCCCCCCCCCcc#',
    '#QcCCCCCCCCCCCCCCCCCCCCCCCCCCcc#',
    '#QcCCCCCCCCCCCCCCCCCCCCCCCCCCcc#',
    '#QcCCCCCCCCCCCCCCCCCCCCCCCCCCcc#',
    '#QcCCCCCCCCCCCCCCCCCCCCCCCCCCcc#',
    '#QcCCCCCCCCCCCCCCCCCCCCCCCCYYcc#',
    '#QcCCCCCCCCCCCCCCCCCCCCCCCCYYcc#',
    '#cccccccccccccccccccccccccccccc#',
    '.##############################.',
  ],
  cols: [32],
  rows: [15, R(5), 4],
};

/** 트럭 바퀴 (검은 고무 · 은빛 휠) */
export const WHEEL: Grid = [
  '....######....',
  '..##kkkkkk##..',
  '.#kkkkkkkkkk#.',
  '.#kkkSSSSkkk#.',
  '#kkkSSXSSSkkk#',
  '#kkkSSSSSSkkk#',
  '#kkkSSSSSSkkk#',
  '#kkkkSSSSkkkk#',
  '.#kkkkkkkkkk#.',
  '.#kkkkkkkkkk#.',
  '..##kkkkkk##..',
  '....######....',
];

/** 파란 간판 판 (15줄) */
export const SIGNBOARD: Sliced = {
  g: [
    '############',
    '#BBBBBBBBBB#',
    '#BLLLLLLLLb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#BBBBBBBBBb#',
    '#bbbbbbbbbb#',
    '############',
  ],
  cols: [2, R(8), 2],
  rows: [3, R(10), 2],
};

/** 간판 빨간 사과 */
export const APPLE: Grid = [
  '...ll....',
  '....l....',
  '..##l##..',
  '.#QQRRr#.',
  '#QRRRRRr#',
  '#RRRRRRr#',
  '#RRRRRrr#',
  '.#rrrrr#.',
  '..#####..',
];

/** 병원 흰 타일 벽 (6줄 되풀이) */
export const TILE_WALL: Grid = [
  'T',
  'T',
  'T',
  'T',
  'T',
  't',
];

/** 화단 회양목 줄 (12px 되풀이) */
export const SHRUB_ROW: Grid = [
  '...##.....##',
  '..#gG#...#gG',
  '.#gGGg#.#gGG',
  '#gGGGgg#gGGG',
  '#gGggggggGGg',
  '#ggggghggggg',
  '#hgggghhgggh',
  '#hhhhhhhhhhh',
  '############',
];

/** 전봇대 윗부분 (34×26): 기둥 머리 · 애자 넷 · 완금 · 버팀대 · 변압기 */
export const POLE_TOP: Grid = [
  '..............######..............',
  '.............#LLCCcc#.............',
  '.............#LCCCcc#.............',
  '.............#LCCCcc#.............',
  '.............#LCCCcc#.............',
  '.............#LCCCcc#.............',
  '.............#LCCCcc#.............',
  '...II......II#LCCCcc#II......II...',
  '...Ii......Ii#LCCCcc#Ii......Ii...',
  '...ii......ii#LCCCcc#ii......ii...',
  '.#AAAAAAAAAAA#LCCCcc#AAAAAAAAAAA#.',
  '.#aaaaaaaaaaa#LCCCcc#aaaaaaaaaaa#.',
  '.#############LCCCcc#############.',
  '......a......#LCCCcc############..',
  '.......a.....#LCCCcc#UTTTTTTTtt#..',
  '........a....#LCCCcc#UTTTTTTTtt#..',
  '.........a...#LCCCcc#UTUUUUUTtt#..',
  '..........a..#LCCCcc#UTTTTTTTtt#..',
  '...........a.#LCCCcc#UTTTTTTTtt#..',
  '............a#LCCCcc#UTTTTTTTtt#..',
  '.............#LCCCcc#UTTTTTTTtt#..',
  '.............#LCCCcc#tttttttttt#..',
  '.............#LCCCcc############..',
  '.............#LCCCcc#.............',
  '.............#LCCCcc#.............',
  '.............#LCCCcc#.............',
];

/** 전봇대 줄기 한 마디 (10×14, 위아래로 되풀이): 발판 볼트가 양쪽으로 엇갈린다 */
export const POLE_SHAFT: Grid = [
  '..#LCCCcc#',
  '..#LCCCcc#',
  '..#LCCCcc#',
  '.b#LCCCcc#',
  'bb#LCCCcc#',
  '..#LCCCcc#',
  '..#LCCCcc#',
  '..#LCCCcc#',
  '..#LCCCcc#',
  '..#LCCCcc#',
  '..#LCCCcc#b',
  '..#LCCCcc#bb',
  '..#LCCCcc#',
  '..#LCCCcc#',
].map((r) => r.padEnd(12, '.'));

/** 전봇대 밑동 (12×44): 덕지덕지 붙은 전단 둘 · 노랑 검정 띠 · 굽 */
export const POLE_FOOT: Grid = [
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#QQQQQr#..',
  '..#QqQQQr#..',
  '..#QQQQqr#..',
  '..#QQQQQr#..',
  '..#rrrrrr#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#PPPPPp#..',
  '..#PqqqPp#..',
  '..#PPPPPp#..',
  '..#PqqPPp#..',
  '..#PPPPPp#..',
  '..#PqqqPp#..',
  '..#PPPPPp#..',
  '..#pppppp#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#YYYYYz#..',
  '..#YYYYYz#..',
  '..#YYYYYz#..',
  '..#kkkkkk#..',
  '..#kkkkkk#..',
  '..#kkkkkk#..',
  '..#YYYYYz#..',
  '..#YYYYYz#..',
  '..#YYYYYz#..',
  '..#kkkkkk#..',
  '..#kkkkkk#..',
  '..#kkkkkk#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '..#LCCCcc#..',
  '.#LLCCCccc#.',
  '#LLCCCCcccc#',
  '#cccccccccc#',
  '############',
];

/** 가로등 머리 (24×11): 기둥 끝에서 오른쪽으로 꺾인 팔 · 등갓 H · 등 B (켜면 노랗다) */
export const LAMP_HEAD: Grid = [
  '.####...................',
  '#LMMm#..................',
  '#LMMMm######............',
  '#LMMMMMMMMMm#...........',
  '#LMMm#####MMm#######....',
  '#LMMm#....#HHHHHHHHHHg#.',
  '#LMMm#...#hHHHHHHHHHHgg#',
  '#LMMm#...#hhhhhhhhhhhgg#',
  '#LMMm#...#BBBBBBBBBBBBB#',
  '#LMMm#....#bbbbbbbbbbb#.',
  '#LMMm#.....###########..',
];

/** 가로등 기둥 한 줄 (되풀이) · 받침 */
export const LAMP_POST: Grid = ['#LMMm#'];
export const LAMP_FOOT: Grid = [
  '.#LMMm#.',
  '.#LMMm#.',
  '########',
  '#LLMMMm#',
  '#LMMMMm#',
  '#LMMMMm#',
  '#mmmmmm#',
  '########',
];

/** 나무 줄기 (16 폭): 위 12줄 두 가지 · 줄기 결 3줄 되풀이 · 아래 뿌리 */
export const TRUNK: Sliced = {
  g: [
    '.##..........##.',
    '#LB#........#Bb#',
    '#LB#.......#Bb#.',
    '.#LB#......#Bb#.',
    '.#LB#.....#Bb#..',
    '..#LB#....#Bb#..',
    '..#LB#...#Bb#...',
    '...#LB#..#Bb#...',
    '...#LB#.#Bb#....',
    '....#LB##Bb#....',
    '....#LLBBBb#....',
    '....#LBBBbb#....',
    '....#LBBBbd#....',
    '....#LBdBbb#....',
    '....#LBBBbb#....',
    '...#LLBBBbbd#...',
    '..#bbbbbbbbbbb#.',
    '..#############.',
  ],
  cols: [16],
  rows: [12, R(3), 3],
};

/** 감 하나 (꼭지 e · 주황 O o) */
export const FRUIT: Grid = ['..e..', '.###.', '#OOo#', '#Ooo#', '.###.'];

/** 가로수 · 감나무 잎 (76×58 자리): 손으로 고른 자리에 잎 덩이를 뒤 → 앞으로 겹친다 [덩이, x, y] */
export const CROWN_ROUND: readonly [Grid, number, number][] = [
  [CLUMP_M, 22, 4], [CLUMP_L, 30, 1], [CLUMP_M, 42, 4],
  [CLUMP_L, 10, 12], [CLUMP_L, 26, 10], [CLUMP_L, 42, 12], [CLUMP_M, 56, 14],
  [CLUMP_L, 3, 22], [CLUMP_L, 19, 21], [CLUMP_L, 35, 19], [CLUMP_L, 51, 22],
  [CLUMP_L, 7, 32], [CLUMP_M, 23, 34], [CLUMP_L, 35, 31], [CLUMP_M, 52, 33],
  [CLUMP_M, 15, 42], [CLUMP_L, 27, 40], [CLUMP_M, 43, 42],
];

/** 은행나무 잎 (위가 좁은 원뿔꼴) */
export const CROWN_CONE: readonly [Grid, number, number][] = [
  [CLUMP_S, 32, 0], [CLUMP_M, 30, 6], [CLUMP_M, 23, 13], [CLUMP_M, 37, 13],
  [CLUMP_L, 19, 21], [CLUMP_L, 36, 21], [CLUMP_L, 14, 31], [CLUMP_L, 29, 30], [CLUMP_L, 43, 31],
  [CLUMP_M, 15, 42], [CLUMP_L, 28, 41], [CLUMP_M, 44, 42],
];

/** 감나무 감 자리 */
export const FRUIT_SPOTS: readonly [number, number][] = [[14, 24], [30, 15], [48, 19], [22, 38], [40, 34], [57, 29], [34, 46], [9, 35], [46, 44], [26, 27]];

/** 사다리 (두 기둥 · 가로 디딤대, 7줄 되풀이) */
export const LADDER: Sliced = {
  g: [
    '#Sst#......#Sst#',
    '#Sst#......#Sst#',
    '#Sst#......#Sst#',
    '#Sst#......#Sst#',
    '#Sst#......#Sst#',
    '#SstSSSSSSSSSst#',
    '#SstttttttttSst#',
  ],
  cols: [16],
  rows: [R(7)],
};

/** 미끄럼틀 꼭대기: 빨간 난간 · 노란 발판 */
export const SLIDE_TOP: Grid = [
  '##########################',
  '#QQQQQQQQQQQQQQQQQQQQQQQQ#',
  '#RR####################RR#',
  '#RR#..................#RR#',
  '#RR#..................#RR#',
  '#RR#..................#RR#',
  '#RRRRRRRRRRRRRRRRRRRRRRRR#',
  '#RR####################RR#',
  '#RR#..................#RR#',
  '#RR#..................#RR#',
  '#RR#..................#RR#',
  '##########################',
  '#yyyyyyyyyyyyyyyyyyyyyyyy#',
  '#YYYYYYYYYYYYYYYYYYYYYYYY#',
  '#YYYYYYYYYYYYYYYYYYYYYYYY#',
  '#YYYYYYYYYYYYYYYYYYYYYYYY#',
  '#zzzzzzzzzzzzzzzzzzzzzzzz#',
  '##########################',
];

/** 미끄럼판 한 줄 (세로 단면: 테 · 반짝 · 판 · 그늘) */
export const CHUTE_COL: Grid = [
  '#',
  'r',
  'r',
  'Q',
  'R',
  'R',
  'R',
  'R',
  'R',
  'R',
  'q',
  '#',
];

/** 쇠 기둥 한 줄 (되풀이) */
export const STEEL_POST: Grid = [
  '#Sst#',
];

/** 시소 노란 받침 (세모) */
export const FULCRUM: Grid = [
  '.......#.......',
  '......#Y#......',
  '......#YY#.....',
  '.....#yYYz#....',
  '.....#yYYYz#...',
  '....#yYYYYz#...',
  '....#yYYYYYz#..',
  '...#yYYYYYYz#..',
  '...#yYYYYYYYz#.',
  '..#yYYYYYYYYz#.',
  '..#yYYYYYYYYYz#',
  '.#yYYYYYYYYYYz#',
  '#yYYYYYYYYYYYz#',
  '#zzzzzzzzzzzzz#',
  '#zzzzzzzzzzzzz#',
  '###############',
];

/** 반쯤 묻힌 타이어 */
export const TIRE: Grid = [
  '...##########...',
  '.##kkkkkkkkkk##.',
  '#kkKKKKKKKKKKkk#',
  '#kKKK######KKKk#',
  '#kKKKKKKKKKKKKk#',
  '.##KKKKKKKKKK##.',
  '...##########...',
];

/** 시소 손잡이 */
export const HANDLE: Grid = [
  '########',
  '#RRRRRR#',
  '#rrrrrr#',
  '###SS###',
  '..#Ss#..',
  '..#Ss#..',
  '..#Ss#..',
  '..#Ss#..',
  '..####..',
];

/** 시소 널판 한 마디 (4px) */
export const PLANK_STEP: Grid = [
  'QQQQ',
  'PPPP',
  'PPPP',
  'pppp',
];

/** 시소 굴대 */
export const PIVOT: Grid = [
  '.##.',
  '#Ss#',
  '#ss#',
  '.##.',
];

/** 정글짐 한 겹 (세로 막대 R r · 가로 막대 Y y, 19px 칸 되풀이) */
export const JUNGLE_GRID: Sliced = {
  g: [
    'YYYYYYYYYYYYYYYYYYYYY',
    'yyyyyyyyyyyyyyyyyyyyy',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'Rr.................Rr',
    'YYYYYYYYYYYYYYYYYYYYY',
    'yyyyyyyyyyyyyyyyyyyyy',
  ],
  cols: [R(19), 2],
  rows: [R(19), 2],
};

/** 앞 겹과 뒤 겹을 잇는 비스듬한 막대 */
export const JUNGLE_LINK: Grid = [
  '.........g',
  '........gg',
  '........g.',
  '.......gg.',
  '......gg..',
  '......g...',
  '.....gg...',
  '....gg....',
  '....g.....',
  '...gg.....',
  '..gg......',
  '.gg.......',
  'gg........',
];

/** 우물 돌 테: 위 둥근 입 (검은 물 · 하늘 비친 b) · 돌 줄 (4줄 되풀이) */
export const WELL_RING: Sliced = {
  g: [
    '....################....',
    '..##GGGGGGGGGGGGGGGG##..',
    '.#GGkkkkkkkkkkkkkkkkSS#.',
    '#GGkkkbbbbkkkkkkkkkkSSs#',
    '#SSSkkkkkkkkkkkkkkkSSss#',
    '#SSSSSSSSSSSSSSSSSSSSss#',
    '#GSSSnGSSSnGSSSnGSSSnGS#',
    '#SSssnSSssnSSssnSSssnSs#',
    '#SnGSSSnGSSSnGSSSnGSSSn#',
    '#snSSssnSSssnSSssnSSssn#',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '.######################.',
  ],
  cols: [6, R(12), 6],
  rows: [6, R(4), 2],
};

/** 우물 나무 기둥 한 줄 (되풀이) */
export const WELL_POST: Grid = [
  '#OWw#',
];

/** 우물 가로대 */
export const WELL_BEAM: Sliced = {
  g: [
    '.####.',
    '#OOOOw',
    '#WWWWw',
    '#wwwww',
    '.####.',
  ],
  cols: [2, R(2), 2],
  rows: [5],
};

/** 두레박 */
export const BUCKET: Grid = [
  '#########',
  '#WWWWWWw#',
  '#mmmmmmm#',
  '#WWWWWWw#',
  '#WWWWWWw#',
  '#wwwwwww#',
  '.#######.',
];

/** 리어카 큰 바퀴 (바퀴살) */
export const CART_WHEEL: Grid = [
  '......######......',
  '....##kkkkkk##....',
  '...#kkmmmmmmkk#...',
  '..#kmSmmmSmmmSmk#.',
  '.#kmmmSmmSmmSmmmk#',
  '.#kmmmmSmSmSmmmmk#',
  '#kmmmmmmSSSmmmmmk#',
  '#kSSSSSSoSSSSSSSk#',
  '#kmmmmmmSSSmmmmmk#',
  '.#kmmmmSmSmSmmmmk#',
  '.#kmmmSmmSmmSmmmk#',
  '..#kmSmmmSmmmSmk#.',
  '...#kkmmmmmmkk#...',
  '....##kkkkkk##....',
  '......######......',
];

/** 리어카 나무 짐칸 (6px 판 되풀이) */
export const CART_BED: Sliced = {
  g: [
    '############',
    '#OOOOOOOOOw#',
    '#WWWWWwWWWw#',
    '#WWWWWwWWWw#',
    '#WWWWWwWWWw#',
    '#WWWWWwWWWw#',
    '#vvvvvvvvvv#',
    '#WWWWWwWWWw#',
    '#WWWWWwWWWw#',
    '#WWWWWwWWWw#',
    '#WWWWWwWWWw#',
    '#WWWWWwWWWw#',
    '#wwwwwwwwww#',
    '############',
  ],
  cols: [1, R(6), 5],
  rows: [14],
};

/** 앞으로 뻗은 손잡이 */
export const CART_HANDLE: Grid = [
  'MM..............',
  'MMMMMM..........',
  '....MMMMMM......',
  '........MMMMMMMM',
];

/** 볏짚 단 */
export const STRAW: Grid = [
  '.######.',
  '#YYYYyy#',
  '#YyYYyz#',
  '#YYyYyz#',
  '#zzzzzz#',
  '#YYyYyz#',
  '#YyYYyz#',
  '#yyyyzz#',
  '.######.',
];

/** 배추 */
export const CABBAGE: Grid = [
  '..#####..',
  '.#LLLll#.',
  '#LLeLLle#',
  '#LeLLlel#',
  '#lLLelll#',
  '#lleelle#',
  '.#leeee#.',
  '..#####..',
];

/** 이 파일의 격자 · 쓰는 팔레트 (시험용: 글자 줄 폭 · 조각 길이 · 팔레트에 있는 글자만) */
export function allFurnDGrids(): [string, Grid, Palette][] {
  return [
    ['GRATE', GRATE, treePal(hex('#5c9c48'), hex('#6a5444'))],
    ['LEAF_FALL', LEAF_FALL, treePal(hex('#5c9c48'), hex('#6a5444'))],
    ['TRUNK', TRUNK.g, treePal(hex('#5c9c48'), hex('#6a5444'))],
    ['FRUIT', FRUIT, treePal(hex('#5c9c48'), hex('#6a5444'))],
    ['GLYPHS9', GLYPHS9, inkPal(1)],
    ['GLYPHS5', GLYPHS5, inkPal(1)],
    ['GATE_LEAF', GATE_LEAF.g, gatePal(hex('#cfcac0'), hex('#b8735c'))],
    ['GATE_KNOB', GATE_KNOB, gatePal(hex('#cfcac0'), hex('#b8735c'))],
    ['PILLAR_CAP', PILLAR_CAP, gatePal(hex('#cfcac0'), hex('#b8735c'))],
    ['NAMEPLATE_S', NAMEPLATE_S, gatePal(hex('#cfcac0'), hex('#b8735c'))],
    ['BELL', BELL, gatePal(hex('#cfcac0'), hex('#b8735c'))],
    ['YARD_VIEW', YARD_VIEW.g, gatePal(hex('#cfcac0'), hex('#b8735c'))],
    ['ROOF_TILES', ROOF_TILES, nwallPal(hex('#b85a48'), false, hex('#ffdc8a'), hex('#5a9048'))],
    ['HOUSE_WIN', HOUSE_WIN, nwallPal(hex('#b85a48'), false, hex('#ffdc8a'), hex('#5a9048'))],
    ['MESH', MESH, schoolPal()],
    ['SCHOOL_WIN', SCHOOL_WIN, schoolPal()],
    ['CLOCK_TOWER', CLOCK_TOWER, schoolPal()],
    ['NAME_BOARD', NAME_BOARD, schoolPal()],
    ['SLIDE_GATE', SLIDE_GATE, schoolPal()],
    ['AWNING', AWNING, shopPal(false, hex('#ffdc8a'))],
    ['GOODS', GOODS, shopPal(false, hex('#ffdc8a'))],
    ['FREEZER', FREEZER, freezerPal()],
    ['CRATES', CRATES, cratePal()],
    ['PYEONGSANG', PYEONGSANG, pyeongPal()],
    ['HOSP_WIN', HOSP_WIN, hospPal(false, hex('#4e7a58'))],
    ['CANOPY', CANOPY.g, hospPal(false, hex('#4e7a58'))],
    ['GLASS_DOOR', GLASS_DOOR.g, hospPal(false, hex('#4e7a58'))],
    ['TILE_WALL', TILE_WALL, hospPal(false, hex('#4e7a58'))],
    ['RED_CROSS', RED_CROSS, hospCrossPal()],
    ['BUS_SIGN', BUS_SIGN.g, busPal()],
    ['BUS_SEAT', BUS_SEAT.g, busPal()],
    ['BENCH', BENCH.g, benchPal(false)],
    ['SWING_FRAME', SWING_FRAME.g, playPal()],
    ['SWING_BAR', SWING_BAR, playPal()],
    ['SWING_SEAT', SWING_SEAT.g, playPal()],
    ['LADDER', LADDER.g, playPal()],
    ['SLIDE_TOP', SLIDE_TOP, playPal()],
    ['CHUTE_COL', CHUTE_COL, playPal()],
    ['STEEL_POST', STEEL_POST, playPal()],
    ['FULCRUM', FULCRUM, playPal()],
    ['TIRE', TIRE, playPal()],
    ['HANDLE', HANDLE, playPal()],
    ['PIVOT', PIVOT, playPal()],
    ['PLANK_STEP', PLANK_STEP, plankPal()],
    ['JUNGLE_GRID', JUNGLE_GRID.g, junglePal()],
    ['JUNGLE_LINK', JUNGLE_LINK, junglePal()],
    ['CURB', CURB, roadPal()],
    ['DASH', DASH, roadPal()],
    ['ZEBRA', ZEBRA, roadPal()],
    ['PUDDLE_STREAK', PUDDLE_STREAK, { w: 1 }],
    ['SANDBOX', SANDBOX.g, sandboxPal(hex('#e2cb94'))],
    ['SAND_TOYS', SAND_TOYS, sandboxPal(hex('#e2cb94'))],
    ['RUTS', RUTS.g, rutsPal(hex('#b48c5c'), hex('#6e9a4a'))],
    ['STONE_ROW', STONE_ROW.g, stonePal(hex('#a89a86'), hex('#8a7a66'), hex('#6e9a4a'))],
    ['SIGNPOST', SIGNPOST.g, signPal()],
    ['SCHOOL_SIGN', SCHOOL_SIGN.g, signPal()],
    ['CROCK_BIG', CROCK_BIG, crockPal(hex('#a8a090'))],
    ['CROCK_SMALL', CROCK_SMALL, crockPal(hex('#a8a090'))],
    ['CROCK_STAND', CROCK_STAND.g, crockPal(hex('#a8a090'))],
    ['THATCH_ROOF', THATCH_ROOF.g, thatchRoofPal()],
    ['MUD_WALL', MUD_WALL, thatchPal(false, hex('#a89a86'))],
    ['POST', POST, thatchPal(false, hex('#a89a86'))],
    ['PAPER_DOOR', PAPER_DOOR.g, thatchPal(false, hex('#a89a86'))],
    ['PLANK_DOOR', PLANK_DOOR.g, thatchPal(false, hex('#a89a86'))],
    ['SIRAEGI', SIRAEGI, thatchPal(false, hex('#a89a86'))],
    ['BASKET', BASKET, thatchPal(false, hex('#a89a86'))],
    ['MARU', MARU, marPal()],
    ['STEP_STONE', STEP_STONE, stepStonePal()],
    ['FACADE_ROOF', FACADE_ROOF, facadePal()],
    ['SIDING', SIDING, facadePal()],
    ['ROUND_WIN', ROUND_WIN, facadePal()],
    ['FACADE_WIN', FACADE_WIN, facadePal()],
    ['PORCH_LAMP', PORCH_LAMP, facadePal()],
    ['TRUCK_BOX', TRUCK_BOX.g, truckPal()],
    ['TRUCK_CAB', TRUCK_CAB.g, truckPal()],
    ['WHEEL', WHEEL, truckPal()],
    ['SIGNBOARD', SIGNBOARD.g, signboardPal()],
    ['APPLE', APPLE, signboardPal()],
    ['SHRUB_ROW', SHRUB_ROW, shrubPal(hex('#5a9048'))],
    ['POLE_TOP', POLE_TOP, polePal()],
    ['POLE_SHAFT', POLE_SHAFT, polePal()],
    ['POLE_FOOT', POLE_FOOT, polePal()],
    ['LAMP_HEAD', LAMP_HEAD, lampPal(true, hex('#ffdc8a'))],
    ['LAMP_POST', LAMP_POST, lampPal(true, hex('#ffdc8a'))],
    ['LAMP_FOOT', LAMP_FOOT, lampPal(true, hex('#ffdc8a'))],
    ['WELL_RING', WELL_RING.g, wellPal(hex('#a89a86'))],
    ['WELL_POST', WELL_POST, wellPal(hex('#a89a86'))],
    ['WELL_BEAM', WELL_BEAM.g, wellPal(hex('#a89a86'))],
    ['BUCKET', BUCKET, wellPal(hex('#a89a86'))],
    ['CART_WHEEL', CART_WHEEL, cartPal()],
    ['CART_BED', CART_BED.g, cartPal()],
    ['CART_HANDLE', CART_HANDLE, cartPal()],
    ['STRAW', STRAW, cartPal()],
    ['CABBAGE', CABBAGE, cartPal()],
  ];
}
