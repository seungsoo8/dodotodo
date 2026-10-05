/**
 * 이삿날 소품 (moveProps.ts) 의 손찍기 격자. 글자 뜻은 px/items.ts 와 같다:
 *   Q q K k x 골판지 · . e T t . 테이프 · O o P p y 종이(신문 · 비닐) · . u W w v 나무 · I i M m z 쇠
 *   G g C c j 주된 색 · . h A a s 둘째 색 · . l B b n 셋째 색 · X 먹 · 1~5 포인트 색
 * 크기가 여럿인 것(상자 · 소파 · 책 더미)은 조각 줄 · 열을 되풀이해 늘인다 (moveProps.ts).
 */
import type { Grid } from './grid.ts';

/**
 * 테이프 상자 본 (24×20): 윗면 0~5 줄(4~5 줄 되풀이) · 앞면 6~18 줄(11~14 줄 되풀이) · 오른쪽 옆면 20~22 열.
 * 가로로 늘일 때는 테이프 양옆(2~7 열 · 13~18 열)을 되풀이한다.
 */
export const CARTON: Grid = [
  '.qQqqqqqeTTTtqqqqqqq....',
  '.qqqqqqqeTTTtqqqqqqqk...',
  '.qqqqqqqeTTTtqqqqqqqkk..',
  '.kkkkkkkeTTTtkkkkkkkkkk.',
  '.qqqqqqqeTTTtqqqqqqqkkk.',
  '.qqqqqqqeTTTtqqqqqqqkkk.',
  '.kkkkkkkeTTTtkkkkkkkxkk.',
  '.qKKKKKKeTTTtKKKKKKKxkk.',
  '.qKKKKKKeTTTtKKKKKKKxkk.',
  '.qKKKKKKeTTTtKKKKKKKxkk.',
  '.qKKKKKKkttttKKKKKKKxkk.',
  '.qKKKKKKKKKKKKKKKKKKxkk.',
  '.qKKKKKKKKKKKKKKKKKKxkk.',
  '.qKKKKKKKKKKKKKKKKKKxkk.',
  '.qKKKKKKKKKKKKKKKKKKxkk.',
  '.qKKKKKKKKKKKKKKKKKKxkk.',
  '.qKkKKkKKkKKkKKkKKkKxkk.',
  '.kkkkkkkkkkkkkkkkkkkxkx.',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '........................',
];

/** 열린 상자 윗부분 (24×17): 뒤로 젖힌 덮개 · 양옆 날개 · 어두운 속 · 앞으로 늘어진 덮개. 그 아래에 CARTON 앞면 */
export const CARTON_OPEN_TOP: Grid = [
  '........................',
  '....qQqqqqqqqqqqqqqqq...',
  '....qqqqqqqqqqqqqqqqk...',
  '.k..qqqqqqqqqqqqqqqqk.k.',
  '.kk.qqqqqqqqqqqqqqqqkkk.',
  '.kkkqqqqqqqqqqqqqqqqkkk.',
  '..kkkkkkkkkkkkkkkkkkkk..',
  '..kkxxxxxxxxxxxxxxxxkk..',
  '..xvvvvvvvvvvvvvvvvvvx..',
  '..xvvvvvvvvvvvvvvvvvkx..',
  '..xvvvvvvvvvvvvvvvvkkx..',
  '..xvvvvvvvvvvvvvvvkkkx..',
  '..xvvvvvvvvvvvvvvkkkkx..',
  '..xvvvvvvvvvvvvvkkkkkx..',
  '..xvvvvvvvvvvvvkkkkkkx..',
  '..qQqqqqqqqqqqqqqqqkkx..',
  '..kkkkkkkkkeTTtkkkkkkx..',
];
/** 반쯤 찬 상자에서 삐죽 나온 것: 파란 책 · 수건 · 신문 뭉치 (24×10, 열린 상자 6 줄에 겹친다) */
export const CARTON_HALF_STUFF: Grid = [
  '.....hAAAAh.............',
  '.....AAAAAa.............',
  '.....AAAAAa.Oooooo..oo..',
  '.....AAAAAa.oPPPPp.oPPp.',
  '.....AaaaAa.oPPPPpoPXPPp',
  '.....AAAAAa.oPPPPpPPPXPp',
  '.....AAAAAa.oPPPPpPXPPPp',
  '.....aaaaaa.oPPPPp.pPPp.',
  '............pppppp..pp..',
  '........................',
];

