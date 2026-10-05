/**
 * 갈래 D 배치: 13장 베란다 · 14장 소파 밑(근접) · 15장 비 오는 마당 · 16장 골목 끝 놀이터.
 * 사람 크기 지도(houseMap)는 칸 24px = 장난감 한 걸음, 사람 키 두 칸. 바깥은 담 · 대문 · 도랑 · 화분 같은 실물 가장자리로 두른다.
 * 소파 밑은 책상 위(ch5)처럼 장난감 눈높이 근접 지도 (거대한 소품 · 낮은 천장).
 * 장 파일(ch_balcony · ch_sofa · ch8 · ch_outside)은 여기 배치에 놀이 · 기억 · 대본을 얹는다.
 */
import type { Furniture, Pt, Rect, RoomDef } from '../types.ts';
import { grid, houseMap, type HouseFurn, type HouseSpec } from './kit.ts';

const f = (kind: string, x: number, y: number, w = 1, h = 1, more: Partial<HouseFurn> = {}): HouseFurn => ({ kind, x, y, w, h, ...more });
const solid = (kind: string, x: number, y: number, w = 1, h = 1): HouseFurn => f(kind, x, y, w, h, { solid: true });

// ───────────────────────── 13장 · 베란다 (04:20, 바람) ─────────────────────────
//
//   거실 끝 (x1~6) │ 미닫이 문턱 (7, 8~9) │ 베란다 (x8~32)
//   y0~2  베란다 바깥 창 + 난간 (열린 창 둘: x16~18 · x24~27 → 그 앞이 바람 길)
//   x9~15  세탁기 · 빨래집게 통 · 수도꼭지와 물뿌리개 · 「거실」 상자 (액자)
//   x16~18 바람 길 1 (빨래 그늘 (17,7))   x19~23 빨래 건조대 · 집순이 집돌이 · 신문지 더미
//   x24~27 바람 길 2 (수건 그늘 (25~26,9))   x28~32 고추 · 상추 화분 열 · 「하루 꽃」 · 할머니 접이 의자
export const BALCONY_W = 34;
export const BALCONY_H = 13;
/** 바람 길: 열린 창 앞 칸 (왼쪽 = 거실 쪽으로 밀려난다) */
export const BALCONY_WIND1: Rect = [16, 3, 3, 9];
export const BALCONY_WIND2: Rect = [24, 3, 4, 9];
export const BALCONY_SHELTER1: Pt[] = [[17, 7]];
export const BALCONY_SHELTER2: Pt[] = [[25, 9], [26, 9]];
/** 「하루 꽃」 화분 자리 (막힘) · 물을 붓는 자리 */
export const HARU_FLOWER: Pt = [31, 5];
export const HARU_FLOWER_WATER: Pt = [31, 6];

