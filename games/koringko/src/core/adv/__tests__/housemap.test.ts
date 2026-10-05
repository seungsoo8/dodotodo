/** houseMap: 투더문식 사람 크기 집 지도 빌더 (여러 방 · 칸막이 · 문 · 높은 바닥 · 가구 밑 · 지금/옛날) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { houseMap, type HouseSpec } from '../story/kit.ts';
import { isSolidChar } from '../../maps.ts';
import type { RoomDef } from '../types.ts';

const at = (r: RoomDef, x: number, y: number): string => r.tiles[y][x];

/** 사람 기준 (isSolidChar) 으로 걸어서 닿는 칸들 */
function reach(r: RoomDef, sx: number, sy: number): Set<string> {
  const seen = new Set<string>([`${sx},${sy}`]);
  const q: [number, number][] = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= r.w || ny >= r.h) continue;
      const k = `${nx},${ny}`;
      if (seen.has(k) || isSolidChar(at(r, nx, ny))) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

/** 나란한 두 방: 거실(x 1~5) | 칸막이(x 6) | 부엌(x 7~11), 맨 아래 줄 7 은 바깥 벽 */
const sideBySide = (doors: HouseSpec['doors']): HouseSpec => ({
  id: 'two',
  w: 13,
  h: 8,
  rooms: [
    { id: 'living', rect: [1, 0, 5, 7], look: 'living' },
    { id: 'kitchen', rect: [7, 0, 5, 7], look: 'kitchen' },
  ],
  doors,
  furniture: [],
  start: [3, 5],
});

test('houseMap 나란한 두 방: 바깥 왼쪽 · 오른쪽 · 아래는 X, 위는 뒷벽 W, 칸막이 X, 문 칸은 D', () => {
  const r = houseMap(sideBySide([{ between: ['living', 'kitchen'], at: 5 }]));
  assert.equal(r.w, 13);
  assert.equal(r.h, 8);
  assert.equal(r.scale, 'human');
  for (let y = 0; y < 8; y++) {
    assert.equal(at(r, 0, y), 'X', `왼쪽 가장자리 (0,${y})`);
    assert.equal(at(r, 12, y), 'X', `오른쪽 가장자리 (12,${y})`);
  }
  for (let x = 0; x < 13; x++) assert.equal(at(r, x, 7), 'X', `아래 가장자리 (${x},7)`);
  for (const x of [1, 3, 5, 7, 11]) assert.equal(at(r, x, 0), 'W', `위 가장자리 (${x},0) 은 뒷벽 앞면`);
  // 세로 칸막이: 문 줄(5) 만 D
  for (let y = 0; y < 7; y++) assert.equal(at(r, 6, y), y === 5 ? 'D' : 'X', `칸막이 (6,${y})`);
});

test('houseMap 문을 지나 다른 방까지 걸어서 닿고, 문을 빼면 닿지 않는다', () => {
  const open = houseMap(sideBySide([{ between: ['living', 'kitchen'], at: 5 }]));
  assert.equal(at(open, open.start.x, open.start.y), 'w');
  assert.ok(reach(open, 3, 5).has('9,5'), '문이 있으면 부엌 (9,5) 에 닿음');
  assert.ok(reach(open, 3, 5).has('11,3'), '부엌 구석 (11,3) 에도 닿음');

  const shut = houseMap(sideBySide([]));
  const got = reach(shut, 3, 5);
  assert.ok(!got.has('9,5'), '문이 없으면 부엌에 닿지 않음');
  assert.ok(got.has('5,6'), '거실 안은 그대로 다닌다');
  for (let y = 0; y < 7; y++) assert.equal(at(shut, 6, y), 'X');
});

test('houseMap 위아래 방: 위 방 쪽 X 한 줄 + 아래 방 뒷벽 W 줄, 문은 둘 다 뚫는다', () => {
  const spec: HouseSpec = {
    id: 'stack',
    w: 8,
    h: 11,
    rooms: [
      { id: 'up', rect: [1, 0, 6, 4], look: 'a', wallH: 2 },
      { id: 'down', rect: [1, 5, 6, 5], look: 'b', wallH: 2 },
    ],
    doors: [{ between: ['up', 'down'], at: 3 }],
    furniture: [],
    start: [2, 3],
  };
  const r = houseMap(spec);
  assert.equal(at(r, 2, 4), 'X', '가로 칸막이 윗면 띠');
  assert.equal(at(r, 2, 5), 'W', '아래 방 뒷벽 1줄');
  assert.equal(at(r, 2, 6), 'W', '아래 방 뒷벽 2줄');
  assert.equal(at(r, 2, 7), 'w', '아래 방 바닥');
  assert.deepEqual([at(r, 3, 4), at(r, 3, 5), at(r, 3, 6)], ['D', 'D', 'D'], '문은 X 줄과 아래 방 뒷벽을 뚫는다');
  assert.ok(reach(r, 2, 3).has('5,9'), '위 방에서 아래 방 구석까지 닿음');

  const shut = houseMap({ ...spec, doors: [] });
  assert.ok(!reach(shut, 2, 3).has('5,9'));
});

