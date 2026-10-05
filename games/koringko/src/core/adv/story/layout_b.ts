/**
 * 갈래 B 의 같은 배치 둘 (REDESIGN §7 2 · 5 · 6 · 11장): 이삿날 밤마다 상태만 다르다.
 *  - hallHouse   : 2층 복도 + 할머니 방 + 붙박이 이불장 (2장 23:40 · 5장 01:50)
 *  - livingHouse : 거실 (6장 02:10 비 · 11장 04:05 비 갬). 아빠는 비닐 씌운 소파에서 TV 를 켜 둔 채 잔다
 */
import type { RoomDef } from '../types.ts';
import { houseMap, type HouseFurn, type HouseSpec } from './kit.ts';

type F = HouseFurn;
const f = (kind: string, x: number, y: number, w = 1, h = 1, more: Partial<F> = {}): F => ({ kind, x, y, w, h, ...more });
const solid = (kind: string, x: number, y: number, w = 1, h = 1, more: Partial<F> = {}): F => f(kind, x, y, w, h, { solid: true, ...more });

// ───────────────────────── 복도 · 할머니 방 · 이불장 ─────────────────────────
/*
 * 40×24 (사람 크기, 장난감이 걷는다)
 *   할머니 방  x1~22  · y0~13 (뒷벽 y0~2, 바닥 y3~13). 연보라 꽃무늬 벽지 · 창호지 창 · 멈춘 시계 · 멈춘 달력 · 떼어 낸 사진 자국
 *              (9~11, 12~13) 문 안쪽에 개어 둔 꽃무늬 이불 더미 = 높은 층 (채광창으로 내려서는 자리)
 *   이불장     x26~37 · y0~13 (단면): 맨 위 칸 y3~5 (높이 2) · 가운데 칸 y7~8 (높이 1) · 바닥 칸 y10~13 (높이 0)
 *   복도       x1~38  · y15~22 (뒷벽 y15~17, 바닥 y18~22). 방문 넷 (하루 방 · 할머니 방 · 안방 · 욕실) · 이불장 문 · 복도 끝 창
 *   할머니 방 문은 늘 잠겨 있다 (x9~10, 문 위 채광창). 이불장 문(x30~31)은 5장에만 열린다
 */
export const HALL = { grandDoor: [9, 15] as const, closetDoor: 30, w: 40, h: 24 };

