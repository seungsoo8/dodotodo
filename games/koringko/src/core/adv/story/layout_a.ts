/**
 * 갈래 A 배치: 하루 방 (4장 침대 밑 · 8장 책가방 · 18장 장난감 상자가 같은 배치를 쓴다) · 에필로그 새 방.
 *
 * 하루 방 (26×17, 사람 크기 · 장난감이 걷는다)
 *   x1~3        복도 (뒷벽에 욕실 문). 장 시작은 복도 아래쪽
 *   x4          칸막이, 줄 12~13 이 하루 방 문
 *   x5~24       하루 방 (뒷벽 y0~2, 바닥 y3~15)
 *     뒷벽: 달력(이삿날 동그라미) · 포스터 뗀 자국 · 창(커튼 뗌, 달빛) · 야광 별 스티커 자국
 *     (6~8,3) 책상 (밑은 장난감이 지나가는 그늘 U) · (7,4) 의자 (밑 U)
 *     (10~11,3) 반쯤 빈 책장 · (12~13,3) 옷장 · (14,3) 옷걸이 행거 (교복 · 비닐 커버 원피스) · 창 밑 (15~17,3) 달빛
 *     (18~21,3~4) 가로로 놓인 침대 (밑 U, 머리판 왼쪽 — 하루는 (18,3) 에 누워 왼쪽을 본다)
 *     (22~24,3~4) 침대와 벽 사이 틈 (침대 밑으로만 들어간다) · (22~24,5) 협탁 대신 「하루 방」 상자
 *   y16         앞쪽 가장자리 (앞쪽 가림막: 이삿짐 상자 실루엣)
 *
 * 밤마다 다른 것 (night): ch4 01:20 하루가 잔다 (이불에 노란 털실) · ch8 03:00 침대가 비고 복도 욕실 불빛 ·
 * ch18 05:25 하루가 다시 잠들고, 엄마가 옮겨 둔 빈 장난감 상자 · 블록 상자 · 크레용 통.
 */
import type { RoomDef } from '../types.ts';
import type { HouseFurn, HouseSpec } from './kit.ts';

export type HaruNight = 'ch4' | 'ch8' | 'ch18';

/** 하루 방 칸 (시험 · 장 파일이 같이 쓴다) */
export const HARU = {
  w: 26,
  h: 17,
  /** 장 시작 (복도 아래쪽) */
  start: [2, 14] as const,
  /** 문 (복도 → 하루 방) */
  door: [4, 12] as const,
  /** 침대 (밑은 장난감만) */
  bed: [18, 3, 4, 2] as const,
  /** 하루가 눕는 칸 (침대 머리 쪽) */
  haru: [18, 3] as const,
  /** 침대와 벽 사이 틈 */
  nook: [22, 3, 3, 2] as const,
  /** 책상 · 의자 */
  desk: [6, 3, 3, 1] as const,
  chair: [7, 4] as const,
  /** 쓰레기통 */
  bin: [19, 13] as const,
};

const f = (kind: string, x: number, y: number, w = 1, h = 1, o: Partial<HouseFurn> = {}): HouseFurn => ({ kind, x, y, w, h, ...o });
const solid = { solid: true };