test('houseMap 뒷벽 높이: 기본 3이면 방 맨 위 3줄이 W, 그 아래가 바닥 / wallH 로 바꿀 수 있다', () => {
  const r = houseMap({ id: 'h', w: 7, h: 9, rooms: [{ id: 'r', rect: [1, 0, 5, 8], look: 'x' }], furniture: [] });
  for (let x = 1; x <= 5; x++) {
    assert.deepEqual([0, 1, 2, 3].map((y) => at(r, x, y)), ['W', 'W', 'W', 'w'], `열 ${x}`);
  }
  const low = houseMap({ id: 'h', w: 7, h: 9, rooms: [{ id: 'r', rect: [1, 0, 5, 8], look: 'x', wallH: 1 }], furniture: [] });
  assert.equal(at(low, 3, 0), 'W');
  assert.equal(at(low, 3, 1), 'w');
});

test('houseMap 높은 바닥: ^ 칸은 elev 1, 바로 아래 줄은 S, 나머지는 0', () => {
  const r = houseMap({
    id: 'raised',
    w: 10,
    h: 10,
    rooms: [{ id: 'r', rect: [1, 0, 8, 9], look: 'x', raised: [[2, 4, 3, 2]] }],
    furniture: [],
  });
  assert.ok(r.elev, 'elev 를 채운다');
  assert.equal(r.elev!.length, 10);
  for (let y = 0; y < 10; y++) {
    assert.equal(r.elev![y].length, 10);
    for (let x = 0; x < 10; x++) {
      const up = x >= 2 && x <= 4 && y >= 4 && y <= 5;
      assert.equal(r.elev![y][x], up ? '1' : '0', `elev (${x},${y})`);
      if (up) assert.equal(at(r, x, y), '^');
    }
  }
  for (const x of [2, 3, 4]) assert.equal(at(r, x, 6), 'S', `단 앞면 (${x},6)`);
  assert.equal(at(r, 1, 6), 'w', '단 옆은 그대로 바닥');
  assert.equal(at(r, 5, 6), 'w');
  assert.equal(at(r, 3, 3), 'w', '단 위쪽 줄은 바닥');
  // 사람은 단 위를 걷고 (같은 층), 단 앞면은 막힘
  assert.equal(isSolidChar('^'), false);
  assert.equal(isSolidChar('S'), true);
});

test('houseMap 높은 바닥이 방 맨 아래 줄까지 오면 앞면 S 가 바깥 벽 X 를 덮지 않는다', () => {
  const r = houseMap({ id: 'edge', w: 6, h: 7, rooms: [{ id: 'r', rect: [1, 0, 4, 6], look: 'x', raised: [[1, 4, 4, 2]] }], furniture: [] });
  assert.equal(at(r, 2, 5), '^');
  assert.equal(at(r, 2, 6), 'X');
});

test('houseMap 가구: under 칸은 U, solid 칸은 H, over · fg 는 막지 않는다 (튜플 · 객체 둘 다)', () => {
  const r = houseMap({
    id: 'furn',
    w: 12,
    h: 10,
    rooms: [{ id: 'r', rect: [1, 0, 10, 9], look: 'x' }],
    furniture: [
      ['wardrobe', 1, 3, 2, 2, true],
      { kind: 'bed', x: 4, y: 4, w: 3, h: 2, under: true },
      { kind: 'beam', x: 1, y: 6, w: 10, h: 1, over: true },
      { kind: 'sofaArm', x: 8, y: 7, w: 2, h: 1, fg: true },
      ['rug', 7, 3, 2, 2],
    ],
  });
  for (const [x, y] of [[1, 3], [2, 3], [1, 4], [2, 4]]) assert.equal(at(r, x, y), 'H', `장롱 (${x},${y})`);
  for (let y = 4; y < 6; y++) for (let x = 4; x < 7; x++) assert.equal(at(r, x, y), 'U', `침대 밑 (${x},${y})`);
  for (let x = 1; x <= 10; x++) assert.equal(at(r, x, 6), 'w', `들보 아래 (${x},6) 는 바닥`);
  assert.equal(at(r, 8, 7), 'w', '앞 가림막은 막지 않음');
  assert.equal(at(r, 7, 3), 'w', 'solid 아닌 깔개는 막지 않음');
  // 사람에게 U 는 막힘 (장난감 통과는 adv.ts 에서)
  assert.equal(isSolidChar('U'), true);
  assert.equal(isSolidChar('D'), false);
  assert.equal(isSolidChar('X'), true);

  const kinds = r.furniture!.map((f) => f.kind);
  assert.deepEqual(kinds, ['wardrobe', 'bed', 'beam', 'sofaArm', 'rug']);
  assert.equal(r.furniture![1].under, true);
  assert.equal(r.furniture![2].over, true);
  assert.equal(r.furniture![3].fg, true);
  assert.equal(r.furniture![0].over, undefined);
});

