/**
 * 갈래 E 소품 (17장 토비의 태엽 속 · 20장 할머니의 재봉 상자 · 새벽 다락) 손찍기 격자.
 * 글자는 chapkit.ts 공용 자리 (C A W S F B G N 재질 · 숫자 포인트). 모두 한 칸씩 정해 찍은 격자이고,
 * 둥근 큰 모양(톱니 · 태엽 고리 · 토마토 · 새벽 창)은 줄마다 칸 수를 정해 적었다.
 */
import { pal, remap, rep } from './chapkit.ts';
import { BOX_FRONT, BOX_TOP } from './chapbox.ts';
import type { Grid, Palette } from './grid.ts';

// ───────────────────────── 토비의 태엽 속 ─────────────────────────

/** 천 안감 띠 넷 (위가 어둡다, 16×6 되풀이: 결 줄을 띄엄띄엄) */
export const CLOTH_T0: Grid = ['pppppppppppppppp', 'pppffppppppppppp', 'pppppppppppppppp', 'pppppppppppffppp', 'pppppppppppppppp', 'pppppppppppppppp'];
export const CLOTH_T1: Grid = ['ffffffffffffffff', 'fffffffppfffffff', 'ffffffffffffffff', 'ffpffffffffffffff'.slice(0, 16), 'ffffffffffffffff', 'ffffffffffffpfff'];
export const CLOTH_T2: Grid = ['FFFFFFFFFFFFFFFF', 'FFFFffFFFFFFFFFF', 'FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFfFFFF', 'FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF'];
export const CLOTH_T3: Grid = ['FFFFFFFFFFFFFFFF', 'FFFFFFFFFPPFFFFF', 'FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF', 'FFPPFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF'];
/** 솜이 비치는 볼록한 자리 */
export const CLOTH_BUMP: Grid = [
  '.....PPPPPPP......',
  '...PPZZZPPPPPP....',
  '..PZZPPPPPPPPPP...',
  '.PPPPPPPPPPPPPPP..',
  'PPPPPPPPPPPPPPPPP.',
  'PPPPPPPPPPPPPPPPP.',
  '.PPPPPPPPPPPPPPP..',
  '..PPPPPPPPPPPPP...',
  '....PPPPPPPPP.....',
];
/** 이음매 · 바느질 땀 (6 폭 되풀이) · 세로 땀 · 밑단 · 쇠틀 (C 놋쇠) */
export const SEAM: Grid = ['111...', '......', 'pppppp'];
export const VSTITCH: Grid = ['1', '1', '1', '.', '.', '.'];
export const HEM: Grid = ['fffff', '11fff', 'fffff', 'LLLLL', 'ccccc', 'kkkkk', 'kkkkk', 'kkkkk', 'kkkkk'];
export const RIVET: Grid = ['O.', '.k'];
/** 열쇠 구멍 (k 놋쇠 테 · 9 새벽빛 · E 가장 밝은 점) · 테이프 자국 (8) */
export const KEYHOLE: Grid = [
  '....kkkkkkk....',
  '...kk99999kk...',
  '..k999999999k..',
  '.k99999999999k.',
  '.k9999E999999k.',
  'k9999EE9999999k',
  'k9999999999999k',
  'k9999999999999k',
  '.k99999999999k.',
  '.k99999999999k.',
  '..kk9999999kk..',
  '....k99999k....',
  ...rep('....k99999k....', 18),
  '....kkkkkkk....',
];
export const TAPE: Grid = ['888888888', '888888888', '888888888', '888888888'];
export const clothPal: Palette = pal({ F: '#ece2d0', C: '#7a5428', 1: '#b08a64', 9: '#fff0b8', E: '#fffae0', 8: '#e8d5b0', q: '#efe2c4', r: '#f4e6c0', u: '#f8ecbc' });
// 열쇠 구멍 둘레 빛: 1 → 4 로 갈수록 새벽빛에 가깝다
/** 큰 황동 톱니 (위에서 비스듬히 본, C 놋쇠): 이 열둘 · 안쪽 테 · 구멍 넷 · 가운데 축 · 아래 두께 */
export const GEAR: Grid = [
  '......................LLLL......................',
  '......................LOLC......................',
  '............LLL.....LOOLLLLC.....CCc............',
  '............LLLLOOOLLLLLLLLLLCCCCCCc............',
  '.....LLL....LOLLLLLLLLLLLLLLLLLCCCCc....CCc.....',
  '.....LLL.LOLLLLLLLLLLccccccCCCCCCCCCCcc.CCc.....',
  '.....LLLLOLLLLLLLccCCCCCCCCCCccCCCCCCCccCcc.....',
  '......LOLLLLLLccCCCCCCCCCCCCCCCCccCCCCCCcc......',
  '.....LOLLLLLccCkkkkCCCCCCCCCCkkkkCccCCCCCcc.....',
  '.LLLLLOLLLLccCCkkkkCCCCCCCCCCkkkkCCccCCCCcccCcc.',
  '.LLLLOLLLLLccCCCCCCCCkkkkkkCCCCCCCCccCCCCCccCcc.',
  '.LLLLOLLLLLccCCCCCCCCkkLLkkCCCCCCCCccCCCCCccCcc.',
  '.cLLLOLLLLLccCCCCCCCCkkkkkkCCCCCCCCccCCCCCccccc.',
  '.....LLLLCCccCCkkkkCCCCCCCCCCkkkkCCccCCcccc.....',
  '.....LLLCCCCccCkkkkCCCCCCCCCCkkkkCccCCccccc.....',
  '.....LLLCCCCCCccCCCCCCCCCCCCCCCCccCCccccccc.....',
  '.....cLLCCCCCCCCCccCCCCCCCCCCccCccccccccccc.....',
  '.....ccc.CCCCCCCCCCCCcccccccccccccccccc.ccc.....',
  '............CCCCCCCCCCCCcccccccccccc............',
  '............ccCCCCCCcccccccccccccckk............',
  '............kcckkkkkcccccccckkkkkcck............',
  '............kkkkkkkkkkcccckkkkkkkkkk............',
  '...............kkkkkkkkkkkkkkkkkk...............',
  '......................kkkk......................',
];

/** 작은 톱니 */
export const GEAR_S: Grid = [
  '.......LLC........',
  '..LL.LLLLCCC.Cc...',
  '..LLLOLLLLCCCCcc..',
  'LLLOLLLcccCCCCCcCc',
  'LLLLLLcCkkCcCCCccc',
  'cLLLLLcCkLkcCCcccc',
  '.LLLLCcCkkCcCCccc.',
  'cLCCCCCcccCCccccck',
  '..cCCCCCCcccccckk.',
  '..cc.kkkkkkkkk.kc.',
  '......kkkkkk......',
];

/** 태엽 쇠띠 한 바퀴 (48 폭): 윗변 밝게 (T) · 옆 (S) · 아랫변 그늘 (s) */
export const RING48: Grid = [
  '..............TTTTTTTTTTTTTTTTTTTT..............',
  '.........TTTTTssssssssssssssssssssTTTTT.........',
  '......TTTss..........................ssTTT......',
  '....TTss................................ssTT....',
  '...Tss....................................ssT...',
  '..Ts........................................sT..',
  '.Ts..........................................sT.',
  '.Ts..........................................sT.',
  '.Ts..........................................sT.',
  'Ts............................................Ss',
  'Ts............................................Ss',
  'Ts............................................Ss',
  'Ts............................................Ss',
  'Ts............................................Ss',
  'Ts............................................Ss',
  'Ts............................................Ss',
  'Ts............................................Ss',
  '.Ss..........................................Ss.',
  '.Ss..........................................Ss.',
  '.Ss..........................................Ss.',
  '..Ss........................................Ss..',
  '...SSs....................................sSS...',
  '....SSSs................................sSSS....',
  '......SSSSSs........................sSSSSS......',
  '.........sssSSSSSSSSSSSSSSSSSSSSSSSSsss.........',
  '..............ssssssssssssssssssss..............',
];