/** 둘둘 만 러그 (48×16): 위가 밝은 눕힌 원기둥 · 금빛 무늬 · 끈 두 줄 · 오른쪽 끝 말린 단면 · 왼쪽 술 */
export const RUG: Grid = [
  '................................................',
  '...........OO...................OO..............',
  '..gggggggggPpgggggggggggggggggggPpggggggggggggc.',
  '.gGGGGGGGGGPpGGGGGGGGGGGGGGGGGGGPpGGGGGGGGGcCCc.',
  'PG1G1GG1GG1Pp1GG1GG1GG1GG1GG1GG1Pp1GG1GG1GcCgCCc',
  '.GGGGGGGGGGPpGGGGGGGGGGGGGGGGGGPpGGGGGGGGcCgjgCc',
  'PCCCCCCCCCCPpCCCCCCCCCCCCCCCCCCPpCCCCCCCCcgjCjgc',
  '.CCCCCCCCCCPpCCCCCCCCCCCCCCCCCCPpCCCCCCCCcgjgjgc',
  'PCCCCCCCCCCPpCCCCCCCCCCCCCCCCCCPpCCCCCCCCcgCjjgc',
  '.CCCCCCCCCCPpCCCCCCCCCCCCCCCCCCPpCCCCCCCCcCgggCc',
  'PccccccccccPpccccccccccccccccccPpcccccccccCCCCCc',
  '.ccccccccccPpccccccccccccccccccPpccccccccccCCCcc',
  'PjjjjjjjjjjPpjjjjjjjjjjjjjjjjjjPpjjjjjjjjjjcccj.',
  '..jjjjjjjjjPpjjjjjjjjjjjjjjjjjjPpjjjjjjjjjjjjj..',
  '...........pp...................pp..............',
  '................................................',
];

/**
 * 비닐 씌운 소파 (72×36): 등받이 · 앉는 면 · 팔걸이 둘 · 나무 발 · 비닐 반짝 줄(O) · 테이프.
 * 넓힐 때는 가운데 열(20~51)을 되풀이한다.
 */
export const SOFA: Grid = [
  '..ggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggc...',
  '..gGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGcc..',
  '..gGGOGGGGGGGGGGGGGGGOGGGGGGGGGGGGGGGGOGGGGGGGGGGGGGGGOGGGGGGGGGGGGGccc.',
  '..CCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCccc.',
  '..CCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCOCCCCCCCCCCCccc.',
  '..CCCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCCOCCCCCCCCCCccc.',
  '..CCCCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCCOCCCCCCCCCccc.',
  '..CCCCCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCOCCCCCCCCCCCCCCCCOCCCCCCCCccc.',
  '..CCCCCCCCCoCCCCCCCCCCCCCCCoCCCCCCCCCCCCCCCoCCCCCCCCCCCCCCCCoCCCCCCCccc.',
  'gggggggCCCCCoCCCCCCCCCCCCCCCoCCCCCCCCCCCCCCCoCCCCCCCCCCCCCCCgggggggggcc.',
  'gGGGGGgcCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCgGGGGGGGcjcc',
  'gGOGGGgcCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCgGGOGGGGcjcc',
  'gGGOGGgcCCCCCCCCCCCCCCCCCCCCCCCCCCeTTTtCCCCCCCCCCCCCCCCCCCCCgGGGOGGGcjcc',
  'gGGGOGgcCCCCCCCCCCCCCCCCCCCCCCCCCCeTTTtCCCCCCCCCCCCCCCCCCCCCgGGGGOGGcjcc',
  'gGGGGOgcggggggggggggggggggggggggggeTTTtggggggggggggggggggggggGGGGGOGcjcc',
  'gGGGGGgcgGGGGGGGGGGGGGGGGGGGGGGGGGeTTTtGGGGGGGGGGGGGGGGGGGGGgGGGGGGOcjcc',
  'gCCCCCgcgGGOGGGGGGGGGGGGGGGOGGGGGGGGGGGGGGGGGGOGGGGGGGGGGGGGgCCCCCCCcjcc',
  'gCCCCCgcgGGGOGGGGGGGGGGGGGGGOGGGGGGGGGGGGGGGGGGOGGGGGGGGGGGGgCCCCCCCcjcc',
  'gCCCCCgcgGGGGOGGGGGGGGGGGGGGGOGGGGGGGGGGGGGGGGGGOGGGGGGGGGGGgCCCCCCCcjcc',
  'gCCCCCgcgGGGGGoGGGGGGGGGGGGGGGoGGGGGGGGGGGGGGGGGGoGGGGGGGGGGgCCCCCCCcjcc',
  'gCCCCCgcgGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgCCCCCCCcjcc',
  'gCCCCCgcgGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgCCCCCCCcjcc',
  'gCCCCCgccccccccccccccccccccccccccccccccccccccccccccccccccccccCCCCCCCcjcc',
  'gCCCCCgcCCOCCCCCCOCCCCCCOCCCCCCOCCCCCCOCCCCCOCCCCCCOCCCCCCOCgCCCCCCCcjcc',
  'gCCCCCgcCCOCCCCCCOCCCCCCOCCCCCCOCCCCCCOCCCCCOCCCCCCOCCCCCCOCgCCCCCCCcjcc',
  'gCCCCCgcCCOCCCCCCOCCCCCCOCCCCCCOCCCCCCOCCCCCOCCCCCCOCCCCCCOCgCCCCCCCcjcc',
  'gCCCCCgcCCOCCCCCCOCCCCCCOCCCCCCOCCCCCCOCCCCCOCCCCCCOCCCCCCOCgCCCCCCCcjcc',
  'gCCCCCgcCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCgCCCCCCCcjcc',
  'gCCCCCgcCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCgCCCCCCCcjcc',
  'oooooooooOoooooooooooooooooOoooooooooooooooooooooooooooooooooooooooooocc',
  'gCCCCCgcCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCgCCCCCCCcjcc',
  'cccccccjcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccjcc',
  'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.',
  '....uWw...........................................................uWwv..',
  '....wvv...........................................................wvvv..',
  '........................................................................',
];

