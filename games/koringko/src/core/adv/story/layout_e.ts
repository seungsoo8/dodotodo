/**
 * 갈래 E 배치: 17장 토비의 태엽 속 (근접 · 환상 지도) · 20장 할머니의 재봉 상자 (근접 지도) · 마지막 장 새벽 다락 (1장 다락 배치의 새벽 상태).
 * 지도 글자 · 거대한 소품 · 빛 · 소리만 여기에, 놀이 · 기억 · 대사는 각 장 파일에.
 */
import type { Furniture, Pt, RoomDef } from '../types.ts';
import { ATTIC_HOUSE } from './ch1.ts';
import { grid, type HouseFurn, type HouseSpec } from './kit.ts';

type Rect4 = [number, number, number, number];
const f = (kind: string, x: number, y: number, w = 1, h = 1, extra: Partial<Furniture> = {}): Furniture => ({ kind, x, y, w, h, ...extra });

/** 가구 발 자리를 지도 글자로 막는다 (바닥 칸만) */
function solidify(rows: string[], feet: Rect4[], floor: string): string[] {
  const t = rows.map((r) => r.split(''));
  for (const [x, y, w, h] of feet) for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (floor.includes(t[yy]?.[xx] ?? '#')) t[yy][xx] = 'H';
  return t.map((r) => r.join(''));
}

/** 바닥을 지나는 실: 꺾은선 (칸 점들, 가로 · 세로로만) → 칸마다 yarnLine (h · v · 꺾임) */
export function threadPath(points: Pt[]): Furniture[] {
  const cells: Pt[] = [];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    if (ax !== bx && ay !== by) throw new Error(`실은 가로 · 세로로만: ${ax},${ay} → ${bx},${by}`);
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) cells.push([ax + Math.sign(bx - ax) * k, ay + Math.sign(by - ay) * k]);
  }
  return cells.map(([x, y], i) => {
    const prev = cells[i - 1];
    const next = cells[i + 1];
    const dirs = new Set<string>();
    for (const q of [prev, next]) {
      if (!q) continue;
      if (q[0] < x) dirs.add('w');
      if (q[0] > x) dirs.add('e');
      if (q[1] < y) dirs.add('n');
      if (q[1] > y) dirs.add('s');
    }
    const v = (dirs.has('n') || dirs.has('s')) && !(dirs.has('e') || dirs.has('w'));
    const h = (dirs.has('e') || dirs.has('w')) && !(dirs.has('n') || dirs.has('s'));
    const corner = `${dirs.has('n') ? 'n' : 's'}${dirs.has('e') ? 'e' : 'w'}`;
    return f(`yarnLine:${v ? 'v' : h || dirs.size < 2 ? (dirs.has('n') || dirs.has('s') ? 'v' : 'h') : corner}`, x, y);
  });
}

// ───────────────────────── 17장 · 토비의 태엽 속 (32×20) ─────────────────────────

export const TOBYKEY_W = 32;
export const TOBYKEY_H = 20;

/** 톱니 놀이 자리: 큰톱니(동력) · 작은톱니(다리 축) · 녹슨 톱니 · 밀어 넣을 톱니 다섯의 처음 자리 */
export const TK = {
  start: [3, 17] as Pt,
  bigGear: [6, 6] as Pt,
  smallGear: [10, 8] as Pt,
  rust: [9, 6] as Pt,
  gears: { tkG1: [4, 7], tkG2: [6, 10], tkG3: [7, 12], tkG4: [11, 10], tkG5: [9, 12] } as Record<string, Pt>,
  /** 톱니가 돌면 내려오는 다리 (가운데 낭떠러지) · 밧줄을 걸 수 없는 틈의 at (아득한 바닥) */
  bridge: [[13, 8], [14, 8]] as Pt[],
  bridgeAt: [13, 19] as Pt,
  link: [17, 4] as Pt,
  /** 메아리: 5살 → 12살 → 13살 → 14살 차례로 들리는 자리 */
  echoes: [
    { age: '5', at: [19, 10] as Pt },
    { age: '12', at: [26, 13] as Pt },
    { age: '13', at: [29, 7] as Pt },
    { age: '14', at: [22, 15] as Pt },
  ],
  spring: [21, 3] as Pt,
};

/**
 * 지도 글자: m 쇠판 바닥 · W 뒷벽(토비 몸 안쪽 천 안감) · M 쇠틀 · v 낭떠러지(아득한 배 속) · H 거대한 소품 발.
 * 왼쪽(시작 · 톱니 방) | 가운데 낭떠러지 (작은톱니가 돌리는 다리) | 오른쪽(열쇠 구멍 아래 · 태엽 스프링 · 메아리 들판).
 */