export function balconySpec(): HouseSpec {
  return {
    id: 'balcony',
    name: '베란다',
    w: BALCONY_W,
    h: BALCONY_H,
    rooms: [
      { id: 'living', rect: [1, 0, 6, 12], look: 'living' },
      { id: 'veranda', rect: [8, 0, 25, 12], look: 'balcony' },
    ],
    doors: [{ between: ['living', 'veranda'], at: 8, w: 2 }],
    furniture: [
      // ── 거실 끝: 떼어 낸 가족사진 자국 · 괘종시계 · 이삿짐 (그 사진은 베란다 「거실」 상자 속)
      f('frameGhost:wide', 2, 1, 2, 1),
      f('window:night', 4, 0, 3, 2),
      solid('grandClock', 6, 3),
      solid('curtainPile', 1, 3),
      solid('rolledRug', 2, 4, 2, 1),
      solid('bookTied:2', 5, 4),
      solid('cartonL:거실', 1, 10, 2, 1),
      solid('cartonM:깨짐주의', 1, 9),
      solid('cartonS:책', 5, 11),
      f('tapeBit', 3, 7),
      f('markerPen', 2, 6),
      f('dragMarks', 3, 10, 2, 1),
      f('newsSheet', 4, 5),
      // ── 베란다 바깥 창: 하늘 · 별 · 이웃집 지붕 · 전깃줄, 아래는 난간 (열린 창 둘)
      f('balconyWin', 8, 0, 4, 3),
      f('balconyWin', 12, 0, 4, 3),
      f('balconyWin:open', 16, 0, 4, 3),
      f('balconyWin', 20, 0, 4, 3),
      f('balconyWin:open', 24, 0, 4, 3),
      f('balconyWin', 28, 0, 4, 3),
      f('balconyWin', 32, 0, 1, 3),
      // ── 세탁기 · 빨래집게 통 · 수도꼭지 · 「거실」 상자
      solid('washer', 9, 3, 2, 1),
      solid('pegTub', 11, 3),
      solid('faucet', 12, 3),
      solid('cartonL:거실', 14, 3, 2, 1),
      solid('cartonOpen', 8, 3),
      solid('bookTied:1', 8, 10),
      solid('bubbleWrap', 13, 11),
      solid('trashBag', 15, 11),
      solid('dishWrap', 19, 11),
      f('markerPen', 25, 5),
      f('tapeBit', 26, 11),
      f('newsSheet', 9, 11),
      f('slipper', 11, 9),
      f('slipper:blue', 12, 10),
      f('tapeBit', 13, 7),
      f('dustpan', 14, 10),
      // ── 바람 길 1: 펄럭이는 빨래 (그 밑 한 칸이 그늘)
      f('laundry', 16, 7, 3, 1, { over: true }),
      f('coin', 18, 4),
      // ── 빨래 건조대 · 신문지 더미 (졸업 꽃다발)
      solid('dryingRack', 19, 3, 4, 1),
      solid('bookTied:3', 23, 10),
      f('newsSheet', 22, 11),
      f('gloves', 20, 10),
      f('hairBand:yellow', 19, 7),
      // ── 바람 길 2: 접이 의자에 걸친 수건 (그늘)
      f('laundry:towel', 25, 9, 2, 1, { over: true }),
      f('button', 27, 5),
      // ── 화분 열 · 하루 꽃 · 할머니 의자
      solid('pots', 28, 3, 4, 1),
      solid('haruFlower', HARU_FLOWER[0], HARU_FLOWER[1]),
      solid('chairFold', 32, 9),
      solid('pots', 29, 11, 2, 1),
      f('tapeBit', 29, 7),
      // ── 앞쪽 가림막: 화분 잎 실루엣 · 거실 쪽 상자
      f('pots', 20, 12, 2, 1, { fg: true }),
      f('cartonL:거실', 1, 12, 2, 1, { fg: true }),
    ],
    start: [4, 8],
    music: 'night',
    // 별빛 (열린 창 두 곳) · 이웃집 창 불빛 하나 · 괘종시계 옆 거실 불 꺼진 어둠
    beams: [
      { x: 16, w: 4, h: 8, slant: 1 },
      { x: 24, w: 4, h: 8, slant: 1 },
    ],
    lights: [
      { at: [10, 1], r: 46, color: [255, 214, 150], k: 0.4 },
      { at: [31, 5], r: 40, color: [200, 220, 255], k: 0.3 },
    ],
    ambient: [104, 110, 168],
  };
}

