/**
 * 갈래 A 소품 (하루 방 · 새 방) 손찍기 격자. 글자는 chapkit.ts 공용 자리:
 *   C O L c k 주된 색 · A U M a m 둘째 · W Y V w v 나무 · S I T s t 쇠 · F Z P f p 천/종이 · B X R b r 셋째 · G Q H g h 넷째
 *   숫자 = 한 칸 포인트 색 (팔레트마다 뜻을 적어 둔다)
 */
import { pal, rep } from './chapkit.ts';
import type { Grid, Palette } from './grid.ts';

// ───────────────────────── 하루 침대 ─────────────────────────

/** 머리판 (왼쪽): 위 5줄 · 가운데 6줄(되풀이) · 아래 4줄 */
export const BED_HEAD: Grid = [
  '...VVVVV....',
  '..VYYVVVW...',
  '.VYVVVVWWw..',
  '.VVWWWWWWww.',
  '.VWWWWWWWwwv',
  '.VWvvvvvWwwv',
  '.VWVWWWwWwwv',
  '.VWVWWWwWwwv',
  '.VWVWWWwWwwv',
  '.VWwwwwwWwwv',
  '.VWWWWWWWwwv',
  '.VWWWWWWWwwv',
  '.wwwwwwwwwwv',
  '.vWWv..vWwv.',
  '.vvvv..vvvv.',
];
/** 매트리스 윗면 · 앞 둥근 모서리 (9-조각: 왼 3 · 오른 3 · 위 3 · 아래 6) */
export const BED_MAT: Grid = [
  '.PPPPPPPPPP.',
  'PZPPPPPPPPPf',
  'PPFFFFFFFFFf',
  'PFFFFFFFFFFf',
  'PFFFFFFFFFFf',
  'fFFFFFFFFFff',
  'pfffffffffpp',
  'pFFFFFFFFFfp',
  'pffffffffffp',
  '.pppppppppp.',
];
export const BED_PILLOW: Grid = [
  '...MMMMMMMMMMM....',
  '.MMUUUMMMMMMMMMM..',
  'MUUMMMMMMMMMMMMAa.',
  'MUMMMMMMMMMMMMAAaa',
  'MMMMMMMMMMMMMAAAaa',
  'MMMMMMMMMMMMAAAaaa',
  'AMMMMMMMMMAAAAaaam',
  'aAAMMMMAAAAAAaaaam',
  '.aaAAAAAAAAaaaaam.',
  '..maaaaaaaaaaamm..',
  '....mmmmmmmmmm....',
];
/** 걷어 낸 베개에 남은 머리 자국 */
export const BED_DENT: Grid = ['..aaa..', '.aaAAM.', '..AMM..'];
/** 덮은 이불 (9-조각: 왼 4 접힌 단 · 오른 2 · 위 2 · 아래 4, 가운데 6줄에 누빔 땀) */
export const BED_QUILT: Grid = [
  '.LLLLLLLLLLLc.',
  'LOOLLLLLLLLLcc',
  'LLLcCCCCCCCCcc',
  'LLLcCCCCCCCCcc',
  'LLLcCCCCCCCCcc',
  'LLLcCCCCCCCCcc',
  'LLLcCCCCCCCCcc',
  'LLLcCCCCCCCCcc',
  'LLLcCCcCCCCCcc',
  'LLLcCCCCCCCCcc',
  'cccccccccccccc',
  'kccccccccccckk',
  '.kkkkkkkkkkkk.',
];
/** 걷어 낸 이불: 발치에 뭉친 주름 더미 */
export const BED_LUMP: Grid = [
  '.........LLLLLL.............',
  '.....LLLLOOLLLLLLc..........',
  '...LLOOLLLLLLLLLCCcc..LLLL..',
  '..LOLLLLLCCCCLLLLCCccLOLLLc.',
  '.LOLLLCCCCcccCCLLLCCCLLLLCcc',
  '.LLLCCCcccLLLccCCLLLCCCCCCcc',
  'LLLCCcccLLOLLLcccCCLLLCCCccc',
  'LLCCccLLLLLLLLLLccCCCCCcCccc',
  'LCCcccLLLCCCCCLLLccCCccccckc',
  'LCCcccLCCCCCCCCCLLcccccccckk',
  'CCCcccCCCcccccCCCCcccccckkkk',
  'cCCccccCcccccccCCccckkkkkkk.',
  '.cccccccccccccccccckkkkkkk..',
  '..kkkkkkkkkkkkkkkkkkkkkk....',
];
/** 침대 앞판 · 다리 (가로 늘이기: 왼 3 · 오른 5) */
export const BED_FRONT: Grid = [
  'VYYYYYYYYYYYYYYYYYwv.',
  'VWWWWWWWWWWWWWWWWWwwv',
  'VWWWWWWWWWWWWWWWWWwwv',
  'VWWWWWWWWWWWWWWWWWwwv',
  'VWWWWWWwwwWWWWWWWWwwv',
  'VWWWWWWWWWWWWWWWWWwwv',
  'VWWWWWWWWWWWWwwWWWwwv',
  'VWWWWWWWWWWWWWWWWWwwv',
  'wwwwwwwwwwwwwwwwwwwwv',
  'vvvvvvvvvvvvvvvvvvvv.',
  '.VWv............vWv..',
  '.Wwv............vwv..',
  '.wwv............vvv..',
  '.....................',
];
/** 걷힌 이불 자락이 앞판 위로 늘어짐 */
export const BED_DRAPE: Grid = [
  '..LLLLLLLLLLLLLLLLLLLc..',
  '.LOLLLLLLLLLLLLLLLLLCcc.',
  'LLCCCCCCCCCCCCCCCCCCCCcc',
  'cCCCCcCCCCCCcCCCCCCCcCcc',
  '.ccccckcccccckcccccckcck',
  '..k...k......k.....k.k..',
];
/** 이불 가장자리로 늘어진 노란 털실 (1 털실 · 2 털실 그늘) */
export const BED_YARN: Grid = [
  '.1..',
  '.12.',
  '..1.',
  '..12',
  '..1.',
  '.12.',
  '.1..',
  '12..',
  '.1..',
  '.12.',
  '..1.',
  '..1.',
  '.112',
  '1112',
  '.22.',
];
export const bedPal = (dawn: boolean): Palette =>
  pal({ W: '#9a6a42', F: '#ece4d8', A: '#f2ecf2', C: dawn ? '#b8c4e0' : '#e8a8a0', 1: '#f0c848', 2: '#c89a30' });

