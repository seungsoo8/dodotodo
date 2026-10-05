import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Ui } from '../kit.ts';

/** drawImage 만 기록하는 가짜 붓 (화면 배율 scale) */
function fakeCtx(scale: number) {
  const calls: number[][] = [];
  const ctx = {
    imageSmoothingEnabled: true,
    getTransform: () => ({ a: scale }),
    drawImage: (_im: unknown, x: number, y: number, w: number, h: number) => calls.push([x, y, w, h]),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const IMG = { width: 26, height: 40 } as unknown as CanvasImageSource;

test('도트 그림 키우기: 그림 한 점이 화면 픽셀 정수 칸이 되게 맞춘다 (1.5배처럼 고르지 않은 점이 생기지 않게)', () => {
  for (const scale of [1, 2, 3, 4]) {
    for (const [w, h] of [[39, 60], [30, 46], [52, 80], [41.6, 64]]) {
      const { ctx, calls } = fakeCtx(scale);
      const ui = new Ui();
      ui.begin(ctx, 640, 360, 0);
      ui.img(IMG, 100.3, 50.7, w, h);
      const [x, y, dw, dh] = calls[0];
      const px = (dw / 26) * scale;
      assert.ok(Math.abs(px - Math.round(px)) < 1e-6, `배율 ${scale}, ${w}×${h} → 한 점 ${px} 픽셀`);
      assert.ok(Math.abs(dh / 40 - dw / 26) < 1e-6, '가로세로 같은 배율');
      assert.ok(dw <= w + 1e-6 && dh <= h + 1e-6, '맡긴 칸보다 커지지 않는다');
      assert.ok(Number.isInteger(Math.round(x * scale * 1e6) / 1e6) && Number.isInteger(Math.round(y * scale * 1e6) / 1e6), '화면 픽셀 칸에 맞춘 자리');
    }
  }
});

test('도트 그림 키우기: 원래 크기 그대로면 그대로 그린다', () => {
  const { ctx, calls } = fakeCtx(2);
  const ui = new Ui();
  ui.begin(ctx, 640, 360, 0);
  ui.img(IMG, 10, 20, 26, 40);
  assert.deepEqual(calls[0], [10, 20, 26, 40]);
});

test('도트 그림 줄이기(작은 아이콘 칸)는 맡긴 크기 그대로 (점을 빼먹어 더 작아지지 않게)', () => {
  const { ctx, calls } = fakeCtx(2);
  const ui = new Ui();
  ui.begin(ctx, 640, 360, 0);
  ui.img({ width: 16, height: 16 } as unknown as CanvasImageSource, 10, 20, 11, 11);
  assert.deepEqual(calls[0].slice(2), [11, 11]);
});
