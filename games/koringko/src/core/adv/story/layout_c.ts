/**
 * 갈래 C 의 사람 크기 집 지도 (houseMap 배치): 3장 안방 · 7장 현관 · 10장 욕실 · 12장 · 19장 부엌.
 * 부엌은 배치 하나(kitchenHouse)를 두 장이 함께 쓴다: 12장(04:15)은 과자 서랍 속 단면, 19장(04:50)은 찬장 속 3단 선반 단면.
 * 같은 부엌이라 냉장고 · 조리대 · 식탁 · 찬장 자리는 그대로이고, 이삿날 밤 상태(서랍 · 찬장 문 · 상자)만 다르다.
 */
import type { HouseFurn, HouseSpec } from './kit.ts';

// ───────────────────────── 부엌 (12장 · 19장) ─────────────────────────

/*
 * 부엌 41×16 (사람 크기 · 장난감이 걷는다)
 *   x1~26   부엌: 뒷벽(y0~2)에 찬장 · 창 · 시계 · 달력. y3 줄에 냉장고(2~3) · 조리대(5~12, 가스레인지 · 개수대) · 쌀 포대 · 상자
 *           오른쪽 벽에 붙은 서랍장(23~26, 과자 서랍은 25) · 그 위 찬장(23~26, 19장의 그 찬장)
 *           식탁 윗면 (15~20, 8~9) = 높은 층 (의자 (14,9) 를 타고 오른다), 앞면 S (y10)
 *   x28~39  단면: 12장 = 과자 서랍 속 (y2~11), 19장 = 찬장 속 3단 선반 (위 y0~3 · 가운데 y5~8 · 아래 y10~14)
 *   서랍장 옆 (26,4) 에서 벽 너머 단면으로 밧줄 (짧은 오르기)
 */
export const KITCHEN_W = 41;
export const KITCHEN_H = 16;

