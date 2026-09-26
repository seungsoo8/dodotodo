import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../core/rng.ts';
import { easeOutBack, easeOutCubic, formatNumber, lerp, lightningPath, projectilePos, shakeOffset, vignetteAlpha } from '../fx.ts';
import { skyAt } from '../fx.ts';

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('보간과 이징', () => {
  test('lerp: 0 이면 시작, 1 이면 끝, 0.25 면 1/4 지점', () => {
    assert.equal(lerp(10, 20, 0), 10);
    assert.equal(lerp(10, 20, 1), 20);
    assert.equal(lerp(10, 20, 0.25), 12.5);
  });

  test('easeOutCubic: 0→0, 1→1, 처음에 빠르게 (0.5 에서 이미 0.875)', () => {
    assert.equal(easeOutCubic(0), 0);
    assert.equal(easeOutCubic(1), 1);
    assert.ok(close(easeOutCubic(0.5), 0.875));
  });

  test('easeOutBack: 0→0, 1→1, 중간에 1 을 살짝 넘었다 돌아온다 (튕기는 느낌)', () => {
    assert.ok(close(easeOutBack(0), 0));
    assert.ok(close(easeOutBack(1), 1));
    assert.ok(easeOutBack(0.7) > 1);
  });

  test('범위 밖 값은 0~1 로 자른다', () => {
    assert.equal(easeOutCubic(-1), 0);
    assert.equal(easeOutCubic(2), 1);
  });
});

describe('화면 흔들림', () => {
  test('흔들림 폭은 시간이 지날수록 줄어들고, 끝나면 0 이다', () => {
    for (let i = 0; i < 50; i++) {
      const t = i / 50;
      const o = shakeOffset(8, t * 0.4, 0.4, i);
      const limit = 8 * (1 - t) + 1e-9;
      assert.ok(Math.abs(o.x) <= limit && Math.abs(o.y) <= limit, `t=${t}: ${o.x},${o.y}`);
    }
    assert.deepEqual(shakeOffset(8, 0.4, 0.4, 3), { x: 0, y: 0 });
    assert.deepEqual(shakeOffset(8, 1, 0.4, 3), { x: 0, y: 0 });
  });

  test('시작 직후에는 실제로 흔들린다 (0 이 아님)', () => {
    let moved = false;
    for (let i = 0; i < 10; i++) {
      const o = shakeOffset(8, 0.01, 0.4, i);
      if (o.x !== 0 || o.y !== 0) moved = true;
    }
    assert.ok(moved);
  });
});

describe('번개 경로', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 0 };

  test('시작점에서 끝점까지 (마디 수 + 1)개 점으로 이어진다', () => {
    const pts = lightningPath(from, to, 5, 6, createRng(1));
    assert.equal(pts.length, 6);
    assert.deepEqual(pts[0], from);
    assert.deepEqual(pts[5], to);
  });

  test('중간 점은 직선에서 옆으로 흔들리되 흔들림 한계를 넘지 않고, 앞으로 고르게 나아간다', () => {
    const pts = lightningPath(from, to, 5, 6, createRng(2));
    for (let i = 1; i < 5; i++) {
      assert.ok(close(pts[i].x, i * 20), `x 가 고르게 나아가야 함: ${pts[i].x}`);
      assert.ok(Math.abs(pts[i].y) <= 6);
    }
    assert.ok(pts.slice(1, 5).some((p) => p.y !== 0), '실제로 지그재그여야 함');
  });

  test('비스듬한 선에서도 흔들림은 선에 수직 방향이다', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 30, y: 40 };
    const pts = lightningPath(a, b, 4, 5, createRng(3));
    for (let i = 1; i < 4; i++) {
      const along = (pts[i].x * 30 + pts[i].y * 40) / 50;
      assert.ok(close(along, (50 * i) / 4, 1e-6), '진행 방향 성분은 고르게');
    }
  });
});

