/**
 * 가구 손찍기 격자 3: 병원 · 욕실 · 마당 · 거실 소품 (병원 침대 · 링거대 · 울타리 · 화단 · 웅덩이 · 덤불 · 인형극 무대 ·
 * 욕조 · 세면대 · 그네 · 우체통 · 자전거 · 난간 · 등받이 없는 의자 · 화분 · 방석).
 */
import { hex, shade, type Color } from '../paint.ts';
import { type Grid, type Palette } from './grid.ts';
import { clothPal, linenPal, woodPal, type Sliced } from './furnA.ts';
import { type Seg } from './slice.ts';

const R = (n: number): Seg => [n, 'r'];

export function hbedPal(blanket: Color): Palette {
  const m = hex('#c8d0d8');
  return { ...linenPal(), ...clothPal(blanket), N: hex('#e8eef2'), M: m, m: shade(m, -0.14), n: hex('#8a9098'), o: hex('#4a4e58') };
}

export function gmPal(): Palette {
  return { h: hex('#e8e4ec'), G: hex('#ffffff'), S: hex('#f0ccb0'), s: shade(hex('#f0ccb0'), -0.15), e: hex('#3a2a2a') };
}

export function ivPal(): Palette {
  return { X: hex('#ffffff'), B: hex('#e8f4ff'), b: shade(hex('#e8f4ff'), -0.14), a: hex('#c8d8e0'), A: hex('#a8b0b8'), M: hex('#8a9098'), m: hex('#6a7078') };
}

export function fencePal(c: Color): Palette {
  return { X: shade(c, 0.2), W: c, w: shade(c, -0.12), x: shade(c, -0.25), R: shade(c, 0.06), r: shade(c, -0.1), k: shade(c, -0.3) };
}

export function flowerPal(): Palette {
  return {
    ...woodPal(hex('#8a5a3a')), d: hex('#5a3a26'),
    '1': hex('#f06a8a'), '2': hex('#ffd84a'), '3': hex('#ffffff'), X: hex('#fff0b0'), l: hex('#4a8a3a'), L: hex('#7ab85a'),
  };
}

export function puddlePal(water: Color): Palette {
  return { W: water, w: shade(water, -0.12), X: shade(water, 0.3), d: shade(water, -0.25) };
}

export function bushPal(leaf: Color): Palette {
  return { G: shade(leaf, 0.3), g: shade(leaf, 0.14), H: leaf, h: shade(leaf, -0.2) };
}

export function stagePal(): Palette {
  return { ...woodPal(hex('#c8905a')), ...clothPal(hex('#d85a5a')), o: hex('#2a2030') };
}

export function tubPal(): Palette {
  const e = hex('#f4f8fa');
  return {
    X: hex('#ffffff'), E: e, F: shade(e, -0.06), f: shade(e, -0.2), U: hex('#ffffff'), u: hex('#d8e8f0'),
    '1': hex('#c8eaf8'), '2': hex('#9ad0e8'), '3': shade(hex('#9ad0e8'), -0.12), M: hex('#c8d0d8'), m: shade(hex('#c8d0d8'), -0.2),
  };
}

export function sinkPal(): Palette {
  const mir = hex('#d8eef8');
  return { ...tubPal(), g: mir, G: shade(mir, -0.15) };
}

export function swingPal(): Palette {
  return { ...woodPal(hex('#9a6a3a')), r: hex('#d8c8a8') };
}

export function mailboxPal(): Palette {
  const red = hex('#d84a4a');
  return { Q: shade(red, 0.25), R: red, r: shade(red, -0.22), k: hex('#3a2020'), Y: hex('#ffd84a'), y: shade(hex('#ffd84a'), -0.2), W: hex('#6a4a2a'), w: shade(hex('#6a4a2a'), -0.25) };
}

export function bikePal(frame: Color): Palette {
  return { t: hex('#3a3a42'), T: hex('#5a5a64'), o: hex('#c8c8d0'), c: frame, C: shade(frame, 0.25), s: hex('#3a3a42'), k: hex('#5a5a64') };
}

export function railPal(): Palette {
  const c = hex('#f0ece0');
  return { X: shade(c, 0.3), E: c, f: shade(c, -0.14) };
}