// ───────────────────────── 14장 · 소파 밑 (근접, 04:25) ─────────────────────────
//
//   y0~2  거대한 걸레받이 · 콘센트 (뒷벽)   x0 · x39 소파 옆판   y19 술 장식 너머 거실 (막힘)
//   소파 다리 넷 (2~3,3~4) (35~36,3~4) (2~3,16~17) (35~36,16~17)
//   A x1~13  들어오는 곳 → 루루의 아지트 (성냥갑 보물 상자, 뒤 왼쪽 다리 곁)
//   B x14~22 TV 빛 줄무늬가 술 장식 틈으로 쓸고 가는 마루 (동전 탑 그림자에 숨는다)
//   x24~26   위쪽 통로 (아빠가 뒤척이면 천장이 내려앉음: 보리는 못 지나감) · 아래쪽 통로 (병뚜껑으로 막힘)
//   x27      이쑤시개 울타리 (문 두 곳: (27,6) 위 · (27,15) 아래)
//   C x28~38 동전 마을 (백원 할배 · 동전 탑) · 가장 깊은 곳 (노란 우산 끝)
export const SOFA_W = 40;
export const SOFA_H = 20;
/** 아빠가 뒤척이면 내려앉는 천장 (위쪽 통로) */
export const SOFA_LOW: Rect = [24, 3, 3, 9];
/** 이쑤시개 울타리의 문 */
export const SOFA_GATE_UP: Pt = [27, 6];
export const SOFA_GATE_DOWN: Pt = [27, 15];

export function sofaTiles(): string[] {
  return grid(SOFA_W, SOFA_H, 'w', 'H', [
    ['W', 0, 0, SOFA_W, 3],
    // 소파 다리
    ['H', 2, 3, 2, 2],
    ['H', 35, 3, 2, 2],
    ['H', 2, 16, 2, 2],
    ['H', 35, 16, 2, 2],
    // A: 루루의 보물 상자 (성냥갑) · 과자 부스러기 언덕 · 리모컨 · 먼지 뭉치
    ['H', 5, 3, 2, 2],
    ['H', 1, 8, 2, 2],
    ['H', 7, 10, 4, 2],
    ['H', 11, 14, 2, 1],
    ['H', 9, 6, 1, 1],
    // B: 동전 탑 (그림자) · 레고
    ['H', 16, 9, 1, 1],
    ['H', 20, 6, 1, 1],
    ['H', 21, 14, 1, 1],
    ['H', 15, 16, 1, 1],
    // 위 · 아래 통로를 가르는 아빠 양말 더미
    ['H', 24, 12, 3, 1],
    // 이쑤시개 울타리 (문 둘)
    ['H', 27, 3, 1, 16],
    ['w', SOFA_GATE_UP[0], SOFA_GATE_UP[1], 1, 1],
    ['w', SOFA_GATE_DOWN[0], SOFA_GATE_DOWN[1], 1, 1],
    // C: 동전 마을 — 단추 집 · 병뚜껑 · 과자 언덕 · 빨대
    ['H', 30, 4, 2, 1],
    ['H', 31, 13, 2, 2],
    ['H', 37, 9, 2, 1],
    ['H', 29, 17, 3, 1],
    ['H', 37, 15, 2, 1],
  ]);
}