export function tobykeyTiles(): string[] {
  const base = grid(TOBYKEY_W, TOBYKEY_H, 'm', 'M', [
    ['W', 1, 0, 30, 3],
    ['v', 1, 18, 30, 2],
    ['v', 13, 3, 2, 15],
  ]);
  return solidify(base, [...TOBYKEY_FURN.filter((x) => FEET_TK.has(x.kind.split(':')[0])).map((x): Rect4 => [x.x, x.y, x.w, x.h]), [TK.rust[0], TK.rust[1], 1, 1]], 'm');
}

/** 발 자리가 막히는 소품 */
const FEET_TK = new Set(['brassGear', 'mainspring', 'pawl', 'screwBig', 'cotton', 'keyGiant', 'counter']);

export const TOBYKEY_FURN: Furniture[] = [
  // 뒷벽: 하얀 천 안감, 가운데 열쇠 구멍
  f('clothWall', 1, 0, 4, 3), f('clothWall', 5, 0, 4, 3), f('clothWall', 9, 0, 4, 3),
  f('clothWall:keyhole', 13, 0, 4, 3),
  f('clothWall', 17, 0, 4, 3), f('clothWall', 21, 0, 4, 3), f('clothWall', 25, 0, 4, 3), f('clothWall', 29, 0, 2, 3),
  // 왼쪽: 큰 황동 톱니 (멈춰 감) · 솜 · 나사 · 걸쇠 (다리를 붙든)
  f('brassGear', 1, 4, 3, 2),
  f('brassGear', 2, 13, 3, 2),
  f('brassGear:rust,small', TK.rust[0], TK.rust[1]),
  f('cotton', 1, 10, 2, 1),
  f('cotton', 10, 16, 2, 1),
  f('screwBig', 6, 15, 2, 1),
  f('pawl', 11, 6, 2, 1),
  // 오른쪽: 열쇠 구멍 아래 커다란 열쇠 · 태엽 스프링 · 숫자판 · 톱니 · 나사 · 걸쇠 · 솜
  f('keyGiant', 15, 3, 2, 2),
  f('mainspring', TK.spring[0], TK.spring[1], 3, 2),
  f('counter:2917', 28, 3, 2, 1),
  f('brassGear', 21, 8, 3, 2),
  f('brassGear:small', 18, 16),
  f('screwBig', 17, 12, 2, 1),
  f('pawl', 26, 16, 2, 1),
  f('cotton', 29, 12, 2, 1),
  f('brassGear:small', 16, 10),
  f('screwBig', 25, 4, 2, 1),
  f('cotton', 19, 7, 2, 1),
  f('brassGear', 26, 9, 3, 2),
  f('pawl', 20, 13, 2, 1),
  f('cotton', 7, 3, 2, 1),
  f('pawl', 9, 14, 2, 1),
  // 메아리 (빛 글자 조각): 처음엔 흐릿, 차례가 되면 부르고 (faint), 들으면 금빛 (lit)
  ...TK.echoes.map((e, i) => f(`echo:${e.age}${i === 0 ? ',faint' : ''}`, e.at[0], e.at[1])),
  // 바닥: 기름방울 · 녹 · 부러진 첫 열쇠 자국 · 쇳가루 (지우개 가루 그림) · 거미줄 · 종이 부스러기
  f('oilDrop', 5, 9), f('oilDrop', 11, 13), f('oilDrop', 22, 6), f('oilDrop', 23, 11), f('oilDrop', 16, 15), f('oilDrop', 28, 5), f('oilDrop', 17, 14),
  f('rustPatch', 7, 4, 2, 1), f('rustPatch', 3, 11, 2, 1), f('rustPatch', 24, 17, 2, 1), f('rustPatch', 18, 6, 2, 1),
  f('brokenKey', 5, 14, 2, 1),
  f('eraserDust', 8, 16, 2, 1), f('eraserDust', 24, 11, 2, 1), f('eraserDust', 28, 14, 2, 1),
  f('cobweb', 12, 3), f('cobweb:right', 20, 3),
];