/** 하루 방 집 지도 (things · start 는 장이 채운다) */
export function haruRoomSpec(night: HaruNight): Omit<HouseSpec, 'id' | 'things'> {
  const furniture: HouseFurn[] = [
    // ── 뒷벽 (y0~2): 달력 · 포스터 뗀 자국 · 창 · 야광 별 자국 / 복도: 욕실 문
    f('calendar:x', 6, 0, 2, 2),
    f('frameGhost:wide', 8, 1, 2, 1),
    f('window:night', 15, 0, 3, 2),
    f('frameGhost:small', 20, 1),
    f('frameGhost:tall', 23, 1),
    f('door', 2, 0, 1, 3),
    f('frameGhost', 1, 1),
    // ── 책상 (밑은 그늘) · 의자 · 반쯤 빈 책장 · 옷장 · 옷걸이
    f(night === 'ch8' ? 'desk' : 'desk:jar', 6, 3, 3, 1, { under: true }),
    f(night === 'ch8' ? 'chairBag' : 'chair', 7, 4, 1, 1, { under: true }),
    f('shelf', 10, 3, 2, 1, solid),
    f('wardrobe', 12, 3, 2, 1, solid),
    f('hangerRack', 14, 3, 1, 1, solid),
    // ── 침대 (가로, 밑은 장난감이 지나간다) · 협탁 대신 상자
    f(night === 'ch4' ? 'haruBed:yarn' : night === 'ch8' ? 'haruBed:empty' : 'haruBed:dawn', 18, 3, 4, 2, { under: true }),
    f('cartonL:하루 방', 22, 5, 2, 1, solid),
    f('cartonS:책', 24, 5, 1, 1, solid),
    // ── 이삿짐: 「하루 방」 상자 다섯 · 둘둘 만 이불 · 끈 묶은 책
    f('cartonM:하루 방', 12, 7, 1, 1, solid),
    f('cartonL:하루 방', 12, 8, 2, 1, solid),
    f('cartonS:책', 9, 10, 1, 1, solid),
    f('cartonHalf', 16, 10, 1, 1, solid),
    f('rolledRug', 5, 8, 2, 1, solid),
    f('bookTied:2', 22, 9, 1, 1, solid),
    f('cartonL:옷', 21, 13, 2, 1, solid),
    f('cartonM:깨짐주의', 21, 12, 1, 1, solid),
    f('trashBag', 24, 11, 1, 1, solid),
    f('bookTied:1', 12, 14, 1, 1, solid),
    f('cartonL:하루 방', 13, 13, 2, 1, solid),
    f('cartonM:책', 13, 12, 1, 1, solid),
    f('curtainPile', 11, 10, 1, 1, solid),
    // ── 바닥 잔 소품 (걸을 수 있는 칸 위 데칼)
    f('dragMarks', 5, 13, 2, 1),
    f('tapeBit', 8, 7),
    f('markerPen', 17, 14),
    f('newsSheet', 18, 8),
    f('slipper', 10, 14),
    f('coin', 21, 7),
    f('hairBand', 7, 12),
    f('tapeBit', 20, 11),
    f('button', 16, 13),
    f('newsSheet', 6, 15),
    f('markerPen', 23, 14),
    f('coin', 11, 12),
    // ── 쓰레기통 (구긴 시험지)
    f('wasteBin', HARU.bin[0], HARU.bin[1], 1, 1, solid),
    // ── 복도: 뽁뽁이 · 커튼 더미 · 끈 묶은 책 · 테이프 조각
    f('bubbleWrap', 1, 4, 1, 1, solid),
    f('bookTied:3', 3, 4, 1, 1, solid),
    f('curtainPile', 1, 9, 1, 1, solid),
    f('tapeBit', 2, 11),
    f('slipper:blue', 3, 7),
    // ── 앞쪽 가림막: 화면 맨 앞을 스치는 이삿짐 상자 · 커튼 자락
    f('cartonL:하루 방', 21, 16, 2, 1, { fg: true }),
    f('curtainPile', 8, 16, 1, 1, { fg: true }),
  ];
  // 밤마다 다른 것
  if (night === 'ch4') {
    furniture.push(f('cartonM:하루 방', 16, 6, 1, 1, solid), f('cartonOpen', 8, 12, 1, 1, solid));
  }
  if (night === 'ch8') {
    furniture.push(f('cartonM:하루 방', 16, 6, 1, 1, solid), f('cartonOpen', 8, 12, 1, 1, solid), f('pencilFolks', 8, 5, 3, 1), f('chairOld:plain', 17, 3, 1, 1, solid));
  }
  if (night === 'ch18') {
    furniture.push(f('toybox', 15, 4, 2, 1, solid), f('blockBox', 8, 12, 1, 1, solid), f('crayonTin', 10, 7, 1, 1, solid));
  }
  const lights: NonNullable<RoomDef['lights']> = [];
  // 휴대폰 충전 불빛 (협탁 상자 위)
  if (night !== 'ch8') lights.push({ at: [22, 5], r: 30, color: [150, 200, 255], k: 0.35 });
  // 복도 욕실 불빛 · 문틈 빛 (하루가 화장실에 갔다)
  if (night === 'ch8') lights.push({ at: [2, 3], r: 70, color: [255, 220, 150], k: 0.6 }, { at: [4, 12], r: 40, color: [255, 210, 140], k: 0.4 });
  return {
    name: '하루 방',
    w: HARU.w,
    h: HARU.h,
    rooms: [
      { id: 'haru', rect: [5, 0, 20, 16], look: 'haru15' },
      { id: 'hall', rect: [1, 0, 3, 16], look: 'living' },
    ],
    doors: [{ between: ['haru', 'hall'], at: HARU.door[1], w: 2 }],
    furniture,
    start: [HARU.start[0], HARU.start[1]],
    music: 'night',
    // 커튼을 뗀 창의 달빛 (새벽이면 빛이 묽어진다 — 색은 장의 시각이 고른다)
    beams: [{ x: 15, w: 3, h: night === 'ch18' ? 7 : 8, slant: 2 }],
    lights,
    ambient: night === 'ch18' ? [138, 142, 182] : night === 'ch8' ? [118, 112, 156] : [104, 104, 150],
  };
}