// ───────────────────────── 의자 + 책가방 ─────────────────────────

export const CHAIR: Grid = [
  '...VVVVVVVVVVVVVVw....',
  '...VYYYYYYYYYYYYWww...',
  '...VWWWWWWWWWWWWWww...',
  '...wwwwwwwwwwwwwwwv...',
  ...rep('...VWw.........Wwv....', 24),
  '.VVVVVVVVVVVVVVVVVVw..',
  '.VYYYYYYYYYYYYYYYYWww.',
  '.VYVVVVVVVVVVVVVVVWww.',
  ...rep('.VVVVVVVVVVVVVVVVVWww.', 4),
  ...rep('.WWWWWWWWWWWWWWWWWwwv.', 3),
  '.wwwwwwwwwwwwwwwwwwv..',
  ...rep('..VWw..........Wwv....', 5),
  '..www..........wvv....',
];
export const BAG: Grid = [
  '.LLLLLLLLLLLc.',
  'LOOLLLLLLLLLcc',
  'LLCCCCCCCCCCcc',
  'LC1111111111cc',
  'LCCCCCCCCCCCcc',
  'LCCCCCCCCCCCcc',
  'LCCCCCCCCCCCcc',
  'LCLLLLLLLLLCcc',
  'LCL11111111Ccc',
  'LCCCCCCCCCCCcc',
  'LCCPPPPPCCCCcc',
  'LCCPpppPCCCCcc',
  'LCCPPPPPCCCCcc',
  'LCCCCCCCCCCCcc',
  'LCCccccccccCcc',
  'cCCCCCCCCCCCck',
  'cccccccccccckk',
  '.kkkkkkkkkkkk.',
];
/** 지퍼가 열려 속이 보인다 (3 속 어둠 · 공책 P · 4 5 도시락 주머니 · 6 껌 종이 반지) */
export const BAG_OPEN: Grid = [
  'LOOLLLLLLLLLcc',
  'L33333333333Cc',
  'L3PPPP344553cc',
  'L3PPPf344553cc',
  'LC3333333336cc',
];
export const BAG_STRAP: Grid = ['cc.....cc', 'cc.....cc', 'cc.....6c', 'cc.....cc'];
export const chairPal: Palette = pal({ W: '#8a6a4a', C: '#c86a6a', F: '#efe6d2', 1: '#e8d8a0', 3: '#3a2a30', 4: '#7aa0d0', 5: '#5a80b0', 6: '#f0d860' });