export function potPal(flower: Color): Palette {
  return { '1': flower, X: hex('#fff0b0'), l: hex('#4a8a3a'), L: hex('#7ab85a'), T: hex('#c8704a'), t: shade(hex('#c8704a'), -0.25), d: hex('#5a3a26') };
}


/** 병원 침대: 쇠 머리 난간 · 흰 요 · 베개 · 파란 홑이불 (되풀이) · 발 난간 · 바퀴 */
export const HBED: Sliced = {
  g: [
    '.##############################.',
    '#NNNNNNNNNNNNNNNNNNNNNNNNNNNNnn#',
    '#MMMMMMMMMMMMMMMMMMMMMMMMMMMMnn#',
    '#Mn#########################Mnn#',
    '#Mn#MnnMnnMnnMnnMnnMnnMnnMnnMnn#',
    '#Mn#MnnMnnMnnMnnMnnMnnMnnMnnMnn#',
    '#Mn#MnnMnnMnnMnnMnnMnnMnnMnnMnn#',
    '#mmmmmmmmmmmmmmmmmmmmmmmmmmmmnn#',
    '#SSSSSSSSSSSSSSSSSSSSSSSSSSSSnn#',
    '#SSSSSppppppppppppppppppSSSSSnn#',
    '#SSSSXPPPPPPPPPPPPPPPPPPpSSSSnn#',
    '#SSSSpPPPPPPPPPPPPPPPPPPpSSSSnn#',
    '#SSSSpPPPPPPPPPPPPPPPPPPpSSSSnn#',
    '#SSSSpPPPPPPPPPPPPPPPPPPpSSSSnn#',
    '#SSSSSppppppppppppppppppSSSSSnn#',
    '#SSSSSSSSSSSSSSSSSSSSSSSSSSSSnn#',
    '#ssssssssssssssssssssssssssssnn#',
    '#QQQQQQQQQQQQQQQQQQQQQQQQQQQQnn#',
    '#CCCCCCCCCCCCCCCCCCCCCCCCCCCCnn#',
    '#CCCCCCCCCCCCCCCCCCCCCCCCCCCCnn#',
    '#CCCCCCCCCCCCCCCCCCCCCCCCCCCCnn#',
    '#CCCCCCCCCCCCCcCCCCCCCCCCCCCCnn#',
    '#ccccccccccccccccccccccccccccnn#',
    '#kkkkkkkkkkkkkkkkkkkkkkkkkkkknn#',
    '#NNNNNNNNNNNNNNNNNNNNNNNNNNNNnn#',
    '#MMMMMMMMMMMMMMMMMMMMMMMMMMMMnn#',
    '#mmmmmmmmmmmmmmmmmmmmmmmmmmmmnn#',
    '#nn#........................#nn#',
    '#nn#........................#nn#',
    '#nn#........................#nn#',
    '#oo#........................#oo#',
    '.##..........................##.',
  ],
  cols: [6, R(18), 8],
  rows: [18, R(4), 10],
};

/** 베개에 누운 할머니 얼굴 (흰 머리) */
export const GM_HEAD: Grid = [
  '...######...',
  '..#hhhhhh#..',
  '.#hGhhhhhh#.',
  '#hhhhhhhhhh#',
  '#hSSSSSSSSh#',
  '#hSSSSSSSSh#',
  '#hSeSSSSeSh#',
  '.#SSSSSSSS#.',
  '..#SSssSS#..',
  '...######...',
];

/** 링거대: 수액 봉지 · 쇠 기둥 (되풀이) · 받침 */
export const IV: Sliced = {
  g: [
    '..#######..',
    '.#XBBBBBb#.',
    '.#BBBBBBb#.',
    '.#BBbbBBb#.',
    '.#BBBBBBb#.',
    '.#BBBBBBb#.',
    '.#bbbbbbb#.',
    '..#######..',
    '....#a#....',
    '....#a#....',
    '....#A#....',
    '....#A#....',
    '....#A#....',
    '....#A#....',
    '...#####...',
    '..#MMMMM#..',
    '.#MmmmmmM#.',
    '###########',
  ],
  cols: [11],
  rows: [10, R(4), 4],
};