export function kitchenHouse(ch: 'drawer' | 'cupboard'): HouseSpec {
  const late = ch === 'cupboard';
  const furniture: HouseFurn[] = [
    // ── 뒷벽: 찬장 · 창 (달빛) · 시계 · 액자 자국 · 달력
    { kind: 'wallCab', x: 5, y: 0, w: 4, h: 2 },
    { kind: 'window:night', x: 9, y: 0, w: 3, h: 2 },
    { kind: 'wallCab', x: 12, y: 0, w: 2, h: 2 },
    { kind: 'clock', x: 15, y: 0, w: 2, h: 2 },
    { kind: 'frameGhost:wide', x: 18, y: 1, w: 2, h: 1 },
    { kind: 'calendar', x: 20, y: 0, w: 2, h: 2 },
    { kind: late ? 'wallCab:open' : 'wallCab', x: 23, y: 0, w: 4, h: 2 },
    // ── 뒷벽 앞: 냉장고 (문틈 빛) · 조리대 · 쌀 포대 · 신문지 그릇 · 「부엌」 상자
    { kind: 'fridge:ajar', x: 2, y: 3, w: 2, h: 1, solid: true },
    { kind: 'kcounter:stove@0,sink@3', x: 5, y: 3, w: 8, h: 1, solid: true },
    { kind: 'riceSack', x: 13, y: 3, w: 1, h: 1, solid: true },
    { kind: 'dishWrap', x: 14, y: 3, w: 1, h: 1, solid: true },
    { kind: 'cartonL:부엌', x: 16, y: 3, w: 2, h: 1, solid: true },
    { kind: 'cartonM:깨짐주의', x: 16, y: 2, w: 1, h: 1 },
    { kind: 'bubbleWrap', x: 21, y: 3, w: 1, h: 1, solid: true },
    { kind: late ? 'kcounter:drawer@2,open' : 'kcounter:drawer@2', x: 23, y: 3, w: 4, h: 1, solid: true },
    // ── 식탁 (윗면은 높은 층) · 의자 셋 (하나는 다락으로 올라갔다)
    { kind: 'surfaceTop:cloth', x: 15, y: 8, w: 6, h: 2 },
    { kind: 'surfaceFront:cloth', x: 15, y: 10, w: 6, h: 1 },
    { kind: 'chair', x: 14, y: 9, w: 1, h: 1 },
    { kind: 'chair', x: 17, y: 7, w: 1, h: 1, solid: true },
    { kind: 'chair', x: 21, y: 8, w: 1, h: 1, solid: true },
    // ── 바닥: 이삿짐 · 잔 소품 (길은 비워 둔다)
    { kind: 'cartonL:부엌', x: 3, y: 9, w: 2, h: 1, solid: true },
    { kind: 'cartonM:부엌', x: 3, y: 8, w: 1, h: 1 },
    { kind: 'cartonOpen', x: 9, y: 8, w: 1, h: 1, solid: true },
    { kind: 'trashBag', x: 25, y: 12, w: 1, h: 1, solid: true },
    { kind: late ? 'cartonHalf' : 'cartonS:책', x: 11, y: 12, w: 1, h: 1, solid: true },
    { kind: 'rolledRug', x: 22, y: 13, w: 2, h: 1, solid: true },
    { kind: 'dragMarks', x: 6, y: 11, w: 2, h: 1 },
    { kind: 'newsSheet', x: 12, y: 6, w: 1, h: 1 },
    { kind: 'tapeBit', x: 8, y: 13, w: 1, h: 1 },
    { kind: 'markerPen', x: 19, y: 12, w: 1, h: 1 },
    { kind: 'coin', x: 23, y: 6, w: 1, h: 1 },
    { kind: 'slipper', x: 2, y: 6, w: 1, h: 1 },
    { kind: 'honeycandy', x: 13, y: 12, w: 1, h: 1 },
    { kind: 'button', x: 6, y: 7, w: 1, h: 1 },
    { kind: 'hairBand:yellow', x: 17, y: 12, w: 1, h: 1 },
    { kind: 'tapeBit', x: 20, y: 5, w: 1, h: 1 },
    // ── 윗층: 식탁 위 전등갓
    { kind: 'ceilLamp', x: 17, y: 6, w: 1, h: 1, over: true },
    // ── 앞쪽 가림막: 화면 맨 앞을 스치는 식탁 의자 등받이
    { kind: 'chair', x: 9, y: 14, w: 1, h: 1, fg: true },
  ];
  if (late) {
    // 19장: 찬장 속 3단 선반 (위 · 가운데 · 아래), 선반 판 · 그릇 · 깡통
    furniture.push(
      { kind: 'shelfBoard', x: 28, y: 0, w: 12, h: 1 },
      { kind: 'dishWrap', x: 29, y: 1, w: 1, h: 1, solid: true },
      { kind: 'cartonS:부엌', x: 38, y: 1, w: 1, h: 1, solid: true },
      { kind: 'shelfBoard', x: 28, y: 5, w: 12, h: 1 },
      { kind: 'bowlStack', x: 33, y: 6, w: 1, h: 1, solid: true },
      { kind: 'bowlStack', x: 33, y: 8, w: 1, h: 1, solid: true },
      { kind: 'dishWrap', x: 38, y: 7, w: 1, h: 1, solid: true },
      { kind: 'shelfBoard', x: 28, y: 10, w: 12, h: 1 },
      { kind: 'riceSack', x: 28, y: 13, w: 1, h: 1, solid: true },
      { kind: 'riceSack', x: 28, y: 14, w: 1, h: 1, solid: true },
      { kind: 'honeycandy', x: 33, y: 13, w: 1, h: 1 },
      { kind: 'button', x: 36, y: 14, w: 1, h: 1 },
      { kind: 'coin:10', x: 30, y: 8, w: 1, h: 1 },
    );
  } else {
    // 12장: 과자 서랍 속 (사탕 깡통 · 사탕 봉지 · 생일 초 상자 · 껌 · 젤리 대왕의 자리)
    furniture.push(
      { kind: 'candyTin', x: 29, y: 4, w: 2, h: 2, solid: true },
      { kind: 'xmasbox', x: 33, y: 4, w: 2, h: 1, solid: true },
      { kind: 'honeycandy', x: 31, y: 7, w: 1, h: 1 },
      { kind: 'honeycandy', x: 37, y: 9, w: 1, h: 1 },
      { kind: 'paperStrips', x: 34, y: 9, w: 3, h: 2 },
      { kind: 'hairTie', x: 30, y: 10, w: 1, h: 1 },
      { kind: 'cartonS:과자', x: 38, y: 4, w: 1, h: 1, solid: true },
      { kind: 'eraserDust', x: 36, y: 6, w: 2, h: 1 },
    );
  }
  return {
    id: ch,
    name: late ? '부엌 찬장' : '부엌 과자 서랍',
    w: KITCHEN_W,
    h: KITCHEN_H,
    rooms: [
      { id: 'kitchen', rect: [1, 0, 26, 15], look: 'kitchenNight', raised: [[15, 8, 6, 2]] },
      ...(late
        ? [
            { id: 'shelf1', rect: [28, 0, 12, 4] as [number, number, number, number], look: 'oldhomeNight', wallH: 1 },
            { id: 'shelf2', rect: [28, 5, 12, 4] as [number, number, number, number], look: 'oldhomeNight', wallH: 1 },
            { id: 'shelf3', rect: [28, 10, 12, 5] as [number, number, number, number], look: 'oldhomeNight', wallH: 1 },
          ]
        : [{ id: 'drawerIn', rect: [28, 2, 12, 10] as [number, number, number, number], look: 'balcony', wallH: 2 }]),
    ],
    doors: [{ rect: [0, 11, 1, 2] }],
    furniture,
    start: [2, 12],
    music: late ? 'box' : 'playful',
    // 창 달빛 · 냉장고 문틈의 하얀 빛 · 전자레인지 초록 숫자 · (단면) 서랍 · 찬장 문틈 빛
    beams: [{ x: 9, w: 3, h: 7, slant: 2 }],
    lights: [
      { at: [4, 4], r: 44, color: [220, 240, 255], k: 0.5 },
      { at: [7, 2], r: 18, color: [120, 255, 160], k: 0.5 },
      late ? { at: [33, 2], r: 60, color: [255, 214, 150], k: 0.45 } : { at: [34, 6], r: 70, color: [255, 200, 150], k: 0.4 },
    ],
    ambient: late ? [128, 116, 150] : [118, 112, 150],
  };
}