// ───────────────────────── 필통 사람들 ─────────────────────────

export const CASE: Grid = [
  '.LLLLLLLLLLLLLLLLLLLc..',
  'LOOOLLLLLLLLLLLLLLLLcc.',
  'LLLLLLLLLLLLLLLLLLLLccc',
  'LLL11111111111111LLLccc',
  'CCCCCCCCCCCCCCCCCCCCcck',
  'CCCCCCCCCCCCCCCCCCCCcck',
  'CCCCCCSSSCCCCCCCCCCCcck',
  'CCCCCCCCCCCCCCCCCCCCckk',
  'ccccccccccccccccccccck.',
  '.kkkkkkkkkkkkkkkkkkkk..',
];
/** 몽당연필 (e 눈 · 9 입) */
export const STUB: Grid = [
  '.MMMMMm.',
  'MUAAAAAa',
  'TTSSSSSs',
  'RRBBBBbb',
  'RBBBBBbb',
  'RBeBBebb',
  'RBBBBBbb',
  'RBB99Bbb',
  'RBBBBBbb',
  'RBBBBBbb',
  'RBBBBBbb',
  'bbbbbbbr',
  '.FFFFFf.',
  '..FFff..',
  '...pp...',
];
export const ERASER: Grid = [
  '.MMMMMMMMMMa.',
  'MUUMMMMMMMMaa',
  'MAAAAAAAAAAaa',
  'MAAeAAAeAAAaa',
  'MAAAAAAAAAAaa',
  'MAAAA99AAAAaa',
  'MA555555AAAaa',
  'MA555555AAAaa',
  'MAAAAAAAAAAam',
  'aaaaaaaaaaamm',
  '.mmmmmmmmmmm.',
];
const RULER_TICKS = ['FFFFff', 'FFFFff', 'tFFFff', 'FFFFff', 'FFFFff', 'tttFff'];
export const RULER: Grid = [
  '.PPPf.',
  'PZPPff',
  'tFFFff',
  'FFFFff',
  'FFFFff',
  'tttFff',
  'FeFFef',
  'FFFFff',
  'tF99ff',
  'FFFFff',
  'FFFFff',
  'tttFff',
  ...RULER_TICKS,
  ...RULER_TICKS,
  'FFFFff',
  'ffffpp',
];
export const pencilPal: Palette = pal({ C: '#6a9ac8', A: '#f4a8b8', B: '#f0c848', F: '#e8e0b8', S: '#c8c0b0', 1: '#b8d4f0', 5: '#e8f0f4', 9: '#c85a5a', e: '#3a2830' });

// ───────────────────────── 행거 ─────────────────────────

export const RACK: Grid = [
  'SSSSSSSSSSSSSSSSSSSSs.',
  'TIIIIIIIIIIIIIIIIIIITs',
  'sssssssssssssssssssss.',
  ...rep('.Ts................ts.', 60),
  'TSSSSs..........TSSss.',
  'tttttt..........tttt..',
];
export const JACKET: Grid = [
  '....SS....',
  '...S..S...',
  '.SSSSSSSs.',
  '.LPPCCPPc.',
  'LLCPPPPCcc',
  'LCCPFFPCcc',
  'LCCCPPCCcc',
  'LCCCCPCCcc',
  'LCCCC1CCcc',
  'LCCCCCCCcc',
  'LCCCC1CCcc',
  'LCCCCCCCcc',
  'LCLLCCCCcc',
  'LCCCC1CCcc',
  ...rep('LCCCCCCCcc', 10),
  'LCCCCcCCcc',
  'cCCCCcCCck',
  '.kkkkkkkk.',
];
export const DRESS: Grid = [
  '....S....',
  '...S.S...',
  '.SSSSSSS.',
  '6RRRRRRRb',
  '6RBBBBBBb',
  '6BB5BBBBb',
  '6BBB5BBBb',
  '6BBBBBBBb',
  '6BBBBBBBb',
  '6BBBBB5Bb',
  '6BBBBBB5b',
  '6BBBBBBBb',
  '6BB5BBBBb',
  '6BBB5BBBb',
  '6BBBBBBBb',
  '6BBBBBBBb',
  '6BBBBB5Bb',
  '6BBBBBB5b',
  '6BBBBBBBb',
  '6BB5BBBBb',
  '6BBB5BBBb',
  '6BBBBBBBb',
  '6BBBBBBBb',
  '6BBBBB5Bb',
  '6BBBBBB5b',
  '6BBBBBBBb',
  '6BB5BBBBb',
  '6BBB5BBBb',
  '6BBBBBBBb',
  '6BBBBBBBb',
  '6BBBBBBbb',
  'bbbbbbbbr',
  '.rrrrrrr.',
];
export const rackPal: Palette = pal({ S: '#a8a8b0', C: '#3a4a6a', F: '#e8e4dc', B: '#3a3238', 1: '#e0c060', 5: '#a0a4b8', 6: '#7a7a90' });

