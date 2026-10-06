/**
 * 갈래 D 소품 (13장 베란다 · 15장 마당 · 16장 골목 · 14장 소파 밑) 손찍기 격자.
 * 글자는 chapkit.ts 공용 자리 (C A W S F B G N 재질 · 숫자 포인트). 길이가 바뀌는 것(처마 · 빨랫줄 · 전깃줄 · 소파 안감)은
 * 끝 조각과 가운데 되풀이 조각으로 나눠 적는다.
 */
import { pal, rep } from './chapkit.ts';
import type { Grid, Palette } from './grid.ts';

// ───────────────────────── 13장 베란다 ─────────────────────────

/** 밤하늘 타일 (위에서 아래로 짙음 → 옅음, 32×44 되풀이: 1 2 3 4 하늘 띠 · 5 별 · 6 노란 별) */
export const NIGHT_SKY: Grid = [
  ...rep('11111111111111111111111111111111', 3),
  '11111111111111111111115111111111',
  ...rep('11111111111111111111111111111111', 4),
  '11111611111111111111111111111111',
  ...rep('11111111111111111111111111111111', 3),
  ...rep('22222222222222222222222222222222', 4),
  '22222222222222252222222222222222',
  ...rep('22222222222222222222222222222222', 5),
  '22222222222222222222222222225222',
  ...rep('33333333333333333333333333333333', 3),
  '33335333333333333333333333333333',
  ...rep('33333333333333333333333333333333', 6),
  ...rep('44444444444444444444444444444444', 11),
];
/** 이웃집 지붕 실루엣 (30 폭 되풀이, 9 지붕 · 7 불 켜진 창) */
export const ROOFS: Grid = [
  '..............99..............',
  '............999999............',
  '..........9999999999..........',
  '........99999999999999........',
  '......999999999999999999......',
  '....9999999999999999999999....',
  '..99999999999977999999999999..',
  '9999999999999977999999999999999'.slice(0, 30),
  '999999999999999999999999999999',
  '999999999999999999999999999999',
];
/** 전깃줄 (왼쪽 내려감 · 가운데 · 오른쪽 올라감: 가로 늘이기 20·20) */
export const SKY_WIRE: Grid = [
  '888.................................888',
  '...8888.........................8888...',
  '.......88888...............88888.......',
  '............888888888888888............',
].map((r) => r.padEnd(40, '.').slice(0, 40));
/** 창틀 (9-조각 2·2·2·0) · 가운데 창살 · 유리 반사 줄 */
export const WIN_FRAME: Grid = ['PPPPPP', 'ZZZZZf', 'Pf..Pf'];
export const WIN_BAR: Grid = ['Pf'];
export const WIN_GLINT: Grid = ['.....0', '....0.', '....0.', '...0..', '..0...', '..0...', '.0....', '0.....'];
/** 열린 창: 비켜 겹친 유리 틀 · 날리는 커튼 끈 */
export const WIN_SLID: Grid = ['PfPf'];
export const CURTAIN_STRING: Grid = ['.F', 'F.', 'F.', '.F', '.F', 'F.', 'F.', '.F'];
/** 창턱 (가로 늘이기) · 베란다 벽 + 난간 살 (가로 6 되풀이, 세로 늘이기) */
export const SILL: Grid = ['ZZZZZZ', 'PPPPPP', 'PPPPPP', 'ffffff'];
export const BAL_WALL: Grid = [
  'AAAAAA',
  'aaaaaa',
  'MMAAAA',
  'MaAAAA',
  'MaAAAA',
  'MaAAAA',
  'maAAAA',
  'mmmmmm',
];
export const balconyPal: Palette = pal({
  F: '#d8d0c0', A: '#ddd2bc', 1: '#1e2650', 2: '#262e5c', 3: '#323a6c', 4: '#3e4480', 5: '#d8e0ff', 6: '#fff4c0',
  9: '#262040', 7: '#f8d890', 8: '#3a3050', 0: '#6a70a8',
});

/** 드럼 세탁기: 조작판 (1 초록 불 · 2 주황 불) · 동그란 문 (S 테 · B 유리 · X 반짝) */
export const WASH_PANEL: Grid = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTs',
  'SSSSSSSSSSSSSSSSSSSSSSSSS1S2SSSSs',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs',
  'sssssssssssssssssssssssssssssssss',
];
export const WASH_DOOR: Grid = [
  '......TTTTTTTT......',
  '....TTSSSSSSSSss....',
  '...TSSbbbbbbbbSSs...',
  '..TSbbBBBBBBBBbbSs..',
  '.TSbBBRRXBBBBBBbSss.',
  '.TSbBRXXBBBBBBBbSsI.',
  'TSbBBRRBBBBBBBBBbSsI',
  'TSbBBBBBBBBBBBBBbSsI',
  'TSbBBBBBBBBBBBBBbSsI',
  'TSbBBBBBBBBBBBBBbSs.',
  'TSbBBBBBBBBBBBBrbSs.',
  '.TSbBBBBBBBBBBrbSs..',
  '.TSbbBBBBBBBBrbSss..',
  '..TSbbbBBBBrrbSs....',
  '...sSSbbbbbbSSs.....',
  '....ssSSSSSSss......',
  '......ssssss........',
];
export const washerPal: Palette = pal({ F: '#e8e8e0', S: '#b8bcc4', B: '#4a5a78', 1: '#7ad07a', 2: '#e8a848', I: '#d8dce4' });

/** 빨래집게 통 (C 통 · 집게 1 2 3 4) */
export const PEG_TUB: Grid = [
  '..1.2..3.4.1..',
  '..1.2.33.4.1..',
  '.L1L2L3LL4L1c.',
  'LOkkkkkkkkkkcc',
  'LLLLLLLLLLLLcc',
  '.CCCCCCCCCCcc.',
  '.CCCCCCCCCCcc.',
  '.ccccccccccck.',
  '..CCCCCCCCcc..',
  '..CCCCCCCCcc..',
  '..cccccccccc..',
  '...kkkkkkkk...',
];
export const pegPal: Palette = pal({ C: '#7ab0d8', 1: '#e88a98', 2: '#f0c848', 3: '#8ad08a', 4: '#a88ad0' });

/** 벽 수도꼭지 (1 빨간 손잡이) · 초록 호스 고리 (G) · 주황 양동이 (C) */
export const TAP_WALL: Grid = [
  '.11.......',
  '1111SSSSs.',
  '.11TSSSSSs',
  '......SSs.',
  '......Ss..',
];
export const HOSE: Grid = [
  '....HHHHHH....',
  '..HHg....gHH..',
  '.Hg........gH.',
  'Hg..........gH',
  'Hg..........gg',
  '.Hg........gg.',
  '..HHg....ggg..',
  '....gggggg....',
];
export const BUCKET: Grid = [
  '.kkkkkkkkkkkkk.',
  'kWWWWWWWWWWWWWk',
  'LLLLLLLLLLLLLcc',
  'LOCCCCCCCCCCccc',
  '.LCCCCCCCCCCcc.',
  '.LCCCCCCCCCCcc.',
  '.LCCCCCCCCCccc.',
  '.cCCCCCCCCCccc.',
  '..CCCCCCCCCcc..',
  '..CCCCCCCCCcc..',
  '..cccccccccck..',
  '...kkkkkkkkk...',
];
/** 마당 수돗가: 시멘트 받침 위 쇠 관 · 꼭지 · 물방울 (2) */
export const TAP_YARD: Grid = [
  '..TSSSSSSs',
  '..TSSSSSSs',
  '..TSs..TSs',
  '..TSs..TSs',
  '..TSs...2.',
  '..TSs.....',
  '..TSs...2.',
  '..TSs.....',
  ...rep('..TSs.....', 14),
];
export const faucetPal: Palette = pal({ A: '#a8a49c', S: '#a8b0b8', G: '#5aa060', C: '#e88a5a', W: '#8a5a3a', 1: '#c8483c', 2: '#bfe0ff' });

/** 쓰레받기 (C) + 먼지 (1) */
export const DUSTPAN: Grid = [
  'LLLLLLLLLLLL.......',
  'LOCCCCCCCCCc.......',
  'LC1CCCCCCCCc.......',
  'LCCCCC1CCCCcccccccc',
  'LCCC1CCCCCCckkkkkkk',
  'LCCCCCCCCCCc.......',
  'LCCCCCCCCCCc.......',
  'kkkkkkkkkkkk.......',
];
export const dustpanPal: Palette = pal({ C: '#d86a5a', 1: '#c8b8a0' });

/** 분홍 고무장갑 한 켤레 (납작) */
export const GLOVES: Grid = [
  '.M.M.M...............',
  '.A.A.AM..............',
  '.AMA.AA..............',
  'MAAAAAA..............',
  'MAAAAAAa.............',
  'MAAAAAAaMMMMMMMMMAAa.',
  'MAAAAAAaAAAAAAAAAAAAa',
  'aaaaaaaaAAAAAAAAAaaa.',
  '........AAAAAAAAAAAAa',
  '........aaaaaaaaAaaa.',
  '.................aa..',
];
export const glovePal: Palette = pal({ A: '#f0a0b8' });