/** 흰 나무 울타리 한 칸 (뾰족한 말뚝 · 가로대 둘) */
export const FENCE: Sliced = {
  g: [
    '..#...',
    '.#X#..',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    'RRRRRR',
    'rrrrrr',
    'kkkkkk',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    '#XWw#.',
    'RRRRRR',
    'rrrrrr',
    'kkkkkk',
    '#XWw#.',
    '#XWw#.',
    '#xww#.',
    '.##...',
    '......',
  ],
  cols: [R(6)],
  rows: [9, R(13), 8],
};

/** 꽃 셋 (1 분홍 · 2 노랑 · 3 흰) 과 줄기 · 잎 (되풀이) */
export const FLOWER_ROW: Grid = [
  '.#1#..#2#..#3#.',
  '#1X1##2X2##3X3#',
  '.#1#..#2#..#3#.',
  '..l....l....l..',
  '..lL...l...Ll..',
  '..l...Ll....l..',
  '..l....l....l..',
];

/** 화단 흙 상자 (윗면 흙 d · 나무 앞면) */
export const PLANTER: Sliced = {
  g: [
    '.##########.',
    '#OOOOOOOOOw#',
    '#dddddddddw#',
    '#WWWWWWWWWw#',
    '#WWWWWWWWWw#',
    '#WWWWWWWWWw#',
    '#WWWWWWWWWw#',
    '#WWWWWWWWWw#',
    '#wwwwwwwwww#',
    '.##########.',
  ],
  cols: [2, R(8), 2],
  rows: [3, R(5), 2],
};

/** 물웅덩이: 짙은 가장자리 · 하늘 비친 반짝 줄 · 아래쪽 깊은 물 */
export const PUDDLE: Sliced = {
  g: [
    '............................dddddddddddddddd............................',
    '.......................dddddddddddddddddddddddddd.......................',
    '...................dddddddWWWWWWWWWWWWWWWWWWWWddddddd...................',
    '................dddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWddddd................',
    '..............ddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWdddd..............',
    '............ddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWdddd............',
    '..........ddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWdddd..........',
    '........ddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWdddd........',
    '.......dddWWWWWWXXXXXXXXXXXXXXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWddd.......',
    '......dddWWWWWWWXXXXXXXXXXXXXXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWddd......',
    '.....dddWWWWWWWWXXXXXXXXXXXXXXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWwddd.....',
    '....dddWWWWWWWWWXXXXXXXXXXXXXXXXXXXXXXWWWWWWWWWWWWWWWWWWWWWWWWWwwddd....',
    '...dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwddd...',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwddd..',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwddd..',
    '.dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwddd.',
    '.dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwddd.',
    '.ddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwdd.',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd',
    '.ddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwdd.',
    '.dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwddd.',
    '.dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXWWWWXXXXXWWWWWWWWWWWWWwwwwwddd.',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXWWWWXXXXXWWWWWWWWWWWWWwwwwddd..',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXWWWWXXXXXWWWWWWWWWWWWWwwwwddd..',
    '...dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwddd...',
    '....dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwddd....',
    '.....dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwddd.....',
    '......dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWddd......',
    '.......dddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwddd.......',
    '........ddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd........',
    '..........ddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd..........',
    '............ddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd............',
    '..............ddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd..............',
    '................dddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwddddd................',
    '...................dddddddwwwwwwwwwwwwwwwwwwwwddddddd...................',
    '.......................dddddddddddddddddddddddddd.......................',
    '............................dddddddddddddddd............................',
  ],
  cols: [30, R(12), 30],
  rows: [18, R(6), 18],
};