/** 태엽 쇠띠 한 바퀴 (40 폭): 윗변 밝게 (T) · 옆 (S) · 아랫변 그늘 (s) */
export const RING40: Grid = [
  '.............TTTTTTTTTTTTTT.............',
  '.........TTTTssssssssssssssTTTT.........',
  '.....TTTTss..................ssTTTT.....',
  '...TTs............................sTT...',
  '..Ts................................sT..',
  '.Ts..................................sT.',
  '.Ts..................................sT.',
  'Ts....................................Ss',
  'Ts....................................Ss',
  'Ts....................................Ss',
  'Ts....................................Ss',
  'Ts....................................Ss',
  'Ts....................................Ss',
  'Ts....................................Ss',
  'Ts....................................Ss',
  '.Ss..................................Ss.',
  '.Ss..................................Ss.',
  '..Ss................................Ss..',
  '...SSs............................sSS...',
  '.....SSSSs....................sSSSS.....',
  '.........ssssSSSSSSSSSSSSSSssss.........',
  '.............ssssssssssssss.............',
];

/** 태엽 쇠띠 한 바퀴 (32 폭): 윗변 밝게 (T) · 옆 (S) · 아랫변 그늘 (s) */
export const RING32: Grid = [
  '.........TTTTTTTTTTTTTT.........',
  '.....TTTTssssssssssssssTTTT.....',
  '...TTs....................sTT...',
  '..Ts........................sT..',
  '.Ts..........................sT.',
  'Ts............................Ss',
  'Ts............................Ss',
  'Ts............................Ss',
  'Ts............................Ss',
  'Ts............................Ss',
  'Ts............................Ss',
  'Ts............................Ss',
  'Ts............................Ss',
  '.Ss..........................Ss.',
  '..Ss........................Ss..',
  '...SSs....................sSS...',
  '.....ssssSSSSSSSSSSSSSSssss.....',
  '.........ssssssssssssss.........',
];

/** 태엽 쇠띠 한 바퀴 (24 폭): 윗변 밝게 (T) · 옆 (S) · 아랫변 그늘 (s) */
export const RING24: Grid = [
  '......TTTTTTTTTTTT......',
  '...TTTssssssssssssTTT...',
  '.TTs................sTT.',
  '.Ts..................sT.',
  'Ts....................Ss',
  'Ts....................Ss',
  'Ts....................Ss',
  'Ts....................Ss',
  'Ts....................Ss',
  'Ts....................Ss',
  '.Ss..................Ss.',
  '.SSs................sSS.',
  '...sssSSSSSSSSSSSSsss...',
  '......ssssssssssss......',
];

/** 태엽 쇠띠 한 바퀴 (16 폭): 윗변 밝게 (T) · 옆 (S) · 아랫변 그늘 (s) */
export const RING16: Grid = [
  '....TTTTTTTT....',
  '.TTTssssssssTTT.',
  'Ts............sT',
  'Ts............Ss',
  'Ts............Ss',
  'Ts............Ss',
  'Ts............Ss',
  'SSs..........sSS',
  '.sssSSSSSSSSsss.',
  '....ssssssss....',
];

/** 토마토 바늘꽂이 몸 (C 빨강): 왼쪽 위 밝음 L · 반짝 O · 오른쪽 아래 그늘 c · 깊은 그늘 k */
export const TOMATO: Grid = [
  '..................LLLLLLCCCCCCCccc..................',
  '.............LLOOLLLLLLCCCCCCCCCCCCcccc.............',
  '..........LLOOOOLLLLLLCCCCCCCCCCCCCCCccccc..........',
  '........LLOOOOOLLLLLLCCCCCCCCCCCCCCCCCcccccc........',
  '......LLOOOOOOLLLLLLCCCCCCCCCCCCCCCCCCCccccccc......',
  '.....LLOOOOOLLLLLLLCCCCCCCCCCCCCCCCCCCCcccccccc.....',
  '....LLOOOOLLLLLLLLCCCCCCCCCCCCCCCCCCCCCcccccccck....',
  '...LLOOLLLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCccccccccck...',
  '..LLLLLLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCccccccccckk..',
  '..LLLLLLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCccccccccckk..',
  '.LLLLLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccckk.',
  '.LLLLLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccckk.',
  'LLLLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCccccccccccckkk',
  'LLLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCCccccccccccckkk',
  'LLLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccccckkk',
  'LLLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccccckkkk',
  'LLLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCCccccccccccccckkkk',
  'LLLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCCccccccccccccckkkkk',
  'LLLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccccccckkkkk',
  'LLLLCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccccccckkkkkk',
  '.LLLCCCCCCCCCCCCCCCCCCCCCCCCCCccccccccccccccckkkkkk.',
  '.LLCCCCCCCCCCCCCCCCCCCCCCCCCCccccccccccccccckkkkkkk.',
  '..LCCCCCCCCCCCCCCCCCCCCCCCCcccccccccccccccckkkkkkk..',
  '..CCCCCCCCCCCCCCCCCCCCCCCccccccccccccccccckkkkkkkk..',
  '...CCCCCCCCCCCCCCCCCCCCCcccccccccccccccckkkkkkkkk...',
  '....CCCCCCCCCCCCCCCCCCCccccccccccccccckkkkkkkkkk....',
  '.....CCCCCCCCCCCCCCCCCcccccccccccccckkkkkkkkkkk.....',
  '.......CCCCCCCCCCCCCCcccccccccccckkkkkkkkkkkk.......',
  '.........CCCCCCCCCCCcccccccccckkkkkkkkkkkkk.........',
  '...........CCCCCCCCcccccccckkkkkkkkkkkkkk...........',
  '..............CCCCCCcccccckkkkkkkkkkkk..............',
  '.................CCCCCccckkkkkkkkkk.................',
  '....................CCCCkkkkkkkk....................',
];

