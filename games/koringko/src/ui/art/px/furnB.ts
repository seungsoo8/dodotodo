/**
 * 가구 손찍기 격자 2: 벽에 거는 것 · 바닥에 까는 것 (창 · 문 · 러그 · 액자 · 벽시계 · 생일 깃발 · 달력 · 인형 뽑기 기계).
 * 크기를 바꾸는 것은 조각 맞춤(Sliced: cols · rows 조각)으로 늘인다.
 *
 * 글자: 창 E F f d G (흰 테 · 그늘 · 유리 안 그늘 · 창턱 빛) · 1~6 하늘 띠 · X x 구름/눈 · M m 달 · r R 비,
 *       커튼 · 러그는 천 글자 (Q C c k A), 문 · 액자는 나무 글자 (G O W w v Y y).
 */
import { hex, mix, shade, type Color } from '../paint.ts';
import { type Grid, type Palette } from './grid.ts';
import { clothPal, woodPal, type Sliced } from './furnA.ts';
import { type Seg } from './slice.ts';

const R = (n: number): Seg => [n, 'r'];

export type Sky = 'day' | 'night' | 'rain' | 'dusk' | 'snow';

const SKY_TOP: Record<Sky, string> = { night: '#1a2048', dusk: '#f0906a', rain: '#6a7a8a', snow: '#5a6488', day: '#8ac8f0' };
const SKY_BOT: Record<Sky, string> = { night: '#3a3a78', dusk: '#f8d08a', rain: '#8a98a8', snow: '#a8b0c8', day: '#d0ecff' };

/** 창 팔레트: 흰 테 · 하늘 여섯 띠 (위 → 아래) · 구름 · 달 · 비 · 눈 · 커튼 (방 무늬 색) */
export function windowPal(sky: Sky, accent: Color): Palette {
  const white = hex('#f8f4ec');
  const top = hex(SKY_TOP[sky] ?? SKY_TOP.day);
  const bot = hex(SKY_BOT[sky] ?? SKY_BOT.day);
  const band: Record<string, Color> = {};
  for (let i = 1; i <= 6; i++) band[String(i)] = mix(top, bot, (i - 1) / 5);
  return {
    ...band,
    E: hex('#ffffff'), F: white, f: shade(white, -0.16), d: mix(top, hex('#202030'), 0.35), G: shade(white, 0.4),
    X: hex('#ffffff'), x: hex('#dfe8f0'), M: hex('#fff4c0'), m: hex('#e8d890'), r: hex('#c8d8e8'), R: hex('#a8b8c8'),
    ...clothPal(shade(accent, -0.1)),
  };
}

export function namePal(): Palette {
  return { L: hex('#f8f0d8'), l: shade(hex('#f8f0d8'), -0.15), k: hex('#6a5a4a'), X: hex('#ffffff') };
}

export function picturePal(): Palette {
  const mat = hex('#f0e4c8');
  return {
    M: mat, m: shade(mat, -0.12), h: hex('#e8e4ec'), G: hex('#ffffff'), S: hex('#f0ccb0'), s: shade(hex('#f0ccb0'), -0.15), e: hex('#3a2a2a'),
    u: hex('#a88ad0'), U: shade(hex('#a88ad0'), 0.25), b: hex('#4a3226'), B: shade(hex('#4a3226'), 0.3), y: hex('#ffd25a'), Y: shade(hex('#ffd25a'), 0.3), k: hex('#6a5a5a'),
  };
}

export function clockPal(): Palette {
  const brass = hex('#c8a060');
  const face = hex('#f4ecdc');
  return { R: shade(brass, 0.2), r: shade(brass, -0.2), k: hex('#3a2c30'), F: face, f: shade(face, -0.1), o: hex('#c84a4a') };
}

export function flagPal(c: Color): Palette {
  return { k: hex('#3a2c30'), '1': c };
}

export function calendarPal(): Palette {
  const red = hex('#e05a5a');
  const paper = hex('#f8f4ec');
  return { H: red, h: shade(red, -0.2), X: hex('#ffffff'), P: paper, p: shade(paper, -0.14), o: hex('#a8a0a0'), x: red };
}