/** 진흙 웅덩이: 가장자리 · 마른 흙덩이 */
export const MUD: Sliced = {
  g: [
    '............................dddddddddddddddd............................',
    '.......................dddddddddddddddddddddddddd.......................',
    '...................dddddddWWWWWWWWWWWWWWWWWWWWddddddd...................',
    '................dddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWddddd................',
    '..............ddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWdddd..............',
    '............ddddWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWdddd............',
    '..........ddddWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWdddd..........',
    '........ddddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWdddd........',
    '.......dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwddd.......',
    '......dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwddd......',
    '.....dddWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXWWWWwwwddd.....',
    '....dddWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXWWwwwwddd....',
    '...dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwddd...',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd..',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd..',
    '.dddWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWwwwwwwwddd.',
    '.dddWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWwwwwwwwddd.',
    '.ddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwwwdd.',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwwwddd',
    'dddWWWWWXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWwwwwwwwwddd',
    'dddWWWWWXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWwwwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwwwddd',
    'dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwwwddd',
    '.ddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwwwdd.',
    '.dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWwwwwwwwddd.',
    '.dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWwwwwwwwddd.',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd..',
    '..dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwwddd..',
    '...dddWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwwddd...',
    '....dddWWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwwddd....',
    '.....dddWWWWWWWWWWWWWWWWWWWWXXXXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwwddd.....',
    '......dddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwddd......',
    '.......dddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwddd.......',
    '........ddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd........',
    '..........ddddwwwwwwwwwXXwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd..........',
    '............ddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd............',
    '..............ddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdddd..............',
    '................dddddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwddddd................',
    '...................dddddddwwwwwwwwwwwwwwwwwwwwddddddd...................',
    '.......................dddddddddddddddddddddddddd.......................',
    '............................dddddddddddddddd............................',
  ],
  cols: [30, R(12), 30],
  rows: [18, R(6), 18],
};

