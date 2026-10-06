/**
 * 가구 손찍기 격자 1: 침대 · 아기 침대 · 책상 · 의자 · 책장 · 장롱 · 장난감 상자 · 식탁 · 소파 · TV · 화분 · 이삿짐 상자 · 재봉틀.
 * 크기를 바꾸는 가구는 조각 맞춤(px/slice.ts)으로 늘인다: 각 격자 옆에 가로 cols · 세로 rows 조각을 적는다.
 *
 * 글자 (이 파일 공용):
 *   나무   G 반짝 · O 밝음(윗면) · W 바탕(앞면) · w 그늘 · v 깊은 그늘(옆면) · Y 놋쇠 손잡이 · y 손잡이 그늘
 *   천     Q 밝음 · C 바탕 · c 그늘 · k 바느질 · 주름 · A 무늬
 *   흰 천  S 홑청 · s 홑청 그늘 · P 베개 · p 베개 그늘 · X 흰 반짝
 *   그 밖  # 외곽선 (이웃 색을 어둡게) · . 투명
 */
import { hex, mix, shade, type Color } from '../paint.ts';
import { type Grid, type Palette } from './grid.ts';
import { type Seg } from './slice.ts';

export interface Sliced {
  g: Grid;
  cols: readonly Seg[];
  rows: readonly Seg[];
}

const R = (n: number): Seg => [n, 'r'];

// ───────────────────────── 팔레트 ─────────────────────────

/** 나무 재질 (따뜻한 그늘) */
export function woodPal(base: Color): Palette {
  const warm = hex('#5a2a1a');
  return {
    G: shade(base, 0.42), O: shade(base, 0.2), W: base, w: mix(shade(base, -0.18), warm, 0.12), v: mix(shade(base, -0.36), warm, 0.2),
    Y: hex('#e8c860'), y: hex('#a8823a'),
  };
}

/** 칠한 재질 (장난감 상자 · 골판지): 그늘이 살짝 푸른 보통 명암 */
export function plainPal(base: Color): Palette {
  return { G: shade(base, 0.36), O: shade(base, 0.16), W: base, w: shade(base, -0.18), v: shade(base, -0.36), Y: hex('#e8c860'), y: hex('#a8823a') };
}

/** 천 재질 (이불 · 소파 · 쿠션) */
export function clothPal(base: Color): Palette {
  return { Q: shade(base, 0.22), C: base, c: shade(base, -0.14), k: shade(base, -0.28), A: shade(base, 0.1) };
}

export function linenPal(): Palette {
  const sheet = hex('#f4ecdc');
  const white = hex('#f8f4ec');
  return { S: sheet, s: shade(sheet, -0.12), P: white, p: shade(white, -0.14), X: hex('#ffffff') };
}

// ───────────────────────── 침대 ─────────────────────────

/**
 * 침대 (위에서 비스듬히): 머리판 14줄 · 베개 · 홑청 · 이불 윗면(되풀이) · 앞면 12줄 (늘어진 이불 6 + 나무 틀 6).
 * 이불은 10px 조각보 무늬 (가운데 마름모 · 아래 바느질 줄). 오른쪽 3열은 나무 옆면.
 */
export const BED: Sliced = {
  g: [
    '.##############################.',
    '#GOOOOOOOOOOOOOOOOOOOOOOOOOOOvv#',
    '#OWWWWWWWWWWWWWWWWWWWWWWWWWWWvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwvv#',
    '#WOOOOOOOOOOOOOOOOOOOOOOOOOwWvv#',
    '#WOWWWWWWWWWWWWWWWWWWWWWWWWwWvv#',
    '#WOWWWWWWWWWWWWWWWWWWWWWWWWwWvv#',
    '#WOWWWWWWWWWWWWWWWWWWWWWWWWwWvv#',
    '#WOWWWWWWWWWWWWWWWWWWWWWWWWwWvv#',
    '#WOWWWWWWWWWWWWWWWWWWWWWWWWwWvv#',
    '#WOWWWWWWWWWWWWWWWWWWWWWWWWwWvv#',
    '#WwwwwwwwwwwwwwwwwwwwwwwwwwwWvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwvv#',
    '#sssssssssssssssssssssssssssvvv#',
    '#SSSSSSSSSSSSSSSSSSSSSSSSSSSSvv#',
    '#SSSSSpppppppppppppppppppSSSSvv#',
    '#SSSSpPPPPPPPPPPPPPPPPPPPpSSSvv#',
    '#SSSSXPPPPPPPPPPPPPPPPPPPpSSSvv#',
    '#SSSSpPPPPPPPPPPPPPPPPPPPpSSSvv#',
    '#SSSSpPPPPPPPPPPPPPPPPPPppSSSvv#',
    '#SSSSpppppppppppppppppppppSSSvv#',
    '#SSSSSsssssssssssssssssssSSSSvv#',
    '#SSSSSSSSSSSSSSSSSSSSSSSSSSSSvv#',
    '#SSSSSSSSSSSSSSSSSSSSSSSSSSSSvv#',
    '#SSSSSSSSSSSSSSSSSSSSSSSSSSSSvv#',
    '#ssssssssssssssssssssssssssssvv#',
    '#cccccccccccccccccccccccccccccv#',
    '#QQQQQQQQQQQQQQQQQQQQQQQQQQQQvv#',
    '#CCCCCCCCCCCCCCCCCCCCCCCCCCCCvv#',
    '#CCCCCCCCCCCCCCcCCCCCCCCCCcCCvv#',
    '#CCCCCCCCCACCCCcCCCCACCCCCcCCvv#',
    '#CCCCCCCCAAACCCcCCCAAACCCCcCCvv#',
    '#CCCCCCCCCACCCCcCCCCACCCCCcCCvv#',
    '#CCCCCCCCCCCCCCcCCCCCCCCCCcCCvv#',
    '#CCCCCCCCCCCCCCcCCCCCCCCCCcCCvv#',
    '#CCCCCCCCCCCCCCcCCCCCCCCCCcCCvv#',
    '#ckkkkkkkkkkkkkkkkkkkkkkkkkkcvv#',
    '#ccccccccccccccccccccccccccccvv#',
    '#cCcccckcccccckcccccckcccccccvv#',
    '#cCcccckcccccckcccccckcccccccvv#',
    '#ccccckcccccckcccccckccccccccvv#',
    '#ccccckcccccckcccccckccccccccvv#',
    '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwvv#',
    '.##############################.',
  ],
  cols: [6, R(18), 8],
  // 머리판 · 베개 · 홑청 · 이불 접힌 단 (28줄 + 2) · 이불 윗면 되풀이 (8) · 앞면 12
  rows: [30, R(8), 12],
};