/** 빨래 (윗층): 빨랫줄 기둥 (S) · 처진 줄 (F, 72 폭, 가로 늘이기 30·30) · 셔츠 · 양말 · 수건 · 집게 (1 노랑 · 2 분홍) */
export const LAUNDRY_LINE: Grid = [
  'FFF...................................................................FF',
  '...FFFF............................................................FFF..',
  '.......FFFFFF..................................................FFFF.....',
  '.............FFFFFFFFF...................................FFFFFF.........',
  '......................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...............',
].map((r) => r.padEnd(72, '.').slice(0, 72));
export const LAUNDRY_POST: Grid = ['IS', 'TS', 'TS', 'Ss'];
export const SHIRT: Grid = [
  '.1L.....2L..',
  'LLLLLLLLLLLc',
  'LOLLLLLLLLcc',
  'LLLLLLLLLLcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  '.LCCCCCCCcc.',
  '.LCCCCCCCcc.',
  '.LCCCCCCCcc.',
  '.LCCCCCCCcc.',
  '.LCCCCCCCcc.',
  '.LCCCCCCCcc.',
  '.LCCCCCCCcc.',
  '.cCCCCCCCcc.',
  '.c.c.c.c.c..',
];
export const SOCKS: Grid = [
  '1M.',
  'MMa',
  'MAa',
  'MAa',
  'MAa',
  'MAa',
  'MAAa',
  'MAAa',
  'aaa.',
].map((r) => r.padEnd(5, '.'));
export const TOWEL_HANG: Grid = [
  '.1RR.....2R.',
  'RRRRRRRRRRRb',
  'RXRRRRRRRRbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'PPPPPPPPPPPf',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'RBBBBBBBBBbb',
  'bbbbbbbbbbbb',
  'b.b.b.b.b.b.',
];
/** 수건걸이에 걸친 큰 수건 (towel): 다리 둘 · 가로대 · 줄무늬 수건 (가로 늘이기 3·3) */
export const TOWEL_RACK: Grid = [
  '...............',
  '..TSSSSSSSSSs..',
  '..GGGGGGGGGGG..',
  '..GQGHGHGHGHG..',
  '..GGHGHGHGHGG..',
  ...rep('..GGHGHGHGHGG..', 15),
  '..PPPPPPPPPPP..',
  '..ZZZZZZZZZZZ..',
  '..GGHGHGHGHGG..',
  '..gGgGgGgGgGg..',
  '..T.........S..',
  ...rep('..T.........S..', 10),
  '..s.........s..',
];
export const laundryPal: Palette = pal({
  S: '#a8b0b8', F: '#d8d0c0', C: '#8ab0d8', A: '#f0c8a0', B: '#e88a98', G: '#7ab8c8', 1: '#f0c848', 2: '#e88a98',
  L: '#e8e4f4', O: '#f8f4fc', c: '#b8b4c8', k: '#8a86a0',
});

/** 서 있는 빨래 건조대: X 다리 (S) · 가로대 · 널린 빨래 넷 (C A B G) · 집게 (1 2) */
export const RACK_LEGS: Grid = [
  'TTTTTTTTTTTTTTs',
  'TS.........TS..',
  '.TS.......TS...',
  '..TS.....TS....',
  '...TS...TS.....',
  '....TS.TS......',
  '.....TSS.......',
  '.....STS.......',
  '....TS.TS......',
  '...TS...TS.....',
  '..TS.....TS....',
  '.TS.......TS...',
  'TS.........TS..',
  'ss..........ss.',
].map((r) => r.padEnd(15, '.'));
/** 다리 위 곧은 기둥 (세로 늘이기) */
export const RACK_POST: Grid = ['.....TSS.......'];
export const RACK_BAR: Grid = ['IIIIIIII', 'TTTTTTTT', '........', '........', '........', 'ssssssss'];
export const RACK_CLOTH: Grid = [
  '.1..........',
  'LLLLLLLLLLLc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'LCCCCCCCCCcc',
  'cccccccccccc',
];
export const dryingPal: Palette = pal({ S: '#c8ccd0', C: '#f0e8e0', A: '#8ab0d8', B: '#f8d888', G: '#d8a0c8', 1: '#f0c848', 2: '#e88a98' });

/** 「하루 꽃」 화분: 토분 (C) · 흙 (W) · 시든 줄기 (A) / 고개 든 꽃 (G 잎 · 1 노란 꽃잎 · 2 가운데) */
export const POT: Grid = [
  'LLLLLLLLLLLLLLc',
  'cvvvvvvvvvvvvvk',
  '.LLLLLLLLLLLcc.',
  '.LOLLLLLLLLLcc.',
  '.LCCCCCCCCCCcc.',
  '..CCCCCCCCCcc..',
  '..CCCCCCCCCcc..',
  '..CCCCCCCCCcc..',
  '..cCCCCCCCCcc..',
  '...CCCCCCCcc...',
  '...ccccccccc...',
  '....kkkkkkk....',
];
export const WILT: Grid = [
  '....MMM...',
  '...MAAAa..',
  '...MA..Aa.',
  '..MA....Aa',
  '..A......A',
  '.A.......M',
  'MA.......a',
  'A........m',
  'A.........',
  'A.........',
];
export const BLOOM: Grid = [
  '....111....',
  '..1111111..',
  '.111222111.',
  '.112222211.',
  '.111222111.',
  '..1111111..',
  '....1G1....',
  'HH...G.....',
  '.HGG.G..HH.',
  '..ggGG.GGg.',
  '.....G.gg..',
  '.....G.....',
  '.....G.....',
  '.....G.....',
  '.....G.....',
];
export const flowerPal: Palette = pal({ C: '#c8704a', W: '#5a3a28', A: '#a89058', G: '#5a8a48', 1: '#f0c848', 2: '#e88a3a' });

/** 접이식 의자 (C 천 · S 다리) */
export const CHAIR_FOLD: Grid = [
  '.TTTTTTTTTTTs.',
  '.TLLLLLLLLLLs.',
  '.TLOLLLLLLLCs.',
  '.TLCCCCCCCCCs.',
  '.TLCCCCCCCCCs.',
  '.TLCCCCCCCCCs.',
  '.TLCCCCCCCCCs.',
  '.TLCCCCCCCCCs.',
  '.TLCCCCCCCCCs.',
  '.TLCCCCCCCCCs.',
  '.TcccccccccCs.',
  '.TkkkkkkkkkCs.',
  '.TS........Ts.',
  '.TS........Ts.',
  '.TS........Ts.',
  'LLLLLLLLLLLLLc',
  'LOLLLLLLLLLLcc',
  'cccccccccccccc',
  '.kTSkkkkkTSkk.',
  '...TS...TS....',
  '....TS.TS.....',
  '.....TTS......',
  '.....TTS......',
  '....TS.TS.....',
  '...TS...TS....',
  '..TS.....TS...',
  '.TS.......TS..',
  'ss.........ss.',
];
export const chairFoldPal: Palette = pal({ C: '#6a9ac0', S: '#a8b0b8' });

/** 이름표 막대 (F 판 · W 막대 · 1 노란 꽃 스티커), 글씨 「하루」는 글씨 격자로 위에 찍는다 */
export const NAME_STICK: Grid = [
  'PPPPPPPPPPPPPPPPPf',
  'PZZPPPPPPPPPPPPPff',
  'PFFFFFFFFFFFFFFFff',
  ...rep('PFFFFFFFFFFFFFFFff', 8),
  'PFFFFFFFFFFFFFF1ff',
  'ffffffffffffffffff',
  '........Ww........',
  ...rep('........Ww........', 13),
  '........vv........',
];
export const namePal: Palette = pal({ F: '#f0e2c0', W: '#7a4e2c', 1: '#f0c848', 9: '#6a3a2a' });

/** 까치 깃털 (흰 · 검정 · 푸른 끝) */
export const FEATHER: Grid = [
  '..............33.',
  '............2233.',
  '..........112223.',
  '........11112222.',
  '......FF11112222.',
  '.....PFFF1112...',
  '....PFFFFF11.....',
  '...PFFFFF........',
  '..PFFFF..........',
  '.PFF.............',
  'P................',
].map((r) => r.padEnd(17, '.'));
export const featherPal: Palette = pal({ F: '#f0ece4', 1: '#2e2a38', 2: '#3a4a88', 3: '#6a8ad8' });

/** 놀이공원 여우 그림 비닐봉지 (F 비닐 · 손잡이 · C 여우 · e 눈코) */
export const FOX_BAG: Grid = [
  '...PP....PP.....',
  '..P..P..P..P....',
  '..P..P..P..P....',
  '.P....PP....P...',
  'PPPPPPPPPPPPPPf.',
  'PZZPPPPPPPPPPff.',
  'PFFCFFFFFFCFFff.',
  'PFFCCFFFFCCFFff.',
  'PFFCCCCCCCCFFff.',
  'PFFCeCCCCeCFFff.',
  'PFFCCCCCCCCFFff.',
  'PFFFCCCCCCFFFff.',
  'PFFFFCCeCFFFFff.',
  'PFFFFFCCFFFFFff.',
  'PFFFFFFFFFFFFff.',
  'fffffffffffffff.',
  'f.f.f.f.f.f.f.f.',
];
export const foxPal: Palette = pal({ F: '#f0ece4', C: '#e8843a', e: '#2a1c24' });