export function hallHouse(night: 'grand' | 'closet'): HouseSpec {
  const closet = night === 'closet';
  // 할머니 방의 흰 천: 2장엔 덮여 있고, 5장엔 2장에서 걷어 둔 그대로
  const sheet = (opt: string, x: number, y: number, w: number) => f(`sheet:${opt}${closet ? ',off' : ''}`, x, y, w, 1);
  return {
    id: closet ? 'closet' : 'grandroom',
    name: closet ? '나비의 이불장' : '할머니 방',
    w: HALL.w,
    h: HALL.h,
    rooms: [
      { id: 'grand', rect: [1, 0, 22, 14], look: 'gmNight', raised: [[9, 12, 3, 2]] },
      { id: 'closet', rect: [26, 0, 12, 14], look: 'haru13', raised: [[26, 3, 12, 3], [26, 7, 12, 2]] },
      { id: 'hall', rect: [1, 15, 38, 8], look: 'living' },
    ],
    doors: closet ? [{ between: ['closet', 'hall'], at: HALL.closetDoor, w: 2 }] : [],
    // 장 시작: 2장은 하루 방 앞 복도, 5장은 하루 방 문 앞 (침대 밑에서 나와서)
    start: closet ? [4, 19] : [5, 20],
    furniture: [
      // ── 할머니 방 뒷벽: 멈춘 달력 · 사진 자국 · 멈춘 시계 · 창호지 창 · 꽃무늬 벽
      f('clock', 4, 1),
      f('calendar:x', 9, 1),
      f('frameGhost:wide', 11, 1, 2, 1),
      f('window:night', 13, 0, 4, 2),
      f('frameGhost:tall', 21, 1),
      // ── 할머니 방 가구 (재봉틀 · 장롱 · 침대에 흰 천)
      solid('sewing:dust,thread', 2, 3, 2, 1),
      sheet('mid', 2, 3, 2),
      solid('sewbox', 4, 3),
      solid('dresserCloth', 6, 3, 2, 1),
      solid('wardrobe', 18, 3, 3, 1),
      sheet('tall', 18, 3, 3),
      solid('bed:#c8a0b8', 13, 5, 3, 3),
      f('table:tea', 4, 8, 2, 1, { under: true }),
      f('cushion', 7, 8),
      f('cushion', 3, 10),
      f('quilts:2', 9, 12, 3, 2),
      solid('cartonOpen', 20, 11),
      solid('cartonM:방', 21, 12),
      solid('bookTied:2', 16, 12),
      f('rug:#a88ab0', 13, 9, 4, 2),
      solid('quilts:4', 21, 6),
      solid('bubbleWrap', 17, 3),
      f('stool', 10, 7),
      solid('rolledRug', 2, 12, 2, 1),
      solid('cartonS:책', 19, 12),
      solid('curtainPile', 22, 9),
      // ── 윗층: 두 해 동안 아무도 걷지 않은 방 · 이불장 구석의 거미줄
      f('cobweb', 1, 3, 1, 1, { over: true }),
      f('cobweb:right', 22, 3, 1, 1, { over: true }),
      f('cobweb:right', 37, 10, 1, 1, { over: true }),
      // 할머니 방 바닥 잔 소품 (털신 한 짝 · 단추 · 신문지 · 머리끈 · 동전 · 테이프)
      f('slipper', 12, 12),
      f('dragMarks', 14, 11, 2, 1),
      f('tapeBit', 6, 12),
      f('button', 20, 5),
      f('newsSheet', 18, 12),
      f('button', 6, 6),
      f('newsSheet', 11, 5),
      f('hairBand', 17, 10),
      f('coin', 3, 13),
      f('tapeBit', 19, 8),
      f('markerPen', 8, 11),
      // ── 이불장 (단면): 맨 위 칸 아기 이불 · 베개 탑, 가운데 칸 겨울 이불, 바닥 칸 전기장판 · 좀약
      solid('quilts:2', 27, 3, 2, 1),
      solid('quilts:4', 31, 3, 2, 1),
      solid('quilts:3', 36, 4),
      solid('quilts:4', 26, 7, 2, 1),
      solid('quilts:3', 30, 7, 2, 1),
      solid('quilts:2', 33, 8),
      solid('cartonHalf', 26, 10),
      solid('rolledRug', 34, 12, 2, 1),
      solid('quilts:2', 36, 10),
      f('glowStar:many', 33, 11),
      f('newsSheet', 29, 12),
      solid('cushion', 33, 3),
      solid('bubbleWrap', 26, 11),
      f('tapeBit', 33, 10),
      f('hairBand', 28, 11),
      f('button', 35, 8),
      f('newsSheet', 29, 5),
      // ── 복도 뒷벽: 하루 방 · 할머니 방(잠김, 채광창) · 안방 · 욕실 · 이불장 · 끝 창 · 액자 자국
      f('door', 3, 15, 2, 3),
      f('frameGhost', 6, 16),
      f('window:night', 9, 15, 2, 1),
      f('door:closed', 9, 16, 2, 2),
      f('frameGhost:tall', 13, 16),
      f('door', 16, 15, 2, 3),
      f('door', 22, 15, 2, 3),
      f('frameGhost:small', 26, 16),
      closet ? f('door', 32, 15, 1, 3) : f('door', 30, 15, 2, 3),
      f(closet ? 'window:rain' : 'window:night', 35, 15, 3, 2),
      // ── 복도 바닥: 이삿짐 · 전화기 받침 · 빨래 · 우산
      solid('cartonL:안방', 19, 22, 2, 1),
      solid('cartonM:욕실', 24, 18),
      solid('table:phone', 27, 18),
      solid('cartonHalf', 37, 21),
      solid('umbrellaStand', 38, 19),
      solid('rolledRug', 13, 22, 2, 1),
      solid('bookTied:3', 1, 22),
      solid('cartonS:책', 2, 22),
      solid('cartonM:부엌', 8, 22),
      solid('cartonM:옷', 24, 22),
      solid('bubbleWrap', 29, 18),
      solid('trashBag', 38, 22),
      solid('curtainPile', 32, 22),
      f('slipper', 5, 21),
      f('slipper:blue', 34, 22),
      f('tapeBit', 8, 20),
      f('markerPen', 21, 20),
      f('dragMarks', 14, 19, 2, 1),
      f('newsSheet', 30, 21),
      f('button', 25, 20),
      f('coin:500', 33, 19),
      f('hairBand:yellow', 11, 21),
      // ── 앞쪽 가림막: 복도 앞 빨래 바구니 실루엣
      f('cartonHalf', 29, 23, 1, 1, { fg: true }),
    ],
    music: 'night',
    // 안방 문틈 노란 빛 (엄마가 아직 깨어 있다) · 복도 끝 창의 달빛은 창이 만든다
    lights: [
      { at: [17, 18], r: 44, color: [255, 206, 140], k: closet ? 0.3 : 0.5 },
      ...(closet ? [] : [{ at: [10, 13], r: 40, color: [190, 200, 255], k: 0.3 } as const]),
    ],
    ambient: closet ? [70, 74, 120] : [104, 104, 160],
  };
}