export function clawPal(): Palette {
  const body = hex('#d85a9a');
  return {
    K: body, k: shade(body, -0.25), Q: shade(body, 0.25), B: hex('#fff08a'), b: hex('#ffffff'), g: hex('#9ad0e8'), X: hex('#e8f8ff'),
    R: hex('#e84a4a'), j: hex('#3a3a44'), Y: hex('#ffd84a'), y: shade(hex('#ffd84a'), -0.25), o: hex('#2a2030'),
  };
}

export function plushPal(): Palette {
  return {
    u: hex('#f4f0ec'), U: hex('#ffffff'), e: hex('#2a1c24'), t: hex('#c8905a'), T: shade(hex('#c8905a'), 0.25), r: hex('#8ac0f0'), R: shade(hex('#8ac0f0'), 0.25),
    p: hex('#f0c0d0'), P: shade(hex('#f0c0d0'), 0.2), g: hex('#b8e08a'), G: shade(hex('#b8e08a'), 0.2), b: hex('#a8a0e0'), B: shade(hex('#a8a0e0'), 0.2), f: hex('#f0d070'), F: shade(hex('#f0d070'), 0.25),
    o: hex('#e8884a'), O: shade(hex('#e8884a'), 0.25), W: hex('#fff4e8'), a: hex('#8a8a9a'), A: hex('#b0b0c0'),
  };
}

export { woodPal, clothPal };


/** 창틀: 흰 나무 테 3px · 유리 안쪽 그늘 d · 가운데 열십자 창살 · 아래 창턱 (유리 칸은 투명: 하늘이 비친다) */
export const WINDOW_FRAME: Sliced = {
  g: [
    '.##################.',
    '#EEEEEEEEEEEEEEEEEE#',
    '#EFFFFFFFFFFFFFFFFf#',
    '#EFddddddddddddddff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFdEEEEEEFEEEEEFff#',
    '#EFdfffffFffffffFff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFd.....EF.....Fff#',
    '#EFFFFFFFFFFFFFFFff#',
    '#GGGGGGGGGGGGGGGGGG#',
    '#ffffffffffffffffff#',
    '.##################.',
  ],
  cols: [4, R(5), 2, R(5), 4],
  rows: [4, R(5), 2, R(5), 4],
};

/** 창 하늘 (위에서 아래로 여섯 띠) */
export const SKY_BANDS: Sliced = {
  g: [
    '1',
    '1',
    '2',
    '2',
    '3',
    '3',
    '4',
    '4',
    '5',
    '5',
    '6',
    '6',
  ],
  cols: [1],
  rows: [R(2), R(2), R(2), R(2), R(2), R(2)],
};

/** 낮 구름 (16×7) */
export const CLOUD: Grid = [
  '.....####.......',
  '....#XXXX#......',
  '..##XXXXXX####..',
  '.#XXXXXXXXXXXX#.',
  '#XXXXXXXXXXXXxx#',
  '.#xxxxxxxxxxxx#.',
  '..############..',
];

/** 초승달 (9×8) */
export const MOON: Grid = [
  '..###....',
  '.#MMM#...',
  '#MMm..#..',
  '#MM....#.',
  '#MM....#.',
  '#MMm..##.',
  '.#MMMM#..',
  '..####...',
];

/** 밤 별 (반복, 24×16) */
export const NIGHT_STARS: Grid = [
  '........................',
  '...X....................',
  '..XxX..............x....',
  '...X....................',
  '..........x.............',
  '........................',
  '.................X......',
  '.....x..........XxX.....',
  '.................X......',
  '........................',
  '..x.....................',
  '..........X.........x...',
  '.........XxX............',
  '..........X.............',
  '........................',
  '....................X...',
];

/** 빗줄기 (반복, 16×12) */
export const RAIN: Grid = [
  '..r.........r...',
  '..r.........R...',
  '..R.............',
  '.......r........',
  '.......r....r...',
  '.......R....r...',
  '............R...',
  '...r............',
  '...r......r.....',
  '...R......r.....',
  '..........R.....',
  '................',
];

