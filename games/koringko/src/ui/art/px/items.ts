/**
 * 옮길 수 있는 물건 (items.ts) 의 손찍기 격자. 한 글자 = 한 칸, 빛은 왼쪽 위.
 * 글자는 물건마다 팔레트로 칠한다 (아래 ITEM_PAL). 이 파일 안에서 글자의 뜻은 같다:
 *   재질 다섯 단계 (반짝 · 밝음 · 바탕 · 그늘 · 깊은 그늘)
 *     Q q K k x  골판지        . e T t .  포장 테이프
 *     O o P p y  종이 · 흰 것  . u W w v  나무
 *     G g C c j  주된 색       . h A a s  둘째 색        . l B b n  셋째 색
 *     I i M m z  쇠 · 유리
 *   X 먹 (글씨 · 눈) · 1~9 포인트 색 (볼 · 꽃 · 단추처럼 한두 칸)
 */
import type { Grid } from './grid.ts';

// ───────────────────────── 종이 상자 (18×15) ─────────────────────────

export const BOX: Grid = [
  '.qqqqqqqeTtqqqqqq.',
  'qQqqqqqqeTtqqqqqqq',
  'qqkkkkkkeTtkkkkkqq',
  'qqqqqqqqeTtqqqqqqk',
  'kkkkkkkkeTtkkkkkkx',
  'qKKKKKKKeTtKKKKKKk',
  'qKKKKKKKeTtKKxxxKk',
  'qKKKKKKKkkkKKKKKKk',
  'qKKKKKKKKKKKKKKKKk',
  'qKKKkKKKKKKKKKkKKk',
  'qKKKKKKKKKKKKKKKKk',
  'qKKKKKKKKKKKKKKKKk',
  'qKkKKkKKkKKkKKkKKk',
  'kkkkkkkkkkkkkkkkkk',
  'xxxxxxxxxxxxxxxxxx',
];

/** 꽁꽁 싸맨 가로 테이프 (상자 위에 겹친다) */
export const BOX_BAND: Grid = [
  'eeeeeeeeeeeeeeeeee',
  'TTTTTTTTTTTTTTTTTt',
];

/** 쪽지: 1 반짝 귀퉁이 · N 쪽지 · n 그늘 · X 매직 글씨 · R 하트 */
export const NOTE_CROSS: Grid = [
  '1NNNNNNNn',
  'NXNXXNNNn',
  'NNNNNXNXn',
  'NXXXNNXNn',
  'NNNNNXNXn',
  'nnnnnnnnn',
];
export const NOTE_HEART: Grid = [
  '1NNNNNNNn',
  'NXNXXNNNn',
  'NNNNNRNRn',
  'NXXXNRRRn',
  'NNNNNNRNn',
  'nnnnnnnnn',
];

/** 뚜껑 열린 상자 (24×20): 뒤 날개 · 어두운 속 · 하얀 토끼 귀 둘 · 양옆 날개 · 앞 날개 반쯤 */
export const BOX_OPEN: Grid = [
  '........................',
  '.....qqqqqqqqqqqqqq.....',
  '.....qKKKFFKKKKKKKk.....',
  'q....kKKKF2KKKFFKKk....k',
  'qq...kKKKF2KKKF2KKk...kk',
  '.qq..xxxxF2xxxF2xxx..kk.',
  '.qqq.xvvvFFvvvFFvvx.kkk.',
  '..qqqxvvvFfvvvFfvvxkkk..',
  '..qqqxvvvvvvvvvvvvxkk...',
  '...qqQqqqqqqeTtqqqqk....',
  '...qQqqqqqqqeTtqqqqqk...',
  '...kkkkkkkkkeTtkkkkkx...',
  '...qKKKKKKKKkkkKKKKKk...',
  '...qKKKKKKKKKKKKxxxKk...',
  '...qKKKKkKKKKKKKKKKKk...',
  '...qKKKKKKKKKKKKKKKKk...',
  '...qKKKKKKKKKKKKKkKKk...',
  '...qKkKKkKKkKKkKKkKKk...',
  '...kkkkkkkkkkkkkkkkkk...',
  '...xxxxxxxxxxxxxxxxxx...',
];