export const TOBYKEY_LIGHTS: RoomDef['lights'] = [
  // 열쇠 구멍으로 들어오는 바깥 빛 · 큰톱니 · 작은톱니의 놋쇠 빛 · 메아리 빛
  { at: [15, 3], r: 70, color: [255, 236, 190], k: 0.55 },
  { at: [6, 6], r: 46, color: [255, 200, 120], k: 0.3 },
  { at: [10, 8], r: 36, color: [255, 210, 130], k: 0.3 },
  ...TK.echoes.map((e) => ({ at: e.at, r: 30, color: [220, 210, 255] as const, k: 0.22 })),
  { at: [22, 4], r: 50, color: [200, 210, 240], k: 0.2 },
];

// ───────────────────────── 20장 · 할머니의 재봉 상자 (36×22) ─────────────────────────

export const SEWBOX_W = 36;
export const SEWBOX_H = 22;

/** 네 칸: 실패 칸 (왼쪽 위 · 시작) · 단추 칸 (오른쪽 위) · 천 조각 칸 (왼쪽 아래) · 바늘 칸 (오른쪽 아래, 깜깜) */
export const SB = {
  start: [8, 4] as Pt,
  spoolRoom: [1, 3, 16, 8] as Rect4,
  buttonRoom: [18, 3, 17, 8] as Rect4,
  scrapRoom: [1, 12, 16, 9] as Rect4,
  needleRoom: [18, 12, 17, 9] as Rect4,
  /** 칸막이 문: 실패 ↔ 천 조각 · 실패 ↔ 단추, 단추 ↔ 바늘 은 바닥 틈 (루루 밧줄) */
  doorDown: [8, 11] as Pt,
  doorRight: [17, 6] as Pt,
  crack: [27, 11] as Pt,
  /** 엉킨 매듭 다섯 (실을 따라 차례로) */
  knots: [[11, 8], [5, 15], [11, 18], [23, 15], [29, 15]] as Pt[],
  doll: [5, 4] as Pt,
  thimble: [13, 5] as Pt,
  eyes: [6, 6] as Pt,
  pincushion: [30, 12] as Pt,
  sew: [31, 14] as Pt,
  link: [33, 15] as Pt,
};

/** 노란 털실 한 가닥: 노란 실패 → 매듭 1 → 칸막이 문 → 매듭 2 · 3 → (칸막이 밑으로) → 매듭 4 · 5 → 바늘꽂이 */
const THREAD: Pt[][] = [
  [[11, 4], [11, 10], [8, 10], [8, 15], [5, 15], [5, 18], [16, 18]],
  [[18, 18], [23, 18], [23, 15], [29, 15], [29, 14]],
];

export function sewboxTiles(): string[] {
  const base = grid(SEWBOX_W, SEWBOX_H, 'a', 'K', [
    ['W', 1, 0, 34, 3],
    // 천 조각 칸은 조각보 바닥
    ['n', 1, 12, 16, 9],
    // 칸막이: 가로 (실패 · 단추 | 천 조각 · 바늘), 세로 (왼쪽 | 오른쪽)
    ['K', 1, 11, 34, 1],
    ['K', 17, 3, 1, 18],
    ['a', SB.doorDown[0], SB.doorDown[1], 1, 1],
    ['a', SB.doorRight[0], SB.doorRight[1], 1, 1],
    ['v', SB.crack[0], SB.crack[1], 1, 1],
  ]);
  return solidify(base, SEWBOX_FURN.filter((x) => FEET_SB.has(x.kind.split(':')[0])).map((x): Rect4 => [x.x, x.y, x.w, x.h]), 'an');
}

const FEET_SB = new Set(['spoolBig', 'pincushion', 'buttonHill', 'scissorsBig', 'thimbleCup', 'fabricHill', 'oilBottle']);