/** 눈송이 (반복, 12×10) */
export const SNOW: Grid = [
  '..x.........',
  '.xXx.....x..',
  '..x.........',
  '.......x....',
  '...........x',
  '....x.......',
  '...xXx......',
  '....x....x..',
  '............',
  '.x..........',
];

/** 창턱에 쌓인 눈 (반복) */
export const SNOW_SILL: Grid = [
  'XXXXXXXX',
  'xxxXxxxx',
  'xxxxxxxx',
];

/** 커튼 (왼쪽, 오른쪽은 뒤집어): 위 봉 주름 · 세로 주름 (되풀이) · 아래 단 */
export const CURTAIN: Sliced = {
  g: [
    'kkkkkk',
    'QCCcCk',
    'QCcCck',
    'QCCcCk',
    'QCCcCk',
    'QCkcCk',
    'QCCcCk',
    'QCCkCk',
    'QCCcCk',
    'QCCcCk',
    'kckkck',
  ],
  cols: [6],
  rows: [2, R(6), 3],
};

/** 나무 문 (24×48): 테 · 도드라진 판 둘 (되풀이) · 가운데 손잡이 · 아래 굽 */
export const DOOR: Sliced = {
  g: [
    '.######################.',
    '#GOOOOOOOOOOOOOOOOOOOOw#',
    '#OWWWWWWWWWWWWWWWWWWWWw#',
    '#OWWWWWWWWWWWWWWWWWWWWw#',
    '#OWWwwwwwwwwwwwwwwwwWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwvvvvvvvvvvvvvvvWWw#',
    '#OWWOOOOOOOOOOOOOOOOWWw#',
    '#OWWWWWWWWWWWWWWWWWWWWw#',
    '#OWWWWWWWWWWWWWWWWYYyWw#',
    '#OWWWWWWWWWWWWWWWWYGyWw#',
    '#OWWWWWWWWWWWWWWWWyyyWw#',
    '#OWWWWWWWWWWWWWWWWWWWWw#',
    '#OWWwwwwwwwwwwwwwwwwWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwOWWWWWWWWWWWWwvWWw#',
    '#OWWwvvvvvvvvvvvvvvvWWw#',
    '#OWWOOOOOOOOOOOOOOOOWWw#',
    '#OWWWWWWWWWWWWWWWWWWWWw#',
    '#wwwwwwwwwwwwwwwwwwwwww#',
    '#vvvvvvvvvvvvvvvvvvvvvv#',
    '#vvvvvvvvvvvvvvvvvvvvvv#',
    '.######################.',
  ],
  cols: [6, R(12), 6],
  rows: [5, R(14), 8, R(14), 7],
};

/** 할머니 방 이름표 (14×6) */
export const NAMEPLATE: Grid = [
  '##############',
  '#XLLLLLLLLLLL#',
  '#LLkkkkkkkkLl#',
  '#LLLLLLLLLLLl#',
  '#lllllllllll##',
  '##############',
];

/** 러그 (둥근 모서리): 짙은 테 · 밝은 띠 · 가운데 마름모 무늬 (16×8 되풀이) */
export const RUG: Sliced = {
  g: [
    '....kkkkkkkkkkkkkkkkkkkkkkkk....',
    '..kkcccccccccccccccccccccccckk..',
    '.kccQQQQQQQQQQQQQQQQQQQQQQQQcck.',
    '.kcQkkkkkkkkkkkkkkkkkkkkkkkkQck.',
    'kcQkCCCCCCCCCCCCCCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCCCCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCCCCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCACCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCAQACCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCAQCQACCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCAQACCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCACCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCCCCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCCCCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCCCCCCCCCCCCCCkQck',
    'kcQkCCCCCCCCCCCCCCCCCCCCCCCCkQck',
    '.kcQkkkkkkkkkkkkkkkkkkkkkkkkQck.',
    '.kcccccccccccccccccccccccccccck.',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '....kkkkkkkkkkkkkkkkkkkkkkkk....',
  ],
  cols: [8, R(16), 8],
  rows: [6, R(8), 6],
};