/** 덤불: 둥근 잎 덩이 일곱 (왼쪽 위 빛) */
export const BUSH: Sliced = {
  g: [
    '........................................................................',
    '........................................................................',
    '........................................................................',
    '........................................................................',
    '........................................................................',
    '........................................................................',
    '........................................................................',
    '............................gggggggg....................................',
    '.........................gggggggggggggg.................................',
    '........................ggggggggggggggHH................................',
    '......................gggggggghggggggHHhhh..............................',
    '.....................gggggggggggggggHHHHhhh.............................',
    '....................gggggggggggggggHHHHHHHhh....gggggggg................',
    '....................ggggggggggggggHHHHHHHHhh..gggggggggggg..............',
    '...................ggggggggggggggHHHHHHHHHHhgggggggggggggHHh............',
    '..................ggggggggggggggHHHHHHHHHHHgggggggggggggHHHhh...........',
    '..................gggggghggggggHHhHHHHHHHHhgggggggghgggHHHHHhh..........',
    '..........ggggggggggggggggggggHHHHHHHHHHHgggggggggggggHHHHHHHhh.........',
    '........gggggggggggggggggggggHHHHHHHHHHHgggggggggggggHHHHHHHHHhh........',
    '......ggggggggggggggggggggggHHHHHHHHHHHHggggggggggggHHHHHHHHHHHh........',
    '.....ggggggggggggggggggggggHHHHHHHHHHHHggggggggggggHHHHHHHHHHHHhh.......',
    '....ggggggggggggggggggggggHHHHHHHHHHHHHgggggggggggHHHHHHHHHHHHHhh.......',
    '...gggggghggggggHghggggggHHhHHHHHHHHHHggggggghgggHHHHHhHHHHHHHhhhh......',
    '...ggggggggggggHHgggggggHHHHHHHHHHHHHhggggggggggHHHHHHHHHHHHHhhhhh......',
    '..ggggggggggggHHHggggggHHHHHHHHHHHHHhhgggggggggHHHHHHHHHHHHHhhhhhh......',
    '..gggggggggggHHHHgggggHHHHHHHHHHHHHhhhggggggggHHHHHHHHHHHHHhhhhhhh......',
    '.gggggggggggHHHHHHgggHHHHHHHHHHHHHhhhhgggggggHHHHHHHHHHHHHhhhhhhhh......',
    '.ggggggggggHHHHHHHggHHHHHHHHHHHHHhhhhhggggggHHHHHHHHHHHHHhhhhhhhhh......',
    '.gghggggggHHhHHHHHgHHhHHHHHHHHHHhhhhhhghgggHHHHHhHHHHHHHhhhhhhhhhh......',
    '.ggggggggHHHHHHHHHHHhHHHHHHHHHHhhhhhhhggggHHHHHHHHHHHHHhhhhhhhhhhh......',
    '.gggggggHHHHHHHHHHHhhhHHHHHHHHhhhhhhhhhggHHHHHHHHHHHHHhhhhhgggggg.......',
    '.ggggggHHHHHHHHHHHhhhhHHHHHHHhhhhhhhhhhgggggggggHHHHHhhhhgggggggggH.....',
    '.gggggHHHHHHHHHHHhhhhggggggHhhhhhhhhhhggggggggggggHHhhhggggggggggHHhh...',
    '.ggggHHHHHHHHHHHhhgggggggggggHhhhhhhgggggggggggggHHhhhggggggggggHHHHhh..',
    '..ggHHhHHHHHHHHhhggggggghgggHHhhhhhggggggghgggggHHHhhhgggggghggHHHHHHh..',
    '..gHHHHHHHHHHHhhgggggggggggHHHHhhhgggggggggggggHHHHHhhggggggggHHHHHHHHh.',
    '...HHHHHHHHHHhhgggggggggggHHHHHHhgggggggggggggHHHHHHHhhggggggHHHHHHHHHh.',
    '...hhHHHHHHHhhgggggggggggHHHHHHHHggggggggggggHHHHHHHHHhgggggHHHHHHHHHhhh',
    '....hgggggghhgggggggggggHHHHHHHHggggggggggggHHHHHHHHHHhhgggHHHHHHHHHhhhh',
    '...ggggggggHhggggggggggHHHHHHHHHgggggggggggHHHHHHHHHHHhhggHHHHHHHHHhhhhh',
    '..ggggggghHHHhgggghgggHHHHHhHHHggggghgggggHHHhHHHHHHHhhhhHHHHHHhHHhhhhhh',
    '.ggggggggHHHHHhggggggHHHHHHHHHHggggggggggHHHHHHHHHHHhhhhhHHHHHHHHhhhhhhh',
    '.gggggggHHHHHHhgggggHHHHHHHHHHHgggggggggHHHHHHHHHHHhhhhhhHHHHHHHhhhhhhhh',
    'gggggggHHHHHHHhhgggHHHHHHHHHHHhggggggggHHHHHHHHHHHhhhhhhhHHHHHHhhhhhhhh.',
    'ggggggHHHHHHHhhhggHHHHHHHHHHHhhgggggggHHHHHHHHHHHhhhhhhhhHHHHHhhhhhhhhh.',
    'gggggHHHHHHHhhhhgHHHHHHHHHHHhhhggggggHHHHHHHHHHHhhhhhhhhhHHHHhhhhhhhhh..',
    'ggghHHHHHHHhhhhhHHHHHhHHHHHhhhhgggggHHHhHHHHHHHhhhhhhhhhhhHHhhhhhhhhhh..',
    'gggHHHHHHHhhhhhhHHHHHHHHHHhhhhhggggHHHHHHHHHHHhhhhhhhhhhhHHhhhhhhhhhh...',
    'ggHHHHHHHhhhhhhhHHHHHHHHHhhhhhhhggHHHHHHHHHHHhhhhhhhhhhh.hhhhhhhhhh.....',
    '.HHHHHHHhhhhhhhHHHHHHHHHhhhhhhhhgHHHHHHHHHHHhhhhhhhhhhhh...hhhhhh.......',
    '.hHHHHHhhhhhhhhHHHHHHHHhhhhhhhhhhHHHHHHHHHHhhhhhhhhhhhh.................',
    '..hHHHhhhhhhhh.hHHHHHHhhhhhhhhhhhhhHHHHHHHhhhhhhhhhhhhh.................',
    '...hhhhhhhhhh...hHHHHhhhhhhhhhhh..hhHHHHHhhhhhhhhhhhhh..................',
    '.....hhhhhh......hhHhhhhhhhhhhh....hhHHHhhhhhhhhhhhhh...................',
    '..................hhhhhhhhhhhh......hhhhhhhhhhhhhhhh....................',
    '.....................hhhhhh...........hhhhhhhhhhhh......................',
    '........................................hhhhhhhh........................',
    '........................................................................',
  ],
  cols: [28, R(16), 28],
  rows: [20, R(18), 20],
};