/** 아기 침대: 위 · 아래 난간, 5px 마다 살, 살 사이로 노란 요와 베개 */
export const CRIB: Sliced = {
  g: [
    '.######################.',
    '#GOOOOOOOOOOOOOOOOOOOOw#',
    '#OWWWWWWWWWWWWWWWWWWWWw#',
    '#wwwwwwwwwwwwwwwwwwwwwv#',
    '#OW#SSOW#SSOW#SSOW#SSWw#',
    '#OW#SSOW#SSOW#SSOW#SSWw#',
    '#OW#ssOW#ssOW#ssOW#ssWw#',
    '#OW#CCOW#CCOW#CCOW#CCWw#',
    '#OW#CCOW#CCOW#CCOW#CCWw#',
    '#OW#CCOW#CCOW#CCOW#CCWw#',
    '#OW#CCOW#CCOW#CCOW#CCWw#',
    '#OW#ccOW#ccOW#ccOW#ccWw#',
    '#OW#..OW#..OW#..OW#..Ww#',
    '#OW#..OW#..OW#..OW#..Ww#',
    '#GOOOOOOOOOOOOOOOOOOOOw#',
    '#WWWWWWWWWWWWWWWWWWWWWw#',
    '#wwwwwwwwwwwwwwwwwwwwwv#',
    '#ww#................#ww#',
    '#ww#................#ww#',
    '.##..................##.',
  ],
  cols: [1, R(20), 3],
  rows: [7, R(4), 9],
};

// ───────────────────────── 책상 ─────────────────────────

/** 책상 몸통 (윗면 · 앞판 8 · 다리 14): 왼쪽 다리 · 뒤 다리, 오른쪽 서랍장 (손잡이 셋), 오른쪽 옆면 3열 */
export const DESK: Sliced = {
  g: [
    '.######################################.',
    '#GOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOWWWWWOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOWWWWOOOOOvvv#',
    '#OOOOWWWWOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWYYYYYWWWWWWWWWvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWyyyyyWWWWWWWWWvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvv#',
    '#www#.vv.....#OOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#www#.vv.....#WWWWWWWWYYYYYWWWWWWWWWvvv#',
    '#www#.vv.....#WWWWWWWWyyyyyWWWWWWWWWvvv#',
    '#www#.vv.....#WWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#www#.vv.....#WWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#www#.vv.....#wwwwwwwwwwwwwwwwwwwwwwvvv#',
    '#www#.vv.....#OOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#www#.vv.....#WWWWWWWWYYYYYWWWWWWWWWvvv#',
    '#www#.vv.....#WWWWWWWWyyyyyWWWWWWWWWvvv#',
    '#www#.##.....#WWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#www#........#WWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#www#........#WWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#www#........#wwwwwwwwwwwwwwwwwwwwwwvvv#',
    '.###.........###########################',
  ],
  cols: [10, R(3), 27],
  // 윗면 10 (가운데 4줄 되풀이) · 앞판 8 · 다리 14
  rows: [3, R(4), 3, 8, 14],
};

/** 책상 위 스탠드 (15×22): 파란 갓 · 노란 불빛 테 · 가는 목 · 받침 */
export const DESK_LAMP: Grid = [
  '.......#.......',
  '......#B#......',
  '.....#BBb#.....',
  '....#BBBbb#....',
  '...#BBBBBbb#...',
  '..#BBBBBBBbb#..',
  '.#BBBBBBBBBbb#.',
  '#LLLLLLLLLLLLL#',
  '.######M######.',
  '.......M.......',
  '.......M.......',
  '.......M.......',
  '.......M.......',
  '.......M.......',
  '.......M.......',
  '.......M.......',
  '.......M.......',
  '.......M.......',
  '....#######....',
  '...#NNNNNNn#...',
  '...#nnnnnnn#...',
  '....#######....',
];