test('houseMap 가구는 벽 · 문을 덮지 않는다 (막힘은 바닥 칸에만)', () => {
  const r = houseMap({ id: 'f', w: 8, h: 8, rooms: [{ id: 'r', rect: [1, 0, 6, 7], look: 'x' }], furniture: [['shelf', 1, 1, 2, 3, true]] });
  assert.equal(at(r, 1, 1), 'W', '뒷벽 위의 책장 윗부분은 W 그대로');
  assert.equal(at(r, 1, 3), 'H', '발 자리만 H');
});

test('houseMap era: now 에서는 era past 가구가 빠지고, past 에서는 era now (이삿짐) 가 빠진다', () => {
  const spec: HouseSpec = {
    id: 'haru',
    w: 10,
    h: 9,
    rooms: [{ id: 'r', rect: [1, 0, 8, 8], look: 'haru' }],
    furniture: [
      ['bed', 1, 3, 3, 2, true],
      { kind: 'boxes', x: 5, y: 5, w: 2, h: 1, solid: true, era: 'now' },
      { kind: 'toybox', x: 6, y: 3, w: 2, h: 1, solid: true, era: 'past' },
    ],
  };
  const now = houseMap(spec, { era: 'now' });
  assert.deepEqual(now.furniture!.map((f) => f.kind), ['bed', 'boxes']);
  assert.equal(at(now, 5, 5), 'H', '지금: 이삿짐 상자 자리 막힘');
  assert.equal(at(now, 6, 3), 'w', '지금: 장난감 상자 자리 빔');

  const past = houseMap(spec, { era: 'past' });
  assert.deepEqual(past.furniture!.map((f) => f.kind), ['bed', 'toybox']);
  assert.equal(at(past, 5, 5), 'w', '옛날: 이삿짐 없음');
  assert.equal(at(past, 6, 3), 'H', '옛날: 장난감 상자 있음');

  const all = houseMap(spec);
  assert.deepEqual(all.furniture!.map((f) => f.kind), ['bed', 'boxes'], 'era 를 안 주면 now');
  assert.ok(!('era' in all.furniture![1]), '결과 가구에 era 칸은 남기지 않음');
});

test('houseMap looks: 방마다 rect 와 look, look 기본은 첫 방', () => {
  const r = houseMap({ ...sideBySide([]), music: 'night', things: [] });
  assert.deepEqual(r.looks, [
    { rect: [1, 0, 5, 7], look: 'living' },
    { rect: [7, 0, 5, 7], look: 'kitchen' },
  ]);
  assert.equal(r.look, 'living');
  assert.equal(r.music, 'night');
  assert.deepEqual(r.start, { x: 3, y: 5 });
});

test('houseMap 잘못된 배치는 바로 알려 준다', () => {
  // 겹치는 방
  assert.throws(() => houseMap({ id: 'bad', w: 10, h: 8, rooms: [{ id: 'a', rect: [1, 0, 5, 7], look: 'x' }, { id: 'b', rect: [5, 0, 4, 7], look: 'y' }], furniture: [] }), /겹/);
  // 바깥 테두리를 침범 (오른쪽 끝 열까지 방)
  assert.throws(() => houseMap({ id: 'bad', w: 6, h: 8, rooms: [{ id: 'a', rect: [1, 0, 5, 7], look: 'x' }], furniture: [] }), /가장자리/);
  // 이웃이 아닌 방 사이 문 · 겹치지 않는 줄의 문 · 뒷벽 줄의 문 · 없는 방
  assert.throws(() => houseMap(sideBySide([{ between: ['living', 'kitchen'], at: 9 }])), /문/);
  assert.throws(() => houseMap(sideBySide([{ between: ['living', 'kitchen'], at: 1 }])), /문/);
  assert.throws(() => houseMap(sideBySide([{ between: ['living', 'attic'], at: 5 }])), /attic/);
  // 높은 바닥이 방 밖
  assert.throws(() => houseMap({ id: 'bad', w: 8, h: 8, rooms: [{ id: 'a', rect: [1, 0, 6, 7], look: 'x', raised: [[5, 4, 4, 1]] }], furniture: [] }), /높은 바닥/);
});

test('houseMap 직접 뚫는 문 rect (바깥으로 나가는 문 자리)', () => {
  const r = houseMap({ ...sideBySide([{ rect: [3, 7, 1, 1] }]) });
  assert.equal(at(r, 3, 7), 'D');
  assert.equal(at(r, 2, 7), 'X');
});