// ───────────────────────── 인형들 (11×14) ─────────────────────────
// F 털 · f 털 그늘 · E 털 밝음 · 2 귀 안 · 3 볼 · C 옷 · c 옷 그늘 · 4 옷 띠 · X 눈 · y 코

export const PLUSH_TOBY: Grid = [
  '..EF...EF..',
  '..F2...F2..',
  '..F2...F2..',
  '..FF...Ff..',
  '.EEFFFFFFf.',
  'EEFFFFFFFFf',
  'EFFXFFFXFFf',
  'FF3FFFFF3Ff',
  'FFFFyyFFFff',
  '.fFFFFFFff.',
  'FgC444444cf',
  '.CCCCCCCcc.',
  '..CCCCCcc..',
  '..FF..ff...',
];
export const PLUSH_BEAR: Grid = [
  '...........',
  '...........',
  '.FF.....FF.',
  'F2FF...FF2f',
  'FF2FFFFF2ff',
  'EEFFFFFFFFf',
  'EFFXFFFXFFf',
  'FF3AAAAA3Ff',
  'FFFAAyAAFff',
  '.fFFFFFFff.',
  'FgC444444cf',
  '.CCCCCCCcc.',
  '..CCCCCcc..',
  '..FF..ff...',
];
export const PLUSH_FOX: Grid = [
  '.F.......f.',
  '.FF.....ff.',
  'F2FF...ff2f',
  'F22FFFFF22f',
  'EEFFFFFFFFf',
  'EFFFFFFFFFf',
  'EFFXFFFXFFf',
  'FF3AAAAA3Ff',
  'FFAAAyAAAff',
  '.fAAAAAAff.',
  'FgC44444cFf',
  '.CCCCCCcFFf',
  '..CCCCcFAff',
  '..FF..ffff.',
];
export const PLUSH_CAT: Grid = [
  '.....4.....',
  '...CCCCC...',
  '.F.CCCCc.f.',
  'F2F.....f2f',
  'F22FFFFF22f',
  'EEFFFFFFFFf',
  'EFFXFFFXFFf',
  'FF3FFFFF3Ff',
  'FFFFyyFFFff',
  '.fFFFFFFff.',
  'FgC444444cf',
  '.CCCCCCCcc.',
  '..CCCCCcc..',
  '..FF..ff...',
];

/** 태엽 할머니 인형 (10×14): H 흰 쪽머리 · S 살 · M 안경테 · C 보라 카디건 · A 치마 · P 블라우스 · 5 태엽 · 3 볼 */
export const DOLL: Grid = [
  '...hHHh...',
  '...HHHh...',
  '.hHHHHHHh.',
  '.HSSSSSSh.',
  '.SMMSSMMs.',
  '.SMXSSMXs.',
  '.SSS3SSss.',
  '..ssSSss..',
  '.gCCPPCCc5',
  'gCCCPPCCc5',
  'aAAAAAAAaa',
  'AAAAAAAAaa',
  'aaaaaaaaaa',
  '..vv..vv..',
];

// ───────────────────────── 작은 물건들 ─────────────────────────

/** 종이별 유리병 (10×13): M 노란 뚜껑 · I 유리 반짝 · G 유리 · g 유리 그늘 · 1~5 별 */
export const JAR: Grid = [
  '.uWWWWWWw.',
  '.WWWWWWWw.',
  '.wwwwwwwv.',
  'gIGGGGGGGg',
  'GIGGG1GGGg',
  'GIG3GGG4Gg',
  'GIGG2GGGGg',
  'GI5GGG1G3g',
  'GG1G4GG2Gg',
  'G2G3G5G1Gg',
  'G41G23G54g',
  'G3524135Gg',
  '.gggggggg.',
];
/** 작은 빈 병 (7×8) */
export const JAR_SMALL: Grid = [
  '.uWWWw.',
  '.wwwwv.',
  'gIGGGGg',
  'GIGGGGg',
  'GIGGGGg',
  'GIGGGgg',
  'GGGGGgg',
  '.ggggg.',
];

/** 편지 봉투 (11×8): 하트 봉인 */
export const LETTER: Grid = [
  'oPpPPPPPpPp',
  'PoPpPPPpPPp',
  'PPoPpPpPPPp',
  'PPPoPRpRPPp',
  'PPPPRRRRPPp',
  'PPPPPRRPPPp',
  'PPPPPPPPPPp',
  'pppppppppyy',
];