/** 거대한 소품 (장난감 눈높이) */
export const SOFA_FURNITURE: Furniture[] = [
  // 뒷벽: 걸레받이 · 콘센트
  { kind: 'skirtBoard', x: 0, y: 0, w: 8, h: 3 },
  { kind: 'skirtBoard', x: 8, y: 0, w: 8, h: 3 },
  { kind: 'skirtBoard:outlet', x: 16, y: 0, w: 8, h: 3 },
  { kind: 'skirtBoard', x: 24, y: 0, w: 8, h: 3 },
  { kind: 'skirtBoard', x: 32, y: 0, w: 8, h: 3 },
  // 소파 다리 넷
  { kind: 'sofaLeg', x: 2, y: 3, w: 2, h: 2 },
  { kind: 'sofaLeg', x: 35, y: 3, w: 2, h: 2 },
  { kind: 'sofaLeg', x: 2, y: 16, w: 2, h: 2 },
  { kind: 'sofaLeg', x: 35, y: 16, w: 2, h: 2 },
  // A
  { kind: 'matchbox', x: 5, y: 3, w: 2, h: 2 },
  { kind: 'crumbHill', x: 1, y: 8, w: 2, h: 2 },
  { kind: 'remoteGiant', x: 7, y: 10, w: 4, h: 2 },
  { kind: 'dustBunny', x: 11, y: 14, w: 2, h: 1 },
  { kind: 'buttonGiant', x: 9, y: 6, w: 1, h: 1 },
  { kind: 'hairTie', x: 12, y: 4, w: 1, h: 1 },
  { kind: 'candyWrap', x: 5, y: 13, w: 1, h: 1 },
  // B: 동전 탑 · 레고 · 구슬
  { kind: 'coinGiant:stack', x: 16, y: 9, w: 1, h: 1 },
  { kind: 'coinGiant:stack', x: 20, y: 6, w: 1, h: 1 },
  { kind: 'lego', x: 21, y: 14, w: 1, h: 1 },
  { kind: 'marble', x: 15, y: 16, w: 1, h: 1 },
  { kind: 'candyWrap', x: 21, y: 9, w: 1, h: 1 },
  // 양말 더미 · 이쑤시개 울타리
  { kind: 'sock', x: 24, y: 12, w: 3, h: 1 },
  { kind: 'toothpicks', x: 27, y: 3, w: 1, h: 3 },
  { kind: 'toothpicks', x: 27, y: 7, w: 1, h: 4 },
  { kind: 'toothpicks', x: 27, y: 11, w: 1, h: 4 },
  { kind: 'toothpicks', x: 27, y: 16, w: 1, h: 3 },
  // C: 동전 마을
  { kind: 'buttonGiant:house', x: 30, y: 4, w: 2, h: 1 },
  { kind: 'crumbHill', x: 31, y: 13, w: 2, h: 2 },
  { kind: 'straw', x: 37, y: 9, w: 2, h: 1 },
  { kind: 'bottleCap', x: 29, y: 17, w: 3, h: 1 },
  { kind: 'coinGiant:10', x: 34, y: 14, w: 1, h: 1 },
  { kind: 'dustBunny', x: 37, y: 15, w: 2, h: 1 },
  // 천장 (윗층): 소파 바닥 천 가장자리 · 튀어나온 용수철
  { kind: 'sofaBottom', x: 0, y: 3, w: 20, h: 1, over: true },
  { kind: 'sofaBottom', x: 20, y: 3, w: 20, h: 1, over: true },
  { kind: 'spring', x: 12, y: 8, w: 1, h: 1, over: true },
  { kind: 'spring', x: 25, y: 6, w: 1, h: 1, over: true },
  { kind: 'spring', x: 33, y: 11, w: 1, h: 1, over: true },
  // 앞쪽: 술 장식 (가림막) 사이로 거실 바닥과 TV 빛
  { kind: 'fringe', x: 0, y: 19, w: 8, h: 1, fg: true },
  { kind: 'fringe', x: 8, y: 19, w: 8, h: 1, fg: true },
  { kind: 'fringe:gap', x: 16, y: 19, w: 8, h: 1, fg: true },
  { kind: 'fringe', x: 24, y: 19, w: 8, h: 1, fg: true },
  { kind: 'fringe', x: 32, y: 19, w: 8, h: 1, fg: true },
];