// ───────────────────────── 안방 (3장) ─────────────────────────

/*
 * 안방 26×16, 00:30. 엄마는 침대에서 잠 못 들고 스탠드를 켰다 껐다 한다.
 *   y3~4, x2~10  화장대(2~5) · 3단 서랍장(6~8) 윗면 = 높은 층, 앞면 S (y5). 서랍 계단 (9,6)→(9,4)
 *   x16~19, y3~7 침대 (밑은 장난감만 지나가는 U · 숨을 곳), 머리맡 스탠드 (20,3), 머리맡 자리 (20,5)
 *   (11~12, 8) 빨래 건조대 (밑 U · 숨을 곳), 「안방」 상자들 그림자
 */
export function dresserHouse(): HouseSpec {
  return {
    id: 'dresser',
    name: '안방',
    w: 26,
    h: 16,
    rooms: [{ id: 'anbang', rect: [1, 0, 24, 15], look: 'haru15', raised: [[2, 3, 9, 2]] }],
    doors: [{ rect: [0, 12, 1, 2] }],
    furniture: [
      // ── 뒷벽: 블라인드 창 · 결혼사진을 뗀 자국 · 시계
      { kind: 'window:night', x: 12, y: 0, w: 3, h: 2 },
      { kind: 'frameGhost:wide', x: 17, y: 1, w: 2, h: 1 },
      { kind: 'clock', x: 22, y: 0, w: 2, h: 2 },
      // ── 화장대 · 서랍장 (윗면을 장난감이 걷는다)
      { kind: 'vanityMirror', x: 2, y: 0, w: 4, h: 3 },
      { kind: 'surfaceTop:wood', x: 2, y: 3, w: 9, h: 2 },
      { kind: 'surfaceFront:vanity', x: 2, y: 5, w: 4, h: 1 },
      { kind: 'surfaceFront:chest', x: 6, y: 5, w: 3, h: 1 },
      { kind: 'surfaceFront:vanity', x: 9, y: 5, w: 2, h: 1 },
      { kind: 'jewelBox', x: 2, y: 3, w: 1, h: 1, solid: true },
      { kind: 'perfume', x: 5, y: 4, w: 1, h: 1, solid: true },
      { kind: 'chairOld', x: 4, y: 6, w: 1, h: 1, solid: true },
      // ── 침대 (밑은 장난감이 숨는 자리) · 스탠드 · 이불장 상자
      { kind: 'bedMom', x: 16, y: 3, w: 4, h: 5, under: true },
      { kind: 'lamp', x: 20, y: 3, w: 1, h: 1, solid: true },
      { kind: 'cartonL:안방', x: 22, y: 3, w: 2, h: 1, solid: true },
      { kind: 'cartonM:안방', x: 22, y: 2, w: 1, h: 1 },
      // ── 빨래 건조대 (밑에 숨는다) · 다리미판 대신 개킨 커튼 · 상자 그림자
      { kind: 'dryRack', x: 11, y: 8, w: 2, h: 1, under: true },
      { kind: 'curtainPile', x: 21, y: 8, w: 1, h: 1, solid: true },
      { kind: 'ceilLamp', x: 12, y: 7, w: 1, h: 1, over: true },
      { kind: 'cartonL:안방', x: 13, y: 11, w: 2, h: 1, solid: true },
      { kind: 'cartonM:옷', x: 9, y: 10, w: 1, h: 1, solid: true },
      { kind: 'cartonOpen', x: 18, y: 11, w: 1, h: 1, solid: true },
      { kind: 'bookTied:2', x: 6, y: 9, w: 1, h: 1, solid: true },
      { kind: 'trashBag', x: 24, y: 8, w: 1, h: 1, solid: true },
      // ── 바닥의 잔 소품 (머리끈 · 충전기 선 · 테이프)
      { kind: 'hairBand', x: 15, y: 13, w: 1, h: 1 },
      { kind: 'tapeBit', x: 3, y: 9, w: 1, h: 1 },
      { kind: 'markerPen', x: 20, y: 9, w: 1, h: 1 },
      { kind: 'newsSheet', x: 10, y: 13, w: 1, h: 1 },
      { kind: 'coin', x: 23, y: 13, w: 1, h: 1 },
      { kind: 'button', x: 7, y: 12, w: 1, h: 1 },
      { kind: 'dragMarks', x: 16, y: 10, w: 2, h: 1 },
      { kind: 'slipper:blue', x: 2, y: 8, w: 1, h: 1 },
      { kind: 'tapeBit', x: 21, y: 12, w: 1, h: 1 },
      { kind: 'hairBand:yellow', x: 11, y: 6, w: 1, h: 1 },
      // ── 앞쪽 가림막: 상자 실루엣
      { kind: 'cartonL:안방', x: 21, y: 14, w: 2, h: 1, fg: true },
    ],
    start: [2, 13],
    music: 'night',
    // 블라인드 줄무늬 달빛 · 스탠드 · 휴대폰 충전 초록 점
    beams: [{ x: 12, w: 3, h: 9, slant: 2 }],
    lights: [
      { at: [20, 3], r: 64, color: [255, 210, 140], k: 0.5 },
      { at: [8, 12], r: 16, color: [120, 255, 150], k: 0.6 },
    ],
    ambient: [112, 104, 146],
  };
}