/** 공책 (16×9) */
export const NOTEBOOK: Grid = [
  '################',
  '#XPPPPPPPPPPPPP#',
  '#PPllllllllllPp#',
  '#PPPPPPPPPPPPPp#',
  '#PPllllllllPPPp#',
  '#PPPPPPPPPPPPPp#',
  '#PPllllllPPPPPp#',
  '#ppppppppppppp##',
  '################',
];

/** 종이별이 가득한 유리병 (12×17): 노란 뚜껑 · 유리 반짝임 · 알록달록 종이별 */
export const STAR_JAR: Grid = [
  '..########..',
  '..#YYYYYy#..',
  '..#yyyyyy#..',
  '.##########.',
  '#XjjjjjjjjJ#',
  '#XjjjjjjjjJ#',
  '#X1j2jj3jjJ#',
  '#Xj4jj1jj5J#',
  '#X3jj5j2j1J#',
  '#X2j1jj4jjJ#',
  '#Xj5j3jj2jJ#',
  '#X4jj2j1j3J#',
  '#X1j3jj5j4J#',
  '#Xj2j4j1jjJ#',
  '#X5j1jj3j2J#',
  '#jjjjjjjjjJ#',
  '.##########.',
];

export function deskPropPal(): Palette {
  const blue = hex('#4a78d8');
  return {
    B: blue, b: shade(blue, -0.22), L: hex('#ffe8a8'), M: hex('#5a6a8a'), N: hex('#4a5a7a'), n: shade(hex('#4a5a7a'), -0.25),
    P: hex('#f4f0e4'), p: hex('#d8d0c0'), l: hex('#a8c0e0'), X: hex('#ffffff'),
    Y: hex('#e8c860'), y: hex('#b8963a'), j: hex('#d8f0f8'), J: hex('#b0d0dc'),
    '1': hex('#ffe07a'), '2': hex('#ff9ec7'), '3': hex('#8ad0ff'), '4': hex('#b8f08a'), '5': hex('#ffb070'),
  };
}

// ───────────────────────── 의자 ─────────────────────────

/** 나무 의자 (24×40): 등받이 (가로 살 둘) · 앉는 판 · 다리 넷 */
export const CHAIR: Sliced = {
  g: [
    '...################.....',
    '..#GOOOOOOOOOOOOOOw#....',
    '..#OWWWWWWWWWWWWWWw#....',
    '..#OwwwwwwwwwwwwwWw#....',
    '..#OW#..........#Ww#....',
    '..#OW#..........#Ww#....',
    '..#OOOOOOOOOOOOOOOw#....',
    '..#OWWWWWWWWWWWWWWw#....',
    '..#OwwwwwwwwwwwwwWw#....',
    '..#OW#..........#Ww#....',
    '..#OW#..........#Ww#....',
    '..#OW#..........#Ww#....',
    '..#OW#..........#Ww#....',
    '..#OW#..........#Ww#....',
    '..#OW#..........#Ww#....',
    '..#OW#..........#Ww#....',
    '.##OW############Ww###..',
    '#GOOOOOOOOOOOOOOOOOOOw#.',
    '#OOOOOOOOOOOOOOOOOOOOw#.',
    '#OOOOOOOOOOOOOOOOOOOOw#.',
    '#OOOOOOOOOOOOOOOOOOOOw#.',
    '#GGGGGGGGGGGGGGGGGGGGw#.',
    '#WWWWWWWWWWWWWWWWWWWWv#.',
    '#wwwwwwwwwwwwwwwwwwwwv#.',
    '.#Ww#.#v#.....#v#.#Wv#..',
    '.#Ww#.#v#.....#v#.#Wv#..',
    '.#Ww#.#v#.....#v#.#Wv#..',
    '.#Ww#.#v#.....#v#.#Wv#..',
    '.#Ww#.#v#.....#v#.#Wv#..',
    '.#Ww#.###.....###.#Wv#..',
    '.#Ww#.............#Wv#..',
    '.#Ww#.............#Wv#..',
    '.#Ww#.............#Wv#..',
    '.#Ww#.............#Wv#..',
    '.#Ww#.............#Wv#..',
    '.#Ww#.............#Wv#..',
    '.#Ww#.............#Wv#..',
    '.#vv#.............#vv#..',
    '..##...............##...',
    '........................',
  ],
  cols: [24],
  rows: [4, R(2), 34],
};

// ───────────────────────── 책장 ─────────────────────────

/** 책장 틀: 칸 하나 (13줄) 를 칸 수만큼 되풀이 · 오른쪽 옆면 */
export const SHELF: Sliced = {
  g: [
    '.####################.',
    '#GOOOOOOOOOOOOOOOOOvv#',
    '#OWWWWWWWWWWWWWWWWWvv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#OW################vv#',
    '#OOOOOOOOOOOOOOOOOOvv#',
    '#WWWWWWWWWWWWWWWWWWvv#',
    '#OW#..............#vv#',
    '#OW#..............#vv#',
    '#wwwwwwwwwwwwwwwwwwvv#',
    '.####################.',
  ],
  cols: [4, R(14), 4],
  rows: [3, R(12), 4],
};