// ───────────────────────── 15장 · 비 오는 마당 (04:30, 물길) ─────────────────────────
//
//   y0~2   집 뒷벽 (처마 · 부엌 창 · 고양이 문) · 이웃 담
//   (3~18, 3~4) 툇마루 (높이 1, 앞면 5줄) — 댓돌 (12,5) 로 오르내림
//   (19,5) 처마 홈통 낙숫물 → 물길 (19, 5~12) → 오른쪽 (20~21,12): (21,12) 돌담 틈 웅덩이 (덤불 쪽 길을 막는다)
//                              → 왼쪽 (14~18, 8): (14,8) 고무 대야
//   (21, 9~17) · (21~30, 9) 낮은 돌담 — 덤불 쪽은 돌담 틈 (21,12) 으로만
//   왼쪽 아래 꽃밭 · 돌담 (개굴 형)   오른쪽 아래 큰 덤불 (24~29, 13~14), 그 밑 (22~30, 15~17)
export const YARD_W = 32;
export const YARD_H = 20;
export const YARD_SOURCE: Pt = [19, 5];
export const YARD_CHANNEL: Rect[] = [[19, 5, 1, 8], [20, 12, 2, 1], [14, 8, 5, 1]];
/** 웅덩이: 0 고무 대야 (차야 함) · 1 돌담 틈 (말라야 함) */
export const YARD_POOLS: Pt[] = [[14, 8], [21, 12]];
export const YARD_BRICK: Pt = [17, 11];
export const YARD_STEP: { low: Pt; high: Pt } = { low: [12, 6], high: [12, 4] };

export function yardSpec(): HouseSpec {
  const wallCol = (x: number, y0: number, y1: number, skip: number): HouseFurn[] => {
    const out: HouseFurn[] = [];
    for (let y = y0; y <= y1; y++) if (y !== skip) out.push(solid('stonewall', x, y));
    return out;
  };
  return {
    id: 'yard',
    name: '비 오는 마당',
    w: YARD_W,
    h: YARD_H,
    rooms: [{ id: 'yard', rect: [1, 0, 30, 19], look: 'yardNight', raised: [[3, 3, 16, 2]] }],
    furniture: [
      // ── 집 뒷벽 (부엌 · 고양이 문) · 이웃 담
      f('facade', 1, 0, 18, 3),
      f('nwall:low', 19, 0, 12, 3),
      f('eaves', 1, 3, 19, 1, { over: true }),
      f('downspout', 19, 3, 1, 2),
      // ── 툇마루 위: 장화 · 우산꽂이 · 「부엌」 상자 · 비 들이친 걸레
      solid('boots', 3, 3),
      solid('umbrellaStand', 17, 3),
      solid('cartonM:부엌', 15, 3),
      f('tapeBit', 9, 4),
      solid('daetdol', YARD_STEP.low[0], 5),
      f('slipper', 11, 6),
      f('slipper', 13, 6),
      // ── 장독대 · 수돗가 · 고무 대야
      solid('crocks', 23, 3, 5, 1),
      solid('tree', 30, 3),
      solid('faucet:yard', 13, 7),
      f('tub', 14, 8),
      // ── 빨랫줄 (빈 집게) · 웅덩이 · 세발자전거
      f('clothesline', 2, 7, 9, 1, { over: true }),
      f('puddle', 8, 10, 2, 1),
      f('puddle', 3, 6, 2, 1),
      f('puddle', 16, 15, 2, 1),
      solid('tricycle', 16, 13, 2, 1),
      // ── 할아버지가 매던 그네 기둥 흔적
      solid('swing', 23, 6, 3, 2),
      // ── 꽃밭 · 낮은 돌담 (왼쪽 아래)
      solid('flowers', 2, 13, 4, 1),
      solid('flowers', 2, 17, 5, 1),
      solid('stonewall', 7, 12, 4, 1),
      solid('flowers', 7, 15, 3, 1),
      f('snail', 6, 14),
      solid('shrub', 1, 14, 1, 2),
      solid('pots', 12, 13, 2, 1),
      f('puddle', 9, 17, 2, 1),
      solid('plant', 14, 16),
      // ── 덤불 쪽 담: 돌담 줄 · 돌담 기둥 (틈 (21,12) 은 웅덩이)
      solid('stonewall', 21, 9, 10, 1),
      ...wallCol(21, 10, 17, 12),
      solid('shrub', 24, 13, 3, 2),
      solid('shrub', 27, 13, 3, 2),
      f('mud', 22, 15, 3, 2),
      f('puddle', 28, 11, 2, 1),
      // ── 앞 담장 · 파란 대문 (이삿짐 트럭 바퀴 자국은 대문 밖)
      solid('stonewall', 1, 18, 11, 1),
      solid('gate', 12, 17, 3, 2),
      solid('stonewall', 15, 18, 16, 1),
      f('pots', 1, 18, 3, 1, { fg: true }),
      f('bush', 26, 18, 4, 1, { fg: true }),
    ],
    start: [2, 4],
    music: 'rain',
    rain: true,
    lights: [
      // 처마 밑 전등 · 부엌 창 불빛 (엄마가 켜 둔)
      { at: [10, 3], r: 70, color: [255, 210, 150], k: 0.55 },
      { at: [6, 2], r: 40, color: [255, 220, 160], k: 0.35 },
    ],
    ambient: [78, 88, 128],
  };
}