/** 액자 테 (짙은 나무, 안은 비어 사진을 끼운다) */
export const FRAME: Sliced = {
  g: [
    '.##############.',
    '#OOOOOOOOOOOOOw#',
    '#OWWWWWWWWWWWWv#',
    '#OWwwwwwwwwwwOv#',
    '#OWw........WOv#',
    '#OWw........WOv#',
    '#OWw........WOv#',
    '#OWw........WOv#',
    '#OWw........WOv#',
    '#OWw........WOv#',
    '#OWw........WOv#',
    '#OWw........WOv#',
    '#OWOOOOOOOOOOOv#',
    '#OWWWWWWWWWWWWv#',
    '#wvvvvvvvvvvvvv#',
    '.##############.',
  ],
  cols: [4, R(8), 4],
  rows: [4, R(8), 4],
};

/** 사진 속 할머니(흰 머리 · 보라 옷)와 하루(갈색 머리 · 노란 옷), 20×20 */
export const PICTURE: Grid = [
  'MMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMM',
  'MMMMhhhhMMMMMMMMMMMM',
  'MMMhGhhhhMMMMMMMMMMM',
  'MMMhSSSShMMMMMMMMMMM',
  'MMMhSeSeSMMMMbbbbMMM',
  'MMMMSSSSMMMMMbBbbbMM',
  'MMMMMssMMMMMMbSSSbMM',
  'MMMuuuuuuMMMMMSeSeMM',
  'MMuuUuuuuuMMMMSSSMMM',
  'MMuUuuuuuuMMMyyyyyMM',
  'MMuuuuuuuuMMyYyyyyyM',
  'MMuuuuuuuuMMyyyyyyyM',
  'MMuuuuuuuuMMMyyyyyMM',
  'MMuuuuuuuuMMMyyyyyMM',
  'MMuuuuuuuuMMMyMMyMMM',
  'MMMuuuuuuMMMMkMMkMMM',
  'MMMMMMMMMMMMMMMMMMMM',
  'mmmmmmmmmmmmmmmmmmmm',
];

/** 둥근 벽시계 (44×44): 놋쇠 테 R r · 안쪽 선 · 시 눈금 넷 · 문자판 (오른쪽 아래 그늘) */
export const CLOCK_FACE: Grid = [
  '.................RRRRRRRRRR.................',
  '..............RRRRRRRRRRRRRRRR..............',
  '............RRRRRRRRRRRRRRRRRRRR............',
  '..........RRRRRRkkkkkkkkkkkkRRRRRR..........',
  '.........RRRRRkkkkkkFkkFkkkkkkRRRRR.........',
  '.......RRRRRkkkkFFFFFkkFFFFFkkkkRRRRR.......',
  '......RRRRkkkkFFFFFFFkkFFFFFFFkkkkRRRr......',
  '.....RRRRkkkFFFFFFFFFkkFFFFFFFFFkkkRrrr.....',
  '.....RRRkkkFFFFFFFFFFFFFFFFFFFFFFkkkrrr.....',
  '....RRRkkkFFFFFFFFFFFFFFFFFFFFFFFFkkkrrr....',
  '...RRRkkkFFFFFFFFFFFFFFFFFFFFFFFFFFkkkrrr...',
  '...RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFkkrrr...',
  '..RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFkkrrr..',
  '..RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFkkrrr..',
  '.RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFkkrrr.',
  '.RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFkkrrr.',
  '.RRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFffkkrr.',
  'RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfffkkrrr',
  'RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFffffkkrrr',
  'RRRkkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfffffkkrrr',
  'RRRkFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfffffffkrrr',
  'RRRkkkkkFFFFFFFFFFFFFFFFFFFFFFFFffffkkkkkrrr',
  'RRRkkkkkFFFFFFFFFFFFFFFFFFFFFFFfffffkkkkkrrr',
  'RRRkFFFFFFFFFFFFFFFFFFFFFFFFFFffffffffffkrrr',
  'RRRkkFFFFFFFFFFFFFFFFFFFFFFFFffffffffffkkrrr',
  'RRRkkFFFFFFFFFFFFFFFFFFFFFFFfffffffffffkkrrr',
  'RRRkkFFFFFFFFFFFFFFFFFFFFFFffffffffffffkkrrr',
  '.RRkkFFFFFFFFFFFFFFFFFFFFFfffffffffffffkkrr.',
  '.RRRkkFFFFFFFFFFFFFFFFFFFfffffffffffffkkrrr.',
  '.RRRkkFFFFFFFFFFFFFFFFFFffffffffffffffkkrrr.',
  '..RRRkkFFFFFFFFFFFFFFFFffffffffffffffkkrrr..',
  '..RRRkkFFFFFFFFFFFFFFFfffffffffffffffkkrrr..',
  '...RRRkkFFFFFFFFFFFFFfffffffffffffffkkrrr...',
  '...RRRkkkFFFFFFFFFFFfffffffffffffffkkkrrr...',
  '....RRRkkkFFFFFFFFFfffffffffffffffkkkrrr....',
  '.....RRRkkkFFFFFFFfffffffffffffffkkkrrr.....',
  '.....RRrrkkkFFFFFffffkkfffffffffkkkrrrr.....',
  '......rrrrkkkkFFfffffkkfffffffkkkkrrrr......',
  '.......rrrrrkkkkfffffkkfffffkkkkrrrrr.......',
  '.........rrrrrkkkkkkfkkfkkkkkkrrrrr.........',
  '..........rrrrrrkkkkkkkkkkkkrrrrrr..........',
  '............rrrrrrrrrrrrrrrrrrrr............',
  '..............rrrrrrrrrrrrrrrr..............',
  '.................rrrrrrrrrr.................',
];

