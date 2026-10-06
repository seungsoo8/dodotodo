/**
 * 갈래 C 소품 (안방 · 현관 · 욕실 · 부엌) 손찍기 격자. 글자는 chapkit.ts 공용 자리 (C A W S F B G N 재질 · 숫자 포인트).
 * 큰 가구는 조각 격자(윗면 · 앞면 · 문짝 · 손잡이)를 늘이고 겹쳐서 만든다. 조각은 W(나무) 글자로 적고, 가구마다 재질을 바꿔 칠한다.
 */
import { pal, rep } from './chapkit.ts';
import type { Grid, Palette } from './grid.ts';
import { BOX_FRONT, BOX_TOP, DOOR, KNOB } from './chapbox.ts';

// 공용 상자 조각 (윗면 · 앞면 · 문짝 · 손잡이) 은 chapbox.ts

// ───────────────────────── 냉장고 ─────────────────────────

/** 몸통 (가로: 왼 2 · 오른 6 = 앞 끝 1 + 옆면 5, 세로: 위 7 · 가운데 1 · 아래 3) */
export const FRIDGE: Grid = [
  '.PPPPPP.....',
  'PZZPPPPf....',
  'PZPPPPPff...',
  'PPPPPPPfff..',
  'PPPPPPPffff.',
  'PPPPPPPfffff',
  'ZZZZZZZfffff',
  'FFFFFFFfffff',
  'FFFFFFFfffff',
  'pppppppffffp',
  '.pppppp.ppp.',
];
/** 냉동칸 · 냉장칸 문 이음매 (가로 늘이기) */
export const FRIDGE_SEAM: Grid = ['pp', 'ZZ'];
/** 세로 손잡이 (짧은 · 긴: 세로 늘이기 1·1) */
export const FRIDGE_HANDLE: Grid = ['IS', 'IS', 'Ss', 'tt'];
/** 하루 크레용 그림 (해 · 사람) + 빨간 자석 */
export const FRIDGE_DRAW: Grid = [
  '.....11.....',
  '.ZZZZ11ZZZZ.',
  'ZZZZZZZZ2ZZZ',
  'ZZZZZZZ222ZZ',
  'ZZZ3ZZZZ2ZZZ',
  'ZZ333ZZZZZZZ',
  'ZZZ3ZZZZZZZZ',
  'ZZ434ZZZZZZZ',
  'Z4Z3Z4ZZZZZZ',
  'ZZZ3ZZZZZZZZ',
  'ZZ4Z4ZZZ555Z',
  'Z4ZZZ4Z55555',
  'ZZZZZZZZZZZZ',
  'ffffffffffff',
];
/** 메모 쪽지 (줄) + 파란 자석 */
export const FRIDGE_MEMO: Grid = [
  '...66.....',
  '7776677777',
  '7888888877',
  '7777777777',
  '7888887777',
  '7777777777',
  '7888888877',
  'pppppppppp',
];
export const MAGNET_G: Grid = ['.99.', '9999', '.99.'];
export const MAGNET_O: Grid = ['.33.', '3333', '.33.'];
/** 덜 닫힌 문틈으로 새는 빛 (세로 늘이기) */
export const FRIDGE_AJAR: Grid = ['eE'];
export const fridgePal: Palette = pal({
  F: '#e4e2da', S: '#b8bec4',
  1: '#c8483c', 2: '#f0c040', 3: '#e0784a', 4: '#e09858', 5: '#6ab04a', 6: '#4a8ac8', 7: '#f8e8a0', 8: '#a89a7a', 9: '#6ab04a',
  e: '#fff8dc', E: '#f0f2d8',
});

// ───────────────────────── 조리대 ─────────────────────────

