import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseView, cameraFor } from '../view.ts';

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
