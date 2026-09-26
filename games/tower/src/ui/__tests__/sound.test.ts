import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Throttle } from '../throttle.ts';

describe('효과음 과다 재생 방지', () => {
  test('같은 소리는 최소 간격 안에 다시 울리지 않는다', () => {
    const t = new Throttle(0.05);
    assert.equal(t.allow('shot', 1.0), true);
    assert.equal(t.allow('shot', 1.02), false);
    assert.equal(t.allow('shot', 1.049), false);
    assert.equal(t.allow('shot', 1.05), true);
  });

  test('다른 소리는 서로 막지 않는다', () => {
    const t = new Throttle(0.05);
    assert.equal(t.allow('shot', 1.0), true);
    assert.equal(t.allow('kill', 1.0), true);
  });

  test('소리마다 간격을 따로 정할 수 있다', () => {
    const t = new Throttle(0.05, { towerHit: 0.2 });
    assert.equal(t.allow('towerHit', 0), true);
    assert.equal(t.allow('towerHit', 0.1), false);
    assert.equal(t.allow('towerHit', 0.2), true);
  });

  test('막힌 요청은 마지막 재생 시각을 바꾸지 않는다', () => {
    const t = new Throttle(0.1);
    t.allow('a', 0);
    t.allow('a', 0.05); // 막힘
    assert.equal(t.allow('a', 0.1), true);
  });
});