// ───────────────────────── 1칸 물건 ─────────────────────────

/** 장난감 상자가 있던 자리: 덜 바랜 네모 + 모서리 먼지 (1 먼지) */
export const BOX_MARK: Grid = [
  'vvvvvvvvvvvvvvvvvvvv',
  'vVVVVVVVVVVVVVVVVV1v',
  'v11VVVVVVVVVVVVVV11v',
  'v1WWWWWWWWWWWWWWWWVv',
  'vVWWWWWWWWWWWWWWWWVv',
  'vVWWWWWWWWWWWWWWWWVv',
  'vVWWWWWWWWWWWWWWWWVv',
  'vVWWWWWWWWWWWWWWWWVv',
  'vVWWWWWWWWWWWWWWWWVv',
  'vVWWWWWWWWWWWWWWWWVv',
  'vVWWWWWWWWWWWWWWWW1v',
  'v1VVVVVVVVVVVVVVV11v',
  'v11VVVVVVVVVVVVVVVVv',
  'vvvvvvvvvvvvvvvvvvvv',
];
export const boxMarkPal: Palette = pal({ W: '#c89a68', 1: '#b0a090' });

export const BIN: Grid = [
  '......PPP.........',
  '....PPZPPPf.PPP...',
  '...PZPPPPFfPZPPf..',
  '...PPP1PFFfPPPFf..',
  '.hhhPPPPFfhhfFfhh.',
  'QHHHHHHHHHHHHHHHgh',
  '.HGGGGGGGGGGGGGgh.',
  '.HGHGGGGgGGGGgGgh.',
  '.HGHGGGGgGGGGgGgh.',
  '.HGHGGGGgGGGGgGgh.',
  '.HGHGGGGgGGGGgGgh.',
  '..HGGGGGgGGGGgGh..',
  '..HGHGGGgGGGGggh..',
  '..HGHGGGgGGGGggh..',
  '..HGHGGGgGGGGggh..',
  '..HGHGGGgGGGGggh..',
  '..HGGGGGgGGGGggh..',
  '..HGGGGGGGGGGggh..',
  '..ggggggggggggh...',
  '...hhhhhhhhhhh....',
];
export const binPal: Palette = pal({ G: '#7a9a8a', F: '#efe6d2', 1: '#c85a5a' });

/** 별무늬 외짝 양말 (1 별) · 짝 양말은 SOCK2 */
export const SOCK: Grid = [
  'MMMMMMa.........',
  'MUUUUMa.........',
  'MAAAAAa.........',
  'MA1AAAa.........',
  'MAAAAAa.........',
  'MAAAAAa.........',
  'MAAA1Aa.........',
  'MAAAAAAMMMMMMa..',
  'MAAAAAAAAAAAAAa.',
  'MAAAAAA1AAAAAAaa',
  'MAAAAAAAAAAAaaaa',
  '.aAAAAAAAAAaaaam',
  '..maaaaaaaaaamm.',
  '....mmmmmmmmm...',
];
export const SOCK2: Grid = [
  'aaaaaam.........',
  'aMMMMam.........',
  'aAAAAam.........',
  'aAAAAam.........',
  'aAA1Aam.........',
  'aAAAAam.........',
  'aAAAAAaaaaaaam..',
  'aAAAAAAAAAAAAam.',
  'mAAAAAAAAAAaaam.',
  '.maaaaaaaaaaam..',
];
export const sockPal: Palette = pal({ A: '#e8c0d0', 1: '#f0c848' });

