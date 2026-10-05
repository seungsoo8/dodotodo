/**
 * 갈래 B 소품 (복도 · 할머니 방 · 이불장 · 거실) 손찍기 격자. 글자는 chapkit.ts 공용 자리 (C A W S F B G N 재질 · 숫자 포인트).
 */
import { pal } from './chapkit.ts';
import type { Grid, Palette } from './grid.ts';

/** 흰 천 덮개 (9-조각: 왼 4 · 오른 4 · 위 6 · 아래 4, 가운데 줄에 세로 주름) */
export const SHEET: Grid = [
  '....PPPPPPPPPPPP....',
  '..PPZZPPPPPPPPPPPP..',
  '.PZZPP1PPPPPPPPPPPf.',
  'PZPPPPPPPPPPPP1PPPff',
  'PPFFFFFFFFFFFFFFFFff',
  'PFFFFFFFFFFFFFFFFfff',
  'PFFFFFFPFFfFFFFFFfff',
  'PFFFFFFPFFfFFFFFFfff',
  'PFFFFFFPFFFfFFFFFfff',
  'PFFFFFFFPFfFFFFFFfff',
  'PFFFFFFFPFfFFFFFFfff',
  'fFFfFFFFFFffFFFfFfpp',
  'pfffppfffFfpffffpfpp',
  '.pp..ppp..pp.ppp.pp.',
];
/** 걷힌 천: 발치에 뭉친 주름 더미와 바닥에 늘어진 자락 */
export const SHEET_OFF: Grid = [
  '.....PPPP...................',
  '...PPZZPPPf.................',
  '..PZPPPPFFff................',
  '.PPPPFFfffFFf...............',
  'PZPPFffPPPfFff..............',
  'PPFFfPPPPFFFFfff............',
  'PFFFFFFFFFFffFFfff..........',
  'fFFffFFFFFFFFFFFffPPPPPPPP..',
  'pfFFFFFFFfffFFFFFFfffFFFFfp.',
  '.pfffffffffffffffffffffffpp.',
  '..ppppppppppppppppppppppp...',
];
export const sheetPal: Palette = pal({ F: '#e6dece', 1: '#b8ae9c' });

/** 개어 쌓은 이불 한 단 (가로 늘이기: 왼 2 · 오른 4, C 자리를 단마다 다른 재질로 바꿔 칠한다) */
export const QUILT_TIER: Grid = [
  'LLLLLLLLLLLLLLcc',
  'CCCCCCCCCCCCCCcc',
  'CCCCCLCCCCCCCCcc',
  'CCCCLOLCCCCCCCcc',
  'CCCCCLCCCCCCCCcc',
  'cCCCCCCCCCCCCCck',
  'kkkkkkkkkkkkkkkk',
];
/** 맨 위 단의 윗면 */
export const QUILT_TOP: Grid = [
  '.LLLLLLLLLc.',
  'LOOLLLLLLLcc',
  'LLLLLLLLLLcc',
  'LLLLLLLLLLcc',
];
/** 귀퉁이에 꿰맨 작은 주머니 (1 빨간 땀) */
export const QUILT_POUCH: Grid = [
  'PPPPPPPf',
  'PZZPPPFf',
  'PP1PPPFf',
  'PPPPPPFf',
  'PPPPPPFf',
  'ffffffff',
  '1.1.1.1.',
];
export const quiltPal: Palette = pal({ C: '#d88a9a', A: '#8ab0c8', B: '#e8d08a', G: '#a8c890', N: '#c8a0d0', F: '#f0e0c0', 1: '#c8483c' });

/** 먼지 위 동그란 빈 자국 하나 (1 뽀얀 먼지 · 2 진한 테두리) */
export const DUST_RING: Grid = [
  '..1.11111.1111.11.....',
  '.11133111111111331.1..',
  '1111112222222211111...',
  '11112.........211111..',
  '1112...........21111.1',
  '1112...........21111..',
  '1112...........2111111',
  '.1112.........21111...',
  '111112222222221111111.',
  '..1111111111111111..1.',
  '...11.1111.111..11....',
];
/** 넷: 작은 자국 넷 (의자 다리 자리) */
export const DUST_RING4: Grid = [
  '.1.11111.11111.1.....',
  '11122211112221133....',
  '1112...2112...211....',
  '111222111122211111...',
  '.1111111111111111.1..',
  '11.1111111111111111..',
  '1111222111111222111..',
  '1112...21111112...211',
  '11112221111111122211.',
  '..1111111.1111111.1..',
];
export const dustRingPal: Palette = pal({ 1: '#cfc4b4', 2: '#a89c8c', 3: '#ddd4c6' });

/** 배터리 뺀 낡은 손전등 (1 렌즈 · 2 스위치 · 3 열린 건전지 뚜껑) */
export const FLASH_B: Grid = [
  '..............SSSS..',
  '...LLLLLLLLLLLSIIs1.',
  '..cLOOOLLLLLLLSTTs1.',
  'cccCCC22CCCCCCSTTs1.',
  'cccCCC22CCCCCCSTTs1.',
  '.cckcccccccccCSsss1.',
  '..kkkkkkkkkkkkSsss..',
  '33c...........ssss..',
  '33................. ',
];
export const flashBPal: Palette = pal({ C: '#c84a4a', S: '#b8b8c0', 1: '#e8e0b8', 2: '#e8c048', 3: '#a83a3a' });

