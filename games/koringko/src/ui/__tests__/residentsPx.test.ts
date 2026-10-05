import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, rgb, type Pix } from '../art/paint.ts';
import { checkGrid, gridSize } from '../art/px/grid.ts';
import { RESIDENT_PX_KINDS, blinkGrid, breatheGrid, residentGrids, residentPxSprite } from '../art/residentsPx.ts';
import { residentSprite } from '../art/houseProps.ts';

const DIRS = ['down', 'up', 'left', 'right'] as const;
const same = (a: Pix, b: Pix) => a.w === b.w && a.h === b.h && a.px.every((v, i) => v === b.px[i]);

describe('주민 손찍기 본 (residentsPx.ts)', () => {
  test('모든 격자: 줄 폭이 같고, 글자가 모두 팔레트에 있다', () => {
    const all = residentGrids();
    assert.ok(all.length >= 30, `${all.length}`);
    for (const { name, g, pal } of all) {
      assert.doesNotThrow(() => gridSize(g), name);
      assert.deepEqual(checkGrid(g, pal), [], name);
    }
  });

  test('blinkGrid: 2줄 눈은 윗줄이 눈꺼풀이 되고 아랫줄만 선으로 남는다 (반짝 칸도 눈꺼풀)', () => {
    assert.deepEqual(blinkGrid(['SwS', 'SES', 'SSS'], 'S'), ['SSS', 'SES', 'SSS']);
    // 한 줄 눈은 그대로 (감은 선)
    assert.deepEqual(blinkGrid(['SES'], 'S'), ['SES']);
  });

  test('breatheGrid: 허리 위쪽만 한 줄 내려가고, 크기와 발 줄은 그대로', () => {
    const g = ['aa', 'bb', 'cc', 'dd'];
    const b = breatheGrid(g, 2);
    assert.deepEqual(b, ['..', 'aa', 'cc', 'dd']);
    assert.equal(b.length, g.length);
    assert.equal(b[3], g[3]);
  });

  test('주민 열 모두: 네 방향 · 두 박자가 그려지고, 박자마다 다르며, 왼쪽은 오른쪽을 뒤집은 것', () => {
    for (const k of RESIDENT_PX_KINDS) {
      for (const d of DIRS) {
        const a = residentPxSprite(k, d, 0)!;
        const b = residentPxSprite(k, d, 1)!;
        assert.ok(a.count() >= 60, `${k} ${d} ${a.count()}`);
        if (k !== 'cuckooElder' || d === 'down') assert.ok(!same(a, b), `${k} ${d} 박자가 같다`);
      }
      assert.ok(same(residentPxSprite(k, 'left', 0)!, residentPxSprite(k, 'right', 0)!.flipped()), k);
    }
    assert.equal(residentPxSprite('robot', 'down', 0), null);
  });

  test('그림 틀 테두리에 칠한 칸이 없다 (외곽선이 잘리지 않는다)', () => {
    for (const k of RESIDENT_PX_KINDS)
      for (const d of DIRS)
        for (const f of [0, 1, 2, 3]) {
          const p = residentPxSprite(k, d, f)!;
          for (let x = 0; x < p.w; x++) assert.equal(p.get(x, 0), CLEAR, `${k} ${d} ${f} 위`);
          for (let y = 0; y < p.h; y++) assert.ok(p.get(0, y) === CLEAR && p.get(p.w - 1, y) === CLEAR, `${k} ${d} ${f} 옆`);
        }
  });

  test('주민 그림은 집 그림 모음(residentSprite)으로 이어진다: 같은 그림을 돌려준다', () => {
    for (const k of RESIDENT_PX_KINDS) assert.ok(same(residentSprite(k, 'down', 0)!, residentPxSprite(k, 'down', 0)!), k);
  });

  test('주민마다 제 색: 개구리는 초록, 골무는 은빛, 빨래집게 남매는 분홍과 하늘', () => {
    const avg = (p: Pix) => {
      let r = 0, g = 0, b = 0, n = 0;
      for (const c of p.px) if (c !== CLEAR) { const [R, G, B] = rgb(c); r += R; g += G; b += B; n++; }
      return [r / n, g / n, b / n];
    };
    const [fr, fg, fb] = avg(residentPxSprite('frogBro', 'up', 0)!);
    assert.ok(fg > fr + 20 && fg > fb + 20, '개구리 초록');
    const [tr, tg, tb] = avg(residentPxSprite('thimbleMan', 'up', 0)!);
    assert.ok(Math.abs(tr - tg) < 30 && tb >= tr - 10, '골무 은빛');
    const pins = residentPxSprite('clothespins', 'down', 0)!;
    const pink = pins.px.filter((c) => c !== CLEAR && rgb(c)[0] > 200 && rgb(c)[2] < rgb(c)[0] - 30).length;
    const sky = pins.px.filter((c) => c !== CLEAR && rgb(c)[2] > 200 && rgb(c)[0] < rgb(c)[2] - 40).length;
    assert.ok(pink > 20 && sky > 20, `분홍 ${pink} 하늘 ${sky}`);
  });
});
