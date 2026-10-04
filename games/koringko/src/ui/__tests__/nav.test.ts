import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNext, type Box } from '../nav.ts';

// 2×2 격자 + 아래 넓은 단추
const a: Box = { x: 0, y: 0, w: 40, h: 20 };
const b: Box = { x: 50, y: 0, w: 40, h: 20 };
const c: Box = { x: 0, y: 30, w: 40, h: 20 };
const d: Box = { x: 50, y: 30, w: 40, h: 20 };
const wide: Box = { x: 0, y: 60, w: 90, h: 20 };
const all = [a, b, c, d, wide];

test('초점 이동: 방향키 쪽의 가장 가까운 단추로 간다', () => {
  assert.equal(pickNext(all, a, 1, 0), b);
  assert.equal(pickNext(all, a, 0, 1), c);
  assert.equal(pickNext(all, d, -1, 0), c);
  assert.equal(pickNext(all, d, 0, -1), b);
  assert.equal(pickNext(all, c, 0, 1), wide);
  assert.equal(pickNext(all, wide, 0, -1), c);
});

test('초점 이동: 그 방향에 단추가 없으면 반대편 끝으로 돈다', () => {
  assert.equal(pickNext(all, b, 1, 0), a);
  assert.equal(pickNext(all, wide, 0, 1), a);
  assert.equal(pickNext(all, a, 0, -1), wide);
});

test('초점 이동: 초점이 없으면 첫 단추, 단추가 없으면 null', () => {
  assert.equal(pickNext(all, null, 1, 0), a);
  assert.equal(pickNext([], null, 1, 0), null);
  assert.equal(pickNext([a], a, 1, 0), a);
});