/** 열쇠 구멍 둘레에 번지는 새벽빛 (q 가장 옅게 → r → u → 9 가장 밝게) */
export const KEY_GLOW: Grid = [
  '..............qqqqqqqq..............',
  '..........qqqqqqqqqqqqqqqq..........',
  '........qqqqqqqrrrrrrqqqqqqq........',
  '......qqqqqqrrrrrrrrrrrrqqqqqq......',
  '.....qqqqqrrrrrruuuurrrrrrqqqqq.....',
  '....qqqqqrrrruuuuuuuuuurrrrqqqqq....',
  '...qqqqqrrruuuuuuuuuuuuuurrrqqqqq...',
  '..qqqqqrrruuuuuu9999uuuuuurrrqqqqq..',
  '.qqqqqrrruuuuu99999999uuuuurrrqqqqq.',
  '.qqqqrrruuuuu9999999999uuuuurrrqqqq.',
  'qqqqqrrruuuu999999999999uuuurrrqqqqq',
  'qqqqrrruuuuu999999999999uuuuurrrqqqq',
  'qqqqrrruuuu99999999999999uuuurrrqqqq',
  'qqqqrrruuuu99999999999999uuuurrrqqqq',
  'qqqqrrruuuu99999999999999uuuurrrqqqq',
  'qqqqrrruuuuu999999999999uuuuurrrqqqq',
  'qqqqqrrruuuu999999999999uuuurrrqqqqq',
  '.qqqqrrruuuuu9999999999uuuuurrrqqqq.',
  '.qqqqqrrruuuuu99999999uuuuurrrqqqqq.',
  '..qqqqqrrruuuuuu9999uuuuuurrrqqqqq..',
  '...qqqqqrrruuuuuuuuuuuuuurrrqqqqq...',
  '....qqqqqrrrruuuuuuuuuurrrrqqqqq....',
  '.....qqqqqrrrrrruuuurrrrrrqqqqq.....',
  '......qqqqqqrrrrrrrrrrrrqqqqqq......',
  '........qqqqqqqrrrrrrqqqqqqq........',
  '..........qqqqqqqqqqqqqqqq..........',
  '..............qqqqqqqq..............',
];

/** 새벽 하늘 둥근 창 (1 연보라 위 → 5 분홍 아래, 여섯 줄마다 한 띠) */
export const DAWN: Grid = [
  '.............11111.............',
  '..........11111111111..........',
  '........111111111111111........',
  '......1111111111111111111......',
  '.....111111111111111111111.....',
  '....11111111111111111111111....',
  '...2222222222222222222222222...',
  '..222222222222222222222222222..',
  '..222222222222222222222222222..',
  '.22222222222222222222222222222.',
  '.22222222222222222222222222222.',
  '2222222222222222222222222222222',
  '3333333333333333333333333333333',
  '3333333333333333333333333333333',
  '3333333333333333333333333333333',
  '3333333333333333333333333333333',
  '3333333333333333333333333333333',
  '3333333333333333333333333333333',
  '4444444444444444444444444444444',
  '4444444444444444444444444444444',
  '.44444444444444444444444444444.',
  '.44444444444444444444444444444.',
  '..444444444444444444444444444..',
  '..444444444444444444444444444..',
  '...5555555555555555555555555...',
  '....55555555555555555555555....',
  '.....555555555555555555555.....',
  '......5555555555555555555......',
  '........555555555555555........',
  '..........55555555555..........',
  '.............55555.............',
];

/** 녹 얼룩 (5 진한 녹 · 6 밝은 녹) — 녹슨 톱니 위에 */
export const RUST_SPOTS: Grid = [
  '....5.......66.........5.......',
  '..66.....5.......55..........6.',
  '.......55.....6.......66.......',
  '.5..........5.....5........55..',
  '.....66..........66....5.......',
  '..5.......55..5..........66....',
];
export const gearPal = (rust: boolean): Palette => pal({ C: rust ? '#a85a30' : '#c8963c', 5: '#6a3a24', 6: '#c87848' });

/** 태엽 축 (C 놋쇠) · 바닥에 끌리는 바깥 끝 */
export const SPRING_AXLE: Grid = ['.kkkkkk.', 'kLLCCCck', 'kLOCCCck', 'kCCCCcck', '.kcccck.'];
export const SPRING_TAIL: Grid = [
  'Ss.......',
  '.Ss......',
  '..Ss.....',
  '..sSs....',
  '...sSs...',
  '....sSs..',
  '.....sSss',
  '......sss',
];
export const springPal: Palette = pal({ S: '#a8acb8', C: '#c8963c' });

/** 멈춤쇠: 굴대 받침 (C 놋쇠 원판) · 휘어진 쇠 팔 (S) · 볼트 머리 */
export const PAWL_ARM: Grid = [
  '...........TTTTTTTTTTTTTTTTTT........',
  '........TTTIIIIIIIIIIIIIIIIIITTT.....',
  '......TTIIISSSSSSSSSSSSSSSSSSIIITT...',
  '....TTISSSSsssssssssssssssssSSSSSIT..',
  '...TISSSsss.................sssSSSIs.',
  '..TISSss.......................ssSSIs',
  '..ISSs...........................sSSs',
  '.TSSs............................sSSs',
  '.TSs.............................sSSs',
  '.TSs............................TSSSs',
  '.TSs............................TSSSs',
  '................................TSSSs',
  '.................................SSs.',
  '..................................s..',
];
export const PAWL_BOLT: Grid = ['..TTTT..', '.TIIISs.', 'TISSSSss', 'TSSkSSss', 'sSSSSsst', '.sssstt.', '..tttt..'];
export const PAWL_BASE: Grid = [
  '.....LLLLLLLLLL.....',
  '...LLOOLLLLLLLLLc...',
  '.LLOLLLCCCCCCLLLLcc.',
  'LLLLLCCCCCCCCCCCLccc',
  'cLLLLLCCCCCCCCCLcccc',
  'kccccccccccccccccccc',
  '.kkccccccccccccckkk.',
  '...kkkkkkkkkkkkkk...',
];
export const pawlPal: Palette = pal({ S: '#8a8e98', C: '#c8963c' });

/** 굴러다니는 큰 나사 (십자 머리 · 나사산) */
export const SCREW: Grid = [
  '.TTTTT................................',
  'TIIIIIT.TTTTTTTTTTTTTTTTTTTTTTTTTTT...',
  'TISStSSTIIIIIIIIIIIIIIIIIIIIIIIIIIIT..',
  'TISStSSTSSsSSsSSsSSsSSsSSsSSsSSsSSsSs.',
  'TItttttTSSsSSsSSsSSsSSsSSsSSsSSsSSsSSs',
  'TISStSSTsSSsSSsSSsSSsSSsSSsSSsSSsSSss.',
  'TISStSSTtttttttttttttttttttttttttttt..',
  'sSSSSSs...............................',
  '.sssss................................',
];
export const screwPal: Palette = pal({ S: '#8a8e98' });

/** 솜 덩어리 (토비 몸속을 채운 하얀 솜) */
export const COTTON_E: Grid = [
  '..............PPPPPPP...................',
  '.......PPPP.PPZZZPPPPPP.................',
  '.....PPZZPPPPZPPPPPPPPPPf...PPPPP.......',
  '....PZPPPPPPPPPPPPPPPPPPff.PZZPPPPf.....',
  '...PZPPPPPPPPPPPPPPFFPPPPfPZPPPPPPPff...',
  '..PPPPPPPPPPPFFPPPPPPFPPPPPPPPPPPPFFf...',
  '.PPPPPPPPPPPPPPFPPPPPPPPPPPPPPPPPPPFff..',
  'PPPPPFPPPPPPPPPPPPPPPPPPPPPPPPPFPPPFff..',
  'PPPPPPFPPPPPPPPPPPPPPPFFPPPPPPPPPPPFFff.',
  'fPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPFFFff.',
  'fFPPPPPPPPPFFFPPPPPPPPPPPPPPPPPPPFFFfff.',
  '.fFFPPPPPPPFFPPPPPPPPPPFFPPPPPPFFFFfff..',
  '..ffFFFFFFFFFFFFFFFFFFFFFFFFFFFFFffff...',
  '....fffffffffffffffffffffffffffffff.....',
];
export const cottonEPal: Palette = pal({ F: '#ece6dc' });