/** 모종삽 (S 날 · W 손잡이) */
export const TROWEL: Grid = [
  '.......TTT...........',
  '....TTTSSSs..........',
  '.TTSSSSSSSsWWWWWWWv..',
  'TSSSSSSSSsSWYYVWWWwv.',
  '.ssSSSSSSsSWWWWWWWwv.',
  '....sssSSs.wwwwwwwv..',
  '.......sss...........',
];
export const trowelPal: Palette = pal({ S: '#a8b0b8', W: '#b07a48' });

/** 작은 노란 물뿌리개 (C) · 물 (1) */
export const WATERCAN: Grid = [
  '..kkkkk..........ccc',
  '.k.....k........cCCc',
  'k.......k......cCc..',
  'k.LLLLLLLc....cCc...',
  '.LOLLLLLLcc..cCc....',
  '.LLLLLLLLccccCc.....',
  '.LCCCCCCCccCCc......',
  '.LCCCCCCCcccc.......',
  '.L1111111cc.........',
  '.L1111111cc.........',
  '.LCCCCCCCcc.........',
  '.LCCCCCCCcc.........',
  '.cccccccccc.........',
  '..kkkkkkkk..........',
];
export const canPal: Palette = pal({ C: '#f0c848', 1: '#8ac0e8' });

// ───────────────────────── 15장 마당 ─────────────────────────

/** 처마 끝 (윗층): 기와 줄 (8 폭 되풀이) · 동그란 막새 · 낙숫물 (1 2) */
export const EAVES: Grid = [
  'XXXXXXXX',
  'RRRRRRRb',
  'BBBBBBBb',
  'BBBBBBBb',
  'BBBBBBBb',
  'BBBBBBBb',
  'BBBBBBBb',
  'BBBBBBBb',
  'BBBBBBBb',
  'BBBBBBBb',
  'bRRRRRRr',
  'RXRRRRbr',
  'RRRRRRbr',
  'bRRRRbr.',
  '.rrrrr..',
];
export const EAVES_DRIP: Grid = ['...1.......', '...1.......', '...2.......'];
export const eavesPal: Palette = pal({ B: '#4a4040', 1: '#a8c8e8', 2: '#d8ecff' });

/** 홈통 (세로 늘이기 2·4) */
export const DOWNSPOUT: Grid = [
  '..ITSSss..',
  '..ITSSss..',
  '..ITSSss..',
  '..ITSSss..',
  '.ITTSSsst.',
  'ITTSSSssst',
  'sssssssstt',
  '...111....',
];
export const spoutPal: Palette = pal({ S: '#8a8a80', 1: '#a8c8e8' });

/** 노란 장화 한 켤레 */
export const BOOT: Grid = [
  'LLLLLLc...',
  'LOLLLLcc..',
  'LOCCCCcc..',
  'LOCCCCcc..',
  'LOCCCCcc..',
  'LOCCCCcc..',
  'LOCCCCcc..',
  'LOCCCCcc..',
  'LOCCCCcc..',
  'LCCCCCcc..',
  'LCCCCCCcc.',
  'LCCCCCCCcc',
  'LCCCCCCCcc',
  'LCCCCCCCcc',
  'kkkkkkkkkk',
];
export const bootPal: Palette = pal({ C: '#f0c030' });

/** 댓돌 위 하얀 고무신 */
export const RUBBER_SHOE: Grid = ['.PPPPP.', 'PFkkkFf', '.fffff.'];
export const daetPal: Palette = pal({ W: '#9a968c', F: '#e8e8e0', k: '#8a8a84' });

/** 빨간 고무 대야 (위에서, C 테 · k 안쪽) */
export const TUB: Grid = [
  '.......LLLLLLLL.......',
  '....LLLOOLLLLLLLLc....',
  '..LLOLLccccccccLLLcc..',
  '.LOLLcckkkkkkkkcccLcc.',
  '.LLLckkkkkkkkkkkkcCcc.',
  'LLLckkkkkkkkkkkkkkcCcc',
  'LLckkkkkkkkkkkkkkkkCcc',
  'LLckkkkkkkkkkkkkkkkCcc',
  'LLckkkkkkkkkkkkkkkkCcc',
  'LLLckkkkkkkkkkkkkkcCcc',
  '.LLCcckkkkkkkkkkccCcc.',
  '.cLLCCcccccccccCCCcck.',
  '..ccLLCCCCCCCCCCccck..',
  '....ccccccccccccckk...',
  '.......kkkkkkkk.......',
];
export const tubPal: Palette = pal({ C: '#c84a3a' });

/** 빨랫줄 (윗층): 기둥 (W) · 처진 줄 (F, 가로 늘이기) · 빈 집게 (1 분홍 · 2 하늘) */
export const LINE_POST: Grid = ['VWw', 'VWw', 'VWw', 'VWw', 'VWw', 'wwv'];
export const CLOTHESLINE: Grid = [
  'FF..........................................................................FF',
  '..FFFF..................................................................FFFF..',
  '......FFFF..............................................................FFFF......'.slice(0, 78),
  '..........FFFFF.....................................................FFFF..........'.slice(0, 78),
  '...............FFFFFF.........................................FFFFFF.............'.slice(0, 78),
  '.....................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..................'.slice(0, 78),
].map((r) => r.padEnd(78, '.').slice(0, 78));
export const PIN: Grid = ['11', '1M', '11', '11', 'mm'];
export const PIN2: Grid = ['22', '2Z', '22', '22', '33'];
export const linePal: Palette = pal({ W: '#7a4e2c', F: '#d8d0c0', 1: '#e88a98', M: '#f8c8d0', m: '#b86070', 2: '#9ad0f0', Z: '#d8f0ff', 3: '#5a90b8' });

/** 달팽이 (W 껍데기 · F 몸) */
export const SNAIL: Grid = [
  '....VVVV.....',
  '..VYWWWWv....',
  '.VWwvvvWWv...',
  '.VWvVWWvWv...',
  '.VWvWvWvWv.F.',
  '.VWWvvvWWvFF.',
  '..vWWWWWvFFF.',
  'PPPPPPPPPPPFf',
  'ffffffffffffp',
];
export const snailPal: Palette = pal({ W: '#a87a48', F: '#b8a888' });

/** 노란 비옷 단추 (네 구멍) */
export const RAIN_BUTTON: Grid = [
  '...LLLLLL...',
  '.LLOOLLLLLc.',
  'LLOLLLLLLLcc',
  'LLLLccccLLcc',
  'LLLckLLkcLcc',
  'LLLcLLLLcCcc',
  'LLLckLLkcCcc',
  'LLLLccccCCcc',
  'cLLLLLLCCCck',
  '.cCCCCCCCck.',
  '...kkkkkk...',
];
export const rainBtnPal: Palette = pal({ C: '#f0c848' });

/** 덤불 밑 하얀 솜 한 줌 (토비 털) */
export const COTTON_D: Grid = [
  '......PPP.....',
  '..PPPPZZPPP...',
  '.PZZPPPPPPFPf.',
  'PZPPPFPPPPPFFf',
  'PPPPFFFPPPPFFf',
  'fPPFFfFFPPFFff',
  '.ffFFffffFFff.',
  '...ffff.pfff..',
];
export const cottonDPal: Palette = pal({ F: '#e0ddd4' });

/** 하늘색 빨래집게 (용수철 S) */
export const CLOTHESPIN: Grid = [
  '.Z..Z.',
  'MMaMMa',
  'MAaMAa',
  'MAaMAa',
  'MAaMAa',
  'MAaMAa',
  'TSSSSs',
  'sssssst'.slice(0, 6),
  'MAaMAa',
  'MAaMAa',
  'MAaMAa',
  'MAaMAa',
  'MAaMAa',
  'aaamam',
  '.m..m.',
];
export const pinPal: Palette = pal({ A: '#9ad0f0', S: '#a8b0b8', Z: '#f0e8e0' });

/** 흔들리는 돌 */
export const STONE: Grid = [
  '....SSSSSSS.....',
  '..STTTSSSSSSs...',
  '.STTSSSSSSSSss..',
  'STSSSSSSSSSSsss.',
  'SSSSSSSSSSSSssss',
  'sSSSSSSSSSSssss.',
  'tssssssssssssst.',
  '.tttttttttttt...',
];
export const stonePal: Palette = pal({ S: '#a09a8a' });