/** 상자로 만든 인형극 무대 */
export const STAGE: Sliced = {
  g: [
    '.######################.',
    '#QQQQQQQQQQQQQQQQQQQQQQ#',
    '#CCCCCCCCCCCCCCCCCCCCCC#',
    '#CCCCCCCCCCCCCCCCCCCCCC#',
    '#cccccccccccccccccccccc#',
    '#cc#CCCCCCCCCCCCCCCC#cc#',
    '#cc#cCCccCCccCCccCCc#cc#',
    '#cc#occooccooccoocco#cc#',
    '#cc#oooooooooooooooo#cc#',
    '#cc#oooooooooooooooo#cc#',
    '#cc#oooooooooooooooo#cc#',
    '#cc##################cc#',
    '#OOOOOOOOOOOOOOOOOOOOOO#',
    '#WWWWWWWWWWWWWWWWWWWWWW#',
    '#WWWWWWWWWYYYYWWWWWWWWW#',
    '#WWWWWWWWWWWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWWWWWWWWWWW#',
    '#wwwwwwwwwwwwwwwwwwwwww#',
    '.######################.',
  ],
  cols: [4, R(16), 4],
  rows: [9, R(2), 4, R(2), 2],
};

/** 욕조: 흰 테 · 물 (1 윗물빛 · 2 물 · 3 깊은 물) · 앞면 · 발 */
export const TUB: Sliced = {
  g: [
    '.######################.',
    '#XEEEEEEEEEEEEEEEEEEEEf#',
    '#EEEEEEEEEEEEEEEEEEEEEf#',
    '#EEfffffffffffffffffEEf#',
    '#EEf1111111111111111EEf#',
    '#EEf1222222222222222EEf#',
    '#EEf2222222222222222EEf#',
    '#EEf2222222222222222EEf#',
    '#EEf2222222222222222EEf#',
    '#EEf2222222222222222EEf#',
    '#EEf3333333333333333EEf#',
    '#EEEEEEEEEEEEEEEEEEEEEf#',
    '#FFFFFFFFFFFFFFFFFFFFFf#',
    '#FFFFFFFFFFFFFFFFFFFFFf#',
    '#FFFFFFFFFFFFFFFFFFFFFf#',
    '#FFFFFFFFFFFFFFFFFFFFFf#',
    '#ffffffffffffffffffffff#',
    '#ffffffffffffffffffffff#',
    '.#ff#..............#ff#.',
    '..##................##..',
  ],
  cols: [5, R(14), 5],
  rows: [5, R(5), 2, R(4), 4],
};

/** 거품 (드문드문 되풀이) */
export const BUBBLES: Grid = [
  '..##..........................',
  '.#XX#.........................',
  '#XUUU#...........##...........',
  '#UUUu#..........#XU#..........',
  '.#uu#...........#Uu#..........',
  '..##.............##...........',
  '..............................',
  '.........................##...',
  '.......##...............#XU#..',
  '......#XUU#.............#Uu#..',
  '......#UUu#..............##...',
  '.......##.....................',
  '..............................',
  '..............................',
  '..................##..........',
  '.................#XU#.........',
  '.................#Uu#.........',
  '..................##..........',
];

/** 수도꼭지 */
export const FAUCET: Grid = [
  '.####.',
  '#MMMm#',
  '#Mmmm#',
  '.#mm#.',
  '..##..',
];

/** 세면대: 거울장 · 수도꼭지 · 둥근 대야 · 흰 장 */
export const SINK: Sliced = {
  g: [
    '.######################.',
    '#gggggggggggggggggggggg#',
    '#gXXXXggggggggggggggggG#',
    '#gggggggggggggggggggggG#',
    '#gggggggggggggggggggggG#',
    '#gggggggggggggggggggggG#',
    '#gggggggggggggggggggggG#',
    '#GGGGGGGGGGGGGGGGGGGGGG#',
    '.######################.',
    '..........#MM#..........',
    '..........#Mm#..........',
    '.........#MMmm#.........',
    '#EEEEEEEEEEEEEEEEEEEEEE#',
    '#E####################f#',
    '#E#111111111111111111#f#',
    '#E#222222222222222222#f#',
    '#E#222222222222222222#f#',
    '#E####################f#',
    '#EEEEEEEEEEEEEEEEEEEEEE#',
    '#FFFFFFFFFFFFFFFFFFFFFF#',
    '#FFFFFFFFFFFFFFFFFFFFFF#',
    '#FFFFFFFFFFFFFFFFFFFFFF#',
    '#FFFFFFFFFFFFFFFFFFFFFF#',
    '#FFFFFFFFFFFFFFFFFFFFFF#',
    '#FFFFFFFFFFFFFFFFFFFFFF#',
    '#ffffffffffffffffffffff#',
    '.######################.',
  ],
  cols: [4, R(16), 4],
  rows: [9, 3, 7, R(6), 2],
};