/** 기름 방울 (1 기름 · 2 무지개 빛 · 3 반짝) */
export const OIL_DROP: Grid = [
  '....11111111....',
  '..111222111111..',
  '.11223311111111.',
  '1112311111111111',
  '1111111111111111',
  '.111111111111111',
  '..11111111111111',
  '....1111111.111.',
  '...........111..',
];
export const oilPal: Palette = pal({ 1: '#4a3a2c', 2: '#8a7a8c', 3: '#c8c0d8' });

/** 녹 자국 (C 녹 · k 진한 녹) */
export const RUST_PATCH: Grid = [
  '..........CCC.....CC..........',
  '......CCLCCkCCCCCCCCC...C.....',
  '...CCCCkkCCCCCCkkCCCCCCCCC....',
  '..CLCCCkCCCCCLCCkCCCCkkCCCC...',
  '.CCkkCCCCCCkkkCCCCCCCCkCCCCC..',
  'CCCCkCCCCCCCkCCCCCkkCCCCCkCCC.',
  '.CCCCCCkkCCCCCCCCCCkCCCCCCCC..',
  '..CCCCCCkCCCCCkkCCCCCCkkCCC...',
  '...CCCC..CCCCCCkCCCCCCCCC.....',
  '.....C.....CCCCCCC..CCC.......',
];
export const rustPatchPal: Palette = pal({ C: '#a85a30' });

/** 부러진 첫 열쇠 자국 (S 눌린 쇠빛 · 끊긴 끝) */
export const KEY_PRINT: Grid = [
  '...ssssss..............................',
  '.ssSSSSSSss............................',
  'sSSs....sSSsssssssssssssss...TT........',
  'sSs......sSSSSSSSSSSSSSSSSs...SsssssSs.',
  'sSs......sSSSSSSSSSSSSSSSs.....SSSSSSs.',
  'sSSs....sSSsssssssssssssT.........sSs..',
  '.ssSSSSSSss.......................sSs..',
  '...ssssss..........................s...',
];
export const keyPrintPal: Palette = pal({ S: '#6e7280' });

/** 반쯤 접힌 귀 안쪽 천 조각: 바느질 땀 (1) · 분홍 안감 (A) · 꺾인 철사 (S) */
export const STITCH_PATCH: Grid = [
  '..........P.........',
  '.........PFS........',
  '........PFFS........',
  '.......PFAAS........',
  '......PFAAAAS.......',
  '.....PFAAAAAS.......',
  '....PF1AAAAAAS......',
  '...PFAAAAAAAASSSSSS.',
  '..PF1AAAAAAAAAFf....',
  '.PFAAAAAAAAAAAFf....',
  'PF1AAAAAAAAAAAAFf...',
  'PFFFFFFFFFFFFFFFf...',
  'ffffffffffffffffff..',
];
export const stitchPal: Palette = pal({ F: '#ece2d0', A: '#f4c8c8', S: '#8a8e98', 1: '#c8483c' });

/** 남색 외투 주머니 실밥 뭉치 (C 남색) */
export const LINT: Grid = [
  'L......L.....',
  '.L....L...L..',
  '..LLLLLLLLc..',
  '.LOLLLLLLLcc.',
  'LLLLCCCCLLccc',
  'LLLCCCCCCCcc.',
  '.cCCCCCCCcccL',
  'L.cccccccc...',
  '..c..c..c.c..',
];
export const lintPal: Palette = pal({ C: '#3a4670' });

/** 메아리: 둘레 반짝 (1) · 바닥 빛 웅덩이 (2) · 음표 (3) */
export const ECHO_SPARK: Grid = [
  '......1.......',
  '..1.......1...',
  '.............1',
  '1.............',
  '..............',
  '..............',
  '.............1',
  '1.............',
  '..............',
  '..1........1..',
  '......1.......',
];
export const ECHO_POOL: Grid = ['...2222222...', '.22222222222.', '...2222222...'];
export const ECHO_NOTE: Grid = ['...3333', '...3333', '...3...', '...3...', '...3...', '...3...', '...3...', '.333...', '3333...', '3333...', '.33....'];
export const echoPal = (state: 'lit' | 'faint' | ''): Palette => {
  const base = state === 'lit' ? '#ffe08a' : state === 'faint' ? '#f8f0c8' : '#a8a0c0';
  const glow = state === 'lit' ? '#f0c860' : state === 'faint' ? '#e8dcb0' : '#8a84a0';
  const pool = state === 'lit' ? '#b89040' : state === 'faint' ? '#a8a080' : '#5a5470';
  return pal({ 1: glow, 2: pool, 3: base });
};

/** 할머니가 고친 새 열쇠 축: 놋쇠 축 (C) · 새로 감은 보라 실 (1) · 빨간 리본 (A) */
export const KEY_AXLE: Grid = [
  '........LLLLLL........',
  '.......LOLLLLCc.......',
  '.......LLCCCCcc.......',
  '.......L11111cc.......',
  '.......LCCCCCcc.......',
  '.......L11111cc.......',
  '.......LCCCCCcc.......',
  '.......LCMMMaac.......',
  '....MMMMMAAAAAAaa.....',
  '..MMAAAAAAAAAAAAAaa...',
  '.MAAAAa.LCAAAacc.aAa..',
  'MAAAa...LCCCCcc...aAa.',
  'MAAa....LCCCCcc....aAa',
  '.aa.....LCCCCcc.....am',
  '........ccccckk.......',
  '......kkkkkkkkkk......',
];
export const keyAxlePal: Palette = pal({ C: '#c8963c', A: '#c8483c', 1: '#b89ad0' });

/** 커다란 열쇠: 나비 날개 손잡이 한쪽 (C, 다른 쪽은 뒤집어 찍는다) · 축 · 빛바랜 리본 (A) · 바닥 그늘 받침 */
export const KEY_WING: Grid = [
  '.....LLLLLLLL.......',
  '...LLOOLLLLLLLLc....',
  '..LOOLLLLLLLLLLcc...',
  '.LOLLLLLCCCCCLLLcc..',
  'LLLLLLCCcccccCCLLcc.',
  'LLLLLCCc.....cCCLcc.',
  'LLLLLCc.......cCCcc.',
  'LLLLLCc.......cCCccc',
  'LLLLLCCc.....cCCcccc',
  'cLLLLLCCcccccCCccccc',
  'cLLLLLLCCCCCCCcccccc',
  '.ccLLLLLLLLLLccccck.',
  '..cccccccccccccckk..',
  '....kkkkkkkkkkkk....',
];
export const KEY_HUB: Grid = [
  'LLLLLLLLLc',
  'LOOLLLLLcc',
  'LLCCCCCCcc',
  'LLCkkkkCcc',
  'LLCCCCCCcc',
  'cccccccccc',
];
export const KEY_SHAFT: Grid = ['LOLCCCcck'];
export const KEY_RIBBON: Grid = [
  '.......MMMMM.......',
  '.....MMAAAAAaa.....',
  '....MAAAaaaAAAa....',
  '...MAAa.....aAAa...',
  '..MAAa.......aAAa..',
  '.MAAa.........aAAa.',
  'MAAa...........aAAa',
  'aa...............aa',
];
export const KEY_BASE: Grid = [
  '......kkkkkkkkkkkk......',
  '...kkkkcccccccccckkkk...',
  '.kkccccccccccccccccccck.',
  'kkcccccccccccccccccccckk',
  '.kkkcccccccccccccccckkk.',
  '....kkkkkkkkkkkkkkkk....',
];
export const keyGiantPal: Palette = pal({ C: '#c8963c', A: '#b0524a' });

