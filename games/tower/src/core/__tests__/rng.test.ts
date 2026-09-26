import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../rng.ts';

describe('시드 난수', () => {
  test('같은 시드는 같은 수열을 만든다', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    assert.deepEqual(seqA, seqB);
  });

  test('다른 시드는 다른 수열을 만든다', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    assert.notDeepEqual(seqA, seqB);
  });

  test('next 는 [0,1), int(n) 은 0 이상 n 미만 정수, range 는 [min,max)', () => {
    const r = createRng(7);
    for (let i = 0; i < 2000; i++) {
      const x = r.next();
      assert.ok(x >= 0 && x < 1, `next 범위 벗어남: ${x}`);
      const n = r.int(4);
      assert.ok(Number.isInteger(n) && n >= 0 && n < 4, `int 범위 벗어남: ${n}`);
      const y = r.range(0.5, 2);
      assert.ok(y >= 0.5 && y < 2, `range 범위 벗어남: ${y}`);
    }
  });

  test('int(4) 는 0~3 을 모두 낸다', () => {
    const r = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(r.int(4));
    assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
  });
});