/** 개수대 (윗면에 파인 쇠 그릇, 가로 늘이기 2·2) + 수도꼭지 */
export const SINK: Grid = [
  'ssssssss',
  'sttttttT',
  'stjjjjsT',
  'stjjjjsT',
  'stjjjjsT',
  'sTTTTTTT',
];
export const TAP: Grid = [
  '.IISSs',
  'ISSSSs',
  'Ss..Ss',
  'Ss..tt',
  'Ss....',
];
/** 가스레인지 (화구 둘) + 냄비 */
export const STOVE: Grid = [
  'jjjjjjjjjjjjjjjjjjjj',
  'jnnnnnnjjjjjjjjjjjjj',
  'jnjjjjnjjjjjnnnnnnjj',
  'jnjjjjnjjjjjnjjjjnjj',
  'jnnnnnnjjjjjnjjjjnjj',
  'jjjjjjjjjjjjnnnnnnjj',
  'jjjjjjjjjjjjjjjjjjjj',
];
export const POT: Grid = [
  '.TTTTTTT.',
  'STIIIIITs',
  'SSSSSSSss',
  'SSSSSSSss',
  'ssssssstt',
];
/** 과자 서랍 앞판 (나무 W) */
export const KDRAWER: Grid = [
  'YYYYYYYYYYYYYYYYYv',
  'YVVVVVVVVVVVVVVVVw',
  'YVVVVVVVVVVVVVVVVw',
  'YVVVVVITTTTsVVVVVw',
  'YVVVVVsssstVVVVVVw',
  'YVVVVVVVVVVVVVVVVw',
  'YVVVVVVVVVVVVVVVVw',
  'wwwwwwwwwwwwwwwwww',
];
/** 서랍이 빠져나간 빈 자리 (어두운 구멍) */
export const KDRAWER_HOLE: Grid = [
  'vvvvvvvvvvvvvvvvvv',
  'vjjjjjjjjjjjjjjjjv',
  'vjjjjjjjjjjjjjjjjv',
  'vjjjjjjjjjjjjjjjjv',
  'vjjjjjjjjjjjjjjjjv',
  'vjjjjjjjjjjjjjjjjv',
  'vjjjjjjjjjjjjjjjjv',
  'vvvvvvvvvvvvvvvvvv',
];
/** 빠져나온 서랍: 속에 사탕 봉지 · 과자 상자 (위는 속, 아래는 서랍 앞판) */
export const KDRAWER_OPEN: Grid = [
  '.vvvvvvvvvvvvvvvvvvv..',
  'vwwwwwwwwwwwwwwwwwwwv.',
  'vw11111wwww222222wwwvv',
  'vw1X1X1www2RRRRRR2wwvv',
  'vw11111www2RRRRRR2wwvv',
  'vw1r11rwww2RRRRRR2wwvv',
  'vw11111www2RRRRRR2wwvv',
  'vwrrrrrwww222222r2wwvv',
  'vwwwwwwwwwwwwwwwwwwwvv',
  'vwwwwwwwwwwwwwwwwwwwvv',
  'vwwwwwwwwwwwwwwwwwwwvv',
  'YYYYYYYYYYYYYYYYYYYYvv',
  'YVVVVVVVVVVVVVVVVVVVwv',
  'YVVVVVVVITTTTsVVVVVVwv',
  'YVVVVVVVsssstVVVVVVVwv',
  'YVVVVVVVVVVVVVVVVVVVwv',
  'YVVVVVVVVVVVVVVVVVVVwv',
  'YVVVVVVVVVVVVVVVVVVVw.',
  'wwwwwwwwwwwwwwwwwwwww.',
  'vvvvvvvvvvvvvvvvvvvvv.',
];
export const counterPal: Palette = pal({
  S: '#b8bcc0', F: '#d8c8a8', W: '#c08a52', j: '#3a3a44', n: '#5a5a66',
  1: '#e85a6a', X: '#f8e0e0', r: '#b03a4a', 2: '#c8902a', R: '#f0c040',
});

// ───────────────────────── 벽 찬장 ─────────────────────────

/** 열린 문 속 (9-조각 1·1·1·1) · 밥그릇 · 꿀단지 */
export const CUPBOARD_IN: Grid = ['vvv', 'vjv', 'vvv'];
export const IN_BOWL: Grid = [
  '.FFFFFF.',
  'ZPPPPPPf',
  'PFFFFFFf',
  '.PFFFFf.',
  '..pppp..',
];
export const IN_JAR: Grid = [
  '..wwww..',
  '.VVVVVw.',
  'B1BBBBBb',
  'BXBBBBbb',
  'B1RRRRbb',
  'BBRRRbbb',
  '.bbbbbb.',
];
export const cabPal: Palette = pal({ W: '#c8a878', S: '#b8bec4', F: '#f0ece0', B: '#e0a040', j: '#4a3428', 1: '#f8e0a8' });

// ───────────────────────── 신발장 ─────────────────────────

/** 위 거울 (9-조각 3·3·3·3): 나무 틀 · 푸른 유리 · 비친 빛 (G 유리) */
export const MIRROR: Grid = [
  '.VVVVVVVVVv.',
  'VYYYYYYYYYwv',
  'VYHHHHHHHHwv',
  'VYHGGGGGGgwv',
  'VYHGGGGGGgwv',
  'VYHggggggg wv'.replace(' ', ''),
  'VVwwwwwwwwwv',
  '.vvvvvvvvvv.',
];
/** 거울에 꽂힌 사진 (1 액자 종이 · 2 얼굴) */
export const PHOTO: Grid = ['111111', '1Q2221', '122221', '1Q2Q21', '111111'];
/** 반쯤 열린 아래 칸: 할머니 털신 한 켤레 */
export const FURSHOE_IN: Grid = [
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
  'jjj33333333jj33333333jjjjjjjjjjjjjjjjjj',
  'jj3PPPPPPPP33PPPPPPPP3jjjjjjjjjjjjjjjjj',
  'jj3BBBBBBBB33BBBBBBBB3jjjjjjjjjjjjjjjjj',
  'jj3BBBBBBbb33BBBBBBbb3jjjjjjjjjjjjjjjjj',
  'jj3bbbbbbbb33bbbbbbbb3jjjjjjjjjjjjjjjjj',
  'jjj33333333jj33333333jjjjjjjjjjjjjjjjjj',
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
];
export const shoeCabPal: Palette = pal({ W: '#c8a87c', S: '#b8bec4', G: '#8a9ab8', F: '#e8dcc8', B: '#8a6a5a', j: '#4a3428', 3: '#2e2018', 1: '#e8e0d0', 2: '#c8a080' });

// ───────────────────────── 1칸 물건 ─────────────────────────