/** 나무 그네: 들보 · 기둥 둘 · 밧줄 (되풀이) · 판자 */
export const SWING: Sliced = {
  g: [
    '########################',
    '#OOOOOOOOOOOOOOOOOOOOOO#',
    '#wwwwwwwwwwwwwwwwwwwwww#',
    '########################',
    '.#Ow#..r........r..#Ow#.',
    '.#Ow#..r........r..#Ow#.',
    '.#Ow#..r........r..#Ow#.',
    '.#Ow#..r........r..#Ow#.',
    '.#Ow#..r........r..#Ow#.',
    '.#Ow################Ow#.',
    '.#Ow#OOOOOOOOOOOOOO#Ow#.',
    '.#Ow#wwwwwwwwwwwwww#Ow#.',
    '.#Ow################Ow#.',
    '.#Ow#..............#Ow#.',
    '.#Ow#..............#Ow#.',
    '#Oww#..............#Oww#',
    '####................####',
  ],
  cols: [8, R(8), 8],
  rows: [4, R(5), 8],
};

/** 빨간 우체통 · 노란 깃발 · 나무 기둥 */
export const MAILBOX: Grid = [
  '........................',
  '..................##....',
  '..................#Y#...',
  '....###############Y#...',
  '...#QQQQQQQQQQQQQQ#y#...',
  '..#QRRRRRRRRRRRRRRr#....',
  '..#QRRRRRRRRRRRRRRr#....',
  '..#RkkkkkkkkkkRRRRr#....',
  '..#RRRRRRRRRRRRRRRr#....',
  '..#RRRRRRRRRRRRRRRr#....',
  '..#RRRRRRRRRRRRRRRr#....',
  '..#rrrrrrrrrrrrrrrr#....',
  '...################.....',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '.........#Ww#...........',
  '........#Wwww#..........',
  '.........####...........',
];

/** 자전거 (앞이 오른쪽): 바퀴 둘 · 틀 (c 색) · 안장 · 손잡이 */
export const BIKE: Grid = [
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '.................sssss..........................',
  '................sssssss........kkkkk............',
  '...................c.............c..k...........',
  '...................c.............c..............',
  '...................cc............cc.............',
  '....................c.............c.............',
  '....................ccccccccccccccc.............',
  '.......tttttt......cccccccccccccccctttttt.......',
  '.....tttttttttt...cccc..........ccccttttttt.....',
  '....ttTTTTTTTTtt.cc..c.........cctTcTTTTTTtt....',
  '...ttTT......TTtcc...cc.......cctTTcc....TTtt...',
  '..ttT..........cct....c......cctT...c......Ttt..',
  '..tTT.........ccTt....c.....cctTT...c......TTt..',
  '.ttT.........cc.Ttt...cc...ccttT....cc......Ttt.',
  '.ttT........cc..Ttt....c..cc.ttT.....c......Ttt.',
  '.ttT.......cc...Ttt....sscc..ttT.....cc.....Ttt.',
  '.ttT......CCCCCCCCCCCCCCcc...ttT......c.....Ttt.',
  '.ttT......c.....Ttt.....cs...ttT......c.....Ttt.',
  '.ttT............Ttt..........ttT............Ttt.',
  '..tTT..........TTt............tTT..........TTt..',
  '..ttT..........Ttt............ttT..........Ttt..',
  '...ttTT......TTtt..............ttTT......TTtt...',
  '....ttTTTTTTTTtt................ttTTTTTTTTtt....',
  '.....tttttttttt..................tttttttttt.....',
  '.......tttttt......................tttttt.......',
  '................................................',
];

/** 난간: 손잡이 띠 · 살 (되풀이) · 아래 띠 */
export const RAILING: Sliced = {
  g: [
    '#####',
    'XXXXX',
    'EEEEE',
    'fffff',
    '#####',
    '.#E#.',
    '.#E#.',
    '.#E#.',
    '.#f#.',
    '#####',
    'fffff',
    '#####',
  ],
  cols: [R(5)],
  rows: [5, R(3), 4],
};