/** 이불장 맨 위 칸(y3~5)을 높이 2로: houseMap 의 높은 바닥은 1 하나뿐이라 고쳐 쓴다 */
export function raiseCloset(r: RoomDef): RoomDef {
  const elev = (r.elev ?? []).map((row, y) => (y >= 3 && y <= 5 ? row.split('').map((c, x) => (x >= 26 && x <= 37 && c === '1' ? '2' : c)).join('') : row));
  return { ...r, elev };
}

export function hallMap(night: 'grand' | 'closet', things: RoomDef['things']): RoomDef {
  return raiseCloset(houseMap({ ...hallHouse(night), things }));
}

// ───────────────────────── 거실 ─────────────────────────
/*
 * 36×18 거실 (사람 크기, 장난감이 걷는다)
 *   뒷벽 y0~2: 큰 창 (x3~10, 커튼 뗌) · 가족사진 자국 (x12) · 에어컨 자리 · 책장 (x23~33)
 *   창턱 (3~10, 3~4) = 높은 층: 화분 셋 사이를 지나간다. 커튼 끈 (2,4) 로 오르내린다
 *   괘종시계 (14,3) · TV 장 (17~19,3) — 아빠 쪽을 향해 켜져 있다
 *   소파 (15~18, 9): 비닐을 씌운 채 아빠가 잔다. 소파 밑 · 탁자 밑은 장난감이 숨는 그늘 (U)
 *   책장 (23~27, 3) · 맨 아래 무대 칸 (29~33, 3~4) = 높은 층 (11장 토비 극장)
 */
export const LIVING = { w: 36, h: 18, sofa: [15, 9] as const, dad: [16, 10] as const, tv: [17, 3] as const };

