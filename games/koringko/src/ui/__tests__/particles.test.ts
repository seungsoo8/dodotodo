import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ParticlePool, PARTICLE_MAX, weatherOf, weatherRate } from '../render/particles.ts';

describe('파티클 풀', () => {
  test('비어 있는 풀에 하나를 내보내면 살아 있는 것이 1개, 자리 · 속도가 그대로', () => {
    const p = new ParticlePool();
    assert.equal(p.alive(), 0);
    p.emit('dust', 10, 20, 1, -2, 1);
    assert.equal(p.alive(), 1);
    const [q] = p.list();
    assert.deepEqual([q.kind, q.x, q.y, q.vx, q.vy], ['dust', 10, 20, 1, -2]);
  });

  test('수명이 다하면 사라진다 (수명 0.5초: 0.4초 뒤 살아 있고, 0.6초 뒤 없다)', () => {
    const p = new ParticlePool();
    p.emit('sparkle', 0, 0, 0, 0, 0.5);
    p.step(0.4);
    assert.equal(p.alive(), 1);
    p.step(0.2);
    assert.equal(p.alive(), 0);
  });

  test(`풀은 최대 ${PARTICLE_MAX}개: 넘치면 가장 오래된 것을 다시 쓴다`, () => {
    const p = new ParticlePool();
    for (let i = 0; i < PARTICLE_MAX + 30; i++) p.emit('dust', i, 0, 0, 0, 10);
    assert.equal(p.alive(), PARTICLE_MAX);
    const xs = p.list().map((q) => q.x);
    assert.ok(!xs.includes(0) && !xs.includes(29), '가장 오래된 30개가 밀려났다');
    assert.ok(xs.includes(PARTICLE_MAX + 29), '가장 새것은 남았다');
  });

  test('작은 최대값 (3개) 도 지킨다', () => {
    const p = new ParticlePool(3);
    for (let i = 0; i < 5; i++) p.emit('snow', i, 0, 0, 0, 10);
    assert.deepEqual(p.list().map((q) => q.x).sort(), [2, 3, 4]);
  });

  test('물방울 · 빗물은 중력으로 빨라지고, 눈은 천천히 일정하게 떨어진다', () => {
    const p = new ParticlePool();
    p.emit('drip', 0, 0, 0, 0, 5);
    p.emit('snow', 0, 0, 0, 12, 5);
    p.step(0.5);
    const [drip, snow] = p.list();
    assert.ok(drip.vy > 100, `drip vy ${drip.vy}`);
    assert.ok(drip.y > 20, `drip y ${drip.y}`);
    assert.ok(Math.abs(snow.vy - 12) < 0.01, `snow vy ${snow.vy}`);
    assert.ok(Math.abs(snow.y - 6) < 0.5, `snow y ${snow.y}`);
  });

  test('바닥(floor y)에 닿은 물방울은 튀는 물(splash)로 바뀌고, 눈은 그 자리에서 사라진다', () => {
    const p = new ParticlePool();
    p.emit('drip', 5, 0, 0, 0, 5, 10);
    p.emit('snow', 50, 0, 0, 40, 5, 10);
    for (let i = 0; i < 20; i++) p.step(0.05);
    const kinds = p.list().map((q) => q.kind);
    assert.ok(!kinds.includes('drip'), `${kinds}`);
    assert.ok(!kinds.includes('snow'), `${kinds}`);
    assert.ok(kinds.includes('splash') || p.splashes > 0, '튀는 물이 생겼다');
    assert.ok(p.splashes >= 1);
  });

  test('김(steam) 은 위로 오르며 옅어진다 (fade 는 수명에 따라 1 → 0)', () => {
    const p = new ParticlePool();
    p.emit('steam', 0, 0, 0, -8, 2);
    const a0 = p.list()[0].fade();
    p.step(1);
    const q = p.list()[0];
    assert.ok(q.y < 0);
    assert.ok(q.fade() < a0 && q.fade() > 0, `${a0} → ${q.fade()}`);
  });

  test('빛 속 먼지(mote) 와 물결(ripple) 은 떨어지지 않는다 (중력 없음)', () => {
    const p = new ParticlePool();
    p.emit('mote', 0, 0, 0, 1, 5);
    p.emit('ripple', 10, 10, 0, 0, 1.05);
    p.step(1);
    const [m, r] = p.list();
    assert.ok(Math.abs(m.y - 1) < 0.01 && Math.abs(m.vy - 1) < 0.01, `mote ${m.y}`);
    assert.deepEqual([r.x, r.y], [10, 10]);
    p.step(0.1);
    assert.equal(p.list().filter((q) => q.kind === 'ripple').length, 0, '물결은 수명이 다하면 사라진다');
  });

  test('clear 는 모두 지운다', () => {
    const p = new ParticlePool();
    for (let i = 0; i < 10; i++) p.emit('dust', 0, 0, 0, 0, 1);
    p.clear();
    assert.equal(p.alive(), 0);
  });
});

describe('날씨', () => {
  test('room.weather 가 먼저, 없으면 rain:true = 비, 아무것도 없으면 null', () => {
    assert.equal(weatherOf({ weather: 'snow' }), 'snow');
    assert.equal(weatherOf({ rain: true }), 'rain');
    assert.equal(weatherOf({ weather: 'drizzle', rain: true }), 'drizzle');
    assert.equal(weatherOf({}), null);
    assert.equal(weatherOf(null), null);
  });

  test('창밖 날씨: window:rain · window:snow 가구가 있으면 그 날씨 (안쪽 방)', () => {
    assert.equal(weatherOf({ furniture: [{ kind: 'window:snow' }] }), 'snow');
    assert.equal(weatherOf({ furniture: [{ kind: 'window:rain' }] }), 'rain');
    assert.equal(weatherOf({ furniture: [{ kind: 'window:night' }] }), null);
  });

  test('화면 넓이에 비례해 초당 내보내는 수: 비 > 이슬비 > 0, 눈은 비보다 적다, 넓이 0 이면 0', () => {
    const A = 427 * 240;
    assert.ok(weatherRate('rain', A) > weatherRate('drizzle', A));
    assert.ok(weatherRate('drizzle', A) > 0);
    assert.ok(weatherRate('snow', A) > 0 && weatherRate('snow', A) < weatherRate('rain', A));
    assert.equal(weatherRate('rain', 0), 0);
    assert.ok(Math.abs(weatherRate('rain', A * 2) - 2 * weatherRate('rain', A)) < 1e-9);
  });
});