/** 멈춘 계수기: 숫자판 (F 종이, 숫자는 글씨 격자로 위에) */
export const DIGIT_PLATE: Grid = ['PPPPPPPf', ...rep('PFFFFFFf', 9), 'ffffffff'];
export const counterPal: Palette = pal({ C: '#c8963c', W: '#7a5428', F: '#f2ead8', 9: '#2c2430' });

/** 머리 위 놋쇠 굴대 (C, 30 폭 되풀이 · 리벳) · 옆에서 본 작은 톱니 */
export const AXLE_BAR: Grid = [
  'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  'LLLLLLLLLLOkLLLLLLLLLLLLLLLLLL',
  'CCCCCCCCCkkkcCCCCCCCCCCCCCCCCC',
  'cccccccccckkcccccccccccccccccc',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
];
export const AXLE_GEAR: Grid = [
  '.kLLCck..',
  'kkkkkkkkk',
  '.kLLCck..',
  '.kLLCck..',
  'kkkkkkkkk',
  '.kLLCck..',
  '.kLLCck..',
  'kkkkkkkkk',
  '.kLLCck..',
  '.kLLCck..',
  'kkkkkkkkk',
  '.kLLCck..',
  '.kLLCck..',
  'kkkkkkkkk',
  '.kLLCck..',
  '.kLLCck..',
  '.kkkkkk..',
];
/** 은빛 큰 바늘: 몸 (S, 가로 되풀이) · 끝 · 바늘귀 · 빨간 실 (1) */
export const NEEDLE_BODY: Grid = ['IIII', 'SSSS', 'SSSS', 'ssss'];
export const NEEDLE_TIP: Grid = ['IIIII.......', 'SSSSSSSI....', 'SSSSSSSSSSS.', 'sssssss.....'];
export const NEEDLE_EYE: Grid = [
  '...IIIIIIII.',
  '.ISSSSSSSSSs',
  'IS1ttttttSSs',
  'Ss1ttttttSss',
  '.s1ssssssss.',
  '.1..........',
  '1...........',
  '1...........',
  '1...........',
  '.1..........',
  '..1.........',
  '...1........',
  '....11......',
];
export const axlePal: Palette = pal({ C: '#c8963c', S: '#c8ccd6', 1: '#c8483c' });

// ───────────────────────── 할머니의 재봉 상자 ─────────────────────────

/** 누빈 안감 (16 폭 마름모 바느질: x 바탕 · y 땀 줄 · z 땀 옆 볼록한 빛) — 띠마다 remap 으로 밝기만 바꾼다 */
export const QUILT_DIAMOND: Grid = [
  'yzxxxxxxxxxxxxxy',
  'xyzxxxxxxxxxxxyz',
  'xxyzxxxxxxxxxyzx',
  'xxxyzxxxxxxxyzxx',
  'xxxxyzxxxxxyzxxx',
  'xxxxxyzxxxyzxxxx',
  'xxxxxxyzxyzxxxxx',
  'xxxxxxxyyzxxxxxx',
  'xxxxxxxyyzxxxxxx',
  'xxxxxxyzxyzxxxxx',
  'xxxxxyzxxxyzxxxx',
  'xxxxyzxxxxxyzxxx',
  'xxxyzxxxxxxxyzxx',
  'xxyzxxxxxxxxxyzx',
  'xyzxxxxxxxxxxxyz',
  'yzxxxxxxxxxxxxxy',
];
/** 작은 꽃 (1 노랑 · 2 크림 · 3 가운데 빨강) */
export const QUILT_FLOWER: Grid = ['.1.', '131', '.1.'];
export const QUILT_FLOWER2: Grid = ['.2.', '232', '.2.'];
/** 나무 상자 바닥과 만나는 띠 · 뚜껑 틈의 새벽 하늘 (4 분홍 · 5 연보라 · 6 하늘, 16 폭) */
export const QUILT_BASE: Grid = ['VVVVVVVV', 'wwwwwwww', 'wwwwwwww', 'wwwwwwww', 'wwwwwwww', 'vvvvvvvv'];
export const LID_SKY: Grid = [
  '4444444455555666',
  '4444445555566666',
  '4444455555666666',
  '4445555556666666',
  '7777777777777777',
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
];
export const quiltWallPal: Palette = pal({ C: '#b86a6a', W: '#9a6a40', 1: '#f0d080', 2: '#f2e0c8', 3: '#c85a4a', 4: '#f4b8c8', 5: '#d8c0e0', 6: '#b8d0f0', 7: '#e0a8b0' });

/** 커다란 실패: 나무 마구리 (W) · 감긴 실 (C, 세로 되풀이 · 감긴 결) · 위 구멍 · 풀린 실 끝 */
export const SPOOL_BOTTOM: Grid = [
  '...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV...',
  '.VVYYVVVVVVVVVVVVVVVVVVVVVVVVVVVVwv.',
  'VVWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwv',
  'wWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwv',
  'vwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwv',
  '.vvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwvv.',
  '...vvvvvvvvvvvvvvvvvvvvvvvvvvvvvv...',
];
export const SPOOL_THREAD: Grid = [
  'LOLLCCCCCCCCCCCCCCCCCCCCcck',
  'LLLCCCCCCCCCCCCCCCCCCCCCcck',
  'LLLCCCCCCcCCCCCCCCCCCcCCcck',
  'LLLCCCCCCCCCCCCCCCCCCCCCcck',
  'LLCCCCCCCCCCCCCcCCCCCCCCcck',
  'LLLCCCCCCCCCCCCCCCCCCCCCcck',
];
export const SPOOL_TOP: Grid = [
  '...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV...',
  '.VVYYYYYYYYYYYYYYYYYYYYYYYYYYYYYVwv.',
  'VYYYYYYYYYYYYYVVVVVVYYYYYYYYYYYYYYwv',
  'VYYYYYYYYYYYYvvvvvvvvYYYYYYYYYYYYYwv',
  'VYYYYYYYYYYYYYvvvvvvYYYYYYYYYYYYYYwv',
  'wVYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYVwv',
  '.wwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVwv.',
  '...vvvvvvvvvvvvvvvvvvvvvvvvvvvvvv...',
];
export const SPOOL_END: Grid = ['C.....', '.C....', '..C...', '...C..', '...C..', '....C.', '....C.', '.....C', '.....C', '.....C'];
export const spoolPal = (c: string): Palette => pal({ W: '#9a6a40', C: c });