/** 접어 세운 생일 카드 (10×10): C 분홍 앞장 · c 뒷장 그늘 · P 케이크 · 1 노란 별 · 2 초 · 3 불꽃 */
export const CARD: Grid = [
  'GCCCCCCCcj',
  'C1CCCCCCcj',
  'CCCCCC1Ccj',
  'CCCC3CCCcj',
  'CCCC2CCCcj',
  'CCAAAACCcj',
  'CCPPPPCCcj',
  'CCPPPPCCcj',
  'CCCCCCCCcj',
  'ccccccccjj',
];

/** 세운 사진 액자 (10×12): W 나무 테 · P 바랜 사진 · 사진 속 할머니(H 흰머리 · C 보라 옷)와 하루(A 머리 · B 노란 옷) */
export const PHOTO: Grid = [
  'uuuuuuuuuw',
  'uWWWWWWWWv',
  'uWoooooowv',
  'uWPPPPPPwv',
  'uWPHPPAPwv',
  'uWPHPPAPwv',
  'uWPCPPBPwv',
  'uWPCCPBPwv',
  'uWPCCPBPwv',
  'uWppppppwv',
  'uwwwwwwwwv',
  'wvvvvvvvvv',
];

/** 개어 놓은 노란 목도리 (13×7): 흰 줄무늬 · 술 */
export const SCARF: Grid = [
  'gGgggggggggc.',
  'CCcCCcCCcCCc.',
  'PPPPPPPPPPPp.',
  'CCcCCcCCcCCcc',
  'cccccccccCCcc',
  '.c.c.c.c.ccc.',
  '.........c.c.',
];

/** 노란 털실 뭉치 (10×8): 감긴 결 · 풀린 끝 */
export const YARN: Grid = [
  '..gGGgc...',
  '.gGcGGcc..',
  'gGGGcGGcc.',
  'GcGGGcGGc.',
  'GGcGGGcGc.',
  'cGGcGGGcc.',
  '.ccGcccc.c',
  '..cccc..c.',
];

/** 국그릇 (12×10): 국물 · 파 · 푸른 띠. 김(Z)은 외곽선 없이 위에 */
export const BOWL: Grid = [
  '............',
  '............',
  '............',
  '............',
  '.PAAAAAAAAp.',
  'oAA1AAhAAAAp',
  'oPPPPPPPPPpp',
  '.PBBBBBBBBp.',
  '..PPPPPPpp..',
  '...pppppy...',
];
export const BOWL_STEAM: Grid = [
  '.......Z....',
  '.....Z......',
  '....Z...Z...',
];

/** 찻잔과 받침 (10×8) */
export const CUP: Grid = [
  '..........',
  '..........',
  '..AAAAAApp',
  '..PPPPPPpy',
  '..P1111pp.',
  '..oPPPPp..',
  'oPPPPPPPPp',
  'ppppppppyy',
];
export const CUP_STEAM: Grid = [
  '.....Z....',
  '....Z.....',
];

/** 나무 쟁반 (18×5): 손잡이 구멍 */
export const TRAY: Grid = [
  '.uuuuuuuuuuuuuuuu.',
  'uWvvWWWWWWWWWWvvWw',
  'uWWWWWWWWWWWWWWWWw',
  'wwwwwwwwwwwwwwwwww',
  'vvvvvvvvvvvvvvvvvv',
];

/** 접힌 노란 우산 (18×5): 쇠 꼭지 · 접힌 천 · 빨간 끈 · 굽은 손잡이 */
export const UMBRELLA: Grid = [
  '.......gg.........',
  '....gGGGG1GG......',
  'mMGGcGGcG1Gcmmwwv.',
  '....cccGc1cc.....v',
  '...........c...vv.',
];

/** 빨간 가방 (12×13): 손잡이 · 덮개 · 노란 단추 · 앞주머니 */
export const BAG: Grid = [
  '....cccc....',
  '...c....c...',
  'gGGGGGGGGGGc',
  'GOgggggggggc',
  'GggggggggGgc',
  'GgggggggggGc',
  'GccccMMccccc',
  'GCCCCMmCCCCc',
  'GCCCCCCCCCCc',
  'GCgggggggCCc',
  'GCCCCCCCCCcc',
  'GCcccccccccc',
  'cjjjjjjjjjjj',
];

