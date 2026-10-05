import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { axisMap, cutTile, fitGrid, nine, tileChar } from '../art/px/slice.ts';

describe('조각 맞춤 (px/slice.ts)', () => {
  test('axisMap: 고정 조각은 그대로, 반복 조각이 늘어난 길이를 제 칸 되풀이로 채운다', () => {
    // 3 + [2 반복] + 3 → 12 칸: 가운데 6칸이 3,4,3,4,3,4
    assert.deepEqual(axisMap([3, [2, 'r'], 3], 12), [0, 1, 2, 3, 4, 3, 4, 3, 4, 5, 6, 7]);
  });

  test('axisMap: 반복 조각이 둘이면 남는 길이를 나눠 갖는다 (나머지는 앞 조각)', () => {
    assert.deepEqual(axisMap([1, [1, 'r'], 1, [1, 'r'], 1], 8), [0, 1, 1, 1, 2, 3, 3, 4]);
  });

  test('axisMap: 원래보다 작게 하면 반복 조각부터 줄이고, 그래도 크면 고정 조각 가운데를 잘라 낸다', () => {
    assert.deepEqual(axisMap([2, [3, 'r'], 2], 5), [0, 1, 2, 5, 6]);
    assert.deepEqual(axisMap([2, [3, 'r'], 2], 4), [0, 1, 5, 6]);
    assert.equal(axisMap([2, [3, 'r'], 2], 3).length, 3);
  });

  test('axisMap: 결과 길이는 늘 원하는 길이 (경곗값 0 · 1 · 원본 그대로)', () => {
    for (const n of [0, 1, 7, 30]) assert.equal(axisMap([3, [1, 'r'], 3], n).length, n);
    assert.deepEqual(axisMap([2, [1, 'r'], 2], 5), [0, 1, 2, 3, 4]);
  });

  test('fitGrid: 조각 길이 합이 격자 크기와 다르면 오류', () => {
    assert.throws(() => fitGrid(['abc'], 5, 1, [1, 1], [1]), /조각 길이/);
  });

  test('nine: 모서리 글자는 네 귀퉁이에 그대로, 변은 되풀이', () => {
    const g = ['ABC', 'DEF', 'GHI'];
    const out = nine(g, 5, 4, 1, 1, 1, 1);
    assert.deepEqual(out, ['ABBBC', 'DEEEF', 'DEEEF', 'GHHHI']);
  });

  test('tileChar · cutTile: 반복 무늬는 음수 좌표에서도 이어진다', () => {
    const g = ['ab', 'cd'];
    assert.equal(tileChar(g, -1, -1), 'd');
    assert.equal(tileChar(g, 2, 3), 'c');
    assert.deepEqual(cutTile(g, 1, 0, 3, 2), ['bab', 'dcd']);
  });
});