/** 쌀 포대 (F 포대 · 1 붉은 띠 · 2 띠 글씨 · 3 쌀알) */
export const RICE_SACK: Grid = [
  '.....pffp.......',
  '....pFFFFp......',
  '...PPFffFFf.....',
  '..PZPPPFFFFf....',
  '.PZPPPPPPFFff...',
  'PPPPPPPPPFFFff..',
  'PPPPPPPPPPFFfff.',
  'PPPPPPPPPPFFfff.',
  'P11111111111fff.',
  'P1222122212.fff.',
  'P11111111111fff.',
  'PPPPPPPPPPFFfff.',
  'PPPPPfPPPPFFfff.',
  'PPPPPPfPPPFFfff.',
  'PPPPPPPPPPFFfff.',
  'PPPPPPPPPFFFfff.',
  'PPPPPPPPPFFffff.',
  'fFFFFFFFFFffffp.',
  '.fffffffffffpp3.',
  '3.pppppppppp..3.',
];
export const ricePal: Palette = pal({ F: '#e8dcc0', 1: '#c85a4a', 2: '#f0d8c8', 3: '#f4f0e0' });

/** 빨간 리본 한 토막 */
export const RIBBON: Grid = [
  'CL.......LC.',
  'COLL...LLcC.',
  'CCLLC.CLLcc.',
  'CCCCckCCccc.',
  'CCcccCCccck.',
  'Cccck.kccck.',
  '....k.k.....',
  '...cc..cc...',
  '..cc....cc..',
  '.kk......kk.',
];
export const ribbonPal: Palette = pal({ C: '#c8483c' });

/** 앞치마 걸이: 큰 앞치마(C) · 작은 앞치마(A) · 주머니 속 열쇠 꾸러미(1) */
export const APRON: Grid = [
  'VYYYYYYYYYYYYYYYYv',
  'wwwwwwwwwwwwwwwwwv',
  '.LLLLLLLL.MMMMMM..',
  '.LCCCCCCc.MAAAAa..',
  '.LCCCCCCc.MUUUUa..',
  '.LCCCCCCc.MAAAAa..',
  '.LCCCCCCc.MAAAAa..',
  '.LCCCCCCc.MUUUUa..',
  '.LCCCCCCc.MAAAAa..',
  '.LCCC11Cc.MAAAAa..',
  '.LCC1112c.MUUUUa..',
  '.LCLL1LLc.MAAAAa..',
  '.LCLccccc.MAAAAa..',
  '.LCLCCCCc.MUUUUa..',
  '.LCLCCCCc.MAAAAa..',
  '.LCcccccc.aaaaaa..',
  '.LCCCCCCc.........',
  '.LCCCCCCc.........',
  '.LCCCCCCc.........',
  '.LCCCCCCc.........',
  '.LCCCCCCc.........',
  '.LCCCCCCc.........',
  '.cccccccc.........',
];
export const apronPal: Palette = pal({ W: '#a8703c', C: '#d8a0a0', A: '#a0c0d8', U: '#f0f0e8', 1: '#e8c060', 2: '#b88a30' });

/** 보석함 뚜껑 (닫힘) · 열린 뚜껑 + 발레리나 (1 살 · 2 치마) · 동백 머리핀 (3) · 4 자물쇠 */
export const JEWEL_LID: Grid = [
  '.LLLLLLLLLLLLLLc...',
  'LOOLLLLLLLLLLLLcc..',
  'LLLLLLLLLLLLLLLccc.',
  'ccccccccccccccccckk',
];
export const JEWEL_OPEN: Grid = [
  '.MMMMMMMMMMMMMMa...',
  'MAAAAAAAAAAAAAAaa..',
  'MAAAAAAA11AAAAAaa..',
  'MAAAAAAA11AAAAAaa..',
  'MAAAAAA2222AAAAaa..',
  'MAAAAAAA22AAAAAaa..',
  'MAAAAAAA2AAAAAAaa..',
  'aaaaaaaa2aaaaaaaa..',
];
export const JEWEL_PIN: Grid = ['.33.', '3443', '.33.'];
export const JEWEL_LOCK: Grid = ['444', '4k4', '444'];
export const jewelPal: Palette = pal({ C: '#c8607a', A: '#e890a8', 1: '#f2c8a0', 2: '#f0d8e0', 3: '#c8483c', 4: '#e8c060' });

/** 빨래 건조대: 다리 · 막대 (S) + 아빠 수건 (A 줄무늬) · 엄마 고무장갑 (1) · 흰 행주 (F) */
export const DRY_RACK: Grid = [
  '..IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIs..',
  '..ssssssssssssssssssssssssssssssssssssssss..',
  '...MMMMMMMMMMMMM.....1111.....PPPPPPP.......',
  '...AAAAAAAAAAAAA.....1111.....FFFFFFf.......',
  '...AAAAAAAAAAAAa.....1112.....FFFFFFf.......',
  '...aaaaaaaaaaaaa.....1112.....FFFFFFf.......',
  '...AAAAAAAAAAAAa.....1112.....FFFFFFf.......',
  '...AAAAAAAAAAAAa.....1112.....FFFFFFf.......',
  '...AAAAAAAAAAAAa.....1112.....FFFFFFf.......',
  '...AAAAAAAAAAAAa.....1112.....FFFFFFf.......',
  '...aaaaaaaaaaaaa.....1112.....FFFFFFf.......',
  '...AAAAAAAAAAAAa....111122....FFFFFFf.......',
  '...AAAAAAAAAAAAa....111122....FFFFFFf.......',
  '...AAAAAAAAAAAAa....1.1.12....FFFFFFf.......',
  '...AAAAAAAAAAAAa....1.1.12....FFFFFFf.......',
  '...aaaaaaaaaaaaa..............FFFFFFf.......',
  '...AAAAAAAAAAAAa..............fffffff.......',
  '...AAAAAAAAAAAAa............................',
  '...AAAAAAAAAAAAa............................',
  '...aaaaaaaaaaaam............................',
];
/** 비스듬한 다리 (네 줄마다 한 칸씩 옆으로) */
export const DRY_LEG: Grid = [
  ...rep('.......Ts', 4),
  ...rep('......Ts.', 4),
  ...rep('.....Ts..', 4),
  ...rep('....Ts...', 4),
  ...rep('...Ts....', 4),
  ...rep('..Ts.....', 4),
  ...rep('.Ts......', 4),
  ...rep('Ts.......', 4),
  'tts......',
];
export const dryPal: Palette = pal({ S: '#c8ccd4', A: '#7a9ac8', F: '#f0ece0', 1: '#f0c040', 2: '#c89a20' });