/** 하루 방 바깥 소리: 방 울림 + 이불 뒤척임 (4장) · 복도 욕실 물소리 (8장) · 새벽 새소리 (18장) */
export function haruAmb(night: HaruNight): NonNullable<RoomDef['amb']> {
  const base = [{ name: 'roomTone', gain: 0.3 }, { name: 'carPass', gain: 0.05, every: [30, 70] as const }];
  if (night === 'ch4') return [...base, { name: 'blanket', gain: 0.12, every: [8, 16] }];
  if (night === 'ch8') return [...base, { name: 'waterHum', gain: 0.12 }, { name: 'drip', gain: 0.2, every: [3, 7] }];
  return [...base, { name: 'birds', gain: 0.1, every: [6, 14] }];
}

/** 새 방 바깥 소리: 방 울림 · 벽시계 · 창밖 눈바람 */
export const NEW_AMB: NonNullable<RoomDef['amb']> = [{ name: 'roomTone', gain: 0.25 }, { name: 'clockTick', gain: 0.15 }, { name: 'wind', gain: 0.08 }];

/*
 * 새 방 (22×15, 에필로그 · 새집의 첫 겨울 낮)
 *   x1~20 · y0~13  새 하루 방 (뒷벽 y0~2: 큰 창(첫눈) · 빈 벽 · 할머니 사진 액자 자리)
 *   (2~4,3) 책상 · (6~7,3) 선반 (장난감 자리 다섯) · (15~17,3~6) 침대
 *   (9~12,4~5) 풀다 만 상자들 · 「가져온 짐」 상자 · 창가 「하루 꽃」 화분 · 할머니 의자(방석)
 */
export const NEW = { w: 22, h: 15, start: [3, 12] as const };

export function newRoomSpec(): Omit<HouseSpec, 'id' | 'things'> {
  const furniture: HouseFurn[] = [
    // 뒷벽: 큰 창 (첫눈) · 아직 아무것도 걸리지 않은 벽 · 시계
    f('window:snow', 8, 0, 4, 2),
    f('clock', 13, 0, 1, 2),
    f('photo', 18, 0, 2, 2),
    // 책상 · 의자 · 선반 · 침대
    f('desk:jar', 2, 3, 3, 1, solid),
    f('chair', 3, 4, 1, 1, solid),
    f('shelf', 6, 3, 2, 1, solid),
    f('bed:#e8c860', 16, 3, 3, 4, solid),
    // 창가: 「하루 꽃」 화분 · 할머니 의자 (꽃무늬 방석)
    f('plant', 12, 3, 1, 1, solid),
    f('chairOld:plain', 14, 4, 1, 1, solid),
    // 풀다 만 상자들 · 「가져온 짐」
    f('cartonOpen', 9, 6, 1, 1, solid),
    f('cartonHalf', 10, 6, 1, 1, solid),
    f('cartonL:하루 방', 5, 9, 2, 1, solid),
    f('cartonM:책', 6, 8, 1, 1, solid),
    f('cartonS:옷', 19, 10, 1, 1, solid),
    f('bubbleWrap', 1, 7, 1, 1, solid),
    f('rug:#c8b0d0', 9, 9, 5, 3),
    f('cartonL:책', 9, 13, 2, 1, solid),
    f('bookTied:2', 1, 10, 1, 1, solid),
    f('curtainPile', 16, 12, 1, 1, solid),
    f('cartonM:옷', 14, 13, 1, 1, solid),
    // 바닥 잔 소품
    f('tapeBit', 8, 8),
    f('newsSheet', 14, 11),
    f('markerPen', 4, 7),
    f('slipper', 18, 12),
    f('button', 11, 13),
    f('tapeBit', 16, 9),
    f('hairBand:yellow', 2, 10),
    f('newsSheet', 7, 12),
    // 앞쪽 가림막
    f('cartonL:부엌', 15, 14, 2, 1, { fg: true }),
  ];
  return {
    name: '새 방',
    w: NEW.w,
    h: NEW.h,
    rooms: [{ id: 'new', rect: [1, 0, 20, 14], look: 'newroom' }],
    doors: [{ rect: [20, 11, 1, 2] }],
    furniture,
    start: [NEW.start[0], NEW.start[1]],
    music: 'hope',
    // 큰 창의 하얀 눈빛 · 오후 볕 웅덩이
    beams: [{ x: 8, w: 4, h: 7, slant: 2 }],
    lights: [{ at: [10, 4], r: 90, color: [255, 236, 200], k: 0.45 }, { at: [20, 11], r: 40, color: [255, 200, 140], k: 0.35 }],
    ambient: [232, 226, 220],
  };
}
