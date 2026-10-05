import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LIGHT_STEPS, lightLevel, lightMask } from '../render/lightBake.ts';

describe('계단 감쇠 + 2×2 디더 빛 (QUALITY C3)', () => {
  test('가운데는 가장 밝고 (1), 반지름 밖은 0', () => {
    assert.equal(lightLevel(0, 0, 0), 1);
    assert.equal(lightLevel(1.01, 3, 5), 0);
    assert.equal(lightLevel(2, 0, 0), 0);
  });

  test('값은 정해진 계단 (4단 + 0) 중 하나뿐이다 (매끈한 그라데이션이 아님)', () => {
    const allowed = new Set([...LIGHT_STEPS, 0]);
    for (let i = 0; i <= 100; i++) for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) assert.ok(allowed.has(lightLevel(i / 100, x, y)), `${i / 100}`);
    assert.equal(LIGHT_STEPS.length, 4);
  });

  test('2×2 칸 평균은 멀어질수록 줄기만 한다', () => {
    let prev = Infinity;
    for (let i = 0; i <= 110; i++) {
      const d = i / 100;
      const avg = (lightLevel(d, 0, 0) + lightLevel(d, 1, 0) + lightLevel(d, 0, 1) + lightLevel(d, 1, 1)) / 4;
      assert.ok(avg <= prev + 1e-9, `${d}: ${avg} > ${prev}`);
      prev = avg;
    }
  });

  test('계단 경계 바로 안쪽에서는 두 단이 바둑판처럼 섞인다 (디더)', () => {
    let mixed = 0;
    for (let i = 0; i <= 100; i++) {
      const vals = new Set([lightLevel(i / 100, 0, 0), lightLevel(i / 100, 1, 0), lightLevel(i / 100, 0, 1), lightLevel(i / 100, 1, 1)]);
      if (vals.size > 1) mixed++;
    }
    assert.ok(mixed >= 6, `섞인 거리 ${mixed}개`);
    assert.ok(mixed <= 40, '대부분은 한 단으로 고르다');
  });

  test('빛 가면: 지름 2r 정사각형, 가운데 1 · 모서리 0, 좌우 대칭 (디더 무늬 제외 평균)', () => {
    const r = 20;
    const m = lightMask(r);
    assert.equal(m.size, 40);
    assert.equal(m.data.length, 40 * 40);
    assert.equal(m.data[20 * 40 + 20], 1);
    assert.equal(m.data[0], 0);
    const rowSum = (y: number) => m.data.slice(y * 40, y * 40 + 40).reduce((a, b) => a + b, 0);
    assert.ok(rowSum(20) > rowSum(5), '가운데 줄이 위쪽 줄보다 밝다');
  });

  test('반지름 1 미만은 1px 로', () => {
    const m = lightMask(0.3);
    assert.equal(m.size, 2);
  });
});