describe('투사체 위치', () => {
  const from = { x: 0, y: 100 };
  const to = { x: 100, y: 100 };

  test('진행도 0 이면 출발점, 1 이면 도착점', () => {
    assert.deepEqual(projectilePos(from, to, 0, 20), from);
    assert.deepEqual(projectilePos(from, to, 1, 20), to);
  });

  test('곡사 높이만큼 중간에서 가장 높이 뜬다 (위쪽이 y 감소)', () => {
    const mid = projectilePos(from, to, 0.5, 20);
    assert.ok(close(mid.x, 50));
    assert.ok(close(mid.y, 80));
  });

  test('곡사 높이 0 이면 직선', () => {
    assert.deepEqual(projectilePos(from, to, 0.3, 0), { x: 30, y: 100 });
  });

  test('진행도는 0~1 로 자른다', () => {
    assert.deepEqual(projectilePos(from, to, 1.5, 20), to);
  });
});

describe('숫자 짧게 쓰기', () => {
  test('1000 미만은 정수, 천 단위는 k, 백만 단위는 M (소수 한 자리, .0 생략)', () => {
    assert.equal(formatNumber(0), '0');
    assert.equal(formatNumber(999.4), '999');
    assert.equal(formatNumber(999.6), '1k', '반올림해서 1000 이 되면 k 로');
    assert.equal(formatNumber(1000), '1k');
    assert.equal(formatNumber(12345), '12.3k');
    assert.equal(formatNumber(2_500_000), '2.5M');
    assert.equal(formatNumber(3_000_000), '3M');
  });
});

describe('저체력 붉은 테두리', () => {
  test('체력 35% 이상이면 없고, 0 에 가까울수록 진해져 최대 0.5', () => {
    assert.equal(vignetteAlpha(1), 0);
    assert.equal(vignetteAlpha(0.35), 0);
    assert.ok(vignetteAlpha(0.2) > 0 && vignetteAlpha(0.2) < 0.5);
    assert.equal(vignetteAlpha(0), 0.5);
    assert.ok(vignetteAlpha(0.1) > vignetteAlpha(0.2));
  });
});

describe('하늘 (라운드에 따라 낮 → 노을 → 밤)', () => {
  const at = (round: number, t = 0, mode: 'classic' | 'endless' = 'classic') => skyAt({ round, roundTime: t, roundSeconds: 20, totalRounds: 15, mode });

  test('1라운드는 한낮 (밤 0, 노을 0)', () => {
    const s = at(1);
    assert.equal(s.night, 0);
    assert.equal(s.dusk, 0);
  });

  test('마지막 라운드는 밤 (밤 1)', () => {
    assert.equal(at(15).night, 1);
  });

  test('중간쯤에는 노을이 진다', () => {
    const s = at(10);
    assert.ok(s.dusk > 0.5, `노을 ${s.dusk}`);
  });

  test('밤은 라운드가 갈수록 줄지 않고, 라운드가 바뀌는 순간 튀지 않는다', () => {
    let prev = 0;
    for (let r = 1; r <= 15; r++) {
      for (let t = 0; t < 20; t += 2) {
        const n = at(r, t).night;
        assert.ok(n >= prev - 1e-9, `R${r} ${t}초`);
        prev = n;
      }
    }
    assert.ok(Math.abs(at(7, 19.999).night - at(8, 0).night) < 0.01);
  });

  test('값은 모두 0~1 이다', () => {
    for (let r = 1; r <= 40; r++) {
      const s = at(r, 5, 'endless');
      for (const v of [s.night, s.dusk]) assert.ok(v >= 0 && v <= 1);
    }
  });

  test('무한 모드는 15라운드마다 다시 아침이 온다', () => {
    assert.equal(at(16, 0, 'endless').night, at(1, 0, 'endless').night);
    assert.equal(at(25, 3, 'endless').dusk, at(10, 3, 'endless').dusk);
    assert.equal(at(15, 0, 'endless').night, 1);
  });

  test('클래식에서 마지막 라운드를 넘어도 밤이 유지된다', () => {
    assert.equal(at(15, 19).night, 1);
  });
});