/** 옷걸이째 미끄러져 내려온 비닐 커버 원피스 */
export const DRESS_DOWN: Grid = [
  '.......SS.......',
  '......S..S......',
  '...SSSSSSSSSs...',
  '...6RRRRRRRRb...',
  '..6RBBBBBBBBBb..',
  '..6BB5BBBBBBBb..',
  '..6BBB5BBBBBBbb.',
  '.6BBBBBBBBBBBbb.',
  '.6BBBBBBBB5BBbb.',
  '.6BBBBBBBBB5Bbb.',
  '.6BBBBBBBBBBBbbb',
  '6BB5BBBBBBBBBbbb',
  '6BBB5BBBBBBBBbbb',
  '6BBBBBBBBBBBBbbb',
  '6BBBBBBBBB5BBbbb',
  'bbbbbbbbbbbbbbbr',
  '.rrrrrrrrrrrrrr.',
];

/** 인형 자리 먼지 자국: 먼지 덩이 속 동그란 빈 자리 둘 (테두리 f 조금 진하게) */
export const DUST_GHOST: Grid = [
  '..FF..FFFF...FF.F...',
  '.FFPPFFFFFFFFFPPFF..',
  'FFFFfffffFFFFFFFFFF.',
  'FFFf.....fFFFFFFFFFF',
  'FFf.......fFfffffFF.',
  'FFf.......ff.....fFF',
  'FFf.......f.......fF',
  '.Ff.......f.......fF',
  'FFFf.....fff.....fFF',
  'FFFFfffffFFFf...fFFF',
  '.FFFFFFFFFFFFfffFFF.',
  '..FFF.FFFFFFFFFFF.F.',
  '...F....FF..FFF.....',
];
export const dustPal: Palette = pal({ F: '#b8b0a4' });

/** 머그잔 자국 둘 (1 진한 고리 · 2 흐린 고리) */
export const MUG_RINGS: Grid = [
  '...1111.........',
  '.11....11.......',
  '1..3333..1......',
  '1.3....3.1......',
  '1.3....3.1......',
  '1..3333..1......',
  '.11....11.......',
  '...1111..222....',
  '.......22...22..',
  '......2.......2.',
  '......2.......2.',
  '......2.......2.',
  '.......22...22..',
  '.........222....',
];
export const mugPal: Palette = pal({ 1: '#7a5034', 2: '#a07a58', 3: '#8a6040' });

/** 빵 끈 집게 + 구겨진 빵 봉지 귀퉁이 */
export const BREAD_TIE: Grid = [
  '..........CCCCCCCc',
  '.........CLLLLLLCc',
  '.........CLC..CLCc',
  '.........CLC..CCCc',
  '........PPCCCCCCcc',
  '.......PZPccccccck',
  '.....PPPPPFf.kkkk.',
  '....PZPPPFFFf.....',
  '...PPPP1PPFFf.....',
  '..PPPPPPPPFFff....',
  '.PPPFFFFFFFFff....',
  'PPFFFFFFFFFFfff...',
  'ppffffffffffffp...',
  '.ppppppppppppp....',
];
export const breadPal: Palette = pal({ C: '#5a8ad0', F: '#e8dcc0', 1: '#c8a060' });

/** 의자 등받이에 걸쳐 둔 겨울 외투 (1 단추 · 주머니 불룩) */
export const COAT: Grid = [
  '..LLLLLLLLLLLLLLc..',
  '.LOOLLLLLLLLLLLLcc.',
  'LLLLLLLLLLLLLLLLccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCC1CCCCcCCCCCCCccc',
  'LCLLLLLCcCCCCCCCccc',
  'LLCCCCCLcCCCCCCCccc',
  'LCCCCCCccCCCCCCCccc',
  'LCCCCCccCCCCCCCCccc',
  'LcccccccCCCCCCCCccc',
  'LCCCCCCCcCCCCCCCccc',
  'LCCCCCCCcCCCCCCCcck',
  'cccccccccccccccccck',
  'kkkkkkkkkkkkkkkkkk.',
  '.kkkkkkkkkkkkkkkk..',
];
export const coatPal: Palette = pal({ C: '#c87a48', 1: '#f0d860' });