/** 끈으로 묶은 책 한 단 (24×6): 두 권, 위 책은 왼쪽으로 조금 밀림. 끈은 따로 */
export const BOOKS_PAIR: Grid = [
  '..PPPPPPPPPPPPPPPPPPP...',
  '..CCCCCCCCCCCCCCCCCCCcc.',
  '..cccccccccccccccccccjc.',
  '...PPPPPPPPPPPPPPPPPPP..',
  '...AAAAAAAAAAAAAAAAAAAaa',
  '...aaaaaaaaaaaaaaaaaaasa',
];
/** 책 더미 끈 매듭 (24×4) · 끈 한 줄 */
export const BOOKS_KNOT: Grid = [
  '.........uWWWw..........',
  '..........uWw...........',
  '...........W............',
  '...........W............',
];
export const BOOKS_STRING: Grid = ['..uuuuuuuuuWwwwwwwwwwww.'];

/** 세운 뽁뽁이 두루마리 (24×26): 둥근 윗단면 · 공기 방울 · 풀린 자락 */
export const BUBBLE: Grid = [
  '........................',
  '........................',
  '........gGGGGGGc........',
  '.....ggGGGGGGGGGGcc.....',
  '....gGGGGGCcCGGGGGGc....',
  '....gGGGGGGCGGGGGGcc....',
  '....oOGGOGGGGOGGGGcc....',
  '....oOGgGGOGGgGGOGcc....',
  '....oOGGGgGGGGgGGGcc....',
  '....oOGOGGGOGGGOGgcc....',
  '....oOGgGGGgGGGgGGcc....',
  '....oOGGGOGGGOGGGOcc....',
  '....oOGOGgGGOgGGOgcc....',
  '....oOGgGGGgGGGgGGcc....',
  '....oOGGGOGGGOGGGgcc....',
  '....oOGOGgGGOgGGOGcc....',
  '....oOGgGGGgGGGgGGcc....',
  '....oOGGGOGGGOGGGOcc....',
  '....oOGOGgGGOgGGOgcc....',
  '....oOGgGGGgGGGgGGcGGGG.',
  '....oOGGGOGGGOGGGOcGOGGc',
  '....oOGOGgGGOgGGOgcGgOGc',
  '....oOGgGGGgGGGgGGcGGGcc',
  '....ccccccccccccccccccc.',
  '....jjjjjjjjjjjjjjjjjj..',
  '........................',
];