/** 바늘 (12시 · 3시, 축이 왼쪽 아래 3칸 위) */
export const CLOCK_HANDS: Grid = [
  '...k...',
  '...k...',
  '...k...',
  '...k...',
  '...k...',
  '...k...',
  '...okkk',
];

/** 생일 깃발 한 장 (줄 아래 세모, 1 = 깃발 색) */
export const FLAG: Grid = [
  'kkkkkkkkk',
  '.#######.',
  '.#11111#.',
  '.#11111#.',
  '..#111#..',
  '..#111#..',
  '...#1#...',
  '...#1#...',
  '....#....',
];

/** 벽 달력: 빨간 머리 · 날짜 점 (4×3 되풀이) */
export const CALENDAR: Sliced = {
  g: [
    '.######################.',
    '#HHHHHHHHHHHHHHHHHHHHHH#',
    '#HXXXXXXHHHHHHHHHHHHHHh#',
    '#HHHHHHHHHHHHHHHHHHHHHH#',
    '#hhhhhhhhhhhhhhhhhhhhhh#',
    '#PPPPPPPPPPPPPPPPPPPPPp#',
    '#PPoPPPoPPPoPPPoPPPoPPp#',
    '#PPPPPPPPPPPPPPPPPPPPPp#',
    '#PPPPPPPPPPPPPPPPPPPPPp#',
    '#PPoPPPoPPPoPPPoPPPoPPp#',
    '#PPPPPPPPPPPPPPPPPPPPPp#',
    '#PPPPPPPPPPPPPPPPPPPPPp#',
    '#PPoPPPoPPPoPPPoPPPoPPp#',
    '#PPPPPPPPPPPPPPPPPPPPPp#',
    '#pppppppppppppppppppppp#',
    '.######################.',
  ],
  cols: [2, R(20), 2],
  rows: [6, R(3), 7],
};

/** 지운 날 X (5×5) */
export const CROSS: Grid = [
  'x...x',
  '.x.x.',
  '..x..',
  '.x.x.',
  'x...x',
];