/** 책 한 줄 (10줄 높이, 40px 되풀이): 키 · 폭 · 색이 다른 책등, 띠 무늬 · 기울어진 책 */
export const BOOKS: Grid = [
  '..........................#####.........',
  '###.......####......###...#eee#..###....',
  '#a#####...#bb######.#c#####eee#..#d#####',
  '#a#bbb#####bb#cccc###c#ddd#eee####d#aaa#',
  '#A#bbb#eee#BB#cccc#cCc#ddd#EEE#ff#D#aaa#',
  '#a#BBB#eee#bb#CCCC#ccc#DDD#eee#ff#d#AAA#',
  '#a#bbb#EEE#bb#cccc#ccc#ddd#eee#FF#d#aaa#',
  '#a#bbb#eee#bb#cccc#ccc#ddd#eee#ff#d#aaa#',
  '#a#bbb#eee#bb#cccc#ccc#ddd#eee#ff#d#aaa#',
  '########################################',
];

/** 인형 가게 선반: 토끼 · 곰 · 여우 인형이 나란히 (10줄, 24px 되풀이) */
export const SHELF_TOYS: Grid = [
  '.#.#...................#',
  '#u#u#.......#.#........#',
  '#u#u#..#.#.#t#t#..#.#..',
  '#uuu#.#f#f#.#ttt#.#r#r#.',
  '#u.u#.#fff#.#t.t#.#rrr#.',
  '#uuu#.#f.f#.#ttt#.#r.r#.',
  '.#u#..#fff#..#t#..#rrr#.',
  '#uuu#.#fff#.#ttt#.#rrr#.',
  '#uuu#.#fff#.#ttt#.#rrr#.',
  '########################',
].map((r) => (r + '........................').slice(0, 24));

export function bookPal(): Palette {
  const c = ['#c85a5a', '#5a7ac8', '#d8b048', '#6aa06a', '#a87ac0', '#e8e0cc'].map(hex);
  return {
    a: c[0], A: shade(c[0], 0.3), b: c[1], B: shade(c[1], 0.3), c: c[2], C: shade(c[2], 0.3), d: c[3], D: shade(c[3], 0.3), e: c[5], E: shade(c[5], -0.2), f: c[4], F: shade(c[4], 0.3),
    u: hex('#f4f0ec'), t: hex('#c8905a'), r: hex('#e8884a'),
  };
}

// ───────────────────────── 장롱 ─────────────────────────

/** 장롱: 위 몰딩 · 두 문짝 (판 테) · 가운데 문틈과 놋쇠 손잡이 · 아래 받침 · 오른쪽 옆면 4열 */
export const WARDROBE: Sliced = {
  g: [
    '.######################################.',
    '#GOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvv#',
    '#WOOOOOOOOOOOOOOOOw#OOOOOOOOOOOOOOOOvvv#',
    '#WOWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWYWw#OYWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWYWw#OYWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWYWw#OYWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWyWw#OyWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWwWvvv#',
    '#WOWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWwWvvv#',
    '#WOwwwwwwwwwwwwwwww#OwwwwwwwwwwwwwwWvvv#',
    '#WWWWWWWWWWWWWWWWWw#OWWWWWWWWWWWWWWWvvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvv#',
    '#OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOvvv#',
    '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWvvv#',
    '#wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvvv#',
    '#vv#............................#vvvvvv#',
    '.##..............................######.',
  ],
  cols: [3, R(12), 8, R(11), 6],
  rows: [10, R(5), 4, R(2), 8],
};

// ───────────────────────── 3면 상자 (장난감 상자 · 이삿짐 상자 · 식탁 윗판 · TV 장) ─────────────────────────

/**
 * 3면 상자: 윗면(밝음 O, 되풀이) · 앞면(W, 되풀이) · 오른쪽 옆면 3열(v). 맨 윗줄 · 왼쪽 · 아래는 외곽선.
 * 윗면 2줄 반짝 테 + 앞 모서리 밝은 줄, 앞면 아래 그늘 한 줄.
 */
export const BOX3: Sliced = {
  g: [
    '.##########.',
    '#GOOOOOOvvv#',
    '#OOOOOOOvvv#',
    '#OOOOOOOvvv#',
    '#GGGGGGGvvv#',
    '#WWWWWWWvvv#',
    '#WWWWWWWvvv#',
    '#WWWWWWWvvv#',
    '#wwwwwwwvvv#',
    '.##########.',
  ],
  cols: [2, R(5), 5],
  rows: [2, R(1), 2, R(3), 2],
};

/** 장난감 상자 앞면 노란 띠 (2줄, 되풀이) · 쪽지 (18×7) */
export const BAND: Grid = ['BBBBBBBB', 'bbbbbbbb'];
export const LABEL: Grid = [
  '##################',
  '#XLLLLLLLLLLLLLLL#',
  '#LLkkkkkkkkkkkkLl#',
  '#LLLLLLLLLLLLLLLl#',
  '#LLkkkkkkkkLLLLLl#',
  '#lllllllllllllll#.'.padEnd(18, '#'),
  '##################',
];