/** 토마토 바늘꽂이: 골 (c 세로 줄) · 꼭지 잎 (G) · 바늘 (S, 머리 1 2 3 4) · 실 꿴 바늘의 빨간 실 (5) */
export const TOMATO_GROOVES: Grid = [
  '...............c.............c...............',
  '..............c...............c..............',
  '..............c...............c..............',
  '.............c.................c.............',
  '.............c.................c.............',
  '.............c.................c.............',
  '.............c.................c.............',
  '.............c.................c.............',
  '..............c...............c..............',
  '..............c...............c..............',
  '...............c.............c...............',
];
export const TOMATO_LEAF: Grid = [
  '......HG......',
  '..HHG.HG.HGG..',
  '.HHHGGHGGGgg..',
  '...HHGGGGg....',
  '.HHGGgGGGGGg..',
  'HHGg..Gg..gGg.',
  '......g.......',
];
export const PIN_NEEDLE: Grid = ['.1.', '111', '.1.', '.I.', ...rep('.S.', 18), '.s.'];
export const PIN_NEEDLE2: Grid = remap(PIN_NEEDLE, '1', '2');
export const PIN_NEEDLE3: Grid = remap(PIN_NEEDLE, '1', '3');
export const PIN_NEEDLE4: Grid = remap(PIN_NEEDLE, '1', '4');
export const THREADED_NEEDLE: Grid = [
  '.........I5555...',
  '........IS....55.',
  '........S.......5',
  '.......IS.......5',
  '.......S........5',
  '......IS.......5.',
  '......S........5.',
  '.....IS.......5..',
  '.....S........5..',
  '....IS.......5...',
  '....S........5...',
  '...IS.......5....',
  '...S........5....',
  '..IS........5....',
  '..S.........5....',
  '.IS........5.....',
  '.S.........5.....',
  'Ss.........5.....',
];
export const pincushionPal: Palette = pal({ C: '#c8443c', L: '#d86a5a', O: '#f0a090', G: '#5a8a4a', S: '#c8ccd4', 1: '#e8c050', 2: '#5a7ab8', 3: '#e87a8a', 4: '#8ac08a', 5: '#c8483c' });

/** 짝 잃은 단추 하나 (언덕에 쌓는다: C 자리를 단추마다 바꿔 칠한다) */
export const SMALL_BTN: Grid = [
  '..LLLLL..',
  '.LOLLLLc.',
  'LLCkCkCcc',
  'LLCCCCCcc',
  'cCCkCkCcc',
  '.cccccck.',
  '..kkkkk..',
];
export const buttonsPal: Palette = pal({ C: '#c84a44', A: '#5a7ab8', B: '#e8c050', G: '#8ac08a', F: '#f2e6cc', N: '#9a7ac0', W: '#7a5a3c', S: '#5a5460' });

/** 장난감 눈높이의 큰 단추 (둥근 · 네모, 구멍 j) */
export const BTN_ROUND: Grid = [
  '.....LLLLLLLL.....',
  '...LLOOLLLLLLLLc..',
  '.LLOLLCCCCCCCLLLc.',
  'LLLLCCCCCCCCCCCLcc',
  'LLLLCCCCCCCCCCCcCc',
  'cLLLLCCCCCCCCCccCc',
  'ccLLLLLLLLLLLLcccc',
  'kcccccccccccccccck',
  '.kkccccccccccckkk.',
  '...kkkkkkkkkkkk...',
];
export const BTN_SQUARE: Grid = [
  'OOOOOOOOOOOOOOOL',
  'LLLLLLLLLLLLLLLc',
  'LCCCCCCCCCCCCCLc',
  'LCCCCCCCCCCCCCLc',
  'LCCCCCCCCCCCCCLc',
  'LCCCCCCCCCCCCCLc',
  'ccccccccccccccck',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
];
export const HOLES2: Grid = ['jj...jj'];
export const HOLES4: Grid = ['jj...jj', '.......', 'jj...jj'];
export const bigBtnPal = (c: string): Palette => pal({ C: c, j: '#1a1418' });

/** 노란 털실 한 마디 (가로, 8 폭 되풀이 · 굵기 2 · 꼬임 결) */
export const YARN_H: Grid = ['..11....', '.1221122', '23..23..'];
export const yarnPal: Palette = pal({ 1: '#f8dc78', 2: '#f0c848', 3: '#c89a30' });
/** 엉킨 매듭 · 풀린 고리 */
export const YARN_KNOT: Grid = [
  '.....1111.........',
  '...11222211.11....',
  '..12...12.2122211.',
  '.12...1.22..2...21',
  '12...12..21.2....2',
  '2...12....2122..23',
  '2..12..112.2.21.3.',
  '3.12..1..2.2..23..',
  '.32..1....3....3..',
  '.3..2......3..3...',
  '..33..2...3..3....',
  '....333333.33.....',
];
export const YARN_LOOSE: Grid = [
  '....11111111......',
  '..112......2211...',
  '.12...1111....21..',
  '12...12..21....2..',
  '2...12....2....2..',
  '3...2.....2...23..',
  '.3...33..3...23...',
  '..33...33...33....',
  '....3333333.......',
  '..........3333333.',
];

/** 돌돌 말린 줄자 (C 노랑) · 눈금 (j) · 실 매듭 (1) */
export const TAPE_MEASURE: Grid = [
  '.....LLLLLLL..........',
  '...LLOOLLLLLLc........',
  '.LLOLLccccccLLc.......',
  'LLLLccLLLLLLccLc......',
  'LLLcLLccccccLLcc......',
  'LLLcLcLLLLLLcLcCCCCCC11',
  'cLLcLLccccccLLcCjCjCj11',
  'cLLLccLLLLLLcccCCCCCC1.',
  '.ccLLLccccccccck.......',
  '..cccccccccccckk.......',
  '....kkkkkkkkkk.........',
].map((r) => r.padEnd(22, '.').slice(0, 22));
export const tapePal: Palette = pal({ C: '#f0d878', 1: '#c8483c', j: '#2c2430' });

/** 큰 가위 (벌어진 채 누움): 날 (S) · 빨간 손잡이 고리 (C) · 놋쇠 축 (1) */
export const SCISSORS: Grid = [
  '..LLLLLLLLLLLL.......................................................IIIIII..',
  '.LOLLLLLLLLLLLLc...........................................IIIIIIISSSSSSSs...',
  'LLLkkkkkkkkkkLLcc..............................IIIIIIIIISSSSSSSSSSSsss......',
  'LLkk........kkLcc...................IIIIIIIIISSSSSSSSSSSSSssss..............',
  'LLkk........kkCcc..........IIIIIIIIISSSSSSSSSSSSssss........................',
  'cLLkkkkkkkkkkCCcc...1111IISSSSSSSSSSSSSssss.................................',
  '.ccLLLLLLLLLCCccSSSS1OO1SSSsssss............................................',
  '..ccccccccccccc...111111sssssssssss.........................................',
  '...LLLLLLLLLLLLc...1111sssssssssssssssssss..................................',
  '..LOLLLLLLLLLLLLc......SSSSsssssssssssssssssssssss..........................',
  '.LLkkkkkkkkkkkLcc...........SSSSSssssssssssssssssssssssss...................',
  '.Lkk.........kkcc..................SSSSSsssssssssssssssssssssss.............',
  '.Lkkkkkkkkkkkkkcc..........................SSSSSSsssssssssssssssss..........',
  '.cCCCCCCCCCCCCccc.................................SSSSSSSssssssssst.........',
  '..cccccccccccccc..........................................ttttttttt.........',
].map((r) => r.padEnd(78, '.'))
export const scissorsPal: Palette = pal({ S: '#c0c4cc', C: '#c84a44', 1: '#c8963c' });