/** 신문지에 싼 그릇 셋 (24×18) */
export const DISHES: Grid = [
  '........................',
  '..........ooPPp.........',
  '........oPPPXPPPp.......',
  '.......oPPXPPPPPPp......',
  '.......PPPPPPXXPPPp.....',
  '.......PPXPPPPPPPpp.....',
  '..ooPPpPPPPPXPPpppPPPp..',
  '.oPPPPPPpPPPPpppoPPPPPp.',
  'oPPXXPPPPpppppPoPPPXPPPp',
  'oPPPPPPPPPpPPPoPPPPPPPPp',
  'PPPPPXPPPPppPPPPPXXPPPPp',
  'PPXPPPPPXPPpPPPPPPPPPXpp',
  'PPPPPPPPPPPpPPXPPPPPPPpp',
  'pPPPPXXPPPpppPPPPPXPPppp',
  '.pPPPPPPPpp..pPPPPPPppp.',
  '..pppppppp....pppppppp..',
  '..yyyyyyyyyyyyyyyyyyyy..',
  '........................',
];

/** 개켜 놓은 커튼 (24×14): 주름 세 층 · 놋쇠 고리 */
export const CURTAIN: Grid = [
  '....1..1..1.............',
  '...1.11.11.1............',
  '....1..1..1.............',
  '....gGGGGGGGGGGGGGGc....',
  '....CCcCCCcCCCcCCCCcc...',
  '....jjjjjjjjjjjjjjjjj...',
  '...gGGGGGGGGGGGGGGGGc...',
  '...CCCcCCCcCCCcCCCcCcc..',
  '...jjjjjjjjjjjjjjjjjjj..',
  '..gGGGGGGGGGGGGGGGGGGc..',
  '..CCCCcCCCcCCCcCCCcCCcc.',
  '..CCcCCCcCCCcCCCcCCCCcc.',
  '..jjjjjjjjjjjjjjjjjjjjj.',
  '........................',
];

/** 묶은 쓰레기봉투 (24×24): 묶은 귀 · 둥근 몸 · 비닐 반짝 */
export const TRASHBAG: Grid = [
  '.......gG.....Gc........',
  '........gG...Gc.........',
  '.........gGGGc..........',
  '..........CCc...........',
  '.........gGGc...........',
  '......ggGGGCCCcc........',
  '....ggGGGCCCCCCCcc......',
  '...gGGGCCCCCCCCCCcc.....',
  '..gGGCCCCCCCCCCCCCcc....',
  '..gGOCCCCCCCCCCCCCCcc...',
  '.gGGCOCCCCCCCCCCCCCcc...',
  '.gGCCCOCCCCCCCCCCCCccc..',
  '.gGCCCCOCCCCCCCCCCCccc..',
  '.GCCCCCCCCCCCCCCCCCccc..',
  '.GCCCCCCCCCCCCCCCCcccc..',
  '.CCCCCCCCCCCCCCCCCcccc..',
  '.CCCCCCCCCCCCCCCCccccj..',
  '.cCCCCCCCCCCCCCCcccccj..',
  '..cCCCCCCCCCCCCccccjj...',
  '..ccccccccccccccccjj....',
  '...cccccccccccccjjj.....',
  '.....jjjjjjjjjjjj.......',
  '........................',
  '........................',
];

/** 괘종시계 (24×64): 박공 지붕 · 놋쇠 테 시계판(12, 15) · 추 창(30~51) · 받침. 바늘 · 추는 render 가 그린다 */
export const GRANDCLOCK: Grid = [
  '...........uw...........',
  '.........uuWWww.........',
  '.......uuWWWWWWww.......',
  '.....uuWWWWWWWWWWww.....',
  '...uuWWWWWWWWWWWWWWww...',
  '..uuuuuuuuuuuuuuuuuuuwv.',
  '..wvvvvvvvvvvvvvvvvvvvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWWWW1111111WWWWWwvv.',
  '..uWWWW112222211WWWWwvv.',
  '..uWWW12PPPPPPP21WWWwvv.',
  '..uWW12PPPPXPPPP21WWwvv.',
  '..uWW1PPPPPPPPPPP1WWwvv.',
  '..uW12PPPPPPPPPPP21WwvW.',
  '..uW1PPPPPPPPPPPPP1Wwvv.',
  '..uW1PXPPPPPPPPPXP1Wwvv.',
  '..uW1PPPPPPPPPPPPP1Wwvv.',
  '..uW12PPPPPPPPPPP21Wwvv.',
  '..uWW1PPPPPPPPPPP1WWwvv.',
  '..uWW12PPPPXPPPP21WWwvv.',
  '..uWWW12PPPPPPP21WWWwvv.',
  '..uWWWW112222211WWWWwvv.',
  '..uWWWWW1111111WWWWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..wwwwwwwwwwwwwwwwwwwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWsssssssssssssWWwvv.',
  '..uWWsaaaaaaaaaaasWWwvv.',
  '..uWWsAssssssssssWWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsAsssssssssssWWwvv.',
  '..uWWsssssssssssssWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..wwwwwwwwwwwwwwwwwwwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '..uWWWWWWWWWWWWWWWWWwvv.',
  '.uuuuuuuuuuuuuuuuuuuuuw.',
  '.uWWWWWWWWWWWWWWWWWWWww.',
  '.uWWWWWWWWWWWWWWWWWWWww.',
  '.wwwwwwwwwwwwwwwwwwwwwv.',
  '..vvv..............vvv..',
  '........................',
];