/** 누운 손전등 (D): 몸통 C · 머리 S · 렌즈 1 · 그림자 2 */
export const FLASH_D: Grid = [
  '..........SSSS..',
  'LLLLLLLLLLSIIs1.',
  'LOOcCCCCCCSTTs1.',
  'CCCCCCCCCCSTTs1.',
  'ccccccccccSsss1.',
  '.kkkkkkkkkssss..',
  '..22222222222...',
];
export const flashDPal: Palette = pal({ C: '#c84a3a', S: '#a8a8b0', 1: '#d8e0e8', 2: '#5a4030' });

/** 붉은 벽돌 (구멍 둘) */
export const BRICK: Grid = [
  '.LLLLLLLLLLLLLLLc...',
  'LOOLLLLLLLLLLLLLcc..',
  'LLLkkkkLLLkkkkLLccc.',
  'LLLkkkkLLLkkkkLLcccc',
  'LLLLLLLLLLLLLLLLcccc',
  'CCCCCCCCCCCCCCCCcccc',
  'CCCCCcCCCCCCCcCCcccc',
  'CCCCCCCCCCCCCCCCcccc',
  'CCCCCCCCCCCCCCCCccck',
  'CCCCCCCCCCCCCCCCcck.',
  'cccccccccccccccccc..',
  '.kkkkkkkkkkkkkkkk...',
];
export const brickPal: Palette = pal({ C: '#b85a3a' });

/** 덤불 잎 덩이 하나 (왼쪽 위가 밝은 둥근 잎 뭉치, 1 빗방울) — 여러 개를 겹쳐 덤불을 만든다 */
export const LEAF_CLUMP: Grid = [
  '.......HHHHHH.........',
  '.....HHQQHHHHHH.......',
  '...HHQQHHHHHGGHHH.....',
  '..HHQHHHHGGGGGGGHH....',
  '.HHHHHHGGGGGGGGGGGH...',
  '.HHHHGGGGGGGGGGGGGGg..',
  'HHHHGGGGGGgGGGGG1GGgg.',
  'HHHGGGGGGGggGGGGGGGggg',
  'HHGGGGGGGGGgGGGGGGGggg',
  'HGGGGGGGGGGGGGGGGGgggg',
  'HGGGGGgGGGGGGGGGGggggg',
  'gGGGGggGGGGGGGGGgggggg',
  'gGGGGGgGGGGGGGGggggggg',
  '.ggGGGGGGGGGGGgggggg..',
  '..gggGGGGGGggggggggg..',
  '....gggggggggggggg....',
  '......hhhhhhhhhh......',
];
/** 덤불 아래 어두운 굴 (가로 늘이기 4·4) */
export const SHRUB_HOLE: Grid = [
  '..gghhhhhhhhhhhhgg..',
  '.ghh222222222222hhg.',
  'gh2222222222222222hg',
  '.h2222222222222222h.',
  '..hhhhhhhhhhhhhhhh..',
];
export const shrubPal: Palette = pal({ G: '#3e6e3a', 1: '#b8d8f0', 2: '#1e2a1e' });

// ───────────────────────── 16장 골목 · 놀이터 ─────────────────────────

/** 주차된 차: 몸통 (9-조각, C 파랑) · 지붕 유리 (A) · 바퀴 · 전조등 (1) · 번호판 (F) · 차 밑 그늘 (2) */
export const CAR_BODY: Grid = [
  '..LLLLLLLLLLLLLLLLLLLc....',
  '.LOOLLLLLLLLLLLLLLLLLcc...',
  'LOLLLLLLLLLLLLLLLLLLLccc..',
  'LLLLLLLLLLLLLLLLLLLLLcccc.',
  'LLLLLLLLLLLLLLLLLLLLLccccc',
  'CCCCCCCCCCCCCCCCCCCCCccccc',
  'CCCCCCCCCCCCCCCCCCCCCccccc',
  'CCCCCCCCCCCCCCCCCCCCCccccc',
  'ccccccccccccccccccccccccck',
  'kkkkkkkkkkkkkkkkkkkkkkkkk.',
];
export const CAR_CABIN: Grid = [
  '....LLLLLLLLLLLc....',
  '...LOLLLLLLLLLLcc...',
  '..LLAAAAAAAAAAAccc..',
  '..LAMAAAAAAAAAacc...',
  '.LAMMAAAAAAAAAAacc..',
  '.LAMAAAAAAAAAAAacc..',
  'LAAAAAAAAAAAAAAAacc.',
  'LaaaaaaaaaaaaaaaaccC',
  'CCCCCCCCCCCCCCCCCCcc',
];
export const CAR_WHEEL: Grid = [
  '..jjjjjjjjj...',
  '.jjjjjjjjjjj..',
  'jjjjSSSSjjjjj.',
  'jjjSTTTSsjjjj.',
  'jjjSTSSssjjjj.',
  'jjjjsssssjjjj.',
  '.jjjjjjjjjjj..',
  '..jjjjjjjjj...',
];
export const CAR_LIGHT: Grid = ['111111', '11111e', 'eeeeee'];
export const CAR_PLATE: Grid = ['PPPPPPPPPPPPPPPP', 'PFkkFkkFFkkFkkFf', 'PFFFFFFFFFFFFFFf', 'ffffffffffffffff'];
export const CAR_SHADOW: Grid = ['2222222222'];
export const carPal: Palette = pal({ C: '#6a7ab8', A: '#3a4868', M: '#8a9ad0', S: '#8a8a94', F: '#e8e4d8', j: '#262430', 1: '#f0e8b0', e: '#c8c088', 2: '#1e1a28' });

/** 우유 상자 (G 초록 플라스틱 · 칸막이 구멍 h) */
export const MILK_CRATE: Grid = [
  '.HHHHHHHHHHHHHHHHHg..',
  'HQQHHHHHHHHHHHHHHHgg.',
  'HHhhhhhhhhhhhhhhHHggg',
  'HHhhhhhhhhhhhhhhHHggg',
  'HHHHHHHHHHHHHHHHHHggg',
  'GGGGGGGGGGGGGGGGGGggg',
  'GGhhGhhGhhGhhGhhGGggg',
  'GGhhGhhGhhGhhGhhGGggg',
  'GGhhGhhGhhGhhGhhGGggg',
  'GHHHHHHHHHHHHHHHHGggg',
  'GHHHHHHHHHHHHHHHHGggg',
  'GGhhGhhGhhGhhGhhGGggg',
  'GGhhGhhGhhGhhGhhGGggg',
  'GGhhGhhGhhGhhGhhGGggh',
  'GGGGGGGGGGGGGGGGGGgh.',
  'ggggggggggggggggggh..',
  '.hhhhhhhhhhhhhhhhh...',
];
export const cratePal: Palette = pal({ G: '#3a8a5a' });

/** 고양이 밥그릇 (C) · 사료 (1) */
export const CAT_BOWL: Grid = [
  '...LLLLLLLLLL...',
  '.LLWWWWWWWWWWLc.',
  'LLW1W1W1W1WWWWcc',
  'LLWWWWWWWWWWWWcc',
  'cLLLLLLLLLLLLccc',
  '.cCCCCCCCCCCCck.',
  '...kkkkkkkkkk...',
];
export const catBowlPal: Palette = pal({ C: '#d86a6a', W: '#8a5a3a', 1: '#c89a6a' });

/** 바람에 구른 비닐봉지 (F) · 파란 글씨 (1) */
export const VINYL_BAG: Grid = [
  '.P.........P....',
  '..P.......P.....',
  '...P....PP......',
  '..PPPPPPPPPPP...',
  '.PZZPPPPPPPPPP..',
  'PZPPPPPPPPPPPFf.',
  'PPPPPPPP1PPPFFff',
  'fPPPPPPPPPPFFfff',
  '.ffFFFFFFFFffff.',
  '...ffffffffff...',
];
export const vinylPal: Palette = pal({ F: '#e8e8f0', 1: '#4a8ad8' });

/** 젖은 전단지 (F) · 빨간 제목 (1) · 글씨 (2) */
export const FLYER: Grid = [
  '..........PPPPPP.',
  '....PPPPPPPPPPPPF',
  'PPPPPPPPPPPPPPPPF',
  'PPPPP1111111PPPPF',
  'PPPPPPPPPPPPPPPPF',
  'PPPPPP222222PPPFF',
  'PPPPPPPPPPPPPPFFf',
  'fFFPPPPPPPPPFFff.',
  '..ffFFFFFFFFff...',
  '.....ffffff......',
];
export const flyerPal: Palette = pal({ F: '#f0ead8', 1: '#c84a3a', 2: '#8a8070' });

/** 하수구 도랑 (세로 9 되풀이: 시멘트 턱 S · 어둠 1 · 물 2 · 물결 3) */
export const DITCH: Grid = [
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
  'TTTs1233333333333333332s1ttt'.slice(0, 24),
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
  'TTTs1222222222222222222s1ttt'.slice(0, 24),
].map((r) => r.slice(0, 20) + 's1tt');
export const ditchPal: Palette = pal({ S: '#6a6c72', 1: '#1c1e26', 2: '#283648', 3: '#5a7aa0' });