// ───────────────────────── 현관 (7장) ─────────────────────────

/*
 * 현관 26×16, 03:00. 집 바닥(마루)에서 한 단 내려간 현관 바닥 (높이 차의 견본).
 *   y3~7, x1~14   마루 = 높은 층, 앞면 S (y8). 밧줄로 (7,7)→(7,9) 내려간다
 *   x15            「내일 아침 첫 차」 상자 탑 (마루 옆 가장자리)
 *   x16~24, y3~14 · x1~14, y9~14  현관 바닥 (돌 타일). 뒷벽에 현관문 (유리 창살 · 가로등 빛) · 신발장 (16~17)
 *   센서등 (19,9): 둘레 3칸 안에서 2칸 넘게 움직이면 켜진다. 신발 속 · 상자 그림자에 숨는다
 */
export function entranceHouse(): HouseSpec {
  return {
    id: 'entrance',
    name: '현관',
    w: 26,
    h: 16,
    rooms: [{ id: 'genkan', rect: [1, 0, 24, 15], look: 'living', raised: [[1, 3, 14, 5]] }],
    furniture: [
      // ── 현관 바닥 돌 타일 (마루보다 한 단 낮다)
      { kind: 'tileFloor', x: 15, y: 3, w: 10, h: 12 },
      { kind: 'tileFloor', x: 1, y: 9, w: 14, h: 6 },
      // ── 뒷벽: 마루 쪽 액자 자국 · 시계, 현관 쪽 현관문 · 열쇠 걸이
      { kind: 'frameGhost', x: 4, y: 1, w: 1, h: 1 },
      { kind: 'frameGhost:wide', x: 9, y: 1, w: 2, h: 1 },
      { kind: 'clock', x: 12, y: 0, w: 2, h: 2 },
      { kind: 'door', x: 20, y: 0, w: 2, h: 3 },
      { kind: 'calendar', x: 23, y: 0, w: 1, h: 2 },
      // ── 마루: 이삿짐 · 「부엌」 상자 · 굴러다니는 매직펜
      { kind: 'cartonL:부엌', x: 11, y: 4, w: 2, h: 1, solid: true },
      { kind: 'cartonM:부엌', x: 11, y: 3, w: 1, h: 1 },
      { kind: 'cartonHalf', x: 2, y: 3, w: 1, h: 1, solid: true },
      { kind: 'bookTied:3', x: 5, y: 3, w: 1, h: 1, solid: true },
      { kind: 'rolledRug', x: 8, y: 3, w: 2, h: 1, solid: true },
      { kind: 'markerPen', x: 4, y: 6, w: 1, h: 1 },
      { kind: 'tapeBit', x: 10, y: 6, w: 1, h: 1 },
      // ── 마루 옆 가장자리: 「내일 아침 첫 차」 상자 탑
      { kind: 'shoeCabinet', x: 15, y: 3, w: 2, h: 1, solid: true },
      { kind: 'cartonL:거실', x: 14, y: 8, w: 2, h: 1 },
      { kind: 'cartonM:책', x: 15, y: 4, w: 1, h: 1, solid: true },
      { kind: 'cartonM:옷', x: 15, y: 5, w: 1, h: 1, solid: true },
      { kind: 'cartonS:책', x: 15, y: 6, w: 1, h: 1, solid: true },
      { kind: 'cartonM:하루방', x: 15, y: 7, w: 1, h: 1, solid: true },
      // ── 현관: 우산꽂이 · 자전거 (보조 바퀴 뗀) · 현관 매트 · 센서등 (윗층)
      { kind: 'umbrellaStand', x: 24, y: 3, w: 1, h: 1, solid: true },
      { kind: 'bike', x: 23, y: 6, w: 2, h: 1, solid: true },
      { kind: 'rug:#8a5a4a', x: 19, y: 3, w: 3, h: 2 },
      { kind: 'cartonM:하루방', x: 9, y: 13, w: 1, h: 1, solid: true },
      { kind: 'bookTied:2', x: 5, y: 9, w: 1, h: 1, solid: true },
      { kind: 'curtainPile', x: 18, y: 14, w: 1, h: 1, solid: true },
      { kind: 'markerPen', x: 15, y: 12, w: 1, h: 1 },
      { kind: 'newsSheet', x: 20, y: 12, w: 1, h: 1 },
      { kind: 'ceilLamp', x: 19, y: 8, w: 1, h: 1, over: true },
      { kind: 'cartonL:깨짐주의', x: 22, y: 9, w: 2, h: 1, solid: true },
      { kind: 'cartonOpen', x: 12, y: 12, w: 1, h: 1, solid: true },
      { kind: 'trashBag', x: 3, y: 12, w: 1, h: 1, solid: true },
      // ── 잔 소품
      { kind: 'newsSheet', x: 9, y: 11, w: 1, h: 1 },
      { kind: 'slipper', x: 6, y: 13, w: 1, h: 1 },
      { kind: 'coin:500', x: 21, y: 13, w: 1, h: 1 },
      { kind: 'tapeBit', x: 24, y: 11, w: 1, h: 1 },
      { kind: 'button', x: 16, y: 12, w: 1, h: 1 },
      { kind: 'dragMarks', x: 9, y: 9, w: 2, h: 1 },
      { kind: 'hairBand', x: 2, y: 10, w: 1, h: 1 },
      // ── 앞쪽 가림막: 우산 실루엣 대신 상자
      { kind: 'cartonL:거실', x: 1, y: 14, w: 2, h: 1, fg: true },
    ],
    start: [3, 5],
    music: 'night',
    // 현관문 유리 너머 가로등 빛 · 마루 쪽 어둠
    beams: [{ x: 20, w: 2, h: 8, slant: -1 }],
    lights: [
      { at: [20, 3], r: 80, color: [255, 200, 130], k: 0.5 },
      { at: [7, 4], r: 30, color: [200, 210, 255], k: 0.3 },
    ],
    ambient: [96, 100, 146],
  };
}