/** 신발 한 켤레 (C 자리를 신발마다 다른 색으로, 1 운동화 빨간 줄 · 2 털신 털) */
export const SHOE: Grid = [
  '..kkkk...',
  '.kjjjjk..',
  'LCkjjkCCc',
  'LCCCCCCCc',
  'LCCCCCCCc',
  'ZZZZZZZZz',
  'zzzzzzzzz',
];
export const SHOE_STRIPE: Grid = ['.1111111.'];
export const SHOE_FUR: Grid = ['.22222...', '2222222..'];
export const shoePal = (c: string): Palette => pal({ C: c, j: '#2a1c24', Z: '#e8e0d0', z: '#b8b0a0', 1: '#e05a4a', 2: '#f0e8d8' });

/** 천장 등: 내려온 줄 (S) · 둥근 갓 (F) · 센서등 붉은 점 (1) */
export const LAMP_CORD: Grid = ['s', '.', 's', '.', 's', 'S'];
export const LAMP: Grid = [
  '.....TTT.....',
  '.....SSS.....',
  '...PPPPPPP...',
  '.PPZZZZPPPPf.',
  'PZZPPPPPPPPff',
  'PPPPPPPPPP1ff',
  'FPPPPPPPPPFff',
  'fFFFFFFFFFffp',
  '.22222222222.',
  '..2222222....',
];
export const lampPal: Palette = pal({ S: '#8a8a90', F: '#e8e0c8', 1: '#e85a4a', 2: '#f8f0b8' });

/** 고무 오리 (1 부리 · e 눈) */
export const DUCK: Grid = [
  '.........LLLL....',
  '........LOLLCc...',
  '........LLeLCc11.',
  '........LLLLC111.',
  '..L......cCCc....',
  '.LCL...LLLCCc....',
  'LOLLLLLLLLLCCc...',
  'LLCCCCCCCCCCCc...',
  'cCCCCCCCCCCCck...',
  '.ccccccccccck....',
  '..kkkkkkkkkk.....',
];
export const duckPal: Palette = pal({ C: '#f0c838', 1: '#e8783a', e: '#2a1c24' });

/** 개켜 쌓은 수건 (C A B G 네 장, 맨 위에 비닐 싼 공책 귀퉁이 F) */
export const TOWELS: Grid = [
  '..............PPPPf.',
  '.MMMMMMMMMMMMMFFFFf.',
  '.AAAAAAAAAAAAAAAAAa.',
  '.aaaaaaaaaaaaaaaaaa.',
  'LLLLLLLLLLLLLLLLLLc.',
  'CCCCCCCCCCCCCCCCCCc.',
  'ccccccccccccccccccc.',
  '.RRRRRRRRRRRRRRRRRRb',
  '.BBBBBBBBBBBBBBBBBBb',
  '.bbbbbbbbbbbbbbbbbbb',
  'HHHHHHHHHHHHHHHHHHg.',
  'GGGGGGGGGGGGGGGGGGg.',
  'gggggggggggggggggggh',
];
export const towelPal: Palette = pal({ A: '#a8c8e0', C: '#f0e8d8', B: '#e8b0b8', G: '#c8e0c0', F: '#e8ecf0' });

/** 꽃무늬 바가지 (1 꽃) */
export const GOURD: Grid = [
  '..ccccccccccc.........',
  '.cckkkkkkkkkcc........',
  'LLckkkkkkkkkcLLLLLLc..',
  'LOLLLLLLLLLLLLCCCCCcc.',
  'LLL1LLLL1LLLL1CCcccc..',
  'cCCCCCCCCCCCCCCc......',
  '.cCCCCCCCCCCCcc.......',
  '..kkkkkkkkkkkk........',
];
export const gourdPal: Palette = pal({ C: '#e8d0a0', 1: '#e8708a' });