/** 전깃줄 셋 (윗층, 가로 늘이기 60·60: 처진 가운데) */
export const WIRES: Grid = [
  '111.........................................................................................................................111',
  '...1111.................................................................................................................1111...',
  '.......11111......................................................................................................11111.......',
  '222.........11111111...........................................................................................111111.....222',
  '...2222.............1111111111..........................................................................111111111.....2222...',
  '.......22222....................11111111111111111111111111111111111111111111111111111111111111111111111..........22222.......',
  '333.........22222222.........................................................................................2222222......333',
  '...3333.............2222222222..................................................................22222222222.........3333...',
  '.......33333....................2222222222222222222222222222222222222222222222222222222222222222............33333.......',
  '............33333333.......................................................................................33333333.......',
  '....................3333333333.....................................................................3333333333...............',
  '..............................333333333333333333333333333333333333333333333333333333333333333333333...........................',
].map((r) => r.padEnd(124, '.').slice(0, 124));
export const wiresPal: Palette = pal({ 1: '#2a2a34', 2: '#32323e', 3: '#3a3a48' });

/** 모래성 (C) · 깃발 (W 막대 · 1 빨강) */
export const SAND_CASTLE: Grid = [
  '.......W....',
  '.......W11..',
  '.......W111.',
  '.......W1...',
  '.......W....',
  'L.L.L.LWL.L.',
  'LLLLLLLLLLLc',
  'LOLLLLLLLLcc',
  'LCCCCCCCCCcc',
  'LCCCCkkCCCcc',
  'LCCCCkkCCCcc',
  'LCCCCkkCCCcc',
  'cccccccccccc',
  '.cccccccccc..'.slice(0, 12),
];
export const SAND_HEAP: Grid = ['..cccccccccccccc..', '.cCCCCCCCCCCCCCCc.', 'kkkkkkkkkkkkkkkkkk'];
export const sandPal: Palette = pal({ C: '#d8b878', W: '#7a4e2c', 1: '#c8483c' });

/** 가로등 기둥 밑동: 칠 (G) · 닳은 손바닥 자리 (1 밝은 쇠) */
export const LAMP_POST: Grid = [
  'HHHHHHHHGg',
  'HQHHHHHHGg',
  ...rep('HHGGGGGGgg', 4),
  'HHG1G1G1gg',
  'HHG1111Ggg',
  'HHG111111g',
  'HHG111111g',
  'HHG11111gg',
  'HHGG111Ggg',
  ...rep('HHGGGGGGgg', 14),
  'gggggggggh',
  'hhhhhhhhhh',
];
export const postPal: Palette = pal({ G: '#4a5a58', 1: '#a8b4b0' });

/** 노란 발자국 스티커 둘 (1) · 정지선 (2) */
export const FOOT_STICKER: Grid = [
  '.1.1.1.........',
  '1........1.1.1.',
  '.111..........1',
  '11111..........',
  '11111....111...',
  '11311...11111..',
  '.111....11111..',
  '.111....11311..',
  '..1.....11111..',
  '.........111...',
  '.........111...',
  '..........1....',
  '2222222222222222'.slice(0, 15),
];
export const footPal: Palette = pal({ 1: '#f0c848', 2: '#e8e0c0', 3: '#f8e8a0' });

/** 아이스크림 막대 둘 (W) · 「한 개 더」 빨간 글씨 (1) */
export const STICKS2: Grid = [
  'YYYYYYYYYYv....',
  'VW11111WWWw....',
  'wwwwwwwwwwv....',
  '...............',
  '....YYYYYYYYYYv',
  '....VWWWWWWWWWw',
  '....wwwwwwwwwwv',
];
export const sticksPal: Palette = pal({ W: '#e8cc98', 1: '#c84a3a' });

// ───────────────────────── 14장 소파 밑 (장난감 눈높이) ─────────────────────────

/** 벽지 (12×12 되풀이: 세로 줄무늬 A) · 걸레받이 (W, 30줄, 가로 되풀이 24) · 먼지 띠 (1) */
export const WALLPAPER: Grid = [
  'aAAAAAAAAAAA',
  'aAAAAAAAAAAA',
  'aAAAAAAAAAAA',
  'aAAAAAMAAAAA',
  'aAAAAMMMAAAA',
  'aAAAAAMAAAAA',
  'aAAAAAAAAAAA',
  'aAAAAAAAAAAA',
  'aAAAAAAAAAAA',
  'aAAAAAAAAAAA',
  'aAAAAAAAAAAA',
  'aAAAAAAAAAAA',
];
export const SKIRT: Grid = [
  'YYYYYYYYYYYYYYYYYYYYYYYY',
  'VVVVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVVVV',
  'wwwwwwwwwwwwwwwwwwwwwwww',
  ...rep('WWWWWWWWWWWWWWWWWWWWWWWW', 6),
  'WWWWWWwwwwWWWWWWWWWWWWWW',
  ...rep('WWWWWWWWWWWWWWWWWWWWWWWW', 5),
  'WWWWWWWWWWWWWWWWWwwwWWWW',
  ...rep('WWWWWWWWWWWWWWWWWWWWWWWW', 6),
  '1W1W1W1W1W1W1W1W1W1W1W1W',
  'wwwwwwwwwwwwwwwwwwwwwwww',
  'vvvvvvvvvvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvvvvvvvvvv',
];
/** 콘센트 (F) · 구멍 (k) · 늘어진 충전기 줄 (S) */
export const OUTLET: Grid = [
  'PPPPPPPPPPPPPPPPPPPPPPPPPPPf',
  'PZZZZZZZZZZZZZZZZZZZZZZZZZFf',
  'PZFFFFFFFFFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFFFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFFFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFFFFFFFFFFFFFFFFFFFf',
  'PZFFFFFIIIIFFFFFFIIIIFFFFFFf',
  'PZFFFFIIIIIIFFFFIfffffFFFFFf',
  'PZFFFFIIIIIIFFFFfFkFkfFFFFFf',
  'PZFFFFIISSIIFFFFfFFFFfFFFFFf',
  'PZFFFFISSSSIFFFFfffffFFFFFFf',
  'PZFFFFFSSSSFFFFFFffffFFFFFFf',
  'PZFFFFFSSSSFFFFFFFFFFFFFFFFf',
  'PZFFFFFSSSSFFFFFFFFFFFFFFFFf',
  'PZFFFFFFSSFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFSSFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFSFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFSFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFSFFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFFSFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFFSFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFFSFFFFFFFFFFFFFFFFf',
  'PZFFFFFFFFFFFFFFFFFFFFFFFFFf',
  'PFFFFFFFFFFFFFFFFFFFFFFFFFFf',
  'fffffffffffffffffffffffffffp',
  '.pppppppppppppppppppppppppp.',
];
export const CHARGER_CORD: Grid = ['.S', '.S', 'S.', 'S.'];
export const skirtPal: Palette = pal({ A: '#e2d4b8', W: '#b88a5a', F: '#f0ece0', S: '#e0e0e0', 1: '#c8bca8', k: '#2a1c24' });

/** 소파 다리: 둥근 나무 기둥 (위 4 · 가운데 7 되풀이 · 아래 발 10) */
export const SOFA_LEG: Grid = [
  '.....VVVVVVVVVVVVVVVVVVVVvv.....',
  '....VYYVVVVVVVVVVVVVVVVVWwwv....',
  '...VYYVVWWWWWWWWWWWWWWWWWwwvv...',
  '...VYVWWWWWWWWWWWWWWWWWWWWwwv...',
  '....VYVWWWWWWWWWWWWWWWWWWwwv....',
  '....VYVWWWWWWWWWWWWWWWWWWwwv....',
  '....VYVWWWWWWWWWWWWWWWWWWwwv....',
  '....VYVWWWWWwwWWWWWWWWWWWwwv....',
  '....VYVWWWWWwwWWWWWWWWWWWwwv....',
  '....VYVWWWWWWWWWWWWWWWWWWwwv....',
  '....VYVWWWWWWWWWWWWWWWWWWwwv....',
  '.....VYVWWWWWWWWWWWWWWWWwwv.....',
  '.....VYVWWWWWWWWWWWWWWWWwwv.....',
  '......VYVWWWWWWWWWWWWWWwwv......',
  '......VYVWWWWWWWWWWWWWWwwv......',
  '.......VVWWWWWWWWWWWWWwwv.......',
  '.......wwwwwwwwwwwwwwwwwv.......',
  '.....111111111111111111111......',
  '...1111111111111111111111111....',
  '....1111111111111111111111......',
];
export const sofaLegPal: Palette = pal({ W: '#8a5a34', 1: '#5a3a22' });

/** 소파 바닥 안감 (윗층): 체크 (16×24 되풀이, A · B) · 늘어진 아랫단 (2 폭) */
export const SOFA_LINING: Grid = [
  ...rep('AAAAAAAABBBBBBBB', 8),
  ...rep('BBBBBBBBAAAAAAAA', 8),
  ...rep('AAAAAAAABBBBBBBB', 6),
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'm.m.m.m.m.m.m.m.',
  'm.m.m.m.m.m.m.m.',
  'm.m.m.m.m.m.m.m.',
  '..m.......m.....',
];
export const liningPal: Palette = pal({ A: '#5a4a6a', B: '#6a5878' });