/** 크레용 통 (숫자 = 크레용 색, 짧아진 갈색 6) */
export const CRAYON_TIN: Grid = [
  '..1.3.5.........',
  '.1121334.6......',
  '.11223345566....',
  '.11223345566.6..',
  '.112233455668...',
  '.112233455668...',
  'LLLLLLLLLLLLLLc.',
  'LOOLLLLLLLLLLLcc',
  'LLLLLLLLLLLLLLcc',
  'CCCCCCCCCCCCCCcc',
  'CPPPPPPPPPPPCCcc',
  'CPPPPPPPPPPPCCcc',
  'CCCCCCCCCCCCCCcc',
  'CCCCCCCCCCCCCCck',
  'cccccccccccccckk',
  '.kkkkkkkkkkkkkk.',
];
export const tinPal: Palette = pal({ C: '#d8b048', F: '#f4ecd8', 1: '#c84a4a', 2: '#a03838', 3: '#e8a040', 4: '#f0d860', 5: '#5a9a5a', 6: '#4a7ac8', 8: '#8a5a3a' });

/** 투명 봉지 속 야광 별 스티커 (1 연두 별 · 2 별 그늘 · 3 봉지 띠) */
export const STICKER_BAG: Grid = [
  '33333333333333',
  '3333333333333b',
  'FFFFFFFFFFFFff',
  'FPPFFFFF1FFFff',
  'FPFF1FFF11FFff',
  'FPF111FF2F2Fff',
  'FFF2F2FFFFFFff',
  'FFFFFFFFFFFFff',
  'FFFFFF1FFFFFff',
  'FFFFF111FF1Fff',
  'FFFFF2F2F111ff',
  'FFFFFFFFF2F2ff',
  'FFFFFFFFFFFFff',
  'fffffffffffffp',
  '.ppppppppppppp',
];
export const stickerPal: Palette = pal({ F: '#e4ecf0', 1: '#c8f0a0', 2: '#90c870', 3: '#c84a6a', b: '#a03050' });

/** 뚜껑 없는 블록 상자: 글자 블록이 수북 (1 2 3 4 블록 색, 대문자 쪽이 밝은 윗면) */
export const BLOCK_BOX: Grid = [
  '....55.....77.........',
  '...5115..7337..99.....',
  '..511115733337933966..',
  '..51111573333793396226',
  '..21111473333492294226',
  '..22224144444322296226',
  '..22224114444388826666',
  'LLLLLLLLLLLLLLLLLLLc..',
  'LOOLLLLLLLLLLLLLLLLcc.',
  'LLLLLLLLLLLLLLLLLLLccc',
  'CCCCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCCCccc',
  'CCCCLLLCCCCCCCCCCCCccc',
  'CCCLCCCLCCCCCCCCCCCccc',
  'CCCLCCCLCCCCCCCCCCCccc',
  'CCCCLLLCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCCCcck',
  'CCCCCCCCCCCCCCCCCCCckk',
  'cccccccccccccccccccck.',
  '.kkkkkkkkkkkkkkkkkkk..',
];
export const blockPal: Palette = pal({ C: '#8ab0d8', 1: '#f08a7a', 2: '#c85a4a', 3: '#f6d870', 4: '#c8a038', 5: '#fcb0a0', 7: '#fff0b0', 9: '#8ac890', 6: '#5a9a60', 8: '#f4ecd8' });

/** 가방 지퍼 고리 (금속 손잡이 · 빨간 끈) + 루루 밧줄 */
export const ZIP: Grid = [
  '.ITTs.',
  'IT..ts',
  'T....s',
  'T....s',
  'T....s',
  'Ts..ss',
  '.Ssss.',
  'CCCCCc',
  'CLLLCc',
  'cccccc',
];
/** 밧줄: 늘어진 한 가닥 → 바닥에 둘둘 */
export const ROPE_HANG: Grid = [
  '...FF.......',
  '....Ff......',
  '...Ff.......',
  '..Ff........',
  '...Ff.......',
  '....Ff......',
  '...Ff.......',
  '.PPFFFFFf...',
  'PZPPFFFFFf..',
  'fFFFFFFFff..',
  '.ffffffff...',
];
export const ROPE_COIL: Grid = [
  '...PPPPPPPP...',
  '.PPZPPPFFFFff.',
  'PPFFffffffFFff',
  'PFFf......fFff',
  'fFFFffffffFFfp',
  '.ffFFFFFFFFfp.',
  '...pppppppp...',
];
export const zipPal: Palette = pal({ S: '#c8c8d0', C: '#e86a6a', F: '#d8b070' });