/** 엎어진 골무 (S, 오목한 점 무늬 t) */
export const THIMBLE: Grid = [
  '..........IIIIIIIIIIII..........',
  '......IIIITTTTTTTTTTTTIIII......',
  '....IITTTTTTTTTTTTTTTTTTTTIs....',
  '...ITTTTTTTTTTTTTTTTTTTTTTTss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSTss...',
  '..ITSSStSStSStSStSStSStSSSSss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSSss...',
  '..ITStSStSStSStSStSStSStSSSss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSSss...',
  '..ITSSStSStSStSStSStSStSSSSss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSSss...',
  '..ITStSStSStSStSStSStSStSSSss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSSss...',
  '..ITSSStSStSStSStSStSStSSSSss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSSss...',
  '..ITStSStSStSStSStSStSStSSSss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSSss...',
  '..ITSSSSSSSSSSSSSSSSSSSSSSSss...',
  '.sITSSSSSSSSSSSSSSSSSSSSSSSsst..',
  'ssssssssssssssssssssssssssssttt.',
  '.tttsssssssssssssssssssssssttt..',
  '....tttttttttttttttttttttttt....',
];
export const thimblePal: Palette = pal({ S: '#b8bcc4' });

/** 접힌 흰 약봉지 (F) · 하늘 띠 (1) · 연필 글씨 (2) */
export const MED_POUCH: Grid = [
  '111111111111111111',
  '111111111111111111',
  'PFFFFFFFFFFFFFFFFf',
  'PFFFFFFFFFFFFFFFFf',
  'PFF222222222222FFf',
  'PFFFFFFFFFFFFFFFFf',
  'PFF22222222222FFFf',
  'PFFFFFFFFFFFFFFFFf',
  'PFF222222222FFFFFf',
  'PFFFFFFFFFFFFFFFFf',
  'PFFFFFFFFFFFFFFFFf',
  'ffffffffffffffffff',
  'pppppppppppppppppp',
];
export const medPal: Palette = pal({ F: '#f2ead8', 1: '#a8c8e0', 2: '#5a5260' });

/** 분홍 진료 카드 (A) · 머리 띠 (1) · 날짜 칸 (a, 마지막 칸 빨강 2) */
export const CLINIC_CARD: Grid = [
  '11111111111111111111',
  '11111111111111111111',
  '11111111111111111111',
  'MAAAAAAAAAAAAAAAAAAa',
  'MAaaaaaAaaaaaAaaaaAa',
  'MAAAAAAAAAAAAAAAAAAa',
  'MAaaaaaAaaaaaAaaaaAa',
  'MAAAAAAAAAAAAAAAAAAa',
  'MAaaaaaAaaaaaA2222Aa',
  'MAAAAAAAAAAAAAAAAAAa',
  'aaaaaaaaaaaaaaaaaaaa',
  'mmmmmmmmmmmmmmmmmmmm',
];
export const cardPal: Palette = pal({ A: '#f0c8cc', 1: '#c86a7a', 2: '#c8483c' });

/** 구긴 편지지 더미 (F) · 연필 (2) */
export const CRUMPLED: Grid = [
  '........PPPPPP......',
  '......PPZPPFPPPf....',
  '.....PZPFPPPPFPPf...',
  '.....PPPPPFFPPPPf...',
  '..PPPPfPPPPPPPFff...',
  '.PZPPPPFfPPPPfff.PP.',
  'PZPFPPPPPPfffPPPZPPf',
  'PPPPPFFPPPfPPFPPPPFf',
  'PPFPPPPPPFfPPPPFPPFf',
  'fPPPPPFPPff.PPPPPFff',
  '.ffFFFFFff..fFFFfff.',
  '...fffff.....ffff...',
  '..222222............',
];
export const lettersPal: Palette = pal({ F: '#f2ead8', 2: '#5a5260' });

/** 토비 털과 같은 하얀 천 조각 · 땀 (1) · 시침핀 (S · 머리 2) */
export const WHITE_SCRAP: Grid = [
  '..............PPf...',
  '..22........PPPFf...',
  '..22SS....PPPPPFf...',
  '....PPSSPPPPPPPFf...',
  '...PPPPPSSPPPPPPFf..',
  '..PPPPPPPPSSPPPPFf..',
  '.PPPPPPPPPPPPPPPPFf.',
  'PPPPPPPPPPPPPPPPPFf.',
  'P1PP1PP1PP1PP1PPPPFf',
  'PPPPPPPPPPPPPPPPPPFf',
  'ffffffffffffffffffff',
];
export const scrapPal: Palette = pal({ F: '#f0ece4', S: '#c8ccd4', 1: '#b08a64', 2: '#e8c050' });

/** 천 조각 한 장 (언덕에 겹쳐 쌓는다: C 자리를 조각마다 바꿔 칠한다, 가로 늘이기 2·2) */
export const FABRIC: Grid = [
  'LLLLLLLLLLLLLLLc',
  'LOCCCCCCCCCCCCcc',
  'LCCCLCCCCCLCCCcc',
  'LCCCCCCCCCCCCCcc',
  'LCCCCCLCCCCCCLcc',
  'LCCCCCCCCCCCCCcc',
  'cccccccccccccccc',
  '.kkkkkkkkkkkkkk.',
];
export const fabricPal: Palette = pal({ C: '#d88a7a', A: '#8aa0c8', B: '#e8d098', G: '#9a7ac0', N: '#a8c08a', F: '#f2e6cc', S: '#f0c848' });

/** 재봉틀 기름병 (G 초록 병 · 상표 F · 쇠 주둥이 S) */
export const OIL_BOTTLE: Grid = [
  '.....Is.....',
  '.....Ss.....',
  ...rep('.....Ss.....', 12),
  '....TSSs....',
  '...TTSSss...',
  '.HHHHHHHHHg.',
  'HQQHHHHHHHgg',
  'HQGGGGGGGGgg',
  'HQPPPPPPPGgg',
  'HQPFFFFFPGgg',
  'HQPPPPPPPGgg',
  'HGGGGGGGGGgg',
  'HGGGGGGGGGgg',
  'HGGGGGGGGGgh',
  'gggggggggggh',
  '.hhhhhhhhhh.',
];
export const oilBottlePal: Palette = pal({ G: '#5a8a6a', F: '#f2ead8', S: '#8a8e98' });

/** 돋보기 렌즈 조각 (A 유리 · U 반짝) */
export const LENS: Grid = [
  '........MM......',
  '......MMAAa.....',
  '....MMAUAAAa....',
  '...MAAAUAAAAa...',
  '.MMAAAAAUAAAAa..',
  'MAAAAAAAAAAAAAa.',
  'aaaaaaaaaaaaaaaa',
];
export const lensPal: Palette = pal({ A: '#b8d8e8' });

/** 재단 분필 (삼각, A) · 분필 가루 (1) */
export const CHALK: Grid = [
  '.........MM...........................',
  '.......MMAAa..........................',
  '.....MMAAAAAa.........................',
  '...MMAAAAAAAAa.....1....1.....1.......',
  '.MMAAAAAAAAAAAa..1....1....1.....1....',
  'MAAAAAAAAAAAAAAAa...1.....1.......1...',
  'aaaaaaaaaaaaaaaaaaa..1..1....1..1.....',
];
export const chalkPal: Palette = pal({ A: '#d8e0ec', 1: '#c8d0dc' });

/** 바닥에 누운 시침핀: 몸 (S, 가로 되풀이) · 진주 머리 (A) */
export const PIN_HEAD: Grid = [
  '..MMMM...',
  '.MUUAAa..',
  'MUAAAAaa.',
  'MAAAAAaaS',
  'aAAAAaaaS',
  '.aaaaam..',
  '..mmmm...',
];
export const PIN_SHAFT: Grid = ['IIII', 'SSSS', 'ssss'];
export const PIN_TIP: Grid = ['II....', 'SSSSS.', 'sss...'];
export const pinBigPal: Palette = pal({ A: '#e8a0b8', S: '#c8ccd4' });

