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
  return { G: shade(leaf, 0.3), g: shade(leaf, 0.14), H: leaf, h: shade(leaf, -0.18), e: shade(leaf, -0.36) };
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

/** 물웅덩이 (둥근 모서리 9-조각): 짙은 가장자리 d · 물 W · 하늘 비친 반짝 X · 아래쪽 깊은 물 w */
export const PUDDLE: Sliced = {
  g: [
    '.........dddddddddddddd.........',
    '......ddddWWWWWWWWWWWWdddd......',
    '....dddWWWWWWWWWWWWWWWWWWddd....',
    '..dddWXXXXXXWWWWWWWWWWWWWWWddd..',
    '.ddWWWWWWWWWWWWWWWWWWWWWWWWWWdd.',
    'ddWWWWWWWWWWWWWWWWWWWWWWWWWWWWdd',
    'dWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWd',
    'dWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWd',
    'dWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWd',
    'dWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWd',
    'ddWWWWWWWWWWWWWWWWWWWWWWWWwwwwdd',
    '.ddWWWWWWWWWWWWWWWWWWWWWwwwwwdd.',
    '..dddWWWWWWWWWWWWWWWWwwwwwwddd..',
    '....dddwwwwwwwwwwwwwwwwwwddd....',
    '......ddddwwwwwwwwwwwwdddd......',
    '.........dddddddddddddd.........',
  ],
  cols: [12, R(8), 12],
  rows: [6, R(4), 6],
};

/** 진흙 웅덩이 (같은 모양): 가장자리 d · 진흙 W · 마른 흙덩이 X · 젖은 그늘 w */
export const MUD: Sliced = {
  g: [
    '.........dddddddddddddd.........',
    '......ddddWWWWWWWWWWWWdddd......',
    '....dddWWWWXXWWWWWWWWWWWWWddd...'.slice(0, 31) + '.',
    '..dddWWWWWXXXWWWWWWWWWWWWWWddd..',
    '.ddWWWWWWWWWWWWWWWWWWWWXXWWWWdd.',
    'ddWWWXXWWWWWWWWWWWWWWWWWWWWWWWdd',
    'dWWWWXXWWWWWWWWWWWWWWWWWWWWXXWWd',
    'dWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWd',
    'dWWWWWWWWWWWWWWWWWWWWWWWXWWWWWWd',
    'dWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWd',
    'ddWWWWWWWXXWWWWWWWWWWWWWWWwwwwdd',
    '.ddWWWWWWWWWWWWWWWWWWWWWwwwwwdd.',
    '..dddWWWWWWWWWWWWWWWWwwwwwwddd..',
    '....dddwwwwwwwwwwwwwwwwwwddd....',
    '......ddddwwwwwwwwwwwwdddd......',
    '.........dddddddddddddd.........',
  ],
  cols: [12, R(8), 12],
  rows: [6, R(4), 6],
};

/** 잎 덩이 큰 것 (20×16): 왼쪽 위 빛 G g · 바탕 H · 그늘 h · 깊은 그늘 e. 덤불 · 나무 잎은 이 덩이들을 겹쳐 놓는다 */
export const CLUMP_L: Grid = [
  '.......######.......',
  '....###gGGGgHH###...',
  '...#gGGGGgHHHHHHh#..',
  '..#gGGGgHHHHHHHHhh#.',
  '.#gGGgHHHHHHHHHHHhh#',
  '.#gGgHHHHHHhHHHHHhh#',
  '#gGgHHHHHHHHHHHHHhh#',
  '#ggHHHHhHHHHHHHhhhh#',
  '#gHHHHHHHHHHHHhhhhh#',
  '#HHHHhHHHHHHHhhhhhe#',
  '#HHHHHHHHHHhhhhhhee#',
  '.#hHHHHHHhhhhhhheee#',
  '.#hhHHhhhhhhhheee#..',
  '..##hhhhhhhheeee#...',
  '....###heeeee####...',
  '.......#######......',
];
/** 잎 덩이 가운데 것 (16×13) */
export const CLUMP_M: Grid = [
  '.....######.....',
  '...##gGGgHH##...',
  '..#gGGGgHHHHh#..',
  '.#gGGgHHHHHHhh#.',
  '.#gGgHHHHHHHHh#.',
  '#gGgHHHHHHHhHhh#',
  '#ggHHHHhHHHHHhh#',
  '#gHHHHHHHHHHhhh#',
  '#HHHhHHHHHHhhhh#',
  '.#HHHHHHHhhhhe#.',
  '.#hHHhhhhhhhee#.',
  '..##hhhhheee##..',
  '....########....',
];
/** 잎 덩이 작은 것 (12×10) */
export const CLUMP_S: Grid = [
  '....####....',
  '..##gGgH##..',
  '.#gGGgHHHh#.',
  '#gGgHHHHHhh#',
  '#gHHHHHHhhh#',
  '#HHHhHHHhhh#',
  '#HHHHHHhhhe#',
  '.#hhHHhhhe#.',
  '..##hhhee#..',
  '....#####...',
];