/** 인형 뽑기 기계: 불빛 띠 · 유리 상자 (되풀이) · 조이스틱 · 버튼 · 꺼내는 구멍 */
export const CLAW_BODY: Sliced = {
  g: [
    '.######################.',
    '#KBKbKBKbKBKbKBKbKBKbkk#',
    '#QQQQQQQQQQQQQQQQQQQQkk#',
    '#KK##################kk#',
    '#KK#Xggggggggggggggg#kk#',
    '#KK#Xggggggggggggggg#kk#',
    '#KK#Xggggggggggggggg#kk#',
    '#KK#Xggggggggggggggg#kk#',
    '#KK#gggggggggggggggg#kk#',
    '#KK#gggggggggggggggg#kk#',
    '#KK##################kk#',
    '#QQQQQQQQQQQQQQQQQQQQkk#',
    '#K..#.KKKKKKK#######Kkk#',
    '#K.#R#KKKKKKK#ooooo#Kkk#',
    '#K#RXR#KKKKKK#ooooo#Kkk#',
    '#K.#R#KKKYyKK#ooooo#Kkk#',
    '#K.#j#KKKyyKK#ooooo#Kkk#',
    '#K#jjj#KKKKKK#######Kkk#',
    '#kkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkk#',
    '.######################.',
  ],
  cols: [7, R(2), 15],
  rows: [4, R(4), 2, 11],
};

/** 쌓인 인형 (얼굴 · 귀, 반복 20×11) */
export const PLUSH_PILE: Grid = [
  '...##........##.....',
  '..#uu#..##..#rr#....',
  '.#uUuu##tt##rRrr#...',
  '.#ueue#tTtt#rere#.##',
  '##uuuu#tete#rrrr##ff',
  '#pp##p#tttt#.##.#fFf',
  '#pPpp#.####.#gg#fefe',
  '#pepe##bbbb#gGgg#fff',
  '#pppp#bBbbb#gege#fff',
  '######bebeb#gggg####',
  '#uuuu#bbbbb######uuu',
];

/** 맨 아래 깔린 주황 여우 (루루) */
export const FOX: Grid = [
  '#....#',
  '#o##o#',
  '#oOoo#',
  '#eooe#',
  '#oWWo#',
  '.####.',
];

/** 집게 (레일 · 줄 · 세 갈래 발) */
export const CLAW_ARM: Grid = [
  '#######',
  '...a...',
  '...a...',
  '...a...',
  '...a...',
  '...a...',
  '...a...',
  '...a...',
  '...a...',
  '..#A#..',
  '.#AAA#.',
  '#a...a#',
  '#a...a#',
  '.a...a.',
];

/** 이 파일의 격자 · 팔레트 (시험용) */
export function allFurnBGrids(): [string, Grid, Palette][] {
  const wp = windowPal('night', hex('#c8a0b8'));
  return [
    ['WINDOW_FRAME', WINDOW_FRAME.g, wp], ['SKY_BANDS', SKY_BANDS.g, wp], ['CLOUD', CLOUD, wp], ['MOON', MOON, wp], ['NIGHT_STARS', NIGHT_STARS, wp], ['RAIN', RAIN, wp],
    ['SNOW', SNOW, wp], ['SNOW_SILL', SNOW_SILL, wp], ['CURTAIN', CURTAIN.g, wp], ['DOOR', DOOR.g, woodPal(hex('#b07a48'))], ['NAMEPLATE', NAMEPLATE, namePal()],
    ['RUG', RUG.g, clothPal(hex('#c86a7a'))], ['FRAME', FRAME.g, woodPal(hex('#8a5a3a'))], ['PICTURE', PICTURE, picturePal()], ['CLOCK_FACE', CLOCK_FACE, clockPal()],
    ['CLOCK_HANDS', CLOCK_HANDS, clockPal()], ['FLAG', FLAG, flagPal(1)], ['CALENDAR', CALENDAR.g, calendarPal()], ['CROSS', CROSS, calendarPal()],
    ['CLAW_BODY', CLAW_BODY.g, clawPal()], ['PLUSH_PILE', PLUSH_PILE, plushPal()], ['FOX', FOX, plushPal()], ['CLAW_ARM', CLAW_ARM, plushPal()],
  ];
}