/** 열린 장난감 상자 안: 짙은 안쪽 · 공 둘 */
export const TOYS_IN: Grid = [
  '..####.......',
  '.#RRrr#......',
  '#RXRRrr#.....',
  '#RRRRrr#..###',
  '#rRRrrr#.#GGg#',
  '.#rrrr#.#GXGgg#',
  '..####..#GGGgg#',
  '........#gGggg#',
  '.........#ggg#.',
  '..........###..',
].map((r) => r.padEnd(15, '.').slice(0, 15));

export function boxPropPal(): Palette {
  return {
    B: hex('#ffd84a'), b: shade(hex('#ffd84a'), -0.2), L: hex('#fff8b0'), l: shade(hex('#fff8b0'), -0.15), k: hex('#5a4a40'), X: hex('#ffffff'),
    R: hex('#e85a5a'), r: shade(hex('#e85a5a'), -0.25), G: hex('#6ab06a'), g: shade(hex('#6ab06a'), -0.25),
  };
}

/** 이삿짐 상자 테이프 (윗면 · 앞면 위 6줄, 4px 폭) · 끈적한 가로 테이프 */
export const TAPE_V: Grid = ['TttT'];
export const TAPE_H: Grid = ['TTTTTT', 'tTTtTT'];

// ───────────────────────── 식탁 · 다리 ─────────────────────────

/** 식탁 다리 줄 (12줄): 앞 다리 둘 (밝은 쪽 · 그늘 쪽) · 뒤 다리 둘 (짧고 짙다) */
export const TABLE_LEGS: Sliced = {
  g: [
    '#Ww##vv#....#vv#Wv#',
    '#Ww##vv#....#vv#Wv#',
    '#Ww##vv#....#vv#Wv#',
    '#Ww##vv#....#vv#Wv#',
    '#Ww##vv#....#vv#Wv#',
    '#Ww##vv#....#vv#Wv#',
    '#Ww##vv#....#vv#Wv#',
    '#Ww#.##......##.#Wv#'.slice(0, 19),
    '#Ww#............#Wv',
    '#Ww#............#Wv',
    '#ww#............#vv',
    '.##..............##',
  ].map((r) => r.padEnd(19, '.').slice(0, 19)),
  cols: [8, R(4), 7],
  rows: [12],
};

/** 식탁보 (윗면 흰 천 · 앞으로 늘어진 단 · 아래 물결 술) */
export const TABLECLOTH: Sliced = {
  g: [
    '.##########.',
    '#XQQQQQQccc#',
    '#QQQQQQQccc#',
    '#QQQQQQQccc#',
    '#QQQQQQQccc#',
    '#CCCCCCCkkk#',
    '#CCCCCCCkkk#',
    '#CCCCCCCkkk#',
    '#cccccccckk#',
    '#c.cc.cc.c.#',
    '.#.##.##.#..',
  ],
  cols: [2, R(6), 4],
  rows: [2, R(2), 1, R(3), 3],
};

export function tableclothPal(): Palette {
  const cloth = hex('#f8f0f4');
  return { X: hex('#ffffff'), Q: cloth, C: shade(cloth, -0.1), c: shade(cloth, -0.18), k: shade(cloth, -0.34) };
}

/** 생일 케이크 (24×21): 초 일곱 (불 켜짐/꺼짐은 F 칸) · 분홍 크림 · 흰 시트 */
export const CAKE: Grid = [
  '..f..f..f..f..f..f..f...',
  '..F..F..F..F..F..F..F...',
  '..1..2..3..1..2..3..1...',
  '..1..2..3..1..2..3..1...',
  '..1..2..3..1..2..3..1...',
  '..1..2..3..1..2..3..1...',
  '..1..2..3..1..2..3..1...',
  '..1..2..3..1..2..3..1...',
  '.######################.',
  '#KKKKKKKKKKKKKKKKKKKKKK#',
  '#KkKKkKKkKKkKKkKKkKKkKk#',
  '#kKkkKkkKkkKkkKkkKkkKkk#',
  '#UUUUUUUUUUUUUUUUUUUUuu#',
  '#UUUUUUUUUUUUUUUUUUUUuu#',
  '#UUUUUUUUUUUUUUUUUUUUuu#',
  '#UUUUUUUUUUUUUUUUUUUUuu#',
  '#UUUUUUUUUUUUUUUUUUUUuu#',
  '#UUUUUUUUUUUUUUUUUUUUuu#',
  '#uuuuuuuuuuuuuuuuuuuuuu#',
  '.######################.',
  '........................',
];

/** 전화기 (14×12) · 찻잔 (8×7) */
export const PHONE: Grid = [
  '.############.',
  '#QQQQQQQQQQQq#',
  '#qqqqqqqqqqqq#',
  '.#####..#####.',
  '..#UUUUUUUUu#.',
  '..#UU#####Uu#.',
  '..#UU#ooo#Uu#.',
  '..#UU#ooo#Uu#.',
  '..#UU#####Uu#.',
  '..#uuuuuuuuu#.',
  '..###########.',
  '..............',
];
export const TEACUP: Grid = ['.######.', '#XQQQQq#', '#QooooQ#', '#QQQQQq##', '#QQQQQq#Q'.slice(0, 8), '.#qqqq#.', '..####..'].map((r) => r.padEnd(8, '.').slice(0, 8));