export const SEWBOX_FURN: Furniture[] = [
  // 뒷벽: 누빈 꽃무늬 안감, 맨 위는 뚜껑 틈의 새벽빛
  ...[1, 5, 9, 13, 18, 22, 26, 30].map((x) => f('quiltWall:lid', x, 0, 4, 3)),
  f('quiltWall:lid', 17, 0, 1, 3), f('quiltWall:lid', 34, 0, 1, 3),
  // 칸막이 끝 기둥
  f('divider', 17, 11), f('divider', 17, 3),
  // 실패 칸: 색색 실패 (노란 실이 시작되는 실패) · 기름병
  f('spoolBig:yellow', 10, 3, 2, 1),
  f('spoolBig:red', 1, 3, 2, 1),
  f('spoolBig:blue', 14, 9, 2, 1),
  f('spoolBig:purple', 1, 9, 2, 1),
  f('spoolBig:cream', 15, 3, 2, 1),
  f('oilBottle', 4, 9),
  f('chalk', 12, 10, 2, 1),
  f('pinBig', 7, 8, 3, 1),
  // 단추 칸: 단추 산 둘 · 엎어진 골무 · 흩어진 단추
  f('buttonHill', 20, 4, 3, 2),
  f('buttonHill', 29, 4, 3, 2),
  f('thimbleCup', 25, 9, 2, 1),
  f('bigButton:red4', 19, 8), f('bigButton:square', 24, 4), f('bigButton:black4', 33, 8), f('bigButton:cream', 27, 4),
  f('button', 22, 9), f('button', 31, 7),
  // 천 조각 칸: 천 조각 언덕 · 큰 가위 (벌어진 채) · 분필 · 시침핀
  f('fabricHill', 2, 13, 3, 2),
  f('fabricHill', 13, 14, 3, 2),
  f('scissorsBig', 9, 13, 4, 1),
  f('chalk', 6, 19, 2, 1),
  f('pinBig', 13, 20, 3, 1),
  // 바늘 칸: 토마토 바늘꽂이 · 시침핀 · 렌즈 조각 · 기름병
  f('pincushion', SB.pincushion[0], SB.pincushion[1], 3, 2),
  f('pinBig', 19, 14, 3, 1), f('pinBig', 26, 19, 3, 1),
  f('lensShard', 32, 18),
  f('oilBottle', 34, 12),
  f('thimbleCup', 19, 20, 2, 1),
  // 노란 털실과 매듭 (매듭은 풀면 loose)
  ...THREAD.flatMap(threadPath),
  ...SB.knots.map(([x, y]) => f('yarnKnot', x, y)),
  // 잔 소품: 거미줄 · 분필 가루 (지우개 가루 그림) · 종이 부스러기 · 머리끈
  f('cobweb', 12, 3), f('cobweb:right', 34, 3),
  f('eraserDust', 14, 16, 2, 1),
  f('paperStrips', 1, 19, 3, 2),
  f('hairTie', 20, 13),
  // 앞쪽 가림막: 상자 앞벽 위로 삐져나온 천 자락
  f('fabricHill', 22, 21, 3, 1, { fg: true }),
];

export const SEWBOX_LIGHTS: RoomDef['lights'] = [
  // 뚜껑 틈의 새벽빛 (분홍 · 푸름) · 바늘꽂이 바늘의 반짝임
  { at: [9, 3], r: 70, color: [255, 200, 210], k: 0.32 },
  { at: [26, 3], r: 70, color: [190, 210, 255], k: 0.3 },
  { at: [31, 12], r: 34, color: [255, 220, 200], k: 0.25 },
  // 천 조각 칸: 칸막이 문틈으로 내려온 빛
  { at: [8, 15], r: 64, color: [255, 210, 190], k: 0.25 },
];

// ───────────────────────── 마지막 장 · 새벽 다락 (1장 배치) ─────────────────────────

/**
 * 1장 다락 그대로, 새벽 상태: 뚜껑문은 열린 채, 재봉 상자 틈엔 바늘, 둥근 창은 분홍 새벽 하늘,
 * 뚜껑문 아래 노란 불빛은 꺼지고 (엄마도 잠들었다), 창빛은 분홍으로.
 */
export function atticDawnSpec(): HouseSpec {
  const furniture = ATTIC_HOUSE.furniture.map((x): HouseFurn | typeof x => (!Array.isArray(x) && x.kind === 'sewbox' ? { ...x, kind: 'sewbox:needle' } : x));
  return {
    ...ATTIC_HOUSE,
    id: 'attic_dawn',
    name: '새벽 다락방',
    furniture: [
      ...furniture,
      { kind: 'dawnPane', x: 13, y: 0, w: 4, h: 3 },
      { kind: 'trapdoor:open', x: 13, y: 12, w: 2, h: 2, solid: true },
      // 밤새 다녀온 흔적: 상자 위의 종이별 · 사다리 옆 테이프 조각 · 굴러온 단추
      { kind: 'tapeBit', x: 15, y: 14, w: 1, h: 1 },
      { kind: 'button', x: 10, y: 14, w: 1, h: 1 },
      { kind: 'markerPen', x: 20, y: 13, w: 1, h: 1 },
    ],
    start: [11, 14],
    music: 'night',
    beams: [{ x: 13, w: 4, h: 10, slant: -3 }],
    lights: [
      { at: [14, 4], r: 60, color: [255, 190, 200], k: 0.45 },
      { at: [11, 13], r: 30, color: [255, 220, 200], k: 0.3 },
    ],
    ambient: [196, 160, 176],
  };
}