/** 향수병 (A 유리 · 1 금 뚜껑 · F 상표) */
export const PERFUME: Grid = [
  '....1112....',
  '....1112....',
  '...111122...',
  '...111122...',
  '.MMMMMMMMMa.',
  'MUUMAAAAAAaa',
  'MUAAAAAAAAaa',
  'MUAPPPPPPAaa',
  'MUAPFFFFfAaa',
  'MUAPPPPPPAaa',
  'MUAAAAAAAAaa',
  'MAAAAAAAAAaa',
  'MAAAAAAAAAam',
  'aaaaaaaaaamm',
  '.mmmmmmmmmm.',
];
export const perfumePal: Palette = pal({ A: '#e8b0c8', F: '#f6efdf', 1: '#e8c060', 2: '#b8902a' });

/** 현관 돌 타일 넷 (줄눈 j, 타일마다 결이 조금씩 다르다) — 24×24 되풀이 */
export const TILE_FLOOR: Grid = [
  'jjjjjjjjjjjjjjjjjjjjjjjj',
  'jTTTTTTTTTTTjPPPPPPPPPPP',
  'jTSSSSSSSSSSjPFFFFFFFFFF',
  'jTSSSSSSSSSSjPFFFFFFFFFF',
  'jTSSSSsSSSSSjPFFFFFFFFFF',
  'jTSSSSSsSSSSjPFFFFFFfFFF',
  'jTSSSSSSSSSSjPFFFFFFFFFF',
  'jTSSSSSSSSSSjPFFFFFFFFFF',
  'jTSSSSSSSSSSjPFFFFFFFFFF',
  'jTSSSSSSSSsSjPFFFFFFFFFF',
  'jTSSSSSSSSSSjPFFFfFFFFFF',
  'jTSSSSSSSSSSjPFFFFFFFFFF',
  'jjjjjjjjjjjjjjjjjjjjjjjj',
  'jPPPPPPPPPPPjTTTTTTTTTTT',
  'jPFFFFFFFFFFjTSSSSSSSSSS',
  'jPFFFFFFFFFFjTSSSSSSSSSS',
  'jPFFFfFFFFFFjTSSSSsSSSSS',
  'jPFFFFFFFFFFjTSSSSSSSSSS',
  'jPFFFFFFFFFFjTSSSSSSSSSS',
  'jPFFFFFFFFFFjTSSSSSSSsSS',
  'jPFFFFFFFFFFjTSSSSSSSSSS',
  'jPFFFFFFFfFFjTSSSSSSSSSS',
  'jPFFFFFFFFFFjTSSSSSSSSSS',
  'jPFFFFFFFFFFjTSSSSSSSSSS',
];
export const tilePal: Palette = pal({ S: '#9a9690', F: '#a29d96', j: '#76726c' });

/** 꿀단지 (C 옹기 · 1 금빛 띠 · F 상표 · W 나무 뚜껑 · 2 열린 꿀) */
export const HONEY_JAR: Grid = [
  '....11111111....',
  '...1111111122...',
  '...cccccccccc...',
  '..LLLLLLLLLLcc..',
  '.LOOLLLLLLLLLcc.',
  'LOLLLLLLLLLLLCcc',
  'LLLLLLLLLLLLCCcc',
  'LLLLPPPPPPPLCCcc',
  'LLLLPFFFFFPCCCcc',
  'LLLLPFFFFFPCCCcc',
  'LLLLPPPPPPPCCcck',
  'LLLLLLLLLLCCCcck',
  'cLLLLLLLLCCCccck',
  'cCCCCCCCCCCccckk',
  '.ccCCCCCCCCcckk.',
  '..ccccccccccck..',
  '...kkkkkkkkkk...',
];
export const HONEY_LID: Grid = [
  '..YYYYYYYYYYYv..',
  '.YVVVVVVVVVVVwv.',
  'VVWWWWWWWWWWWwwv',
  'wwwwwwwwwwwwwwwv',
];
export const HONEY_OPEN: Grid = ['..22222222..', '.2233333322.'];
export const honeyPal: Palette = pal({ C: '#c88a48', W: '#b88050', F: '#f0e0b0', 1: '#e8c060', 2: '#f0b030', 3: '#f8d060' });

/** 딸기 사탕 (양 끝을 비튼 빨간 비닐) */
export const CANDY: Grid = [
  'MM............MM',
  'MAAa..LLLLL..MAa',
  'MAAaaLOOLLLcaAAa',
  'MAAAACLLLLCCAAAa',
  'MAAaaCCCCCCcaAAa',
  'MAa..ccccccc.aAa',
  'aa....kkkkk...aa',
];
export const candyPal: Palette = pal({ C: '#e04858', A: '#e86878' });

/** 그릇 하나 (C 자리를 그릇마다 바꿔 칠한다) · 맨 밑 토끼 그림 (1) */
export const BOWL: Grid = [
  'OOOOOOOOOOOOOOOOOO',
  'LCCCCCCCCCCCCCCCcc',
  'LCCCCCCCCCCCCCCCcc',
  '.LCCCCCCCCCCCCCcc.',
  '.cCCCCCCCCCCCCccc.',
  '..ccccccccccccck..',
];
export const BOWL_RABBIT: Grid = ['1.1', '111', '.1.'];
export const bowlPal: Palette = pal({ C: '#f0ece0', A: '#d8e4ec', B: '#f4e4c8', G: '#e8d0d8', 1: '#e8a0b0' });

