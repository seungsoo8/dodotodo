import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { HEROES } from '../../core/heroes.ts';
import { PORTRAITS, PORTRAIT_SIZE, mirrorRows, portraitFor } from '../portraits.ts';

describe('수호자 초상화', () => {
  test('반쪽 그림을 좌우로 뒤집어 붙인다', () => {
    assert.deepEqual(mirrorRows(['ab.', 'c..']), ['ab..ba', 'c....c']);
  });

  test('반쪽 줄 길이가 다르면 알려 준다', () => {
    assert.throws(() => mirrorRows(['ab', 'abc']), /2번 줄/);
  });

  test('다섯 수호자와 별(서막·마지막 이야기) 초상화가 모두 16×16 이고 좌우 대칭이다', () => {
    for (const id of [...HEROES.map((h) => h.id), 'star'] as const) {
      const p = PORTRAITS[id];
      assert.ok(p, id);
      assert.equal(p.width, PORTRAIT_SIZE, `${id} 폭`);
      assert.equal(p.height, PORTRAIT_SIZE, `${id} 높이`);
      assert.ok(p.pixels.length > 60, `${id} 비어 있지 않다`);
      const at = new Map(p.pixels.map((px) => [`${px.x},${px.y}`, px.color]));
      for (const px of p.pixels) assert.equal(at.get(`${PORTRAIT_SIZE - 1 - px.x},${px.y}`), px.color, `${id} (${px.x},${px.y}) 대칭`);
    }
  });

  test('수호자마다 탑 색이 들어가 서로 다르게 보인다', () => {
    for (const h of HEROES) {
      assert.ok(PORTRAITS[h.id].pixels.some((px) => px.color === h.color), `${h.id} 에 ${h.color}`);
    }
    const sigs = HEROES.map((h) => JSON.stringify(PORTRAITS[h.id].pixels));
    assert.equal(new Set(sigs).size, HEROES.length);
  });

  test('이야기 쪽에 맞는 초상화: 탑 쪽은 그 수호자, 서막·마지막은 별', () => {
    assert.equal(portraitFor('mage'), PORTRAITS.mage);
    assert.equal(portraitFor(null), PORTRAITS.star);
  });
});