/** 덤불 마디 둘 (24px 폭 · 58줄 높이 기준, 번갈아 놓는다): 뒤 → 앞 차례로 겹쳐 놓을 잎 덩이 [덩이, x, y] */
export const BUSH_LAYOUT: readonly (readonly [Grid, number, number])[][] = [
  [[CLUMP_S, 2, 2], [CLUMP_M, 10, 0], [CLUMP_L, -4, 12], [CLUMP_M, 12, 14], [CLUMP_M, -2, 26], [CLUMP_L, 8, 26], [CLUMP_L, -6, 40], [CLUMP_L, 10, 42]],
  [[CLUMP_M, 4, 4], [CLUMP_S, 14, 8], [CLUMP_M, -2, 16], [CLUMP_L, 6, 12], [CLUMP_L, -4, 28], [CLUMP_M, 12, 30], [CLUMP_M, -2, 42], [CLUMP_L, 6, 41]],
];

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

/** 자전거 바퀴 (18×18): 타이어 t · 바퀴통 o */
export const BIKE_WHEEL: Grid = [
  '......######......',
  '....##tttttt##....',
  '...#tt######tt#...',
  '..#t##......##t#..',
  '.#t#..........#t#.',
  '.#t#..........#t#.',
  '#t#............#t#',
  '#t#............#t#',
  '#t#.....oo.....#t#',
  '#t#.....oo.....#t#',
  '#t#............#t#',
  '#t#............#t#',
  '.#t#..........#t#.',
  '.#t#..........#t#.',
  '..#t##......##t#..',
  '...#tt######tt#...',
  '....##tttttt##....',
  '......######......',
];
/** 자전거 틀 (32×14, 앞이 오른쪽): 안장 s · 손잡이 k · 윗대 C · 틀 c · 크랭크 o */
export const BIKE_FRAME: Grid = [
  '....ssss...................kk...',
  '......c....................c....',
  '......c....................c....',
  '......CCCCCCCCCCCCCCCCCCCCCC....',
  '.....c.c.................c.c....',
  '.....c..c...............c...c...',
  '....c....c............c.....c...',
  '....c.....c..........c.......c..',
  '...c.......c........c........c..',
  '...c........c.....c..........c..',
  '..c..........c...c............c.',
  '..c...........c.c.............c.',
  '.cccccccccccccco..............c.',
  '..............kk................',
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
    ['PLANTER', PLANTER.g, flowerPal()], ['PUDDLE', PUDDLE.g, puddlePal(blue)], ['MUD', MUD.g, puddlePal(blue)], ['BUTTON', BUTTON, clothPal(blue)], ['CLUMP_L', CLUMP_L, bushPal(blue)], ['CLUMP_M', CLUMP_M, bushPal(blue)], ['CLUMP_S', CLUMP_S, bushPal(blue)], ['STAGE', STAGE.g, stagePal()], ['TUB', TUB.g, tubPal()],
    ['BUBBLES', BUBBLES, tubPal()], ['FAUCET', FAUCET, tubPal()], ['SINK', SINK.g, sinkPal()], ['SWING', SWING.g, swingPal()], ['MAILBOX', MAILBOX, mailboxPal()],
    ['BIKE_WHEEL', BIKE_WHEEL, bikePal(blue)], ['BIKE_FRAME', BIKE_FRAME, bikePal(blue)], ['RAILING', RAILING.g, railPal()], ['STOOL', STOOL.g, woodPal(blue)], ['POT', POT, potPal(blue)], ['CUSHION', CUSHION.g, clothPal(blue)],
  ];
}