// ───────────────────────── 16장 · 골목 끝 놀이터 (04:35, 고양이 · 가로등 · 그네) ─────────────────────────
//
//   골목 (x1~30): 위 띠 = 이웃 담 · 하루네 파란 대문 (6~8) · 담 · 구멍가게 (14~20) · 담
//     가로등 1 (5,3) · 전봇대 (13,3) · 주차된 차 (9~12, 8~9 밑으로 숨음) · 우유 상자 (15,11) · 화분 열 (1~4,17)
//     하수구 도랑 (23, 4~18) — 루루 밧줄 (22,10)→(23,10)   큰길 쪽 횡단보도 (3~5, 17~18)
//     도랑 너머 (24~30) 가로등 2 (28,4) · 버스 정류장 (26~27,16)
//   놀이터 (x32~48): 울타리 틈 (31,10) · 미끄럼틀 · 벤치 · 가로등 3 (42,3) · 그네 (44~47,3) · 모래밭 · 시소 · 정글짐 · 벤치
export const OUT_W = 50;
export const OUT_H = 20;
export const OUT_DITCH_X = 23;
export const OUT_GAP: { at: Pt; tile: Pt } = { at: [22, 10], tile: [23, 10] };
export const OUT_CAR: Rect = [9, 8, 4, 2];
export const OUT_HIDE: Pt[] = [[15, 11], [2, 16], [19, 5], [8, 4]];
/** 어두운 곳 (나비 등불이 닳는다): 도랑 너머 골목 · 놀이터 */
export const OUT_DARK: Rect[] = [[24, 1, 7, 18], [32, 1, 17, 18]];
/** 등불이 차는 가로등 밑 */
export const OUT_LAMPS: Pt[] = [[5, 4], [28, 5], [42, 4]];