/** 깔린 선반 판 (가로 늘이기 2·4, 나뭇결 띄엄띄엄) */
export const SHELF_BOARD: Grid = [
  '.VVVVVVVVVVVVVVVVVVv..',
  'VYYYVVVVVVVVYYYVVVVwv.',
  'VVVVVVVVVVVVVVVVVVVwwv',
  'VVVVVVVVVVVVVVVVVVVwwv',
  'WWWWWWWWWWWWWWWWWWWwwv',
  'WWWWWwwwWWWWWWWWWWWwwv',
  'WWWWWWWWWWWWWWWwwWWwwv',
  'wwwwwwwwwwwwwwwwwwwwwv',
  '.vvvvvvvvvvvvvvvvvvvv.',
];
export const shelfPal: Palette = pal({ W: '#b88a58', S: '#b8bec4' });

// ───────────────────────── 엄마 침대 ─────────────────────────

/** 머리판 (가로 늘이기 3·5) */
export const MOM_HEAD: Grid = [
  '...VVVVVVVVVv...',
  '.VVYYYYYYYYYVvv.',
  'VYYVVVVVVVVVVwwv',
  'VYVVVVVVVVVVVwwv',
  'VVWWWWWWWWWWWwwv',
  'VWWWvvvvvvvWWwwv',
  'VWWWVWWWWWwWWwwv',
  'VWWWVWWWWWwWWwwv',
  'VWWWVWWWWWwWWwwv',
  'VWWWwwwwwwwWWwwv',
  'VWWWWWWWWWWWWwwv',
  'wwwwwwwwwwwwwwwv',
];
/** 베개 · 엄마 얼굴과 머리카락 (옆으로 누워 문 쪽을 본다: H 머리 · S 살 · e 감은 눈) */
export const MOM_PILLOW: Grid = [
  '.....PPPPPPPPPPPPPPPPPPPPPP.....',
  '...PPZZZPPPPPPPPPPPPPPPPPPPPP...',
  '.PPZZPPPPPPPPPPPPPPPPPPPPPPPPPf.',
  'PZPPPPPPPPPPPPPPPPPPPPPPPPPPPFff',
  'PPPPPPPPPPPPPPPPPPPPPPPPPPPPFFff',
  'FPPPPPPPPPPPPPPPPPPPPPPPPPPFFFff',
  'fFFPPPPPPPPPPPPPPPPPPPPPPFFFFfff',
  '.ffFFFFFFFFFFFFFFFFFFFFFFFFffff.',
  '...fffffffffffffffffffffffffff..',
];
export const MOM_FACE: Grid = [
  '...hhhhhh....',
  '.hhHHHHHHhh..',
  'hHHgGgHHHHHh.',
  'hHgHHHHHHHHHh',
  'hHHHHhSSSHHHh',
  'hHHHhSSSSSHhh',
  'hHHhSTSSSSShh',
  '.hHhSSeeSSShh',
  '.hhhSSSSSSs h'.replace(' ', 'h'),
  '..hhsSSSSSsh.',
  '...hhssssshh.',
  '....hhhhhh...',
];
/** 이불 (9-조각: 왼 3 · 오른 4 · 위 3 · 아래 4, 가운데 결) */
export const MOM_QUILT: Grid = [
  '.LLLLLLLLLLLLc.',
  'LOOLLLLLLLLLLcc',
  'LLLLLLLLLLLLLcc',
  'LCCCCCCCCCCCCcc',
  'LCCCCCCCCCCCCcc',
  'LCCCCCCCCCCCCcc',
  'LCCCCCCCCCCCCcc',
  'LCCCCCCCCCCCCcc',
  'LcccccccccccCcc',
  'LCCCCCCCCCCCCcc',
  'cccccccccccccck',
  'LLLLLLLLLLLLLck',
  'cccccccccccccck',
  '.kkkkkkkkkkkkk.',
];
/** 이불 아래 몸의 굴곡 (어깨 · 엉덩이, 숨 쉬듯 낮게) · 이불 밖으로 나온 손 */
export const MOM_BODY: Grid = [
  '..........LLLLLLLLLLL..............',
  '.......LLLOOLLLLLLLLLLLc...........',
  '.....LLOOLLLLLLLLLLLLLLccc.........',
  '....LOLLLLLLLLLLLLLLLLLLLcc........',
  '...LOLLLLLLLLLLLLLLLLLLLLLcc.......',
  '...LLLLLLLLLLLLLLLLLLLLLLLLcc......',
  '...LLLLLLLLLLLLLLLLLLLLLLLLLccc....',
  '...cLLLLLLLLLLLLLLLLLLLLLLLLLLcc...',
  '....cLLLLLLLLLLLLLLLLLLLLLLLLLLcc..',
  '.....ccLLLLLLLLLLLLLLLLLLLLLLLLLc..',
  '.......cccLLLLLLLLLLLLLLLLLLLLLLcc.',
  '..........cccLLLLLLLLLLLLLLLLLLLLc.',
  '.............ccccLLLLLLLLLLLLLLLLc.',
  '.................cccccLLLLLLLLLLLcc',
  '......................ccccccccccc..',
];
export const MOM_HAND: Grid = ['.LSSs.', 'LSSSSs', '.ssss.'];
export const momPal: Palette = pal({ W: '#8a5a3c', F: '#f0ece4', C: '#9a9ab8', S: '#f2c8a0', e: '#5a3a30', H: '#3a2a28', h: '#24181c', g: '#54403a', G: '#6a5448' });