export function tablePropPal(out: boolean): Palette {
  const cream = hex('#f8a0b8');
  const sponge = hex('#fff0f4');
  return {
    f: out ? -1 : hex('#ffd84a'), F: out ? -1 : hex('#ff8a3a'), '1': hex('#8ad0ff'), '2': hex('#ffd84a'), '3': hex('#f06a8a'),
    K: cream, k: shade(cream, -0.18), U: sponge, u: shade(sponge, -0.12),
    Q: hex('#f0e8d8'), q: shade(hex('#f0e8d8'), -0.15), o: hex('#a8a090'), X: hex('#ffffff'),
  };
}

// ───────────────────────── 소파 ─────────────────────────

/**
 * 소파: 등받이 (윗면 띠 · 앞면) · 양 팔걸이 · 앉는 쿠션 (되풀이: 쿠션 사이 이음) · 앞면 12 · 오른쪽 옆면.
 * 천 글자 Q C c k, 팔걸이 윗면도 Q.
 */
/**
 * 소파: 등받이 (윗면 띠 · 앞면, 쿠션 이음은 20px 마다) · 양 팔걸이 · 앉는 쿠션 윗면 · 앞면 · 오른쪽 옆면 3열.
 * 위 띠(0~12줄: 등받이 · 팔걸이 윗면 · 쿠션 윗면 · 쿠션 앞 모서리)와 아래 띠(13~16줄: 앞면)를 따로 맞춘다.
 */
export const SOFA: Sliced = {
  g: [
    '.##################################.',
    '#QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQkkk#',
    '#QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQkkk#',
    '#ccccccccccccccccccccccccccccccckkk#',
    '#ccccccccccccccccccccccccccccccckkk#',
    '#cccccccccccccccccccccccccckcccckkk#',
    '#cccccccccccccccccccccccccckcccckkk#',
    '#cccccccccccccccccccccccccckcccckkk#',
    '########ccccccccccccccccccck########',
    '#QQQQQQ#kkkkkkkkkkkkkkkkkkkk#QQQkkk#',
    '#QQQQQQ#kkkkkkkkkkkkkkkkkkkk#QQQkkk#',
    '#CCCCCC#QQQQQQQQQQQQQQQQQQQk#CCCkkk#',
    '#CCCCCC#cccccccccccccccccccc#CCCkkk#',
    '#CCCCCC#CCCCCCCCCCCCCCCCCCCk#CCCkkk#',
    '#cccccc#ccccccccccccccccccck#ccckkk#',
    '#kkkkkk#kkkkkkkkkkkkkkkkkkkk#kkkkkk#',
    '.#vv#..........................#vv#.',
  ],
  cols: [8, R(20), 8],
  rows: [11, R(1), 1, R(1), 3],
};
/** 소파 위 띠 · 아래 띠의 줄 조각 (위 띠는 0~12줄, 아래 띠는 13~16줄) */
export const SOFA_UP: readonly Seg[] = [11, R(1), 1];
export const SOFA_DOWN: readonly Seg[] = [R(1), 3];

// ───────────────────────── TV ─────────────────────────

/** 브라운관 TV (위에 얹는 상자, 26×24): 짙은 몸통 · 화면 · 반짝 · 단추 */
export const CRT: Sliced = {
  g: [
    '.########################.',
    '#KKKKKKKKKKKKKKKKKKKKKKkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kk##################kkkk#',
    '#kk#HHHHHHzzzzzzzzzz#kkkk#',
    '#kk#HzzzzzzzzzzzzzzZ#kkkk#',
    '#kk#zzzzzzzzzzzzzzzZ#kgkk#',
    '#kk#zzzzzzzzzzzzzzzZ#kkkk#',
    '#kk#zzzzzzzzzzzzzzzZ#kgkk#',
    '#kk#zzzzzzzzzzzzzzzZ#kkkk#',
    '#kk#zzzzzzzzzzzzzzzZ#kkkk#',
    '#kk#zzzzzzzzzzzzzzzZ#kkkk#',
    '#kk#zzzzzzzzzzzzzzzZ#kkkk#',
    '#kk#ZZZZZZZZZZZZZZZZ#kkkk#',
    '#kk##################kkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkkkkkk#',
    '.########################.',
  ],
  cols: [10, R(6), 10],
  rows: [24],
};

export function crtPal(): Palette {
  const cab = hex('#2e2e38');
  return { K: shade(cab, 0.25), k: cab, z: hex('#3a4a5a'), Z: shade(hex('#3a4a5a'), -0.2), H: hex('#6a7a8a'), g: hex('#8ad06a') };
}

// ───────────────────────── 화분 ─────────────────────────