/** 튀어나온 용수철 (윗층): 고리 하나 (6줄, 세로 되풀이) */
export const SPRING_COIL: Grid = [
  '...ITTTTTTs...',
  '.IT........ts.',
  'IT..........ts',
  '.ss........tt.',
  '...sssssssst..',
  '..............',
];
export const springPal: Palette = pal({ S: '#a8b0b8' });

/** 술 장식 (앞쪽 가림막): 띠 (W) · 술 한 가닥 (4 폭 되풀이) */
export const FRINGE_BAND: Grid = ['YYYY', 'VVVV', 'VVVV', 'WWWW', 'WWWW', 'WWWW', 'wwww', 'vvvv'];
export const FRINGE_TASSEL: Grid = [
  ...rep('VW..', 30),
  'VW..',
  'YVw.',
  'VWw.',
  '.w..',
];
export const fringePal: Palette = pal({ W: '#b8904e' });

/** 루루의 보물 상자 (성냥갑): 서랍 (W) · 빨간 상표 (C) · 반짝이 (1 2 3) */
export const MATCHBOX_DRAWER: Grid = [
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYv',
  'VW1WWWWW2WWWWW3WWW1WWWWW2WWWWWwv',
  'VWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwv',
  'VwwwwwwwwwwwwwwwwwwwwwwwwwwwwwWv',
  'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
];
export const MATCH_LABEL: Grid = [
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLc',
  'LCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCc',
  'LCCPPPPPPPPPPPPPPPPPPPPPPPPPPPPCCc',
  'LCCPFFFFFFFFFF44FFFFFFFFFFFFFFPCCc',
  'LCCPFFFFFFFFF4444FFFFFFFFFFFFFPCCc',
  'LCCPFFFFFFFFF4444FFFFFFFFFFFFFPCCc',
  'LCCPFFFFFFFFFF44FFFFFFFFFFFFFFPCCc',
  'LCCPPPPPPPPPPPPPPPPPPPPPPPPPPPPCCc',
  'LCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCc',
  'LCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCc',
  'ccccccccccccccccccccccccccccccccck',
];
export const matchPal: Palette = pal({ W: '#b8945a', C: '#c84a3a', F: '#f0e8d8', 1: '#f0c848', 2: '#e88a98', 3: '#8ad0f0', 4: '#e8843a', A: '#e8d0a0' });

/** 과자 부스러기 산 (C) */
export const CRUMB_HILL: Grid = [
  '.................LLL..........................',
  '..............LLLOOLLc........................',
  '.............LOLLLLLcc...LLL..................',
  '...........LLLLLLCCLLccLLOOLc.................',
  '..........LOLLLCCCCCLLLLLLLLcc................',
  '.........LLLLCCCCcCCCLLLCCCLLcc...............',
  '........LLLCCCCcccCCCCCCCCCCCcc...............',
  '.......LOLCCCCCCcCCCLLLCCCCCCCcc..............',
  '......LLLCCCLLLCCCCLOLLLCCCCcCCcc.............',
  '.....LLCCCCLOLLLCCCCLLLCCCCcccCCcc............',
  '....LLLCCCCCLLLCCCCCCCCCCCCCcCCCccc...........',
  '...LOLCCCCCCCCCCCCCccCCCCLLLCCCCCccc..........',
  '..LLLCCCCCCCCcCCCCCcccCCLOLLLCCCCCcccc........',
  '.LLCCCCcCCCCcccCCCCCcCCCCLLLCCCCCCCCccc.......',
  '.LCCCCcccCCCCcCCCCCCCCCCCCCCCCCcCCCCCccc......',
  'LLCCCCCcCCCCCCCCCCLLLCCCCCCCCCcccCCCCCcccc....',
  'LCCCCCCCCCCCCCCCCLOLLLCCCCCCCCCcCCCCCCCCccc...',
  'cCCCCCCCCCCCCCCCCCLLLCCCCcCCCCCCCCCCCCCCCccc..',
  'cccCCCCCCCcCCCCCCCCCCCCCcccCCCCCCCCCCCCCcccc..',
  '.ccccccccccccccccccccccccccccccccccccccccckk..',
  '..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....',
];
export const crumbPal: Palette = pal({ C: '#d8a860' });

/** 커다란 리모컨 (윗면 9-조각 · 단추 1 회색 · 2 빨강) */
export const REMOTE: Grid = [
  '.MMMMMMMMMMMMa....',
  'MUUMMMMMMMMMMaa...',
  'MMAAAAAAAAAAAaaa..',
  'MAAAAAAAAAAAAaaaa.',
  'MAAAAAAAAAAAAaaaa.',
  'MMMMMMMMMMMMMaaaa.',
  'AAAAAAAAAAAAAaaaa.',
  'AAAAAAAAAAAAAaaaa.',
  'AAAAAAAAAAAAAaaaa.',
  'AAAAAAAAAAAAAaaaa.',
  'AAAAAAAAAAAAAaaaa.',
  'AAAAAAAAAAAAAaaam.',
  'aaaaaaaaaaaaaaam..',
  'mmmmmmmmmmmmmmm...',
];
export const REMOTE_KEY: Grid = ['.TTT.', 'TSSSs', 'TSSSs', '.sss.'];
export const REMOTE_RED: Grid = ['.111.', '11112', '11112', '.222.'];
export const remotePal: Palette = pal({ A: '#3a3a44', S: '#8a8a98', 1: '#c8483c', 2: '#902a24' });

/** 먼지 뭉치 (F 회색 털 · 실 1) */
export const DUST_BUNNY: Grid = [
  '..........PPP..PP...........1..',
  '.....PPPPPZZPPPPPPPP.....11.....',
  '...PPZZPPPPPPPPPPPPPPP..1.......',
  '..PZPPPPPPFFPPPPPPPPPPP1........',
  '.PZPPPPFFFFFFFPPPPPPPPPFf.......',
  'PPPPPFFFFFFFFFFFPPPPFFFFFff.....',
  'PPPPFFFFfFFFFFFFFFFFFFFFFFff....',
  'PPFFFFFfffFFFFFFFFFFFfFFFFfff...',
  'fFFFFFFFfFFFFFFFFFFFfffFFFfff1..',
  'fFFFFFFFFFFFFFFFFFFFFfFFFfffff1.',
  '.ffFFFFFFFFFFFFFFFFFFFFFffffff..',
  '..ffffFFFFFFFFFFFFFFFFfffffffp..',
  '....fffffffffffffffffffffffpp...',
  '......ppppppppppppppppppppp.....',
].map((r) => r.padEnd(32, '.').slice(0, 32));
export const bunnyPal: Palette = pal({ F: '#9a92a0', 1: '#b8b0c0' });

/** 거대한 단추 (네 구멍 k) */
export const BIG_BTN: Grid = [
  '......LLLLLLLL......',
  '...LLLOOLLLLLLLLc...',
  '.LLOLLLCCCCCCLLLLcc.',
  'LLOLLCCCkkCkkCCLLccc',
  'LLLLCCCCkkCkkCCCLccc',
  'LLLLCCCCCCCCCCCCcccc',
  'LLLLCCCCkkCkkCCCcccc',
  'cLLLLCCCkkCkkCCCcccc',
  'cccLLLLCCCCCCcccccck',
  '.ccccccccccccccccck.',
  '...ccccccccccccckk..',
  '......kkkkkkkk......',
];
/** 단추 집 (동전 마을): 벽 (F) · 빨간 지붕 (B) · 문 (W) */
export const BTN_HOUSE: Grid = [
  '.........RR.........',
  '.......RRBBRr.......',
  '.....RRBBBBBBrr.....',
  '...RRBBBBBBBBBBrr...',
  '..RBBBBBBBBBBBBBBr..',
  'bbbbbbbbbbbbbbbbbbbb',
  '..PPPPPPPPPPPPPPPf..',
  '..PFFFFFFFFFFFFFFf..',
  '..PFFFFFFFFFFFFFFf..',
  '..PFFFFVVVVVFFFFFf..',
  '..PFFFFVWWWwFFFFFf..',
  '..PFFFFVWWWwFFFFFf..',
  '..PFFFFVWW1wFFFFFf..',
  '..PFFFFVWWWwFFFFFf..',
  '..PFFFFVWWWwFFFFFf..',
  '..PFFFFVWWWwFFFFFf..',
  '..fffffwwwwwfffffp..',
];
export const buttonPal = (house: boolean): Palette => pal({ C: house ? '#7ab0d8' : '#c86a5a', F: '#e8d8b8', B: '#c84a3a', W: '#6a4a3a', 1: '#e8c060' });

