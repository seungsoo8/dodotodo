import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { wornCells } from '../render/wornPath.ts';

const map = (rows: string[]) => ({ tiles: rows, w: rows[0].length, h: rows.length });

describe('사람이 다니던 길 (덜 바랜 마루 줄)', () => {
  test('출발점에서 목적지까지 가장 짧은 길의 칸이 이어져 있다', () => {
    const m = map(['WWWWWWW', 'X.....X', 'X.....X', 'X.....X', 'XXXXXXX']);
    const c = wornCells(m, [1, 2], [[5, 2]]);
    for (let x = 1; x <= 5; x++) assert.ok(c.has(`${x},2`), `${x},2`);
    assert.equal(c.size, 5);
  });

  test('벽 · 막힌 칸(H)은 지나지 않고 돌아간다', () => {
    const m = map(['WWWWWWW', 'X.....X', 'X..H..X', 'X.....X', 'XXXXXXX']);
    const c = wornCells(m, [1, 2], [[5, 2]]);
    assert.ok(!c.has('3,2'));
    assert.ok(c.has('3,1') || c.has('3,3'));
    for (const k of c) {
      const [x, y] = k.split(',').map(Number);
      assert.ok(!'WXHU'.includes(m.tiles[y][x]), k);
    }
  });

  test('여러 목적지는 길을 함께 쓴다 (칸 수 ≤ 각 길 합)', () => {
    const m = map(['WWWWWWWWW', 'X.......X', 'X.......X', 'X.......X', 'XXXXXXXXX']);
    const c = wornCells(m, [1, 2], [[7, 1], [7, 3]]);
    assert.ok(c.size < 7 + 7 + 2);
    assert.ok(c.has('7,1') && c.has('7,3'));
  });

  test('닿을 수 없는 목적지는 무시하고, 목적지가 없으면 빈 집합', () => {
    const m = map(['WWWWW', 'X.H.X', 'X.H.X', 'XXXXX']);
    assert.equal(wornCells(m, [1, 1], [[3, 1]]).size, 0);
    assert.equal(wornCells(m, [1, 1], []).size, 0);
  });
});