/** 찢어진 도화지 조각에 크레용 줄 (1 빨강 · 2 파랑 · 3 노랑) */
export const CRAYON_SCRAP: Grid = [
  '...............PP...',
  '..........PPPPPPf...',
  '....PPPPPPPP33PPf...',
  '.PPPPPPPPPP33PPPff..',
  'PPPPPPPP11PPPPPPff..',
  'PP11PPP1PP1PPPP1ff..',
  'P1PP1P1PPPP1PP1Pff..',
  'PPPPP1PPPPPP11PPPf..',
  'PPPPPPPPPPPPPPPPPff.',
  'PPP2P2P2P2P2PPPPPff.',
  'PPPPPPPPPPPPPPPPPPf.',
  'ffPPPPPPPPPPPPPPPPff',
  '.pffffffffffffffffff',
  '..ppp.pppppppppppppp',
];
export const scrapPal: Palette = pal({ F: '#f4ecd8', 1: '#e86a5a', 2: '#4a7ac8', 3: '#f0c848' });

/** 도화지 위 야광 별 스티커 자리 (1 별 · 2 별 반짝 · 3 연필 동그라미) */
export const GLOW_STAR_A: Grid = [
  '.....33333.....',
  '...33..1..33...',
  '.33...111...33.',
  '3..1111211111.3',
  '3...1112111...3',
  '.3...11111...3.',
  '..3.111.111.3..',
  '...311...113...',
  '.....33333.....',
];
export const glowAPal: Palette = pal({ 1: '#c8f0a0', 2: '#f0fcd8', 3: '#8a8478' });

/** 시험 · 확인용: 이 갈래의 모든 격자와 팔레트 */
export const PX_A: Record<string, [Grid, Palette]> = {
  'haruBed.head': [BED_HEAD, bedPal(false)],
  'haruBed.mat': [BED_MAT, bedPal(false)],
  'haruBed.pillow': [BED_PILLOW, bedPal(false)],
  'haruBed.dent': [BED_DENT, bedPal(false)],
  'haruBed.quilt': [BED_QUILT, bedPal(true)],
  'haruBed.lump': [BED_LUMP, bedPal(false)],
  'haruBed.front': [BED_FRONT, bedPal(false)],
  'haruBed.drape': [BED_DRAPE, bedPal(false)],
  'haruBed.yarn': [BED_YARN, bedPal(false)],
  'chairBag.chair': [CHAIR, chairPal],
  'chairBag.bag': [BAG, chairPal],
  'chairBag.open': [BAG_OPEN, chairPal],
  'chairBag.strap': [BAG_STRAP, chairPal],
  'pencilFolks.case': [CASE, pencilPal],
  'pencilFolks.stub': [STUB, pencilPal],
  'pencilFolks.eraser': [ERASER, pencilPal],
  'pencilFolks.ruler': [RULER, pencilPal],
  'hangerRack.rack': [RACK, rackPal],
  'hangerRack.jacket': [JACKET, rackPal],
  'hangerRack.dress': [DRESS, rackPal],
  boxMark: [BOX_MARK, boxMarkPal],
  wasteBin: [BIN, binPal],
  sockOne: [SOCK, sockPal],
  'sockOne.pair': [SOCK2, sockPal],
  dressBag: [DRESS_DOWN, rackPal],
  dustGhost: [DUST_GHOST, dustPal],
  mugRings: [MUG_RINGS, mugPal],
  breadTie: [BREAD_TIE, breadPal],
  coat: [COAT, coatPal],
  crayonTin: [CRAYON_TIN, tinPal],
  stickerBag: [STICKER_BAG, stickerPal],
  blockBox: [BLOCK_BOX, blockPal],
  zipTab: [ZIP, zipPal],
  'zipTab.hang': [ROPE_HANG, zipPal],
  'zipTab.coil': [ROPE_COIL, zipPal],
  crayonScrap: [CRAYON_SCRAP, scrapPal],
  glowStar: [GLOW_STAR_A, glowAPal],
};