// ───────────────────────── 욕실 (10장) ─────────────────────────

/*
 * 욕실 20×16, 03:55. 문(아래)에서 들어와 젖은 타일을 건너 세면대 위로.
 *   (2~7, 3~5) 욕조 · (10~16, 3) 세면대 윗면 = 높은 층, 앞면 S (y4). 의자 옆 (17,4) 에서 (16,3) 으로 오른다
 *   젖은 타일 (1~18, 6~12): 한 번 움직이면 막히거나 마른 칸에 닿을 때까지 미끄러진다. 때수건 (4,11) · 발판 (15,9) 은 마른 칸
 *   의자 쪽 마른 자리 (17~18, 3~5) 로는 (18,6) 에서만 올라선다 → 보리가 슬리퍼를 (12,7) 까지 밀어 멈출 자리를 만든다
 */
export function bathHouse(): HouseSpec {
  return {
    id: 'bath',
    name: '욕실',
    w: 20,
    h: 16,
    rooms: [{ id: 'bath', rect: [1, 0, 18, 15], look: 'bathNight', raised: [[10, 3, 7, 1]] }],
    doors: [{ rect: [9, 15, 2, 1] }],
    furniture: [
      // ── 뒷벽: 작은 환기창 (달빛) · 수건걸이 · 김 서린 거울 (세면대 위)
      { kind: 'window:night', x: 4, y: 0, w: 2, h: 2 },
      { kind: 'photo', x: 12, y: 0, w: 2, h: 2 },
      // ── 욕조 (물이 조금) · 고무 오리 · 바가지
      { kind: 'bathtub', x: 2, y: 3, w: 6, h: 3, solid: true },
      { kind: 'duck', x: 6, y: 4, w: 1, h: 1 },
      // ── 세면대 (윗면은 높은 층) · 의자
      { kind: 'surfaceTop:marble', x: 10, y: 3, w: 7, h: 1 },
      { kind: 'surfaceFront:sink', x: 10, y: 4, w: 7, h: 1 },
      { kind: 'stool', x: 16, y: 5, w: 1, h: 1, solid: true },
      // ── 「욕실」 상자 · 수건 더미 · 빨래 바구니: 젖은 바닥에서 미끄러지다 멈추는 자리 (오른쪽 위로 가는 길은 막혀 있다)
      { kind: 'cartonM:욕실', x: 17, y: 5, w: 1, h: 1, solid: true },
      { kind: 'towelPile', x: 18, y: 3, w: 1, h: 1, solid: true },
      { kind: 'cartonS:욕실', x: 8, y: 6, w: 1, h: 1, solid: true },
      { kind: 'cartonS:욕실', x: 5, y: 9, w: 1, h: 1, solid: true },
      { kind: 'cartonL:욕실', x: 16, y: 7, w: 2, h: 1, solid: true },
      { kind: 'trashBag', x: 18, y: 7, w: 1, h: 1, solid: true },
      // ── 젖은 바닥 위 마른 자리: 때수건 · 발판 (멈춰 설 수 있다)
      { kind: 'rug:#c8d8a0', x: 4, y: 11, w: 1, h: 1 },
      { kind: 'rug:#d8c0a0', x: 15, y: 9, w: 1, h: 1 },
      // ── 마른 바닥 (문 앞 발판 · 때수건)
      { kind: 'rug:#7a9ab8', x: 8, y: 13, w: 4, h: 2 },
      { kind: 'slipper:blue', x: 3, y: 13, w: 1, h: 1 },
      { kind: 'tapeBit', x: 16, y: 13, w: 1, h: 1 },
      { kind: 'coin:10', x: 2, y: 14, w: 1, h: 1 },
      { kind: 'hairBand', x: 13, y: 14, w: 1, h: 1 },
      { kind: 'button', x: 18, y: 12, w: 1, h: 1 },
      { kind: 'hairBand:yellow', x: 2, y: 10, w: 1, h: 1 },
      { kind: 'coin', x: 16, y: 11, w: 1, h: 1 },
      // ── 윗층: 천장 등
      { kind: 'ceilLamp', x: 10, y: 8, w: 1, h: 1, over: true },
      // ── 앞쪽 가림막: 빨래 바구니 가장자리
      { kind: 'cartonOpen', x: 17, y: 14, w: 1, h: 1, fg: true },
    ],
    start: [10, 14],
    music: 'night',
    beams: [{ x: 4, w: 2, h: 8, slant: 2 }],
    lights: [
      { at: [13, 3], r: 50, color: [200, 220, 255], k: 0.35 },
      { at: [9, 9], r: 90, color: [150, 190, 255], k: 0.18 },
    ],
    ambient: [86, 96, 132],
  };
}