/** 생일 케이크 (14×11): 초 넷 · 분홍 크림 · 딸기 */
export const CAKE: Grid = [
  '..1..1..1..1..',
  '..3..3..3..3..',
  '..A..B..C..A..',
  '..a..b..c..a..',
  '.ooooooooooooo',
  'CCCCCCCCCCCCCc',
  'CPcPPcPPcPPcPc',
  'PPPPPPPPPPPPPp',
  'PP4PPPPPPP4PPp',
  'PPPPPPPPPPPPPp',
  'pppppppppppppy',
];

/** 「하루 꽃」 화분 (12×16): 토분 · 잎 · 노란 꽃 · 이름표 */
export const POT: Grid = [
  '....hAAh....',
  '...hAAAAa...',
  '...AA22Aa...',
  '...aAAAaa...',
  '....aa1.....',
  '.....l1.....',
  '..lB.1.lB...',
  '.lBBb1BBbPP.',
  '..bb.1.bbPp.',
  '.gGGGGGGGGc.',
  '.GGGGGGGGGcc',
  '..GCCCCCCcc.',
  '..GCCCCCCc..',
  '..gCCCCCCc..',
  '...CCCCCc...',
  '...cccccj...',
];

/** 휴대폰 (6×9) */
export const PHONE: Grid = [
  'oPPPPp',
  'PAhAAp',
  'PhAAAp',
  'PAAAAp',
  'PAAAAp',
  'PAAAap',
  'PaaaAp',
  'PPmmPp',
  'pppppy',
];

/** 파란 책 (11×8): 표지 · 금박 제목 · 종이 */
export const BOOK: Grid = [
  'cgGGGGGGGGG',
  'cgCCCCCCCCc',
  'cCC1111CCCc',
  'cCCCCCCCCCc',
  'cCCCCOCCCCc',
  'jcccccccccj',
  '.PPpPpPpPPp',
  '.ppppppppyy',
];

/** 장바구니 (14×12): 짠 결 · 대파 · 사과 */
export const BASKET: Grid = [
  '...wwwwwB.....',
  '..w...1.Bw....',
  '..w..121Bw....',
  '..w..222lw....',
  '..w...2..w....',
  'uuuuuuuuuuuuuu',
  'WvWWvWWvWWvWWw',
  'WWvWWvWWvWWvWw',
  'WvWWvWWvWWvWWw',
  'WWvWWvWWvWWvWw',
  'WvWWvWWvWWvWWw',
  'wvvvvvvvvvvvvv',
];

/** 아이스크림 (5×11): 초코 위 · 딸기 · 막대 */
export const ICECREAM: Grid = [
  '.AAA.',
  'AAAAa',
  'AaaAa',
  'GCCCc',
  'GCCCc',
  'GCCCc',
  'GCCCc',
  'CCCCc',
  '.ccc.',
  '..W..',
  '..w..',
];

/** 종이별 (5×5) */
export const PAPERSTAR: Grid = [
  '..G..',
  'CCgCC',
  '.CCC.',
  'CcCcC',
  'c...c',
];

/** 테이프 뭉치 (8×6) */
export const TAPE_ROLL: Grid = [
  '.eeTTT..',
  'eTTTTTt.',
  'eTTwwTtt',
  'TTwvvTtt',
  'TTTwTtte',
  '.ttttee.',
];

/** 매직펜 (10×3) */
export const PEN: Grid = [
  'XXXoPPPPPo',
  'XXXPPXXPPX',
  'XXXppppppp',
];

/** 태엽 열쇠 (9×7): 나비 날개 손잡이 */
export const KEY: Grid = [
  '.gG...Gg.',
  'gGcC.GcCc',
  'GcjCcCjcc',
  '.cCcCccc.',
  '...cCc...',
  '....Cc...',
  '...cCc...',
];

/** 하늘색 수건 (12×6): 흰 줄 두 개 */
export const TOWEL: Grid = [
  'gGGGGGGGGGGc',
  'CCCCCCCCCCCc',
  'PPPPPPPPPPPp',
  'CCCCCCCCCCCc',
  'oooooooooooo',
  'cccccccccccj',
];