export function outsideSpec(): HouseSpec {
  const ditch: HouseFurn[] = [];
  for (let y = 3; y <= 18; y++) ditch.push(solid('ditch', OUT_DITCH_X, y));
  return {
    id: 'outside',
    name: '골목 끝 놀이터',
    w: OUT_W,
    h: OUT_H,
    rooms: [
      { id: 'alley', rect: [1, 0, 30, 19], look: 'alley', wallH: 1 },
      { id: 'park', rect: [32, 0, 17, 19], look: 'playground', wallH: 1 },
    ],
    doors: [{ between: ['alley', 'park'], at: 10 }],
    furniture: [
      // ── 골목 위 띠: 담 · 하루네 파란 대문 · 구멍가게 (셔터) · 담
      solid('nwall:red:ivy', 1, 1, 5, 2),
      solid('gate', 6, 1, 3, 2),
      solid('nwall:blue', 9, 1, 5, 2),
      solid('shop', 14, 1, 7, 3),
      solid('nwall:red', 21, 1, 10, 2),
      // 가로등 1 · 전봇대 · 평상 · 쓰레기봉투 · 자전거
      solid('lamp', 5, 3),
      solid('pole:l7r7', 13, 3),
      solid('bench', 18, 4, 2, 1),
      solid('trashBag', 21, 3),
      solid('trashBag', 22, 3),
      f('flyer', 12, 5),
      f('flyer', 20, 7),
      // 숨을 곳: 주차된 차 (밑) · 우유 상자 · 화분 뒤
      f('car', OUT_CAR[0], OUT_CAR[1], OUT_CAR[2], OUT_CAR[3], { under: true }),
      f('milkCrate', 15, 11),
      solid('pots', 1, 17, 4, 1),
      f('catBowl', 7, 6),
      f('vinylBag', 17, 14),
      f('puddle', 18, 11, 2, 1),
      f('puddle', 6, 13),
      f('coin:10', 14, 16),
      solid('mailbox', 9, 3),
      solid('plant', 1, 6),
      solid('plant', 1, 12),
      solid('pots', 11, 17, 3, 1),
      solid('bike', 18, 17, 2, 1),
      solid('trashBag', 21, 17),
      solid('cartonOpen', 20, 17),
      f('puddle', 3, 12, 2, 1),
      f('flyer', 4, 9),
      f('vinylBag', 7, 13),
      f('tapeBit', 16, 8),
      // 큰길 쪽: 찻길 · 횡단보도
      f('road', 5, 17, 6, 2),
      f('crosswalk', 6, 17, 3, 2),
      // 하수구 도랑 (루루 밧줄을 걸면 (23,10) 이 다리가 된다)
      ...ditch,
      // 도랑 너머: 가로등 2 · 버스 정류장 · 우유 상자 쌓음
      solid('lamp', 28, 4),
      solid('busstop', 26, 16, 2, 1),
      solid('milkCrate:stack', 29, 9),
      f('flyer', 25, 12),
      // ── 놀이터: 나무 · 미끄럼틀 · 벤치 · 가로등 3 · 그네 · 모래밭 · 시소 · 정글짐 · 벤치 · 덤불
      solid('tree', 33, 1),
      solid('tree', 47, 1),
      solid('slide', 34, 3, 3, 2),
      solid('bench', 39, 3, 2, 1),
      solid('lamp', 42, 3),
      solid('swingset', 44, 3, 4, 1),
      f('sandbox', 36, 8, 5, 3),
      f('sandCastle', 38, 9),
      solid('seesaw', 34, 14, 3, 1),
      solid('jungle', 44, 10, 3, 2),
      solid('bench', 40, 16, 2, 1),
      solid('bush', 46, 16, 2, 2),
      f('slipper:blue', 43, 14),
      solid('tree', 47, 9),
      solid('bush', 32, 17, 2, 1),
      f('catBowl', 33, 6),
      f('vinylBag', 44, 15),
      // 윗층: 골목을 가로지르는 전깃줄
      f('wires', 1, 5, 30, 1, { over: true }),
      // 앞쪽 가림막: 주차 자전거 · 덤불 실루엣
      f('bike:#5a9ad8', 15, 19, 2, 1, { fg: true }),
      f('bush', 37, 19, 3, 1, { fg: true }),
    ],
    start: [7, 3],
    music: 'night',
    lights: [
      { at: [5, 3], r: 110, color: [255, 214, 150], k: 0.65 },
      { at: [28, 4], r: 84, color: [255, 214, 150], k: 0.55 },
      { at: [42, 3], r: 110, color: [255, 214, 150], k: 0.65 },
      { at: [17, 2], r: 60, color: [170, 210, 255], k: 0.35 },
    ],
    ambient: [60, 66, 112],
  };
}

/** houseMap 뒤에 방 꾸밈을 덧대기 (툇마루처럼 한 방 안의 다른 바닥) */
export function withLooks(r: RoomDef, extra: { rect: [number, number, number, number]; look: string }[]): RoomDef {
  return { ...r, looks: [...(r.looks ?? []), ...extra] };
}

export { houseMap };
