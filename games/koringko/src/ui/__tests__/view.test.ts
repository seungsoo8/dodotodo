import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseView, cameraFor, worldView } from '../view.ts';

test('화면 배율: 짧은 변이 300 논리 픽셀 이상 남는 가장 큰 정수 배율', () => {
  assert.deepEqual(chooseView(1920, 1080), { scale: 3, w: 640, h: 360 });
  assert.deepEqual(chooseView(2560, 1440), { scale: 4, w: 640, h: 360 });
  assert.deepEqual(chooseView(1366, 768), { scale: 2, w: 683, h: 384 });
  // 세로 휴대폰 (390×844 @3)
  assert.deepEqual(chooseView(1170, 2532), { scale: 3, w: 390, h: 844 });
});

test('화면 배율: 아주 작은 화면도 배율 1 아래로 내려가지 않는다', () => {
  assert.deepEqual(chooseView(280, 200), { scale: 1, w: 280, h: 200 });
  assert.deepEqual(chooseView(0, 0), { scale: 1, w: 1, h: 1 });
});

test('카메라: 주인공을 가운데 두되 지도 밖은 보여주지 않는다', () => {
  // 지도 1000×600, 화면 400×300
  assert.deepEqual(cameraFor(500, 300, 1000, 600, 400, 300), { x: 300, y: 150 });
  assert.deepEqual(cameraFor(10, 10, 1000, 600, 400, 300), { x: 0, y: 0 });
  assert.deepEqual(cameraFor(990, 590, 1000, 600, 400, 300), { x: 600, y: 300 });
});

test('카메라: 지도가 화면보다 작으면 지도를 가운데 둔다', () => {
  assert.deepEqual(cameraFor(100, 100, 200, 120, 400, 300), { x: -100, y: -90 });
});

test('세계 배율: 세로 논리 픽셀이 360 안팎이 되는 정수 배율 — 1080p · 720p · 1440p 모두 360줄', () => {
  assert.deepEqual(worldView(1920, 1080, chooseView(1920, 1080)), { scale: 3, w: 640, h: 360, k: 1 });
  assert.deepEqual(worldView(1280, 720, chooseView(1280, 720)), { scale: 2, w: 640, h: 360, k: 1 });
  assert.deepEqual(worldView(2560, 1440, chooseView(2560, 1440)), { scale: 4, w: 640, h: 360, k: 1 });
  // 1366×768: 2배 → 384줄
  assert.deepEqual(worldView(1366, 768, chooseView(1366, 768)), { scale: 2, w: 683, h: 384, k: 1 });
  // 1600×900: 글자는 3배, 세계는 2배 (450줄) — 세계가 글자보다 작게 그려진다
  assert.deepEqual(worldView(1600, 900, chooseView(1600, 900)), { scale: 2, w: 800, h: 450, k: 2 / 3 });
});

test('세계 배율: 투더문처럼 어른(48줄 틀) 키가 화면 높이의 10~14%, 장난감(40줄 틀)은 8~12%', () => {
  for (const [w, h] of [[1920, 1080], [2560, 1440], [1366, 768], [1280, 720], [1600, 900], [3840, 2160]]) {
    const wv = worldView(w, h, chooseView(w, h));
    const adult = 46 / wv.h;
    const toy = 36 / wv.h;
    assert.ok(adult >= 0.1 && adult <= 0.14, `${w}x${h}: 어른 ${(adult * 100).toFixed(1)}%`);
    assert.ok(toy >= 0.08 && toy <= 0.12, `${w}x${h}: 장난감 ${(toy * 100).toFixed(1)}%`);
  }
});

test('세계 배율: 아주 작은 가로 화면도 1배 아래로 내려가지 않는다', () => {
  assert.equal(worldView(480, 270, chooseView(480, 270)).scale, 1);
});

test('세계 확대: 세로 휴대폰은 너무 좁아지지 않게 글자 배율 그대로', () => {
  const v = chooseView(1170, 2532);
  assert.deepEqual(worldView(1170, 2532, v), { scale: 3, w: 390, h: 844, k: 1 });
});
