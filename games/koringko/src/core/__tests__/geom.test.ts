import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { angleDiff, clampToRoom, distPointSegment, inArc, normalize, pushOutOfRect } from '../geom.ts';

const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

describe('기하', () => {
  test('방향 맞추기: 길이 1, 0 벡터는 그대로 0', () => {
    const v = normalize({ x: 3, y: 4 });
    assert.ok(near(v.x, 0.6) && near(v.y, 0.8));
    assert.deepEqual(normalize({ x: 0, y: 0 }), { x: 0, y: 0 });
  });

  test('각도 차이는 -π ~ π 로 접힌다', () => {
    assert.ok(near(angleDiff(0.1, -0.1), 0.2));
    assert.ok(near(angleDiff(Math.PI - 0.1, -Math.PI + 0.1), -0.2));
    assert.ok(near(angleDiff(-Math.PI + 0.1, Math.PI - 0.1), 0.2));
  });

  test('부채꼴 안: 사거리와 각도 안 (몸집만큼 넉넉히)', () => {
    const o = { x: 0, y: 0 };
    // 오른쪽(0 rad)으로 90° 부채꼴, 사거리 40
    assert.equal(inArc(o, 0, 40, 90, { x: 30, y: 0 }, 0), true);
    assert.equal(inArc(o, 0, 40, 90, { x: 30, y: 25 }, 0), true, '45° 바로 안');
    assert.equal(inArc(o, 0, 40, 90, { x: 20, y: 30 }, 0), false, '각도 밖');
    assert.equal(inArc(o, 0, 40, 90, { x: 20, y: 30 }, 12), true, '몸집이 크면 걸친다');
    assert.equal(inArc(o, 0, 40, 90, { x: 50, y: 0 }, 0), false, '사거리 밖');
    assert.equal(inArc(o, 0, 40, 90, { x: 50, y: 0 }, 12), true, '몸집만큼 닿는다');
    assert.equal(inArc(o, 0, 40, 90, { x: -30, y: 0 }, 0), false, '뒤');
    assert.equal(inArc(o, 0, 40, 360, { x: -30, y: 0 }, 0), true, '360° 는 사방');
  });

  test('점과 선분 거리', () => {
    assert.ok(near(distPointSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 3));
    assert.ok(near(distPointSegment({ x: -4, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 5), '끝점 바깥');
    assert.ok(near(distPointSegment({ x: 2, y: 2 }, { x: 1, y: 1 }, { x: 1, y: 1 }), Math.SQRT2), '길이 0 선분');
  });

  test('네모 장애물에 박힌 원은 가장 가까운 바깥으로 밀려난다', () => {
    const rect = { x: 0, y: 0, w: 40, h: 20 };
    const p = pushOutOfRect({ x: 20, y: -3 }, 5, rect);
    assert.ok(near(p.x, 20) && near(p.y, -5), JSON.stringify(p));
    const q = pushOutOfRect({ x: 43, y: 10 }, 5, rect);
    assert.ok(near(q.x, 45) && near(q.y, 10));
    const corner = pushOutOfRect({ x: 43, y: 23 }, 5, rect);
    assert.ok(near(Math.hypot(corner.x - 40, corner.y - 20), 5), '모서리에서는 반지름만큼');
    assert.deepEqual(pushOutOfRect({ x: 60, y: 60 }, 5, rect), { x: 60, y: 60 }, '안 닿으면 그대로');
    const inside = pushOutOfRect({ x: 20, y: 15 }, 5, rect);
    assert.ok(near(inside.y, 25), '안쪽 깊이 박혀도 가까운 쪽(아래)으로');
  });

  test('방 벽 안으로 (반지름만큼 떨어져서)', () => {
    const room = { width: 200, height: 100 };
    assert.deepEqual(clampToRoom({ x: -10, y: 50 }, 8, room, 16), { x: 24, y: 50 });
    assert.deepEqual(clampToRoom({ x: 300, y: 120 }, 8, room, 16), { x: 176, y: 76 });
  });
});
