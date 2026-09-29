import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { PAN_WIDTH, facePan, heartbeatInterval, panForX } from '../mix.ts';

describe('방향 소리', () => {
  test('가운데는 0, 왼쪽 끝은 -, 오른쪽 끝은 +, 화면 밖이어도 넘치지 않는다', () => {
    assert.equal(panForX(320, 640), 0);
    assert.ok(Math.abs(panForX(0, 640) + PAN_WIDTH) < 1e-9);
    assert.ok(Math.abs(panForX(640, 640) - PAN_WIDTH) < 1e-9);
    assert.ok(Math.abs(panForX(-500, 640)) <= PAN_WIDTH + 1e-9);
    assert.ok(Math.abs(panForX(2000, 640)) <= PAN_WIDTH + 1e-9);
    assert.ok(PAN_WIDTH > 0 && PAN_WIDTH < 1, '완전히 한쪽으로만 들리지는 않게');
  });

  test('면: 서쪽은 왼쪽, 동쪽은 오른쪽, 북·남은 가운데', () => {
    assert.ok(facePan('w') < 0);
    assert.ok(facePan('e') > 0);
    assert.equal(facePan('n'), 0);
    assert.equal(facePan('s'), 0);
  });
});

describe('체력이 낮을 때 심장 박동', () => {
  test('30% 이상이면 없음, 그 아래는 낮을수록 빨라진다', () => {
    assert.equal(heartbeatInterval(0.3), null);
    assert.equal(heartbeatInterval(0.9), null);
    const a = heartbeatInterval(0.29)!;
    const b = heartbeatInterval(0.05)!;
    assert.ok(a > b, `${a} > ${b}`);
    assert.ok(b >= 0.4 && a <= 1.1);
    assert.equal(heartbeatInterval(0), null, '무너졌으면 뛰지 않는다');
  });
});