/** 칸막이 나무판 끝 기둥 (결 w) */
export const dividerPal: Palette = pal({ W: '#9a6a40' });

/** 새벽 하늘 (1 연보라 → 5 분홍) · 지평선 띠 (6) · 구름 (7) · 별 (8 9) · 창살 (W) */
export const DAWN_HORIZON: Grid = ['666666666666666666666666', '666666666666666666666666'];
export const DAWN_CLOUD: Grid = ['..777777..', '7777777777'];
export const DAWN_STARS: Grid = ['8.99', '..9.'];
export const DAWN_BAR_H: Grid = ['YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW'];
export const DAWN_BAR_V: Grid = ['YW'];
export const dawnPal: Palette = pal({ 1: '#8a7ab8', 2: '#9e86bc', 3: '#bc94b8', 4: '#dca4b4', 5: '#f4b8b0', 6: '#f8d0a8', 7: '#e8b8c8', 8: '#fff4e0', 9: '#f8e8d0', W: '#c8ac80' });

export const PX_E: Record<string, [Grid, Palette]> = {
  'clothWall.t0': [CLOTH_T0, clothPal],
  'clothWall.t1': [CLOTH_T1, clothPal],
  'clothWall.t2': [CLOTH_T2, clothPal],
  'clothWall.t3': [CLOTH_T3, clothPal],
  'clothWall.bump': [CLOTH_BUMP, clothPal],
  'clothWall.seam': [SEAM, clothPal],
  'clothWall.vstitch': [VSTITCH, clothPal],
  'clothWall.hem': [HEM, clothPal],
  'clothWall.rivet': [RIVET, clothPal],
  'clothWall.keyhole': [KEYHOLE, clothPal],
  'clothWall.glow': [KEY_GLOW, clothPal],
  'clothWall.tape': [TAPE, clothPal],
  brassGear: [GEAR, gearPal(false)],
  'brassGear.small': [GEAR_S, gearPal(true)],
  'brassGear.rust': [RUST_SPOTS, gearPal(true)],
  mainspring: [RING48, springPal],
  'mainspring.ring40': [RING40, springPal],
  'mainspring.ring32': [RING32, springPal],
  'mainspring.ring24': [RING24, springPal],
  'mainspring.ring16': [RING16, springPal],
  'mainspring.axle': [SPRING_AXLE, springPal],
  'mainspring.tail': [SPRING_TAIL, springPal],
  pawl: [PAWL_ARM, pawlPal],
  'pawl.bolt': [PAWL_BOLT, pawlPal],
  'pawl.base': [PAWL_BASE, pawlPal],
  screwBig: [SCREW, screwPal],
  cotton: [COTTON_E, cottonEPal],
  oilDrop: [OIL_DROP, oilPal],
  rustPatch: [RUST_PATCH, rustPatchPal],
  brokenKey: [KEY_PRINT, keyPrintPal],
  stitchPatch: [STITCH_PATCH, stitchPal],
  lint: [LINT, lintPal],
  echo: [ECHO_SPARK, echoPal('')],
  'echo.pool': [ECHO_POOL, echoPal('lit')],
  'echo.note': [ECHO_NOTE, echoPal('faint')],
  keyAxle: [KEY_AXLE, keyAxlePal],
  'keyGiant.wing': [KEY_WING, keyGiantPal],
  'keyGiant.hub': [KEY_HUB, keyGiantPal],
  'keyGiant.shaft': [KEY_SHAFT, keyGiantPal],
  'keyGiant.ribbon': [KEY_RIBBON, keyGiantPal],
  'keyGiant.base': [KEY_BASE, keyGiantPal],
  counter: [DIGIT_PLATE, counterPal],
  axleBar: [AXLE_BAR, axlePal],
  'axleBar.gear': [AXLE_GEAR, axlePal],
  'axleBar.needle': [NEEDLE_BODY, axlePal],
  'axleBar.tip': [NEEDLE_TIP, axlePal],
  'axleBar.eye': [NEEDLE_EYE, axlePal],
  quiltWall: [QUILT_DIAMOND, { ...quiltWallPal, x: quiltWallPal.c, y: quiltWallPal.k, z: quiltWallPal.C }],
  'quiltWall.flower': [QUILT_FLOWER, quiltWallPal],
  'quiltWall.flower2': [QUILT_FLOWER2, quiltWallPal],
  'quiltWall.base': [QUILT_BASE, quiltWallPal],
  'quiltWall.lid': [LID_SKY, quiltWallPal],
  'spoolBig.bottom': [SPOOL_BOTTOM, spoolPal('#c84a44')],
  'spoolBig.thread': [SPOOL_THREAD, spoolPal('#c84a44')],
  'spoolBig.top': [SPOOL_TOP, spoolPal('#c84a44')],
  'spoolBig.end': [SPOOL_END, spoolPal('#c84a44')],
  pincushion: [TOMATO, pincushionPal],
  'pincushion.grooves': [TOMATO_GROOVES, pincushionPal],
  'pincushion.leaf': [TOMATO_LEAF, pincushionPal],
  'pincushion.needle': [PIN_NEEDLE, pincushionPal],
  'pincushion.needle2': [PIN_NEEDLE2, pincushionPal],
  'pincushion.needle3': [PIN_NEEDLE3, pincushionPal],
  'pincushion.needle4': [PIN_NEEDLE4, pincushionPal],
  'pincushion.threaded': [THREADED_NEEDLE, pincushionPal],
  buttonHill: [SMALL_BTN, buttonsPal],
  bigButton: [BTN_ROUND, bigBtnPal('#3a3440')],
  'bigButton.square': [BTN_SQUARE, bigBtnPal('#3a3440')],
  'bigButton.holes2': [HOLES2, bigBtnPal('#3a3440')],
  'bigButton.holes4': [HOLES4, bigBtnPal('#3a3440')],
  yarnLine: [YARN_H, yarnPal],
  yarnKnot: [YARN_KNOT, yarnPal],
  'yarnKnot.loose': [YARN_LOOSE, yarnPal],
  tapeMeasure: [TAPE_MEASURE, tapePal],
  scissorsBig: [SCISSORS, scissorsPal],
  thimbleCup: [THIMBLE, thimblePal],
  medPouch: [MED_POUCH, medPal],
  clinicCard: [CLINIC_CARD, cardPal],
  crumpledLetters: [CRUMPLED, lettersPal],
  whiteScrap: [WHITE_SCRAP, scrapPal],
  fabricHill: [FABRIC, fabricPal],
  oilBottle: [OIL_BOTTLE, oilBottlePal],
  lensShard: [LENS, lensPal],
  chalk: [CHALK, chalkPal],
  pinBig: [PIN_HEAD, pinBigPal],
  'pinBig.shaft': [PIN_SHAFT, pinBigPal],
  'pinBig.tip': [PIN_TIP, pinBigPal],
  divider: [BOX_FRONT, dividerPal],
  'divider.top': [BOX_TOP, dividerPal],
  dawnPane: [DAWN, dawnPal],
  'dawnPane.horizon': [DAWN_HORIZON, dawnPal],
  'dawnPane.cloud': [DAWN_CLOUD, dawnPal],
  'dawnPane.stars': [DAWN_STARS, dawnPal],
  'dawnPane.barH': [DAWN_BAR_H, dawnPal],
  'dawnPane.barV': [DAWN_BAR_V, dawnPal],
};