// ───────────────────────── 장난감이 올라서는 윗면 · 앞면 ─────────────────────────

/** 식탁보 (분홍 체크 6칸) — 12×12 되풀이 */
export const TOP_CLOTH: Grid = [
  'PPPPPPFFFFFF',
  'PPPPPPFFFFFF',
  'PPPPPPFFFFFF',
  'PPPPPPFFFFFF',
  'PPPPPPFFFFFF',
  'PPPPPPFFFFFF',
  'FFFFFFfFFFFF',
  'FFFFFFFFFFFF',
  'FFFFFFFFFFFF',
  'FFFFFFFFFFFF',
  'FFFFFFFFFFFF',
  'FFFFFFFFFFFF',
];
/** 세면대 대리석 (가는 결) — 24×24 되풀이 */
export const TOP_MARBLE: Grid = [
  'TTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTT',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSsSSSSSSSSSSSSSSSSSS',
  'SSSSSSsSSSSSSSSSSSSSSSSS',
  'SSSSSSSssSSSSSSSSSSSSSSS',
  'SSSSSSSSSsSSSSSSSSSSSSSS',
  'SSSSSSSSSSsSSSSSSSSSSSSS',
  'SSSSSSSSSSSssSSSSSSSSSSS',
  'SSSSSSSSSSSSSsSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSsSSSS',
  'SSSSSSSSSSSSSSSSSSsSSSSS',
  'SSSSSSSSSSSSSSSSSsSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SsSSSSSSSSSSSSSSSSSSSSSS',
  'SSsSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
];
/** 화장대 나무 판 (널 · 결) — 36×24 되풀이 */
export const TOP_WOOD: Grid = [
  'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
  'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWwwwWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWwwwwWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWwwWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
  'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWwwwWWWWWWWWWWWW',
  'WWWwwwwWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwwWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWwwWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
]
/** 둘레 (9-조각 2·2·2·1): 뒤와 양옆은 그늘, 앞 가장자리는 밝게 — 가운데 '.' 는 무늬가 비친다 */
export const TOP_RIM: Grid = ['ddddd', 'ddddd', 'dd.ee', 'll.ee', 'LLLLL'];
export const surfacePal = (c: string): Palette => {
  const p = pal({ F: c, S: c, W: c });
  return { ...p, P: pal({ F: c }).P, d: pal({ F: c }).p, e: pal({ F: c }).f, l: pal({ F: c }).f, L: pal({ F: c }).Z };
};