/** 사탕 껍질 (A 분홍 비닐 · 1 금박 줄) */
export const CANDY_WRAP: Grid = [
  'MM..............MM',
  'MAAa.LLLLLLLL.MAAa',
  'MAAaaLOLLLLLLcaAAa',
  'MAAAACCC111CCcAAAa',
  'MAAAACCCCCCCCcAAAa',
  'MAAaaCCCCCCCcca AAa'.replace(' ', ''),
  'MAa..ccccccccc.aAa',
  'aa.............aa.',
].map((r) => r.padEnd(18, '.').slice(0, 18));
export const wrapPal: Palette = pal({ C: '#e85a8a', A: '#f0a0c0', 1: '#f8e0a0' });

/** 여우 털 세 가닥 (C 주황 · F 흰) · 빨간 실 (1) */
export const FUR_TUFT: Grid = [
  '.CCC..1..........',
  'CCLLCC1CCC.......',
  '...cCC1CCCLLCC...',
  '.PPP..1...ccCCC..',
  'PPFFPP1PPP....Cc.',
  '...fPP1FFFPPPP...',
  '.CCC..1...ffPP...',
  'CCLLCC1CCC....P..',
  '...cCC1CCCLLCC...',
  '......1...ccCCC..',
];
export const furPal: Palette = pal({ C: '#e8843a', F: '#f0e8d8', 1: '#c8483c' });

/** 거대한 동전 한 닢 (9-조각: 가로만 늘여 크기를 바꾼다) · 쌓인 동전 한 닢 (탑) */
export const COIN: Grid = [
  '....LLLLLLLLLLLL....',
  '..LLOOLLLLLLLLLLLc..',
  '.LOLLCCCCCCCCCCLLcc.',
  'LLLLCCCCCCCCCCCCLccc',
  'LLLLCCCCCCCCCCCCcccc',
  'cLLLLCCCCCCCCCCccccc',
  'ccLLLLLLLLLLLLcccccc',
  'kcccccccccccccccccck',
  '.kkccccccccccccckkk.',
  '...kkkkkkkkkkkkkk...',
];
export const COIN_LAYER: Grid = [
  '....LLLLLLLLLLLL....',
  '..LLOOLLLLLLLLLLLc..',
  '.LOLLLLLLLLLLLLLLcc.',
  'LLLLLLLLLLLLLLLLLccc',
  'cLLLLLLLLLLLLLLLcccc',
  'kcccccccccccccccccck',
  '.kkccccccccccccckkk.',
];
export const coinPal = (gold: boolean): Palette => pal({ C: gold ? '#c8904a' : '#c8ccd4' });

/** 빨간 레고 블록 (돌기 둘) */
export const LEGO: Grid = [
  '...LLLLc...LLLLc....',
  '..LOLLLcc.LOLLLcc...',
  '..LLLLLcc.LLLLLcc...',
  '..cLLLLcc.cLLLLcc...',
  '.LLcccccLLLcccccLc..',
  'LOLLLLLLLLLLLLLLLcc.',
  'LLLLLLLLLLLLLLLLLccc',
  'LLLLLLLLLLLLLLLLLccc',
  'CCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCccc',
  'CCCCCCCCCCCCCCCCCcck',
  'CCCCCCCCCCCCCCCCCck.',
  'ccccccccccccccccck..',
  '.kkkkkkkkkkkkkkkk...',
];
export const legoPal: Palette = pal({ C: '#d8483a' });

/** 구슬 (C 파랑 유리 · 1 노랑 · 2 빨강 띠 · O 반짝) */
export const MARBLE: Grid = [
  '.....LLLLLLL.....',
  '...LLOOLLLLLLc...',
  '..LOOOLLLLLL1Cc..',
  '.LOOLLLLLLL11Ccc.',
  '.LLLLLLLLL11CCcc.',
  'LLLLLLLL111CCC2cc',
  'LLLLLL111CCC222cc',
  'LLLL111CCC222Cccc',
  'LLL11CCC222CCCccc',
  'LL1CCC222CCCCCccc',
  'cLCC222CCCCCCcccc',
  '.cC22CCCCCCCcccc.',
  '.ccCCCCCCCCccccc.',
  '..ccccccccccccc..',
  '...kkccccccckk...',
  '.....kkkkkkk.....',
];
export const marblePal: Palette = pal({ C: '#6ab0e8', 1: '#f0c848', 2: '#e85a5a' });

/** 아빠 양말 (둘둘 뭉친 산: C 회색 · 결 c · F 흰 발목) */
export const SOCK_BALL: Grid = [
  '..............LLLLLLLLL..........................',
  '..........LLLLOOLLLLLLLLLLc.......PPPPPPPP.......',
  '.......LLLOOLLLLCLLLLCLLLLLcc...PPZZPPPPPPPf.....',
  '.....LLOOLLLLLLLCLLLLCLLLLLLcc.PZPPPPPPPPPPff....',
  '....LOLLLLLLLLLLCLLLLCLLLLLLLcPPPPPPPPPPPPPfff...',
  '...LOLLLLLLCLLLLCLLLLCLLLLCLLcPPPPPPPPPPPPFfff...',
  '..LLLLLLLLLCLLLLCLLLLCLLLLCLLcfPPPPPPPPPPFFfff...',
  '..LLLLLLLLLCLLLLCLLLLCLLLLCLCCCffFFFFFFFFFffff...',
  '.LLLCLLLLLLCLLLLCLLLLCLLLLCCCCCCcffffffffffff....',
  '.LLLCLLLLCCCCCCCCCCCCCCCCCCCCCCCCcc.fffffff......',
  'LLLLCLLLLCCCCcCCCCcCCCCcCCCCcCCCCCcc..............',
  'LLLLCCCCCCCCCcCCCCcCCCCcCCCCcCCCCCCcc.............',
  'LLCCCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcCCcc............',
  'LCCCCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcCCCcc...........',
  'LCCCCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcCCCcc...........',
  'LCCCCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcc..........',
  'cCCCCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcCCCCccc.........',
  'cCCCCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcccc........',
  'ccCCCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcCCCCcccc........',
  '.cccCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccc.........',
  '..ccccccccCCCCCCCCCCCCCCCCCCCCCCCCcccccc..........',
  '....ccccccccccccccccccccccccccccccccck............',
  '.......kkkkkkkkkkkkkkkkkkkkkkkkkkkkk..............',
].map((r) => r.padEnd(50, '.'));
export const sockBallPal: Palette = pal({ C: '#5a5a6a', F: '#d8d8d0' });

/** 이쑤시개 울타리: 말뚝 둘 (F) · 부스러기 받침 (W) · 빨간 실 두 줄 (1) — 한 칸(24줄)씩 세로로 되풀이 */
export const PICKETS: Grid = [
  '.....P...........P......',
  '....ZPf.........ZPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '...111111111111111111...',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '...222222222222222222...',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '..VVWWWv......VVWWWv....',
  '.VWWWWWwv....VWWWWWwv...',
  '..wwwwwv......wwwwwv....',
  '........................',
];
export const PICKET_TOP: Grid = [
  '.....P...........P......',
  '....ZPf.........ZPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
  '....PPf.........PPf.....',
];
export const picketPal: Palette = pal({ F: '#e8d0a0', W: '#c8a060', 1: '#c8483c', 2: '#a8382c' });

/** 줄무늬 빨대 (8 폭 되풀이: C 빨강 · F 흰) */
export const STRAW: Grid = [
  'OOOOZZZZ',
  'CCCCPPPP',
  'CCCCFFFF',
  'CCCCFFFF',
  'CCCCFFFF',
  'CCCCFFFF',
  'ccccffff',
  'kkkkpppp',
];
export const strawPal: Palette = pal({ C: '#e85a6a', F: '#f0ece4' });

/** 병뚜껑 (톱니 테 C · 안쪽 F) */
export const BOTTLE_CAP: Grid = [
  '.........LLLLLLLLLLLL.........',
  '.....LLLLOOLLLLLLLLLLLLLc.....',
  '...LLOOLLPPPPPPPPPPPPLLLLcc...',
  '..LOLLPPPFFFFFFFFFFFFPPLLLcc..',
  '.LLLLPFFFFFFFFFFFFFFFFFPLLLcc.',
  '.LLLPFFFFFFFFFFFFFFFFFFFPLLcc.',
  'LLLLPFFFFFFFFFFFFFFFFFFFfLLccc',
  'LLLLLfFFFFFFFFFFFFFFFFFffLLccc',
  'CLLLLLffFFFFFFFFFFFFFffLLLLccc',
  'CCLLLLLLffffffffffffLLLLLLcccc',
  'CcCcCcCLLLLLLLLLLLLLLLCcCcCccc',
  'CcCcCcCcCcCcCcCcCcCcCcCcCcCccc',
  'CcCcCcCcCcCcCcCcCcCcCcCcCcCccc',
  'CcCcCcCcCcCcCcCcCcCcCcCcCcCcck',
  'CcCcCcCcCcCcCcCcCcCcCcCcCcCcck',
  'cCcCcCcCcCcCcCcCcCcCcCcCcCcckk',
  '.cccccccccccccccccccccccccckk.',
  '...ccccccccccccccccccccccckk..',
  '.....kkkkkkkkkkkkkkkkkkkkk....',
];
export const capPal: Palette = pal({ C: '#d8483a', F: '#f0e8d0' });

