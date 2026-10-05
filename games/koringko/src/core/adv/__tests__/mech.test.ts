/**
 * 새 놀이 규칙의 순수 계산 (mech.ts): 시야 · 빛줄기와 거울 · 미끄럼 · 톱니 전달 · 물길 · 음 이름.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { flowCells, gearSpin, mirrorTurn, NOTE_SFX, noteSfx, sightCells, slideDest, traceBeam } from '../mech.ts';

const key = (x: number, y: number) => `${x},${y}`;
const open = () => false;

describe('sightCells (지켜보는 이의 시야)', () => {
  test('오른쪽을 보는 부채꼴(반지름 3, 반각 45°): 앞 · 비스듬한 앞은 보이고, 뒤 · 너무 먼 곳 · 옆구리는 안 보인다', () => {
    const s = sightCells([4, 4], 'right', 3, 45, open, 9, 9);
    assert.ok(s.has(key(5, 4)) && s.has(key(6, 4)));
    assert.ok(s.has(key(7, 4)), '딱 반지름 3 칸 (결곗값) 은 보인다');
    assert.ok(!s.has(key(8, 4)), '반지름 밖');
    assert.ok(s.has(key(6, 5)), '26.6° 는 부채꼴 안');
    assert.ok(!s.has(key(5, 6)), '63.4° 는 부채꼴 밖');
    assert.ok(!s.has(key(3, 4)), '등 뒤');
    assert.ok(!s.has(key(4, 4)), '자기 칸은 세지 않는다');
  });

  test('반각 45° 의 경계 (정확히 대각선) 는 보인다', () => {
    const s = sightCells([4, 4], 'down', 4, 45, open, 9, 9);
    assert.ok(s.has(key(6, 6)));
    assert.ok(!s.has(key(7, 6)), '56.3° 는 밖');
  });

  test('막는 칸 뒤는 가려진다 (막는 칸 자체도 보이는 칸이 아니다)', () => {
    const wall = (x: number, y: number) => x === 5 && y === 4;
    const s = sightCells([4, 4], 'right', 4, 45, wall, 9, 9);
    assert.ok(!s.has(key(5, 4)));
    assert.ok(!s.has(key(6, 4)) && !s.has(key(7, 4)), '바로 뒤 줄이 가려짐');
    assert.ok(s.has(key(5, 3)) && s.has(key(6, 2)), '막는 칸 모서리를 스치는 대각선 칸은 보인다');
  });

  test('반각 180° 이상이면 둘레 원 (센서등), 반지름 0 이면 아무것도 안 보인다', () => {
    const s = sightCells([4, 4], 'up', 2, 180, open, 9, 9);
    assert.ok(s.has(key(4, 6)) && s.has(key(2, 4)) && s.has(key(4, 2)));
    assert.ok(!s.has(key(6, 6)), '대각선 2.83 칸은 반지름 2 밖');
    assert.equal(sightCells([4, 4], 'up', 0, 180, open, 9, 9).size, 0);
  });

  test('지도 밖 칸은 넣지 않는다', () => {
    const s = sightCells([0, 0], 'left', 3, 180, open, 4, 4);
    for (const k of s) {
      const [x, y] = k.split(',').map(Number);
      assert.ok(x >= 0 && y >= 0 && x < 4 && y < 4, k);
    }
  });
});

describe('mirrorTurn · traceBeam (손거울 빛 반사)', () => {
  test('거울 네 방향: 0 위↔오른쪽 · 1 오른쪽↔아래 · 2 아래↔왼쪽 · 3 왼쪽↔위, 뒷면으로 들어오면 막힌다', () => {
    // 오른쪽으로 가던 빛은 왼쪽 면으로 들어온다
    assert.equal(mirrorTurn(2, 'right'), 'down');
    assert.equal(mirrorTurn(3, 'right'), 'up');
    assert.equal(mirrorTurn(0, 'right'), null);
    assert.equal(mirrorTurn(1, 'right'), null);
    // 아래로 가던 빛은 윗면으로 들어온다
    assert.equal(mirrorTurn(0, 'down'), 'right');
    assert.equal(mirrorTurn(3, 'down'), 'left');
    assert.equal(mirrorTurn(1, 'up'), 'right');
    assert.equal(mirrorTurn(2, 'up'), 'left');
  });

  test('거울이 없으면 곧게 가다 막히는 칸 앞에서 멈춘다', () => {
    const wall = (x: number) => x === 6;
    const b = traceBeam([1, 1], 'right', () => null, wall, [9, 9], 8, 4);
    assert.deepEqual(b.cells, [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]);
    assert.equal(b.hit, false);
  });

  test('거울 두 개로 꺾어 과녁에 닿는다', () => {
    const mirrors: Record<string, number> = { '4,1': 2, '4,3': 0 };
    const b = traceBeam([1, 1], 'right', (x, y) => mirrors[key(x, y)] ?? null, open, [7, 3], 8, 5);
    assert.equal(b.hit, true);
    assert.deepEqual(b.cells.at(-1), [7, 3]);
    assert.ok(b.cells.some(([x, y]) => x === 4 && y === 2), '두 거울 사이 세로 줄을 지난다');
  });

  test('거울 뒷면에 닿으면 빛이 그 칸에서 끝난다', () => {
    const b = traceBeam([1, 1], 'right', (x, y) => (x === 3 && y === 1 ? 0 : null), open, [7, 1], 8, 4);
    assert.equal(b.hit, false);
    assert.deepEqual(b.cells.at(-1), [3, 1]);
  });

  test('과녁이 막힌 칸(가구 속 열쇠 구멍)이어도 닿는다', () => {
    const b = traceBeam([1, 1], 'right', () => null, (x) => x === 5, [5, 1], 8, 4);
    assert.equal(b.hit, true);
  });

  test('거울 넷이 고리를 이뤄도 끝난다 (같은 칸 · 같은 방향을 다시 지나면 멈춤)', () => {
    const m: Record<string, number> = { '2,1': 1, '2,3': 0, '5,3': 3, '5,1': 2 };
    // 시작 칸 (3,1) 에서 오른쪽 → (5,1) 거울 2 → 아래 → (5,3) 3 → 왼쪽 → (2,3) 0 → 위 → (2,1) 1 → 오른쪽 → … 고리
    const b = traceBeam([3, 1], 'right', (x, y) => m[key(x, y)] ?? null, open, [9, 9], 8, 6);
    assert.equal(b.hit, false);
    assert.ok(b.cells.length < 40, `${b.cells.length}`);
  });
});

describe('slideDest (젖은 타일 미끄럼)', () => {
  // 가로 0..9, 1..6 칸이 젖음, 9 는 벽
  const slip = (x: number, y: number) => y === 0 && x >= 1 && x <= 6;
  const free = (x: number, y: number) => y === 0 && x >= 0 && x < 9;
  test('젖은 칸이 끝나면 첫 마른 칸에 멈춘다', () => {
    assert.deepEqual(slideDest([1, 0], [1, 0], slip, free), [7, 0]);
  });
  test('벽 앞의 젖은 칸에서 멈춘다', () => {
    const allSlip = (x: number, y: number) => y === 0 && x >= 1;
    assert.deepEqual(slideDest([2, 0], [1, 0], allSlip, free), [8, 0]);
  });
  test('막힌 칸(밀어 둔 슬리퍼) 앞에서 멈춘다 · 바로 앞이 막히면 제자리', () => {
    const withSlipper = (x: number, y: number) => free(x, y) && x !== 4;
    assert.deepEqual(slideDest([1, 0], [1, 0], slip, withSlipper), [3, 0]);
    assert.deepEqual(slideDest([3, 0], [1, 0], slip, withSlipper), [3, 0]);
  });
  test('왼쪽으로도 같은 규칙', () => {
    assert.deepEqual(slideDest([6, 0], [-1, 0], slip, free), [0, 0]);
  });
});

describe('gearSpin (톱니 전달)', () => {
  test('맞닿은 톱니를 따라 돌고, 방향이 번갈아 바뀐다', () => {
    const g = gearSpin([0, 0], [[1, 0], [2, 0], [3, 0]], []);
    assert.equal(g.jammed, false);
    assert.equal(g.spin.get(key(0, 0)), 1);
    assert.equal(g.spin.get(key(1, 0)), -1);
    assert.equal(g.spin.get(key(3, 0)), -1);
  });
  test('떨어진 톱니는 돌지 않는다 (대각선은 맞물리지 않음)', () => {
    const g = gearSpin([0, 0], [[1, 1], [2, 1]], []);
    assert.equal(g.spin.size, 1);
    assert.ok(!g.spin.has(key(1, 1)));
  });
  test('녹슨 톱니(jam)가 이어지면 전체가 멈춘다', () => {
    const g = gearSpin([0, 0], [[1, 0], [2, 0]], [[3, 0]]);
    assert.equal(g.jammed, true);
    assert.equal(g.spin.size, 0);
    const apart = gearSpin([0, 0], [[1, 0]], [[3, 0]]);
    assert.equal(apart.jammed, false);
    assert.equal(apart.spin.size, 2);
  });
});

describe('flowCells (물길)', () => {
  // 물길: 가로 (1..7, 2), 세로 갈래 (4, 3..5)
  const ch = new Set<string>();
  for (let x = 1; x <= 7; x++) ch.add(key(x, 2));
  for (let y = 3; y <= 5; y++) ch.add(key(4, y));
  test('수원에서 이어진 물길을 모두 채운다', () => {
    const w = flowCells([1, 2], ch, () => false);
    assert.ok(w.has(key(7, 2)) && w.has(key(4, 5)));
    assert.equal(w.size, ch.size);
  });
  test('물길에 놓인 벽돌이 물을 막는다 (그 뒤는 마름)', () => {
    const w = flowCells([1, 2], ch, (x, y) => x === 5 && y === 2);
    assert.ok(!w.has(key(5, 2)) && !w.has(key(7, 2)));
    assert.ok(w.has(key(4, 5)), '다른 갈래는 그대로');
  });
  test('수원이 막혀 있으면 물이 없다 · 물길 밖 칸으로는 흐르지 않는다', () => {
    assert.equal(flowCells([1, 2], ch, (x, y) => x === 1 && y === 2).size, 0);
    assert.ok(!flowCells([1, 2], ch, () => false).has(key(4, 1)));
  });
});

describe('noteSfx (음 발판)', () => {
  test('도레미파솔라시 · 높은 도 모두 효과음 이름이 있고 서로 다르다', () => {
    const names = ['도', '레', '미', '파', '솔', '라', '시', '높은도'].map(noteSfx);
    assert.ok(names.every((n) => typeof n === 'string' && n.length > 0));
    assert.equal(new Set(names).size, 8);
    assert.equal(Object.keys(NOTE_SFX).length, 8);
  });
  test('모르는 음은 null', () => {
    assert.equal(noteSfx('뿡'), null);
  });
});