/** 화분 (24×42): 둥근 잎 덩이 셋 · 줄기 · 테라코타 화분 */
export const PLANT: Grid = [
  '........................',
  '.........####...........',
  '........#gGgL#..........',
  '.......#gGLLLl#..####...',
  '.......#gLLLLl##gGgL#...',
  '......#gLLLLLll#gLLLl#..',
  '......#LLLLLLll#LLLLl#..',
  '.####.#LLLLLlll#LLLll#..',
  '#gGgL##lLLLlll#LLLlll#..',
  '#gLLLl#llllll##lLLlll#..',
  '#LLLLLl#lllll#lllllll#..',
  '#LLLLLll######lllll##...',
  '#lLLLlll#e#..#####......',
  '#llllll##e#.#gGgL#......',
  '.######.#e#.#gLLLl#.....',
  '.....#ggge###LLLLll#....',
  '....#gGLLe##lLLLlll#....',
  '...#gLLLLeLLllllll#.....',
  '...#LLLLLellll####......',
  '...#lLLLlelll#..........',
  '....#llllell#...........',
  '.....####e##............',
  '.........e..............',
  '.....#############......',
  '....#TTTTTTTTTTTTt#.....',
  '....#ttttttttttttt#.....',
  '....###############.....',
  '.....#TTTTTTTTTTTt#.....',
  '.....#TTTTTTTTTTTt#.....',
  '.....#TTTTTTTTTTTt#.....',
  '.....#TTTTTTTTTTTt#.....',
  '.....#TTTTTTTTTTTt#.....',
  '......#TTTTTTTTTt#......',
  '......#TTTTTTTTTt#......',
  '......#TTTTTTTTTt#......',
  '......#TTTTTTTTTt#......',
  '......#ttttttttttt#.....'.slice(0, 24),
  '.......#########........',
  '........................',
  '........................',
  '........................',
  '........................',
].map((r) => r.padEnd(24, '.').slice(0, 24));

export function plantPal(): Palette {
  const leaf = hex('#4a9a4a');
  const pot = hex('#c8704a');
  return { G: shade(leaf, 0.42), g: shade(leaf, 0.22), L: leaf, l: shade(leaf, -0.2), e: hex('#3a6a2a'), T: pot, t: shade(pot, -0.25) };
}

// ───────────────────────── 재봉틀 ─────────────────────────

/** 할머니 재봉틀 (몸통 · 바퀴 · 실패 자리) — 탁자는 BOX3, 다리는 TABLE_LEGS */
export const SEWING_HEAD: Sliced = {
  g: [
    '.#####################################.',
    '#MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM#..#SSS#',
    '#mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm#.#SsSSs#'.slice(0, 39),
    '#mYYYYYYYYYYmmmmmmmmmmmmmmmmmmm#.#SSsSs#'.slice(0, 39),
    '#mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm##SsSSs#'.slice(0, 39),
    '#mm####################mmmmmmmmmm#sss#.',
    '#mm#..................#mmmmmmmmmm#####.',
    '#mm#..................#mmmmmmmm#.......',
    '#mm#..................#mmmmmmmm#.......',
    '#mm#..................#mmmmmmmm#.......',
    '#mm#..................#mmmmmmmm#.......',
    '#mm#..................#mmmmmmmm#.......',
    '#mm#..................#mmmmmmmm#.......',
    '#mm#..................#mmmmmmmm#.......',
    '#nn#..................#nnnnnnnn#.......',
    '####..................##########.......',
  ].map((r) => r.padEnd(39, '.').slice(0, 39)),
  cols: [8, R(14), 17],
  rows: [16],
};
export const THREAD: Grid = ['#XX#', '#RR#', '#Rr#', '#RR#', '#Rr#', '#XX#'];
export const DUST_SPECKS: Grid = [
  '..d.......d.......d.......',
  '.......d........d......d..',
  'd...........d.........d...',
  '....d..d..........d.......',
  '..........d...d.......d...',
  '.d....d...........d.......',
];

export function sewingPal(): Palette {
  const m = hex('#2a2a36');
  return { M: shade(m, 0.3), m, n: shade(m, -0.3), Y: hex('#e8c860'), S: hex('#d8d0c0'), s: shade(hex('#d8d0c0'), -0.25), X: hex('#f0e8d8'), R: hex('#e85a6a'), r: shade(hex('#e85a6a'), -0.2), d: hex('#d8d0c8') };
}