/** 뽑기 캡슐 (A 분홍 위 · F 투명 아래) */
export const CAPSULE: Grid = [
  '.....MMMMMM.....',
  '...MMUUMMMMMa...',
  '..MUUMMMMMMMaa..',
  '.MUMMMMMMMMMMaa.',
  '.MMMMMMMMMMMMaa.',
  'MMMMMMMMMMMMMaaa',
  'aaaaaaaaaaaaaaam',
  'mmmmmmmmmmmmmmmm',
  'PZZPPPPPPPPPPPff',
  'PZPPPPPPPPPPPPff',
  'PPPPPPPPPPPPPFff',
  '.PPPPPPPPPPPFff.',
  '.fPPPPPPPPPFFff.',
  '..ffFFFFFFFfff..',
  '...ffffffffff...',
  '.....pppppp.....',
];
export const capsulePal: Palette = pal({ A: '#f0a8c8', F: '#e8eef4' });

/** 효자손 끝 (W 대 · A 고무 손가락) */
export const SCRATCHER: Grid = [
  '..............MMa...',
  '............MAAAAa..',
  '.............MAAAAa.',
  'YYYYYYYYYYMMAAAAAa..',
  'VWWWWWWWWWMAAAAAAAa.',
  'wwwwwwwwwwaAAAAAAa..',
  '...........aAAAAAAa.',
  '............aAAAAa..',
  '.............mmmm...',
];
export const scratcherPal: Palette = pal({ W: '#c89a64', A: '#7a6a5a' });

/** 빨간 실 한 토막 (둘둘 감긴 · 끝이 풀림) */
export const THREAD_RED: Grid = [
  '.....CCCCCC.......',
  '...CCc.....CC.....',
  '..Cc..CCCC..Cc....',
  '.Cc..Cc..cC..C....',
  '.C..Cc.CC.cC.Cc...',
  '.C..C..C...C.C....',
  '.Cc.cC....Cc.C....',
  '..C..cCCCCc.Cc....',
  '..cC.......Cc.....',
  '....cCCCCCCc.CC...',
  '...............CC.',
  '................Cc',
];
export const threadPal: Palette = pal({ C: '#c8483c' });

/** 수성펜 뚜껑 (C 파랑 · 집게 L) */
export const PEN_CAP: Grid = [
  '..LLLLLLLLc.......',
  '..cccccccLc.......',
  'LLLLLLLLLLLLLLc...',
  'LOOOOLLLLLLLLLcCCc',
  'LCCCCCCCCCCCCCcCCc',
  'LCCCCCCCCCCCCCcCCc',
  'LCCCCCCCCCCCCCcCCc',
  'kkkkkkkkkkkkkkkcck',
];
export const penPal: Palette = pal({ C: '#4a7ad8' });

export const PX_D: Record<string, [Grid, Palette]> = {
  balconyWin: [NIGHT_SKY, balconyPal],
  'balconyWin.roofs': [ROOFS, balconyPal],
  'balconyWin.wire': [SKY_WIRE, balconyPal],
  'balconyWin.frame': [WIN_FRAME, balconyPal],
  'balconyWin.bar': [WIN_BAR, balconyPal],
  'balconyWin.glint': [WIN_GLINT, balconyPal],
  'balconyWin.slid': [WIN_SLID, balconyPal],
  'balconyWin.string': [CURTAIN_STRING, balconyPal],
  'balconyWin.sill': [SILL, balconyPal],
  'balconyWin.wall': [BAL_WALL, balconyPal],
  'washer.panel': [WASH_PANEL, washerPal],
  'washer.door': [WASH_DOOR, washerPal],
  pegTub: [PEG_TUB, pegPal],
  'faucet.tap': [TAP_WALL, faucetPal],
  'faucet.hose': [HOSE, faucetPal],
  'faucet.bucket': [BUCKET, faucetPal],
  'faucet.yard': [TAP_YARD, faucetPal],
  dustpan: [DUSTPAN, dustpanPal],
  gloves: [GLOVES, glovePal],
  'laundry.line': [LAUNDRY_LINE, laundryPal],
  'laundry.post': [LAUNDRY_POST, laundryPal],
  'laundry.shirt': [SHIRT, laundryPal],
  'laundry.socks': [SOCKS, laundryPal],
  'laundry.towel': [TOWEL_HANG, laundryPal],
  'laundry.rack': [TOWEL_RACK, laundryPal],
  'dryingRack.legs': [RACK_LEGS, dryingPal],
  'dryingRack.bar': [RACK_BAR, dryingPal],
  'dryingRack.post': [RACK_POST, dryingPal],
  'dryingRack.cloth': [RACK_CLOTH, dryingPal],
  'haruFlower.pot': [POT, flowerPal],
  'haruFlower.wilt': [WILT, flowerPal],
  'haruFlower.bloom': [BLOOM, flowerPal],
  chairFold: [CHAIR_FOLD, chairFoldPal],
  nameStick: [NAME_STICK, namePal],
  feather: [FEATHER, featherPal],
  foxBag: [FOX_BAG, foxPal],
  trowel: [TROWEL, trowelPal],
  watercan: [WATERCAN, canPal],
  eaves: [EAVES, eavesPal],
  'eaves.drip': [EAVES_DRIP, eavesPal],
  downspout: [DOWNSPOUT, spoutPal],
  boots: [BOOT, bootPal],
  daetdol: [RUBBER_SHOE, daetPal],
  tub: [TUB, tubPal],
  'clothesline.post': [LINE_POST, linePal],
  'clothesline.line': [CLOTHESLINE, linePal],
  'clothesline.pin': [PIN, linePal],
  'clothesline.pin2': [PIN2, linePal],
  snail: [SNAIL, snailPal],
  raincoatButton: [RAIN_BUTTON, rainBtnPal],
  cotton: [COTTON_D, cottonDPal],
  clothespin: [CLOTHESPIN, pinPal],
  looseStone: [STONE, stonePal],
  flashlight: [FLASH_D, flashDPal],
  brick: [BRICK, brickPal],
  shrub: [LEAF_CLUMP, shrubPal],
  'shrub.hole': [SHRUB_HOLE, shrubPal],
  'car.body': [CAR_BODY, carPal],
  'car.cabin': [CAR_CABIN, carPal],
  'car.wheel': [CAR_WHEEL, carPal],
  'car.light': [CAR_LIGHT, carPal],
  'car.plate': [CAR_PLATE, carPal],
  'car.shadow': [CAR_SHADOW, carPal],
  milkCrate: [MILK_CRATE, cratePal],
  catBowl: [CAT_BOWL, catBowlPal],
  vinylBag: [VINYL_BAG, vinylPal],
  flyer: [FLYER, flyerPal],
  ditch: [DITCH, ditchPal],
  wires: [WIRES, wiresPal],
  sandCastle: [SAND_CASTLE, sandPal],
  'sandCastle.heap': [SAND_HEAP, sandPal],
  palmPrint: [LAMP_POST, postPal],
  footSticker: [FOOT_STICKER, footPal],
  sticks2: [STICKS2, sticksPal],
  'skirtBoard.paper': [WALLPAPER, skirtPal],
  'skirtBoard.board': [SKIRT, skirtPal],
  'skirtBoard.outlet': [OUTLET, skirtPal],
  'skirtBoard.cord': [CHARGER_CORD, skirtPal],
  sofaLeg: [SOFA_LEG, sofaLegPal],
  sofaBottom: [SOFA_LINING, liningPal],
  spring: [SPRING_COIL, springPal],
  'fringe.band': [FRINGE_BAND, fringePal],
  'fringe.tassel': [FRINGE_TASSEL, fringePal],
  'matchbox.drawer': [MATCHBOX_DRAWER, matchPal],
  'matchbox.label': [MATCH_LABEL, matchPal],
  crumbHill: [CRUMB_HILL, crumbPal],
  remoteGiant: [REMOTE, remotePal],
  'remoteGiant.key': [REMOTE_KEY, remotePal],
  'remoteGiant.red': [REMOTE_RED, remotePal],
  dustBunny: [DUST_BUNNY, bunnyPal],
  buttonGiant: [BIG_BTN, buttonPal(false)],
  'buttonGiant.house': [BTN_HOUSE, buttonPal(true)],
  candyWrap: [CANDY_WRAP, wrapPal],
  furTuft: [FUR_TUFT, furPal],
  coinGiant: [COIN, coinPal(false)],
  'coinGiant.layer': [COIN_LAYER, coinPal(true)],
  lego: [LEGO, legoPal],
  marble: [MARBLE, marblePal],
  sock: [SOCK_BALL, sockBallPal],
  toothpicks: [PICKETS, picketPal],
  'toothpicks.top': [PICKET_TOP, picketPal],
  straw: [STRAW, strawPal],
  bottleCap: [BOTTLE_CAP, capPal],
  capsule: [CAPSULE, capsulePal],
  scratcherTip: [SCRATCHER, scratcherPal],
  threadRed: [THREAD_RED, threadPal],
  penCap: [PEN_CAP, penPal],
};