/** 나무 등받이 없는 의자 */
export const STOOL: Sliced = {
  g: [
    '..####################..',
    '.#GOOOOOOOOOOOOOOOOOOw#.',
    '.#OOOOOOOOOOOOOOOOOOOw#.',
    '.#OOOOOOOOOOOOOOOOOOOw#.',
    '.#WWWWWWWWWWWWWWWWWWWv#.',
    '.#wwwwwwwwwwwwwwwwwwwv#.',
    '..####################..',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#Ww#..........#Wv#...',
    '...#vv#..........#vv#...',
    '....##............##....',
    '........................',
  ],
  cols: [7, R(10), 7],
  rows: [7, R(20), 3],
};

/** 꽃 화분 하나 (1 = 꽃 색) */
export const POT: Grid = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '.........#11#...........',
  '........#1X11#..........',
  '........#1111#..........',
  '.........#11#...........',
  '..........l.............',
  '..........lL............',
  '.........Ll.............',
  '..........l.............',
  '..........lLL...........',
  '..........l.............',
  '..........l.............',
  '..##################....',
  '..#TTTTTTTTTTTTTTTt#....',
  '..#dddddddddddddddd#....',
  '...################.....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '...#TTTTTTTTTTTTTTt#....',
  '....#TTTTTTTTTTTTt#.....',
  '....#TTTTTTTTTTTTt#.....',
  '....#TTTTTTTTTTTTt#.....',
  '....#tttttttttttttt#....',
  '.....#############......',
];

/** 방석: 통통한 둥근 네모 */
export const CUSHION: Sliced = {
  g: [
    '.....##############.....',
    '...##QQQQQQQQQQQQQQ##...',
    '..#QQQQQQQQQQQQQQQQQQ#..',
    '.#QQCCCCCCCCCCCCCCCCcc#.',
    '.#QCCCCCCCCCCCCCCCCCCc#.',
    '#QCCCCCCCCCCCCCCCCCCCcc#',
    '#QCCCCCCCCCCCCCCCCCCCcc#',
    '#CCCCCCCCCCCCCCCCCCCCcc#',
    '#CCCCCCCCCCCCCCCCCCCCcc#',
    '#CCCCCCCCCCCCCCCCCCCCcc#',
    '#CCCCCCCCCCCCCCCCCCCCcc#',
    '#CCCCCCCCCCCCCCCCCCCccc#',
    '#cCCCCCCCCCCCCCCCCCcccc#',
    '.#ccccccccccccccccccc#..',
    '..#ccccccccccccccccc#...',
    '...##kkkkkkkkkkkkk##....',
    '.....#############......',
  ],
  cols: [8, R(8), 8],
  rows: [7, R(4), 6],
};

/** 방석 가운데 단추 */
export const BUTTON: Grid = [
  '.k.',
  'kAk',
  '.k.',
];

/** 이 파일의 격자 · 팔레트 (시험용) */
export function allFurnCGrids(): [string, Grid, Palette][] {
  const blue = hex('#5a9ad8');
  return [
    ['HBED', HBED.g, hbedPal(blue)], ['GM_HEAD', GM_HEAD, gmPal()], ['IV', IV.g, ivPal()], ['FENCE', FENCE.g, fencePal(blue)], ['FLOWER_ROW', FLOWER_ROW, flowerPal()],
    ['PLANTER', PLANTER.g, flowerPal()], ['PUDDLE', PUDDLE.g, puddlePal(blue)], ['MUD', MUD.g, puddlePal(blue)], ['BUTTON', BUTTON, clothPal(blue)], ['BUSH', BUSH.g, bushPal(blue)], ['STAGE', STAGE.g, stagePal()], ['TUB', TUB.g, tubPal()],
    ['BUBBLES', BUBBLES, tubPal()], ['FAUCET', FAUCET, tubPal()], ['SINK', SINK.g, sinkPal()], ['SWING', SWING.g, swingPal()], ['MAILBOX', MAILBOX, mailboxPal()],
    ['BIKE', BIKE, bikePal(blue)], ['RAILING', RAILING.g, railPal()], ['STOOL', STOOL.g, woodPal(blue)], ['POT', POT, potPal(blue)], ['CUSHION', CUSHION.g, clothPal(blue)],
  ];
}