/** 꽃다발 (11×15): 꽃송이 다섯 · 포장지 고깔 · 빨간 리본 */
export const FLOWERS: Grid = [
  '....33.....',
  '...3331.11.',
  '.22.33111..',
  '2222..11.55',
  '22PPP.5555.',
  '.2PPPl.55..',
  'lBlBBlBlBb.',
  'oPPPPPPPppp',
  '.oPPPPPPpp.',
  '.oPPPPPPpp.',
  '..PRRRRpp..',
  '..oPPPPpp..',
  '...oPPPp...',
  '....oPp....',
  '.....pp....',
];

/** 도시락 주머니 (11×10): 끈 매듭 · 체크무늬 */
export const LUNCHBOX: Grid = [
  '..gPGGGPG..',
  '..GPGGGPc..',
  '..GccCCcc..',
  'gGGGGGGGGGc',
  'GhChhChhChc',
  'GCcCCcCCcCc',
  'GhChhChhChc',
  'GCcCCcCCcCc',
  'GhChhChhChc',
  'cjjjjjjjjjj',
];

/** 반짇고리 (13×9): 파란 실패 · 바늘꽂이 · 금빛 걸쇠 */
export const SEWING: Grid = [
  '..WW...1AAh..',
  '..BB..AAAAa..',
  '..ww...aaa...',
  'gGGGGGGGGGGGc',
  'GGGGGGGGGGGGc',
  'jjjjjjjjjjjjj',
  'CCCCC22CCCCCc',
  'CCCCCCCCCCCCc',
  'cccccccccccjj',
];

/** 꿀사탕 한 알 (11×5): 호박색 알맹이 · 비튼 껍질 */
export const CANDY: Grid = [
  'Pp..gGc..Pp',
  'PPpgGCCcpPp',
  'PoPCCCCcPpp',
  'PPpcCCccpPp',
  'Pp..ccc..Pp',
];

/** 오르골 (12×10): 반쯤 연 뚜껑(안쪽 빨간 천) · 금빛 띠 · 태엽 손잡이 */
export const MUSICBOX: Grid = [
  '.uuuuuuuuw..',
  '.WAAAAAAAw..',
  '.wwwwwwwwv..',
  'uuuuuuuuuw..',
  'uWWWWWWWWw.M',
  'GGGGGGGGGcMM',
  'uWWWWWWWWw.m',
  'uWWWGGWWWw..',
  'uWWWWWWWWw..',
  'wvvvvvvvvv..',
];

/** 끈으로 묶은 꾸러미 (10×8) */
export const PARCEL: Grid = [
  '...A.A....',
  'qqqqAqqqqq',
  'KKKKAKKKKk',
  'KKKKAKKKKk',
  'AAAAaAAAAa',
  'KKKKAKKKKk',
  'KKKKAKKKKk',
  'xxxxaxxxxx',
];

/** 뜯어진 테이프 자락 (16×9): 비스듬히 늘어진 자락 · 말린 끝 · 톱니 끝 · 골판지 보풀 */
export const TORN_TAPE: Grid = [
  'eT..............',
  'tTeTe...........',
  'tTTTTTe.........',
  '.tTPTTTTe.......',
  '..ttTTPTTTe.....',
  '....tttTTTTTeT..',
  '.......tttTTtvTt',
  '..........ttTvtt',
  '............ttt.',
];

/** 엎어 놓은 액자 (13×8): 갈색 테 · 뒷판 · 접힌 받침다리 · 쇠 고정쇠 */
export const PHOTO_DOWN: Grid = [
  '.............',
  'uuuuuuuuuuuuw',
  'uAAAAAMAAAAAv',
  'uhAAwhAAAAAav',
  'uMAAAwhAAAAMv',
  'uhAAAAwhAAAav',
  'uhaaaaaMaaaav',
  'wvvvvvvvvvvvv',
];

/** 뚜껑문 틈 (24×7): 마룻널 사이 가는 틈으로 새는 노란 불빛 (외곽선 없음) */
export const FLOOR_CRACK: Grid = [
  '........................',
  '....5....5....5....5....',
  '.xxx3x3x3x3x3x3x3x3x3xx.',
  'xx111111122222211111xxxx',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.....5....5....5....5...',
  '........................',
];