/** 늘어진 식탁보 앞자락 (가로 늘이기 0·0) · 식탁 다리 */
export const CLOTH_FRONT: Grid = [
  'ZZZZZZZZZZZZZZ',
  'PPPPPPPPPPPPPP',
  'PPFPPPPPPFPPPP',
  'PPFPPPPPPFPPPP',
  'PPFPPPPPPFPPPP',
  'PPfPPPPPPfPPPP',
  'PPfPPPPPPfPPPP',
  'FFfFFFFFFfFFFF',
  'FFFFFFFFFFFFFF',
  'fffffffffffffff'.slice(0, 14),
  'p.p.p.p.p.p.p.',
];
export const TABLE_LEG: Grid = ['YWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'wwv'];
export const clothFrontPal: Palette = pal({ F: '#e0c8c8', W: '#965e30' });
/** 계단 서랍: 아래에 앞으로 나온 판 */
export const STAIR: Grid = ['YYYYYYYYv', 'vvvvvvvvv'];

/** 화장대 거울 (9-조각 8·8·8·8 둥근 모서리): 나무 테 W · 푸른 유리 G · 비친 빛 Q H */
export const VANITY: Grid = [
  '.....VVVVVVVVVVVVVVVV.....',
  '...VVYYYYYYYYYYYYYYYYwv...',
  '..VYYVVVVVVVVVVVVVVVVVwv..',
  '.VYVVWWWWWWWWWWWWWWWWVVwv.',
  '.VYVWWGGGGGGGGGGGGGGGWWwv.',
  'VYVWWGHHGGGGGGGGGGGGGGWwwv',
  'VYVWGHQHGGGGGGGGGGGGGGgWwv',
  'VYVWGHHGGGGGGGGGGGGGGGgWwv',
  'VYVWGGGGGGGGGGGGGGGGGGgWwv',
  'VYVWGGGGGGGGGGGGGGGGGGgWwv',
  'VYVWGGGGGGGGGGGGGGGGGGgWwv',
  'VYVWGGGGGGGGGGGGGGGGGGgWwv',
  'VYVWGGGGGGGGGGGGGGGGGGgWwv',
  'VYVWGGGGGGGGGGGGGGGGGgWWwv',
  'VYVWWGGGGGGGGGGGGGGGGgWwwv',
  '.VVWWgggGGGGGGGGGGGggWWwv.',
  '.VVVWWWgggggggggggggWWWwv.',
  '..wVVWWWWWWWWWWWWWWWWWwv..',
  '...wwwwwwwwwwwwwwwwwwwv...',
  '.....vvvvvvvvvvvvvvvv.....',
]
/** 거울에 비친 빛 줄 (Q) · 꽂힌 주차권 (1) · 사진 (2 · 3 얼굴) */
export const VANITY_GLINT: Grid = ['......Q', '.....Q.', '....Q..', '...Q...', '..Q....', '.Q.....', 'Q......'];
export const VANITY_TICKET: Grid = ['111111', '1PPPP1', '1PPPP1', '1PPPP1', '111111', '1P1P11', '111111', '1PPPP1'];
export const VANITY_PHOTO: Grid = ['2222222', '2333332', '2343432', '2333332', '2344432', '2333332', '2222222', '2222222', '2222222'];
export const vanityPal: Palette = pal({ W: '#c08a58', G: '#7a8ab0', F: '#f0e8c8', 1: '#f0e8c8', 2: '#f6efdf', 3: '#c8a080', 4: '#7a5040' });

export const PX_C: Record<string, [Grid, Palette]> = {
  'kcounter.boxTop': [BOX_TOP, counterPal],
  'kcounter.boxFront': [BOX_FRONT, counterPal],
  'kcounter.door': [DOOR, counterPal],
  'kcounter.knob': [KNOB, counterPal],
  'kcounter.sink': [SINK, counterPal],
  'kcounter.tap': [TAP, counterPal],
  'kcounter.stove': [STOVE, counterPal],
  'kcounter.pot': [POT, counterPal],
  'kcounter.drawer': [KDRAWER, counterPal],
  'kcounter.drawerOpen': [KDRAWER_OPEN, counterPal],
  fridge: [FRIDGE, fridgePal],
  'fridge.seam': [FRIDGE_SEAM, fridgePal],
  'fridge.handle': [FRIDGE_HANDLE, fridgePal],
  'fridge.drawing': [FRIDGE_DRAW, fridgePal],
  'fridge.memo': [FRIDGE_MEMO, fridgePal],
  'fridge.magnetG': [MAGNET_G, fridgePal],
  'fridge.magnetO': [MAGNET_O, fridgePal],
  'fridge.ajar': [FRIDGE_AJAR, fridgePal],
  'wallCab.in': [CUPBOARD_IN, cabPal],
  'wallCab.bowl': [IN_BOWL, cabPal],
  'wallCab.jar': [IN_JAR, cabPal],
  'wallCab.door': [DOOR, cabPal],
  'shoeCabinet.mirror': [MIRROR, shoeCabPal],
  'shoeCabinet.photo': [PHOTO, shoeCabPal],
  'shoeCabinet.open': [FURSHOE_IN, shoeCabPal],
  'shoeCabinet.door': [DOOR, shoeCabPal],
  drawerFront: [KDRAWER, counterPal],
  'drawerFront.open': [KDRAWER_OPEN, counterPal],
  riceSack: [RICE_SACK, ricePal],
  ribbon: [RIBBON, ribbonPal],
  apron: [APRON, apronPal],
  'jewelBox.lid': [JEWEL_LID, jewelPal],
  'jewelBox.open': [JEWEL_OPEN, jewelPal],
  'jewelBox.pin': [JEWEL_PIN, jewelPal],
  'jewelBox.lock': [JEWEL_LOCK, jewelPal],
  dryRack: [DRY_RACK, dryPal],
  'dryRack.leg': [DRY_LEG, dryPal],
  shoePair: [SHOE, shoePal('#e8e4d8')],
  'shoePair.stripe': [SHOE_STRIPE, shoePal('#e8e4d8')],
  'shoePair.fur': [SHOE_FUR, shoePal('#a07858')],
  'ceilLamp.cord': [LAMP_CORD, lampPal],
  ceilLamp: [LAMP, lampPal],
  duck: [DUCK, duckPal],
  towelPile: [TOWELS, towelPal],
  gourd: [GOURD, gourdPal],
  perfume: [PERFUME, perfumePal],
  tileFloor: [TILE_FLOOR, tilePal],
  honeyJar: [HONEY_JAR, honeyPal],
  'honeyJar.lid': [HONEY_LID, honeyPal],
  'honeyJar.open': [HONEY_OPEN, honeyPal],
  candyRed: [CANDY, candyPal],
  bowlStack: [BOWL, bowlPal],
  'bowlStack.rabbit': [BOWL_RABBIT, bowlPal],
  shelfBoard: [SHELF_BOARD, shelfPal],
  'bedMom.head': [MOM_HEAD, momPal],
  'bedMom.pillow': [MOM_PILLOW, momPal],
  'bedMom.face': [MOM_FACE, momPal],
  'bedMom.quilt': [MOM_QUILT, momPal],
  'bedMom.body': [MOM_BODY, momPal],
  'bedMom.hand': [MOM_HAND, momPal],
  'surfaceTop.cloth': [TOP_CLOTH, surfacePal('#e8d8d8')],
  'surfaceTop.marble': [TOP_MARBLE, surfacePal('#dfe4e8')],
  'surfaceTop.wood': [TOP_WOOD, surfacePal('#d8b890')],
  'surfaceTop.rim': [TOP_RIM, surfacePal('#d8b890')],
  'surfaceFront.cloth': [CLOTH_FRONT, clothFrontPal],
  'surfaceFront.leg': [TABLE_LEG, clothFrontPal],
  'surfaceFront.stair': [STAIR, shelfPal],
  vanityMirror: [VANITY, vanityPal],
  'vanityMirror.glint': [VANITY_GLINT, vanityPal],
  'vanityMirror.ticket': [VANITY_TICKET, vanityPal],
  'vanityMirror.photo': [VANITY_PHOTO, vanityPal],
};