/** 열린 상자 뒷부분 (52줄): 뒤로 젖힌 뒷날개 (안쪽 면 · 접힌 선 · 뜯긴 테이프) · 뒤 테 · 어두운 안 · 바닥 신문지 뭉치 · 벌어진 옆 날개 */
export const CARTON_BACK: Sliced = {
  g: [
    '..................................................',
    '...........##########################.............',
    '...........#IIIIIIIIIIIIIIII#TTTt#II#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#TtTt#ii#.............',
    '...........#iiiiiikiiiiiiiii#T.t.#ii#.............',
    '...........#jjjjjjkjjjjjjjjjjjjjjjjj#.............',
    '.........#HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH#.........',
    '.........#HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH#.........',
    '.........#HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ#.........',
    '.........#HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ#.........',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##ccccccc#',
    '.#CCCCCC##HIJJJJJJJJJJJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '.#CCCCCC##HIJJJJJJJJJJJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '.#CCCCCC##HIJJJJJJJJJJJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '.#CCCCCC##HIJJJ#NNn#JJJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '.#CCCCCC##HIJJ#NnNNn#JJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '.#CCCCCC##HIJJ#nNnnn#JJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '.#CCCCCC##HIJJJ#####JJJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '.#CCCCCC##HIJJJJJJJJJJJJJJJJJJJJJJJJJJJJ##ccccccc#',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '..#CCCCC##HIjjjjjjjjjjjjjjjjjjjjjjjjjJJJ##cccccc#.',
    '...#CCCC##HIiiiiiiiiiiiiiiiiiiiiiiiiiJJJ##ccccc#..',
    '...#CCCC##HIiiiiiiiiiiiiiiiiiiiiiiiiiJJJ##ccccc#..',
    '...#CCCC##HIiiiiiiiiiiiiiiiiiiiiiiiiiJJJ##ccccc#..',
    '...#CCCC##HIiiiiiiiiiiiiiiiii#NNNn#iiJJJ##ccccc#..',
    '...#CCCC##HIiiiiiiiiiiiiiiii#NnNNnn#iJJJ##ccccc#..',
    '...#CCCC##HIiiiiiiiiiiiiiiii#nnNnnn#iJJJ##ccccc#..',
    '...#CCCC##HIiiiiiiiiiiiiiiiii######iiJJJ##ccccc#..',
    '...#CCCC##HIiiiiiiiiiiiiiiiiiiiiiiiiiJJJ##ccccc#..',
    '....#CCC##HIiiiiiiiiiiiiiiiiiiiiiiiiiJJJ##cccc#...',
  ],
  cols: [22, R(5), 23],
  rows: [52],
};

/** 열린 상자 앞부분 (32줄): 앞 테 · 앞면 (반쯤 뜯긴 세로 테이프) · 오른쪽 옆면 v */
export const CARTON_FRONT: Sliced = {
  g: [
    '.........#HHHHHHHHHHHHHHHHHHHHHHHHHHvvvv#.........',
    '.........#HHHHHHHHHHHH#TTTt#HHHHHHHHvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#TtTt#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCC#T.t.#CCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#CCCCCCCCCCCCCCCCCCCCCCCCCCvvvv#.........',
    '.........#ccccccccccccccccccccccccccvvvv#.........',
    '.........################################.........',
  ],
  cols: [12, R(6), 32],
  rows: [2, R(1), 29],
};

/** 열린 이삿짐 상자 팔레트: 골판지 C c · 테 빛 H · 안쪽 I i j J (밝음 → 어두움) · 테이프 T t · 신문지 N n · 접힌 선 k · 옆면 v */
export function cartonPal(): Palette {
  const card = hex('#c89a64');
  const inner = hex('#a87c50');
  const tape = hex('#dcc49c');
  return {
    C: card, c: shade(card, -0.3), H: shade(card, 0.3), I: shade(inner, 0.12), i: shade(inner, -0.12), j: shade(inner, -0.3), J: shade(inner, -0.45),
    T: tape, t: shade(tape, -0.15), N: hex('#bcb4a4'), n: hex('#8a8478'), k: shade(inner, -0.25), v: shade(card, -0.36),
  };
}

/** 이 파일의 격자 · 팔레트 (시험용) */
export function allFurnAGrids(): [string, Grid, Palette][] {
  const all: Palette = { ...woodPal(hex('#a8703c')), ...clothPal(hex('#f0a0a8')), ...linenPal() };
  return [
    ['BED', BED.g, all], ['CRIB', CRIB.g, { ...all, ...clothPal(hex('#ffe08a')) }], ['DESK', DESK.g, all], ['DESK_LAMP', DESK_LAMP, deskPropPal()], ['NOTEBOOK', NOTEBOOK, deskPropPal()],
    ['STAR_JAR', STAR_JAR, deskPropPal()], ['CHAIR', CHAIR.g, all], ['SHELF', SHELF.g, all], ['BOOKS', BOOKS, bookPal()], ['SHELF_TOYS', SHELF_TOYS, bookPal()], ['WARDROBE', WARDROBE.g, all],
    ['BOX3', BOX3.g, all], ['BAND', BAND, boxPropPal()], ['LABEL', LABEL, boxPropPal()], ['TOYS_IN', TOYS_IN, boxPropPal()], ['TAPE_V', TAPE_V, { T: 1, t: 2 }], ['TAPE_H', TAPE_H, { T: 1, t: 2 }],
    ['TABLE_LEGS', TABLE_LEGS.g, all], ['TABLECLOTH', TABLECLOTH.g, tableclothPal()], ['CAKE', CAKE, tablePropPal(false)], ['PHONE', PHONE, tablePropPal(false)], ['TEACUP', TEACUP, tablePropPal(false)],
    ['SOFA', SOFA.g, all], ['CRT', CRT.g, crtPal()], ['PLANT', PLANT, plantPal()], ['SEWING_HEAD', SEWING_HEAD.g, sewingPal()], ['CARTON_BACK', CARTON_BACK.g, cartonPal()], ['CARTON_FRONT', CARTON_FRONT.g, cartonPal()], ['THREAD', THREAD, sewingPal()], ['DUST_SPECKS', DUST_SPECKS, sewingPal()],
  ];
}
