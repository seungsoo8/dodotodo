import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { reveal, TITLE_FADE } from '../adv/titleScene.ts';

describe('타이틀이 나타나는 차례', () => {
  test('하늘 → 집 → 제목 → 고르기 순서로, 앞 단계가 먼저 나타난다', () => {
    const order = [TITLE_FADE.sky, TITLE_FADE.house, TITLE_FADE.title, TITLE_FADE.menu];
    for (let i = 1; i < order.length; i++) assert.ok(order[i - 1] < order[i]);
  });
  test('한 단계는 1초 동안 0 → 1, 그 전엔 0, 그 뒤엔 1', () => {
    assert.equal(reveal(0, 1.2), 0);
    assert.equal(reveal(1.7, 1.2), 0.5);
    assert.equal(reveal(5, 1.2), 1);
  });
});
