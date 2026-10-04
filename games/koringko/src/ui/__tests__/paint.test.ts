import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, Pix, hex, mix, ramp, shade, toHex } from '../art/paint.ts';

describe('도트 붓', () => {
  test('색 바꾸기: 밝게 · 어둡게 · 섞기', () => {
    const c = hex('#808080');
    assert.equal(toHex(c), '#808080');
    assert.ok(shade(c, 0.5) > c);
    assert.ok((shade(c, -0.5) & 0xff0000) < (c & 0xff0000));
    assert.equal(mix(hex('#000000'), hex('#ffffff'), 0.5), hex('#808080'));
    const r = ramp(c);
    assert.equal(r[2], c);
    assert.ok(r[0] !== r[4]);
  });

  test('공은 타원 안만 칠하고, 왼쪽 위가 오른쪽 아래보다 밝다', () => {
    const p = new Pix(21, 21).ball(10.5, 10.5, 8, 8, hex('#3080ff'));
    assert.equal(p.get(0, 0), CLEAR);
    assert.notEqual(p.get(10, 10), CLEAR);
    const lum = (c: number) => ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255);
    assert.ok(lum(p.get(7, 7)) > lum(p.get(14, 14)));
    assert.ok(p.count() > 150 && p.count() < 220);
  });

  test('외곽선은 그림을 한 칸 둘러싼다', () => {
    const p = new Pix(7, 7).rect(2, 2, 3, 3, hex('#ff0000'));
    p.outline();
    assert.equal(p.count(), 9 + 12);
    assert.notEqual(p.get(1, 3), CLEAR);
    assert.equal(p.get(1, 1), CLEAR, '모서리 대각선은 비운다');
  });

  test('삼각형 · 선 · 뒤집기', () => {
    const p = new Pix(10, 10).tri(0, 0, 9, 0, 0, 9, hex('#00ff00'));
    assert.notEqual(p.get(1, 1), CLEAR);
    assert.equal(p.get(8, 8), CLEAR);
    const f = p.flipped();
    assert.notEqual(f.get(8, 1), CLEAR);
    const l = new Pix(5, 5).line(0, 0, 4, 4, 1);
    assert.equal(l.count(), 5);
  });

  test('공의 명암은 깔끔한 덩어리다: 이웃 넷과 모두 색이 다른 외톨이 점(바둑판 디더)이 거의 없다', () => {
    for (const [rx, ry] of [[8, 8], [12, 9], [5, 4]]) {
      const p = new Pix(30, 24).ball(15, 12, rx, ry, hex('#d07040'));
      let lone = 0;
      for (let y = 1; y < p.h - 1; y++)
        for (let x = 1; x < p.w - 1; x++) {
          const c = p.get(x, y);
          if (c === CLEAR) continue;
          const n = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)];
          if (n.every((v) => v !== c && v !== CLEAR)) lone++;
        }
      assert.ok(lone <= p.count() * 0.02, `${rx}x${ry}: 외톨이 ${lone} / ${p.count()}`);
    }
  });
});