/** 야광 별: 연둣빛 오각 별 (1 별 · 2 밝은 가운데 · 3 그늘) */
export const GLOW_BIG: Grid = [
  '.....1.....',
  '....111....',
  '....121....',
  '11111211111',
  '.111222113.',
  '..1112113..',
  '..1113113..',
  '.1113.3113.',
  '.113...313.',
  '.13.....33.',
];
export const GLOW_SMALL: Grid = ['..1..', '.121.', '11211', '.131.', '13.31'];
export const glowPal: Palette = pal({ 1: '#c8f088', 2: '#f0ffd0', 3: '#90c060' });

/** 김 서린 유리 조각 (액자 틀) · 손가락 글씨 (F 뽀얀 유리 · 1 글씨 자국) */
export const FOG_PANE: Grid = [
  'VVVVVVVVVVVVVVVVVVw',
  'VYYYYYYYYYYYYYYYYww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFPPPFFFFFFFFFFWww',
  'VYFPFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYF111111F1FFFFFWww',
  'VYFFFFFFFFF1FFFFWww',
  'VYFFFFFFFFFF1FFFWww',
  'VYFFFFFFFFFFF1FFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYF111111111FFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFF1F1FFFFFFWww',
  'VYFFFF1F1F1FFFFFWww',
  'VYFFFFF1F1FFFFFFWww',
  'VYFFFFFF1FFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFPFWww',
  'VYFFFFFFFFFFFPFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VYFFFFFFFFFFFFFFWww',
  'VWWWWWWWWWWWWWWWWww',
  'wwwwwwwwwwwwwwwwwwv',
  'vvvvvvvvvvvvvvvvvvv',
];
export const fogPal: Palette = pal({ W: '#965e3c', F: '#c4d0da', 1: '#7a8a9a' });

/** 꼬인 전화선 매듭: 고리 셋 (F 선 · f 그늘) */
export const CORD_KNOT: Grid = [
  '.....PPP..PPP..PPP.....',
  '....P...PP...PP...P....',
  'FFFF.....f....f....FFFF',
  '....f...fF...Ff...f....',
  '.....fff..fff..fff.....',
];
/** 위로 넘기 · 밑으로 화살 (1) */
export const ARROW_UP: Grid = ['...1...', '..111..', '.1.1.1.', '1..1..1', '...1...', '...1...'];
export const ARROW_DOWN: Grid = ['...1...', '...1...', '1..1..1', '.1.1.1.', '..111..', '...1...'];
export const cordPal: Palette = pal({ F: '#e8e0c8', 1: '#e8a048' });

/** 꼬불꼬불 전화선 한 칸 (가로로 이어 붙는 타일, 세로는 눕혀 쓴다) */
export const PHONE_CORD: Grid = [
  '.P...P...P...P...P...P..',
  'P.F.P.F.P.F.P.F.P.F.P.F.',
  '...f...f...f...f...f...f',
];
export const phonePal: Palette = pal({ F: '#ddd4bc' });

/** 병원 면회증 목걸이: 늘어진 줄 + 카드 (1 하늘 띠 · 2 이름 글씨) */
export const VISITOR_PASS: Grid = [
  '....AAAAAAAAA....',
  '..AA.........aa..',
  '.A.............a.',
  'A...............a',
  'A...............a',
  'A...MMMMMMMMMm..a',
  '.A..M11111111m.a.',
  '..aaM11111111maa.',
  '....MPPPPPPPPm...',
  '....MP222222Pm...',
  '....MPPPPPPPPm...',
  '....MP2222PPPm...',
  '....MPPPPPPPPm...',
  '....mmmmmmmmmm...',
];
export const passPal: Palette = pal({ A: '#5a8ac8', M: '#f8f4ec', m: '#c8c0b0', F: '#f0ece0', 1: '#6aa8d8', 2: '#7a7068' });

/** 고무줄로 묶은 색종이 표 (C A B G 네 장 · 1 고무줄) */
export const TICKETS: Grid = [
  '.......1..........',
  '...HHHH1HHHHHHH...',
  '...GGGG1GGGGGGGg..',
  '..RRBBB1BBBBBBBbg.',
  '..BBBBB1BBBBBBBbg.',
  '.MMAAAA1AAAAAAAabg',
  '.AAaAAA1AAAAAAAabg',
  'LLCCCCC1CCCCCCCcab',
  'CCCcCCC1CCCCCCCcab',
  'CCCCCCC1CCCCCCCcab',
  'CCCCCCC1CCCCCCCca.',
  'CCCCCCC1CCCCCCCc..',
  'ccccccc1ccccccck..',
  '.kkkkkkkkkkkkkk...',
];
export const ticketPal: Palette = pal({ C: '#e8a0b8', A: '#a8c8e8', B: '#f0d888', G: '#b8e0a8', 1: '#c8483c' });

export const PX_B: Record<string, [Grid, Palette]> = {
  sheet: [SHEET, sheetPal],
  'sheet.off': [SHEET_OFF, sheetPal],
  'quilts.tier': [QUILT_TIER, quiltPal],
  'quilts.top': [QUILT_TOP, quiltPal],
  'quilts.pouch': [QUILT_POUCH, quiltPal],
  dustRing: [DUST_RING, dustRingPal],
  'dustRing.four': [DUST_RING4, dustRingPal],
  flashlight: [FLASH_B, flashBPal],
  glowStar: [GLOW_BIG, glowPal],
  'glowStar.small': [GLOW_SMALL, glowPal],
  fogPane: [FOG_PANE, fogPal],
  cordKnot: [CORD_KNOT, cordPal],
  'cordKnot.up': [ARROW_UP, cordPal],
  'cordKnot.down': [ARROW_DOWN, cordPal],
  phoneCord: [PHONE_CORD, phonePal],
  visitorPass: [VISITOR_PASS, passPal],
  tickets: [TICKETS, ticketPal],
};