// ───────────────────────── 납작한 것 (24×24) ─────────────────────────

/** 바닥에 붙은 테이프 조각 · 말린 조각 */
export const TAPE_BIT: Grid = [
  '.....eT.................',
  '.....tTTe...............',
  '......tTTTe.............',
  '.......tTTTTe...........',
  '.........tTTTe..........',
  '...........ttT.....eTT..',
  '..................eTvTt.',
  '..................tTTt..',
];

/** 굴러다니는 매직펜 · 따로 떨어진 뚜껑 */
export const MARKER: Grid = [
  '..........XXX...........',
  '.......oPPXXX...........',
  '....oPPPPPPPp...........',
  '.XXPPPPAAPPpp......XX...',
  'XXXPPPPPPPpp......XXXX..',
  'XXpppppppp.........XX...',
  '.yyyyyyyy...............',
];

/** 상자를 끌고 간 두 줄 긁힘 (48×10) */
export const DRAG: Grid = [
  '..CCCCcCCCCCcCCCCCCc.CCCCcCCC.CCCc..CC.C...c.C..',
  '..........................................C.....',
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '................................................',
  '..CCCCCcCCCCCCcCCCCcCCCCC.CCCCcC.CCC..CcC..C....',
  '...........................................C..C.',
  '................................................',
];

/** 바닥의 신문지 한 장 (24×16): 접힌 금 · 제목 띠 · 글 줄 */
export const NEWS: Grid = [
  '..............ooPPPp....',
  '........ooPPPPPPPPPPp...',
  '..ooPPPPPPPPPPPPPPPPp...',
  '.oPXXXXXXXPPPPPPPPPPp...',
  '.oPXXXXXXXPPPPPPPPPPpp..',
  '.oPPPPPPPPPPPPPPPPPPPp..',
  '.oPAPAAPAPAAPPAAPAPAp...',
  '.oPPPPPPPPPPPPPPPPPPPp..',
  '.oPAAPAAPAPPAAPAAPPApp..',
  '.oPPPPPPPPPPPPPPPPPPPp..',
  '.oPAPAAPAAPAPAAPAAPAPp..',
  '.pPPPPPPPPPPPPPPPPPPPp..',
  '.pPAAPAPAAPAAPAPAAPApp..',
  '..pPPPPPPPPPPPPPPPPPPp..',
  '..ppppppppppppppppppppp.',
  '........................',
];

/** 슬리퍼 한 짝 (위에서 비스듬히): 바닥창 · 발등 띠 */
export const SLIPPER: Grid = [
  '.....OOOOOO.......',
  '...GGGGGGGGGc.....',
  '..gGOOGGGGGGCc....',
  '.gGGGGGGGGGCCCc...',
  '.gGGGGGGCCCCcCCcc.',
  'aCCCCCCCCCCCCCcCca',
  'aaCCCCCCCCCCCCCCaa',
  '.aaaaaaaaaaaaaaaa.',
  '...ssssssssssss...',
];

/** 동전 · 작은 동전 */
export const COIN: Grid = [
  '..gGGc....',
  '.gGOGGc...',
  '.GGGCCc...',
  '.cCCCcj...',
  '..jjjj.iMm',
  '.......Mmz',
];
/** 단추 · 실밥 */
export const BUTTON: Grid = [
  '.........PP',
  '..gGGc..P..',
  '.gGjGjcP...',
  '.GCCCCc....',
  '.CCjCjc....',
  '..ccjj.....',
];
/** 머리끈 (고리 · 방울) */
export const HAIRBAND: Grid = [
  '.....CCC.gG',
  '...CC...CGc',
  '..C......c.',
  '..C......C.',
  '...cc...cc.',
  '.....ccc...',
];
/** 액자 자국의 못 (못 머리 · 못 그늘) */
export const NAIL: Grid = ['I.', 'Mz'];