export function livingHouse(night: 'window' | 'shelf'): HouseSpec {
  const rain = night === 'window';
  return {
    id: night,
    name: rain ? '거실 창가' : '거실 책장',
    w: LIVING.w,
    h: LIVING.h,
    rooms: [{ id: 'living', rect: [1, 0, 34, 17], look: 'living', raised: [[3, 3, 8, 2], [29, 3, 5, 2]] }],
    // 장 시작: 6장은 복도 쪽 왼편 아래, 11장은 탁자 앞
    start: rain ? [3, 14] : [10, 14],
    furniture: [
      // ── 뒷벽: 큰 창 · 가족사진 자국 (가장 큰 네모) · 작은 자국 · 책장
      f(rain ? 'window:rain' : 'window:night', 3, 0, 8, 2),
      f('frameGhost:wide', 12, 1, 2, 1),
      f('frameGhost:small', 21, 1),
      // ── 창턱 화분 셋 (높은 층 위)
      solid('plant', 4, 3),
      solid('plant', 6, 4),
      solid('plant', 9, 3),
      // ── 괘종시계 · TV 장 · 에어컨 자리 상자
      solid('grandClock', 14, 3),
      solid('tv', LIVING.tv[0], LIVING.tv[1], 3, 1),
      // ── 집 전화기 받침 (전화선이 바닥을 가로질러 창 밑 콘센트까지) · 우산꽂이
      solid('table:phone', 27, 12),
      solid('umbrellaStand', 34, 13),
      solid('cartonL:거실', 11, 5, 2, 1),
      // ── 책장 · 무대 칸 (11장)
      solid('shelf', 23, 3, 6, 1),
      solid('stage', 30, 3, 3, 1),
      solid('bookTied:3', 28, 4),
      // ── 비닐 씌운 소파 (아빠) · 탁자 (라면 그릇) · 둘둘 만 러그
      f('sofaWrap', 15, 9, 4, 1, { under: true }),
      f('table', 15, 12, 4, 1, { under: true }),
      solid('rolledRug', 6, 13, 2, 1),
      f('rug:#7a8aa8', 21, 11, 4, 3),
      // ── 이삿짐: 「거실」 상자 · 커튼 더미 · 뽁뽁이 · 책 더미 · 쓰레기봉투
      solid('cartonL:거실', 2, 9, 2, 1),
      solid('cartonM:거실', 2, 10),
      solid('curtainPile', 4, 8),
      solid('bubbleWrap', 33, 9),
      solid('cartonM:책', 31, 13),
      solid('cartonS:책', 32, 13),
      solid('trashBag', 1, 16),
      solid('dishWrap', 26, 15),
      solid('bookTied:1', 21, 15),
      solid('dishWrap', 8, 7),
      solid('cartonM:부엌', 9, 12),
      solid('bubbleWrap', 5, 6),
      f('newsSheet', 7, 9),
      f('slipper:blue', 10, 7),
      f('tapeBit', 4, 12),
      f('coin:10', 12, 9),
      // ── 바닥 잔 소품: 커튼 고리 · 리모컨 대신 매직펜 · 휴지 대신 신문지 · 슬리퍼 · 전화선
      f('button', 12, 7),
      f('tapeBit', 9, 10),
      f('markerPen', 28, 11),
      f('newsSheet', 20, 6),
      f('slipper', 13, 14),
      f('coin', 26, 8),
      f('hairBand', 7, 16),
      f('dragMarks', 30, 7, 2, 1),
      f('phoneCord', 11, 11),
      f('phoneCord', 12, 11),
      f('phoneCord:v', 10, 12),
      // ── 윗층: 책장 꼭대기 구석의 거미줄 (짐을 빼자 드러났다)
      f('cobweb:right', 34, 3, 1, 1, { over: true }),
      // ── 앞쪽 가림막: 화면 맨 앞 화분 잎 · 상자
      f('plant', 34, 17, 1, 1, { fg: true }),
      f('cartonL:거실', 1, 17, 2, 1, { fg: true }),
    ],
    music: 'night',
    // TV 의 푸른 빛 (아빠 얼굴 쪽) · 괘종시계 둘레 · 창의 가로등 빛은 창이 만든다
    lights: [
      { at: [18, 6], r: 70, color: [150, 190, 255], k: rain ? 0.5 : 0.4 },
      { at: [18, 9], r: 46, color: [150, 190, 255], k: 0.35 },
    ],
    ambient: rain ? [84, 92, 140] : [96, 92, 148],
  };
}

/** 아빠가 누운 소파 앞 칸은 소파 앉는 면 높이(1): 지켜보는 아빠 그림이 소파 위로 올라가고, 장난감은 그 칸을 지나가지 못한다 */
export function livingMap(night: 'window' | 'shelf', things: RoomDef['things']): RoomDef {
  const r = houseMap({ ...livingHouse(night), things });
  const [dx, dy] = LIVING.dad;
  const elev = (r.elev ?? []).map((row, y) => (y === dy ? row.slice(0, dx) + '1' + row.slice(dx + 1) : row));
  return { ...r, elev };
}
